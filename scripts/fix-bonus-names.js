const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cjdcxzdjdmycanhkgphp.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const renames = [
  ['Mosfellsvegur', 'Mosfellsbær'],
  ['Tjarnarvegur', 'Tjarnarvellir'],
  ['Vestmanneyjar', 'Vestmannaeyjar'],
  ['Naustavegur', 'Naustahverfi AK'],
  ['Nýbílavegur', 'Nýbýlavegur'],
  ['Norðurvegur', 'Norðurtorg AK'],
  ['Norðlingaholt', 'Norðlingabraut'],
];

async function run() {
  // Get bonus chain id
  const { data: chain, error: chainErr } = await supabase
    .from('retail_chains')
    .select('id')
    .eq('slug', 'bonus')
    .single();

  if (chainErr) { console.error('Chain error:', chainErr); return; }
  console.log('Bonus chain id:', chain.id);

  // List current stores
  const { data: stores } = await supabase
    .from('stores')
    .select('id, name')
    .eq('chain_id', chain.id)
    .order('name');

  console.log('\nCurrent stores (' + stores.length + '):');
  stores.forEach(s => console.log('  ' + s.name));

  // Rename each
  console.log('\nRenaming...');
  for (const [oldName, newName] of renames) {
    const store = stores.find(s => s.name === oldName);
    if (!store) {
      console.log('  SKIP: "' + oldName + '" not found');
      continue;
    }
    const { error } = await supabase
      .from('stores')
      .update({ name: newName })
      .eq('id', store.id);

    if (error) {
      console.log('  ERROR: ' + oldName + ' -> ' + newName + ':', error.message);
    } else {
      console.log('  OK: ' + oldName + ' -> ' + newName);
    }
  }

  // Verify
  const { data: updated } = await supabase
    .from('stores')
    .select('id, name')
    .eq('chain_id', chain.id)
    .order('name');

  console.log('\nUpdated stores (' + updated.length + '):');
  updated.forEach(s => console.log('  ' + s.name));
}

run();
