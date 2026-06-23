// =============================================================
//  /api/akun  -> GET (daftar akun), POST (tambah akun)
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { akunSchema } from "@/lib/validation";
import type { Akun } from "@/lib/types";

// GET: ambil seluruh Chart of Accounts, diurutkan berdasarkan kode
export async function GET() {
  try {
    const akun = await query<Akun>(
      "SELECT kode_akun, nama_akun, kategori, saldo_normal FROM chart_of_accounts ORDER BY kode_akun ASC"
    );
    return NextResponse.json({ data: akun });
  } catch (err) {
    console.error("GET /api/akun error:", err);
    return NextResponse.json({ error: "Gagal mengambil data akun" }, { status: 500 });
  }
}

// POST: tambah akun baru
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Validasi input dengan zod
    const parsed = akunSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }
    const { kode_akun, nama_akun, kategori, saldo_normal } = parsed.data;

    // Cek duplikasi kode akun
    const existing = await query(
      "SELECT kode_akun FROM chart_of_accounts WHERE kode_akun = ?",
      [kode_akun]
    );
    if (existing.length > 0) {
      return NextResponse.json(
        { error: `Kode akun ${kode_akun} sudah dipakai` },
        { status: 409 }
      );
    }

    await query(
      "INSERT INTO chart_of_accounts (kode_akun, nama_akun, kategori, saldo_normal) VALUES (?, ?, ?, ?)",
      [kode_akun, nama_akun, kategori, saldo_normal]
    );

    return NextResponse.json(
      { message: "Akun berhasil ditambahkan", data: parsed.data },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/akun error:", err);
    return NextResponse.json({ error: "Gagal menambah akun" }, { status: 500 });
  }
}
