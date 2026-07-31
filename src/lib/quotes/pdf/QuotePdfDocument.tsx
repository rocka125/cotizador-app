// A parallel component tree to the on-screen A4 sheet in CotizacionForm --
// @react-pdf/renderer has its own primitives (Document/Page/View/Text), not
// real DOM/Tailwind, so this can't just reuse that JSX. It consumes the same
// computeTotals() output so the PDF can never disagree with what's on
// screen or what's saved. Section layout (titles, moneda/vigencia + totals
// side-by-side, 2-column condiciones grid) mirrors CotizacionForm's on-screen
// sheet so the downloaded PDF looks the same as the browser-print preview
// used for an unsaved quote, rather than the older, plainer layout this file
// used to have.
import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import type { QuoteRow } from "../serialize";
import { itemsFromDb } from "../serialize";
import { computeTotals, formatMXN } from "../totals";
import { MONEDA_LABELS } from "../types";

const ORANGE = "#D95A00";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: "Helvetica", color: "#111827" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 2, borderBottomColor: ORANGE, paddingBottom: 12, marginBottom: 16 },
  logo: { width: 160, height: 68, objectFit: "contain" },
  cotLabel: { fontSize: 8, fontWeight: 700, color: ORANGE, textTransform: "uppercase", letterSpacing: 1, marginTop: 6 },
  cotNumero: { fontSize: 13, fontWeight: 700 },
  cotFecha: { fontSize: 8, color: "#6b7280" },
  empresaBlock: { alignItems: "flex-end" },
  empresaNombre: { fontSize: 9, fontWeight: 700 },
  empresaLinea: { fontSize: 8, color: "#4b5563" },

  sectionRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  sectionTitle: { fontSize: 9, fontWeight: 700, color: ORANGE, textTransform: "uppercase", letterSpacing: 0.5, marginRight: 8 },
  sectionLine: { flex: 1, height: 1, backgroundColor: "#f0d0b0" },
  section: { marginBottom: 14 },

  clienteBox: { borderWidth: 1, borderColor: "#d1d5db" },
  clienteRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#d1d5db" },
  clienteLabel: { width: 90, backgroundColor: "#f5f5f5", padding: 4, fontSize: 8, fontWeight: 700, textTransform: "uppercase" },
  clienteValue: { flex: 1, padding: 4, fontSize: 9 },

  table: { borderWidth: 1, borderColor: "#d1d5db" },
  tHeadRow: { flexDirection: "row", backgroundColor: ORANGE },
  th: { color: "#fff", fontSize: 7, fontWeight: 700, padding: 4, textAlign: "center", borderRightWidth: 1, borderRightColor: "#b84d00" },
  tRow: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#e5e7eb" },
  td: { padding: 4, fontSize: 8, borderRightWidth: 1, borderRightColor: "#e5e7eb" },
  footnote: { fontSize: 7, color: "#9ca3af", fontStyle: "italic", marginTop: 4 },

  monedaVigenciaRow: { flexDirection: "row", marginTop: 12, marginBottom: 14 },
  monedaBox: { flex: 1, borderRadius: 6, padding: 10, backgroundColor: "#f3f4f6" },
  monedaLine: { flexDirection: "row", marginBottom: 3 },
  monedaLabel: { width: 55, fontSize: 8, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" },
  monedaValue: { fontSize: 8, fontWeight: 700, color: "#111827" },
  totalsBox: { width: 170, marginLeft: 12, borderRadius: 6, borderWidth: 1, borderColor: "#d1d5db", overflow: "hidden" },
  totalsBoxRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 10, paddingVertical: 5, backgroundColor: ORANGE },
  totalsBoxLabel: { color: "#fff", fontSize: 8, fontWeight: 700, textTransform: "uppercase" },
  totalsBoxValue: { color: "#fff", fontSize: 9, fontWeight: 700 },
  totalFinalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 10, paddingVertical: 5, backgroundColor: "#fff7f0", borderTopWidth: 2, borderTopColor: ORANGE },
  totalFinalLabel: { color: "#111827", fontSize: 8, fontWeight: 700, textTransform: "uppercase" },
  totalFinalValue: { color: ORANGE, fontSize: 9, fontWeight: 700 },

  condGrid: { flexDirection: "row", flexWrap: "wrap" },
  condItem: { width: "50%", flexDirection: "row", marginBottom: 6, paddingRight: 10 },
  condLabel: { fontSize: 8, fontWeight: 700, color: "#374151", width: 110 },
  condValue: { fontSize: 8, color: "#111827", flex: 1 },

  signatureImg: { width: 160, height: 50, objectFit: "contain" },
  selloImg: { width: 100, height: 70, objectFit: "contain" },
});

const COL_WIDTHS = { cant: "6%", sku: "13%", unidad: "6%", desc: "31%", precio: "11%", ext: "11%", desc2: "10%", subtotal: "12%" };

// react-pdf's text-wrapper only ever splits on literal spaces (see
// wrapWords() in @react-pdf/textkit) -- a hyphenated SKU with no spaces is
// treated as one unbreakable word and overflows its column into the next
// cell instead of wrapping. A soft hyphen doesn't work around this: its
// line-breaker always draws its own "-" glyph at ANY hyphenation break
// (see getNodes()'s unconditional `hyphenated` flag), which duplicates the
// SKU's own literal "-" right next to it. A real space after each "-" is
// the only break point that doesn't draw an extra character -- only applied
// to SKUs actually long enough to need it, so short ones render unchanged.
function breakableSku(sku: string): string {
  return sku.length > 14 ? sku.replace(/-/g, "- ") : sku;
}

function SectionTitle({ children }: { children: string }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{children}</Text>
      <View style={styles.sectionLine} />
    </View>
  );
}

export function QuotePdfDocument({ quote, logoSrc }: { quote: QuoteRow; logoSrc?: string }) {
  const items = itemsFromDb(quote.items);
  const { rows, subtotalGlobal, iva, total } = computeTotals(
    items,
    quote.aplica_iva,
    quote.iva_porcentaje ?? "16"
  );
  const fecha = new Date(quote.created_at).toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <Document title={quote.numero_cotizacion}>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            {logoSrc && <Image src={logoSrc} style={styles.logo} />}
            <Text style={styles.cotLabel}>Cotización</Text>
            <Text style={styles.cotNumero}>{quote.numero_cotizacion}</Text>
            <Text style={styles.cotFecha}>{fecha}</Text>
          </View>
          <View style={styles.empresaBlock}>
            <Text style={styles.empresaNombre}>{quote.empresa_nombre}</Text>
            <Text style={styles.empresaLinea}>{quote.empresa_rfc}</Text>
            <Text style={styles.empresaLinea}>{quote.empresa_direccion}</Text>
            <Text style={styles.empresaLinea}>{quote.empresa_web}</Text>
            <Text style={styles.empresaLinea}>{quote.empresa_email}</Text>
            <Text style={styles.empresaLinea}>
              O: {quote.empresa_tel_oficina} | M: {quote.empresa_tel_movil}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <SectionTitle>Datos del cliente</SectionTitle>
          <View style={styles.clienteBox}>
            <View style={styles.clienteRow}>
              <Text style={styles.clienteLabel}>Atención</Text>
              <Text style={styles.clienteValue}>{quote.cliente_atencion}</Text>
            </View>
            <View style={styles.clienteRow}>
              <Text style={styles.clienteLabel}>Puesto</Text>
              <Text style={styles.clienteValue}>{quote.cliente_puesto}</Text>
            </View>
            <View style={{ flexDirection: "row" }}>
              <Text style={styles.clienteLabel}>Empresa</Text>
              <Text style={styles.clienteValue}>{quote.cliente_empresa}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <SectionTitle>Productos / Servicios</SectionTitle>
          <View style={styles.table}>
            <View style={styles.tHeadRow}>
              <Text style={[styles.th, { width: COL_WIDTHS.cant }]}>Cant.</Text>
              <Text style={[styles.th, { width: COL_WIDTHS.sku }]}>SKU</Text>
              <Text style={[styles.th, { width: COL_WIDTHS.unidad }]}>Unidad</Text>
              <Text style={[styles.th, { width: COL_WIDTHS.desc }]}>Descripción</Text>
              <Text style={[styles.th, { width: COL_WIDTHS.precio }]}>P. Unitario</Text>
              <Text style={[styles.th, { width: COL_WIDTHS.ext }]}>P. Extendido</Text>
              <Text style={[styles.th, { width: COL_WIDTHS.desc2 }]}>Desc. %</Text>
              <Text style={[styles.th, { width: COL_WIDTHS.subtotal, borderRightWidth: 0 }]}>Subtotal</Text>
            </View>
            {rows.map((r, i) => (
              <View key={i} style={styles.tRow}>
                <Text style={[styles.td, { width: COL_WIDTHS.cant, textAlign: "center" }]}>{r.cant}</Text>
                <Text style={[styles.td, { width: COL_WIDTHS.sku }]}>{breakableSku(r.sku)}</Text>
                <Text style={[styles.td, { width: COL_WIDTHS.unidad, textAlign: "center" }]}>{r.unidad}</Text>
                <Text style={[styles.td, { width: COL_WIDTHS.desc }]}>{r.descripcion}</Text>
                <Text style={[styles.td, { width: COL_WIDTHS.precio, textAlign: "right" }]}>{formatMXN(Number(r.precioUnitario) || 0)}</Text>
                <Text style={[styles.td, { width: COL_WIDTHS.ext, textAlign: "right" }]}>{formatMXN(r.extendido)}</Text>
                <Text style={[styles.td, { width: COL_WIDTHS.desc2, textAlign: "center" }]}>{r.descuento || "0"}</Text>
                <View style={[styles.td, { width: COL_WIDTHS.subtotal, alignItems: "flex-end", borderRightWidth: 0 }]}>
                  <Text style={{ textAlign: "right" }}>{formatMXN(r.subtotal)}</Text>
                  {r.descuentoMonto > 0 && (
                    <Text style={{ textAlign: "right", color: "#dc2626", fontSize: 7 }}>
                      −{formatMXN(r.descuentoMonto)}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
          <Text style={styles.footnote}>
            * P. Extendido = Cant × P. Unitario | Subtotal = Extendido − (Extendido × Desc. %)
          </Text>
        </View>

        <View style={styles.monedaVigenciaRow}>
          <View style={styles.monedaBox}>
            <View style={styles.monedaLine}>
              <Text style={styles.monedaLabel}>Moneda</Text>
              <Text style={styles.monedaValue}>{MONEDA_LABELS[quote.moneda_code]}</Text>
            </View>
            <View style={styles.monedaLine}>
              <Text style={styles.monedaLabel}>Vigencia</Text>
              <Text style={styles.monedaValue}>{quote.vigencia_dias ?? 30} días naturales</Text>
            </View>
          </View>

          <View style={styles.totalsBox}>
            <View style={styles.totalsBoxRow}>
              <Text style={styles.totalsBoxLabel}>Subtotal</Text>
              <Text style={styles.totalsBoxValue}>{formatMXN(subtotalGlobal)}</Text>
            </View>
            {quote.aplica_iva && (
              <View style={styles.totalsBoxRow}>
                <Text style={styles.totalsBoxLabel}>IVA {quote.iva_porcentaje}%</Text>
                <Text style={styles.totalsBoxValue}>{formatMXN(iva)}</Text>
              </View>
            )}
            <View style={styles.totalFinalRow}>
              <Text style={styles.totalFinalLabel}>Total</Text>
              <Text style={styles.totalFinalValue}>{formatMXN(total)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <SectionTitle>Condiciones comerciales</SectionTitle>
          <View style={styles.condGrid}>
            {[
              ["Tiempo de Entrega", quote.tiempo_entrega],
              ["Vigencia de servicios", quote.vigencia_servicios],
              ["Condiciones de pago", quote.condiciones_pago],
              ["Lugar de entrega", quote.lugar_entrega],
            ].map(([label, value]) => (
              <View key={label} style={styles.condItem}>
                <Text style={styles.condLabel}>{label}:</Text>
                <Text style={styles.condValue}>{value || "—"}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
          <View>
            {quote.firma_img && <Image src={quote.firma_img} style={styles.signatureImg} />}
            <Text style={{ fontSize: 9, fontWeight: 700, marginTop: 4 }}>{quote.firma_nombre}</Text>
            <Text style={{ fontSize: 8, color: "#374151" }}>{quote.firma_puesto}</Text>
            <Text style={{ fontSize: 8, color: "#374151" }}>{quote.firma_tel}</Text>
          </View>
          {quote.sello_img && <Image src={quote.sello_img} style={styles.selloImg} />}
        </View>
      </Page>
    </Document>
  );
}
