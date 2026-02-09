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

export const kronanDrillDown: StoreSale[] = [
  { storeId: "kr-1", storeName: "Grandi", flavors: { "lemon-lane": 4, "mixed-berries": 3, "pina-colada": 2, "creatine-mixed": 1, "energy-kiwi": 2 }, total: 12, lastSale: "Í dag" },
  { storeId: "kr-2", storeName: "Skeifan", flavors: { "lemon-lane": 2, "mixed-berries": 1, "peach": 3, "creatine-lemon": 1 }, total: 7, lastSale: "Í dag" },
  { storeId: "kr-3", storeName: "Holtagarðar", flavors: { "peru": 1, "mixed-berries": 1, "krakka-happy": 1 }, total: 3, lastSale: "Í gær" },
  { storeId: "kr-4", storeName: "Akureyri", flavors: { "lemon-lane": 1, "energy-kiwi": 1 }, total: 2, lastSale: "Í gær" },
  { storeId: "kr-5", storeName: "Selfoss", flavors: {}, total: 0, lastSale: "5 dögum síðan" },
];

export const samkaupDrillDown: StoreSale[] = [
  { storeId: "sa-1", storeName: "Skógarlönd", subChainId: "netto", flavors: { "lemon-lane": 3, "mixed-berries": 2, "creatine-mixed": 1 }, total: 6, lastSale: "Í dag" },
  { storeId: "sa-2", storeName: "Grafarvogur", subChainId: "netto", flavors: { "peach": 2, "pina-colada": 1 }, total: 3, lastSale: "Í dag" },
  { storeId: "sa-3", storeName: "Vesturbæjar", subChainId: "kjorbudir", flavors: { "lemon-lane": 2, "energy-kiwi": 2, "peru": 1 }, total: 5, lastSale: "Í dag" },
  { storeId: "sa-4", storeName: "Hafnarfjörður", subChainId: "kjorbudir", flavors: { "mixed-berries": 1, "krakka-happy": 2 }, total: 3, lastSale: "Í gær" },
  { storeId: "sa-5", storeName: "Kringlan", subChainId: "iceland", flavors: { "lemon-lane": 1 }, total: 1, lastSale: "3 dögum síðan" },
];

export const bonusDrillDown: StoreSale[] = [
  { storeId: "bo-1", storeName: "Garðastræti", flavors: { "lemon-lane": 3, "mixed-berries": 2, "creatine-mixed": 2, "energy-kiwi": 1 }, total: 8, lastSale: "Í dag" },
  { storeId: "bo-2", storeName: "Breiðholti", flavors: { "peach": 2, "peru": 1, "krakka-happy": 1 }, total: 4, lastSale: "Í dag" },
  { storeId: "bo-3", storeName: "Akureyri", flavors: { "lemon-lane": 1, "mixed-berries": 1 }, total: 2, lastSale: "Í gær" },
];

export const hagkaupDrillDown: StoreSale[] = [
  { storeId: "ha-1", storeName: "Kringlan", flavors: { "lemon-lane": 2, "creatine-mixed": 1, "creatine-lemon": 1, "energy-kiwi": 1 }, total: 5, lastSale: "Í dag" },
  { storeId: "ha-2", storeName: "Smáralind", flavors: { "mixed-berries": 1, "peach": 1 }, total: 2, lastSale: "Í dag" },
  { storeId: "ha-3", storeName: "Akureyri", flavors: { "lemon-lane": 1 }, total: 1, lastSale: "2 dögum síðan" },
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
