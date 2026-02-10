import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

function secretBytes() {
  const s = process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("Missing NEXTAUTH_SECRET");
  return new TextEncoder().encode(s);
}

function readAuthToken(req: NextRequest): string | null {
  return (
    req.cookies.get("__Secure-authjs.session-token")?.value ??
    req.cookies.get("authjs.session-token")?.value ??
    req.cookies.get("__Secure-next-auth.session-token")?.value ??
    req.cookies.get("next-auth.session-token")?.value ??
    null
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");
  const isDashboard = pathname.startsWith("/dashboard");

  if (!isAuthPage && !isDashboard) return NextResponse.next();

  const token = readAuthToken(req);

  if (!token) {
    if (isDashboard) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  try {
    await jwtVerify(token, secretBytes());
  } catch {
    if (isDashboard) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (isAuthPage) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.searchParams.delete("next");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
