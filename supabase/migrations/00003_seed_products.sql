-- ============================================
-- Seed products
-- ============================================

INSERT INTO products (name, category, production_cost, sticks_per_box) VALUES
  ('Lemon Lane', 'hydration', 280, 10),
  ('Mixed Berries', 'hydration', 280, 10),
  ('Pina Colada', 'hydration', 280, 10),
  ('Peach', 'hydration', 280, 10),
  ('Peru', 'hydration', 280, 10),
  ('Creatine Mixed', 'creatine', 660, 20),
  ('Creatine Lemon', 'creatine', 660, 20),
  ('Energy Kiwi', 'energy', 280, 10),
  ('Jólabragð', 'hydration', 280, 10),
  ('Krakka Happy', 'kids', 260, 8),
  ('Kids Green Apple Kiwi', 'kids', 260, 8),
  ('Kids Mixed Berry', 'kids', 260, 8)
ON CONFLICT DO NOTHING;
