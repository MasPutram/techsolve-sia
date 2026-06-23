// =============================================================
//  app/transaksi/[id]/page.tsx  -> Form edit transaksi
//  Server Component: ambil data transaksi langsung dari DB,
//  lalu render TransaksiForm dengan nilai awal.
// =============================================================

import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import TransaksiForm from "@/components/TransaksiForm";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function EditTransaksiPage({
  params,
}: {
  params: { id: string };
}) {
  const id = Number(params.id);

  // Ambil header transaksi
  const header = await query<any>(
    "SELECT id, tanggal, deskripsi, jenis_transaksi FROM transactions WHERE id = ?",
    [id]
  );
  if (header.length === 0) notFound();

  // Ambil baris detail
  const details = await query<any>(
    "SELECT kode_akun, debit, kredit FROM transaction_details WHERE transaction_id = ? ORDER BY id ASC",
    [id]
  );

  const nilaiAwal = {
    tanggal: header[0].tanggal,
    deskripsi: header[0].deskripsi,
    jenis_transaksi: header[0].jenis_transaksi ?? "",
    details: details.map((d) => ({
      kode_akun: d.kode_akun,
      debit: Number(d.debit) > 0 ? String(Number(d.debit)) : "",
      kredit: Number(d.kredit) > 0 ? String(Number(d.kredit)) : "",
    })),
  };

  return (
    <div>
      <PageHeader
        title={`Edit Transaksi #${id}`}
        description="Mengubah transaksi akan otomatis menyinkronkan ulang entri jurnal lewat trigger"
      />
      <TransaksiForm mode="edit" transaksiId={id} nilaiAwal={nilaiAwal} />
    </div>
  );
}
