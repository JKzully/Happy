-- Prevent duplicate product names
ALTER TABLE products ADD CONSTRAINT products_name_unique UNIQUE (name);
