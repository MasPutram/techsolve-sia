"use client";

// =============================================================
//  app/akun/page.tsx  -> CRUD Chart of Accounts
// =============================================================

import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import type { Akun, KategoriAkun, SaldoNormal } from "@/lib/types";

const KATEGORI: KategoriAkun[] = ["Aset", "Kewajiban", "Ekuitas", "Pendapatan", "Beban"];

// Warna badge per kategori
const warnaKategori: Record<string, string> = {
  Aset: "bg-blue-100 text-blue-700",
  Kewajiban: "bg-amber-100 text-amber-700",
  Ekuitas: "bg-purple-100 text-purple-700",
  Pendapatan: "bg-green-100 text-green-700",
  Beban: "bg-red-100 text-red-700",
};

const formKosong = {
  kode_akun: "",
  nama_akun: "",
  kategori: "Aset" as KategoriAkun,
  saldo_normal: "Debit" as SaldoNormal,
};

export default function AkunPage() {
  const [akunList, setAkunList] = useState<Akun[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(formKosong);
  const [editMode, setEditMode] = useState(false); // true = edit, false = tambah
  const [pesan, setPesan] = useState<{ tipe: "ok" | "error"; teks: string } | null>(null);

  // Ambil daftar akun dari API
  async function muatData() {
    setLoading(true);
    const res = await fetch("/api/akun");
    const json = await res.json();
    setAkunList(json.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    muatData();
  }, []);

  // Tampilkan notifikasi sementara
  function notif(tipe: "ok" | "error", teks: string) {
    setPesan({ tipe, teks });
    setTimeout(() => setPesan(null), 3000);
  }

  // Submit form (tambah atau edit)
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = editMode ? `/api/akun/${form.kode_akun}` : "/api/akun";
    const method = editMode ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    if (!res.ok) {
      notif("error", json.error ?? "Gagal menyimpan");
      return;
    }
    notif("ok", editMode ? "Akun diperbarui" : "Akun ditambahkan");
    setForm(formKosong);
    setEditMode(false);
    muatData();
  }

  // Isi form untuk edit
  function mulaiEdit(akun: Akun) {
    setForm(akun);
    setEditMode(true);
    setPesan(null);
  }

  // Batalkan edit
  function batal() {
    setForm(formKosong);
    setEditMode(false);
  }

  // Hapus akun
  async function hapus(kode: string) {
    if (!confirm(`Hapus akun ${kode}?`)) return;
    const res = await fetch(`/api/akun/${kode}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) {
      notif("error", json.error ?? "Gagal menghapus");
      return;
    }
    notif("ok", "Akun dihapus");
    muatData();
  }

  return (
    <div>
      <PageHeader
        title="Daftar Akun (Chart of Accounts)"
        description="Kelola kode dan nama akun yang dipakai dalam pencatatan transaksi"
      />

      {/* Notifikasi */}
      {pesan && (
        <div
          className={`mb-4 rounded-md px-4 py-2 text-sm ${
            pesan.tipe === "ok"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {pesan.teks}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Form tambah/edit */}
        <div className="lg:col-span-1">
          <form onSubmit={handleSubmit} className="card space-y-3">
            <h2 className="text-lg font-semibold text-slate-800">
              {editMode ? "Edit Akun" : "Tambah Akun"}
            </h2>
            <div>
              <label className="label">Kode Akun</label>
              <input
                className="input"
                placeholder="cth: 1105"
                value={form.kode_akun}
                disabled={editMode}
                onChange={(e) => setForm({ ...form, kode_akun: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Nama Akun</label>
              <input
                className="input"
                placeholder="cth: Kas Kecil"
                value={form.nama_akun}
                onChange={(e) => setForm({ ...form, nama_akun: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Kategori</label>
              <select
                className="input"
                value={form.kategori}
                onChange={(e) =>
                  setForm({ ...form, kategori: e.target.value as KategoriAkun })
                }
              >
                {KATEGORI.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Saldo Normal</label>
              <select
                className="input"
                value={form.saldo_normal}
                onChange={(e) =>
                  setForm({ ...form, saldo_normal: e.target.value as SaldoNormal })
                }
              >
                <option value="Debit">Debit</option>
                <option value="Kredit">Kredit</option>
              </select>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" className="btn-primary flex-1">
                {editMode ? "Simpan Perubahan" : "Tambah"}
              </button>
              {editMode && (
                <button type="button" className="btn-secondary" onClick={batal}>
                  Batal
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Tabel daftar akun */}
        <div className="lg:col-span-2">
          <div className="card overflow-x-auto">
            {loading ? (
              <p className="text-sm text-slate-500">Memuat data...</p>
            ) : (
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Kode</th>
                    <th>Nama Akun</th>
                    <th>Kategori</th>
                    <th>Saldo Normal</th>
                    <th className="text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {akunList.map((a) => (
                    <tr key={a.kode_akun}>
                      <td className="font-mono font-medium">{a.kode_akun}</td>
                      <td>{a.nama_akun}</td>
                      <td>
                        <span className={`badge ${warnaKategori[a.kategori]}`}>
                          {a.kategori}
                        </span>
                      </td>
                      <td>{a.saldo_normal}</td>
                      <td className="text-right">
                        <button
                          className="mr-2 text-blue-600 hover:underline"
                          onClick={() => mulaiEdit(a)}
                        >
                          Edit
                        </button>
                        <button
                          className="text-red-600 hover:underline"
                          onClick={() => hapus(a.kode_akun)}
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                  {akunList.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-slate-400">
                        Belum ada akun
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
