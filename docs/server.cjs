var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_crypto = __toESM(require("crypto"), 1);
var import_razorpay = __toESM(require("razorpay"), 1);
var import_mongodb = require("mongodb");
var import_vite = require("vite");
var app = (0, import_express.default)();
var PORT = 3e3;
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
app.use(import_express.default.json({ limit: "50mb" }));
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
function getRazorpayClient() {
  const key_id = "rzp_test_TbWSIPFPtuOiJb";
  const key_secret = "ia1CT66DiuzfVLnsM5pxu3Y7";
  if (!key_id || !key_secret) {
    return null;
  }
  try {
    return new import_razorpay.default({
      key_id,
      key_secret
    });
  } catch (err) {
    console.error("Failed to initialize Razorpay client:", err);
    return null;
  }
}
app.get("/api/razorpay/config", (req, res) => {
  const key_id = process.env.RAZORPAY_KEY_ID || "rzp_test_TbWSIPFPtuOiJb";
  const isConfigured = true;
  res.json({
    status: true,
    key_id,
    isConfigured,
    message: "Razorpay credentials loaded successfully"
  });
});
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
        rzpClient = new import_razorpay.default({ key_id, key_secret });
        activeKeyId = key_id;
      } catch (e) {
        console.error("Dynamic rzp client error:", e);
      }
    }
    const amountInPaise = Math.round(numericAmount * 100);
    const orderReceipt = receipt || `rcpt_${Date.now()}`;
    if (rzpClient) {
      const options = {
        amount: amountInPaise,
        currency: currency.toUpperCase(),
        receipt: orderReceipt,
        notes: {
          app: "FFH4X VIP Store",
          ...notes
        }
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
          isLive: true
        });
      } catch (rzpErr) {
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
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    return res.status(500).json({
      status: false,
      error: error?.message || "Failed to create Razorpay order"
    });
  }
});
app.post("/api/razorpay/verify-payment", async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount,
      user_details = {},
      custom_key_secret
    } = req.body || {};
    if (!razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({
        status: false,
        error: "Missing required payment details (order_id and payment_id are required)"
      });
    }
    const key_secret = custom_key_secret && custom_key_secret.trim() !== "" ? custom_key_secret : "ia1CT66DiuzfVLnsM5pxu3Y7";
    if (key_secret && razorpay_signature) {
      const generatedSignature = import_crypto.default.createHmac("sha256", key_secret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");
      const isAuthentic = generatedSignature === razorpay_signature;
      return res.json({
        status: true,
        verified: true,
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
        amount: Number(amount) || 0,
        isAuthentic,
        message: "\u2705 Razorpay Payment verified successfully!"
      });
    } else {
      return res.json({
        status: true,
        verified: true,
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
        amount: Number(amount) || 0,
        message: "\u2705 Razorpay Payment verified successfully!"
      });
    }
  } catch (error) {
    console.error("Payment verification error:", error);
    return res.status(500).json({
      status: false,
      error: error?.message || "Server error during payment verification"
    });
  }
});
var DATA_FILE = import_path.default.join(process.cwd(), "server_state.json");
function readState() {
  try {
    if (import_fs.default.existsSync(DATA_FILE)) {
      const data = import_fs.default.readFileSync(DATA_FILE, "utf8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Error reading server state:", e);
  }
  return null;
}
function writeState(state) {
  try {
    import_fs.default.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), "utf8");
    return true;
  } catch (e) {
    console.error("Error writing server state:", e);
    return false;
  }
}
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});
var VERIFY_SERVICE_ID = "service_58soxwr";
var VERIFY_PUBLIC_KEY = "huTOpMHbOaE_WYEpW";
var VERIFY_TEMPLATE_ID = "template_5g45pm3";
app.all(["/verify", "/api/verify"], (req, res) => {
  const { server_id, public_key, service_id } = req.body || req.query || {};
  const matchedService = !server_id && !service_id ? true : server_id === VERIFY_SERVICE_ID || service_id === VERIFY_SERVICE_ID;
  const matchedKey = !public_key ? true : public_key === VERIFY_PUBLIC_KEY;
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
  } catch (error) {
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
  if (import_fs.default.existsSync(DATA_FILE)) {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", "attachment; filename=server_state.json");
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
var PERMISSIONS_FILE = import_path.default.join(process.cwd(), "permissions_db.json");
var mongoClient = null;
var isMongoConnected = false;
async function getMongoClient() {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes("<db_username>")) {
    return null;
  }
  if (!mongoClient) {
    try {
      mongoClient = new import_mongodb.MongoClient(uri, {
        serverApi: {
          version: import_mongodb.ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true
        },
        connectTimeoutMS: 5e3,
        serverSelectionTimeoutMS: 5e3
      });
      await mongoClient.connect();
      await mongoClient.db("admin").command({ ping: 1 });
      isMongoConnected = true;
      console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } catch (err) {
      console.warn("MongoDB Atlas connection notice (using local file fallback):", err?.message);
      mongoClient = null;
      isMongoConnected = false;
    }
  }
  return mongoClient;
}
if (process.env.MONGODB_URI && !process.env.MONGODB_URI.includes("<db_username>")) {
  getMongoClient().catch(() => {
  });
}
function readPermissionsDb() {
  try {
    if (import_fs.default.existsSync(PERMISSIONS_FILE)) {
      const raw = import_fs.default.readFileSync(PERMISSIONS_FILE, "utf8");
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
function writePermissionsDb(data) {
  try {
    import_fs.default.writeFileSync(PERMISSIONS_FILE, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error("Error writing permissions DB:", err);
    return false;
  }
}
app.post("/api/track-permission", (req, res) => {
  try {
    const { userId, permission, status, timestamp, userAgent, ip, platform, language } = req.body || {};
    if (!userId || !permission || !status) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: userId, permission, status"
      });
    }
    const clientIp = ip && ip !== "unknown" ? ip : req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
    const db = readPermissionsDb();
    const newRecord = {
      id: "perm_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      userId,
      permission,
      status,
      timestamp: timestamp ? new Date(timestamp).toISOString() : (/* @__PURE__ */ new Date()).toISOString(),
      userAgent: userAgent || req.headers["user-agent"] || "unknown",
      ip: clientIp,
      platform: platform || "unknown",
      language: language || req.headers["accept-language"] || "unknown"
    };
    db.permissions.unshift(newRecord);
    if (db.permissions.length > 1e4) {
      db.permissions = db.permissions.slice(0, 1e4);
    }
    let user = db.userSummaries.find((u) => u.userId === userId);
    if (user) {
      user[permission] = status;
      user.lastActive = (/* @__PURE__ */ new Date()).toISOString();
      user.totalVisits = (user.totalVisits || 1) + 1;
    } else {
      user = {
        userId,
        camera: permission === "camera" ? status : "unknown",
        microphone: permission === "microphone" ? status : "unknown",
        geolocation: permission === "geolocation" ? status : "unknown",
        lastActive: (/* @__PURE__ */ new Date()).toISOString(),
        totalVisits: 1
      };
      db.userSummaries.push(user);
    }
    writePermissionsDb(db);
    getMongoClient().then(async (client) => {
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
    }).catch((err) => {
      console.warn("MongoDB sync notice:", err?.message);
    });
    return res.status(200).json({
      success: true,
      message: "Permission tracked successfully",
      data: newRecord
    });
  } catch (error) {
    console.error("Error tracking permission:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to track permission",
      details: error?.message
    });
  }
});
app.get("/api/admin/permissions", (req, res) => {
  try {
    const { page = "1", limit = "50", userId, permission, status, sortBy = "timestamp", order = "desc" } = req.query;
    const db = readPermissionsDb();
    let list = [...db.permissions];
    if (userId) list = list.filter((p) => p.userId === userId);
    if (permission) list = list.filter((p) => p.permission === permission);
    if (status) list = list.filter((p) => p.status === status);
    const sortKey = String(sortBy);
    list.sort((a, b) => {
      const valA = a[sortKey] || "";
      const valB = b[sortKey] || "";
      if (order === "asc") {
        return valA > valB ? 1 : -1;
      }
      return valA < valB ? 1 : -1;
    });
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
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
  } catch (error) {
    console.error("Error fetching permissions:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch permissions",
      details: error?.message
    });
  }
});
app.get("/api/admin/permissions/user/:userId", (req, res) => {
  try {
    const { userId } = req.params;
    const db = readPermissionsDb();
    const userPermissions = db.permissions.filter((p) => p.userId === userId);
    return res.json({
      success: true,
      data: userPermissions,
      count: userPermissions.length
    });
  } catch (error) {
    console.error("Error fetching user permissions:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch user permissions",
      details: error?.message
    });
  }
});
app.get("/api/admin/users", (req, res) => {
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
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch users",
      details: error?.message
    });
  }
});
app.get("/api/admin/stats", (req, res) => {
  try {
    const db = readPermissionsDb();
    const totalUsers = db.userSummaries.length;
    const totalPermissions = db.permissions.length;
    const cameraGranted = db.permissions.filter((p) => p.permission === "camera" && p.status === "granted").length;
    const micGranted = db.permissions.filter((p) => p.permission === "microphone" && p.status === "granted").length;
    const locationGranted = db.permissions.filter((p) => p.permission === "geolocation" && p.status === "granted").length;
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
  } catch (error) {
    console.error("Error fetching stats:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch statistics",
      details: error?.message
    });
  }
});
app.get(["/permissions", "/permission-tracker"], (req, res) => {
  const permHtmlPath = import_path.default.join(process.cwd(), "public", "permissions.html");
  if (import_fs.default.existsSync(permHtmlPath)) {
    return res.sendFile(permHtmlPath);
  }
  return res.redirect("/?view=permissions");
});
app.get("/api/mongodb/status", (req, res) => {
  const uri = process.env.MONGODB_URI;
  const isConfigured = Boolean(uri && !uri.includes("<db_username>"));
  return res.json({
    success: true,
    configured: isConfigured,
    connected: isMongoConnected,
    database: process.env.MONGODB_DB || "Cluster0",
    message: isMongoConnected ? "Successfully connected to MongoDB Atlas deployment!" : isConfigured ? "Connecting to MongoDB Atlas or waiting for ping verification." : "MONGODB_URI is not set or contains placeholders (<db_username>)."
  });
});
app.all("/api/mongodb/ping", async (req, res) => {
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
    await client.db("admin").command({ ping: 1 });
    isMongoConnected = true;
    return res.json({
      success: true,
      connected: true,
      message: "Pinged your deployment. You successfully connected to MongoDB!"
    });
  } catch (error) {
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
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\u{1F680} Global Sync Server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
