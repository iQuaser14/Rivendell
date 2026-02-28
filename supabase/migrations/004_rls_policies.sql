-- Enable RLS on all tables
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_account ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE fx_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE theses ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Single-user RLS: all rows accessible to any authenticated user
CREATE POLICY "Authenticated users have full access" ON assets FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users have full access" ON cash_account FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users have full access" ON cash_flows FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users have full access" ON trades FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users have full access" ON positions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users have full access" ON position_snapshots FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users have full access" ON portfolio_snapshots FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users have full access" ON market_data FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users have full access" ON fx_rates FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users have full access" ON theses FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users have full access" ON reports FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users have full access" ON alerts FOR ALL TO authenticated USING (true) WITH CHECK (true);
