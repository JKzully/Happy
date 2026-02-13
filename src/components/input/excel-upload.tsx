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
import type { ParseResult, ParsedSaleRow, DetectedFormat, SkippedRow } from "@/lib/excel/parse-sales";
import { matchStore, stripChainPrefix, detectChainSlug, detectSubChainType, chainPrefixToSlug } from "@/lib/excel/sku-map";
import { sampleStores } from "@/lib/data/chains";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";

type StoreRow = Database["public"]["Tables"]["stores"]["Row"];
type DailySalesRow = Database["public"]["Tables"]["daily_sales"]["Row"];
type ChainRow = Database["public"]["Tables"]["retail_chains"]["Row"];
type ProductRow = Database["public"]["Tables"]["products"]["Row"];

type State = "idle" | "parsing" | "preview" | "saving" | "done" | "error";

const formatLabels: Record<DetectedFormat, string> = {
  kronan: "Krónan",
  bonus: "Bónus",
  samkaup: "Samkaup",
  hagkaup: "Hagkaup",
  solugreining: "Sölugreining",
};

const formatToChainSlug: Record<DetectedFormat, string> = {
  kronan: "kronan",
  bonus: "bonus",
  samkaup: "samkaup",
  hagkaup: "hagkaup",
  solugreining: "",
};

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
  const [savedRowCount, setSavedRowCount] = useState(0);
  const [verifiedCount, setVerifiedCount] = useState<number | null>(null);
  const [fileName, setFileName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [manualTotal, setManualTotal] = useState<string>("");
  const [chainSlugToId, setChainSlugToId] = useState<Record<string, string>>({});
  const [productSlugToUuid, setProductSlugToUuid] = useState<Record<string, string>>({});
  const [allStores, setAllStores] = useState<StoreRow[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".csv")) {
      setError("Aðeins .xlsx og .csv skrár eru studdar.");
      setState("error");
      return;
    }

    setFileName(file.name);
    setState("parsing");
    setError("");

    try {
      const buffer = await file.arrayBuffer();
      const isCsv = file.name.endsWith(".csv");
      const result = parseSalesExcel(buffer, isCsv);
      setParseResult(result);

      // Fetch retail chains, stores, and products from DB
      const slugToId: Record<string, string> = {};
      const prodSlugToUuid: Record<string, string> = {};
      let knownStores: { id: string; name: string }[] = [];

      const supabase = createClient();

      // Verify user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Þú þarft að vera skráð(ur) inn til að hlaða upp gögnum.");
      }

      const { data: chainData, error: chainErr } = (await supabase.from("retail_chains").select()) as {
        data: ChainRow[] | null; error: { message: string } | null;
      };
      if (chainErr) console.error("Chain fetch error:", chainErr);
      if (chainData) {
        for (const c of chainData) {
          slugToId[c.slug] = c.id;
        }
      }

      const { data: storeData, error: storeErr } = (await supabase.from("stores").select()) as {
        data: StoreRow[] | null; error: { message: string } | null;
      };
      if (storeErr) console.error("Store fetch error:", storeErr);
      const chainStoresMap: Record<string, { id: string; name: string }[]> = {};
      if (storeData && storeData.length > 0) {
        setAllStores(storeData);
        // Filter stores to the detected chain to prevent cross-chain matching
        // (e.g., Bónus "Akureyri" matching Krónan's "Akureyri" store)
        const chainSlug = formatToChainSlug[result.detectedFormat];
        const chainUuid = chainSlug ? slugToId[chainSlug] : "";
        if (result.detectedFormat === "solugreining") {
          // Build per-chain store map for multi-chain matching
          for (const [slug, uuid] of Object.entries(slugToId)) {
            chainStoresMap[slug] = storeData
              .filter((s) => s.chain_id === uuid)
              .map((s) => ({ id: s.id, name: s.name }));
          }
          knownStores = storeData.map((s) => ({ id: s.id, name: s.name }));
        } else if (chainUuid) {
          knownStores = storeData
            .filter((s) => s.chain_id === chainUuid)
            .map((s) => ({ id: s.id, name: s.name }));
        } else {
          knownStores = storeData.map((s) => ({ id: s.id, name: s.name }));
        }
      }

      // Build product name → UUID map
      const { data: productData, error: prodErr } = (await supabase.from("products").select()) as {
        data: ProductRow[] | null; error: { message: string } | null;
      };
      if (prodErr) console.error("Product fetch error:", prodErr);
      if (productData) {
        for (const p of productData) {
          prodSlugToUuid[p.name.toLowerCase()] = p.id;
          prodSlugToUuid[p.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")] = p.id;
        }
      }

      if (Object.keys(prodSlugToUuid).length === 0) {
        throw new Error("Engar vörur fundust í gagnagrunni. Keyra products seed fyrst.");
      }

      setChainSlugToId(slugToId);
      setProductSlugToUuid(prodSlugToUuid);
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
        // For solugreining, match against chain-specific stores to prevent cross-chain collisions
        const matchStores = (result.detectedFormat === "solugreining"
          ? chainStoresMap[chainPrefixToSlug[row.chainName] || ""] || knownStores
          : knownStores);
        let storeId = matchStore(row.rawStoreName, matchStores);
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

      // Detect majority chain from already-matched stores
      let detectedChainId = "";
      const chainCounts: Record<string, number> = {};
      for (const row of saveable) {
        if (!row.isNewStore && row.storeId) {
          const store = allStores.find((s) => s.id === row.storeId);
          if (store) {
            chainCounts[store.chain_id] = (chainCounts[store.chain_id] || 0) + 1;
          }
        }
      }
      const topChain = Object.entries(chainCounts).sort((a, b) => b[1] - a[1])[0];
      if (topChain) detectedChainId = topChain[0];

      for (const row of newStoreRows) {
        if (seenNewStores.has(row.storeId!)) continue;
        seenNewStores.add(row.storeId!);

        const chainSlug = detectChainSlug(row.rawStoreName)
          || chainPrefixToSlug[row.chainName]
          || (parseResult.detectedFormat ? formatToChainSlug[parseResult.detectedFormat] : null)
          || row.chainName.toLowerCase();
        const chainUuid = chainSlugToId[chainSlug] || detectedChainId;
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

        if (insertError) {
          console.error("Store insert error:", JSON.stringify(insertError), "payload:", insertPayload);
          throw new Error(
            (insertError as { message?: string }).message
              || JSON.stringify(insertError)
              || "Villa við stofnun útibús"
          );
        }
        if (!inserted) {
          throw new Error(`Ekki tókst að stofna útibú: ${storeName}`);
        }
        tempIdToRealId.set(row.storeId!, inserted.id);
      }

      // Build upsert rows, replacing temp store IDs and resolving product UUIDs.
      // Aggregate duplicates (same date+store+product) by summing quantity.
      const rowMap = new Map<string, { date: string; store_id: string; product_id: string; quantity: number; _debug_store: string; _debug_product: string }>();
      for (const r of saveable) {
        const storeUuid = tempIdToRealId.get(r.storeId!) || r.storeId!;
        const productUuid = productSlugToUuid[r.productName.toLowerCase()] || r.productId!;
        const key = `${r.date}:${storeUuid}:${productUuid}`;
        const existing = rowMap.get(key);
        if (existing) {
          existing.quantity += r.quantity;
        } else {
          rowMap.set(key, {
            date: r.date,
            store_id: storeUuid,
            product_id: productUuid,
            quantity: r.quantity,
            _debug_store: r.rawStoreName,
            _debug_product: r.productName,
          });
        }
      }
      const upsertRows = [...rowMap.values()];

      console.log("Upsert preview (first 3):", upsertRows.slice(0, 3));
      console.log("New stores created:", tempIdToRealId.size);
      console.log("Detected chain:", detectedChainId);

      // Verify all rows have valid UUIDs before sending
      const badStoreRows = upsertRows.filter(
        (r) => !r.store_id.includes("-") || r.store_id.length < 30
      );
      if (badStoreRows.length > 0) {
        console.error("Rows with non-UUID store_id:", badStoreRows.slice(0, 3));
        throw new Error(
          `${badStoreRows.length} raðir hafa ógilt store_id. Útibú mistókst að stofna: ${[...new Set(badStoreRows.map((r) => r.store_id))].join(", ")}`
        );
      }

      const badRows = upsertRows.filter(
        (r) => !r.product_id.includes("-") || r.product_id.length < 30
      );
      if (badRows.length > 0) {
        console.error("Rows with non-UUID product_id:", badRows.slice(0, 3));
        throw new Error(
          `${badRows.length} raðir hafa ógilt product_id. Vörur vantar í gagnagrunn: ${[...new Set(badRows.map((r) => r.product_id))].join(", ")}`
        );
      }

      // Strip debug fields before sending to Supabase
      const cleanRows = upsertRows.map(({ _debug_store, _debug_product, ...row }) => row);

      // Pure upsert — onConflict handles duplicates without deleting other products.
      // Previous delete-before-upsert was dangerous: it removed ALL products for
      // date+store, even those not in the current upload.
      const uploadStoreIds = [...new Set(cleanRows.map((r) => r.store_id))];
      const uploadDates = parseResult.allDates?.length > 0
        ? parseResult.allDates
        : [parseResult.date];

      // Batch upsert in chunks to avoid payload/timeout limits
      const BATCH_SIZE = 500;
      let upsertedCount = 0;
      for (let i = 0; i < cleanRows.length; i += BATCH_SIZE) {
        const batch = cleanRows.slice(i, i + BATCH_SIZE);
        const { error: upsertError } = await (supabase
          .from("daily_sales") as ReturnType<typeof supabase.from>)
          .upsert(batch, { onConflict: "date,store_id,product_id" });

        if (upsertError) {
          console.error(`Upsert batch ${i / BATCH_SIZE + 1} error:`, JSON.stringify(upsertError));
          throw new Error(
            `Villa í upsert (batch ${i / BATCH_SIZE + 1}/${Math.ceil(cleanRows.length / BATCH_SIZE)}): ${(upsertError as { message?: string }).message || JSON.stringify(upsertError)}`
          );
        }
        upsertedCount += batch.length;
        console.log(`Upsert batch ${i / BATCH_SIZE + 1}: ${batch.length} rows (${upsertedCount}/${cleanRows.length})`);
      }

      const uniqueStores = new Set(saveable.map((r) => r.storeId));
      setSavedCount(saveable.reduce((sum, r) => sum + r.quantity, 0));
      setSavedStoreCount(uniqueStores.size);
      setSavedRowCount(cleanRows.length);
      const dateStr = parseResult.allDates?.length > 1
        ? `${parseResult.allDates[0]} — ${parseResult.allDates[parseResult.allDates.length - 1]}`
        : parseResult.date;
      setSavedDate(dateStr);

      // Post-save verification: count rows in DB for these dates+stores
      try {
        const { count } = await supabase
          .from("daily_sales")
          .select("*", { count: "exact", head: true })
          .in("date", uploadDates)
          .in("store_id", uploadStoreIds);
        setVerifiedCount(count ?? null);
      } catch {
        setVerifiedCount(null);
      }

      // Write upload log entry
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const dateStr = parseResult.allDates?.length > 1
          ? `${parseResult.allDates[0]} — ${parseResult.allDates[parseResult.allDates.length - 1]}`
          : parseResult.date;
        await (supabase.from("upload_log") as ReturnType<typeof supabase.from>).insert({
          filename: fileName,
          detected_format: parseResult.detectedFormat,
          file_date: dateStr,
          rows_saved: cleanRows.length,
          total_boxes: saveable.reduce((sum, r) => sum + r.quantity, 0),
          store_count: uniqueStores.size,
          uploaded_by: session?.user?.id ?? null,
        });
      } catch (logErr) {
        console.error("Upload log insert failed:", logErr);
      }

      setState("done");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
            ? String((err as { message: unknown }).message)
            : JSON.stringify(err);
      console.error("Save error:", err);
      setError(msg || "Villa við vistun í gagnagrunn.");
      setState("error");
    }
  };

  const handleReset = () => {
    setState("idle");
    setParseResult(null);
    setMatchedRows([]);
    setError("");
    setFileName("");
    setSavedRowCount(0);
    setVerifiedCount(null);
    setManualTotal("");
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
                Dragðu .xlsx/.csv söluskýrslu hingað eða smelltu til að velja skrá
              </p>
              <p className="mt-1 text-xs text-text-dim">
                Studdar keðjur: Krónan, Bónus, Samkaup, Hagkaup, Sölugreining
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.csv"
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
              <Badge variant="neutral">
                {parseResult.allDates?.length > 1
                  ? `${parseResult.allDates[0]} — ${parseResult.allDates[parseResult.allDates.length - 1]}`
                  : parseResult.date}
              </Badge>
              <Badge variant="info">
                {formatLabels[parseResult.detectedFormat]}
              </Badge>
              <Badge variant="neutral">
                {parseResult.storeCount} útibú
              </Badge>
              <Badge variant="success">
                {parseResult.totalBoxes} kassar
              </Badge>
              {parseResult.skippedSkuCount > 0 && (
                <Badge variant="neutral">
                  {parseResult.skippedSkuCount} SKU hunsað
                </Badge>
              )}
              {newStoreCount > 0 && (
                <Badge variant="info">
                  {newStoreCount} {newStoreCount === 1 ? "nýtt útibú" : "ný útibú"}
                </Badge>
              )}
              {hasDuplicates && (
                <Badge variant="warning">Sumt til í gagnagrunni</Badge>
              )}
            </div>

            {/* Date warning */}
            {(() => {
              const fileDate = new Date(parseResult.date + "T00:00:00");
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const yesterday = new Date(today);
              yesterday.setDate(yesterday.getDate() - 1);
              const isRecent = fileDate >= yesterday && fileDate <= today;
              const isFuture = fileDate > today;

              if (isRecent) return null;

              return (
                <Alert variant={isFuture ? "destructive" : "default"} className={!isFuture ? "border-warning bg-warning/10" : ""}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>{isFuture ? "Framtíðardagsetning" : "Gömul dagsetning"}</AlertTitle>
                  <AlertDescription>
                    Dagsetning í skjali er <strong>{parseResult.date}</strong> — er þetta rétt?
                  </AlertDescription>
                </Alert>
              );
            })()}

            {/* Import summary */}
            {(() => {
              const skipped = parseResult.skippedRows || [];
              const zeroQty = skipped.filter(s => s.reason === "zero_qty").length;
              const unknownProduct = skipped.filter(s => s.reason === "unknown_product").length;
              const skipSku = skipped.filter(s => s.reason === "skip_sku").length;
              const otherSkipped = skipped.filter(s =>
                !["zero_qty", "unknown_product", "skip_sku"].includes(s.reason)
              ).length;
              const totalSkipped = skipped.length;
              const unknownSkuWarnings = parseResult.warnings.filter(w => w.type === "unknown_sku");
              const unmatchedRows = matchedRows.filter(r => !r.productId).length;

              return (
                <div className="rounded-lg border border-border bg-surface-elevated/50 p-4 space-y-2">
                  <p className="text-sm font-medium text-foreground">Import samantekt</p>
                  <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm max-w-sm">
                    <span className="text-text-secondary">Raðir lesnar úr Excel:</span>
                    <span className="tabular-nums text-foreground font-medium text-right">
                      {parseResult.totalRowsRead.toLocaleString("is-IS")}
                    </span>

                    <span className="text-text-secondary pl-3">Vistaðar raðir:</span>
                    <span className="tabular-nums text-success text-right">
                      {saveableCount.toLocaleString("is-IS")}
                    </span>

                    {zeroQty > 0 && (
                      <>
                        <span className="text-text-secondary pl-3">Tóm magn (0 stk):</span>
                        <span className="tabular-nums text-warning text-right">{zeroQty}</span>
                      </>
                    )}
                    {(unknownProduct > 0 || unmatchedRows > 0) && (
                      <>
                        <span className="text-text-secondary pl-3">Óþekkt vara/SKU:</span>
                        <span className="tabular-nums text-warning text-right">
                          {unknownProduct + unmatchedRows}
                        </span>
                      </>
                    )}
                    {skipSku > 0 && (
                      <>
                        <span className="text-text-secondary pl-3">Stakstykki (STK):</span>
                        <span className="tabular-nums text-text-dim text-right">{skipSku}</span>
                      </>
                    )}
                    {otherSkipped > 0 && (
                      <>
                        <span className="text-text-secondary pl-3">Annað (tóm röð/búð):</span>
                        <span className="tabular-nums text-text-dim text-right">{otherSkipped}</span>
                      </>
                    )}
                  </div>
                  {totalSkipped > 0 && (
                    <p className="text-xs text-warning mt-2">
                      {totalSkipped} {totalSkipped === 1 ? "röð verður" : "raðir verða"} ekki {totalSkipped === 1 ? "vistuð" : "vistaðar"}
                    </p>
                  )}
                  {unknownSkuWarnings.length > 0 && (
                    <div className="mt-2 rounded-md border border-danger/30 bg-danger/5 p-2">
                      <p className="text-xs font-medium text-danger">
                        {unknownSkuWarnings.length} {unknownSkuWarnings.length === 1 ? "röð" : "raðir"} með óþekkta vöru — {unknownSkuWarnings.length === 1 ? "þessi röð mun" : "þessar raðir munu"} glatast!
                      </p>
                      <p className="text-xs text-danger/80 mt-1">
                        {unknownSkuWarnings.map(w => w.message.replace("Óþekkt SKU: ", "")).join(", ")}
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Cross-validation */}
            {(() => {
              const excelTotal = parseResult.excelTotal;
              const ourTotal = parseResult.totalBoxes;
              const skippedQty = (parseResult.skippedRows || [])
                .filter(s => s.reason === "skip_sku" && s.quantity)
                .reduce((sum, s) => sum + (s.quantity || 0), 0);
              const manualNum = manualTotal ? parseInt(manualTotal, 10) : null;
              const compareTotal = excelTotal ?? (manualNum && !isNaN(manualNum) ? manualNum : null);
              const diff = compareTotal !== null ? compareTotal - ourTotal : null;
              const isExplained = diff !== null && diff === skippedQty;
              const isMatch = diff !== null && diff === 0;

              return (
                <div className="rounded-lg border border-border bg-surface-elevated/50 p-4 space-y-2">
                  <p className="text-sm font-medium text-foreground">Kross-staðfesting</p>
                  <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm max-w-sm">
                    {excelTotal !== null ? (
                      <>
                        <span className="text-text-secondary">Heildarmagn skv. Excel:</span>
                        <span className="tabular-nums text-foreground font-medium text-right">
                          {excelTotal.toLocaleString("is-IS")}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-text-secondary">Heildarmagn úr skjali:</span>
                        <span className="text-right">
                          <input
                            type="number"
                            value={manualTotal}
                            onChange={(e) => setManualTotal(e.target.value)}
                            placeholder="Sláðu inn tölu"
                            className="w-28 rounded-md border border-border bg-background px-2 py-1 text-sm tabular-nums text-right focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </span>
                      </>
                    )}
                    <span className="text-text-secondary">Heildarmagn okkar:</span>
                    <span className="tabular-nums text-foreground font-medium text-right">
                      {ourTotal.toLocaleString("is-IS")}
                    </span>
                    {compareTotal !== null && (
                      <>
                        <span className="text-text-secondary">Mismunur:</span>
                        <span className={`tabular-nums font-medium text-right ${isMatch ? "text-success" : isExplained ? "text-success" : "text-warning"}`}>
                          {diff === 0 ? "0" : `${diff! > 0 ? "+" : ""}${diff!.toLocaleString("is-IS")}`}
                        </span>
                      </>
                    )}
                  </div>
                  {compareTotal !== null && (
                    <div className="mt-1">
                      {isMatch ? (
                        <p className="text-xs text-success font-medium">Stemmir!</p>
                      ) : isExplained ? (
                        <p className="text-xs text-success font-medium">
                          Mismunur ({diff}) útskýrður af {skippedQty} slepptu stk (STK)
                        </p>
                      ) : (
                        <p className="text-xs text-warning font-medium">
                          Óútskýrður mismunur: {diff! > 0 ? "+" : ""}{diff}
                          {skippedQty > 0 && ` (sleppt STK: ${skippedQty})`}
                        </p>
                      )}
                    </div>
                  )}
                  {excelTotal === null && !manualNum && (
                    <p className="text-xs text-text-dim">
                      Engin heildartala fannst í skjalinu. Sláðu inn heildartölu til samanburðar, eða haltu áfram án staðfestingar.
                    </p>
                  )}
                </div>
              );
            })()}

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
            <div className="rounded-lg border border-success/30 bg-success/5 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" />
                <span className="text-sm font-semibold text-foreground">Tókst!</span>
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm max-w-sm">
                <span className="text-text-secondary">Raðir vistaðar:</span>
                <span className="tabular-nums text-foreground font-medium text-right">
                  {savedRowCount.toLocaleString("is-IS")}
                </span>
                <span className="text-text-secondary">Kassar:</span>
                <span className="tabular-nums text-foreground text-right">
                  {savedCount.toLocaleString("is-IS")} frá {savedStoreCount} útibúum
                </span>
                <span className="text-text-secondary">Dagsetning:</span>
                <span className="tabular-nums text-foreground text-right">{savedDate}</span>
              </div>

              {/* Verification */}
              {verifiedCount !== null && (
                <div className="text-xs mt-1">
                  {verifiedCount >= savedRowCount ? (
                    <span className="text-success">
                      Staðfesting: {verifiedCount.toLocaleString("is-IS")}/{savedRowCount.toLocaleString("is-IS")} raðir í DB
                    </span>
                  ) : (
                    <span className="text-warning">
                      {savedRowCount.toLocaleString("is-IS")} raðir sendar en {verifiedCount.toLocaleString("is-IS")} fundust í gagnagrunni
                    </span>
                  )}
                </div>
              )}

              {/* Skipped rows summary in done state */}
              {parseResult && parseResult.skippedRows && parseResult.skippedRows.length > 0 && (() => {
                const skipped = parseResult.skippedRows;
                const zeroQty = skipped.filter(s => s.reason === "zero_qty").length;
                const unknownProduct = skipped.filter(s => s.reason === "unknown_product").length;
                const unmatchedRows = matchedRows.filter(r => !r.productId).length;
                const totalNotSaved = zeroQty + unknownProduct + unmatchedRows;
                if (totalNotSaved === 0) return null;

                return (
                  <div className="text-xs text-text-secondary space-y-0.5 mt-1 border-t border-border/50 pt-2">
                    <p>{totalNotSaved} {totalNotSaved === 1 ? "röð var" : "raðir voru"} ekki {totalNotSaved === 1 ? "vistuð" : "vistaðar"}:</p>
                    <ul className="list-disc pl-4">
                      {zeroQty > 0 && <li>{zeroQty} raðir með 0 magn</li>}
                      {(unknownProduct + unmatchedRows) > 0 && (
                        <li>{unknownProduct + unmatchedRows} raðir með óþekkta vöru</li>
                      )}
                    </ul>
                  </div>
                );
              })()}
            </div>
            <Button variant="outline" onClick={handleReset}>
              Hlaða upp annarri skrá
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
