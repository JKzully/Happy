export interface Store {
  id: string;
  name: string;
  chainId: string;
  subChainId?: string;
}

export interface SubChain {
  id: string;
  name: string;
  storeCount: number;
}

export interface Chain {
  id: string;
  name: string;
  storeCount: number;
  color: string;
  logo?: string;
  subChains?: SubChain[];
}

export const chains: Chain[] = [
  { id: "kronan", name: "Krónan", storeCount: 27, color: "#60A5FA", logo: "/logos/kronan.svg" },
  {
    id: "samkaup",
    name: "Samkaup",
    storeCount: 44,
    color: "#A78BFA",
    logo: "/logos/samkaup.png",
    subChains: [
      { id: "netto", name: "Nettó", storeCount: 21 },
      { id: "kjorbudir", name: "Kjörbuðir", storeCount: 19 },
      { id: "iceland", name: "Iceland", storeCount: 1 },
      { id: "extra", name: "Extra", storeCount: 2 },
      { id: "krambud", name: "Krambuð", storeCount: 1 },
    ],
  },
  { id: "bonus", name: "Bónus", storeCount: 34, color: "#FB923C", logo: "/logos/bonus.png" },
  { id: "hagkaup", name: "Hagkaup", storeCount: 7, color: "#22D3EE", logo: "/logos/hagkaup.png" },
  { id: "shopify", name: "Shopify", storeCount: 0, color: "#34D399", logo: "/logos/shopify.svg" },
  { id: "n1", name: "N1", storeCount: 0, color: "#94A3B8" },
];

export const sampleStores: Store[] = [
  { id: "kr-1", name: "Krónan Grandi", chainId: "kronan" },
  { id: "kr-2", name: "Krónan Skeifan", chainId: "kronan" },
  { id: "kr-3", name: "Krónan Holtagarðar", chainId: "kronan" },
  { id: "kr-4", name: "Krónan Akureyri", chainId: "kronan" },
  { id: "kr-5", name: "Krónan Selfoss", chainId: "kronan" },
  { id: "sa-1", name: "Nettó Skógarlönd", chainId: "samkaup", subChainId: "netto" },
  { id: "sa-2", name: "Nettó Grafarvogur", chainId: "samkaup", subChainId: "netto" },
  { id: "sa-3", name: "Kjörbuðin Vesturbæjar", chainId: "samkaup", subChainId: "kjorbudir" },
  { id: "sa-4", name: "Kjörbuðin Hafnarfjörður", chainId: "samkaup", subChainId: "kjorbudir" },
  { id: "sa-5", name: "Iceland Kringlan", chainId: "samkaup", subChainId: "iceland" },
  { id: "bo-1", name: "Bónus Garðastræti", chainId: "bonus" },
  { id: "bo-2", name: "Bónus Breiðholti", chainId: "bonus" },
  { id: "bo-3", name: "Bónus Akureyri", chainId: "bonus" },
  { id: "ha-1", name: "Hagkaup Kringlan", chainId: "hagkaup" },
  { id: "ha-2", name: "Hagkaup Smáralind", chainId: "hagkaup" },
  { id: "ha-3", name: "Hagkaup Akureyri", chainId: "hagkaup" },
];
