import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function migrate() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'jamindan_emergency'
  });

  try {
    console.log("Adding location_address to incidents...");
    await db.query(`ALTER TABLE incidents ADD COLUMN location_address VARCHAR(255) NULL`);
    console.log("Success.");
  } catch (err) {
    console.error("Error (might already exist):", err.message);
  }

  try {
    console.log("Adding push_subscription to users...");
    await db.query(`ALTER TABLE users ADD COLUMN push_subscription TEXT NULL`);
    console.log("Success.");
  } catch (err) {
    console.error("Error (might already exist):", err.message);
  }

  await db.end();
}

migrate();
