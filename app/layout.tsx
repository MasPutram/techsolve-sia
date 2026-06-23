// =============================================================
//  app/layout.tsx
//  Layout root: sidebar tetap di kiri + area konten di kanan.
// =============================================================

import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "TechSolve - Sistem Informasi Akuntansi",
  description: "Aplikasi akuntansi UAS SIA - TechSolve Consulting",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 overflow-x-auto p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
