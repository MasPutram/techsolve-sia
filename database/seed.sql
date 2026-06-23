-- =============================================================
--  TechSolve Consulting - Sistem Informasi Akuntansi (UAS SIA)
--  File   : seed.sql
--  Isi    : Data awal Chart of Accounts + 7 transaksi contoh
--  Catatan: Jalankan SETELAH schema.sql.
--           journal_entries TIDAK diisi di sini -> terisi
--           otomatis oleh trigger saat detail di-INSERT.
-- =============================================================

USE techsolve_sia;

-- Matikan safe update mode (MySQL Workbench memblokir DELETE tanpa WHERE-key).
-- Matikan juga FK check sementara agar pembersihan data tidak terhalang relasi.
SET SQL_SAFE_UPDATES = 0;
SET FOREIGN_KEY_CHECKS = 0;

-- Bersihkan data lama (urutan anak -> induk)
DELETE FROM journal_entries;
DELETE FROM transaction_details;
DELETE FROM transactions;
DELETE FROM chart_of_accounts;

-- Nyalakan kembali pengecekan FK untuk proses insert di bawah
SET FOREIGN_KEY_CHECKS = 1;

-- Reset AUTO_INCREMENT supaya id rapi mulai dari 1
ALTER TABLE journal_entries     AUTO_INCREMENT = 1;
ALTER TABLE transaction_details AUTO_INCREMENT = 1;
ALTER TABLE transactions        AUTO_INCREMENT = 1;

-- -------------------------------------------------------------
-- CHART OF ACCOUNTS (standar 4-digit)
-- -------------------------------------------------------------
INSERT INTO chart_of_accounts (kode_akun, nama_akun, kategori, saldo_normal) VALUES
  -- 1xxx Aset (saldo normal Debit)
  ('1101', 'Kas',                              'Aset',       'Debit'),
  ('1102', 'Bank',                             'Aset',       'Debit'),
  ('1103', 'Piutang Usaha',                    'Aset',       'Debit'),
  ('1104', 'Perlengkapan',                     'Aset',       'Debit'),
  ('1201', 'Peralatan',                        'Aset',       'Debit'),
  ('1202', 'Akumulasi Penyusutan Peralatan',   'Aset',       'Kredit'), -- kontra-aset
  -- 2xxx Kewajiban (saldo normal Kredit)
  ('2101', 'Utang Usaha',                      'Kewajiban',  'Kredit'),
  ('2102', 'Utang Bank',                       'Kewajiban',  'Kredit'),
  -- 3xxx Ekuitas (saldo normal Kredit)
  ('3101', 'Modal Pemilik',                    'Ekuitas',    'Kredit'),
  ('3102', 'Prive',                            'Ekuitas',    'Debit'),  -- kontra-ekuitas
  -- 4xxx Pendapatan (saldo normal Kredit)
  ('4101', 'Pendapatan Jasa Konsultan',        'Pendapatan', 'Kredit'),
  -- 5xxx Beban (saldo normal Debit)
  ('5101', 'Beban Gaji',                       'Beban',      'Debit'),
  ('5102', 'Beban Sewa',                       'Beban',      'Debit'),
  ('5103', 'Beban Listrik & Internet',         'Beban',      'Debit'),
  ('5104', 'Beban Perlengkapan',               'Beban',      'Debit'),
  ('5105', 'Beban Penyusutan',                 'Beban',      'Debit');

-- -------------------------------------------------------------
-- TRANSAKSI 1 - Setoran modal awal (01/06/2026)
-- Debit  Kas (1101)            50.000.000
-- Kredit Modal Pemilik (3101)  50.000.000
-- -------------------------------------------------------------
INSERT INTO transactions (tanggal, deskripsi, jenis_transaksi, total_amount)
VALUES ('2026-06-01', 'Setoran modal awal', 'Penerimaan Modal', 50000000);
SET @t1 = LAST_INSERT_ID();
INSERT INTO transaction_details (transaction_id, kode_akun, debit, kredit) VALUES
  (@t1, '1101', 50000000, 0),
  (@t1, '3101', 0, 50000000);

-- -------------------------------------------------------------
-- TRANSAKSI 2 - Beli peralatan komputer tunai (02/06/2026)
-- Debit  Peralatan (1201)  20.000.000
-- Kredit Kas (1101)         20.000.000
-- -------------------------------------------------------------
INSERT INTO transactions (tanggal, deskripsi, jenis_transaksi, total_amount)
VALUES ('2026-06-02', 'Beli peralatan komputer tunai', 'Pembelian', 20000000);
SET @t2 = LAST_INSERT_ID();
INSERT INTO transaction_details (transaction_id, kode_akun, debit, kredit) VALUES
  (@t2, '1201', 20000000, 0),
  (@t2, '1101', 0, 20000000);

-- -------------------------------------------------------------
-- TRANSAKSI 3 - Beli perlengkapan kantor (03/06/2026)
-- Debit  Perlengkapan (1104)  2.000.000
-- Kredit Kas (1101)            2.000.000
-- -------------------------------------------------------------
INSERT INTO transactions (tanggal, deskripsi, jenis_transaksi, total_amount)
VALUES ('2026-06-03', 'Beli perlengkapan kantor', 'Pembelian', 2000000);
SET @t3 = LAST_INSERT_ID();
INSERT INTO transaction_details (transaction_id, kode_akun, debit, kredit) VALUES
  (@t3, '1104', 2000000, 0),
  (@t3, '1101', 0, 2000000);

-- -------------------------------------------------------------
-- TRANSAKSI 4 - Terima pendapatan jasa instalasi (10/06/2026)
-- Debit  Kas (1101)                     8.000.000
-- Kredit Pendapatan Jasa (4101)         8.000.000
-- -------------------------------------------------------------
INSERT INTO transactions (tanggal, deskripsi, jenis_transaksi, total_amount)
VALUES ('2026-06-10', 'Terima pendapatan jasa instalasi', 'Pendapatan', 8000000);
SET @t4 = LAST_INSERT_ID();
INSERT INTO transaction_details (transaction_id, kode_akun, debit, kredit) VALUES
  (@t4, '1101', 8000000, 0),
  (@t4, '4101', 0, 8000000);

-- -------------------------------------------------------------
-- TRANSAKSI 5 - Bayar gaji karyawan (15/06/2026)
-- Debit  Beban Gaji (5101)  3.000.000
-- Kredit Kas (1101)          3.000.000
-- -------------------------------------------------------------
INSERT INTO transactions (tanggal, deskripsi, jenis_transaksi, total_amount)
VALUES ('2026-06-15', 'Bayar gaji karyawan', 'Beban', 3000000);
SET @t5 = LAST_INSERT_ID();
INSERT INTO transaction_details (transaction_id, kode_akun, debit, kredit) VALUES
  (@t5, '5101', 3000000, 0),
  (@t5, '1101', 0, 3000000);

-- -------------------------------------------------------------
-- TRANSAKSI 6 - Bayar sewa kantor (20/06/2026)
-- Debit  Beban Sewa (5102)  1.500.000
-- Kredit Kas (1101)          1.500.000
-- -------------------------------------------------------------
INSERT INTO transactions (tanggal, deskripsi, jenis_transaksi, total_amount)
VALUES ('2026-06-20', 'Bayar sewa kantor', 'Beban', 1500000);
SET @t6 = LAST_INSERT_ID();
INSERT INTO transaction_details (transaction_id, kode_akun, debit, kredit) VALUES
  (@t6, '5102', 1500000, 0),
  (@t6, '1101', 0, 1500000);

-- -------------------------------------------------------------
-- TRANSAKSI 7 - Pengambilan pribadi / Prive (25/06/2026)
-- Debit  Prive (3102)  1.000.000
-- Kredit Kas (1101)     1.000.000
-- -------------------------------------------------------------
INSERT INTO transactions (tanggal, deskripsi, jenis_transaksi, total_amount)
VALUES ('2026-06-25', 'Pengambilan pribadi (Prive)', 'Prive', 1000000);
SET @t7 = LAST_INSERT_ID();
INSERT INTO transaction_details (transaction_id, kode_akun, debit, kredit) VALUES
  (@t7, '3102', 1000000, 0),
  (@t7, '1101', 0, 1000000);

-- =============================================================
--  VERIFIKASI CEPAT (jalankan manual setelah import bila perlu)
--  Trigger seharusnya sudah mengisi journal_entries:
--
--    SELECT COUNT(*) FROM journal_entries;   -- harus 14 (7 transaksi x 2 baris)
--    SELECT SUM(debit), SUM(kredit) FROM journal_entries; -- harus seimbang
--    SHOW TRIGGERS;                           -- harus tampil 3 trigger
-- =============================================================
