import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize SQLite
  const db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      uid TEXT PRIMARY KEY,
      email TEXT,
      displayName TEXT,
      photoURL TEXT,
      role TEXT DEFAULT 'investor',
      balance REAL DEFAULT 5000000,
      portfolio TEXT DEFAULT '[]',
      createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS buildings (
      id INTEGER PRIMARY KEY,
      height REAL,
      levels INTEGER,
      min_height REAL,
      roof_shape TEXT,
      roi REAL,
      status INTEGER,
      owner_id TEXT,
      cost REAL,
      yield REAL,
      coordinates TEXT,
      encumbrances TEXT,
      sanctions_resist TEXT
    );

    CREATE TABLE IF NOT EXISTS building_media (
      id TEXT PRIMARY KEY,
      building_id INTEGER,
      type TEXT,
      url TEXT,
      timestamp INTEGER,
      FOREIGN KEY(building_id) REFERENCES buildings(id)
    );

    CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      title TEXT,
      type TEXT,
      model TEXT,
      cost REAL,
      yield REAL,
      roi REAL,
      status INTEGER,
      ownerUid TEXT,
      description TEXT,
      address TEXT,
      latitude REAL,
      longitude REAL,
      sqft REAL,
      yearBuilt INTEGER,
      parkingSpaces INTEGER,
      createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS financial_audits (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      type TEXT, -- CADASTRAL_FETCH, PAYMENT_INIT, KYC_VERIFY
      payload TEXT,
      status TEXT,
      timestamp TEXT
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      syndicate_id TEXT,
      amount REAL,
      status TEXT, -- HELD, CAPTURED, FAILED
      bank_ref TEXT,
      idempotency_key TEXT UNIQUE,
      createdAt TEXT
    );
  `);

  app.use(express.json());

  // 🌍 CADASTRAL PROXY
  app.get("/api/v1/cadastral/:cad_num", async (req, res) => {
    const { cad_num } = req.params;
    const userId = req.headers["x-user-id"] as string || "anonymous";
    try {
      const auditId = Math.random().toString(36).substr(2, 9);
      await db.run(
        "INSERT INTO financial_audits (id, user_id, type, payload, status, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
        [auditId, userId, "CADASTRAL_FETCH", JSON.stringify({ cad_num }), "SUCCESS", new Date().toISOString()]
      );
      res.json({
        cad_num,
        status: "ACTIVE",
        area: 450.5,
        category: "Commercial",
        permitted_use: "Office/Retail",
        value: 125000000,
        geometry: { type: "Polygon", coordinates: [[[37.61, 55.75], [37.62, 55.75], [37.62, 55.76], [37.61, 55.76], [37.61, 55.75]]] }
      });
    } catch (error) {
      res.status(502).json({ error: "External cadastral service failed" });
    }
  });

  // 🏦 PAYMENTS & ESCROW
  app.post("/api/v1/payments/escrow/init", async (req, res) => {
    const { user_id, syndicate_id, amount, idempotency_key } = req.body;
    try {
      const existing = await db.get("SELECT * FROM payments WHERE idempotency_key = ?", [idempotency_key]);
      if (existing) return res.json(existing);
      const bankRef = `BNK_${Math.random().toString(36).substr(2, 12).toUpperCase()}`;
      const paymentId = Math.random().toString(36).substr(2, 9);
      await db.run(`
        INSERT INTO payments (id, user_id, syndicate_id, amount, status, bank_ref, idempotency_key, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [paymentId, user_id, syndicate_id || 'STALKER_UNIT', amount, "HELD", bankRef, idempotency_key, new Date().toISOString()]);
      res.status(201).json({ status: "HELD", ref: bankRef, expires_at: new Date(Date.now() + 86400000).toISOString() });
    } catch (error) {
      res.status(500).json({ error: "Financial gateway error" });
    }
  });

  // 🔔 WEBHOOKS
  app.post("/api/v1/webhooks/payments", async (req, res) => {
    const { event, object } = req.body;
    try {
      if (event === "payment.succeeded") {
        await db.run("UPDATE payments SET status = 'CAPTURED' WHERE bank_ref = ?", [object.id]);
      }
      res.status(200).send("OK");
    } catch (error) {
      res.status(500).send("Retry");
    }
  });

  // Asset Routes
  app.get("/api/assets", async (req, res) => {
    const assets = await db.all("SELECT * FROM assets ORDER BY createdAt DESC");
    res.json(assets);
  });

  app.post("/api/assets", async (req, res) => {
    const asset = req.body;
    const id = Math.random().toString(36).substr(2, 9);
    const createdAt = new Date().toISOString();
    try {
      const user = await db.get("SELECT balance FROM users WHERE uid = ?", [asset.ownerUid]);
      if (!user || user.balance < asset.cost) return res.status(400).json({ error: "Insufficient funds or user not found" });
      const newBalance = user.balance - asset.cost;
      await db.run("UPDATE users SET balance = ? WHERE uid = ?", [newBalance, asset.ownerUid]);
      await db.run(`
        INSERT INTO assets (id, title, type, model, cost, yield, roi, status, ownerUid, description, address, latitude, longitude, sqft, yearBuilt, parkingSpaces, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [id, asset.title, asset.type, asset.model, asset.cost, asset.yield, asset.roi, asset.status, asset.ownerUid, asset.description, asset.address, asset.latitude, asset.longitude, asset.sqft, asset.yearBuilt, asset.parkingSpaces, createdAt]);
      res.json({ asset: { ...asset, id, createdAt }, balance: newBalance });
    } catch (error) {
      res.status(500).json({ error: "Internal error" });
    }
  });

  // User Sync
  app.post("/api/user/sync", async (req, res) => {
    const { uid, email, displayName, photoURL } = req.body;
    try {
      let user = await db.get("SELECT * FROM users WHERE uid = ?", [uid]);
      if (!user) {
        const role = email === "lookastarik@gmail.com" ? "admin" : "investor";
        await db.run(`INSERT INTO users (uid, email, displayName, photoURL, role, balance, portfolio, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [uid, email, displayName, photoURL, role, 5000000, '[]', new Date().toISOString()]);
        user = await db.get("SELECT * FROM users WHERE uid = ?", [uid]);
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Sync error" });
    }
  });

  // Buildings Layer API
  app.get("/api/v1/buildings", async (req, res) => {
    try {
      const buildings = await db.all("SELECT * FROM buildings");
      const features = buildings.map(b => ({
        type: "Feature",
        geometry: { type: "Polygon", coordinates: [JSON.parse(b.coordinates)] },
        properties: { ...b, coordinates: undefined }
      }));
      res.json({ type: "FeatureCollection", features });
    } catch (error) {
      res.status(500).json({ error: "Data error" });
    }
  });

  app.get("/api/v1/buildings/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const building = await db.get("SELECT * FROM buildings WHERE id = ?", [id]);
      if (!building) return res.status(404).json({ error: "Building not found" });
      
      const detailedBuilding = {
        ...building,
        technical_specifications: {
          structural_integrity: "98.5%",
          power_grid_sync: "Stable",
          cyber_protection: "Tier-4 Lockdown",
          ventilation_status: "Active - HEPA Filtered",
          last_maintenance: "2024-03-12",
          fiber_bandwidth: "10 Gbps sym",
          backup_generators: "Quad-Array redundant",
          energy_efficiency: "LEED Platinum equivalent"
        },
        financial_specifications: {
          annual_gross_income: (building.yield || 15000) * 12 * 1.05,
          operating_expenses: (building.yield || 15000) * 12 * 0.22,
          net_operating_income: (building.yield || 15000) * 12 * 0.83,
          capitalization_rate: building.roi || 12.5,
          tenant_occupancy: "96.4%",
          encumbrances: building.encumbrances || "Clear Title",
          last_valuation_date: "2024-01-15",
          insurance_policy: "Premium Comprehensive"
        }
      };
      res.json(detailedBuilding);
    } catch (error) {
      res.status(500).json({ error: "Data fetch failed" });
    }
  });

  // Vite
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => console.log(`Server running on http://localhost:${PORT}`));
}

startServer();
