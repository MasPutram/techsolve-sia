// =============================================================
//  lib/format.ts
//  Helper format tampilan (mata uang & tanggal) gaya Indonesia.
// =============================================================

// Format angka jadi Rupiah, mis. 50000000 -> "Rp50.000.000"
export function formatRupiah(angka: number | string): string {
  const n = Number(angka) || 0;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

// Format angka biasa dengan pemisah ribuan, mis. 50000000 -> "50.000.000"
export function formatAngka(angka: number | string): string {
  const n = Number(angka) || 0;
  return new Intl.NumberFormat("id-ID").format(n);
}

// Ubah tanggal "2026-06-01" -> "01 Jun 2026"
export function formatTanggal(tanggal: string): string {
  if (!tanggal) return "-";
  // ambil bagian tanggal saja (jaga-jaga ada timestamp)
  const iso = tanggal.slice(0, 10);
  const [tahun, bulan, hari] = iso.split("-");
  const namaBulan = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
  ];
  const idxBulan = Number(bulan) - 1;
  if (Number.isNaN(idxBulan) || !namaBulan[idxBulan]) return iso;
  return `${hari} ${namaBulan[idxBulan]} ${tahun}`;
}
