"use client";

// =============================================================
//  app/transaksi/page.tsx  -> Daftar transaksi + aksi
// =============================================================

import { useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { formatRupiah, formatTanggal } from "@/lib/format";

interface DetailRow {
  id: number;
  kode_akun: string;
  nama_akun: string;
  debit: number;
  kredit: number;
}
interface TransaksiRow {
  id: number;
  tanggal: string;
  deskripsi: string;
  jenis_transaksi: string | null;
  total_amount: number;
  details: DetailRow[];
}

export default function TransaksiPage() {
  const [data, setData] = useState<TransaksiRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function muatData() {
    setLoading(true);
    const res = await fetch("/api/transaksi");
    const json = await res.json();
    setData(json.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    muatData();
  }, []);

  async function hapus(id: number) {
    if (!confirm("Hapus transaksi ini? Entri jurnal terkait ikut terhapus.")) return;
    const res = await fetch(`/api/transaksi/${id}`, { method: "DELETE" });
    if (res.ok) muatData();
    else alert("Gagal menghapus transaksi");
  }

  return (
    <div>
      <PageHeader
        title="Transaksi"
        description="Daftar transaksi keuangan. Setiap baris detail otomatis dicatat ke jurnal lewat trigger database."
        action={
          <Link href="/transaksi/baru" className="btn-primary">
            + Transaksi Baru
          </Link>
        }
      />

      {loading ? (
        <p className="text-sm text-slate-500">Memuat data...</p>
      ) : data.length === 0 ? (
        <div className="card text-center text-slate-400">Belum ada transaksi.</div>
      ) : (
        <div className="space-y-4">
          {data.map((t) => (
            <div key={t.id} className="card">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">{t.deskripsi}</span>
                    {t.jenis_transaksi && (
                      <span className="badge bg-slate-100 text-slate-600">
                        {t.jenis_transaksi}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-500">
                    {formatTanggal(t.tanggal)} · #{t.id} · {formatRupiah(t.total_amount)}
                  </div>
                </div>
                <div className="shrink-0 space-x-3 text-sm">
                  <Link href={`/transaksi/${t.id}`} className="text-blue-600 hover:underline">
                    Edit
                  </Link>
                  <button onClick={() => hapus(t.id)} className="text-red-600 hover:underline">
                    Hapus
                  </button>
                </div>
              </div>

              <table className="table-base">
                <thead>
                  <tr>
                    <th>Akun</th>
                    <th className="text-right">Debit</th>
                    <th className="text-right">Kredit</th>
                  </tr>
                </thead>
                <tbody>
                  {t.details.map((d) => (
                    <tr key={d.id}>
                      <td>
                        <span className="font-mono text-slate-500">{d.kode_akun}</span>{" "}
                        {d.nama_akun}
                      </td>
                      <td className="text-right">
                        {d.debit > 0 ? formatRupiah(d.debit) : "-"}
                      </td>
                      <td className="text-right">
                        {d.kredit > 0 ? formatRupiah(d.kredit) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
