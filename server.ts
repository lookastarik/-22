import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

// Rule 2: "Live" Building (RLS + Data Mapping)
// ... (mockBuildingsData remains the same)
const mockBuildingsData = [
  { 
    id: 101, 
    height: 45, 
    roi: 18, 
    status: 1, 
    owner_id: "user_1",
    cost: 1500000,
    yield: 25000,
    coordinates: [
      [37.6180, 55.7560], [37.6185, 55.7560], [37.6185, 55.7565], [37.6180, 55.7565], [37.6180, 55.7560]
    ]
  },
  { 
    id: 102, 
    height: 30, 
    roi: 12, 
    status: 1, 
    owner_id: "user_2",
    cost: 800000,
    yield: 12000,
    coordinates: [
      [37.6160, 55.7550], [37.6165, 55.7550], [37.6165, 55.7555], [37.6160, 55.7555], [37.6160, 55.7550]
    ]
  },
  { 
    id: 103, 
    height: 60, 
    roi: 5, 
    status: 2, 
    owner_id: "user_1",
    cost: 2200000,
    yield: 8000,
    coordinates: [
      [37.6190, 55.7540], [37.6195, 55.7540], [37.6195, 55.7545], [37.6190, 55.7545], [37.6190, 55.7540]
    ]
  },
  { 
    id: 104, 
    height: 85, 
    roi: -12, 
    status: 3, 
    owner_id: "user_3",
    cost: 4500000,
    yield: -5000,
    coordinates: [
      [37.6210, 55.7570], [37.6215, 55.7570], [37.6215, 55.7575], [37.6210, 55.7575], [37.6210, 55.7570]
    ]
  },
];

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
      roi REAL,
      status INTEGER,
      owner_id TEXT,
      cost REAL,
      yield REAL,
      coordinates TEXT
    );

    CREATE TABLE IF NOT EXISTS building_media (
      id TEXT PRIMARY KEY,
      building_id INTEGER,
      type TEXT, -- 'photo' or 'video'
      url TEXT,
      timestamp INTEGER,
      FOREIGN KEY(building_id) REFERENCES buildings(id)
    );
  `);

  // Seed buildings if empty
  const buildingCount = await db.get("SELECT COUNT(*) as count FROM buildings");
  if (buildingCount.count === 0) {
    const seedData = [
      { id: 101, height: 45, roi: 18, status: 1, owner_id: "user_1", cost: 1500000, yield: 25000, coords: [[37.6180, 55.7560], [37.6185, 55.7560], [37.6185, 55.7565], [37.6180, 55.7565], [37.6180, 55.7560]] },
      { id: 102, height: 30, roi: 12, status: 1, owner_id: "user_2", cost: 800000, yield: 12000, coords: [[37.6160, 55.7550], [37.6165, 55.7550], [37.6165, 55.7555], [37.6160, 55.7555], [37.6160, 55.7550]] },
      { id: 103, height: 60, roi: 5, status: 2, owner_id: "user_1", cost: 2200000, yield: 8000, coords: [[37.6190, 55.7540], [37.6195, 55.7540], [37.6195, 55.7545], [37.6190, 55.7545], [37.6190, 55.7540]] },
      { id: 104, height: 85, roi: -12, status: 3, owner_id: "user_3", cost: 4500000, yield: -5000, coords: [[37.6210, 55.7570], [37.6215, 55.7570], [37.6215, 55.7575], [37.6210, 55.7575], [37.6210, 55.7570]] },
    ];

    for (const b of seedData) {
      await db.run(
        "INSERT INTO buildings (id, height, roi, status, owner_id, cost, yield, coordinates) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [b.id, b.height, b.roi, b.status, b.owner_id, b.cost, b.yield, JSON.stringify(b.coords)]
      );
    }
  }

  app.use(express.json());

  // User API Routes (SQLite)
  // ... (existing user routes)
  app.get("/api/user/:uid", async (req, res) => {
    try {
      const user = await db.get("SELECT * FROM users WHERE uid = ?", [req.params.uid]);
      if (user) {
        user.portfolio = JSON.parse(user.portfolio);
        res.json(user);
      } else {
        res.status(404).json({ error: "User not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.post("/api/user/sync", async (req, res) => {
    const { uid, email, displayName, photoURL, role, balance, portfolio, createdAt } = req.body;
    try {
      const portfolioStr = JSON.stringify(portfolio || []);
      
      // Determine initial role for new users
      let initialRole = role || 'investor';
      if (email === "lookastarik@gmail.com") {
        initialRole = 'admin';
      }

      await db.run(`
        INSERT INTO users (uid, email, displayName, photoURL, role, balance, portfolio, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(uid) DO UPDATE SET
          email = excluded.email,
          displayName = excluded.displayName,
          photoURL = excluded.photoURL,
          -- Role is NOT updated via sync to prevent self-escalation
          balance = COALESCE(excluded.balance, users.balance),
          portfolio = COALESCE(excluded.portfolio, users.portfolio)
      `, [uid, email, displayName, photoURL, initialRole, balance, portfolioStr, createdAt]);
      
      const updatedUser = await db.get("SELECT * FROM users WHERE uid = ?", [uid]);
      updatedUser.portfolio = JSON.parse(updatedUser.portfolio);
      res.json(updatedUser);
    } catch (error) {
      console.error("Sync error:", error);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Building Media API
  app.get("/api/v1/buildings/:id/media", async (req, res) => {
    try {
      const media = await db.all("SELECT * FROM building_media WHERE building_id = ? ORDER BY timestamp DESC", [req.params.id]);
      res.json(media);
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.post("/api/v1/buildings/:id/media", async (req, res) => {
    const { type, url } = req.body;
    const id = Math.random().toString(36).substr(2, 9);
    const timestamp = Date.now();
    try {
      await db.run(
        "INSERT INTO building_media (id, building_id, type, url, timestamp) VALUES (?, ?, ?, ?, ?)",
        [id, req.params.id, type, url, timestamp]
      );
      res.json({ id, type, url, timestamp });
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // API Routes
  app.get("/api/v1/buildings", async (req, res) => {
    const userId = req.headers["x-user-id"] as string || "anonymous";
    
    // Fetch user role from DB for RLS
    let userRole = "anonymous";
    if (userId !== "anonymous") {
      const user = await db.get("SELECT role FROM users WHERE uid = ?", [userId]);
      if (user) userRole = user.role;
    }

    try {
      const buildings = await db.all("SELECT * FROM buildings");
      
      const features = buildings.map(b => {
        const props: any = { 
          id: b.id,
          height: b.height,
          cost: b.cost,
          yield: b.yield
        };
        
        // RLS Logic: Investor or Admin see ROI and Status
        if (userRole === "investor" || userRole === "admin") {
          props.roi = b.roi;
          props.status = b.status;
        }
        
        // RLS Logic: Only Admin or Owner sees owner_id
        if (userRole === "admin" || userId === b.owner_id) {
          props.owner = b.owner_id;
        }
        
        return {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [JSON.parse(b.coordinates)]
          },
          properties: props
        };
      });

      res.json({
        type: "FeatureCollection",
        features
      });
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Rule 3: AI Agent Tooling
  app.post("/api/v1/ai/search", async (req, res) => {
    const { center_lat, center_lon, radius_m, min_roi } = req.body;
    
    try {
      let query = "SELECT * FROM buildings";
      const params: any[] = [];
      
      if (min_roi) {
        query += " WHERE roi >= ?";
        params.push(min_roi);
      }
      
      const results = await db.all(query, params);

      res.json({
        osm_ids: results.map(r => r.id),
        count: results.length,
        summary: `Found ${results.length} buildings matching criteria.`
      });
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
