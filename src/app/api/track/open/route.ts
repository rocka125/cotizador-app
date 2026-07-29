import { createClient as createAnonClient } from "@supabase/supabase-js";

// Public, unauthenticated tracking-pixel endpoint — the recipient's mail
// client has no Supabase session, so this uses the plain anon-key client
// (no cookies) and relies entirely on the record_email_open() SECURITY
// DEFINER function (migrations 0010/0016) for the actual write, which is
// the only thing allowed to touch email_opens/quotes.email_opened_at here.
export const runtime = "nodejs";

// Standard 1x1 transparent GIF — always returned regardless of outcome, so
// a broken/expired token never shows as a broken image in the recipient's
// mail client.
const PIXEL = Buffer.from("R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==", "base64");

// Ported verbatim from the PHP app's API/api_track_open.php
// (detectarProxy()) — mail-client image preloading (Gmail/Outlook/Yahoo
// proxies), social/bot link-preview crawlers, and corporate security
// gateways that pre-fetch images while scanning a message shouldn't count
// as a genuine customer open (though the FIRST hit still counts regardless
// — see record_email_open()'s own comment on why).
const PROXY_UA_PATTERNS = [
  "GoogleImageProxy",
  "YahooMailProxy",
  "Outlook",
  "MailChimp",
  "Sendgrid",
  "AppleMailPrivacyProxy",
  "Twitterbot",
  "facebookexternalhit",
  "LinkedInBot",
  "Slackbot",
  "Baiduspider",
  "msnbot",
  // Corporate email security gateways: these download images while
  // scanning the message, before a human ever opens it. Without this, the
  // automated scan permanently marks the quote as "opened by the client".
  "Mimecast",
  "Proofpoint",
  "Barracuda",
  "IronPort",
  "MessageLabs",
  "ATP Safe Links",
  "SafeLinks",
];

// Known Google/Microsoft/Apple proxy IP ranges (same prefixes as the PHP
// source) — a second signal alongside the UA string, since some proxies
// don't identify themselves clearly in the user-agent.
const PROXY_IP_PREFIXES = ["66.249.", "64.233.", "209.85.", "40.92.", "40.107.", "52.100.", "17.172.", "17.57."];

function isProxyRequest(userAgent: string, ip: string): boolean {
  if (!userAgent.trim()) return true; // PHP: empty(trim($userAgent)) => true
  if (PROXY_UA_PATTERNS.some((pattern) => userAgent.toLowerCase().includes(pattern.toLowerCase()))) return true;
  return PROXY_IP_PREFIXES.some((prefix) => ip.startsWith(prefix));
}

// Mirrors the PHP app's obtenerIp(): prefer a real client IP over the
// immediate connection IP (which on Vercel is the edge/proxy hop), same
// forwarded-header priority (Cloudflare's CF-Connecting-IP first, if present).
function getClientIp(request: Request): string {
  const cf = request.headers.get("cf-connecting-ip");
  if (cf) return cf.trim();
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "0.0.0.0";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("tok");

  if (token) {
    try {
      const supabase = createAnonClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
      const userAgent = (request.headers.get("user-agent") ?? "").slice(0, 500);
      const ip = getClientIp(request);
      const esProxy = isProxyRequest(userAgent, ip);

      const { error } = await supabase.rpc("record_email_open", {
        p_token: token,
        p_ip: ip,
        p_ua: userAgent,
        p_es_proxy: esProxy,
      });
      if (error) console.error("[track/open] record_email_open failed:", error.message);
    } catch (e) {
      // Never let tracking failures surface to the recipient — the pixel
      // always renders regardless. Still log server-side for debugging,
      // same spirit as the PHP app's logs/track_debug.log.
      console.error("[track/open] unexpected error:", e);
    }
  }

  return new Response(new Uint8Array(PIXEL), {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
      Expires: "Thu, 01 Jan 1970 00:00:00 GMT",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
