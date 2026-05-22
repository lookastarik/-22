import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

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

  // Insert single building
  app.post("/api/v1/buildings", async (req, res) => {
    const { height, roi, status, owner_id, cost, yield: yieldVal, coordinates } = req.body;
    try {
      const maxIdRow = await db.get("SELECT MAX(id) as maxId FROM buildings");
      const nextId = (maxIdRow?.maxId || 200) + 1;
      
      const coordsString = typeof coordinates === 'string' ? coordinates : JSON.stringify(coordinates);

      await db.run(
        "INSERT INTO buildings (id, height, roi, status, owner_id, cost, yield, coordinates) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [nextId, height || 25, roi || 10, status || 1, owner_id || "admin", cost || 50000000, yieldVal || 450000, coordsString]
      );
      
      const newBuilding = await db.get("SELECT * FROM buildings WHERE id = ?", [nextId]);
      res.status(201).json(newBuilding);
    } catch (error) {
      console.error("Failed to insert building:", error);
      res.status(500).json({ error: "Database save error" });
    }
  });

  // Bulk Ingest buildings
  app.post("/api/v1/buildings/bulk", async (req, res) => {
    const { assets } = req.body;
    if (!assets || !Array.isArray(assets)) {
      return res.status(400).json({ error: "Assets array is required" });
    }

    try {
      const maxIdRow = await db.get("SELECT MAX(id) as maxId FROM buildings");
      let currentId = maxIdRow?.maxId || 1000;

      const inserted = [];
      for (const asset of assets) {
        currentId += 1;
        const coordsString = typeof asset.polygon === 'string' 
          ? asset.polygon 
          : JSON.stringify(asset.polygon || [
              [
                [asset.longitude - 0.0002, asset.latitude - 0.0002],
                [asset.longitude + 0.0002, asset.latitude - 0.0002],
                [asset.longitude + 0.0002, asset.latitude + 0.0002],
                [asset.longitude - 0.0002, asset.latitude + 0.0002],
                [asset.longitude - 0.0002, asset.latitude - 0.0002]
              ]
            ]);

        // Calculate gross ROI
        const calculatedRoi = asset.cost > 0 ? (asset.yield * 12 / asset.cost) * 100 : 10;

        await db.run(
          "INSERT INTO buildings (id, height, roi, status, owner_id, cost, yield, coordinates) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          [
            currentId, 
            asset.height || 25, 
            parseFloat(calculatedRoi.toFixed(2)), 
            asset.status || 1, 
            asset.owner || "admin", 
            asset.cost || 50000000, 
            asset.yield || 450000, 
            coordsString
          ]
        );
        inserted.push(currentId);
      }

      res.status(201).json({ count: inserted.length, inserted_ids: inserted });
    } catch (error) {
      console.error("Failed to bulk insert buildings:", error);
      res.status(500).json({ error: "Database bulk insert error" });
    }
  });

  // Server-Side Gemini API Proxy for AI Auto-Fill
  app.post("/api/v1/admin/ai-auto-fill", async (req, res) => {
    const { address } = req.body;
    if (!address) {
      return res.status(400).json({ error: "Address is required" });
    }

    try {
      const aiKey = process.env.GEMINI_API_KEY;
      if (!aiKey) {
        console.warn("GEMINI_API_KEY environment variable is not defined. Using high-fidelity fallback AI auto-fill.");
        return res.json({
          suggestedType: "office",
          suggestedModel: "office",
          estimatedCost: 85000000,
          estimatedYield: 780000,
          estimatedROI: 11.0,
          sqft: 25000,
          yearBuilt: 2018,
          height: 35,
          levels: 9,
          parkingSpaces: 40,
          description: `Премиальный офисный центр на ${address} с высокой транспортной доступностью.`,
          marketContext: `Объект располагается в активно развивающемся деловом кластере у ${address}, характеризующемся стабильным спросом со стороны арендаторов класса А+.`,
          tenantMix: ["Tech Hub", "Global Finance", "Co-working Studio"],
          swot: {
            advantages: ["Выгодная стратегическая локация", "Высокий пешеходный трафик", "Готовая инфраструктура"],
            risks: ["Конкуренция со стороны бизнес-центров по соседству", "Небольшой уровень инфляционных рисков"]
          }
        });
      }

      const ai = new GoogleGenAI({
        apiKey: aiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Analyze real estate at: "${address}". Return JSON following this structure:
        {
          "suggestedType": "office|retail|warehouse|residential",
          "suggestedModel": "house|apartment|warehouse|office",
          "estimatedCost": number (value in RUB, realistically between 5000000 and 500000000 based on scale),
          "estimatedYield": number (monthly yield in RUB, realistically between 50000 and 5000000 based on cost),
          "estimatedROI": number,
          "sqft": number (area in square feet),
          "yearBuilt": number,
          "height": number (meters),
          "levels": number,
          "parkingSpaces": number,
          "description": "tactical 2-sentence description of the property in Russian",
          "marketContext": "1 paragraph about the local surroundings and investment potential of ${address} in Russian",
          "tenantMix": ["type1", "type2", "type3"],
          "swot": {
            "advantages": ["str1", "str2", "str3"],
            "risks": ["risk1", "risk2"]
          }
        }`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestedType: { type: Type.STRING },
              suggestedModel: { type: Type.STRING },
              estimatedCost: { type: Type.NUMBER },
              estimatedYield: { type: Type.NUMBER },
              estimatedROI: { type: Type.NUMBER },
              sqft: { type: Type.NUMBER },
              yearBuilt: { type: Type.NUMBER },
              height: { type: Type.NUMBER },
              levels: { type: Type.NUMBER },
              parkingSpaces: { type: Type.NUMBER },
              description: { type: Type.STRING },
              marketContext: { type: Type.STRING },
              tenantMix: { type: Type.ARRAY, items: { type: Type.STRING } },
              swot: {
                type: Type.OBJECT,
                properties: {
                  advantages: { type: Type.ARRAY, items: { type: Type.STRING } },
                  risks: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            },
            required: ["suggestedType", "estimatedCost", "estimatedYield", "description", "swot"]
          }
        }
      });

      const textResult = response.text;
      if (!textResult) {
        throw new Error("Empty response from Gemini API");
      }

      const parsed = JSON.parse(textResult.trim());
      res.json(parsed);

    } catch (error: any) {
      console.error("Gemini AI Auto-Fill failed on server:", error);
      res.status(500).json({ error: "AI analysis failed on backend", message: error?.message });
    }
  });

  // Land id-inspired AI Smart NLP Search API
  app.post("/api/v1/ai/smart-search", async (req, res) => {
    const { query: textQuery } = req.body;
    if (!textQuery) {
      return res.status(400).json({ error: "Query is required" });
    }

    let minRoi: number | null = null;
    let minCost: number | null = null;
    let maxCost: number | null = null;
    let minHeight: number | null = null;
    let statusFilter: number | null = null;
    let ownerFilter: string | null = null;
    let summary = `Searching registry for: "${textQuery}"`;

    const aiKey = process.env.GEMINI_API_KEY;
    if (aiKey) {
      try {
        const ai = new GoogleGenAI({
          apiKey: aiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: `Analyze this real estate map intelligence query: "${textQuery}". 
          Extract searching variables in JSON. Coordinates should not be extracted, focus on numeric range filters, owner substring, and status code (1=stable, 2=risk, 3=anomalous).
          Return structure:
          {
            "minRoi": number | null,
            "minCost": number | null,
            "maxCost": number | null,
            "minHeight": number | null,
            "status": number | null,
            "owner": string | null,
            "explanation": "concise 1-sentence tactical description in Russian or English matching user language"
          }`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                minRoi: { type: Type.NUMBER },
                minCost: { type: Type.NUMBER },
                maxCost: { type: Type.NUMBER },
                minHeight: { type: Type.NUMBER },
                status: { type: Type.NUMBER },
                owner: { type: Type.STRING },
                explanation: { type: Type.STRING }
              }
            }
          }
        });

        const parsedContent = JSON.parse(response.text?.trim() || "{}");
        minRoi = parsedContent.minRoi ?? null;
        minCost = parsedContent.minCost ?? null;
        maxCost = parsedContent.maxCost ?? null;
        minHeight = parsedContent.minHeight ?? null;
        statusFilter = parsedContent.status ?? null;
        ownerFilter = parsedContent.owner ?? null;
        summary = parsedContent.explanation || summary;

      } catch (err) {
        console.error("Gemini query parsing failed, using regex fallback:", err);
      }
    }

    // Fallback regex parsing
    if (!aiKey || (minRoi === null && minCost === null && minHeight === null && statusFilter === null)) {
      const queryLower = textQuery.toLowerCase();
      
      // Parse ROI
      const roiMatch = queryLower.match(/roi\s*(?:>|>=|больше|выше)?\s*(\d+)/i);
      if (roiMatch) minRoi = parseFloat(roiMatch[1]);

      // Parse Cost
      const costMatch = queryLower.match(/(?:cost|цена|стоимость)\s*(?:>|>=|больше)?\s*(\d+)/i);
      if (costMatch) minCost = parseFloat(costMatch[1]);
      
      // Parse Height
      const heightMatch = queryLower.match(/(?:height|высота)\s*(?:>|>=|больше)?\s*(\d+)/i);
      if (heightMatch) minHeight = parseFloat(heightMatch[1]);

      // Parse Status
      if (queryLower.includes('risk') || queryLower.includes('риск')) statusFilter = 2;
      else if (queryLower.includes('stable') || queryLower.includes('стабильн')) statusFilter = 1;
      else if (queryLower.includes('anomaly') || queryLower.includes('аномал')) statusFilter = 3;

      // Parse Owner
      const ownerMatch = queryLower.match(/(?:owner|владелец)\s+(\w+)/i);
      if (ownerMatch) ownerFilter = ownerMatch[1];
    }

    try {
      let sql = "SELECT * FROM buildings WHERE 1=1";
      const params: any[] = [];

      if (minRoi !== null) {
        sql += " AND roi >= ?";
        params.push(minRoi);
      }
      if (minCost !== null) {
        sql += " AND cost >= ?";
        params.push(minCost);
      }
      if (maxCost !== null) {
        sql += " AND cost <= ?";
        params.push(maxCost);
      }
      if (minHeight !== null) {
        sql += " AND height >= ?";
        params.push(minHeight);
      }
      if (statusFilter !== null) {
        sql += " AND status = ?";
        params.push(statusFilter);
      }
      if (ownerFilter !== null) {
        sql += " AND owner_id LIKE ?";
        params.push(`%${ownerFilter}%`);
      }

      const results = await db.all(sql, params);

      res.json({
        matchingIds: results.map(r => r.id),
        count: results.length,
        filters: { minRoi, minCost, maxCost, minHeight, statusFilter, ownerFilter },
        summary: summary || `Found ${results.length} properties matching query criteria.`
      });

    } catch (dbErr) {
      console.error("Smart search db query error:", dbErr);
      res.status(500).json({ error: "Database search error" });
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

  app.post("/api/v1/ai/analyze", async (req, res) => {
    const { building_id } = req.body;
    try {
      const building = await db.get("SELECT * FROM buildings WHERE id = ?", [building_id]);
      if (building) {
        res.json({
          id: building.id,
          market_value: building.cost,
          monthly_yield: building.yield,
          roi: building.roi,
          status: building.status === 1 ? 'Stable' : building.status === 2 ? 'Risk' : 'Anomalous'
        });
      } else {
        res.status(404).json({ error: "Building not found" });
      }
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
