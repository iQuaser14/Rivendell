# Rivendell — Personal Wealth Management App

## Architecture Specification v2

---

## Overview

An institutional-grade personal portfolio management application for a hedge fund PM running a concentrated, multi-currency, multi-asset book across global markets. Single user, single cash account, full attribution analytics.

**Key Requirements:**
- Modified Dietz TWR + MWR calculations
- Full return attribution: Brinson (allocation + selection), contribution to return, sector/geo, currency
- FX decomposition per trade: local currency return vs FX impact vs total EUR return
- Auto cash management: every buy/sell/dividend auto-adjusts cash
- Automated reports: weekly, monthly, YTD — in-app + email
- Benchmarks: MSCI World EUR, S&P 500 EUR-hedged
- Base currency: EUR | Trading currencies: USD, CHF, AUD, GBP, JPY, SEK, DKK, NOK
- Short selling support (basic, no borrow cost tracking)
- Fineco CSV import + manual entry

---

## Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Mobile** | React Native (Expo) | True native iOS + Android |
| **Web** | Next.js 14 (App Router) | SSR, API routes, dashboard |
| **Shared Logic** | TypeScript monorepo (Turborepo) | Share types, calculations between platforms |
| **Backend** | Supabase (PostgreSQL + Edge Functions) | Auth, DB, realtime, cron |
| **State** | Zustand + React Query | Client state + server cache |
| **Charts** | Recharts (web) + Victory Native (mobile) | Best-in-class per platform |
| **Styling** | Tailwind CSS (web) + NativeWind (mobile) | Consistent design language |
| **Email** | Resend | Transactional email for reports |
| **Market Data** | Yahoo Finance + ECB FX | Free, reliable daily data |

---

## Monorepo Structure

```
rivendell/
├── apps/
│   ├── web/                        # Next.js 14 web dashboard
│   │   ├── app/
│   │   │   ├── (auth)/             # Login, magic link
│   │   │   ├── (dashboard)/        # Main dashboard layout
│   │   │   │   ├── page.tsx        # Portfolio overview
│   │   │   │   ├── positions/      # Positions table
│   │   │   │   ├── trades/         # Trade history + import
│   │   │   │   ├── theses/         # Trade theses tracker
│   │   │   │   ├── analytics/      # Performance + attribution
│   │   │   │   ├── reports/        # View generated reports
│   │   │   │   └── settings/       # Config, accounts
│   │   │   └── api/                # API routes
│   │   └── components/
│   │       ├── dashboard/          # Dashboard widgets
│   │       ├── charts/             # Chart components
│   │       ├── tables/             # Data tables
│   │       └── forms/              # Trade entry, import
│   └── mobile/                     # Expo React Native
│       ├── app/                    # Expo Router (file-based)
│       │   ├── (tabs)/
│       │   │   ├── index.tsx       # Dashboard
│       │   │   ├── positions.tsx   # Positions
│       │   │   ├── add-trade.tsx   # Quick trade entry
│       │   │   ├── analytics.tsx   # Charts
│       │   │   └── more.tsx        # Reports, settings
│       │   └── thesis/[id].tsx     # Thesis detail
│       └── components/
├── packages/
│   ├── core/                       # ALL business logic lives here
│   │   ├── calculations/
│   │   │   ├── modified-dietz.ts   # TWR via Modified Dietz
│   │   │   ├── mwr.ts             # Money-weighted return (IRR)
│   │   │   ├── daily-returns.ts   # Daily, weekly, monthly, YTD
│   │   │   ├── attribution.ts     # Brinson + contribution
│   │   │   ├── fx-decomposition.ts # Local return vs FX impact
│   │   │   ├── risk-metrics.ts    # Sharpe, Sortino, max DD, vol
│   │   │   ├── cash-engine.ts     # Auto cash management
│   │   │   └── benchmarks.ts      # Relative performance
│   │   ├── models/
│   │   │   ├── types.ts           # All TypeScript interfaces
│   │   │   ├── enums.ts           # Asset class, side, etc.
│   │   │   └── schemas.ts         # Zod validation schemas
│   │   ├── parsers/
│   │   │   ├── fineco.ts          # Fineco CSV parser
│   │   │   └── generic-csv.ts     # Fallback CSV parser
│   │   ├── reports/
│   │   │   ├── weekly.ts          # Weekly report generator
│   │   │   ├── monthly.ts         # Monthly report generator
│   │   │   └── ytd.ts             # YTD report generator
│   │   └── utils/
│   │       ├── fx.ts              # FX conversion helpers
│   │       ├── dates.ts           # Date utilities
│   │       └── math.ts            # Decimal math, rounding
│   ├── ui/                         # Shared UI primitives
│   └── supabase/                   # DB client, types, queries
│       ├── client.ts
│       ├── database.types.ts       # Auto-generated from schema
│       └── queries/
│           ├── trades.ts
│           ├── positions.ts
│           ├── snapshots.ts
│           └── reports.ts
├── supabase/
│   ├── migrations/
│   │   ├── 001_core_tables.sql
│   │   ├── 002_indexes.sql
│   │   ├── 003_views.sql
│   │   └── 004_rls_policies.sql
│   ├── functions/
│   │   ├── fetch-prices/           # Daily market data cron
│   │   ├── daily-snapshot/         # Daily position + portfolio snapshot
│   │   ├── weekly-report/          # Weekly report generation + email
│   │   ├── monthly-report/         # Monthly report generation + email
│   │   └── ytd-report/             # YTD report generation + email
│   └── seed.sql
├── turbo.json
├── package.json
└── CLAUDE.md
```

---

## Database Schema

### Core Tables

```sql
-- ============================================================
-- ASSETS
-- ============================================================
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker VARCHAR(20) NOT NULL,
  name VARCHAR(255),
  isin VARCHAR(12),
  asset_class VARCHAR(50) NOT NULL,         -- equity, etf, option, bond, commodity, crypto, cash
  currency VARCHAR(3) NOT NULL,             -- ISO 4217: trading currency
  exchange VARCHAR(20),                      -- MIL, NYSE, LSE, TSE, SIX, ASX
  sector VARCHAR(100),                       -- GICS sector
  industry VARCHAR(100),                     -- GICS industry
  country VARCHAR(3),                        -- ISO 3166-1 alpha-3
  region VARCHAR(20),                        -- europe, north_america, asia_pacific, emerging
  metadata JSONB DEFAULT '{}',               -- strike, expiry for options; benchmark_ticker for ETFs
  is_benchmark BOOLEAN DEFAULT false,        -- true for MSCI World, S&P 500
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ticker, exchange)
);

-- ============================================================
-- CASH ACCOUNT
-- ============================================================
CREATE TABLE cash_account (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  currency VARCHAR(3) NOT NULL,              -- EUR, USD, CHF, AUD, GBP, JPY
  balance DECIMAL(18,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(currency)
);

-- Initialize cash buckets
INSERT INTO cash_account (currency, balance) VALUES
  ('EUR', 0), ('USD', 0), ('CHF', 0), ('AUD', 0), ('GBP', 0), ('JPY', 0);

-- ============================================================
-- CASH FLOWS (deposits/withdrawals)
-- ============================================================
CREATE TABLE cash_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_date DATE NOT NULL,
  flow_type VARCHAR(20) NOT NULL,            -- deposit, withdrawal, dividend, interest, fee, fx_conversion
  amount DECIMAL(18,2) NOT NULL,             -- positive = inflow, negative = outflow
  currency VARCHAR(3) NOT NULL,
  fx_rate_to_eur DECIMAL(18,8),              -- rate at time of flow
  amount_eur DECIMAL(18,2),                  -- converted amount
  asset_id UUID REFERENCES assets(id),       -- for dividends: which stock
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
  side VARCHAR(5) NOT NULL,                  -- BUY, SELL, SHORT, COVER
  quantity DECIMAL(18,6) NOT NULL,            -- always positive
  price DECIMAL(18,6) NOT NULL,              -- local currency price
  currency VARCHAR(3) NOT NULL,              -- trade currency
  fx_rate_to_eur DECIMAL(18,8) NOT NULL,     -- EUR/XXX rate at trade time
  gross_amount DECIMAL(18,2) NOT NULL,       -- quantity * price (local currency)
  gross_amount_eur DECIMAL(18,2) NOT NULL,   -- converted to EUR
  commission DECIMAL(12,4) DEFAULT 0,
  tax DECIMAL(12,4) DEFAULT 0,
  net_amount DECIMAL(18,2) NOT NULL,         -- gross ± commission ± tax (local)
  net_amount_eur DECIMAL(18,2) NOT NULL,     -- net converted to EUR
  notes TEXT,
  tags TEXT[],                               -- ['pairs-trade', 'macro', 'momentum']
  trade_group VARCHAR(100),                  -- links legs: "SHEL_BP_PAIR"
  source VARCHAR(20) DEFAULT 'manual',       -- manual, fineco_csv
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger: auto-update cash on every trade insert
CREATE OR REPLACE FUNCTION update_cash_on_trade()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.side IN ('BUY', 'SHORT') THEN
    -- Cash decreases (we pay)
    UPDATE cash_account
    SET balance = balance - NEW.net_amount,
        updated_at = now()
    WHERE currency = NEW.currency;
  ELSIF NEW.side IN ('SELL', 'COVER') THEN
    -- Cash increases (we receive)
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

-- Trigger: auto-update cash on dividend/deposit/withdrawal
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
-- POSITIONS (current open positions, updated on each trade)
-- ============================================================
CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id),
  quantity DECIMAL(18,6) NOT NULL,            -- positive = long, negative = short
  avg_cost_local DECIMAL(18,6) NOT NULL,     -- weighted avg cost in local currency
  avg_cost_eur DECIMAL(18,6) NOT NULL,       -- weighted avg cost in EUR
  avg_fx_rate DECIMAL(18,8) NOT NULL,        -- weighted avg FX rate at entry
  total_cost_eur DECIMAL(18,2) NOT NULL,     -- total cost basis in EUR
  first_trade_date DATE NOT NULL,
  last_trade_date DATE NOT NULL,
  realized_pnl_local DECIMAL(18,2) DEFAULT 0,
  realized_pnl_eur DECIMAL(18,2) DEFAULT 0,
  realized_fx_pnl_eur DECIMAL(18,2) DEFAULT 0, -- FX component of realized P&L
  trade_group VARCHAR(100),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(asset_id)
);

-- ============================================================
-- DAILY SNAPSHOTS (positions)
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
  -- Values
  market_value_local DECIMAL(18,2) NOT NULL,
  market_value_eur DECIMAL(18,2) NOT NULL,
  cost_basis_eur DECIMAL(18,2) NOT NULL,
  -- P&L decomposition
  unrealized_pnl_eur DECIMAL(18,2) NOT NULL,
  unrealized_pnl_pct DECIMAL(10,6) NOT NULL,
  local_return_pct DECIMAL(10,6) NOT NULL,   -- return in local currency
  fx_impact_pct DECIMAL(10,6) NOT NULL,      -- FX contribution to return
  total_return_pct DECIMAL(10,6) NOT NULL,   -- total return in EUR
  -- Weight
  weight_pct DECIMAL(8,4) NOT NULL,          -- % of total portfolio
  -- Contribution to portfolio return
  contribution_to_return DECIMAL(10,6),
  UNIQUE(snapshot_date, asset_id)
);

-- ============================================================
-- DAILY PORTFOLIO SNAPSHOTS
-- ============================================================
CREATE TABLE portfolio_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL UNIQUE,
  -- Values
  total_equity_eur DECIMAL(18,2) NOT NULL,   -- positions + cash in EUR
  total_invested_eur DECIMAL(18,2) NOT NULL,  -- cost basis of open positions
  total_cash_eur DECIMAL(18,2) NOT NULL,     -- all cash balances converted to EUR
  cash_breakdown JSONB NOT NULL,              -- {"EUR": 10000, "USD": 5000, ...}
  -- Daily P&L
  daily_pnl_eur DECIMAL(18,2),
  daily_return_pct DECIMAL(10,6),
  -- Modified Dietz TWR
  modified_dietz_daily DECIMAL(10,6),         -- daily Modified Dietz return
  cumulative_twr DECIMAL(12,6),              -- compounded TWR since inception
  -- Period returns
  wtd_return_pct DECIMAL(10,6),              -- week-to-date
  mtd_return_pct DECIMAL(10,6),              -- month-to-date
  ytd_return_pct DECIMAL(10,6),              -- year-to-date
  itd_return_pct DECIMAL(10,6),              -- inception-to-date
  -- MWR
  mwr_ytd DECIMAL(10,6),                     -- money-weighted YTD
  -- Risk metrics
  volatility_30d DECIMAL(10,6),
  sharpe_ratio_ytd DECIMAL(10,6),
  sortino_ratio_ytd DECIMAL(10,6),
  max_drawdown_ytd DECIMAL(10,6),
  current_drawdown DECIMAL(10,6),
  -- Benchmarks
  benchmark_msci_world_eur DECIMAL(10,6),    -- MSCI World cumulative return
  benchmark_sp500_eur DECIMAL(10,6),         -- S&P 500 EUR cumulative return
  excess_return_msci DECIMAL(10,6),
  excess_return_sp500 DECIMAL(10,6),
  -- Attribution summary
  attribution_summary JSONB,                  -- Brinson, sector, geo, currency breakdowns
  -- Breakdowns
  allocation_by_class JSONB,                  -- {"equity": 0.65, "etf": 0.15, "cash": 0.20}
  allocation_by_sector JSONB,
  allocation_by_region JSONB,
  allocation_by_currency JSONB,               -- currency exposure breakdown
  -- Long/short exposure
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
  quote_currency VARCHAR(3) NOT NULL,        -- USD, CHF, AUD, GBP, JPY
  rate DECIMAL(18,8) NOT NULL,               -- 1 EUR = X units of quote
  source VARCHAR(20) DEFAULT 'ecb',
  UNIQUE(date, base_currency, quote_currency)
);

-- ============================================================
-- TRADE THESES
-- ============================================================
CREATE TABLE theses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,                -- "SHEL/BP Buyback Divergence"
  trade_group VARCHAR(100),                  -- links to trades.trade_group
  thesis TEXT NOT NULL,
  conviction VARCHAR(10),                    -- HIGH, MED, LOW
  status VARCHAR(20) DEFAULT 'ACTIVE',       -- ACTIVE, CLOSED, STOPPED
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
-- REPORTS (stored generated reports)
-- ============================================================
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type VARCHAR(20) NOT NULL,          -- weekly, monthly, ytd
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  title VARCHAR(200) NOT NULL,
  content JSONB NOT NULL,                    -- full report data
  html_content TEXT,                         -- rendered HTML for email
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
  alert_type VARCHAR(30) NOT NULL,           -- price_above, price_below, weight_drift, thesis_expiry
  threshold DECIMAL(18,6),
  is_triggered BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Key Indexes

```sql
CREATE INDEX idx_trades_date ON trades(trade_date DESC);
CREATE INDEX idx_trades_asset ON trades(asset_id);
CREATE INDEX idx_trades_group ON trades(trade_group);
CREATE INDEX idx_position_snaps_date ON position_snapshots(snapshot_date DESC);
CREATE INDEX idx_position_snaps_asset ON position_snapshots(asset_id, snapshot_date DESC);
CREATE INDEX idx_portfolio_snaps_date ON portfolio_snapshots(snapshot_date DESC);
CREATE INDEX idx_market_data_lookup ON market_data(asset_id, date DESC);
CREATE INDEX idx_fx_rates_lookup ON fx_rates(date DESC, quote_currency);
CREATE INDEX idx_cash_flows_date ON cash_flows(flow_date DESC);
```

### Key Views

```sql
-- Current portfolio with live P&L
CREATE VIEW v_portfolio_current AS
SELECT
  p.asset_id,
  a.ticker,
  a.name,
  a.asset_class,
  a.sector,
  a.country,
  a.region,
  a.currency AS trading_currency,
  p.quantity,
  p.avg_cost_local,
  p.avg_cost_eur,
  p.avg_fx_rate,
  p.total_cost_eur,
  p.realized_pnl_eur,
  p.realized_fx_pnl_eur,
  p.trade_group,
  -- Latest snapshot data joined
  ps.market_price_local,
  ps.market_price_eur,
  ps.fx_rate_to_eur,
  ps.market_value_eur,
  ps.unrealized_pnl_eur,
  ps.unrealized_pnl_pct,
  ps.local_return_pct,
  ps.fx_impact_pct,
  ps.total_return_pct,
  ps.weight_pct,
  ps.contribution_to_return
FROM positions p
JOIN assets a ON a.id = p.asset_id
LEFT JOIN position_snapshots ps ON ps.asset_id = p.asset_id
  AND ps.snapshot_date = (SELECT MAX(snapshot_date) FROM position_snapshots)
WHERE p.quantity != 0;

-- Cash summary in EUR
CREATE VIEW v_cash_summary AS
SELECT
  c.currency,
  c.balance,
  COALESCE(fx.rate, 1.0) AS fx_rate_to_eur,
  CASE
    WHEN c.currency = 'EUR' THEN c.balance
    ELSE c.balance / NULLIF(fx.rate, 0)
  END AS balance_eur
FROM cash_account c
LEFT JOIN LATERAL (
  SELECT rate FROM fx_rates
  WHERE quote_currency = c.currency AND base_currency = 'EUR'
  ORDER BY date DESC LIMIT 1
) fx ON true;
```

---

## Calculation Engine (packages/core/calculations/)

### Modified Dietz TWR

```typescript
// modified-dietz.ts
//
// R_md = (EMV - BMV - CF) / (BMV + Σ(CFi × Wi))
//
// Where:
//   EMV = ending market value
//   BMV = beginning market value
//   CF  = sum of cash flows in period
//   Wi  = (CD - Di) / CD (weight based on timing)
//   CD  = calendar days in period
//   Di  = day of cash flow within period
//
// Daily returns are compounded geometrically:
//   TWR = Π(1 + R_md_i) - 1

interface ModifiedDietzInput {
  beginningValue: Decimal;
  endingValue: Decimal;
  cashFlows: Array<{
    date: Date;
    amount: Decimal;     // positive = deposit, negative = withdrawal
  }>;
  periodStart: Date;
  periodEnd: Date;
}

// Returns daily Modified Dietz return
function calculateModifiedDietz(input: ModifiedDietzInput): Decimal;

// Compounds daily returns for any period
function compoundReturns(dailyReturns: Decimal[]): Decimal;
```

### FX Decomposition

```typescript
// fx-decomposition.ts
//
// For each position, decompose total EUR return into:
//
// 1. Local Return (stock alpha):
//    R_local = (P_end - P_begin) / P_begin
//    Where P is the price in local/trading currency
//
// 2. FX Impact:
//    R_fx = (FX_end / FX_begin) - 1
//    Where FX is EUR/XXX rate (how many XXX per 1 EUR)
//    If EUR strengthens (rate goes up), FX_impact is negative
//    If EUR weakens (rate goes down), FX_impact is positive
//
// 3. Total EUR Return:
//    R_total = (1 + R_local) × (1 + R_fx) - 1
//    Note: there's a small cross-term (R_local × R_fx)
//
// 4. Cross-term (interaction):
//    R_cross = R_total - R_local - R_fx

interface FxDecomposition {
  localReturn: Decimal;      // stock performance in its currency
  fxImpact: Decimal;          // currency effect on EUR return
  crossTerm: Decimal;         // interaction term
  totalReturnEur: Decimal;    // total return in EUR
}

function decomposeFxReturn(
  entryPriceLocal: Decimal,
  currentPriceLocal: Decimal,
  entryFxRate: Decimal,        // EUR/XXX at entry
  currentFxRate: Decimal       // EUR/XXX now
): FxDecomposition;
```

### Brinson Attribution

```typescript
// attribution.ts
//
// Brinson-Fachler model:
//
// Allocation Effect = (Wp - Wb) × (Rb - R_total_b)
//   "Did overweighting this sector add value?"
//
// Selection Effect = Wb × (Rp - Rb)
//   "Did picking stocks within this sector add value?"
//
// Interaction Effect = (Wp - Wb) × (Rp - Rb)
//
// Where:
//   Wp = portfolio weight in sector/region
//   Wb = benchmark weight in sector/region
//   Rp = portfolio return in sector/region
//   Rb = benchmark return in sector/region
//   R_total_b = total benchmark return
//
// Run this at sector level AND region level

interface BrinsonAttribution {
  segment: string;              // sector or region name
  portfolioWeight: Decimal;
  benchmarkWeight: Decimal;
  portfolioReturn: Decimal;
  benchmarkReturn: Decimal;
  allocationEffect: Decimal;
  selectionEffect: Decimal;
  interactionEffect: Decimal;
  totalEffect: Decimal;
}

function calculateBrinsonAttribution(
  portfolioSegments: SegmentData[],
  benchmarkSegments: SegmentData[],
  totalBenchmarkReturn: Decimal
): BrinsonAttribution[];
```

### Contribution to Return

```typescript
// For each position:
// Contribution = Weight_beginning × Return_position
//
// Sum of all contributions = total portfolio return
// This tells you: "SHEL contributed +0.45% to the portfolio"

interface ContributionToReturn {
  assetId: string;
  ticker: string;
  beginningWeight: Decimal;
  positionReturn: Decimal;       // total EUR return
  localContribution: Decimal;    // contribution from stock alpha
  fxContribution: Decimal;       // contribution from currency
  totalContribution: Decimal;    // total contribution to portfolio
}
```

### Cash Engine

```typescript
// cash-engine.ts
//
// Rules:
// 1. BUY:   cash[currency] -= (quantity × price + commission + tax)
// 2. SELL:  cash[currency] += (quantity × price - commission - tax)
// 3. SHORT: cash[currency] += (quantity × price - commission)
// 4. COVER: cash[currency] -= (quantity × price + commission + tax)
// 5. DIVIDEND: cash[currency] += amount
// 6. DEPOSIT:  cash[currency] += amount
// 7. WITHDRAWAL: cash[currency] -= amount
// 8. FX_CONVERSION: cash[from] -= amount, cash[to] += converted amount
//
// Cash is tracked per currency (EUR, USD, CHF, AUD, GBP, JPY)
// Total cash in EUR = Σ(cash[ccy] / fx_rate[ccy])
//
// This is handled by PostgreSQL triggers on trades and cash_flows tables
// The TypeScript engine provides validation and preview before submission
```

---

## Report Engine (packages/core/reports/)

### Weekly Report (generated every Sunday, emailed Monday 7:00 CET)

```
RIVENDELL — WEEKLY REPORT
Week ending [DATE]

PORTFOLIO SUMMARY
─────────────────────────────────────────
Total Equity:         €XXX,XXX.XX
Weekly P&L:           €X,XXX.XX (+X.XX%)
Cash:                 €XX,XXX.XX

Modified Dietz TWR:   +X.XX% (week)
MWR:                  +X.XX% (week)
YTD Return (TWR):     +XX.XX%

vs MSCI World EUR:    +X.XX% (alpha: +X.XX%)
vs S&P 500 EUR:       +X.XX% (alpha: +X.XX%)

TOP CONTRIBUTORS
─────────────────────────────────────────
1. SHEL.L    +€X,XXX  (+X.XX%)  [local: +X.XX%, FX: +X.XX%]
2. CCJ       +€X,XXX  (+X.XX%)  [local: +X.XX%, FX: +X.XX%]
3. CRWD      +€X,XXX  (+X.XX%)  [local: +X.XX%, FX: +X.XX%]

TOP DETRACTORS
─────────────────────────────────────────
1. BP.L      -€X,XXX  (-X.XX%)  [local: -X.XX%, FX: +X.XX%]
2. CRM       -€X,XXX  (-X.XX%)  [local: -X.XX%, FX: -X.XX%]

CURRENCY IMPACT
─────────────────────────────────────────
EUR/USD:  X.XXXX → X.XXXX  (impact: +X.XX%)
EUR/GBP:  X.XXXX → X.XXXX  (impact: -X.XX%)
EUR/JPY:  X.XXXX → X.XXXX  (impact: +X.XX%)
Net FX impact on portfolio: +X.XX%

ALLOCATION
─────────────────────────────────────────
Long:   XX.X%  |  Short:  XX.X%  |  Cash:  XX.X%
Gross:  XXX.X% |  Net:    XX.X%

TRADES THIS WEEK
─────────────────────────────────────────
[List of trades executed]

ACTIVE THESES UPDATE
─────────────────────────────────────────
[Status of each active thesis with P&L]
```

### Monthly Report — Same structure expanded with:
- Full Brinson attribution by sector and region
- Sector allocation vs benchmark (over/underweight)
- Currency attribution table
- 30-day risk metrics (vol, Sharpe, Sortino, max DD)
- Month-over-month comparison

### YTD Report — Same structure expanded with:
- Cumulative return chart data
- Best/worst months
- Full calendar of monthly returns
- Drawdown analysis
- Comparison vs both benchmarks since Jan 1

---

## Cron Jobs (Supabase Edge Functions)

| Job | Schedule (CET) | Description |
|-----|----------------|-------------|
| `fetch-prices` | Daily 22:00 | Fetch closing prices from Yahoo Finance for all active positions + benchmarks |
| `fetch-fx-rates` | Daily 17:00 | Fetch ECB reference rates for EUR/USD, EUR/CHF, EUR/AUD, EUR/GBP, EUR/JPY |
| `daily-snapshot` | Daily 22:30 | Calculate position values, P&L decomposition, portfolio metrics, store snapshots |
| `weekly-report` | Sunday 23:00 | Generate weekly report, store in DB, send email |
| `monthly-report` | 1st of month 07:00 | Generate previous month report, store, email |
| `ytd-report` | 1st of month 07:30 | Generate updated YTD report, store, email |

---

## Design Direction

**Aesthetic**: Dark luxury fintech — Bloomberg Terminal precision meets modern wealth app elegance. High data density without clutter.

**Colors**:
- Background: `#0A0A0F` (near-black)
- Surface: `#14141F` (dark navy)
- Card: `#1A1A2E` (elevated surface)
- Accent: `#00D4AA` (teal — positive P&L, key actions)
- Negative: `#FF4757` (red — losses)
- Warning: `#FFA502` (amber — alerts, approaching thresholds)
- Text primary: `#E8E8ED` (off-white)
- Text secondary: `#6B7194` (steel blue)
- Border: `#2A2A3E` (subtle dividers)

**Typography**:
- Numbers/P&L: JetBrains Mono (monospace precision for financial data)
- Headings: Satoshi (modern, sharp)
- Body: General Sans (clean readability)

**Key UI Patterns**:
- P&L color intensity scales with magnitude (deeper green/red for larger moves)
- Sparklines in table cells for 7-day price trend
- FX decomposition shown as stacked bar (local | fx | cross)
- Portfolio value as large hero number with daily change below
- Attribution shown as waterfall chart

---

## Build Phases

### Phase 1 — Foundation (Week 1-2)
- [ ] Turborepo monorepo setup
- [ ] Supabase project, migrations, triggers
- [ ] Auth (single user, magic link)
- [ ] Core package: types, Zod schemas
- [ ] Calculation engine: Modified Dietz, MWR, FX decomposition
- [ ] Cash engine with auto-update triggers
- [ ] Fineco CSV parser

### Phase 2 — Web Dashboard (Week 3-4)
- [ ] Dashboard: portfolio value, daily P&L, allocation charts
- [ ] Positions table with FX decomposition columns
- [ ] Trade entry form + Fineco CSV import
- [ ] Cash view: per-currency balances
- [ ] Basic performance chart (cumulative TWR)

### Phase 3 — Attribution & Analytics (Week 5-6)
- [ ] Brinson attribution (sector + region)
- [ ] Contribution to return per position
- [ ] Currency attribution analysis
- [ ] Benchmark tracking (MSCI World, S&P 500)
- [ ] Risk metrics (Sharpe, Sortino, max DD, volatility)
- [ ] Drawdown chart

### Phase 4 — Reports & Cron (Week 7-8)
- [ ] Daily cron: fetch prices, FX, snapshots
- [ ] Weekly report generation + email (Resend)
- [ ] Monthly report generation + email
- [ ] YTD report generation + email
- [ ] In-app report viewer

### Phase 5 — Trade Theses & Alerts (Week 8-9)
- [ ] Theses CRUD with links to trade groups
- [ ] Thesis P&L tracking with FX decomposition
- [ ] Catalyst timeline
- [ ] Price + drift alerts

### Phase 6 — Mobile App (Week 9-11)
- [ ] Expo setup with shared packages
- [ ] Dashboard screen
- [ ] Positions list with FX decomposition
- [ ] Trade entry
- [ ] Push notifications
- [ ] Biometric auth

### Phase 7 — Polish (Week 11-12)
- [ ] Tax report (Italian 26% CGT)
- [ ] Excel export
- [ ] Performance optimization
- [ ] End-to-end testing

---

## CLAUDE.md

```markdown
# Rivendell — Personal Wealth Management App

## What This Is
Institutional-grade personal portfolio tracker for a hedge fund PM.
Single user, single cash account, multi-currency (EUR base), full attribution.

## Tech
Turborepo monorepo: apps/web (Next.js 14), apps/mobile (Expo), packages/core, packages/supabase.

## Critical Rules
- ALL monetary values: DECIMAL, never float. Use decimal.js in TypeScript.
- Base currency: EUR. All portfolio-level values in EUR.
- Trading currencies: USD, CHF, AUD, GBP, JPY (and EUR).
- FX rates: 1 EUR = X foreign currency (ECB convention).
- TWR: Modified Dietz method. Compound daily returns for longer periods.
- Cash auto-updates via PostgreSQL triggers on trades and cash_flows inserts.
- Every position P&L must decompose into: local return + FX impact + cross-term.
- Brinson attribution runs at sector AND region level vs MSCI World EUR.
- Short positions: quantity is negative in positions table.
- Dates: date-fns, store as UTC DATE or TIMESTAMPTZ.
- Validation: Zod on all external data (CSV, API).
- Error handling: Result<T, E> pattern, no thrown exceptions in business logic.
- All calculation functions must have unit tests with known examples.
- Italian tax: 26% capital gains on realized gains.

## Fineco CSV Format
- Date: DD/MM/YYYY
- Decimal separator: comma (1.234,56)
- Operations: "Acquisto" (buy), "Vendita" (sell), "Dividendo" (dividend)
- Currency field: "EUR", "USD", "CHF"
- ISIN provided for each security
```
