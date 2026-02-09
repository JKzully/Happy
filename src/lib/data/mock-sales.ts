export interface ChannelSales {
  chainId: string;
  boxes: number;
  revenue: number;
  trend: number;
  avg30dRevenue: number;
}

export interface StoreSale {
  storeId: string;
  storeName: string;
  subChainId?: string;
  flavors: Record<string, number>;
  total: number;
  lastSale: string;
}

export const channelSalesToday: ChannelSales[] = [
  { chainId: "kronan", boxes: 24, revenue: 28944, trend: 12, avg30dRevenue: 25800 },
  { chainId: "samkaup", boxes: 18, revenue: 22230, trend: -5, avg30dRevenue: 23400 },
  { chainId: "bonus", boxes: 14, revenue: 17290, trend: 8, avg30dRevenue: 16000 },
  { chainId: "hagkaup", boxes: 8, revenue: 12864, trend: 22, avg30dRevenue: 10500 },
  { chainId: "shopify", boxes: 10, revenue: 19950, trend: 15, avg30dRevenue: 17300 },
  { chainId: "n1", boxes: 4, revenue: 5400, trend: -12, avg30dRevenue: 5500 },
];

export const totalRevenue = 106678;
export const totalAdSpend = 48200;
export const totalMargin = totalRevenue - totalAdSpend;

export const avg30d = {
  revenue: 98500,
  adSpend: 45000,
  boxes: 72,
};

export const benchmarkComparison = {
  todayVsAvgPercent: 8.3,
  sameDayLastYear: 89200,
  vsLastYearPercent: 19.6,
};

// Helper to create zero-sale store entries
function zs(id: string, name: string, subChainId?: string): StoreSale {
  return { storeId: id, storeName: name, ...(subChainId ? { subChainId } : {}), flavors: {}, total: 0, lastSale: "Engin sala" };
}

// ── Krónan (27 útibú) ─────────────────────────────────────────
export const kronanDrillDown: StoreSale[] = [
  // With sales
  { storeId: "kr-1", storeName: "Grandi", flavors: { "lemon-lane": 4, "mixed-berries": 3, "pina-colada": 2, "creatine-mixed": 1, "energy-kiwi": 2 }, total: 12, lastSale: "Í dag" },
  { storeId: "kr-2", storeName: "Skeifan", flavors: { "lemon-lane": 2, "mixed-berries": 1, "peach": 3, "creatine-lemon": 1 }, total: 7, lastSale: "Í dag" },
  { storeId: "kr-3", storeName: "Holtagarðar", flavors: { "peru": 1, "mixed-berries": 1, "krakka-happy": 1 }, total: 3, lastSale: "Í gær" },
  { storeId: "kr-4", storeName: "Akureyri", flavors: { "lemon-lane": 1, "energy-kiwi": 1 }, total: 2, lastSale: "Í gær" },
  // Zero sales
  { storeId: "kr-5", storeName: "Selfoss", flavors: {}, total: 0, lastSale: "5 dögum síðan" },
  zs("kr-6", "Breiðholt"),
  zs("kr-7", "Grafarvogur"),
  zs("kr-8", "Garðabær"),
  zs("kr-9", "Kópavogur"),
  zs("kr-10", "Mosfellsbær"),
  zs("kr-11", "Mjódd"),
  zs("kr-12", "Vesturbær"),
  zs("kr-13", "Árbær"),
  zs("kr-14", "Norðlingaholt"),
  zs("kr-15", "Hafnarfjörður"),
  zs("kr-16", "Keflavík"),
  zs("kr-17", "Egilsstaðir"),
  zs("kr-18", "Borgarnes"),
  zs("kr-19", "Ísafjörður"),
  zs("kr-20", "Dalvík"),
  zs("kr-21", "Húsavík"),
  zs("kr-22", "Sauðárkrókur"),
  zs("kr-23", "Hveragerði"),
  zs("kr-24", "Stykkishólmur"),
  zs("kr-25", "Ólafsvík"),
  zs("kr-26", "Siglufjörður"),
  zs("kr-27", "Reykjanesbær"),
];

// ── Samkaup (44 útibú) ────────────────────────────────────────
export const samkaupDrillDown: StoreSale[] = [
  // Nettó — with sales
  { storeId: "sa-1", storeName: "Skógarlönd", subChainId: "netto", flavors: { "lemon-lane": 3, "mixed-berries": 2, "creatine-mixed": 1 }, total: 6, lastSale: "Í dag" },
  { storeId: "sa-2", storeName: "Grafarvogur", subChainId: "netto", flavors: { "peach": 2, "pina-colada": 1 }, total: 3, lastSale: "Í dag" },
  // Nettó — zero sales
  zs("sa-n3", "Breiðholt", "netto"),
  zs("sa-n4", "Kópavogur", "netto"),
  zs("sa-n5", "Garðabær", "netto"),
  zs("sa-n6", "Hafnarfjörður", "netto"),
  zs("sa-n7", "Keflavík", "netto"),
  zs("sa-n8", "Selfoss", "netto"),
  zs("sa-n9", "Akureyri", "netto"),
  zs("sa-n10", "Ísafjörður", "netto"),
  zs("sa-n11", "Egilsstaðir", "netto"),
  zs("sa-n12", "Borgarnes", "netto"),
  zs("sa-n13", "Húsavík", "netto"),
  zs("sa-n14", "Sauðárkrókur", "netto"),
  zs("sa-n15", "Dalvík", "netto"),
  zs("sa-n16", "Hveragerði", "netto"),
  zs("sa-n17", "Mosfellsbær", "netto"),
  zs("sa-n18", "Mjódd", "netto"),
  zs("sa-n19", "Vestmannaeyjar", "netto"),
  zs("sa-n20", "Stykkishólmur", "netto"),
  zs("sa-n21", "Blönduós", "netto"),
  // Kjörbuðir — with sales
  { storeId: "sa-3", storeName: "Vesturbæjar", subChainId: "kjorbudir", flavors: { "lemon-lane": 2, "energy-kiwi": 2, "peru": 1 }, total: 5, lastSale: "Í dag" },
  { storeId: "sa-4", storeName: "Hafnarfjörður", subChainId: "kjorbudir", flavors: { "mixed-berries": 1, "krakka-happy": 2 }, total: 3, lastSale: "Í gær" },
  // Kjörbuðir — zero sales
  zs("sa-k3", "Kópavogur", "kjorbudir"),
  zs("sa-k4", "Garðabær", "kjorbudir"),
  zs("sa-k5", "Grafarvogur", "kjorbudir"),
  zs("sa-k6", "Akureyri", "kjorbudir"),
  zs("sa-k7", "Selfoss", "kjorbudir"),
  zs("sa-k8", "Keflavík", "kjorbudir"),
  zs("sa-k9", "Borgarnes", "kjorbudir"),
  zs("sa-k10", "Egilsstaðir", "kjorbudir"),
  zs("sa-k11", "Ísafjörður", "kjorbudir"),
  zs("sa-k12", "Sauðárkrókur", "kjorbudir"),
  zs("sa-k13", "Húsavík", "kjorbudir"),
  zs("sa-k14", "Siglufjörður", "kjorbudir"),
  zs("sa-k15", "Dalvík", "kjorbudir"),
  zs("sa-k16", "Hveragerði", "kjorbudir"),
  zs("sa-k17", "Mosfellsbær", "kjorbudir"),
  zs("sa-k18", "Stykkishólmur", "kjorbudir"),
  zs("sa-k19", "Norðlingaholt", "kjorbudir"),
  // Iceland — with sales
  { storeId: "sa-5", storeName: "Kringlan", subChainId: "iceland", flavors: { "lemon-lane": 1 }, total: 1, lastSale: "3 dögum síðan" },
  // Extra — zero sales
  zs("sa-e1", "Laugavegur", "extra"),
  zs("sa-e2", "Garðabær", "extra"),
  // Krambuð — zero sales
  zs("sa-kr1", "Mjódd", "krambud"),
];

// ── Bónus (34 útibú) ──────────────────────────────────────────
export const bonusDrillDown: StoreSale[] = [
  // With sales
  { storeId: "bo-1", storeName: "Garðastræti", flavors: { "lemon-lane": 3, "mixed-berries": 2, "creatine-mixed": 2, "energy-kiwi": 1 }, total: 8, lastSale: "Í dag" },
  { storeId: "bo-2", storeName: "Breiðholt", flavors: { "peach": 2, "peru": 1, "krakka-happy": 1 }, total: 4, lastSale: "Í dag" },
  { storeId: "bo-3", storeName: "Akureyri", flavors: { "lemon-lane": 1, "mixed-berries": 1 }, total: 2, lastSale: "Í gær" },
  // Zero sales
  zs("bo-4", "Hallveigarstigur"),
  zs("bo-5", "Laugavegur"),
  zs("bo-6", "Garðabær"),
  zs("bo-7", "Kópavogur"),
  zs("bo-8", "Hafnarfjörður"),
  zs("bo-9", "Keflavík"),
  zs("bo-10", "Selfoss"),
  zs("bo-11", "Vestmannaeyjar"),
  zs("bo-12", "Ísafjörður"),
  zs("bo-13", "Egilsstaðir"),
  zs("bo-14", "Borgarnes"),
  zs("bo-15", "Húsavík"),
  zs("bo-16", "Sauðárkrókur"),
  zs("bo-17", "Mosfellsbær"),
  zs("bo-18", "Hveragerði"),
  zs("bo-19", "Dalvík"),
  zs("bo-20", "Grafarvogur"),
  zs("bo-21", "Mjódd"),
  zs("bo-22", "Norðlingaholt"),
  zs("bo-23", "Ólafsvík"),
  zs("bo-24", "Siglufjörður"),
  zs("bo-25", "Stykkishólmur"),
  zs("bo-26", "Álftanes"),
  zs("bo-27", "Grindavík"),
  zs("bo-28", "Reyðarfjörður"),
  zs("bo-29", "Neskaupstaður"),
  zs("bo-30", "Seyðisfjörður"),
  zs("bo-31", "Þorlákshöfn"),
  zs("bo-32", "Vogar"),
  zs("bo-33", "Ólafsfjörður"),
  zs("bo-34", "Blönduós"),
];

// ── Hagkaup (7 útibú) ─────────────────────────────────────────
export const hagkaupDrillDown: StoreSale[] = [
  // With sales
  { storeId: "ha-1", storeName: "Kringlan", flavors: { "lemon-lane": 2, "creatine-mixed": 1, "creatine-lemon": 1, "energy-kiwi": 1 }, total: 5, lastSale: "Í dag" },
  { storeId: "ha-2", storeName: "Smáralind", flavors: { "mixed-berries": 1, "peach": 1 }, total: 2, lastSale: "Í dag" },
  { storeId: "ha-3", storeName: "Akureyri", flavors: { "lemon-lane": 1 }, total: 1, lastSale: "2 dögum síðan" },
  // Zero sales
  zs("ha-4", "Eiðistorg"),
  zs("ha-5", "Spöng"),
  zs("ha-6", "Garðatorg"),
  zs("ha-7", "Skeifan"),
];

export const shopifyDrillDown = {
  stakKaup: { boxes: 6, revenue: 11970 },
  askrift: { boxes: 4, revenue: 6784 },
};

export const alerts = [
  { type: "danger" as const, message: "Krónan Selfoss: Engin sala í 5 daga" },
  { type: "danger" as const, message: "Bónus Ísafjörður: Engin sala í 10+ daga" },
  { type: "warning" as const, message: "Samkaup Nettó: 30% minni sala en meðaltal" },
  { type: "info" as const, message: "Hagkaup Kringlan: Mest selda verslun í dag" },
  { type: "success" as const, message: "Shopify áskriftir: +3 nýjar í vikunni" },
];

export const adSpendBreakdown = {
  meta: { spend: 30800, revenue: 221760, roas: 7.2 },
  google: { spend: 17400, revenue: 100920, roas: 5.8 },
  total: { spend: 48200, roas: 6.8 },
};

export const monthlyProgress = {
  month: "Febrúar 2026",
  daysElapsed: 7,
  daysTotal: 28,
  revenueSoFar: 2180000,
  productionCosts: 480000,
  adSpend: 338000,
  fixedCosts: 12400000,
  projected: -5600000,
  breakEvenDaily: 443000,
};

export interface DeadStore {
  storeName: string;
  chainId: string;
  daysSinceSale: number;
}

export const deadStores: DeadStore[] = [
  { storeName: "Bónus Ísafjörður", chainId: "bonus", daysSinceSale: 14 },
  { storeName: "Krónan Dalvík", chainId: "kronan", daysSinceSale: 11 },
  { storeName: "Nettó Húsavík", chainId: "samkaup", daysSinceSale: 10 },
  { storeName: "Krónan Selfoss", chainId: "kronan", daysSinceSale: 5 },
  { storeName: "Kjörbuðin Keflavík", chainId: "samkaup", daysSinceSale: 8 },
  { storeName: "Bónus Vestmannaeyjar", chainId: "bonus", daysSinceSale: 7 },
];
