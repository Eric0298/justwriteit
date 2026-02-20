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
const siteDescription =
  "Transcribe cualquier audio a texto con IA. Sube archivos mp3, wav o graba en vivo. Rápido, simple y con historial incluido.";
const appUrl =
  process.env.APP_BASE_URL ??
  process.env.APP_URL ??
  "https://justwriteit.app";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: { default: siteName, template: "%s · JustWriteIt" },
  description: siteDescription,
  applicationName: siteName,
  alternates: { canonical: "/" },
  icons: {
    icon: "/branding/favicon.svg",
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName,
    title: siteName,
    description: siteDescription,
    url: "/",
    images: [
      {
        url: "https://justwriteit.app/og.png",
        width: 1200,
        height: 630,
        alt: "JustWriteIt",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: siteDescription,
    images: ["https://justwriteit.app/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
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

            <header className="app-header" id="global-header">
              <div className="container-app flex h-14 items-center justify-between">
                <Link
                  href="/"
                  className="app-brand text-black dark:text-white"
                  aria-label="JustWriteIt Home"
                >
                  <img
                    src="/branding/logo-justwriteit.svg"
                    alt="JustWriteIt"
                    className="h-7 w-auto"
                  />
                </Link>

                {/* Desktop nav */}
                <nav className="hidden items-center gap-2 md:flex" aria-label="Navegación principal">
                  <Link className="nav-pill" href="/">Inicio</Link>
                  <Link className="nav-pill" href="/dashboard">Dashboard</Link>
                  <span className="mx-1 h-4 w-px bg-[rgb(var(--border))]" aria-hidden="true" />

                  {user ? (
                    <UserMenu name={user.name ?? "Usuario"} email={user.email ?? ""} />
                  ) : (
                    <>
                      <Link className="nav-pill" href="/login">Login</Link>
                      <Link className="nav-pill nav-pill-primary" href="/register">Crear cuenta</Link>
                    </>
                  )}

                  <span className="mx-1 h-4 w-px bg-[rgb(var(--border))]" aria-hidden="true" />
                  <HeaderThemeToggle initialTheme={theme} />
                </nav>

                {/* Mobile nav */}
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
                <p>© {new Date().getFullYear()} JustWriteIt</p>
                <div className="flex gap-3">
                  <Link className="footer-link" href="/">Inicio</Link>
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