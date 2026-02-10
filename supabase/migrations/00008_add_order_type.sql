-- Add order_type column to daily_sales to distinguish one-time purchases from subscriptions
alter table daily_sales add column order_type text not null default 'one_time';

-- Drop old unique index (date, store_id, product_id)
drop index if exists idx_daily_sales_unique;

-- Create new unique index that includes order_type
create unique index idx_daily_sales_unique on daily_sales (date, store_id, product_id, order_type);
