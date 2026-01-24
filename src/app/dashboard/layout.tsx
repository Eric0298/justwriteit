// src/app/dashboard/layout.tsx
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { THEME_COOKIE, normalizeTheme, type Theme } from "@/lib/theme";

export const metadata: Metadata = {
  title: "Dashboard · JustWriteIt",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get(THEME_COOKIE)?.value;
  const theme = (normalizeTheme(themeCookie) ?? "light") as Theme;

  return <DashboardShell initialTheme={theme}>{children}</DashboardShell>;
}
