"use client";

import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { parseSalesExcel } from "@/lib/excel/parse-sales";
import type { ParseResult, ParsedSaleRow } from "@/lib/excel/parse-sales";
import { matchStore, stripChainPrefix, detectChainSlug, detectSubChainType } from "@/lib/excel/sku-map";
import { sampleStores } from "@/lib/data/chains";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";

type StoreRow = Database["public"]["Tables"]["stores"]["Row"];
type DailySalesRow = Database["public"]["Tables"]["daily_sales"]["Row"];
type ChainRow = Database["public"]["Tables"]["retail_chains"]["Row"];

type State = "idle" | "parsing" | "preview" | "saving" | "done" | "error";

interface MatchedRow extends ParsedSaleRow {
  storeId: string | null;
  isDuplicate: boolean;
  isNewStore: boolean;
}

export function ExcelUpload() {
  const [state, setState] = useState<State>("idle");
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [matchedRows, setMatchedRows] = useState<MatchedRow[]>([]);
  const [error, setError] = useState<string>("");
  const [savedCount, setSavedCount] = useState(0);
  const [savedStoreCount, setSavedStoreCount] = useState(0);
  const [savedDate, setSavedDate] = useState("");
  const [fileName, setFileName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [chainSlugToId, setChainSlugToId] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    if (!file.name.endsWith(".xlsx")) {
      setError("Aðeins .xlsx skrár eru studdar.");
      setState("error");
      return;
    }

    setFileName(file.name);
    setState("parsing");
    setError("");

    try {
      const buffer = await file.arrayBuffer();
      const result = parseSalesExcel(buffer);
      setParseResult(result);

      // Fetch retail chains and stores from DB
      const slugToId: Record<string, string> = {};
      let knownStores: { id: string; name: string }[] = [];
      try {
        const supabase = createClient();
        const { data: chainData } = (await supabase.from("retail_chains").select()) as {
          data: ChainRow[] | null;
        };
        if (chainData) {
          for (const c of chainData) {
            slugToId[c.slug] = c.id;
          }
        }
        const { data: storeData } = (await supabase.from("stores").select()) as {
          data: StoreRow[] | null;
        };
        if (storeData && storeData.length > 0) {
          knownStores = storeData.map((s) => ({ id: s.id, name: s.name }));
        }
      } catch {
        // DB not available, use sample stores
      }
      setChainSlugToId(slugToId);
      if (knownStores.length === 0) {
        knownStores = sampleStores.map((s) => ({ id: s.id, name: s.name }));
      }

      // Check for existing records for this date
      let existingKeys = new Set<string>();
      try {
        const supabase = createClient();
        const { data } = (await supabase
          .from("daily_sales")
          .select()
          .eq("date", result.date)) as { data: DailySalesRow[] | null };
        if (data) {
          existingKeys = new Set(
            data.map((d) => `${d.store_id}:${d.product_id}`)
          );
        }
      } catch {
        // DB not available
      }

      // Match stores and check duplicates.
      // For unmatched stores, generate a temporary ID and mark as new.
      const newStoreMap = new Map<string, string>(); // rawStoreName → temp ID
      let newStoreCounter = 0;

      const matched: MatchedRow[] = result.rows.map((row) => {
        let storeId = matchStore(row.rawStoreName, knownStores);
        let isNewStore = false;

        if (!storeId) {
          // Assign a stable temp ID for this raw store name
          if (!newStoreMap.has(row.rawStoreName)) {
            newStoreCounter++;
            const slug = stripChainPrefix(row.rawStoreName)
              .toLowerCase()
              .replace(/[^a-záðéíóúýþæö0-9]+/gi, "-")
              .replace(/-+/g, "-")
              .replace(/^-|-$/g, "");
            const chainSlug = detectChainSlug(row.rawStoreName);
            const prefix = chainSlug ? chainSlug.slice(0, 3) : "xx";
            newStoreMap.set(row.rawStoreName, `${prefix}-new-${slug || newStoreCounter}`);
          }
          storeId = newStoreMap.get(row.rawStoreName)!;
          isNewStore = true;
        }

        const isDuplicate =
          storeId && row.productId && !isNewStore
            ? existingKeys.has(`${storeId}:${row.productId}`)
            : false;

        return { ...row, storeId, isDuplicate, isNewStore };
      });

      setMatchedRows(matched);
      setState("preview");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Villa við lestur skráar."
      );
      setState("error");
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      // Reset input so same file can be re-selected
      e.target.value = "";
    },
    [processFile]
  );

  const handleSave = async () => {
    if (!parseResult) return;

    // Only save rows with both storeId and productId
    const saveable = matchedRows.filter((r) => r.storeId && r.productId);
    if (saveable.length === 0) {
      setError("Engar raðir til að vista — engin útibú eða vörur pössuðu.");
      return;
    }

    setState("saving");

    try {
      const supabase = createClient();

      // Auto-create new stores in Supabase first
      const newStoreRows = saveable.filter((r) => r.isNewStore);
      const seenNewStores = new Set<string>();
      const tempIdToRealId = new Map<string, string>();

      for (const row of newStoreRows) {
        if (seenNewStores.has(row.storeId!)) continue;
        seenNewStores.add(row.storeId!);

        const chainSlug = detectChainSlug(row.rawStoreName) || row.chainName.toLowerCase();
        const chainUuid = chainSlugToId[chainSlug];
        if (!chainUuid) {
          throw new Error(`Keðja "${chainSlug}" finnst ekki í gagnagrunni. Keyra seed migration fyrst.`);
        }

        const storeName = stripChainPrefix(row.rawStoreName);
        const subChainType = detectSubChainType(row.rawStoreName);

        const insertPayload: Record<string, unknown> = {
          chain_id: chainUuid,
          name: storeName,
        };
        if (subChainType) {
          insertPayload.sub_chain_type = subChainType;
        }

        const { data: inserted, error: insertError } = (await (supabase
          .from("stores") as ReturnType<typeof supabase.from>)
          .insert(insertPayload)
          .select()
          .single()) as { data: StoreRow | null; error: unknown };

        if (insertError) throw insertError;
        if (inserted) {
          tempIdToRealId.set(row.storeId!, inserted.id);
        }
      }

      // Build upsert rows, replacing temp IDs with real DB IDs
      const upsertRows = saveable.map((r) => ({
        date: r.date,
        store_id: tempIdToRealId.get(r.storeId!) || r.storeId!,
        product_id: r.productId!,
        quantity: r.quantity,
      }));

      const { error: upsertError } = await (supabase
        .from("daily_sales") as ReturnType<typeof supabase.from>)
        .upsert(upsertRows, { onConflict: "date,store_id,product_id" });

      if (upsertError) throw upsertError;

      const uniqueStores = new Set(saveable.map((r) => r.storeId));
      setSavedCount(saveable.reduce((sum, r) => sum + r.quantity, 0));
      setSavedStoreCount(uniqueStores.size);
      setSavedDate(parseResult.date);
      setState("done");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Villa við vistun í gagnagrunn."
      );
      setState("error");
    }
  };

  const handleReset = () => {
    setState("idle");
    setParseResult(null);
    setMatchedRows([]);
    setError("");
    setFileName("");
  };

  // Group rows by store for preview
  const groupedByStore = matchedRows.reduce<
    Record<string, MatchedRow[]>
  >((acc, row) => {
    const key = row.rawStoreName;
    if (!acc[key]) acc[key] = [];
    acc[key].push(row);
    return acc;
  }, {});

  const saveableCount = matchedRows.filter(
    (r) => r.storeId && r.productId
  ).length;
  const hasDuplicates = matchedRows.some((r) => r.isDuplicate);
  const newStoreCount = new Set(
    matchedRows.filter((r) => r.isNewStore).map((r) => r.rawStoreName)
  ).size;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            Hlaða upp söluskýrslu
          </h3>
          <Badge variant="info">Excel</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* IDLE — Dropzone */}
        {state === "idle" && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 cursor-pointer transition-colors ${
              dragOver
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-surface-elevated/50"
            }`}
          >
            <Upload
              className={`h-8 w-8 ${dragOver ? "text-primary" : "text-text-dim"}`}
            />
            <div className="text-center">
              <p className="text-sm text-foreground">
                Dragðu .xlsx söluskýrslu hingað eða smelltu til að velja skrá
              </p>
              <p className="mt-1 text-xs text-text-dim">
                Studdar keðjur: Krónan, Bónus, Samkaup, Hagkaup
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {/* PARSING */}
        {state === "parsing" && (
          <div className="flex items-center justify-center gap-3 py-10">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm text-text-secondary">
              Les skrá: {fileName}...
            </span>
          </div>
        )}

        {/* ERROR */}
        {state === "error" && (
          <div className="space-y-3">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Villa</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button variant="outline" onClick={handleReset}>
              Reyna aftur
            </Button>
          </div>
        )}

        {/* PREVIEW */}
        {state === "preview" && parseResult && (
          <div className="space-y-4">
            {/* Summary bar */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="neutral">{parseResult.date}</Badge>
              <Badge variant="info">{parseResult.chainName}</Badge>
              <Badge variant="neutral">
                {parseResult.storeCount} útibú
              </Badge>
              <Badge variant="success">
                {parseResult.totalBoxes} kassar
              </Badge>
              {newStoreCount > 0 && (
                <Badge variant="info">
                  {newStoreCount} {newStoreCount === 1 ? "nýtt útibú" : "ný útibú"}
                </Badge>
              )}
              {hasDuplicates && (
                <Badge variant="warning">Sumt til í gagnagrunni</Badge>
              )}
            </div>

            {/* Warnings */}
            {parseResult.warnings.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>
                  Aðvaranir ({parseResult.warnings.length})
                </AlertTitle>
                <AlertDescription>
                  <ul className="mt-1 list-disc pl-4 space-y-0.5">
                    {parseResult.warnings.map((w, i) => (
                      <li key={i}>{w.message}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Preview table */}
            <div className="max-h-[400px] overflow-y-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Útibú</TableHead>
                    <TableHead>Vara</TableHead>
                    <TableHead className="text-right">Magn</TableHead>
                    <TableHead>Staða</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(groupedByStore).map(
                    ([storeName, storeRows]) =>
                      storeRows.map((row, idx) => (
                        <TableRow
                          key={`${storeName}-${idx}`}
                          className={
                            row.isDuplicate
                              ? "bg-warning-light/30"
                              : !row.productId
                                ? "opacity-50"
                                : ""
                          }
                        >
                          <TableCell className="text-sm">
                            {idx === 0 ? (
                              <>
                                {row.rawStoreName}
                                {row.isNewStore && (
                                  <Badge variant="info" className="ml-2">Nýtt útibú</Badge>
                                )}
                              </>
                            ) : ""}
                          </TableCell>
                          <TableCell className="text-sm">
                            {row.productName}
                            {!row.productId && (
                              <span className="ml-1 text-xs text-danger">
                                (óþekkt)
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-sm">
                            {row.quantity}
                          </TableCell>
                          <TableCell>
                            {row.isNewStore ? (
                              <Badge variant="info">Ný</Badge>
                            ) : row.isDuplicate ? (
                              <Badge variant="warning">Til í DB</Badge>
                            ) : (
                              <Badge variant="success">Ný</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button
                onClick={handleSave}
                disabled={saveableCount === 0}
              >
                <Check className="h-4 w-4" />
                Staðfesta og vista
                {saveableCount > 0 && ` (${saveableCount})`}
              </Button>
              <Button variant="outline" onClick={handleReset}>
                <X className="h-4 w-4" />
                Hætta við
              </Button>
              <span className="text-xs text-text-dim">
                {hasDuplicates && "Færslur sem eru til verða yfirskrifaðar. "}
                {newStoreCount > 0 && `${newStoreCount} ${newStoreCount === 1 ? "nýtt útibú verður búið" : "ný útibú verða búin"} til sjálfkrafa.`}
              </span>
            </div>
          </div>
        )}

        {/* SAVING */}
        {state === "saving" && (
          <div className="flex items-center justify-center gap-3 py-10">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm text-text-secondary">
              Vista gögn...
            </span>
          </div>
        )}

        {/* DONE */}
        {state === "done" && (
          <div className="space-y-3">
            <Alert>
              <Check className="h-4 w-4" />
              <AlertTitle>Tókst!</AlertTitle>
              <AlertDescription>
                {savedCount} kassar frá {savedStoreCount} útibúum skráð
                fyrir {savedDate}.
              </AlertDescription>
            </Alert>
            <Button variant="outline" onClick={handleReset}>
              Hlaða upp annarri skrá
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
