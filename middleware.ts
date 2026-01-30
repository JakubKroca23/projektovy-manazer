import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Povolit veřejné stránky
  if (pathname === "/prihlaseni" || pathname === "/registrace" || pathname === "/") {
    return NextResponse.next();
  }
  
  // Pro MVP jednoduché přesměrování - v produkci zde bude skutečná auth kontrola
  // Prozatím povolíme všechny chráněné stránky pro demo
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};