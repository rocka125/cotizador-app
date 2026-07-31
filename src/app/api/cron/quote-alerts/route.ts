import { createClient as createAnonClient } from "@supabase/supabase-js";

// Vercel Cron target (see vercel.json) -- no user session exists in a
// scheduled job, so this uses the plain anon-key client and relies on
// check_quote_alerts() (migration 0018), a SECURITY DEFINER function, to do
// the actual writes across every user's quotes. Same trust model as the
// public tracking-pixel route.
export const runtime = "nodejs";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createAnonClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { error } = await supabase.rpc("check_quote_alerts");
  if (error) {
    console.error("[cron/quote-alerts] check_quote_alerts failed:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
