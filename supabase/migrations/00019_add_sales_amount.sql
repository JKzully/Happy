-- Add sales_amount column to daily_sales (nullable — only Krónan provides this)
ALTER TABLE daily_sales ADD COLUMN sales_amount numeric(10, 2);
