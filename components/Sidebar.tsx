"use client";

// =============================================================
//  components/Sidebar.tsx
//  Navigasi samping. Menyorot menu yang sedang aktif.
// =============================================================

import Link from "next/link";
import { usePathname } from "next/navigation";

// Daftar menu navigasi
const menu = [
  { href: "/", label: "Dashboard", icon: "🏠" },
  { href: "/akun", label: "Daftar Akun", icon: "📒" },
  { href: "/transaksi", label: "Transaksi", icon: "🧾" },
  { href: "/jurnal", label: "Jurnal Umum", icon: "📰" },
  { href: "/buku-besar", label: "Buku Besar", icon: "📚" },
];

const menuLaporan = [
  { href: "/laporan/laba-rugi", label: "Laba Rugi" },
  { href: "/laporan/perubahan-modal", label: "Perubahan Modal" },
  { href: "/laporan/neraca", label: "Neraca" },
];

export default function Sidebar() {
  const pathname = usePathname();

  // Cek apakah link sedang aktif
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside className="flex w-60 flex-col border-r border-slate-200 bg-white">
      {/* Brand */}
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="text-lg font-bold text-blue-700">TechSolve</div>
        <div className="text-xs text-slate-500">Sistem Informasi Akuntansi</div>
      </div>

      {/* Menu utama */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {menu.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              isActive(m.href)
                ? "bg-blue-50 text-blue-700"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span>{m.icon}</span>
            {m.label}
          </Link>
        ))}

        {/* Kelompok laporan */}
        <div className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Laporan Keuangan
        </div>
        {menuLaporan.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              isActive(m.href)
                ? "bg-blue-50 text-blue-700"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span>📊</span>
            {m.label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-slate-200 px-5 py-3 text-xs text-slate-400">
        UAS SIA &copy; 2026
      </div>
    </aside>
  );
}
