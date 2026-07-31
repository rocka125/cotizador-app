import nodemailer from "nodemailer";
import type { QuoteRow } from "@/lib/quotes/serialize";

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: Number(process.env.SMTP_PORT ?? 465) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function buildEmailHtml(quote: QuoteRow, mensaje: string | undefined, pixelUrl: string) {
  const total = Number(quote.total).toLocaleString("es-MX", { minimumFractionDigits: 2 });
  return `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto;">
    <div style="background:#D95A00; padding:20px 24px; border-radius: 8px 8px 0 0;">
      <span style="color:#fff; font-size:12px; font-weight:bold; letter-spacing:1px; text-transform:uppercase;">Cotización</span>
      <h1 style="color:#fff; margin:4px 0 0; font-size:22px;">${quote.numero_cotizacion}</h1>
    </div>
    <div style="border:1px solid #e5e7eb; border-top:0; padding:24px; border-radius:0 0 8px 8px;">
      <p style="color:#111827; font-size:15px;">Estimado(a) <strong>${quote.cliente_atencion ?? ""}</strong>,</p>
      <p style="color:#374151; font-size:14px; line-height:1.5;">
        Adjuntamos la cotización <strong>${quote.numero_cotizacion}</strong> para <strong>${quote.cliente_empresa ?? ""}</strong>,
        por un total de <strong>$${total} ${quote.moneda_code}</strong>.
      </p>
      ${mensaje ? `<p style="color:#374151; font-size:14px; line-height:1.5; background:#fff7ed; border-left:3px solid #D95A00; padding:10px 14px;">${mensaje}</p>` : ""}
      <p style="color:#374151; font-size:14px; line-height:1.5;">
        Encontrarás el PDF adjunto a este correo. Quedamos atentos a cualquier duda.
      </p>
      <p style="color:#6b7280; font-size:12px; margin-top:24px;">${quote.empresa_nombre ?? "Fortress8"}</p>
    </div>
    <img src="${pixelUrl}" width="1" height="1" alt="" style="display:none;" />
  </div>`;
}

export async function sendQuoteEmail(params: {
  quote: QuoteRow;
  to: string;
  cc?: string[];
  mensaje?: string;
  pdfBuffer: Buffer;
  emailToken: string;
}) {
  const transporter = getTransporter();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const pixelUrl = `${baseUrl}/api/track/open?tok=${params.emailToken}`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: params.to,
    cc: params.cc && params.cc.length > 0 ? params.cc : undefined,
    subject: `Cotización ${params.quote.numero_cotizacion} — ${params.quote.empresa_nombre ?? "Fortress8"}`,
    html: buildEmailHtml(params.quote, params.mensaje, pixelUrl),
    attachments: [
      {
        filename: `${params.quote.numero_cotizacion}.pdf`,
        content: params.pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });
}
