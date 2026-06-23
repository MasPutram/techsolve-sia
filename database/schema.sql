-- =============================================================
--  TechSolve Consulting - Sistem Informasi Akuntansi (UAS SIA)
--  File   : schema.sql
--  Isi    : CREATE DATABASE + CREATE TABLE + CREATE TRIGGER
--  Catatan: Jalankan file ini DULU, baru kemudian seed.sql
-- =============================================================

-- Buat database bila belum ada, lalu pakai
CREATE DATABASE IF NOT EXISTS techsolve_sia
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE techsolve_sia;

-- Urutan DROP dibalik (anak dulu, induk belakangan) supaya tidak kena FK
DROP TRIGGER IF EXISTS trg_jurnal_insert;
DROP TRIGGER IF EXISTS trg_jurnal_update;
DROP TRIGGER IF EXISTS trg_jurnal_delete;
DROP TABLE  IF EXISTS journal_entries;
DROP TABLE  IF EXISTS transaction_details;
DROP TABLE  IF EXISTS transactions;
DROP TABLE  IF EXISTS chart_of_accounts;

-- -------------------------------------------------------------
-- 1. CHART OF ACCOUNTS (master daftar akun / bagan akun)
-- -------------------------------------------------------------
CREATE TABLE chart_of_accounts (
  kode_akun    VARCHAR(10)  NOT NULL,                 -- contoh: 1101, 4101
  nama_akun    VARCHAR(100) NOT NULL,                 -- contoh: Kas, Pendapatan Jasa
  kategori     ENUM('Aset','Kewajiban','Ekuitas','Pendapatan','Beban') NOT NULL,
  saldo_normal ENUM('Debit','Kredit') NOT NULL,       -- saldo normal akun
  PRIMARY KEY (kode_akun)
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- 2. TRANSACTIONS (header / kepala transaksi)
-- -------------------------------------------------------------
CREATE TABLE transactions (
  id              INT          NOT NULL AUTO_INCREMENT,
  tanggal         DATE         NOT NULL,
  deskripsi       VARCHAR(255) NOT NULL,
  jenis_transaksi VARCHAR(50)  DEFAULT NULL,
  total_amount    DECIMAL(15,2) NOT NULL DEFAULT 0,    -- nominal total transaksi
  created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- 3. TRANSACTION_DETAILS (baris detail double-entry)
--    Satu transaksi punya >= 2 baris (minimal 1 debit & 1 kredit)
-- -------------------------------------------------------------
CREATE TABLE transaction_details (
  id             INT          NOT NULL AUTO_INCREMENT,
  transaction_id INT          NOT NULL,
  kode_akun      VARCHAR(10)  NOT NULL,
  debit          DECIMAL(15,2) NOT NULL DEFAULT 0,
  kredit         DECIMAL(15,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  -- Hapus detail otomatis bila header transaksi dihapus
  CONSTRAINT fk_detail_transaction
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
  CONSTRAINT fk_detail_akun
    FOREIGN KEY (kode_akun) REFERENCES chart_of_accounts(kode_akun)
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- 4. JOURNAL_ENTRIES (buku jurnal)
--    PENTING: tabel ini TIDAK diisi manual.
--    Seluruh isinya dihasilkan OTOMATIS oleh trigger dari
--    tabel transaction_details. Laporan keuangan dihitung
--    dari tabel ini.
-- -------------------------------------------------------------
CREATE TABLE journal_entries (
  id                 INT          NOT NULL AUTO_INCREMENT,
  tanggal            DATE         NOT NULL,
  deskripsi          VARCHAR(255) DEFAULT NULL,
  kode_akun          VARCHAR(10)  NOT NULL,
  debit              DECIMAL(15,2) NOT NULL DEFAULT 0,
  kredit             DECIMAL(15,2) NOT NULL DEFAULT 0,
  ref_transaction_id INT          DEFAULT NULL,        -- jejak ke header transaksi
  ref_detail_id      INT          DEFAULT NULL,        -- link 1:1 ke baris detail (untuk UPDATE/DELETE presisi)
  PRIMARY KEY (id),
  CONSTRAINT fk_jurnal_akun
    FOREIGN KEY (kode_akun) REFERENCES chart_of_accounts(kode_akun),
  CONSTRAINT fk_jurnal_transaction
    FOREIGN KEY (ref_transaction_id) REFERENCES transactions(id)
) ENGINE=InnoDB;

-- =============================================================
--  TRIGGER  (INTI OTOMATISASI - level MySQL, BUKAN JavaScript)
--  Cek dengan perintah:  SHOW TRIGGERS;
-- =============================================================

DELIMITER $$

-- -------------------------------------------------------------
-- TRIGGER 1: AFTER INSERT pada transaction_details
-- Setiap baris detail baru -> otomatis dibuat entri jurnal.
-- Tanggal & deskripsi diambil dari header transaksi.
-- -------------------------------------------------------------
CREATE TRIGGER trg_jurnal_insert
AFTER INSERT ON transaction_details
FOR EACH ROW
BEGIN
  DECLARE v_tanggal   DATE;
  DECLARE v_deskripsi VARCHAR(255);

  -- Ambil tanggal & deskripsi dari header transaksi terkait
  SELECT tanggal, deskripsi
    INTO v_tanggal, v_deskripsi
    FROM transactions
   WHERE id = NEW.transaction_id;

  INSERT INTO journal_entries
    (tanggal, deskripsi, kode_akun, debit, kredit, ref_transaction_id, ref_detail_id)
  VALUES
    (v_tanggal, v_deskripsi, NEW.kode_akun, NEW.debit, NEW.kredit,
     NEW.transaction_id, NEW.id);
END$$

-- -------------------------------------------------------------
-- TRIGGER 2: AFTER UPDATE pada transaction_details
-- Bila baris detail diubah -> entri jurnal terkait ikut diperbarui.
-- Pencocokan via ref_detail_id = OLD.id (presisi 1:1).
-- -------------------------------------------------------------
CREATE TRIGGER trg_jurnal_update
AFTER UPDATE ON transaction_details
FOR EACH ROW
BEGIN
  DECLARE v_tanggal   DATE;
  DECLARE v_deskripsi VARCHAR(255);

  SELECT tanggal, deskripsi
    INTO v_tanggal, v_deskripsi
    FROM transactions
   WHERE id = NEW.transaction_id;

  UPDATE journal_entries
     SET tanggal            = v_tanggal,
         deskripsi          = v_deskripsi,
         kode_akun          = NEW.kode_akun,
         debit              = NEW.debit,
         kredit             = NEW.kredit,
         ref_transaction_id = NEW.transaction_id
   WHERE ref_detail_id = OLD.id;
END$$

-- -------------------------------------------------------------
-- TRIGGER 3: AFTER DELETE pada transaction_details
-- Bila baris detail dihapus -> entri jurnal terkait ikut dihapus.
-- -------------------------------------------------------------
CREATE TRIGGER trg_jurnal_delete
AFTER DELETE ON transaction_details
FOR EACH ROW
BEGIN
  DELETE FROM journal_entries
   WHERE ref_detail_id = OLD.id;
END$$

DELIMITER ;

-- Selesai. Lanjut import seed.sql untuk mengisi data contoh.
