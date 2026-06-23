"use client";

// =============================================================
//  components/TransaksiForm.tsx
//  Form input transaksi gaya double-entry (multi-baris).
//  Dipakai untuk tambah (mode "baru") maupun edit.
//  Tombol simpan terkunci selama total debit != total kredit.
// =============================================================

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Akun } from "@/lib/types";
import { formatRupiah } from "@/lib/format";

// Tipe baris pada form (pakai string agar input kosong nyaman diketik)
interface BarisForm {
  kode_akun: string;
  debit: string;
  kredit: string;
}

interface NilaiAwal {
  tanggal: string;
  deskripsi: string;
  jenis_transaksi: string;
  details: BarisForm[];
}

const barisBaru = (): BarisForm => ({ kode_akun: "", debit: "", kredit: "" });

export default function TransaksiForm({
  mode,
  transaksiId,
  nilaiAwal,
}: {
  mode: "baru" | "edit";
  transaksiId?: number;
  nilaiAwal?: NilaiAwal;
}) {
  const router = useRouter();
  const [akunList, setAkunList] = useState<Akun[]>([]);
  const [tanggal, setTanggal] = useState(nilaiAwal?.tanggal ?? "");
  const [deskripsi, setDeskripsi] = useState(nilaiAwal?.deskripsi ?? "");
  const [jenis, setJenis] = useState(nilaiAwal?.jenis_transaksi ?? "");
  const [baris, setBaris] = useState<BarisForm[]>(
    nilaiAwal?.details ?? [barisBaru(), barisBaru()]
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Ambil daftar akun untuk dropdown
  useEffect(() => {
    fetch("/api/akun")
      .then((r) => r.json())
      .then((j) => setAkunList(j.data ?? []));
  }, []);

  // Hitung total debit & kredit secara live
  const totalDebit = baris.reduce((s, b) => s + (Number(b.debit) || 0), 0);
  const totalKredit = baris.reduce((s, b) => s + (Number(b.kredit) || 0), 0);
  const selisih = totalDebit - totalKredit;
  const seimbang = Math.abs(selisih) < 0.001 && totalDebit > 0;

  // Ubah salah satu sel pada baris tertentu
  function ubahBaris(index: number, field: keyof BarisForm, value: string) {
    setBaris((prev) =>
      prev.map((b, i) => {
        if (i !== index) return b;
        const updated = { ...b, [field]: value };
        // Jika mengisi debit, kosongkan kredit dan sebaliknya (double-entry)
        if (field === "debit" && value) updated.kredit = "";
        if (field === "kredit" && value) updated.debit = "";
        return updated;
      })
    );
  }

  function tambahBaris() {
    setBaris((prev) => [...prev, barisBaru()]);
  }

  function hapusBaris(index: number) {
    setBaris((prev) => (prev.length <= 2 ? prev : prev.filter((_, i) => i !== index)));
  }

  // Kirim ke API
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validasi di sisi klien sebelum kirim
    if (!seimbang) {
      setError("Total debit harus sama dengan total kredit dan tidak boleh nol.");
      return;
    }
    const details = baris
      .filter((b) => b.kode_akun && (Number(b.debit) > 0 || Number(b.kredit) > 0))
      .map((b) => ({
        kode_akun: b.kode_akun,
        debit: Number(b.debit) || 0,
        kredit: Number(b.kredit) || 0,
      }));
    if (details.length < 2) {
      setError("Transaksi harus punya minimal 2 baris yang valid.");
      return;
    }

    setSaving(true);
    const url = mode === "baru" ? "/api/transaksi" : `/api/transaksi/${transaksiId}`;
    const method = mode === "baru" ? "POST" : "PUT";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tanggal,
        deskripsi,
        jenis_transaksi: jenis || null,
        details,
      }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(json.error ?? "Gagal menyimpan transaksi");
      return;
    }
    // Kembali ke daftar transaksi
    router.push("/transaksi");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Header transaksi */}
      <div className="card grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label className="label">Tanggal</label>
          <input
            type="date"
            className="input"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            required
          />
        </div>
        <div className="md:col-span-2">
          <label className="label">Deskripsi</label>
          <input
            className="input"
            placeholder="cth: Terima pendapatan jasa instalasi"
            value={deskripsi}
            onChange={(e) => setDeskripsi(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">Jenis Transaksi (opsional)</label>
          <input
            className="input"
            placeholder="cth: Pendapatan"
            value={jenis}
            onChange={(e) => setJenis(e.target.value)}
          />
        </div>
      </div>

      {/* Baris detail double-entry */}
      <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Detail Jurnal</h2>
          <button type="button" className="btn-secondary" onClick={tambahBaris}>
            + Tambah Baris
          </button>
        </div>

        <table className="table-base">
          <thead>
            <tr>
              <th className="w-1/2">Akun</th>
              <th>Debit</th>
              <th>Kredit</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {baris.map((b, i) => (
              <tr key={i}>
                <td>
                  <select
                    className="input"
                    value={b.kode_akun}
                    onChange={(e) => ubahBaris(i, "kode_akun", e.target.value)}
                  >
                    <option value="">-- pilih akun --</option>
                    {akunList.map((a) => (
                      <option key={a.kode_akun} value={a.kode_akun}>
                        {a.kode_akun} - {a.nama_akun}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input text-right"
                    placeholder="0"
                    value={b.debit}
                    onChange={(e) => ubahBaris(i, "debit", e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input text-right"
                    placeholder="0"
                    value={b.kredit}
                    onChange={(e) => ubahBaris(i, "kredit", e.target.value)}
                  />
                </td>
                <td className="text-center">
                  <button
                    type="button"
                    className="text-red-500 hover:text-red-700 disabled:opacity-30"
                    onClick={() => hapusBaris(i)}
                    disabled={baris.length <= 2}
                    title="Hapus baris"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-semibold">
              <td className="text-right">Total</td>
              <td className="text-right">{formatRupiah(totalDebit)}</td>
              <td className="text-right">{formatRupiah(totalKredit)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>

        {/* Indikator keseimbangan double-entry */}
        <div className="mt-3">
          {seimbang ? (
            <span className="badge bg-green-100 text-green-700">
              ✓ Seimbang — debit = kredit
            </span>
          ) : (
            <span className="badge bg-amber-100 text-amber-700">
              ⚠ Belum seimbang — selisih {formatRupiah(Math.abs(selisih))}
            </span>
          )}
        </div>
      </div>

      {/* Pesan error */}
      {error && (
        <div className="rounded-md bg-red-100 px-4 py-2 text-sm text-red-700">{error}</div>
      )}

      {/* Aksi */}
      <div className="flex gap-2">
        <button type="submit" className="btn-primary" disabled={!seimbang || saving}>
          {saving ? "Menyimpan..." : mode === "baru" ? "Simpan Transaksi" : "Simpan Perubahan"}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => router.push("/transaksi")}
        >
          Batal
        </button>
      </div>
    </form>
  );
}
