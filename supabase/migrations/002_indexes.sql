CREATE INDEX idx_trades_date ON trades(trade_date DESC);
CREATE INDEX idx_trades_asset ON trades(asset_id);
CREATE INDEX idx_trades_group ON trades(trade_group);
CREATE INDEX idx_position_snaps_date ON position_snapshots(snapshot_date DESC);
CREATE INDEX idx_position_snaps_asset ON position_snapshots(asset_id, snapshot_date DESC);
CREATE INDEX idx_portfolio_snaps_date ON portfolio_snapshots(snapshot_date DESC);
CREATE INDEX idx_market_data_lookup ON market_data(asset_id, date DESC);
CREATE INDEX idx_fx_rates_lookup ON fx_rates(date DESC, quote_currency);
CREATE INDEX idx_cash_flows_date ON cash_flows(flow_date DESC);
