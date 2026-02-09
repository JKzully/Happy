-- Historical daily sales for YoY comparison (2025 data)
create table historical_daily_sales (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  chain_id uuid not null references retail_chains(id),
  total_boxes integer not null default 0,
  total_revenue integer not null default 0,
  created_at timestamptz default now()
);

create unique index idx_historical_daily_sales_date_chain
  on historical_daily_sales(date, chain_id);

-- RLS
alter table historical_daily_sales enable row level security;
create policy "Allow authenticated read" on historical_daily_sales
  for select to authenticated using (true);
create policy "Allow authenticated insert" on historical_daily_sales
  for insert to authenticated with check (true);
