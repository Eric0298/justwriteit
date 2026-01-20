// src/app/dashboard/layout.tsx
import type { Metadata } from "next";
import { DashboardShell } from "@/components/layout/DashboardShell";

export const metadata: Metadata = {
  title: "Dashboard · JustWriteIt",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Este layout se mantiene entre /dashboard/* (persistente).
  return <DashboardShell>{children}</DashboardShell>;
}
