// Client-side Excel parsing for Fortinet AMER price lists — ported from the
// PHP app's views/lista_precios.view.php (same SheetJS-based approach, kept
// client-side on purpose: matches the source app exactly and this data
// already went through this exact logic in production for years).
//
// Every sheet repeats the same 11-column header block throughout its rows
// (once per "page" of the original PDF the sheet was built from):
//   UNIT | SKU | Description | Price | 1Yr Contract | 2Yr | 3Yr | 4Yr | 5Yr | Comments | Category
// UNIT only appears on a group's FIRST row (e.g. "FortiGate-30G" next to the
// hardware SKU) -- every add-on/service SKU below it (FortiCare terms,
// FortiGuard services, RMA add-ons...) leaves UNIT blank, meaning "same
// product as above". That's forward-filled below. A SKU can carry a flat
// one-time Price, one or more of the five contract-term prices, or both --
// all six are kept instead of collapsing to whichever came first.

import * as XLSX from "xlsx";
import { NORMALIZED_SHEET_MAP, NORMALIZED_IGNORE_SET, normalizeSheetName } from "./sheetCategoryMap";

export interface ParsedProduct {
  categoria: string;
  sku: string;
  descripcion: string;
  unitName: string;
  precio: number | null;
  precio1yr: number | null;
  precio2yr: number | null;
  precio3yr: number | null;
  precio4yr: number | null;
  precio5yr: number | null;
}

interface OmittedSheet {
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
  colUnit: number; // -1 if this header block has no UNIT column at all
  colSKU: number;
  colDesc: number;
  colPrice: number; // -1 if absent (term-only sheet)
  colY1: number | null;
  colY2: number | null;
  colY3: number | null;
  colY4: number | null;
  colY5: number | null;
}

// Collapses whitespace/newlines (the source has literal "\r\r\n" inside
// header cells like "1Yr Contract\r\r\n(Replace DD by 12)") so matching
// doesn't depend on exact line-wrapping.
function normalizeHeaderCell(cell: unknown): string {
  return String(cell ?? "").replace(/\s+/g, "").toUpperCase();
}

function detectHeader(row: unknown[]): HeaderMapping | null {
  let colUnit = -1,
    colSKU = -1,
    dNew = -1,
    dOld = -1,
    dPlain = -1,
    pNew = -1,
    pOld = -1,
    pPlain = -1;
  const yearCols: Partial<Record<1 | 2 | 3 | 4 | 5, number>> = {};

  row.forEach((cell, ci) => {
    const norm = normalizeHeaderCell(cell);
    if (norm === "UNIT") colUnit = ci;
    if (norm === "SKU") colSKU = ci;
    if (norm === "DESCRIPTION") dPlain = ci;
    if (norm === "NEWDESCRIPTION") dNew = ci;
    if (norm === "OLDDESCRIPTION") dOld = ci;
    if (norm === "PRICE") pPlain = ci;
    if (norm === "NEWPRICE") pNew = ci;
    if (norm === "OLDPRICE") pOld = ci;
    // Matches "1YRCONTRACT..." regardless of what follows (the
    // "(Replace DD by N)" suffix isn't load-bearing, just documentation).
    const yearMatch = norm.match(/^([1-5])YRCONTRACT/);
    if (yearMatch) yearCols[Number(yearMatch[1]) as 1 | 2 | 3 | 4 | 5] = ci;
  });

  const colDesc = dPlain >= 0 ? dPlain : dNew >= 0 ? dNew : dOld;
  const colPrice = pPlain >= 0 ? pPlain : pNew >= 0 ? pNew : pOld;
  const hasAnyYearCol = Object.keys(yearCols).length > 0;
  if (colSKU < 0 || colDesc < 0 || (colPrice < 0 && !hasAnyYearCol)) return null;

  return {
    colUnit,
    colSKU,
    colDesc,
    colPrice,
    colY1: yearCols[1] ?? null,
    colY2: yearCols[2] ?? null,
    colY3: yearCols[3] ?? null,
    colY4: yearCols[4] ?? null,
    colY5: yearCols[5] ?? null,
  };
}

function readPrice(row: unknown[], ci: number | null): number | null {
  if (ci === null || ci < 0) return null;
  const val = parseFloat(String(row[ci] ?? ""));
  return !isNaN(val) && val > 0 ? Math.round(val * 100) / 100 : null;
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
    let lastUnit = "";

    for (const row of rows) {
      const maybeHeader = detectHeader(row);
      if (maybeHeader) {
        mapping = maybeHeader;
        headerSeen = true;
        lastUnit = "";
        continue;
      }
      if (!mapping) continue;

      const sku = String(row[mapping.colSKU] ?? "").trim();
      if (!sku) continue;

      if (mapping.colUnit >= 0) {
        const unitCell = String(row[mapping.colUnit] ?? "").trim();
        if (unitCell) lastUnit = unitCell;
      }

      const desc = String(row[mapping.colDesc] ?? "").trim();
      const precio = readPrice(row, mapping.colPrice);
      const precio1yr = readPrice(row, mapping.colY1);
      const precio2yr = readPrice(row, mapping.colY2);
      const precio3yr = readPrice(row, mapping.colY3);
      const precio4yr = readPrice(row, mapping.colY4);
      const precio5yr = readPrice(row, mapping.colY5);

      if (precio === null && precio1yr === null && precio2yr === null && precio3yr === null && precio4yr === null && precio5yr === null) {
        continue; // no usable price anywhere on this row
      }

      products.push({
        categoria: categoriaName,
        sku,
        descripcion: desc,
        unitName: lastUnit,
        precio,
        precio1yr,
        precio2yr,
        precio3yr,
        precio4yr,
        precio5yr,
      });
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
