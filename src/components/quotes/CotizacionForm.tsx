// CotizacionForm.tsx — Fortress8 Quotation App
// Lista de precios cargada desde Supabase (no hardcodeada)
"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { useReactToPrint } from "react-to-print";
import { createClient } from "@/lib/supabase/client";
import type { PriceItem, LineItem, Condiciones, EmpresaInfo, FirmaInfo } from "@/lib/quotes/types";
import { computeTotals, parseMoneyInput as parseMXN, formatMXN } from "@/lib/quotes/totals";

export type { PriceItem };

// ─── Hook: carga precios desde Supabase ───────────────────────────────────────
function usePriceList() {
  const [prices, setPrices] = useState<PriceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("price_list")
      .select("sheet, sku, desc, price")
      .order("sheet")
      .then(({ data, error }) => {
        if (error) {
          setError(error.message);
        } else if (data) {
          setPrices(data as PriceItem[]);
        }
        setLoading(false);
      });
  }, []);

  return { prices, loading, error };
}

let nextId = 2;

// ─── Editable field ───────────────────────────────────────────────────────────
function Editable({
  value,
  onChange,
  placeholder,
  className = "",
  align = "left",
  bold = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  align?: "left" | "right" | "center";
  bold?: boolean;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder ?? "—"}
      style={{ textAlign: align }}
      className={[
        "bg-transparent border-b border-transparent",
        "hover:border-dashed hover:border-gray-300",
        "focus:outline-none focus:border-[#D95A00] focus:bg-orange-50/40",
        "rounded-sm px-0.5 transition-colors text-gray-900",
        bold ? "font-bold" : "",
        "placeholder:text-gray-300",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}

// ─── Price List Panel ─────────────────────────────────────────────────────────
function PriceListPanel({
  items,
  loading,
  error,
  onAdd,
}: {
  items: PriceItem[];
  loading: boolean;
  error: string | null;
  onAdd: (item: { sku: string; desc: string; price: number }) => void;
}) {
  const [search, setSearch] = useState("");
  const [activeSheet, setActiveSheet] = useState("Todos");

  const sheets = useMemo(() => {
    const s = Array.from(new Set(items.map((p) => p.sheet))).sort();
    return ["Todos", ...s];
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items
      .filter((p) => {
        const matchSheet = activeSheet === "Todos" || p.sheet === activeSheet;
        const matchSearch =
          !q ||
          p.sku.toLowerCase().includes(q) ||
          p.desc.toLowerCase().includes(q);
        return matchSheet && matchSearch;
      })
      .slice(0, 80);
  }, [search, activeSheet, items]);

  return (
    <div
      style={{
        width: 300,
        minWidth: 300,
        borderRight: "1px solid #e5e7eb",
        display: "flex",
        flexDirection: "column",
        background: "#fafafa",
        height: "100%",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "#D95A00",
          color: "#fff",
          padding: "10px 14px",
          fontSize: 13,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <svg
          width="16"
          height="16"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        Lista de precios
        {!loading && (
          <span
            style={{
              marginLeft: "auto",
              background: "rgba(255,255,255,0.25)",
              borderRadius: 10,
              padding: "1px 8px",
              fontSize: 11,
            }}
          >
            {items.length}
          </span>
        )}
      </div>

      {/* Search */}
      <div style={{ padding: "10px 10px 6px" }}>
        <div style={{ position: "relative" }}>
          <svg
            style={{
              position: "absolute",
              left: 8,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#9ca3af",
            }}
            width="14"
            height="14"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar SKU o descripción…"
            style={{
              width: "100%",
              boxSizing: "border-box",
              paddingLeft: 28,
              paddingRight: 8,
              paddingTop: 6,
              paddingBottom: 6,
              fontSize: 12,
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              background: "#fff",
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* Category tabs */}
      <div
        style={{
          padding: "0 8px 6px",
          display: "flex",
          flexWrap: "wrap",
          gap: 4,
          maxHeight: 80,
          overflowY: "auto",
        }}
      >
        {sheets.map((s) => (
          <button
            key={s}
            onClick={() => setActiveSheet(s)}
            style={{
              fontSize: 10,
              padding: "2px 7px",
              borderRadius: 10,
              border: "1px solid",
              borderColor: activeSheet === s ? "#D95A00" : "#e5e7eb",
              background: activeSheet === s ? "#fff4ee" : "#fff",
              color: activeSheet === s ? "#D95A00" : "#6b7280",
              cursor: "pointer",
              whiteSpace: "nowrap",
              fontWeight: activeSheet === s ? 600 : 400,
            }}
          >
            {s === "Todos" ? s : s.replace("Forti", "F.")}
          </button>
        ))}
      </div>

      {/* Results count */}
      <div style={{ padding: "0 12px 4px", fontSize: 10, color: "#9ca3af" }}>
        {loading
          ? "Cargando…"
          : filtered.length === 80
          ? "Mostrando 80 de varios resultados"
          : `${filtered.length} resultado${filtered.length !== 1 ? "s" : ""}`}
      </div>

      {/* Product list */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* Loading state */}
        {loading && (
          <div
            style={{
              padding: 20,
              textAlign: "center",
              fontSize: 12,
              color: "#9ca3af",
            }}
          >
            <svg
              className="animate-spin inline-block mr-2"
              width="16"
              height="16"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="#D95A00"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="#D95A00"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Cargando lista de precios…
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div
            style={{
              padding: 16,
              margin: 10,
              background: "#fef2f2",
              border: "1px solid #fca5a5",
              borderRadius: 8,
              fontSize: 11,
              color: "#dc2626",
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              Error al cargar precios
            </div>
            <div>{error}</div>
            <div style={{ marginTop: 6, color: "#9ca3af" }}>
              Ve a{" "}
              <a
                href="/admin/precios"
                style={{ color: "#D95A00", textDecoration: "underline" }}
              >
                /admin/precios
              </a>{" "}
              para subir la lista.
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && items.length === 0 && (
          <div
            style={{
              padding: 20,
              textAlign: "center",
              fontSize: 12,
              color: "#9ca3af",
            }}
          >
            <div style={{ marginBottom: 8 }}>Lista vacía</div>
            <a
              href="/admin/precios"
              style={{
                color: "#D95A00",
                fontWeight: 600,
                textDecoration: "underline",
              }}
            >
              Subir lista de precios →
            </a>
          </div>
        )}

        {/* No search results */}
        {!loading && !error && items.length > 0 && filtered.length === 0 && (
          <div
            style={{
              padding: 20,
              textAlign: "center",
              fontSize: 12,
              color: "#9ca3af",
            }}
          >
            Sin resultados para "{search}"
          </div>
        )}

        {/* Items */}
        {filtered.map((item, idx) => (
          <div
            key={idx}
            style={{
              padding: "8px 10px",
              borderBottom: "1px solid #f0f0f0",
              display: "flex",
              gap: 8,
              alignItems: "flex-start",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#111827",
                  lineHeight: 1.3,
                  marginBottom: 2,
                }}
              >
                {item.sku}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "#6b7280",
                  lineHeight: 1.3,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical" as any,
                }}
              >
                {item.desc}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#D95A00",
                  fontWeight: 600,
                  marginTop: 3,
                }}
              >
                $
                {item.price.toLocaleString("es-MX", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                USD
              </div>
            </div>
            <button
              onClick={() =>
                onAdd({ sku: item.sku, desc: item.desc, price: item.price })
              }
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: "#D95A00",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                fontSize: 18,
                lineHeight: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                marginTop: 2,
              }}
              title="Agregar a cotización"
            >
              +
            </button>
          </div>
        ))}
      </div>

      <div
        style={{
          padding: "6px 12px",
          fontSize: 10,
          color: "#9ca3af",
          borderTop: "1px solid #f0f0f0",
          background: "#fff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>Fortinet Americas Price List · USD</span>
        <a
          href="/admin/precios"
          style={{
            color: "#D95A00",
            fontSize: 10,
            textDecoration: "none",
            fontWeight: 600,
          }}
          title="Actualizar lista de precios"
        >
          Actualizar →
        </a>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CotizacionForm() {
  const [showPriceList, setShowPriceList] = useState(true);

  // ── Precios desde Supabase ──
  const { prices, loading: pricesLoading, error: pricesError } = usePriceList();

  // ── Datos de la empresa ──
  const [empresa, setEmpresa] = useState<EmpresaInfo>({
    nombre: "Fortress8 Cibersecurity Services SA de CV",
    rfc: "FCS180507LBA",
    direccion: "Cerrada Montejo #190, El Cedro, Nacajuca, Tabasco. Cp. 86220",
    web: "www.fortress8.com",
    email: "contacto@fortress8.com",
    telOficina: "9933179494",
    telMovil: "9934581129",
  });
  const setEmp = (k: keyof EmpresaInfo) => (v: string) =>
    setEmpresa((p) => ({ ...p, [k]: v }));

  // ── Número de cotización ──
  const [cotNum] = useState(() => {
    const y = new Date().getFullYear();
    return `COT-${y}`;
  });
  const [cotDate] = useState(() =>
    new Date().toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  );

  const [vigenciaDias, setVigenciaDias] = useState("30");
  const [moneda, setMoneda] = useState("USD (Dólares americanos)");
  const [atencion, setAtencion] = useState("");
  const [clientePuesto, setClientePuesto] = useState("");
  const [clienteEmpresa, setClienteEmpresa] = useState("");

  // ── Líneas de cotización ──
  const [items, setItems] = useState<LineItem[]>([
    {
      id: 1,
      cant: "",
      sku: "",
      unidad: "PZA",
      descripcion: "",
      precioUnitario: "",
      descuento: "",
    },
  ]);

  // ── Imágenes ──
  const [selloImg, setSelloImg] = useState<string | null>(null);
  const [firmaImg, setFirmaImg] = useState<string | null>(null);

  const handleSelloUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setSelloImg(reader.result as string);
    reader.readAsDataURL(file);
  };
  const handleFirmaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setFirmaImg(reader.result as string);
    reader.readAsDataURL(file);
  };

  // ── Condiciones y firma ──
  const [cond, setCond] = useState<Condiciones>({
    tiempoEntrega: "",
    vigenciaServicios: "",
    condicionesPago: "",
    lugarEntrega: "",
  });
  const [firma, setFirma] = useState<FirmaInfo>({
    nombre: "Manuel Ble Vazquez",
    puesto: "Gerencia Comercial",
    tel: "9932619380",
  });
  const setFirmaField = (k: keyof FirmaInfo) => (v: string) =>
    setFirma((p) => ({ ...p, [k]: v }));

  const [ivaActivo, setIvaActivo] = useState(false);
  const [ivaPercent, setIvaPercent] = useState("16");

  // ── Agregar desde lista de precios ──
  const handleAddFromList = useCallback(
    (item: { sku: string; desc: string; price: number }) => {
      setItems((prev) => {
        const last = prev[prev.length - 1];
        const isEmpty =
          !last.sku && !last.descripcion && !last.precioUnitario;
        if (isEmpty) {
          return prev.map((it) =>
            it.id === last.id
              ? {
                  ...it,
                  sku: item.sku,
                  descripcion: item.desc,
                  precioUnitario: String(item.price),
                  cant: "1",
                  unidad: "PZA",
                }
              : it
          );
        }
        return [
          ...prev,
          {
            id: nextId++,
            cant: "1",
            sku: item.sku,
            unidad: "PZA",
            descripcion: item.desc,
            precioUnitario: String(item.price),
            descuento: "",
          },
        ];
      });
    },
    []
  );

  // ── Cálculos ──
  const { rows, subtotalGlobal, ivaPct, iva, total } = computeTotals(items, ivaActivo, ivaPercent);

  const updateItem = useCallback(
    (id: number, field: keyof LineItem, value: string) =>
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, [field]: value } : it))
      ),
    []
  );
  const addRow = () =>
    setItems((prev) => [
      ...prev,
      {
        id: nextId++,
        cant: "",
        sku: "",
        unidad: "PZA",
        descripcion: "",
        precioUnitario: "",
        descuento: "",
      },
    ]);
  const removeRow = (id: number) =>
    setItems((prev) =>
      prev.length > 1 ? prev.filter((it) => it.id !== id) : prev
    );

  // ── Imprimir ──
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${cotNum}-${clienteEmpresa || "Fortress8"}`,
    pageStyle: `
      @page { size: A4; margin: 0; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        table { table-layout: fixed !important; width: 100% !important; }
        td, th { word-break: break-word; overflow: hidden; }
        input, textarea {
          border: none !important; background: transparent !important;
          color: #111827 !important; -webkit-text-fill-color: #111827 !important;
          width: 100% !important; box-sizing: border-box !important;
        }
        input::placeholder, textarea::placeholder { color: transparent !important; }
        .print\\:hidden { display: none !important; }
      }
    `,
  });

  // ── Clases reutilizables ──
  const cell =
    "w-full bg-transparent border-0 focus:outline-none focus:bg-orange-50 focus:ring-1 focus:ring-[#D95A00] rounded px-1 py-0.5 text-sm text-gray-900 transition-colors placeholder:text-gray-300";
  const fieldRow =
    "grid grid-cols-[120px_1fr] items-center border border-gray-300";
  const fieldLabel =
    "bg-[#f5f5f5] border-r border-gray-300 px-2 py-1 text-xs font-bold text-gray-700 uppercase tracking-wide";
  const fieldInput =
    "px-2 py-1 text-sm text-gray-900 focus:outline-none focus:bg-orange-50 focus:ring-1 focus:ring-[#D95A00] rounded-sm transition-colors placeholder:text-gray-300";
  const totalLabelCell =
    "border border-gray-300 px-2 py-1 text-right text-xs font-semibold text-white whitespace-nowrap";
  const totalValueCell =
    "border border-gray-300 px-2 py-1 text-right text-sm font-semibold text-gray-900 tabular-nums break-all";

  return (
    <div className="bg-gray-300 min-h-screen flex flex-col">
      {/* ── Toolbar ── */}
      <div className="print:hidden fixed top-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => setShowPriceList((v) => !v)}
          className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-semibold px-4 py-2 rounded-full shadow-md transition-colors flex items-center gap-2"
        >
          <svg
            width="15"
            height="15"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          {showPriceList ? "Ocultar lista" : "Lista de precios"}
        </button>
        <button
          onClick={() => handlePrint?.()}
          className="bg-[#D95A00] hover:bg-[#b84d00] text-white text-sm font-semibold px-4 py-2 rounded-full shadow-lg transition-colors flex items-center gap-2"
        >
          <svg
            width="16"
            height="16"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 9V3h12v6M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v7H6v-7z"
            />
          </svg>
          Exportar PDF
        </button>
      </div>

      {/* ── Hint ── */}
      <div className="print:hidden fixed top-4 left-1/2 -translate-x-1/2 bg-[#D95A00] text-white text-xs font-medium px-4 py-1.5 rounded-full shadow-lg z-50 opacity-80 pointer-events-none select-none">
        ✏️ Haz clic en cualquier texto para editarlo · Busca productos en el
        panel izquierdo
      </div>

      {/* ── Layout principal ── */}
      <div className="flex flex-1 pt-14 pb-10 gap-0 justify-center print:pt-0 print:block">
        {/* Panel de lista de precios */}
        {showPriceList && (
          <div
            className="print:hidden sticky top-14 self-start"
            style={{ height: "calc(100vh - 56px)", width: 300, flexShrink: 0 }}
          >
            <PriceListPanel
              items={prices}
              loading={pricesLoading}
              error={pricesError}
              onAdd={handleAddFromList}
            />
          </div>
        )}

        {/* Hoja A4 */}
        <div className="flex-1 flex justify-center overflow-x-auto px-4">
          <div
            ref={printRef}
            className="bg-white shadow-2xl"
            style={{
              width: 794,
              minHeight: 1123,
              boxSizing: "border-box",
              fontFamily: "'Segoe UI', Arial, sans-serif",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* ── Encabezado ── */}
            <div className="flex justify-between items-start px-8 pt-8 pb-4 border-b border-gray-200">
              <div className="flex flex-col gap-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo.png"
                  alt="Fortress8"
                  className="h-16 object-contain"
                />
                <div className="mt-2 flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-[#D95A00] uppercase tracking-widest">
                    Cotización
                  </span>
                  <span className="text-lg font-bold text-gray-900">
                    {cotNum}
                  </span>
                  <span className="text-xs text-gray-500">{cotDate}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-0.5 leading-6">
                <Editable
                  value={empresa.nombre}
                  onChange={setEmp("nombre")}
                  placeholder="Nombre de la empresa"
                  className="text-sm w-72"
                  align="right"
                  bold
                />
                <Editable
                  value={empresa.rfc}
                  onChange={setEmp("rfc")}
                  placeholder="RFC"
                  className="text-xs text-gray-600 w-40"
                  align="right"
                />
                <Editable
                  value={empresa.direccion}
                  onChange={setEmp("direccion")}
                  placeholder="Dirección"
                  className="text-xs text-gray-600 w-72"
                  align="right"
                />
                <Editable
                  value={empresa.web}
                  onChange={setEmp("web")}
                  placeholder="www.sitio.com"
                  className="text-xs text-gray-600 w-48"
                  align="right"
                />
                <Editable
                  value={empresa.email}
                  onChange={setEmp("email")}
                  placeholder="correo@empresa.com"
                  className="text-xs text-gray-600 w-56"
                  align="right"
                />
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <span>O:</span>
                  <Editable
                    value={empresa.telOficina}
                    onChange={setEmp("telOficina")}
                    placeholder="Tel oficina"
                    className="text-xs text-gray-600 w-28"
                  />
                  <span className="text-gray-400 mx-1">|</span>
                  <span>M:</span>
                  <Editable
                    value={empresa.telMovil}
                    onChange={setEmp("telMovil")}
                    placeholder="Tel móvil"
                    className="text-xs text-gray-600 w-28"
                  />
                </div>
              </div>
            </div>

            <div className="px-8 py-6 space-y-6">
              {/* ── Datos del cliente ── */}
              <div className="border border-gray-300 divide-y divide-gray-300">
                <div className={fieldRow}>
                  <span className={fieldLabel}>Atención</span>
                  <input
                    className={fieldInput}
                    placeholder="Nombre del contacto"
                    value={atencion}
                    onChange={(e) => setAtencion(e.target.value)}
                  />
                </div>
                <div className={fieldRow}>
                  <span className={fieldLabel}>Puesto</span>
                  <input
                    className={fieldInput}
                    placeholder="Cargo / Posición"
                    value={clientePuesto}
                    onChange={(e) => setClientePuesto(e.target.value)}
                  />
                </div>
                <div className={fieldRow}>
                  <span className={fieldLabel}>Empresa</span>
                  <input
                    className={fieldInput}
                    placeholder="Razón social o nombre comercial"
                    value={clienteEmpresa}
                    onChange={(e) => setClienteEmpresa(e.target.value)}
                  />
                </div>
              </div>

              {/* ── Tabla de productos ── */}
              <div className="w-full">
                <table
                  className="w-full border-collapse text-sm"
                  style={{ tableLayout: "fixed" }}
                >
                  <colgroup>
                    <col style={{ width: 42 }} />
                    <col style={{ width: 72 }} />
                    <col style={{ width: 46 }} />
                    <col />
                    <col style={{ width: 84 }} />
                    <col style={{ width: 84 }} />
                    <col style={{ width: 76 }} />
                    <col style={{ width: 84 }} />
                    <col style={{ width: 90 }} />
                    <col style={{ width: 22 }} />
                  </colgroup>
                  <thead>
                    <tr style={{ backgroundColor: "#D95A00" }}>
                      {[
                        "Cant.",
                        "SKU",
                        "Unidad",
                        "Descripción",
                        "P. Unitario",
                        "P. Extendido",
                        "Descuento",
                        "",
                        "Subtotal",
                        "",
                      ].map((h, i) => (
                        <th
                          key={i}
                          className="border border-[#b84d00] text-white font-semibold text-[11px] py-2 px-1 text-center"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((item, idx) => (
                      <tr
                        key={item.id}
                        className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        <td className="border border-gray-300 p-0">
                          <input
                            className={cell + " text-center"}
                            placeholder="0"
                            value={item.cant}
                            onChange={(e) =>
                              updateItem(item.id, "cant", e.target.value)
                            }
                          />
                        </td>
                        <td className="border border-gray-300 p-0">
                          <input
                            className={cell + " text-[10px]"}
                            placeholder="—"
                            value={item.sku}
                            onChange={(e) =>
                              updateItem(item.id, "sku", e.target.value)
                            }
                          />
                        </td>
                        <td className="border border-gray-300 p-0">
                          <input
                            className={cell + " text-center"}
                            placeholder="PZA"
                            value={item.unidad}
                            onChange={(e) =>
                              updateItem(item.id, "unidad", e.target.value)
                            }
                          />
                        </td>
                        <td className="border border-gray-300 p-0 align-top">
                          <textarea
                            className={cell + " resize-none leading-snug"}
                            placeholder="Descripción del producto o servicio"
                            value={item.descripcion}
                            rows={3}
                            style={{ height: "auto", minHeight: 60 }}
                            onInput={(e) => {
                              const t = e.currentTarget;
                              t.style.height = "auto";
                              t.style.height = t.scrollHeight + "px";
                            }}
                            onChange={(e) =>
                              updateItem(
                                item.id,
                                "descripcion",
                                e.target.value
                              )
                            }
                          />
                        </td>
                        <td className="border border-gray-300 p-0">
                          <input
                            className={
                              cell + " text-right text-[11px] tabular-nums"
                            }
                            placeholder="$0.00"
                            value={item.precioUnitario}
                            onChange={(e) =>
                              updateItem(
                                item.id,
                                "precioUnitario",
                                e.target.value
                              )
                            }
                          />
                        </td>
                        <td className="border border-gray-300 px-1 py-1 text-right text-[11px] font-medium text-gray-900 tabular-nums break-all">
                          {parseMXN(item.cant) > 0 &&
                          parseMXN(item.precioUnitario) > 0 ? (
                            formatMXN(item.extendido)
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="border border-gray-300 p-0">
                          <input
                            className={
                              cell + " text-right text-[11px] tabular-nums"
                            }
                            placeholder="$0.00"
                            value={item.descuento}
                            onChange={(e) =>
                              updateItem(item.id, "descuento", e.target.value)
                            }
                          />
                        </td>
                        <td className="border border-gray-300" />
                        <td className="border border-gray-300 px-1 py-1 text-right text-[11px] font-semibold text-gray-900 tabular-nums break-all">
                          {parseMXN(item.cant) > 0 &&
                          parseMXN(item.precioUnitario) > 0 ? (
                            formatMXN(item.subtotal)
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="border border-gray-300 text-center print:hidden">
                          <button
                            onClick={() => removeRow(item.id)}
                            title="Eliminar"
                            className="text-red-400 hover:text-red-600 font-bold text-base leading-none px-1"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="print:hidden">
                      <td
                        colSpan={10}
                        className="border border-gray-300 py-1 text-center"
                      >
                        <button
                          onClick={addRow}
                          className="text-[#D95A00] hover:text-[#b84d00] text-xs font-semibold tracking-wide uppercase transition-colors"
                        >
                          + Agregar fila manual
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan={6}
                        className="border-0 px-2 py-1 text-[10px] text-gray-400 italic"
                      >
                        * P. Extendido = Cant × P. Unitario &nbsp;|&nbsp;
                        Subtotal = Extendido − Descuento
                      </td>
                      <td className="border-0" />
                      <td
                        className={totalLabelCell}
                        style={{ backgroundColor: "#D95A00" }}
                      >
                        Subtotal
                      </td>
                      <td className={totalValueCell}>
                        {formatMXN(subtotalGlobal)}
                      </td>
                      <td className="border-0 print:hidden" />
                    </tr>
                    {!ivaActivo && (
                      <tr className="print:hidden">
                        <td colSpan={8} className="border-0" />
                        <td
                          colSpan={2}
                          className="border-0 px-2 py-1 text-right"
                        >
                          <button
                            onClick={() => setIvaActivo(true)}
                            className="text-[#D95A00] hover:text-[#b84d00] text-xs font-semibold tracking-wide uppercase transition-colors"
                          >
                            + Agregar IVA
                          </button>
                        </td>
                      </tr>
                    )}
                    {ivaActivo && (
                      <tr>
                        <td colSpan={7} className="border-0" />
                        <td
                          className="border border-gray-300 px-2 py-1 text-right text-xs font-semibold text-white"
                          style={{ backgroundColor: "#D95A00" }}
                        >
                          <div className="flex flex-col items-end gap-0.5">
                            <div className="flex items-center justify-end gap-1">
                              <span>IVA</span>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={ivaPercent}
                                onChange={(e) => setIvaPercent(e.target.value)}
                                className="w-8 text-center bg-white/20 text-white border-0 border-b border-white/60 focus:outline-none rounded-sm text-xs font-semibold"
                              />
                              <span>%</span>
                            </div>
                            <button
                              onClick={() => setIvaActivo(false)}
                              className="text-white/80 hover:text-white text-[10px] underline underline-offset-1 transition-colors print:hidden leading-none"
                            >
                              quitar
                            </button>
                          </div>
                        </td>
                        <td className={totalValueCell}>{formatMXN(iva)}</td>
                        <td className="border-0 print:hidden" />
                      </tr>
                    )}
                    <tr>
                      <td colSpan={7} className="border-0" />
                      <td
                        className="border-2 border-[#D95A00] px-2 py-1.5 text-right text-sm font-bold text-white whitespace-nowrap"
                        style={{ backgroundColor: "#D95A00" }}
                      >
                        TOTAL
                      </td>
                      <td className="border-2 border-[#D95A00] px-2 py-1.5 text-right text-sm font-bold text-gray-900 tabular-nums break-all">
                        {formatMXN(total)}
                      </td>
                      <td className="border-0 print:hidden" />
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* ── Vigencia y moneda ── */}
              <div className="text-xs text-gray-600 space-y-1">
                <div className="flex items-center gap-1 flex-wrap">
                  <span>Vigencia de esta cotización</span>
                  <Editable
                    value={vigenciaDias}
                    onChange={setVigenciaDias}
                    placeholder="30"
                    className="w-10 text-center text-xs"
                    bold
                  />
                  <span className="font-bold">días Naturales</span>
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  <span>Precios expresados en</span>
                  <Editable
                    value={moneda}
                    onChange={setMoneda}
                    placeholder="USD (Dólares americanos)"
                    className="w-52 text-xs"
                  />
                </div>
              </div>

              {/* ── Condiciones ── */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                {(
                  [
                    ["tiempoEntrega", "Tiempo de Entrega"],
                    ["vigenciaServicios", "Vigencia de servicios"],
                    ["condicionesPago", "Condiciones de pago"],
                    ["lugarEntrega", "Lugar de entrega"],
                  ] as [keyof Condiciones, string][]
                ).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="font-semibold whitespace-nowrap text-gray-700 min-w-[140px]">
                      {label}:
                    </span>
                    <input
                      className="flex-1 border-b border-gray-300 focus:border-[#D95A00] focus:outline-none text-sm text-gray-900 py-0.5 transition-colors bg-transparent placeholder:text-gray-300"
                      placeholder="—"
                      value={cond[key]}
                      onChange={(e) =>
                        setCond((p) => ({ ...p, [key]: e.target.value }))
                      }
                    />
                  </div>
                ))}
              </div>

              {/* ── Firma y sello ── */}
              <div className="flex justify-between items-end pt-4 border-t border-gray-200">
                {/* Firma */}
                <div className="space-y-1">
                  <label
                    className="relative flex flex-col items-center justify-center cursor-pointer rounded transition-colors mb-1"
                    style={{
                      width: 192,
                      height: 64,
                      border: firmaImg ? "none" : "2px dashed #D95A00",
                      backgroundColor: firmaImg ? "transparent" : "#fff8f5",
                    }}
                  >
                    {firmaImg ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={firmaImg}
                          alt="Firma"
                          className="max-h-16 max-w-[192px] object-contain"
                        />
                        <span className="absolute bottom-0.5 right-1 text-[10px] text-gray-400 bg-white/80 px-1 rounded print:hidden">
                          cambiar
                        </span>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-0.5 text-center print:hidden">
                        <svg
                          width="20"
                          height="20"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="#D95A00"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                          />
                        </svg>
                        <span className="text-[11px] text-[#D95A00] font-semibold">
                          Subir firma
                        </span>
                        <span className="text-[10px] text-gray-400">
                          PNG, JPG, SVG
                        </span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleFirmaUpload}
                    />
                  </label>
                  <div className="w-48 border-b border-gray-400 mb-3" />
                  <Editable
                    value={firma.nombre}
                    onChange={setFirmaField("nombre")}
                    placeholder="Nombre"
                    className="text-sm w-52"
                    bold
                  />
                  <Editable
                    value={firma.puesto}
                    onChange={setFirmaField("puesto")}
                    placeholder="Puesto"
                    className="text-sm text-gray-700 w-52"
                  />
                  <Editable
                    value={firma.tel}
                    onChange={setFirmaField("tel")}
                    placeholder="Teléfono"
                    className="text-sm text-gray-700 w-40"
                  />
                </div>

                {/* Sello */}
                <label
                  className="relative flex flex-col items-center justify-center cursor-pointer rounded transition-colors"
                  style={{
                    minWidth: 160,
                    minHeight: 100,
                    border: selloImg ? "none" : "2px dashed #D95A00",
                    backgroundColor: selloImg ? "transparent" : "#fff8f5",
                  }}
                >
                  {selloImg ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selloImg}
                        alt="Sello"
                        className="max-h-24 max-w-[160px] object-contain"
                      />
                      <span className="absolute bottom-1 right-1 text-[10px] text-gray-400 bg-white/80 px-1 rounded print:hidden">
                        cambiar
                      </span>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-1 px-3 py-2 text-center print:hidden">
                      <svg
                        width="28"
                        height="28"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="#D95A00"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                        />
                      </svg>
                      <span className="text-[11px] text-[#D95A00] font-semibold">
                        Subir sello
                      </span>
                      <span className="text-[10px] text-gray-400">
                        PNG, JPG, SVG
                      </span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleSelloUpload}
                  />
                </label>
              </div>

              {/* ── Footer legal ── */}
              <div className="border-t border-gray-200 pt-4 flex justify-between text-[10px] text-gray-500">
                <div className="flex flex-col gap-0.5">
                  <Editable
                    value={empresa.nombre}
                    onChange={setEmp("nombre")}
                    placeholder="Nombre empresa"
                    className="text-[10px] w-64"
                  />
                  <Editable
                    value={empresa.rfc}
                    onChange={setEmp("rfc")}
                    placeholder="RFC"
                    className="text-[10px] w-32"
                  />
                  <Editable
                    value={empresa.direccion}
                    onChange={setEmp("direccion")}
                    placeholder="Dirección"
                    className="text-[10px] w-72"
                  />
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <Editable
                    value={empresa.web}
                    onChange={setEmp("web")}
                    placeholder="www.sitio.com"
                    className="text-[10px] w-40"
                    align="right"
                  />
                  <Editable
                    value={empresa.email}
                    onChange={setEmp("email")}
                    placeholder="correo@empresa.com"
                    className="text-[10px] w-48"
                    align="right"
                  />
                  <div className="flex items-center gap-1 text-[10px]">
                    <span>O:</span>
                    <Editable
                      value={empresa.telOficina}
                      onChange={setEmp("telOficina")}
                      placeholder="Tel oficina"
                      className="text-[10px] w-24"
                    />
                    <span className="text-gray-400 mx-0.5">|</span>
                    <span>M:</span>
                    <Editable
                      value={empresa.telMovil}
                      onChange={setEmp("telMovil")}
                      placeholder="Tel móvil"
                      className="text-[10px] w-24"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}