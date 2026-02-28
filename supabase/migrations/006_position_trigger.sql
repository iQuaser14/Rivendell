-- ============================================================
-- TRIGGER: Auto-update positions on trade insert
-- Uses weighted-average cost method
-- ============================================================
CREATE OR REPLACE FUNCTION update_position_on_trade()
RETURNS TRIGGER AS $$
DECLARE
  existing_qty DECIMAL(18,6);
  existing_avg_cost_local DECIMAL(18,6);
  existing_avg_cost_eur DECIMAL(18,6);
  existing_avg_fx DECIMAL(18,8);
  existing_total_cost_eur DECIMAL(18,2);
  new_qty DECIMAL(18,6);
  new_avg_cost_local DECIMAL(18,6);
  new_avg_cost_eur DECIMAL(18,6);
  new_avg_fx DECIMAL(18,8);
  new_total_cost_eur DECIMAL(18,2);
  trade_qty DECIMAL(18,6);
  trade_cost_eur DECIMAL(18,2);
  realized_pnl DECIMAL(18,2);
BEGIN
  -- Get existing position (if any)
  SELECT quantity, avg_cost_local, avg_cost_eur, avg_fx_rate, total_cost_eur
  INTO existing_qty, existing_avg_cost_local, existing_avg_cost_eur, existing_avg_fx, existing_total_cost_eur
  FROM positions
  WHERE asset_id = NEW.asset_id;

  IF NOT FOUND THEN
    existing_qty := 0;
    existing_avg_cost_local := 0;
    existing_avg_cost_eur := 0;
    existing_avg_fx := 0;
    existing_total_cost_eur := 0;
  END IF;

  trade_qty := NEW.quantity;
  trade_cost_eur := ABS(NEW.gross_amount_eur);
  realized_pnl := 0;

  IF NEW.side IN ('BUY', 'COVER') THEN
    -- Adding to position: recalculate weighted average
    new_qty := existing_qty + trade_qty;

    IF new_qty != 0 THEN
      -- Weighted average cost
      new_total_cost_eur := existing_total_cost_eur + trade_cost_eur;
      new_avg_cost_local := (existing_avg_cost_local * ABS(existing_qty) + NEW.price * trade_qty) / ABS(new_qty);
      new_avg_cost_eur := new_total_cost_eur / ABS(new_qty);
      new_avg_fx := (existing_avg_fx * ABS(existing_qty) + NEW.fx_rate_to_eur * trade_qty) / ABS(new_qty);
    ELSE
      new_total_cost_eur := 0;
      new_avg_cost_local := 0;
      new_avg_cost_eur := 0;
      new_avg_fx := 0;
    END IF;

  ELSIF NEW.side IN ('SELL', 'SHORT') THEN
    -- Reducing position: use existing avg cost for realized P&L
    new_qty := existing_qty - trade_qty;

    IF existing_qty != 0 THEN
      -- Realized P&L = (sell price EUR - avg cost EUR) * qty sold
      realized_pnl := (NEW.price / NULLIF(NEW.fx_rate_to_eur, 0) - existing_avg_cost_eur) * trade_qty;
    END IF;

    -- Cost basis reduces proportionally
    IF ABS(existing_qty) > 0 THEN
      new_total_cost_eur := existing_total_cost_eur * (ABS(new_qty) / ABS(existing_qty));
    ELSE
      new_total_cost_eur := 0;
    END IF;

    -- Avg cost stays the same when selling
    new_avg_cost_local := existing_avg_cost_local;
    new_avg_cost_eur := existing_avg_cost_eur;
    new_avg_fx := existing_avg_fx;

    -- If position is fully closed, reset
    IF new_qty = 0 THEN
      new_avg_cost_local := 0;
      new_avg_cost_eur := 0;
      new_avg_fx := 0;
      new_total_cost_eur := 0;
    END IF;
  END IF;

  -- Upsert position
  INSERT INTO positions (
    asset_id, quantity, avg_cost_local, avg_cost_eur, avg_fx_rate,
    total_cost_eur, first_trade_date, last_trade_date,
    realized_pnl_local, realized_pnl_eur, updated_at
  ) VALUES (
    NEW.asset_id, new_qty, new_avg_cost_local, new_avg_cost_eur, new_avg_fx,
    new_total_cost_eur, NEW.trade_date, NEW.trade_date,
    0, realized_pnl, now()
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

CREATE TRIGGER trg_position_on_trade
  AFTER INSERT ON trades
  FOR EACH ROW
  EXECUTE FUNCTION update_position_on_trade();

-- ============================================================
-- Backfill: rebuild positions from all existing trades
-- Process trades in chronological order
-- ============================================================
DO $$
DECLARE
  t RECORD;
BEGIN
  -- Clear positions first
  DELETE FROM positions;

  -- Replay all trades in order
  FOR t IN SELECT * FROM trades ORDER BY trade_date ASC, created_at ASC
  LOOP
    -- The trigger won't fire on this, so we call the logic inline
    DECLARE
      ex_qty DECIMAL(18,6) := 0;
      ex_avg_local DECIMAL(18,6) := 0;
      ex_avg_eur DECIMAL(18,6) := 0;
      ex_avg_fx DECIMAL(18,8) := 0;
      ex_total_cost DECIMAL(18,2) := 0;
      n_qty DECIMAL(18,6);
      n_avg_local DECIMAL(18,6);
      n_avg_eur DECIMAL(18,6);
      n_avg_fx DECIMAL(18,8);
      n_total_cost DECIMAL(18,2);
      rpnl DECIMAL(18,2) := 0;
    BEGIN
      SELECT quantity, avg_cost_local, avg_cost_eur, avg_fx_rate, total_cost_eur
      INTO ex_qty, ex_avg_local, ex_avg_eur, ex_avg_fx, ex_total_cost
      FROM positions WHERE asset_id = t.asset_id;

      IF NOT FOUND THEN
        ex_qty := 0; ex_avg_local := 0; ex_avg_eur := 0; ex_avg_fx := 0; ex_total_cost := 0;
      END IF;

      IF t.side IN ('BUY', 'COVER') THEN
        n_qty := ex_qty + t.quantity;
        IF n_qty != 0 THEN
          n_total_cost := ex_total_cost + ABS(t.gross_amount_eur);
          n_avg_local := (ex_avg_local * ABS(ex_qty) + t.price * t.quantity) / ABS(n_qty);
          n_avg_eur := n_total_cost / ABS(n_qty);
          n_avg_fx := (ex_avg_fx * ABS(ex_qty) + t.fx_rate_to_eur * t.quantity) / ABS(n_qty);
        ELSE
          n_total_cost := 0; n_avg_local := 0; n_avg_eur := 0; n_avg_fx := 0;
        END IF;
      ELSIF t.side IN ('SELL', 'SHORT') THEN
        n_qty := ex_qty - t.quantity;
        IF ex_qty != 0 THEN
          rpnl := (t.price / NULLIF(t.fx_rate_to_eur, 0) - ex_avg_eur) * t.quantity;
        END IF;
        IF ABS(ex_qty) > 0 THEN
          n_total_cost := ex_total_cost * (ABS(n_qty) / ABS(ex_qty));
        ELSE
          n_total_cost := 0;
        END IF;
        n_avg_local := ex_avg_local;
        n_avg_eur := ex_avg_eur;
        n_avg_fx := ex_avg_fx;
        IF n_qty = 0 THEN
          n_avg_local := 0; n_avg_eur := 0; n_avg_fx := 0; n_total_cost := 0;
        END IF;
      ELSE
        n_qty := ex_qty; n_avg_local := ex_avg_local; n_avg_eur := ex_avg_eur;
        n_avg_fx := ex_avg_fx; n_total_cost := ex_total_cost;
      END IF;

      INSERT INTO positions (
        asset_id, quantity, avg_cost_local, avg_cost_eur, avg_fx_rate,
        total_cost_eur, first_trade_date, last_trade_date,
        realized_pnl_local, realized_pnl_eur, updated_at
      ) VALUES (
        t.asset_id, n_qty, n_avg_local, n_avg_eur, n_avg_fx,
        n_total_cost, t.trade_date, t.trade_date,
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
    END;
  END LOOP;
END $$;
