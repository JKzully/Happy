/**
 * One-time import script: Feb 1-9 2026 sales data from Excel into daily_sales.
 * Parses per-store, per-product data from Bónus, Krónan, Samkaup, Hagkaup sheets.
 *
 * Usage: node scripts/import-feb-sales.mjs [--dry-run]
 */

import { readFileSync } from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const SUPABASE_URL = "https://cjdcxzdjdmycanhkgphp.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqZGN4emRqZG15Y2FuaGtncGhwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDU0NjcxMywiZXhwIjoyMDg2MTIyNzEzfQ._rYiRxQYc79wjseGmiGEWPEERQJxUb_kqC-dvFSGLNQ";

const DRY_RUN = process.argv.includes("--dry-run");

const EXCEL_PATH =
  "C:/Users/solvi/Downloads/Sölugreining 2026 - Hydrate,Creatine,Energy  (1).xlsx";

// Feb 1-9 2026 serial range
const FEB_START = 46054; // Feb 1 2026
const FEB_END = 46062; // Feb 9 2026

// ── Product mapping (Excel name → DB product ID) ──
const PRODUCT_MAP = {
  // Hydration
  "lemon lime": "f2824f86-6520-4d74-93fc-b2c276cfa2d3",
  "mixed berries": "03a1fb86-9b0d-41f0-b3ed-a0e9bbd70926",
  "pina colada": "cfd04418-a8e2-4e6c-81c1-081362c6e366",
  peach: "a2510acc-d694-4286-a4c7-3e4eb432cd7f",
  peru: "8883b09d-d85f-4a18-9c54-f41feda44ff0",
  jóla: "54fbe72f-a436-4229-a711-7106e09361e0",
  jólabragð: "54fbe72f-a436-4229-a711-7106e09361e0",
  joli: "54fbe72f-a436-4229-a711-7106e09361e0",
  // Creatine
  "crea mixed": "f4ab654b-2144-42bf-af68-408fb9cc810e",
  "creatine mixed": "f4ab654b-2144-42bf-af68-408fb9cc810e",
  "crea lemon": "48bfadc9-6011-4f9d-b981-91df04e69064",
  "creatine lemon": "48bfadc9-6011-4f9d-b981-91df04e69064",
  // Energy
  energy: "e16e3ca2-107d-4844-a7f4-fe5982388c73",
  "energy kiwi": "e16e3ca2-107d-4844-a7f4-fe5982388c73",
};

// ── Store mappings per chain (Excel column index → DB store ID) ──

const BONUS_STORES = {
  3: "78d225dd-791b-4d31-9ad1-a567a19605fb", // Akranes
  4: "10d8be7d-2487-415f-8ceb-e75d03403c08", // Akureyri
  5: "b7aec534-fb77-4ec6-824a-20abba498623", // Borgarnes
  6: "d7cab6e0-d534-4454-ba7b-d263a33fc4e4", // Egilsstaðir
  7: "91c0256a-87f3-4d74-b114-09f61a25c66c", // Fiskislóð
  8: "eeb4223c-a2d8-48fc-b9da-398b1dc691b0", // Garðabær
  9: "208ac94f-daca-4088-a12a-c67f83020a30", // Garðatorg
  10: "51bdc4f4-d773-44e8-a428-5fc9c96f26ba", // Grafarvogur
  11: "d6b6d1a6-41d3-4d83-9baa-12bc87213b0c", // Hafnarfjörður
  12: "885388eb-4b3f-4e6b-9a65-62bcea8eee5b", // Hólagarður
  13: "41ec5e09-ec1d-4ecc-937d-41b55e7f9c6c", // Holtagarðar
  14: "1d164eac-5e9b-41c8-b291-82980a9bae5f", // Hraunbær
  15: "73e82b44-314c-445b-955b-875200c7f78a", // Hveragerði
  16: "02c1ff5a-44d3-4cab-8dae-ff5dfab16d19", // Ísafjörður
  17: "72f46206-ecc8-4651-bb16-facaeeda35ce", // Keflavík
  18: "987276d1-093b-4356-95e8-1be15c2531bd", // Kringlan
  19: "c3dc1b08-39cf-4915-9168-52dabdc5689c", // Laugavegur
  20: "dba30a0d-854b-4db8-ad80-416b27160ffb", // Miðhraun
  21: "e68b5125-47e0-44e3-889d-fb9537f4f607", // Mosfellsbær
  22: "8f0d96c4-c2fe-49a8-8e53-df2461ec3cda", // Naustahverfi AK
  23: "2eac8da7-2806-4b2a-8338-f6fc7b292b19", // Njarðvík
  24: "00377204-f353-492b-9104-e1ad75d9a1fc", // Norðlingabraut
  25: "26c2631f-b719-440f-b4ca-21b0fdccb363", // Norðurtorg AK
  26: "d8102277-4e96-4a83-bc5a-a18d4067929c", // Nýbýlavegur
  27: "5f1f8701-1f3f-4866-9950-36818af3db44", // Ögurhvarf
  28: "305b705b-f912-4917-954e-19057a202986", // Selfoss
  29: "ef7a04ef-d2eb-4d4f-87e1-a3c99b591d73", // Skeifan
  30: "9743324f-b7ef-456d-a1f4-2f064d08a24c", // Skipholt
  31: "a0e27ea4-6dcb-4be0-b400-676ea2be08f3", // Skútuvogur
  32: "2073b81a-be37-48cd-b5a8-1e3dc75b1136", // Smáratorg
  33: "a70f8163-e211-4e41-8473-428dba787a66", // Stykkishólmur
  34: "23d063e1-ad18-4783-be58-b39b0b2e672d", // Tjarnarvellir
  35: "2d4dc17e-c5ad-4ff1-b286-811de3300a6a", // Vestmannaeyjar
};

const KRONAN_STORES = {
  4: "d12c925d-f7e4-41d9-9c85-f2410727a4f8", // Akrabraut
  5: "73cacdd7-5037-4b42-a5d1-6da3d85aacc2", // Akranes
  6: "34eb4a0b-5ef3-425a-a437-627333e79a31", // Akureyri
  7: "c9a36f5e-22fa-4d6a-b5b9-4433bd430de2", // Árbær
  8: "47561fc6-a042-47f8-bf43-42b6467ea207", // Austurver
  9: "25821242-dd25-4b1d-a20c-53c19e073eda", // Bíldshöfði
  10: "fdf70839-084a-42d8-bc39-9029bffeaaa7", // Borgartún
  11: "3a700058-0e8e-4cf2-a188-41941b08b118", // Fitjum
  12: "f3aebb58-b023-4175-a94e-fd1f88957265", // Flatahraun
  13: "766af4a5-0dc3-41fa-a54b-2056c24ef0c8", // Grafarholt
  14: "b2ff4a18-778b-4bd6-a6c3-a3994e6b15eb", // Grandi
  15: "8991143b-5f86-4e51-bb2f-fcaed2b3b7dc", // Hallveigarstígur
  16: "e7915022-aef8-43ae-a74a-5eea8970a454", // Hamraborg
  17: "0fa074c9-2835-4f1c-8977-2abd8e293cd7", // Hvaleyrarbraut
  18: "99d614be-c779-4c53-b763-7bf35af2277b", // Hvolsvöllur
  19: "c9e1c24e-f151-44f2-b499-3e5094671c99", // Jafnaseli
  20: "542078cd-a3d7-46ca-87af-760341e799c4", // Lindur
  21: "de60ba06-a5aa-408e-b4f4-5870b0fcb8b5", // Mosfellsbær
  22: "230474f9-002c-4d0f-b66b-b70a749c6ded", // Norðurhella
  23: "9618e18b-6cd0-4904-9e09-5967aad90f6c", // Reyðarfjörður
  24: "49e4a510-2bb5-4d50-be0e-fd2dcdc06a92", // Selfoss
  25: "17857001-87b4-4178-85d4-337754e45ffb", // Skeifan
  26: "825add34-9100-49d3-8cc1-ad93b07b00bc", // Vallakór
  27: "b3c7f5f8-50fd-4721-9a11-d90bf13f956a", // Vestmanneyjar
  28: "654d63b0-e203-4c7d-8dfe-20147cbb776e", // Vík
  29: "12524930-d1e1-49ec-8bbd-f9c5dce37411", // Þorlákshöfn
};

const HAGKAUP_STORES = {
  3: "974fd9ac-cee8-48b8-a465-4d15d9f15ed4", // Skeifan
  4: "e3c46fc3-8508-4b45-9007-c7f263e9c0c3", // Akureyri
  5: "ff62d5b8-4d6d-4f60-8681-4f3912338310", // Smáralind
  6: "26114842-4155-444a-bdb0-0c0017e5e642", // Eiðistorg
  7: "e818066d-1a40-40c4-9881-16de76d128a2", // Spöng
  8: "98f8c845-73e1-4809-8176-bf8a3f474f25", // Garðatorg
  9: "13276979-330d-41f7-aadb-21de4590893b", // Kringlan
};

const SAMKAUP_STORES = {
  5: "42937b27-8c87-4333-baeb-d72e3364babb", // Iceland Hafnarfjörður
  6: "2f68db39-15dc-4a6b-8805-b8f32b0427a1", // Extra Barónsstígur
  7: "588bc613-4ebf-4c6a-89d9-e253ec2bc3ba", // Extra Keflavík
  8: "5d19f787-7f9f-48dd-9dc5-5c4ac6339538", // Kjörbúð Blönduós
  // 9: skip - Bolungarvík not in DB
  10: "4f1a3907-1653-42f0-9284-15a196c8cc54", // Kjörbúð Dalvík
  11: "af4e557d-ef9d-40fa-964f-448bb8f69e90", // Kjörbúð Djúpavogi
  // 12: skip - Eskifjörður not in DB
  // 13: skip - Fáskrúðsfjörður not in DB
  14: "aaaf4e08-f6ad-4613-bf16-41b3eb543510", // Kjörbúð Garðabær
  15: "addea44c-14bf-4771-9079-641bf50d1a7b", // Kjörbúð Grundarfirði
  // 16: skip - Hella not in DB
  17: "7feca65f-6ca0-4348-9c08-0f1b9f82b147", // Kjörbúð Neskaupstað
  18: "5c7b1ba1-c8ce-4445-b11c-5762c2830492", // Kjörbúð Ólafsvík
  // 19: skip - Sandgerði not in DB
  // 20: skip - Seyðisfjörður not in DB
  21: "b13193de-e513-47a9-905d-6448936cb960", // Kjörbúð Siglufjörður
  // 22: skip - Skagaströnd not in DB
  23: "260d6141-f2a4-4cf2-a3d3-981de348d867", // Kjörbúð Þórshöfn
  // 24: skip - Krambúð not in DB
  25: "6f0cd0ea-0db0-46a7-9f2d-b2dbe784c95f", // Nettó Austurvegur
  26: "fc7cbf16-4fe9-41b3-856b-e0fce0e52d10", // Nettó Borgarnes
  27: "bf05a7e0-fe28-4117-99d5-b8878e03fc09", // Nettó Egilsstaðir
  28: "b60e98c6-2e25-4e55-bb8b-165517d8a5c6", // Nettó Engihjalla
  29: "1f7af241-b030-4138-933b-bbed8e3f4693", // Nettó Eyravegur
  30: "acd199c1-4fc0-42e4-972c-5d0f92122cd2", // Nettó Glerártorg
  31: "04d00eb1-e193-4dac-88ba-121dc17f7bef", // Nettó Glæsibær
  32: "e43408e9-9f21-4db0-82f1-824b72a41bef", // Nettó Grandi
  33: "b2f95e2b-5b7d-43c3-ad08-c7a0db9ddb9e", // Nettó Hornafirði
  34: "70e98105-46bd-4fd8-b598-d979e6a3d5a0", // Nettó Hrísalundur
  35: "eb30092b-9dbd-494d-b55f-893153458d18", // Nettó Húsavík
  36: "2cfe0bd9-2aa4-4934-aef5-67f28e78dc25", // Nettó Iðavöllum
  37: "b6303bfd-2076-4a44-b0a6-589469be3b2a", // Nettó Ísafjörður
  38: "8f4e1c30-08ed-4bf4-9c9a-571703fd73cb", // Nettó Krossmói
  39: "ba70bab1-4a2c-4526-89f1-a3dd49701ea3", // Nettó Lágmúli
  40: "b7b10028-b324-422d-9880-36709c25e071", // Nettó Miðvangi
  41: "ac760d5f-a3c3-4079-9883-69e3a69a9415", // Nettó Mjódd
  42: "0d34e3cd-b867-4012-a8b7-3e9a0ccb3dd3", // Nettó Mosfellsbær
  43: "392c9637-2e87-4e75-b334-5e6dc7bb67e4", // Nettó Salavegur
  44: "2ed1471c-ea00-4291-bac2-6d55523023f2", // Nettó Selhella
  45: "718bd648-530e-44db-99e4-35e03e01b446", // Nettó Seljabraut
};

// ── Helpers ──

function excelDate(serial) {
  const d = new Date((serial - 25569) * 86400000);
  return d.toISOString().split("T")[0];
}

function resolveProduct(name) {
  if (!name) return null;
  const key = name.toLowerCase().trim();
  return PRODUCT_MAP[key] || null;
}

async function supabaseQuery(table, params) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${qs}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });
  return res.json();
}

async function supabaseInsert(table, rows) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=ignore-duplicates",
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Insert failed: ${res.status} ${err}`);
  }
  return res;
}

// ── Parsing ──

/**
 * Parse a chain sheet. Each day block has N product rows.
 * @param {Array} data - sheet_to_json output (header: 1)
 * @param {number} dateCol - column index for date serial
 * @param {number} productCol - column index for product name
 * @param {Object} storeMap - { colIndex: storeId }
 * @returns {Array} rows to insert
 */
function parseChainSheet(data, dateCol, productCol, storeMap) {
  const rows = [];
  const skippedProducts = new Set();

  for (let r = 0; r < data.length; r++) {
    const row = data[r];
    if (!row) continue;

    const serial = row[dateCol];
    if (typeof serial !== "number" || serial < FEB_START || serial > FEB_END)
      continue;

    const date = excelDate(serial);
    // Adjust to 2026 (the serial already maps to 2026 dates)
    const productName = row[productCol];
    const productId = resolveProduct(productName);

    if (!productId) {
      if (
        productName &&
        !productName.toLowerCase().startsWith("samtals") &&
        !productName.toLowerCase().startsWith("kids")
      ) {
        skippedProducts.add(productName);
      }
      continue;
    }

    for (const [colStr, storeId] of Object.entries(storeMap)) {
      const col = Number(colStr);
      const qty = row[col];
      if (typeof qty !== "number" || qty <= 0) continue;

      rows.push({
        date,
        store_id: storeId,
        product_id: productId,
        quantity: qty,
        order_type: "retail",
      });
    }
  }

  if (skippedProducts.size > 0) {
    console.log("  Skipped products:", [...skippedProducts].join(", "));
  }

  return rows;
}

/**
 * Bónus: date at col 0, product at col 1, stores from col 3
 * Each day: 12 rows (product on same row as date, then 8 more products, 3 subtotals)
 */
function parseBonusSheet(data) {
  return parseChainSheet(data, 0, 1, BONUS_STORES);
}

/**
 * Krónan: date at col 0, product at col 1, stores from col 4
 * Products include Kids which we skip
 */
function parseKronanSheet(data) {
  return parseChainSheet(data, 0, 1, KRONAN_STORES);
}

/**
 * Hagkaup: date at col 0, product at col 1, stores from col 3
 */
function parseHagkaupSheet(data) {
  return parseChainSheet(data, 0, 1, HAGKAUP_STORES);
}

/**
 * Samkaup: date at col 1, product at col 2, stores from col 5
 */
function parseSamkaupSheet(data) {
  return parseChainSheet(data, 1, 2, SAMKAUP_STORES);
}

// ── Main ──

async function main() {
  console.log(DRY_RUN ? "=== DRY RUN ===" : "=== LIVE IMPORT ===");
  console.log("Reading Excel file...");

  const wb = XLSX.readFile(EXCEL_PATH);

  // Parse each chain sheet
  const allRows = [];

  for (const [sheetName, parser] of [
    ["Bónus", parseBonusSheet],
    ["Krónan", parseKronanSheet],
    ["Hagkaup", parseHagkaupSheet],
    ["Samkaup", parseSamkaupSheet],
  ]) {
    const ws = wb.Sheets[sheetName];
    if (!ws) {
      console.log(`Sheet "${sheetName}" not found, skipping.`);
      continue;
    }
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
    console.log(`\nParsing ${sheetName}...`);
    const rows = parser(data);
    console.log(`  Found ${rows.length} rows`);
    allRows.push(...rows);
  }

  console.log(`\nTotal parsed: ${allRows.length} rows`);

  // Get existing Feb data to avoid duplicates
  console.log("Fetching existing Feb data...");
  const existing = await supabaseQuery("daily_sales", {
    select: "date,store_id,product_id",
    "date": "gte.2026-02-01",
    "date": "lte.2026-02-09",
    limit: "10000",
  });

  const existingKeys = new Set();
  if (Array.isArray(existing)) {
    for (const row of existing) {
      existingKeys.add(`${row.date}|${row.store_id}|${row.product_id}`);
    }
  }
  console.log(`Existing rows: ${existingKeys.size}`);

  // Filter out duplicates
  const newRows = allRows.filter((row) => {
    const key = `${row.date}|${row.store_id}|${row.product_id}`;
    return !existingKeys.has(key);
  });

  console.log(`New rows to insert: ${newRows.length}`);
  console.log(
    `Skipped (already exist): ${allRows.length - newRows.length}`
  );

  if (newRows.length === 0) {
    console.log("Nothing to insert.");
    return;
  }

  // Show summary by date
  const byDate = {};
  for (const row of newRows) {
    byDate[row.date] = (byDate[row.date] || 0) + 1;
  }
  console.log("\nNew rows per date:");
  for (const [date, count] of Object.entries(byDate).sort()) {
    console.log(`  ${date}: ${count}`);
  }

  if (DRY_RUN) {
    console.log("\nDry run complete. Use without --dry-run to insert.");
    // Show sample rows
    console.log("\nSample rows:");
    for (const row of newRows.slice(0, 5)) {
      console.log(" ", JSON.stringify(row));
    }
    return;
  }

  // Insert in batches of 500
  const BATCH_SIZE = 500;
  let inserted = 0;
  for (let i = 0; i < newRows.length; i += BATCH_SIZE) {
    const batch = newRows.slice(i, i + BATCH_SIZE);
    await supabaseInsert("daily_sales", batch);
    inserted += batch.length;
    console.log(`Inserted ${inserted}/${newRows.length}`);
  }

  console.log(`\nDone! Inserted ${inserted} rows.`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
