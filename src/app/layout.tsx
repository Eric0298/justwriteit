import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";
import { cookies } from "next/headers";
import { THEME_COOKIE, normalizeTheme } from "@/lib/theme";
import Link from "next/link";

const siteName = "JustWriteIt";
const siteDescription = "Transcribe cualquier audio a texto.";
const appUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),

  title: {
    default: siteName,
    template: "%s · JustWriteIt",
  },

  description: siteDescription,
  applicationName: siteName,

  alternates: {
    canonical: "/",
  },

  icons: {
    icon: [{ url: "/favicon.ico" }, { url: "/icon.png", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png" }],
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
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "JustWriteIt — Transcribe audio a texto",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: siteDescription,
    images: ["/og.png"],
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
  const theme = normalizeTheme(themeCookie) ?? "light";

  return (
    <html
      lang="es"
      className={theme === "dark" ? "dark" : ""}
      suppressHydrationWarning
    >
      <body className="min-h-dvh antialiased">
        <AppProviders>
          <div className="app-shell">
            {/* Background blobs */}
            <div className="app-bg" aria-hidden="true" />

            {/* Global Header */}
            <header className="app-header">
              <div className="container-app flex h-14 items-center justify-between">
                <Link href="/" className="app-brand" aria-label="JustWriteIt Home">
                  <span className="brand-dot" aria-hidden="true" />
                  <span className="font-semibold tracking-tight">JustWriteIt</span>
                </Link>

                <nav className="hidden items-center gap-2 md:flex" aria-label="Navegación principal">
                  <Link className="nav-pill" href="/">
                    Landing
                  </Link>
                  <Link className="nav-pill" href="/dashboard">
                    Dashboard
                  </Link>
                  <span className="mx-1 h-4 w-px bg-[rgb(var(--border))]" aria-hidden="true" />
                  <Link className="nav-pill" href="/login">
                    Login
                  </Link>
                  <Link className="nav-pill nav-pill-primary" href="/register">
                    Crear cuenta
                  </Link>
                </nav>

                {/* Mobile nav */}
                <nav className="flex items-center gap-2 md:hidden" aria-label="Navegación móvil">
                  <Link className="nav-pill" href="/dashboard">
                    Dashboard
                  </Link>
                  <Link className="nav-pill nav-pill-primary" href="/login">
                    Login
                  </Link>
                </nav>
              </div>
            </header>

            {/* Page content */}
            <div className="relative">{children}</div>

            {/* Footer */}
            <footer className="app-footer">
              <div className="container-app py-8 text-xs text-muted flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p>© {new Date().getFullYear()} JustWriteIt · Ice UI</p>
                <div className="flex gap-3">
                  <Link className="footer-link" href="/">
                    Home
                  </Link>
                  <Link className="footer-link" href="/dashboard">
                    Dashboard
                  </Link>
                  <Link className="footer-link" href="/login">
                    Login
                  </Link>
                </div>
              </div>
            </footer>
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
