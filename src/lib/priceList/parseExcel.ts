// Client-side Excel parsing for Fortinet AMER price lists — ported from the
// PHP app's views/lista_precios.view.php (same SheetJS-based approach, kept
// client-side on purpose: matches the source app exactly and this data
// already went through this exact logic in production for years).

import * as XLSX from "xlsx";
import { NORMALIZED_SHEET_MAP, NORMALIZED_IGNORE_SET, normalizeSheetName } from "./sheetCategoryMap";

export interface ParsedProduct {
  categoria: string;
  sku: string;
  descripcion: string;
  precio: number;
}

export interface OmittedSheet {
  nombre: string;
  razon: string;
}

export interface ParseExcelResult {
  products: ParsedProduct[];
  sheetSummary: { nombre: string; count: number }[];
  omittedSheets: OmittedSheet[];
  crossCategorySkus: string[];
}

interface HeaderMapping {
  colSKU: number;
  colDesc: number;
  priceCols: number[];
}

function detectHeader(row: unknown[]): HeaderMapping | null {
  let s = -1,
    dNew = -1,
    dOld = -1,
    pNew = -1,
    pOld = -1,
    pPlain = -1,
    dPlain = -1;
  row.forEach((cell, ci) => {
    const v = String(cell ?? "").trim().toUpperCase();
    if (v === "SKU") s = ci;
    if (v === "DESCRIPTION") dPlain = ci;
    if (v === "NEW DESCRIPTION") dNew = ci;
    if (v === "OLD DESCRIPTION") dOld = ci;
    if (v === "PRICE") pPlain = ci;
    if (v === "NEW PRICE") pNew = ci;
    if (v === "OLD PRICE") pOld = ci;
  });
  const d = dPlain >= 0 ? dPlain : dNew >= 0 ? dNew : dOld;
  const p = pPlain >= 0 ? pPlain : pNew >= 0 ? pNew : pOld;
  if (s < 0 || d < 0 || p < 0) return null;
  const priceCols: number[] = [];
  for (let ci = p; ci < Math.min(p + 6, row.length); ci++) priceCols.push(ci);
  return { colSKU: s, colDesc: d, priceCols };
}

export async function parseExcelFile(file: File): Promise<ParseExcelResult> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });

  let products: ParsedProduct[] = [];
  const sheetSummary: { nombre: string; count: number }[] = [];
  const omittedSheets: OmittedSheet[] = [];

  for (const sheetName of wb.SheetNames) {
    const norm = normalizeSheetName(sheetName);
    if (NORMALIZED_IGNORE_SET.has(norm)) continue;

    const categoriaName = NORMALIZED_SHEET_MAP[norm];
    if (!categoriaName) {
      omittedSheets.push({ nombre: sheetName, razon: "Nombre de hoja no reconocido (revisa si cambió respecto al mapa de categorías)" });
      continue;
    }

    const ws = wb.Sheets[sheetName];
    const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

    let mapping: HeaderMapping | null = null;
    let headerSeen = false;
    let count = 0;

    for (const row of rows) {
      const maybeHeader = detectHeader(row);
      if (maybeHeader) {
        mapping = maybeHeader;
        headerSeen = true;
        continue;
      }
      if (!mapping) continue;

      const sku = String(row[mapping.colSKU] ?? "").trim();
      const desc = String(row[mapping.colDesc] ?? "").trim();
      if (!sku) continue;

      let price = 0;
      for (const ci of mapping.priceCols) {
        const val = parseFloat(String(row[ci] ?? 0));
        if (!isNaN(val) && val > 0) {
          price = val;
          break;
        }
      }
      if (price <= 0) continue;

      products.push({ categoria: categoriaName, sku, descripcion: desc, precio: Math.round(price * 100) / 100 });
      count++;
    }

    if (!headerSeen) {
      omittedSheets.push({ nombre: sheetName, razon: "No se encontró ninguna fila de encabezado SKU/DESCRIPTION/PRICE" });
      continue;
    }
    if (count > 0) {
      sheetSummary.push({ nombre: categoriaName, count });
    } else {
      omittedSheets.push({ nombre: sheetName, razon: "Header encontrado pero 0 productos con SKU y precio válido" });
    }
  }

  // Cross-category duplicate SKU detection: the DB only allows one SKU per
  // version regardless of category. If the same SKU appears on 2 sheets,
  // the LAST one processed wins — dedupe here so the preview matches
  // exactly what gets saved, and surface it instead of failing silently.
  const skuFirstCategoria = new Map<string, string>();
  const crossCategorySkus: string[] = [];
  for (const p of products) {
    if (!skuFirstCategoria.has(p.sku)) skuFirstCategoria.set(p.sku, p.categoria);
    else if (skuFirstCategoria.get(p.sku) !== p.categoria && !crossCategorySkus.includes(p.sku)) {
      crossCategorySkus.push(p.sku);
    }
  }

  const seenSku = new Set<string>();
  const deduped: ParsedProduct[] = [];
  for (let i = products.length - 1; i >= 0; i--) {
    const p = products[i];
    if (seenSku.has(p.sku)) continue;
    seenSku.add(p.sku);
    deduped.push(p);
  }
  deduped.reverse();

  if (deduped.length !== products.length) {
    products = deduped;
    const recount = new Map<string, number>();
    for (const p of products) recount.set(p.categoria, (recount.get(p.categoria) ?? 0) + 1);
    for (const s of sheetSummary) s.count = recount.get(s.nombre) ?? 0;
  }

  return { products, sheetSummary, omittedSheets, crossCategorySkus };
}
