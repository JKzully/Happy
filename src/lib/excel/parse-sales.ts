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
  // Excel serial date → JS Date
  const utcDays = Math.floor(serial) - 25569;
  const date = new Date(utcDays * 86400 * 1000);
  return date.toISOString().split("T")[0];
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

  const rows: ParsedSaleRow[] = [];
  const warnings: ParseWarning[] = [];
  const seenSkus = new Set<string>();
  const storeNames = new Set<string>();
  let date = "";
  let chainName = "";

  // Skip header row(s) - find first row with a date value
  let startRow = 0;
  for (let i = 0; i < Math.min(rawData.length, 10); i++) {
    const row = rawData[i];
    const colA = row[0];
    if (typeof colA === "number" && colA > 40000 && colA < 60000) {
      startRow = i;
      break;
    }
    // Also check if it's already a date string
    if (typeof colA === "string" && /^\d{4}-\d{2}-\d{2}/.test(colA)) {
      startRow = i;
      break;
    }
  }

  for (let i = startRow; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || row.length < 9) continue;

    const colA = row[0]; // Date
    const colB = row[1]; // Chain name
    const colD = row[3]; // Store name
    const colG = row[6]; // SKU
    const colI = row[8]; // Quantity (boxes)

    // Parse date
    let rowDate = "";
    if (typeof colA === "number") {
      rowDate = excelDateToISO(colA);
    } else if (typeof colA === "string" && colA) {
      // Try ISO format
      const match = colA.match(/(\d{4}-\d{2}-\d{2})/);
      if (match) rowDate = match[1];
    }
    if (!rowDate) continue;

    // Use first valid date as the report date
    if (!date) date = rowDate;

    // Chain name
    const chain = String(colB || "").trim();
    if (chain && !chainName) chainName = chain;

    // Store name
    const rawStore = String(colD || "").trim();
    if (!rawStore) continue;

    // SKU
    const sku = String(colG || "").trim().toUpperCase();
    if (!sku) continue;

    // Quantity
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

    // Map SKU to product
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
