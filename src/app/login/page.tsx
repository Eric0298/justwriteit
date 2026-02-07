import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/../auth";
import LoginClient from "./LoginClient";

export const metadata: Metadata = {
  title: "Login",
  description: "Accede a tu cuenta de JustWriteIt.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/login" },
};

export default async function LoginPage() {
  const session = await auth();
  if (session?.user?.id) redirect("/dashboard");

  return <LoginClient />;
}
