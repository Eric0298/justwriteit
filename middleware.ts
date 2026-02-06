// middleware.ts (EN LA RAÍZ DEL PROYECTO)
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: Request) {
  const url = new URL(req.url);
  const pathname = url.pathname;

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET, 
  });

  const isLoggedIn = !!token;
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");
  const isDashboard = pathname.startsWith("/dashboard");

  // Si NO logueado y quiere entrar al dashboard → login
  if (!isLoggedIn && isDashboard) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
