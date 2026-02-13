import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/client";

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
