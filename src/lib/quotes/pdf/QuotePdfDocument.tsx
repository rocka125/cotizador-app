// A parallel component tree to the on-screen A4 sheet in CotizacionForm --
// @react-pdf/renderer has its own primitives (Document/Page/View/Text), not
// real DOM/Tailwind, so this can't just reuse that JSX. It consumes the same
// computeTotals() output so the PDF can never disagree with what's on
// screen or what's saved.
import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import type { QuoteRow } from "../serialize";
import { itemsFromDb } from "../serialize";
import { computeTotals, formatMXN } from "../totals";

const ORANGE = "#D95A00";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: "Helvetica", color: "#111827" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "#e5e7eb", paddingBottom: 12, marginBottom: 16 },
  logo: { width: 110, height: 50, objectFit: "contain" },
  cotLabel: { fontSize: 8, fontWeight: 700, color: ORANGE, textTransform: "uppercase", letterSpacing: 1, marginTop: 6 },
  cotNumero: { fontSize: 13, fontWeight: 700 },
  cotFecha: { fontSize: 8, color: "#6b7280" },
  empresaBlock: { alignItems: "flex-end" },
  empresaNombre: { fontSize: 9, fontWeight: 700 },
  empresaLinea: { fontSize: 8, color: "#4b5563" },
  clienteBox: { borderWidth: 1, borderColor: "#d1d5db", marginBottom: 14 },
  clienteRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#d1d5db" },
  clienteLabel: { width: 90, backgroundColor: "#f5f5f5", padding: 4, fontSize: 8, fontWeight: 700, textTransform: "uppercase" },
  clienteValue: { flex: 1, padding: 4, fontSize: 9 },
  table: { borderWidth: 1, borderColor: "#d1d5db" },
  tHeadRow: { flexDirection: "row", backgroundColor: ORANGE },
  th: { color: "#fff", fontSize: 7, fontWeight: 700, padding: 4, textAlign: "center", borderRightWidth: 1, borderRightColor: "#b84d00" },
  tRow: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#e5e7eb" },
  td: { padding: 4, fontSize: 8, borderRightWidth: 1, borderRightColor: "#e5e7eb" },
  totalsRow: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#e5e7eb" },
  totalsLabel: { backgroundColor: ORANGE, color: "#fff", padding: 5, fontSize: 9, fontWeight: 700, textAlign: "right" },
  totalsValue: { padding: 5, fontSize: 9, fontWeight: 700, textAlign: "right" },
  condRow: { flexDirection: "row", marginBottom: 3 },
  condLabel: { width: 140, fontSize: 9, fontWeight: 700 },
  condValue: { flex: 1, fontSize: 9 },
  footer: { flexDirection: "row", justifyContent: "space-between", marginTop: 20, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#e5e7eb" },
  footerText: { fontSize: 7, color: "#6b7280" },
  signatureImg: { width: 160, height: 50, objectFit: "contain" },
  selloImg: { width: 100, height: 70, objectFit: "contain" },
});

const COL_WIDTHS = { cant: "6%", sku: "10%", unidad: "6%", desc: "34%", precio: "11%", ext: "11%", desc2: "10%", subtotal: "12%" };

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

        <View style={styles.table}>
          <View style={styles.tHeadRow}>
            <Text style={[styles.th, { width: COL_WIDTHS.cant }]}>Cant.</Text>
            <Text style={[styles.th, { width: COL_WIDTHS.sku }]}>SKU</Text>
            <Text style={[styles.th, { width: COL_WIDTHS.unidad }]}>Unidad</Text>
            <Text style={[styles.th, { width: COL_WIDTHS.desc }]}>Descripción</Text>
            <Text style={[styles.th, { width: COL_WIDTHS.precio }]}>P. Unitario</Text>
            <Text style={[styles.th, { width: COL_WIDTHS.ext }]}>P. Extendido</Text>
            <Text style={[styles.th, { width: COL_WIDTHS.desc2 }]}>Descuento</Text>
            <Text style={[styles.th, { width: COL_WIDTHS.subtotal, borderRightWidth: 0 }]}>Subtotal</Text>
          </View>
          {rows.map((r, i) => (
            <View key={i} style={styles.tRow}>
              <Text style={[styles.td, { width: COL_WIDTHS.cant, textAlign: "center" }]}>{r.cant}</Text>
              <Text style={[styles.td, { width: COL_WIDTHS.sku }]}>{r.sku}</Text>
              <Text style={[styles.td, { width: COL_WIDTHS.unidad, textAlign: "center" }]}>{r.unidad}</Text>
              <Text style={[styles.td, { width: COL_WIDTHS.desc }]}>{r.descripcion}</Text>
              <Text style={[styles.td, { width: COL_WIDTHS.precio, textAlign: "right" }]}>{formatMXN(Number(r.precioUnitario) || 0)}</Text>
              <Text style={[styles.td, { width: COL_WIDTHS.ext, textAlign: "right" }]}>{formatMXN(r.extendido)}</Text>
              <Text style={[styles.td, { width: COL_WIDTHS.desc2, textAlign: "right" }]}>{formatMXN(Number(r.descuento) || 0)}</Text>
              <Text style={[styles.td, { width: COL_WIDTHS.subtotal, textAlign: "right", borderRightWidth: 0 }]}>{formatMXN(r.subtotal)}</Text>
            </View>
          ))}
          <View style={styles.totalsRow}>
            <Text style={{ flex: 1 }} />
            <Text style={[styles.totalsLabel, { width: "12%" }]}>Subtotal</Text>
            <Text style={[styles.totalsValue, { width: "12%" }]}>{formatMXN(subtotalGlobal)}</Text>
          </View>
          {quote.aplica_iva && (
            <View style={styles.totalsRow}>
              <Text style={{ flex: 1 }} />
              <Text style={[styles.totalsLabel, { width: "12%" }]}>IVA ({quote.iva_porcentaje}%)</Text>
              <Text style={[styles.totalsValue, { width: "12%" }]}>{formatMXN(iva)}</Text>
            </View>
          )}
          <View style={styles.totalsRow}>
            <Text style={{ flex: 1 }} />
            <Text style={[styles.totalsLabel, { width: "12%" }]}>TOTAL</Text>
            <Text style={[styles.totalsValue, { width: "12%" }]}>{formatMXN(total)}</Text>
          </View>
        </View>

        <View style={{ marginTop: 12, marginBottom: 12 }}>
          <Text style={{ fontSize: 8, color: "#4b5563" }}>
            Vigencia de esta cotización {quote.vigencia_dias ?? 30} días naturales · Precios expresados en{" "}
            {quote.moneda_code}
            {quote.moneda_code !== "USD" ? ` (tipo de cambio ${quote.tipo_cambio})` : ""}
          </Text>
        </View>

        <View style={{ marginBottom: 16 }}>
          {[
            ["Tiempo de Entrega", quote.tiempo_entrega],
            ["Vigencia de servicios", quote.vigencia_servicios],
            ["Condiciones de pago", quote.condiciones_pago],
            ["Lugar de entrega", quote.lugar_entrega],
          ].map(([label, value]) => (
            <View key={label} style={styles.condRow}>
              <Text style={styles.condLabel}>{label}:</Text>
              <Text style={styles.condValue}>{value || "—"}</Text>
            </View>
          ))}
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

        <View style={styles.footer}>
          <View>
            <Text style={styles.footerText}>{quote.empresa_nombre}</Text>
            <Text style={styles.footerText}>{quote.empresa_rfc}</Text>
            <Text style={styles.footerText}>{quote.empresa_direccion}</Text>
          </View>
          <View>
            <Text style={styles.footerText}>{quote.empresa_web}</Text>
            <Text style={styles.footerText}>{quote.empresa_email}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
