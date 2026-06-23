// =============================================================
//  /api/transaksi  -> GET (daftar transaksi + detail), POST (tambah)
//
//  Catatan penting:
//  - Saat detail di-INSERT, trigger MySQL otomatis mengisi
//    journal_entries. Kode di sini TIDAK menyentuh journal_entries.
//  - Validasi double-entry (debit = kredit) dijalankan di backend
//    via zod, jadi tetap aman walau UI dilewati.
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { query, withTransaction } from "@/lib/db";
import { transaksiSchema } from "@/lib/validation";

// GET: daftar semua transaksi beserta baris detailnya
export async function GET() {
  try {
    // Ambil header transaksi (terbaru di atas)
    const headers = await query<any>(
      "SELECT id, tanggal, deskripsi, jenis_transaksi, total_amount FROM transactions ORDER BY tanggal DESC, id DESC"
    );

    // Ambil semua detail sekaligus + nama akun, lalu kelompokkan per transaksi
    const details = await query<any>(
      `SELECT td.id, td.transaction_id, td.kode_akun, coa.nama_akun, td.debit, td.kredit
         FROM transaction_details td
         JOIN chart_of_accounts coa ON coa.kode_akun = td.kode_akun
        ORDER BY td.id ASC`
    );

    const data = headers.map((h) => ({
      ...h,
      details: details.filter((d) => d.transaction_id === h.id),
    }));

    return NextResponse.json({ data });
  } catch (err) {
    console.error("GET /api/transaksi error:", err);
    return NextResponse.json({ error: "Gagal mengambil data transaksi" }, { status: 500 });
  }
}

// POST: tambah transaksi baru (header + detail) secara atomik
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validasi termasuk pengecekan total debit = total kredit
    const parsed = transaksiSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }
    const { tanggal, deskripsi, jenis_transaksi, details } = parsed.data;

    // total_amount = total sisi debit (sama dengan total kredit)
    const totalAmount = details.reduce((s, d) => s + d.debit, 0);

    const newId = await withTransaction(async (conn) => {
      // 1. Insert header transaksi
      const [res]: any = await conn.execute(
        "INSERT INTO transactions (tanggal, deskripsi, jenis_transaksi, total_amount) VALUES (?, ?, ?, ?)",
        [tanggal, deskripsi, jenis_transaksi ?? null, totalAmount]
      );
      const transactionId = res.insertId;

      // 2. Insert tiap baris detail.
      //    Trigger trg_jurnal_insert otomatis mengisi journal_entries.
      for (const d of details) {
        await conn.execute(
          "INSERT INTO transaction_details (transaction_id, kode_akun, debit, kredit) VALUES (?, ?, ?, ?)",
          [transactionId, d.kode_akun, d.debit, d.kredit]
        );
      }
      return transactionId;
    });

    return NextResponse.json(
      { message: "Transaksi berhasil disimpan", id: newId },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("POST /api/transaksi error:", err);
    // Tangani error foreign key (kode akun tidak ada)
    if (err?.code === "ER_NO_REFERENCED_ROW_2") {
      return NextResponse.json(
        { error: "Ada kode akun yang tidak terdaftar di Chart of Accounts" },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Gagal menyimpan transaksi" }, { status: 500 });
  }
}
