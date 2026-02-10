-- ============================================
-- Seed Shopify retail chain + virtual store
-- ============================================

INSERT INTO retail_chains (name, slug) VALUES ('Shopify', 'shopify')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO stores (chain_id, name)
  SELECT id, 'Shopify Direct' FROM retail_chains WHERE slug = 'shopify'
  ON CONFLICT DO NOTHING;

-- ============================================
-- Allow service_role to insert into daily_sales
-- (needed for Vercel cron sync route)
-- ============================================

CREATE POLICY "Service role can insert daily_sales"
  ON daily_sales FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update daily_sales"
  ON daily_sales FOR UPDATE
  TO service_role
  USING (true);
