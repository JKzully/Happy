-- Create "Auglýsingar" cost category with Meta and Google items.
-- Actual amounts are auto-filled from daily_ad_spend table by the app.
DO $$
DECLARE
  cat_id uuid;
BEGIN
  INSERT INTO cost_categories (name, sort_order)
  VALUES ('Auglýsingar (daglegt)', 99)
  RETURNING id INTO cat_id;

  INSERT INTO cost_items (category_id, name, sort_order, vsk_percent)
  VALUES
    (cat_id, 'Meta', 1, 0),
    (cat_id, 'Google', 2, 0);
END $$;
