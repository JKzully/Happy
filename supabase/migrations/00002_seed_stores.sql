-- ============================================
-- Seed retail_chains and stores
-- ============================================

DO $$
DECLARE
  v_kronan  uuid;
  v_bonus   uuid;
  v_hagkaup uuid;
  v_samkaup uuid;
BEGIN
  -- Insert retail chains (upsert on slug)
  INSERT INTO retail_chains (name, slug) VALUES ('Krónan', 'kronan')
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_kronan;

  INSERT INTO retail_chains (name, slug) VALUES ('Bónus', 'bonus')
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_bonus;

  INSERT INTO retail_chains (name, slug) VALUES ('Hagkaup', 'hagkaup')
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_hagkaup;

  INSERT INTO retail_chains (name, slug) VALUES ('Samkaup', 'samkaup')
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_samkaup;

  -- ==========================================
  -- Krónan (26 stores)
  -- ==========================================
  INSERT INTO stores (chain_id, name) VALUES
    (v_kronan, 'Akrabraut'),
    (v_kronan, 'Akranes'),
    (v_kronan, 'Akureyri'),
    (v_kronan, 'Árbær'),
    (v_kronan, 'Austurver'),
    (v_kronan, 'Bíldshöfði'),
    (v_kronan, 'Borgartún'),
    (v_kronan, 'Fitjum'),
    (v_kronan, 'Flatahraun'),
    (v_kronan, 'Grafarholt'),
    (v_kronan, 'Grandi'),
    (v_kronan, 'Hallveigarstígur'),
    (v_kronan, 'Hamraborg'),
    (v_kronan, 'Hvaleyrarbraut'),
    (v_kronan, 'Hvolsvöllur'),
    (v_kronan, 'Jafnaseli'),
    (v_kronan, 'Lindur'),
    (v_kronan, 'Mosfellsbær'),
    (v_kronan, 'Norðurhella'),
    (v_kronan, 'Reyðarfjörður'),
    (v_kronan, 'Selfoss'),
    (v_kronan, 'Skeifan'),
    (v_kronan, 'Vallakór'),
    (v_kronan, 'Vestmanneyjar'),
    (v_kronan, 'Vík'),
    (v_kronan, 'Þorlákshöfn')
  ON CONFLICT DO NOTHING;

  -- ==========================================
  -- Bónus (33 stores)
  -- ==========================================
  INSERT INTO stores (chain_id, name) VALUES
    (v_bonus, 'Akranes'),
    (v_bonus, 'Akureyri'),
    (v_bonus, 'Borgarnes'),
    (v_bonus, 'Egilsstaðir'),
    (v_bonus, 'Fiskislóð'),
    (v_bonus, 'Garðabær'),
    (v_bonus, 'Garðatorg'),
    (v_bonus, 'Grafarvogur'),
    (v_bonus, 'Hafnarfjörður'),
    (v_bonus, 'Hólagarður'),
    (v_bonus, 'Holtagarðar'),
    (v_bonus, 'Hraunbær'),
    (v_bonus, 'Hveragerði'),
    (v_bonus, 'Ísafjörður'),
    (v_bonus, 'Keflavík'),
    (v_bonus, 'Kringlan'),
    (v_bonus, 'Laugavegur'),
    (v_bonus, 'Miðhraun'),
    (v_bonus, 'Mosfellsvegur'),
    (v_bonus, 'Naustavegur'),
    (v_bonus, 'Njarðvík'),
    (v_bonus, 'Norðlingaholt'),
    (v_bonus, 'Norðurvegur'),
    (v_bonus, 'Nýbílavegur'),
    (v_bonus, 'Ögurhvarf'),
    (v_bonus, 'Selfoss'),
    (v_bonus, 'Skeifan'),
    (v_bonus, 'Skipholt'),
    (v_bonus, 'Skútuvogur'),
    (v_bonus, 'Smáratorg'),
    (v_bonus, 'Stykkishólmur'),
    (v_bonus, 'Tjarnarvegur'),
    (v_bonus, 'Vestmanneyjar')
  ON CONFLICT DO NOTHING;

  -- ==========================================
  -- Hagkaup (7 stores)
  -- ==========================================
  INSERT INTO stores (chain_id, name) VALUES
    (v_hagkaup, 'Skeifan'),
    (v_hagkaup, 'Akureyri'),
    (v_hagkaup, 'Smáralind'),
    (v_hagkaup, 'Eiðistorg'),
    (v_hagkaup, 'Spöng'),
    (v_hagkaup, 'Garðatorg'),
    (v_hagkaup, 'Kringlan')
  ON CONFLICT DO NOTHING;

  -- ==========================================
  -- Samkaup — Nettó (21 stores)
  -- ==========================================
  INSERT INTO stores (chain_id, name, sub_chain_type) VALUES
    (v_samkaup, 'Austurvegur', 'netto'),
    (v_samkaup, 'Borgarnes', 'netto'),
    (v_samkaup, 'Egilsstaðir', 'netto'),
    (v_samkaup, 'Enghjalli', 'netto'),
    (v_samkaup, 'Eyravegur', 'netto'),
    (v_samkaup, 'Glerártorg', 'netto'),
    (v_samkaup, 'Glæsibær', 'netto'),
    (v_samkaup, 'Grandi', 'netto'),
    (v_samkaup, 'Hörnafjörður', 'netto'),
    (v_samkaup, 'Hrísalundur', 'netto'),
    (v_samkaup, 'Húsavík', 'netto'),
    (v_samkaup, 'Iðavöllum', 'netto'),
    (v_samkaup, 'Ísafjörður', 'netto'),
    (v_samkaup, 'Krossmói', 'netto'),
    (v_samkaup, 'Lágmúli', 'netto'),
    (v_samkaup, 'Miðvangi', 'netto'),
    (v_samkaup, 'Mjódd', 'netto'),
    (v_samkaup, 'Mosfellsbær', 'netto'),
    (v_samkaup, 'Salavegur', 'netto'),
    (v_samkaup, 'Selhella', 'netto'),
    (v_samkaup, 'Seljabraut', 'netto')
  ON CONFLICT DO NOTHING;

  -- ==========================================
  -- Samkaup — Kjörbúðir (19 stores)
  -- ==========================================
  INSERT INTO stores (chain_id, name, sub_chain_type) VALUES
    (v_samkaup, 'Vesturbær', 'kjorbud'),
    (v_samkaup, 'Hafnarfjörður', 'kjorbud'),
    (v_samkaup, 'Seltjarnarnes', 'kjorbud'),
    (v_samkaup, 'Grafarvogur', 'kjorbud'),
    (v_samkaup, 'Garðabær', 'kjorbud'),
    (v_samkaup, 'Kópavogur', 'kjorbud'),
    (v_samkaup, 'Selfoss', 'kjorbud'),
    (v_samkaup, 'Akureyri', 'kjorbud'),
    (v_samkaup, 'Dalvík', 'kjorbud'),
    (v_samkaup, 'Ólafsvík', 'kjorbud'),
    (v_samkaup, 'Siglufjörður', 'kjorbud'),
    (v_samkaup, 'Hveragerði', 'kjorbud'),
    (v_samkaup, 'Þorlákshöfn', 'kjorbud'),
    (v_samkaup, 'Ísafjörður', 'kjorbud'),
    (v_samkaup, 'Húsavík', 'kjorbud'),
    (v_samkaup, 'Egilsstaðir', 'kjorbud'),
    (v_samkaup, 'Vík', 'kjorbud'),
    (v_samkaup, 'Neskaupsstaður', 'kjorbud'),
    (v_samkaup, 'Blönduós', 'kjorbud')
  ON CONFLICT DO NOTHING;

  -- ==========================================
  -- Samkaup — Iceland (1 store)
  -- ==========================================
  INSERT INTO stores (chain_id, name, sub_chain_type) VALUES
    (v_samkaup, 'Hafnarfjörður', 'iceland')
  ON CONFLICT DO NOTHING;

  -- ==========================================
  -- Samkaup — Extra (2 stores)
  -- ==========================================
  INSERT INTO stores (chain_id, name, sub_chain_type) VALUES
    (v_samkaup, 'Barónsstígur', 'extra'),
    (v_samkaup, 'Keflavík', 'extra')
  ON CONFLICT DO NOTHING;

  -- ==========================================
  -- Samkaup — Krambúð (1 store)
  -- ==========================================
  INSERT INTO stores (chain_id, name, sub_chain_type) VALUES
    (v_samkaup, 'Skólavörðustígur', 'krambud')
  ON CONFLICT DO NOTHING;

END;
$$;
