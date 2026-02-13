export const skuToProduct: Record<string, { productId: string; name: string }> = {
  // Hydration Xpress
  "HHLL002": { productId: "lemon-lime", name: "Lemon Lime" },
  "HHLL001": { productId: "lemon-lime", name: "Lemon Lime" },
  "HHLL005": { productId: "lemon-lime", name: "Lemon Lime" },
  "HHMB002": { productId: "mixed-berries", name: "Mixed Berries" },
  "HHMB001": { productId: "mixed-berries", name: "Mixed Berries" },
  "HHPC002": { productId: "pina-colada", name: "Pina Colada" },
  "HHPC001": { productId: "pina-colada", name: "Pina Colada" },
  "HHPE002": { productId: "peru", name: "Peru" },
  "HHPE001": { productId: "peru", name: "Peru" },
  "HHPA002": { productId: "peach", name: "Peach" },
  "HHPA001": { productId: "peach", name: "Peach" },
  "HHPH002": { productId: "peach", name: "Peach" },
  "HHPH001": { productId: "peach", name: "Peach" },
  "HHJJ002": { productId: "jolabragd", name: "Jólabragð" },
  "HHJ002": { productId: "jolabragd", name: "Jólabragð" },
  "HHJ001": { productId: "jolabragd", name: "Jólabragð" },
  // Creatine Xpress
  "HHCMB002": { productId: "creatine-mixed", name: "Creatine Mixed" },
  "HHCMB001": { productId: "creatine-mixed", name: "Creatine Mixed" },
  "HHCLL002": { productId: "creatine-lemon", name: "Creatine Lemon" },
  "HHCLL001": { productId: "creatine-lemon", name: "Creatine Lemon" },
  // Energy Xpress
  "HHEAK002": { productId: "energy-kiwi", name: "Energy Kiwi" },
  "HHEAK001": { productId: "energy-kiwi", name: "Energy Kiwi" },
  // Kids
  "HHKAK002": { productId: "krakka-green-apple-kiwi", name: "Kids Green Apple Kiwi" },
  "HHKAK001": { productId: "krakka-green-apple-kiwi", name: "Kids Green Apple Kiwi" },
  "HHKMB002": { productId: "krakka-mixed-berry", name: "Kids Mixed Berry" },
  "HHKMB001": { productId: "krakka-mixed-berry", name: "Kids Mixed Berry" },
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

/**
 * Map product display names (from owner's "Sölugreining" Excel) to product IDs.
 * Keys are lowercase for case-insensitive matching.
 */
export const productNameToId: Record<string, { productId: string; name: string }> = {
  "lemon lime": { productId: "lemon-lime", name: "Lemon Lime" },
  "mixed berries": { productId: "mixed-berries", name: "Mixed Berries" },
  "pina colada": { productId: "pina-colada", name: "Pina Colada" },
  "peach": { productId: "peach", name: "Peach" },
  "peru": { productId: "peru", name: "Peru" },
  "creatine lemon": { productId: "creatine-lemon", name: "Creatine Lemon" },
  "crea lemon": { productId: "creatine-lemon", name: "Creatine Lemon" },
  "creatine mixed": { productId: "creatine-mixed", name: "Creatine Mixed" },
  "crea mixed": { productId: "creatine-mixed", name: "Creatine Mixed" },
  "energy": { productId: "energy-kiwi", name: "Energy Kiwi" },
  "energy kiwi": { productId: "energy-kiwi", name: "Energy Kiwi" },
  "energy apple kiwi": { productId: "energy-kiwi", name: "Energy Kiwi" },
  "kids berja": { productId: "krakka-mixed-berry", name: "Kids Mixed Berry" },
  "kids mixed": { productId: "krakka-mixed-berry", name: "Kids Mixed Berry" },
  "kids mixed berries": { productId: "krakka-mixed-berry", name: "Kids Mixed Berry" },
  "kids kiwi apple": { productId: "krakka-green-apple-kiwi", name: "Kids Green Apple Kiwi" },
  "kids kiwi/epla": { productId: "krakka-green-apple-kiwi", name: "Kids Green Apple Kiwi" },
  "kids kiwi": { productId: "krakka-green-apple-kiwi", name: "Kids Green Apple Kiwi" },
  "kids apple kiwi": { productId: "krakka-green-apple-kiwi", name: "Kids Green Apple Kiwi" },
  "jola": { productId: "jolabragd", name: "Jólabragð" },
  "jóla": { productId: "jolabragd", name: "Jólabragð" },
  "joli": { productId: "jolabragd", name: "Jólabragð" },
  "jóli": { productId: "jolabragd", name: "Jólabragð" },
  "jolabragd": { productId: "jolabragd", name: "Jólabragð" },
};

/** Map Samkaup sub-chain header (uppercase) to sub_chain_type */
export const samkaupHeaderToSubChain: Record<string, string> = {
  "ICELAND": "iceland",
  "KJÖRBÚÐIN": "kjorbud",
  "KRAMBÚÐIN": "krambud",
  "NETTÓ": "netto",
  "VORUHUS": "voruhus",
};

/** Known chain name prefixes used in Excel reports */
const chainPrefixes = ["Krónan", "Bónus", "Hagkaup", "Samkaup", "Nettó", "Kjörbúðin", "Kjörbuðin", "Iceland", "Extra", "Krambúðin", "Krambuð", "10-11"];

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
  "10-11": "samkaup",
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
  "10-11": "netto",
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
  "dalvíknes": "dalvík",
  "ólafsvík": "ólafsvík",
  "ólafsfirði": "ólafsfjörður",
  "siglufirði": "siglufjörður",
  "neskaupsstaði": "neskaupsstaður",
  "neuskaupstað": "neskaupsstaður",
  "blönduósi": "blönduós",
  "eskifirði": "eskifjörður",
  "eski-firði": "eskifjörður",
  "fáskrúðsfirði": "fáskrúðsfjörður",
  "garði": "garður",
  "grundarfirði": "grundarfjörður",
  "hellu": "hella",
  "seyðisfirði": "seyðisfjörður",
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
