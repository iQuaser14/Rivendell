-- Phase 2: Allow anon access (no auth yet)
CREATE POLICY "Anon users have full access" ON assets FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon users have full access" ON cash_account FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon users have full access" ON cash_flows FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon users have full access" ON trades FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon users have full access" ON positions FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon users have full access" ON position_snapshots FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon users have full access" ON portfolio_snapshots FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon users have full access" ON market_data FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon users have full access" ON fx_rates FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon users have full access" ON theses FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon users have full access" ON reports FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon users have full access" ON alerts FOR ALL TO anon USING (true) WITH CHECK (true);
