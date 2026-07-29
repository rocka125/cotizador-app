import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";
import { QuotePdfDocument } from "./QuotePdfDocument";
import type { QuoteRow } from "../serialize";

// Single shared entry point — both the download route and the (future)
// email-attachment route call this, so they can never produce different
// PDFs for the same quote.
//
// The cast below is purely a TS typing accommodation: @react-pdf/renderer's
// renderToBuffer() wants a ReactElement<DocumentProps> specifically, but
// QuotePdfDocument is a regular function component that renders a
// <Document> internally — a common, valid react-pdf pattern that its own
// types are just stricter about than necessary.
export async function renderQuotePdf(quote: QuoteRow, logoSrc?: string): Promise<Buffer> {
  const element = createElement(QuotePdfDocument, { quote, logoSrc }) as unknown as ReactElement<DocumentProps>;
  return renderToBuffer(element);
}
