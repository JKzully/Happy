-- Add missing Samkaup stores found in Excel but not in DB

DO $$
DECLARE
  v_samkaup uuid;
BEGIN
  SELECT id INTO v_samkaup FROM retail_chains WHERE slug = 'samkaup';

  -- Nettó: 1 missing store
  INSERT INTO stores (chain_id, name, sub_chain_type) VALUES
    (v_samkaup, 'Nóatún', 'netto')
  ON CONFLICT DO NOTHING;

  -- Kjörbúðir: 12 missing stores
  INSERT INTO stores (chain_id, name, sub_chain_type) VALUES
    (v_samkaup, 'Bolungarvík', 'kjorbud'),
    (v_samkaup, 'Djúpivogur', 'kjorbud'),
    (v_samkaup, 'Eskifjörður', 'kjorbud'),
    (v_samkaup, 'Fáskrúðsfjörður', 'kjorbud'),
    (v_samkaup, 'Garður', 'kjorbud'),
    (v_samkaup, 'Grundarfjörður', 'kjorbud'),
    (v_samkaup, 'Hella', 'kjorbud'),
    (v_samkaup, 'Ólafsfjörður', 'kjorbud'),
    (v_samkaup, 'Sandgerði', 'kjorbud'),
    (v_samkaup, 'Seyðisfjörður', 'kjorbud'),
    (v_samkaup, 'Skagaströnd', 'kjorbud'),
    (v_samkaup, 'Þórshöfn', 'kjorbud')
  ON CONFLICT DO NOTHING;
END;
$$;
