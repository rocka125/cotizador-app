import { NextResponse } from "next/server";

// Live USD -> MXN/EUR rate, mirroring the PHP app's api_tipo_cambio.php.
// Falls back to hardcoded approximate rates if the upstream call fails, so
// the currency selector never blocks on a flaky external API.
const FALLBACK = { USD: 1, MXN: 18.5, EUR: 0.92 };

export async function GET() {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`upstream ${res.status}`);
    const data = await res.json();
    const rates = data?.rates;
    if (!rates?.MXN || !rates?.EUR) throw new Error("missing rates");
    return NextResponse.json({ USD: 1, MXN: rates.MXN, EUR: rates.EUR, live: true });
  } catch {
    return NextResponse.json({ ...FALLBACK, live: false });
  }
}
