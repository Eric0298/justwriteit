import type { Metadata } from "next";
import LoginClient from "./LoginClient";

export const metadata: Metadata = {
  title: "Login",
  description:"Accede a tu cuenta de JustWriteIt",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return <LoginClient />;
}
