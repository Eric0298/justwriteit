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
  <div className="flex min-h-screen items-center justify-center px-4 py-10"></div>
  return <RegisterClient />;
}
