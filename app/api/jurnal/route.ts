// =============================================================
//  /api/jurnal  -> GET (jurnal umum, dengan filter rentang tanggal)
//
//  Data diambil dari journal_entries (hasil trigger).
//  Query param opsional: ?start=YYYY-MM-DD&end=YYYY-MM-DD
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    // Bangun WHERE dinamis berdasarkan filter tanggal
    const where: string[] = [];
    const args: any[] = [];
    if (start) {
      where.push("j.tanggal >= ?");
      args.push(start);
    }
    if (end) {
      where.push("j.tanggal <= ?");
      args.push(end);
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const data = await query<any>(
      `SELECT j.id, j.tanggal, j.deskripsi, j.kode_akun, coa.nama_akun,
              j.debit, j.kredit, j.ref_transaction_id
         FROM journal_entries j
         JOIN chart_of_accounts coa ON coa.kode_akun = j.kode_akun
         ${whereSql}
        ORDER BY j.tanggal ASC, j.ref_transaction_id ASC, j.id ASC`,
      args
    );

    // Hitung total debit & kredit untuk footer tabel
    const totalDebit = data.reduce((s, r) => s + Number(r.debit), 0);
    const totalKredit = data.reduce((s, r) => s + Number(r.kredit), 0);

    return NextResponse.json({
      data,
      summary: { total_debit: totalDebit, total_kredit: totalKredit },
    });
  } catch (err) {
    console.error("GET /api/jurnal error:", err);
    return NextResponse.json({ error: "Gagal mengambil jurnal" }, { status: 500 });
  }
}
