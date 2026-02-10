"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Loader2,
  Save,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { categoryLabels } from "@/lib/data/products";
import { useInventory } from "@/hooks/use-inventory";
import type { ProductInventory } from "@/hooks/use-inventory";
import { toast } from "sonner";

const chainOptions = [
  { slug: "kronan", name: "Krónan" },
  { slug: "samkaup", name: "Samkaup" },
  { slug: "bonus", name: "Bónus" },
  { slug: "hagkaup", name: "Hagkaup" },
  { slug: "n1", name: "N1" },
  { slug: "shopify", name: "Shopify" },
];

const categoryBadgeVariant: Record<
  string,
  "success" | "info" | "warning" | "danger"
> = {
  hydration: "info",
  creatine: "success",
  energy: "warning",
  kids: "danger",
};

const statusBadge: Record<string, { variant: "success" | "warning" | "danger"; label: string }> = {
  green: { variant: "success", label: "Gott" },
  yellow: { variant: "warning", label: "Fylgjast með" },
  red: { variant: "danger", label: "Panta" },
};

function formatNum(n: number): string {
  return n.toLocaleString("is-IS");
}

function ExpandableRow({ product }: { product: ProductInventory }) {
  const [expanded, setExpanded] = useState(false);
  const sb = statusBadge[product.status];

  return (
    <>
      <TableRow
        className="cursor-pointer hover:bg-surface-elevated/40"
        onClick={() => setExpanded(!expanded)}
      >
        <TableCell className="w-8">
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-text-dim" />
          ) : (
            <ChevronRight className="h-4 w-4 text-text-dim" />
          )}
        </TableCell>
        <TableCell className="font-semibold text-foreground">
          {product.productName}
        </TableCell>
        <TableCell>
          <Badge variant={categoryBadgeVariant[product.category]}>
            {categoryLabels[product.category as keyof typeof categoryLabels]}
          </Badge>
        </TableCell>
        <TableCell className="text-right font-medium text-foreground">
          {formatNum(product.warehouseBoxes)}
        </TableCell>
        <TableCell className="text-right font-medium text-foreground">
          {formatNum(product.storeBoxes)}
        </TableCell>
        <TableCell className="text-right font-medium text-foreground">
          {formatNum(product.totalBoxes)}
        </TableCell>
        <TableCell className="text-right text-foreground">
          {formatNum(product.monthlyRate)}
        </TableCell>
        <TableCell className="text-right text-foreground">
          {product.monthsRemaining !== null
            ? product.monthsRemaining.toFixed(1)
            : "—"}
        </TableCell>
        <TableCell>
          <Badge variant={sb.variant}>{sb.label}</Badge>
        </TableCell>
      </TableRow>

      {expanded && product.locations.length > 0 && (
        <TableRow>
          <TableCell colSpan={9} className="bg-surface-elevated/30 px-8 py-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-dim mb-2">
                Sundurliðun eftir staðsetningu
              </p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-text-dim text-xs">
                    <th className="text-left py-1 font-medium">Tegund</th>
                    <th className="text-left py-1 font-medium">
                      Staðsetning
                    </th>
                    <th className="text-left py-1 font-medium">Keðja</th>
                    <th className="text-right py-1 font-medium">Kassar</th>
                  </tr>
                </thead>
                <tbody>
                  {product.locations.map((loc, i) => (
                    <tr key={i} className="border-t border-border/50">
                      <td className="py-1.5 text-foreground">
                        {loc.locationType === "warehouse" ? "Lager" : "Verslun"}
                      </td>
                      <td className="py-1.5 text-foreground">
                        {loc.locationName}
                      </td>
                      <td className="py-1.5 text-text-secondary">
                        {loc.chainSlug ?? "—"}
                      </td>
                      <td className="py-1.5 text-right font-medium text-foreground">
                        {formatNum(loc.quantityBoxes)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TableCell>
        </TableRow>
      )}

      {expanded && product.locations.length === 0 && (
        <TableRow>
          <TableCell colSpan={9} className="bg-surface-elevated/30 px-8 py-3">
            <p className="text-sm text-text-dim">
              Engar birgðir skráðar fyrir þessa vöru.
            </p>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export default function InventoryPage() {
  const {
    isLoading,
    products,
    totalWarehouse,
    totalStore,
    totalAll,
    refetch,
  } = useInventory();

  const [formProductId, setFormProductId] = useState("");
  const [formLocationType, setFormLocationType] = useState<
    "warehouse" | "store"
  >("warehouse");
  const [formLocationName, setFormLocationName] = useState("");
  const [formChainSlug, setFormChainSlug] = useState("");
  const [formQuantity, setFormQuantity] = useState("");
  const [saving, setSaving] = useState(false);

  const redProducts = products.filter((p) => p.status === "red");

  async function handleSave() {
    if (!formProductId || !formLocationName || !formQuantity) {
      toast.error("Fylltu út alla reiti");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    const { error } = await (supabase.from("inventory") as ReturnType<typeof supabase.from>).upsert(
      {
        product_id: formProductId,
        location_type: formLocationType,
        location_name: formLocationName.trim(),
        chain_slug:
          formLocationType === "store" && formChainSlug
            ? formChainSlug
            : null,
        quantity_boxes: parseInt(formQuantity, 10),
      } as never,
      { onConflict: "product_id,location_type,location_name" }
    ) as unknown as { error: { message: string } | null };

    setSaving(false);

    if (error) {
      toast.error("Villa við vistun: " + error.message);
    } else {
      toast.success("Birgðir vistaðar");
      setFormQuantity("");
      refetch();
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Birgðir"
          subtitle="Birgðastaða og pöntunarviðvaranir"
        />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-text-dim" />
          <span className="ml-3 text-sm text-text-dim">
            Sæki birgðagögn...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Birgðir"
        subtitle="Birgðastaða og pöntunarviðvaranir"
      />

      {/* Alert banner */}
      {redProducts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Pöntun nauðsynleg</AlertTitle>
          <AlertDescription>
            {redProducts.map((p) => (
              <span key={p.productId}>
                <strong>{p.productName}</strong> ({p.monthsRemaining !== null ? p.monthsRemaining.toFixed(1) : "0"} mán. eftir)
              </span>
            )).reduce<React.ReactNode[]>((acc, el, i) => {
              if (i === 0) return [el];
              return [...acc, ", ", el];
            }, [])}
            {" "}— framleiðslutími er 5 mánuðir.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Lager heima" value={formatNum(totalWarehouse)} />
        <StatCard label="Lager úti" value={formatNum(totalStore)} />
        <StatCard label="Samtals" value={formatNum(totalAll)} />
      </div>

      {/* Product table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow className="bg-surface-elevated/50">
              <TableHead className="w-8" />
              <TableHead>Vara</TableHead>
              <TableHead>Flokkur</TableHead>
              <TableHead className="text-right">Lager heima</TableHead>
              <TableHead className="text-right">Lager úti</TableHead>
              <TableHead className="text-right">Samtals</TableHead>
              <TableHead className="text-right">Sala/mán</TableHead>
              <TableHead className="text-right">Mánuðir eftir</TableHead>
              <TableHead>Staða</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <ExpandableRow key={product.productId} product={product} />
            ))}
            {products.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="py-8 text-center">
                  <p className="text-sm text-text-secondary">
                    Engar vörur fundust.
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Entry form */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Skrá birgðir
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {/* Product select */}
          <div className="lg:col-span-2">
            <label className="mb-1.5 block text-xs font-medium text-text-dim">
              Vara
            </label>
            <Select value={formProductId} onValueChange={setFormProductId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Veldu vöru" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.productId} value={p.productId}>
                    {p.productName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location type */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-dim">
              Tegund
            </label>
            <Select
              value={formLocationType}
              onValueChange={(v) =>
                setFormLocationType(v as "warehouse" | "store")
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="warehouse">Lager</SelectItem>
                <SelectItem value="store">Verslun</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Location name */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-dim">
              Staðsetning
            </label>
            <Input
              placeholder="t.d. Garðabær"
              value={formLocationName}
              onChange={(e) => setFormLocationName(e.target.value)}
            />
          </div>

          {/* Chain slug (only for store) */}
          {formLocationType === "store" && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-dim">
                Keðja
              </label>
              <Select value={formChainSlug} onValueChange={setFormChainSlug}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Veldu keðju" />
                </SelectTrigger>
                <SelectContent>
                  {chainOptions.map((c) => (
                    <SelectItem key={c.slug} value={c.slug}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Quantity */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-dim">
              Fjöldi kassa
            </label>
            <Input
              type="number"
              min={0}
              placeholder="0"
              value={formQuantity}
              onChange={(e) => setFormQuantity(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Vista
          </Button>
        </div>
      </Card>
    </div>
  );
}
