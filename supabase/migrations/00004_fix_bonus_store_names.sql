-- ============================================
-- Fix Bónus store names to match official Excel reports
-- ============================================

DO $$
DECLARE
  v_bonus uuid;
BEGIN
  SELECT id INTO v_bonus FROM retail_chains WHERE slug = 'bonus';

  -- Fix misspelled / outdated names
  UPDATE stores SET name = 'Mosfellsbær'      WHERE chain_id = v_bonus AND name = 'Mosfellsvegur';
  UPDATE stores SET name = 'Tjarnarvellir'     WHERE chain_id = v_bonus AND name = 'Tjarnarvegur';
  UPDATE stores SET name = 'Vestmannaeyjar'    WHERE chain_id = v_bonus AND name = 'Vestmanneyjar';
  UPDATE stores SET name = 'Naustahverfi AK'   WHERE chain_id = v_bonus AND name = 'Naustavegur';
  UPDATE stores SET name = 'Nýbýlavegur'       WHERE chain_id = v_bonus AND name = 'Nýbílavegur';
  UPDATE stores SET name = 'Norðurtorg AK'     WHERE chain_id = v_bonus AND name = 'Norðurvegur';
  UPDATE stores SET name = 'Norðlingabraut'    WHERE chain_id = v_bonus AND name = 'Norðlingaholt';
END;
$$;
