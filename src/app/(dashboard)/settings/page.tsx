"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { formatKr } from "@/lib/format";
import {
  wholesalePrices,
  shopifyPrices,
  productionCosts,
} from "@/lib/data/mock-prices";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SettingsPage() {
  const [wholesale, setWholesale] = useState(wholesalePrices);
  const [shopify, setShopify] = useState(shopifyPrices);
  const [production, setProduction] = useState(productionCosts);

  return (
    <div className="space-y-6">
      <PageHeader title="Stillingar" subtitle="Verðskrá og framleiðslukostnaður">
        <Button>
          <Save className="h-4 w-4" />
          Vista breytingar
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4">
        {wholesale.map((chain, ci) => (
          <Card key={chain.chainId}>
            <CardHeader>
              <h3 className="text-sm font-semibold text-foreground">
                Heildsöluverð - {chain.chainName}
              </h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {(["hydration", "creatine", "energy", "kids"] as const).map(
                  (cat) => (
                    <div key={cat}>
                      <label className="mb-1 block text-xs capitalize text-text-dim">
                        {cat}
                      </label>
                      <Input
                        type="number"
                        value={chain[cat] ?? ""}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setWholesale((prev) =>
                            prev.map((c, i) =>
                              i === ci ? { ...c, [cat]: val } : c
                            )
                          );
                        }}
                        disabled={chain[cat] === null}
                        className="h-auto py-2"
                      />
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-foreground">
              Shopify verð
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {shopify.map((row, ri) => (
                <div key={row.category} className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-text-dim">
                      {row.category} (smásala)
                    </label>
                    <input
                      type="number"
                      value={row.retail}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setShopify((prev) =>
                          prev.map((r, i) =>
                            i === ri ? { ...r, retail: val } : r
                          )
                        );
                      }}
                      className="h-auto py-2"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-text-dim">
                      Áskrift
                    </label>
                    <input
                      type="number"
                      value={row.subscription}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setShopify((prev) =>
                          prev.map((r, i) =>
                            i === ri ? { ...r, subscription: val } : r
                          )
                        );
                      }}
                      className="h-auto py-2"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-text-dim">
                      Afsl. %
                    </label>
                    <input
                      type="number"
                      value={row.discount}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setShopify((prev) =>
                          prev.map((r, i) =>
                            i === ri ? { ...r, discount: val } : r
                          )
                        );
                      }}
                      className="h-auto py-2"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-foreground">
              Framleiðslukostnaður
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {production.map((row, ri) => (
                <div key={row.category} className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-text-dim">
                      {row.category}
                    </label>
                    <input
                      type="number"
                      value={row.costPerBox}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setProduction((prev) =>
                          prev.map((r, i) =>
                            i === ri ? { ...r, costPerBox: val } : r
                          )
                        );
                      }}
                      className="h-auto py-2"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-text-dim">
                      Stykki/kassi
                    </label>
                    <input
                      type="number"
                      value={row.sticksPerBox}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setProduction((prev) =>
                          prev.map((r, i) =>
                            i === ri ? { ...r, sticksPerBox: val } : r
                          )
                        );
                      }}
                      className="h-auto py-2"
                    />
                  </div>
                  <div className="flex items-end">
                    <p className="py-2 text-sm text-text-dim">
                      {formatKr(row.costPerBox)} / kassi
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
