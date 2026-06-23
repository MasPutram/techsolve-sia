// =============================================================
//  /api/laporan/laba-rugi  -> GET
//  Dihitung dari journal_entries (lihat lib/laporan.ts)
// =============================================================

import { NextResponse } from "next/server";
import { hitungLabaRugi } from "@/lib/laporan";

export async function GET() {
  try {
    const hasil = await hitungLabaRugi();
    return NextResponse.json({ data: hasil });
  } catch (err) {
    console.error("GET /api/laporan/laba-rugi error:", err);
    return NextResponse.json({ error: "Gagal menghitung laba rugi" }, { status: 500 });
  }
}
