
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();
async function checkData() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '3306'),
  });
  try {
    const [rows] = await pool.execute('SELECT id, LEFT(content, 50) as snippet FROM products');
    console.log('Products in DB:', rows);
    const [sales] = await pool.execute('SELECT id FROM sales') as any[];
    console.log('Sales in DB:', sales.length);
    const [settings] = await pool.execute('SELECT id, LEFT(content, 50) as snippet FROM settings');
    console.log('Settings in DB:', settings);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
checkData();
