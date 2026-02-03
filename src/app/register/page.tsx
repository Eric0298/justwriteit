// src/app/register/page.tsx
import type { Metadata } from "next";
import RegisterClient from "./RegisterClient";

export const metadata: Metadata = {
  title: "Registro",
  description: "Crea tu cuenta en JustWriteIt.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/register" },
  openGraph: {
    title: "Registro · JustWriteIt",
    description: "Crea tu cuenta en JustWriteIt.",
    url: "/register",
  },
  twitter: {
    title: "Registro · JustWriteIt",
    description: "Crea tu cuenta en JustWriteIt.",
  },
};

export default function RegisterPage() {
  return <RegisterClient />;
}
