// =============================================================
//  app/page.tsx  -> Dashboard / Beranda
//  Server Component: ambil ringkasan langsung dari helper laporan.
// =============================================================

import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { query } from "@/lib/db";
import { hitungLabaRugi, hitungNeraca } from "@/lib/laporan";
import { formatRupiah } from "@/lib/format";

// Paksa render dinamis (selalu ambil data terbaru dari DB)
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Ambil beberapa angka ringkas untuk kartu statistik
  const [jumlahAkun] = await query<{ n: number }>(
    "SELECT COUNT(*) AS n FROM chart_of_accounts"
  );
  const [jumlahTransaksi] = await query<{ n: number }>(
    "SELECT COUNT(*) AS n FROM transactions"
  );
  const [jumlahJurnal] = await query<{ n: number }>(
    "SELECT COUNT(*) AS n FROM journal_entries"
  );
  const labaRugi = await hitungLabaRugi();
  const neraca = await hitungNeraca();

  const stats = [
    { label: "Total Akun", value: jumlahAkun.n, href: "/akun", icon: "📒" },
    { label: "Total Transaksi", value: jumlahTransaksi.n, href: "/transaksi", icon: "🧾" },
    { label: "Entri Jurnal", value: jumlahJurnal.n, href: "/jurnal", icon: "📰" },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Ringkasan keuangan TechSolve Consulting"
      />

      {/* Kartu statistik */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="card transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-3xl">{s.icon}</span>
              <span className="text-3xl font-bold text-slate-800">{s.value}</span>
            </div>
            <div className="mt-2 text-sm font-medium text-slate-500">{s.label}</div>
          </Link>
        ))}
      </div>

      {/* Ringkasan laba rugi & neraca */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 text-lg font-semibold text-slate-800">Ikhtisar Laba Rugi</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Total Pendapatan</dt>
              <dd className="font-medium text-slate-800">{formatRupiah(labaRugi.totalPendapatan)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Total Beban</dt>
              <dd className="font-medium text-slate-800">{formatRupiah(labaRugi.totalBeban)}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2">
              <dt className="font-semibold text-slate-700">Laba Bersih</dt>
              <dd className={`font-bold ${labaRugi.labaBersih >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatRupiah(labaRugi.labaBersih)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="card">
          <h2 className="mb-3 text-lg font-semibold text-slate-800">Ikhtisar Neraca</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Total Aset</dt>
              <dd className="font-medium text-slate-800">{formatRupiah(neraca.totalAset)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Kewajiban + Ekuitas</dt>
              <dd className="font-medium text-slate-800">{formatRupiah(neraca.totalPasiva)}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2">
              <dt className="font-semibold text-slate-700">Status</dt>
              <dd>
                {neraca.balance ? (
                  <span className="badge bg-green-100 text-green-700">✓ Balance</span>
                ) : (
                  <span className="badge bg-red-100 text-red-700">✗ Tidak Balance</span>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
