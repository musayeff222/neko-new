
import express, { Request, Response } from 'express';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import cors from 'cors';
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(cors({
    origin: true,
    credentials: true
  }));
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // MySQL Connection Pool
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '3306'),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  // Initialize Database Tables
  const initDB = async () => {
    try {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS messages (
          id INT AUTO_INCREMENT PRIMARY KEY,
          question TEXT,
          answer TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS products (
          id VARCHAR(100) PRIMARY KEY,
          content LONGTEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS sales (
          id VARCHAR(100) PRIMARY KEY,
          content LONGTEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS customers (
          id VARCHAR(100) PRIMARY KEY,
          content LONGTEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS scraps (
          id VARCHAR(100) PRIMARY KEY,
          content LONGTEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS settings (
          id VARCHAR(50) PRIMARY KEY,
          content LONGTEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('Database tables initialized');
    } catch (err) {
      console.error('Database initialization failed:', err);
    }
  };
  await initDB();

  // Initialize Gemini API
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

  // API Endpoint: /api/chat
  app.post('/api/chat', async (req: Request, res: Response) => {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: message,
        config: {
          systemInstruction: "Sən NEKO GOLD zərgərlik mağazasının süni intellekt köməkçisisən. Müştərilərə zərgərlik məmulatları, qızılın qiyməti, məhsul növləri (üzük, sırğa, boyunbağı və s.) haqqında məlumat verirsən. Cavabların qısa, peşəkar və mehriban olmalıdır. Azərbaycan dilində danışırsan."
        }
      });

      const aiResponse = response.text || 'Üzr istəyirik, hazırda cavab verə bilmirəm.';
      
      try {
        const sql = 'INSERT INTO messages (question, answer) VALUES (?, ?)';
        await pool.execute(sql, [message, aiResponse]);
      } catch (dbErr) {
        console.warn('Database logging failed, but AI responded:', dbErr);
      }

      res.json({
        question: message,
        answer: aiResponse,
        status: 'success'
      });

    } catch (error: any) {
      console.error('Error in /api/chat:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // Generic Data Sync Endpoints
  app.get('/api/data/:type', async (req: Request, res: Response) => {
    const type = req.params.type as string;
    const allowedTypes = ['products', 'sales', 'customers', 'scraps', 'settings'];
    
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid data type' });
    }

    try {
      const [rows] = await pool.execute(`SELECT content FROM ${type}`);
      const data = (rows as any[]).map(row => JSON.parse(row.content));
      
      // Settings is a special case, it's usually just one object
      if (type === 'settings') {
        res.json(data[0] || null);
      } else {
        res.json(data);
      }
    } catch (error) {
      console.error(`Failed to fetch ${type}:`, error);
      res.status(500).json({ error: 'Failed to fetch data' });
    }
  });

  app.post('/api/data/:type', async (req: Request, res: Response) => {
    const type = req.params.type as string;
    const { data } = req.body;
    const allowedTypes = ['products', 'sales', 'customers', 'scraps', 'settings'];

    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid data type' });
    }

    try {
      console.log(`Syncing ${type} with ${Array.isArray(data) ? data.length : 'single'} items`);
      
      if (type === 'settings') {
        const content = JSON.stringify(data);
        await pool.execute(
          `INSERT INTO settings (id, content) VALUES ('current', ?) ON DUPLICATE KEY UPDATE content = ?`,
          [content, content]
        );
      } else if (Array.isArray(data)) {
        const connection = await pool.getConnection();
        await connection.beginTransaction();
        try {
          // 1. Clear existing
          await connection.execute(`DELETE FROM ${type}`);
          
          // 2. Bulk insert if there is data
          if (data.length > 0) {
            const values = data.map(item => [
              item.id || Math.random().toString(36).substr(2, 9),
              JSON.stringify(item)
            ]);
            
            const sql = `INSERT INTO ${type} (id, content) VALUES ?`;
            await connection.query(sql, [values]);
          }
          
          await connection.commit();
          console.log(`Successfully committed ${data.length} items to ${type}`);
        } catch (err) {
          await connection.rollback();
          console.error(`Transaction failed for ${type}:`, err);
          throw err;
        } finally {
          connection.release();
        }
      }
      
      console.log(`Successfully synced ${type}`);
      res.json({ status: 'success' });
    } catch (error) {
      console.error(`Failed to save ${type} data:`, error);
      res.status(500).json({ error: 'Failed to save data' });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', database: 'connected' });
  });

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files from the dist directory in production
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    app.use(express.static(path.join(__dirname, 'dist')));
    
    // Handle SPA routing: serve index.html for all non-API routes
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  // Start the server
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
