// =============================================================
//  lib/types.ts
//  Definisi tipe data (TypeScript) yang dipakai lintas aplikasi.
// =============================================================

// Kategori akun sesuai persamaan akuntansi
export type KategoriAkun =
  | "Aset"
  | "Kewajiban"
  | "Ekuitas"
  | "Pendapatan"
  | "Beban";

export type SaldoNormal = "Debit" | "Kredit";

// Satu baris pada Chart of Accounts (master akun)
export interface Akun {
  kode_akun: string;
  nama_akun: string;
  kategori: KategoriAkun;
  saldo_normal: SaldoNormal;
}

// Baris detail double-entry pada sebuah transaksi
export interface DetailTransaksi {
  kode_akun: string;
  debit: number;
  kredit: number;
}

// Header transaksi
export interface Transaksi {
  id: number;
  tanggal: string;
  deskripsi: string;
  jenis_transaksi: string | null;
  total_amount: number;
}

// Satu baris buku jurnal
export interface EntriJurnal {
  id: number;
  tanggal: string;
  deskripsi: string | null;
  kode_akun: string;
  nama_akun?: string;
  debit: number;
  kredit: number;
  ref_transaction_id: number | null;
  ref_detail_id: number | null;
}
