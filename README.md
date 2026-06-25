# TechSolve Consulting — Sistem Informasi Akuntansi

Aplikasi akuntansi *end-to-end* untuk studi kasus **TechSolve Consulting** (bisnis jasa konsultan IT: instalasi jaringan, maintenance, service hardware/software, training karyawan). Dibangun untuk **UAS Sistem Informasi Akuntansi**.

Aplikasi mencatat transaksi dengan prinsip **double-entry**, lalu **otomatis** membentuk buku jurnal lewat **trigger MySQL**, dan menyusun laporan keuangan (Laba Rugi, Perubahan Modal, Neraca) langsung dari data jurnal.

---

## ✨ Fitur Utama

- **CRUD Chart of Accounts** — kelola daftar akun (kode, nama, kategori, saldo normal).
- **Input Transaksi double-entry** — form multi-baris dengan validasi **total debit = total kredit** (di frontend *dan* backend). Bisa edit & hapus.
- **Jurnal Umum** — seluruh entri jurnal (hasil trigger) dengan filter rentang tanggal.
- **Buku Besar** — mutasi per akun lengkap dengan **saldo berjalan** (*running balance*).
- **Laporan Keuangan Otomatis** — Laba Rugi, Perubahan Modal, dan Neraca, semuanya **dihitung dari tabel `journal_entries`**, bukan input manual.

---

## 🧰 Tech Stack

| Komponen | Teknologi |
|---|---|
| Framework | Next.js 14 (App Router) |
| Bahasa | TypeScript |
| Database | MySQL 8.0 |
| DB Driver | `mysql2/promise` (raw query, **tanpa ORM** — agar trigger DB transparan) |
| Styling | Tailwind CSS |
| Validasi | Zod |

> Kenapa tanpa ORM (seperti Prisma)? Karena inti penilaian ada pada **trigger level database**. Dengan raw query, logika trigger murni di MySQL dan bisa dibuktikan langsung lewat `SHOW TRIGGERS;`.

---

## 🚀 Cara Install & Menjalankan

### 1. Ekstrak & install dependency
Ekstrak `SIA-source-code.zip`, buka folder hasil ekstrak melalui terminal, lalu:
```bash
npm install
```

### 2. Import skema database (membuat tabel + trigger)
Lewat terminal:
```bash
mysql -u root -p < database/schema.sql
```
Atau lewat **MySQL Workbench**: `File → Open SQL Script → schema.sql → ⚡ Execute`.

### 3. Import data awal (Chart of Accounts + 7 transaksi contoh)
```bash
mysql -u root -p < database/seed.sql
```
> `seed.sql` **tidak** mengisi tabel `journal_entries`. Tabel itu akan terisi **otomatis** oleh trigger saat detail transaksi di-*insert*. Inilah bukti trigger bekerja.

### 4. Konfigurasi koneksi database
Salin `.env.example` menjadi `.env.local`, lalu sesuaikan dengan kredensial MySQL kamu:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=password_mysql_kamu
DB_NAME=techsolve_sia
```

### 5. Jalankan aplikasi
```bash
npm run dev
```
Buka **http://localhost:3000**.

### Verifikasi cepat trigger (opsional, di MySQL)
```sql
USE techsolve_sia;
SHOW TRIGGERS;                                 -- harus menampilkan 3 trigger
SELECT COUNT(*) FROM journal_entries;          -- harus 14 (7 transaksi x 2 baris)
SELECT SUM(debit), SUM(kredit) FROM journal_entries; -- harus seimbang: 85.500.000
```

---

## 🗺️ ERD (Entity Relationship Diagram)

```
┌───────────────────────────┐
│     chart_of_accounts     │  (master akun)
│───────────────────────────│
│ PK kode_akun   VARCHAR(10)│
│    nama_akun              │
│    kategori (ENUM)        │
│    saldo_normal (ENUM)    │
└───────────┬───────────────┘
            │ 1
            │            ┌───────────────────────────┐
            │            │       transactions        │  (header transaksi)
            │            │───────────────────────────│
            │            │ PK id          INT        │
            │            │    tanggal     DATE       │
            │            │    deskripsi              │
            │            │    jenis_transaksi        │
            │            │    total_amount           │
            │            └───────────┬───────────────┘
            │                        │ 1
            │ N                      │ N
┌───────────┴────────────────────────┴──────┐
│            transaction_details             │  (baris double-entry)
│────────────────────────────────────────────│
│ PK id              INT                      │
│ FK transaction_id  → transactions.id        │
│ FK kode_akun       → chart_of_accounts      │
│    debit           DECIMAL(15,2)            │
│    kredit          DECIMAL(15,2)            │
└───────────┬────────────────────────────────┘
            │ 1 : 1  (dibuat oleh TRIGGER)
            ▼
┌────────────────────────────────────────────┐
│              journal_entries               │  (buku jurnal — diisi trigger)
│────────────────────────────────────────────│
│ PK id                  INT                  │
│    tanggal, deskripsi                       │
│ FK kode_akun           → chart_of_accounts  │
│    debit, kredit       DECIMAL(15,2)        │
│ FK ref_transaction_id  → transactions.id    │
│    ref_detail_id       → transaction_details.id (link 1:1) │
└────────────────────────────────────────────┘
```

**Relasi:**
- `transactions` **1—N** `transaction_details` (satu transaksi punya banyak baris debit/kredit).
- `chart_of_accounts` **1—N** `transaction_details` (tiap baris menunjuk satu akun).
- `transaction_details` **1—1** `journal_entries` (tiap baris detail menghasilkan tepat satu entri jurnal, dibuat oleh trigger dan ditautkan via `ref_detail_id`).

> Kolom `ref_detail_id` ditambahkan agar trigger `UPDATE`/`DELETE` bisa menemukan baris jurnal yang tepat (presisi 1:1), meski sebuah transaksi memakai akun yang sama lebih dari sekali.

---

## 🔄 Alur Sistem (Transaksi → Trigger → Jurnal → Laporan)

```
[User input transaksi di UI]
        │  validasi double-entry (debit = kredit) di frontend
        ▼
[POST /api/transaksi]  ──► validasi ulang di backend (Zod) ──► DB transaction (atomik)
        │
        │  INSERT header ke `transactions`
        │  INSERT tiap baris ke `transaction_details`
        ▼
[TRIGGER MySQL: AFTER INSERT pada transaction_details]
        │  otomatis menulis baris ke `journal_entries`
        ▼
[journal_entries]  ◄── satu-satunya sumber kebenaran
        │
        ├──► Jurnal Umum (tampil apa adanya)
        ├──► Buku Besar (dikelompokkan per akun + saldo berjalan)
        └──► Laporan: Laba Rugi, Perubahan Modal, Neraca (diagregasi)
```

Saat transaksi **diedit**, baris detail lama dihapus (memicu trigger `DELETE`) lalu baris baru di-*insert* (memicu trigger `INSERT`), sehingga jurnal selalu sinkron. Saat transaksi **dihapus**, detail dihapus lebih dulu agar trigger `DELETE` jalan (FK cascade *tidak* memicu trigger di MySQL).

---

## ⚙️ Implementasi Trigger (Inti Otomatisasi)

Trigger dibuat **di level MySQL** (lihat `database/schema.sql`), **bukan** di JavaScript. Ketiganya dipasang pada tabel `transaction_details`:

```sql
-- 1) AFTER INSERT: setiap baris detail baru -> buat entri jurnal
CREATE TRIGGER trg_jurnal_insert
AFTER INSERT ON transaction_details
FOR EACH ROW
BEGIN
  DECLARE v_tanggal   DATE;
  DECLARE v_deskripsi VARCHAR(255);
  SELECT tanggal, deskripsi INTO v_tanggal, v_deskripsi
    FROM transactions WHERE id = NEW.transaction_id;
  INSERT INTO journal_entries
    (tanggal, deskripsi, kode_akun, debit, kredit, ref_transaction_id, ref_detail_id)
  VALUES
    (v_tanggal, v_deskripsi, NEW.kode_akun, NEW.debit, NEW.kredit,
     NEW.transaction_id, NEW.id);
END;

-- 2) AFTER UPDATE: baris detail berubah -> entri jurnal terkait ikut diperbarui
CREATE TRIGGER trg_jurnal_update
AFTER UPDATE ON transaction_details
FOR EACH ROW
BEGIN
  DECLARE v_tanggal   DATE;
  DECLARE v_deskripsi VARCHAR(255);
  SELECT tanggal, deskripsi INTO v_tanggal, v_deskripsi
    FROM transactions WHERE id = NEW.transaction_id;
  UPDATE journal_entries
     SET tanggal = v_tanggal, deskripsi = v_deskripsi,
         kode_akun = NEW.kode_akun, debit = NEW.debit, kredit = NEW.kredit,
         ref_transaction_id = NEW.transaction_id
   WHERE ref_detail_id = OLD.id;
END;

-- 3) AFTER DELETE: baris detail dihapus -> entri jurnal terkait ikut dihapus
CREATE TRIGGER trg_jurnal_delete
AFTER DELETE ON transaction_details
FOR EACH ROW
BEGIN
  DELETE FROM journal_entries WHERE ref_detail_id = OLD.id;
END;
```

Cek keberadaan trigger:
```sql
SHOW TRIGGERS;
```

---

## 📁 Struktur Folder

```
techsolve-sia/
├── app/
│   ├── layout.tsx                 # layout root (sidebar + konten)
│   ├── page.tsx                   # dashboard
│   ├── akun/                      # CRUD Chart of Accounts
│   ├── transaksi/                 # list + form input/edit transaksi
│   ├── jurnal/                    # jurnal umum + filter tanggal
│   ├── buku-besar/                # buku besar per akun (saldo berjalan)
│   ├── laporan/
│   │   ├── laba-rugi/
│   │   ├── perubahan-modal/
│   │   └── neraca/
│   └── api/                       # API routes (akun, transaksi, jurnal, buku-besar, laporan)
├── components/                    # Sidebar, PageHeader, TransaksiForm
├── lib/
│   ├── db.ts                      # koneksi MySQL pool + helper transaksi
│   ├── laporan.ts                 # perhitungan laporan dari journal_entries
│   ├── validation.ts              # skema Zod (validasi double-entry)
│   ├── format.ts                  # format Rupiah & tanggal
│   └── types.ts                   # tipe data bersama
├── database/
│   ├── schema.sql                 # CREATE TABLE + CREATE TRIGGER
│   ├── seed.sql                   # CoA + 7 transaksi contoh
│   └── ERD.png                    # (opsional, gambar ERD)
├── README.md
└── package.json
```

---

## 📊 Data Contoh & Hasil yang Diharapkan

7 transaksi contoh menghasilkan:

| Laporan | Nilai |
|---|---|
| Total Pendapatan | Rp 8.000.000 |
| Total Beban | Rp 4.500.000 |
| **Laba Bersih** | **Rp 3.500.000** |
| Modal Awal | Rp 50.000.000 |
| Prive | Rp 1.000.000 |
| **Modal Akhir** | **Rp 52.500.000** |
| **Total Aset = Total Pasiva** | **Rp 52.500.000** (Neraca balance ✓) |
| Saldo Kas (1101) | Rp 30.500.000 |

---

## 📸 Screenshot

> Tambahkan screenshot tiap fitur di sini (folder `screenshots/`).

| Fitur | Screenshot |
|---|---|
| Dashboard | `![Dashboard](screenshots/dashboard.png)` |
| Daftar Akun (CRUD) | `![Akun](screenshots/akun.png)` |
| Input Transaksi (double-entry) | `![Transaksi](screenshots/transaksi-baru.png)` |
| Jurnal Umum | `![Jurnal](screenshots/jurnal.png)` |
| Buku Besar | `![Buku Besar](screenshots/buku-besar.png)` |
| Laporan Laba Rugi | `![Laba Rugi](screenshots/laba-rugi.png)` |
| Laporan Perubahan Modal | `![Perubahan Modal](screenshots/perubahan-modal.png)` |
| Neraca | `![Neraca](screenshots/neraca.png)` |
| Bukti `SHOW TRIGGERS;` | `![Triggers](screenshots/show-triggers.png)` |

---

## 📝 Catatan Akademik

- Semua kolom uang memakai `DECIMAL(15,2)` (bukan `FLOAT`) untuk menghindari galat pembulatan.
- Komentar kode ditulis dalam Bahasa Indonesia untuk keperluan dokumentasi & presentasi.
- Penamaan variabel konsisten dengan istilah akuntansi (debit, kredit, saldo, akun, jurnal).

---

*Dibuat untuk UAS Sistem Informasi Akuntansi — TechSolve Consulting.*
