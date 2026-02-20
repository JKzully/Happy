import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import { createClient } from "@/lib/supabase/client";
import { fetchAllRows } from "@/lib/supabase/fetch-all";

interface SalesExportRow {
  Dagsetning: string;
  Keðja: string;
  Verslun: string;
  Vara: string;
  Magn: number;
}

/**
 * Fetch all daily_sales from Supabase (with store/chain/product names)
 * and download as an Excel file.
 */
export async function downloadSalesBackup() {
  const supabase = createClient();

  // Fetch all daily_sales with joined names — paginate to bypass 1000 row limit
  const allRows: SalesExportRow[] = [];
  const pageSize = 1000;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from("daily_sales")
      .select(
        `
        date,
        quantity,
        stores!inner ( name, retail_chains!inner ( name ) ),
        products!inner ( name )
      `
      )
      .order("date", { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) {
      hasMore = false;
      break;
    }

    for (const row of data as unknown as Array<{
      date: string;
      quantity: number;
      stores: { name: string; retail_chains: { name: string } };
      products: { name: string };
    }>) {
      allRows.push({
        Dagsetning: row.date,
        Keðja: row.stores.retail_chains.name,
        Verslun: row.stores.name,
        Vara: row.products.name,
        Magn: row.quantity,
      });
    }

    if (data.length < pageSize) {
      hasMore = false;
    } else {
      offset += pageSize;
    }
  }

  if (allRows.length === 0) {
    throw new Error("Engin sölugögn fundust í gagnagrunni.");
  }

  // Sort: date → chain → store → product
  allRows.sort((a, b) =>
    a.Dagsetning.localeCompare(b.Dagsetning) ||
    a.Keðja.localeCompare(b.Keðja, "is") ||
    a.Verslun.localeCompare(b.Verslun, "is") ||
    a.Vara.localeCompare(b.Vara, "is")
  );

  // Build workbook
  const ws = XLSX.utils.json_to_sheet(allRows);

  // Set column widths
  ws["!cols"] = [
    { wch: 12 }, // Dagsetning
    { wch: 14 }, // Keðja
    { wch: 22 }, // Verslun
    { wch: 28 }, // Vara
    { wch: 8 },  // Magn
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sölugögn");

  // Generate and trigger download
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `hce-solubackup-${new Date().toISOString().split("T")[0]}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return allRows.length;
}

// ── Formatted Excel export with date range ──

interface RawSaleRow {
  date: string;
  quantity: number;
  stores: {
    name: string;
    retail_chains: { name: string; slug: string };
  };
  products: { name: string; category: string };
}

const chainColors: Record<string, string> = {
  kronan: "60A5FA",
  samkaup: "A78BFA",
  bonus: "FB923C",
  hagkaup: "22D3EE",
  shopify: "34D399",
  n1: "94A3B8",
};

function triggerDownload(buffer: ArrayBuffer, filename: string) {
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadFormattedSales(from: string, to: string) {
  const supabase = createClient();

  const rows = await fetchAllRows<RawSaleRow>((rangeFrom, rangeTo) =>
    supabase
      .from("daily_sales")
      .select(
        "date, quantity, stores!inner(name, retail_chains!inner(name, slug)), products!inner(name, category)"
      )
      .gte("date", from)
      .lte("date", to)
      .order("date", { ascending: true })
      .range(rangeFrom, rangeTo) as unknown as Promise<{ data: RawSaleRow[] | null }>,
  );

  if (rows.length === 0) {
    throw new Error("Engin sölugögn fundust á þessu tímabili.");
  }

  const wb = new ExcelJS.Workbook();
  wb.creator = "Happy Hydrate Dashboard";
  wb.created = new Date();

  // ── Sheet 1: Yfirlit ──
  const ws1 = wb.addWorksheet("Yfirlit", {
    properties: { defaultColWidth: 16 },
  });

  // Aggregate by chain
  const chainAgg: Record<string, { name: string; slug: string; boxes: number; products: Record<string, number> }> = {};
  for (const row of rows) {
    const slug = row.stores.retail_chains.slug;
    const chainName = row.stores.retail_chains.name;
    if (!chainAgg[slug]) chainAgg[slug] = { name: chainName, slug, boxes: 0, products: {} };
    chainAgg[slug].boxes += row.quantity;
    chainAgg[slug].products[row.products.name] = (chainAgg[slug].products[row.products.name] || 0) + row.quantity;
  }
  const chainList = Object.values(chainAgg).sort((a, b) => b.boxes - a.boxes);
  const totalBoxes = chainList.reduce((s, c) => s + c.boxes, 0);

  // Aggregate by product
  const productAgg: Record<string, number> = {};
  for (const row of rows) {
    productAgg[row.products.name] = (productAgg[row.products.name] || 0) + row.quantity;
  }
  const productList = Object.entries(productAgg).sort((a, b) => b[1] - a[1]);

  // Aggregate by date (for trend)
  const dailyAgg: Record<string, number> = {};
  for (const row of rows) {
    dailyAgg[row.date] = (dailyAgg[row.date] || 0) + row.quantity;
  }
  const dailyList = Object.entries(dailyAgg).sort((a, b) => a[0].localeCompare(b[0]));

  // Style constants
  const headerFont: Partial<ExcelJS.Font> = { bold: true, size: 11, color: { argb: "FFFFFFFF" } };
  const headerFill: ExcelJS.FillPattern = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F2937" } };
  const subHeaderFill: ExcelJS.FillPattern = { type: "pattern", pattern: "solid", fgColor: { argb: "FF374151" } };
  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: "thin", color: { argb: "FFD1D5DB" } },
    bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
    left: { style: "thin", color: { argb: "FFD1D5DB" } },
    right: { style: "thin", color: { argb: "FFD1D5DB" } },
  };

  // Title
  const titleRow = ws1.addRow(["Happy Hydrate — Söluyfirlit"]);
  titleRow.font = { bold: true, size: 16, color: { argb: "FF34D399" } };
  ws1.mergeCells("A1:D1");

  const periodRow = ws1.addRow([`Tímabil: ${from} til ${to}`]);
  periodRow.font = { size: 11, color: { argb: "FF9CA3AF" } };
  ws1.mergeCells("A2:D2");

  const totalRow = ws1.addRow([`Heildarmagn: ${totalBoxes.toLocaleString("is-IS")} kassar`]);
  totalRow.font = { bold: true, size: 12 };
  ws1.mergeCells("A3:D3");

  ws1.addRow([]);

  // ── Chain summary table ──
  const chainHeader = ws1.addRow(["Keðja", "Kassar", "Hlutfall"]);
  chainHeader.eachCell((cell) => {
    cell.font = headerFont;
    cell.fill = headerFill;
    cell.border = thinBorder;
    cell.alignment = { horizontal: "center" };
  });

  for (const chain of chainList) {
    const pct = totalBoxes > 0 ? chain.boxes / totalBoxes : 0;
    const row = ws1.addRow([chain.name, chain.boxes, pct]);
    row.border = thinBorder;
    row.getCell(2).numFmt = "#,##0";
    row.getCell(3).numFmt = "0.0%";
    // Color stripe
    const color = chainColors[chain.slug] ?? "94A3B8";
    row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: `33${color}` } };
  }

  const chainTotalRow = ws1.addRow(["Samtals", totalBoxes, 1]);
  chainTotalRow.font = { bold: true };
  chainTotalRow.border = thinBorder;
  chainTotalRow.getCell(2).numFmt = "#,##0";
  chainTotalRow.getCell(3).numFmt = "0.0%";

  ws1.addRow([]);
  ws1.addRow([]);

  // ── Product summary table ──
  const prodHeader = ws1.addRow(["Vara", "Kassar", "Hlutfall"]);
  prodHeader.eachCell((cell) => {
    cell.font = headerFont;
    cell.fill = headerFill;
    cell.border = thinBorder;
    cell.alignment = { horizontal: "center" };
  });

  for (const [name, boxes] of productList) {
    const pct = totalBoxes > 0 ? boxes / totalBoxes : 0;
    const row = ws1.addRow([name, boxes, pct]);
    row.border = thinBorder;
    row.getCell(2).numFmt = "#,##0";
    row.getCell(3).numFmt = "0.0%";
  }

  const prodTotalRow = ws1.addRow(["Samtals", totalBoxes, 1]);
  prodTotalRow.font = { bold: true };
  prodTotalRow.border = thinBorder;
  prodTotalRow.getCell(2).numFmt = "#,##0";
  prodTotalRow.getCell(3).numFmt = "0.0%";

  ws1.addRow([]);
  ws1.addRow([]);

  // ── Daily trend table ──
  const dailyHeader = ws1.addRow(["Dagsetning", "Kassar"]);
  dailyHeader.eachCell((cell) => {
    cell.font = headerFont;
    cell.fill = headerFill;
    cell.border = thinBorder;
    cell.alignment = { horizontal: "center" };
  });

  for (const [date, boxes] of dailyList) {
    const row = ws1.addRow([date, boxes]);
    row.border = thinBorder;
    row.getCell(2).numFmt = "#,##0";
  }

  // Column widths
  ws1.getColumn(1).width = 24;
  ws1.getColumn(2).width = 14;
  ws1.getColumn(3).width = 12;
  ws1.getColumn(4).width = 14;

  // ── Sheet 2: Sundurliðun ──
  const ws2 = wb.addWorksheet("Sundurliðun", {
    properties: { defaultColWidth: 14 },
  });

  // Headers
  const detailHeader = ws2.addRow(["Dagsetning", "Keðja", "Verslun", "Vara", "Magn"]);
  detailHeader.eachCell((cell) => {
    cell.font = headerFont;
    cell.fill = headerFill;
    cell.border = thinBorder;
    cell.alignment = { horizontal: "center" };
  });

  // Sort rows
  const sortedRows = [...rows].sort((a, b) =>
    a.date.localeCompare(b.date) ||
    a.stores.retail_chains.name.localeCompare(b.stores.retail_chains.name, "is") ||
    a.stores.name.localeCompare(b.stores.name, "is") ||
    a.products.name.localeCompare(b.products.name, "is")
  );

  let lastDate = "";
  for (const row of sortedRows) {
    const isNewDate = row.date !== lastDate;
    lastDate = row.date;

    const r = ws2.addRow([
      row.date,
      row.stores.retail_chains.name,
      row.stores.name,
      row.products.name,
      row.quantity,
    ]);
    r.border = thinBorder;
    r.getCell(5).numFmt = "#,##0";

    // Light separator between dates
    if (isNewDate && r.number > 2) {
      r.eachCell((cell) => {
        cell.border = {
          ...thinBorder,
          top: { style: "medium", color: { argb: "FF6B7280" } },
        };
      });
    }

    // Chain color
    const slug = row.stores.retail_chains.slug;
    const color = chainColors[slug] ?? "94A3B8";
    r.getCell(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: `22${color}` } };
  }

  // Column widths
  ws2.getColumn(1).width = 13;
  ws2.getColumn(2).width = 14;
  ws2.getColumn(3).width = 26;
  ws2.getColumn(4).width = 22;
  ws2.getColumn(5).width = 10;

  // Auto-filter on detail sheet
  ws2.autoFilter = { from: "A1", to: "E1" };

  // ── Sheet 3: Keðja × Vara (pivot) ──
  const ws3 = wb.addWorksheet("Eftir keðju og vöru", {
    properties: { defaultColWidth: 14 },
  });

  // Build pivot: chain → product → quantity
  const allProducts = [...new Set(rows.map((r) => r.products.name))].sort((a, b) => a.localeCompare(b, "is"));

  const pivotHeader = ws3.addRow(["Keðja", ...allProducts, "Samtals"]);
  pivotHeader.eachCell((cell) => {
    cell.font = headerFont;
    cell.fill = headerFill;
    cell.border = thinBorder;
    cell.alignment = { horizontal: "center" };
  });

  for (const chain of chainList) {
    const values = allProducts.map((p) => chain.products[p] || 0);
    const row = ws3.addRow([chain.name, ...values, chain.boxes]);
    row.border = thinBorder;
    const color = chainColors[chain.slug] ?? "94A3B8";
    row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: `33${color}` } };
    row.eachCell((cell, colNumber) => {
      if (colNumber >= 2) cell.numFmt = "#,##0";
    });
  }

  // Totals row
  const pivotTotals = allProducts.map((p) => productAgg[p] || 0);
  const pivotTotalRow = ws3.addRow(["Samtals", ...pivotTotals, totalBoxes]);
  pivotTotalRow.font = { bold: true };
  pivotTotalRow.border = thinBorder;
  pivotTotalRow.eachCell((cell, colNumber) => {
    if (colNumber >= 2) cell.numFmt = "#,##0";
  });

  ws3.getColumn(1).width = 16;
  for (let i = 2; i <= allProducts.length + 2; i++) {
    ws3.getColumn(i).width = 14;
  }

  // ── Generate and download ──
  const buffer = await wb.xlsx.writeBuffer();
  const filename = `hce-sala-${from}-til-${to}.xlsx`;
  triggerDownload(buffer as ArrayBuffer, filename);

  return rows.length;
}
