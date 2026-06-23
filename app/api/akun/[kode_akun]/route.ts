// =============================================================
//  /api/akun/[kode_akun]  -> PUT (edit), DELETE (hapus)
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { akunUpdateSchema } from "@/lib/validation";

// PUT: ubah data akun (nama/kategori/saldo_normal). Kode akun tidak diubah.
export async function PUT(
  req: NextRequest,
  { params }: { params: { kode_akun: string } }
) {
  try {
    const body = await req.json();
    const parsed = akunUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }
    const { nama_akun, kategori, saldo_normal } = parsed.data;

    await query(
      "UPDATE chart_of_accounts SET nama_akun = ?, kategori = ?, saldo_normal = ? WHERE kode_akun = ?",
      [nama_akun, kategori, saldo_normal, params.kode_akun]
    );

    return NextResponse.json({ message: "Akun berhasil diperbarui" });
  } catch (err) {
    console.error("PUT /api/akun error:", err);
    return NextResponse.json({ error: "Gagal memperbarui akun" }, { status: 500 });
  }
}

// DELETE: hapus akun. Ditolak bila akun sudah dipakai di transaksi/jurnal
// (akan melanggar foreign key) supaya integritas data terjaga.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { kode_akun: string } }
) {
  try {
    const kode = params.kode_akun;

    // Cek apakah akun masih dipakai di detail transaksi atau jurnal
    const dipakai = await query<{ jumlah: number }>(
      `SELECT
         (SELECT COUNT(*) FROM transaction_details WHERE kode_akun = ?) +
         (SELECT COUNT(*) FROM journal_entries WHERE kode_akun = ?) AS jumlah`,
      [kode, kode]
    );
    if (dipakai[0]?.jumlah > 0) {
      return NextResponse.json(
        { error: "Akun tidak bisa dihapus karena sudah dipakai di transaksi" },
        { status: 409 }
      );
    }

    await query("DELETE FROM chart_of_accounts WHERE kode_akun = ?", [kode]);
    return NextResponse.json({ message: "Akun berhasil dihapus" });
  } catch (err) {
    console.error("DELETE /api/akun error:", err);
    return NextResponse.json({ error: "Gagal menghapus akun" }, { status: 500 });
  }
}
