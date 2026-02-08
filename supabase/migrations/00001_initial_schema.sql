-- ============================================
-- HCE Dashboard - Initial Schema
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- 1. products
-- ============================================
create table products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text not null check (category in ('hydration', 'creatine', 'energy', 'kids')),
  production_cost numeric(10, 2) not null,
  sticks_per_box integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_products_category on products (category);

-- ============================================
-- 2. retail_chains
-- ============================================
create table retail_chains (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

-- ============================================
-- 3. stores
-- ============================================
create table stores (
  id uuid primary key default uuid_generate_v4(),
  chain_id uuid not null references retail_chains (id) on delete cascade,
  name text not null,
  sub_chain_type text check (sub_chain_type in ('netto', 'kjorbud', 'iceland', 'extra', 'krambud')),
  created_at timestamptz not null default now()
);

create index idx_stores_chain_id on stores (chain_id);

-- ============================================
-- 4. chain_prices
-- ============================================
create table chain_prices (
  id uuid primary key default uuid_generate_v4(),
  chain_id uuid not null references retail_chains (id) on delete cascade,
  product_category text not null check (product_category in ('hydration', 'creatine', 'energy', 'kids')),
  price_per_box numeric(10, 2) not null,
  vsk_multiplier numeric(5, 4) not null default 1.2400,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (chain_id, product_category)
);

-- ============================================
-- 5. shopify_prices
-- ============================================
create table shopify_prices (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products (id) on delete cascade,
  retail_price numeric(10, 2) not null,
  subscription_price numeric(10, 2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id)
);

-- ============================================
-- 6. daily_sales
-- ============================================
create table daily_sales (
  id uuid primary key default uuid_generate_v4(),
  date date not null,
  store_id uuid not null references stores (id) on delete cascade,
  product_id uuid not null references products (id) on delete cascade,
  quantity integer not null default 0,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create index idx_daily_sales_date on daily_sales (date);
create index idx_daily_sales_store_id on daily_sales (store_id);
create index idx_daily_sales_product_id on daily_sales (product_id);
create unique index idx_daily_sales_unique on daily_sales (date, store_id, product_id);

-- ============================================
-- 7. daily_ad_spend
-- ============================================
create table daily_ad_spend (
  id uuid primary key default uuid_generate_v4(),
  date date not null,
  platform text not null check (platform in ('meta', 'google')),
  amount numeric(10, 2) not null default 0,
  created_at timestamptz not null default now(),
  unique (date, platform)
);

create index idx_daily_ad_spend_date on daily_ad_spend (date);

-- ============================================
-- 8. fixed_costs
-- ============================================
create table fixed_costs (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text not null check (category in ('operations', 'marketing_fixed', 'marketing_variable')),
  monthly_amount numeric(10, 2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- Row Level Security
-- ============================================
alter table products enable row level security;
alter table retail_chains enable row level security;
alter table stores enable row level security;
alter table chain_prices enable row level security;
alter table shopify_prices enable row level security;
alter table daily_sales enable row level security;
alter table daily_ad_spend enable row level security;
alter table fixed_costs enable row level security;

-- Policies: authenticated users can read all data
create policy "Authenticated users can read products" on products for select to authenticated using (true);
create policy "Authenticated users can read retail_chains" on retail_chains for select to authenticated using (true);
create policy "Authenticated users can read stores" on stores for select to authenticated using (true);
create policy "Authenticated users can read chain_prices" on chain_prices for select to authenticated using (true);
create policy "Authenticated users can read shopify_prices" on shopify_prices for select to authenticated using (true);
create policy "Authenticated users can read daily_sales" on daily_sales for select to authenticated using (true);
create policy "Authenticated users can read daily_ad_spend" on daily_ad_spend for select to authenticated using (true);
create policy "Authenticated users can read fixed_costs" on fixed_costs for select to authenticated using (true);

-- Policies: authenticated users can insert/update/delete all data
create policy "Authenticated users can insert products" on products for insert to authenticated with check (true);
create policy "Authenticated users can update products" on products for update to authenticated using (true);
create policy "Authenticated users can delete products" on products for delete to authenticated using (true);

create policy "Authenticated users can insert retail_chains" on retail_chains for insert to authenticated with check (true);
create policy "Authenticated users can update retail_chains" on retail_chains for update to authenticated using (true);
create policy "Authenticated users can delete retail_chains" on retail_chains for delete to authenticated using (true);

create policy "Authenticated users can insert stores" on stores for insert to authenticated with check (true);
create policy "Authenticated users can update stores" on stores for update to authenticated using (true);
create policy "Authenticated users can delete stores" on stores for delete to authenticated using (true);

create policy "Authenticated users can insert chain_prices" on chain_prices for insert to authenticated with check (true);
create policy "Authenticated users can update chain_prices" on chain_prices for update to authenticated using (true);
create policy "Authenticated users can delete chain_prices" on chain_prices for delete to authenticated using (true);

create policy "Authenticated users can insert shopify_prices" on shopify_prices for insert to authenticated with check (true);
create policy "Authenticated users can update shopify_prices" on shopify_prices for update to authenticated using (true);
create policy "Authenticated users can delete shopify_prices" on shopify_prices for delete to authenticated using (true);

create policy "Authenticated users can insert daily_sales" on daily_sales for insert to authenticated with check (true);
create policy "Authenticated users can update daily_sales" on daily_sales for update to authenticated using (true);
create policy "Authenticated users can delete daily_sales" on daily_sales for delete to authenticated using (true);

create policy "Authenticated users can insert daily_ad_spend" on daily_ad_spend for insert to authenticated with check (true);
create policy "Authenticated users can update daily_ad_spend" on daily_ad_spend for update to authenticated using (true);
create policy "Authenticated users can delete daily_ad_spend" on daily_ad_spend for delete to authenticated using (true);

create policy "Authenticated users can insert fixed_costs" on fixed_costs for insert to authenticated with check (true);
create policy "Authenticated users can update fixed_costs" on fixed_costs for update to authenticated using (true);
create policy "Authenticated users can delete fixed_costs" on fixed_costs for delete to authenticated using (true);

-- ============================================
-- Updated_at trigger function
-- ============================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_products_updated_at before update on products
  for each row execute function update_updated_at();

create trigger trg_chain_prices_updated_at before update on chain_prices
  for each row execute function update_updated_at();

create trigger trg_shopify_prices_updated_at before update on shopify_prices
  for each row execute function update_updated_at();

create trigger trg_fixed_costs_updated_at before update on fixed_costs
  for each row execute function update_updated_at();
