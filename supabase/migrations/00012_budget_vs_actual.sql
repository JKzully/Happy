-- ============================================
-- Budget vs Actual cost system
-- ============================================

-- 1. cost_categories (hierarchical grouping)
create table cost_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. cost_items (individual line items within a category)
create table cost_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references cost_categories (id) on delete cascade,
  name text not null,
  vsk_percent numeric(5, 2) not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_cost_items_category_id on cost_items (category_id);

-- 3. monthly_cost_entries (budget + actual per item per month)
create table monthly_cost_entries (
  id uuid primary key default gen_random_uuid(),
  cost_item_id uuid not null references cost_items (id) on delete cascade,
  month text not null, -- "YYYY-MM"
  budget_amount numeric(12, 2) not null default 0,
  actual_amount numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cost_item_id, month)
);

create index idx_monthly_cost_entries_month on monthly_cost_entries (month);
create index idx_monthly_cost_entries_item on monthly_cost_entries (cost_item_id);

-- 4. monthly_cost_locks (lock a month from editing)
create table monthly_cost_locks (
  id uuid primary key default gen_random_uuid(),
  month text not null unique,
  locked_at timestamptz not null default now(),
  locked_by uuid references auth.users (id)
);

-- ============================================
-- Row Level Security
-- ============================================
alter table cost_categories enable row level security;
alter table cost_items enable row level security;
alter table monthly_cost_entries enable row level security;
alter table monthly_cost_locks enable row level security;

-- cost_categories policies
create policy "Authenticated users can read cost_categories" on cost_categories for select to authenticated using (true);
create policy "Authenticated users can insert cost_categories" on cost_categories for insert to authenticated with check (true);
create policy "Authenticated users can update cost_categories" on cost_categories for update to authenticated using (true);
create policy "Authenticated users can delete cost_categories" on cost_categories for delete to authenticated using (true);

-- cost_items policies
create policy "Authenticated users can read cost_items" on cost_items for select to authenticated using (true);
create policy "Authenticated users can insert cost_items" on cost_items for insert to authenticated with check (true);
create policy "Authenticated users can update cost_items" on cost_items for update to authenticated using (true);
create policy "Authenticated users can delete cost_items" on cost_items for delete to authenticated using (true);

-- monthly_cost_entries policies
create policy "Authenticated users can read monthly_cost_entries" on monthly_cost_entries for select to authenticated using (true);
create policy "Authenticated users can insert monthly_cost_entries" on monthly_cost_entries for insert to authenticated with check (true);
create policy "Authenticated users can update monthly_cost_entries" on monthly_cost_entries for update to authenticated using (true);
create policy "Authenticated users can delete monthly_cost_entries" on monthly_cost_entries for delete to authenticated using (true);

-- monthly_cost_locks policies
create policy "Authenticated users can read monthly_cost_locks" on monthly_cost_locks for select to authenticated using (true);
create policy "Authenticated users can insert monthly_cost_locks" on monthly_cost_locks for insert to authenticated with check (true);
create policy "Authenticated users can update monthly_cost_locks" on monthly_cost_locks for update to authenticated using (true);
create policy "Authenticated users can delete monthly_cost_locks" on monthly_cost_locks for delete to authenticated using (true);

-- ============================================
-- Updated_at triggers
-- ============================================
create trigger trg_cost_categories_updated_at before update on cost_categories
  for each row execute function update_updated_at();

create trigger trg_cost_items_updated_at before update on cost_items
  for each row execute function update_updated_at();

create trigger trg_monthly_cost_entries_updated_at before update on monthly_cost_entries
  for each row execute function update_updated_at();

-- ============================================
-- Data migration from fixed_costs
-- ============================================

-- Map fixed_costs categories to descriptive names
insert into cost_categories (name, sort_order)
values
  ('Rekstur (mánaðarlegur)', 1),
  ('Markaðssetning - fast', 2),
  ('Markaðssetning - breytilegur', 3);

-- Migrate fixed_costs items into cost_items
-- We use a CTE to map old category strings to new category UUIDs
with category_map as (
  select id, name,
    case name
      when 'Rekstur (mánaðarlegur)' then 'operations'
      when 'Markaðssetning - fast' then 'marketing_fixed'
      when 'Markaðssetning - breytilegur' then 'marketing_variable'
    end as old_category
  from cost_categories
),
-- Also handle any custom categories from fixed_costs
custom_cats as (
  select distinct fc.category
  from fixed_costs fc
  where fc.category not in ('operations', 'marketing_fixed', 'marketing_variable')
),
inserted_custom as (
  insert into cost_categories (name, sort_order)
  select cc.category, 10 + row_number() over (order by cc.category)
  from custom_cats cc
  returning id, name
),
all_cats as (
  select id, old_category as map_key from category_map where old_category is not null
  union all
  select id, name as map_key from inserted_custom
),
inserted_items as (
  insert into cost_items (category_id, name, vsk_percent, sort_order)
  select
    ac.id,
    fc.name,
    fc.vsk_percent,
    row_number() over (partition by fc.category order by fc.name)::integer
  from fixed_costs fc
  join all_cats ac on ac.map_key = fc.category
  returning id, category_id, name
)
-- Create monthly_cost_entries for current month
insert into monthly_cost_entries (cost_item_id, month, budget_amount, actual_amount)
select
  ii.id,
  to_char(now(), 'YYYY-MM'),
  fc.monthly_amount,
  fc.monthly_amount
from inserted_items ii
join cost_items ci on ci.id = ii.id
join fixed_costs fc on fc.name = ii.name
  and fc.category in (
    select map_key from (
      select old_category as map_key from category_map where old_category is not null
      union all
      select name as map_key from inserted_custom
    ) sub
  );

-- NOTE: fixed_costs table is kept as backup, not dropped
