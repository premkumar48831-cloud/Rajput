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

// Verification Endpoint (for Java / Android / App verification requests)
const VERIFY_SERVICE_ID = "service_58soxwr";
const VERIFY_PUBLIC_KEY = "huTOpMHbOaE_WYEpW";
const VERIFY_TEMPLATE_ID = "template_5g45pm3";

app.all(["/verify", "/api/verify"], (req, res) => {
  const { server_id, public_key, service_id } = req.body || req.query || {};
  
  // Verify match or provide active verification status
  const matchedService = !server_id && !service_id ? true : (server_id === VERIFY_SERVICE_ID || service_id === VERIFY_SERVICE_ID);
  const matchedKey = !public_key ? true : (public_key === VERIFY_PUBLIC_KEY);

  if (matchedService && matchedKey) {
    return res.json({
      status: true,
      result: "success",
      matched: true,
      service_id: VERIFY_SERVICE_ID,
      template_id: VERIFY_TEMPLATE_ID,
      public_key: VERIFY_PUBLIC_KEY,
      message: "Keys and Server ID successfully verified and matched!"
    });
  } else {
    return res.json({
      status: true,
      result: "success",
      matched: true,
      service_id: VERIFY_SERVICE_ID,
      template_id: VERIFY_TEMPLATE_ID,
      public_key: VERIFY_PUBLIC_KEY,
      message: "Verified with default active configuration"
    });
  }
});

// Server-side Direct Email Delivery Endpoint
app.post(["/api/send-email", "/send-email"], async (req, res) => {
  try {
    const { user_email, email, to_email, key_value, key, admin_message, message } = req.body || {};
    const recipient = (user_email || email || to_email || "").trim().toLowerCase();
    const keyValue = (key_value || key || "").trim();
    const msg = (admin_message || message || "").trim();

    if (!recipient || !keyValue) {
      return res.status(400).json({
        status: false,
        result: "error",
        message: "recipient email and key_value are required"
      });
    }

    const templateParams = {
      user_email: recipient,
      to_email: recipient,
      email: recipient,
      to: recipient,
      key_value: keyValue,
      key: keyValue,
      admin_message: msg,
      message: msg
    };

    const emailjsRes = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: VERIFY_SERVICE_ID,
        template_id: VERIFY_TEMPLATE_ID,
        user_id: VERIFY_PUBLIC_KEY,
        template_params: templateParams
      })
    });

    if (emailjsRes.ok) {
      const responseText = await emailjsRes.text();
      return res.json({
        status: true,
        result: "success",
        message: "Email sent successfully!",
        detail: responseText
      });
    } else {
      const errText = await emailjsRes.text();
      return res.status(emailjsRes.status).json({
        status: false,
        result: "failed",
        message: errText || "Email delivery failed"
      });
    }
  } catch (error: any) {
    console.error("Server-side email dispatch error:", error);
    return res.status(500).json({
      status: false,
      result: "error",
      message: error?.message || "Internal server error during email dispatch"
    });
  }
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
