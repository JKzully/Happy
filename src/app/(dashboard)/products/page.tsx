import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { formatKr } from "@/lib/format";
import { categoryLabels } from "@/lib/data/products";
import { TrendingUp, TrendingDown } from "lucide-react";

interface ProductRanking {
  name: string;
  category: "hydration" | "creatine" | "energy" | "kids";
  boxes30d: number;
  revenue: number;
  margin: number;
  trend: number;
}

const rankings: ProductRanking[] = [
  { name: "Lemon Lane", category: "hydration", boxes30d: 342, revenue: 412000, margin: 68, trend: 15 },
  { name: "Mixed Berries", category: "hydration", boxes30d: 298, revenue: 359000, margin: 65, trend: 8 },
  { name: "Creatine Mixed", category: "creatine", boxes30d: 245, revenue: 394000, margin: 58, trend: 22 },
  { name: "Pina Colada", category: "hydration", boxes30d: 187, revenue: 225000, margin: 64, trend: -3 },
  { name: "Peach", category: "hydration", boxes30d: 165, revenue: 199000, margin: 66, trend: 5 },
  { name: "Energy Kiwi", category: "energy", boxes30d: 156, revenue: 188000, margin: 62, trend: 18 },
  { name: "Peru", category: "hydration", boxes30d: 134, revenue: 161000, margin: 63, trend: -8 },
  { name: "Creatine Lemon", category: "creatine", boxes30d: 98, revenue: 157000, margin: 55, trend: 12 },
  { name: "Krakka Happy", category: "kids", boxes30d: 67, revenue: 86000, margin: 60, trend: 32 },
];

const categoryBadgeVariant: Record<string, "success" | "info" | "warning" | "danger"> = {
  hydration: "info",
  creatine: "success",
  energy: "warning",
  kids: "danger",
};

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Vörur" subtitle="Afkoma eftir vöru - síðastliðir 30 dagar" />

      <Card>
        <Table>
          <TableHeader>
            <TableRow className="bg-surface-elevated/50">
              <TableHead>#</TableHead>
              <TableHead>Bragð</TableHead>
              <TableHead>Flokkur</TableHead>
              <TableHead className="text-right">Kassar (30d)</TableHead>
              <TableHead className="text-right">Tekjur</TableHead>
              <TableHead className="text-right">Framlegð %</TableHead>
              <TableHead className="text-right">Þróun</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rankings.map((product, i) => (
              <TableRow key={product.name}>
                <TableCell className="font-medium text-text-dim">
                  {i + 1}
                </TableCell>
                <TableCell className="font-semibold text-foreground">
                  {product.name}
                </TableCell>
                <TableCell>
                  <Badge variant={categoryBadgeVariant[product.category]}>
                    {categoryLabels[product.category]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium text-foreground">
                  {product.boxes30d}
                </TableCell>
                <TableCell className="text-right text-foreground">
                  {formatKr(product.revenue)}
                </TableCell>
                <TableCell className="text-right text-foreground">
                  {product.margin}%
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {product.trend >= 0 ? (
                      <TrendingUp className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5 text-danger" />
                    )}
                    <span
                      className={
                        product.trend >= 0 ? "text-primary font-semibold" : "text-danger font-semibold"
                      }
                    >
                      {product.trend >= 0 ? "+" : ""}
                      {product.trend}%
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
