// =============================================================
//  lib/db.ts
//  Koneksi database MySQL menggunakan mysql2/promise (raw query).
//  Memakai connection pool agar koneksi reusable & efisien.
//  Sengaja TIDAK pakai ORM (Prisma) supaya trigger DB-level
//  tetap transparan dan bisa didemokan ke dosen.
// =============================================================

import mysql from "mysql2/promise";

// Pool koneksi (singleton). Di mode dev Next.js, modul bisa
// di-reload berkali-kali, jadi pool disimpan di globalThis agar
// tidak membuat pool baru terus-menerus.
const globalForDb = globalThis as unknown as {
  pool: mysql.Pool | undefined;
};

export const pool =
  globalForDb.pool ??
  mysql.createPool({
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASS ?? "",
    database: process.env.DB_NAME ?? "techsolve_sia",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // decimalNumbers: kembalikan DECIMAL sebagai number JS, bukan string,
    // supaya nominal uang mudah dihitung di laporan.
    decimalNumbers: true,
    dateStrings: true, // kembalikan DATE sebagai 'YYYY-MM-DD' (hindari isu timezone)
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool;
}

/**
 * Helper query generik. Mengembalikan baris hasil query.
 * @param sql    perintah SQL dengan placeholder `?`
 * @param params nilai untuk placeholder (mencegah SQL injection)
 */
export async function query<T = any>(
  sql: string,
  params: any[] = []
): Promise<T[]> {
  const [rows] = await pool.execute(sql, params);
  return rows as T[];
}

/**
 * Menjalankan sekumpulan operasi dalam satu transaksi DB.
 * Dipakai saat input transaksi akuntansi (insert header + detail)
 * agar bersifat atomik: kalau salah satu gagal, semuanya di-rollback.
 */
export async function withTransaction<T>(
  callback: (conn: mysql.PoolConnection) => Promise<T>
): Promise<T> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await callback(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
