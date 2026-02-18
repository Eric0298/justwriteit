import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/../auth";
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

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user?.id) redirect("/dashboard");

  return (
    <main className="auth-shell">
      <div className="container-app w-full py-10 flex justify-center">
        <RegisterClient />
      </div>
    </main>
  );
}
