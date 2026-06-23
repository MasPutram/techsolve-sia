# Screenshots

Letakkan screenshot tiap fitur di folder ini, lalu rujuk dari `README.md` utama.

Daftar yang disarankan (dengan dev server `npm run dev` berjalan di http://localhost:3000):

| File | Halaman / Bukti |
|---|---|
| `dashboard.png` | http://localhost:3000/ |
| `akun.png` | /akun (tabel + form CRUD) |
| `transaksi-baru.png` | /transaksi/baru (form double-entry, indikator "Seimbang") |
| `transaksi.png` | /transaksi (daftar transaksi) |
| `jurnal.png` | /jurnal (jurnal umum + filter tanggal) |
| `buku-besar.png` | /buku-besar (pilih akun → saldo berjalan) |
| `laba-rugi.png` | /laporan/laba-rugi |
| `perubahan-modal.png` | /laporan/perubahan-modal |
| `neraca.png` | /laporan/neraca (badge "Neraca Seimbang") |
| `show-triggers.png` | Hasil `SHOW TRIGGERS;` di MySQL Workbench (bukti trigger DB) |

Tips: untuk `show-triggers.png`, jalankan di Workbench:
```sql
USE techsolve_sia;
SHOW TRIGGERS;
```
lalu screenshot hasilnya — ini bukti kuat bahwa trigger ada di level MySQL.
