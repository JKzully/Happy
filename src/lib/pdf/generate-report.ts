import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { ChannelData } from "@/hooks/use-period-sales";
import type { AdSpendData } from "@/hooks/use-ad-spend";
import { chains } from "@/lib/data/chains";
import { colors, margin, fontSize } from "./report-styles";

export interface CostCategoryDetail {
  name: string;
  items: { name: string; amount: number; withVsk: number }[];
  totalAmount: number;
  totalWithVsk: number;
}

export interface ReportData {
  type: "week" | "month";
  dateRange: { from: string; to: string };
  channels: ChannelData[];
  totalRevenue: number;
  adSpend: AdSpendData;
  totalAdSpend: number;
  // Month report only:
  costCategories?: CostCategoryDetail[];
  totalCostWithVsk?: number;
}

function fmtKr(amount: number): string {
  const rounded = Math.round(amount);
  return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " kr";
}

function channelLabel(chainId: string): string {
  if (chainId === "n1") return "N1";
  return chains.find((c) => c.id === chainId)?.name ?? chainId;
}

export function generateReport(data: ReportData): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - margin * 2;
  const typeLabel = data.type === "week" ? "Vikuskýrsla" : "Mánaðarskýrsla";

  // ── Header banner ──
  doc.setFillColor(...colors.primary);
  doc.rect(0, 0, pageWidth, 38, "F");

  doc.setTextColor(...colors.primaryText);
  doc.setFontSize(fontSize.title);
  doc.setFont("helvetica", "bold");
  doc.text("Happy Hydrate", margin, 16);

  doc.setFontSize(fontSize.subtitle);
  doc.setFont("helvetica", "normal");
  doc.text(typeLabel, margin, 24);
  doc.text(`${data.dateRange.from}  —  ${data.dateRange.to}`, margin, 31);

  let y = 48;

  // ── Helper: section title ──
  function sectionTitle(title: string) {
    if (y > 260) {
      doc.addPage();
      y = margin;
    }
    doc.setTextColor(...colors.text);
    doc.setFontSize(fontSize.sectionTitle);
    doc.setFont("helvetica", "bold");
    doc.text(title, margin, y);
    y += 8;
  }

  // ── 1. Revenue summary ──
  sectionTitle("Tekjuyfirlit");

  const summaryRows: string[][] = [
    ["Heildartekjur", fmtKr(data.totalRevenue)],
    ["Auglýsingakostnaður", fmtKr(data.totalAdSpend)],
  ];
  if (data.type === "month" && data.totalCostWithVsk != null) {
    summaryRows.push(["Heildarkostnaður (m/VSK)", fmtKr(data.totalCostWithVsk)]);
  }

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: "grid",
    headStyles: {
      fillColor: [...colors.primary],
      textColor: [...colors.primaryText],
      fontSize: fontSize.tableHead,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: fontSize.tableBody,
      textColor: [...colors.text],
    },
    alternateRowStyles: {
      fillColor: [...colors.rowAlt],
    },
    styles: {
      lineColor: [...colors.border],
      lineWidth: 0.3,
      cellPadding: 3,
    },
    head: [["Liður", "Upphæð"]],
    body: summaryRows,
    columnStyles: {
      0: { cellWidth: contentWidth * 0.6 },
      1: { cellWidth: contentWidth * 0.4, halign: "right" },
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 12;

  // ── 2. Sales by channel ──
  sectionTitle("Sala eftir keðju");

  const channelRows = data.channels
    .filter((ch) => ch.boxes > 0)
    .map((ch) => {
      const pct = data.totalRevenue > 0
        ? ((ch.revenue / data.totalRevenue) * 100).toFixed(1) + "%"
        : "0%";
      return [channelLabel(ch.chainId), String(ch.boxes), fmtKr(ch.revenue), pct];
    });

  const totalBoxes = data.channels.reduce((s, ch) => s + ch.boxes, 0);
  channelRows.push(["Samtals", String(totalBoxes), fmtKr(data.totalRevenue), "100%"]);

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: "grid",
    headStyles: {
      fillColor: [...colors.primary],
      textColor: [...colors.primaryText],
      fontSize: fontSize.tableHead,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: fontSize.tableBody,
      textColor: [...colors.text],
    },
    alternateRowStyles: {
      fillColor: [...colors.rowAlt],
    },
    styles: {
      lineColor: [...colors.border],
      lineWidth: 0.3,
      cellPadding: 3,
    },
    head: [["Keðja", "Kassar", "Tekjur", "Hlutfall"]],
    body: channelRows,
    columnStyles: {
      0: { cellWidth: contentWidth * 0.35 },
      1: { cellWidth: contentWidth * 0.18, halign: "right" },
      2: { cellWidth: contentWidth * 0.29, halign: "right" },
      3: { cellWidth: contentWidth * 0.18, halign: "right" },
    },
    didParseCell(hookData) {
      // Bold the "Samtals" row
      if (hookData.section === "body" && hookData.row.index === channelRows.length - 1) {
        hookData.cell.styles.fontStyle = "bold";
        hookData.cell.styles.fillColor = [...colors.headerBg];
      }
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 12;

  // ── 3. Ad spend ──
  sectionTitle("Auglýsingar");

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: "grid",
    headStyles: {
      fillColor: [...colors.primary],
      textColor: [...colors.primaryText],
      fontSize: fontSize.tableHead,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: fontSize.tableBody,
      textColor: [...colors.text],
    },
    alternateRowStyles: {
      fillColor: [...colors.rowAlt],
    },
    styles: {
      lineColor: [...colors.border],
      lineWidth: 0.3,
      cellPadding: 3,
    },
    head: [["Vettvangur", "Kostnaður", "ROAS"]],
    body: [
      ["Meta (Facebook/Instagram)", fmtKr(data.adSpend.meta.spend), `${data.adSpend.meta.roas}x`],
      ["Google Ads", fmtKr(data.adSpend.google.spend), `${data.adSpend.google.roas}x`],
      ["Samtals", fmtKr(data.totalAdSpend), `${data.adSpend.total.roas}x`],
    ],
    columnStyles: {
      0: { cellWidth: contentWidth * 0.4 },
      1: { cellWidth: contentWidth * 0.35, halign: "right" },
      2: { cellWidth: contentWidth * 0.25, halign: "right" },
    },
    didParseCell(hookData) {
      if (hookData.section === "body" && hookData.row.index === 2) {
        hookData.cell.styles.fontStyle = "bold";
        hookData.cell.styles.fillColor = [...colors.headerBg];
      }
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 12;

  // ── 4. Cost breakdown (month report only) ──
  if (data.type === "month" && data.costCategories && data.costCategories.length > 0) {
    sectionTitle("Kostnaðaryfirlit");

    // Build rows: category header rows + item rows + grand total
    const costRows: string[][] = [];
    const categoryHeaderIndices: Set<number> = new Set();

    for (const cat of data.costCategories) {
      // Category header row (spans visually as bold row)
      categoryHeaderIndices.add(costRows.length);
      costRows.push([cat.name, fmtKr(cat.totalAmount), fmtKr(cat.totalWithVsk)]);
      // Individual items indented
      for (const item of cat.items) {
        costRows.push([`   ${item.name}`, fmtKr(item.amount), fmtKr(item.withVsk)]);
      }
    }

    const totalWithout = data.costCategories.reduce((s, c) => s + c.totalAmount, 0);
    const grandTotalIdx = costRows.length;
    costRows.push(["Samtals", fmtKr(totalWithout), fmtKr(data.totalCostWithVsk ?? 0)]);

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      theme: "grid",
      headStyles: {
        fillColor: [...colors.primary],
        textColor: [...colors.primaryText],
        fontSize: fontSize.tableHead,
        fontStyle: "bold",
      },
      bodyStyles: {
        fontSize: fontSize.tableBody,
        textColor: [...colors.text],
      },
      styles: {
        lineColor: [...colors.border],
        lineWidth: 0.3,
        cellPadding: 3,
      },
      head: [["Liður", "Án VSK", "Með VSK"]],
      body: costRows,
      columnStyles: {
        0: { cellWidth: contentWidth * 0.4 },
        1: { cellWidth: contentWidth * 0.3, halign: "right" },
        2: { cellWidth: contentWidth * 0.3, halign: "right" },
      },
      didParseCell(hookData) {
        if (hookData.section !== "body") return;
        const idx = hookData.row.index;
        // Category header rows — bold with light background
        if (categoryHeaderIndices.has(idx)) {
          hookData.cell.styles.fontStyle = "bold";
          hookData.cell.styles.fillColor = [...colors.headerBg];
        }
        // Grand total row
        if (idx === grandTotalIdx) {
          hookData.cell.styles.fontStyle = "bold";
          hookData.cell.styles.fillColor = [...colors.headerBg];
        }
      },
    });
  }

  // ── Footer on every page ──
  const pageCount = doc.getNumberOfPages();
  const now = new Date();
  const timestamp = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`;

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFontSize(fontSize.footer);
    doc.setTextColor(...colors.textDim);
    doc.setFont("helvetica", "normal");
    doc.text(`Búið til: ${timestamp}`, margin, pageH - 10);
    doc.text(`Síða ${i} af ${pageCount}`, pageWidth - margin, pageH - 10, { align: "right" });
  }

  // ── Save / trigger download ──
  const filename = `HappyHydrate_${typeLabel}_${data.dateRange.from}_${data.dateRange.to}.pdf`;
  doc.save(filename);
}
