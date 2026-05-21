import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rutas públicas — dejar pasar sin verificar
  if (pathname.startsWith("/login") || pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    const response = NextResponse.next();
    
    // Agregar headers CORS para desarrollo local
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  }

  const accessToken = req.cookies.get("sb-access-token");

  if (!accessToken) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};