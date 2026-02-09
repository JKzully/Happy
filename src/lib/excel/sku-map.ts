export const skuToProduct: Record<string, { productId: string; name: string }> = {
  "HHLL002": { productId: "lemon-lane", name: "Lemon Lane" },
  "HHMB002": { productId: "mixed-berries", name: "Mixed Berries" },
  "HHPC002": { productId: "pina-colada", name: "Piña Colada" },
  "HHPE002": { productId: "peru", name: "Peru" },
  "HHPA002": { productId: "peach", name: "Peach" },
  "HHCMB002": { productId: "creatine-mixed", name: "Creatine Mixed Berry" },
  "HHCLL002": { productId: "creatine-lemon", name: "Creatine Lemon" },
  "HHEAK002": { productId: "energy-kiwi", name: "Energy Kiwi" },
  "HHKAK002": { productId: "krakka-green-apple-kiwi", name: "Kids Green Apple Kiwi" },
  "HHKMB002": { productId: "krakka-mixed-berry", name: "Kids Mixed Berry" },
  "HHJJ002": { productId: "jolabragd", name: "Jólabragð" },
};

/** Known chain name prefixes used in Excel reports */
const chainPrefixes = ["Krónan", "Bónus", "Hagkaup", "Nettó", "Kjörbuðin", "Iceland", "Extra", "Krambuð"];

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
 * Normalize an Icelandic word for fuzzy matching.
 * Strips common suffixes (-num, -inum, -unum, -i, -a, -ar, -um)
 * and lowercases.
 */
function normalizeIcelandic(word: string): string {
  let w = word.toLowerCase().trim();
  // Strip common Icelandic declension suffixes (longest first)
  const suffixes = ["unum", "inum", "num", "um", "ar", "ir", "ur", "i", "a"];
  for (const suffix of suffixes) {
    if (w.length > suffix.length + 2 && w.endsWith(suffix)) {
      w = w.slice(0, -suffix.length);
      break;
    }
  }
  return w;
}

/**
 * Match a raw store name from the Excel file to a known store.
 * Returns the store id or null if no match.
 */
export function matchStore(
  rawStoreName: string,
  knownStores: { id: string; name: string }[]
): string | null {
  const stripped = stripChainPrefix(rawStoreName).toLowerCase().trim();

  // 1. Exact match on full name (case-insensitive)
  for (const store of knownStores) {
    if (store.name.toLowerCase() === rawStoreName.toLowerCase()) {
      return store.id;
    }
  }

  // 2. Match stripped suffix of store name
  for (const store of knownStores) {
    const storeStripped = stripChainPrefix(store.name).toLowerCase().trim();
    if (storeStripped === stripped) {
      return store.id;
    }
  }

  // 3. Fuzzy Icelandic normalization
  const normalizedInput = normalizeIcelandic(stripped);
  for (const store of knownStores) {
    const storeStripped = stripChainPrefix(store.name).toLowerCase().trim();
    if (normalizeIcelandic(storeStripped) === normalizedInput) {
      return store.id;
    }
  }

  // 4. Substring containment
  for (const store of knownStores) {
    const storeLower = store.name.toLowerCase();
    if (storeLower.includes(stripped) || stripped.includes(stripChainPrefix(store.name).toLowerCase())) {
      return store.id;
    }
  }

  return null;
}
