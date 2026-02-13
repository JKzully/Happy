-- Fix: Keflavík Samkaup store was seeded as 'extra' but is actually 'kjorbud' (Kjörbuðin)
UPDATE stores
SET sub_chain_type = 'kjorbud'
WHERE name = 'Keflavík'
  AND sub_chain_type = 'extra'
  AND chain_id = (SELECT id FROM retail_chains WHERE slug = 'samkaup');
