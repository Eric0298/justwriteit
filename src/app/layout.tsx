import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";
import { cookies } from "next/headers";
import { THEME_COOKIE, normalizeTheme } from "@/lib/theme";
import type { Theme } from "@/lib/theme";
import Link from "next/link";
import { HeaderThemeToggle } from "@/components/ui/HeaderThemeToggle";
import { auth } from "@/../auth";
import { UserMenu } from "@/components/ui/UserMenu";

const siteName = "JustWriteIt";
const siteDescription = "Transcribe cualquier audio a texto.";
const appUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: { default: siteName, template: "%s · JustWriteIt" },
  description: siteDescription,
  applicationName: siteName,
  alternates: { canonical: "/" },
  icons: {
    icon: [{ url: "/favicon.ico" }, { url: "/icon.png", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png" }],
  },
  openGraph: {
    type: "website", locale: "es_ES", siteName,
    title: siteName, description: siteDescription, url: "/",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "JustWriteIt" }],
  },
  twitter: {
    card: "summary_large_image", title: siteName,
    description: siteDescription, images: ["/og.png"],
  },
  robots: {
    index: true, follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get(THEME_COOKIE)?.value;
  const theme = (normalizeTheme(themeCookie) ?? "light") as Theme;

  const session = await auth();
  const user = session?.user;

  return (
    <html lang="es" className={theme === "dark" ? "dark" : ""} suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        <AppProviders>
          <div className="app-shell">
            <div className="app-bg" aria-hidden="true" />

            {/*
              El header global se oculta en móvil DENTRO del dashboard
              (las rutas /dashboard/* ya tienen su propio header móvil en DashboardShell).
              En desktop siempre se muestra.
              Usamos la clase "dashboard-hide-mobile-header" en el body cuando
              estamos en el dashboard — pero como esto es un layout estático,
              lo más limpio es simplemente ocultar el header en móvil desde CSS
              cuando la URL contiene /dashboard. Como no podemos hacer eso en CSS puro,
              añadimos la clase "global-header" y la ocultamos desde DashboardShell
              mediante un atributo en el html. Ver nota abajo.
            */}
            <header className="app-header" id="global-header">
              <div className="container-app flex h-14 items-center justify-between">
                <Link href="/" className="app-brand" aria-label="JustWriteIt Home">
                  <span className="brand-dot" aria-hidden="true" />
                  <span className="font-semibold tracking-tight">JustWriteIt</span>
                </Link>

                {/* Desktop nav */}
                <nav className="hidden items-center gap-2 md:flex" aria-label="Navegación principal">
                  <Link className="nav-pill" href="/">Landing</Link>
                  <Link className="nav-pill" href="/dashboard">Dashboard</Link>
                  <span className="mx-1 h-4 w-px bg-[rgb(var(--border))]" aria-hidden="true" />

                  {user ? (
                    /* Usuario logueado: avatar + menú con cerrar sesión */
                    <UserMenu name={user.name ?? "Usuario"} email={user.email ?? ""} />
                  ) : (
                    /* No logueado: Login + Crear cuenta */
                    <>
                      <Link className="nav-pill" href="/login">Login</Link>
                      <Link className="nav-pill nav-pill-primary" href="/register">Crear cuenta</Link>
                    </>
                  )}

                  <span className="mx-1 h-4 w-px bg-[rgb(var(--border))]" aria-hidden="true" />
                  <HeaderThemeToggle initialTheme={theme} />
                </nav>

                {/* Mobile nav — solo visible fuera del dashboard */}
                <nav className="flex items-center gap-2 md:hidden global-header-mobile-nav" aria-label="Navegación móvil">
                  <HeaderThemeToggle initialTheme={theme} />
                  {user ? (
                    <UserMenu name={user.name ?? "Usuario"} email={user.email ?? ""} />
                  ) : (
                    <>
                      <Link className="nav-pill" href="/dashboard">Dashboard</Link>
                      <Link className="nav-pill nav-pill-primary" href="/login">Login</Link>
                    </>
                  )}
                </nav>
              </div>
            </header>

            <div className="relative">{children}</div>

            <footer className="app-footer">
              <div className="container-app py-8 text-xs text-muted flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p>© {new Date().getFullYear()} JustWriteIt · Ice UI</p>
                <div className="flex gap-3">
                  <Link className="footer-link" href="/">Home</Link>
                  <Link className="footer-link" href="/dashboard">Dashboard</Link>
                  {!user && <Link className="footer-link" href="/login">Login</Link>}
                </div>
              </div>
            </footer>
          </div>
        </AppProviders>
      </body>
    </html>
  );
}