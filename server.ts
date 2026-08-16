import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

const DATA_FILE = path.join(process.cwd(), 'server_state.json');

// Helper to read server state
function readState() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading server state:', e);
  }
  return null;
}

// Helper to write server state
function writeState(state: any) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('Error writing server state:', e);
    return false;
  }
}

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/state", (req, res) => {
  const state = readState();
  res.json(state || { initialized: false });
});

app.get("/server_state.json", (req, res) => {
  if (fs.existsSync(DATA_FILE)) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=server_state.json');
    res.sendFile(DATA_FILE);
  } else {
    res.status(404).json({ error: "File not found" });
  }
});

app.post("/api/state", (req, res) => {
  const newState = req.body;
  if (writeState(newState)) {
    res.json({ success: true });
  } else {
    res.status(500).json({ success: false, error: "Failed to save state" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*all', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Global Sync Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
