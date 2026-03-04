
import express, { Request, Response } from 'express';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import cors from 'cors';
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config({ override: true });

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

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
    let connection;
    try {
      connection = await pool.getConnection();
      console.log('Successfully connected to MySQL server');
      
      const tables = [
        {
          name: 'messages',
          sql: `CREATE TABLE IF NOT EXISTS messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            question TEXT,
            answer TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )`
        },
        {
          name: 'products',
          sql: `CREATE TABLE IF NOT EXISTS products (
            id VARCHAR(100) PRIMARY KEY,
            content LONGTEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          )`
        },
        {
          name: 'sales',
          sql: `CREATE TABLE IF NOT EXISTS sales (
            id VARCHAR(100) PRIMARY KEY,
            content LONGTEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          )`
        },
        {
          name: 'customers',
          sql: `CREATE TABLE IF NOT EXISTS customers (
            id VARCHAR(100) PRIMARY KEY,
            content LONGTEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          )`
        },
        {
          name: 'scraps',
          sql: `CREATE TABLE IF NOT EXISTS scraps (
            id VARCHAR(100) PRIMARY KEY,
            content LONGTEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          )`
        },
        {
          name: 'settings',
          sql: `CREATE TABLE IF NOT EXISTS settings (
            id VARCHAR(50) PRIMARY KEY,
            content LONGTEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          )`
        }
      ];

      for (const table of tables) {
        await connection.execute(table.sql);
        console.log(`Table ${table.name} checked/created`);
      }
      
      console.log('All database tables initialized successfully');
    } catch (err) {
      console.error('Database initialization failed critical error:', err);
      // We don't exit, but the health check will reflect this
    } finally {
      if (connection) connection.release();
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
    const { type } = req.params;
    const allowedTypes = ['products', 'sales', 'customers', 'scraps', 'settings'];
    
    if (typeof type !== 'string' || !allowedTypes.includes(type)) {
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
      res.status(500).json({ 
        error: 'Failed to fetch data', 
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.post('/api/data/:type', async (req: Request, res: Response) => {
    const { type } = req.params;
    const { data } = req.body;
    const allowedTypes = ['products', 'sales', 'customers', 'scraps', 'settings'];

    if (typeof type !== 'string' || !allowedTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid data type' });
    }

    try {
      if (type === 'settings') {
        const content = JSON.stringify(data);
        await pool.execute(
          `INSERT INTO settings (id, content) VALUES ('current', ?) ON DUPLICATE KEY UPDATE content = ?`,
          [content, content]
        );
      } else if (Array.isArray(data)) {
        // For arrays, we clear and re-insert or update
        // To keep it simple and consistent with frontend state sync:
        // 1. Clear existing (optional, but safer for state sync)
        // 2. Insert all
        
        // Optimization: Use a transaction
        const connection = await pool.getConnection();
        await connection.beginTransaction();
        try {
          await connection.execute(`DELETE FROM ${type}`);
          for (const item of data) {
            const content = JSON.stringify(item);
            const id = item.id || Math.random().toString(36).substr(2, 9);
            await connection.execute(
              `INSERT INTO ${type} (id, content) VALUES (?, ?)`,
              [id, content]
            );
          }
          await connection.commit();
        } catch (err) {
          await connection.rollback();
          throw err;
        } finally {
          connection.release();
        }
      }
      
      console.log(`Successfully synced ${type}`);
      res.json({ status: 'success' });
    } catch (error) {
      console.error(`Failed to save ${type} data:`, error);
      res.status(500).json({ 
        error: 'Failed to save data', 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Health check endpoint
  app.get('/api/health', async (req, res) => {
    try {
      const connection = await pool.getConnection();
      await connection.ping();
      connection.release();
      res.json({ status: 'ok', database: 'connected' });
    } catch (err) {
      console.error('Health check failed:', err);
      res.status(500).json({ status: 'error', database: 'disconnected', error: err instanceof Error ? err.message : String(err) });
    }
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
