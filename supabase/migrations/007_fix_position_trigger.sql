-- ============================================================
-- Fix position trigger to handle short positions correctly
-- Logic: direction-aware weighted average cost
-- ============================================================
CREATE OR REPLACE FUNCTION update_position_on_trade()
RETURNS TRIGGER AS $$
DECLARE
  ex_qty DECIMAL(18,6) := 0;
  ex_avg_local DECIMAL(18,6) := 0;
  ex_avg_eur DECIMAL(18,6) := 0;
  ex_avg_fx DECIMAL(18,8) := 0;
  ex_total_cost DECIMAL(18,2) := 0;
  ex_rpnl DECIMAL(18,2) := 0;
  ex_first_date DATE;
  trade_signed_qty DECIMAL(18,6);
  trade_price_eur DECIMAL(18,6);
  new_qty DECIMAL(18,6);
  new_avg_local DECIMAL(18,6);
  new_avg_eur DECIMAL(18,6);
  new_avg_fx DECIMAL(18,8);
  new_total_cost DECIMAL(18,2);
  rpnl DECIMAL(18,2) := 0;
  is_increasing BOOLEAN;
BEGIN
  -- Get existing position
  SELECT quantity, avg_cost_local, avg_cost_eur, avg_fx_rate, total_cost_eur,
         realized_pnl_eur, first_trade_date
  INTO ex_qty, ex_avg_local, ex_avg_eur, ex_avg_fx, ex_total_cost,
       ex_rpnl, ex_first_date
  FROM positions
  WHERE asset_id = NEW.asset_id;

  IF NOT FOUND THEN
    ex_qty := 0; ex_avg_local := 0; ex_avg_eur := 0;
    ex_avg_fx := 0; ex_total_cost := 0; ex_rpnl := 0;
    ex_first_date := NEW.trade_date;
  END IF;

  -- Convert trade to signed quantity: BUY/COVER = +qty, SELL/SHORT = -qty
  IF NEW.side IN ('BUY', 'COVER') THEN
    trade_signed_qty := NEW.quantity;
  ELSE
    trade_signed_qty := -NEW.quantity;
  END IF;

  -- Trade price in EUR
  trade_price_eur := CASE
    WHEN NEW.fx_rate_to_eur > 0 THEN NEW.price / NEW.fx_rate_to_eur
    ELSE NEW.price
  END;

  new_qty := ex_qty + trade_signed_qty;

  -- Determine if this trade increases or reduces/flips the position
  -- Increasing: same direction as existing, or opening from flat
  is_increasing := (ex_qty = 0)
    OR (ex_qty > 0 AND trade_signed_qty > 0)
    OR (ex_qty < 0 AND trade_signed_qty < 0);

  IF is_increasing THEN
    -- Adding to position (or opening new): weighted average cost
    IF new_qty != 0 THEN
      new_total_cost := ex_total_cost + ABS(NEW.gross_amount_eur);
      new_avg_local := (ex_avg_local * ABS(ex_qty) + NEW.price * ABS(trade_signed_qty)) / ABS(new_qty);
      new_avg_eur := new_total_cost / ABS(new_qty);
      new_avg_fx := (ex_avg_fx * ABS(ex_qty) + NEW.fx_rate_to_eur * ABS(trade_signed_qty)) / ABS(new_qty);
    ELSE
      new_total_cost := 0; new_avg_local := 0; new_avg_eur := 0; new_avg_fx := 0;
    END IF;
    rpnl := 0;

  ELSE
    -- Reducing or flipping position
    -- Calculate realized P&L on the closed portion
    DECLARE
      closed_qty DECIMAL(18,6);
      remaining_new_qty DECIMAL(18,6);
    BEGIN
      -- How many units are being closed vs flipping
      IF ABS(trade_signed_qty) <= ABS(ex_qty) THEN
        -- Partial or full close, no flip
        closed_qty := ABS(trade_signed_qty);
        remaining_new_qty := 0;
      ELSE
        -- Full close + flip to opposite side
        closed_qty := ABS(ex_qty);
        remaining_new_qty := ABS(trade_signed_qty) - ABS(ex_qty);
      END IF;

      -- Realized P&L: for longs, (sell_price - avg_cost) * qty
      -- For shorts, (avg_cost - buy_price) * qty
      IF ex_qty > 0 THEN
        rpnl := (trade_price_eur - ex_avg_eur) * closed_qty;
      ELSE
        rpnl := (ex_avg_eur - trade_price_eur) * closed_qty;
      END IF;

      IF new_qty = 0 THEN
        -- Fully closed
        new_avg_local := 0; new_avg_eur := 0; new_avg_fx := 0; new_total_cost := 0;
      ELSIF SIGN(new_qty) = SIGN(ex_qty) THEN
        -- Partial close, same direction remains
        new_avg_local := ex_avg_local;
        new_avg_eur := ex_avg_eur;
        new_avg_fx := ex_avg_fx;
        new_total_cost := ex_avg_eur * ABS(new_qty);
      ELSE
        -- Flipped direction: the remaining portion uses the new trade's price
        new_avg_local := NEW.price;
        new_avg_eur := trade_price_eur;
        new_avg_fx := NEW.fx_rate_to_eur;
        new_total_cost := trade_price_eur * remaining_new_qty;
      END IF;
    END;
  END IF;

  -- Upsert position
  INSERT INTO positions (
    asset_id, quantity, avg_cost_local, avg_cost_eur, avg_fx_rate,
    total_cost_eur, first_trade_date, last_trade_date,
    realized_pnl_local, realized_pnl_eur, updated_at
  ) VALUES (
    NEW.asset_id, new_qty, new_avg_local, new_avg_eur, new_avg_fx,
    new_total_cost, NEW.trade_date, NEW.trade_date,
    0, rpnl, now()
  )
  ON CONFLICT (asset_id) DO UPDATE SET
    quantity = EXCLUDED.quantity,
    avg_cost_local = EXCLUDED.avg_cost_local,
    avg_cost_eur = EXCLUDED.avg_cost_eur,
    avg_fx_rate = EXCLUDED.avg_fx_rate,
    total_cost_eur = EXCLUDED.total_cost_eur,
    last_trade_date = EXCLUDED.last_trade_date,
    realized_pnl_eur = positions.realized_pnl_eur + EXCLUDED.realized_pnl_eur,
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the trigger (function was replaced in-place)
DROP TRIGGER IF EXISTS trg_position_on_trade ON trades;
CREATE TRIGGER trg_position_on_trade
  AFTER INSERT ON trades
  FOR EACH ROW
  EXECUTE FUNCTION update_position_on_trade();

-- ============================================================
-- Re-backfill positions from all trades
-- ============================================================
DO $$
DECLARE
  t RECORD;
  ex_qty DECIMAL(18,6);
  ex_avg_local DECIMAL(18,6);
  ex_avg_eur DECIMAL(18,6);
  ex_avg_fx DECIMAL(18,8);
  ex_total_cost DECIMAL(18,2);
  ex_rpnl DECIMAL(18,2);
  trade_signed_qty DECIMAL(18,6);
  trade_price_eur DECIMAL(18,6);
  new_qty DECIMAL(18,6);
  new_avg_local DECIMAL(18,6);
  new_avg_eur DECIMAL(18,6);
  new_avg_fx DECIMAL(18,8);
  new_total_cost DECIMAL(18,2);
  rpnl DECIMAL(18,2);
  is_increasing BOOLEAN;
  closed_qty DECIMAL(18,6);
  remaining_new_qty DECIMAL(18,6);
BEGIN
  DELETE FROM positions;

  FOR t IN SELECT * FROM trades ORDER BY trade_date ASC, created_at ASC
  LOOP
    -- Get existing position
    SELECT quantity, avg_cost_local, avg_cost_eur, avg_fx_rate, total_cost_eur, realized_pnl_eur
    INTO ex_qty, ex_avg_local, ex_avg_eur, ex_avg_fx, ex_total_cost, ex_rpnl
    FROM positions WHERE asset_id = t.asset_id;

    IF NOT FOUND THEN
      ex_qty := 0; ex_avg_local := 0; ex_avg_eur := 0;
      ex_avg_fx := 0; ex_total_cost := 0; ex_rpnl := 0;
    END IF;

    IF t.side IN ('BUY', 'COVER') THEN
      trade_signed_qty := t.quantity;
    ELSE
      trade_signed_qty := -t.quantity;
    END IF;

    trade_price_eur := CASE
      WHEN t.fx_rate_to_eur > 0 THEN t.price / t.fx_rate_to_eur
      ELSE t.price
    END;

    new_qty := ex_qty + trade_signed_qty;
    rpnl := 0;

    is_increasing := (ex_qty = 0)
      OR (ex_qty > 0 AND trade_signed_qty > 0)
      OR (ex_qty < 0 AND trade_signed_qty < 0);

    IF is_increasing THEN
      IF new_qty != 0 THEN
        new_total_cost := ex_total_cost + ABS(t.gross_amount_eur);
        new_avg_local := (ex_avg_local * ABS(ex_qty) + t.price * ABS(trade_signed_qty)) / ABS(new_qty);
        new_avg_eur := new_total_cost / ABS(new_qty);
        new_avg_fx := (ex_avg_fx * ABS(ex_qty) + t.fx_rate_to_eur * ABS(trade_signed_qty)) / ABS(new_qty);
      ELSE
        new_total_cost := 0; new_avg_local := 0; new_avg_eur := 0; new_avg_fx := 0;
      END IF;
    ELSE
      IF ABS(trade_signed_qty) <= ABS(ex_qty) THEN
        closed_qty := ABS(trade_signed_qty);
        remaining_new_qty := 0;
      ELSE
        closed_qty := ABS(ex_qty);
        remaining_new_qty := ABS(trade_signed_qty) - ABS(ex_qty);
      END IF;

      IF ex_qty > 0 THEN
        rpnl := (trade_price_eur - ex_avg_eur) * closed_qty;
      ELSE
        rpnl := (ex_avg_eur - trade_price_eur) * closed_qty;
      END IF;

      IF new_qty = 0 THEN
        new_avg_local := 0; new_avg_eur := 0; new_avg_fx := 0; new_total_cost := 0;
      ELSIF SIGN(new_qty) = SIGN(ex_qty) THEN
        new_avg_local := ex_avg_local;
        new_avg_eur := ex_avg_eur;
        new_avg_fx := ex_avg_fx;
        new_total_cost := ex_avg_eur * ABS(new_qty);
      ELSE
        new_avg_local := t.price;
        new_avg_eur := trade_price_eur;
        new_avg_fx := t.fx_rate_to_eur;
        new_total_cost := trade_price_eur * remaining_new_qty;
      END IF;
    END IF;

    INSERT INTO positions (
      asset_id, quantity, avg_cost_local, avg_cost_eur, avg_fx_rate,
      total_cost_eur, first_trade_date, last_trade_date,
      realized_pnl_local, realized_pnl_eur, updated_at
    ) VALUES (
      t.asset_id, new_qty, new_avg_local, new_avg_eur, new_avg_fx,
      new_total_cost, t.trade_date, t.trade_date,
      0, rpnl, now()
    )
    ON CONFLICT (asset_id) DO UPDATE SET
      quantity = EXCLUDED.quantity,
      avg_cost_local = EXCLUDED.avg_cost_local,
      avg_cost_eur = EXCLUDED.avg_cost_eur,
      avg_fx_rate = EXCLUDED.avg_fx_rate,
      total_cost_eur = EXCLUDED.total_cost_eur,
      last_trade_date = EXCLUDED.last_trade_date,
      realized_pnl_eur = positions.realized_pnl_eur + EXCLUDED.realized_pnl_eur,
      updated_at = now();
  END LOOP;
END $$;
