
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config({ override: true });

async function testConnection() {
  console.log('Testing connection with:');
  console.log('Host:', process.env.DB_HOST);
  console.log('User:', process.env.DB_USER);
  console.log('DB:', process.env.DB_NAME);

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT || '3306'),
    });
    console.log('Successfully connected!');
    await connection.end();
  } catch (err) {
    console.error('Connection failed:');
    console.error(err);
  }
}

testConnection();
