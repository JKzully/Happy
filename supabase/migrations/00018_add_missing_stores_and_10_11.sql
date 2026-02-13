-- Add stores that were missing from seed: Neskaupsstaður, Barónsstígur, 10-11 Austurstræti
DO $$
DECLARE
  v_samkaup uuid;
BEGIN
  SELECT id INTO v_samkaup FROM retail_chains WHERE slug = 'samkaup';

  INSERT INTO stores (chain_id, name, sub_chain_type) VALUES
    (v_samkaup, 'Neskaupsstaður', 'kjorbud'),
    (v_samkaup, 'Barónsstígur', 'extra'),
    (v_samkaup, '10-11 Austurstræti', 'netto')
  ON CONFLICT DO NOTHING;
END;
$$;
