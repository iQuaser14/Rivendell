-- ============================================================
-- ASSETS
-- ============================================================
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker VARCHAR(20) NOT NULL,
  name VARCHAR(255),
  isin VARCHAR(12),
  asset_class VARCHAR(50) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  exchange VARCHAR(20),
  sector VARCHAR(100),
  industry VARCHAR(100),
  country VARCHAR(3),
  region VARCHAR(20),
  metadata JSONB DEFAULT '{}',
  is_benchmark BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ticker, exchange)
);

-- ============================================================
-- CASH ACCOUNT
-- ============================================================
CREATE TABLE cash_account (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  currency VARCHAR(3) NOT NULL,
  balance DECIMAL(18,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(currency)
);

-- Seed all 9 currencies
INSERT INTO cash_account (currency, balance) VALUES
  ('EUR', 0), ('USD', 0), ('CHF', 0), ('AUD', 0), ('GBP', 0),
  ('JPY', 0), ('SEK', 0), ('DKK', 0), ('NOK', 0);

-- ============================================================
-- CASH FLOWS
-- ============================================================
CREATE TABLE cash_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_date DATE NOT NULL,
  flow_type VARCHAR(20) NOT NULL,
  amount DECIMAL(18,2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  fx_rate_to_eur DECIMAL(18,8),
  amount_eur DECIMAL(18,2),
  asset_id UUID REFERENCES assets(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TRADES
-- ============================================================
CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id),
  trade_date DATE NOT NULL,
  settlement_date DATE,
  side VARCHAR(5) NOT NULL,
  quantity DECIMAL(18,6) NOT NULL,
  price DECIMAL(18,6) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  fx_rate_to_eur DECIMAL(18,8) NOT NULL,
  gross_amount DECIMAL(18,2) NOT NULL,
  gross_amount_eur DECIMAL(18,2) NOT NULL,
  commission DECIMAL(12,4) DEFAULT 0,
  tax DECIMAL(12,4) DEFAULT 0,
  net_amount DECIMAL(18,2) NOT NULL,
  net_amount_eur DECIMAL(18,2) NOT NULL,
  notes TEXT,
  tags TEXT[],
  trade_group VARCHAR(100),
  source VARCHAR(20) DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TRIGGER: Auto-update cash on trade insert
-- ============================================================
CREATE OR REPLACE FUNCTION update_cash_on_trade()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.side IN ('BUY', 'SHORT') THEN
    UPDATE cash_account
    SET balance = balance - NEW.net_amount,
        updated_at = now()
    WHERE currency = NEW.currency;
  ELSIF NEW.side IN ('SELL', 'COVER') THEN
    UPDATE cash_account
    SET balance = balance + NEW.net_amount,
        updated_at = now()
    WHERE currency = NEW.currency;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cash_on_trade
  AFTER INSERT ON trades
  FOR EACH ROW
  EXECUTE FUNCTION update_cash_on_trade();

-- ============================================================
-- TRIGGER: Auto-update cash on cash flow insert
-- ============================================================
CREATE OR REPLACE FUNCTION update_cash_on_flow()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE cash_account
  SET balance = balance + NEW.amount,
      updated_at = now()
  WHERE currency = NEW.currency;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cash_on_flow
  AFTER INSERT ON cash_flows
  FOR EACH ROW
  EXECUTE FUNCTION update_cash_on_flow();

-- ============================================================
-- POSITIONS
-- ============================================================
CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id),
  quantity DECIMAL(18,6) NOT NULL,
  avg_cost_local DECIMAL(18,6) NOT NULL,
  avg_cost_eur DECIMAL(18,6) NOT NULL,
  avg_fx_rate DECIMAL(18,8) NOT NULL,
  total_cost_eur DECIMAL(18,2) NOT NULL,
  first_trade_date DATE NOT NULL,
  last_trade_date DATE NOT NULL,
  realized_pnl_local DECIMAL(18,2) DEFAULT 0,
  realized_pnl_eur DECIMAL(18,2) DEFAULT 0,
  realized_fx_pnl_eur DECIMAL(18,2) DEFAULT 0,
  trade_group VARCHAR(100),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(asset_id)
);

-- ============================================================
-- POSITION SNAPSHOTS (daily)
-- ============================================================
CREATE TABLE position_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL,
  asset_id UUID NOT NULL REFERENCES assets(id),
  quantity DECIMAL(18,6) NOT NULL,
  avg_cost_local DECIMAL(18,6) NOT NULL,
  avg_cost_eur DECIMAL(18,6) NOT NULL,
  avg_fx_rate DECIMAL(18,8) NOT NULL,
  market_price_local DECIMAL(18,6) NOT NULL,
  market_price_eur DECIMAL(18,6) NOT NULL,
  fx_rate_to_eur DECIMAL(18,8) NOT NULL,
  market_value_local DECIMAL(18,2) NOT NULL,
  market_value_eur DECIMAL(18,2) NOT NULL,
  cost_basis_eur DECIMAL(18,2) NOT NULL,
  unrealized_pnl_eur DECIMAL(18,2) NOT NULL,
  unrealized_pnl_pct DECIMAL(10,6) NOT NULL,
  local_return_pct DECIMAL(10,6) NOT NULL,
  fx_impact_pct DECIMAL(10,6) NOT NULL,
  total_return_pct DECIMAL(10,6) NOT NULL,
  weight_pct DECIMAL(8,4) NOT NULL,
  contribution_to_return DECIMAL(10,6),
  UNIQUE(snapshot_date, asset_id)
);

-- ============================================================
-- PORTFOLIO SNAPSHOTS (daily)
-- ============================================================
CREATE TABLE portfolio_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL UNIQUE,
  total_equity_eur DECIMAL(18,2) NOT NULL,
  total_invested_eur DECIMAL(18,2) NOT NULL,
  total_cash_eur DECIMAL(18,2) NOT NULL,
  cash_breakdown JSONB NOT NULL,
  daily_pnl_eur DECIMAL(18,2),
  daily_return_pct DECIMAL(10,6),
  modified_dietz_daily DECIMAL(10,6),
  cumulative_twr DECIMAL(12,6),
  wtd_return_pct DECIMAL(10,6),
  mtd_return_pct DECIMAL(10,6),
  ytd_return_pct DECIMAL(10,6),
  itd_return_pct DECIMAL(10,6),
  mwr_ytd DECIMAL(10,6),
  volatility_30d DECIMAL(10,6),
  sharpe_ratio_ytd DECIMAL(10,6),
  sortino_ratio_ytd DECIMAL(10,6),
  max_drawdown_ytd DECIMAL(10,6),
  current_drawdown DECIMAL(10,6),
  benchmark_msci_world_eur DECIMAL(10,6),
  benchmark_sp500_eur DECIMAL(10,6),
  excess_return_msci DECIMAL(10,6),
  excess_return_sp500 DECIMAL(10,6),
  attribution_summary JSONB,
  allocation_by_class JSONB,
  allocation_by_sector JSONB,
  allocation_by_region JSONB,
  allocation_by_currency JSONB,
  gross_exposure DECIMAL(18,2),
  net_exposure DECIMAL(18,2),
  long_exposure DECIMAL(18,2),
  short_exposure DECIMAL(18,2)
);

-- ============================================================
-- MARKET DATA
-- ============================================================
CREATE TABLE market_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id),
  date DATE NOT NULL,
  open DECIMAL(18,6),
  high DECIMAL(18,6),
  low DECIMAL(18,6),
  close DECIMAL(18,6) NOT NULL,
  adj_close DECIMAL(18,6),
  volume BIGINT,
  source VARCHAR(20) DEFAULT 'yahoo',
  UNIQUE(asset_id, date)
);

-- ============================================================
-- FX RATES
-- ============================================================
CREATE TABLE fx_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  base_currency VARCHAR(3) DEFAULT 'EUR',
  quote_currency VARCHAR(3) NOT NULL,
  rate DECIMAL(18,8) NOT NULL,
  source VARCHAR(20) DEFAULT 'ecb',
  UNIQUE(date, base_currency, quote_currency)
);

-- ============================================================
-- TRADE THESES
-- ============================================================
CREATE TABLE theses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  trade_group VARCHAR(100),
  thesis TEXT NOT NULL,
  conviction VARCHAR(10),
  status VARCHAR(20) DEFAULT 'ACTIVE',
  entry_date DATE,
  target_exit_date DATE,
  catalysts TEXT[],
  risk_factors TEXT[],
  target_return_pct DECIMAL(8,4),
  stop_loss_pct DECIMAL(8,4),
  actual_return_pct DECIMAL(8,4),
  actual_return_local_pct DECIMAL(8,4),
  actual_fx_impact_pct DECIMAL(8,4),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  closed_at TIMESTAMPTZ
);

-- ============================================================
-- REPORTS
-- ============================================================
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type VARCHAR(20) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  title VARCHAR(200) NOT NULL,
  content JSONB NOT NULL,
  html_content TEXT,
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ALERTS
-- ============================================================
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES assets(id),
  thesis_id UUID REFERENCES theses(id),
  alert_type VARCHAR(30) NOT NULL,
  threshold DECIMAL(18,6),
  is_triggered BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
