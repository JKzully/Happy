import * as XLSX from "xlsx";
import { skuToProduct, stripChainPrefix } from "./sku-map";

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

export interface ParseResult {
  rows: ParsedSaleRow[];
  date: string;
  chainName: string;
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

/**
 * Detect if the Verslanir sheet uses "Sala birgja" supplier format.
 * Header row starts with "Verslun" and has date columns.
 */
function isSalaBirgjaFormat(headerRow: unknown[]): boolean {
  const first = String(headerRow[0] || "").trim().toLowerCase();
  return first === "verslun" || first.startsWith("verslun");
}

/**
 * Parse "Sala birgja" (supplier sales) format.
 * Columns: [Verslun, Afsláttarfl., Vara, Vörunúmer seljanda, <date>, Total]
 * Store names have number prefix: "04 - Hafnarfjörður"
 * Date is embedded in column header.
 */
function parseSalaBirgjaFormat(
  workbook: XLSX.WorkBook,
  rawData: unknown[][]
): ParseResult {
  const rows: ParsedSaleRow[] = [];
  const warnings: ParseWarning[] = [];
  const storeNames = new Set<string>();
  const seenSkus = new Set<string>();

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

  // Chain name is not in the file — leave empty, upload component detects it
  const chainName = "";

  // Parse data rows
  let currentStore = "";

  for (let i = 1; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || row.length < 4) continue;

    // Store name in col A — only set on first row per store
    const colA = String(row[0] || "").trim();
    if (colA) {
      // Strip number prefix like "04 - "
      currentStore = colA.replace(/^\d+\s*-\s*/, "").trim();
    }

    if (!currentStore) continue;

    // Skip subtotal and total rows
    const colC = String(row[2] || "");
    if (colC.includes("alls:") || colC === "Total" || colC.toLowerCase() === "total") continue;

    // SKU in col D (index 3)
    const sku = String(row[3] || "").trim().toUpperCase();
    if (!sku) continue;

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
    warnings,
    storeCount: storeNames.size,
    totalBoxes: rows.reduce((sum, r) => sum + r.quantity, 0),
  };
}

/**
 * Parse the original column-based format.
 * Columns: [Date, Chain, _, Store, _, _, SKU, _, Qty]
 */
function parseOriginalFormat(rawData: unknown[][]): ParseResult {
  const rows: ParsedSaleRow[] = [];
  const warnings: ParseWarning[] = [];
  const seenSkus = new Set<string>();
  const storeNames = new Set<string>();
  let date = "";
  let chainName = "";

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
    warnings,
    storeCount: storeNames.size,
    totalBoxes: rows.reduce((sum, r) => sum + r.quantity, 0),
  };
}

export function parseSalesExcel(buffer: ArrayBuffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: "array" });

  // Find "Verslanir" sheet (case-insensitive)
  const sheetName = workbook.SheetNames.find(
    (name) => name.toLowerCase() === "verslanir"
  );
  if (!sheetName) {
    throw new Error(
      `Finnur ekki "Verslanir" sheet. Sheets í skrá: ${workbook.SheetNames.join(", ")}`
    );
  }

  const sheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
  }) as unknown as unknown[][];

  // Detect format and parse accordingly
  if (rawData.length > 0 && isSalaBirgjaFormat(rawData[0])) {
    return parseSalaBirgjaFormat(workbook, rawData);
  }

  return parseOriginalFormat(rawData);
}
