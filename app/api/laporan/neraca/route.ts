// =============================================================
//  /api/laporan/neraca  -> GET
//  Aset = Kewajiban + Ekuitas (harus balance)
// =============================================================

import { NextResponse } from "next/server";
import { hitungNeraca } from "@/lib/laporan";

export async function GET() {
  try {
    const hasil = await hitungNeraca();
    return NextResponse.json({ data: hasil });
  } catch (err) {
    console.error("GET /api/laporan/neraca error:", err);
    return NextResponse.json({ error: "Gagal menghitung neraca" }, { status: 500 });
  }
}
