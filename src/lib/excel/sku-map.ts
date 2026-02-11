export const skuToProduct: Record<string, { productId: string; name: string }> = {
  "HHLL002": { productId: "lemon-lime", name: "Lemon Lime" },
  "HHLL005": { productId: "lemon-lime", name: "Lemon Lime" },
  "HHMB002": { productId: "mixed-berries", name: "Mixed Berries" },
  "HHPC002": { productId: "pina-colada", name: "Pina Colada" },
  "HHPE002": { productId: "peru", name: "Peru" },
  "HHPA002": { productId: "peach", name: "Peach" },
  "HHCMB002": { productId: "creatine-mixed", name: "Creatine Mixed" },
  "HHCLL002": { productId: "creatine-lemon", name: "Creatine Lemon" },
  "HHCLL001": { productId: "creatine-lemon", name: "Creatine Lemon" },
  "HHEAK002": { productId: "energy-kiwi", name: "Energy Kiwi" },
  "HHPH002": { productId: "peach", name: "Peach" },
  "HHKAK002": { productId: "krakka-green-apple-kiwi", name: "Kids Green Apple Kiwi" },
  "HHKMB002": { productId: "krakka-mixed-berry", name: "Kids Mixed Berry" },
  "HHJJ002": { productId: "jolabragd", name: "Jólabragð" },
  "HHJ002": { productId: "jolabragd", name: "Jólabragð" },
};

/**
 * SKUs that should be skipped (not full boxes).
 * -STK = single stick, HHCB010 = cooler bottle.
 */
export function shouldSkipSku(sku: string): boolean {
  if (sku.endsWith("-STK")) return true;
  if (sku === "HHCB010") return true;
  return false;
}

/** Map Samkaup sub-chain header (uppercase) to sub_chain_type */
export const samkaupHeaderToSubChain: Record<string, string> = {
  "ICELAND": "iceland",
  "KJÖRBÚÐIN": "kjorbud",
  "KRAMBÚÐIN": "krambud",
  "NETTÓ": "netto",
  "VORUHUS": "voruhus",
};

/** Known chain name prefixes used in Excel reports */
const chainPrefixes = ["Krónan", "Bónus", "Hagkaup", "Samkaup", "Nettó", "Kjörbúðin", "Kjörbuðin", "Iceland", "Extra", "Krambúðin", "Krambuð"];

/** Map chain prefix in Excel → chain slug in DB */
export const chainPrefixToSlug: Record<string, string> = {
  "Krónan": "kronan",
  "Bónus": "bonus",
  "Hagkaup": "hagkaup",
  "Samkaup": "samkaup",
  "Nettó": "samkaup",
  "Kjörbúðin": "samkaup",
  "Kjörbuðin": "samkaup",
  "Iceland": "samkaup",
  "Extra": "samkaup",
  "Krambúðin": "samkaup",
  "Krambuð": "samkaup",
};

/** Map chain prefix to sub_chain_type for Samkaup sub-chains */
export const chainPrefixToSubChain: Record<string, string> = {
  "Nettó": "netto",
  "Kjörbúðin": "kjorbud",
  "Kjörbuðin": "kjorbud",
  "Iceland": "iceland",
  "Extra": "extra",
  "Krambúðin": "krambud",
  "Krambuð": "krambud",
};

/**
 * Strip the chain prefix from a store name.
 * e.g. "Krónan Akrabraut" → "Akrabraut"
 */
export function stripChainPrefix(storeName: string): string {
  for (const prefix of chainPrefixes) {
    if (storeName.startsWith(prefix + " ")) {
      return storeName.slice(prefix.length + 1);
    }
  }
  return storeName;
}

/**
 * Detect chain slug from a raw store name by its prefix.
 * Returns e.g. "kronan", "bonus", "samkaup".
 */
export function detectChainSlug(rawStoreName: string): string | null {
  for (const prefix of chainPrefixes) {
    if (rawStoreName.startsWith(prefix + " ") || rawStoreName === prefix) {
      return chainPrefixToSlug[prefix] ?? null;
    }
  }
  return null;
}

/**
 * Detect sub_chain_type from a raw store name prefix (Samkaup sub-chains only).
 * Returns e.g. "netto", "kjorbud", or null.
 */
export function detectSubChainType(rawStoreName: string): string | null {
  for (const prefix of chainPrefixes) {
    if (rawStoreName.startsWith(prefix + " ") || rawStoreName === prefix) {
      return chainPrefixToSubChain[prefix] ?? null;
    }
  }
  return null;
}

/**
 * Icelandic declension mapping: Excel form → base/nominative form.
 * Excel reports often use dative/accusative forms of place names.
 */
const declensionMap: Record<string, string> = {
  // Krónan stores
  "flatahrauni": "flatahraun",
  "vestmannaeyjum": "vestmanneyjar",
  "selfossi": "selfoss",
  "akranesi": "akranes",
  "lindum": "lindur",
  "mosfellsbæ": "mosfellsbær",
  "grafarholti": "grafarholt",
  "bíldshöfða": "bíldshöfði",
  "reyðarfirði": "reyðarfjörður",
  "hallveigarstig": "hallveigarstígur",
  "norðurhellu": "norðurhella",
  "austurveri": "austurver",
  "borgartúni": "borgartún",
  "fitjabraut": "fitjum",
  "skeifunni": "skeifan",
  "grandanum": "grandi",
  "árbæ": "árbær",
  "hvolsvelli": "hvolsvöllur",
  "vallakóri": "vallakór",
  "hamraborgi": "hamraborg",
  "þorlákshöfn": "þorlákshöfn",
  // Bónus stores
  "borgarnesi": "borgarnes",
  "egilsstöðum": "egilsstaðir",
  "garðabæ": "garðabær",
  "hafnarfirði": "hafnarfjörður",
  "ísafirði": "ísafjörður",
  "keflavík": "keflavík",
  "holtagörðum": "holtagarðar",
  "grafarvogi": "grafarvogur",
  "njarðvík": "njarðvík",
  "stykkishólmi": "stykkishólmur",
  // Hagkaup stores
  "smáralind": "smáralind",
  "eiðistorgi": "eiðistorg",
  "spönginni": "spöng",
  // Samkaup / Nettó stores
  "hörnafjörður": "hörnafjörður",
  "húsavík": "húsavík",
  "iðavöllum": "iðavöllum",
  "mjóddinni": "mjódd",
  "enghjalla": "enghjalli",
  "glæsibæ": "glæsibær",
  // Kjörbúðir stores
  "vesturbæ": "vesturbær",
  "seltjarnarnesi": "seltjarnarnes",
  "kópavogi": "kópavogur",
  "dalvík": "dalvík",
  "ólafsvík": "ólafsvík",
  "siglufirði": "siglufjörður",
  "neskaupsstaði": "neskaupsstaður",
  "blönduósi": "blönduós",
};

/**
 * Normalize an Icelandic place name by applying the declension map,
 * then falling back to generic suffix stripping.
 */
function normalizeName(name: string): string {
  const lower = name.toLowerCase().trim();

  // Check explicit declension map first
  if (declensionMap[lower]) {
    return declensionMap[lower];
  }

  return lower;
}

/**
 * Match a raw store name from the Excel file to a known store.
 * Returns the store id or null if no match.
 */
export function matchStore(
  rawStoreName: string,
  knownStores: { id: string; name: string }[]
): string | null {
  const stripped = stripChainPrefix(rawStoreName).trim();
  const strippedLower = stripped.toLowerCase();

  // 1. Exact match on full name (case-insensitive)
  for (const store of knownStores) {
    if (store.name.toLowerCase() === rawStoreName.toLowerCase()) {
      return store.id;
    }
  }

  // 2. Match stripped name against stripped DB store name
  for (const store of knownStores) {
    const storeStripped = stripChainPrefix(store.name).toLowerCase().trim();
    if (storeStripped === strippedLower) {
      return store.id;
    }
  }

  // 3. Declension normalization on both sides
  const normalizedInput = normalizeName(stripped);
  for (const store of knownStores) {
    const storeStripped = stripChainPrefix(store.name).trim();
    const normalizedStore = normalizeName(storeStripped);
    if (normalizedStore === normalizedInput) {
      return store.id;
    }
  }

  // 4. Prefix match — compare first 4-5 characters
  if (strippedLower.length >= 4) {
    const prefix4 = strippedLower.slice(0, 4);
    const prefix5 = strippedLower.slice(0, Math.min(5, strippedLower.length));
    for (const store of knownStores) {
      const storeStripped = stripChainPrefix(store.name).toLowerCase().trim();
      if (storeStripped.length >= 4) {
        if (storeStripped.slice(0, 4) === prefix4 || storeStripped.startsWith(prefix5) || prefix5.startsWith(storeStripped.slice(0, 5))) {
          return store.id;
        }
      }
    }
  }

  // 5. Substring containment
  for (const store of knownStores) {
    const storeStripped = stripChainPrefix(store.name).toLowerCase().trim();
    if (storeStripped.includes(strippedLower) || strippedLower.includes(storeStripped)) {
      return store.id;
    }
  }

  return null;
}
