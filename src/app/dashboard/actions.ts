"use server";

import { cookies } from "next/headers";
import { THEME_COOKIE, normalizeTheme, type Theme } from "@/lib/theme";

export async function setThemeAction(nextTheme: Theme) {
  const theme = normalizeTheme(nextTheme) ?? "light";

  const cookieStore = await cookies();

  cookieStore.set(THEME_COOKIE, theme, {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365, // 1 año
  });
}
