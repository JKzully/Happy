const XLSX = require('xlsx');
const fs = require('fs');

// Simulate the parser logic
const skuToProduct = {
  "HHLL002": { productId: "lemon-lane", name: "Lemon Lane" },
  "HHMB002": { productId: "mixed-berries", name: "Mixed Berries" },
  "HHPC002": { productId: "pina-colada", name: "Pina Colada" },
  "HHPE002": { productId: "peru", name: "Peru" },
  "HHPA002": { productId: "peach", name: "Peach" },
  "HHCMB002": { productId: "creatine-mixed", name: "Creatine Mixed" },
  "HHCLL002": { productId: "creatine-lemon", name: "Creatine Lemon" },
  "HHEAK002": { productId: "energy-kiwi", name: "Energy Kiwi" },
  "HHPH002": { productId: "peach", name: "Peach" },
  "HHKAK002": { productId: "krakka-green-apple-kiwi", name: "Kids Green Apple Kiwi" },
  "HHKMB002": { productId: "krakka-mixed-berry", name: "Kids Mixed Berry" },
  "HHJJ002": { productId: "jolabragd", name: "Jolabragd" },
  "HHJ002": { productId: "jolabragd", name: "Jolabragd" },
};

const buf = fs.readFileSync('C:/Users/solvi/Downloads/Sala birgja.xlsx');
const workbook = XLSX.read(buf, { type: 'buffer' });

const sheetName = workbook.SheetNames.find(n => n.toLowerCase() === 'verslanir');
const sheet = workbook.Sheets[sheetName];
const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

const header = rawData[0];

// Find date
let date = '';
let dateColIndex = -1;
for (let c = 0; c < header.length; c++) {
  const val = String(header[c] || '');
  const m = val.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (m) {
    const [, day, month, year] = m;
    date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    dateColIndex = c;
    break;
  }
}
console.log('Date:', date, 'from col:', dateColIndex);

// Parse rows
const rows = [];
const warnings = [];
let currentStore = '';

for (let i = 1; i < rawData.length; i++) {
  const row = rawData[i];
  if (!row || row.length < 4) { continue; }

  const colA = String(row[0] || '').trim();
  if (colA) {
    currentStore = colA.replace(/^\d+\s*-\s*/, '').trim();
  }
  if (!currentStore) continue;

  const colC = String(row[2] || '');
  if (colC.includes('alls:') || colC === 'Total' || colC.toLowerCase() === 'total') continue;

  const sku = String(row[3] || '').trim().toUpperCase();
  if (!sku) continue;

  const qtyCol = dateColIndex >= 0 ? dateColIndex : 4;
  const qtyVal = row[qtyCol];
  const qty = typeof qtyVal === 'number' ? qtyVal : parseInt(String(qtyVal), 10);
  if (!qty || isNaN(qty)) {
    warnings.push(`Zero qty: ${sku} in ${currentStore}`);
    continue;
  }

  const product = skuToProduct[sku];
  if (!product) {
    warnings.push(`Unknown SKU: ${sku}`);
  }

  rows.push({
    date,
    storeName: currentStore,
    sku,
    productName: product ? product.name : sku,
    quantity: qty,
  });
}

console.log('\nParsed rows:', rows.length);
console.log('Unique stores:', new Set(rows.map(r => r.storeName)).size);
console.log('Total boxes:', rows.reduce((s, r) => s + r.quantity, 0));
console.log('Warnings:', warnings);

console.log('\nFirst 10 rows:');
rows.slice(0, 10).forEach((r, i) => console.log(i, r));

console.log('\nAll stores:');
const stores = [...new Set(rows.map(r => r.storeName))];
stores.forEach(s => console.log(' ', s));
