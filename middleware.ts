import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/register",
  "/sitemap.xml",
  "/robots.txt",
]);

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.has(pathname)) return true;

  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/favicon")) return true;
  if (pathname.startsWith("/assets")) return true;

  if (pathname.startsWith("/api/auth")) return true;

  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/api/transcribe") ||
    pathname.startsWith("/api/transcriptions");

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET, // IMPORTANTÍSIMO que exista en Vercel
  });

  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
