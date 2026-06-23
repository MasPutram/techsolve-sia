"use client";

// =============================================================
//  app/buku-besar/page.tsx  -> Buku Besar per akun + saldo berjalan
// =============================================================

import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import type { Akun } from "@/lib/types";
import { formatRupiah, formatTanggal } from "@/lib/format";

interface MutasiRow {
  id: number;
  tanggal: string;
  deskripsi: string | null;
  debit: number;
  kredit: number;
  saldo: number;
}

export default function BukuBesarPage() {
  const [akunList, setAkunList] = useState<Akun[]>([]);
  const [kodeAkun, setKodeAkun] = useState("");
  const [akun, setAkun] = useState<Akun | null>(null);
  const [mutasi, setMutasi] = useState<MutasiRow[]>([]);
  const [saldoAkhir, setSaldoAkhir] = useState(0);
  const [loading, setLoading] = useState(false);

  // Ambil daftar akun untuk dropdown
  useEffect(() => {
    fetch("/api/akun")
      .then((r) => r.json())
      .then((j) => setAkunList(j.data ?? []));
  }, []);

  // Saat akun dipilih, ambil mutasinya
  useEffect(() => {
    if (!kodeAkun) {
      setAkun(null);
      setMutasi([]);
      return;
    }
    setLoading(true);
    fetch(`/api/buku-besar/${kodeAkun}`)
      .then((r) => r.json())
      .then((j) => {
        setAkun(j.akun ?? null);
        setMutasi(j.data ?? []);
        setSaldoAkhir(j.saldo_akhir ?? 0);
        setLoading(false);
      });
  }, [kodeAkun]);

  return (
    <div>
      <PageHeader
        title="Buku Besar"
        description="Pilih akun untuk melihat mutasi dan saldo berjalan (running balance)"
      />

      <div className="card mb-4 max-w-md">
        <label className="label">Pilih Akun</label>
        <select className="input" value={kodeAkun} onChange={(e) => setKodeAkun(e.target.value)}>
          <option value="">-- pilih akun --</option>
          {akunList.map((a) => (
            <option key={a.kode_akun} value={a.kode_akun}>
              {a.kode_akun} - {a.nama_akun}
            </option>
          ))}
        </select>
      </div>

      {akun && (
        <div className="card overflow-x-auto">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">
              {akun.kode_akun} - {akun.nama_akun}
            </h2>
            <span className="text-sm text-slate-500">
              Kategori: {akun.kategori} · Saldo Normal: {akun.saldo_normal}
            </span>
          </div>

          {loading ? (
            <p className="text-sm text-slate-500">Memuat data...</p>
          ) : (
            <table className="table-base">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Keterangan</th>
                  <th className="text-right">Debit</th>
                  <th className="text-right">Kredit</th>
                  <th className="text-right">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {mutasi.map((m) => (
                  <tr key={m.id}>
                    <td className="whitespace-nowrap">{formatTanggal(m.tanggal)}</td>
                    <td>{m.deskripsi}</td>
                    <td className="text-right">{m.debit > 0 ? formatRupiah(m.debit) : "-"}</td>
                    <td className="text-right">{m.kredit > 0 ? formatRupiah(m.kredit) : "-"}</td>
                    <td className="text-right font-medium">{formatRupiah(m.saldo)}</td>
                  </tr>
                ))}
                {mutasi.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-slate-400">
                      Belum ada mutasi untuk akun ini.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="font-semibold">
                  <td colSpan={4} className="text-right">
                    Saldo Akhir
                  </td>
                  <td className="text-right text-blue-700">{formatRupiah(saldoAkhir)}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
