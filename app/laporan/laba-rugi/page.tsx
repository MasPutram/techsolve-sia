// =============================================================
//  app/laporan/laba-rugi/page.tsx
//  Laporan Laba Rugi: Total Pendapatan - Total Beban = Laba Bersih
//  Dihitung dari journal_entries via lib/laporan.ts.
// =============================================================

import PageHeader from "@/components/PageHeader";
import { hitungLabaRugi } from "@/lib/laporan";
import { formatRupiah } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function LabaRugiPage() {
  const { pendapatan, beban, totalPendapatan, totalBeban, labaBersih } =
    await hitungLabaRugi();

  return (
    <div>
      <PageHeader
        title="Laporan Laba Rugi"
        description="TechSolve Consulting · Periode berjalan"
      />

      <div className="card mx-auto max-w-2xl">
        {/* Pendapatan */}
        <h2 className="mb-2 font-semibold text-slate-800">Pendapatan</h2>
        <table className="table-base mb-4">
          <tbody>
            {pendapatan.map((a) => (
              <tr key={a.kode_akun}>
                <td>
                  <span className="font-mono text-slate-500">{a.kode_akun}</span> {a.nama_akun}
                </td>
                <td className="text-right">{formatRupiah(a.saldo)}</td>
              </tr>
            ))}
            <tr className="font-semibold">
              <td>Total Pendapatan</td>
              <td className="text-right text-green-600">{formatRupiah(totalPendapatan)}</td>
            </tr>
          </tbody>
        </table>

        {/* Beban */}
        <h2 className="mb-2 font-semibold text-slate-800">Beban</h2>
        <table className="table-base mb-4">
          <tbody>
            {beban.map((a) => (
              <tr key={a.kode_akun}>
                <td>
                  <span className="font-mono text-slate-500">{a.kode_akun}</span> {a.nama_akun}
                </td>
                <td className="text-right">{formatRupiah(a.saldo)}</td>
              </tr>
            ))}
            <tr className="font-semibold">
              <td>Total Beban</td>
              <td className="text-right text-red-600">({formatRupiah(totalBeban)})</td>
            </tr>
          </tbody>
        </table>

        {/* Laba bersih */}
        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
          <span className="text-lg font-bold text-slate-800">Laba Bersih</span>
          <span className={`text-lg font-bold ${labaBersih >= 0 ? "text-green-600" : "text-red-600"}`}>
            {formatRupiah(labaBersih)}
          </span>
        </div>
      </div>
    </div>
  );
}
