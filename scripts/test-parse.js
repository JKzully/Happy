const XLSX = require('xlsx');

const wb = XLSX.readFile('C:/Users/solvi/Downloads/Sala birgja.xlsx');

const sheetName = wb.SheetNames.find(n => n.toLowerCase() === 'verslanir');
console.log('Sheet found:', sheetName);

const ws = wb.Sheets[sheetName];
const rawData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

console.log('Total rows:', rawData.length);
console.log('Header row:', JSON.stringify(rawData[0]));

// Check isSalaBirgjaFormat
const first = String(rawData[0][0] || '').trim().toLowerCase();
console.log('First cell (lowercase):', JSON.stringify(first));
console.log('Starts with verslun?', first === 'verslun' || first.startsWith('verslun'));

// Check date detection in header
for (let c = 0; c < rawData[0].length; c++) {
  const val = String(rawData[0][c] || '');
  const m = val.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  console.log(`Col ${c}: ${JSON.stringify(val)} -> date match: ${m ? m[0] : 'none'}`);
}

// Show first 5 data rows
console.log('\nFirst 5 data rows:');
for (let i = 1; i <= 5 && i < rawData.length; i++) {
  console.log(`Row ${i}:`, JSON.stringify(rawData[i]));
}
