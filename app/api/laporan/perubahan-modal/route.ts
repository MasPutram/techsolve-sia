// =============================================================
//  /api/laporan/perubahan-modal  -> GET
//  Modal Akhir = Modal Awal + Laba Bersih - Prive
// =============================================================

import { NextResponse } from "next/server";
import { hitungPerubahanModal } from "@/lib/laporan";

export async function GET() {
  try {
    const hasil = await hitungPerubahanModal();
    return NextResponse.json({ data: hasil });
  } catch (err) {
    console.error("GET /api/laporan/perubahan-modal error:", err);
    return NextResponse.json({ error: "Gagal menghitung perubahan modal" }, { status: 500 });
  }
}
