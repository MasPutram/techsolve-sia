// =============================================================
//  lib/laporan.ts
//  Fungsi perhitungan laporan keuangan.
//  SEMUA dihitung dari tabel journal_entries (hasil trigger),
//  BUKAN dari input manual.
// =============================================================

import { query } from "@/lib/db";

// Tipe baris ringkasan saldo per akun
export interface SaldoAkun {
  kode_akun: string;
  nama_akun: string;
  kategori: string;
  saldo_normal: "Debit" | "Kredit";
  total_debit: number;
  total_kredit: number;
  saldo: number; // saldo sesuai saldo normal akun
}

/**
 * Ambil saldo seluruh akun dari journal_entries.
 * saldo dihitung sesuai saldo normal:
 *   Debit  -> debit - kredit
 *   Kredit -> kredit - debit
 */
async function getSaldoSemuaAkun(): Promise<SaldoAkun[]> {
  const rows = await query<any>(
    `SELECT coa.kode_akun, coa.nama_akun, coa.kategori, coa.saldo_normal,
            COALESCE(SUM(j.debit), 0)  AS total_debit,
            COALESCE(SUM(j.kredit), 0) AS total_kredit
       FROM chart_of_accounts coa
       LEFT JOIN journal_entries j ON j.kode_akun = coa.kode_akun
      GROUP BY coa.kode_akun, coa.nama_akun, coa.kategori, coa.saldo_normal
      ORDER BY coa.kode_akun ASC`
  );

  return rows.map((r) => {
    const total_debit = Number(r.total_debit);
    const total_kredit = Number(r.total_kredit);
    const saldo =
      r.saldo_normal === "Debit"
        ? total_debit - total_kredit
        : total_kredit - total_debit;
    return { ...r, total_debit, total_kredit, saldo };
  });
}

/**
 * LAPORAN LABA RUGI
 * Laba Bersih = Total Pendapatan - Total Beban
 */
export async function hitungLabaRugi() {
  const semua = await getSaldoSemuaAkun();
  const pendapatan = semua.filter((a) => a.kategori === "Pendapatan");
  const beban = semua.filter((a) => a.kategori === "Beban");

  const totalPendapatan = pendapatan.reduce((s, a) => s + a.saldo, 0);
  const totalBeban = beban.reduce((s, a) => s + a.saldo, 0);
  const labaBersih = totalPendapatan - totalBeban;

  return { pendapatan, beban, totalPendapatan, totalBeban, labaBersih };
}

/**
 * LAPORAN PERUBAHAN MODAL
 * Modal Akhir = Modal Awal + Laba Bersih - Prive
 * - Modal Awal : saldo akun Ekuitas bersaldo normal Kredit (mis. Modal Pemilik)
 * - Prive      : saldo akun Ekuitas bersaldo normal Debit (kontra-ekuitas)
 */
export async function hitungPerubahanModal() {
  const semua = await getSaldoSemuaAkun();
  const ekuitas = semua.filter((a) => a.kategori === "Ekuitas");

  const modalAwal = ekuitas
    .filter((a) => a.saldo_normal === "Kredit")
    .reduce((s, a) => s + a.saldo, 0);
  const prive = ekuitas
    .filter((a) => a.saldo_normal === "Debit")
    .reduce((s, a) => s + a.saldo, 0);

  const { labaBersih } = await hitungLabaRugi();
  const modalAkhir = modalAwal + labaBersih - prive;

  return { modalAwal, labaBersih, prive, modalAkhir };
}

/**
 * NERACA (Laporan Posisi Keuangan)
 * Aset = Kewajiban + Ekuitas (harus balance)
 * Ekuitas pada neraca memakai Modal Akhir (sudah termasuk laba & prive).
 */
export async function hitungNeraca() {
  const semua = await getSaldoSemuaAkun();
  const aset = semua.filter((a) => a.kategori === "Aset");
  const kewajiban = semua.filter((a) => a.kategori === "Kewajiban");

  const totalAset = aset.reduce((s, a) => s + a.saldo, 0);
  const totalKewajiban = kewajiban.reduce((s, a) => s + a.saldo, 0);

  // Ekuitas akhir diambil dari laporan perubahan modal
  const { modalAwal, labaBersih, prive, modalAkhir } =
    await hitungPerubahanModal();
  const totalEkuitas = modalAkhir;

  const totalPasiva = totalKewajiban + totalEkuitas;
  // toleransi kecil untuk galat pembulatan
  const balance = Math.abs(totalAset - totalPasiva) < 0.001;

  return {
    aset,
    kewajiban,
    ekuitas: { modalAwal, labaBersih, prive, modalAkhir },
    totalAset,
    totalKewajiban,
    totalEkuitas,
    totalPasiva,
    balance,
  };
}
