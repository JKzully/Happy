export interface Product {
  id: string;
  name: string;
  category: "hydration" | "creatine" | "energy" | "kids";
  productionCost: number;
  sticksPerBox: number;
}

export const products: Product[] = [
  { id: "lemon-lane", name: "Lemon Lane", category: "hydration", productionCost: 280, sticksPerBox: 10 },
  { id: "mixed-berries", name: "Mixed Berries", category: "hydration", productionCost: 280, sticksPerBox: 10 },
  { id: "pina-colada", name: "Pina Colada", category: "hydration", productionCost: 280, sticksPerBox: 10 },
  { id: "peach", name: "Peach", category: "hydration", productionCost: 280, sticksPerBox: 10 },
  { id: "peru", name: "Peru", category: "hydration", productionCost: 280, sticksPerBox: 10 },
  { id: "creatine-mixed", name: "Creatine Mixed", category: "creatine", productionCost: 660, sticksPerBox: 20 },
  { id: "creatine-lemon", name: "Creatine Lemon", category: "creatine", productionCost: 660, sticksPerBox: 20 },
  { id: "energy-kiwi", name: "Energy Kiwi", category: "energy", productionCost: 280, sticksPerBox: 10 },
  { id: "jolabragd", name: "Jólabragð", category: "hydration", productionCost: 280, sticksPerBox: 10 },
  { id: "krakka-happy", name: "Krakka Happy", category: "kids", productionCost: 260, sticksPerBox: 8 },
  { id: "krakka-green-apple-kiwi", name: "Kids Green Apple Kiwi", category: "kids", productionCost: 260, sticksPerBox: 8 },
  { id: "krakka-mixed-berry", name: "Kids Mixed Berry", category: "kids", productionCost: 260, sticksPerBox: 8 },
];

export const categoryLabels: Record<Product["category"], string> = {
  hydration: "Hydration",
  creatine: "Creatine",
  energy: "Energy",
  kids: "Kids",
};
