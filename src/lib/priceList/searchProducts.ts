// Shared "search by name, not just SKU" matching, used by the catalog page,
// the admin price-list browser, and the quote editor's price-list panel.
//
// Short pure-numeric tokens (model numbers like "80", "60", "40") are prone
// to false positives if matched against raw SKU/description text: Fortinet
// bundle codes are arbitrary numbers that often contain a shorter number as
// a substring purely by coincidence -- e.g. searching "80" would otherwise
// match "FG-30G-BDL-809-DD" because ITS OWN unrelated bundle code "809"
// contains "80". Verified against the real AMER price list: naive substring
// search on "fortigate 80" returned 825 SKUs across totally unrelated
// families (FortiGate-30G, -31G, -40F...); this version returns exactly the
// 80-series products. For those short numeric tokens, only the product's
// family name (the price list's UNIT column) is matched, with a digit
// boundary so "80" doesn't also match inside "380".
export interface SearchableProduct {
  unitName: string;
  sku: string;
  descripcion: string;
}

function tokenMatches(token: string, p: SearchableProduct): boolean {
  const t = token.toLowerCase();
  if (/^\d{1,3}$/.test(t)) {
    return new RegExp(`(^|[^0-9])${t}([^0-9]|$)`, "i").test(p.unitName);
  }
  const haystack = `${p.unitName} ${p.sku} ${p.descripcion}`.toLowerCase();
  return haystack.includes(t);
}

export function matchesProductQuery(p: SearchableProduct, query: string): boolean {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  return tokens.every((t) => tokenMatches(t, p));
}
