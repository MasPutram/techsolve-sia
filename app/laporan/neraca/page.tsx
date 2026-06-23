// =============================================================
//  app/laporan/neraca/page.tsx
//  Neraca: Aset = Kewajiban + Ekuitas (harus balance)
// =============================================================

import PageHeader from "@/components/PageHeader";
import { hitungNeraca } from "@/lib/laporan";
import { formatRupiah } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function NeracaPage() {
  const {
    aset,
    kewajiban,
    ekuitas,
    totalAset,
    totalKewajiban,
    totalEkuitas,
    totalPasiva,
    balance,
  } = await hitungNeraca();

  return (
    <div>
      <PageHeader title="Neraca" description="TechSolve Consulting · Laporan Posisi Keuangan" />

      {/* Indikator balance */}
      <div className="mb-4">
        {balance ? (
          <span className="badge bg-green-100 text-green-700">
            ✓ Neraca Seimbang — Aset = Kewajiban + Ekuitas
          </span>
        ) : (
          <span className="badge bg-red-100 text-red-700">✗ Neraca Tidak Seimbang</span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Sisi Aset */}
        <div className="card">
          <h2 className="mb-3 font-semibold text-slate-800">AKTIVA (Aset)</h2>
          <table className="table-base">
            <tbody>
              {aset.map((a) => (
                <tr key={a.kode_akun}>
                  <td>
                    <span className="font-mono text-slate-500">{a.kode_akun}</span> {a.nama_akun}
                  </td>
                  <td className="text-right">{formatRupiah(a.saldo)}</td>
                </tr>
              ))}
              <tr className="text-lg font-bold">
                <td>Total Aset</td>
                <td className="text-right text-blue-700">{formatRupiah(totalAset)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Sisi Pasiva */}
        <div className="card">
          <h2 className="mb-3 font-semibold text-slate-800">PASIVA (Kewajiban + Ekuitas)</h2>
          <table className="table-base">
            <tbody>
              {/* Kewajiban */}
              <tr className="bg-slate-50 font-medium">
                <td colSpan={2}>Kewajiban</td>
              </tr>
              {kewajiban.length === 0 ? (
                <tr>
                  <td className="pl-6 text-slate-400">Tidak ada</td>
                  <td className="text-right">{formatRupiah(0)}</td>
                </tr>
              ) : (
                kewajiban.map((k) => (
                  <tr key={k.kode_akun}>
                    <td className="pl-6">
                      <span className="font-mono text-slate-500">{k.kode_akun}</span> {k.nama_akun}
                    </td>
                    <td className="text-right">{formatRupiah(k.saldo)}</td>
                  </tr>
                ))
              )}
              <tr className="font-medium">
                <td>Total Kewajiban</td>
                <td className="text-right">{formatRupiah(totalKewajiban)}</td>
              </tr>

              {/* Ekuitas */}
              <tr className="bg-slate-50 font-medium">
                <td colSpan={2}>Ekuitas</td>
              </tr>
              <tr>
                <td className="pl-6">Modal Akhir</td>
                <td className="text-right">{formatRupiah(ekuitas.modalAkhir)}</td>
              </tr>
              <tr className="font-medium">
                <td>Total Ekuitas</td>
                <td className="text-right">{formatRupiah(totalEkuitas)}</td>
              </tr>

              {/* Total pasiva */}
              <tr className="text-lg font-bold">
                <td>Total Pasiva</td>
                <td className="text-right text-blue-700">{formatRupiah(totalPasiva)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
