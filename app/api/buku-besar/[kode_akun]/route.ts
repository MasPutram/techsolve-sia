// =============================================================
//  /api/buku-besar/[kode_akun]  -> GET (mutasi 1 akun + saldo berjalan)
//
//  Saldo berjalan (running balance) dihitung sesuai SALDO NORMAL akun:
//  - saldo normal Debit : saldo += debit - kredit
//  - saldo normal Kredit: saldo += kredit - debit
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { Akun } from "@/lib/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: { kode_akun: string } }
) {
  try {
    const kode = params.kode_akun;

    // Ambil info akun (untuk tahu saldo normalnya)
    const akunRows = await query<Akun>(
      "SELECT kode_akun, nama_akun, kategori, saldo_normal FROM chart_of_accounts WHERE kode_akun = ?",
      [kode]
    );
    if (akunRows.length === 0) {
      return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 });
    }
    const akun = akunRows[0];

    // Ambil semua mutasi akun ini dari jurnal, urut tanggal
    const mutasi = await query<any>(
      `SELECT id, tanggal, deskripsi, debit, kredit, ref_transaction_id
         FROM journal_entries
        WHERE kode_akun = ?
        ORDER BY tanggal ASC, ref_transaction_id ASC, id ASC`,
      [kode]
    );

    // Hitung saldo berjalan baris per baris
    let saldo = 0;
    const rows = mutasi.map((m) => {
      const debit = Number(m.debit);
      const kredit = Number(m.kredit);
      if (akun.saldo_normal === "Debit") {
        saldo += debit - kredit;
      } else {
        saldo += kredit - debit;
      }
      return { ...m, saldo };
    });

    return NextResponse.json({
      akun,
      data: rows,
      saldo_akhir: saldo,
    });
  } catch (err) {
    console.error("GET /api/buku-besar error:", err);
    return NextResponse.json({ error: "Gagal mengambil buku besar" }, { status: 500 });
  }
}
