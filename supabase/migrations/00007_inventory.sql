-- ============================================
-- HCE Dashboard - Inventory
-- ============================================

create table inventory (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products (id) on delete cascade,
  location_type text not null check (location_type in ('warehouse', 'store')),
  location_name text not null,
  chain_slug text,
  quantity_boxes integer not null default 0,
  updated_at timestamptz not null default now()
);

create unique index idx_inventory_product_location
  on inventory (product_id, location_type, location_name);

create index idx_inventory_product_id on inventory (product_id);

-- RLS
alter table inventory enable row level security;

create policy "Authenticated users can read inventory"
  on inventory for select to authenticated using (true);
create policy "Authenticated users can insert inventory"
  on inventory for insert to authenticated with check (true);
create policy "Authenticated users can update inventory"
  on inventory for update to authenticated using (true);
create policy "Authenticated users can delete inventory"
  on inventory for delete to authenticated using (true);

-- Reuse existing trigger function
create trigger trg_inventory_updated_at before update on inventory
  for each row execute function update_updated_at();
