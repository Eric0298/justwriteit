// // middleware.ts
// import { auth } from "@/../auth";
// import { NextResponse } from "next/server";

// export default auth((req) => {
//   const { pathname } = req.nextUrl;
//   const isLoggedIn = !!req.auth;

//   const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");
//   const isDashboard = pathname.startsWith("/dashboard");

//   // No logueado intentando dashboard -> login
//   if (!isLoggedIn && isDashboard) {
//     const url = req.nextUrl.clone();
//     url.pathname = "/login";
//     url.searchParams.set("next", pathname);
//     return NextResponse.redirect(url);
//   }

//   // Logueado intentando login/register -> dashboard
//   if (isLoggedIn && isAuthPage) {
//     const url = req.nextUrl.clone();
//     url.pathname = "/dashboard";
//     url.searchParams.delete("next");
//     return NextResponse.redirect(url);
//   }

//   return NextResponse.next();
// });

// export const config = {
//   matcher: ["/dashboard/:path*", "/login", "/register"],
// };
