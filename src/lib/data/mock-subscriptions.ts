export const subscriptionKPIs = {
  active: { value: 187, change: 12, changeLabel: "fra jan" },
  newThisMonth: { value: 18, changePct: 28 },

  churn: { value: 6, rate: 3.2 },
  avgLTV: { value: 28400, months: 4.2 },
};

export interface SubByProduct {
  productId: string;
  productName: string;
  active: number;
  new: number;
  churned: number;
  revenue: number;
}

export const subscriptionsByProduct: SubByProduct[] = [
  { productId: "lemon-lane", productName: "Lemon Lane", active: 42, new: 5, churned: 1, revenue: 71232 },
  { productId: "mixed-berries", productName: "Mixed Berries", active: 38, new: 4, churned: 1, revenue: 64448 },
  { productId: "creatine-mixed", productName: "Creatine Mixed", active: 28, new: 3, churned: 1, revenue: 68768 },
  { productId: "pina-colada", productName: "Pina Colada", active: 22, new: 2, churned: 0, revenue: 37312 },
  { productId: "peach", productName: "Peach", active: 18, new: 1, churned: 1, revenue: 30528 },
  { productId: "energy-kiwi", productName: "Energy Kiwi", active: 15, new: 1, churned: 0, revenue: 25440 },
  { productId: "peru", productName: "Peru", active: 12, new: 1, churned: 1, revenue: 20352 },
  { productId: "creatine-lemon", productName: "Creatine Lemon", active: 8, new: 1, churned: 1, revenue: 19648 },
  { productId: "krakka-happy", productName: "Krakka Happy", active: 4, new: 0, churned: 0, revenue: 5424 },
];

export interface MonthlySubRevenue {
  month: string;
  active: number;
  revenue: number;
  churnRate: number;
}

export const monthlyRevenue: MonthlySubRevenue[] = [
  { month: "Sep 2025", active: 120, revenue: 185000, churnRate: 4.1 },
  { month: "Okt 2025", active: 132, revenue: 204000, churnRate: 3.8 },
  { month: "Nov 2025", active: 148, revenue: 228000, churnRate: 3.5 },
  { month: "Des 2025", active: 158, revenue: 244000, churnRate: 3.9 },
  { month: "Jan 2026", active: 175, revenue: 270000, churnRate: 3.4 },
  { month: "Feb 2026", active: 187, revenue: 343152, churnRate: 3.2 },
];
