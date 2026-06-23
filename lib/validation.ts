// =============================================================
//  lib/validation.ts
//  Skema validasi input memakai zod. Dipakai di API route
//  sebagai lapis pertahanan backend (selain validasi di UI).
// =============================================================

import { z } from "zod";

// --- Validasi Chart of Accounts ---
export const akunSchema = z.object({
  // kode akun 3-10 digit angka (mis. 1101)
  kode_akun: z
    .string()
    .trim()
    .regex(/^\d{3,10}$/, "Kode akun harus berupa 3-10 digit angka"),
  nama_akun: z.string().trim().min(1, "Nama akun wajib diisi").max(100),
  kategori: z.enum(["Aset", "Kewajiban", "Ekuitas", "Pendapatan", "Beban"]),
  saldo_normal: z.enum(["Debit", "Kredit"]),
});

// Saat update, kode_akun diambil dari URL, jadi body tanpa kode_akun
export const akunUpdateSchema = akunSchema.omit({ kode_akun: true });

// --- Validasi baris detail transaksi ---
const detailSchema = z
  .object({
    kode_akun: z.string().trim().min(1, "Kode akun wajib dipilih"),
    debit: z.coerce.number().min(0, "Debit tidak boleh negatif").default(0),
    kredit: z.coerce.number().min(0, "Kredit tidak boleh negatif").default(0),
  })
  // Satu baris tidak boleh debit DAN kredit terisi sekaligus
  .refine((d) => !(d.debit > 0 && d.kredit > 0), {
    message: "Satu baris tidak boleh terisi debit dan kredit sekaligus",
  })
  // Satu baris minimal punya nilai debit atau kredit
  .refine((d) => d.debit > 0 || d.kredit > 0, {
    message: "Setiap baris harus punya nilai debit atau kredit",
  });

// --- Validasi transaksi lengkap (header + detail) ---
export const transaksiSchema = z
  .object({
    tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal salah (YYYY-MM-DD)"),
    deskripsi: z.string().trim().min(1, "Deskripsi wajib diisi").max(255),
    jenis_transaksi: z.string().trim().max(50).optional().nullable(),
    details: z.array(detailSchema).min(2, "Transaksi minimal 2 baris (1 debit & 1 kredit)"),
  })
  // VALIDASI DOUBLE-ENTRY: total debit harus sama dengan total kredit
  .refine(
    (t) => {
      const totalDebit = t.details.reduce((s, d) => s + d.debit, 0);
      const totalKredit = t.details.reduce((s, d) => s + d.kredit, 0);
      // bandingkan dengan toleransi kecil untuk menghindari galat pembulatan
      return Math.abs(totalDebit - totalKredit) < 0.001;
    },
    { message: "Total debit harus sama dengan total kredit (prinsip double-entry)" }
  );

export type TransaksiInput = z.infer<typeof transaksiSchema>;
export type AkunInput = z.infer<typeof akunSchema>;
