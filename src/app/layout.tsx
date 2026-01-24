import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";
import { cookies } from "next/headers";
import { THEME_COOKIE, normalizeTheme } from "@/lib/theme";

export const metadata: Metadata = {
  title: {
    default: "JustWriteIt",
    template: "%s · JustWriteIt",
  },
  description: "Transcribe cualquier audio a texto.",
  applicationName: "JustWriteIt",
  metadataBase: new URL("http://localhost:3000"),
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get(THEME_COOKIE)?.value;
  const theme = normalizeTheme(themeCookie) ?? "light";

  return (
    <html lang="es" className={theme === "dark" ? "dark" : ""} suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
