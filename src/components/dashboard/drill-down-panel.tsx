"use client";

import { cn } from "@/lib/cn";
import type { StoreSale } from "@/hooks/use-period-sales";

const flavorRows = [
  { id: "lemon-lime", name: "Lemon Lime" },
  { id: "mixed-berries", name: "Mixed Berries" },
  { id: "pina-colada", name: "Piña Colada" },
  { id: "peach", name: "Peach" },
  { id: "peru", name: "Peru" },
  { id: "creatine-mixed", name: "Creatine Mixed" },
  { id: "creatine-lemon", name: "Creatine Lemon" },
  { id: "energy-kiwi", name: "Energy Kiwi" },
  { id: "krakka-happy", name: "Kids" },
];

function lastSaleColor(lastSale: string): string {
  if (lastSale === "Í dag") return "text-primary";
  if (lastSale === "Í gær") return "text-warning";
  const match = lastSale.match(/(\d+)\s*dögum/);
  if (match) {
    const days = parseInt(match[1]);
    if (days >= 7) return "text-danger";
    return "text-warning";
  }
  return "text-text-dim";
}

const COL0_W = 24;
const COL1_LEFT = COL0_W;

const sticky0 = "sticky left-0 z-20 bg-surface";
const sticky1 = "sticky z-20 bg-surface border-r border-border";
const stickyR = "sticky right-0 z-20 bg-surface border-l border-border";

export function DrillDownPanel({ stores }: { stores: StoreSale[] }) {
  // Sort: stores with sales first (desc), then zero-sales alphabetically
  const sorted = [...stores].sort((a, b) => {
    if (a.total > 0 && b.total === 0) return -1;
    if (a.total === 0 && b.total > 0) return 1;
    if (a.total > 0 && b.total > 0) return b.total - a.total;
    return a.storeName.localeCompare(b.storeName, "is");
  });

  const flavorTotals = flavorRows.map((f) =>
    sorted.reduce((sum, s) => sum + (s.flavors[f.id] || 0), 0)
  );
  const grandTotal = sorted.reduce((sum, s) => sum + s.total, 0);

  return (
    <div className="p-4">
      <div className="overflow-x-auto">
        <table className="text-xs border-collapse">
          <thead>
            <tr>
              <th
                className={cn(
                  "text-left text-[11px] font-medium text-text-dim",
                  sticky0
                )}
                style={{ width: COL0_W, minWidth: COL0_W, padding: "6px 4px" }}
              >
                #
              </th>

              <th
                className={cn(
                  "text-left text-[11px] font-medium text-text-dim",
                  sticky1
                )}
                style={{ left: COL1_LEFT, minWidth: 100, padding: "6px 8px" }}
              >
                Vara
              </th>

              {sorted.map((store) => (
                <th
                  key={store.storeId}
                  className={cn(
                    "text-[11px] font-medium text-center whitespace-nowrap",
                    store.total > 0
                      ? "text-text-secondary"
                      : "text-text-dim/50"
                  )}
                  style={{ minWidth: 56, padding: "6px 8px" }}
                  title={store.storeName}
                >
                  {store.storeName}
                </th>
              ))}

              <th
                className={cn(
                  "text-center text-[11px] font-semibold text-text-dim",
                  stickyR
                )}
                style={{ minWidth: 52, padding: "6px 8px" }}
              >
                Samtals
              </th>
            </tr>
          </thead>

          <tbody>
            {flavorRows.map((flavor, i) => {
              const total = flavorTotals[i];
              if (total === 0) return null;
              return (
                <tr key={flavor.id} className="border-t border-border/40">
                  <td
                    className={cn("text-text-dim", sticky0)}
                    style={{ padding: "6px 4px" }}
                  >
                    {i + 1}
                  </td>
                  <td
                    className={cn(
                      "font-medium text-foreground whitespace-nowrap",
                      sticky1
                    )}
                    style={{ left: COL1_LEFT, padding: "6px 8px" }}
                  >
                    {flavor.name}
                  </td>
                  {sorted.map((store) => {
                    const qty = store.flavors[flavor.id] || 0;
                    const inactive = store.total === 0;
                    return (
                      <td
                        key={store.storeId}
                        className={cn(
                          "text-center",
                          inactive
                            ? "text-text-dim/30"
                            : "text-text-secondary"
                        )}
                        style={{ padding: "6px 8px" }}
                      >
                        {qty || (
                          <span
                            className={
                              inactive
                                ? "text-text-dim/30"
                                : "text-text-dim/40"
                            }
                          >
                            -
                          </span>
                        )}
                      </td>
                    );
                  })}
                  <td
                    className={cn(
                      "text-center font-semibold text-foreground",
                      stickyR
                    )}
                    style={{ padding: "6px 8px" }}
                  >
                    {total}
                  </td>
                </tr>
              );
            })}

            {/* Samtals row */}
            <tr className="border-t-2 border-border">
              <td
                className={cn(sticky0)}
                style={{ padding: "6px 4px" }}
              />
              <td
                className={cn("font-semibold text-foreground", sticky1)}
                style={{ left: COL1_LEFT, padding: "6px 8px" }}
              >
                Samtals
              </td>
              {sorted.map((store) => {
                const inactive = store.total === 0;
                return (
                  <td
                    key={store.storeId}
                    className={cn(
                      "text-center font-semibold",
                      inactive ? "text-text-dim/30" : "text-foreground"
                    )}
                    style={{ padding: "6px 8px" }}
                  >
                    {store.total || (
                      <span className="text-text-dim/30">-</span>
                    )}
                  </td>
                );
              })}
              <td
                className={cn(
                  "text-center font-bold text-primary",
                  stickyR
                )}
                style={{ padding: "6px 8px" }}
              >
                {grandTotal}
              </td>
            </tr>

            {/* Síðasta sala row */}
            <tr className="border-t border-border/40">
              <td
                className={cn(sticky0)}
                style={{ padding: "6px 4px" }}
              />
              <td
                className={cn(
                  "text-[10px] uppercase tracking-wider text-text-dim",
                  sticky1
                )}
                style={{ left: COL1_LEFT, padding: "6px 8px" }}
              >
                Síðasta sala
              </td>
              {sorted.map((store) => {
                const inactive = store.total === 0;
                return (
                  <td
                    key={store.storeId}
                    className={cn(
                      "text-center text-[10px] font-medium whitespace-nowrap",
                      inactive
                        ? "text-text-dim/30"
                        : lastSaleColor(store.lastSale)
                    )}
                    style={{ padding: "6px 8px" }}
                  >
                    {store.lastSale}
                  </td>
                );
              })}
              <td
                className={cn(stickyR)}
                style={{ padding: "6px 8px" }}
              />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
