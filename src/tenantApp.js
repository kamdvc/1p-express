const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function connectWithRetry(config) {
  const retries = Number(process.env.DB_WAIT_RETRIES || 15);
  const delay = Number(process.env.DB_WAIT_DELAY_MS || 2000);

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      return await mysql.createPool(config);
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      console.log(`Esperando MySQL... intento ${attempt}/${retries}`);
      await sleep(delay);
    }
  }

  throw new Error("No se pudo crear conexión con MySQL.");
}

async function ensureSchema(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

function normalizePrice(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

async function startTenantApp() {
  const app = express();
  const port = Number(process.env.PORT || 3000);

  const dbConfig = {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "appdb",
    waitForConnections: true,
    connectionLimit: 10
  };

  const pool = await connectWithRetry(dbConfig);
  await ensureSchema(pool);

  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({
      ok: true,
      mode: "tenant",
      database: dbConfig.database
    });
  });

  app.get("/api/products", async (_req, res) => {
    const [rows] = await pool.query("SELECT * FROM products ORDER BY id DESC");
    res.json(rows);
  });

  app.post("/api/products", async (req, res) => {
    const rawName = req.body?.name;
    const rawPrice = req.body?.price;
    const name = String(rawName || "").trim();
    const price = normalizePrice(rawPrice);

    if (!name || rawPrice === undefined || !Number.isFinite(price)) {
      return res.status(400).json({ message: "name y price son obligatorios." });
    }

    const [result] = await pool.query(
      "INSERT INTO products (name, price) VALUES (?, ?)",
      [name, price]
    );

    const [rows] = await pool.query("SELECT * FROM products WHERE id = ?", [result.insertId]);
    return res.status(201).json(rows[0]);
  });

  app.put("/api/products/:id", async (req, res) => {
    const rawName = req.body?.name;
    const rawPrice = req.body?.price;
    const name = String(rawName || "").trim();
    const price = normalizePrice(rawPrice);
    const id = Number(req.params.id);
    if (!id || !name || rawPrice === undefined || !Number.isFinite(price)) {
      return res.status(400).json({ message: "id, name y price son obligatorios." });
    }

    const [result] = await pool.query(
      "UPDATE products SET name = ?, price = ? WHERE id = ?",
      [name, price, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Producto no encontrado." });
    }

    const [rows] = await pool.query("SELECT * FROM products WHERE id = ?", [id]);
    return res.json(rows[0]);
  });

  app.delete("/api/products/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "id inválido." });
    }

    const [result] = await pool.query("DELETE FROM products WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Producto no encontrado." });
    }

    return res.json({ message: "Producto eliminado correctamente." });
  });

  app.listen(port, () => {
    console.log(`Tenant app corriendo en http://localhost:${port}`);
  });
}

module.exports = {
  startTenantApp
};
