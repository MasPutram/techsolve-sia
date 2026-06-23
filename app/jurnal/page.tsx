"use client";

// =============================================================
//  app/jurnal/page.tsx  -> Jurnal Umum (read-only) + filter tanggal
//  Data berasal dari journal_entries (hasil trigger).
// =============================================================

import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { formatRupiah, formatTanggal } from "@/lib/format";

interface JurnalRow {
  id: number;
  tanggal: string;
  deskripsi: string | null;
  kode_akun: string;
  nama_akun: string;
  debit: number;
  kredit: number;
  ref_transaction_id: number | null;
}

export default function JurnalPage() {
  const [data, setData] = useState<JurnalRow[]>([]);
  const [summary, setSummary] = useState({ total_debit: 0, total_kredit: 0 });
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [loading, setLoading] = useState(true);

  async function muatData() {
    setLoading(true);
    const params = new URLSearchParams();
    if (start) params.set("start", start);
    if (end) params.set("end", end);
    const res = await fetch(`/api/jurnal?${params.toString()}`);
    const json = await res.json();
    setData(json.data ?? []);
    setSummary(json.summary ?? { total_debit: 0, total_kredit: 0 });
    setLoading(false);
  }

  useEffect(() => {
    muatData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetFilter() {
    setStart("");
    setEnd("");
    // muat ulang tanpa filter
    setTimeout(muatData, 0);
  }

  return (
    <div>
      <PageHeader
        title="Jurnal Umum"
        description="Seluruh entri jurnal dihasilkan otomatis oleh trigger database saat transaksi disimpan"
      />

      {/* Filter tanggal */}
      <div className="card mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="label">Dari Tanggal</label>
          <input type="date" className="input" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div>
          <label className="label">Sampai Tanggal</label>
          <input type="date" className="input" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <button className="btn-primary" onClick={muatData}>
          Terapkan
        </button>
        <button className="btn-secondary" onClick={resetFilter}>
          Reset
        </button>
      </div>

      <div className="card overflow-x-auto">
        {loading ? (
          <p className="text-sm text-slate-500">Memuat data...</p>
        ) : (
          <table className="table-base">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Keterangan</th>
                <th>Kode</th>
                <th>Nama Akun</th>
                <th className="text-right">Debit</th>
                <th className="text-right">Kredit</th>
              </tr>
            </thead>
            <tbody>
              {data.map((j) => (
                <tr key={j.id}>
                  <td className="whitespace-nowrap">{formatTanggal(j.tanggal)}</td>
                  <td>{j.deskripsi}</td>
                  <td className="font-mono">{j.kode_akun}</td>
                  <td>{j.nama_akun}</td>
                  <td className="text-right">{j.debit > 0 ? formatRupiah(j.debit) : "-"}</td>
                  <td className="text-right">{j.kredit > 0 ? formatRupiah(j.kredit) : "-"}</td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-slate-400">
                    Tidak ada entri jurnal pada rentang ini.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="font-semibold">
                <td colSpan={4} className="text-right">
                  Total
                </td>
                <td className="text-right">{formatRupiah(summary.total_debit)}</td>
                <td className="text-right">{formatRupiah(summary.total_kredit)}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}
