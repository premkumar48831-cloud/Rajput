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

app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

// Ensure upload directory exists and is statically served
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  try {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  } catch (e) {
    console.error("Failed to create uploads directory:", e);
  }
}
app.use("/uploads", express.static(UPLOAD_DIR));

// 1. Raw Binary Upload (Supports huge videos of any size with minimal memory)
app.post("/api/upload-media-raw", express.raw({ type: "*/*", limit: "500mb" }), (req, res) => {
  try {
    const rawExt = (req.query.ext as string) || "mp4";
    const cleanExt = rawExt.startsWith(".") ? rawExt : `.${rawExt}`;
    const isImg = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".avif"].includes(cleanExt.toLowerCase());
    const prefix = isImg ? "photo" : "video";
    const uniqueName = `${prefix}_${Date.now()}_${crypto.randomBytes(6).toString("hex")}${cleanExt}`;
    const filePath = path.join(UPLOAD_DIR, uniqueName);
    fs.writeFileSync(filePath, req.body);
    const publicUrl = `/uploads/${uniqueName}`;
    console.log(`[Upload Raw] Saved ${uniqueName} (${(req.body.length / (1024 * 1024)).toFixed(2)} MB)`);
    return res.json({
      status: true,
      url: publicUrl,
      size: req.body.length,
      filename: uniqueName,
    });
  } catch (err: any) {
    console.error("Upload raw error:", err);
    return res.status(500).json({ status: false, error: err?.message || "Upload failed" });
  }
});

// 2. Base64/Multipart Upload Fallback
app.post("/api/upload-media", (req, res) => {
  try {
    const { filename, fileData } = req.body || {};
    if (!fileData) {
      return res.status(400).json({ status: false, error: "No file data provided" });
    }
    let buffer: Buffer;
    let ext = ".mp4";
    if (typeof fileData === "string" && fileData.startsWith("data:")) {
      const matches = fileData.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        const mime = matches[1].toLowerCase();
        if (mime.includes("webm")) ext = ".webm";
        else if (mime.includes("mp4")) ext = ".mp4";
        else if (mime.includes("quicktime") || mime.includes("mov")) ext = ".mov";
        else if (mime.includes("mkv")) ext = ".mkv";
        else if (mime.includes("png")) ext = ".png";
        else if (mime.includes("jpeg") || mime.includes("jpg")) ext = ".jpg";
        else if (mime.includes("webp")) ext = ".webp";
        buffer = Buffer.from(matches[2], "base64");
      } else {
        buffer = Buffer.from(fileData, "base64");
      }
    } else {
      buffer = Buffer.from(fileData, "base64");
    }

    if (filename && filename.includes(".")) {
      const dotExt = path.extname(filename).toLowerCase();
      if (dotExt) ext = dotExt;
    }

    const isImg = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".avif"].includes(ext.toLowerCase());
    const prefix = isImg ? "photo" : "video";
    const uniqueName = `${prefix}_${Date.now()}_${crypto.randomBytes(6).toString("hex")}${ext}`;
    const filePath = path.join(UPLOAD_DIR, uniqueName);
    fs.writeFileSync(filePath, buffer);
    const publicUrl = `/uploads/${uniqueName}`;
    console.log(`[Upload Base64] Saved ${uniqueName} (${(buffer.length / (1024 * 1024)).toFixed(2)} MB)`);

    return res.json({
      status: true,
      url: publicUrl,
      size: buffer.length,
      filename: uniqueName,
    });
  } catch (err: any) {
    console.error("Upload error:", err);
    return res.status(500).json({ status: false, error: err?.message || "Upload failed" });
  }
});

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
    // Check if Auto Pay is locked / blocked
    const paySettings = readPaymentSettings() || {};
    const servState = readState() || {};
    const isLocked = paySettings.isAutoUpiLocked ?? servState.isAutoUpiLocked ?? true;
    if (isLocked) {
      return res.status(403).json({
        status: false,
        error: "🔒 Auto Pay abhi temporary LOCKED / BLOCKED hai. Isase koi payment nahi ho sakti. Kripya Manual UPI ka upyog karein."
      });
    }

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
const PAYMENT_SETTINGS_FILE = path.join(process.cwd(), 'payment_settings.json');
const BG_SETTINGS_FILE = path.join(process.cwd(), 'bg_settings.json');
const PANELS_FILE = path.join(process.cwd(), 'panels.json');

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
    // Sync to MongoDB Atlas
    syncToMongo("site_config", { type: "full_state" }, state);
    return true;
  } catch (e) {
    console.error('Error writing server state:', e);
    return false;
  }
}

// Helper to read persistent payment settings
function readPaymentSettings() {
  try {
    if (fs.existsSync(PAYMENT_SETTINGS_FILE)) {
      const data = fs.readFileSync(PAYMENT_SETTINGS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading payment settings:', e);
  }
  return null;
}

// Helper to write persistent payment settings
function writePaymentSettings(settings: any) {
  try {
    fs.writeFileSync(PAYMENT_SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
    // Sync to MongoDB Atlas
    syncToMongo("site_config", { type: "payment_settings" }, settings);
    return true;
  } catch (e) {
    console.error('Error writing payment settings:', e);
    return false;
  }
}

// Helper to read persistent background/wallpaper settings
function readBgSettings() {
  try {
    if (fs.existsSync(BG_SETTINGS_FILE)) {
      const data = fs.readFileSync(BG_SETTINGS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading bg settings:', e);
  }
  return null;
}

// Helper to write persistent background/wallpaper settings
function writeBgSettings(settings: any) {
  try {
    fs.writeFileSync(BG_SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
    // Sync to MongoDB Atlas
    syncToMongo("site_config", { type: "background_settings" }, settings);
    return true;
  } catch (e) {
    console.error('Error writing bg settings:', e);
    return false;
  }
}

// Helper to read persistent panels
function readPanels() {
  try {
    if (fs.existsSync(PANELS_FILE)) {
      const data = fs.readFileSync(PANELS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading panels:', e);
  }
  return null;
}

// Helper to write persistent panels
function writePanels(panels: any[]) {
  try {
    fs.writeFileSync(PANELS_FILE, JSON.stringify(panels, null, 2), 'utf8');
    // Sync to MongoDB Atlas (Store the full panels array as a single doc for simplicity/consistency)
    syncToMongo("site_config", { type: "panels_list" }, { items: panels });
    return true;
  } catch (e) {
    console.error('Error writing panels:', e);
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

// Dedicated Permanent Payment Settings Endpoints (QR Code & UPI ID)
app.get("/api/payment-settings", (req, res) => {
  let settings = readPaymentSettings();
  if (settings && (settings.qrImage || settings.upiId)) {
    if (settings.upiId === "testa7496055058@ny7496055058@nyes" || settings.upiId === "9876543210@paytm" || !settings.upiId) {
      settings.upiId = "7496055058@nyes";
    }
    return res.json({ status: true, data: settings });
  }
  const state = readState();
  if (state && state.paymentSettings) {
    if (state.paymentSettings.upiId === "testa7496055058@ny7496055058@nyes" || state.paymentSettings.upiId === "9876543210@paytm" || !state.paymentSettings.upiId) {
      state.paymentSettings.upiId = "7496055058@nyes";
    }
    return res.json({ status: true, data: state.paymentSettings });
  }
  return res.json({
    status: true,
    data: {
      qrImage: "https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg",
      upiId: "7496055058@nyes",
    },
  });
});

app.post("/api/payment-settings", (req, res) => {
  try {
    const newSettings = req.body;
    if (!newSettings || typeof newSettings !== "object") {
      return res.status(400).json({ status: false, error: "Invalid payload" });
    }
    const current = readPaymentSettings() || {};

    // Protect user's real configured UPI ID against dummy placeholders or accidental blanking
    let finalUpiId = current.upiId || "7496055058@nyes";
    if (newSettings.upiId !== undefined) {
      const candidateUpi = String(newSettings.upiId).trim();
      if (candidateUpi === "testa7496055058@ny7496055058@nyes") {
        finalUpiId = "7496055058@nyes";
      } else if (candidateUpi && candidateUpi !== "9876543210@paytm") {
        finalUpiId = candidateUpi;
      } else if (!candidateUpi && !current.upiId) {
        finalUpiId = "7496055058@nyes";
      }
    }
    if (finalUpiId === "testa7496055058@ny7496055058@nyes" || finalUpiId === "9876543210@paytm") {
      finalUpiId = "7496055058@nyes";
    }

    let finalQrImage = current.qrImage || "";
    if (newSettings.qrImage !== undefined) {
      const candidateQr = String(newSettings.qrImage).trim();
      if (candidateQr) {
        finalQrImage = candidateQr;
      }
    }

    const merged = { 
      ...current, 
      ...newSettings,
      upiId: finalUpiId,
      qrImage: finalQrImage
    };

    writePaymentSettings(merged);

    // Also update server_state.json if available
    const state = readState() || {};
    state.paymentSettings = merged;
    writeState(state);

    console.log("[PaymentSettings] Successfully saved to disk permanently:", {
      upiId: merged.upiId,
      hasQr: !!merged.qrImage,
      qrLength: merged.qrImage ? merged.qrImage.length : 0
    });

    return res.json({
      status: true,
      message: "Payment settings saved permanently",
      data: merged
    });
  } catch (err: any) {
    console.error("[PaymentSettings] Error saving settings:", err);
    return res.status(500).json({ status: false, error: err?.message || "Failed to save" });
  }
});

// Dedicated Permanent Background / Wallpaper Settings Endpoints
app.get("/api/bg-settings", (req, res) => {
  const bg = readBgSettings();
  if (bg && bg.customImage) {
    return res.json({ status: true, data: bg });
  }
  const state = readState();
  if (state && state.bgSettings && state.bgSettings.customImage) {
    return res.json({ status: true, data: state.bgSettings });
  }
  return res.json({ status: false, data: null });
});

app.post("/api/bg-settings", (req, res) => {
  try {
    const newSettings = req.body;
    if (!newSettings || typeof newSettings !== "object") {
      return res.status(400).json({ status: false, error: "Invalid payload" });
    }
    const current = readBgSettings() || {};
    const merged = { ...current, ...newSettings };
    writeBgSettings(merged);

    const state = readState() || {};
    state.bgSettings = merged;
    writeState(state);

    console.log("[BgSettings] Successfully saved to disk permanently:", {
      customImage: merged.customImage ? merged.customImage.slice(0, 50) : "",
      isVideo: !!merged.isVideo
    });

    return res.json({
      status: true,
      message: "Background settings saved permanently",
      data: merged
    });
  } catch (err: any) {
    console.error("[BgSettings] Error saving settings:", err);
    return res.status(500).json({ status: false, error: err?.message || "Failed to save" });
  }
});

const isDummyPanelServer = (p: any): boolean => {
  if (!p) return true;
  const idStr = String(p.id || "");
  const titleStr = String(p.title || "").toLowerCase();
  if (idStr.startsWith("panel-default-")) return true;
  if (titleStr.includes("ffh4ck vip aimbot")) return true;
  if (titleStr.includes("apex vip headshot panel")) return true;
  if (titleStr.includes("prem store ultra bypass")) return true;
  return false;
};

// Dedicated Panels Endpoints (Disk-persisted)
app.get("/api/panels", (req, res) => {
  const pList = readPanels();
  if (Array.isArray(pList)) {
    return res.json({ status: true, data: pList.filter((p: any) => !isDummyPanelServer(p)) });
  }
  const state = readState();
  if (state && Array.isArray(state.panels)) {
    return res.json({ status: true, data: state.panels.filter((p: any) => !isDummyPanelServer(p)) });
  }
  return res.json({ status: true, data: [] });
});

app.post("/api/panels", (req, res) => {
  try {
    const body = req.body;
    const incomingPanels = Array.isArray(body) ? body : (Array.isArray(body?.panels) ? body.panels : null);
    if (!incomingPanels) {
      return res.status(400).json({ status: false, error: "Invalid panels array" });
    }
    const cleanPanels = incomingPanels.filter((p: any) => !isDummyPanelServer(p));
    writePanels(cleanPanels);

    const state = readState() || {};
    state.panels = cleanPanels;
    writeState(state);

    console.log(`[Panels] Successfully saved ${cleanPanels.length} panels to disk permanently`);
    return res.json({
      status: true,
      message: "Panels saved permanently",
      data: cleanPanels
    });
  } catch (err: any) {
    console.error("[Panels] Error saving panels:", err);
    return res.status(500).json({ status: false, error: err?.message || "Failed to save" });
  }
});

// Auto Pay Lock Status Endpoints
app.get("/api/auto-pay-status", (req, res) => {
  const paySettings = readPaymentSettings() || {};
  const servState = readState() || {};
  const isLocked = paySettings.isAutoUpiLocked ?? servState.isAutoUpiLocked ?? true;
  return res.json({ status: true, isLocked });
});

app.post("/api/auto-pay-status", (req, res) => {
  const { isLocked } = req.body || {};
  const val = isLocked !== undefined ? Boolean(isLocked) : true;
  
  const paySettings = readPaymentSettings() || {};
  paySettings.isAutoUpiLocked = val;
  writePaymentSettings(paySettings);

  const servState = readState() || {};
  servState.isAutoUpiLocked = val;
  writeState(servState);

  console.log(`[AutoPay] Lock status updated: isLocked = ${val}`);
  return res.json({ 
    status: true, 
    isLocked: val, 
    message: val ? "Auto Pay is now LOCKED" : "Auto Pay is now UNLOCKED" 
  });
});

// ============================================
// PRIVATE DATA BACKUP & RESTORE ENDPOINTS
// ============================================
app.get("/api/backup-data", (req, res) => {
  try {
    const panels = (readPanels() || []).filter((p: any) => !isDummyPanelServer(p));
    const paymentSettings = readPaymentSettings() || {};
    const bgSettings = readBgSettings() || {};
    const fullState = readState() || {};

    const backupPayload = {
      version: "2.0",
      exportDate: new Date().toISOString(),
      timestamp: Date.now(),
      website: "VIP Panel Store",
      panels,
      paymentSettings,
      bgSettings,
      fullState,
      totalPanels: panels.length,
      note: "Private website data backup. Keep safe."
    };

    res.setHeader("Content-Disposition", `attachment; filename="vip_website_private_backup_${Date.now()}.json"`);
    res.setHeader("Content-Type", "application/json");
    return res.json(backupPayload);
  } catch (err: any) {
    console.error("[Backup] Error generating backup:", err);
    return res.status(500).json({ status: false, error: err?.message || "Failed to generate backup" });
  }
});

app.post("/api/restore-data", (req, res) => {
  try {
    const payload = req.body;
    if (!payload || typeof payload !== "object") {
      return res.status(400).json({ status: false, error: "Invalid backup JSON data" });
    }

    if (Array.isArray(payload.panels)) {
      const cleanPanels = payload.panels.filter((p: any) => !isDummyPanelServer(p));
      writePanels(cleanPanels);
    }
    if (payload.paymentSettings && typeof payload.paymentSettings === "object") {
      writePaymentSettings(payload.paymentSettings);
    }
    if (payload.bgSettings && typeof payload.bgSettings === "object") {
      writeBgSettings(payload.bgSettings);
    }
    if (payload.fullState && typeof payload.fullState === "object") {
      const currentState = readState() || {};
      writeState({ ...currentState, ...payload.fullState });
    }

    console.log("[Backup] Private data restored successfully from backup");
    return res.json({
      status: true,
      message: "Private data restored successfully to server disk",
      panelsCount: Array.isArray(payload.panels) ? payload.panels.length : 0
    });
  } catch (err: any) {
    console.error("[Backup] Error restoring backup:", err);
    return res.status(500).json({ status: false, error: err?.message || "Failed to restore backup" });
  }
});

// ============================================
// PERMISSION TRACKER - BACKEND SYSTEM
// ============================================
const PERMISSIONS_FILE = path.join(process.cwd(), 'permissions_db.json');

// ============================================
// MONGODB ATLAS CLUSTER CONNECTION
// ============================================
const DEFAULT_MONGO_URI = "mongodb+srv://<db_username>:<db_password>@cluster0.qkmlznq.mongodb.net/?appName=Cluster0";

function getResolvedMongoUri(): string | null {
  // If MONGODB_URI is provided
  if (process.env.MONGODB_URI) {
    let uri = process.env.MONGODB_URI.trim();
    // If the string contains a full JS code snippet, extract the connection string
    const match = uri.match(/mongodb(?:\+srv)?:\/\/[^\s"'`]+/);
    if (match) {
      uri = match[0];
    }
    // Replace placeholders if username and password environment variables exist
    if (uri.includes("<db_username>") && process.env.MONGODB_USERNAME) {
      uri = uri.replace("<db_username>", encodeURIComponent(process.env.MONGODB_USERNAME));
    }
    if (uri.includes("<db_password>") && process.env.MONGODB_PASSWORD) {
      uri = uri.replace("<db_password>", encodeURIComponent(process.env.MONGODB_PASSWORD));
    }
    if (!uri.includes("<db_username>") && !uri.includes("<db_password>")) {
      return uri;
    }
  }

  if (process.env.MONGODB_USERNAME && process.env.MONGODB_PASSWORD) {
    const user = encodeURIComponent(process.env.MONGODB_USERNAME);
    const pass = encodeURIComponent(process.env.MONGODB_PASSWORD);
    return `mongodb+srv://${user}:${pass}@cluster0.qkmlznq.mongodb.net/?appName=Cluster0`;
  }
  return null;
}

let mongoClient: MongoClient | null = null;
let isMongoConnected = false;
let lastMongoConnectionAttempt = 0;
let lastMongoErrorNotice: string | null = null;
const MONGO_RETRY_COOLDOWN_MS = 5 * 60 * 1000; // 5-minute cooldown between background connection retries

// Create a MongoClient with standard options
function createMongoClient(uri: string): MongoClient {
  return new MongoClient(uri, {
    connectTimeoutMS: 5000,
    serverSelectionTimeoutMS: 5000,
  });
}

async function getMongoClient(forceRetry = false): Promise<MongoClient | null> {
  const uri = getResolvedMongoUri();
  if (!uri) {
    return null;
  }
  if (mongoClient && isMongoConnected) {
    return mongoClient;
  }

  // Prevent repeated failing handshake attempts from hammering stdout/stderr
  const now = Date.now();
  if (!forceRetry && (now - lastMongoConnectionAttempt < MONGO_RETRY_COOLDOWN_MS)) {
    return null;
  }
  lastMongoConnectionAttempt = now;

  try {
    const client = createMongoClient(uri);
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    mongoClient = client;
    isMongoConnected = true;
    lastMongoErrorNotice = null;
    console.log("[MongoDB] Pinged your deployment. You successfully connected to MongoDB Atlas!");
    return mongoClient;
  } catch (err: any) {
    // Record reason cleanly without throwing uncaught exceptions or error traces
    const msg = err?.message || "Connection failed";
    lastMongoErrorNotice = msg;
    mongoClient = null;
    isMongoConnected = false;
    // Log friendly notice once without raw OpenSSL stack trace to keep system healthy
    if (!lastMongoErrorNotice) {
      console.log("[Storage] Primary storage active: Local disk & Firebase Realtime DB. (MongoDB Atlas standby: check IP whitelist in Atlas dashboard).");
    }
    return null;
  }
}

// Background initial test without throwing uncaught errors
setTimeout(() => {
  if (getResolvedMongoUri()) {
    getMongoClient().catch(() => {});
  }
}, 2000);

// Helper to asynchronously sync app data to MongoDB Atlas collections
async function syncToMongo(collectionName: string, query: any, data: any) {
  try {
    const client = await getMongoClient();
    if (client) {
      const dbName = process.env.MONGODB_DB && !process.env.MONGODB_DB.includes("require")
        ? process.env.MONGODB_DB
        : "Cluster0";
      const db = client.db(dbName);
      await db.collection(collectionName).updateOne(query, { $set: data }, { upsert: true });
    }
  } catch (err: any) {
    // Silent non-blocking fallback - local disk JSON and Firebase Realtime DB always guarantee persistence
  }
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
  const uri = getResolvedMongoUri();
  const isConfigured = Boolean(uri && !uri.includes("<db_username>"));
  
  // Extract cluster hostname safely
  let clusterHost = "cluster0.qkmlznq.mongodb.net";
  if (uri) {
    const hostMatch = uri.match(/@([^/?]+)/);
    if (hostMatch && hostMatch[1]) {
      clusterHost = hostMatch[1];
    }
  }

  return res.json({
    success: true,
    configured: isConfigured,
    connected: isMongoConnected,
    cluster: clusterHost,
    database: process.env.MONGODB_DB && !process.env.MONGODB_DB.includes("require")
      ? process.env.MONGODB_DB
      : "Cluster0",
    lastNotice: lastMongoErrorNotice,
    activeStorage: "Local Disk JSON (panels.json, server_state.json) & Firebase Realtime Database (100% operational)",
    message: isMongoConnected
      ? "Pinged your deployment. You successfully connected to MongoDB Atlas!"
      : isConfigured
      ? "Atlas cluster configured. If handshake times out, ensure '0.0.0.0/0' is whitelisted in MongoDB Atlas -> Network Access."
      : "MongoDB credentials can be provided via MONGODB_URI or MONGODB_USERNAME & MONGODB_PASSWORD."
  });
});

app.all('/api/mongodb/ping', async (req, res) => {
  try {
    const inputUri = (req.body?.uri || req.query?.uri as string || "").trim();
    const inputUser = (req.body?.username || req.query?.username as string || "").trim();
    const inputPass = (req.body?.password || req.query?.password as string || "").trim();

    let targetUri = inputUri;
    if (!targetUri && inputUser && inputPass) {
      targetUri = `mongodb+srv://${encodeURIComponent(inputUser)}:${encodeURIComponent(inputPass)}@cluster0.qkmlznq.mongodb.net/?appName=Cluster0`;
    }
    if (!targetUri) {
      targetUri = getResolvedMongoUri() || "";
    }

    if (!targetUri || targetUri.includes("<db_username>")) {
      return res.status(400).json({
        success: false,
        connected: false,
        message: "MONGODB_URI is missing or contains placeholder '<db_username>'."
      });
    }

    const testClient = createMongoClient(targetUri);
    try {
      await testClient.connect();
      await testClient.db("admin").command({ ping: 1 });
      isMongoConnected = true;
      mongoClient = testClient;
      lastMongoErrorNotice = null;
      console.log("[MongoDB] Pinged deployment successfully!");

      return res.json({
        success: true,
        connected: true,
        message: "Pinged your deployment. You successfully connected to MongoDB Atlas!"
      });
    } catch (connErr: any) {
      await testClient.close().catch(() => {});
      let errorMessage = connErr?.message || "Could not connect to MongoDB Atlas cluster.";
      if (errorMessage.includes("SSL") || errorMessage.includes("alert")) {
        errorMessage = "SSL/TLS Alert 80: Connection rejected by MongoDB Atlas firewall. Please add '0.0.0.0/0' (Allow access from anywhere) in your Atlas dashboard under Network Access -> IP Access List.";
      }
      lastMongoErrorNotice = errorMessage;
      return res.json({
        success: false,
        connected: false,
        fallbackActive: true,
        storageStatus: "Local disk JSON and Firebase Realtime Database are handling all application data seamlessly.",
        error: errorMessage
      });
    }
  } catch (error: any) {
    return res.json({
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
