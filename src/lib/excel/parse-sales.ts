import * as XLSX from "xlsx";
import { skuToProduct, stripChainPrefix, shouldSkipSku, samkaupHeaderToSubChain } from "./sku-map";

export interface ParsedSaleRow {
  date: string;
  chainName: string;
  storeName: string;
  rawStoreName: string;
  sku: string;
  productId: string | null;
  productName: string;
  quantity: number;
}

export interface ParseWarning {
  type: "unknown_sku" | "unknown_store" | "zero_quantity";
  message: string;
  row?: number;
}

export type DetectedFormat = "kronan" | "bonus" | "samkaup" | "hagkaup";

export interface ParseResult {
  rows: ParsedSaleRow[];
  date: string;
  chainName: string;
  detectedFormat: DetectedFormat;
  skippedSkuCount: number;
  warnings: ParseWarning[];
  storeCount: number;
  totalBoxes: number;
}

function excelDateToISO(serial: number): string {
  const utcDays = Math.floor(serial) - 25569;
  const date = new Date(utcDays * 86400 * 1000);
  return date.toISOString().split("T")[0];
}

/**
 * Parse Icelandic date string like "8.2.2026" → "2026-02-08"
 */
function parseIcelandicDate(text: string): string | null {
  const m = text.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (!m) return null;
  const [, day, month, year] = m;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

/** Icelandic month abbreviation → month number */
const icelandicMonths: Record<string, string> = {
  "jan": "01", "feb": "02", "mar": "03", "apr": "04",
  "maí": "05", "jún": "06", "júl": "07", "ágú": "08",
  "sep": "09", "okt": "10", "nóv": "11", "des": "12",
};

/**
 * Parse Icelandic date like "2. feb. 2026" → "2026-02-02"
 */
function parseIcelandicMonthDate(text: string): string | null {
  const monthPattern = Object.keys(icelandicMonths).join("|");
  const re = new RegExp(`(\\d{1,2})\\.\\s*(${monthPattern})\\.?\\s*(\\d{4})`);
  const m = text.match(re);
  if (!m) return null;
  const [, day, monthAbbr, year] = m;
  const month = icelandicMonths[monthAbbr];
  if (!month) return null;
  return `${year}-${month}-${day.padStart(2, "0")}`;
}

/**
 * Clean Bónus store name:
 * - Strip number prefix: "04 - Hafnarfjörður" → "Hafnarfjörður"
 * - Strip " / " suffix: "Fiskislóð / Nes" → "Fiskislóð"
 * - Strip " AK" suffix: "Naustahverfi AK" → "Naustahverfi"
 */
function cleanBonusStoreName(raw: string): string {
  let name = raw.replace(/^\d+\s*-\s*/, "").trim();
  const slashIdx = name.indexOf(" / ");
  if (slashIdx > 0) name = name.slice(0, slashIdx);
  name = name.replace(/\s+AK$/, "");
  return name.trim();
}

// ─── KRÓNAN ────────────────────────────────────────────

/**
 * Parse Krónan format.
 * Columns: [Date(A), Chain(B), _, Store(D), _, _, SKU(G), _, Qty(I)]
 */
function parseKronanFormat(rawData: unknown[][]): ParseResult {
  const rows: ParsedSaleRow[] = [];
  const warnings: ParseWarning[] = [];
  const seenSkus = new Set<string>();
  const storeNames = new Set<string>();
  let date = "";
  let chainName = "";
  let skippedSkuCount = 0;

  // Find first row with a date value
  let startRow = 0;
  for (let i = 0; i < Math.min(rawData.length, 10); i++) {
    const row = rawData[i];
    const colA = row[0];
    if (typeof colA === "number" && colA > 40000 && colA < 60000) {
      startRow = i;
      break;
    }
    if (typeof colA === "string" && /^\d{4}-\d{2}-\d{2}/.test(colA)) {
      startRow = i;
      break;
    }
  }

  for (let i = startRow; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || row.length < 9) continue;

    const colA = row[0];
    const colB = row[1];
    const colD = row[3];
    const colG = row[6];
    const colI = row[8];

    let rowDate = "";
    if (typeof colA === "number") {
      rowDate = excelDateToISO(colA);
    } else if (typeof colA === "string" && colA) {
      const match = colA.match(/(\d{4}-\d{2}-\d{2})/);
      if (match) rowDate = match[1];
    }
    if (!rowDate) continue;

    if (!date) date = rowDate;

    const chain = String(colB || "").trim();
    if (chain && !chainName) chainName = chain;

    const rawStore = String(colD || "").trim();
    if (!rawStore) continue;

    const sku = String(colG || "").trim().toUpperCase();
    if (!sku) continue;

    if (shouldSkipSku(sku)) {
      skippedSkuCount++;
      continue;
    }

    const qty = typeof colI === "number" ? colI : parseInt(String(colI), 10);
    if (!qty || isNaN(qty)) {
      if (sku) {
        warnings.push({
          type: "zero_quantity",
          message: `Magn er 0 eða tómt fyrir ${sku} í ${rawStore}`,
          row: i + 1,
        });
      }
      continue;
    }

    const productMapping = skuToProduct[sku];
    if (!productMapping) {
      if (!seenSkus.has(sku)) {
        warnings.push({
          type: "unknown_sku",
          message: `Óþekkt SKU: ${sku}`,
          row: i + 1,
        });
        seenSkus.add(sku);
      }
    }

    storeNames.add(rawStore);

    rows.push({
      date: rowDate,
      chainName: chain || chainName,
      storeName: stripChainPrefix(rawStore),
      rawStoreName: rawStore,
      sku,
      productId: productMapping?.productId ?? null,
      productName: productMapping?.name ?? sku,
      quantity: qty,
    });
  }

  if (rows.length === 0) {
    throw new Error("Engar söluraðir fundust í skránni. Athugaðu snið skrárinnar.");
  }

  return {
    rows,
    date,
    chainName,
    detectedFormat: "kronan",
    skippedSkuCount,
    warnings,
    storeCount: storeNames.size,
    totalBoxes: rows.reduce((sum, r) => sum + r.quantity, 0),
  };
}

// ─── BÓNUS ─────────────────────────────────────────────

/**
 * Parse Bónus "Sala birgja" format.
 * Columns: [Verslun(A), Afsláttarfl.(B), Vara(C), Vörunúmer(D), <date>(E+), Total]
 * Store names inherit down.
 */
function parseBonusFormat(
  workbook: XLSX.WorkBook,
  rawData: unknown[][]
): ParseResult {
  const rows: ParsedSaleRow[] = [];
  const warnings: ParseWarning[] = [];
  const storeNames = new Set<string>();
  const seenSkus = new Set<string>();
  let skippedSkuCount = 0;

  const header = rawData[0] as unknown[];

  // Find date column(s) by scanning header for date patterns
  let date = "";
  let dateColIndex = -1;

  for (let c = 0; c < header.length; c++) {
    const val = String(header[c] || "");
    const parsed = parseIcelandicDate(val);
    if (parsed) {
      date = parsed;
      dateColIndex = c;
      break;
    }
  }

  // Fallback: extract date from Sheet1 title
  if (!date) {
    const sheet1Name = workbook.SheetNames[0];
    if (sheet1Name) {
      const sheet1 = workbook.Sheets[sheet1Name];
      const sheet1Data = XLSX.utils.sheet_to_json(sheet1, {
        header: 1,
        defval: "",
      }) as unknown[][];
      for (const row of sheet1Data.slice(0, 5)) {
        const val = String(row[0] || "");
        // Parse "Sala frá 8.2.2026" pattern
        const fraMatch = val.match(/frá\s+(\d{1,2}\.\d{1,2}\.\d{4})/);
        if (fraMatch) {
          date = parseIcelandicDate(fraMatch[1]) || "";
          if (date) break;
        }
        const parsed = parseIcelandicDate(val);
        if (parsed) {
          date = parsed;
          break;
        }
      }
    }
  }

  if (!date) {
    throw new Error("Dagsetning finnst ekki í skránni.");
  }

  const chainName = "Bónus";

  // Parse data rows
  let currentStore = "";

  for (let i = 1; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || row.length < 4) continue;

    // Store name in col A — only set on first row per store
    const colA = String(row[0] || "").trim();
    if (colA) {
      currentStore = cleanBonusStoreName(colA);
    }

    if (!currentStore) continue;

    // Skip subtotal and total rows
    const colC = String(row[2] || "");
    if (colC.includes("alls") || colC === "Total" || colC.toLowerCase() === "total") continue;

    // SKU in col D (index 3)
    const sku = String(row[3] || "").trim().toUpperCase();
    if (!sku) continue;

    if (shouldSkipSku(sku)) {
      skippedSkuCount++;
      continue;
    }

    // Quantity from date column or col E (index 4)
    const qtyCol = dateColIndex >= 0 ? dateColIndex : 4;
    const qtyVal = row[qtyCol];
    const qty = typeof qtyVal === "number" ? qtyVal : parseInt(String(qtyVal), 10);
    if (!qty || isNaN(qty)) {
      warnings.push({
        type: "zero_quantity",
        message: `Magn er 0 eða tómt fyrir ${sku} í ${currentStore}`,
        row: i + 1,
      });
      continue;
    }

    // Map SKU to product
    const productMapping = skuToProduct[sku];
    if (!productMapping && !seenSkus.has(sku)) {
      warnings.push({
        type: "unknown_sku",
        message: `Óþekkt SKU: ${sku}`,
        row: i + 1,
      });
      seenSkus.add(sku);
    }

    storeNames.add(currentStore);

    rows.push({
      date,
      chainName,
      storeName: currentStore,
      rawStoreName: currentStore,
      sku,
      productId: productMapping?.productId ?? null,
      productName: productMapping?.name ?? sku,
      quantity: qty,
    });
  }

  if (rows.length === 0) {
    throw new Error("Engar söluraðir fundust í skránni. Athugaðu snið skrárinnar.");
  }

  return {
    rows,
    date,
    chainName,
    detectedFormat: "bonus",
    skippedSkuCount,
    warnings,
    storeCount: storeNames.size,
    totalBoxes: rows.reduce((sum, r) => sum + r.quantity, 0),
  };
}

// ─── SAMKAUP ───────────────────────────────────────────

/**
 * Parse Samkaup "Dagssala_Birgdir" format.
 * Date from cell A3: "Seld stk. 2. feb. 2026"
 * Col A: sub-chain header (uppercase, inherit down)
 * Col B: store name (inherit down)
 * Col C: SKU string "HHLL002 - Hydration Xpress..." → extract before " - "
 * Col G: quantity
 */
function parseSamkaupFormat(workbook: XLSX.WorkBook): ParseResult {
  const sheetName = workbook.SheetNames.find(
    (n) => n === "Samkaup_Dagssala_Birgdir"
  );
  if (!sheetName) {
    throw new Error("Finnur ekki \"Samkaup_Dagssala_Birgdir\" sheet.");
  }

  const sheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
  }) as unknown as unknown[][];

  const rows: ParsedSaleRow[] = [];
  const warnings: ParseWarning[] = [];
  const storeNames = new Set<string>();
  const seenSkus = new Set<string>();
  let skippedSkuCount = 0;

  // Parse date from cell A3 (row index 2): "Seld stk. 2. feb. 2026"
  let date = "";
  for (let i = 0; i < Math.min(rawData.length, 10); i++) {
    const cellVal = String(rawData[i]?.[0] || "");
    const parsed = parseIcelandicMonthDate(cellVal);
    if (parsed) {
      date = parsed;
      break;
    }
  }

  if (!date) {
    throw new Error("Dagsetning finnst ekki í Samkaup skránni.");
  }

  const chainName = "Samkaup";
  let currentSubChain = "";
  let currentStore = "";

  // Find data start — skip header rows
  let dataStart = 0;
  for (let i = 0; i < Math.min(rawData.length, 20); i++) {
    const colA = String(rawData[i]?.[0] || "").trim().toUpperCase();
    if (samkaupHeaderToSubChain[colA]) {
      dataStart = i;
      break;
    }
  }

  for (let i = dataStart; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row) continue;

    const colA = String(row[0] || "").trim();
    const colB = String(row[1] || "").trim();
    const colC = String(row[2] || "").trim();
    const colG = row[6];

    // Check if col A is a sub-chain header
    const colAUpper = colA.toUpperCase();
    if (samkaupHeaderToSubChain[colAUpper]) {
      currentSubChain = colAUpper;
      currentStore = ""; // Reset store when new sub-chain starts
    }

    // Update current store from col B if non-empty
    if (colB) {
      // Skip summary lines
      if (colB.toLowerCase().includes("samtals")) continue;
      currentStore = colB;
    }

    if (!currentStore) continue;

    // Skip summary rows
    if (colC.toLowerCase() === "samtals" || colC.toLowerCase() === "total") continue;

    // Extract SKU from col C: "HHLL002 - Hydration Xpress..." → "HHLL002"
    const skuMatch = colC.match(/^([A-Z0-9-]+)/);
    if (!skuMatch) continue;
    const sku = skuMatch[1].toUpperCase();

    // Only process HH* SKUs
    if (!sku.startsWith("HH")) continue;

    if (shouldSkipSku(sku)) {
      skippedSkuCount++;
      continue;
    }

    const qty = typeof colG === "number" ? colG : parseInt(String(colG), 10);
    if (!qty || isNaN(qty)) continue; // Zero quantities are normal in Samkaup files

    const productMapping = skuToProduct[sku];
    if (!productMapping && !seenSkus.has(sku)) {
      warnings.push({
        type: "unknown_sku",
        message: `Óþekkt SKU: ${sku}`,
        row: i + 1,
      });
      seenSkus.add(sku);
    }

    storeNames.add(currentStore);

    rows.push({
      date,
      chainName,
      storeName: stripChainPrefix(currentStore),
      rawStoreName: currentStore,
      sku,
      productId: productMapping?.productId ?? null,
      productName: productMapping?.name ?? sku,
      quantity: qty,
    });
  }

  if (rows.length === 0) {
    throw new Error("Engar söluraðir fundust í Samkaup skránni. Athugaðu snið skrárinnar.");
  }

  return {
    rows,
    date,
    chainName,
    detectedFormat: "samkaup",
    skippedSkuCount,
    warnings,
    storeCount: storeNames.size,
    totalBoxes: rows.reduce((sum, r) => sum + r.quantity, 0),
  };
}

// ─── HAGKAUP ───────────────────────────────────────────

/**
 * Parse Hagkaup format — each sheet is a store.
 * Dynamically finds column positions from header row.
 */
function parseHagkaupFormat(workbook: XLSX.WorkBook): ParseResult {
  const rows: ParsedSaleRow[] = [];
  const warnings: ParseWarning[] = [];
  const storeNames = new Set<string>();
  const seenSkus = new Set<string>();
  let skippedSkuCount = 0;
  let date = "";
  const chainName = "Hagkaup";

  // Process each sheet except "Allar" (summary)
  for (const sheetName of workbook.SheetNames) {
    if (sheetName.toLowerCase() === "allar") continue;

    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: "",
    }) as unknown as unknown[][];

    let storeName = sheetName;
    let sheetDate = "";
    let headerRowIdx = -1;
    let skuColIdx = -1;
    let qtyColIdx = -1;
    let soldQtyColIdx = -1; // Preferred: "Selt magn" etc. (actual sold quantity)

    // Scan first 15 rows to find metadata and header
    for (let i = 0; i < Math.min(rawData.length, 15); i++) {
      const row = rawData[i];
      if (!row) continue;

      for (let c = 0; c < Math.min(row.length, 15); c++) {
        const cellVal = String(row[c] || "").trim();

        // Find store name
        if (cellVal.startsWith("Verslun : ")) {
          storeName = cellVal.replace("Verslun : ", "").trim();
        }

        // Find date
        if (cellVal.startsWith("Tímabilið: ") || cellVal.startsWith("Tímabilið :")) {
          const parsed = parseIcelandicDate(cellVal);
          if (parsed) sheetDate = parsed;
        }

        // Find header row with "Vörunúmer Ldr"
        if (cellVal === "Vörunúmer Ldr" || cellVal === "Vörunúmer ldr") {
          headerRowIdx = i;
          skuColIdx = c;
        }

        // In the header row, look for quantity columns
        if (headerRowIdx === i) {
          const lower = cellVal.toLowerCase();
          // Prefer "Selt magn" / "Magn selt" — the actual sold quantity
          if ((lower.includes("selt") && lower.includes("magn")) || lower === "selt" || lower === "fjöldi") {
            soldQtyColIdx = c;
          }
          // Plain "Magn" as fallback (may be pack size, not sold qty)
          if (lower === "magn") {
            qtyColIdx = c;
          }
        }
      }

      // If we found the header, also scan ALL columns for sold quantity / magn
      if (headerRowIdx === i) {
        for (let c = 0; c < row.length; c++) {
          const cellVal = String(row[c] || "").trim().toLowerCase();
          if ((cellVal.includes("selt") && cellVal.includes("magn")) || cellVal === "selt" || cellVal === "fjöldi") {
            soldQtyColIdx = c;
            break;
          }
        }
        // Fallback: scan all columns for plain "Magn" if not found yet
        if (soldQtyColIdx === -1 && qtyColIdx === -1) {
          for (let c = 0; c < row.length; c++) {
            const cellVal = String(row[c] || "").trim().toLowerCase();
            if (cellVal === "magn") {
              qtyColIdx = c;
              break;
            }
          }
        }
      }
    }

    // Use sold quantity column if found, otherwise fall back to plain "Magn"
    if (soldQtyColIdx !== -1) {
      qtyColIdx = soldQtyColIdx;
    }

    if (!sheetDate && !date) {
      // Try harder to find date
      for (let i = 0; i < Math.min(rawData.length, 10); i++) {
        for (let c = 0; c < Math.min((rawData[i] || []).length, 15); c++) {
          const cellVal = String(rawData[i]?.[c] || "");
          const parsed = parseIcelandicDate(cellVal);
          if (parsed) {
            sheetDate = parsed;
            break;
          }
        }
        if (sheetDate) break;
      }
    }

    if (sheetDate && !date) date = sheetDate;
    if (!sheetDate) sheetDate = date;

    if (headerRowIdx === -1 || skuColIdx === -1) {
      // This sheet doesn't have the expected format, skip it
      continue;
    }

    if (qtyColIdx === -1) {
      warnings.push({
        type: "unknown_store",
        message: `"Magn" dálkur finnst ekki á ${sheetName} sheet`,
      });
      continue;
    }

    // Read data rows from header+1 until "Alls :" or end
    for (let i = headerRowIdx + 1; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row) continue;

      // Check for end marker
      const firstCell = String(row[0] || "").trim();
      if (firstCell.startsWith("Alls :") || firstCell.startsWith("Alls:")) break;

      // Also check SKU column for end marker
      const skuCell = String(row[skuColIdx] || "").trim();
      if (skuCell.startsWith("Alls :") || skuCell.startsWith("Alls:")) break;

      const sku = skuCell.toUpperCase();
      if (!sku) continue;

      if (shouldSkipSku(sku)) {
        skippedSkuCount++;
        continue;
      }

      const qtyVal = row[qtyColIdx];
      const qty = typeof qtyVal === "number" ? qtyVal : parseInt(String(qtyVal), 10);
      if (!qty || isNaN(qty)) {
        if (sku) {
          warnings.push({
            type: "zero_quantity",
            message: `Magn er 0 eða tómt fyrir ${sku} í ${storeName}`,
            row: i + 1,
          });
        }
        continue;
      }

      const productMapping = skuToProduct[sku];
      if (!productMapping && !seenSkus.has(sku)) {
        warnings.push({
          type: "unknown_sku",
          message: `Óþekkt SKU: ${sku}`,
          row: i + 1,
        });
        seenSkus.add(sku);
      }

      storeNames.add(storeName);

      rows.push({
        date: sheetDate || date,
        chainName,
        storeName,
        rawStoreName: storeName,
        sku,
        productId: productMapping?.productId ?? null,
        productName: productMapping?.name ?? sku,
        quantity: qty,
      });
    }
  }

  if (!date) {
    throw new Error("Dagsetning finnst ekki í Hagkaup skránni.");
  }

  if (rows.length === 0) {
    throw new Error("Engar söluraðir fundust í Hagkaup skránni. Athugaðu snið skrárinnar.");
  }

  return {
    rows,
    date,
    chainName,
    detectedFormat: "hagkaup",
    skippedSkuCount,
    warnings,
    storeCount: storeNames.size,
    totalBoxes: rows.reduce((sum, r) => sum + r.quantity, 0),
  };
}

// ─── AUTO-DETECTION ────────────────────────────────────

export function parseSalesExcel(buffer: ArrayBuffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: "array" });

  // 1. Samkaup: dedicated sheet name
  const samkaupSheet = workbook.SheetNames.find(
    (n) => n === "Samkaup_Dagssala_Birgdir"
  );
  if (samkaupSheet) {
    return parseSamkaupFormat(workbook);
  }

  // 2. Hagkaup: first sheet contains "Sala upprunalegs lánardrottins"
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  if (firstSheet) {
    const firstSheetData = XLSX.utils.sheet_to_json(firstSheet, {
      header: 1,
      defval: "",
    }) as unknown as unknown[][];

    for (let i = 0; i < Math.min(firstSheetData.length, 10); i++) {
      const row = firstSheetData[i];
      if (!row) continue;
      for (let c = 0; c < row.length; c++) {
        const val = String(row[c] || "");
        if (val.includes("Sala upprunalegs lánardrottins")) {
          return parseHagkaupFormat(workbook);
        }
      }
    }
  }

  // 3. Krónan or Bónus: "Verslanir" sheet
  const verslanirSheet = workbook.SheetNames.find(
    (name) => name.toLowerCase() === "verslanir"
  );
  if (verslanirSheet) {
    const sheet = workbook.Sheets[verslanirSheet];
    const rawData = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: "",
    }) as unknown as unknown[][];

    if (rawData.length > 0) {
      const headerRow = rawData[0];

      // Krónan: col B (index 1) is "Keðja"
      const colB = String(headerRow[1] || "").trim().toLowerCase();
      if (colB === "keðja") {
        return parseKronanFormat(rawData);
      }

      // Bónus: col A (index 0) starts with "Verslun"
      const colA = String(headerRow[0] || "").trim().toLowerCase();
      if (colA === "verslun" || colA.startsWith("verslun")) {
        return parseBonusFormat(workbook, rawData);
      }
    }
  }

  throw new Error(
    `Óþekkt skráarsnið. Sheets í skrá: ${workbook.SheetNames.join(", ")}. Studd snið: Krónan, Bónus, Samkaup, Hagkaup.`
  );
}
