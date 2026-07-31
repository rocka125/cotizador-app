// CotizacionForm.tsx — Fortress8 Quotation App
// Lista de precios cargada desde Supabase (no hardcodeada)
"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useReactToPrint } from "react-to-print";
import { createClient } from "@/lib/supabase/client";
import { fetchAllRows } from "@/lib/supabase/fetchAll";
import type { PriceItem, LineItem, Condiciones, EmpresaInfo, FirmaInfo, MonedaCode, EstadoCotizacion } from "@/lib/quotes/types";
import { computeTotals, parseMoneyInput as parseMXN, formatMXN } from "@/lib/quotes/totals";
import type { QuoteFormState, QuoteSavePayload } from "@/lib/quotes/serialize";
import { EmailModal } from "@/components/quotes/EmailModal";

export type { PriceItem };

const MONEDA_LABELS: Record<MonedaCode, string> = {
  USD: "USD (Dólares americanos)",
  MXN: "MXN (Pesos mexicanos)",
  EUR: "EUR (Euros)",
};

// ─── Hook: carga precios desde Supabase ───────────────────────────────────────
function usePriceList() {
  const [prices, setPrices] = useState<PriceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    // PostgREST caps a plain .select() at 1000 rows silently -- the real
    // catalog runs ~10k+ SKUs, so this must page through fetchAllRows or the
    // product picker only ever shows a fraction of the price list.
    fetchAllRows<{ categoria: string; sku: string; descripcion: string; precio: number }>(
      supabase,
      "active_price_list",
      "categoria, sku, descripcion, precio"
    )
      .then((data) => {
        setPrices(data.map((d) => ({ sheet: d.categoria, sku: d.sku, desc: d.descripcion, price: Number(d.precio) })));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar precios"))
      .finally(() => setLoading(false));
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
        borderRight: "1px solid rgba(255,255,255,0.1)",
        display: "flex",
        flexDirection: "column",
        background: "#000",
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
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 6,
              background: "rgba(255,255,255,0.06)",
              color: "#fff",
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
              borderColor: activeSheet === s ? "#D95A00" : "rgba(255,255,255,0.15)",
              background: activeSheet === s ? "rgba(217,90,0,0.15)" : "rgba(255,255,255,0.06)",
              color: activeSheet === s ? "#D95A00" : "rgba(255,255,255,0.6)",
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
                href="/precios"
                style={{ color: "#D95A00", textDecoration: "underline" }}
              >
                /precios
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
              href="/precios"
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
              borderBottom: "1px solid rgba(255,255,255,0.08)",
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
                  color: "#fff",
                  lineHeight: 1.3,
                  marginBottom: 2,
                }}
              >
                {item.sku}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.5)",
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
          borderTop: "1px solid rgba(255,255,255,0.08)",
          background: "#000",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>Fortinet Americas Price List · USD</span>
        <a
          href="/precios"
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

// ─── Success modal ────────────────────────────────────────────────────────────
function SuccessModal({
  numeroCotizacion,
  pdfHref,
  onClose,
  onGoToList,
}: {
  numeroCotizacion: string;
  pdfHref?: string;
  onClose: () => void;
  onGoToList: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm print:hidden">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
        <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Cotización guardada</h3>
        <p className="text-sm text-gray-500 mb-6">{numeroCotizacion} se guardó correctamente.</p>
        <div className="flex flex-col gap-2">
          {pdfHref && (
            <a
              href={pdfHref}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors"
            >
              Exportar PDF ahora
            </a>
          )}
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-lg bg-[#D95A00] hover:bg-[#b84d00] text-white text-sm font-semibold transition-colors"
          >
            Seguir editando
          </button>
          <button
            onClick={onGoToList}
            className="w-full py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors"
          >
            Ir a lista de cotizaciones
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Admin panel ──────────────────────────────────────────────────────────────
function AdminPanel({
  estado,
  setEstado,
  mensaje,
  setMensaje,
}: {
  estado: EstadoCotizacion;
  setEstado: (e: EstadoCotizacion) => void;
  mensaje: string;
  setMensaje: (m: string) => void;
}) {
  return (
    <div className="print:hidden fixed top-4 left-4 z-50 bg-white border border-gray-300 rounded-xl shadow-lg p-4 w-72">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Panel de administrador</p>
      <label className="block text-xs text-gray-600 mb-1">Estado</label>
      <select
        value={estado}
        onChange={(e) => setEstado(e.target.value as EstadoCotizacion)}
        className="w-full mb-3 border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-900"
      >
        <option value="pendiente">Pendiente</option>
        <option value="aprobada">Aprobada</option>
        <option value="rechazada">Rechazada</option>
      </select>
      <label className="block text-xs text-gray-600 mb-1">Mensaje para el dueño (opcional)</label>
      <textarea
        value={mensaje}
        onChange={(e) => setMensaje(e.target.value)}
        rows={2}
        placeholder="Ej. Ajusta el descuento antes de enviarla…"
        className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-gray-900 resize-none"
      />
    </div>
  );
}

export interface CotizacionFormProps {
  mode?: "nueva" | "editar" | "ver";
  quoteId?: string;
  numeroCotizacion?: string;
  ownerId?: string;
  currentUserId?: string;
  isAdmin?: boolean;
  initial?: QuoteFormState;
  initialEstado?: EstadoCotizacion;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CotizacionForm({
  mode = "nueva",
  quoteId,
  numeroCotizacion,
  ownerId,
  currentUserId,
  isAdmin = false,
  initial,
  initialEstado = "pendiente",
}: CotizacionFormProps) {
  const router = useRouter();
  const readOnly = mode === "ver";
  const isForeignQuote = !!ownerId && !!currentUserId && ownerId !== currentUserId;

  const [showPriceList, setShowPriceList] = useState(!readOnly);

  // ── Precios desde Supabase ──
  const { prices, loading: pricesLoading, error: pricesError } = usePriceList();

  // ── Datos de la empresa ──
  const [empresa, setEmpresa] = useState<EmpresaInfo>(
    initial?.empresa ?? {
      nombre: "Fortress8 Cibersecurity Services SA de CV",
      rfc: "FCS180507LBA",
      direccion: "Cerrada Montejo #190, El Cedro, Nacajuca, Tabasco. Cp. 86220",
      web: "www.fortress8.com",
      email: "contacto@fortress8.com",
      telOficina: "9933179494",
      telMovil: "9934581129",
    }
  );
  const setEmp = (k: keyof EmpresaInfo) => (v: string) =>
    setEmpresa((p) => ({ ...p, [k]: v }));

  // ── Número de cotización ──
  const [cotDate] = useState(() =>
    new Date().toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  );
  const cotNum = numeroCotizacion ?? `COT-${new Date().getFullYear()}`;

  const [vigenciaDias, setVigenciaDias] = useState(initial?.vigenciaDias ?? "30");
  const [monedaCode, setMonedaCode] = useState<MonedaCode>(initial?.monedaCode ?? "USD");
  const [tipoCambio, setTipoCambio] = useState(initial?.tipoCambio ?? "1.0000");
  const [exchangeRate, setExchangeRate] = useState<{ MXN: number; EUR: number; live: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/exchange-rate")
      .then((r) => r.json())
      .then(setExchangeRate)
      .catch(() => {});
  }, []);
  const [atencion, setAtencion] = useState(initial?.atencion ?? "");
  const [clientePuesto, setClientePuesto] = useState(initial?.clientePuesto ?? "");
  const [clienteEmpresa, setClienteEmpresa] = useState(initial?.clienteEmpresa ?? "");

  // ── Líneas de cotización ──
  const [items, setItems] = useState<LineItem[]>(
    initial?.items ?? [
      {
        id: 1,
        cant: "",
        sku: "",
        unidad: "PZA",
        descripcion: "",
        precioUnitario: "",
        descuento: "",
      },
    ]
  );

  // ── Imágenes ──
  const [selloImg, setSelloImg] = useState<string | null>(initial?.selloImg ?? null);
  const [firmaImg, setFirmaImg] = useState<string | null>(initial?.firmaImg ?? null);

  // ── Guardado ──
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedNumero, setSavedNumero] = useState<string | null>(null);
  const [savedQuoteId, setSavedQuoteId] = useState<string | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [estado, setEstado] = useState<EstadoCotizacion>(initialEstado);
  const [mensajeAdmin, setMensajeAdmin] = useState("");

  // Currency change -> fetch a live rate for non-USD (editable afterward as
  // a normal field, so typing a manually negotiated rate afterward is never
  // overwritten) AND rescale every existing line's precioUnitario by the
  // ratio between the old and new rate, so switching currency mid-quote
  // converts prices already on the grid instead of leaving them in the old
  // currency's numbers under the new currency's label. Skipped on first
  // mount so loading an existing quote never touches its saved prices.
  const isFirstMonedaRender = useRef(true);
  const prevRateRef = useRef(monedaCode === "USD" ? 1 : parseMXN(tipoCambio) || 1);
  useEffect(() => {
    if (isFirstMonedaRender.current) {
      isFirstMonedaRender.current = false;
      return;
    }
    let cancelled = false;
    async function syncRateAndConvert() {
      let newRate = 1;
      if (monedaCode !== "USD") {
        try {
          const res = await fetch("/api/exchange-rate");
          const rates = await res.json();
          newRate = Number(rates[monedaCode]) || prevRateRef.current || 1;
          if (!cancelled) setExchangeRate(rates);
        } catch {
          newRate = prevRateRef.current || 1;
        }
      }
      if (cancelled) return;

      const oldRate = prevRateRef.current || 1;
      setTipoCambio(monedaCode === "USD" ? "1.0000" : newRate.toFixed(4));
      if (oldRate !== newRate) {
        setItems((prev) =>
          prev.map((it) => {
            const n = parseMXN(it.precioUnitario);
            if (!n) return it;
            return { ...it, precioUnitario: ((n / oldRate) * newRate).toFixed(2) };
          })
        );
      }
      prevRateRef.current = newRate;
    }
    syncRateAndConvert();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monedaCode]);

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
  const [cond, setCond] = useState<Condiciones>(
    initial?.condiciones ?? {
      tiempoEntrega: "",
      vigenciaServicios: "",
      condicionesPago: "",
      lugarEntrega: "",
    }
  );
  const [firma, setFirma] = useState<FirmaInfo>(
    initial?.firma ?? {
      nombre: "Manuel Ble Vazquez",
      puesto: "Gerencia Comercial",
      tel: "9932619380",
    }
  );
  const setFirmaField = (k: keyof FirmaInfo) => (v: string) =>
    setFirma((p) => ({ ...p, [k]: v }));

  const [ivaActivo, setIvaActivo] = useState(initial?.ivaActivo ?? false);
  const [ivaPercent, setIvaPercent] = useState(initial?.ivaPercent ?? "16");

  // ── Agregar desde lista de precios ──
  // The price list is always quoted in USD (see PriceListPanel's "· USD"
  // footer) -- convert to the quote's current currency at the currently
  // displayed rate (which may be a manually negotiated override, not just
  // the live one) so an item added while moneda=MXN lands in pesos, not USD.
  const handleAddFromList = useCallback(
    (item: { sku: string; desc: string; price: number }) => {
      const rate = monedaCode === "USD" ? 1 : parseMXN(tipoCambio) || 1;
      const precio = (item.price * rate).toFixed(2);
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
                  precioUnitario: precio,
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
            precioUnitario: precio,
            descuento: "",
          },
        ];
      });
    },
    [monedaCode, tipoCambio]
  );

  // ── Cálculos ──
  const { rows, subtotalGlobal, ivaPct, iva, total } = computeTotals(items, ivaActivo, ivaPercent);

  // ── Guardar (crear o editar) ──
  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      const payload: QuoteSavePayload = {
        atencion,
        clientePuesto,
        clienteEmpresa,
        empresa,
        vigenciaDias,
        monedaCode,
        tipoCambio,
        condiciones: cond,
        firma,
        firmaImg,
        selloImg,
        items,
        ivaActivo,
        ivaPercent,
        ...(isAdmin && isForeignQuote ? { estado, mensajeAdmin } : {}),
      };

      const res = await fetch(mode === "editar" && quoteId ? `/api/quotes/${quoteId}` : "/api/quotes", {
        method: mode === "editar" && quoteId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) {
        setSaveError(body.error ?? "Error al guardar la cotización");
        return;
      }
      setSavedNumero(body.numero_cotizacion ?? numeroCotizacion ?? "");
      setSavedQuoteId(body.id ?? quoteId ?? null);
      if (mode === "nueva" && body.id) {
        router.replace(`/cotizaciones/${body.id}`);
      } else {
        router.refresh();
      }
    } catch {
      setSaveError("Error de conexión al guardar");
    } finally {
      setSaving(false);
    }
  }

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

  return (
    <div className="bg-black min-h-screen flex flex-col">
      {isAdmin && isForeignQuote && !readOnly && (
        <AdminPanel estado={estado} setEstado={setEstado} mensaje={mensajeAdmin} setMensaje={setMensajeAdmin} />
      )}
      {savedNumero && (
        <SuccessModal
          numeroCotizacion={savedNumero}
          pdfHref={savedQuoteId ? `/api/quotes/${savedQuoteId}/pdf` : undefined}
          onClose={() => setSavedNumero(null)}
          onGoToList={() => router.push("/cotizaciones")}
        />
      )}

      {/* ── Toolbar ── */}
      <div className="print:hidden sticky top-0 z-50 flex items-center gap-4 px-4 border-b border-white/10 bg-black" style={{ height: 48 }}>
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-[#D95A00] flex items-center justify-center text-white text-xs font-bold">F8</div>
          <span className="text-sm font-semibold text-white whitespace-nowrap">Cotizador Fortress8</span>
        </div>

        <div className="flex-1 flex items-center justify-center gap-2 min-w-0">
          <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full border border-[#D95A00]/40 text-[#D95A00] bg-[#D95A00]/10 whitespace-nowrap">
            {cotNum}
          </span>
          <span className="text-xs text-white/40 whitespace-nowrap hidden sm:inline">{cotDate}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {readOnly ? (
            <>
              <button
                onClick={() => router.push("/cotizaciones")}
                className="bg-white/10 border border-white/15 hover:bg-white/15 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-colors"
              >
                ← Volver
              </button>
              {(isAdmin || !isForeignQuote) && quoteId && (
                <button
                  onClick={() => router.push(`/cotizaciones/${quoteId}`)}
                  className="bg-white/10 border border-white/15 hover:bg-white/15 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-colors"
                >
                  Editar
                </button>
              )}
            </>
          ) : (
            <button
              onClick={() => setShowPriceList((v) => !v)}
              className="bg-white/10 border border-white/15 hover:bg-white/15 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {showPriceList ? "Ocultar lista" : "Lista"}
            </button>
          )}
          {!readOnly && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
          )}
          <button
            onClick={() => {
              // A saved quote gets the real vector PDF (server-rendered,
              // selectable text, always matches what's persisted); an
              // unsaved "nueva" quote has no id yet to fetch, so it falls
              // back to the browser print dialog.
              if (quoteId) window.open(`/api/quotes/${quoteId}/pdf`, "_blank");
              else handlePrint?.();
            }}
            className="bg-[#D95A00] hover:bg-[#b84d00] text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 9V3h12v6M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v7H6v-7z" />
            </svg>
            Exportar PDF
          </button>
          {quoteId && (
            <button
              onClick={() => setShowEmailModal(true)}
              className="bg-white/10 border border-white/15 hover:bg-white/15 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Correo
            </button>
          )}
        </div>
      </div>

      {/* ── Hint strip ── */}
      {!readOnly && !isForeignQuote && (
        <div className="print:hidden sticky top-12 z-40 px-4 py-1.5 text-[11px] text-white/40 border-b border-white/10 bg-black/95 flex items-center gap-2 flex-wrap">
          <span>Haz clic en cualquier texto para editarlo</span>
          <span className="text-white/20">·</span>
          <span>Busca y agrega productos desde el panel izquierdo</span>
          <span className="text-white/20">·</span>
          <span>Los precios se convierten automáticamente según la moneda seleccionada</span>
        </div>
      )}

      {quoteId && showEmailModal && (
        <EmailModal quoteId={quoteId} onClose={() => setShowEmailModal(false)} />
      )}

      {saveError && (
        <div className="print:hidden fixed top-20 right-4 z-50 bg-red-50 border border-red-300 text-red-700 text-sm px-4 py-2 rounded-lg shadow-lg max-w-xs">
          {saveError}
        </div>
      )}

      {isForeignQuote && (
        <div className="print:hidden sticky top-12 z-40 bg-amber-500 text-white text-xs font-semibold px-4 py-1.5 text-center">
          {readOnly ? "Viendo" : "Editando"} la cotización de otro usuario
        </div>
      )}

      {/* ── Layout principal ── */}
      <div className="flex flex-1 pt-6 pb-10 gap-0 justify-center print:pt-0 print:block">
        {/* Panel de lista de precios */}
        {showPriceList && !readOnly && (
          <div
            className="print:hidden sticky self-start"
            style={{ top: 96, height: "calc(100vh - 96px)", width: 300, flexShrink: 0 }}
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
              fontFamily: "Arial, Helvetica, sans-serif",
              display: "flex",
              flexDirection: "column",
              pointerEvents: readOnly ? "none" : undefined,
            }}
          >
            {/* ── Encabezado ── */}
            <div className="flex justify-between items-start px-8 pt-8 pb-4 border-b-2 border-[#D95A00]">
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
              <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-bold text-[#D95A00] uppercase tracking-wide whitespace-nowrap">
                  Datos del cliente
                </span>
                <div className="flex-1 h-px bg-[#D95A00]/30" />
              </div>
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
              </div>

              {/* ── Productos / Servicios ── */}
              <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-bold text-[#D95A00] uppercase tracking-wide whitespace-nowrap">
                  Productos / Servicios
                </span>
                <div className="flex-1 h-px bg-[#D95A00]/30" />
              </div>
              <div className="w-full">
                <table
                  className="w-full border-collapse text-sm"
                  style={{ tableLayout: "fixed" }}
                >
                  <colgroup>
                    <col style={{ width: 38 }} />
                    <col style={{ width: 100 }} />
                    <col style={{ width: 46 }} />
                    <col />
                    <col style={{ width: 70 }} />
                    <col style={{ width: 70 }} />
                    <col style={{ width: 60 }} />
                    <col style={{ width: 80 }} />
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
                        "Desc. %",
                        "Subtotal",
                        "",
                      ].map((h, i) => (
                        <th
                          key={i}
                          className="border border-[#b84d00] text-white font-semibold text-[10px] py-1 px-1 text-center"
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
                            className={cell + " text-center text-[11px]"}
                            placeholder="0"
                            value={item.cant}
                            autoComplete="off"
                            spellCheck={false}
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
                            autoComplete="off"
                            spellCheck={false}
                            onChange={(e) =>
                              updateItem(item.id, "sku", e.target.value)
                            }
                          />
                        </td>
                        <td className="border border-gray-300 p-0">
                          <input
                            className={cell + " text-center text-[11px]"}
                            placeholder="PZA"
                            value={item.unidad}
                            autoComplete="off"
                            spellCheck={false}
                            onChange={(e) =>
                              updateItem(item.id, "unidad", e.target.value)
                            }
                          />
                        </td>
                        <td className="border border-gray-300 p-0 align-top">
                          <textarea
                            className={cell + " resize-none leading-snug text-[11px]"}
                            placeholder="Descripción del producto o servicio"
                            value={item.descripcion}
                            rows={3}
                            autoComplete="off"
                            spellCheck={false}
                            style={{ height: "auto", minHeight: 60 }}
                            // Autosize on every render, not just on user
                            // keystrokes: adding a product from the price
                            // list panel sets `descripcion` programmatically
                            // (no native `input` event), so relying on
                            // onInput alone left long descriptions clipped
                            // to the initial 3-row height until the user
                            // clicked into the box and typed something.
                            ref={(el) => {
                              if (!el) return;
                              el.style.height = "auto";
                              el.style.height = el.scrollHeight + "px";
                            }}
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
                            autoComplete="off"
                            spellCheck={false}
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
                            <>
                              {formatMXN(item.extendido)}
                              {item.descuentoMonto > 0 && (
                                <div className="text-red-600 font-normal">
                                  −{formatMXN(item.descuentoMonto)}
                                </div>
                              )}
                            </>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="border border-gray-300 p-0">
                          <input
                            className={
                              cell + " text-center text-[11px] tabular-nums"
                            }
                            placeholder="0"
                            value={item.descuento}
                            autoComplete="off"
                            spellCheck={false}
                            onChange={(e) =>
                              updateItem(item.id, "descuento", e.target.value)
                            }
                          />
                        </td>
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
                    {!readOnly && (
                      <tr className="print:hidden">
                        <td
                          colSpan={9}
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
                    )}
                    <tr>
                      <td
                        colSpan={9}
                        className="border-0 px-2 py-1 text-[10px] text-gray-400 italic"
                      >
                        * P. Extendido = Cant × P. Unitario &nbsp;|&nbsp;
                        Subtotal = Extendido − (Extendido × Desc. %)
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              </div>

              {/* ── Vigencia, moneda y totales ── */}
              <div className="flex gap-3 items-start flex-wrap">
                <div className="flex-1 min-w-[200px] rounded-lg p-3 bg-gray-100">
                  <div className="grid grid-cols-[56px_1fr] gap-y-1.5 items-center text-[10px]">
                    <span className="font-semibold text-gray-500 uppercase tracking-wide">Moneda</span>
                    <select
                      value={monedaCode}
                      onChange={(e) => setMonedaCode(e.target.value as MonedaCode)}
                      className="print:hidden border border-gray-300 rounded-md bg-white px-1.5 py-1 text-[11px] font-semibold text-gray-900 focus:outline-none focus:border-[#D95A00] focus:ring-1 focus:ring-[#D95A00]"
                    >
                      <option value="USD">USD — Dólar americano</option>
                      <option value="MXN">MXN — Peso mexicano</option>

                    </select>
                    <span className="hidden print:inline font-bold text-gray-900">
                      {MONEDA_LABELS[monedaCode]}
                      {monedaCode !== "USD" ? ` · 1 USD = ${tipoCambio} ${monedaCode}` : ""}
                    </span>
                    {monedaCode !== "USD" && (
                      <>
                        <span />
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-gray-500">1 USD =</span>
                          <Editable
                            value={tipoCambio}
                            onChange={setTipoCambio}
                            placeholder="1.0000"
                            className="text-[11px] w-16"
                            bold
                          />
                          <span className="text-gray-500">{monedaCode}</span>
                          {exchangeRate?.live && (
                            <span className="inline-flex items-center gap-1 text-[9px] text-green-700 bg-green-100 rounded-full px-1.5 py-0.5 print:hidden">
                              <span className="w-1 h-1 rounded-full bg-green-500" /> En vivo
                            </span>
                          )}
                        </div>
                      </>
                    )}
                    <span className="font-semibold text-gray-500 uppercase tracking-wide">Vigencia</span>
                    <div className="flex items-center gap-1">
                      <Editable
                        value={vigenciaDias}
                        onChange={setVigenciaDias}
                        placeholder="30"
                        className="w-7 text-[10px]"
                        bold
                      />
                      <span className="font-bold text-gray-900">días naturales</span>
                    </div>
                  </div>
                </div>

                <div className="w-56 rounded-lg overflow-hidden border border-gray-300 shrink-0">
                  <div className="flex justify-between items-center px-2.5 py-1" style={{ backgroundColor: "#D95A00" }}>
                    <span className="text-white text-[10px] font-bold uppercase">Subtotal</span>
                    <span className="text-white text-xs font-bold">{formatMXN(subtotalGlobal)}</span>
                  </div>
                  {ivaActivo ? (
                    <div className="flex justify-between items-center px-2.5 py-1" style={{ backgroundColor: "#D95A00" }}>
                      <span className="text-white text-[10px] font-bold uppercase flex items-center gap-1">
                        IVA
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={ivaPercent}
                          onChange={(e) => setIvaPercent(e.target.value)}
                          className="w-7 text-center bg-white/20 text-white border-0 border-b border-white/60 focus:outline-none rounded-sm text-[10px] font-semibold"
                        />
                        %
                        <button
                          onClick={() => setIvaActivo(false)}
                          className="text-white/80 hover:text-white text-[9px] underline underline-offset-1 transition-colors print:hidden normal-case font-normal"
                        >
                          quitar
                        </button>
                      </span>
                      <span className="text-white text-xs font-bold">{formatMXN(iva)}</span>
                    </div>
                  ) : (
                    !readOnly && (
                      <div className="px-2.5 py-1 text-right border-b border-gray-200 print:hidden">
                        <button
                          onClick={() => setIvaActivo(true)}
                          className="text-[#D95A00] hover:text-[#b84d00] text-[10px] font-semibold tracking-wide uppercase transition-colors"
                        >
                          + Agregar IVA
                        </button>
                      </div>
                    )
                  )}
                  <div
                    className="flex justify-between items-center px-2.5 py-1.5 border-2"
                    style={{ borderColor: "#D95A00", backgroundColor: "#fff7f0" }}
                  >
                    <span className="text-gray-900 text-xs font-bold uppercase">Total</span>
                    <span className="text-[#D95A00] text-sm font-bold">{formatMXN(total)}</span>
                  </div>
                </div>
              </div>

              {/* ── Condiciones ── */}
              <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-bold text-[#D95A00] uppercase tracking-wide whitespace-nowrap">
                  Condiciones comerciales
                </span>
                <div className="flex-1 h-px bg-[#D95A00]/30" />
              </div>
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