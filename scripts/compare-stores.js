const excelStores = [
  'Hafnarfjörður', 'Fiskislóð / Nes', 'Holtagarðar', 'Grafarvogur',
  'Ísafjörður', 'Laugavegur', 'Mosfellsbær', 'Akureyri',
  'Hveragerði', 'Selfoss', 'Kringlan', 'Smáratorg',
  'Borgarnes', 'Egilsstaðir', 'Njarðvík', 'Hraunbær',
  'Hólagarður', 'Tjarnarvellir', 'Ögurhvarf', 'Akranes',
  'Garðabær', 'Naustahverfi AK', 'Nýbýlavegur', 'Skipholt',
  'Keflavík', 'Vestmannaeyjar', 'Skeifan', 'Garðatorg',
  'Norðurtorg AK', 'Norðlingabraut', 'Miðhraun'
];

const dbStores = [
  'Akranes', 'Akureyri', 'Borgarnes', 'Egilsstaðir',
  'Fiskislóð', 'Garðabær', 'Garðatorg', 'Grafarvogur',
  'Hafnarfjörður', 'Hólagarður', 'Holtagarðar', 'Hraunbær',
  'Hveragerði', 'Ísafjörður', 'Keflavík', 'Kringlan',
  'Laugavegur', 'Miðhraun', 'Mosfellsvegur', 'Naustavegur',
  'Njarðvík', 'Norðlingaholt', 'Norðurvegur', 'Nýbílavegur',
  'Ögurhvarf', 'Selfoss', 'Skeifan', 'Skipholt',
  'Skútuvogur', 'Smáratorg', 'Stykkishólmur', 'Tjarnarvegur',
  'Vestmanneyjar'
];

console.log("=== Excel stores (from Bónus report) ===");
console.log("Count:", excelStores.length);

console.log("\n=== DB stores ===");
console.log("Count:", dbStores.length);

console.log("\n=== Name mismatches (Excel -> likely DB match) ===");
const mapping = {
  'Fiskislóð / Nes': 'Fiskislóð',
  'Mosfellsbær': 'Mosfellsvegur (?)',
  'Tjarnarvellir': 'Tjarnarvegur (?)',
  'Vestmannaeyjar': 'Vestmanneyjar',
  'Naustahverfi AK': 'Naustavegur (?)',
  'Nýbýlavegur': 'Nýbílavegur (?)',
  'Norðurtorg AK': 'Norðurvegur (?)',
  'Norðlingabraut': 'Norðlingaholt (?)',
};
for (const [excel, db] of Object.entries(mapping)) {
  console.log(`  ${excel} -> ${db}`);
}

console.log("\n=== DB stores NOT in Excel (possibly inactive) ===");
const excelNorm = excelStores.map(s => s.toLowerCase().split(' ')[0].split('/')[0].trim());
dbStores.forEach(d => {
  const dNorm = d.toLowerCase();
  const found = excelNorm.some(e => dNorm.startsWith(e) || e.startsWith(dNorm.slice(0, 4)));
  if (found === false) console.log("  ", d);
});
