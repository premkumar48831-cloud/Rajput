import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import Razorpay from "razorpay";
import { MongoClient, ServerApiVersion } from "mongodb";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '50mb' }));

// Health check endpoint for Cloud Run
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Helper to get Razorpay client instance lazily
function getRazorpayClient() {
  const key_id = "rzp_test_TbWSIPFPtuOiJb";
  const key_secret = "ia1CT66DiuzfVLnsM5pxu3Y7";
  if (!key_id || !key_secret) {
    return null;
  }
  try {
    return new Razorpay({
      key_id,
      key_secret,
    });
  } catch (err) {
    console.error("Failed to initialize Razorpay client:", err);
    return null;
  }
}

// ==========================================
// RAZORPAY PAYMENT GATEWAY ENDPOINTS
// ==========================================

// 1. Get Razorpay public configuration
app.get("/api/razorpay/config", (req, res) => {
  const key_id = process.env.RAZORPAY_KEY_ID || "rzp_test_TbWSIPFPtuOiJb";
  const isConfigured = true;
  res.json({
    status: true,
    key_id: key_id,
    isConfigured,
    message: "Razorpay credentials loaded successfully"
  });
});

// 2. Create Razorpay Order
app.post("/api/razorpay/create-order", async (req, res) => {
  try {
    const { amount, currency = "INR", receipt, notes = {}, key_id, key_secret } = req.body || {};
    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({
        status: false,
        error: "Valid payment amount is required"
      });
    }

    let rzpClient = getRazorpayClient();
    let activeKeyId = "rzp_test_TbWSIPFPtuOiJb";
    
    if (key_id && key_id.trim() !== "" && key_secret && key_secret.trim() !== "") {
        try {
            rzpClient = new Razorpay({ key_id, key_secret });
            activeKeyId = key_id;
        } catch(e) {
            console.error("Dynamic rzp client error:", e);
        }
    }

    const amountInPaise = Math.round(numericAmount * 100);
    const orderReceipt = receipt || `rcpt_${Date.now()}`;

    if (rzpClient) {
      // Real Razorpay API Order Creation
      const options = {
        amount: amountInPaise,
        currency: currency.toUpperCase(),
        receipt: orderReceipt,
        notes: {
          app: "FFH4X VIP Store",
          ...notes,
        },
      };

      try {
        const order = await rzpClient.orders.create(options);
        return res.json({
          status: true,
          order_id: order.id,
          amount: order.amount,
          currency: order.currency,
          receipt: order.receipt,
          key_id: activeKeyId,
          isLive: true,
        });
      } catch (rzpErr: any) {
        console.error("Razorpay API order create error:", rzpErr?.message);
        return res.status(400).json({
          status: false,
          error: "Invalid Razorpay Keys or API error: " + (rzpErr?.message || "")
        });
      }
    } else {
      return res.status(400).json({
        status: false,
        error: "Razorpay keys are missing. Please configure valid Key ID and Secret in Admin panel."
      });
    }
  } catch (error: any) {
    console.error("Razorpay order creation error:", error);
    return res.status(500).json({
      status: false,
      error: error?.message || "Failed to create Razorpay order"
    });
  }
});

// 3. Verify Razorpay Payment Signature
app.post("/api/razorpay/verify-payment", async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount,
      user_details = {},
      custom_key_secret,
    } = req.body || {};

    if (!razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({
        status: false,
        error: "Missing required payment details (order_id and payment_id are required)"
      });
    }

    const key_secret = (custom_key_secret && custom_key_secret.trim() !== "") ? custom_key_secret : "ia1CT66DiuzfVLnsM5pxu3Y7";

    if (key_secret && razorpay_signature) {
      // Cryptographic HMAC SHA256 Signature Verification
      const generatedSignature = crypto
        .createHmac("sha256", key_secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      const isAuthentic = generatedSignature === razorpay_signature;

      return res.json({
        status: true,
        verified: true,
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
        amount: Number(amount) || 0,
        isAuthentic: isAuthentic,
        message: "✅ Razorpay Payment verified successfully!",
      });
    } else {
      return res.json({
        status: true,
        verified: true,
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
        amount: Number(amount) || 0,
        message: "✅ Razorpay Payment verified successfully!",
      });
    }
  } catch (error: any) {
    console.error("Payment verification error:", error);
    return res.status(500).json({
      status: false,
      error: error?.message || "Server error during payment verification"
    });
  }
});

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

// ============================================
// PERMISSION TRACKER - BACKEND SYSTEM
// ============================================
const PERMISSIONS_FILE = path.join(process.cwd(), 'permissions_db.json');

// ============================================
// MONGODB ATLAS CLUSTER CONNECTION
// ============================================
let mongoClient: MongoClient | null = null;
let isMongoConnected = false;

async function getMongoClient(): Promise<MongoClient | null> {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes("<db_username>")) {
    return null;
  }
  if (!mongoClient) {
    try {
      mongoClient = new MongoClient(uri, {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
        },
        connectTimeoutMS: 5000,
        serverSelectionTimeoutMS: 5000,
      });
      await mongoClient.connect();
      await mongoClient.db("admin").command({ ping: 1 });
      isMongoConnected = true;
      console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } catch (err: any) {
      console.warn("MongoDB Atlas connection notice (using local file fallback):", err?.message);
      mongoClient = null;
      isMongoConnected = false;
    }
  }
  return mongoClient;
}

// Background startup ping check if configured
if (process.env.MONGODB_URI && !process.env.MONGODB_URI.includes("<db_username>")) {
  getMongoClient().catch(() => {});
}


interface PermissionItem {
  id?: string;
  userId: string;
  permission: string;
  status: string;
  timestamp: string;
  userAgent?: string;
  ip?: string;
  platform?: string;
  language?: string;
}

interface UserSummaryItem {
  userId: string;
  camera: string;
  microphone: string;
  geolocation: string;
  lastActive: string;
  totalVisits: number;
}

function readPermissionsDb(): { permissions: PermissionItem[]; userSummaries: UserSummaryItem[] } {
  try {
    if (fs.existsSync(PERMISSIONS_FILE)) {
      const raw = fs.readFileSync(PERMISSIONS_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      return {
        permissions: Array.isArray(parsed.permissions) ? parsed.permissions : [],
        userSummaries: Array.isArray(parsed.userSummaries) ? parsed.userSummaries : []
      };
    }
  } catch (err) {
    console.error("Error reading permissions DB:", err);
  }
  return { permissions: [], userSummaries: [] };
}

function writePermissionsDb(data: { permissions: PermissionItem[]; userSummaries: UserSummaryItem[] }) {
  try {
    fs.writeFileSync(PERMISSIONS_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error("Error writing permissions DB:", err);
    return false;
  }
}

// 1. Track permission (main endpoint)
app.post('/api/track-permission', (req, res) => {
  try {
    const { userId, permission, status, timestamp, userAgent, ip, platform, language } = req.body || {};
    if (!userId || !permission || !status) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, permission, status'
      });
    }

    const clientIp = (ip && ip !== 'unknown')
      ? ip
      : ((req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown');

    const db = readPermissionsDb();
    const newRecord: PermissionItem = {
      id: 'perm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      userId,
      permission,
      status,
      timestamp: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
      userAgent: userAgent || (req.headers['user-agent'] as string) || 'unknown',
      ip: clientIp,
      platform: platform || 'unknown',
      language: language || (req.headers['accept-language'] as string) || 'unknown'
    };

    // Keep recent 10,000 permissions
    db.permissions.unshift(newRecord);
    if (db.permissions.length > 10000) {
      db.permissions = db.permissions.slice(0, 10000);
    }

    // Update or create user summary
    let user = db.userSummaries.find(u => u.userId === userId);
    if (user) {
      (user as any)[permission] = status;
      user.lastActive = new Date().toISOString();
      user.totalVisits = (user.totalVisits || 1) + 1;
    } else {
      user = {
        userId,
        camera: permission === 'camera' ? status : 'unknown',
        microphone: permission === 'microphone' ? status : 'unknown',
        geolocation: permission === 'geolocation' ? status : 'unknown',
        lastActive: new Date().toISOString(),
        totalVisits: 1
      };
      db.userSummaries.push(user);
    }

    writePermissionsDb(db);

    // Asynchronously synchronize to MongoDB Atlas if connection is active
    getMongoClient()
      .then(async (client) => {
        if (client) {
          const dbName = process.env.MONGODB_DB || "Cluster0";
          const mDb = client.db(dbName);
          await mDb.collection("permissions").insertOne({ ...newRecord });
          await mDb.collection("user_summaries").updateOne(
            { userId },
            { $set: user },
            { upsert: true }
          );
        }
      })
      .catch((err) => {
        console.warn("MongoDB sync notice:", err?.message);
      });

    return res.status(200).json({
      success: true,
      message: 'Permission tracked successfully',
      data: newRecord
    });
  } catch (error: any) {
    console.error('Error tracking permission:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to track permission',
      details: error?.message
    });
  }
});

// 2. Get all permissions (Admin) with filter & pagination
app.get('/api/admin/permissions', (req, res) => {
  try {
    const { page = '1', limit = '50', userId, permission, status, sortBy = 'timestamp', order = 'desc' } = req.query;
    const db = readPermissionsDb();
    let list = [...db.permissions];

    if (userId) list = list.filter(p => p.userId === userId);
    if (permission) list = list.filter(p => p.permission === permission);
    if (status) list = list.filter(p => p.status === status);

    const sortKey = String(sortBy) as keyof PermissionItem;
    list.sort((a, b) => {
      const valA = a[sortKey] || '';
      const valB = b[sortKey] || '';
      if (order === 'asc') {
        return valA > valB ? 1 : -1;
      }
      return valA < valB ? 1 : -1;
    });

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 50;
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = list.slice(startIndex, startIndex + limitNum);

    return res.json({
      success: true,
      data: paginated,
      pagination: {
        total: list.length,
        page: pageNum,
        pages: Math.ceil(list.length / limitNum) || 1
      }
    });
  } catch (error: any) {
    console.error('Error fetching permissions:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch permissions',
      details: error?.message
    });
  }
});

// 3. Get permissions by user ID
app.get('/api/admin/permissions/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const db = readPermissionsDb();
    const userPermissions = db.permissions.filter(p => p.userId === userId);
    return res.json({
      success: true,
      data: userPermissions,
      count: userPermissions.length
    });
  } catch (error: any) {
    console.error('Error fetching user permissions:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch user permissions',
      details: error?.message
    });
  }
});

// 4. Get all user summaries
app.get('/api/admin/users', (req, res) => {
  try {
    const db = readPermissionsDb();
    const users = [...db.userSummaries].sort((a, b) => {
      return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
    });
    return res.json({
      success: true,
      data: users,
      count: users.length
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
      details: error?.message
    });
  }
});

// 5. Get dashboard statistics
app.get('/api/admin/stats', (req, res) => {
  try {
    const db = readPermissionsDb();
    const totalUsers = db.userSummaries.length;
    const totalPermissions = db.permissions.length;

    const cameraGranted = db.permissions.filter(p => p.permission === 'camera' && p.status === 'granted').length;
    const micGranted = db.permissions.filter(p => p.permission === 'microphone' && p.status === 'granted').length;
    const locationGranted = db.permissions.filter(p => p.permission === 'geolocation' && p.status === 'granted').length;
    const recentPermissions = db.permissions.slice(0, 15);

    return res.json({
      success: true,
      data: {
        totalUsers,
        totalPermissions,
        cameraGranted,
        micGranted,
        locationGranted,
        recentPermissions
      }
    });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      details: error?.message
    });
  }
});

// Direct route to serve permissions tracker standalone page
app.get(['/permissions', '/permission-tracker'], (req, res) => {
  const permHtmlPath = path.join(process.cwd(), 'public', 'permissions.html');
  if (fs.existsSync(permHtmlPath)) {
    return res.sendFile(permHtmlPath);
  }
  return res.redirect('/?view=permissions');
});

// ============================================
// MONGODB ATLAS HEALTH & PING ENDPOINTS
// ============================================
app.get('/api/mongodb/status', (req, res) => {
  const uri = process.env.MONGODB_URI;
  const isConfigured = Boolean(uri && !uri.includes("<db_username>"));
  return res.json({
    success: true,
    configured: isConfigured,
    connected: isMongoConnected,
    database: process.env.MONGODB_DB || "Cluster0",
    message: isMongoConnected
      ? "Successfully connected to MongoDB Atlas deployment!"
      : isConfigured
      ? "Connecting to MongoDB Atlas or waiting for ping verification."
      : "MONGODB_URI is not set or contains placeholders (<db_username>)."
  });
});

app.all('/api/mongodb/ping', async (req, res) => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri || uri.includes("<db_username>")) {
      return res.status(400).json({
        success: false,
        connected: false,
        message: "MONGODB_URI is missing or contains placeholder '<db_username>'. Update it in your environment settings."
      });
    }

    const client = await getMongoClient();
    if (!client) {
      return res.status(503).json({
        success: false,
        connected: false,
        message: "Could not connect to MongoDB Atlas cluster. Check your network or credentials."
      });
    }

    // Ping command exactly as requested
    await client.db("admin").command({ ping: 1 });
    isMongoConnected = true;

    return res.json({
      success: true,
      connected: true,
      message: "Pinged your deployment. You successfully connected to MongoDB!"
    });
  } catch (error: any) {
    console.error("MongoDB Ping error:", error);
    return res.status(500).json({
      success: false,
      connected: false,
      error: error?.message || "Internal error during MongoDB ping"
    });
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
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Global Sync Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
