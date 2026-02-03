import type { Metadata } from "next";
import LoginClient from "./LoginClient";

export const metadata: Metadata = {
  title: "Login",
  description: "Accede a tu cuenta de JustWriteIt.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/login" },
  openGraph: {
    title: "Login · JustWriteIt",
    description: "Accede a tu cuenta de JustWriteIt.",
    url: "/login",
  },
  twitter: {
    title: "Login · JustWriteIt",
    description: "Accede a tu cuenta de JustWriteIt.",
  },
};

export default function LoginPage() {
  return <LoginClient />;
}
