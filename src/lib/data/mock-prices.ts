export interface WholesalePrice {
  chainId: string;
  chainName: string;
  hydration: number;
  creatine: number;
  energy: number;
  kids: number | null;
}

export const wholesalePrices: WholesalePrice[] = [
  { chainId: "kronan", chainName: "Kronan", hydration: 1206, creatine: 1608, energy: 1350, kids: 1250 },
  { chainId: "samkaup", chainName: "Samkaup", hydration: 1235, creatine: 1800, energy: 1350, kids: null },
  { chainId: "bonus", chainName: "Bonus", hydration: 1235, creatine: 1800, energy: 1350, kids: null },
  { chainId: "hagkaup", chainName: "Hagkaup", hydration: 1206, creatine: 1608, energy: 1350, kids: 1250 },
];

export interface ShopifyPrice {
  category: string;
  retail: number;
  subscription: number;
  discount: number;
}

export const shopifyPrices: ShopifyPrice[] = [
  { category: "Hydration", retail: 1995, subscription: 1696, discount: 15 },
  { category: "Energy", retail: 1995, subscription: 1696, discount: 15 },
  { category: "Creatine", retail: 2890, subscription: 2456, discount: 15 },
  { category: "Kids", retail: 1595, subscription: 1356, discount: 15 },
];

export interface ProductionCost {
  category: string;
  costPerBox: number;
  sticksPerBox: number;
}

export const productionCosts: ProductionCost[] = [
  { category: "Hydration", costPerBox: 280, sticksPerBox: 10 },
  { category: "Creatine", costPerBox: 660, sticksPerBox: 20 },
  { category: "Energy", costPerBox: 280, sticksPerBox: 10 },
  { category: "Kids", costPerBox: 260, sticksPerBox: 8 },
];
