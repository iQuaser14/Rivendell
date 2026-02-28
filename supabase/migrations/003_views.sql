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
