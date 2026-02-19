"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { THEME_COOKIE, normalizeTheme, type Theme } from "@/lib/theme";
import { signOut } from "@/../auth";

export async function setThemeAction(nextTheme: Theme) {
  const theme = normalizeTheme(nextTheme) ?? "light";
  const cookieStore = await cookies();
  cookieStore.set(THEME_COOKIE, theme, {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function signOutAction() {
  await signOut({ redirect: false });
  redirect("/");
}