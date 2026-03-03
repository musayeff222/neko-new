import express from 'express';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // --- DATABASE KONFİQURASİYASI ---
  // Hostinger-də çox vaxt host 'localhost' olur. 
  // Amma şifrənizin doğruluğunu PANEL-dən mütləq yoxlayın.
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '3306', 10),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  const initDB = async () => {
    try {
      await pool.execute(`CREATE TABLE IF NOT EXISTS messages (id INT AUTO_INCREMENT PRIMARY KEY, question TEXT, answer TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
      await pool.execute(`CREATE TABLE IF NOT EXISTS products (id VARCHAR(100) PRIMARY KEY, content LONGTEXT, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`);
      await pool.execute(`CREATE TABLE IF NOT EXISTS sales (id VARCHAR(100) PRIMARY KEY, content LONGTEXT, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`);
      await pool.execute(`CREATE TABLE IF NOT EXISTS customers (id VARCHAR(100) PRIMARY KEY, content LONGTEXT, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`);
      await pool.execute(`CREATE TABLE IF NOT EXISTS scraps (id VARCHAR(100) PRIMARY KEY, content LONGTEXT, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`);
      await pool.execute(`CREATE TABLE IF NOT EXISTS settings (id VARCHAR(50) PRIMARY KEY, content LONGTEXT, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`);
      console.log('✅ Database tables initialized');
    } catch (err) {
      console.error('❌ Database initialization failed:', err.message);
      // Baza işləməsə də proqramın davam etməsi üçün:
    }
  };

  await initDB();

  // --- AI KONFİQURASİYASI (DÜZƏLDİLMİŞ HİSSƏ) ---
  const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY || "");
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    try {
      // AI Cavabının alınması
      const result = await model.generateContent(message);
      const response = await result.response;
      const aiResponse = response.text();

      try {
        await pool.execute('INSERT INTO messages (question, answer) VALUES (?, ?)', [message, aiResponse]);
      } catch (dbErr) {
        console.warn('DB Log error:', dbErr.message);
      }

      res.json({ question: message, answer: aiResponse, status: 'success' });
    } catch (error) {
      console.error('AI Error:', error);
      res.status(500).json({ error: 'AI cavab verə bilmədi.' });
    }
  });

  // --- API ROUTES ---
  const allowedTypes = ['products', 'sales', 'customers', 'scraps', 'settings'];

  app.get('/api/data/:type', async (req, res) => {
    const { type } = req.params;
    if (!allowedTypes.includes(type)) return res.status(400).json({ error: 'Invalid type' });
    try {
      const [rows] = await pool.execute(`SELECT content FROM ${type}`);
      const data = rows.map((row) => JSON.parse(row.content));
      res.json(type === 'settings' ? (data[0] || null) : data);
    } catch (error) {
      res.status(500).json({ error: 'Fetch failed' });
    }
  });

  app.post('/api/data/:type', async (req, res) => {
    const { type } = req.params;
    const { data } = req.body;
    if (!allowedTypes.includes(type)) return res.status(400).json({ error: 'Invalid type' });

    try {
      if (type === 'settings') {
        const content = JSON.stringify(data);
        await pool.execute(`INSERT INTO settings (id, content) VALUES ('current', ?) ON DUPLICATE KEY UPDATE content = ?`, [content, content]);
      } else if (Array.isArray(data)) {
        const connection = await pool.getConnection();
        await connection.beginTransaction();
        try {
          await connection.execute(`DELETE FROM ${type}`);
          if (data.length > 0) {
            const values = data.map(item => [item.id || Math.random().toString(36).substr(2, 9), JSON.stringify(item)]);
            await connection.query(`INSERT INTO ${type} (id, content) VALUES ?`, [values]);
          }
          await connection.commit();
        } catch (err) {
          await connection.rollback();
          throw err;
        } finally {
          connection.release();
        }
      }
      res.json({ status: 'success' });
    } catch (error) {
      res.status(500).json({ error: 'Save failed' });
    }
  });

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  // --- SPA & STATIC FILES ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('(.*)', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('💥 Fatal Server Error:', err);
});
