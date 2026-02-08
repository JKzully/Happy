import { cn } from "@/lib/cn";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import type { StoreSale } from "@/lib/data/mock-sales";

const flavorCols = [
  { id: "lemon-lane", short: "Lem." },
  { id: "mixed-berries", short: "Mix.B" },
  { id: "pina-colada", short: "Piña" },
  { id: "peach", short: "Peach" },
  { id: "peru", short: "Peru" },
  { id: "creatine-mixed", short: "Cr.M" },
  { id: "creatine-lemon", short: "Cr.L" },
  { id: "energy-kiwi", short: "Enrg" },
  { id: "krakka-happy", short: "Kids" },
];

function lastSaleColor(lastSale: string): string {
  const match = lastSale.match(/(\d+)\s*dögum/);
  if (match) {
    const days = parseInt(match[1]);
    if (days >= 7) return "text-danger";
    if (days >= 3) return "text-warning";
  }
  return "text-text-dim";
}

export function DrillDownPanel({ stores }: { stores: StoreSale[] }) {
  return (
    <div className="p-4">
      <Table className="text-xs">
        <TableHeader>
          <TableRow>
            <TableHead className="px-2 py-2 text-[11px]">#</TableHead>
            <TableHead className="px-2 py-2 text-[11px]">Útibú</TableHead>
            {flavorCols.map((f) => (
              <TableHead
                key={f.id}
                className="px-2 py-2 text-center text-[11px]"
              >
                {f.short}
              </TableHead>
            ))}
            <TableHead className="px-2 py-2 text-center text-[11px]">
              Samtals
            </TableHead>
            <TableHead className="px-2 py-2 text-right text-[11px]">
              Síðasta sala
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stores.map((store, i) => (
            <TableRow key={store.storeId}>
              <TableCell className="px-2 py-2 text-text-dim">{i + 1}</TableCell>
              <TableCell className="px-2 py-2 font-medium text-foreground">
                {store.storeName}
              </TableCell>
              {flavorCols.map((f) => (
                <TableCell key={f.id} className="px-2 py-2 text-center text-text-secondary">
                  {store.flavors[f.id] || <span className="text-text-dim/40">-</span>}
                </TableCell>
              ))}
              <TableCell className="px-2 py-2 text-center font-semibold text-foreground">
                {store.total}
              </TableCell>
              <TableCell
                className={cn(
                  "px-2 py-2 text-right font-medium",
                  lastSaleColor(store.lastSale)
                )}
              >
                {store.lastSale}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
