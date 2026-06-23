// =============================================================
//  app/laporan/perubahan-modal/page.tsx
//  Modal Akhir = Modal Awal + Laba Bersih - Prive
// =============================================================

import PageHeader from "@/components/PageHeader";
import { hitungPerubahanModal } from "@/lib/laporan";
import { formatRupiah } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PerubahanModalPage() {
  const { modalAwal, labaBersih, prive, modalAkhir } = await hitungPerubahanModal();

  return (
    <div>
      <PageHeader
        title="Laporan Perubahan Modal"
        description="TechSolve Consulting · Periode berjalan"
      />

      <div className="card mx-auto max-w-2xl">
        <table className="table-base">
          <tbody>
            <tr>
              <td>Modal Awal (Setoran Pemilik)</td>
              <td className="text-right">{formatRupiah(modalAwal)}</td>
            </tr>
            <tr>
              <td className={labaBersih >= 0 ? "text-green-700" : "text-red-700"}>
                {labaBersih >= 0 ? "Ditambah: Laba Bersih" : "Dikurangi: Rugi Bersih"}
              </td>
              <td className="text-right">{formatRupiah(labaBersih)}</td>
            </tr>
            <tr>
              <td className="text-red-700">Dikurangi: Prive</td>
              <td className="text-right">({formatRupiah(prive)})</td>
            </tr>
            <tr className="text-lg font-bold">
              <td>Modal Akhir</td>
              <td className="text-right text-blue-700">{formatRupiah(modalAkhir)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
