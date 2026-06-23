// =============================================================
//  /api/transaksi/[id]  -> GET (satu transaksi), PUT (edit), DELETE
//
//  PUT  : detail lama dihapus (memicu trg_jurnal_delete) lalu
//         detail baru di-insert (memicu trg_jurnal_insert) -> jurnal sinkron.
//  DELETE: detail dihapus DULU (memicu trg_jurnal_delete) baru header.
//         Tidak mengandalkan ON DELETE CASCADE karena cascade FK
//         TIDAK memicu trigger di MySQL.
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { query, withTransaction } from "@/lib/db";
import { transaksiSchema } from "@/lib/validation";

// GET: detail satu transaksi (header + baris detail)
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    const header = await query<any>(
      "SELECT id, tanggal, deskripsi, jenis_transaksi, total_amount FROM transactions WHERE id = ?",
      [id]
    );
    if (header.length === 0) {
      return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
    }
    const details = await query<any>(
      `SELECT td.id, td.kode_akun, coa.nama_akun, td.debit, td.kredit
         FROM transaction_details td
         JOIN chart_of_accounts coa ON coa.kode_akun = td.kode_akun
        WHERE td.transaction_id = ?
        ORDER BY td.id ASC`,
      [id]
    );
    return NextResponse.json({ data: { ...header[0], details } });
  } catch (err) {
    console.error("GET /api/transaksi/[id] error:", err);
    return NextResponse.json({ error: "Gagal mengambil transaksi" }, { status: 500 });
  }
}

// PUT: edit transaksi (ganti semua detail) secara atomik
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    const body = await req.json();

    const parsed = transaksiSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }
    const { tanggal, deskripsi, jenis_transaksi, details } = parsed.data;
    const totalAmount = details.reduce((s, d) => s + d.debit, 0);

    await withTransaction(async (conn) => {
      // 1. Update header
      await conn.execute(
        "UPDATE transactions SET tanggal = ?, deskripsi = ?, jenis_transaksi = ?, total_amount = ? WHERE id = ?",
        [tanggal, deskripsi, jenis_transaksi ?? null, totalAmount, id]
      );
      // 2. Hapus detail lama -> trigger menghapus entri jurnal terkait
      await conn.execute("DELETE FROM transaction_details WHERE transaction_id = ?", [id]);
      // 3. Insert detail baru -> trigger membuat entri jurnal baru
      for (const d of details) {
        await conn.execute(
          "INSERT INTO transaction_details (transaction_id, kode_akun, debit, kredit) VALUES (?, ?, ?, ?)",
          [id, d.kode_akun, d.debit, d.kredit]
        );
      }
    });

    return NextResponse.json({ message: "Transaksi berhasil diperbarui" });
  } catch (err: any) {
    console.error("PUT /api/transaksi/[id] error:", err);
    if (err?.code === "ER_NO_REFERENCED_ROW_2") {
      return NextResponse.json(
        { error: "Ada kode akun yang tidak terdaftar di Chart of Accounts" },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Gagal memperbarui transaksi" }, { status: 500 });
  }
}

// DELETE: hapus transaksi (detail dulu agar trigger jalan, lalu header)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    await withTransaction(async (conn) => {
      // Hapus detail dulu -> memicu trg_jurnal_delete (jurnal ikut terhapus)
      await conn.execute("DELETE FROM transaction_details WHERE transaction_id = ?", [id]);
      // Baru hapus header transaksi
      await conn.execute("DELETE FROM transactions WHERE id = ?", [id]);
    });
    return NextResponse.json({ message: "Transaksi berhasil dihapus" });
  } catch (err) {
    console.error("DELETE /api/transaksi/[id] error:", err);
    return NextResponse.json({ error: "Gagal menghapus transaksi" }, { status: 500 });
  }
}
