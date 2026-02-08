export interface CostItem {
  name: string;
  amount: number;
}

export interface CostCategory {
  id: string;
  title: string;
  total: number;
  editable: boolean;
  items: CostItem[];
}

export const costCategories: CostCategory[] = [
  {
    id: "operations",
    title: "Rekstur (mánaðarlegur)",
    total: 5034097,
    editable: true,
    items: [
      { name: "Dropshipping", amount: 500000 },
      { name: "Húsaleiga", amount: 1600000 },
      { name: "Laun", amount: 1200000 },
      { name: "Bókfærsla", amount: 280000 },
      { name: "Hugbúnaður", amount: 180000 },
      { name: "Tryggingar", amount: 95000 },
      { name: "Síminn/Net", amount: 45000 },
      { name: "Annað", amount: 134097 },
    ],
  },
  {
    id: "marketing-fixed",
    title: "Markaðssetning - fast",
    total: 4364800,
    editable: true,
    items: [
      { name: "Podcast", amount: 2300000 },
      { name: "Skilti (billboards)", amount: 1100000 },
      { name: "Samfélagsmiðlar (organic)", amount: 450000 },
      { name: "PR / fréttir", amount: 314800 },
      { name: "Influencer samningar", amount: 200000 },
    ],
  },
  {
    id: "marketing-variable",
    title: "Markaðssetning - breytilegur",
    total: 3038900,
    editable: true,
    items: [
      { name: "Grafískt efni", amount: 1240000 },
      { name: "Viðburðir", amount: 500000 },
      { name: "Spilaefni (reels/tiktok)", amount: 480000 },
      { name: "Prufusendingar", amount: 420000 },
      { name: "Umbúðir / prentun", amount: 398900 },
    ],
  },
  {
    id: "ads-daily",
    title: "Meta + Google (daglegt)",
    total: 48200,
    editable: false,
    items: [
      { name: "Meta (Facebook/Instagram)", amount: 30800 },
      { name: "Google Ads", amount: 17400 },
    ],
  },
];

export interface MonthlyCostHistory {
  month: string;
  operations: number;
  marketingFixed: number;
  marketingVariable: number;
  adsDaily: number;
}

export const costHistory: MonthlyCostHistory[] = [
  { month: "Sep", operations: 4800000, marketingFixed: 3900000, marketingVariable: 2600000, adsDaily: 1290000 },
  { month: "Okt", operations: 4900000, marketingFixed: 4100000, marketingVariable: 2800000, adsDaily: 1350000 },
  { month: "Nóv", operations: 4950000, marketingFixed: 4200000, marketingVariable: 2900000, adsDaily: 1380000 },
  { month: "Des", operations: 5000000, marketingFixed: 4300000, marketingVariable: 3100000, adsDaily: 1410000 },
  { month: "Jan", operations: 5020000, marketingFixed: 4350000, marketingVariable: 2950000, adsDaily: 1440000 },
  { month: "Feb", operations: 5034097, marketingFixed: 4364800, marketingVariable: 3038900, adsDaily: 1446000 },
];
