import { readFileSync } from "fs";
import path from "path";
import { getQuoteById } from "@/lib/quotes/data";
import { renderQuotePdf } from "@/lib/quotes/pdf/render";

export const runtime = "nodejs"; // react-pdf's layout/font engine needs Node, not Edge

let cachedLogoDataUri: string | null = null;
function getLogoDataUri(): string {
  if (cachedLogoDataUri) return cachedLogoDataUri;
  const bytes = readFileSync(path.join(process.cwd(), "public", "logo.png"));
  cachedLogoDataUri = `data:image/png;base64,${bytes.toString("base64")}`;
  return cachedLogoDataUri;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quote = await getQuoteById(id); // RLS-scoped: null for not-found or not-permitted
  if (!quote) {
    return new Response(JSON.stringify({ error: "Cotización no encontrada" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const buffer = await renderQuotePdf(quote, getLogoDataUri());

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${quote.numero_cotizacion}.pdf"`,
    },
  });
}
