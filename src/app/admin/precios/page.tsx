// app/admin/precios/page.tsx
// Página para subir y gestionar la lista de precios desde Excel
"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/client";

// ─── Tipos ───────────────────────────────────────────────────────────────────
interface PriceRow {
  sheet: string;
  sku: string;
  desc: string;
  price: number;
}

interface ParseResult {
  rows: PriceRow[];
  errors: string[];
  sheets: Record<string, number>; // nombre hoja → cantidad de filas
}

// ─── Columnas que intentamos detectar (variaciones comunes) ──────────────────
const SKU_KEYS = ["sku", "part no", "part no.", "part number", "código", "codigo", "code", "model", "modelo", "part #"];
const DESC_KEYS = ["desc", "description", "descripción", "descripcion", "nombre", "name", "producto", "product"];
const PRICE_KEYS = ["price", "precio", "usd", "unit price", "list price", "msrp", "valor", "costo"];

function normalizeKey(k: string) {
  return k.toLowerCase().trim().replace(/\s+/g, " ");
}

function findColumn(headers: string[], candidates: string[]): string | null {
  for (const h of headers) {
    const norm = normalizeKey(h);
    if (candidates.some((c) => norm.includes(c))) return h;
  }
  return null;
}

// ─── Parser de Excel ─────────────────────────────────────────────────────────
function parseExcel(file: ArrayBuffer): ParseResult {
  const wb = XLSX.read(file, { type: "array" });
  const rows: PriceRow[] = [];
  const errors: string[] = [];
  const sheets: Record<string, number> = {};

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const raw: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, {
      defval: "",
      raw: false,
    });

    if (raw.length === 0) continue;

    const headers = Object.keys(raw[0]);
    const skuCol = findColumn(headers, SKU_KEYS);
    const descCol = findColumn(headers, DESC_KEYS);
    const priceCol = findColumn(headers, PRICE_KEYS);

    if (!skuCol) {
      errors.push(`Hoja "${sheetName}": no encontré columna de SKU. Columnas disponibles: ${headers.join(", ")}`);
      continue;
    }
    if (!priceCol) {
      errors.push(`Hoja "${sheetName}": no encontré columna de precio. Columnas disponibles: ${headers.join(", ")}`);
      continue;
    }

    let count = 0;
    for (const row of raw) {
      const sku = String(row[skuCol] ?? "").trim();
      const desc = descCol ? String(row[descCol] ?? "").trim() : "";
      const rawPrice = String(row[priceCol] ?? "").replace(/[$,\s]/g, "");
      const price = parseFloat(rawPrice);

      // Saltamos filas vacías o sin precio válido
      if (!sku || isNaN(price) || price <= 0) continue;

      rows.push({ sheet: sheetName, sku, desc, price });
      count++;
    }

    if (count > 0) sheets[sheetName] = count;
  }

  return { rows, errors, sheets };
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function AdminPreciosPage() {
  const supabase = createClient();

  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ inserted: number; error?: string } | null>(null);

  // ── Dropzone ──
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setFileName(file.name);
    setUploadResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      if (!e.target?.result) return;
      const result = parseExcel(e.target.result as ArrayBuffer);
      setParseResult(result);
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
    },
    multiple: false,
  });

  // ── Subir a Supabase ──
  async function handleUpload() {
    if (!parseResult || parseResult.rows.length === 0) return;
    setUploading(true);

    try {
      // 1. Borrar lista anterior
      const { error: delErr } = await supabase.from("price_list").delete().neq("id", 0);
      if (delErr) throw new Error(delErr.message);

      // 2. Insertar en lotes de 500
      const BATCH = 500;
      let inserted = 0;
      for (let i = 0; i < parseResult.rows.length; i += BATCH) {
        const batch = parseResult.rows.slice(i, i + BATCH);
        const { error } = await supabase.from("price_list").insert(batch);
        if (error) throw new Error(error.message);
        inserted += batch.length;
      }

      setUploadResult({ inserted });
    } catch (err: any) {
      setUploadResult({ inserted: 0, error: err.message });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950 p-8">
      <div className="max-w-3xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Lista de precios</h1>
          <p className="text-gray-400 mt-1">
            Sube tu Excel de Fortinet. Se reemplaza la lista completa cada vez que subas un archivo nuevo.
          </p>
        </div>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-orange-500 bg-orange-500/10"
              : "border-orange-500/30 hover:border-orange-500/60 bg-gray-900/40"
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-3">
            <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="#D95A00" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            {isDragActive ? (
              <p className="text-orange-400 font-medium">Suelta el archivo aquí…</p>
            ) : (
              <>
                <p className="text-white font-medium">Arrastra tu Excel aquí</p>
                <p className="text-gray-400 text-sm">o haz clic para seleccionar · .xlsx / .xls</p>
              </>
            )}
          </div>
        </div>

        {/* Resultado del parse */}
        {parseResult && (
          <div className="space-y-4">
            {/* Nombre de archivo */}
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <span className="font-mono">{fileName}</span>
            </div>

            {/* Errores de columnas no encontradas */}
            {parseResult.errors.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 space-y-1">
                <p className="text-red-400 font-semibold text-sm">Hojas con problemas:</p>
                {parseResult.errors.map((e, i) => (
                  <p key={i} className="text-red-300 text-xs font-mono">{e}</p>
                ))}
                <p className="text-red-300/70 text-xs mt-2">
                  Esto pasa cuando los encabezados de columna no coinciden con los nombres esperados.
                  Renombra las columnas de esas hojas a: <span className="font-mono">SKU, Desc, Price</span>
                </p>
              </div>
            )}

            {/* Resumen de hojas parseadas */}
            {Object.keys(parseResult.sheets).length > 0 && (
              <div className="bg-gray-900/60 border border-orange-500/20 rounded-xl p-5">
                <p className="text-white font-semibold mb-4">
                  {parseResult.rows.length.toLocaleString()} productos listos para subir
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(parseResult.sheets).map(([sheet, count]) => (
                    <div key={sheet} className="flex items-center justify-between bg-black/30 rounded-lg px-3 py-2">
                      <span className="text-sm text-gray-300 truncate">{sheet}</span>
                      <span className="text-sm font-mono text-orange-400 ml-2 shrink-0">
                        {count.toLocaleString()} items
                      </span>
                    </div>
                  ))}
                </div>

                {/* Preview tabla */}
                <div className="mt-4 overflow-x-auto rounded-lg border border-gray-800">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-800 text-gray-400">
                        <th className="text-left px-3 py-2">Hoja</th>
                        <th className="text-left px-3 py-2">SKU</th>
                        <th className="text-left px-3 py-2">Descripción</th>
                        <th className="text-right px-3 py-2">Precio USD</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parseResult.rows.slice(0, 8).map((row, i) => (
                        <tr key={i} className="border-t border-gray-800 hover:bg-gray-900/50">
                          <td className="px-3 py-2 text-orange-400">{row.sheet}</td>
                          <td className="px-3 py-2 text-gray-300 font-mono">{row.sku}</td>
                          <td className="px-3 py-2 text-gray-400 max-w-[200px] truncate">{row.desc}</td>
                          <td className="px-3 py-2 text-right text-green-400">
                            ${row.price.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parseResult.rows.length > 8 && (
                    <p className="text-center text-xs text-gray-500 py-2">
                      … y {(parseResult.rows.length - 8).toLocaleString()} productos más
                    </p>
                  )}
                </div>

                {/* Botón de upload */}
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="mt-5 w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Subiendo {parseResult.rows.length.toLocaleString()} productos…
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                      </svg>
                      Reemplazar lista de precios ({parseResult.rows.length.toLocaleString()} productos)
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Resultado del upload */}
        {uploadResult && (
          <div className={`rounded-xl p-5 border ${
            uploadResult.error
              ? "bg-red-500/10 border-red-500/30"
              : "bg-green-500/10 border-green-500/30"
          }`}>
            {uploadResult.error ? (
              <>
                <p className="text-red-400 font-semibold">Error al subir</p>
                <p className="text-red-300 text-sm mt-1 font-mono">{uploadResult.error}</p>
              </>
            ) : (
              <>
                <p className="text-green-400 font-semibold text-lg">
                  ✓ Lista actualizada — {uploadResult.inserted.toLocaleString()} productos
                </p>
                <p className="text-green-300/70 text-sm mt-1">
                  El panel lateral del cotizador ya tiene los precios actualizados.
                </p>
              </>
            )}
          </div>
        )}

        {/* Instrucciones */}
        <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-5 text-sm text-gray-400 space-y-2">
          <p className="text-white font-semibold">¿Mis columnas no se detectan?</p>
          <p>El parser busca estas variaciones en los encabezados de tu Excel (no distingue mayúsculas):</p>
          <div className="grid grid-cols-3 gap-3 mt-3">
            <div>
              <p className="text-orange-400 font-mono text-xs mb-1">SKU detecta:</p>
              <p className="text-xs font-mono text-gray-500">sku, part no, part no., part number, código, code, model</p>
            </div>
            <div>
              <p className="text-orange-400 font-mono text-xs mb-1">Desc detecta:</p>
              <p className="text-xs font-mono text-gray-500">desc, description, descripción, nombre, name, producto</p>
            </div>
            <div>
              <p className="text-orange-400 font-mono text-xs mb-1">Precio detecta:</p>
              <p className="text-xs font-mono text-gray-500">price, precio, usd, unit price, list price, msrp, valor</p>
            </div>
          </div>
          <p className="mt-2">Si tu columna no está en esa lista, renómbrala en Excel a <span className="font-mono text-white">SKU</span>, <span className="font-mono text-white">Desc</span> y <span className="font-mono text-white">Price</span>.</p>
        </div>
      </div>
    </div>
  );
}