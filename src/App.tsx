import React, { useState, useEffect, useRef } from "react";
import lordPremThrone from "./assets/images/lord_prem_throne_1786425782320.jpg";
import { LiveNotifications } from "./components/LiveNotifications";
import { RazorpayButton } from "./components/RazorpayButton";
import { RazorpayCheckoutModal } from "./components/RazorpayCheckoutModal";
import { PermissionTracker } from "./components/PermissionTracker";
import { AdminPermissionTracker } from "./components/AdminPermissionTracker";
import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  set,
  onValue,
  push,
  onDisconnect,
  remove,
} from "firebase/database";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from "firebase/auth";
import emailjs from "@emailjs/browser";
import {
  Menu,
  Wallet,
  Filter,
  Search,
  Play,
  Zap,
  ChevronDown,
  ChevronUp,
  Download,
  Youtube,
  Send,
  X,
  LayoutDashboard,
  PlusCircle,
  Key,
  Dices,
  Gift,
  User,
  Headset,
  LogIn,
  Copy,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  Receipt,
  CreditCard,
  Hourglass,
  Loader2,
  Trash2,
  Edit,
  Image as ImageIcon,
  Sparkles,
  Palette,
  CheckCircle,
  CheckCircle2,
  UserPlus,
  ExternalLink,
  FolderDown,
  MessageCircle,
  Tag,
  Clock,
  ShoppingBag,
  Camera,
  QrCode,
  Globe,
  Share2,
  Save,
  Check,
  Eye,
  EyeOff,
  Home,
  Volume2,
  VolumeX,
  ShieldCheck,
  Users,
  Percent,
  Award,
  Coins,
  Mail,
  AlertCircle,
  AlertTriangle,
  Megaphone,
  Upload,
  Lock,
  FileText,
  Film,
  Maximize2,
  Pause,
} from "lucide-react";

export function formatExternalUrl(url?: string | null): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed || trimmed === "#") return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function ensureArray<T = any>(val: any): T[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "object") return Object.values(val) as T[];
  return [];
}

export function parseFeaturesList(rawFeatures: any, fallbackDesc?: string): string[] {
  if (!rawFeatures) {
    if (fallbackDesc && typeof fallbackDesc === "string") {
      const parts = fallbackDesc
        .split(/[\n\r,;|•]+/)
        .map((s) => s.replace(/^[-*•\d+.)\s]+/, "").trim())
        .filter(Boolean);
      if (parts.length > 0) return parts;
    }
    return [
      "Main Id safe",
      "Full safe NONROOT",
      "Esp crack anti-blacklist",
      "Auto headshot 100% working",
    ];
  }

  let list: any[] = [];
  if (Array.isArray(rawFeatures)) {
    list = rawFeatures;
  } else if (typeof rawFeatures === "object" && rawFeatures !== null) {
    list = Object.values(rawFeatures);
  } else if (typeof rawFeatures === "string") {
    list = rawFeatures.split(/[\n\r]+/);
    if (list.length <= 1 && rawFeatures.includes(",")) {
      list = rawFeatures.split(",");
    }
  }

  const result: string[] = list
    .map((item) => {
      if (typeof item === "string") {
        return item.replace(/^[-*•\d+.)\s]+/, "").trim();
      }
      if (typeof item === "object" && item !== null) {
        const val = item.name || item.title || item.text || item.label || item.value || "";
        return String(val).replace(/^[-*•\d+.)\s]+/, "").trim();
      }
      return String(item || "").replace(/^[-*•\d+.)\s]+/, "").trim();
    })
    .filter(Boolean);

  if (result.length > 0) return result;

  return [
    "Main Id safe",
    "Full safe NONROOT",
    "Esp crack anti-blacklist",
    "Auto headshot 100% working",
  ];
}

const compressImageBase64 = (base64Str: string, maxWidth = 800, maxHeight = 800): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => resolve(base64Str);
  });
};

export async function uploadMediaFileToServer(file: File): Promise<{ url: string; isVideo: boolean }> {
  const isVideo =
    file.type.startsWith("video/") ||
    /\.(mp4|mov|webm|mkv|avi|3gp|m4v)$/i.test(file.name);
  const ext = file.name.split(".").pop() || (isVideo ? "mp4" : "jpg");

  // Attempt 1: Raw binary upload (fast, supports huge videos of any size without memory bloat)
  try {
    const res = await fetch(`/api/upload-media-raw?ext=${ext}`, {
      method: "POST",
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
      body: file,
    });
    if (res.ok) {
      const data = await res.json();
      if (data.status && data.url) {
        return { url: data.url, isVideo };
      }
    }
  } catch (err) {
    console.warn("Raw binary upload failed, trying base64 fallback:", err);
  }

  // Attempt 2: Base64 JSON upload
  try {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const res = await fetch("/api/upload-media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        fileData: base64,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.status && data.url) {
        return { url: data.url, isVideo };
      }
    }
  } catch (err) {
    console.warn("Base64 upload failed:", err);
  }

  // Fallback: Object URL
  return { url: URL.createObjectURL(file), isVideo };
}

export function processAsyncMediaUpload(
  file: File,
  onStartLoading?: () => void,
  onFinishLoading?: (mediaUrl: string, isVideo: boolean) => void,
) {
  if (!file) return;
  if (onStartLoading) onStartLoading();

  const isVideo =
    file.type.startsWith("video/") ||
    /\.(mp4|mov|webm|mkv|avi|3gp|m4v)$/i.test(file.name);

  uploadMediaFileToServer(file)
    .then(({ url }) => {
      if (onFinishLoading) {
        onFinishLoading(url, isVideo);
      }
    })
    .catch((err) => {
      console.error("processAsyncMediaUpload error:", err);
      const fallbackUrl = URL.createObjectURL(file);
      if (onFinishLoading) {
        onFinishLoading(fallbackUrl, isVideo);
      }
    });
}

export function sanitizeForFirebase<T>(obj: T): T {
  if (obj === undefined) return "" as any;
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeForFirebase(item)) as any;
  }
  const cleanObj: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj as Record<string, any>)) {
    if (val !== undefined) {
      if (typeof val === "string" && val.length > 500000) {
        // Prevent huge base64 payloads from freezing Firebase Realtime Database
        cleanObj[key] = val.substring(0, 500);
      } else {
        cleanObj[key] = sanitizeForFirebase(val);
      }
    }
  }
  return cleanObj as T;
}

export function getYouTubeInfo(url: string | undefined | null) {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  let videoId: string | null = null;

  // Direct 11-character video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    videoId = trimmed;
  } else {
    // Matching regex for YouTube URLs (shorts, watch?v=, youtu.be, embed, v, live, etc.)
    const regExp =
      /^.*(?:youtu\.be\/|v\/|u\/\w\/|embed\/|shorts\/|live\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = trimmed.match(regExp);
    if (match && match[1] && match[1].length === 11) {
      videoId = match[1];
    }
  }

  if (videoId) {
    return {
      videoId,
      embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&enablejsapi=1`,
      thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      fallbackThumbnailUrl: `https://img.youtube.com/vi/${videoId}/0.jpg`,
      hqThumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      mqThumbnailUrl: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
      maxResThumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
      youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
    };
  }
  return null;
}

// FIREBASE GOOGLE LOGIN & DATABASE CONFIG (ffh4ckjodvipff)
const firebaseConfig = {
  apiKey: "AIzaSyDnylEQQKI-PbVCnBgNY9zx5Vx85yi3SCo",
  authDomain: "ffh4ckjodvipff.firebaseapp.com",
  databaseURL: "https://ffh4ckjodvipff-default-rtdb.firebaseio.com",
  projectId: "ffh4ckjodvipff",
  storageBucket: "ffh4ckjodvipff.firebasestorage.app",
  messagingSenderId: "382512487880",
  appId: "1:382512487880:web:c212a8b5386b5b5141b4fd",
  measurementId: "G-VSY9CHJ412",
};

const firebaseApp = initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp);

// Universal Realtime Database Cloud Sync Helpers
export const saveToFirebase = async (path: string, data: any) => {
  try {
    const clean = sanitizeForFirebase(data);
    await set(ref(database, path), clean);
    await set(ref(database, `appState/${path}`), clean);
    console.log(`[Firebase] Successfully synced ${path} to cloud`);
  } catch (err) {
    console.error(`[Firebase] Error syncing ${path}:`, err);
  }
};

export const savePanelsToFirebase = async (panelsList: any[]) => {
  try {
    const clean = sanitizeForFirebase(panelsList);
    await set(ref(database, "panels"), clean);
    await set(ref(database, "appState/panels"), clean);
    console.log("[Firebase] Panels successfully synced to cloud");
  } catch (err) {
    console.error("[Firebase] Error syncing panels:", err);
  }
};

const sanitizeUpiId = (upi?: string) => {
  const trimmed = (upi || "").trim();
  if (!trimmed || trimmed === "9876543210@paytm" || trimmed === "testa7496055058@ny7496055058@nyes") {
    return "7496055058@nyes";
  }
  return trimmed;
};

const DEFAULT_PAYMENT_SETTINGS = {
  qrImage:
    "https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg",
  upiId: "7496055058@nyes",
  cashfreeAppId: "",
  cashfreeSecretKey: "",
  cashfreeCode: "",
  razorpayAppId: "rzp_test_TbWSIPFPtuOiJb",
  razorpaySecretKey: "ia1CT66DiuzfVLnsM5pxu3Y7",
  razorpayCode: "",
  activeGateway: "none",
};

const DEFAULT_BG_SETTINGS = {
  enabled: true,
  customImage:
    "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop",
  isVideo: false,
  enableFlowers: true,
  flowerSpeed: 1,
  darknessOverlay: 0,
  themeHue: 0,
};

const DEFAULT_SUPPORT_LINKS = {
  telegram: "https://t.me/yourchannel",
  whatsapp: "https://wa.me/1234567890",
  ownerTelegram: "https://t.me/Premjodvip",
};

const DEFAULT_ACCESS_FILE_STEPS = {
  step1Title: "Step 1: Watch YouTube Video Tutorial",
  step1Url: "https://www.youtube.com",
  step2Title: "Step 2: Join Telegram Channel For Files",
  step2Url: "https://t.me/yourchannel",
  step3Title: "Step 3: Join WhatsApp Group For Support",
  step3Url: "https://wa.me/1234567890",
  directFileUrl: "https://t.me/yourchannel",
};

const DEFAULT_BANNER_SETTINGS = {
  bannerEnabled: true,
  bannerTitle: "🔥 FFH4CK VIP PREM STORE - SAFE MODS & ZERO BAN 🔥",
  bannerSubtitle: "Instant 24/7 Auto Delivery • 100% Antiban Guaranteed",
  bannerImage:
    "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop",
  bannerLink: "https://t.me/Premjodvip",
  marqueeEnabled: true,
  marqueeText:
    "⚡ WELCOME TO PREM STORE ⚡ • 24/7 AUTO KEY DELIVERY • 100% SAFE ESP & AIMBOT • REFER FRIENDS & EARN ₹50 DIRECT BONUS • OWNER TELEGRAM: @PREMJODVIP",
  popupEnabled: false,
  popupTitle: "📢 SPECIAL ANNOUNCEMENT",
  popupMessage:
    "Welcome to Prem Store! All new VIP panels are updated with 100% Antiban protection. Enjoy 24/7 instant delivery!",
};

const initDB = () => {
  return new Promise<IDBDatabase>((resolve, reject) => {
    try {
      if (typeof indexedDB === "undefined") {
        return reject("IndexedDB not supported");
      }
      const request = indexedDB.open("app_media_db", 1);
      request.onupgradeneeded = (e: any) => {
        try {
          e.target.result.createObjectStore("media");
        } catch (err) {}
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
};

const DEFAULT_STORE_PANELS = [
  {
    id: "panel-default-1",
    title: "🔥 FFH4CK VIP AIMBOT & ESP (MOD MENU)",
    category: "VIP ESP & AIMBOT",
    badge: "PREMIUM PANELS",
    features: [
      "100% Main ID Safe Antiban",
      "Auto Headshot 100% Accuracy",
      "ESP Line, Name & Distance",
      "Bullet Tracking & No Recoil",
    ],
    description: "100% Antiban VIP Mod for Free Fire with Aimbot, ESP Line, Name, Distance & Bullet Tracking.",
    status: "Active",
    installLink: "https://t.me/Premjodvip",
    videoTutorial: "https://t.me/Premjodvip",
    options: [
      { label: "1 Day", price: 50 },
      { label: "7 Day", price: 180 },
      { label: "30 Day", price: 350 },
    ],
    pricingPlans: [
      { label: "1 Day", price: 50 },
      { label: "7 Day", price: 180 },
      { label: "30 Day", price: 350 },
    ],
  },
  {
    id: "panel-default-2",
    title: "⚡ APEX VIP HEADSHOT PANEL v3.5",
    category: "HEADSHOT PANEL",
    badge: "VIP MOD MENU",
    features: [
      "High Headshot Accuracy 99%",
      "Safe Main Account ID",
      "Super Smooth Bypass All Devices",
      "Anti-Blacklist Anti-Detection",
    ],
    description: "High headshot accuracy, safe main account ID, super smooth bypass for all devices.",
    status: "Active",
    installLink: "https://t.me/Premjodvip",
    videoTutorial: "https://t.me/Premjodvip",
    options: [
      { label: "1 Day", price: 40 },
      { label: "7 Day", price: 140 },
      { label: "30 Day", price: 250 },
    ],
    pricingPlans: [
      { label: "1 Day", price: 40 },
      { label: "7 Day", price: 140 },
      { label: "30 Day", price: 250 },
    ],
  },
  {
    id: "panel-default-3",
    title: "👑 PREM STORE ULTRA BYPASS v4.0",
    category: "BYPASS & MOD",
    badge: "EXCLUSIVE BYPASS",
    features: [
      "Ultra Bypass for PC & Mobile",
      "Zero Lag High FPS Mode",
      "Anti-Blacklist Protection",
      "Instant Server Unban Fix",
    ],
    description: "Ultra Bypass for PC & Mobile Emulator, zero lag, anti-blacklist protection.",
    status: "Active",
    installLink: "https://t.me/Premjodvip",
    videoTutorial: "https://t.me/Premjodvip",
    options: [
      { label: "1 Day", price: 60 },
      { label: "7 Day", price: 220 },
      { label: "30 Day", price: 450 },
    ],
    pricingPlans: [
      { label: "1 Day", price: 60 },
      { label: "7 Day", price: 220 },
      { label: "30 Day", price: 450 },
    ],
  },
];

const saveMediaToDB = async (key: string, data: any, isVideo: boolean) => {
  try {
    const db = await initDB();
    db.transaction("media", "readwrite").objectStore("media").put({ data, isVideo }, key);
  } catch (e) {
    console.error("Failed to save media to DB", e);
  }
};

const getMediaFromDB = async (key: string): Promise<{ data: any; isVideo: boolean } | null> => {
  try {
    const db = await initDB();
    return new Promise((resolve) => {
      const request = db.transaction("media").objectStore("media").get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
};

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState<
    | "home"
    | "addFund"
    | "spinWin"
    | "referEarn"
    | "admin"
    | "adminUserHistory"
    | "adminPayment"
    | "adminKeys"
    | "adminSpin"
    | "adminRefer"
    | "login"
    | "profile"
    | "customerSupport"
    | "adminSupport"
    | "adminPaymentSettings"
    | "adminCashfree"
    | "adminRazorpay"
    | "adminLogins"
    | "adminAddPanel"
    | "adminDeletePanel"
    | "adminEditPanel"
    | "adminBgImage"
    | "adminAccessFiles"
    | "keyPending"
    | "adminOwner"
    | "staff"
    | "adminBanner"
    | "policies"
    | "permissions"
    | "adminPermissions"
  >("home");
  const [staffTab, setStaffTab] = useState<
    | "overview"
    | "addPanel"
    | "house"
    | "managePanels"
    | "supportLinks"
    | "users"
    | "payments"
    | "userBanner"
    | "fullHistory"
    | "pendingKeys"
    | "colorTheme"
    | "resellers"
    | "emailKey"
    | "refundPanel"
  >("overview");
  const [staffSearchUser, setStaffSearchUser] = useState("");
  const [staffSearchPayment, setStaffSearchPayment] = useState("");
  const [staffEditingPanel, setStaffEditingPanel] = useState<any | null>(null);
  const [staffPassword, setStaffPassword] = useState("");
  const [showAdminAuthModal, setShowAdminAuthModal] = useState(false);
  const [adminAuthPass, setAdminAuthPass] = useState("");

  // Check URL parameters on mount for direct view routing (e.g. ?view=permissions)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get("view");
      if (viewParam === "permissions") {
        setCurrentView("permissions");
      } else if (viewParam === "adminPermissions") {
        setCurrentView("adminPermissions");
      }
    } catch {
      // ignore
    }
  }, []);

  // Reseller System State (Google Auth & Differential Pricing)
  const [showSecretAdminToast, setShowSecretAdminToast] = useState(false);
  const [showResellerModal, setShowResellerModal] = useState(false);
  const [isSigningInGoogle, setIsSigningInGoogle] = useState(false);
  const [resellerLoginEmail, setResellerLoginEmail] = useState("");
  const [resellerLoginPass, setResellerLoginPass] = useState("");
  const [searchResellerQuery, setSearchResellerQuery] = useState("");
  const [newResellerForm, setNewResellerForm] = useState({
    email: "",
    name: "",
    phone: "",
    balance: 500,
    isApproved: true,
  });

  const [resellerUser, setResellerUser] = useState<{
    isLoggedIn: boolean;
    email: string;
    name: string;
    phone?: string;
    balance: number;
    isApproved: boolean;
  }>(() => {
    try {
      const saved = sessionStorage.getItem("app_resellerUser");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      isLoggedIn: false,
      email: "",
      name: "",
      balance: 0,
      isApproved: false,
    };
  });

  useEffect(() => {
    try {
      sessionStorage.setItem("app_resellerUser", JSON.stringify(resellerUser));
    } catch (e) {}
  }, [resellerUser]);

  const [approvedResellers, setApprovedResellers] = useState<
    {
      email: string;
      name?: string;
      phone?: string;
      balance: number;
      isApproved: boolean;
      discountPercent?: number;
      createdAt: string;
    }[]
  >([
    {
      email: "pramk9992@gmail.com",
      name: "Pramod Kumar (Main VIP Reseller)",
      phone: "9876543210",
      balance: 1500,
      isApproved: true,
      discountPercent: 35,
      createdAt: "2026-08-01 10:00:00",
    },
    {
      email: "reseller1@gmail.com",
      name: "Apex VIP Reseller",
      phone: "9812345678",
      balance: 500,
      isApproved: true,
      discountPercent: 30,
      createdAt: "2026-08-10 14:30:00",
    },
  ]);

  useEffect(() => {
    saveToFirebase("approvedResellers", approvedResellers);
  }, [approvedResellers]);

  const handleGoogleResellerSignIn = async () => {
    try {
      setIsSigningInGoogle(true);
      const auth = getAuth(firebaseApp);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      if (user && user.email) {
        const cleanEmail = user.email.toLowerCase().trim();
        const existing = approvedResellers.find(
          (r) => r.email.toLowerCase() === cleanEmail,
        );
        if (existing) {
          setResellerUser({
            isLoggedIn: true,
            email: existing.email,
            name: existing.name || user.displayName || "Reseller VIP",
            phone: existing.phone || "",
            balance: existing.balance || 0,
            isApproved: existing.isApproved !== false,
          });
          alert(
            `🎉 Welcome back, ${user.displayName || cleanEmail}!\nReseller VIP Access Activated with ₹${existing.balance} Wallet Balance.`,
          );
        } else {
          // Auto register new Google account as approved reseller
          const newReseller = {
            email: cleanEmail,
            name: user.displayName || "Google Verified Reseller",
            phone: "",
            balance: 500,
            isApproved: true,
            discountPercent: 35,
            createdAt: new Date().toLocaleString(),
          };
          setApprovedResellers((prev) => [newReseller, ...prev]);
          setResellerUser({
            isLoggedIn: true,
            email: cleanEmail,
            name: user.displayName || "Google Verified Reseller",
            balance: 500,
            isApproved: true,
          });
          alert(
            `🎉 Google Sign-in Verified!\nApproved Reseller VIP profile activated for: ${cleanEmail}`,
          );
        }
      }
    } catch (err: any) {
      console.warn(
        "Google Auth popup issue or blocked in iframe, offering instant direct fallback:",
        err,
      );
      const manualEmail = prompt(
        "Google Sign-In popup restricted in preview. Enter your Reseller Gmail ID to verify VIP access:",
        "pramk9992@gmail.com",
      );
      if (manualEmail && manualEmail.includes("@")) {
        const cleanEmail = manualEmail.toLowerCase().trim();
        const existing = approvedResellers.find(
          (r) => r.email.toLowerCase() === cleanEmail,
        );
        if (existing) {
          setResellerUser({
            isLoggedIn: true,
            email: existing.email,
            name: existing.name || "Verified Reseller",
            phone: existing.phone || "",
            balance: existing.balance || 0,
            isApproved: existing.isApproved !== false,
          });
          alert(
            `🎉 Logged in as Approved Reseller: ${cleanEmail} (Wallet: ₹${existing.balance})`,
          );
        } else {
          const newReseller = {
            email: cleanEmail,
            name: "Verified Reseller",
            phone: "",
            balance: 500,
            isApproved: true,
            discountPercent: 35,
            createdAt: new Date().toLocaleString(),
          };
          setApprovedResellers((prev) => [newReseller, ...prev]);
          setResellerUser({
            isLoggedIn: true,
            email: cleanEmail,
            name: "Verified Reseller",
            balance: 500,
            isApproved: true,
          });
          alert(`🎉 Reseller VIP Account Activated for ${cleanEmail}!`);
        }
      }
    } finally {
      setIsSigningInGoogle(false);
    }
  };

  const handleManualResellerLogin = () => {
    const emailVal = resellerLoginEmail.toLowerCase().trim();
    if (!emailVal || !emailVal.includes("@")) {
      alert("Kripya valid Reseller Gmail ID enter karein!");
      return;
    }
    const existing = approvedResellers.find(
      (r) => r.email.toLowerCase() === emailVal,
    );
    if (existing) {
      if (!existing.isApproved) {
        alert(
          "⚠️ Aapka Reseller Account abhi Admin dwara PENDING hai. Admin dwara approve hone ke baad VIP rates milenge.",
        );
        return;
      }
      setResellerUser({
        isLoggedIn: true,
        email: existing.email,
        name: existing.name || "Verified Reseller",
        phone: existing.phone || "",
        balance: existing.balance || 0,
        isApproved: true,
      });
      alert(
        `🎉 Reseller Login Successful! Welcome ${existing.name || emailVal}. Wallet: ₹${existing.balance}`,
      );
      setResellerLoginEmail("");
      setResellerLoginPass("");
    } else {
      // Auto-create and approve
      const newReseller = {
        email: emailVal,
        name: "Verified Reseller",
        phone: "",
        balance: 500,
        isApproved: true,
        discountPercent: 35,
        createdAt: new Date().toLocaleString(),
      };
      setApprovedResellers((prev) => [newReseller, ...prev]);
      setResellerUser({
        isLoggedIn: true,
        email: emailVal,
        name: "Verified Reseller",
        balance: 500,
        isApproved: true,
      });
      alert(`🎉 Reseller Account created and VIP activated for ${emailVal}!`);
      setResellerLoginEmail("");
      setResellerLoginPass("");
    }
  };

  // EMAILJS KEY SENDER SYSTEM (Configured with User's Exact IDs)
  const EMAILJS_PUBLIC_KEY = "huTOpMHbOaE_WYEpW";
  const EMAILJS_SERVICE_ID = "service_v7djd5d";
  const EMAILJS_TEMPLATE_ID = "template_5g45pm3";

  const [emailJsConfig, setEmailJsConfig] = useState({
    publicKey: EMAILJS_PUBLIC_KEY,
    serviceId: EMAILJS_SERVICE_ID,
    templateId: EMAILJS_TEMPLATE_ID,
  });

  useEffect(() => {
    saveToFirebase("emailJsConfig", emailJsConfig);
  }, [emailJsConfig]);

  const [showEmailJsConfigSettings, setShowEmailJsConfigSettings] =
    useState(false);

  useEffect(() => {
    try {
      if (emailJsConfig.publicKey) {
        emailjs.init(emailJsConfig.publicKey.trim());
      }
    } catch (e) {
      console.warn("EmailJS init warning:", e);
    }
  }, [emailJsConfig.publicKey]);

  const [sendKeyEmailForm, setSendKeyEmailForm] = useState({
    userEmail: "",
    keyValue: "",
    adminMessage: "",
  });

  const [emailSendingStatus, setEmailSendingStatus] = useState<{
    loading: boolean;
    status: "idle" | "sending" | "success" | "error";
    message: string;
  }>({
    loading: false,
    status: "idle",
    message: "",
  });

  const handleSendKeyToUser = async (
    targetEmail?: string,
    targetKey?: string,
    targetMsg?: string,
  ) => {
    // 1. इनपुट फ़ील्ड्स से डेटा प्राप्त करना
    const emailElem = document.getElementById(
      "userEmail",
    ) as HTMLInputElement | null;
    const keyElem = document.getElementById(
      "keyValue",
    ) as HTMLInputElement | null;
    const msgElem = document.getElementById(
      "adminMessage",
    ) as HTMLTextAreaElement | null;
    const statusElem = document.getElementById("statusMessage");

    const rawEmail = (
      targetEmail ||
      (emailElem ? emailElem.value : sendKeyEmailForm.userEmail) ||
      ""
    ).trim();
    const cleanEmail = rawEmail
      .replace(/[\u200B-\u200D\uFEFF\u00A0\r\n\t]/g, "")
      .trim();
    const key = (
      targetKey ||
      (keyElem ? keyElem.value : sendKeyEmailForm.keyValue) ||
      ""
    ).trim();
    const message = (
      targetMsg !== undefined
        ? targetMsg
        : (msgElem ? msgElem.value : sendKeyEmailForm.adminMessage) || ""
    ).trim();

    // 2. अगर ईमेल या की खाली है, तो फॉर्म सबमिट न होने दें (खाली ईमेल से 422 एरर आता है)
    if (!cleanEmail || !key) {
      if (statusElem) {
        statusElem.innerText = "कृपया सही Email और Key दोनों भरें!";
        statusElem.style.color = "red";
      }
      setEmailSendingStatus({
        loading: false,
        status: "error",
        message: "कृपया सही Email और Key दोनों भरें!",
      });
      alert("कृपया सही Email और Key दोनों भरें!");
      return false;
    }

    if (statusElem) {
      statusElem.innerText = "भेजा जा रहा है...";
      statusElem.style.color = "blue";
    }

    setEmailSendingStatus({
      loading: true,
      status: "sending",
      message: `भेजा जा रहा है (${cleanEmail})... कृपया प्रतीक्षा करें।`,
    });

    // 3. टेम्प्लेट वेरिएबल्स (EmailJS डैशबोर्ड template_5g45pm3 से 100% मैच)
    const templateParams: Record<string, string> = {
      user_email: cleanEmail, // EmailJS के "To Email" {{user_email}} के लिए
      to_email: cleanEmail, // बैकअप {{to_email}} के लिए
      email: cleanEmail, // बैकअप {{email}} के लिए
      to: cleanEmail, // बैकअप {{to}} के लिए
      key_value: key, // {{key_value}} के लिए
      key: key, // बैकअप {{key}} के लिए
      admin_message: message, // {{admin_message}} के लिए
      message: message, // बैकअप {{message}} के लिए
    };

    const sId = (emailJsConfig.serviceId || EMAILJS_SERVICE_ID).trim();
    const tId = (emailJsConfig.templateId || EMAILJS_TEMPLATE_ID).trim();
    const pKey = (emailJsConfig.publicKey || EMAILJS_PUBLIC_KEY).trim();

    try {
      emailjs.init(pKey);

      let sentSuccess = false;
      let responseDetails = "";

      try {
        const response = await emailjs.send(sId, tId, templateParams, pKey);
        console.log("SUCCESS!", response.status, response.text);
        sentSuccess = response.status === 200 || response.text === "OK";
        responseDetails = response.text || "OK";
      } catch (sdkError: any) {
        console.warn(
          "SDK send error, fallback to direct EmailJS endpoint...",
          sdkError,
        );
        const restRes = await fetch(
          "https://api.emailjs.com/api/v1.0/email/send",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              service_id: sId,
              template_id: tId,
              user_id: pKey,
              template_params: templateParams,
            }),
          },
        );

        if (restRes.ok) {
          sentSuccess = true;
          responseDetails = await restRes.text();
        } else {
          const errText = await restRes.text();
          console.warn(
            "Direct EmailJS REST failed, trying backend /api/send-email...",
            errText,
          );
          const srvRes = await fetch("/api/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(templateParams),
          });
          if (srvRes.ok) {
            sentSuccess = true;
            responseDetails = "Delivered via server-side gateway";
          } else {
            throw new Error(errText || `HTTP ${restRes.status}`);
          }
        }
      }

      if (sentSuccess) {
        if (statusElem) {
          statusElem.innerText = "सफलतापूर्वक ईमेल भेज दिया गया है!";
          statusElem.style.color = "green";
        }

        setEmailSendingStatus({
          loading: false,
          status: "success",
          message: `सफलतापूर्वक ईमेल (${cleanEmail}) पर Key भेज दिया गया है!`,
        });

        // फॉर्म साफ़ करना
        if (emailElem) emailElem.value = "";
        if (keyElem) keyElem.value = "";
        if (msgElem) msgElem.value = "";

        setSendKeyEmailForm({
          userEmail: "",
          keyValue: "",
          adminMessage: "",
        });

        alert(`✅ सफलतापूर्वक ईमेल (${cleanEmail}) पर Key भेज दिया गया है!`);
        return true;
      }
      return false;
    } catch (error: any) {
      console.log("FAILED...", error);
      const errorMsg =
        "Error " + (error?.status || "422") + ": डेटा मैच नहीं हुआ या खाली है।";

      if (statusElem) {
        statusElem.innerText = errorMsg;
        statusElem.style.color = "red";
      }

      setEmailSendingStatus({
        loading: false,
        status: "error",
        message: errorMsg,
      });

      alert(
        `❌ ${errorMsg}\n\nडिटेल्स: ${error?.text || error?.message || "EmailJS Template में To Email को {{user_email}} पर सेट करें।"}`,
      );
      return false;
    }
  };

  // Expose sendKeyToUser globally on window for direct script execution
  useEffect(() => {
    (window as any).sendKeyToUser = () => handleSendKeyToUser();
  }, [emailJsConfig, sendKeyEmailForm]);

  // Dedicated House / 24Ghanta Private Panel Form State
  const [housePanelForm, setHousePanelForm] = useState({
    title: "PRIVATE LIMITED 24GHANTA PANEL",
    category: "24ghanta",
    image: "",
    isVideo: false,
    videoLink: "",
    telegramLink: "",
    whatsappLink: "",
    featuresText:
      "Private Limited Main ID Safe\nFull safe 24ghanta\nAnti-blacklist ESP & Headshot\n100% Working Private Panel",
    includeHours: true,
    includeDays: true,
    // Hours prices (Requested: 3 House 149, 7 House 230, 15 House 280, 24 House 399)
    price3h: 149,
    price7h: 230,
    price15h: 280,
    price24h: 399,
    // Days prices
    price1d: 499,
    price3d: 999,
    price7d: 1499,
    price15d: 2499,
    price30d: 4999,
  });
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Category");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewMedia, setPreviewMedia] = useState<{
    url: string;
    isVideo?: boolean;
    isImage?: boolean;
    mediaType?: "youtube" | "video" | "photo";
    title?: string;
    youtubeLink?: string;
  } | null>(null);

  // Initial 10% Loading Screen & Modals Sequence
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [loadingPercent, setLoadingPercent] = useState(1);
  const [loadingPhase, setLoadingPhase] = useState<"ring" | "flowers" | "done">(
    "ring",
  );
  const [showLordPremModal, setShowLordPremModal] = useState(false);
  const [showImportantNoticeModal, setShowImportantNoticeModal] =
    useState(false);

  const getAccountKey = (email?: string, phone?: string) => {
    const raw = (email || phone || "").toLowerCase().trim();
    if (!raw) return "guest";
    return raw.replace(/[.#$*+?[\]\\/]/g, "_");
  };

  // Admin Configurable Spin Rewards (e.g., 5, 10, 20, 30, 50)
  const [spinRewards, setSpinRewards] = useState<number[]>([
    5, 10, 20, 30, 50,
  ]);

  useEffect(() => {
    saveToFirebase("spinRewards", spinRewards);
  }, [spinRewards]);

  const [wonCouponModal, setWonCouponModal] = useState<{
    code: string;
    discount: number;
  } | null>(null);

  // Buy Key Checkout Modal & Success Pending Modal State
  const [checkoutData, setCheckoutData] = useState<{
    panelTitle: string;
    planLabel: string;
    originalPrice: number;
    panelObj: any;
  } | null>(null);

  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
  } | null>(null);

  const [couponInputCode, setCouponInputCode] = useState("");
  const [couponErrorMsg, setCouponErrorMsg] = useState("");
  const [couponSuccessMsg, setCouponSuccessMsg] = useState("");
  const [showBuySuccessPendingModal, setShowBuySuccessPendingModal] =
    useState<boolean>(false);

  // New Spin Reward input for admin
  const [newSpinRewardInput, setNewSpinRewardInput] = useState("");

  // Voice Payment Guidance State & Web Speech Synthesis
  const [isSpeakingGuide, setIsSpeakingGuide] = useState(false);

  // 🌸 Female Voice Engine for "Welcome to Prem Store"
  const [hasPlayedIntroVoice, setHasPlayedIntroVoice] = useState(false);

  const playWelcomeVoice = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const text = "Welcome to Prem Store";
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.pitch = 1.18; // Sweet, crisp female voice pitch
      utterance.rate = 0.95; // Clear, natural cadence
      utterance.volume = 1.0; // High clarity

      const voices = window.speechSynthesis.getVoices();
      // Prioritize female voices (Hindi or English)
      const femaleVoice =
        voices.find(
          (v) =>
            (v.name.toLowerCase().includes("female") ||
              v.name.toLowerCase().includes("zira") ||
              v.name.toLowerCase().includes("samantha") ||
              v.name.toLowerCase().includes("kavya") ||
              v.name.toLowerCase().includes("swara") ||
              v.name.toLowerCase().includes("heera") ||
              v.name.toLowerCase().includes("victoria") ||
              v.name.toLowerCase().includes("karen")) &&
            (v.lang.startsWith("hi") || v.lang.startsWith("en")),
        ) ||
        voices.find((v) => v.name.toLowerCase().includes("female")) ||
        voices.find((v) => v.lang === "hi-IN" || v.lang === "en-IN") ||
        voices[0];

      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("Speech synthesis note:", err);
    }
  };

  // Trigger when the website is fully opened (all initial loading & modals dismissed)
  useEffect(() => {
    if (
      !isAppLoading &&
      !showLordPremModal &&
      !showImportantNoticeModal &&
      !hasPlayedIntroVoice
    ) {
      setHasPlayedIntroVoice(true);
      const timer = setTimeout(() => {
        playWelcomeVoice();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [
    isAppLoading,
    showLordPremModal,
    showImportantNoticeModal,
    hasPlayedIntroVoice,
  ]);

  const voiceGuideText =
    "Welcome! Paise add karne ki prakriya behad aasan hai. Step 1: Apna manpasand amount select karein. Step 2: Niche Generate QR Code par click karein. Step 3: Screen par dikh rahe QR code ka screenshot lein aur payment karein. Step 4: Payment ke baad mile 12-digit ke UTR number ko save karein. Step 5: App mein niche I Have Paid par click karein. Step 6: Apna 12-digit ka UTR number enter karein aur Submit Payment par click karein. Aapka transaction surakshit roop se submit ho gaya hai. Thank you!";

  const playPaymentVoiceGuide = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(voiceGuideText);
      utterance.lang = "hi-IN";
      utterance.volume = 1.0; // Loud volume
      utterance.rate = 0.95; // High clarity rate
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const hiVoice = voices.find(
        (v) =>
          v.lang &&
          (v.lang.includes("hi") ||
            v.lang.includes("HI") ||
            v.name.includes("Hindi")),
      );
      if (hiVoice) {
        utterance.voice = hiVoice;
      }

      utterance.onstart = () => setIsSpeakingGuide(true);
      utterance.onend = () => setIsSpeakingGuide(false);
      utterance.onerror = () => setIsSpeakingGuide(false);

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error(e);
    }
  };

  const stopPaymentVoiceGuide = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
    setIsSpeakingGuide(false);
  };

  useEffect(() => {
    if (currentView === "addFund") {
      const timer = setTimeout(() => {
        playPaymentVoiceGuide();
      }, 500);
      return () => {
        clearTimeout(timer);
        stopPaymentVoiceGuide();
      };
    } else {
      stopPaymentVoiceGuide();
    }
  }, [currentView]);

  const isAnyInitialModalOpen =
    isAppLoading || showLordPremModal || showImportantNoticeModal;

  useEffect(() => {
    if (isAnyInitialModalOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      window.scrollTo(0, 0);
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [isAnyInitialModalOpen]);

  useEffect(() => {
    let progressInterval: any;
    if (isAppLoading && loadingPhase === "ring") {
      progressInterval = setInterval(() => {
        setLoadingPercent((prev) => {
          if (prev >= 10) {
            clearInterval(progressInterval);
            setTimeout(() => {
              setIsAppLoading(false);
              setLoadingPhase("done");
              setShowLordPremModal(false);
              setShowImportantNoticeModal(true);
            }, 180);
            return 10;
          }
          return prev + 1;
        });
      }, 35); // Super fast smooth count from 1% to 10% (~350ms total)
    }
    return () => clearInterval(progressInterval);
  }, [isAppLoading, loadingPhase]);

  const [userAccountProfiles, setUserAccountProfiles] = useState<
    Record<
      string,
      {
        avatar?: string;
        keysBought?: number;
        totalAdded?: number;
        joinDate?: string;
      }
    >
  >({});

  useEffect(() => {
    saveToFirebase("userAccountProfiles", userAccountProfiles);
  }, [userAccountProfiles]);

  const [userProfile, setUserProfile] = useState(() => {
    try {
      const saved = sessionStorage.getItem("app_userProfile");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      isLoggedIn: false,
      email: "",
      phone: "",
      password: "",
      avatar:
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
      joinDate: "",
      keysBought: 0,
      totalAdded: 0,
    };
  });

  useEffect(() => {
    try {
      sessionStorage.setItem("app_userProfile", JSON.stringify(userProfile));
    } catch (e) {}
    if (userProfile.isLoggedIn) {
      const key = getAccountKey(userProfile.email, userProfile.phone);
      if (key && key !== "guest") {
        setUserAccountProfiles((prev) => ({
          ...prev,
          [key]: {
            avatar: userProfile.avatar,
            keysBought: userProfile.keysBought,
            totalAdded: userProfile.totalAdded,
            joinDate: userProfile.joinDate,
          },
        }));
      }
    }
  }, [userProfile]);

  // Account-Specific Spin Timestamps, Coupon Used Timestamps, and Account Coupons
  const [userSpinTimestamps, setUserSpinTimestamps] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    saveToFirebase("userSpinTimestamps", userSpinTimestamps);
  }, [userSpinTimestamps]);

  const [userCouponUsedTimestamps, setUserCouponUsedTimestamps] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    saveToFirebase("userCouponUsedTimestamps", userCouponUsedTimestamps);
  }, [userCouponUsedTimestamps]);

  const [userAccountCoupons, setUserAccountCoupons] = useState<
    Record<string, any[]>
  >({});

  useEffect(() => {
    saveToFirebase("userAccountCoupons", userAccountCoupons);
  }, [userAccountCoupons]);

  const activeAccKey = getAccountKey(userProfile.email, userProfile.phone);
  const lastSpinTimestamp = userProfile.isLoggedIn
    ? userSpinTimestamps[activeAccKey] || 0
    : 0;
  const lastCouponUsedTimestamp = userProfile.isLoggedIn
    ? userCouponUsedTimestamps[activeAccKey] || 0
    : 0;
  const userCoupons = userProfile.isLoggedIn
    ? userAccountCoupons[activeAccKey] || []
    : [];

  const [userWallets, setUserWallets] = useState<Record<string, number>>({});

  useEffect(() => {
    saveToFirebase("userWallets", userWallets);
  }, [userWallets]);

  const [userBalance, setUserBalance] = useState(0);

  useEffect(() => {
    if (userProfile.isLoggedIn) {
      const activeKey = getAccountKey(userProfile.email, userProfile.phone);
      if (
        userWallets[activeKey] !== undefined &&
        userWallets[activeKey] !== userBalance
      ) {
        setUserBalance(userWallets[activeKey]);
      }
    }
  }, [
    userWallets,
    userProfile.isLoggedIn,
    userProfile.email,
    userProfile.phone,
  ]);

  useEffect(() => {
    if (userProfile.isLoggedIn) {
      const key = getAccountKey(userProfile.email, userProfile.phone);
      if (key && key !== "guest") {
        setUserWallets((prev) => {
          if (prev[key] === userBalance) return prev;
          const next = { ...prev, [key]: userBalance };
          saveToFirebase("userWallets", next);
          return next;
        });
      }
    }
  }, [
    userBalance,
    userProfile.isLoggedIn,
    userProfile.email,
    userProfile.phone,
  ]);

  const lastAdminSavedPaymentTimeRef = useRef<number>(0);

  const [paymentSettings, setPaymentSettings] = useState(DEFAULT_PAYMENT_SETTINGS);

  const paymentSettingsMountRef = useRef(false);
  useEffect(() => {
    if (!paymentSettingsMountRef.current) {
      paymentSettingsMountRef.current = true;
      return;
    }

    // Only broadcast to server & Firebase if we have a genuine valid custom UPI ID
    const cleanUpi = sanitizeUpiId(paymentSettings.upiId);
    if (cleanUpi) {
      const payload = { ...paymentSettings, upiId: cleanUpi };
      saveToFirebase("paymentSettings", payload);
      fetch("/api/payment-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => {});
    }
  }, [paymentSettings]);

  const [supportLinks, setSupportLinks] = useState(DEFAULT_SUPPORT_LINKS);

  useEffect(() => {
    saveToFirebase("supportLinks", supportLinks);
  }, [supportLinks]);

  const [accessFileSteps, setAccessFileSteps] = useState(
    DEFAULT_ACCESS_FILE_STEPS,
  );

  useEffect(() => {
    saveToFirebase("accessFileSteps", accessFileSteps);
  }, [accessFileSteps]);

  const [showAccessFilesModal, setShowAccessFilesModal] = useState(false);
  const [activePanelFileUrl, setActivePanelFileUrl] = useState("");

  const [bannerSettings, setBannerSettings] = useState(
    DEFAULT_BANNER_SETTINGS,
  );

  useEffect(() => {
    saveToFirebase("bannerSettings", bannerSettings);
  }, [bannerSettings]);

  const [dismissedNoticeModal, setDismissedNoticeModal] = useState(false);

  const [panels, setPanels] = useState<any[]>(DEFAULT_STORE_PANELS);

  useEffect(() => {
    savePanelsToFirebase(panels);
  }, [panels]);

  const [bgSettings, setBgSettings] = useState(DEFAULT_BG_SETTINGS);

  const [isUploadingWallpaper, setIsUploadingWallpaper] = useState(false);
  const [bgMediaError, setBgMediaError] = useState(false);

  useEffect(() => {
    setBgMediaError(false);
  }, [bgSettings.customImage]);

  const bgMountRef = useRef(false);
  useEffect(() => {
    if (!bgMountRef.current) {
      bgMountRef.current = true;
      return;
    }

    if (bgSettings.customImage && bgSettings.customImage.trim() !== "") {
      saveToFirebase("bgSettings", bgSettings);
      fetch("/api/bg-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bgSettings),
      }).catch(() => {});
    }
  }, [bgSettings]);

  const [flowerParticles] = useState(() => {
    const colors = [
      { primary: "#FF0055", secondary: "#FF5A92", center: "#FFE500" }, // Vibrant Rose Red
      { primary: "#FFD600", secondary: "#FFF176", center: "#FF6D00" }, // Sun Gold Yellow
      { primary: "#00E676", secondary: "#B9F6CA", center: "#FFFF00" }, // Emerald Green
      { primary: "#00E5FF", secondary: "#80D8FF", center: "#FFFFFF" }, // Electric Cyan
      { primary: "#3D5AFE", secondary: "#8C9EFF", center: "#00E5FF" }, // Royal Indigo
      { primary: "#D500F9", secondary: "#EA80FC", center: "#FFD600" }, // Vivid Violet
      { primary: "#FF6D00", secondary: "#FFAB40", center: "#FFFF00" }, // Sunset Orange
      { primary: "#FF1744", secondary: "#FF80AB", center: "#FFEA00" }, // Neon Crimson
    ];
    return Array.from({ length: 48 }).map((_, i) => {
      const palette = colors[i % colors.length];
      return {
        id: i,
        left: (i * 2.1 + Math.sin(i * 1.8) * 12 + (i % 3) * 4) % 96,
        size: 14 + (i % 6) * 4, // 14px to 34px smaller size
        duration: 4.5 + (i % 5) * 1.2, // Smooth duration
        delay: (i * 0.28) % 7,
        color: palette.primary,
        secondaryColor: palette.secondary,
        centerColor: palette.center,
      };
    });
  });

  const [expandedPanels, setExpandedPanels] = useState<Record<number, boolean>>(
    {},
  );
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [isUploadingFeedbackMedia, setIsUploadingFeedbackMedia] = useState(false);
  const [isUploadingVideoMedia, setIsUploadingVideoMedia] = useState(false);

  const [newPanelForm, setNewPanelForm] = useState({
    title: "",
    category: "NON ROOT",
    badge: "PREMIUM PANELS",
    image: "",
    isVideo: false,
    videoLink: "",
    installLink: "",
    feedbackLink: "",
    exceptFileLink: "",
    featuresText:
      "Main Id safe\nFull safe NONROOT\nEsp crack anti-blacklist\nAuto headshot 100% working",
    pricingPlans: [
      { label: "1 Day", price: 90 },
      { label: "3 Day", price: 58 },
      { label: "7 Day", price: 67 },
      { label: "15 Day", price: 590 },
      { label: "30 Day", price: 5000 },
    ],
    price1: 90,
    price3: 58,
    price7: 67,
    price15: 590,
    price30: 5000,
  });

  const [editingPanel, setEditingPanel] = useState<{
    id: number;
    title: string;
    category: string;
    image: string;
    isVideo: boolean;
    videoLink: string;
    exceptFileLink: string;
    featuresText: string;
    price1: number;
    price3: number;
    price7: number;
    price15: number;
    price30: number;
  } | null>(null);

  const [unmutedPanels, setUnmutedPanels] = useState<Record<string, boolean>>({});
  const [pausedPanels, setPausedPanels] = useState<Record<string, boolean>>({});
  const [adminPanelSearchQuery, setAdminPanelSearchQuery] = useState("");
  const [adminUserSearchQuery, setAdminUserSearchQuery] = useState("");
  const [addPanelMediaTab, setAddPanelMediaTab] = useState<"photo" | "video" | "youtube">("photo");
  const [editPanelMediaTab, setEditPanelMediaTab] = useState<"photo" | "video" | "youtube">("photo");
  const [editPanelForm, setEditPanelForm] = useState<any>(null);
  const [quickPriceEditId, setQuickPriceEditId] = useState<any>(null);
  const [quickPrices, setQuickPrices] = useState<Record<string, number>>({});

  const [adminBalanceInput, setAdminBalanceInput] = useState<Record<string, string>>({});
  const [adminNewUserForm, setAdminNewUserForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    balance: "0",
  });
  const [showAdminAddUserModal, setShowAdminAddUserModal] = useState(false);

  const [spinRequests, setSpinRequests] = useState<
    {
      id: number;
      email: string;
      phone: string;
      password: string;
      prizeWon: number;
      date: string;
      status: string;
    }[]
  >([]);

  useEffect(() => {
    saveToFirebase("spinRequests", spinRequests);
  }, [spinRequests]);

  const [referRequests, setReferRequests] = useState<
    {
      id: number;
      referrerEmail: string;
      referrerPhone: string;
      referrerPassword: string;
      referredEmail: string;
      referredPhone: string;
      bonusAmount: number;
      date: string;
      status: string;
    }[]
  >([]);

  useEffect(() => {
    saveToFirebase("referRequests", referRequests);
  }, [referRequests]);

  // Admin Configurable Referral Website Link & Bonus Amount
  const [referWebsiteLink, setReferWebsiteLink] = useState<string>(
    "https://website.com",
  );

  useEffect(() => {
    saveToFirebase("referWebsiteLink", referWebsiteLink);
  }, [referWebsiteLink]);

  const [referBonusAmount, setReferBonusAmount] = useState<number>(50);

  useEffect(() => {
    saveToFirebase("referBonusAmount", referBonusAmount);
  }, [referBonusAmount]);

  const [referSettingsSavedMsg, setReferSettingsSavedMsg] = useState("");

  const [isSpinning, setIsSpinning] = useState(false);
  const [spinRotation, setSpinRotation] = useState(0);
  const [spinResult, setSpinResult] = useState<number | null>(null);

  const [keyRequests, setKeyRequests] = useState<
    {
      id: number;
      user: string;
      userEmail?: string;
      userPhone?: string;
      userPassword?: string;
      userAccountKey?: string;
      panel: string;
      planLabel?: string;
      price: number;
      status: string;
      deliveredKey: string;
      date: string;
      exceptFileLink?: string;
    }[]
  >([]);

  useEffect(() => {
    saveToFirebase("keyRequests", keyRequests);
  }, [keyRequests]);

  const [manualKeyForm, setManualKeyForm] = useState({
    targetAccount: "",
    panelTitle: "",
    keyVal: "",
    price: 80,
  });

  const [registeredUsers, setRegisteredUsers] = useState<
    {
      name?: string;
      email: string;
      phone: string;
      password: string;
      avatar?: string;
      joinDate: string;
    }[]
  >([]);

  useEffect(() => {
    saveToFirebase("registeredUsers", registeredUsers);
  }, [registeredUsers]);

  const [bannedUsers, setBannedUsers] = useState<string[]>([]);

  useEffect(() => {
    saveToFirebase("bannedUsers", bannedUsers);
  }, [bannedUsers]);

  const [authStats, setAuthStats] = useState({ logins: 0, logouts: 0 });

  useEffect(() => {
    saveToFirebase("authStats", authStats);
  }, [authStats]);

  const [editingAdminUser, setEditingAdminUser] = useState<{
    originalEmail: string;
    originalPhone: string;
    name: string;
    email: string;
    phone: string;
    password: string;
    avatar: string;
    balance: number;
    joinDate: string;
    showPassword?: boolean;
    activeTab?: "info" | "keys" | "payments";
  } | null>(null);

  const [unreadLogins, setUnreadLogins] = useState(0);
  const [showRejectedAlert, setShowRejectedAlert] = useState(true);
  const [selectedPlans, setSelectedPlans] = useState<Record<number, number>>(
    {},
  );
  const [avatarUrlInput, setAvatarUrlInput] = useState("");

  const handleSaveAvatar = (photoUrlOrBase64: string) => {
    if (!photoUrlOrBase64) return;

    setUserProfile((prev) => ({ ...prev, avatar: photoUrlOrBase64 }));

    const userAccKey = getAccountKey(userProfile.email, userProfile.phone);
    setRegisteredUsers((prev) => {
      const exists = prev.some(
        (u) => getAccountKey(u.email, u.phone) === userAccKey,
      );
      if (exists) {
        return prev.map((u) => {
          if (getAccountKey(u.email, u.phone) === userAccKey) {
            return { ...u, avatar: photoUrlOrBase64 };
          }
          return u;
        });
      } else {
        return [
          {
            name: userProfile.email
              ? userProfile.email?.split("@")[0]
              : userProfile.phone || "User",
            email: userProfile.email || "",
            phone: userProfile.phone || "",
            password: userProfile.password || "",
            avatar: photoUrlOrBase64,
            joinDate: userProfile.joinDate || new Date().toLocaleString(),
          },
          ...prev,
        ];
      }
    });

    alert("✅ Aapki Profile Photo permanent save ho gayi hai!");
  };

  const [isSigningInUserGoogle, setIsSigningInUserGoogle] = useState(false);
  const [userAuthTab, setUserAuthTab] = useState<"login" | "register">("login");
  const [userLoginForm, setUserLoginForm] = useState({
    identifier: "",
    password: "",
  });
  const [userRegisterForm, setUserRegisterForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [userAuthError, setUserAuthError] = useState("");

  const validateEmailFormat = (email: string) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase().trim());
  };

  const validatePhoneFormat = (phone: string) => {
    const cleanDigits = phone.replace(/[\s\-\+]/g, "").slice(-10);
    return /^[6-9]\d{9}$/.test(cleanDigits);
  };

  const processSuccessfulGoogleLogin = (
    emailVal: string,
    displayName: string,
    photoVal: string,
    phoneVal: string,
  ) => {
    const cleanEmail = emailVal.trim().toLowerCase();
    const cleanPhone = phoneVal
      ? phoneVal.replace(/[\s\-\+]/g, "").slice(-10)
      : "";
    const name = displayName || cleanEmail.split("@")[0] || "Google User";
    const avatar =
      photoVal ||
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop";
    const accKey = getAccountKey(cleanEmail, cleanPhone);

    const isExistingInWallets = accKey in userWallets;
    const existingUser = registeredUsers.find(
      (u) => getAccountKey(u.email, u.phone) === accKey,
    );

    if (isExistingInWallets || existingUser) {
      const savedBal = userWallets[accKey] ?? 0;
      const savedAccProfile = userAccountProfiles[accKey];
      setUserBalance(savedBal);
      setUserProfile({
        ...userProfile,
        isLoggedIn: true,
        email: cleanEmail,
        phone: cleanPhone || existingUser?.phone || "",
        password: "GoogleLoginVerified",
        avatar:
          avatar ||
          savedAccProfile?.avatar ||
          existingUser?.avatar ||
          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
        keysBought: savedAccProfile?.keysBought ?? 0,
        totalAdded: savedAccProfile?.totalAdded ?? 0,
        joinDate:
          savedAccProfile?.joinDate ||
          existingUser?.joinDate ||
          new Date().toLocaleString(),
      });
      alert(
        "🎉 स्वागत है " +
          name +
          "!\nGoogle Login सफल हुआ। आपका Wallet Balance: ₹" +
          savedBal,
      );
    } else {
      setUserWallets((prev) => ({ ...prev, [accKey]: 0 }));
      setUserBalance(0);
      const joinDateStr = new Date().toLocaleString();
      setUserAccountProfiles((prev) => ({
        ...prev,
        [accKey]: {
          avatar,
          keysBought: 0,
          totalAdded: 0,
          joinDate: joinDateStr,
        },
      }));
      setUserProfile({
        ...userProfile,
        isLoggedIn: true,
        email: cleanEmail,
        phone: cleanPhone,
        password: "GoogleLoginVerified",
        avatar,
        keysBought: 0,
        totalAdded: 0,
        joinDate: joinDateStr,
      });
      const newUser = {
        name,
        email: cleanEmail,
        phone: cleanPhone,
        password: "GoogleLoginVerified",
        avatar,
        joinDate: joinDateStr,
      };
      setRegisteredUsers((prev) => [newUser, ...prev]);
      setUnreadLogins((prev) => prev + 1);

      try {
        const rtdbRef = ref(database, "registeredUsers");
        set(rtdbRef, [newUser, ...registeredUsers]);
      } catch (e) {}

      alert(
        "🎉 स्वागत है " +
          name +
          "!\nनया Google Account सफलतापूर्वक बन गया है (Wallet Balance: ₹0)।",
      );
    }

    setCurrentView("home");
  };

  const handleGoogleUserSignIn = async () => {
    setUserAuthError("");
    try {
      setIsSigningInUserGoogle(true);
      const auth = getAuth(firebaseApp);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      if (user && user.email) {
        processSuccessfulGoogleLogin(
          user.email,
          user.displayName || "",
          user.photoURL || "",
          user.phoneNumber || "",
        );
      }
    } catch (err: any) {
      console.warn("Google Auth failed:", err);
      setUserAuthError("⚠️ Google Login Failed! Please verify with a real Gmail account. (" + (err.message || "") + ")");
    } finally {
      setIsSigningInUserGoogle(false);
    }
  };

  const handleUserLoginSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setUserAuthError("");
    const rawId = userLoginForm.identifier.trim();
    const pass = userLoginForm.password.trim();

    if (!rawId) {
      setUserAuthError(
        "❌ कृपया अपना Registered Email ID या 10-अंकों का Mobile Number दर्ज करें!",
      );
      return;
    }
    if (!pass) {
      setUserAuthError("❌ कृपया अपना Password दर्ज करें!");
      return;
    }

    const isEmail = rawId.includes("@");
    let cleanEmail = "";
    let cleanPhone = "";

    if (isEmail) {
      if (!validateEmailFormat(rawId)) {
        setUserAuthError(
          "❌ अमान्य Email Format! कृपया सही Email ID (उदा. name@gmail.com) दर्ज करें।",
        );
        return;
      }
      cleanEmail = rawId.toLowerCase();
    } else {
      const digits = rawId.replace(/[\s\-\+]/g, "").slice(-10);
      if (!validatePhoneFormat(digits)) {
        setUserAuthError(
          "❌ अमान्य Mobile Number! कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें (उदा. 9876543210)।",
        );
        return;
      }
      cleanPhone = digits;
    }

    // Strict validation against registeredUsers
    const user = registeredUsers.find((u) => {
      if (cleanEmail && u.email && u.email.toLowerCase() === cleanEmail)
        return true;
      if (
        cleanPhone &&
        u.phone &&
        u.phone.replace(/[\s\-\+]/g, "").slice(-10) === cleanPhone
      )
        return true;
      return false;
    });

    if (!user) {
      setUserAuthError(
        '❌ यह Account मौजूद नहीं है! कोई भी गलत या फर्जी जानकारी से लॉगिन नहीं हो सकता। कृपया पहले "नया अकाउंट बनाएं (Register)" टैब से असली Email & Phone देकर रजिस्टर करें।',
      );
      return;
    }

    if (user.password !== pass && user.password !== "GoogleLoginVerified") {
      setUserAuthError(
        "❌ गलत पासवर्ड (Incorrect Password)! आपने जो पासवर्ड डाला है वह इस अकाउंट से मेल नहीं खाता है। कृपया सही पासवर्ड डालें।",
      );
      return;
    }

    const accKey = getAccountKey(user.email, user.phone);
    const savedBal = userWallets[accKey] ?? 0;
    const savedAccProfile = userAccountProfiles[accKey];

    setUserBalance(savedBal);
    setUserProfile({
      ...userProfile,
      isLoggedIn: true,
      email: user.email || "",
      phone: user.phone || "",
      password: user.password,
      avatar:
        savedAccProfile?.avatar ||
        user.avatar ||
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
      keysBought: savedAccProfile?.keysBought ?? 0,
      totalAdded: savedAccProfile?.totalAdded ?? 0,
      joinDate:
        savedAccProfile?.joinDate ||
        user.joinDate ||
        new Date().toLocaleString(),
    });

    alert(
      "🎉 स्वागत है " +
        (user.name || user.email || user.phone) +
        "!\nलॉगिन सफल हुआ। आपका Wallet Balance: ₹" +
        savedBal,
    );
    setCurrentView("home");
  };

  const handleUserRegisterSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setUserAuthError("");
    const name = userRegisterForm.name.trim();
    const email = userRegisterForm.email.trim().toLowerCase();
    const rawPhone = userRegisterForm.phone.replace(/[\s\-\+]/g, "").slice(-10);
    const pass = userRegisterForm.password.trim();
    const confirmPass = userRegisterForm.confirmPassword.trim();

    if (!name || name.length < 3) {
      setUserAuthError("❌ कृपया अपना असली नाम (कम से कम 3 अक्षर) दर्ज करें!");
      return;
    }
    if (!email || !validateEmailFormat(email)) {
      setUserAuthError(
        "❌ कृपया असली एवं वैध Email ID दर्ज करें (उदा. yourname@gmail.com)! कोई भी फर्जी आईडी स्वीकार नहीं होगी।",
      );
      return;
    }
    if (!rawPhone || !validatePhoneFormat(rawPhone)) {
      setUserAuthError(
        "❌ कृपया 10 अंकों का Real Mobile Number दर्ज करें (उदा. 9876543210)!",
      );
      return;
    }
    if (!pass || pass.length < 6) {
      setUserAuthError("❌ Password कम से कम 6 अक्षरों का होना अनिवार्य है!");
      return;
    }
    if (pass !== confirmPass) {
      setUserAuthError(
        "❌ दोनों Password आपस में मेल नहीं खा रहे हैं! कृपया सही Confirm Password दर्ज करें।",
      );
      return;
    }

    const emailExists = registeredUsers.some(
      (u) => u.email && u.email.toLowerCase() === email,
    );
    if (emailExists) {
      setUserAuthError(
        "❌ यह Email ID (" +
          email +
          ") पहले से रजिस्टर्ड है! कृपया सीधे Login टैब पर जाएं।",
      );
      return;
    }

    const phoneExists = registeredUsers.some(
      (u) =>
        u.phone && u.phone.replace(/[\s\-\+]/g, "").slice(-10) === rawPhone,
    );
    if (phoneExists) {
      setUserAuthError(
        "❌ यह Mobile Number (" +
          rawPhone +
          ") पहले से रजिस्टर्ड है! कृपया सीधे Login टैब पर जाएं।",
      );
      return;
    }

    const joinDateStr = new Date().toLocaleString();
    const freshAvatar =
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop";
    const accKey = getAccountKey(email, rawPhone);

    setUserWallets((prev) => ({ ...prev, [accKey]: 0 }));
    setUserBalance(0);

    setUserAccountProfiles((prev) => ({
      ...prev,
      [accKey]: {
        avatar: freshAvatar,
        keysBought: 0,
        totalAdded: 0,
        joinDate: joinDateStr,
      },
    }));

    const newUser = {
      name,
      email,
      phone: rawPhone,
      password: pass,
      avatar: freshAvatar,
      joinDate: joinDateStr,
    };

    setRegisteredUsers((prev) => [newUser, ...prev]);
    setUnreadLogins((prev) => prev + 1);

    setUserProfile({
      ...userProfile,
      isLoggedIn: true,
      email,
      phone: rawPhone,
      password: pass,
      avatar: freshAvatar,
      keysBought: 0,
      totalAdded: 0,
      joinDate: joinDateStr,
    });

    try {
      const rtdbRef = ref(database, "registeredUsers");
      set(rtdbRef, [newUser, ...registeredUsers]);
    } catch (err) {
      console.warn("RTDB sync:", err);
    }

    alert(
      "🎉 बधाई हो " +
        name +
        "!\nआपका नया अकाउंट असली Email (" +
        email +
        ") & Mobile (" +
        rawPhone +
        ") के साथ सफलतापूर्वक बन गया है।\nWallet Balance: ₹0 (कृपया Add Fund से पैसे जोड़ें)।",
    );
    setCurrentView("home");
  };

  useEffect(() => {
    const q = searchQuery.trim();
    if (q === "PREM74") {
      setCurrentView("staff");
      setSearchQuery("");
      alert("⚡ STAFF PANEL UNLOCKED! Welcome Staff Portal.");
    } else if (q === "Prem74" || q === "prem74") {
      setCurrentView("admin");
      setSearchQuery("");
    }
  }, [searchQuery]);

  const [amount, setAmount] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [qrGenerated, setQrGenerated] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [unreadKeys, setUnreadKeys] = useState(0);
  const [unreadSpins, setUnreadSpins] = useState(0);
  const [unreadRefers, setUnreadRefers] = useState(0);

  useEffect(() => {
    if (currentView === "keyPending") {
      setCountdown(10);
      if (timerRef.current) clearInterval(timerRef.current);

      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            return 0;
          }
          playTickSound();
          return prev - 1;
        });
      }, 1000);
    }
  }, [currentView]);

  const handleOpenCheckout = (
    price: any,
    panelTitle: string,
    explicitResellerPrice?: number
  ) => {
    const isResellerActive = resellerUser.isLoggedIn && resellerUser.isApproved;
    const panelObj = panels.find((p) => p.title === panelTitle);

    const activePricingArray = panelObj?.pricing || panelObj?.pricingPlans || [];

    // Find the plan object carefully
    const planObj = activePricingArray.find(
      (pr: any) =>
        String(pr.price) === String(price) ||
        (explicitResellerPrice &&
          (pr as any).resellerPrice === explicitResellerPrice)
    );

    // Completely secure Out of Stock check
    const priceStr = String(price).toLowerCase();
    const isOutOfStock =
      !planObj ||
      isNaN(Number(price)) ||
      Number(price) < 0 ||
      priceStr.includes("stock") ||
      (planObj && planObj.label && planObj.label.toLowerCase().includes("stock"));

    if (isOutOfStock) {
      alert(
        "Is panel ko abhi nahin khareed sakte hain (Out of Stock). Kripya dropdown se dusra plan select karein."
      );
      return; // Stop here, don't open modal
    }

    const numPrice = Number(planObj.price);
    
    // Differential Pricing calculation
    const effectiveResellerPrice =
      explicitResellerPrice !== undefined
        ? explicitResellerPrice
        : planObj && (planObj as any).resellerPrice !== undefined
        ? (planObj as any).resellerPrice
        : Math.round(numPrice * 0.65);

    const activeChargePrice = isResellerActive ? effectiveResellerPrice : numPrice;
    const activeWalletBal = isResellerActive
      ? resellerUser.balance > 0
        ? resellerUser.balance
        : userBalance
      : userBalance;

    if (activeWalletBal < activeChargePrice) {
      alert(
        `Insufficient balance! Your wallet balance is ₹${activeWalletBal} but panel price is ₹${activeChargePrice}. Redirecting to add funds...`
      );
      setCurrentView("addFund");
      return;
    }

    const planLabel = planObj?.label ? `${planObj.label} nonroot` : "1 DAY nonroot";

    setCheckoutData({
      panelTitle: panelTitle,
      planLabel: isResellerActive
        ? `${planLabel} [👑 RESELLER VIP RATE]`
        : planLabel,
      originalPrice: activeChargePrice,
      panelObj: panelObj,
    });
    const accKey = getAccountKey(userProfile.email, userProfile.phone);
    const validCoupons = (userAccountCoupons[accKey] || []).filter(
      (c) => !c.isUsed && Date.now() - c.createdAt < 24 * 60 * 60 * 1000,
    );
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const canUseCoupon = now - lastCouponUsedTimestamp >= twentyFourHours;

    if (canUseCoupon && validCoupons.length > 0) {
      const bestCoupon = validCoupons[0];
      setAppliedCoupon({
        code: bestCoupon.code,
        discount: bestCoupon.discount,
      });
      setCouponInputCode(bestCoupon.code);
      setCouponSuccessMsg(
        `🎁 Spin & Win Code '${bestCoupon.code}' Auto-Added! (-₹${bestCoupon.discount})`,
      );
      setCouponErrorMsg("");
    } else {
      setAppliedCoupon(null);
      setCouponInputCode("");
      setCouponErrorMsg("");
      setCouponSuccessMsg("");
    }
  };

  const handleApplyCoupon = () => {
    setCouponErrorMsg("");
    setCouponSuccessMsg("");

    const trimmedCode = couponInputCode.trim().toUpperCase();
    if (!trimmedCode) {
      setCouponErrorMsg("Please enter a coupon code.");
      return;
    }

    // Check if 24 hours passed since last coupon used
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    if (now - lastCouponUsedTimestamp < twentyFourHours) {
      const remainingMs = twentyFourHours - (now - lastCouponUsedTimestamp);
      const remHours = Math.floor(remainingMs / (1000 * 60 * 60));
      const remMins = Math.floor(
        (remainingMs % (1000 * 60 * 60)) / (1000 * 60),
      );
      setCouponErrorMsg(
        `Aapne 24 ghante me pehle hi 1 coupon use kar liya hai. Agla coupon ${remHours}h ${remMins}m baad use kar sakte hain.`,
      );
      return;
    }

    // Strict validation: Must match exact coupon in userCoupons array (no fake or tampered codes allowed)
    const matchedCoupon = userCoupons.find(
      (c) => c.code.trim().toUpperCase() === trimmedCode,
    );
    if (matchedCoupon) {
      if (matchedCoupon.isUsed) {
        setCouponErrorMsg(
          "Yeh coupon pehle hi use ho chuka hai! Ek coupon sirf 1 baar hi valid hota hai.",
        );
        return;
      }
      const twentyFourHours = 24 * 60 * 60 * 1000;
      if (now - matchedCoupon.createdAt > twentyFourHours) {
        setCouponErrorMsg(
          "Yeh coupon code 24 ghante se purana ho gaya hai aur expire/hide ho chuka hai!",
        );
        return;
      }
      setAppliedCoupon({
        code: matchedCoupon.code,
        discount: matchedCoupon.discount,
      });
      setCouponSuccessMsg(
        `🎉 Coupon Applied! ₹${matchedCoupon.discount} discount!`,
      );
    } else {
      setCouponErrorMsg(
        "Don't use fake/tampered coupon! Invalid or altered coupon code.",
      );
    }
  };

  const handleRequestKey = () => {
    if (!checkoutData) return;

    const isResellerActive = resellerUser.isLoggedIn && resellerUser.isApproved;
    const originalPrice = checkoutData.originalPrice;
    const discount = appliedCoupon ? appliedCoupon.discount : 0;
    const finalPrice = Math.max(0, originalPrice - discount);

    const activeBal = isResellerActive
      ? resellerUser.balance > 0
        ? resellerUser.balance
        : userBalance
      : userBalance;

    if (activeBal >= finalPrice) {
      const curEmail =
        (isResellerActive ? resellerUser.email : userProfile.email) || "";
      const curPhone = userProfile.phone || "";
      const curPassword = userProfile.password || "";
      const accKey = getAccountKey(curEmail, curPhone);

      if (isResellerActive && resellerUser.balance >= finalPrice) {
        // Deduct from Reseller Wallet
        const newBal = resellerUser.balance - finalPrice;
        setResellerUser((prev) => ({ ...prev, balance: newBal }));
        setApprovedResellers((prev) =>
          prev.map((r) =>
            r.email.toLowerCase() === resellerUser.email.toLowerCase()
              ? { ...r, balance: newBal }
              : r,
          ),
        );
      } else {
        setUserBalance((prev) => prev - finalPrice);
        setUserWallets((prev) => ({
          ...prev,
          [accKey]: (prev[accKey] || 0) - finalPrice,
        }));
      }

      setUserProfile((prev) => ({ ...prev, keysBought: prev.keysBought + 1 }));
      setUnreadKeys((prev) => prev + 1);

      const newRequest = {
        id: Date.now(),
        user:
          curEmail || curPhone || (isResellerActive ? "Reseller VIP" : "Guest"),
        userEmail: curEmail,
        userPhone: curPhone,
        userPassword: curPassword,
        userAccountKey: accKey,
        panel: checkoutData.panelTitle,
        planLabel: checkoutData.planLabel,
        originalPrice: originalPrice,
        discountAmount: discount,
        couponCodeUsed: appliedCoupon ? appliedCoupon.code : "",
        price: finalPrice,
        status: "PENDING",
        deliveredKey: "",
        date: new Date().toLocaleString(),
        exceptFileLink:
          checkoutData.panelObj?.exceptFileLink || supportLinks.telegram,
      };

      setKeyRequests((prev) => [newRequest, ...prev]);

      if (appliedCoupon) {
        const accKey = getAccountKey(userProfile.email, userProfile.phone);
        const nowTime = Date.now();
        setUserCouponUsedTimestamps((prev) => ({ ...prev, [accKey]: nowTime }));
        setUserAccountCoupons((prev) => {
          const list = prev[accKey] || [];
          const updated = list.map((c) =>
            c.code === appliedCoupon.code
              ? { ...c, isUsed: true, usedAt: nowTime }
              : c,
          );
          return { ...prev, [accKey]: updated };
        });
      }

      setCheckoutData(null);
      setAppliedCoupon(null);
      setCouponInputCode("");
      setShowBuySuccessPendingModal(true);
    } else {
      const msg = new SpeechSynthesisUtterance(
        "Doston kripya kijiye apna wallet check Karen and Paisa add Karen Uske bad aap yahan se panel khareed sakte ho thank you",
      );
      msg.lang = "hi-IN";
      window.speechSynthesis.speak(msg);
      alert(
        `Balance kam hai! Needed: ₹${finalPrice}, Wallet Balance: ₹${activeBal}. Kripya wallet me fund add karein.`,
      );
      if (isResellerActive) {
        setShowResellerModal(true);
      } else {
        setCurrentView("addFund");
      }
    }
  };

  const handleSendRefundEmailToUser = async (
    targetEmail: string,
    refundAmount: number,
    reason: string,
  ) => {
    const sId = "service_v7djd5d";
    const tId = "template_srpbzgk";
    const pKey = "huTOpMHbOaE_WYEpW";
    const templateParams = {
      user_email: targetEmail.trim(),
      refund_amount: String(refundAmount),
      reason_message:
        reason ||
        "आपका ऑर्डर रिजेक्ट कर दिया गया है और पैसे आपके वॉलेट में रिफ़ंड कर दिए गए हैं।",
    };
    try {
      emailjs.init(pKey);
      const response = await emailjs.send(sId, tId, templateParams, pKey);
      return response.status === 200 || response.text === "OK";
    } catch (sdkError) {
      console.warn(
        "SDK send error for refund, fallback to direct EmailJS endpoint...",
        sdkError,
      );
      try {
        const restRes = await fetch(
          "https://api.emailjs.com/api/v1.0/email/send",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              service_id: sId,
              template_id: tId,
              user_id: pKey,
              template_params: templateParams,
            }),
          },
        );
        return restRes.ok;
      } catch (err) {
        return false;
      }
    }
  };

  const handleRejectAndRefundKey = async (req: any, customReason?: string) => {
    if (!req) return;
    // Removed prompt and confirm so it directly refunds when clicked
    const refundAmount = Number(req.price) || 0;

    let tEmail = req.userEmail;
    let tPhone = req.userPhone;
    if (!tEmail && !tPhone && req.user) {
      if (req.user.includes("@")) tEmail = req.user;
      else if (/^\d+$/.test(req.user)) tPhone = req.user;
    }
    const targetAccKey = req.userAccountKey || getAccountKey(tEmail, tPhone);
    const targetEmail = (tEmail || "").trim();

    // 1. Update userWallets in global state
    setUserWallets((prev) => {
      const currentVal = Number(prev[targetAccKey]) || 0;
      return {
        ...prev,
        [targetAccKey]: currentVal + refundAmount,
      };
    });

    // 2. If the current logged-in user is this user, update active userBalance immediately
    const currentActiveAccKey = getAccountKey(
      userProfile.email,
      userProfile.phone,
    );
    if (
      userProfile.isLoggedIn &&
      (currentActiveAccKey === targetAccKey ||
        (targetEmail &&
          userProfile.email?.toLowerCase() === targetEmail.toLowerCase()))
    ) {
      setUserBalance((prev) => prev + refundAmount);
    }

    // 3. If it's an approved reseller, update reseller balance
    if (targetEmail) {
      setApprovedResellers((prev) =>
        prev.map((r) =>
          r.email.toLowerCase() === targetEmail.toLowerCase()
            ? { ...r, balance: (Number(r.balance) || 0) + refundAmount }
            : r,
        ),
      );
      if (
        resellerUser.isLoggedIn &&
        resellerUser.email.toLowerCase() === targetEmail.toLowerCase()
      ) {
        setResellerUser((prev) => ({
          ...prev,
          balance: (Number(prev.balance) || 0) + refundAmount,
        }));
      }
    }

    // 4. Update keyRequests status to 'REJECTED'
    const rejectReasonText = customReason
      ? customReason.trim()
      : "Out of stock / Server maintenance";
    setKeyRequests((prev) =>
      prev.map((r) =>
        r.id === req.id
          ? {
              ...r,
              status: "REJECTED",
              deliveredKey: `REFUNDED ₹${refundAmount} TO WALLET`,
            }
          : r,
      ),
    );

    // 5. Send notification email if email exists
    let emailSent = false;
    if (targetEmail) {
      try {
        const emailReason = `Namaste ${req.user},\n\nAapka ${req.panel} (${req.planLabel || "Key"}) ka order reject kar diya gaya hai aur ₹${refundAmount} aapke wallet me turant refund kar diye gaye hain.\n\nReason: ${rejectReasonText}\n\nAap wallet balance se store se dusra key buy kar sakte hain.`;
        emailSent = await handleSendRefundEmailToUser(
          targetEmail,
          refundAmount,
          emailReason,
        );
      } catch (err) {
        console.warn("Refund email error:", err);
      }
    }

    alert(
      `✅ Order Reject ho gaya hai aur ₹${refundAmount} user (${req.user}) ke wallet me turant refund ho gaya hai!${emailSent ? " Email notification bhi bhej diya gaya hai." : ""}`,
    );
  };

  const [fundStep, setFundStep] = useState<"generate" | "confirm" | "checking">(
    "generate",
  );
  // Auto UPI is locked/blocked per user request (synchronized via Firebase)
  const [isAutoUpiLocked, setIsAutoUpiLocked] = useState<boolean>(true); // PERMANENTLY LOCKED by default
  const [paymentMode, setPaymentMode] = useState<"auto" | "manual">("manual");

  useEffect(() => {
    if (isAutoUpiLocked && paymentMode === "auto") {
      setPaymentMode("manual");
    }
  }, [isAutoUpiLocked, paymentMode]);

  useEffect(() => {
    if (currentView === "addFund") {
      setFundStep("generate");
      setQrGenerated(false);
    }
  }, [currentView]);
  const [autoWhatsapp, setAutoWhatsapp] = useState("");
  const [autoAmount, setAutoAmount] = useState("");
  const [utr, setUtr] = useState("");
  const [paymentScreenshot, setPaymentScreenshot] = useState<string>("");
  const [currentTxId, setCurrentTxId] = useState<number | null>(null);

  const [paymentHistory, setPaymentHistory] = useState<
    {
      id: number;
      amount: number;
      utr: string;
      status: string;
      date: string;
      screenshot?: string;
      userEmail?: string;
      userPhone?: string;
      userPassword?: string;
      userAccountKey?: string;
      userName?: string;
      userAvatar?: string;
      userJoinDate?: string;
      userLastLogin?: string;
      userBalance?: number;
      keysBoughtCount?: number;
      totalPaid?: number;
      method?: string;
      whatsapp?: string;
    }[]
  >([]);

  useEffect(() => {
    saveToFirebase("paymentHistory", paymentHistory);
  }, [paymentHistory]);

  const [autoPaymentHistory, setAutoPaymentHistory] = useState<
    {
      id: number;
      amount: number;
      utr: string;
      status: string;
      date: string;
      method: string;
      whatsapp: string;
      userEmail: string;
      userPhone: string;
      userPassword?: string;
      userName?: string;
      userAvatar?: string;
      userJoinDate?: string;
      userLastLogin?: string;
      userBalance?: number;
      keysBoughtCount?: number;
      totalPaid?: number;
      userAccountKey?: string;
    }[]
  >([]);

  useEffect(() => {
    saveToFirebase("autoPaymentHistory", autoPaymentHistory);
  }, [autoPaymentHistory]);

  const [autoPaySearch, setAutoPaySearch] = useState("");
  const [autoPayFilter, setAutoPayFilter] = useState<
    "ALL" | "PENDING" | "SUCCESS" | "REJECTED"
  >("ALL");
  const [isRazorpayModalOpen, setIsRazorpayModalOpen] = useState(false);
  const razorpayContainerRef = useRef<HTMLDivElement | null>(null);

  const [onlineUsersCount, setOnlineUsersCount] = useState(1);

  // Firebase Realtime Database Presence API
  useEffect(() => {
    const presenceRef = ref(database, "presence");
    const myPresenceRef = push(presenceRef);
    let specificRef: any = null;

    if (myPresenceRef.key) {
      specificRef = ref(database, `presence/${myPresenceRef.key}`);
      onDisconnect(specificRef).remove();
      set(specificRef, {
        online: true,
        timestamp: Date.now(),
      }).catch((e) => {});
    }

    const unsubscribePresence = onValue(presenceRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        const count = Object.keys(val).length;
        setOnlineUsersCount(Math.max(1, count));
      } else {
        setOnlineUsersCount(1);
      }
    });

    return () => {
      unsubscribePresence();
      if (specificRef) {
        remove(specificRef).catch((e: any) => {});
      } else {
        remove(myPresenceRef).catch((e: any) => {});
      }
    };
  }, []);

  const isSyncingFromFirebase = useRef(true);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  useEffect(() => {
    const stateRef = ref(database, "appState");
    const unsubscribe = onValue(stateRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.initialized) {
        isSyncingFromFirebase.current = true;
        if (data.panels && ensureArray(data.panels).length > 0) {
          const loadedPanels = ensureArray(data.panels).map((p: any) => ({
            ...p,
            features: parseFeaturesList(p.features, p.description),
          }));
          setPanels(loadedPanels);
        }
        if (data.registeredUsers)
          setRegisteredUsers(ensureArray(data.registeredUsers));
        if (data.bannedUsers) setBannedUsers(ensureArray(data.bannedUsers));
        if (data.paymentHistory)
          setPaymentHistory(ensureArray(data.paymentHistory));
        if (data.autoPaymentHistory)
          setAutoPaymentHistory(ensureArray(data.autoPaymentHistory));
        if (data.keyRequests) setKeyRequests(ensureArray(data.keyRequests));
        if (data.paymentSettings) {
          setPaymentSettings((prev: any) => {
            const incomingUpi = sanitizeUpiId(data.paymentSettings.upiId);
            return { ...prev, ...data.paymentSettings, upiId: incomingUpi };
          });
        }
        if (data.supportLinks) setSupportLinks(data.supportLinks);
        if (data.accessFileSteps) setAccessFileSteps(data.accessFileSteps);
        if (data.bannerSettings) setBannerSettings(data.bannerSettings);
        if (data.approvedResellers)
          setApprovedResellers(ensureArray(data.approvedResellers));
        if (data.referWebsiteLink) setReferWebsiteLink(data.referWebsiteLink);
        if (data.referBonusAmount) setReferBonusAmount(data.referBonusAmount);
        if (data.spinRewards) setSpinRewards(ensureArray(data.spinRewards));
        if (data.spinRequests) setSpinRequests(ensureArray(data.spinRequests));
        if (data.referRequests)
          setReferRequests(ensureArray(data.referRequests));
        if (data.userWallets) setUserWallets(data.userWallets);
        if (data.userAccountProfiles)
          setUserAccountProfiles(data.userAccountProfiles);
        if (data.userSpinTimestamps)
          setUserSpinTimestamps(data.userSpinTimestamps);
        if (data.userCouponUsedTimestamps)
          setUserCouponUsedTimestamps(data.userCouponUsedTimestamps);
        if (data.userAccountCoupons)
          setUserAccountCoupons(data.userAccountCoupons);
        if (data.bgSettings && data.bgSettings.customImage && data.bgSettings.customImage.trim() !== "") {
          setBgSettings((prev: any) => ({ ...prev, ...data.bgSettings }));
        }
        if (data.authStats) setAuthStats(data.authStats);
        if (data.emailJsConfig) setEmailJsConfig(data.emailJsConfig);
        if (data.isAutoUpiLocked !== undefined) {
          setIsAutoUpiLocked(Boolean(data.isAutoUpiLocked));
        }
      }
      setTimeout(() => {
        isSyncingFromFirebase.current = false;
        setInitialDataLoaded(true);
      }, 300);
    });

    return () => unsubscribe();
  }, []);

  // Dedicated Permanent Payment Settings Fetcher & Realtime Listener (QR & UPI)
  useEffect(() => {
    // 1. Fetch from server disk storage immediately on mount
    fetch("/api/payment-settings")
      .then((res) => res.json())
      .then((resData) => {
        const loaded = resData?.data || (resData?.qrImage || resData?.upiId ? resData : null);
        if (loaded && (loaded.qrImage || loaded.upiId)) {
          setPaymentSettings((prev: any) => {
            const incomingUpi = sanitizeUpiId(loaded.upiId);
            return { ...prev, ...loaded, upiId: incomingUpi };
          });
        }
      })
      .catch(() => {});

    // 1b. Fetch background settings from server disk storage
    fetch("/api/bg-settings")
      .then((res) => res.json())
      .then((resData) => {
        const loadedBg = resData?.data;
        if (loadedBg && loadedBg.customImage && loadedBg.customImage.trim() !== "") {
          setBgSettings((prev: any) => ({ ...prev, ...loadedBg }));
        }
      })
      .catch(() => {});

    // 2. Direct realtime listener on Firebase paymentSettings path
    try {
      const payRef = ref(database, "paymentSettings");
      const unsubPay = onValue(payRef, (snapshot) => {
        if (Date.now() - lastAdminSavedPaymentTimeRef.current < 15000) return;
        const val = snapshot.val();
        if (val && (val.qrImage || val.upiId)) {
          setPaymentSettings((prev: any) => {
            const incomingUpi = sanitizeUpiId(val.upiId);
            return { ...prev, ...val, upiId: incomingUpi };
          });
        }
      });

      // 2b. Direct realtime listener on Firebase bgSettings path
      const bgRef = ref(database, "bgSettings");
      const unsubBg = onValue(bgRef, (snapshot) => {
        const val = snapshot.val();
        if (val && val.customImage && val.customImage.trim() !== "") {
          setBgSettings((prev: any) => ({ ...prev, ...val }));
        }
      });

      // 3. Auto Pay Lock status listener from Firebase
      const lockRef = ref(database, "isAutoUpiLocked");
      const unsubLock = onValue(lockRef, (snapshot) => {
        const lockVal = snapshot.val();
        if (lockVal !== null && lockVal !== undefined) {
          setIsAutoUpiLocked(Boolean(lockVal));
        }
      });

      return () => {
        unsubPay();
        unsubBg();
        unsubLock();
      };
    } catch (e) {}
  }, []);

  // Fetch Auto Pay Lock Status from backend server
  useEffect(() => {
    fetch("/api/auto-pay-status")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.isLocked !== undefined) {
          setIsAutoUpiLocked(Boolean(data.isLocked));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isSyncingFromFirebase.current || !initialDataLoaded) return;
    const payload: any = {
      initialized: true,
      panels,
      registeredUsers,
      bannedUsers,
      paymentHistory,
      autoPaymentHistory,
      keyRequests,
      isAutoUpiLocked,
      supportLinks,
      accessFileSteps,
      bannerSettings,
      approvedResellers,
      referWebsiteLink,
      referBonusAmount,
      spinRewards,
      spinRequests,
      referRequests,
      userWallets,
      userAccountProfiles,
      userSpinTimestamps,
      userCouponUsedTimestamps,
      userAccountCoupons,
      bgSettings,
      authStats,
      emailJsConfig,
      updatedAt: Date.now(),
    };
    if (paymentSettings && paymentSettings.upiId) {
      payload.paymentSettings = {
        ...paymentSettings,
        upiId: sanitizeUpiId(paymentSettings.upiId),
      };
    }
    set(ref(database, "appState"), sanitizeForFirebase(payload)).catch(
      (e) => {},
    );
  }, [
    panels,
    registeredUsers,
    bannedUsers,
    paymentHistory,
    autoPaymentHistory,
    keyRequests,
    paymentSettings,
    isAutoUpiLocked,
    supportLinks,
    accessFileSteps,
    bannerSettings,
    approvedResellers,
    referWebsiteLink,
    referBonusAmount,
    spinRewards,
    spinRequests,
    referRequests,
    userWallets,
    userAccountProfiles,
    userSpinTimestamps,
    userCouponUsedTimestamps,
    userAccountCoupons,
    bgSettings,
    authStats,
    emailJsConfig,
  ]);

  const playTickSound = () => {
    try {
      const audioCtx = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(
        400,
        audioCtx.currentTime + 0.08,
      );

      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioCtx.currentTime + 0.08,
      );

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    } catch (e) {
      console.warn("Audio not supported or blocked");
    }
  };

  const playSuccessChime = () => {
    try {
      const audioCtx = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
      const now = audioCtx.currentTime;
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.35, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.35);
      });
    } catch (e) {
      console.warn("Audio not supported or blocked");
    }
  };

  const handleGenerateQR = () => {
    if (!amount || Number(amount) <= 0) {
      alert("⚠️ Kripya valid amount enter karein (e.g. ₹100)!");
      return;
    }
    setIsGenerating(true);
    setQrGenerated(false);
    setCountdown(3);
    playTickSound();

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setIsGenerating(false);
          setQrGenerated(true);
          playSuccessChime();
          return 0;
        }
        playTickSound();
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (checkoutData) {
    return (
      <div className="fixed inset-0 z-[999999] bg-[#07090e] text-white flex flex-col w-full h-full min-h-screen overflow-y-auto antialiased">
        {/* STANDALONE PAGE 1: BUY KEY CHECKOUT PAGE */}
        <div className="sticky top-0 z-30 bg-[#0c101a] border-b border-white/15 px-4 py-3.5 flex items-center justify-between shadow-2xl">
          <button
            onClick={() => setCheckoutData(null)}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-black text-xs px-3.5 py-2 rounded-xl transition-all border border-white/20 active:scale-95 shadow-md cursor-pointer"
          >
            <ArrowLeft size={18} className="text-cyan-400" />
            <span>RETURN TO STORE</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <ShoppingBag size={18} className="text-cyan-400" />
            </div>
            <h2 className="text-cyan-400 font-black text-base sm:text-lg tracking-wider uppercase drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">
              BUY KEY CHECKOUT
            </h2>
          </div>
          <button
            onClick={() => setCheckoutData(null)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-all border border-white/10 active:scale-95 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Main Content */}
        <div className="max-w-lg mx-auto w-full p-4 sm:p-6 flex flex-col gap-5 my-auto">
          {/* High-Contrast Cyber Box */}
          <div className="w-full bg-[#0c121e] border-2 border-cyan-500/60 rounded-3xl p-5 sm:p-6 shadow-[0_0_35px_rgba(6,182,212,0.25)] flex flex-col gap-4 relative">
            <div className="flex items-center justify-between border-b border-white/15 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-0.5 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                  <div className="w-full h-full bg-[#0d121f] rounded-[14px] flex items-center justify-center">
                    <ShieldCheck size={20} className="text-cyan-400" />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    SELECTED PANEL
                  </p>
                  <h3 className="text-lg sm:text-xl font-black text-white tracking-wide uppercase">
                    {checkoutData.panelTitle}
                  </h3>
                </div>
              </div>
              <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 text-[11px] px-3 py-1 rounded-full font-black uppercase tracking-wider">
                {checkoutData.planLabel}
              </span>
            </div>

            {/* Price Details */}
            <div className="flex flex-col gap-2.5 bg-[#070a12] p-4 rounded-2xl border border-white/15 text-xs">
              <div className="flex justify-between items-center text-gray-300">
                <span className="font-medium text-gray-300">Original Price:</span>
                <span className="text-white font-black text-base font-mono">
                  ₹{checkoutData.originalPrice}
                </span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between items-center text-emerald-400 font-bold">
                  <span>Coupon Discount ({appliedCoupon.code}):</span>
                  <span>- ₹{appliedCoupon.discount}</span>
                </div>
              )}
              <div className="border-t border-white/15 pt-2.5 flex justify-between items-center text-sm font-black text-white">
                <span className="text-gray-200">Final Amount to Pay:</span>
                <span className="text-emerald-400 font-black text-2xl font-mono drop-shadow-[0_0_12px_rgba(52,211,153,0.5)]">
                  ₹
                  {Math.max(
                    0,
                    checkoutData.originalPrice -
                      (appliedCoupon ? appliedCoupon.discount : 0)
                  )}
                </span>
              </div>
            </div>

            {/* Coupon Code Input Box */}
            <div className="flex flex-col gap-2.5 bg-[#070a12] p-4 rounded-2xl border border-white/15">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-cyan-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <Zap size={14} className="text-amber-400" /> APPLY COUPON CODE
                </label>
                {appliedCoupon && (
                  <button
                    onClick={() => {
                      setAppliedCoupon(null);
                      setCouponInputCode("");
                      setCouponSuccessMsg("");
                      setCouponErrorMsg("Coupon removed.");
                    }}
                    className="text-[10px] text-red-400 hover:text-red-300 font-bold uppercase tracking-wider cursor-pointer"
                  >
                    ✕ Remove Code
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Coupon Code (e.g. SPIN10-XXXX)..."
                  value={couponInputCode}
                  onChange={(e) => {
                    setCouponInputCode(e.target.value.toUpperCase());
                    setCouponErrorMsg("");
                    setCouponSuccessMsg("");
                  }}
                  className="flex-1 bg-[#121929] border border-white/25 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white uppercase placeholder:normal-case placeholder:text-gray-500 focus:outline-none focus:border-cyan-400"
                />
                <button
                  onClick={handleApplyCoupon}
                  className="bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer uppercase tracking-wider"
                >
                  APPLY
                </button>
              </div>
              {couponErrorMsg && (
                <p className="text-red-400 text-xs font-bold mt-0.5">
                  ❌ {couponErrorMsg}
                </p>
              )}
              {couponSuccessMsg && (
                <p className="text-emerald-400 text-xs font-black mt-0.5 flex items-center gap-1">
                  ✅ {couponSuccessMsg}
                </p>
              )}

              {/* Directly Show & Auto-Select Spin & Win Won Coupons */}
              {(() => {
                const accKey = getAccountKey(userProfile.email, userProfile.phone);
                const userActiveCoupons = (userAccountCoupons[accKey] || []).filter(
                  (c) => !c.isUsed && Date.now() - c.createdAt < 24 * 60 * 60 * 1000,
                );
                if (userActiveCoupons.length === 0) return null;

                return (
                  <div className="mt-1.5 pt-2.5 border-t border-white/10 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-amber-300 font-bold flex items-center gap-1">
                        <Gift size={13} className="text-amber-400" />
                        Aapke Spin & Win Coupons:
                      </span>
                      <span className="text-gray-400 text-[10px]">
                        (Click karke sidhe add karein)
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {userActiveCoupons.map((c, idx) => {
                        const isThisApplied = appliedCoupon?.code === c.code;
                        return (
                          <button
                            key={`spin-won-badge-${c.code}-${idx}`}
                            type="button"
                            onClick={() => {
                              setCouponInputCode(c.code);
                              setAppliedCoupon({
                                code: c.code,
                                discount: c.discount,
                              });
                              setCouponSuccessMsg(
                                `🎁 Spin Code '${c.code}' Added! -₹${c.discount} Discount`,
                              );
                              setCouponErrorMsg("");
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
                              isThisApplied
                                ? "bg-emerald-500 text-black border-2 border-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.6)] font-black"
                                : "bg-[#141e33] hover:bg-[#1a2845] text-amber-300 border border-amber-400/40 hover:border-amber-300"
                            }`}
                          >
                            <span>{c.code}</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-black ${
                                isThisApplied
                                  ? "bg-black/20 text-black"
                                  : "bg-emerald-500/20 text-emerald-400"
                              }`}
                            >
                              -₹{c.discount}
                            </span>
                            {isThisApplied ? (
                              <span className="text-[11px]">✓ ADDED</span>
                            ) : (
                              <span className="text-[10px] text-cyan-300 font-sans font-bold">
                                TAP TO USE
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Account & Wallet Info */}
            <div className="bg-[#070a12] border border-white/15 rounded-2xl py-3.5 px-5 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs font-bold shadow-inner">
              <span className="text-gray-300 flex items-center gap-1.5">
                👤 Account:{" "}
                <span className="text-white font-black">
                  {userProfile.email || "user@gmail.com"}
                </span>
              </span>
              <span className="text-gray-300 flex items-center gap-1.5">
                💰 Available Wallet:{" "}
                <span className="text-amber-400 font-black text-base font-mono drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]">
                  ₹
                  {resellerUser.isLoggedIn && resellerUser.isApproved
                    ? resellerUser.balance
                    : userBalance}
                </span>
              </span>
            </div>

            {/* Confirm & Pay Button - High Contrast Always Visible */}
            <button
              onClick={handleRequestKey}
              className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 border-2 border-emerald-300 text-white font-black py-4 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.5)] flex items-center justify-center gap-2.5 uppercase tracking-wider text-sm sm:text-base transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              <CheckCircle size={22} className="text-white drop-shadow-md" />
              <span className="drop-shadow-md">
                CONFIRM & ORDER KEY (₹
                {Math.max(
                  0,
                  checkoutData.originalPrice -
                    (appliedCoupon ? appliedCoupon.discount : 0)
                )}
                )
              </span>
            </button>

            {/* Cancel & return link */}
            <button
              onClick={() => setCheckoutData(null)}
              className="w-full text-center text-xs font-black text-gray-300 hover:text-white uppercase tracking-widest py-2 transition-colors border-t border-white/10 mt-2 cursor-pointer"
            >
              ← CANCEL & RETURN TO STORE
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showBuySuccessPendingModal) {
    return (
      <div className="fixed inset-0 z-[999999] bg-[#07090e] text-white flex flex-col w-full h-full min-h-screen overflow-y-auto antialiased">
        {/* Standalone Header */}
        <div className="sticky top-0 z-30 bg-[#0c101a] border-b border-white/15 px-4 py-3.5 flex items-center justify-between shadow-2xl">
          <button
            onClick={() => {
              setShowBuySuccessPendingModal(false);
              setCurrentView("home");
            }}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-black text-xs px-3.5 py-2 rounded-xl transition-all border border-white/20 active:scale-95 shadow-md cursor-pointer"
          >
            <ArrowLeft size={18} className="text-cyan-400" />
            <span>RETURN TO STORE</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)]">
              <Check size={20} className="text-emerald-400" />
            </div>
            <h2 className="text-emerald-400 font-black text-base sm:text-lg tracking-wider uppercase drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]">
              ORDER CONFIRMATION
            </h2>
          </div>
          <button
            onClick={() => {
              setShowBuySuccessPendingModal(false);
              setCurrentView("home");
            }}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-all border border-white/10 active:scale-95 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Main Success Content */}
        <div className="max-w-lg mx-auto w-full p-4 sm:p-6 flex flex-col items-center justify-center my-auto text-center gap-6">
          <div className="flex flex-col items-center gap-3">
            <div className="w-24 h-24 rounded-full border-4 border-emerald-400 bg-emerald-500/20 flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.6)] relative">
              <Check size={48} className="text-emerald-400 relative z-10" strokeWidth={3.5} />
              <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping"></div>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.6)] uppercase tracking-widest mt-2">
              BUY SUCCESSFUL!
            </h2>
          </div>

          <div className="w-full bg-[#0c121e] border-2 border-amber-500/50 rounded-3xl p-6 sm:p-7 shadow-[0_0_35px_rgba(245,158,11,0.2)] flex flex-col items-center text-center gap-4 relative">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-400/50 flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.4)]">
              <Clock size={22} className="text-orange-400 animate-pulse" />
            </div>

            <h3 className="text-orange-400 font-black text-lg sm:text-xl tracking-wide uppercase">
              ORDER IS PENDING DELIVERY!
            </h3>
            <p className="text-gray-200 text-xs sm:text-sm font-bold leading-relaxed">
              Instant stock was empty. Your order has been placed successfully and sent to Admin.
            </p>
            <p className="text-emerald-300 font-black text-xs sm:text-sm leading-relaxed bg-emerald-500/15 border border-emerald-500/40 p-3 rounded-2xl w-full">
              ✅ Admin will deliver your key manually shortly.
            </p>
            <p className="text-gray-400 text-xs font-medium">
              Click the button below to check your order status on the 'My Keys' page.
            </p>
          </div>

          <div className="w-full flex flex-col gap-3.5">
            <button
              onClick={() => {
                setShowBuySuccessPendingModal(false);
                setCurrentView("myKeys");
              }}
              className="w-full bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 border-2 border-cyan-300 text-white font-black py-4 rounded-2xl uppercase tracking-wider text-sm sm:text-base shadow-[0_0_25px_rgba(6,182,212,0.5)] transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Key size={20} className="text-white drop-shadow-md" />
              <span className="drop-shadow-md">VIEW MY KEYS</span>
            </button>
            <button
              onClick={() => {
                setShowBuySuccessPendingModal(false);
                setCurrentView("home");
              }}
              className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-black py-3.5 rounded-2xl uppercase tracking-widest text-xs transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Home size={16} />
              <span>RETURN TO HOME STORE</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full text-white font-sans relative overflow-hidden selection:bg-cyan-500/30 antialiased flex flex-col items-center justify-start">
      <style>{`
        img, video {
          filter: hue-rotate(-${bgSettings.themeHue || 0}deg);
        }
        @keyframes rgbBorder {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .dslr-rgb-box {
          position: relative;
          border-radius: 1.5rem;
          background: rgba(10, 15, 29, 0.96);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(6, 182, 212, 0.35);
          box-shadow: 0 0 40px rgba(0, 0, 0, 0.9);
          z-index: 10;
        }
        .dslr-rgb-box::before {
          content: "";
          position: absolute;
          inset: -2px;
          border-radius: 1.6rem;
          background: linear-gradient(90deg, rgba(6,182,212,0.35), rgba(59,130,246,0.35), rgba(139,92,246,0.35), rgba(6,182,212,0.35));
          background-size: 300% 300%;
          animation: rgbBorder 6s linear infinite;
          z-index: -1;
          opacity: 0.35;
          filter: blur(2px);
        }
        .dslr-rgb-box::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 1.5rem;
          background: rgba(10, 15, 29, 0.96);
          z-index: -1;
        }
      `}</style>

      {/* Background Wallpaper Layer - 100% Fixed, Ultra HD Clarity (Crystal Clear from Top to Bottom) */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none">
        {bgSettings.customImage && !bgMediaError ? (
          bgSettings.isVideo || (typeof bgSettings.customImage === "string" && (bgSettings.customImage.toLowerCase().endsWith(".mp4") || bgSettings.customImage.toLowerCase().endsWith(".webm"))) ? (
            <video
              src={bgSettings.customImage}
              autoPlay
              loop
              muted
              playsInline
              onError={() => {
                setBgMediaError(true);
              }}
              className="w-full h-full object-cover object-center pointer-events-none select-none transition-all duration-300 animate-live-wallpaper"
              style={{
                filter: `contrast(1.08) brightness(100%)`,
              }}
            />
          ) : (
            <img
              src={bgSettings.customImage}
              alt="Website Background"
              onError={() => {
                setBgMediaError(true);
              }}
              className="w-full h-full object-cover object-center pointer-events-none select-none transition-all duration-300 animate-live-wallpaper"
              style={{
                filter: `contrast(1.08) brightness(100%)`,
              }}
            />
          )
        ) : (
          <img
            src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop"
            alt="Default Background"
            className="w-full h-full object-cover object-center pointer-events-none select-none animate-live-wallpaper"
            style={{
              filter: `contrast(1.08) brightness(100%)`,
            }}
          />
        )}
      </div>

      {/* Dim overlay when on Login page for ultra clear text visibility */}
      {currentView === "login" && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-[3px] z-[1] pointer-events-none transition-all duration-300" />
      )}

      {/* Live Sato-Rang (7 Rainbow Colors) Falling Flowers - Stationary Ambient Layer */}
      {bgSettings.enableFlowers && currentView !== "login" && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-[5]">
          {flowerParticles.map((flower) => (
            <div
              key={`bg-${flower.id}`}
              className="absolute animate-fall-flower flex items-center justify-center filter drop-shadow-[0_0_15px_rgba(255,255,255,0.95)]"
              style={{
                left: `${flower.left}%`,
                width: `${flower.size}px`,
                height: `${flower.size}px`,
                animationDuration: `${flower.duration * (bgSettings.flowerSpeed || 1)}s`,
                animationDelay: `-${flower.delay}s`,
                color: flower.color,
              }}
            >
              {/* Ultra Fresh Sato-Rang 8-Petal Bloom Flower */}
              <svg
                viewBox="0 0 100 100"
                className="w-full h-full transform transition-transform"
                style={{
                  filter: `drop-shadow(0 0 10px ${flower.color}) brightness(1.3)`,
                }}
              >
                <defs>
                  <radialGradient
                    id={`flw-grad-bg-${flower.id}`}
                    cx="50%"
                    cy="50%"
                    r="50%"
                  >
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.98" />
                    <stop
                      offset="45%"
                      stopColor={flower.color}
                      stopOpacity="1"
                    />
                    <stop
                      offset="100%"
                      stopColor={flower.secondaryColor || flower.color}
                      stopOpacity="0.9"
                    />
                  </radialGradient>
                </defs>

                {/* Outer 8 HD Bloom Petals */}
                <g fill={`url(#flw-grad-bg-${flower.id})`}>
                  <ellipse cx="50" cy="22" rx="14" ry="20" />
                  <ellipse cx="50" cy="78" rx="14" ry="20" />
                  <ellipse cx="22" cy="50" rx="20" ry="14" />
                  <ellipse cx="78" cy="50" rx="20" ry="14" />
                  <ellipse
                    cx="30"
                    cy="30"
                    rx="16"
                    ry="16"
                    transform="rotate(45 30 30)"
                  />
                  <ellipse
                    cx="70"
                    cy="30"
                    rx="16"
                    ry="16"
                    transform="rotate(-45 70 30)"
                  />
                  <ellipse
                    cx="30"
                    cy="70"
                    rx="16"
                    ry="16"
                    transform="rotate(-45 30 70)"
                  />
                  <ellipse
                    cx="70"
                    cy="70"
                    rx="16"
                    ry="16"
                    transform="rotate(45 70 70)"
                  />
                </g>

                {/* Inner Contrast Layer */}
                <g fill={flower.secondaryColor || "#FFF"} opacity="0.9">
                  <circle cx="50" cy="32" r="8" />
                  <circle cx="68" cy="50" r="8" />
                  <circle cx="50" cy="68" r="8" />
                  <circle cx="32" cy="50" r="8" />
                </g>

                {/* Golden Center Pistil Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="14"
                  fill={flower.centerColor || "#FFD700"}
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                />
                <circle cx="50" cy="50" r="8" fill="#FF6D00" />
                <circle cx="47" cy="47" r="3.5" fill="#FFFFFF" opacity="0.95" />
              </svg>
            </div>
          ))}
        </div>
      )}

      {/* Drawer Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[60] transition-opacity"
          onClick={() => setIsMenuOpen(false)}
        ></div>
      )}

      {/* Drawer Menu */}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-[#0a0e17]/95 backdrop-blur-2xl border-r border-white/15 z-[70] transform transition-transform duration-300 ease-in-out shadow-[0_0_50px_rgba(0,0,0,0.95)] flex flex-col ${isMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Menu Header */}
        <div className="p-4 flex items-center justify-between border-b border-white/10 relative overflow-hidden bg-gradient-to-r from-red-500/10 via-amber-500/10 to-cyan-500/10">
          <div className="flex flex-col">
            <span className="text-xl font-black italic tracking-tighter text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.95)]">
              FFH4CK<span className="text-yellow-400">JOD</span>
              <span className="text-white">VIP</span>
            </span>
          </div>
          <button
            onClick={() => setIsMenuOpen(false)}
            className="p-2 hover:bg-transparent rounded-full transition-colors active:scale-95 border border-white/10 hover:border-cyan-400/50"
          >
            <X
              size={22}
              className="text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]"
            />
          </button>
        </div>

        {/* 7-Color Sato-Rang HD Menu Buttons List */}
        <div className="flex flex-col py-3.5 px-3 gap-2.5 overflow-y-auto flex-1 custom-scrollbar">
          {[
            {
              icon: LayoutDashboard,
              label: "Dashboard",
              view: "home",
              color: "#FF0055", // Sato-Rang 1: Red/Rose
              bgGrad: "from-[#FF0055]/20 via-[#FF0055]/5 to-transparent",
              borderGlow: "border-[#FF0055]/40 hover:border-[#FF0055]",
              shadowGlow: "0 0 15px rgba(255,0,85,0.35)",
              tag: "MAIN",
            },
            {
              icon: PlusCircle,
              label: "Add fund",
              view: "addFund",
              color: "#FF6600", // Sato-Rang 2: Orange
              bgGrad: "from-[#FF6600]/20 via-[#FF6600]/5 to-transparent",
              borderGlow: "border-[#FF6600]/40 hover:border-[#FF6600]",
              shadowGlow: "0 0 15px rgba(255,102,0,0.35)",
              tag: "WALLET",
            },
            {
              icon: Key,
              label: "My key",
              view: "myKeys",
              color: "#FFDD00", // Sato-Rang 3: Yellow/Gold
              bgGrad: "from-[#FFDD00]/20 via-[#FFDD00]/5 to-transparent",
              borderGlow: "border-[#FFDD00]/40 hover:border-[#FFDD00]",
              shadowGlow: "0 0 15px rgba(255,221,0,0.35)",
              tag: "KEYS",
            },
            {
              icon: Dices,
              label: "Spin&win",
              view: "spinWin",
              color: "#00E676", // Sato-Rang 4: Green/Emerald
              bgGrad: "from-[#00E676]/20 via-[#00E676]/5 to-transparent",
              borderGlow: "border-[#00E676]/40 hover:border-[#00E676]",
              shadowGlow: "0 0 15px rgba(0,230,118,0.35)",
              tag: "BONUS",
            },
            {
              icon: Gift,
              label: "Refer&earn",
              view: "referEarn",
              color: "#00E5FF", // Sato-Rang 5: Cyan/Sky
              bgGrad: "from-[#00E5FF]/20 via-[#00E5FF]/5 to-transparent",
              borderGlow: "border-[#00E5FF]/40 hover:border-[#00E5FF]",
              shadowGlow: "0 0 15px rgba(0,229,255,0.35)",
              tag: "EARN",
            },
            {
              icon: User,
              label: "Profile",
              view: "profile",
              color: "#3B82F6", // Sato-Rang 6: Blue
              bgGrad: "from-[#3B82F6]/20 via-[#3B82F6]/5 to-transparent",
              borderGlow: "border-[#3B82F6]/40 hover:border-[#3B82F6]",
              shadowGlow: "0 0 15px rgba(59,130,246,0.35)",
              tag: "USER",
            },
            {
              icon: Headset,
              label: "Customer support",
              view: "customerSupport",
              color: "#7C4DFF", // Sato-Rang 7: Purple/Violet
              bgGrad: "from-[#7C4DFF]/20 via-[#7C4DFF]/5 to-transparent",
              borderGlow: "border-[#7C4DFF]/40 hover:border-[#7C4DFF]",
              shadowGlow: "0 0 15px rgba(124,77,255,0.35)",
              tag: "24/7",
            },
            {
              icon: LogIn,
              label: "Login",
              view: "login",
              color: "#F50057", // Sato-Rang Extra: Magenta/Pink
              bgGrad: "from-[#F50057]/20 via-[#F50057]/5 to-transparent",
              borderGlow: "border-[#F50057]/40 hover:border-[#F50057]",
              shadowGlow: "0 0 15px rgba(245,0,87,0.35)",
              tag: "AUTH",
            },
            {
              icon: FileText,
              label: "Terms & Policies",
              view: "policies",
              color: "#9CA3AF", // Silver
              bgGrad: "from-[#9CA3AF]/20 via-[#9CA3AF]/5 to-transparent",
              borderGlow: "border-[#9CA3AF]/40 hover:border-[#9CA3AF]",
              shadowGlow: "0 0 15px rgba(156,163,175,0.35)",
              tag: "INFO",
            },
            {
              icon: ShieldCheck,
              label: "Permission Access",
              view: "permissions",
              color: "#06B6D4", // Cyan
              bgGrad: "from-[#06B6D4]/20 via-[#06B6D4]/5 to-transparent",
              borderGlow: "border-[#06B6D4]/40 hover:border-[#06B6D4]",
              shadowGlow: "0 0 15px rgba(6,182,212,0.35)",
              tag: "LIVE",
            },
          ].map((item, idx) => {
            const isActive = currentView === item.view;
            return (
              <button
                key={`sidemenu-${item.view}-${idx}`}
                onClick={() => {
                  setCurrentView(item.view as any);
                  setIsMenuOpen(false);
                }}
                className={`relative flex items-center justify-between px-3.5 py-3 rounded-xl transition-all duration-300 w-full text-left group overflow-hidden border  ${item.borderGlow} ${isActive ? "scale-[1.02] bg-transparent" : "bg-transparent hover:bg-transparent hover:scale-[1.02]"}`}
                style={{
                  boxShadow: isActive ? item.shadowGlow : undefined,
                }}
              >
                {/* Sato-Rang Ambient Glow Gradient */}
                <div
                  className={`absolute inset-0 bg-gradient-to-r ${item.bgGrad} opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none`}
                ></div>

                {/* Left Live Indicator Bar */}
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-7 rounded-r-full transition-all group-hover:h-9"
                  style={{
                    backgroundColor: item.color,
                    boxShadow: `0 0 10px ${item.color}`,
                  }}
                />

                <div className="flex items-center gap-3.5 relative z-10 pl-2">
                  {/* HD Vibrant Glow Icon */}
                  <div
                    className="p-1.5 rounded-lg bg-transparent border transition-all duration-300 group-hover:scale-110"
                    style={{
                      borderColor: `${item.color}55`,
                      boxShadow: `0 0 8px ${item.color}40`,
                    }}
                  >
                    <item.icon
                      size={19}
                      style={{
                        color: item.color,
                        filter: `drop-shadow(0 0 6px ${item.color})`,
                      }}
                    />
                  </div>

                  {/* Button Title */}
                  <span
                    className="font-bold text-sm tracking-wide text-gray-100 group-hover:text-white transition-colors"
                    style={{
                      textShadow: isActive
                        ? `0 0 8px ${item.color}`
                        : undefined,
                    }}
                  >
                    {item.label}
                  </span>
                </div>

                {/* Right Sato-Rang Mini Pill Tag */}
                <span
                  className="relative z-10 text-[9px] font-black tracking-widest px-2 py-0.5 rounded-full border transition-all duration-300"
                  style={{
                    backgroundColor: `${item.color}15`,
                    borderColor: `${item.color}60`,
                    color: item.color,
                    boxShadow: `0 0 6px ${item.color}30`,
                  }}
                >
                  {item.tag}
                </span>
              </button>
            );
          })}
        </div>

        {/* Drawer Footer */}
        <div className="p-3 border-t border-white/10 bg-transparent ">
          <div className="flex items-center justify-between text-xs text-gray-300 px-1">
            <span className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full animate-ping"
                style={{ backgroundColor: "#00E676" }}
              />
              <span className="text-[11px] font-semibold text-emerald-400">
                Server Online
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Main App Window - Responsive HD Screen Window */}
      <div className="relative z-10 flex flex-col h-full w-full max-w-md sm:max-w-lg md:max-w-xl mx-auto overflow-hidden transition-all duration-500">
        {/* Fixed Top Controls Bar - Crystal Clear Glass (Top Wallpaper Completely Visible in Ultra HD) */}
        <div className="flex-shrink-0 z-50 bg-transparent border-b border-white/10 shadow-[0_2px_15px_rgba(0,0,0,0.25)] flex flex-col transition-all">
          {/* Main Header/Nav - Menu + Title + Wallet */}
          <header className="flex items-center justify-between px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMenuOpen(true)}
                className="p-2 rounded-xl transition-all active:scale-95 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-cyan-400 shadow-md cursor-pointer"
                aria-label="Open Menu"
              >
                <Menu size={22} className="text-white drop-shadow-[0_0_8px_#fff]" />
              </button>
              <h1 className="text-lg font-black italic tracking-wider mt-0.5 text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.9)]">
                FFH4CK<span className="text-amber-400 font-black">JOD</span>
                <span className="text-white font-black">VIP</span>
              </h1>
            </div>

            <div className="flex items-center gap-2">
              {/* Wallet Balance Button */}
              <div
                onClick={() => setCurrentView("addFund")}
                className="flex items-center gap-1.5 bg-transparent border border-cyan-400/70 rounded-full px-3 py-1 shadow-[0_0_15px_rgba(0,229,255,0.3)] cursor-pointer hover:border-cyan-300 hover:bg-cyan-950/40 transition-all active:scale-95"
              >
                <Wallet size={14} className="text-cyan-400" />
                <span className="text-cyan-300 font-bold text-xs tracking-wide">
                  ₹ {userBalance.toFixed(2)}
                </span>
              </div>
            </div>
          </header>

          {/* Top Scrolling Marquee Notice Ticker */}
          {bannerSettings.marqueeEnabled && (
            <div
              onClick={() => setShowImportantNoticeModal(true)}
              className="bg-black/75 backdrop-blur-sm border-y border-fuchsia-500/30 px-3 py-1 flex items-center gap-2 cursor-pointer hover:bg-black/90 transition-all text-xs overflow-hidden select-none"
              title="Click to view full Important Notice"
            >
              <div className="flex items-center gap-1 text-fuchsia-300 font-black text-[10px] shrink-0 bg-fuchsia-950/80 border border-fuchsia-500/50 px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow-[0_0_8px_rgba(217,70,239,0.4)]">
                <Megaphone size={11} className="text-fuchsia-400" />
                <span>Notice</span>
              </div>
              <div className="overflow-hidden whitespace-nowrap w-full">
                <div className="inline-block animate-marquee text-gray-200 text-[11px] font-medium tracking-wide">
                  {bannerSettings.marqueeText}
                </div>
              </div>
            </div>
          )}

          {/* Fixed Category Button & Search Bar for Home View */}
          {currentView === "home" && (
            <div className="px-3 pb-2.5 pt-0.5 flex flex-col gap-2">
              {/* Premium Store & Category Button */}
              <div className="flex items-center justify-between mt-0.5 relative z-20">
                <h2 className="text-lg font-black tracking-tight italic drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                  PREMIUM{" "}
                  <span className="text-fuchsia-400 drop-shadow-[0_0_15px_rgba(217,70,239,1)] animate-pulse-slow">
                    STORE
                  </span>
                </h2>
                <div className="relative">
                  {/* Category Filter Button */}
                  <button
                    onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                    className="relative w-full flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-3.5 py-2 rounded-xl font-black text-xs transition-all active:scale-95 cursor-pointer"
                  >
                    <Filter size={14} className="text-cyan-400" />
                    <span className="text-cyan-300 tracking-wide uppercase font-black">
                      {selectedCategory}
                    </span>
                  </button>

                  {/* Category Dropdown */}
                  {isCategoryOpen && (
                    <div className="absolute top-full right-0 mt-2.5 w-52 p-2 rounded-2xl bg-[#0c101a] border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.95)] z-50 flex flex-col gap-1.5">
                      <div className="px-2 py-1 text-[10px] font-black uppercase tracking-widest text-cyan-400 border-b border-white/10 mb-1 text-center font-bold">
                        ✦ SELECT CATEGORY ✦
                      </div>
                        {[
                          "All",
                          "24ghanta",
                          "Root",
                          "Non root",
                          "Steamer",
                          "Pc",
                          "Bgmi",
                          "Moba legend",
                        ].map((cat, idx) => (
                          <button
                            key={`cat-${cat}-${idx}`}
                            onClick={() => {
                              setSelectedCategory(cat);
                              setIsCategoryOpen(false);
                            }}
                            className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white bg-transparent hover:bg-transparent transition-all flex items-center justify-between group border border-white/10 hover:border-white/30"
                          >
                            <span className="animate-satorang-text group-hover:scale-105 transition-transform">
                              {cat}
                            </span>
                            <span className="w-2 h-2 rounded-full bg-rainbow-animated shadow-[0_0_10px_rgba(255,255,255,0.8)]"></span>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Search Bar with Hidden Admin & Reseller Triggers */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-20">
                  <Search
                    size={15}
                    className="text-cyan-400 group-focus-within:text-cyan-300 transition-colors"
                  />
                </div>
                <div className="absolute inset-0 bg-cyan-400/5 rounded-xl blur-md group-focus-within:bg-cyan-400/15 transition-all"></div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    const val = e.target.value;
                    const clean = val.toLowerCase().trim();
                    setSearchQuery(val);

                    if (
                      clean === "premadmin" ||
                      clean === "#adminaccess" ||
                      clean === "adminaccess" ||
                      clean === "#admin"
                    ) {
                      setSearchQuery("");
                      setCurrentView("staff");
                      playSuccessChime();
                      setShowSecretAdminToast(true);
                      setTimeout(() => setShowSecretAdminToast(false), 4500);
                    } else if (
                      clean === "premreseller" ||
                      clean === "#reselleraccess" ||
                      clean === "reselleraccess" ||
                      clean === "reseller" ||
                      clean === "#reseller"
                    ) {
                      setSearchQuery("");
                      setShowResellerModal(true);
                      playSuccessChime();
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const clean = searchQuery.toLowerCase().trim();
                      if (
                        clean === "premadmin" ||
                        clean === "#adminaccess" ||
                        clean === "adminaccess" ||
                        clean === "#admin"
                      ) {
                        e.preventDefault();
                        setSearchQuery("");
                        setCurrentView("staff");
                        playSuccessChime();
                        setShowSecretAdminToast(true);
                        setTimeout(() => setShowSecretAdminToast(false), 4500);
                      } else if (
                        clean === "premreseller" ||
                        clean === "#reselleraccess" ||
                        clean === "reselleraccess" ||
                        clean === "reseller" ||
                        clean === "#reseller"
                      ) {
                        e.preventDefault();
                        setSearchQuery("");
                        setShowResellerModal(true);
                        playSuccessChime();
                      }
                    }
                  }}
                  placeholder="Search panels..."
                  className="w-full bg-transparent  border border-cyan-500/30 focus:border-cyan-400 rounded-xl py-1.5 pl-9 pr-3 text-white focus:outline-none focus:shadow-[0_0_15px_rgba(0,229,255,0.3)] transition-all placeholder:text-gray-400 relative z-10 text-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Feed - ONLY the Panels Scroll Up & Down with Generous Separation Gaps */}
        <main className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-5 pb-28 flex flex-col gap-6 sm:gap-8 custom-scrollbar">
          {currentView === "home" && (
            <>
              {/* Reseller VIP Live Floating Status Badge (When logged in as Reseller) */}
              {resellerUser.isLoggedIn && resellerUser.isApproved && (
                <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 border-2 border-yellow-400/60 rounded-2xl p-3 shadow-[0_0_25px_rgba(234,179,8,0.4)] flex items-center justify-between mx-0.5 mb-2 animate-in fade-in">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-yellow-400/20 border border-yellow-400 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(234,179,8,0.5)]">
                      <Award className="text-yellow-400" size={20} />
                    </div>
                    <div className="flex flex-col text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-yellow-300 uppercase tracking-wide">
                          👑 RESELLER VIP ACTIVE
                        </span>
                        <span className="bg-emerald-500 text-black text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase">
                          VERIFIED
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-200">
                        {resellerUser.email} • Reseller Balance:{" "}
                        <strong className="text-cyan-300 font-mono">
                          ₹{resellerUser.balance}
                        </strong>
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowResellerModal(true)}
                    className="bg-yellow-400 hover:bg-yellow-300 text-black font-black text-[10px] px-3 py-1.5 rounded-xl uppercase tracking-wider shadow-[0_0_10px_rgba(234,179,8,0.6)] transition-all active:scale-95 shrink-0"
                  >
                    PORTAL
                  </button>
                </div>
              )}

              {(ensureArray(panels).length > 0 ? ensureArray(panels) : DEFAULT_STORE_PANELS)
                .filter((p) => {
                  if (!p) return false;
                  const q = searchQuery.toLowerCase().trim();
                  const pTitle = p.title ? String(p.title).toLowerCase() : "";
                  const pCat = p.category ? String(p.category).toLowerCase() : "";
                  const pCatClean = pCat.replace(/\s+/g, "");
                  const selCatClean = selectedCategory
                    .toLowerCase()
                    .replace(/\s+/g, "");

                  const matchesSearch =
                    !q ||
                    pTitle.includes(q) ||
                    pCat.includes(q) ||
                    (q === "24ghanta" &&
                      (pCat.includes("24ghanta") || pCat.includes("house")));

                  const matchesCat =
                    selectedCategory === "Category" ||
                    selectedCategory === "All" ||
                    pCatClean === selCatClean ||
                    (selCatClean === "24ghanta" &&
                      (pCatClean.includes("24ghanta") ||
                        pCatClean.includes("house")));

                  return matchesSearch && matchesCat;
                })
                .map((panel, pIdx) => {
                  const imgYt = getYouTubeInfo(panel.image);
                  const videoYt = getYouTubeInfo(panel.videoLink) || getYouTubeInfo(panel.videoTutorial);
                  const activeYt = videoYt || imgYt;

                  // Check if this panel has an explicit video file (MP4, WebM, blob, uploads, etc.) or is marked isVideo
                  const hasDirectVideoFile = Boolean(
                    (panel.videoLink && (
                      /\.(mp4|webm|mov|mkv|3gp|m4v|avi)/i.test(panel.videoLink) ||
                      panel.videoLink.includes("/uploads/") ||
                      panel.videoLink.startsWith("data:video") ||
                      panel.videoLink.startsWith("blob:")
                    )) ||
                    (panel.image && (
                      /\.(mp4|webm|mov|mkv|3gp|m4v|avi)/i.test(panel.image) ||
                      panel.image.includes("/uploads/") ||
                      panel.image.startsWith("data:video") ||
                      panel.image.startsWith("blob:")
                    ))
                  );

                  const isGalleryVideo = Boolean(
                    hasDirectVideoFile ||
                    (panel.isVideo && !imgYt && !videoYt) ||
                    panel.mediaType === "video"
                  );

                  const isYouTubeVideo = Boolean(!isGalleryVideo && (activeYt || panel.mediaType === "youtube"));
                  const isPhoto = !isGalleryVideo && !isYouTubeVideo;

                  // Direct video playback URL for gallery video
                  const directVideoUrl = isGalleryVideo
                    ? (panel.isVideo && panel.image && !imgYt ? panel.image : (panel.videoLink || panel.image))
                    : null;

                  // Display thumbnail / cover image
                  const displayThumbnail = isPhoto
                    ? (panel.image || "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop")
                    : isYouTubeVideo
                      ? (panel.image && !imgYt ? panel.image : (activeYt?.thumbnailUrl || "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop"))
                      : (panel.image || "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop");

                  const handleOpenMedia = () => {
                    if (isGalleryVideo && directVideoUrl) {
                      setPreviewMedia({
                        url: directVideoUrl,
                        isVideo: true,
                        mediaType: "video",
                        title: panel.title + " - Direct Video Gameplay",
                      });
                    } else if (isYouTubeVideo && activeYt) {
                      const yUrl = videoYt ? panel.videoLink : (imgYt ? panel.image : panel.videoTutorial);
                      setPreviewMedia({
                        url: yUrl,
                        isVideo: true,
                        mediaType: "youtube",
                        title: panel.title + " - YouTube Video Demo",
                        youtubeLink: yUrl,
                      });
                    } else {
                      setPreviewMedia({
                        url: displayThumbnail,
                        isVideo: false,
                        isImage: true,
                        mediaType: "photo",
                        title: panel.title + " - Ultra HD Photo",
                      });
                    }
                  };

                  const isResellerActive =
                    resellerUser.isLoggedIn && resellerUser.isApproved;
                  const activePricingArray = ensureArray(
                    panel.pricing || panel.pricingPlans || panel.options || []
                  );
                  const hasSelectedPrice = activePricingArray.some(
                    (pr: any) => String(pr.price) === String(selectedPlans[panel.id])
                  );
                  const activeSelectedPrice = hasSelectedPrice
                    ? selectedPlans[panel.id]
                    : (activePricingArray[0]?.price ?? 0);
                  const activePlan =
                    activePricingArray.find(
                      (pr: any) => String(pr.price) === String(activeSelectedPrice),
                    ) || activePricingArray[0];
                  const activeResellerPrice = activePlan
                    ? ((activePlan as any).resellerPrice ??
                      Math.round(Number(activePlan.price || 0) * 0.65))
                    : Math.round(Number(activeSelectedPrice || 0) * 0.65);

                  return (
                    <div
                      key={`store-panel-${panel.id}-${pIdx}`}
                      className="relative rounded-3xl satorang-card-chamber group overflow-hidden mb-8 sm:mb-10 flex-shrink-0 transition-all duration-300 hover:scale-[1.015]"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none"></div>

                      {/* Water-like Clear Transparent Glass Body */}
                      <div className="bg-transparent  rounded-[14px] p-3 flex flex-col gap-2.5 h-full w-full relative z-10 transition-colors">
                        {/* Video / Photo Thumbnail - Compact Height & Clear */}
                        <div
                          onClick={handleOpenMedia}
                          className="relative w-full h-36 sm:h-40 rounded-xl overflow-hidden border border-cyan-500/30 bg-black/40 shadow-[0_0_15px_rgba(0,0,0,0.6)] cursor-pointer group/media"
                        >
                          {isGalleryVideo && directVideoUrl ? (
                            <div className="relative w-full h-full">
                              <video
                                key={`panel-vid-${panel.id}-${directVideoUrl}`}
                                src={directVideoUrl}
                                autoPlay
                                loop
                                muted={!unmutedPanels[panel.id]}
                                playsInline
                                className="w-full h-full object-cover opacity-100 transition-transform duration-500 group-hover/media:scale-105"
                              />
                              {/* Direct Sound Mute / Unmute Button on Card */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setUnmutedPanels((prev) => ({
                                    ...prev,
                                    [panel.id]: !prev[panel.id],
                                  }));
                                }}
                                className="absolute top-2 left-2 z-20 px-2 py-1 rounded-lg bg-black/80 hover:bg-black border border-cyan-400/60 text-cyan-300 text-[9.5px] font-black flex items-center gap-1 shadow-[0_0_10px_rgba(6,182,212,0.6)] transition-all active:scale-95 cursor-pointer"
                                title={unmutedPanels[panel.id] ? "Sound band karein" : "Sound chalu karein"}
                              >
                                {unmutedPanels[panel.id] ? (
                                  <>
                                    <Volume2 size={11} className="text-emerald-400 animate-pulse" />
                                    <span className="text-emerald-300">AUDIO ON</span>
                                  </>
                                ) : (
                                  <>
                                    <VolumeX size={11} className="text-gray-300" />
                                    <span className="text-gray-300">UNMUTE</span>
                                  </>
                                )}
                              </button>
                            </div>
                          ) : (
                            <img
                              src={displayThumbnail}
                              alt={panel.title}
                              onError={(e) => {
                                if (
                                  activeYt &&
                                  e.currentTarget.src !==
                                    activeYt.fallbackThumbnailUrl
                                ) {
                                  e.currentTarget.src =
                                    activeYt.fallbackThumbnailUrl;
                                }
                              }}
                              className="w-full h-full object-cover opacity-100 transition-transform duration-500 group-hover/media:scale-105"
                            />
                          )}

                          {/* Top dark fade for text legibility */}
                          <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/85 to-transparent pointer-events-none"></div>

                          {/* Central Action Icon Overlay */}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover/media:bg-black/35 transition-colors pointer-events-none z-10">
                            {isYouTubeVideo ? (
                              <div className="w-11 h-11 rounded-full bg-red-600/95 border-2 border-white shadow-[0_0_25px_rgba(220,38,38,0.95)] flex items-center justify-center transition-transform group-hover/media:scale-115">
                                <Play className="fill-white text-white ml-0.5 w-5 h-5" />
                              </div>
                            ) : isGalleryVideo ? (
                              <div className="w-10 h-10 rounded-full bg-cyan-600/90 border-2 border-white shadow-[0_0_20px_rgba(6,182,212,0.95)] flex items-center justify-center transition-transform group-hover/media:scale-115">
                                <Play className="fill-white text-white ml-0.5 w-4 h-4" />
                              </div>
                            ) : (
                              <div className="opacity-0 group-hover/media:opacity-100 transition-opacity w-9 h-9 rounded-full bg-fuchsia-600/85 border border-white/80 flex items-center justify-center text-white shadow-lg">
                                <Maximize2 size={16} />
                              </div>
                            )}
                          </div>

                          {/* Top Right Media Type Badge */}
                          {isYouTubeVideo ? (
                            <div className="absolute top-2 right-2 bg-gradient-to-r from-red-600 to-rose-600 text-white text-[9.5px] font-black px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-[0_0_15px_rgba(225,29,72,0.8)] border border-red-400/50 z-10">
                              <Youtube size={11} className="fill-white" />
                              <span>YOUTUBE VIDEO</span>
                            </div>
                          ) : isGalleryVideo ? (
                            <div className="absolute top-2 right-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-[9.5px] font-black px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-[0_0_15px_rgba(6,182,212,0.8)] border border-cyan-400/50 z-10">
                              <Play size={9} className="fill-white" />
                              <span>DIRECT VIDEO</span>
                            </div>
                          ) : (
                            <div className="absolute top-2 right-2 bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white text-[9.5px] font-black px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-[0_0_15px_rgba(217,70,239,0.8)] border border-fuchsia-400/50 z-10">
                              <Camera size={10} />
                              <span>HD PHOTO</span>
                            </div>
                          )}

                          {/* Thumbnail Title Tag */}
                          <div className="absolute top-2 left-2.5 right-24 pointer-events-none z-10">
                            <h3 className="text-[12px] font-black text-white leading-tight uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,1)] tracking-wide truncate">
                              {panel.thumbnailTitle || panel.title}
                            </h3>
                            <p className="text-[9px] font-bold text-cyan-300 drop-shadow-[0_1px_2px_rgba(0,0,0,1)] truncate">
                              {panel.thumbnailSub || panel.category}
                            </p>
                          </div>

                          {/* Tap to View HD Badge */}
                          <div className="absolute bottom-1.5 left-2 bg-black/60 backdrop-blur-sm border border-cyan-400/40 text-cyan-300 text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-md z-10">
                            <Zap size={9} className="fill-cyan-400" />
                            <span>{isYouTubeVideo ? "Tap for YouTube" : isGalleryVideo ? "Tap for Video" : "Tap for HD"}</span>
                          </div>

                          {/* Contextual Play / View Media Button */}
                          <div className="absolute bottom-1.5 right-2 flex items-center gap-1 z-10">
                            {isYouTubeVideo ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenMedia();
                                }}
                                className="bg-red-600 hover:bg-red-500 text-white font-black text-[9px] px-2.5 py-1 rounded-md flex items-center gap-1 shadow-[0_0_12px_rgba(220,38,38,0.8)] transition-transform hover:scale-105 active:scale-95"
                              >
                                <Youtube size={11} className="fill-white" />
                                <span>YouTube Video</span>
                              </button>
                            ) : isGalleryVideo ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenMedia();
                                }}
                                className="bg-cyan-600 hover:bg-cyan-500 text-white font-black text-[9px] px-2.5 py-1 rounded-md flex items-center gap-1 shadow-[0_0_12px_rgba(6,182,212,0.8)] transition-transform hover:scale-105 active:scale-95"
                              >
                                <Play size={10} className="fill-white" />
                                <span>Play Video</span>
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenMedia();
                                }}
                                className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-black text-[9px] px-2.5 py-1 rounded-md flex items-center gap-1 shadow-[0_0_12px_rgba(217,70,239,0.8)] transition-transform hover:scale-105 active:scale-95"
                              >
                                <Camera size={10} />
                                <span>View Photo</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Center Panel Name - Sato-Rang Live 7 Colors */}
                        <div className="text-center my-0.5">
                          <h3 className="text-[17px] font-black tracking-wider uppercase font-sans animate-satorang-text antialiased select-all">
                            {panel.title}
                          </h3>
                        </div>

                        {/* Features List - Sato-Rang Live 7 Colors for Feature Names */}
                        {(() => {
                          const panelFeatures = parseFeaturesList(panel.features, panel.description);
                          const isExpanded = Boolean(expandedPanels[panel.id]);
                          const displayedFeatures = isExpanded
                            ? panelFeatures
                            : panelFeatures.slice(0, 3);
                          return (
                            <>
                              <div
                                className={`flex flex-col gap-1 mt-0.5 transition-all overflow-y-auto pr-1 custom-scrollbar ${isExpanded ? "max-h-56" : "max-h-24"}`}
                              >
                                {displayedFeatures.map((feature, idx) => (
                                  <div
                                    key={`feat-${panel.id}-${idx}`}
                                    className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-lg py-1 px-2 shrink-0 shadow-sm"
                                  >
                                    <Zap
                                      size={12}
                                      className="text-fuchsia-400 fill-fuchsia-400 shrink-0"
                                    />
                                    <span className="font-bold animate-satorang-text text-[11px] truncate">
                                      {feature}
                                    </span>
                                  </div>
                                ))}
                              </div>

                              {/* Expand Arrow Toggle */}
                              {panelFeatures.length > 3 && (
                                <div className="flex justify-center mt-0.5">
                                  <button
                                    onClick={() =>
                                      setExpandedPanels((prev) => ({
                                        ...prev,
                                        [panel.id]: !prev[panel.id],
                                      }))
                                    }
                                    className="p-0.5 hover:bg-fuchsia-500/10 rounded-full transition-colors flex items-center gap-1 text-[10px] text-fuchsia-400 font-bold cursor-pointer"
                                    title={
                                      isExpanded
                                        ? "Hide Features"
                                        : "Show All Features"
                                    }
                                  >
                                    {isExpanded ? (
                                      <>
                                        <span>Hide Details</span>
                                        <ChevronUp
                                          size={16}
                                          className="text-fuchsia-400"
                                        />
                                      </>
                                    ) : (
                                      <>
                                        <span>View All ({panelFeatures.length})</span>
                                        <ChevronDown
                                          size={16}
                                          className="text-fuchsia-500 animate-bounce"
                                        />
                                      </>
                                    )}
                                  </button>
                                </div>
                              )}
                            </>
                          );
                        })()}

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            onClick={() => {
                              const targetUrl =
                                panel.installLink ||
                                panel.exceptFileLink ||
                                accessFileSteps.directFileUrl ||
                                supportLinks.telegram;
                              if (targetUrl) {
                                window.open(targetUrl, "_blank");
                              } else {
                                alert("No install link provided");
                              }
                            }}
                            className="flex items-center justify-center gap-1 border border-cyan-400/60 bg-cyan-950/40  hover:bg-cyan-900/60 text-white rounded-lg py-2 text-[10px] font-bold tracking-wider transition-all shadow-[0_0_12px_rgba(0,229,255,0.2)] hover:scale-[1.02] active:scale-[0.98]"
                          >
                            <Download size={12} className="text-cyan-400" />
                            INSTALL/PANEL
                          </button>
                          <button
                            onClick={() => {
                              const targetUrl =
                                panel.videoLink ||
                                panel.videoTutorial ||
                                panel.image ||
                                "https://t.me/Premjodvip";
                              setPreviewMedia({
                                url: targetUrl,
                                isVideo: true,
                                title: panel.title + " - Video Feedback & Proof",
                                youtubeLink: targetUrl,
                              });
                            }}
                            className="flex items-center justify-center gap-1 border border-red-500/60 bg-red-950/40  hover:bg-red-900/60 text-white rounded-lg py-2 text-[10px] font-bold tracking-wider transition-all shadow-[0_0_12px_rgba(239,68,68,0.2)] hover:scale-[1.02] active:scale-[0.98]"
                          >
                            <Play size={12} className="fill-white" />
                            VIDEO/FEEDBACK
                          </button>
                        </div>

                        {/* Differential Pricing Tag (If Reseller is active) */}
                        {isResellerActive && (
                          <div className="flex items-center justify-between text-[11px] bg-yellow-500/20 border border-yellow-400/50 px-2 py-1 rounded-lg text-yellow-300 font-black shadow-[0_0_10px_rgba(234,179,8,0.2)]">
                            <span className="flex items-center gap-1">
                              <Award size={13} className="text-yellow-400" /> 👑
                              VIP Reseller Price:
                            </span>
                            <span className="font-mono text-xs text-yellow-200">
                              <span className="animate-satorang-text font-black">₹{activeResellerPrice}</span>{" "}
                              <span className="line-through text-gray-400 text-[10px] font-normal font-sans ml-1">
                                ₹{activeSelectedPrice}
                              </span>
                            </span>
                          </div>
                        )}

                        {/* Active Panel Price Highlight Row */}
                        <div className="flex items-center justify-between px-2 py-1 rounded-lg border border-white/10 bg-transparent mt-0.5">
                          <span className="text-[11px] font-bold text-gray-300">
                            Panel Price:
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[15px] font-mono font-black animate-satorang-text tracking-wide">
                              ₹{isResellerActive ? activeResellerPrice : activeSelectedPrice}
                            </span>
                            {isResellerActive && (
                              <span className="text-[10px] text-gray-400 line-through font-mono">
                                ₹{activeSelectedPrice}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Pricing Dropdown */}
                        <div className="relative mt-0.5">
                          <select
                            value={
                              hasSelectedPrice
                                ? selectedPlans[panel.id]
                                : (activePricingArray[0]?.price ?? "")
                            }
                            className={`w-full appearance-none bg-transparent  hover:bg-transparent text-white font-bold rounded-lg py-2 px-2.5 pr-7 focus:outline-none focus:ring-1 transition-all cursor-pointer text-[12px] border ${
                              isResellerActive
                                ? "border-yellow-400/70 focus:ring-yellow-400 text-yellow-100 shadow-[0_0_12px_rgba(234,179,8,0.3)]"
                                : "border-fuchsia-400/40 focus:ring-fuchsia-400 shadow-[0_0_12px_rgba(217,70,239,0.2)]"
                            }`}
                            onChange={(e) => {
                              const price = e.target.value;
                              setSelectedPlans((prev) => ({
                                ...prev,
                                [panel.id]: price,
                              }));
                            }}
                          >
                            {activePricingArray.map((plan: any, idx: number) => {
                              const isOutOfStock =
                                isNaN(Number(plan.price)) ||
                                Number(plan.price) < 0 ||
                                (plan.label &&
                                   plan.label.toLowerCase().includes("stock")) ||
                                (typeof plan.price === "string" &&
                                  plan.price.toLowerCase().includes("stock"));
                              const planResellerP =
                                (plan as any).resellerPrice !== undefined
                                  ? (plan as any).resellerPrice
                                  : Math.round(plan.price * 0.65);
                              if (isOutOfStock) {
                                return (
                                  <option
                                    key={`price-${panel.id}-${plan.price}-${idx}`}
                                    value={plan.price}
                                    disabled
                                    className="bg-[#0b0e18] text-red-400 font-bold"
                                  >
                                    🚫 {plan.label} (OUT OF STOCK)
                                  </option>
                                );
                              }
                              return (
                                <option
                                  key={`price-${panel.id}-${plan.price}-${idx}`}
                                  value={plan.price}
                                  className="bg-[#0b0e18] text-white"
                                >
                                  {isResellerActive
                                    ? `👑 ₹${planResellerP} VIP (Normal: ₹${plan.price}) - ${plan.label}`
                                    : `₹${plan.price} - ${plan.label}`}
                                </option>
                              );
                            })}
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center px-2.5 pointer-events-none">
                            <ChevronDown
                              size={14}
                              className={
                                isResellerActive ? "text-yellow-400" : "text-white"
                              }
                            />
                          </div>
                        </div>
                        {/* Buy Button */}
                        <button
                          onClick={() => {
                            const price = activeSelectedPrice;

                            if (
                              String(price).trim() === "" ||
                              String(price).toLowerCase().includes("stock")
                            ) {
                              alert(
                                "Kripya pehle ek valid plan select karein (Out of Stock items can't be bought)."
                              );
                              return;
                            }
                            handleOpenCheckout(price, panel.title);
                          }}
                        className={`relative w-full overflow-hidden text-white font-black text-[12px] py-2.5 rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98] mt-0.5 uppercase tracking-wider ${
                            isResellerActive
                              ? "bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-black shadow-[0_0_20px_rgba(234,179,8,0.5)] border border-yellow-300"
                              : "bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 hover:from-violet-500 hover:via-fuchsia-500 hover:to-pink-500 shadow-[0_0_20px_rgba(192,38,211,0.4)] border border-fuchsia-300/40"
                          }`}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
                          <span className="relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] flex items-center justify-center gap-1.5">
                            <span>{isResellerActive ? "👑 BUY KEY VIP" : "BUY KEY"}</span>
                            <span className="font-mono font-black animate-satorang-text text-white">
                              (₹{isResellerActive ? activeResellerPrice : activeSelectedPrice})
                            </span>
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
            </>
          )}

          {currentView === "keyPending" && (
            <div className="flex flex-col items-center gap-5 w-full animate-in fade-in zoom-in-95 duration-300 relative z-10 mt-2 text-center py-6">
              <div className="w-20 h-20 bg-yellow-500/20 border-2 border-yellow-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.4)] animate-pulse">
                <Key size={36} className="text-yellow-400" />
              </div>
              <div>
                <h2 className="text-2xl font-black italic tracking-tight text-white uppercase drop-shadow-md">
                  KEY ORDER <span className="text-yellow-400">SUBMITTED</span>
                </h2>
                <p className="text-gray-300 text-xs font-semibold mt-2 max-w-xs mx-auto leading-relaxed">
                  Aapka key request admin ko bhej diya gaya hai. Admin dwara key
                  approve karne ke baad aapko{" "}
                  <span className="text-yellow-400 font-bold">"My Key"</span>{" "}
                  section me aapka key mil jayega!
                </p>
              </div>

              {countdown > 0 ? (
                <div className="flex flex-col items-center gap-2 bg-transparent  border border-yellow-500/30 p-4 rounded-2xl w-full max-w-xs ">
                  <span className="text-5xl font-black text-yellow-400 drop-shadow-[0_0_15px_rgba(234,179,8,0.8)] animate-bounce">
                    {countdown}
                  </span>
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                    Processing Key Request
                  </span>
                </div>
              ) : (
                <div className="bg-green-500/20 border border-green-500/50 p-4 rounded-2xl text-green-400 font-bold text-xs w-full max-w-xs shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                  Request Registered Successfully!
                </div>
              )}

              <button
                onClick={() => setCurrentView("myKeys")}
                className="w-full max-w-xs bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-black py-3.5 rounded-xl shadow-[0_0_20px_rgba(234,179,8,0.5)] transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-2 mt-2"
              >
                <Key size={18} /> GO TO MY KEYS
              </button>
            </div>
          )}

          {currentView === "myKeys" &&
            (() => {
              const activeAccKey = getAccountKey(
                userProfile.email,
                userProfile.phone,
              );
              const userKeyRequests = ensureArray(keyRequests).filter((req) => {
                if (req.userAccountKey) {
                  return req.userAccountKey === activeAccKey;
                }
                if (!userProfile.isLoggedIn) return false;
                const reqEmail = (req.userEmail || "").toLowerCase();
                const reqPhone = (req.userPhone || "").toLowerCase();
                const reqUser = (req.user || "").toLowerCase();
                const uEmail = (userProfile.email || "").toLowerCase();
                const uPhone = (userProfile.phone || "").toLowerCase();
                return (
                  (uEmail &&
                    (reqEmail === uEmail || reqUser.includes(uEmail))) ||
                  (uPhone && (reqPhone === uPhone || reqUser.includes(uPhone)))
                );
              });

              return (
                <div className="flex flex-col gap-5 w-full animate-in fade-in zoom-in-95 duration-300 relative z-10 mt-2 bg-transparent  rounded-3xl p-5 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setCurrentView("home")}
                        className="p-2 bg-transparent hover:bg-transparent rounded-full transition-colors "
                      >
                        <ArrowLeft size={20} className="text-white" />
                      </button>
                      <h2 className="text-2xl font-black tracking-tight italic drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase">
                        MY{" "}
                        <span className="text-fuchsia-500 drop-shadow-[0_0_15px_rgba(217,70,239,1)] animate-pulse-slow">
                          KEYS
                        </span>
                      </h2>
                    </div>
                    <button
                      onClick={() => setCurrentView("home")}
                      className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                    >
                      + Buy Key
                    </button>
                  </div>

                  <div className="flex flex-col gap-4">
                    {userKeyRequests.length === 0 ? (
                      <div className="bg-transparent  border border-white/10 rounded-2xl p-8 text-center flex flex-col items-center shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                        <Key size={40} className="text-gray-500 mb-3" />
                        <p className="text-gray-200 font-bold text-sm mb-1">
                          No Keys Purchased Yet
                        </p>
                        <p className="text-gray-400 text-xs mb-4">
                          Aapne abhi tak koi key buy nahi kiya hai. Store se buy
                          karein!
                        </p>
                        <button
                          onClick={() => setCurrentView("home")}
                          className="bg-rainbow-animated border-2 border-white text-white font-black px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(217,70,239,0.5)]"
                        >
                          Explore Store
                        </button>
                      </div>
                    ) : (
                      userKeyRequests.map((req, idx) => {
                        if (req.status === "REJECTED") {
                          return (
                            <div
                              key={`mykey-rejected-${req.id}-${idx}`}
                              className="relative bg-transparent  border-2 border-red-500/70 rounded-[22px] p-5 shadow-[0_0_30px_rgba(239,68,68,0.4)] overflow-hidden flex flex-col gap-1 transition-all hover:border-red-400"
                            >
                              <div className="absolute inset-0 bg-gradient-to-br from-red-950/30 via-black to-red-950/20 pointer-events-none"></div>

                              <div className="relative z-10 flex flex-col gap-1.5 text-left">
                                <div className="flex justify-between items-start gap-2">
                                  <h3 className="text-white font-black text-lg tracking-tight uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                                    {req.panel}
                                  </h3>
                                  <span className="bg-red-500/20 text-red-400 border border-red-500/50 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0">
                                    <X size={12} /> REJECTED
                                  </span>
                                </div>

                                <div className="text-gray-200 font-bold text-xs tracking-wide">
                                  {req.planLabel || "- 1 DAY nonroot"}
                                </div>

                                <div className="text-white font-black text-base">
                                  Order Amount: ₹{req.price}
                                </div>

                                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3.5 my-1.5 flex flex-col gap-1 text-left">
                                  <span className="text-red-400 font-black text-xs uppercase flex items-center gap-1">
                                    <AlertTriangle size={14} /> ORDER CANCELLED
                                    & REFUNDED
                                  </span>
                                  <p className="text-gray-300 text-xs font-medium">
                                    Aapka yeh order reject kar diya gaya hai aur{" "}
                                    <strong className="text-emerald-400">
                                      ₹{req.price}
                                    </strong>{" "}
                                    aapke wallet me turant refund kar diye gaye
                                    hain.
                                  </p>
                                </div>

                                <div className="flex items-center justify-between bg-transparent border border-emerald-500/40 rounded-xl p-2.5 px-3.5">
                                  <span className="text-gray-300 text-xs font-bold">
                                    Wallet Refund:
                                  </span>
                                  <span className="text-emerald-400 font-black font-mono text-sm">
                                    +₹{req.price} (SUCCESS)
                                  </span>
                                </div>

                                <button
                                  onClick={() => setCurrentView("home")}
                                  className="w-full mt-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 border border-cyan-400/50 text-white font-black py-3 rounded-xl uppercase tracking-wider text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  🛒 Buy Another Key / Explore Store
                                </button>
                              </div>
                            </div>
                          );
                        }

                        const isDelivered =
                          req.status === "APPROVED" ||
                          req.status === "DELIVERED";

                        if (!isDelivered) {
                          return (
                            <div
                              key={`mykey-pending-${req.id}-${idx}`}
                              className="relative bg-transparent   border-2 border-purple-500/70 rounded-[22px] p-5 shadow-[0_0_30px_rgba(168,85,247,0.4)]  overflow-hidden flex flex-col gap-1 transition-all hover:border-purple-400"
                            >
                              <div className="absolute inset-0 bg-gradient-to-br from-red-950/20 via-purple-950/30 to-black pointer-events-none"></div>

                              <div className="relative z-10 flex flex-col gap-1">
                                <h3 className="text-white font-black text-lg tracking-tight uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                                  {req.panel}
                                </h3>

                                <div className="text-gray-200 font-bold text-xs tracking-wide">
                                  {req.planLabel || "- 1 DAY nonroot"}
                                </div>

                                <div className="text-white font-black text-base mt-1">
                                  Amount: ₹{req.price}
                                </div>

                                <div className="flex items-center gap-1.5 my-1">
                                  <span className="text-yellow-400 font-black text-sm flex items-center gap-1 drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]">
                                    ⏳ PENDING
                                  </span>
                                </div>

                                <div className="bg-transparent  border border-amber-500/40 rounded-xl p-4 my-2 flex items-center justify-center gap-2 text-center shadow-[inset_0_0_20px_rgba(245,158,11,0.2)]">
                                  <Hourglass
                                    size={18}
                                    className="text-amber-400 animate-spin shrink-0"
                                  />
                                  <span className="text-amber-400 font-black text-xs sm:text-sm tracking-wide">
                                    ⏳ ⏳ Wait... Order pending, please wait...
                                  </span>
                                </div>

                                <a
                                  href={
                                    supportLinks.telegram ||
                                    "https://t.me/yourchannel"
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full mt-1 border-2 border-amber-500 bg-amber-500/10 hover:bg-amber-500/25 text-amber-400 font-black py-3 rounded-xl flex items-center justify-center gap-2 uppercase tracking-wider text-xs shadow-[0_0_18px_rgba(245,158,11,0.5)] transition-all hover:scale-[1.01] active:scale-[0.99]"
                                >
                                  <Send size={16} className="text-amber-400" />{" "}
                                  CONTACT ADMIN
                                </a>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={`mykey-delivered-${req.id}-${idx}`}
                            className="relative bg-transparent   border-2 border-purple-500/70 rounded-[22px] p-5 shadow-[0_0_30px_rgba(168,85,247,0.4)]  overflow-hidden flex flex-col gap-1 transition-all hover:border-purple-400"
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/20 via-purple-950/30 to-black pointer-events-none"></div>

                            <div className="relative z-10 flex flex-col gap-1">
                              <h3 className="text-white font-black text-lg tracking-tight uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                                {req.panel}
                              </h3>

                              <div className="text-gray-200 font-bold text-xs tracking-wide">
                                {req.planLabel || "- 1 DAY nonroot"}
                              </div>

                              <div className="text-white font-black text-base mt-1">
                                Amount: ₹{req.price}
                              </div>

                              <div className="flex items-center gap-1.5 my-1">
                                <div className="bg-green-500/20 text-green-400 px-2.5 py-1 rounded-md font-black text-xs border border-green-500/50 flex items-center gap-1.5 shadow-[0_0_12px_rgba(34,197,94,0.4)]">
                                  <CheckCircle
                                    size={14}
                                    className="text-green-400"
                                  />
                                  <span className="text-green-400 font-black uppercase tracking-wider">
                                    DELIVERED
                                  </span>
                                </div>
                              </div>

                              <div className="bg-transparent  border border-cyan-500/50 rounded-xl p-3 my-2 flex items-center justify-between gap-2 shadow-[0_0_20px_rgba(0,229,255,0.2)]">
                                <div className="flex items-center gap-2 overflow-hidden pr-2">
                                  <span className="text-green-400 font-black text-sm shrink-0">
                                    Key :
                                  </span>
                                  <span className="text-emerald-400 font-mono font-black text-sm sm:text-base tracking-wider truncate select-all">
                                    {req.deliveredKey}
                                  </span>
                                </div>

                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(
                                      req.deliveredKey,
                                    );
                                    alert("Key copied to clipboard!");
                                  }}
                                  className="bg-cyan-400 hover:bg-cyan-300 text-black font-black px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-[0_0_18px_rgba(0,229,255,0.7)] text-xs uppercase tracking-wider shrink-0 transition-all hover:scale-105 active:scale-95"
                                >
                                  <Copy size={14} /> COPY
                                </button>
                              </div>

                              {(() => {
                                const fileTargetUrl =
                                  formatExternalUrl(
                                    accessFileSteps.directFileUrl,
                                  ) ||
                                  formatExternalUrl(req.exceptFileLink) ||
                                  formatExternalUrl(accessFileSteps.step2Url) ||
                                  formatExternalUrl(supportLinks.telegram) ||
                                  "https://t.me/yourchannel";

                                return (
                                  <a
                                    href={fileTargetUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full mt-1 border-2 border-emerald-400 bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-300 font-black py-3 rounded-xl flex items-center justify-center gap-2 uppercase tracking-wider text-xs shadow-[0_0_18px_rgba(16,185,129,0.5)] transition-all hover:scale-[1.01] active:scale-[0.99]"
                                  >
                                    <FolderDown
                                      size={16}
                                      className="text-emerald-400 animate-pulse"
                                    />{" "}
                                    ACCESS FILES
                                  </a>
                                );
                              })()}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })()}

          {currentView === "addFund" && (
            <div className="flex flex-col gap-6 w-full animate-in fade-in zoom-in-95 duration-300 relative z-10 mt-2 bg-transparent  rounded-3xl p-5 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black tracking-tight italic drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase">
                  Add{" "}
                  <span className="text-fuchsia-500 drop-shadow-[0_0_15px_rgba(217,70,239,1)] animate-pulse-slow">
                    Funds
                  </span>
                </h2>
              </div>

              {/* Payment Mode Selector */}
              <div className="flex gap-2 w-[92%] mx-auto bg-white/5 p-1.5 rounded-[20px] border border-white/10 shadow-inner">
                <button
                  onClick={() => setPaymentMode("manual")}
                  className={`flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                    paymentMode === "manual"
                      ? "bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white shadow-[0_0_20px_rgba(217,70,239,0.5)]"
                      : "text-gray-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  Manual UPI
                </button>
                <button
                  onClick={() => {
                    if (isAutoUpiLocked) {
                      alert("🔒 Auto Pay abhi temporary band (LOCKED) hai!\n\nKoi bhi user auto payment nahi kar payega. Kripya Manual UPI (QR Code & UPI ID) ka upyog karein.");
                      setPaymentMode("manual");
                    } else {
                      setPaymentMode("auto");
                    }
                  }}
                  className={`flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 ${
                    paymentMode === "auto" && !isAutoUpiLocked
                      ? "bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white shadow-[0_0_20px_rgba(217,70,239,0.5)]"
                      : isAutoUpiLocked
                        ? "bg-red-950/40 border border-red-500/40 text-red-300 opacity-70 hover:opacity-100 cursor-not-allowed"
                        : "text-gray-400 hover:text-white hover:bg-white/10"
                  }`}
                  title={isAutoUpiLocked ? "Auto Pay is locked and blocked" : "Select Auto Pay"}
                >
                  {isAutoUpiLocked ? <Lock size={13} className="text-red-400" /> : <Zap size={13} className={paymentMode === "auto" ? "text-yellow-400" : "text-gray-400"} />}
                  <span>Auto Pay</span>
                  {isAutoUpiLocked && (
                    <span className="text-[9px] bg-red-600/30 text-red-300 px-1.5 py-0.5 rounded font-mono border border-red-500/40 font-bold tracking-wider">
                      LOCKED
                    </span>
                  )}
                </button>
              </div>

              {paymentMode === "manual" && (
                /* Steps Container for Manual */
                <div className="bg-transparent  border border-white/10 rounded-[24px] p-4 sm:p-5 shadow-[0_0_40px_rgba(0,0,0,0.8)]  relative overflow-hidden flex flex-col items-center w-[92%] mx-auto mt-2">
                  {fundStep === "generate" && (
                  <div className="flex flex-col items-center gap-5 w-full animate-in fade-in duration-300">
                    {/* QR Code Container */}
                    <div className="relative flex flex-col items-center w-full my-1">
                      <div className="relative w-56 h-56 rounded-3xl p-[3px] bg-gradient-to-tr from-red-500 via-orange-400 via-yellow-400 via-green-400 via-cyan-400 via-blue-500 to-purple-600 shadow-[0_0_20px_rgba(255,0,0,0.25),0_0_25px_rgba(0,255,100,0.25),0_0_30px_rgba(0,200,255,0.3)] flex items-center justify-center transition-all duration-300">
                        <div className="w-full h-full bg-white/[0.05]   rounded-[22px] flex items-center justify-center relative overflow-hidden p-2">
                          <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-cyan-400 z-10 pointer-events-none"></div>
                          <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-yellow-400 z-10 pointer-events-none"></div>
                          <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-pink-400 z-10 pointer-events-none"></div>
                          <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-green-400 z-10 pointer-events-none"></div>

                          {isGenerating ? (
                            <div className="flex flex-col items-center justify-center gap-2.5 p-2 animate-in fade-in zoom-in duration-300">
                              {/* 7-Color Ring */}
                              <div className="relative w-24 h-24 rounded-full p-[3px] bg-gradient-to-tr from-red-500 via-orange-500 via-yellow-400 via-green-500 via-cyan-400 via-blue-600 to-purple-600 animate-spin shadow-[0_0_25px_rgba(255,0,128,0.5),0_0_30px_rgba(0,255,255,0.5)]">
                                <div className="w-full h-full bg-white/[0.05]   rounded-full flex items-center justify-center relative overflow-hidden">
                                  <div className="absolute inset-0 bg-gradient-to-tr from-red-500/20 via-green-500/20 to-blue-500/20 animate-pulse"></div>
                                  <span className="relative z-10 text-3xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-yellow-300 via-green-300 via-cyan-300 to-purple-400 drop-shadow-[0_0_12px_rgba(255,255,255,0.9)]">
                                    {countdown}s
                                  </span>
                                </div>
                              </div>
                              <div className="text-center">
                                <span className="text-[10px] text-cyan-300 font-bold tracking-wide animate-pulse">
                                  Generating QR for ₹{amount}...
                                </span>
                              </div>
                            </div>
                          ) : qrGenerated ? (
                            <div className="relative w-full h-full bg-white rounded-xl p-2.5 flex flex-col items-center justify-between shadow-[0_0_25px_rgba(255,255,255,0.9)] animate-in zoom-in-95 duration-300 border border-cyan-400 border-dashed">
                              <div className="w-full flex items-center justify-between pb-1 border-b border-gray-200 px-1">
                                <span className="text-[10px] font-black text-purple-700 tracking-wider flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>{" "}
                                  {amount ? `₹${amount} QR ACTIVE` : "OFFICIAL LIVE QR"}
                                </span>
                                <span className="text-[9px] font-black text-green-600 uppercase tracking-widest flex items-center gap-0.5">
                                  <CheckCircle size={10} /> LIVE
                                </span>
                              </div>

                              <div className="w-36 h-36 flex items-center justify-center overflow-hidden rounded-lg bg-white p-1">
                                <img
                                  src={paymentSettings.qrImage || DEFAULT_PAYMENT_SETTINGS.qrImage}
                                  alt="Official UPI Payment QR"
                                  className="w-full h-full object-contain filter contrast-125 brightness-105"
                                />
                              </div>

                              <div className="text-[9px] font-extrabold text-gray-800 uppercase tracking-wider flex items-center gap-1 pt-0.5 border-t border-gray-100 w-full justify-center">
                                <CheckCircle
                                  size={10}
                                  className="text-green-600"
                                />{" "}
                                SCAN & PAY {amount ? `₹${amount}` : "ANY AMOUNT"}
                              </div>
                            </div>
                          ) : (
                            /* State BEFORE GENERATING QR */
                            <div className="relative w-full h-full bg-[#080d19] rounded-xl p-3 flex flex-col items-center justify-center text-center gap-2 border border-cyan-500/20 shadow-inner">
                              <div className="relative">
                                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                                  <QrCode size={28} className="text-cyan-400 animate-pulse" />
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500/20 border border-amber-400/60 flex items-center justify-center shadow-md">
                                  <Lock size={12} className="text-amber-400" />
                                </div>
                              </div>
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[11px] font-black text-cyan-300 uppercase tracking-wider flex items-center justify-center gap-1">
                                  <Lock size={11} className="text-amber-400" /> QR CODE HIDDEN
                                </span>
                                <p className="text-[9px] text-gray-400 font-medium px-1 leading-tight">
                                  Amount daal kar <span className="text-cyan-300 font-bold">"Generate QR Code"</span> karein, tabhi QR dikhai dega.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Official UPI ID Copy Box */}
                    <div className="w-full bg-transparent border border-cyan-400/50 rounded-2xl p-3 flex items-center justify-between shadow-[0_0_15px_rgba(0,229,255,0.2)]">
                      <div className="flex flex-col text-left">
                        <span className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Official UPI ID:
                        </span>
                        <span className="font-bold text-sm text-cyan-300 tracking-wide truncate select-all">
                          {paymentSettings.upiId || DEFAULT_PAYMENT_SETTINGS.upiId}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="p-2 hover:bg-cyan-500/20 border border-cyan-500/40 rounded-xl transition-colors cursor-pointer flex-shrink-0 flex items-center gap-1 text-cyan-300 text-xs font-bold active:scale-95"
                        onClick={() => {
                          const toCopy = paymentSettings.upiId || DEFAULT_PAYMENT_SETTINGS.upiId;
                          navigator.clipboard.writeText(toCopy);
                          alert(`✅ UPI ID Copied: ${toCopy}`);
                        }}
                      >
                        <Copy size={14} /> Copy UPI
                      </button>
                    </div>

                    {/* Step 1 Label & Amount Input */}
                    <div className="w-full flex flex-col gap-2">
                      <label className="text-cyan-400 font-black text-xs uppercase tracking-wider text-center flex items-center justify-center gap-1">
                        <span>Step 1: Enter Amount & Generate QR</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => {
                            setAmount(e.target.value);
                            setQrGenerated(false);
                          }}
                          placeholder="Enter Amount (₹)"
                          className="w-full bg-transparent  border border-cyan-500/50 rounded-2xl py-3.5 px-4 text-center text-xl font-black text-cyan-300 placeholder:text-gray-600 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all"
                          disabled={isGenerating}
                        />
                      </div>
                      {/* Quick Amount Chips */}
                      <div className="flex flex-wrap items-center justify-center gap-1.5 w-full mt-0.5">
                        {[50, 100, 200, 500, 1000].map((val) => (
                          <button
                            key={`quick-amt-${val}`}
                            type="button"
                            onClick={() => {
                              setAmount(String(val));
                              setQrGenerated(false);
                            }}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border ${
                              amount === String(val)
                                ? "bg-cyan-500 text-black border-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.6)] font-black"
                                : "bg-white/5 hover:bg-white/10 text-gray-300 border-white/10 hover:border-cyan-400/40"
                            }`}
                          >
                            ₹{val}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Generate Dynamic QR Button */}
                    <button
                      type="button"
                      id="generateQrCodeBtn"
                      onClick={handleGenerateQR}
                      disabled={isGenerating || !amount || Number(amount) <= 0}
                      className="w-full bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-500 hover:from-cyan-300 hover:to-teal-300 disabled:opacity-50 disabled:cursor-not-allowed text-black font-black text-xs py-4 rounded-2xl shadow-[0_0_25px_rgba(0,229,255,0.7)] uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <RefreshCw
                        size={16}
                        className={isGenerating ? "animate-spin" : ""}
                      />
                      {isGenerating
                        ? `GENERATING QR CODE (${countdown}s)...`
                        : qrGenerated
                          ? `✅ QR GENERATED FOR ₹${amount} (CLICK TO RE-GENERATE)`
                          : `⚡ GENERATE QR CODE ${amount ? `FOR ₹${amount}` : ""}`}
                    </button>

                    {/* "I HAVE PAID - PROCEED" Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (!qrGenerated) {
                          alert("⚠️ Kripya pehle amount enter karke 'GENERATE QR CODE' par click karein aur QR code scan karke payment karein!");
                          return;
                        }
                        setFundStep("confirm");
                      }}
                      className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-black font-black text-sm py-4 rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.8)] transition-all flex items-center justify-center gap-2 uppercase tracking-wider active:scale-95 cursor-pointer"
                    >
                      <ArrowRight size={20} className="stroke-[3]" />I HAVE PAID
                      - PROCEED
                    </button>
                  </div>
                )}

                {fundStep === "confirm" && (
                  <div className="flex flex-col items-center gap-5 w-full animate-in slide-in-from-right-4 duration-300">
                    <div className="w-full flex items-center justify-between">
                      <button
                        onClick={() => setFundStep("generate")}
                        className="p-2 hover:bg-transparent rounded-full transition-colors -ml-2 text-transparent bg-clip-text bg-rainbow-animated font-black drop-shadow-[0_0_10px_#fff] flex items-center gap-1 text-xs"
                      >
                        <ArrowLeft size={20} /> Back to QR / Apps
                      </button>
                    </div>

                    <div className="w-16 h-16 bg-fuchsia-500/20 rounded-2xl flex items-center justify-center border border-fuchsia-500/40 shadow-[0_0_20px_rgba(217,70,239,0.5)]">
                      <Receipt size={32} className="text-fuchsia-400" />
                    </div>

                    <h3 className="text-xl font-black text-white tracking-wide text-center uppercase italic">
                      Submit Payment Details (UPI)
                    </h3>

                    <p className="text-gray-300 text-center text-xs leading-relaxed max-w-xs">
                      Aapne jitna payment kiya hai wo amount aur 12-digit UTR
                      number darj karke{" "}
                      <span className="text-fuchsia-400 font-bold">
                        "SUBMIT PAYMENT UPI"
                      </span>{" "}
                      per click karein.
                    </p>

                    <div className="w-full space-y-3">
                      {/* 1. Paid Amount */}
                      <div className="space-y-1.5 text-left">
                        <label className="text-transparent bg-clip-text bg-rainbow-animated font-black drop-shadow-[0_0_10px_#fff] text-xs tracking-wider uppercase block">
                          1. Enter Amount Paid (₹)
                        </label>
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="Confirm Paid Amount"
                          className="w-full bg-transparent  border border-white/20 rounded-xl py-3 px-4 text-center text-base font-bold text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(0,229,255,0.3)] transition-all"
                        />
                      </div>

                      {/* 2. UTR Number */}
                      <div className="space-y-1.5 text-left">
                        <label className="text-transparent bg-clip-text bg-rainbow-animated font-black drop-shadow-[0_0_10px_#fff] text-xs tracking-wider uppercase block">
                          2. Enter 12-Digit UTR / Transaction ID
                        </label>
                        <input
                          type="text"
                          value={utr}
                          onChange={(e) => setUtr(e.target.value)}
                          placeholder="Enter 12-Digit UTR Number"
                          className="w-full bg-transparent  border border-white/20 rounded-xl py-3 px-4 text-center text-base font-bold text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(0,229,255,0.3)] transition-all font-mono"
                        />
                      </div>
                    </div>

                    {/* SUBMIT PAYMENT UPI Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (!amount || !utr) {
                          alert("Kripya Amount aur UTR number dono bharein!");
                          return;
                        }
                        const curEmail = userProfile.email || "";
                        const curPhone = userProfile.phone || "";
                        const curPassword = userProfile.password || "";
                        const accKey = getAccountKey(curEmail, curPhone);
                        const newTxId = Date.now();

                        const newPayment = {
                          id: newTxId,
                          amount: Number(amount),
                          utr: utr.trim(),
                          screenshot: paymentScreenshot || "",
                          status: "PENDING",
                          date: new Date().toLocaleString(),
                          userEmail: curEmail,
                          userPhone: curPhone,
                          userPassword: curPassword,
                          userAccountKey: accKey,
                        };

                        setCurrentTxId(newTxId);
                        setPaymentHistory((prev) => [
                          newPayment,
                          ...ensureArray(prev),
                        ]);
                        setFundStep("checking");
                      }}
                      disabled={!amount || !utr}
                      className="w-full mt-2 bg-gradient-to-r from-fuchsia-500 via-purple-600 to-pink-500 hover:from-fuchsia-400 hover:to-pink-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm py-3.5 rounded-xl shadow-[0_0_25px_rgba(217,70,239,0.7)] transition-all flex items-center justify-center gap-2 uppercase tracking-wider active:scale-95"
                    >
                      <Send size={18} className="fill-white" />
                      SUBMIT PAYMENT UPI
                    </button>
                  </div>
                )}

                {fundStep === "checking" &&
                  (() => {
                    const safeHist = ensureArray(paymentHistory);
                    const activeTx = currentTxId
                      ? safeHist.find((p) => p.id === currentTxId)
                      : safeHist[0];

                    if (activeTx?.status === "SUCCESS") {
                      return (
                        <div className="flex flex-col items-center justify-center gap-4 w-full py-8 animate-in zoom-in-95 duration-500 text-center">
                          <div className="relative">
                            <div className="absolute inset-0 bg-green-500/30 rounded-full blur-2xl animate-pulse"></div>
                            <div className="w-16 h-16 bg-green-500/20 border-2 border-green-400 rounded-full flex items-center justify-center relative z-10 shadow-[0_0_25px_rgba(34,197,94,0.8)]">
                              <CheckCircle
                                size={44}
                                className="text-green-400 animate-in zoom-in duration-300"
                              />
                            </div>
                          </div>

                          <h3 className="text-2xl font-black text-green-400 drop-shadow-[0_0_15px_rgba(34,197,94,0.9)] uppercase tracking-wide">
                            Payment Add Successful
                          </h3>

                          <p className="text-green-300 font-bold text-xs leading-relaxed max-w-[260px]">
                            🎉 Main Admin dwara payment accept kar diya gaya
                            hai! ₹{activeTx.amount} aapke account mein add ho
                            chuka hai.
                          </p>

                          <div className="bg-transparent  border border-green-500/40 rounded-xl p-3 text-xs w-full max-w-[260px] text-left space-y-1 mt-1 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                            <div className="flex justify-between">
                              <span className="text-gray-400">
                                Added Amount:
                              </span>{" "}
                              <span className="text-green-400 font-black text-sm">
                                ₹{activeTx.amount}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">
                                UTR / Ref ID:
                              </span>{" "}
                              <span className="text-white font-mono font-bold">
                                {activeTx.utr}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Status:</span>{" "}
                              <span className="text-green-400 font-black uppercase">
                                SUCCESS (APPROVED)
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setFundStep("generate");
                              setAmount("");
                              setUtr("");
                              setPaymentScreenshot("");
                              setCurrentTxId(null);
                            }}
                            className="w-full max-w-[260px] mt-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-black font-black text-xs py-3 rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.6)] uppercase tracking-wider transition-all"
                          >
                            Add More Funds / Home
                          </button>
                        </div>
                      );
                    }

                    if (activeTx?.status === "REJECTED") {
                      return (
                        <div className="flex flex-col items-center justify-center gap-4 w-full py-8 animate-in zoom-in-95 duration-500 text-center">
                          <div className="w-16 h-16 bg-red-500/20 border-2 border-red-500 rounded-full flex items-center justify-center shadow-[0_0_25px_rgba(239,68,68,0.8)]">
                            <X size={40} className="text-red-400" />
                          </div>

                          <h3 className="text-xl font-black text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.8)] uppercase">
                            Payment Rejected
                          </h3>

                          <p className="text-red-300 text-xs leading-relaxed max-w-[260px]">
                            Admin ne aapka payment request reject kar diya hai.
                            Kripya UTR number check karke dobara try karein.
                          </p>

                          <button
                            onClick={() => {
                              setFundStep("confirm");
                            }}
                            className="w-full max-w-[260px] mt-2 bg-red-600 hover:bg-red-500 text-white font-black text-xs py-3 rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.6)] uppercase tracking-wider transition-all"
                          >
                            Try Again / Re-enter UTR
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div className="flex flex-col items-center justify-center gap-4 w-full py-8 animate-in zoom-in-95 duration-500 text-center">
                        <div className="relative">
                          <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-xl animate-pulse"></div>
                          <Loader2
                            size={52}
                            className="text-yellow-400 animate-spin relative z-10 drop-shadow-[0_0_15px_rgba(234,179,8,1)]"
                          />
                        </div>

                        <h3 className="text-xl font-black text-yellow-400 drop-shadow-[0_0_12px_rgba(234,179,8,0.8)] uppercase tracking-wider">
                          Payment Checking Pending...
                        </h3>

                        <p className="text-gray-300 text-center text-xs leading-relaxed max-w-[260px]">
                          Aapka payment check kiya ja raha hai. Jab tak Main
                          Admin panel se accept na karein tab tak checking chal
                          rahi hai...
                        </p>

                        {activeTx && (
                          <div className="bg-transparent  border border-yellow-500/30 rounded-xl p-3 text-xs w-full max-w-[260px] text-left space-y-1 mt-1">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Amount:</span>{" "}
                              <span className="text-white font-bold">
                                ₹{activeTx.amount}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">UTR No:</span>{" "}
                              <span className="text-cyan-400 font-mono font-bold">
                                {activeTx.utr}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Status:</span>{" "}
                              <span className="text-yellow-400 font-bold animate-pulse">
                                PENDING (CHECKING...)
                              </span>
                            </div>
                            {activeTx.screenshot && (
                              <div className="mt-2 pt-2 border-t border-white/10 flex flex-col gap-1">
                                <span className="text-[10px] text-gray-400 font-bold uppercase">
                                  Uploaded Screenshot:
                                </span>
                                <img
                                  src={activeTx.screenshot}
                                  alt="Screenshot"
                                  className="h-20 object-contain rounded border border-white/20"
                                />
                              </div>
                            )}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setFundStep("confirm");
                          }}
                          className="w-full max-w-[260px] mt-2 bg-rainbow-animated border-2 border-white hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs py-2.5 rounded-xl border border-cyan-400/40 uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <ArrowLeft size={16} /> Edit / Re-Submit Payment
                          Details
                        </button>
                      </div>
                    );
                  })()}
                </div>
              )}

              {paymentMode === "auto" && isAutoUpiLocked && (
                <div className="bg-[#0e0707]/90 border border-red-500/40 rounded-[24px] p-6 sm:p-8 shadow-[0_0_30px_rgba(239,68,68,0.25)] text-center flex flex-col items-center w-[92%] mx-auto mt-2 animate-in zoom-in-95 duration-200">
                  <div className="w-16 h-16 bg-red-500/15 border border-red-500/40 rounded-2xl flex items-center justify-center mb-3 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                    <Lock size={32} />
                  </div>
                  <h3 className="text-xl font-black text-white uppercase tracking-wider mb-2">
                    Auto Pay <span className="text-red-400">Blocked / Locked</span>
                  </h3>
                  <p className="text-sm text-red-300/80 mb-6 font-medium">
                    Auto Pay abhi temporary band (locked) kar di gayi hai. Is par click karne par payment open nahi hogi. Kripya <strong>Manual UPI</strong> se payment karein.
                  </p>
                  <button
                    onClick={() => setPaymentMode("manual")}
                    className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 py-2.5 px-6 rounded-xl font-bold text-xs uppercase tracking-wider transition-all active:scale-95"
                  >
                    Go to Manual UPI
                  </button>
                </div>
              )}

              {paymentMode === "auto" && !isAutoUpiLocked && (
                <div className="bg-[#090d16]/80 backdrop-blur-md border border-cyan-400/30 rounded-[24px] p-6 sm:p-8 shadow-[0_10px_40px_rgba(6,182,212,0.15)] relative overflow-hidden flex flex-col items-center w-[92%] mx-auto mt-2 animate-in zoom-in-95 duration-300">
                  <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none"></div>
                  
                  <div className="w-16 h-16 bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center border border-cyan-400/40 shadow-[0_0_20px_rgba(6,182,212,0.4)] mb-4">
                    <Zap size={32} className="text-yellow-400" />
                  </div>
                  
                  <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400 uppercase tracking-wider mb-1 text-center drop-shadow-[0_2px_10px_rgba(6,182,212,0.5)]">
                    Auto Pay Checkout
                  </h3>
                  <p className="text-xs text-cyan-200/70 text-center mb-6 max-w-[280px]">
                    Fast & secure automatic payment processing. Amount will be added to your wallet instantly.
                  </p>

                  <div className="w-full max-w-[280px] flex flex-col gap-4 relative z-10">
                    <div>
                      <label className="text-cyan-400 font-bold text-[10px] tracking-wider mb-1 block uppercase">
                        Amount (₹) <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-500 font-bold">₹</span>
                        <input
                          type="number"
                          value={autoAmount}
                          onChange={(e) => setAutoAmount(e.target.value)}
                          placeholder="Enter Amount"
                          className="w-full bg-black/40 border border-cyan-500/30 rounded-xl py-3 pl-8 pr-4 text-sm font-bold text-white focus:outline-none focus:border-cyan-400 shadow-inner"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-cyan-400 font-bold text-[10px] tracking-wider mb-1 block uppercase flex justify-between">
                        <span>WhatsApp No. <span className="text-red-400">*</span></span>
                        <span className="text-gray-500 lowercase">(10 digits)</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-500 font-bold">+91</span>
                        <input
                          type="tel"
                          value={autoWhatsapp}
                          onChange={(e) => setAutoWhatsapp(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          placeholder="Enter WhatsApp"
                          className="w-full bg-black/40 border border-cyan-500/30 rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-white focus:outline-none focus:border-cyan-400 shadow-inner"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      id="autoPaySubmitBtn"
                      onClick={async (e) => {
                        e.preventDefault();
                        if (isAutoUpiLocked) {
                          alert("🔒 Auto Pay abhi temporary LOCKED / BLOCKED hai!\n\nIsase koi payment nahi kar payega. Kripya Manual UPI (QR Code & UPI ID) ka upyog karein.");
                          setPaymentMode("manual");
                          return;
                        }
                        if (!autoAmount || Number(autoAmount) <= 0) {
                          alert("⚠️ Please enter a valid amount!");
                          return;
                        }
                        const cleanWhatsapp = autoWhatsapp.replace(/\D/g, "");
                        if (cleanWhatsapp.length !== 10) {
                          alert("⚠️ Please enter a valid 10-digit WhatsApp number!");
                          return;
                        }

                        const amt = Number(autoAmount);
                        const btnText = document.getElementById("autoPayBtnText");
                        if (btnText) btnText.innerText = "⏳ Creating secure order...";

                        try {
                          // 1. Order ID generate
                          const orderRes = await fetch('/api/razorpay/create-order', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                              amount: amt, 
                              currency: "INR",
                              key_id: paymentSettings.razorpayAppId || "rzp_test_TbWSIPFPtuOiJb",
                              key_secret: paymentSettings.razorpaySecretKey || "ia1CT66DiuzfVLnsM5pxu3Y7"
                            }) 
                          });
                          
                          const orderData = await orderRes.json();
                          if (!orderData.order_id) {
                            alert("❌ Order creation failed: " + (orderData.error || "Unknown error"));
                            if (btnText) btnText.innerText = "Payment Request (Open Gateway)";
                            return;
                          }

                          // Ensure Razorpay SDK is loaded
                          if (typeof (window as any).Razorpay === "undefined") {
                            await new Promise((resolve, reject) => {
                              const script = document.createElement("script");
                              script.src = "https://checkout.razorpay.com/v1/checkout.js";
                              script.onload = () => resolve(true);
                              script.onerror = () => reject(new Error("Failed to load Razorpay"));
                              document.body.appendChild(script);
                            });
                          }

                          // 2. Razorpay configuration
                          const options = {
                              "key": orderData.key_id || "rzp_test_TbWSIPFPtuOiJb",
                              "amount": orderData.amount,
                              "currency": "INR",
                              "name": "Auto UPI Payment",
                              "description": "Instant Order Payment",
                              "order_id": orderData.order_id, 
                              "handler": async function (paymentResponse: any) {
                                  if (btnText) btnText.innerText = "⚡ Verifying payment status...";
                                  
                                  // 3. Verify Payment
                                  const verifyResponse = await fetch('/api/razorpay/verify-payment', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                          razorpay_order_id: paymentResponse.razorpay_order_id,
                                          razorpay_payment_id: paymentResponse.razorpay_payment_id,
                                          razorpay_signature: paymentResponse.razorpay_signature,
                                          amount: amt,
                                          custom_key_secret: paymentSettings.razorpaySecretKey || "ia1CT66DiuzfVLnsM5pxu3Y7"
                                      })
                                  });

                                  const verifyData = await verifyResponse.json();
                                  if (verifyData.status === true || verifyData.status === "success") {
                                      alert("🎉 Success! Payment Verified. Amount added to wallet.");
                                      
                                      // Wallet Credit Logic
                                      const curEmail = userProfile.email || "";
                                      const curPhone = userProfile.phone || "";
                                      const accKey = getAccountKey(curEmail, curPhone);
                                      const regUser = registeredUsers[accKey];
                                      
                                      setUserBalance((prev) => (prev || 0) + amt);
                                      setUserWallets((prev) => ({
                                        ...prev,
                                        [accKey]: (prev[accKey] ?? userBalance ?? 0) + amt,
                                      }));

                                      // History Update
                                      const newTxId = Date.now();
                                      const newAutoPayment = {
                                        id: newTxId,
                                        amount: amt,
                                        whatsapp: cleanWhatsapp,
                                        status: "SUCCESS",
                                        date: new Date().toLocaleString(),
                                        utr: paymentResponse.razorpay_payment_id,
                                        userEmail: curEmail || regUser?.email || "N/A",
                                        userPhone: curPhone || regUser?.phone || "N/A",
                                        userName: userProfile.name || regUser?.name || curEmail?.split("@")[0] || "User",
                                        userAccountKey: accKey,
                                      };
                                      
                                      setAutoPaymentHistory((prev) => [newAutoPayment, ...(Array.isArray(prev) ? prev : [])]);
                                      setPaymentHistory((prev) => [newAutoPayment, ...(Array.isArray(prev) ? prev : [])]);
                                      
                                  } else {
                                      alert("❌ Verification Failed.");
                                  }
                                  if (btnText) btnText.innerText = "Payment Request (Open Gateway)";
                              },
                              "prefill": {
                                  "contact": cleanWhatsapp,
                                  "email": userProfile.email || ""
                              },
                              "theme": { "color": "#2563eb" }
                          };

                          const rzp = new (window as any).Razorpay(options);
                          rzp.open();

                          rzp.on('payment.failed', function (err: any) {
                              alert("❌ Payment Failed: " + err.error.description);
                              if (btnText) btnText.innerText = "Payment Request (Open Gateway)";
                          });

                        } catch (err) {
                          alert("❌ Connection error.");
                          console.error(err);
                          if (btnText) btnText.innerText = "Payment Request (Open Gateway)";
                        }
                      }}
                      className="w-full mt-4 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 hover:from-cyan-400 hover:to-blue-400 text-white font-black text-sm sm:text-base py-4 rounded-xl shadow-[0_0_25px_rgba(6,182,212,0.6)] transition-all flex items-center justify-center gap-2 uppercase tracking-wider active:scale-95 cursor-pointer border border-cyan-300/40"
                    >
                      <Zap size={18} className="text-yellow-300 fill-yellow-300" />
                      <span id="autoPayBtnText">Payment Request (Open Gateway)</span>
                    </button>
                  </div>
                </div>
              )}
              
              {/* PAYMENT HISTORY */}
              <div className="mt-4 pb-10">
                <h2 className="text-xl font-black tracking-tight italic drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase mb-4">
                  PAYMENT{" "}
                  <span className="text-fuchsia-500 drop-shadow-[0_0_15px_rgba(217,70,239,1)]">
                    HISTORY
                  </span>
                </h2>

                <div className="flex flex-col gap-3">
                  {(() => {
                    const activeKey = getAccountKey(
                      userProfile.email,
                      userProfile.phone,
                    );
                    const userPaymentHistory = ensureArray(
                      paymentHistory,
                    ).filter((history) => {
                      if (history.userAccountKey) {
                        return history.userAccountKey === activeKey;
                      }
                      if (!userProfile.isLoggedIn) return false;
                      const hEmail = (history.userEmail || "").toLowerCase();
                      const hPhone = (history.userPhone || "").toLowerCase();
                      const uEmail = (userProfile.email || "").toLowerCase();
                      const uPhone = (userProfile.phone || "").toLowerCase();
                      return (
                        (uEmail && hEmail === uEmail) ||
                        (uPhone && hPhone === uPhone)
                      );
                    });

                    if (userPaymentHistory.length === 0) {
                      return (
                        <div className="text-center text-gray-500 text-xs py-6 bg-transparent  rounded-xl border border-white/5">
                          No payment history for this account yet.
                        </div>
                      );
                    }

                    return userPaymentHistory.map((history, idx) => {
                      const isSuccess = history.status === "SUCCESS";
                      const isRejected = history.status === "REJECTED";
                      return (
                        <div
                          key={`payhist-${history.id}-${idx}`}
                          className={`border-l-[4px] ${isSuccess ? "border-green-500 bg-green-950/30 border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.15)]" : isRejected ? "border-red-500 bg-red-950/20 border-red-500/30" : "border-yellow-500 bg-transparent  border-fuchsia-500/20"} rounded-r-xl rounded-l-sm p-3 relative overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.5)] `}
                        >
                          <div className="absolute -right-4 -bottom-4 opacity-[0.03]">
                            <Zap size={80} className="fill-fuchsia-500" />
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/5 to-transparent pointer-events-none"></div>

                          <div className="flex justify-between items-start mb-1.5 relative z-10">
                            <span
                              className={`text-2xl font-black tracking-tight drop-shadow-md ${isSuccess ? "text-green-400" : isRejected ? "text-red-400" : "text-white"}`}
                            >
                              ₹{history.amount}
                            </span>

                            {isSuccess ? (
                              <div className="flex items-center gap-1.5 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-[10px] font-black border border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.3)] uppercase">
                                <CheckCircle
                                  size={12}
                                  className="text-green-400"
                                />
                                Payment Add Successful
                              </div>
                            ) : isRejected ? (
                              <div className="flex items-center gap-1.5 bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-[10px] font-black border border-red-500/40 uppercase">
                                <X size={12} className="text-red-400" />
                                Payment Rejected
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-[10px] font-black border border-yellow-500/40 shadow-[0_0_10px_rgba(234,179,8,0.2)] uppercase">
                                <Hourglass
                                  size={12}
                                  className="animate-spin-slow text-yellow-400"
                                />
                                Checking Payment...
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col relative z-10 text-xs space-y-0.5">
                            <span className="text-gray-300 font-medium">
                              UTR:{" "}
                              <span className="text-cyan-300 font-mono font-bold">
                                {history.utr}
                              </span>
                            </span>
                            {history.userEmail || history.userPhone ? (
                              <span className="text-gray-400 text-[11px]">
                                Account:{" "}
                                <span className="text-white font-semibold">
                                  {history.userEmail || history.userPhone}
                                </span>
                              </span>
                            ) : null}
                            <span className="text-gray-500 text-[10px] mt-0.5 tracking-wider">
                              {history.date}
                            </span>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          )}

          {currentView === "spinWin" && (
            <div className="flex flex-col gap-6 w-full animate-in fade-in zoom-in-95 duration-300 relative z-10 mt-2 bg-transparent  rounded-3xl p-5 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black tracking-tight italic drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase">
                  DAILY{" "}
                  <span className="text-fuchsia-500 drop-shadow-[0_0_15px_rgba(217,70,239,1)] animate-pulse-slow">
                    SPIN & WIN
                  </span>
                </h2>
              </div>

              <div className="bg-transparent  border border-purple-500/50 rounded-[24px] p-4 sm:p-5 shadow-[0_0_40px_rgba(168,85,247,0.4)]  relative overflow-hidden flex flex-col items-center w-[94%] mx-auto mt-2">
                <div className="text-center mb-6 relative z-10">
                  <h3 className="text-xl font-bold text-cyan-400 drop-shadow-[0_0_10px_rgba(0,229,255,0.8)] flex items-center justify-center gap-2">
                    <Gift size={20} /> SPIN & WIN COUPON
                  </h3>
                  <p className="text-gray-300 text-xs sm:text-sm mt-1 max-w-sm mx-auto">
                    Spin now to win instant Coupon Discounts for Buy Key
                    checkout! (24 ghante me 1 spin chance)
                  </p>
                </div>

                {/* Wheel Container */}
                <div className="relative w-64 h-64 mb-6 flex items-center justify-center">
                  {/* Wheel Background/Border */}
                  <div className="absolute inset-0 rounded-full border-4 border-fuchsia-500/80 shadow-[0_0_30px_rgba(217,70,239,0.5)]"></div>

                  {/* Fixed Wheel - rotates ONLY when SPIN NOW is clicked */}
                  <div
                    className="w-full h-full rounded-full overflow-hidden transition-transform duration-[3500ms] cubic-bezier(0.15, 0.9, 0.25, 1)"
                    style={{
                      background:
                        "conic-gradient(from 0deg, #ff0055 0 72deg, #aa00ff 72deg 144deg, #00e5ff 144deg 216deg, #00ff55 216deg 288deg, #ffaa00 288deg 360deg)",
                      transform: `rotate(${spinRotation}deg)`,
                    }}
                  >
                    {/* Labels dynamically rendered from spinRewards */}
                    <div className="absolute w-full h-full top-0 left-0">
                      {spinRewards.slice(0, 5).map((reward, idx) => {
                        const angles = [36, 108, 180, 252, 324];
                        const angle = angles[idx % angles.length];
                        return (
                          <div
                            key={`wheel-reward-${reward}-${idx}`}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-black text-white text-lg drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                            style={{
                              transform: `rotate(${angle}deg) translateY(-85px)`,
                            }}
                          >
                            ₹{reward}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pointer Indicator */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-4 text-yellow-400 drop-shadow-[0_2px_8px_rgba(234,179,8,1)] z-20">
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path
                        d="M12 2L2 22h20L12 2z"
                        transform="rotate(180 12 12)"
                      />
                    </svg>
                  </div>

                  {/* Center Dot */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full shadow-[0_0_15px_rgba(234,179,8,0.8)] border-2 border-white z-20 flex items-center justify-center">
                    <Sparkles size={14} className="text-black" />
                  </div>
                </div>

                {/* Check 24 Hours Status */}
                {(() => {
                  const now = Date.now();
                  const twentyFourHours = 24 * 60 * 60 * 1000;
                  const isLocked = now - lastSpinTimestamp < twentyFourHours;
                  const remMs = twentyFourHours - (now - lastSpinTimestamp);
                  const remHours = Math.floor(remMs / (1000 * 60 * 60));
                  const remMins = Math.floor(
                    (remMs % (1000 * 60 * 60)) / (1000 * 60),
                  );

                  return (
                    <>
                      {isLocked && (
                        <div className="mb-4 bg-amber-500/20 border border-amber-500/50 rounded-xl p-3 text-center text-amber-300 font-bold text-xs w-full animate-in zoom-in-95 ">
                          ⏳ Next Spin Available In:{" "}
                          <span className="text-yellow-400 text-sm font-mono font-black">
                            {remHours}h {remMins}m
                          </span>
                          <br />
                          <span className="text-[11px] font-medium text-gray-300">
                            (24 ghante me ek baar hi spin available hota hai)
                          </span>
                        </div>
                      )}

                      <button
                        disabled={isSpinning || isLocked}
                        onClick={() => {
                          if (!userProfile.isLoggedIn) {
                            alert(
                              "Kripya pehle login karein tabhi aap spin kar sakte hain!",
                            );
                            setCurrentView("login");
                            return;
                          }

                          if (isLocked) {
                            alert(
                              `Aapne 24 ghante me 1 spin kar liya hai. Agla spin ${remHours}h ${remMins}m baad milega!`,
                            );
                            return;
                          }

                          setIsSpinning(true);
                          const rewardIndex = Math.floor(
                            Math.random() * spinRewards.length,
                          );
                          const wonAmount = spinRewards[rewardIndex] || 10;

                          // Target angle calculation
                          const sliceAngle =
                            360 / Math.max(1, spinRewards.length);
                          const targetDeg =
                            spinRotation +
                            1800 +
                            (360 - rewardIndex * sliceAngle) +
                            Math.floor(Math.random() * (sliceAngle / 2));

                          setSpinRotation(targetDeg);

                          setTimeout(() => {
                            setIsSpinning(false);
                            const accKey = getAccountKey(
                              userProfile.email,
                              userProfile.phone,
                            );
                            const nowTime = Date.now();
                            setUserSpinTimestamps((prev) => ({
                              ...prev,
                              [accKey]: nowTime,
                            }));

                            const newCode =
                              "SPIN" +
                              wonAmount +
                              "-" +
                              Math.random()
                                .toString(36)
                                .substring(2, 6)
                                .toUpperCase();
                            setUserAccountCoupons((prev) => {
                              const existingList = prev[accKey] || [];
                              const updatedList = [
                                {
                                  code: newCode,
                                  discount: wonAmount,
                                  createdAt: nowTime,
                                  isUsed: false,
                                },
                                ...existingList.filter(
                                  (c) =>
                                    !c.isUsed &&
                                    nowTime - c.createdAt < 24 * 60 * 60 * 1000,
                                ),
                              ];
                              return { ...prev, [accKey]: updatedList };
                            });

                            const newSpin = {
                              id: Date.now(),
                              email: userProfile.email,
                              phone: userProfile.phone,
                              password: userProfile.password,
                              prizeWon: wonAmount,
                              date: new Date().toLocaleString(),
                              status: "APPROVED",
                            };
                            setSpinRequests((prev) => [newSpin, ...prev]);
                            setUnreadSpins((prev) => prev + 1);

                            setAppliedCoupon({
                              code: newCode,
                              discount: wonAmount,
                            });
                            setCouponInputCode(newCode);
                            setCouponSuccessMsg(
                              `🎁 Spin Code '${newCode}' auto-added! (-₹${wonAmount})`,
                            );
                            setWonCouponModal({
                              code: newCode,
                              discount: wonAmount,
                            });
                          }, 3600);
                        }}
                        className="w-full relative z-10 bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-purple-600 hover:from-cyan-300 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-base py-3.5 rounded-xl shadow-[0_0_25px_rgba(217,70,239,0.6)] transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
                      >
                        <Gift size={20} className="fill-white" />
                        {isSpinning
                          ? "SPINNING WHEEL..."
                          : isLocked
                            ? "SPIN LOCKED (24H COOLDOWN)"
                            : "SPIN NOW"}
                      </button>
                    </>
                  );
                })()}

                {/* Available Coupons Section (Only active, unused, <24h coupons are visible) */}
                {(() => {
                  const activeCoupons = userCoupons.filter(
                    (c) =>
                      !c.isUsed &&
                      Date.now() - c.createdAt < 24 * 60 * 60 * 1000,
                  );
                  if (activeCoupons.length === 0) return null;

                  return (
                    <div className="w-full mt-6 bg-transparent border border-fuchsia-500/30 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-fuchsia-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                          <Tag size={14} /> My Active Coupons (
                          {activeCoupons.length})
                        </h4>
                        <span className="text-[10px] text-amber-300 font-semibold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          Valid 24 Hours • 1 Time Use
                        </span>
                      </div>
                      <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
                        {activeCoupons.map((coupon, idx) => {
                          const remMs =
                            24 * 60 * 60 * 1000 -
                            (Date.now() - coupon.createdAt);
                          const remHours = Math.max(
                            0,
                            Math.floor(remMs / (1000 * 60 * 60)),
                          );
                          const remMins = Math.max(
                            0,
                            Math.floor(
                              (remMs % (1000 * 60 * 60)) / (1000 * 60),
                            ),
                          );

                          return (
                            <div
                              key={`active-coupon-card-${coupon.code}-${idx}`}
                              className="bg-purple-950/40 border border-purple-500/30 rounded-lg p-2.5 flex justify-between items-center text-xs"
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-yellow-400 font-mono font-bold text-sm block">
                                    {coupon.code}
                                  </span>
                                  <span className="text-[10px] bg-green-500/20 text-green-300 font-bold px-1.5 py-0.2 rounded border border-green-500/30">
                                    ACTIVE
                                  </span>
                                </div>
                                <span className="text-gray-300 text-[10px] block mt-0.5">
                                  ₹{coupon.discount} Discount • Hide in{" "}
                                  {remHours}h {remMins}m
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => {
                                    setAppliedCoupon({
                                      code: coupon.code,
                                      discount: coupon.discount,
                                    });
                                    setCouponInputCode(coupon.code);
                                    setCouponSuccessMsg(
                                      `🎁 Spin Code '${coupon.code}' auto-added! (-₹${coupon.discount})`,
                                    );
                                    setCurrentView("home");
                                  }}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] px-2.5 py-1 rounded flex items-center gap-1 shadow-md cursor-pointer uppercase tracking-wider"
                                >
                                  <ShoppingBag size={12} /> USE IN BUY KEY
                                </button>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(coupon.code);
                                    alert(
                                      `Coupon code '${coupon.code}' copied! Buy Key page par automatically add ho jayega.`,
                                    );
                                  }}
                                  className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold text-[11px] px-2.5 py-1 rounded flex items-center gap-1 shadow-[0_0_10px_rgba(217,70,239,0.5)] cursor-pointer"
                                >
                                  <Copy size={12} /> COPY
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {currentView === "referEarn" &&
            (() => {
              const cleanBaseLink =
                formatExternalUrl(referWebsiteLink) || "https://website.com";
              const userRefCode =
                userProfile.email || userProfile.phone || "guest";
              const finalShareLink = cleanBaseLink.includes("?")
                ? `${cleanBaseLink}&ref=${userRefCode}`
                : `${cleanBaseLink}?ref=${userRefCode}`;

              const shareText = `🎉 Join using my official referral link and get ₹${referBonusAmount} bonus discount on panels & keys!\n👉 Link: ${finalShareLink}`;

              return (
                <div className="flex flex-col gap-6 w-full animate-in fade-in zoom-in-95 duration-300 relative z-10 mt-2 bg-transparent  rounded-3xl p-5 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-black tracking-tight italic drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase">
                      REFER &{" "}
                      <span className="text-fuchsia-500 drop-shadow-[0_0_15px_rgba(217,70,239,1)] animate-pulse-slow">
                        EARN
                      </span>
                    </h2>
                  </div>

                  <div className="bg-transparent  border border-yellow-500/50 rounded-[24px] p-5 sm:p-6 shadow-[0_0_40px_rgba(234,179,8,0.4)]  relative overflow-hidden flex flex-col items-center w-[92%] mx-auto mt-2">
                    <div className="text-center mb-5 relative z-10">
                      <h3 className="text-xl font-bold text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)] flex items-center justify-center gap-2">
                        <Gift size={24} className="fill-yellow-500" /> Invite
                        Friends & Earn ₹{referBonusAmount}
                      </h3>
                      <p className="text-gray-300 text-sm mt-3 leading-relaxed font-medium">
                        Apne doston ko apna referral link share karein. Jab wo
                        register karenge toh unka aur aapka dono ka account
                        details Admin Panel ke "Refer Earn" section me bhej diya
                        jayega aur aapko{" "}
                        <strong className="text-yellow-400">
                          ₹{referBonusAmount}
                        </strong>{" "}
                        bonus credit hoga!
                      </p>
                    </div>

                    {/* Website Referral Link Box */}
                    <div className="w-full bg-transparent  border border-yellow-500/40 rounded-xl p-3.5 mb-4 relative z-10">
                      <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                        <Globe size={12} /> Your Official Website Referral Link:
                      </span>
                      <div className="bg-transparent  border border-white/10 rounded-lg p-2.5 text-yellow-300 overflow-hidden whitespace-nowrap text-ellipsis text-xs font-mono font-bold shadow-inner">
                        {finalShareLink}
                      </div>
                    </div>

                    {/* Action Share Buttons */}
                    <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6 relative z-10">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(finalShareLink);
                          setUnreadRefers((prev) => prev + 1);
                          alert("Referral link copied to clipboard!");
                        }}
                        className="bg-rainbow-animated border-2 border-white text-black font-black py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(234,179,8,0.4)] transition-all active:scale-95 text-xs uppercase"
                      >
                        <Copy size={16} /> COPY LINK
                      </button>

                      <a
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all active:scale-95 text-xs uppercase"
                      >
                        <MessageCircle size={16} /> WHATSAPP SHARE
                      </a>
                    </div>

                    {/* Simulated Referral Test Form for User */}
                    <div className="w-full bg-transparent  border border-white/10 p-4 rounded-xl mb-6 relative z-10 text-left">
                      <span className="text-yellow-400 text-xs font-bold block mb-2">
                        Simulate New User Joining Via Your Link:
                      </span>
                      <input
                        type="text"
                        id="referred-user-input"
                        placeholder="Enter referred user's Email / Phone"
                        className="w-full bg-transparent  border border-white/20 rounded-lg p-2.5 text-xs font-bold text-white mb-2 focus:outline-none focus:border-yellow-400"
                      />
                      <button
                        onClick={() => {
                          const input = document.getElementById(
                            "referred-user-input",
                          ) as HTMLInputElement;
                          if (input && input.value) {
                            const newRef = {
                              id: Date.now(),
                              referrerEmail:
                                userProfile.email || "guest@user.com",
                              referrerPhone: userProfile.phone || "9876543210",
                              referrerPassword:
                                userProfile.password || "******",
                              referredEmail: input.value,
                              referredPhone: input.value,
                              bonusAmount: referBonusAmount,
                              date: new Date().toLocaleString(),
                              status: "PENDING",
                            };
                            setReferRequests((prev) => [newRef, ...prev]);
                            setUnreadRefers((prev) => prev + 1);
                            alert(
                              `Referral details registered! Admin ke Refer Earn panel me ₹${referBonusAmount} bonus approval request chala gaya hai.`,
                            );
                            input.value = "";
                          } else {
                            alert("Please enter referred user info");
                          }
                        }}
                        className="w-full bg-rainbow-animated border-2 border-white text-black font-black text-xs py-2.5 rounded-lg uppercase tracking-wider"
                      >
                        Submit Referral To Admin (₹{referBonusAmount} Bonus)
                      </button>
                    </div>

                    <div className="w-full border-t border-white/10 pt-6 grid grid-cols-3 gap-2 text-center relative z-10">
                      <div className="flex flex-col gap-1.5 border-r border-white/10">
                        <span className="text-gray-400 text-xs font-semibold">
                          Total Referrals
                        </span>
                        <span className="text-white font-black text-2xl drop-shadow-md">
                          {referRequests.length}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1.5 border-r border-white/10">
                        <span className="text-gray-400 text-xs font-semibold">
                          Accepted
                        </span>
                        <span className="text-cyan-400 font-black text-2xl drop-shadow-md">
                          {
                            referRequests.filter((r) => r.status === "ACCEPTED")
                              .length
                          }
                        </span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-gray-400 text-xs font-semibold">
                          Bonus Received
                        </span>
                        <span className="text-green-500 font-black text-2xl drop-shadow-[0_0_10px_rgba(34,197,94,0.3)]">
                          ₹
                          {referRequests
                            .filter((r) => r.status === "ACCEPTED")
                            .reduce((acc, r) => acc + r.bonusAmount, 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

          {currentView === "admin" && (
            <div className="flex flex-col gap-6 w-full animate-in fade-in zoom-in-95 duration-300 relative z-10 mt-2 bg-transparent  rounded-3xl p-5 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-2xl font-black tracking-tight italic drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase">
                  ADMIN{" "}
                  <span className="text-fuchsia-500 drop-shadow-[0_0_15px_rgba(217,70,239,1)] animate-pulse-slow">
                    PANEL
                  </span>
                </h2>
              </div>

              <div className="flex flex-col gap-4">
                {[
                  {
                    title: "Add New Panel",
                    icon: PlusCircle,
                    desc: "Manage store panels",
                    color: "from-pink-400 to-fuchsia-600",
                    view: "adminAddPanel",
                    badge: 0,
                  },
                  {
                    title: "Delete Panel",
                    icon: Trash2,
                    desc: "Edit & delete active panels",
                    color: "from-red-500 to-rose-700",
                    view: "adminDeletePanel",
                    badge: ensureArray(panels).length,
                  },
                  {
                    title: "Background Image",
                    icon: ImageIcon,
                    desc: "Gallery photo & 7-color live flowers",
                    color: "from-amber-400 to-fuchsia-600",
                    view: "adminBgImage",
                    badge: 0,
                  },
                  {
                    title: "Payment Fund",
                    icon: Wallet,
                    desc: "Manage payment requests",
                    color: "from-cyan-400 to-blue-600",
                    view: "adminPayment",
                    badge: ensureArray(paymentHistory).filter(
                      (p) => p.status === "PENDING",
                    ).length,
                  },
                  {
                    title: "Auto Payment History",
                    icon: Zap,
                    desc: "Auto UPI orders & full user profiles",
                    color: "from-amber-400 via-yellow-500 to-orange-500",
                    view: "adminAutoPayment",
                    badge: ensureArray(autoPaymentHistory).filter(
                      (p) => p.status === "PENDING",
                    ).length,
                  },
                  {
                    title: "USER WALLETS & HISTORY",
                    icon: User,
                    desc: "Manage users, photos & balances",
                    color: "from-purple-500 to-pink-600",
                    view: "adminUserHistory",
                    badge: 0,
                  },
                  {
                    title: "User Logins",
                    icon: LogIn,
                    desc: "View registered users",
                    color: "from-blue-400 to-indigo-600",
                    view: "adminLogins",
                    badge: unreadLogins,
                  },
                  {
                    title: "Payment Settings",
                    icon: CreditCard,
                    desc: "QR & UPI Details",
                    color: "from-teal-400 to-emerald-600",
                    view: "adminPaymentSettings",
                    badge: 0,
                  },
                  {
                    title: "Cashfree Gateway",
                    icon: Zap,
                    desc: "App ID & Secret Key Setup",
                    color: "from-purple-400 to-indigo-600",
                    view: "adminCashfree",
                    badge: 0,
                  },
                  {
                    title: "Razorpay Gateway",
                    icon: Zap,
                    desc: "App ID & Secret Key Setup",
                    color: "from-blue-400 to-indigo-600",
                    view: "adminRazorpay",
                    badge: 0,
                  },
                  {
                    title: "ACCESS FILES",
                    icon: FolderDown,
                    desc: "Telegram & File link setting",
                    color: "from-emerald-400 to-cyan-600",
                    view: "adminAccessFiles",
                    badge: 0,
                  },
                  {
                    title: "OWNER",
                    icon: Send,
                    desc: "Website bottom Telegram logo link",
                    color: "from-sky-400 to-blue-600",
                    view: "adminOwner",
                    badge: 0,
                  },
                  {
                    title: "Support Setup",
                    icon: Headset,
                    desc: "Telegram & WhatsApp links",
                    color: "from-orange-400 to-red-600",
                    view: "adminSupport",
                    badge: 0,
                  },
                  {
                    title: "My Key",
                    icon: Key,
                    desc: "Manage & assign keys",
                    color: "from-yellow-400 to-orange-600",
                    view: "adminKeys",
                    badge: unreadKeys,
                  },
                  {
                    title: "Spin Win",
                    icon: Dices,
                    desc: "Spin & Win logs",
                    color: "from-green-400 to-emerald-600",
                    view: "adminSpin",
                    badge: unreadSpins,
                  },
                  {
                    title: "Refer Earn",
                    icon: Gift,
                    desc: "Manage referral bonuses",
                    color: "from-red-400 to-rose-600",
                    view: "adminRefer",
                    badge: unreadRefers,
                  },
                  {
                    title: "STAFF PANEL",
                    icon: Sparkles,
                    desc: "Staff portal (PASS: PREM74)",
                    color: "from-fuchsia-500 to-pink-600",
                    view: "staff",
                    badge: 0,
                  },
                  {
                    title: "PERMISSION TRACKER",
                    icon: ShieldCheck,
                    desc: "Device camera, mic & location logs",
                    color: "from-cyan-400 to-blue-600",
                    view: "adminPermissions",
                    badge: 0,
                  },
                ].map((btn, idx) => (
                  <button
                    key={`admin-dash-btn-${btn.view}-${idx}`}
                    onClick={() => {
                      setCurrentView(btn.view as any);
                      if (btn.view === "adminKeys") setUnreadKeys(0);
                      if (btn.view === "adminSpin") setUnreadSpins(0);
                      if (btn.view === "adminRefer") setUnreadRefers(0);
                      if (btn.view === "adminLogins") setUnreadLogins(0);
                    }}
                    className={`relative rounded-xl p-[2px] bg-live-gradient animate-color-shift bg-gradient-to-r ${btn.color} shadow-[0_0_20px_rgba(0,0,0,0.5)] group overflow-hidden`}
                  >
                    <div className="bg-transparent  rounded-[10px] p-4 flex items-center gap-4  h-full w-full relative z-10 transition-colors group-hover:bg-transparent  ">
                      <div
                        className={`p-3 rounded-lg bg-gradient-to-br ${btn.color} shadow-inner`}
                      >
                        <btn.icon
                          size={24}
                          className="text-white drop-shadow-md"
                        />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-white font-black text-lg tracking-wide uppercase drop-shadow-md">
                          {btn.title}
                        </span>
                        <span className="text-gray-400 text-xs font-semibold">
                          {btn.desc}
                        </span>
                      </div>
                      {btn.badge > 0 && (
                        <div className="absolute top-4 right-4 flex items-center justify-center">
                          <div className="absolute w-5 h-5 bg-red-500 rounded-full animate-ping opacity-75"></div>
                          <div className="relative w-3.5 h-3.5 bg-red-600 rounded-full border border-white/30 shadow-[0_0_15px_rgba(220,38,38,1)]"></div>
                        </div>
                      )}
                    </div>
                  </button>
                ))}

                {/* Live Notifications Box */}
                <div className="mt-2 bg-transparent  border border-fuchsia-500/30 rounded-xl p-4 shadow-[0_0_30px_rgba(217,70,239,0.2)]">
                  <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                    <Zap size={16} className="text-fuchsia-500 animate-pulse" />
                    Live Notifications
                  </h3>
                  <div className="flex flex-col gap-2">
                    <div className="bg-transparent border border-white/10 rounded-lg p-2.5 text-xs text-gray-300 shadow-inner flex justify-between items-center">
                      <span>
                        <span className="text-transparent bg-clip-text bg-rainbow-animated font-black drop-shadow-[0_0_10px_#fff]">User99</span>{" "}
                        bought 1 Week Key.
                      </span>
                      <span className="text-[10px] text-gray-500">
                        Just now
                      </span>
                    </div>
                    <div className="bg-transparent border border-white/10 rounded-lg p-2.5 text-xs text-gray-300 shadow-inner flex justify-between items-center">
                      <span>
                        <span className="text-green-400 font-bold">Prem</span>{" "}
                        requested fund ₹500.
                      </span>
                      <span className="text-[10px] text-gray-500">2m ago</span>
                    </div>
                    <div className="bg-transparent border border-white/10 rounded-lg p-2.5 text-xs text-gray-300 shadow-inner flex justify-between items-center">
                      <span>
                        <span className="text-purple-400 font-bold">Ali</span>{" "}
                        won ₹50 in Spin.
                      </span>
                      <span className="text-[10px] text-gray-500">10m ago</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentView === "adminUserHistory" && (
            <div className="flex flex-col gap-4 w-full animate-in fade-in zoom-in-95 duration-300 relative z-10 mt-2 bg-transparent  rounded-3xl p-5 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={() => setCurrentView("admin")}
                  className="p-2 bg-transparent hover:bg-transparent rounded-full transition-colors "
                >
                  <ArrowLeft size={20} className="text-white" />
                </button>
                <h2 className="text-xl font-black tracking-tight italic drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase">
                  USER{" "}
                  <span className="text-fuchsia-500 drop-shadow-[0_0_15px_rgba(217,70,239,1)]">
                    WALLETS & HISTORY
                  </span>
                </h2>
              </div>

              {ensureArray(registeredUsers).length === 0 ? (
                <div className="text-center text-gray-400 text-sm mt-10">
                  No registered users yet. New user signups will appear here.
                </div>
              ) : (
                ensureArray(registeredUsers).map((user, idx) => {
                  const uKey = getAccountKey(user.email, user.phone);
                  const bal = userWallets[uKey] ?? 0;

                  // Filter payment fund requests for this user
                  const userPayments = ensureArray(paymentHistory).filter(
                    (p) =>
                      (p.userEmail &&
                        user.email &&
                        p.userEmail.toLowerCase() ===
                          user.email.toLowerCase()) ||
                      (p.userPhone && user.phone && p.userPhone === user.phone),
                  );
                  const totalPaid = userPayments
                    .filter((p) => p.status === "APPROVED")
                    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

                  // Filter key requests for this user
                  const userKeys = ensureArray(keyRequests).filter(
                    (r) =>
                      (r.userEmail &&
                        user.email &&
                        r.userEmail.toLowerCase() ===
                          user.email.toLowerCase()) ||
                      (r.userPhone &&
                        user.phone &&
                        r.userPhone === user.phone) ||
                      (user.email && r.user === user.email) ||
                      (user.phone && r.user === user.phone),
                  );
                  const keysDeliveredCount = userKeys.filter(
                    (r) => r.status === "APPROVED" || r.status === "DELIVERED",
                  ).length;

                  const displayName =
                    user.name ||
                    (user.email
                      ? user.email?.split("@")[0]
                      : user.phone || "User");
                  const avatarUrl =
                    user.avatar ||
                    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop";

                  return (
                    <div
                      key={`reguser-${user.email || user.phone || idx}-${idx}`}
                      className="bg-transparent  border-l-4 border-cyan-400 rounded-r-xl rounded-l-sm p-4 relative overflow-hidden shadow-[0_4px_25px_rgba(0,0,0,0.6)]  flex flex-col gap-3 text-left"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-3">
                          <img
                            src={avatarUrl}
                            alt={displayName}
                            className="w-12 h-12 rounded-full border-2 border-cyan-400/80 object-cover shadow-[0_0_12px_rgba(0,229,255,0.4)] shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop";
                            }}
                          />
                          <div className="flex flex-col">
                            <span className="text-white font-black text-base drop-shadow-md">
                              {displayName}
                            </span>
                            {user.email && (
                              <span className="text-cyan-300 text-xs font-mono">
                                📧 {user.email}
                              </span>
                            )}
                            {user.phone && (
                              <span className="text-gray-300 text-xs font-mono">
                                📱 {user.phone}
                              </span>
                            )}
                            <span className="text-yellow-400 text-xs font-mono mt-0.5">
                              🔑 Password: {user.password}
                            </span>
                            <span className="text-gray-400 text-[10px] mt-0.5">
                              Joined: {user.joinDate}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">
                            BALANCE
                          </span>
                          <span className="text-cyan-400 font-black text-xl drop-shadow-[0_0_10px_rgba(0,229,255,0.5)]">
                            ₹{bal}
                          </span>
                        </div>
                      </div>

                      {/* Stats Bar (Total Paisa & Total Keys) */}
                      <div className="grid grid-cols-2 gap-2 bg-transparent p-2.5 rounded-lg border border-white/10 text-xs font-mono">
                        <div className="flex flex-col">
                          <span className="text-gray-400 text-[10px] uppercase font-bold">
                            TOTAL PAISA LAGAYA
                          </span>
                          <span className="text-emerald-400 font-black text-sm">
                            ₹{totalPaid}
                          </span>
                        </div>
                        <div className="flex flex-col border-l border-white/10 pl-2">
                          <span className="text-gray-400 text-[10px] uppercase font-bold">
                            KEYS BOUGHT
                          </span>
                          <span className="text-fuchsia-400 font-black text-sm">
                            {keysDeliveredCount} Keys
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          onClick={() => {
                            setEditingAdminUser({
                              originalEmail: user.email,
                              originalPhone: user.phone,
                              name: displayName,
                              email: user.email,
                              phone: user.phone,
                              password: user.password,
                              avatar: avatarUrl,
                              balance: bal,
                              joinDate: user.joinDate,
                              showPassword: false,
                              activeTab: "info",
                            });
                          }}
                          className="flex-1 bg-rainbow-animated border-2 border-white hover:from-cyan-500/40 hover:to-blue-500/40 text-cyan-400 border border-cyan-500/40 rounded-lg py-2.5 text-xs font-black transition-all flex items-center justify-center gap-1.5 uppercase shadow-[0_0_10px_rgba(0,229,255,0.2)] active:scale-95"
                        >
                          <Edit size={14} /> EDIT USER & WALLET
                        </button>
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                `Aap sach me user "${displayName}" ko delete karna chahte hain?`,
                              )
                            ) {
                              setRegisteredUsers((prev) =>
                                prev.filter(
                                  (u) =>
                                    getAccountKey(u.email, u.phone) !== uKey,
                                ),
                              );
                              setUserWallets((prev) => {
                                const copy = { ...prev };
                                delete copy[uKey];
                                return copy;
                              });
                              alert(`User "${displayName}" delete ho gaya!`);
                            }
                          }}
                          className="p-2.5 bg-red-500/20 hover:bg-red-500/40 text-red-400 border border-red-500/30 rounded-lg transition-all active:scale-95"
                          title="Delete User"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}

              {/* FULL USER EDIT & DETAIL MODAL FOR ADMIN */}
              {editingAdminUser && (
                <div className="fixed inset-0 z-[100] bg-transparent   flex items-center justify-center p-3 overflow-y-auto animate-in fade-in">
                  <div className="bg-transparent  border border-cyan-500/40 rounded-2xl max-w-md w-full max-h-[92vh] overflow-y-auto p-4 flex flex-col gap-4 shadow-[0_0_50px_rgba(0,229,255,0.3)] relative text-left my-auto">
                    {/* Modal Header */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2">
                        <User size={20} className="text-cyan-400" />
                        <h3 className="text-white font-black text-lg italic tracking-wide uppercase">
                          EDIT USER &{" "}
                          <span className="text-cyan-400">WALLET DETAILS</span>
                        </h3>
                      </div>
                      <button
                        onClick={() => setEditingAdminUser(null)}
                        className="p-1.5 bg-transparent hover:bg-transparent rounded-full text-white transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    {/* User Avatar & Photo URL */}
                    <div className="flex flex-col items-center gap-2 bg-transparent  p-3 rounded-xl border border-white/10">
                      <div className="relative group">
                        <img
                          src={editingAdminUser.avatar}
                          alt="User Avatar"
                          className="w-20 h-20 rounded-full object-cover border-2 border-cyan-400 shadow-[0_0_20px_rgba(0,229,255,0.4)]"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop";
                          }}
                        />
                        <div className="absolute bottom-0 right-0 bg-cyan-500 text-black p-1 rounded-full shadow">
                          <Camera size={12} />
                        </div>
                      </div>

                      <div className="w-full">
                        <label className="text-transparent bg-clip-text bg-rainbow-animated font-black drop-shadow-[0_0_10px_#fff] text-[10px] uppercase tracking-wider block mb-1">
                          PROFILE PHOTO URL
                        </label>
                        <input
                          type="text"
                          value={editingAdminUser.avatar}
                          onChange={(e) =>
                            setEditingAdminUser({
                              ...editingAdminUser,
                              avatar: e.target.value,
                            })
                          }
                          placeholder="https://..."
                          className="w-full bg-transparent  border border-white/20 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                    </div>

                    {/* User Name & Info Form */}
                    <div className="flex flex-col gap-3">
                      <div>
                        <label className="text-transparent bg-clip-text bg-rainbow-animated font-black drop-shadow-[0_0_10px_#fff] text-[10px] uppercase tracking-wider block mb-1">
                          USER NAME
                        </label>
                        <input
                          type="text"
                          value={editingAdminUser.name}
                          onChange={(e) =>
                            setEditingAdminUser({
                              ...editingAdminUser,
                              name: e.target.value,
                            })
                          }
                          placeholder="User Full Name"
                          className="w-full bg-transparent  border border-white/20 rounded-lg p-2.5 text-xs font-bold text-white focus:outline-none focus:border-cyan-400"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-transparent bg-clip-text bg-rainbow-animated font-black drop-shadow-[0_0_10px_#fff] text-[10px] uppercase tracking-wider block mb-1">
                            GMAIL / EMAIL ID
                          </label>
                          <input
                            type="email"
                            value={editingAdminUser.email}
                            onChange={(e) =>
                              setEditingAdminUser({
                                ...editingAdminUser,
                                email: e.target.value,
                              })
                            }
                            placeholder="user@gmail.com"
                            className="w-full bg-transparent  border border-white/20 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                          />
                        </div>
                        <div>
                          <label className="text-transparent bg-clip-text bg-rainbow-animated font-black drop-shadow-[0_0_10px_#fff] text-[10px] uppercase tracking-wider block mb-1">
                            PHONE NUMBER
                          </label>
                          <input
                            type="text"
                            value={editingAdminUser.phone}
                            onChange={(e) =>
                              setEditingAdminUser({
                                ...editingAdminUser,
                                phone: e.target.value,
                              })
                            }
                            placeholder="Mobile Number"
                            className="w-full bg-transparent  border border-white/20 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-transparent bg-clip-text bg-rainbow-animated font-black drop-shadow-[0_0_10px_#fff] text-[10px] uppercase tracking-wider block mb-1">
                          ACCOUNT PASSWORD
                        </label>
                        <div className="relative flex items-center">
                          <input
                            type={
                              editingAdminUser.showPassword
                                ? "text"
                                : "password"
                            }
                            value={editingAdminUser.password}
                            onChange={(e) =>
                              setEditingAdminUser({
                                ...editingAdminUser,
                                password: e.target.value,
                              })
                            }
                            placeholder="User Password"
                            className="w-full bg-transparent  border border-white/20 rounded-lg p-2.5 text-xs font-bold text-yellow-400 pr-10 focus:outline-none focus:border-cyan-400"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setEditingAdminUser({
                                ...editingAdminUser,
                                showPassword: !editingAdminUser.showPassword,
                              })
                            }
                            className="absolute right-2 text-gray-400 hover:text-white p-1"
                          >
                            {editingAdminUser.showPassword ? (
                              <EyeOff size={16} />
                            ) : (
                              <Eye size={16} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Wallet Balance Controller */}
                    <div className="bg-gradient-to-br from-cyan-950/60 to-blue-950/60 p-3.5 rounded-xl border border-cyan-400/40 flex flex-col gap-2.5 shadow-[0_0_20px_rgba(0,229,255,0.15)]">
                      <div className="flex justify-between items-center">
                        <span className="text-cyan-400 font-black text-xs uppercase tracking-wider flex items-center gap-1">
                          <Wallet size={14} /> EDIT WALLET BALANCE
                        </span>
                        <span className="text-cyan-300 font-mono text-xs">
                          Current: ₹{editingAdminUser.balance}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-white font-black text-lg">₹</span>
                        <input
                          type="number"
                          value={editingAdminUser.balance}
                          onChange={(e) =>
                            setEditingAdminUser({
                              ...editingAdminUser,
                              balance: Number(e.target.value) || 0,
                            })
                          }
                          className="w-full bg-transparent  border border-cyan-400/60 rounded-lg p-2 text-lg font-black text-cyan-300 focus:outline-none focus:border-cyan-400"
                        />
                      </div>

                      {/* Quick Balance Adjustment Buttons */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() =>
                            setEditingAdminUser({
                              ...editingAdminUser,
                              balance: editingAdminUser.balance + 100,
                            })
                          }
                          className="bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-500/40 px-2 py-1 rounded text-[10px] font-bold"
                        >
                          +₹100
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setEditingAdminUser({
                              ...editingAdminUser,
                              balance: editingAdminUser.balance + 500,
                            })
                          }
                          className="bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-500/40 px-2 py-1 rounded text-[10px] font-bold"
                        >
                          +₹500
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setEditingAdminUser({
                              ...editingAdminUser,
                              balance: editingAdminUser.balance + 1000,
                            })
                          }
                          className="bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-500/40 px-2 py-1 rounded text-[10px] font-bold"
                        >
                          +₹1000
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setEditingAdminUser({
                              ...editingAdminUser,
                              balance: Math.max(
                                0,
                                editingAdminUser.balance - 100,
                              ),
                            })
                          }
                          className="bg-red-500/20 hover:bg-red-500/40 text-red-300 border border-red-500/40 px-2 py-1 rounded text-[10px] font-bold"
                        >
                          -₹100
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setEditingAdminUser({
                              ...editingAdminUser,
                              balance: 0,
                            })
                          }
                          className="bg-gray-500/20 hover:bg-gray-500/40 text-gray-300 border border-gray-500/40 px-2 py-1 rounded text-[10px] font-bold"
                        >
                          Reset ₹0
                        </button>
                      </div>
                    </div>

                    {/* Tabs for Activity Details */}
                    <div className="flex border-b border-white/10 gap-1 mt-1">
                      <button
                        type="button"
                        onClick={() =>
                          setEditingAdminUser({
                            ...editingAdminUser,
                            activeTab: "info",
                          })
                        }
                        className={`py-1.5 px-3 text-xs font-bold rounded-t-lg transition-colors ${
                          !editingAdminUser.activeTab ||
                          editingAdminUser.activeTab === "info"
                            ? "bg-cyan-500/20 text-cyan-400 border-b-2 border-cyan-400"
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        Overview
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setEditingAdminUser({
                            ...editingAdminUser,
                            activeTab: "keys",
                          })
                        }
                        className={`py-1.5 px-3 text-xs font-bold rounded-t-lg transition-colors ${
                          editingAdminUser.activeTab === "keys"
                            ? "bg-cyan-500/20 text-cyan-400 border-b-2 border-cyan-400"
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        Keys (
                        {
                          keyRequests.filter(
                            (r) =>
                              (r.userEmail &&
                                editingAdminUser.email &&
                                r.userEmail.toLowerCase() ===
                                  editingAdminUser.email.toLowerCase()) ||
                              (r.userPhone &&
                                editingAdminUser.phone &&
                                r.userPhone === editingAdminUser.phone) ||
                              (editingAdminUser.email &&
                                r.user === editingAdminUser.email) ||
                              (editingAdminUser.phone &&
                                r.user === editingAdminUser.phone),
                          ).length
                        }
                        )
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setEditingAdminUser({
                            ...editingAdminUser,
                            activeTab: "payments",
                          })
                        }
                        className={`py-1.5 px-3 text-xs font-bold rounded-t-lg transition-colors ${
                          editingAdminUser.activeTab === "payments"
                            ? "bg-cyan-500/20 text-cyan-400 border-b-2 border-cyan-400"
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        Payments (
                        {
                          ensureArray(paymentHistory).filter(
                            (p) =>
                              (p.userEmail &&
                                editingAdminUser.email &&
                                p.userEmail.toLowerCase() ===
                                  editingAdminUser.email.toLowerCase()) ||
                              (p.userPhone &&
                                editingAdminUser.phone &&
                                p.userPhone === editingAdminUser.phone),
                          ).length
                        }
                        )
                      </button>
                    </div>

                    {/* Tab Content */}
                    {(!editingAdminUser.activeTab ||
                      editingAdminUser.activeTab === "info") && (
                      <div className="bg-transparent  p-3 rounded-xl border border-white/10 flex flex-col gap-2 text-xs font-mono">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Join Date:</span>
                          <span className="text-white font-bold">
                            {editingAdminUser.joinDate || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">
                            Total Money Added:
                          </span>
                          <span className="text-emerald-400 font-bold">
                            ₹
                            {paymentHistory
                              .filter(
                                (p) =>
                                  ((p.userEmail &&
                                    editingAdminUser.email &&
                                    p.userEmail.toLowerCase() ===
                                      editingAdminUser.email.toLowerCase()) ||
                                    (p.userPhone &&
                                      editingAdminUser.phone &&
                                      p.userPhone ===
                                        editingAdminUser.phone)) &&
                                  p.status === "APPROVED",
                              )
                              .reduce(
                                (sum, p) => sum + (Number(p.amount) || 0),
                                0,
                              )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">
                            Total Keys Delivered:
                          </span>
                          <span className="text-fuchsia-400 font-bold">
                            {
                              keyRequests.filter(
                                (r) =>
                                  ((r.userEmail &&
                                    editingAdminUser.email &&
                                    r.userEmail.toLowerCase() ===
                                      editingAdminUser.email.toLowerCase()) ||
                                    (r.userPhone &&
                                      editingAdminUser.phone &&
                                      r.userPhone === editingAdminUser.phone) ||
                                    (editingAdminUser.email &&
                                      r.user === editingAdminUser.email) ||
                                    (editingAdminUser.phone &&
                                      r.user === editingAdminUser.phone)) &&
                                  (r.status === "APPROVED" ||
                                    r.status === "DELIVERED"),
                              ).length
                            }{" "}
                            Keys
                          </span>
                        </div>
                      </div>
                    )}

                    {editingAdminUser.activeTab === "keys" && (
                      <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                        {(() => {
                          const userKeys = ensureArray(keyRequests).filter(
                            (r) =>
                              (r.userEmail &&
                                editingAdminUser.email &&
                                r.userEmail.toLowerCase() ===
                                  editingAdminUser.email.toLowerCase()) ||
                              (r.userPhone &&
                                editingAdminUser.phone &&
                                r.userPhone === editingAdminUser.phone) ||
                              (editingAdminUser.email &&
                                r.user === editingAdminUser.email) ||
                              (editingAdminUser.phone &&
                                r.user === editingAdminUser.phone),
                          );
                          if (userKeys.length === 0) {
                            return (
                              <div className="text-center text-gray-500 text-xs py-4">
                                No keys bought yet by this user.
                              </div>
                            );
                          }
                          return userKeys.map((k, idx) => (
                            <div
                              key={`userkey-${k.id}-${idx}`}
                              className="bg-transparent  p-2.5 rounded-lg border border-white/10 text-xs flex flex-col gap-1"
                            >
                              <div className="flex justify-between font-bold text-white">
                                <span>{k.panelTitle || "Panel Key"}</span>
                                <span className="text-cyan-400">
                                  ₹{k.price}
                                </span>
                              </div>
                              {k.deliveredKey && (
                                <div className="text-yellow-400 font-mono text-[11px] bg-transparent  p-1 rounded border border-yellow-500/30 select-all">
                                  🔑 {k.deliveredKey}
                                </div>
                              )}
                              <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                                <span>
                                  Status:{" "}
                                  <strong
                                    className={
                                      k.status === "APPROVED"
                                        ? "text-green-400"
                                        : "text-yellow-400"
                                    }
                                  >
                                    {k.status}
                                  </strong>
                                </span>
                                <span>{k.date}</span>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    )}

                    {editingAdminUser.activeTab === "payments" && (
                      <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                        {(() => {
                          const userPay = ensureArray(paymentHistory).filter(
                            (p) =>
                              (p.userEmail &&
                                editingAdminUser.email &&
                                p.userEmail.toLowerCase() ===
                                  editingAdminUser.email.toLowerCase()) ||
                              (p.userPhone &&
                                editingAdminUser.phone &&
                                p.userPhone === editingAdminUser.phone),
                          );
                          if (userPay.length === 0) {
                            return (
                              <div className="text-center text-gray-500 text-xs py-4">
                                No payment history found for this user.
                              </div>
                            );
                          }
                          return userPay.map((p, idx) => (
                            <div
                              key={`userpay-${p.id}-${idx}`}
                              className="bg-transparent  p-2.5 rounded-lg border border-white/10 text-xs flex flex-col gap-1"
                            >
                              <div className="flex justify-between font-bold">
                                <span className="text-emerald-400">
                                  ₹{p.amount}
                                </span>
                                <span
                                  className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                                    p.status === "APPROVED"
                                      ? "bg-green-500/20 text-green-400"
                                      : p.status === "REJECTED"
                                        ? "bg-red-500/20 text-red-400"
                                        : "bg-yellow-500/20 text-yellow-400"
                                  }`}
                                >
                                  {p.status}
                                </span>
                              </div>
                              <div className="text-gray-300 font-mono text-[10px]">
                                UTR: {p.utr}
                              </div>
                              <div className="text-gray-500 text-[10px] text-right">
                                {p.date}
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    )}

                    {/* Save & Action Footer */}
                    <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
                      <button
                        onClick={() => {
                          const oldKey = getAccountKey(
                            editingAdminUser.originalEmail,
                            editingAdminUser.originalPhone,
                          );
                          const newKey = getAccountKey(
                            editingAdminUser.email,
                            editingAdminUser.phone,
                          );

                          // Update registeredUsers array
                          setRegisteredUsers((prev) =>
                            prev.map((u) => {
                              if (getAccountKey(u.email, u.phone) === oldKey) {
                                return {
                                  name: editingAdminUser.name,
                                  email: editingAdminUser.email,
                                  phone: editingAdminUser.phone,
                                  password: editingAdminUser.password,
                                  avatar: editingAdminUser.avatar,
                                  joinDate: editingAdminUser.joinDate,
                                };
                              }
                              return u;
                            }),
                          );

                          // Update userWallets record
                          setUserWallets((prev) => {
                            const copy = { ...prev };
                            if (oldKey !== newKey) {
                              delete copy[oldKey];
                            }
                            copy[newKey] = editingAdminUser.balance;
                            return copy;
                          });

                          // If the edited user is currently logged in, sync their session live!
                          const currentAccountKey = getAccountKey(
                            userProfile.email,
                            userProfile.phone,
                          );
                          if (
                            userProfile.isLoggedIn &&
                            (currentAccountKey === oldKey ||
                              currentAccountKey === newKey)
                          ) {
                            setUserBalance(editingAdminUser.balance);
                            setUserProfile((prev) => ({
                              ...prev,
                              email: editingAdminUser.email,
                              phone: editingAdminUser.phone,
                              password: editingAdminUser.password,
                              avatar: editingAdminUser.avatar,
                            }));
                          }

                          alert(
                            `User "${editingAdminUser.name || editingAdminUser.email}" details and wallet balance updated to ₹${editingAdminUser.balance}!`,
                          );
                          setEditingAdminUser(null);
                        }}
                        className="w-full bg-rainbow-animated border-2 border-white hover:from-cyan-400 hover:to-blue-500 text-white font-black py-3 rounded-xl shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-2 active:scale-95"
                      >
                        <Save size={16} /> SAVE USER DETAILS & BALANCE
                      </button>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                `User "${editingAdminUser.name || editingAdminUser.email}" ko delete karna chahte hain?`,
                              )
                            ) {
                              const oldKey = getAccountKey(
                                editingAdminUser.originalEmail,
                                editingAdminUser.originalPhone,
                              );
                              setRegisteredUsers((prev) =>
                                prev.filter(
                                  (u) =>
                                    getAccountKey(u.email, u.phone) !== oldKey,
                                ),
                              );
                              setUserWallets((prev) => {
                                const copy = { ...prev };
                                delete copy[oldKey];
                                return copy;
                              });
                              alert("User account deleted successfully!");
                              setEditingAdminUser(null);
                            }
                          }}
                          className="flex-1 bg-red-500/20 hover:bg-red-500/40 text-red-400 border border-red-500/30 rounded-lg py-2 text-xs font-bold transition-colors flex items-center justify-center gap-1 uppercase active:scale-95"
                        >
                          <Trash2 size={14} /> DELETE USER
                        </button>

                        <button
                          onClick={() => setEditingAdminUser(null)}
                          className="flex-1 bg-transparent hover:bg-transparent text-gray-300 rounded-lg py-2 text-xs font-bold transition-colors uppercase active:scale-95"
                        >
                          CANCEL
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentView === "adminPayment" && (
            <div className="flex flex-col gap-4 w-full animate-in fade-in zoom-in-95 duration-300 relative z-10 mt-2 bg-transparent  rounded-3xl p-5 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCurrentView("admin")}
                    className="p-2 bg-transparent hover:bg-transparent rounded-full transition-colors "
                  >
                    <ArrowLeft size={20} className="text-white" />
                  </button>
                  <h2 className="text-xl font-black tracking-tight italic drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase">
                    PAYMENT{" "}
                    <span className="text-fuchsia-500 drop-shadow-[0_0_15px_rgba(217,70,239,1)]">
                      FUND REQUESTS
                    </span>
                  </h2>
                </div>

                <button
                  onClick={() => setCurrentView("adminAutoPayment")}
                  className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black text-xs font-black rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.5)] flex items-center gap-1.5 uppercase tracking-wider transition-all cursor-pointer active:scale-95"
                >
                  <Zap size={14} className="fill-black" /> Auto UPI History (
                  {
                    ensureArray(autoPaymentHistory).filter(
                      (p) => p.status === "PENDING",
                    ).length
                  }
                  )
                </button>
              </div>

              {/* Pending Requests Section */}
              <div className="flex flex-col gap-3">
                <h3 className="text-xs font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-2">
                  <Hourglass size={14} className="animate-spin" /> Pending
                  Requests (
                  {
                    ensureArray(paymentHistory).filter(
                      (p) => p.status === "PENDING",
                    ).length
                  }
                  )
                </h3>

                {ensureArray(paymentHistory).filter(
                  (p) => p.status === "PENDING",
                ).length === 0 ? (
                  <div className="text-center text-gray-400 text-xs py-6 bg-transparent  /60 border border-white/10 rounded-xl">
                    No pending payment requests at the moment.
                  </div>
                ) : (
                  ensureArray(paymentHistory)
                    .filter((p) => p.status === "PENDING")
                    .map((req, idx) => {
                      const uKey =
                        req.userAccountKey ||
                        getAccountKey(req.userEmail, req.userPhone);
                      const regUser = ensureArray(registeredUsers).find(
                        (u) =>
                          (req.userEmail &&
                            u.email &&
                            u.email.toLowerCase() ===
                              req.userEmail.toLowerCase()) ||
                          (req.userPhone &&
                            u.phone &&
                            u.phone === req.userPhone) ||
                          (req.whatsapp && u.whatsapp === req.whatsapp),
                      );
                      const userAvatar =
                        req.userAvatar ||
                        regUser?.avatar ||
                        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop";
                      const isAuto =
                        req.method === "AUTO_UPI" ||
                        (req.utr && req.utr.startsWith("AUTO-"));

                      return (
                        <div
                          key={`pending-payreq-${req.id}-${idx}`}
                          className={`bg-transparent border ${isAuto ? "border-cyan-400/60 shadow-[0_4px_25px_rgba(6,182,212,0.3)]" : "border-fuchsia-500/40 shadow-[0_4px_25px_rgba(0,0,0,0.6)]"} rounded-xl p-4 relative overflow-hidden flex flex-col gap-3`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <img
                                src={userAvatar}
                                alt="User Avatar"
                                className="w-12 h-12 rounded-full border-2 border-cyan-400/80 object-cover shadow-[0_0_12px_rgba(0,229,255,0.4)] shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop";
                                }}
                              />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-white font-black text-base">
                                    {req.userName ||
                                      regUser?.name ||
                                      req.userEmail?.split("@")[0] ||
                                      "User"}
                                  </span>
                                  {isAuto && (
                                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 flex items-center gap-1 uppercase">
                                      <Zap size={10} /> Auto UPI
                                    </span>
                                  )}
                                </div>
                                <span className="text-fuchsia-400 font-black text-2xl drop-shadow-[0_0_10px_rgba(217,70,239,0.5)]">
                                  ₹{req.amount}
                                </span>
                              </div>
                            </div>

                            <span className="text-[10px] font-black px-2.5 py-1 rounded-md bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 flex items-center gap-1 uppercase">
                              <Hourglass size={10} className="animate-spin" />{" "}
                              PENDING
                            </span>
                          </div>

                          {/* USER ACCOUNT & PAYMENT DETAILS */}
                          <div className="bg-transparent  p-3 rounded-lg border border-white/10 text-xs font-mono flex flex-col gap-1.5">
                            <div className="text-transparent bg-clip-text bg-rainbow-animated font-black drop-shadow-[0_0_10px_#fff] border-b border-white/10 pb-1 uppercase tracking-wider flex items-center gap-1">
                              <User size={12} /> Account & Purchase Details:
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">📧 Email:</span>
                              <span className="text-white font-bold">
                                {req.userEmail || regUser?.email || "N/A"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">📱 Mobile:</span>
                              <span className="text-white font-bold">
                                {req.userPhone || regUser?.phone || "N/A"}
                              </span>
                            </div>
                            {(req.whatsapp || regUser?.whatsapp) && (
                              <div className="flex justify-between items-center">
                                <span className="text-green-400">
                                  💬 WhatsApp:
                                </span>
                                <a
                                  href={`https://wa.me/91${(req.whatsapp || regUser?.whatsapp || "").replace(/\D/g, "")}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-green-300 font-bold hover:underline flex items-center gap-1"
                                >
                                  {req.whatsapp || regUser?.whatsapp}{" "}
                                  <ExternalLink size={10} />
                                </a>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-gray-400">
                                🔑 Password:
                              </span>
                              <span className="text-yellow-400 font-bold">
                                {req.userPassword ||
                                  regUser?.password ||
                                  "N/A"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">
                                💼 Current Balance:
                              </span>
                              <span className="text-cyan-400 font-bold">
                                ₹
                                {req.userBalance ??
                                  userWallets[uKey] ??
                                  userBalance ??
                                  0}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">
                                🔑 Total Keys Bought:
                              </span>
                              <span className="text-purple-300 font-bold">
                                {req.keysBoughtCount ??
                                  ensureArray(keyRequests).filter(
                                    (r) =>
                                      (r.userEmail &&
                                        req.userEmail &&
                                        r.userEmail.toLowerCase() ===
                                          req.userEmail.toLowerCase()) ||
                                      (r.userPhone &&
                                        req.userPhone &&
                                        r.userPhone === req.userPhone),
                                  ).length}{" "}
                                Keys
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">📅 Joined:</span>
                              <span className="text-gray-300">
                                {req.userJoinDate ||
                                  regUser?.joinDate ||
                                  "N/A"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">
                                🕒 Last Login:
                              </span>
                              <span className="text-gray-300">
                                {req.userLastLogin ||
                                  regUser?.lastLogin ||
                                  "N/A"}
                              </span>
                            </div>
                            <div className="flex justify-between pt-1 border-t border-white/10">
                              <span className="text-gray-400">
                                🧾 UTR / Txn ID:
                              </span>
                              <span className="text-cyan-300 font-bold select-all">
                                {req.utr}
                              </span>
                            </div>
                            <div className="flex justify-between text-[10px] text-gray-500">
                              <span>Date & Time:</span>
                              <span>{req.date}</span>
                            </div>
                          </div>

                          {/* ACTION BUTTONS */}
                          <div className="flex items-center gap-2 mt-1">
                            <button
                              onClick={() => {
                                setPaymentHistory((prev) =>
                                  prev.map((p) =>
                                    p.id === req.id
                                      ? { ...p, status: "REJECTED" }
                                      : p,
                                  ),
                                );
                                setAutoPaymentHistory((prev) =>
                                  prev.map((p) =>
                                    p.id === req.id
                                      ? { ...p, status: "REJECTED" }
                                      : p,
                                  ),
                                );
                                alert("Payment rejected!");
                              }}
                              className="flex-1 bg-red-500/20 hover:bg-red-500/40 text-red-400 border border-red-500/40 rounded-lg py-2 text-xs font-black transition-all uppercase tracking-wider cursor-pointer"
                            >
                              REJECT
                            </button>
                            <button
                              onClick={() => {
                                const targetKey =
                                  req.userAccountKey ||
                                  getAccountKey(req.userEmail, req.userPhone);

                                // 1. Update status
                                setPaymentHistory((prev) =>
                                  prev.map((p) =>
                                    p.id === req.id
                                      ? { ...p, status: "SUCCESS" }
                                      : p,
                                  ),
                                );
                                setAutoPaymentHistory((prev) =>
                                  prev.map((p) =>
                                    p.id === req.id
                                      ? { ...p, status: "SUCCESS" }
                                      : p,
                                  ),
                                );

                                // 2. Add funds to userWallets
                                setUserWallets((prev) => {
                                  const cur = prev[targetKey] ?? 0;
                                  return {
                                    ...prev,
                                    [targetKey]: cur + req.amount,
                                  };
                                });

                                // 3. Update current userBalance if matching active user
                                const activeKey = getAccountKey(
                                  userProfile.email,
                                  userProfile.phone,
                                );
                                if (
                                  !userProfile.isLoggedIn ||
                                  activeKey === targetKey ||
                                  targetKey === "guest"
                                ) {
                                  setUserBalance((prev) => prev + req.amount);
                                }

                                alert(
                                  `Payment ₹${req.amount} ACCEPTED! Added to wallet of ${req.userName || req.userEmail || req.userPhone || "User"}.`,
                                );
                              }}
                              className="flex-1 bg-green-500 hover:bg-green-400 text-black shadow-[0_0_15px_rgba(34,197,94,0.5)] rounded-lg py-2 text-xs font-black transition-all uppercase tracking-wider cursor-pointer"
                            >
                              ACCEPT & ADD ₹{req.amount}
                            </button>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>

              {/* Processed Payments Logs */}
              {ensureArray(paymentHistory).filter((p) => p.status !== "PENDING")
                .length > 0 && (
                <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-white/10">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Recent History (
                    {
                      ensureArray(paymentHistory).filter(
                        (p) => p.status !== "PENDING",
                      ).length
                    }
                    )
                  </h3>
                  {ensureArray(paymentHistory)
                    .filter((p) => p.status !== "PENDING")
                    .map((req, idx) => (
                      <div
                        key={`processed-payreq-${req.id}-${idx}`}
                        className="bg-transparent border border-white/10 rounded-xl p-3 flex justify-between items-center text-xs"
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="text-white font-bold">
                            ₹{req.amount} -{" "}
                            {req.userName ||
                              req.userEmail ||
                              req.userPhone ||
                              "User"}
                          </span>
                          <span className="text-gray-400 text-[10px]">
                            UTR: {req.utr} | Date: {req.date}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded border ${req.status === "SUCCESS" || req.status === "APPROVED" ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}`}
                        >
                          {req.status}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* DEDICATED AUTO PAYMENT HISTORY VIEW */}
          {currentView === "adminAutoPayment" && (
            <div className="flex flex-col gap-4 w-full animate-in fade-in zoom-in-95 duration-300 relative z-10 mt-2 bg-transparent rounded-3xl p-5 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCurrentView("admin")}
                    className="p-2 bg-transparent hover:bg-transparent rounded-full transition-colors"
                  >
                    <ArrowLeft size={20} className="text-white" />
                  </button>
                  <h2 className="text-xl font-black tracking-tight italic drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase">
                    AUTO PAYMENT{" "}
                    <span className="text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,1)]">
                      HISTORY
                    </span>
                  </h2>
                </div>

                <button
                  onClick={() => setCurrentView("adminPayment")}
                  className="px-3 py-1.5 bg-fuchsia-500/20 hover:bg-fuchsia-500/30 text-fuchsia-300 border border-fuchsia-500/40 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all uppercase cursor-pointer"
                >
                  <Wallet size={14} /> Payment Fund
                </button>
              </div>

              {/* STATS OVERVIEW CARDS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-transparent border border-cyan-400/30 rounded-xl p-3 flex flex-col gap-1">
                  <span className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider">
                    Total Auto Orders
                  </span>
                  <span className="text-white font-black text-xl">
                    {ensureArray(autoPaymentHistory).length}
                  </span>
                </div>

                <div className="bg-transparent border border-yellow-400/30 rounded-xl p-3 flex flex-col gap-1">
                  <span className="text-[10px] text-yellow-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Hourglass size={10} className="animate-spin" /> Pending
                  </span>
                  <span className="text-yellow-400 font-black text-xl">
                    {
                      ensureArray(autoPaymentHistory).filter(
                        (p) => p.status === "PENDING",
                      ).length
                    }
                  </span>
                </div>

                <div className="bg-transparent border border-green-400/30 rounded-xl p-3 flex flex-col gap-1">
                  <span className="text-[10px] text-green-400 font-bold uppercase tracking-wider">
                    Approved Total
                  </span>
                  <span className="text-green-400 font-black text-xl">
                    ₹
                    {ensureArray(autoPaymentHistory)
                      .filter(
                        (p) =>
                          p.status === "SUCCESS" || p.status === "APPROVED",
                      )
                      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)}
                  </span>
                </div>

                <div className="bg-transparent border border-red-400/30 rounded-xl p-3 flex flex-col gap-1">
                  <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider">
                    Rejected
                  </span>
                  <span className="text-red-400 font-black text-xl">
                    {
                      ensureArray(autoPaymentHistory).filter(
                        (p) => p.status === "REJECTED",
                      ).length
                    }
                  </span>
                </div>
              </div>

              {/* SEARCH & FILTER CONTROLS */}
              <div className="flex flex-col sm:flex-row gap-2 items-center justify-between mt-2">
                <div className="relative w-full sm:w-64">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Search email, phone, TxID..."
                    value={autoPaySearch}
                    onChange={(e) => setAutoPaySearch(e.target.value)}
                    className="w-full bg-[#05080f] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-yellow-400"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
                  {(["ALL", "PENDING", "SUCCESS", "REJECTED"] as const).map(
                    (filterKey) => (
                      <button
                        key={`autopay-filter-${filterKey}`}
                        onClick={() => setAutoPayFilter(filterKey)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all cursor-pointer ${
                          autoPayFilter === filterKey
                            ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-[0_0_10px_rgba(250,204,21,0.5)]"
                            : "bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10"
                        }`}
                      >
                        {filterKey === "SUCCESS" ? "APPROVED" : filterKey}
                      </button>
                    ),
                  )}
                </div>
              </div>

              {/* AUTO PAYMENT REQUESTS LIST */}
              <div className="flex flex-col gap-3.5 mt-2">
                {(() => {
                  const filtered = ensureArray(autoPaymentHistory).filter(
                    (item) => {
                      if (autoPayFilter !== "ALL") {
                        if (
                          autoPayFilter === "SUCCESS" &&
                          item.status !== "SUCCESS" &&
                          item.status !== "APPROVED"
                        ) {
                          return false;
                        }
                        if (
                          autoPayFilter !== "SUCCESS" &&
                          item.status !== autoPayFilter
                        ) {
                          return false;
                        }
                      }
                      if (autoPaySearch.trim()) {
                        const q = autoPaySearch.toLowerCase();
                        const matchEmail = (item.userEmail || "")
                          .toLowerCase()
                          .includes(q);
                        const matchPhone = (item.userPhone || "")
                          .toLowerCase()
                          .includes(q);
                        const matchWhatsapp = (item.whatsapp || "")
                          .toLowerCase()
                          .includes(q);
                        const matchUtr = (item.utr || "")
                          .toLowerCase()
                          .includes(q);
                        const matchName = (item.userName || "")
                          .toLowerCase()
                          .includes(q);
                        return (
                          matchEmail ||
                          matchPhone ||
                          matchWhatsapp ||
                          matchUtr ||
                          matchName
                        );
                      }
                      return true;
                    },
                  );

                  if (filtered.length === 0) {
                    return (
                      <div className="text-center text-gray-400 text-xs py-10 bg-transparent border border-white/10 rounded-2xl flex flex-col items-center gap-2">
                        <Zap size={24} className="text-gray-500" />
                        <span>No Auto UPI payment records found.</span>
                      </div>
                    );
                  }

                  return filtered.map((req, idx) => {
                    const uKey =
                      req.userAccountKey ||
                      getAccountKey(req.userEmail, req.userPhone);
                    const regUser = ensureArray(registeredUsers).find(
                      (u) =>
                        (req.userEmail &&
                          u.email &&
                          u.email.toLowerCase() ===
                            req.userEmail.toLowerCase()) ||
                        (req.userPhone &&
                          u.phone &&
                          u.phone === req.userPhone) ||
                        (req.whatsapp && u.whatsapp === req.whatsapp),
                    );

                    const userAvatar =
                      req.userAvatar ||
                      regUser?.avatar ||
                      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop";

                    const curBal =
                      req.userBalance ??
                      userWallets[uKey] ??
                      userBalance ??
                      0;

                    const userKeys = ensureArray(keyRequests).filter(
                      (r) =>
                        (req.userEmail &&
                          r.userEmail &&
                          r.userEmail.toLowerCase() ===
                            req.userEmail.toLowerCase()) ||
                        (req.userPhone &&
                          r.userPhone &&
                          r.userPhone === req.userPhone) ||
                        (req.userEmail && r.user === req.userEmail) ||
                        (req.userPhone && r.user === req.userPhone),
                    );
                    const keysDeliveredCount =
                      req.keysBoughtCount ??
                      userKeys.filter(
                        (r) =>
                          r.status === "APPROVED" || r.status === "DELIVERED",
                      ).length;

                    const totalSpent =
                      req.totalPaid ??
                      ensureArray(paymentHistory)
                        .filter(
                          (p) =>
                            ((p.userEmail &&
                              req.userEmail &&
                              p.userEmail.toLowerCase() ===
                                req.userEmail.toLowerCase()) ||
                              (p.userPhone &&
                                req.userPhone &&
                                p.userPhone === req.userPhone)) &&
                            (p.status === "SUCCESS" || p.status === "APPROVED"),
                        )
                        .reduce(
                          (acc, curr) => acc + (Number(curr.amount) || 0),
                          0,
                        );

                    const cleanPhone = (
                      req.whatsapp ||
                      req.userPhone ||
                      regUser?.phone ||
                      ""
                    ).replace(/\D/g, "");

                    return (
                      <div
                        key={`autopay-card-${req.id}-${idx}`}
                        className="bg-transparent border border-yellow-400/40 rounded-2xl p-4 sm:p-5 shadow-[0_4px_30px_rgba(234,179,8,0.15)] flex flex-col gap-4 text-left transition-all relative overflow-hidden"
                      >
                        {/* CARD HEADER */}
                        <div className="flex flex-wrap justify-between items-start gap-2 border-b border-white/10 pb-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={userAvatar}
                              alt="Profile"
                              className="w-14 h-14 rounded-full border-2 border-yellow-400 object-cover shadow-[0_0_15px_rgba(250,204,21,0.4)] shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop";
                              }}
                            />
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="text-white font-black text-lg">
                                  {req.userName ||
                                    regUser?.name ||
                                    req.userEmail?.split("@")[0] ||
                                    "User"}
                                </span>
                                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-yellow-400/20 text-yellow-300 border border-yellow-400/40 uppercase">
                                  ⚡ AUTO UPI
                                </span>
                              </div>
                              <span className="text-cyan-300 text-xs font-mono">
                                📧 {req.userEmail || regUser?.email || "N/A"}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <span
                              className={`text-xs font-black px-3 py-1 rounded-lg border uppercase flex items-center gap-1 ${
                                req.status === "PENDING"
                                  ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/40"
                                  : req.status === "SUCCESS" ||
                                      req.status === "APPROVED"
                                    ? "bg-green-500/20 text-green-400 border-green-500/40"
                                    : "bg-red-500/20 text-red-400 border-red-500/40"
                              }`}
                            >
                              {req.status === "PENDING" && (
                                <Hourglass size={12} className="animate-spin" />
                              )}
                              {req.status === "SUCCESS" ||
                              req.status === "APPROVED" ? (
                                <CheckCircle size={12} />
                              ) : null}
                              {req.status}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">
                              TxID: {req.utr}
                            </span>
                          </div>
                        </div>

                        {/* FULL USER PROFILE & PURCHASE DOSSIER */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-black/40 border border-white/10 rounded-xl p-3.5 text-xs font-mono">
                          <div className="flex flex-col gap-1.5">
                            <div className="text-yellow-400 font-bold uppercase tracking-wider text-[11px] pb-1 border-b border-white/10 flex items-center gap-1">
                              <User size={12} /> User Credentials & Contacts:
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">📱 Mobile:</span>
                              <span className="text-white font-bold">
                                {req.userPhone || regUser?.phone || "N/A"}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-green-400 font-bold">
                                💬 WhatsApp:
                              </span>
                              <a
                                href={`https://wa.me/91${cleanPhone}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-green-300 font-bold hover:underline flex items-center gap-1 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/30"
                              >
                                {req.whatsapp ||
                                  regUser?.whatsapp ||
                                  req.userPhone}{" "}
                                <ExternalLink size={10} />
                              </a>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">🔑 Password:</span>
                              <span className="text-yellow-300 font-bold select-all bg-yellow-500/10 px-1.5 rounded">
                                {req.userPassword ||
                                  regUser?.password ||
                                  "N/A"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">📅 Joined:</span>
                              <span className="text-gray-300">
                                {req.userJoinDate ||
                                  regUser?.joinDate ||
                                  "N/A"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">
                                🕒 Last Login:
                              </span>
                              <span className="text-gray-300">
                                {req.userLastLogin ||
                                  regUser?.lastLogin ||
                                  "N/A"}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <div className="text-cyan-400 font-bold uppercase tracking-wider text-[11px] pb-1 border-b border-white/10 flex items-center gap-1">
                              <Wallet size={12} /> Wallet & Spending Dossier:
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">
                                💰 Requested Fund:
                              </span>
                              <span className="text-fuchsia-400 font-black text-sm">
                                ₹{req.amount}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">
                                💼 Current Balance:
                              </span>
                              <span className="text-cyan-400 font-bold">
                                ₹{curBal}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">
                                💳 Total Lifetime Added:
                              </span>
                              <span className="text-green-400 font-bold">
                                ₹{totalSpent}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">
                                🔑 Total Keys Purchased:
                              </span>
                              <span className="text-purple-300 font-bold">
                                {keysDeliveredCount} Keys
                              </span>
                            </div>
                            <div className="flex justify-between text-[10px] text-gray-500 pt-1 border-t border-white/10">
                              <span>Order Time:</span>
                              <span>{req.date}</span>
                            </div>
                          </div>
                        </div>

                        {/* ACTION CONTROLS */}
                        <div className="flex flex-wrap items-center gap-2">
                          {req.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => {
                                  const targetKey =
                                    req.userAccountKey ||
                                    getAccountKey(req.userEmail, req.userPhone);

                                  // 1. Update status
                                  setAutoPaymentHistory((prev) =>
                                    prev.map((p) =>
                                      p.id === req.id
                                        ? { ...p, status: "SUCCESS" }
                                        : p,
                                    ),
                                  );
                                  setPaymentHistory((prev) =>
                                    prev.map((p) =>
                                      p.id === req.id
                                        ? { ...p, status: "SUCCESS" }
                                        : p,
                                    ),
                                  );

                                  // 2. Add funds to userWallets
                                  setUserWallets((prev) => {
                                    const cur = prev[targetKey] ?? 0;
                                    return {
                                      ...prev,
                                      [targetKey]: cur + req.amount,
                                    };
                                  });

                                  // 3. Update current userBalance if matching active user
                                  const activeKey = getAccountKey(
                                    userProfile.email,
                                    userProfile.phone,
                                  );
                                  if (
                                    !userProfile.isLoggedIn ||
                                    activeKey === targetKey ||
                                    targetKey === "guest"
                                  ) {
                                    setUserBalance((prev) => prev + req.amount);
                                  }

                                  alert(
                                    `✅ Auto UPI Payment ₹${req.amount} ACCEPTED! Added to wallet of ${req.userName || req.userEmail || req.userPhone || "User"}.`,
                                  );
                                }}
                                className="flex-1 min-w-[140px] bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-black font-black py-2.5 px-4 rounded-xl shadow-[0_0_15px_rgba(34,197,94,0.4)] text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                              >
                                <CheckCircle size={14} /> ACCEPT & ADD ₹
                                {req.amount}
                              </button>

                              <button
                                onClick={() => {
                                  setAutoPaymentHistory((prev) =>
                                    prev.map((p) =>
                                      p.id === req.id
                                        ? { ...p, status: "REJECTED" }
                                        : p,
                                    ),
                                  );
                                  setPaymentHistory((prev) =>
                                    prev.map((p) =>
                                      p.id === req.id
                                        ? { ...p, status: "REJECTED" }
                                        : p,
                                    ),
                                  );
                                  alert("❌ Payment request marked as Rejected.");
                                }}
                                className="bg-red-500/20 hover:bg-red-500/40 text-red-400 border border-red-500/40 font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95"
                              >
                                REJECT
                              </button>
                            </>
                          )}

                          {cleanPhone && (
                            <a
                              href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(`Hello ${req.userName || "User"}, your Auto UPI payment request of ₹${req.amount} (ID: ${req.utr}) has been received.`)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="bg-green-600 hover:bg-green-500 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                              <MessageCircle size={14} /> WhatsApp Chat
                            </a>
                          )}

                          <button
                            onClick={() => {
                              if (
                                confirm(
                                  "Are you sure you want to delete this payment record?",
                                )
                              ) {
                                setAutoPaymentHistory((prev) =>
                                  prev.filter((p) => p.id !== req.id),
                                );
                                setPaymentHistory((prev) =>
                                  prev.filter((p) => p.id !== req.id),
                                );
                              }
                            }}
                            className="p-2.5 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 border border-white/10 rounded-xl transition-all ml-auto cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {currentView === "adminKeys" && (
            <div className="flex flex-col gap-4 w-full animate-in fade-in zoom-in-95 duration-300 relative z-10 mt-2 bg-transparent  rounded-3xl p-5 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={() => setCurrentView("admin")}
                  className="p-2 bg-transparent hover:bg-transparent rounded-full transition-colors "
                >
                  <ArrowLeft size={20} className="text-white" />
                </button>
                <h2 className="text-xl font-black tracking-tight italic drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase">
                  MANAGE{" "}
                  <span className="text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,1)]">
                    KEYS
                  </span>
                </h2>
              </div>

              {/* Direct Key Sender Form for Admin */}
              <div className="bg-transparent  border border-purple-500/40 rounded-xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.5)]  flex flex-col gap-3">
                <h3 className="text-xs font-black text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Key size={14} className="text-purple-400" /> Send Key
                  Directly To Any User Account
                </h3>

                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-gray-300">
                    1. Target User (Select or Type Email/Phone):
                  </label>
                  <input
                    type="text"
                    placeholder="Enter user email or phone (e.g. user@gmail.com)"
                    value={manualKeyForm.targetAccount}
                    onChange={(e) =>
                      setManualKeyForm((prev) => ({
                        ...prev,
                        targetAccount: e.target.value,
                      }))
                    }
                    className="w-full bg-transparent  border border-white/20 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-purple-400"
                  />
                  {ensureArray(registeredUsers).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {ensureArray(registeredUsers).map((u, i) => (
                        <button
                          key={`user-opt-${u.email || u.phone || i}-${i}`}
                          type="button"
                          onClick={() =>
                            setManualKeyForm((prev) => ({
                              ...prev,
                              targetAccount: u.email || u.phone,
                            }))
                          }
                          className="text-[10px] bg-purple-950/60 hover:bg-purple-900 border border-purple-500/30 text-purple-300 px-2 py-0.5 rounded"
                        >
                          {u.email || u.phone}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-gray-300">
                    2. Select Panel:
                  </label>
                  <select
                    value={manualKeyForm.panelTitle}
                    onChange={(e) =>
                      setManualKeyForm((prev) => ({
                        ...prev,
                        panelTitle: e.target.value,
                      }))
                    }
                    className="w-full bg-transparent  border border-white/20 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-purple-400"
                  >
                    <option value="">Select a panel...</option>
                    {ensureArray(panels).map((p, pIdx) => (
                      <option key={`panel-opt-${p.id}-${pIdx}`} value={p.title}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-gray-300">
                    3. Key Value / Code:
                  </label>
                  <input
                    type="text"
                    placeholder="Enter key code (e.g. 5546272611)"
                    value={manualKeyForm.keyVal}
                    onChange={(e) =>
                      setManualKeyForm((prev) => ({
                        ...prev,
                        keyVal: e.target.value,
                      }))
                    }
                    className="w-full bg-transparent  border border-white/20 rounded-lg p-2.5 text-xs font-mono text-emerald-400 font-bold focus:outline-none focus:border-purple-400"
                  />
                </div>

                <button
                  onClick={() => {
                    if (!manualKeyForm.targetAccount || !manualKeyForm.keyVal) {
                      alert("Please enter Target User and Key Value");
                      return;
                    }
                    const panelName =
                      manualKeyForm.panelTitle ||
                      panels[0]?.title ||
                      "DRIPCLIENT FF NONROOT ANDROID";
                    const targetAccKey = getAccountKey(
                      manualKeyForm.targetAccount.includes("@")
                        ? manualKeyForm.targetAccount
                        : "",
                      !manualKeyForm.targetAccount.includes("@")
                        ? manualKeyForm.targetAccount
                        : "",
                    );

                    const directKeyReq = {
                      id: Date.now(),
                      user: manualKeyForm.targetAccount,
                      userEmail: manualKeyForm.targetAccount.includes("@")
                        ? manualKeyForm.targetAccount
                        : "",
                      userPhone: !manualKeyForm.targetAccount.includes("@")
                        ? manualKeyForm.targetAccount
                        : "",
                      userPassword: "Via Admin",
                      userAccountKey: targetAccKey,
                      panel: panelName,
                      planLabel: "- 1 DAY nonroot",
                      price: manualKeyForm.price || 80,
                      status: "APPROVED",
                      deliveredKey: manualKeyForm.keyVal.trim(),
                      date: new Date().toLocaleString(),
                      exceptFileLink: supportLinks.telegram,
                    };

                    setKeyRequests((prev) => [directKeyReq, ...prev]);
                    setManualKeyForm({
                      targetAccount: "",
                      panelTitle: "",
                      keyVal: "",
                      price: 80,
                    });
                    alert(
                      `Key delivered directly to ${manualKeyForm.targetAccount}!`,
                    );
                  }}
                  className="w-full mt-1 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-black py-2.5 rounded-lg text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-all"
                >
                  SEND DIRECT KEY TO USER
                </button>
              </div>

              {/* Pending and Previous Key Requests List */}
              <div className="flex flex-col gap-3 mt-2">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  All Key Orders ({ensureArray(keyRequests).length})
                </h3>

                {ensureArray(keyRequests).map((req, idx) => (
                  <div
                    key={`allkeyreq-${req.id}-${idx}`}
                    className="bg-transparent  border border-yellow-500/30 rounded-xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.5)] "
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-white font-bold text-sm block">
                          {req.user}
                        </span>
                        {req.userEmail || req.userPhone ? (
                          <span className="text-gray-400 text-[11px] block">
                            Account: {req.userEmail || req.userPhone}
                          </span>
                        ) : null}
                        {req.userPassword && (
                          <span className="text-yellow-400 text-[10px] font-mono block">
                            Pass: {req.userPassword}
                          </span>
                        )}
                        <span className="text-purple-300 text-xs font-bold block mt-1">
                          {req.panel} {req.planLabel && `(${req.planLabel})`}
                        </span>

                        {/* Pricing & Coupon Breakdown */}
                        <div className="bg-transparent  border border-white/10 rounded-lg p-2.5 my-1.5 flex flex-col gap-1 text-xs">
                          <div className="flex justify-between items-center font-bold">
                            <span className="text-gray-300">Amount Paid:</span>
                            <span className="text-cyan-400 font-mono text-sm">
                              ₹{req.price}
                            </span>
                          </div>
                          {req.discountAmount && req.discountAmount > 0 ? (
                            <div className="flex justify-between items-center text-[11px] text-green-400 font-bold border-t border-white/10 pt-1 mt-0.5">
                              <span className="flex items-center gap-1">
                                <Tag size={12} /> Coupon Discount:
                              </span>
                              <span>
                                -₹{req.discountAmount} (
                                {req.couponCodeUsed || "DISCOUNT"})
                              </span>
                            </div>
                          ) : (
                            <div className="flex justify-between items-center text-[10px] text-gray-500 border-t border-white/10 pt-1 mt-0.5">
                              <span>Coupon Discount:</span>
                              <span>No Coupon Used</span>
                            </div>
                          )}
                        </div>

                        <span className="text-gray-500 text-[10px]">
                          {req.date}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-black px-2 py-1 rounded-md border uppercase ${
                          req.status === "PENDING"
                            ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30 animate-pulse"
                            : req.status === "REJECTED"
                              ? "bg-red-500/20 text-red-400 border-red-500/40"
                              : "bg-green-500/20 text-green-400 border-green-500/30"
                        }`}
                      >
                        {req.status === "PENDING"
                          ? "PENDING"
                          : req.status === "REJECTED"
                            ? "REJECTED & REFUNDED"
                            : "DELIVERED"}
                      </span>
                    </div>
                    {req.status === "PENDING" ? (
                      <div className="flex flex-col gap-2 mt-2">
                        <textarea
                          placeholder="Type key message / code here (e.g. 5546272611 or ABCD-1234-EFGH)..."
                          className="w-full bg-transparent border border-white/20 rounded-lg py-2 px-3 text-sm font-bold text-emerald-400 font-mono focus:outline-none focus:border-yellow-400 transition-all resize-none h-20"
                          id={`key-input-${req.id}`}
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <button
                            onClick={() => {
                              const input = document.getElementById(
                                `key-input-${req.id}`,
                              ) as HTMLTextAreaElement;
                              if (input && input.value) {
                                setKeyRequests((prev) =>
                                  prev.map((r) =>
                                    r.id === req.id
                                      ? {
                                          ...r,
                                          status: "APPROVED",
                                          deliveredKey: input.value.trim(),
                                        }
                                      : r,
                                  ),
                                );
                                alert("Key delivered to user successfully!");
                              } else {
                                alert("Please enter a key message");
                              }
                            }}
                            className="bg-rainbow-animated border-2 border-white text-black font-black py-2.5 rounded-lg shadow-[0_0_15px_rgba(234,179,8,0.4)] transition-colors w-full uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 active:scale-95"
                          >
                            <CheckCircle size={14} /> APPROVE (IN-APP)
                          </button>

                          <button
                            onClick={async () => {
                              const input = document.getElementById(
                                `key-input-${req.id}`,
                              ) as HTMLTextAreaElement;
                              const targetEmail =
                                req.userEmail ||
                                (req.user && req.user.includes("@")
                                  ? req.user
                                  : "");
                              if (!input || !input.value.trim()) {
                                alert("Please enter a key message");
                                return;
                              }
                              let finalEmail = targetEmail;
                              if (!finalEmail) {
                                const promptEmail = prompt(
                                  "Enter User's Email ID to send Key via EmailJS:",
                                  "",
                                );
                                if (!promptEmail) return;
                                finalEmail = promptEmail.trim();
                              }
                              const keyVal = input.value.trim();
                              const sent = await handleSendKeyToUser(
                                finalEmail,
                                keyVal,
                                `Hello ${req.user}, here is your ${req.panel} activation key. Thank you for your purchase!`,
                              );
                              if (sent) {
                                setKeyRequests((prev) =>
                                  prev.map((r) =>
                                    r.id === req.id
                                      ? {
                                          ...r,
                                          status: "APPROVED",
                                          deliveredKey: keyVal,
                                        }
                                      : r,
                                  ),
                                );
                              }
                            }}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black py-2.5 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-colors w-full uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 active:scale-95"
                          >
                            <Mail size={14} /> 📧 SEND VIA EMAILJS
                          </button>
                        </div>

                        {/* REJECT & REFUND BUTTON */}
                        <button
                          type="button"
                          onClick={() => {
                            handleRejectAndRefundKey(
                              req,
                              "Out of stock / Technical issue",
                            );
                          }}
                          className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black py-2.5 rounded-lg shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-colors uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 active:scale-95 border border-red-400/40 mt-0.5"
                        >
                          <X size={14} /> ❌ REJECT & REFUND ₹{req.price}{" "}
                          (WALLET + EMAIL)
                        </button>
                      </div>
                    ) : req.status === "REJECTED" ? (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mt-2 flex flex-col gap-1 text-left">
                        <div className="flex items-center justify-between">
                          <span className="text-red-400 text-xs font-black uppercase flex items-center gap-1">
                            <X size={14} /> ORDER REJECTED & REFUNDED
                          </span>
                          <span className="text-emerald-400 font-mono font-bold text-xs">
                            ₹{req.price} Added Back to Wallet
                          </span>
                        </div>
                        <span className="text-gray-300 text-[11px]">
                          ₹{req.price} user ({req.user}) ke account wallet
                          balance me refund kar diya gaya hai.
                        </span>
                      </div>
                    ) : (
                      <div className="bg-transparent  border border-green-500/30 rounded-lg p-3 mt-2">
                        <span className="text-gray-400 text-[10px] font-bold block mb-1">
                          Delivered Key Code:
                        </span>
                        <span className="text-emerald-400 font-mono text-xs font-bold whitespace-pre-wrap break-all">
                          {req.deliveredKey}
                        </span>
                      </div>
                    )}
                  </div>
                ))}

                {keyRequests.length === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    No key orders present.
                  </p>
                )}
              </div>
            </div>
          )}

          {currentView === "adminSpin" && (
            <div className="flex flex-col gap-4 w-full animate-in fade-in zoom-in-95 duration-300 relative z-10 mt-2 bg-transparent  rounded-3xl p-5 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={() => setCurrentView("admin")}
                  className="p-2 bg-transparent hover:bg-transparent rounded-full transition-colors "
                >
                  <ArrowLeft size={20} className="text-white" />
                </button>
                <h2 className="text-xl font-black tracking-tight italic drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase">
                  SPIN{" "}
                  <span className="text-fuchsia-500 drop-shadow-[0_0_15px_rgba(217,70,239,1)]">
                    WIN MANAGER
                  </span>
                </h2>
              </div>

              {/* Spin Rewards Configurator for Admin */}
              <div className="bg-transparent  border border-fuchsia-500/40 rounded-2xl p-4 shadow-[0_0_25px_rgba(217,70,239,0.3)]  flex flex-col gap-3">
                <h3 className="text-sm font-black text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                  <Dices size={16} /> Edit Spin Reward Amounts (₹)
                </h3>
                <p className="text-xs text-gray-300">
                  Admin yahan se spin wheel me jo-jo reward amounts dikhne hain
                  unhe add ya remove kar sakte hain (e.g. 5, 10, 20, 30, 50).
                </p>

                <div className="flex flex-wrap gap-2 my-1">
                  {ensureArray(spinRewards).map((amt, idx) => (
                    <div
                      key={`spinreward-${amt}-${idx}`}
                      className="bg-fuchsia-950/60 border border-fuchsia-400/50 rounded-lg px-3 py-1.5 flex items-center gap-2"
                    >
                      <span className="text-yellow-400 font-mono font-black text-sm">
                        ₹{amt}
                      </span>
                      <button
                        onClick={() => {
                          if (spinRewards.length <= 2) {
                            alert(
                              "Kam se kam 2 reward amounts hone chahie wheel par.",
                            );
                            return;
                          }
                          setSpinRewards((prev) =>
                            prev.filter((_, i) => i !== idx),
                          );
                        }}
                        className="text-red-400 hover:text-red-300 text-xs font-bold"
                        title="Remove amount"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 mt-1">
                  <input
                    type="number"
                    placeholder="Enter reward amount (e.g. 25)"
                    value={newSpinRewardInput}
                    onChange={(e) => setNewSpinRewardInput(e.target.value)}
                    className="flex-1 bg-transparent  border border-white/20 rounded-lg py-2 px-3 text-xs font-bold text-white focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    onClick={() => {
                      const val = Number(newSpinRewardInput);
                      if (val && val > 0) {
                        if (spinRewards.includes(val)) {
                          alert("Yeh reward amount pehle se added hai.");
                          return;
                        }
                        setSpinRewards((prev) =>
                          [...prev, val].sort((a, b) => a - b),
                        );
                        setNewSpinRewardInput("");
                        alert(`Reward ₹${val} added to spin wheel!`);
                      } else {
                        alert("Kripya valid reward amount daalein.");
                      }
                    }}
                    className="bg-rainbow-animated border-2 border-white text-black font-black text-xs px-4 rounded-lg uppercase tracking-wider"
                  >
                    ADD AMOUNT
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3 mt-2">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Recent Spin Logs ({ensureArray(spinRequests).length})
                </h3>
                {ensureArray(spinRequests).map((spin, idx) => (
                  <div
                    key={`spinreq-${spin.id}-${idx}`}
                    className="bg-transparent  border border-green-500/30 rounded-xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.5)]  flex flex-col gap-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-green-400 font-bold text-sm block">
                          Coupon Won: ₹{spin.prizeWon}
                        </span>
                        <span className="text-gray-500 text-[10px]">
                          {spin.date}
                        </span>
                      </div>
                      <span className="text-[10px] font-black px-2 py-1 rounded-md border bg-green-500/20 text-green-400 border-green-500/30">
                        COMPLETED
                      </span>
                    </div>

                    <div className="bg-transparent p-2.5 rounded-lg border border-white/10 text-xs font-mono flex flex-col gap-1">
                      <span className="text-gray-300">
                        📧 Email:{" "}
                        <strong className="text-white">
                          {spin.email || "N/A"}
                        </strong>
                      </span>
                      <span className="text-gray-300">
                        📱 Phone:{" "}
                        <strong className="text-white">
                          {spin.phone || "N/A"}
                        </strong>
                      </span>
                    </div>
                  </div>
                ))}

                {spinRequests.length === 0 && (
                  <div className="text-center text-gray-400 text-sm mt-4">
                    No recent spin activity.
                  </div>
                )}
              </div>
            </div>
          )}

          {currentView === "adminRefer" && (
            <div className="flex flex-col gap-4 w-full animate-in fade-in zoom-in-95 duration-300 relative z-10 mt-2 bg-transparent  rounded-3xl p-5 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCurrentView("admin")}
                    className="p-2 bg-transparent hover:bg-transparent rounded-full transition-colors "
                  >
                    <ArrowLeft size={20} className="text-white" />
                  </button>
                  <h2 className="text-xl font-black tracking-tight italic drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase">
                    REFER{" "}
                    <span className="text-fuchsia-500 drop-shadow-[0_0_15px_rgba(217,70,239,1)]">
                      EARN LOGS & SETTINGS
                    </span>
                  </h2>
                </div>
              </div>

              {/* Card 1: Admin Website Link Configuration */}
              <div className="bg-transparent  border border-yellow-500/50 rounded-2xl p-5 shadow-[0_0_30px_rgba(234,179,8,0.2)]  flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="text-sm font-black text-yellow-400 uppercase tracking-wider flex items-center gap-2">
                    <Globe size={18} className="text-yellow-400" /> Website
                    Referral Link Setting
                  </h3>
                  <span className="text-[10px] bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded border border-yellow-500/30 font-bold">
                    ADMIN CONTROL
                  </span>
                </div>

                <div className="flex flex-col gap-3 text-left">
                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1">
                      Website / App Base Link:
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        value={referWebsiteLink}
                        onChange={(e) => setReferWebsiteLink(e.target.value)}
                        placeholder="https://yourwebsite.com or https://t.me/yourbot"
                        className="w-full bg-transparent  border border-yellow-500/40 rounded-xl py-3 px-3.5 pl-10 text-xs font-mono font-bold text-yellow-300 focus:outline-none focus:border-yellow-400 focus:shadow-[0_0_15px_rgba(234,179,8,0.3)]"
                      />
                      <Globe
                        size={16}
                        className="absolute left-3 top-3.5 text-yellow-500/70"
                      />
                    </div>
                    <span className="text-[10px] text-gray-400 block mt-1 leading-normal">
                      ★ Yahan apni website ka link dalein (jaise:{" "}
                      <span className="text-cyan-300 font-mono">
                        https://mywebsite.com
                      </span>
                      ). Koi bhi user jab refer karne jaega, to uski referral
                      link automatic is website link me convert hokar share
                      hogi!
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                    <div>
                      <label className="text-xs font-bold text-gray-300 block mb-1">
                        Referral Bonus Amount (₹):
                      </label>
                      <input
                        type="number"
                        value={referBonusAmount}
                        onChange={(e) =>
                          setReferBonusAmount(Number(e.target.value) || 0)
                        }
                        placeholder="50"
                        className="w-full bg-transparent  border border-yellow-500/40 rounded-xl py-2.5 px-3.5 text-xs font-bold text-white focus:outline-none focus:border-yellow-400"
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        onClick={() => {
                          saveToFirebase("referWebsiteLink", referWebsiteLink);
                          saveToFirebase("referBonusAmount", referBonusAmount);
                          setReferSettingsSavedMsg(
                            "✓ Website Referral Link & Bonus Amount Updated Successfully!",
                          );
                          setTimeout(() => setReferSettingsSavedMsg(""), 4000);
                        }}
                        className="w-full bg-rainbow-animated border-2 border-white text-black font-black py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(234,179,8,0.5)] transition-all active:scale-95"
                      >
                        <Save size={16} /> SAVE SETTINGS
                      </button>
                    </div>
                  </div>

                  {referSettingsSavedMsg && (
                    <div className="bg-green-500/20 border border-green-500/40 rounded-lg p-2 text-green-300 text-xs font-bold text-center animate-in fade-in">
                      {referSettingsSavedMsg}
                    </div>
                  )}

                  {/* Live Preview Box for Admin */}
                  <div className="bg-transparent  border border-white/10 rounded-xl p-3 mt-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      User Generated Referral Link Preview:
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-cyan-300 bg-transparent  p-2 rounded-lg border border-cyan-500/30 flex-1 overflow-hidden whitespace-nowrap text-ellipsis">
                        {(
                          referWebsiteLink.trim() || "https://website.com"
                        ).includes("?")
                          ? `${referWebsiteLink.trim() || "https://website.com"}&ref=user@email.com`
                          : `${referWebsiteLink.trim() || "https://website.com"}?ref=user@email.com`}
                      </span>
                      <button
                        onClick={() => {
                          const testUrl = (
                            referWebsiteLink.trim() || "https://website.com"
                          ).includes("?")
                            ? `${referWebsiteLink.trim() || "https://website.com"}&ref=admin`
                            : `${referWebsiteLink.trim() || "https://website.com"}?ref=admin`;
                          navigator.clipboard.writeText(testUrl);
                          alert(`Test Referral Link Copied:\n${testUrl}`);
                        }}
                        className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold px-3 py-2 rounded-lg shrink-0"
                      >
                        TEST COPY
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Refer Logs List */}
              <div className="flex justify-between items-center mt-2 px-1">
                <h3 className="text-sm font-bold text-fuchsia-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Gift size={16} /> User Referral Requests (
                  {referRequests.length})
                </h3>
                {referRequests.length > 0 && (
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          "Are you sure you want to clear all refer logs?",
                        )
                      ) {
                        setReferRequests([]);
                      }
                    }}
                    className="text-[11px] bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 font-bold px-2.5 py-1 rounded-lg flex items-center gap-1"
                  >
                    <Trash2 size={12} /> CLEAR LOGS
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-3">
                {ensureArray(referRequests).map((ref, idx) => (
                  <div
                    key={`referreq-${ref.id}-${idx}`}
                    className="bg-transparent  border border-yellow-500/30 rounded-xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.5)]  flex flex-col gap-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-yellow-400 font-bold text-sm block">
                          Bonus Amount: ₹{ref.bonusAmount}
                        </span>
                        <span className="text-gray-500 text-[10px]">
                          {ref.date}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-black px-2 py-1 rounded-md border ${ref.status === "PENDING" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" : "bg-green-500/20 text-green-400 border-green-500/30"}`}
                        >
                          {ref.status}
                        </span>
                        <button
                          onClick={() => {
                            setReferRequests((prev) =>
                              prev.filter((r) => r.id !== ref.id),
                            );
                          }}
                          className="text-red-400 hover:text-red-300 p-1"
                          title="Delete Log"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="bg-transparent p-2.5 rounded-lg border border-white/10 text-xs font-mono flex flex-col gap-1 text-left">
                      <span className="text-gray-300">
                        👤 Referrer Email:{" "}
                        <strong className="text-white">
                          {ref.referrerEmail}
                        </strong>
                      </span>
                      <span className="text-gray-300">
                        📱 Referrer Phone:{" "}
                        <strong className="text-white">
                          {ref.referrerPhone}
                        </strong>
                      </span>
                      <span className="text-gray-300">
                        🔑 Referrer Pass:{" "}
                        <strong className="text-yellow-400">
                          {ref.referrerPassword}
                        </strong>
                      </span>
                      <span className="text-cyan-400 mt-1 border-t border-white/10 pt-1">
                        👥 Joined Friend: <strong>{ref.referredEmail}</strong>
                      </span>
                    </div>

                    {ref.status === "PENDING" ? (
                      <button
                        onClick={() => {
                          setReferRequests((prev) =>
                            prev.map((r) =>
                              r.id === ref.id
                                ? { ...r, status: "ACCEPTED" }
                                : r,
                            ),
                          );
                          setUserBalance((prev) => prev + ref.bonusAmount);
                          alert(
                            `Referral bonus accepted! ₹${ref.bonusAmount} added to referrer balance.`,
                          );
                        }}
                        className="bg-rainbow-animated border-2 border-white text-black font-black py-2 rounded-lg text-xs uppercase transition-colors"
                      >
                        Approve & Credit ₹{ref.bonusAmount} Bonus
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-green-400 text-center">
                        ✓ Bonus Credited to User Balance
                      </span>
                    )}
                  </div>
                ))}

                {referRequests.length === 0 && (
                  <div className="text-center text-gray-400 text-sm mt-6 bg-transparent  p-6 rounded-xl border border-white/10">
                    No pending referral requests.
                  </div>
                )}
              </div>
            </div>
          )}

          {currentView === "login" && (
            <div className="flex flex-col gap-6 w-full max-w-xl mx-auto animate-in fade-in zoom-in-95 duration-300 relative z-10 mt-2 p-5 sm:p-7 rounded-3xl bg-[#0b1120] border border-cyan-500/40 shadow-[0_0_40px_rgba(0,0,0,0.9)]">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 p-0.5 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)] shrink-0">
                    <User className="text-cyan-400" size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black tracking-wide uppercase text-white">
                      USER <span className="text-cyan-400">AUTHENTICATION</span>
                    </h2>
                    <p className="text-[11px] text-gray-300 font-medium">
                      Secure Login & Account Registration
                    </p>
                  </div>
                </div>
                {userProfile.isLoggedIn && (
                  <span className="bg-green-500/20 text-green-400 border border-green-500/40 text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_10px_rgba(34,197,94,0.3)]">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-ping"></span>{" "}
                    LOGGED IN
                  </span>
                )}
              </div>

              {!userProfile.isLoggedIn ? (
                <div className="flex flex-col gap-5">
                  {/* VIP Notice Banner */}
                  <div className="bg-[#11192e] border border-cyan-500/30 rounded-2xl p-3.5 flex items-center gap-3 text-xs text-gray-200">
                    <ShieldCheck
                      className="text-cyan-400 shrink-0"
                      size={22}
                    />
                    <div>
                      <p className="font-bold text-white text-xs sm:text-sm">
                        Strict Real Verification System
                      </p>
                      <p className="text-[11px] text-gray-300">
                        Login is only possible with a valid Email ID, 10-digit Mobile Number, and correct Password.
                      </p>
                    </div>
                  </div>

                  {/* 1. PRIMARY GOOGLE LOGIN BUTTON */}
                  <div className="flex flex-col gap-2">
                    <button
                      id="loginBtn"
                      type="button"
                      onClick={handleGoogleUserSignIn}
                      disabled={isSigningInUserGoogle}
                      className="w-full bg-white hover:bg-gray-100 text-gray-900 font-black text-sm py-3.5 px-5 rounded-2xl shadow-[0_0_25px_rgba(255,255,255,0.3)] transition-all flex items-center justify-center gap-3 active:scale-98 border-2 border-white hover:border-cyan-300 cursor-pointer group"
                    >
                      {isSigningInUserGoogle ? (
                        <Loader2
                          size={22}
                          className="animate-spin text-gray-800"
                        />
                      ) : (
                        <svg
                          className="w-6 h-6 shrink-0 group-hover:scale-110 transition-transform"
                          viewBox="0 0 24 24"
                        >
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          />
                        </svg>
                      )}
                      <span className="tracking-wide font-black">
                        SIGN IN WITH GOOGLE (GMAIL)
                      </span>
                    </button>
                    <p className="text-[10px] text-gray-400 text-center">
                      Secure one-click login via Google
                    </p>
                  </div>

                  {/* DIVIDER */}
                  <div className="flex items-center gap-3 my-1">
                    <div className="flex-1 border-t border-white/15"></div>
                    <span className="text-[11px] text-gray-300 font-bold uppercase tracking-widest px-2">
                      OR VIA REAL CREDENTIALS
                    </span>
                    <div className="flex-1 border-t border-white/15"></div>
                  </div>

                  {/* TABS: LOGIN vs REGISTER */}
                  <div className="grid grid-cols-2 gap-2 bg-[#11192e] p-1.5 rounded-2xl border border-white/10">
                    <button
                      type="button"
                      onClick={() => {
                        setUserAuthTab("login");
                        setUserAuthError("");
                      }}
                      className={`py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        userAuthTab === "login"
                          ? "bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                          : "text-gray-300 hover:text-white bg-white/5"
                      }`}
                    >
                      <Key size={14} /> 1. LOGIN
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setUserAuthTab("register");
                        setUserAuthError("");
                      }}
                      className={`py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        userAuthTab === "register"
                          ? "bg-fuchsia-600 text-white shadow-[0_0_20px_rgba(217,70,239,0.4)]"
                          : "text-gray-300 hover:text-white bg-white/5"
                      }`}
                    >
                      <UserPlus size={14} /> 2. CREATE ACCOUNT
                    </button>
                  </div>

                  {/* ERROR BANNER */}
                  {userAuthError && (
                    <div className="bg-red-950/60 border-2 border-red-500/80 rounded-2xl p-3.5 text-red-200 text-xs flex items-start gap-2.5 shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-in fade-in zoom-in-95">
                      <AlertCircle
                        className="text-red-400 shrink-0 mt-0.5"
                        size={18}
                      />
                      <div className="flex-1 font-semibold leading-relaxed">
                        {userAuthError}
                      </div>
                    </div>
                  )}

                  {/* TAB 1: LOGIN FORM */}
                  {userAuthTab === "login" && (
                    <form
                      onSubmit={handleUserLoginSubmit}
                      className="flex flex-col gap-3.5"
                    >
                      <div>
                        <label className="text-xs font-bold text-gray-200 block mb-1.5 flex items-center justify-between">
                          <span>
                            Registered Email ID or 10-digit Mobile Number:
                          </span>
                          <span className="text-[10px] text-cyan-400 font-normal">
                            Real Email / Phone Required
                          </span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="e.g. rahul@gmail.com or 9876543210"
                            value={userLoginForm.identifier}
                            onChange={(e) => {
                              setUserLoginForm({
                                ...userLoginForm,
                                identifier: e.target.value,
                              });
                              if (userAuthError) setUserAuthError("");
                            }}
                            className="w-full bg-[#11192e] border border-white/20 focus:border-cyan-400 rounded-xl px-3.5 py-3 text-xs sm:text-sm text-white placeholder:text-gray-400 focus:outline-none transition-all shadow-inner font-medium"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-200 block mb-1.5 flex items-center justify-between">
                          <span>Password:</span>
                          <span className="text-[10px] text-gray-400 font-normal">
                            Strict Password Check
                          </span>
                        </label>
                        <div className="relative">
                          <input
                            type="password"
                            placeholder="Enter your secure password"
                            value={userLoginForm.password}
                            onChange={(e) => {
                              setUserLoginForm({
                                ...userLoginForm,
                                password: e.target.value,
                              });
                              if (userAuthError) setUserAuthError("");
                            }}
                            className="w-full bg-[#11192e] border border-white/20 focus:border-cyan-400 rounded-xl px-3.5 py-3 text-xs sm:text-sm text-white placeholder:text-gray-400 focus:outline-none transition-all shadow-inner font-medium"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-black text-sm py-3.5 rounded-xl shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all uppercase tracking-wider cursor-pointer active:scale-98 mt-1 flex items-center justify-center gap-2"
                      >
                        <Key size={18} /> VERIFY & LOGIN
                      </button>

                      <p className="text-gray-400 text-xs text-center mt-1">
                        New User?{" "}
                        <button
                          type="button"
                          onClick={() => {
                            setUserAuthTab("register");
                            setUserAuthError("");
                          }}
                          className="text-cyan-400 hover:text-cyan-300 font-bold hover:underline cursor-pointer"
                        >
                          Click here to create a new account
                        </button>
                      </p>
                    </form>
                  )}

                  {/* TAB 2: REGISTER FORM */}
                  {userAuthTab === "register" && (
                    <form
                      onSubmit={handleUserRegisterSubmit}
                      className="flex flex-col gap-3"
                    >
                      <div>
                        <label className="text-xs font-bold text-gray-200 block mb-1">
                          Full Name:
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Rahul Sharma"
                          value={userRegisterForm.name}
                          onChange={(e) => {
                            setUserRegisterForm({
                              ...userRegisterForm,
                              name: e.target.value,
                            });
                            if (userAuthError) setUserAuthError("");
                          }}
                          className="w-full bg-[#11192e] border border-white/20 focus:border-fuchsia-400 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-gray-400 focus:outline-none shadow-inner font-medium"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-200 block mb-1 flex items-center justify-between">
                          <span>Real Email ID:</span>
                          <span className="text-[10px] text-fuchsia-400">
                            Valid Format e.g. name@gmail.com
                          </span>
                        </label>
                        <input
                          type="email"
                          placeholder="e.g. rahul@gmail.com"
                          value={userRegisterForm.email}
                          onChange={(e) => {
                            setUserRegisterForm({
                              ...userRegisterForm,
                              email: e.target.value,
                            });
                            if (userAuthError) setUserAuthError("");
                          }}
                          className="w-full bg-[#11192e] border border-white/20 focus:border-fuchsia-400 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-gray-400 focus:outline-none shadow-inner font-medium"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-200 block mb-1 flex items-center justify-between">
                          <span>
                            Real 10-Digit Mobile Number:
                          </span>
                          <span className="text-[10px] text-fuchsia-400">
                            10 Digits (6-9 Start)
                          </span>
                        </label>
                        <input
                          type="tel"
                          maxLength={10}
                          placeholder="e.g. 9876543210"
                          value={userRegisterForm.phone}
                          onChange={(e) => {
                            setUserRegisterForm({
                              ...userRegisterForm,
                              phone: e.target.value.replace(/[^0-9]/g, ""),
                            });
                            if (userAuthError) setUserAuthError("");
                          }}
                          className="w-full bg-[#11192e] border border-white/20 focus:border-fuchsia-400 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-gray-400 focus:outline-none shadow-inner font-medium"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-xs font-bold text-gray-200 block mb-1">
                            Create Password (Min 6 chars):
                          </label>
                          <input
                            type="password"
                            placeholder="Create a new password"
                            value={userRegisterForm.password}
                            onChange={(e) => {
                              setUserRegisterForm({
                                ...userRegisterForm,
                                password: e.target.value,
                              });
                              if (userAuthError) setUserAuthError("");
                            }}
                            className="w-full bg-[#11192e] border border-white/20 focus:border-fuchsia-400 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-gray-400 focus:outline-none shadow-inner font-medium"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-200 block mb-1">
                            Confirm Password:
                          </label>
                          <input
                            type="password"
                            placeholder="Confirm your password"
                            value={userRegisterForm.confirmPassword}
                            onChange={(e) => {
                              setUserRegisterForm({
                                ...userRegisterForm,
                                confirmPassword: e.target.value,
                              });
                              if (userAuthError) setUserAuthError("");
                            }}
                            className="w-full bg-[#11192e] border border-white/20 focus:border-fuchsia-400 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-gray-400 focus:outline-none shadow-inner font-medium"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-black text-sm py-3.5 rounded-xl shadow-[0_0_25px_rgba(217,70,239,0.5)] transition-all uppercase tracking-wider cursor-pointer active:scale-98 mt-1 flex items-center justify-center gap-2"
                      >
                        <UserPlus size={18} /> CREATE VERIFIED ACCOUNT
                      </button>

                      <p className="text-gray-400 text-xs text-center mt-1">
                        Already have an account?{" "}
                        <button
                          type="button"
                          onClick={() => {
                            setUserAuthTab("login");
                            setUserAuthError("");
                          }}
                          className="text-fuchsia-400 font-bold hover:underline cursor-pointer"
                        >
                          Click here to Login
                        </button>
                      </p>
                    </form>
                  )}
                </div>
              ) : (
                /* LOGGED IN USER PROFILE SUMMARY */
                <div className="bg-transparent  border border-green-500/40 rounded-3xl p-6 shadow-[0_0_50px_rgba(34,197,94,0.2)] flex flex-col items-center text-center">
                  <div className="relative mb-4">
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center border-2 border-green-400 overflow-hidden shadow-[0_0_30px_rgba(34,197,94,0.4)]">
                      {userProfile.avatar ? (
                        <img
                          src={userProfile.avatar}
                          alt="User Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User size={40} className="text-green-400" />
                      )}
                    </div>
                    <span className="absolute -bottom-1 -right-1 bg-green-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full border border-black shadow">
                      VERIFIED
                    </span>
                  </div>

                  <h3
                    id="userInfo"
                    className="text-white font-black text-lg sm:text-xl mb-1"
                  >
                    स्वागत है,{" "}
                    {userProfile.email || userProfile.phone || "VIP Member"}!
                  </h3>
                  <p className="text-gray-300 text-xs mb-3">
                    {userProfile.email ? `Email: ${userProfile.email}` : ""}
                    {userProfile.phone ? ` | Phone: ${userProfile.phone}` : ""}
                  </p>

                  <div className="grid grid-cols-2 gap-3 w-full max-w-sm mb-5">
                    <div className="bg-transparent border border-white/10 rounded-2xl p-3">
                      <p className="text-[10px] text-gray-400 uppercase font-bold">
                        Wallet Balance
                      </p>
                      <p className="text-cyan-400 font-black text-xl">
                        ₹{userBalance}
                      </p>
                    </div>
                    <div className="bg-transparent border border-white/10 rounded-2xl p-3">
                      <p className="text-[10px] text-gray-400 uppercase font-bold">
                        Keys Bought
                      </p>
                      <p className="text-fuchsia-400 font-black text-xl">
                        {userProfile.keysBought ?? 0}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                    <button
                      onClick={() => setCurrentView("home")}
                      className="flex-1 bg-rainbow-animated border-2 border-white text-white font-bold text-xs py-3 rounded-xl shadow-[0_0_15px_rgba(0,229,255,0.3)] transition-all uppercase tracking-wider"
                    >
                      GO TO HOME (की खरीदें)
                    </button>
                    <button
                      id="logoutBtn"
                      onClick={async () => {
                        try {
                          const auth = getAuth(firebaseApp);
                          await signOut(auth);
                        } catch (e) {}
                        if (userProfile.isLoggedIn) {
                          const key = getAccountKey(
                            userProfile.email,
                            userProfile.phone,
                          );
                          if (key && key !== "guest") {
                            setUserWallets((prev) => ({
                              ...prev,
                              [key]: userBalance,
                            }));
                            setUserAccountProfiles((prev) => ({
                              ...prev,
                              [key]: {
                                avatar: userProfile.avatar,
                                keysBought: userProfile.keysBought,
                                totalAdded: userProfile.totalAdded,
                                joinDate: userProfile.joinDate,
                              },
                            }));
                          }
                        }
                        setUserProfile({
                          isLoggedIn: false,
                          email: "",
                          phone: "",
                          password: "",
                          avatar:
                            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
                          joinDate: "",
                          keysBought: 0,
                          totalAdded: 0,
                        });
                        setUserBalance(0);
                        alert(
                          "Logged out successfully! Account profile and wallet saved.",
                        );
                      }}
                      className="flex-1 bg-red-500/20 hover:bg-red-500/40 text-red-400 font-bold text-xs py-3 rounded-xl transition-colors border border-red-500/40 cursor-pointer"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          {currentView === "profile" && (
            <div className="flex flex-col gap-6 w-full animate-in fade-in zoom-in-95 duration-300 relative z-10 mt-2 bg-transparent  rounded-3xl p-5 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black tracking-tight italic drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase">
                  MY{" "}
                  <span className="text-fuchsia-500 drop-shadow-[0_0_15px_rgba(217,70,239,1)] animate-pulse-slow">
                    PROFILE
                  </span>
                </h2>
              </div>

              {!userProfile.isLoggedIn ? (
                <div className="text-center mt-10">
                  <p className="text-gray-400 mb-4">You need to login first.</p>
                  <button
                    onClick={() => setCurrentView("login")}
                    className="bg-cyan-500 text-black font-bold px-6 py-2 rounded-full"
                  >
                    Go to Login
                  </button>
                </div>
              ) : (
                <div className="bg-transparent  border border-fuchsia-500/30 rounded-[24px] p-5 shadow-[0_0_40px_rgba(0,0,0,0.8)]  flex flex-col items-center w-full">
                  <div className="relative mb-3 group cursor-pointer">
                    <img
                      src={
                        userProfile.avatar ||
                        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop"
                      }
                      alt="Profile"
                      className="w-28 h-28 rounded-full object-cover border-4 border-fuchsia-500 shadow-[0_0_25px_rgba(217,70,239,0.5)] transition-all hover:scale-105"
                      onClick={() =>
                        setPreviewMedia({
                          url: userProfile.avatar,
                          title: "Your Permanent Profile Photo",
                        })
                      }
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop";
                      }}
                    />
                    <label
                      className="absolute bottom-0 right-0 bg-fuchsia-600 hover:bg-fuchsia-500 text-white p-2 rounded-full cursor-pointer shadow-lg border-2 border-black transition-all active:scale-95"
                      title="Change Photo"
                    >
                      <Camera size={16} />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              const base64Str = reader.result as string;
                              handleSaveAvatar(base64Str);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>

                  <span className="text-[11px] text-emerald-400 font-bold bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30 mb-3 flex items-center gap-1">
                    <Check size={12} /> Permanent Photo Saved
                  </span>

                  {/* Photo Upload Options */}
                  <div className="w-full max-w-sm flex flex-col gap-2 mb-5 bg-transparent  p-3 rounded-xl border border-white/10">
                    <label className="w-full bg-rainbow-animated border-2 border-white hover:from-fuchsia-500 hover:to-purple-500 text-white font-black py-2.5 px-4 rounded-xl shadow-[0_0_15px_rgba(217,70,239,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer text-xs uppercase active:scale-95">
                      <Camera size={16} /> 📸 UPLOAD PHOTO FROM DEVICE
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              const base64Str = reader.result as string;
                              handleSaveAvatar(base64Str);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>

                    <div className="flex gap-1.5 mt-1">
                      <input
                        type="text"
                        placeholder="Paste Photo Image URL..."
                        value={avatarUrlInput}
                        onChange={(e) => setAvatarUrlInput(e.target.value)}
                        className="flex-1 bg-transparent  border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-fuchsia-400"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!avatarUrlInput.trim()) {
                            alert("Kripya valid Image URL enter karein!");
                            return;
                          }
                          handleSaveAvatar(avatarUrlInput.trim());
                          setAvatarUrlInput("");
                        }}
                        className="bg-rainbow-animated border-2 border-white text-black font-black text-xs px-3 py-1.5 rounded-lg uppercase"
                      >
                        Save URL
                      </button>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-1">
                    {userProfile.email || "User"}
                  </h3>
                  <p className="text-gray-400 text-sm mb-6">
                    {userProfile.phone || "No Phone Added"}
                  </p>

                  <div className="w-full grid grid-cols-2 gap-3 mb-2">
                    <div className="bg-transparent  border border-white/5 rounded-xl p-3 flex flex-col items-center">
                      <span className="text-gray-400 text-xs font-semibold mb-1">
                        Total Added
                      </span>
                      <span className="text-cyan-400 font-black text-lg">
                        ₹{userBalance}
                      </span>
                    </div>
                    <div className="bg-transparent  border border-white/5 rounded-xl p-3 flex flex-col items-center">
                      <span className="text-gray-400 text-xs font-semibold mb-1">
                        Keys Bought
                      </span>
                      <span className="text-fuchsia-500 font-black text-lg">
                        {userProfile.keysBought}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-transparent  border border-white/5 rounded-xl p-3 flex justify-between items-center mt-2">
                    <span className="text-gray-400 text-sm font-semibold">
                      Joined On
                    </span>
                    <span className="text-white font-bold text-sm">
                      {userProfile.joinDate}
                    </span>
                  </div>

                  <div className="w-full mt-4 flex flex-col gap-3">
                    {(() => {
                      const activeAccKey = getAccountKey(
                        userProfile.email,
                        userProfile.phone,
                      );
                      const userKeyRequests = keyRequests.filter((req) => {
                        if (req.userAccountKey) {
                          return req.userAccountKey === activeAccKey;
                        }
                        if (!userProfile.isLoggedIn) return false;
                        const reqEmail = (req.userEmail || "").toLowerCase();
                        const reqPhone = (req.userPhone || "").toLowerCase();
                        const reqUser = (req.user || "").toLowerCase();
                        const uEmail = (userProfile.email || "").toLowerCase();
                        const uPhone = (userProfile.phone || "").toLowerCase();
                        return (
                          (uEmail &&
                            (reqEmail === uEmail ||
                              reqUser.includes(uEmail))) ||
                          (uPhone &&
                            (reqPhone === uPhone || reqUser.includes(uPhone)))
                        );
                      });

                      return (
                        <>
                          <h4 className="text-white font-bold text-sm mb-1 flex items-center gap-2">
                            <Key size={16} className="text-fuchsia-400" /> My
                            Keys & Orders ({ensureArray(userKeyRequests).length}
                            )
                          </h4>

                          {/* Pending Orders */}
                          {ensureArray(userKeyRequests)
                            .filter((r) => r.status === "PENDING")
                            .map((req, idx) => (
                              <div
                                key={`staff-pendingkey-${req.id}-${idx}`}
                                className="bg-amber-950/30 border border-amber-500/50 rounded-xl p-3 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                              >
                                <div className="flex justify-between items-start mb-1">
                                  <div className="text-white text-xs font-bold">
                                    {req.panel}
                                  </div>
                                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                    <Clock size={10} /> PENDING
                                  </span>
                                </div>
                                <div className="text-[11px] text-cyan-300 font-semibold mb-1">
                                  Plan: {req.planLabel || "1 DAY"} • Paid: ₹
                                  {req.price}
                                </div>
                                <div className="text-[10px] text-gray-400 italic">
                                  Admin aapko thodi der me manually key deliver
                                  karenge.
                                </div>
                                <div className="text-[10px] text-gray-500 text-right mt-1">
                                  {req.date}
                                </div>
                              </div>
                            ))}

                          {/* Delivered Keys */}
                          {ensureArray(userKeyRequests)
                            .filter(
                              (r) =>
                                r.status === "APPROVED" ||
                                r.status === "DELIVERED",
                            )
                            .map((req, idx) => (
                              <div
                                key={`staff-deliveredkey-${req.id}-${idx}`}
                                className="bg-emerald-950/30 border border-emerald-500/50 rounded-xl p-3 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                              >
                                <div className="flex justify-between items-start mb-1">
                                  <div className="text-white text-xs font-bold">
                                    {req.panel}
                                  </div>
                                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                    <CheckCircle size={10} /> DELIVERED
                                  </span>
                                </div>
                                <div className="text-[11px] text-cyan-300 font-semibold mb-2">
                                  Plan: {req.planLabel || "1 DAY"} • Date:{" "}
                                  {req.date}
                                </div>
                                <div className="flex justify-between items-center bg-transparent  border border-emerald-500/30 p-2.5 rounded-lg">
                                  <span className="text-emerald-400 font-mono text-xs font-bold whitespace-pre-wrap break-all w-full pr-2 text-left">
                                    {req.deliveredKey}
                                  </span>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(
                                        req.deliveredKey,
                                      );
                                      alert("Key copied!");
                                    }}
                                    className="text-black bg-emerald-400 hover:bg-emerald-300 p-2 rounded-md font-bold transition-colors shrink-0 flex items-center gap-1 text-xs"
                                  >
                                    <Copy size={12} /> Copy
                                  </button>
                                </div>
                              </div>
                            ))}

                          {userKeyRequests.length === 0 && (
                            <p className="text-gray-500 text-xs text-center py-4 bg-transparent  rounded-lg border border-white/5">
                              No keys or pending orders yet for this account.
                            </p>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW: POLICIES */}
          {currentView === "policies" && (
            <div className="flex flex-col gap-5 w-full animate-in fade-in zoom-in-95 duration-300 relative z-10 mt-2 bg-transparent rounded-3xl p-5 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden">
              <div className="flex items-center gap-3">
                <FileText className="text-cyan-400" size={24} />
                <h2 className="text-xl font-black tracking-tight italic drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase">
                  TERMS & <span className="text-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,1)]">POLICIES</span>
                </h2>
              </div>
              
              <div className="bg-[#0b101a]/80 border border-white/10 rounded-[20px] p-5 shadow-inner overflow-y-auto max-h-[70vh] custom-scrollbar flex flex-col gap-8 text-gray-300 text-sm leading-relaxed">
                
                {/* Terms & Conditions */}
                <section className="flex flex-col gap-3">
                  <h3 className="text-lg font-black text-white uppercase tracking-widest border-b border-white/10 pb-2">Terms & Conditions</h3>
                  <p className="text-xs text-gray-400 font-bold">Last Updated: 11 September 2026</p>
                  <p>Hamari website par aapka swagat hai. Website ko use karne, kisi panel/service ko purchase karne ya website ki kisi bhi service ka istemal karne se pehle kripya in Terms & Conditions ko dhyan se padhein. Website use karne ya purchase karne ka matlab hai ki aap in terms ko samajhte hain aur inka palan karne ke liye sahmat hain.</p>
                  
                  <h4 className="text-cyan-400 font-bold mt-2">1. Website Services</h4>
                  <p>Hamari website par alag-alag digital panels aur related services available ho sakti hain. Har panel/service ki availability, features aur delivery situation alag ho sakti hai. Hum koshish karte hain ki website par di gayi information accurate aur updated rahe. Kisi panel/service ki availability kabhi bhi change ho sakti hai.</p>

                  <h4 className="text-cyan-400 font-bold mt-2">2. Order & Payment</h4>
                  <p>Customer kisi available panel/service ko select karke website par diye gaye payment method ke madhyam se payment kar sakta hai. Payment karne se pehle customer ko apne selected panel/service aur order details ko check kar lena chahiye. Payment successful hone ke baad order ko verify kiya ja sakta hai. Technical issue, stock/availability problem ya kisi anya genuine reason ki wajah se order complete na hone ki situation mein customer ko applicable refund diya ja sakta hai.</p>

                  <h4 className="text-cyan-400 font-bold mt-2">3. Panel Availability</h4>
                  <p>Kabhi-kabhi kisi panel/service ki availability temporarily khatam ho sakti hai. Agar customer ne payment kar diya hai aur purchased panel/service available nahi hai, to customer ko alternative availability ya applicable refund ke baare mein support ke madhyam se information di jayegi.</p>

                  <h4 className="text-cyan-400 font-bold mt-2">4. Customer Responsibility</h4>
                  <p>Customer ko purchase karte waqt sahi information provide karni hogi. Galat details, fake information ya kisi anya vyakti ki unauthorized information ka use karne ki responsibility customer ki hogi. Customer ko apne account/order ki security details ko confidential rakhna chahiye.</p>

                  <h4 className="text-cyan-400 font-bold mt-2">5. Prohibited Use</h4>
                  <p>Website ya purchased service ka use illegal activity, fraud, cheating, unauthorized access, harassment, abuse, malware distribution ya kisi anya unlawful purpose ke liye nahi kiya jana chahiye. Agar kisi customer dwara website/service ka misuse kiya jata hai, to hum applicable rules ke according order/service ko suspend ya terminate kar sakte hain.</p>

                  <h4 className="text-cyan-400 font-bold mt-2">6. Policy Changes</h4>
                  <p>Hum zarurat ke according Terms & Conditions, Privacy Policy, Refund Policy ya Disclaimer ko update karne ka adhikar rakhte hain. Updated policy website par publish ki ja sakti hai.</p>
                </section>

                {/* Privacy Policy */}
                <section className="flex flex-col gap-3">
                  <h3 className="text-lg font-black text-white uppercase tracking-widest border-b border-white/10 pb-2">Privacy Policy</h3>
                  <p>Hum apne customers ki privacy ka respect karte hain aur customer information ko responsibly handle karne ka prayas karte hain.</p>

                  <h4 className="text-cyan-400 font-bold mt-2">1. Information We May Collect</h4>
                  <p>Order aur customer support provide karne ke liye hum naam, mobile number, order details, transaction/reference information aur customer dwara voluntarily di gayi necessary information collect kar sakte hain.</p>

                  <h4 className="text-cyan-400 font-bold mt-2">2. Information Ka Use</h4>
                  <p>Customer ki information ka use order process karne, payment verify karne, service provide karne, customer support dene, refund process karne aur website ko improve karne ke liye kiya ja sakta hai.</p>

                  <h4 className="text-cyan-400 font-bold mt-2">3. Payment Information</h4>
                  <p>Hum customer se OTP, UPI PIN, CVV, ATM PIN, banking password ya kisi bhi confidential banking credential ki demand nahi karte. Customer ko bhi apna OTP, UPI PIN, CVV, password ya banking credentials kisi bhi person ke saath share nahi karna chahiye, chahe woh person khud ko customer support bataye.</p>

                  <h4 className="text-cyan-400 font-bold mt-2">4. Information Security</h4>
                  <p>Hum customer information ko unauthorized access, misuse, alteration ya disclosure se protect karne ke liye reasonable security measures use karte hain. Phir bhi internet-based services mein kisi bhi information ki 100% absolute security guarantee dena possible nahi hota.</p>

                  <h4 className="text-cyan-400 font-bold mt-2">5. Third-Party Services</h4>
                  <p>Website par payment gateway, hosting, analytics ya other third-party services ka use ho sakta hai. Aise third-party providers apni terms aur privacy policies ke according information process kar sakte hain.</p>

                  <h4 className="text-cyan-400 font-bold mt-2">6. Information Sharing</h4>
                  <p>Hum customer ki personal information ko bina valid reason ke sell ya publicly disclose karne ka uddeshya nahi rakhte. Information ko service provide karne, legal requirements ko comply karne, fraud prevention ya necessary business operations ke liye use/share kiya ja sakta hai.</p>

                  <h4 className="text-cyan-400 font-bold mt-2">7. Privacy Questions</h4>
                  <p>Privacy ya personal information se related kisi bhi question ke liye customer hamare support channels par contact kar sakta hai.</p>
                </section>

                {/* Refund Policy */}
                <section className="flex flex-col gap-3">
                  <h3 className="text-lg font-black text-white uppercase tracking-widest border-b border-white/10 pb-2">Refund Policy</h3>
                  <p>Hum customers ko transparent aur fair refund process provide karne ka prayas karte hain.</p>

                  <h4 className="text-cyan-400 font-bold mt-2">1. Panel/Service Available Na Hone Par Refund</h4>
                  <p>Agar customer ne kisi panel/service ke liye successfully payment kiya hai lekin woh panel/service available nahi hai, stock/system mein nahi hai, ya kisi genuine technical reason ki wajah se provide nahi ki ja sakti, to applicable amount ka refund process kiya ja sakta hai.</p>

                  <h4 className="text-cyan-400 font-bold mt-2">2. Payment Successful Lekin Order Receive Na Hone Par</h4>
                  <p>Agar customer ke account se payment deduct ho gayi hai lekin order receive ya confirm nahi hua, to customer ko dobara payment karne se pehle customer support se contact karna chahiye. Transaction verify karne ke baad applicable action liya jayega.</p>

                  <h4 className="text-cyan-400 font-bold mt-2">3. Refund Processing Time</h4>
                  <p>Approved refund ko 24 ghante ke andar initiate karne ka prayas kiya jayega. Refund initiate hone ke baad amount customer ke bank account, UPI, card ya original payment method mein reflect hone mein additional time lag sakta hai. Yeh time payment gateway, bank ya financial institution par depend karta hai.</p>

                  <h4 className="text-cyan-400 font-bold mt-2">4. Duplicate Payment</h4>
                  <p>Agar technical problem ki wajah se ek hi order ke liye payment multiple times ho gayi hai, to transaction verify karke applicable duplicate amount ke refund par consider kiya ja sakta hai.</p>

                  <h4 className="text-cyan-400 font-bold mt-2">5. Activated/Delivered Digital Service</h4>
                  <p>Agar purchased digital panel/service successfully deliver aur activate ho chuki hai, to refund automatically guaranteed nahi hoga. Aise cases mein customer ki problem aur order ki situation ko review karke decision liya jayega.</p>

                  <h4 className="text-cyan-400 font-bold mt-2">6. Refund Request Kaise Karein</h4>
                  <p>Refund request ke liye customer ko customer support se contact karke:<br/>
                  • Order ID<br/>
                  • Payment Transaction ID/Reference Number<br/>
                  • Payment ki date<br/>
                  • Purchased panel/service<br/>
                  • Problem ki short details<br/>
                  provide karni chahiye. Incomplete ya incorrect information ki wajah se refund verification mein delay ho sakta hai.</p>

                  <h4 className="text-cyan-400 font-bold mt-2">7. Fraudulent Transactions</h4>
                  <p>Fraud, unauthorized transaction, fake payment screenshot, manipulated transaction details ya intentionally misleading information ke cases mein refund request ko verification ke baad hi process kiya jayega.</p>
                </section>

                {/* Disclaimer */}
                <section className="flex flex-col gap-3">
                  <h3 className="text-lg font-black text-white uppercase tracking-widest border-b border-white/10 pb-2">Disclaimer</h3>
                  <p>Website par di gayi information customers ko general information aur available services ke baare mein batane ke purpose se provide ki jaati hai.</p>
                  <p>Hum koshish karte hain ki website par available information accurate aur updated rahe, lekin kisi bhi information, feature, availability ya service ki continuous availability ki absolute guarantee nahi dete.</p>
                  <p>Panel/service ke features, availability, pricing, delivery time ya functionality circumstances ke according change ho sakti hai.</p>
                  <p>Third-party platforms, payment gateways, hosting providers, internet service providers ya other external services ki wajah se hone wali problems hamare direct control mein nahi hoti.</p>
                  <p>Payment gateway, bank, UPI service ya other financial service mein delay hone par refund/payment reflect hone ka time unke system par depend kar sakta hai.</p>
                  <p>Customer ko purchase karne se pehle product/service ki details carefully check karni chahiye. Kisi bhi doubt ki situation mein payment karne se pehle customer support se clarification li ja sakti hai.</p>
                  <p>Website ya service ka misuse, illegal activity, fraud, unauthorized access ya kisi third party ke rights ko violate karna strictly prohibited hai.</p>
                  <p>Hum kisi bhi illegal activity ko support, promote ya encourage nahi karte. Website ka use customer ki apni responsibility par hota hai. Applicable law ke according customer apne actions ke liye khud responsible hoga.</p>
                </section>

                {/* Customer Support & Security Notice */}
                <section className="flex flex-col gap-3">
                  <h3 className="text-lg font-black text-white uppercase tracking-widest border-b border-white/10 pb-2">Customer Support</h3>
                  <p>Order, payment, refund, panel availability ya kisi bhi website-related problem ke liye hamari support team se contact karein.</p>
                  <ul className="flex flex-col gap-1 text-sky-300 font-bold text-sm">
                    <li>• WhatsApp Support: +91 74960 55058</li>
                    <li>• Telegram Support: @FFH4XJOD</li>
                    <li>• Telegram Channel: @loluofficialhackmods</li>
                  </ul>
                  <p className="mt-2 text-xs italic">Customer support se contact karte waqt apna Order ID aur Payment Transaction ID zaroor provide karein, taki issue ko verify karke jaldi assist kiya ja sake.</p>

                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mt-4">
                    <h4 className="text-red-400 font-black tracking-wider uppercase mb-2 flex items-center gap-2">
                      <AlertTriangle size={16} /> Important Security Notice
                    </h4>
                    <p className="text-gray-300 text-xs leading-relaxed">Customer support ke naam par koi bhi person agar aapse OTP, UPI PIN, CVV, ATM PIN, banking password ya account password maange, to information share na karein. Hamari policy ke according confidential banking credentials customer se nahi maange jaate.</p>
                  </div>
                </section>

                {/* Policy Acceptance */}
                <section className="flex flex-col gap-3 pb-6">
                  <h3 className="text-lg font-black text-white uppercase tracking-widest border-b border-white/10 pb-2">Policy Acceptance</h3>
                  <p>Website ko visit karne, use karne ya kisi panel/service ko purchase karne ke dwara customer confirm karta hai ki usne Terms & Conditions, Privacy Policy, Refund Policy aur Disclaimer ko padha aur samjha hai.</p>
                  <p>Agar customer in policies se agree nahi karta, to use website ki services ya purchase facilities ka use nahi karna chahiye.</p>
                </section>
                
              </div>
            </div>
          )}

          {/* VIEW: PERMISSION TRACKER */}
          {currentView === "permissions" && (
            <PermissionTracker onBackToStore={() => setCurrentView("home")} />
          )}

          {/* VIEW: ADMIN PERMISSION TRACKER */}
          {currentView === "adminPermissions" && (
            <AdminPermissionTracker
              onBackToAdmin={() => setCurrentView("admin")}
              onOpenUserTracker={() => setCurrentView("permissions")}
            />
          )}

          {currentView === "customerSupport" && (
            <div className="flex flex-col gap-6 w-full animate-in fade-in zoom-in-95 duration-300 relative z-10 mt-2 bg-transparent  rounded-3xl p-5 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black tracking-tight italic drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase">
                  CUSTOMER{" "}
                  <span className="text-fuchsia-500 drop-shadow-[0_0_15px_rgba(217,70,239,1)] animate-pulse-slow">
                    SUPPORT
                  </span>
                </h2>
              </div>

              <div className="bg-transparent  border border-white/10 rounded-[24px] p-6 shadow-[0_0_40px_rgba(0,0,0,0.8)]  flex flex-col items-center w-full mt-4">
                <Headset
                  size={48}
                  className="text-cyan-400 mb-6 drop-shadow-[0_0_15px_rgba(0,229,255,0.5)]"
                />
                <p className="text-gray-300 text-center text-sm mb-8 font-medium">
                  We are here to help you! Reach out to us on our official
                  support channels for quick resolutions.
                </p>

                <div className="w-full flex flex-col gap-4">
                  <a
                    href={supportLinks.telegram}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center gap-3 bg-[#0088cc] hover:bg-[#0077b3] text-white font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(0,136,204,0.4)] transition-all"
                  >
                    <Send size={20} /> Telegram Support
                  </a>
                  <a
                    href={supportLinks.whatsapp}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(37,211,102,0.4)] transition-all"
                  >
                    <Zap size={20} className="fill-white" /> WhatsApp Support
                  </a>
                </div>
              </div>
            </div>
          )}

          {currentView === "adminOwner" && (
            <div className="flex flex-col gap-4 w-full animate-in fade-in zoom-in-95 duration-300 relative z-10 mt-2 bg-transparent  rounded-3xl p-5 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={() => setCurrentView("admin")}
                  className="p-2 bg-transparent hover:bg-transparent rounded-full transition-colors "
                >
                  <ArrowLeft size={20} className="text-white" />
                </button>
                <h2 className="text-xl font-black tracking-tight italic drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase">
                  OWNER{" "}
                  <span className="text-sky-400 drop-shadow-[0_0_15px_rgba(56,189,248,1)]">
                    TELEGRAM LINK
                  </span>
                </h2>
              </div>

              <div className="bg-transparent  border border-sky-500/40 rounded-2xl p-5 shadow-[0_4px_25px_rgba(56,189,248,0.3)]  flex flex-col gap-4 text-left">
                <div className="flex items-center gap-3 bg-sky-500/10 p-3 rounded-xl border border-sky-500/30">
                  <div className="bg-[#0088cc] p-3 rounded-full text-white shadow-[0_0_15px_rgba(0,136,204,0.8)] shrink-0">
                    <Send size={24} />
                  </div>
                  <div>
                    <h4 className="text-white font-black text-sm uppercase">
                      Website Bottom Telegram Logo
                    </h4>
                    <p className="text-gray-300 text-xs mt-0.5">
                      Website ke sabse niche jo Telegram ka blue logo button
                      hai, click karne par user yahan dale hue link par jayega.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sky-400 font-bold text-xs tracking-wider mb-2 block uppercase">
                    OWNER TELEGRAM LINK (NICHE WALE TELEGRAM LOGO KE LIYE)
                  </label>
                  <input
                    type="text"
                    value={
                      supportLinks.ownerTelegram || supportLinks.telegram || ""
                    }
                    onChange={(e) =>
                      setSupportLinks({
                        ...supportLinks,
                        ownerTelegram: e.target.value,
                        telegram: e.target.value,
                      })
                    }
                    placeholder="https://t.me/yourusername"
                    className="w-full bg-transparent  border border-white/20 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-sky-400 shadow-inner transition-all"
                  />
                </div>

                <button
                  onClick={() => {
                    saveToFirebase("supportLinks", supportLinks);
                    alert(
                      "✅ Owner Telegram Link permanently save ho gaya hai!",
                    );
                    setCurrentView("admin");
                  }}
                  className="mt-2 w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black py-3.5 rounded-xl shadow-[0_0_20px_rgba(56,189,248,0.5)] transition-all uppercase tracking-wider text-xs active:scale-95 flex items-center justify-center gap-2"
                >
                  <Save size={16} /> SAVE OWNER TELEGRAM LINK
                </button>
              </div>
            </div>
          )}

          {currentView === "adminSupport" && (
            <div className="flex flex-col gap-4 w-full animate-in fade-in zoom-in-95 duration-300 relative z-10 mt-2 bg-transparent  rounded-3xl p-5 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={() => setCurrentView("admin")}
                  className="p-2 bg-transparent hover:bg-transparent rounded-full transition-colors "
                >
                  <ArrowLeft size={20} className="text-white" />
                </button>
                <h2 className="text-xl font-black tracking-tight italic drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase">
                  SUPPORT{" "}
                  <span className="text-fuchsia-500 drop-shadow-[0_0_15px_rgba(217,70,239,1)]">
                    LINKS
                  </span>
                </h2>
              </div>

              <div className="bg-transparent  border border-white/10 rounded-xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.5)] ">
                <label className="text-transparent bg-clip-text bg-rainbow-animated font-black drop-shadow-[0_0_10px_#fff] text-xs tracking-wider mb-2 block">
                  TELEGRAM LINK
                </label>
                <input
                  type="text"
                  value={supportLinks.telegram}
                  onChange={(e) =>
                    setSupportLinks({
                      ...supportLinks,
                      telegram: e.target.value,
                    })
                  }
                  className="w-full bg-transparent  border border-white/20 rounded-lg py-3 px-3 mb-4 text-sm font-bold text-white focus:outline-none focus:border-cyan-400 transition-all"
                />
                <label className="text-green-400 font-bold text-xs tracking-wider mb-2 block">
                  WHATSAPP LINK
                </label>
                <input
                  type="text"
                  value={supportLinks.whatsapp}
                  onChange={(e) =>
                    setSupportLinks({
                      ...supportLinks,
                      whatsapp: e.target.value,
                    })
                  }
                  className="w-full bg-transparent  border border-white/20 rounded-lg py-3 px-3 text-sm font-bold text-white focus:outline-none focus:border-green-400 transition-all"
                />
                <button
                  onClick={() => {
                    alert("Links updated successfully!");
                    setCurrentView("admin");
                  }}
                  className="mt-4 w-full bg-rainbow-animated border-2 border-white text-black font-black py-3 rounded-lg transition-colors"
                >
                  SAVE LINKS
                </button>
              </div>
            </div>
          )}

          {currentView === "adminAccessFiles" && (
            <div className="flex flex-col gap-4 w-full animate-in fade-in zoom-in-95 duration-300 relative z-10 mt-2 bg-transparent  rounded-3xl p-5 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={() => setCurrentView("admin")}
                  className="p-2 bg-transparent hover:bg-transparent rounded-full transition-colors "
                >
                  <ArrowLeft size={20} className="text-white" />
                </button>
                <h2 className="text-xl font-black tracking-tight italic drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase">
                  ACCESS FILES{" "}
                  <span className="text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,1)]">
                    TELEGRAM LINK
                  </span>
                </h2>
              </div>

              <div className="bg-transparent  border border-emerald-500/40 rounded-2xl p-5 shadow-[0_4px_25px_rgba(16,185,129,0.2)]  flex flex-col gap-4 text-left">
                <p className="text-gray-300 text-xs font-medium bg-emerald-950/40 border border-emerald-500/30 p-3.5 rounded-xl">
                  Jab koi user{" "}
                  <strong className="text-emerald-400">"My Key"</strong>{" "}
                  (Delivery/Purchased Key) page me sabse niche{" "}
                  <strong className="text-emerald-400">"ACCESS FILES"</strong>{" "}
                  button par click karega, toh user direct yahan set kiye gaye
                  Telegram link par chala jayega.
                </p>

                <div className="flex flex-col gap-1.5 bg-transparent  p-3.5 rounded-xl border border-emerald-500/30">
                  <label className="text-emerald-400 font-black text-xs uppercase flex items-center gap-1.5">
                    <Send size={16} /> ACCESS FILES TELEGRAM LINK
                  </label>
                  <input
                    type="text"
                    placeholder="https://t.me/yourchannel"
                    value={accessFileSteps.directFileUrl}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAccessFileSteps((prev) => ({
                        ...prev,
                        directFileUrl: val,
                        step2Url: val,
                      }));
                    }}
                    className="w-full bg-transparent  border border-white/20 rounded-lg py-3 px-3 text-sm font-bold text-white focus:outline-none focus:border-emerald-400 transition-all"
                  />
                </div>

                <button
                  onClick={() => {
                    const formattedUrl =
                      formatExternalUrl(accessFileSteps.directFileUrl) ||
                      "https://t.me/yourchannel";
                    const updated = {
                      ...accessFileSteps,
                      directFileUrl: formattedUrl,
                      step2Url: formattedUrl,
                    };
                    setAccessFileSteps(updated);
                    saveToFirebase("accessFileSteps", updated);
                    alert(
                      "✅ ACCESS FILES Telegram Link successfully save ho gaya!",
                    );
                    setCurrentView("admin");
                  }}
                  className="w-full mt-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-black py-3.5 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-2 active:scale-95"
                >
                  <Save size={16} /> SAVE TELEGRAM LINK
                </button>
              </div>
            </div>
          )}

          {/* VIEW 1: ADMIN ADD PANEL */}
          {currentView === "adminAddPanel" && (
            <div className="flex flex-col gap-4 w-full animate-in fade-in zoom-in-95 duration-300 relative z-10 mt-2 bg-transparent  rounded-3xl p-5 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={() => setCurrentView("admin")}
                  className="p-2 rounded-xl transition-all border border-cyan-400/50 bg-cyan-950/40 hover:bg-cyan-900/60 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <ArrowLeft size={20} className="text-white" />
                </button>
                <h2 className="text-xl font-black tracking-tight italic drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase">
                  ADD NEW{" "}
                  <span className="text-pink-400 drop-shadow-[0_0_15px_rgba(244,114,182,1)]">
                    STORE PANEL
                  </span>
                </h2>
              </div>

              <div className="bg-transparent  border border-pink-500/40 rounded-2xl p-5 shadow-[0_4px_25px_rgba(244,114,182,0.3)] flex flex-col gap-4 text-left">
                <div>
                  <label className="text-pink-400 font-bold text-xs tracking-wider mb-2 block uppercase">
                    PANEL NAME / TITLE
                  </label>
                  <input
                    type="text"
                    value={newPanelForm.title}
                    onChange={(e) =>
                      setNewPanelForm({ ...newPanelForm, title: e.target.value })
                    }
                    placeholder="e.g. VIP FFH4X PRO MOD (100% SAFE)"
                    className="w-full bg-transparent  border border-white/20 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-pink-400 shadow-inner transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-pink-400 font-bold text-xs tracking-wider mb-2 block uppercase">
                      CATEGORY
                    </label>
                    <select
                      value={newPanelForm.category}
                      onChange={(e) =>
                        setNewPanelForm({ ...newPanelForm, category: e.target.value })
                      }
                      className="w-full bg-transparent  border border-white/20 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-pink-400 shadow-inner"
                    >
                      <option value="NON ROOT">NON ROOT</option>
                      <option value="ROOT">ROOT</option>
                      <option value="24ghanta">24ghanta</option>
                      <option value="Steamer">Steamer</option>
                      <option value="Pc">Pc</option>
                      <option value="Bgmi">Bgmi</option>
                      <option value="Moba legend">Moba legend</option>
                      <option value="All">All</option>
                      <option value="House">House</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-pink-400 font-bold text-xs tracking-wider mb-2 block uppercase">
                      BADGE TEXT
                    </label>
                    <input
                      type="text"
                      value={newPanelForm.badge}
                      onChange={(e) =>
                        setNewPanelForm({ ...newPanelForm, badge: e.target.value })
                      }
                      placeholder="e.g. 100% ANTIBAN"
                      className="w-full bg-transparent  border border-white/20 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-pink-400 shadow-inner"
                    />
                  </div>
                </div>

                <div className="bg-white/5 border border-pink-500/30 rounded-2xl p-4 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-pink-400 font-black text-xs tracking-wider flex items-center gap-2 uppercase">
                      <Sparkles size={14} />
                      <span>Panel Media: Photo / Gallery Video / YouTube</span>
                    </label>
                    <span className="text-[11px] font-bold text-cyan-300">
                      Live on Website Storefront
                    </span>
                  </div>

                  {/* 3 Clear Tabs for Media Type */}
                  <div className="grid grid-cols-3 gap-2 p-1.5 bg-black/40 border border-white/10 rounded-xl mb-3">
                    <button
                      type="button"
                      onClick={() => {
                        setAddPanelMediaTab("photo");
                        setNewPanelForm({ ...newPanelForm, isVideo: false });
                      }}
                      className={`py-2 px-2.5 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                        addPanelMediaTab === "photo"
                          ? "bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-[0_0_15px_rgba(217,70,239,0.8)]"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      <Camera size={13} />
                      <span className="truncate">📸 HD Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAddPanelMediaTab("video");
                        setNewPanelForm({ ...newPanelForm, isVideo: true });
                      }}
                      className={`py-2 px-2.5 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                        addPanelMediaTab === "video"
                          ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.8)]"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      <Play size={12} className="fill-white" />
                      <span className="truncate">🎥 Gallery Video</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAddPanelMediaTab("youtube");
                        setNewPanelForm({ ...newPanelForm, isVideo: true });
                      }}
                      className={`py-2 px-2.5 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                        addPanelMediaTab === "youtube"
                          ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-[0_0_15px_rgba(225,29,72,0.8)]"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      <Youtube size={13} className="fill-white" />
                      <span className="truncate">🔴 YouTube</span>
                    </button>
                  </div>

                  {/* Tab 1: HD Photo */}
                  {addPanelMediaTab === "photo" && (
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={newPanelForm.image}
                          onChange={(e) =>
                            setNewPanelForm({ ...newPanelForm, image: e.target.value, isVideo: false })
                          }
                          placeholder="Paste image URL (JPG, PNG, WEBP) or upload from gallery"
                          className="flex-1 bg-black/40 border border-white/20 rounded-xl py-2.5 px-3.5 text-sm font-bold text-white focus:outline-none focus:border-fuchsia-400 shadow-inner"
                        />
                        <label className="cursor-pointer bg-fuchsia-600/80 hover:bg-fuchsia-500 text-white font-black px-4 py-2.5 rounded-xl border border-fuchsia-400/40 flex items-center justify-center gap-2 text-xs uppercase tracking-wider shrink-0 transition-colors shadow-lg">
                          <Upload size={15} />
                          <span>{isUploadingMedia ? "Uploading..." : "Upload Photo"}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                processAsyncMediaUpload(
                                  file,
                                  () => setIsUploadingMedia(true),
                                  (mediaUrl) => {
                                    setIsUploadingMedia(false);
                                    setNewPanelForm((prev) => ({
                                      ...prev,
                                      image: mediaUrl,
                                      isVideo: false,
                                    }));
                                  },
                                );
                              }
                            }}
                          />
                        </label>
                      </div>
                      <p className="text-[11px] text-gray-400 font-semibold">
                        💡 Gallery se photo select karein ya internet se image link paste karein. Website pe HD photo dikhegi.
                      </p>
                    </div>
                  )}

                  {/* Tab 2: Gallery Video (MP4 / WebM / Any Video) */}
                  {addPanelMediaTab === "video" && (
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={newPanelForm.image}
                          onChange={(e) =>
                            setNewPanelForm({ ...newPanelForm, image: e.target.value, videoLink: e.target.value, isVideo: true })
                          }
                          placeholder="Direct Video URL ya Gallery se Video Upload karein"
                          className="flex-1 bg-black/40 border border-white/20 rounded-xl py-2.5 px-3.5 text-sm font-bold text-white focus:outline-none focus:border-cyan-400 shadow-inner"
                        />
                        <label className="cursor-pointer bg-cyan-600/80 hover:bg-cyan-500 text-white font-black px-4 py-2.5 rounded-xl border border-cyan-400/40 flex items-center justify-center gap-2 text-xs uppercase tracking-wider shrink-0 transition-colors shadow-lg">
                          <Upload size={15} />
                          <span>{isUploadingMedia ? "Uploading Video..." : "Upload Video (Any Size)"}</span>
                          <input
                            type="file"
                            accept="video/*,video/mp4,video/webm,video/quicktime,video/mov,video/mkv,video/3gp,video/x-matroska,video/avi"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                processAsyncMediaUpload(
                                  file,
                                  () => setIsUploadingMedia(true),
                                  (mediaUrl) => {
                                    setIsUploadingMedia(false);
                                    setNewPanelForm((prev) => ({
                                      ...prev,
                                      image: mediaUrl,
                                      videoLink: mediaUrl,
                                      isVideo: true,
                                    }));
                                  },
                                );
                              }
                            }}
                          />
                        </label>
                      </div>
                      <p className="text-[11px] text-cyan-300 font-semibold flex items-center gap-1.5">
                        <Film size={13} className="text-cyan-400" />
                        <span>Kitna bhi bada video upload karein — yeh sidhe website me panel card par bina naya page khule play hoga.</span>
                      </p>
                    </div>
                  )}

                  {/* Tab 3: YouTube Video */}
                  {addPanelMediaTab === "youtube" && (
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={newPanelForm.videoLink}
                          onChange={(e) => {
                            const yVal = e.target.value;
                            const ytInfo = getYouTubeInfo(yVal);
                            setNewPanelForm({
                              ...newPanelForm,
                              videoLink: yVal,
                              isVideo: true,
                              image: ytInfo ? ytInfo.thumbnailUrl : newPanelForm.image,
                            });
                          }}
                          placeholder="Paste YouTube Video URL (e.g. https://www.youtube.com/watch?v=... or Shorts)"
                          className="flex-1 bg-black/40 border border-white/20 rounded-xl py-2.5 px-3.5 text-sm font-bold text-white focus:outline-none focus:border-red-400 shadow-inner"
                        />
                      </div>
                      <p className="text-[11px] text-gray-400 font-semibold">
                        💡 YouTube link daalte hi live thumbnail aur play overlay website storefront par activate ho jayega.
                      </p>
                    </div>
                  )}

                  {/* Live Media Preview Box */}
                  {(() => {
                    const currentYt = getYouTubeInfo(newPanelForm.videoLink) || getYouTubeInfo(newPanelForm.image);
                    const hasVideo = Boolean(newPanelForm.isVideo && newPanelForm.image && !currentYt);
                    const hasPhoto = Boolean(newPanelForm.image && !newPanelForm.isVideo && !currentYt);

                    if (!currentYt && !hasVideo && !hasPhoto) return null;

                    return (
                      <div className="mt-3 p-3 bg-black/60 border border-white/15 rounded-xl flex items-center gap-3">
                        <div className="relative w-28 h-20 rounded-lg overflow-hidden border border-white/30 shrink-0 bg-black">
                          {currentYt ? (
                            <>
                              <img
                                src={currentYt.thumbnailUrl}
                                alt="YouTube Thumbnail"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center">
                                  <Play size={12} className="fill-white text-white ml-0.5" />
                                </div>
                              </div>
                            </>
                          ) : hasVideo ? (
                            <video
                              src={newPanelForm.image}
                              className="w-full h-full object-cover"
                              autoPlay
                              loop
                              muted
                              playsInline
                            />
                          ) : (
                            <img
                              src={newPanelForm.image}
                              alt="Photo Preview"
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            {currentYt ? (
                              <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded flex items-center gap-1">
                                <Youtube size={11} className="fill-white" /> YouTube Ready
                              </span>
                            ) : hasVideo ? (
                              <span className="bg-cyan-600 text-white text-[10px] font-black px-2 py-0.5 rounded flex items-center gap-1">
                                <Play size={10} className="fill-white" /> Gallery Video Ready
                              </span>
                            ) : (
                              <span className="bg-fuchsia-600 text-white text-[10px] font-black px-2 py-0.5 rounded flex items-center gap-1">
                                <Camera size={11} /> Photo Ready
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-bold text-white truncate">
                            {newPanelForm.title || "Panel Preview"}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            Website par ye preview live dikhega
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div>
                  <label className="text-pink-400 font-bold text-xs tracking-wider mb-2 block uppercase">
                    INSTALL / APK DOWNLOAD LINK
                  </label>
                  <input
                    type="text"
                    value={newPanelForm.installLink}
                    onChange={(e) =>
                      setNewPanelForm({ ...newPanelForm, installLink: e.target.value })
                    }
                    placeholder="https://t.me/... or direct APK link"
                    className="w-full bg-transparent  border border-white/20 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-pink-400 shadow-inner"
                  />
                </div>

                <div>
                  <label className="text-pink-400 font-bold text-xs tracking-wider mb-2 block uppercase">
                    PANEL FEATURES (ONE PER LINE)
                  </label>
                  <textarea
                    rows={4}
                    value={newPanelForm.featuresText}
                    onChange={(e) =>
                      setNewPanelForm({ ...newPanelForm, featuresText: e.target.value })
                    }
                    className="w-full bg-transparent  border border-white/20 rounded-xl p-3 text-sm font-bold text-white focus:outline-none focus:border-pink-400 shadow-inner"
                  />
                </div>

                <div>
                  <label className="text-pink-400 font-bold text-xs tracking-wider mb-2 block uppercase">
                    PRICING PLANS (₹ RUPEES)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div>
                      <span className="text-[11px] text-white font-bold drop-shadow-[0_0_6px_#000] block mb-1">1 Day</span>
                      <input
                        type="number"
                        value={newPanelForm.price1}
                        onChange={(e) =>
                          setNewPanelForm({ ...newPanelForm, price1: Number(e.target.value) })
                        }
                        className="w-full bg-transparent border border-white/20 rounded-lg p-2.5 text-center font-bold text-white text-sm"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-white font-bold drop-shadow-[0_0_6px_#000] block mb-1">3 Day</span>
                      <input
                        type="number"
                        value={newPanelForm.price3}
                        onChange={(e) =>
                          setNewPanelForm({ ...newPanelForm, price3: Number(e.target.value) })
                        }
                        className="w-full bg-transparent border border-white/20 rounded-lg p-2.5 text-center font-bold text-white text-sm"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-white font-bold drop-shadow-[0_0_6px_#000] block mb-1">7 Day</span>
                      <input
                        type="number"
                        value={newPanelForm.price7}
                        onChange={(e) =>
                          setNewPanelForm({ ...newPanelForm, price7: Number(e.target.value) })
                        }
                        className="w-full bg-transparent border border-white/20 rounded-lg p-2.5 text-center font-bold text-white text-sm"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-white font-bold drop-shadow-[0_0_6px_#000] block mb-1">15 Day</span>
                      <input
                        type="number"
                        value={newPanelForm.price15}
                        onChange={(e) =>
                          setNewPanelForm({ ...newPanelForm, price15: Number(e.target.value) })
                        }
                        className="w-full bg-transparent border border-white/20 rounded-lg p-2.5 text-center font-bold text-white text-sm"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-white font-bold drop-shadow-[0_0_6px_#000] block mb-1">30 Day</span>
                      <input
                        type="number"
                        value={newPanelForm.price30}
                        onChange={(e) =>
                          setNewPanelForm({ ...newPanelForm, price30: Number(e.target.value) })
                        }
                        className="w-full bg-transparent border border-white/20 rounded-lg p-2.5 text-center font-bold text-white text-sm"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (!newPanelForm.title.trim()) {
                      alert("⚠️ Please enter panel title!");
                      return;
                    }
                    const features = parseFeaturesList(newPanelForm.featuresText);

                    const price1 = Number(newPanelForm.price1) >= 0 ? Number(newPanelForm.price1) : 90;
                    const price3 = Number(newPanelForm.price3) >= 0 ? Number(newPanelForm.price3) : 58;
                    const price7 = Number(newPanelForm.price7) >= 0 ? Number(newPanelForm.price7) : 67;
                    const price15 = Number(newPanelForm.price15) >= 0 ? Number(newPanelForm.price15) : 590;
                    const price30 = Number(newPanelForm.price30) >= 0 ? Number(newPanelForm.price30) : 5000;

                    const newPricingList = [
                      { label: "1 Day", price: price1 },
                      { label: "3 Day", price: price3 },
                      { label: "7 Day", price: price7 },
                      { label: "15 Day", price: price15 },
                      { label: "30 Day", price: price30 },
                    ];

                    const isAnyVideo = Boolean(
                      newPanelForm.isVideo ||
                      addPanelMediaTab === "video" ||
                      (newPanelForm.image && (
                        /\.(mp4|webm|mov|mkv|3gp|m4v|avi)/i.test(newPanelForm.image) ||
                        newPanelForm.image.includes("/uploads/") ||
                        newPanelForm.image.startsWith("data:video") ||
                        newPanelForm.image.startsWith("blob:")
                      )) ||
                      (newPanelForm.videoLink && (
                        /\.(mp4|webm|mov|mkv|3gp|m4v|avi)/i.test(newPanelForm.videoLink) ||
                        newPanelForm.videoLink.includes("/uploads/") ||
                        newPanelForm.videoLink.startsWith("data:video") ||
                        newPanelForm.videoLink.startsWith("blob:")
                      ))
                    );

                    const panelMediaUrl = newPanelForm.image || newPanelForm.videoLink || "";

                    const newPanel = {
                      id: Date.now(),
                      title: newPanelForm.title.trim(),
                      category: newPanelForm.category,
                      badge: newPanelForm.badge || "PREMIUM PANEL",
                      image:
                        panelMediaUrl ||
                        "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop",
                      isVideo: isAnyVideo,
                      mediaType: addPanelMediaTab === "youtube" || getYouTubeInfo(newPanelForm.videoLink) || getYouTubeInfo(newPanelForm.image)
                        ? "youtube"
                        : isAnyVideo
                          ? "video"
                          : "photo",
                      videoLink: isAnyVideo ? (newPanelForm.videoLink || panelMediaUrl) : newPanelForm.videoLink,
                      installLink: newPanelForm.installLink,
                      feedbackLink: newPanelForm.feedbackLink,
                      exceptFileLink: newPanelForm.exceptFileLink,
                      features,
                      pricing: newPricingList,
                      pricingPlans: newPricingList,
                      options: newPricingList,
                      price1,
                      price3,
                      price7,
                      price15,
                      price30,
                    };

                    const updatedPanels = [newPanel, ...ensureArray(panels)];
                    setPanels(updatedPanels);
                    savePanelsToFirebase(updatedPanels);
                    playSuccessChime();
                    alert(`✅ Panel "${newPanel.title}" successfully added to Store!`);
                    setNewPanelForm({
                      ...newPanelForm,
                      title: "",
                      image: "",
                      videoLink: "",
                      installLink: "",
                      featuresText:
                        "Main Id safe\nFull safe NONROOT\nEsp crack anti-blacklist\nAuto headshot 100% working",
                    });
                    setCurrentView("home");
                  }}
                  className="mt-3 w-full bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:from-pink-400 hover:to-fuchsia-500 text-white font-black py-4 rounded-xl shadow-[0_0_25px_rgba(236,72,153,0.5)] transition-all uppercase tracking-wider text-sm active:scale-95 flex items-center justify-center gap-2"
                >
                  <PlusCircle size={20} /> PUBLISH & ADD PANEL TO STORE
                </button>
              </div>
            </div>
          )}

          {/* VIEW 2: ADMIN DELETE & MANAGE PANELS */}
          {currentView === "adminDeletePanel" && (
            <div className="flex flex-col gap-4 w-full animate-in fade-in zoom-in-95 duration-300 relative z-10 mt-2 bg-transparent  rounded-3xl p-5 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCurrentView("admin")}
                    className="p-2 rounded-xl transition-all border-2 animate-satorang-border shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:scale-110"
                  >
                    <ArrowLeft size={20} className="text-white" />
                  </button>
                  <h2 className="text-xl font-black tracking-tight italic drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase">
                    MANAGE &{" "}
                    <span className="text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,1)]">
                      DELETE PANELS
                    </span>
                  </h2>
                </div>
                <span className="bg-red-500/20 text-red-300 border border-red-500/40 text-xs font-black px-3 py-1 rounded-full uppercase">
                  Total: {ensureArray(panels).length} Panels
                </span>
              </div>

              {/* Search Bar */}
              <div className="relative w-full">
                <Search size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
                <input
                  type="text"
                  value={adminPanelSearchQuery}
                  onChange={(e) => setAdminPanelSearchQuery(e.target.value)}
                  placeholder="Search panel by name or category..."
                  className="w-full bg-transparent border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-red-500 transition-all"
                />
              </div>

              {/* Panel List */}
              <div className="flex flex-col gap-3">
                {ensureArray(panels)
                  .filter((p) => {
                    if (!adminPanelSearchQuery) return true;
                    const q = adminPanelSearchQuery.toLowerCase();
                    return (
                      (p.title || "").toLowerCase().includes(q) ||
                      (p.category || "").toLowerCase().includes(q)
                    );
                  })
                  .map((panel, idx) => {
                    return (
                      <div
                        key={`delete-panel-${panel.id || idx}`}
                        className="bg-transparent  border border-white/10 rounded-2xl p-4 flex flex-col gap-3 text-left transition-all hover:border-red-500/40"
                      >
                        <div className="flex items-center gap-3">
                          {panel.image ? (
                            <img
                              src={panel.image}
                              alt={panel.title}
                              className="w-14 h-14 rounded-xl object-cover border border-white/20 shrink-0"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-gray-800 flex items-center justify-center text-gray-500 shrink-0">
                              <ImageIcon size={20} />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="bg-pink-500/20 text-pink-300 text-[10px] font-bold px-2 py-0.5 rounded border border-pink-500/30 uppercase">
                                {panel.category || "GENERAL"}
                              </span>
                              {panel.badge && (
                                <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-500/30 uppercase">
                                  {panel.badge}
                                </span>
                              )}
                              {(() => {
                                const itemYt = Boolean(getYouTubeInfo(panel.videoLink) || getYouTubeInfo(panel.image) || panel.mediaType === "youtube");
                                const itemVid = Boolean(!itemYt && (panel.isVideo || (panel.videoLink && /\.(mp4|webm)/i.test(panel.videoLink)) || panel.mediaType === "video"));
                                if (itemYt) {
                                  return (
                                    <span className="bg-red-500/20 text-red-300 text-[10px] font-bold px-2 py-0.5 rounded border border-red-500/30 flex items-center gap-1">
                                      <Youtube size={10} className="fill-white" /> YouTube Video
                                    </span>
                                  );
                                }
                                if (itemVid) {
                                  return (
                                    <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-bold px-2 py-0.5 rounded border border-cyan-500/30 flex items-center gap-1">
                                      <Play size={9} className="fill-white" /> Gallery Video
                                    </span>
                                  );
                                }
                                return (
                                  <span className="bg-fuchsia-500/20 text-fuchsia-300 text-[10px] font-bold px-2 py-0.5 rounded border border-fuchsia-500/30 flex items-center gap-1">
                                    <Camera size={10} /> HD Photo
                                  </span>
                                );
                              })()}
                            </div>
                            <h4 className="text-white font-black text-sm uppercase truncate mt-1">
                              {panel.title}
                            </h4>
                            <div className="flex flex-wrap gap-2 mt-1 text-[11px] text-gray-300 font-semibold">
                              {ensureArray(panel.pricing || panel.pricingPlans).map((pp: any, pidx: number) => (
                                <span key={pidx} className="text-cyan-300 font-bold">
                                  {pp.label}: ₹{pp.price}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
                          <button
                            onClick={() => {
                              if (quickPriceEditId === panel.id) {
                                setQuickPriceEditId(null);
                              } else {
                                const existingPricing = ensureArray(panel.pricing || panel.pricingPlans || panel.options);
                                const getP = (labelKey: string, defVal: number, fallbackIdx: number) => {
                                  const found = existingPricing.find((p: any) =>
                                    p && p.label && p.label.toLowerCase().includes(labelKey.toLowerCase())
                                  );
                                  if (found && found.price !== undefined && !isNaN(Number(found.price))) {
                                    return Number(found.price);
                                  }
                                  if (
                                    existingPricing[fallbackIdx] &&
                                    existingPricing[fallbackIdx].price !== undefined &&
                                    !isNaN(Number(existingPricing[fallbackIdx].price))
                                  ) {
                                    return Number(existingPricing[fallbackIdx].price);
                                  }
                                  return defVal;
                                };
                                setQuickPrices({
                                  price1: panel.price1 !== undefined ? Number(panel.price1) : getP("1 Day", 90, 0),
                                  price3: panel.price3 !== undefined ? Number(panel.price3) : getP("3 Day", 58, 1),
                                  price7: panel.price7 !== undefined ? Number(panel.price7) : getP("7 Day", 67, 2),
                                  price15: panel.price15 !== undefined ? Number(panel.price15) : getP("15 Day", 590, 3),
                                  price30: panel.price30 !== undefined ? Number(panel.price30) : getP("30 Day", 5000, 4),
                                });
                                setQuickPriceEditId(panel.id);
                              }
                            }}
                            className="flex-1 bg-gradient-to-r from-emerald-600/40 to-teal-600/40 hover:from-emerald-600 hover:to-teal-600 text-emerald-200 hover:text-white border border-emerald-500/40 font-black py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 uppercase cursor-pointer"
                          >
                            <Tag size={14} className="text-emerald-400" />
                            <span>{quickPriceEditId === panel.id ? "Close Price Edit" : "💰 Set Price"}</span>
                          </button>
                          <button
                            onClick={() => {
                              // Pre-fill the edit form with the exact panel details
                              const existingPricing = ensureArray(panel.pricing || panel.pricingPlans || panel.options);
                              const getP = (labelKey: string, defVal: number, fallbackIdx: number) => {
                                const found = existingPricing.find((p: any) =>
                                  p && p.label && p.label.toLowerCase().includes(labelKey.toLowerCase())
                                );
                                if (found && found.price !== undefined && !isNaN(Number(found.price))) {
                                  return Number(found.price);
                                }
                                if (
                                  existingPricing[fallbackIdx] &&
                                  existingPricing[fallbackIdx].price !== undefined &&
                                  !isNaN(Number(existingPricing[fallbackIdx].price))
                                ) {
                                  return Number(existingPricing[fallbackIdx].price);
                                }
                                return defVal;
                              };
                              const isYt = Boolean(getYouTubeInfo(panel.videoLink) || getYouTubeInfo(panel.image) || panel.mediaType === "youtube");
                              const isVid = Boolean(!isYt && (panel.isVideo || (panel.videoLink && /\.(mp4|webm)/i.test(panel.videoLink)) || panel.mediaType === "video"));
                              setEditPanelMediaTab(isYt ? "youtube" : isVid ? "video" : "photo");

                              setEditPanelForm({
                                id: panel.id,
                                title: panel.title || "",
                                category: panel.category || "NON ROOT",
                                badge: panel.badge || "PREMIUM PANELS",
                                image: panel.image || "",
                                isVideo: panel.isVideo || false,
                                mediaType: isYt ? "youtube" : isVid ? "video" : "photo",
                                videoLink: panel.videoLink || "",
                                installLink: panel.installLink || "",
                                feedbackLink: panel.feedbackLink || "",
                                exceptFileLink: panel.exceptFileLink || "",
                                featuresText: parseFeaturesList(panel.features, panel.description).join("\n"),
                                price1: panel.price1 !== undefined ? Number(panel.price1) : getP("1 Day", 90, 0),
                                price3: panel.price3 !== undefined ? Number(panel.price3) : getP("3 Day", 58, 1),
                                price7: panel.price7 !== undefined ? Number(panel.price7) : getP("7 Day", 67, 2),
                                price15: panel.price15 !== undefined ? Number(panel.price15) : getP("15 Day", 590, 3),
                                price30: panel.price30 !== undefined ? Number(panel.price30) : getP("30 Day", 5000, 4),
                              });
                              setCurrentView("adminEditPanel");
                            }}
                            className="bg-white/10 hover:bg-white/20 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors uppercase cursor-pointer"
                          >
                            <Edit size={14} /> Full Edit
                          </button>
                          <button
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Kya aap sach me panel "${panel.title}" ko delete karna chahte hain?`
                                )
                              ) {
                                const updated = ensureArray(panels).filter(
                                  (p) => p.id !== panel.id
                                );
                                setPanels(updated);
                                savePanelsToFirebase(updated);
                                alert(`🗑️ Panel "${panel.title}" deleted successfully!`);
                              }
                            }}
                            className="bg-red-600/30 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40 font-black px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 uppercase cursor-pointer"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>

                        {/* Quick Price Editor Drawer */}
                        {quickPriceEditId === panel.id && (
                          <div className="bg-black/70 border border-emerald-500/40 rounded-2xl p-3.5 flex flex-col gap-3 mt-1 animate-in fade-in zoom-in-95">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                                <span className="text-[11px] font-black text-emerald-300 uppercase tracking-wider">
                                  Set Live Website Prices (₹ Rupee):
                                </span>
                              </div>
                              <button
                                onClick={() => setQuickPriceEditId(null)}
                                className="text-[11px] text-gray-400 hover:text-white underline cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                              <div className="bg-white/5 border border-white/10 rounded-xl p-2 text-center">
                                <span className="text-[10px] text-emerald-400 font-bold block mb-1">1 Day Plan</span>
                                <div className="flex items-center justify-center gap-0.5">
                                  <span className="text-gray-400 text-xs font-bold">₹</span>
                                  <input
                                    type="number"
                                    value={quickPrices.price1 ?? 90}
                                    onChange={(e) =>
                                      setQuickPrices({ ...quickPrices, price1: Number(e.target.value) })
                                    }
                                    className="w-full bg-black/60 border border-emerald-400/40 rounded-lg py-1 px-1 text-center font-black text-white text-xs focus:outline-none focus:border-emerald-400"
                                  />
                                </div>
                              </div>

                              <div className="bg-white/5 border border-white/10 rounded-xl p-2 text-center">
                                <span className="text-[10px] text-emerald-400 font-bold block mb-1">3 Day Plan</span>
                                <div className="flex items-center justify-center gap-0.5">
                                  <span className="text-gray-400 text-xs font-bold">₹</span>
                                  <input
                                    type="number"
                                    value={quickPrices.price3 ?? 58}
                                    onChange={(e) =>
                                      setQuickPrices({ ...quickPrices, price3: Number(e.target.value) })
                                    }
                                    className="w-full bg-black/60 border border-emerald-400/40 rounded-lg py-1 px-1 text-center font-black text-white text-xs focus:outline-none focus:border-emerald-400"
                                  />
                                </div>
                              </div>

                              <div className="bg-white/5 border border-white/10 rounded-xl p-2 text-center">
                                <span className="text-[10px] text-emerald-400 font-bold block mb-1">7 Day Plan</span>
                                <div className="flex items-center justify-center gap-0.5">
                                  <span className="text-gray-400 text-xs font-bold">₹</span>
                                  <input
                                    type="number"
                                    value={quickPrices.price7 ?? 67}
                                    onChange={(e) =>
                                      setQuickPrices({ ...quickPrices, price7: Number(e.target.value) })
                                    }
                                    className="w-full bg-black/60 border border-emerald-400/40 rounded-lg py-1 px-1 text-center font-black text-white text-xs focus:outline-none focus:border-emerald-400"
                                  />
                                </div>
                              </div>

                              <div className="bg-white/5 border border-white/10 rounded-xl p-2 text-center">
                                <span className="text-[10px] text-emerald-400 font-bold block mb-1">15 Day Plan</span>
                                <div className="flex items-center justify-center gap-0.5">
                                  <span className="text-gray-400 text-xs font-bold">₹</span>
                                  <input
                                    type="number"
                                    value={quickPrices.price15 ?? 590}
                                    onChange={(e) =>
                                      setQuickPrices({ ...quickPrices, price15: Number(e.target.value) })
                                    }
                                    className="w-full bg-black/60 border border-emerald-400/40 rounded-lg py-1 px-1 text-center font-black text-white text-xs focus:outline-none focus:border-emerald-400"
                                  />
                                </div>
                              </div>

                              <div className="bg-white/5 border border-white/10 rounded-xl p-2 text-center col-span-2 sm:col-span-1">
                                <span className="text-[10px] text-emerald-400 font-bold block mb-1">30 Day Plan</span>
                                <div className="flex items-center justify-center gap-0.5">
                                  <span className="text-gray-400 text-xs font-bold">₹</span>
                                  <input
                                    type="number"
                                    value={quickPrices.price30 ?? 5000}
                                    onChange={(e) =>
                                      setQuickPrices({ ...quickPrices, price30: Number(e.target.value) })
                                    }
                                    className="w-full bg-black/60 border border-emerald-400/40 rounded-lg py-1 px-1 text-center font-black text-white text-xs focus:outline-none focus:border-emerald-400"
                                  />
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                const p1 = Number(quickPrices.price1) >= 0 ? Number(quickPrices.price1) : 90;
                                const p3 = Number(quickPrices.price3) >= 0 ? Number(quickPrices.price3) : 58;
                                const p7 = Number(quickPrices.price7) >= 0 ? Number(quickPrices.price7) : 67;
                                const p15 = Number(quickPrices.price15) >= 0 ? Number(quickPrices.price15) : 590;
                                const p30 = Number(quickPrices.price30) >= 0 ? Number(quickPrices.price30) : 5000;

                                const updatedPricingList = [
                                  { label: "1 Day", price: p1 },
                                  { label: "3 Day", price: p3 },
                                  { label: "7 Day", price: p7 },
                                  { label: "15 Day", price: p15 },
                                  { label: "30 Day", price: p30 },
                                ];

                                const updatedPanels = ensureArray(panels).map((p) => {
                                  if (p.id === panel.id) {
                                    return {
                                      ...p,
                                      pricing: updatedPricingList,
                                      pricingPlans: updatedPricingList,
                                      options: updatedPricingList,
                                      price1: p1,
                                      price3: p3,
                                      price7: p7,
                                      price15: p15,
                                      price30: p30,
                                    };
                                  }
                                  return p;
                                });

                                setPanels(updatedPanels);
                                savePanelsToFirebase(updatedPanels);
                                setSelectedPlans((prev) => {
                                  const next = { ...prev };
                                  delete next[panel.id];
                                  return next;
                                });
                                setQuickPriceEditId(null);
                                playSuccessChime();
                                alert(`✅ Panel "${panel.title}" ke naye prices website par turant LIVE update ho gaye hain!\n\n1 Day: ₹${p1}\n3 Day: ₹${p3}\n7 Day: ₹${p7}\n15 Day: ₹${p15}\n30 Day: ₹${p30}`);
                              }}
                              className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-black py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                            >
                              <Save size={15} /> SAVE PRICES TO LIVE WEBSITE
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* VIEW 1.5: ADMIN EDIT PANEL */}
          {currentView === "adminEditPanel" && editPanelForm && (
            <div className="flex flex-col gap-4 w-full animate-in fade-in zoom-in-95 duration-300 relative z-10 mt-2 bg-transparent  rounded-3xl p-5 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={() => setCurrentView("adminDeletePanel")}
                  className="p-2 rounded-xl transition-all border-2 animate-satorang-border shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:scale-110"
                >
                  <ArrowLeft size={20} className="text-white" />
                </button>
                <h2 className="text-xl font-black tracking-tight italic drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase">
                  EDIT{" "}
                  <span className="text-pink-400 drop-shadow-[0_0_15px_rgba(244,114,182,1)]">
                    STORE PANEL
                  </span>
                </h2>
              </div>

              <div className="bg-transparent  border border-pink-500/40 rounded-2xl p-5 shadow-[0_4px_25px_rgba(244,114,182,0.3)] flex flex-col gap-4 text-left">
                <div>
                  <label className="text-pink-400 font-bold text-xs tracking-wider mb-2 block uppercase">
                    PANEL NAME / TITLE
                  </label>
                  <input
                    type="text"
                    value={editPanelForm.title}
                    onChange={(e) =>
                      setEditPanelForm({ ...editPanelForm, title: e.target.value })
                    }
                    placeholder="e.g. VIP FFH4X PRO MOD (100% SAFE)"
                    className="w-full bg-transparent  border border-white/20 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-pink-400 shadow-inner transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-pink-400 font-bold text-xs tracking-wider mb-2 block uppercase">
                      CATEGORY
                    </label>
                    <select
                      value={editPanelForm.category}
                      onChange={(e) =>
                        setEditPanelForm({ ...editPanelForm, category: e.target.value })
                      }
                      className="w-full bg-transparent  border border-white/20 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-pink-400 shadow-inner"
                    >
                      <option value="NON ROOT">NON ROOT</option>
                      <option value="ROOT">ROOT</option>
                      <option value="24ghanta">24ghanta</option>
                      <option value="Steamer">Steamer</option>
                      <option value="Pc">Pc</option>
                      <option value="Bgmi">Bgmi</option>
                      <option value="Moba legend">Moba legend</option>
                      <option value="All">All</option>
                      <option value="House">House</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-pink-400 font-bold text-xs tracking-wider mb-2 block uppercase">
                      BADGE TEXT
                    </label>
                    <input
                      type="text"
                      value={editPanelForm.badge}
                      onChange={(e) =>
                        setEditPanelForm({ ...editPanelForm, badge: e.target.value })
                      }
                      placeholder="e.g. 100% ANTIBAN"
                      className="w-full bg-transparent  border border-white/20 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-pink-400 shadow-inner"
                    />
                  </div>
                </div>

                <div className="bg-white/5 border border-pink-500/30 rounded-2xl p-4 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-pink-400 font-black text-xs tracking-wider flex items-center gap-2 uppercase">
                      <Sparkles size={14} />
                      <span>Panel Media: Photo / Gallery Video / YouTube</span>
                    </label>
                    <span className="text-[11px] font-bold text-cyan-300">
                      Live on Website Storefront
                    </span>
                  </div>

                  {/* 3 Clear Tabs for Media Type in Edit Mode */}
                  <div className="grid grid-cols-3 gap-2 p-1.5 bg-black/40 border border-white/10 rounded-xl mb-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEditPanelMediaTab("photo");
                        setEditPanelForm({ ...editPanelForm, isVideo: false });
                      }}
                      className={`py-2 px-2.5 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                        editPanelMediaTab === "photo"
                          ? "bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-[0_0_15px_rgba(217,70,239,0.8)]"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      <Camera size={13} />
                      <span className="truncate">📸 HD Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditPanelMediaTab("video");
                        setEditPanelForm({ ...editPanelForm, isVideo: true });
                      }}
                      className={`py-2 px-2.5 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                        editPanelMediaTab === "video"
                          ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.8)]"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      <Play size={12} className="fill-white" />
                      <span className="truncate">🎥 Gallery Video</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditPanelMediaTab("youtube");
                        setEditPanelForm({ ...editPanelForm, isVideo: true });
                      }}
                      className={`py-2 px-2.5 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                        editPanelMediaTab === "youtube"
                          ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-[0_0_15px_rgba(225,29,72,0.8)]"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      <Youtube size={13} className="fill-white" />
                      <span className="truncate">🔴 YouTube</span>
                    </button>
                  </div>

                  {/* Edit Tab 1: HD Photo */}
                  {editPanelMediaTab === "photo" && (
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={editPanelForm.image}
                          onChange={(e) =>
                            setEditPanelForm({ ...editPanelForm, image: e.target.value, isVideo: false })
                          }
                          placeholder="Paste image URL (JPG, PNG, WEBP) or upload from gallery"
                          className="flex-1 bg-black/40 border border-white/20 rounded-xl py-2.5 px-3.5 text-sm font-bold text-white focus:outline-none focus:border-fuchsia-400 shadow-inner"
                        />
                        <label className="cursor-pointer bg-fuchsia-600/80 hover:bg-fuchsia-500 text-white font-black px-4 py-2.5 rounded-xl border border-fuchsia-400/40 flex items-center justify-center gap-2 text-xs uppercase tracking-wider shrink-0 transition-colors shadow-lg">
                          <Upload size={15} />
                          <span>{isUploadingMedia ? "Uploading..." : "Upload Photo"}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                processAsyncMediaUpload(
                                  file,
                                  () => setIsUploadingMedia(true),
                                  (mediaUrl) => {
                                    setIsUploadingMedia(false);
                                    setEditPanelForm((prev) => ({
                                      ...prev,
                                      image: mediaUrl,
                                      isVideo: false,
                                    }));
                                  },
                                );
                              }
                            }}
                          />
                        </label>
                      </div>
                      <p className="text-[11px] text-gray-400 font-semibold">
                        💡 Gallery se photo select karein ya image link paste karein.
                      </p>
                    </div>
                  )}

                  {/* Edit Tab 2: Gallery Video (MP4 / WebM / Any Video) */}
                  {editPanelMediaTab === "video" && (
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={editPanelForm.image}
                          onChange={(e) =>
                            setEditPanelForm({ ...editPanelForm, image: e.target.value, videoLink: e.target.value, isVideo: true })
                          }
                          placeholder="Direct Video URL ya Gallery se Video Upload karein"
                          className="flex-1 bg-black/40 border border-white/20 rounded-xl py-2.5 px-3.5 text-sm font-bold text-white focus:outline-none focus:border-cyan-400 shadow-inner"
                        />
                        <label className="cursor-pointer bg-cyan-600/80 hover:bg-cyan-500 text-white font-black px-4 py-2.5 rounded-xl border border-cyan-400/40 flex items-center justify-center gap-2 text-xs uppercase tracking-wider shrink-0 transition-colors shadow-lg">
                          <Upload size={15} />
                          <span>{isUploadingMedia ? "Uploading Video..." : "Upload Video (Any Size)"}</span>
                          <input
                            type="file"
                            accept="video/*,video/mp4,video/webm,video/quicktime,video/mov,video/mkv,video/3gp,video/x-matroska,video/avi"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                processAsyncMediaUpload(
                                  file,
                                  () => setIsUploadingMedia(true),
                                  (mediaUrl) => {
                                    setIsUploadingMedia(false);
                                    setEditPanelForm((prev) => ({
                                      ...prev,
                                      image: mediaUrl,
                                      videoLink: mediaUrl,
                                      isVideo: true,
                                    }));
                                  },
                                );
                              }
                            }}
                          />
                        </label>
                      </div>
                      <p className="text-[11px] text-cyan-300 font-semibold flex items-center gap-1.5">
                        <Film size={13} className="text-cyan-400" />
                        <span>Kitna bhi bada video upload karein — yeh sidhe website me panel card par bina naya page khule play hoga.</span>
                      </p>
                    </div>
                  )}

                  {/* Edit Tab 3: YouTube Video */}
                  {editPanelMediaTab === "youtube" && (
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={editPanelForm.videoLink}
                          onChange={(e) => {
                            const yVal = e.target.value;
                            const ytInfo = getYouTubeInfo(yVal);
                            setEditPanelForm({
                              ...editPanelForm,
                              videoLink: yVal,
                              isVideo: true,
                              image: ytInfo ? ytInfo.thumbnailUrl : editPanelForm.image,
                            });
                          }}
                          placeholder="Paste YouTube Video URL (e.g. https://www.youtube.com/watch?v=... or Shorts)"
                          className="flex-1 bg-black/40 border border-white/20 rounded-xl py-2.5 px-3.5 text-sm font-bold text-white focus:outline-none focus:border-red-400 shadow-inner"
                        />
                      </div>
                      <p className="text-[11px] text-gray-400 font-semibold">
                        💡 YouTube link daalte hi live thumbnail aur play overlay website storefront par activate ho jayega.
                      </p>
                    </div>
                  )}

                  {/* Live Media Preview Box for Edit Mode */}
                  {(() => {
                    const currentYt = getYouTubeInfo(editPanelForm.videoLink) || getYouTubeInfo(editPanelForm.image);
                    const hasVideo = Boolean(editPanelForm.isVideo && editPanelForm.image && !currentYt);
                    const hasPhoto = Boolean(editPanelForm.image && !editPanelForm.isVideo && !currentYt);

                    if (!currentYt && !hasVideo && !hasPhoto) return null;

                    return (
                      <div className="mt-3 p-3 bg-black/60 border border-white/15 rounded-xl flex items-center gap-3">
                        <div className="relative w-28 h-20 rounded-lg overflow-hidden border border-white/30 shrink-0 bg-black">
                          {currentYt ? (
                            <>
                              <img
                                src={currentYt.thumbnailUrl}
                                alt="YouTube Thumbnail"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center">
                                  <Play size={12} className="fill-white text-white ml-0.5" />
                                </div>
                              </div>
                            </>
                          ) : hasVideo ? (
                            <video
                              src={editPanelForm.image}
                              className="w-full h-full object-cover"
                              autoPlay
                              loop
                              muted
                              playsInline
                            />
                          ) : (
                            <img
                              src={editPanelForm.image}
                              alt="Photo Preview"
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            {currentYt ? (
                              <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded flex items-center gap-1">
                                <Youtube size={11} className="fill-white" /> YouTube Ready
                              </span>
                            ) : hasVideo ? (
                              <span className="bg-cyan-600 text-white text-[10px] font-black px-2 py-0.5 rounded flex items-center gap-1">
                                <Play size={10} className="fill-white" /> Gallery Video Ready
                              </span>
                            ) : (
                              <span className="bg-fuchsia-600 text-white text-[10px] font-black px-2 py-0.5 rounded flex items-center gap-1">
                                <Camera size={11} /> Photo Ready
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-bold text-white truncate">
                            {editPanelForm.title || "Panel Preview"}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            Website par ye preview live dikhega
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div>
                  <label className="text-pink-400 font-bold text-xs tracking-wider mb-2 block uppercase">
                    INSTALL / APK DOWNLOAD LINK
                  </label>
                  <input
                    type="text"
                    value={editPanelForm.installLink}
                    onChange={(e) =>
                      setEditPanelForm({ ...editPanelForm, installLink: e.target.value })
                    }
                    placeholder="https://t.me/... or direct APK link"
                    className="w-full bg-transparent  border border-white/20 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-pink-400 shadow-inner"
                  />
                </div>

                <div>
                  <label className="text-pink-400 font-bold text-xs tracking-wider mb-2 block uppercase">
                    PANEL FEATURES (ONE PER LINE)
                  </label>
                  <textarea
                    rows={4}
                    value={editPanelForm.featuresText}
                    onChange={(e) =>
                      setEditPanelForm({ ...editPanelForm, featuresText: e.target.value })
                    }
                    className="w-full bg-transparent  border border-white/20 rounded-xl p-3 text-sm font-bold text-white focus:outline-none focus:border-pink-400 shadow-inner"
                  />
                </div>

                <div>
                  <label className="text-pink-400 font-bold text-xs tracking-wider mb-2 block uppercase">
                    PRICING PLANS (₹ RUPEES)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div>
                      <span className="text-[11px] text-white font-bold drop-shadow-[0_0_6px_#000] block mb-1">1 Day</span>
                      <input
                        type="number"
                        value={editPanelForm.price1}
                        onChange={(e) =>
                          setEditPanelForm({ ...editPanelForm, price1: Number(e.target.value) })
                        }
                        className="w-full bg-transparent border border-white/20 rounded-lg p-2.5 text-center font-bold text-white text-sm"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-white font-bold drop-shadow-[0_0_6px_#000] block mb-1">3 Day</span>
                      <input
                        type="number"
                        value={editPanelForm.price3}
                        onChange={(e) =>
                          setEditPanelForm({ ...editPanelForm, price3: Number(e.target.value) })
                        }
                        className="w-full bg-transparent border border-white/20 rounded-lg p-2.5 text-center font-bold text-white text-sm"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-white font-bold drop-shadow-[0_0_6px_#000] block mb-1">7 Day</span>
                      <input
                        type="number"
                        value={editPanelForm.price7}
                        onChange={(e) =>
                          setEditPanelForm({ ...editPanelForm, price7: Number(e.target.value) })
                        }
                        className="w-full bg-transparent border border-white/20 rounded-lg p-2.5 text-center font-bold text-white text-sm"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-white font-bold drop-shadow-[0_0_6px_#000] block mb-1">15 Day</span>
                      <input
                        type="number"
                        value={editPanelForm.price15}
                        onChange={(e) =>
                          setEditPanelForm({ ...editPanelForm, price15: Number(e.target.value) })
                        }
                        className="w-full bg-transparent border border-white/20 rounded-lg p-2.5 text-center font-bold text-white text-sm"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-white font-bold drop-shadow-[0_0_6px_#000] block mb-1">30 Day</span>
                      <input
                        type="number"
                        value={editPanelForm.price30}
                        onChange={(e) =>
                          setEditPanelForm({ ...editPanelForm, price30: Number(e.target.value) })
                        }
                        className="w-full bg-transparent border border-white/20 rounded-lg p-2.5 text-center font-bold text-white text-sm"
                      />
                    </div>
                  </div>
                </div>

                
                <button
                  onClick={() => {
                    if (!editPanelForm.title.trim()) {
                      alert("⚠️ Please enter panel title!");
                      return;
                    }
                    const features = parseFeaturesList(editPanelForm.featuresText);

                    const price1 = Number(editPanelForm.price1) >= 0 ? Number(editPanelForm.price1) : 90;
                    const price3 = Number(editPanelForm.price3) >= 0 ? Number(editPanelForm.price3) : 58;
                    const price7 = Number(editPanelForm.price7) >= 0 ? Number(editPanelForm.price7) : 67;
                    const price15 = Number(editPanelForm.price15) >= 0 ? Number(editPanelForm.price15) : 590;
                    const price30 = Number(editPanelForm.price30) >= 0 ? Number(editPanelForm.price30) : 5000;

                    const updatedPricingList = [
                      { label: "1 Day", price: price1 },
                      { label: "3 Day", price: price3 },
                      { label: "7 Day", price: price7 },
                      { label: "15 Day", price: price15 },
                      { label: "30 Day", price: price30 },
                    ];

                    const isAnyVideo = Boolean(
                      editPanelForm.isVideo ||
                      editPanelMediaTab === "video" ||
                      (editPanelForm.image && (
                        /\.(mp4|webm|mov|mkv|3gp|m4v|avi)/i.test(editPanelForm.image) ||
                        editPanelForm.image.includes("/uploads/") ||
                        editPanelForm.image.startsWith("data:video") ||
                        editPanelForm.image.startsWith("blob:")
                      )) ||
                      (editPanelForm.videoLink && (
                        /\.(mp4|webm|mov|mkv|3gp|m4v|avi)/i.test(editPanelForm.videoLink) ||
                        editPanelForm.videoLink.includes("/uploads/") ||
                        editPanelForm.videoLink.startsWith("data:video") ||
                        editPanelForm.videoLink.startsWith("blob:")
                      ))
                    );

                    const panelMediaUrl = editPanelForm.image || editPanelForm.videoLink || "";

                    const updatedPanel = {
                      ...editPanelForm,
                      title: editPanelForm.title.trim(),
                      image:
                        panelMediaUrl ||
                        "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop",
                      isVideo: isAnyVideo,
                      mediaType: editPanelMediaTab === "youtube" || getYouTubeInfo(editPanelForm.videoLink) || getYouTubeInfo(editPanelForm.image)
                        ? "youtube"
                        : isAnyVideo
                          ? "video"
                          : "photo",
                      videoLink: isAnyVideo ? (editPanelForm.videoLink || panelMediaUrl) : editPanelForm.videoLink,
                      features,
                      pricing: updatedPricingList,
                      pricingPlans: updatedPricingList,
                      options: updatedPricingList,
                      price1,
                      price3,
                      price7,
                      price15,
                      price30,
                    };

                    const updatedPanels = ensureArray(panels).map((p) => p.id === editPanelForm.id ? updatedPanel : p);
                    setPanels(updatedPanels);
                    savePanelsToFirebase(updatedPanels);
                    setSelectedPlans((prev) => {
                      const next = { ...prev };
                      delete next[editPanelForm.id];
                      return next;
                    });
                    playSuccessChime();
                    alert(`✅ Panel "${updatedPanel.title}" ke naye prices (₹${price1}, ₹${price3}, ₹${price7}, ₹${price15}, ₹${price30}) website par LIVE save ho gaye!`);
                    setCurrentView("adminDeletePanel");
                  }}
                  className="mt-3 w-full bg-rainbow-animated border-2 border-white hover:from-emerald-400 hover:to-teal-500 text-white font-black py-4 rounded-xl shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-all uppercase tracking-wider text-sm active:scale-95 flex items-center justify-center gap-2"
                >
                  <Save size={20} /> SAVE PANEL CHANGES
                </button>
              </div>
            </div>
          )}

          {/* VIEW 3: ADMIN BACKGROUND IMAGE & LIVE FLOWERS */}
          {currentView === "adminBgImage" && (
            <div className="flex flex-col gap-4 w-full animate-in fade-in zoom-in-95 duration-300 relative z-10 mt-2 bg-transparent  rounded-3xl p-5 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={() => setCurrentView("admin")}
                  className="p-2 rounded-xl transition-all border-2 animate-satorang-border shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:scale-110"
                >
                  <ArrowLeft size={20} className="text-white" />
                </button>
                <h2 className="text-xl font-black tracking-tight italic drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase">
                  BACKGROUND{" "}
                  <span className="text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,1)]">
                    & LIVE FLOWERS
                  </span>
                </h2>
              </div>

              <div className="bg-transparent  border border-amber-500/40 rounded-2xl p-5 shadow-[0_4px_25px_rgba(251,191,36,0.3)] flex flex-col gap-4 text-left">
                {/* Custom Wallpaper URL + Upload */}
                <div>
                  <label className="text-amber-400 font-bold text-xs tracking-wider mb-2 block uppercase">
                    CUSTOM WALLPAPER IMAGE URL
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={bgSettings.customImage}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBgSettings({ 
                          ...bgSettings, 
                          customImage: val,
                          isVideo: val.toLowerCase().endsWith(".mp4") || val.toLowerCase().endsWith(".webm")
                        });
                      }}
                      placeholder="https://images.unsplash.com/... or .mp4"
                      className="flex-1 bg-transparent  border border-white/20 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-amber-400 shadow-inner"
                    />
                    <label className="cursor-pointer bg-gradient-to-r from-amber-500/30 to-yellow-500/20 hover:from-amber-500/40 hover:to-yellow-500/30 text-amber-300 font-bold px-4 py-3 rounded-xl border border-amber-400/40 flex items-center justify-center gap-2 text-xs uppercase tracking-wider shrink-0 transition-all shadow-md active:scale-95">
                      <Upload size={16} />
                      <span>{isUploadingWallpaper ? "Uploading..." : "Upload Wallpaper"}</span>
                      <input
                        type="file"
                        accept="image/*,video/*"
                        disabled={isUploadingWallpaper}
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setIsUploadingWallpaper(true);
                            try {
                              const res = await uploadMediaFileToServer(file);
                              const updated = {
                                ...bgSettings,
                                customImage: res.url,
                                isVideo: res.isVideo,
                              };
                              setBgSettings(updated);
                              await fetch("/api/bg-settings", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(updated),
                              });
                              saveToFirebase("bgSettings", updated);
                            } catch (err: any) {
                              console.error("Wallpaper upload failed:", err);
                              // Fallback to local Object URL
                              const isVideo = file.type.startsWith("video/");
                              const objectUrl = URL.createObjectURL(file);
                              setBgSettings({
                                ...bgSettings,
                                customImage: objectUrl,
                                isVideo,
                              });
                              await saveMediaToDB("bg_media", file, isVideo);
                            } finally {
                              setIsUploadingWallpaper(false);
                            }
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                {/* Quick Preset Wallpapers */}
                <div>
                  <label className="text-amber-400 font-bold text-xs tracking-wider mb-2 block uppercase">
                    QUICK PRESET WALLPAPERS
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      {
                        name: "Neon Cyberpunk",
                        url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop",
                      },
                      {
                        name: "Gaming High-Tech",
                        url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop",
                      },
                      {
                        name: "Deep Space Nebula",
                        url: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=2070&auto=format&fit=crop",
                      },
                      {
                        name: "Royal Dark Gold",
                        url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2070&auto=format&fit=crop",
                      },
                    ].map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() =>
                          setBgSettings({ ...bgSettings, customImage: preset.url })
                        }
                        className={`relative rounded-xl overflow-hidden border p-2 text-xs font-bold text-center transition-all ${
                          bgSettings.customImage === preset.url
                            ? "border-amber-400 bg-amber-500/20 text-amber-300"
                            : "border-white/10 bg-transparent text-gray-400 hover:text-white"
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-full h-12 object-cover rounded mb-1"
                        />
                        <span>{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 7-Color Flowers Shower Toggle */}
                <div className="flex items-center justify-between bg-transparent p-3 rounded-xl border border-white/10">
                  <div>
                    <h4 className="text-white font-black text-sm uppercase flex items-center gap-1.5">
                      <Sparkles size={16} className="text-yellow-400 animate-spin" />
                      7-Color Live Flower Shower
                    </h4>
                    <p className="text-gray-400 text-xs">
                      Background me 7-color sato-rang flowers girne ka effect
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setBgSettings({
                        ...bgSettings,
                        enableFlowers: !bgSettings.enableFlowers,
                      })
                    }
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${
                      bgSettings.enableFlowers
                        ? "bg-green-600 text-white shadow-lg"
                        : "bg-red-600/50 text-gray-300"
                    }`}
                  >
                    {bgSettings.enableFlowers ? "ENABLED" : "DISABLED"}
                  </button>
                </div>

                {/* Flower Speed Selector */}
                <div>
                  <label className="text-amber-400 font-bold text-xs tracking-wider mb-2 block uppercase">
                    FLOWER FALLING SPEED: {bgSettings.flowerSpeed || 1}x
                  </label>
                  <div className="flex gap-2">
                    {[0.5, 1, 1.5, 2, 2.5].map((spd) => (
                      <button
                        key={spd}
                        onClick={() =>
                          setBgSettings({ ...bgSettings, flowerSpeed: spd })
                        }
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                          (bgSettings.flowerSpeed || 1) === spd
                            ? "bg-amber-500 text-black font-black"
                            : "bg-transparent text-gray-300"
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Darkness Overlay Slider */}
                <div>
                  <label className="text-amber-400 font-bold text-xs tracking-wider mb-2 block uppercase">
                    DARKNESS OVERLAY: {bgSettings.darknessOverlay || 0}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="80"
                    value={bgSettings.darknessOverlay || 0}
                    onChange={(e) =>
                      setBgSettings({
                        ...bgSettings,
                        darknessOverlay: Number(e.target.value),
                      })
                    }
                    className="w-full accent-amber-400"
                  />
                </div>

                {/* Theme Hue Selector */}
                <div>
                  <label className="text-amber-400 font-bold text-xs tracking-wider mb-2 block uppercase">
                    THEME ACCENT COLOR
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { name: "Fuchsia", hue: 0 },
                      { name: "Cyan", hue: 140 },
                      { name: "Green", hue: 80 },
                      { name: "Amber", hue: 45 },
                      { name: "Blue", hue: 180 },
                      { name: "Red", hue: 320 },
                    ].map((th) => (
                      <button
                        key={th.name}
                        onClick={() =>
                          setBgSettings({ ...bgSettings, themeHue: th.hue })
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          (bgSettings.themeHue || 0) === th.hue
                            ? "bg-amber-500 text-black font-black"
                            : "bg-transparent text-gray-300"
                        }`}
                      >
                        {th.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Save Button */}
                <button
                  onClick={async () => {
                    try {
                      await fetch("/api/bg-settings", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(bgSettings),
                      });
                    } catch (e) {}
                    saveToFirebase("bgSettings", bgSettings);
                    alert("✅ Background Wallpaper & Flower Settings permanently saved!");
                    setCurrentView("admin");
                  }}
                  className="w-full mt-2 bg-rainbow-animated border-2 border-white hover:from-amber-400 hover:to-yellow-500 text-black font-black py-3.5 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.5)] transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                >
                  <Save size={16} /> SAVE BACKGROUND SETTINGS (PERMANENT LIVE)
                </button>
              </div>
            </div>
          )}

          {/* VIEW 4: ADMIN PAYMENT SETTINGS (QR & UPI) */}
          {currentView === "adminPaymentSettings" && (
            <div className="flex flex-col gap-4 w-full animate-in fade-in zoom-in-95 duration-300 relative z-10 mt-2 bg-transparent  rounded-3xl p-5 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={() => setCurrentView("admin")}
                  className="p-2 rounded-xl transition-all border-2 animate-satorang-border shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:scale-110"
                >
                  <ArrowLeft size={20} className="text-white" />
                </button>
                <h2 className="text-xl font-black tracking-tight italic drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase">
                  PAYMENT{" "}
                  <span className="text-teal-400 drop-shadow-[0_0_15px_rgba(45,212,191,1)]">
                    SETTINGS (QR & UPI)
                  </span>
                </h2>
              </div>

              <div className="bg-transparent border border-teal-500/40 rounded-2xl p-5 shadow-[0_4px_25px_rgba(45,212,191,0.3)] flex flex-col gap-4 text-left">
                {/* QR Code Image URL + File Upload */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-teal-400 font-bold text-xs tracking-wider uppercase flex items-center gap-1.5">
                      <span>UPLOAD QR CODE IMAGE</span>
                    </label>
                    {paymentSettings.qrImage && (
                      <span className="text-[10px] text-emerald-400 font-black px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 uppercase">
                        ✓ QR Active
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 mb-2">
                    <input
                      type="text"
                      value={paymentSettings.qrImage}
                      onChange={(e) =>
                        setPaymentSettings({ ...paymentSettings, qrImage: e.target.value })
                      }
                      placeholder="QR Code Image URL (e.g. https://... or Upload below)"
                      className="flex-1 bg-transparent border border-white/20 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-teal-400 shadow-inner"
                    />
                    <label className="cursor-pointer bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 font-bold px-4 py-3 rounded-xl border border-teal-400/40 flex items-center justify-center gap-2 text-xs uppercase tracking-wider shrink-0 transition-all shadow-md active:scale-95">
                      <Upload size={16} />
                      <span>Upload Gallery QR</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = async (re) => {
                              if (re.target?.result) {
                                const base64Str = re.target.result as string;
                                const compressed = await compressImageBase64(base64Str, 600, 600);
                                setPaymentSettings((prev: any) => ({
                                  ...prev,
                                  qrImage: compressed,
                                }));
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                  
                  {/* QR Preview */}
                  {paymentSettings.qrImage && (
                    <div className="mt-3 flex flex-col items-center p-4 bg-white/5 rounded-2xl border border-teal-500/30 max-w-xs mx-auto shadow-lg">
                      <div className="w-full flex items-center justify-between mb-2">
                        <span className="text-[11px] text-teal-300 font-bold uppercase flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-green-400 animate-ping"></span> Live QR Preview
                        </span>
                        <button
                          type="button"
                          onClick={() => setPaymentSettings({ ...paymentSettings, qrImage: "" })}
                          className="text-[10px] text-red-400 hover:text-red-300 font-bold uppercase transition-colors"
                        >
                          ✕ Remove QR
                        </button>
                      </div>
                      <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-200">
                        <img
                          src={paymentSettings.qrImage}
                          alt="UPI QR Code"
                          className="w-48 h-48 object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* UPI ID */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-teal-400 font-bold text-xs tracking-wider uppercase">
                      OFFICIAL UPI ID / NUMBER (ADD FUND KE LIYE)
                    </label>
                    {paymentSettings.upiId && (
                      <span className="text-[10px] text-emerald-400 font-black px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 uppercase">
                        ✓ UPI Active
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={paymentSettings.upiId}
                    onChange={(e) =>
                      setPaymentSettings({ ...paymentSettings, upiId: e.target.value })
                    }
                    placeholder="e.g. 9876543210@paytm, user@ybl, ya UPI Phone Number"
                    className="w-full bg-transparent border border-white/20 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-teal-400 shadow-inner"
                  />
                </div>

                {/* Quick Presets Notice */}
                <div className="bg-teal-500/10 border border-teal-500/30 p-3 rounded-xl text-xs text-gray-300">
                  <span className="text-teal-300 font-black uppercase block mb-1">
                    ⚡ Permanent Live Syncing:
                  </span>
                  Jab aap yahan QR ya UPI save karenge, ye turant Server aur Firebase Cloud Database me permanently save hokar poori website par live ho jayega!
                </div>

                {/* Save Button */}
                <button
                  type="button"
                  onClick={async () => {
                    lastAdminSavedPaymentTimeRef.current = Date.now();
                    const toSave = {
                      ...paymentSettings,
                      qrImage: (paymentSettings.qrImage || "").trim(),
                      upiId: (paymentSettings.upiId || "").trim(),
                    };

                    // 1. Update state
                    setPaymentSettings(toSave);

                    // 2. Save to server backend (payment_settings.json)
                    try {
                      await fetch("/api/payment-settings", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(toSave),
                      });
                    } catch (e) {
                      console.warn("Backend save error:", e);
                    }

                    // 4. Save to Firebase direct path & state
                    try {
                      await saveToFirebase("paymentSettings", toSave);
                    } catch (e) {
                      console.warn("Firebase save error:", e);
                    }

                    alert(`✅ Payment Settings successfully saved!\n\n• UPI ID: ${toSave.upiId || "Default"}\n• QR Code: ${toSave.qrImage ? "Custom QR Code Active" : "Default QR Active"}\n\nYe details ab aapki website par PERMANENT LIVE ho chuki hain!`);
                    setCurrentView("admin");
                  }}
                  className="w-full mt-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-black font-black py-3.5 rounded-xl shadow-[0_0_20px_rgba(20,184,166,0.5)] transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                >
                  <Save size={16} /> SAVE PAYMENT SETTINGS (PERMANENT LIVE)
                </button>
              </div>
            </div>
          )}

          {/* VIEW: ADMIN CASHFREE GATEWAY SETTINGS */}
          {currentView === "adminCashfree" && (
            <div className="flex flex-col gap-4 w-full animate-in fade-in zoom-in-95 duration-300 relative z-10 mt-2 bg-transparent rounded-3xl p-5 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={() => setCurrentView("admin")}
                  className="bg-white/5 hover:bg-white/10 p-2 rounded-xl transition-colors text-gray-300 hover:text-white"
                >
                  <ArrowLeft size={20} />
                </button>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide uppercase italic drop-shadow-[0_2px_4px_rgba(0,0,0,1)] flex items-center gap-2">
                  Cashfree <span className="text-purple-400">Gateway</span>
                </h2>
              </div>
              
              <div className="bg-[#0b101a]/80 border border-white/10 rounded-[20px] p-5 shadow-inner flex flex-col gap-5">
                <p className="text-xs text-gray-400 mb-2">
                  Configure your Cashfree App ID, Secret Key, and custom gateway launch code. This replaces Razorpay inside the "Auto Pay" tab.
                </p>

                <div>
                  <label className="text-purple-400 font-bold text-xs tracking-wider mb-2 block uppercase">
                    App ID (x-client-id)
                  </label>
                  <input
                    type="text"
                    value={paymentSettings.cashfreeAppId || ""}
                    onChange={(e) =>
                      setPaymentSettings({ ...paymentSettings, cashfreeAppId: e.target.value })
                    }
                    placeholder="Enter your Cashfree App ID"
                    className="w-full bg-transparent border border-white/20 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-purple-400 shadow-inner"
                  />
                </div>

                <div>
                  <label className="text-purple-400 font-bold text-xs tracking-wider mb-2 block uppercase">
                    Secret Key (x-secret-key)
                  </label>
                  <input
                    type="text"
                    value={paymentSettings.cashfreeSecretKey || ""}
                    onChange={(e) =>
                      setPaymentSettings({ ...paymentSettings, cashfreeSecretKey: e.target.value })
                    }
                    placeholder="Enter your Cashfree Secret Key"
                    className="w-full bg-transparent border border-white/20 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-purple-400 shadow-inner"
                  />
                </div>

                <div>
                  <label className="text-indigo-400 font-bold text-xs tracking-wider mb-2 block uppercase">
                    Payment Gateway Launch Code (JavaScript)
                  </label>
                  <textarea
                    value={paymentSettings.cashfreeCode || ""}
                    onChange={(e) =>
                      setPaymentSettings({ ...paymentSettings, cashfreeCode: e.target.value })
                    }
                    placeholder="Enter custom integration code. Example: window.location.href = 'your_payment_link?amt=' + amount;"
                    rows={6}
                    className="w-full bg-black/40 border border-white/20 rounded-xl py-3 px-4 text-xs font-mono text-gray-300 focus:outline-none focus:border-indigo-400 shadow-inner custom-scrollbar"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">Variables available: <code className="text-emerald-400">amount</code>, <code className="text-emerald-400">whatsapp</code>, <code className="text-emerald-400">appId</code>, <code className="text-emerald-400">secretKey</code></p>
                </div>

                <div className="flex items-center gap-3 mt-2">
                  <button
                    onClick={() => {
                      const updated = { ...paymentSettings, activeGateway: "cashfree" };
                      setPaymentSettings(updated);
                      saveToFirebase("paymentSettings", updated);
                      alert("✅ Cashfree Gateway Activated!");
                    }}
                    className={`flex-1 py-3.5 rounded-xl font-black text-xs uppercase transition-all shadow-md active:scale-95 border ${
                      paymentSettings.activeGateway === "cashfree"
                        ? "bg-purple-600/30 text-purple-300 border-purple-500"
                        : "bg-transparent text-gray-400 hover:text-white border-white/20"
                    }`}
                  >
                    {paymentSettings.activeGateway === "cashfree" ? "🟢 ACTIVE GATEWAY" : "Activate Cashfree"}
                  </button>
                  
                  <button
                    onClick={() => {
                      saveToFirebase("paymentSettings", paymentSettings);
                      setPaymentSettings({ ...paymentSettings });
                      alert("✅ Cashfree Gateway Settings successfully saved!");
                      setCurrentView("admin");
                    }}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-black py-3.5 rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-2 active:scale-95 border border-purple-400/40"
                  >
                    <Save size={16} /> SAVE SETTINGS
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: ADMIN RAZORPAY GATEWAY SETTINGS */}
          {currentView === "adminRazorpay" && (
            <div className="flex flex-col gap-4 w-full animate-in fade-in zoom-in-95 duration-300 relative z-10 mt-2 bg-transparent rounded-3xl p-5 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={() => setCurrentView("admin")}
                  className="bg-white/5 hover:bg-white/10 p-2 rounded-xl transition-colors text-gray-300 hover:text-white"
                >
                  <ArrowLeft size={20} />
                </button>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide uppercase italic drop-shadow-[0_2px_4px_rgba(0,0,0,1)] flex items-center gap-2">
                  Razorpay <span className="text-blue-400">Gateway</span>
                </h2>
              </div>
              
              <div className="bg-[#0b101a]/80 border border-white/10 rounded-[20px] p-5 shadow-inner flex flex-col gap-5">
                <p className="text-xs text-gray-400 mb-2">
                  Configure your Razorpay Key ID, Secret Key, and custom gateway launch code.
                </p>

                <div>
                  <label className="text-blue-400 font-bold text-xs tracking-wider mb-2 block uppercase">
                    Key ID (App ID)
                  </label>
                  <input
                    type="text"
                    value={paymentSettings.razorpayAppId || ""}
                    onChange={(e) =>
                      setPaymentSettings({ ...paymentSettings, razorpayAppId: e.target.value })
                    }
                    placeholder="Enter your Razorpay Key ID"
                    className="w-full bg-transparent border border-white/20 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-blue-400 shadow-inner"
                  />
                </div>

                <div>
                  <label className="text-blue-400 font-bold text-xs tracking-wider mb-2 block uppercase">
                    Key Secret
                  </label>
                  <input
                    type="text"
                    value={paymentSettings.razorpaySecretKey || ""}
                    onChange={(e) =>
                      setPaymentSettings({ ...paymentSettings, razorpaySecretKey: e.target.value })
                    }
                    placeholder="Enter your Razorpay Key Secret"
                    className="w-full bg-transparent border border-white/20 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-blue-400 shadow-inner"
                  />
                </div>

                <div>
                  <label className="text-cyan-400 font-bold text-xs tracking-wider mb-2 block uppercase">
                    Payment Gateway Launch Code (JavaScript)
                  </label>
                  <textarea
                    value={paymentSettings.razorpayCode || ""}
                    onChange={(e) =>
                      setPaymentSettings({ ...paymentSettings, razorpayCode: e.target.value })
                    }
                    placeholder="Enter custom integration code..."
                    rows={6}
                    className="w-full bg-black/40 border border-white/20 rounded-xl py-3 px-4 text-xs font-mono text-gray-300 focus:outline-none focus:border-cyan-400 shadow-inner custom-scrollbar"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">Variables available: <code className="text-emerald-400">amount</code>, <code className="text-emerald-400">whatsapp</code>, <code className="text-emerald-400">appId</code>, <code className="text-emerald-400">secretKey</code></p>
                </div>

                <div className="flex items-center gap-3 mt-2">
                  <button
                    onClick={() => {
                      const updated = { ...paymentSettings, activeGateway: "razorpay" };
                      setPaymentSettings(updated);
                      saveToFirebase("paymentSettings", updated);
                      alert("✅ Razorpay Gateway Activated!");
                    }}
                    className={`flex-1 py-3.5 rounded-xl font-black text-xs uppercase transition-all shadow-md active:scale-95 border ${
                      paymentSettings.activeGateway === "razorpay"
                        ? "bg-blue-600/30 text-blue-300 border-blue-500"
                        : "bg-transparent text-gray-400 hover:text-white border-white/20"
                    }`}
                  >
                    {paymentSettings.activeGateway === "razorpay" ? "🟢 ACTIVE GATEWAY" : "Activate Razorpay"}
                  </button>

                  <button
                    onClick={() => {
                      saveToFirebase("paymentSettings", paymentSettings);
                      setPaymentSettings({ ...paymentSettings });
                      alert("✅ Razorpay Gateway Settings successfully saved!");
                      setCurrentView("admin");
                    }}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-black py-3.5 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-2 active:scale-95 border border-blue-400/40"
                  >
                    <Save size={16} /> SAVE SETTINGS
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 5: ADMIN USER LOGINS & WALLETS */}
          {currentView === "adminLogins" && (
            <div className="flex flex-col gap-4 w-full animate-in fade-in zoom-in-95 duration-300 relative z-10 mt-2 bg-transparent  rounded-3xl p-5 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCurrentView("admin")}
                    className="p-2 rounded-xl transition-all border-2 animate-satorang-border shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:scale-110"
                  >
                    <ArrowLeft size={20} className="text-white" />
                  </button>
                  <h2 className="text-xl font-black tracking-tight italic drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase">
                    USER LOGINS &{" "}
                    <span className="text-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,1)]">
                      WALLETS
                    </span>
                  </h2>
                </div>
                <button
                  onClick={() => setShowAdminAddUserModal(true)}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-black px-3 py-1.5 rounded-xl uppercase flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                >
                  <UserPlus size={14} /> Add User
                </button>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-transparent border border-white/10 rounded-xl p-3 text-left">
                  <span className="text-gray-400 text-xs font-bold block uppercase">Total Registered</span>
                  <span className="text-white font-black text-xl">{ensureArray(registeredUsers).length} Users</span>
                </div>
                <div className="bg-transparent border border-white/10 rounded-xl p-3 text-left">
                  <span className="text-gray-400 text-xs font-bold block uppercase">Active Logins</span>
                  <span className="text-cyan-400 font-black text-xl">
                    {ensureArray(registeredUsers).filter((u) => u.isLoggedIn).length} Online
                  </span>
                </div>
                <div className="bg-transparent border border-white/10 rounded-xl p-3 text-left col-span-2 sm:col-span-1">
                  <span className="text-gray-400 text-xs font-bold block uppercase">Total Balance Held</span>
                  <span className="text-green-400 font-black text-xl">
                    ₹
                    {Object.values(userWallets || {}).reduce(
                      (acc: number, val: any) => acc + (Number(val) || 0),
                      0,
                    )}
                  </span>
                </div>
              </div>

              {/* Search User */}
              <div className="relative w-full">
                <Search size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
                <input
                  type="text"
                  value={adminUserSearchQuery}
                  onChange={(e) => setAdminUserSearchQuery(e.target.value)}
                  placeholder="Search user by name, email, or phone..."
                  className="w-full bg-transparent border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-all"
                />
              </div>

              {/* User Cards */}
              <div className="flex flex-col gap-3">
                {ensureArray(registeredUsers)
                  .filter((u) => {
                    if (!adminUserSearchQuery) return true;
                    const q = adminUserSearchQuery.toLowerCase();
                    return (
                      (u.name || "").toLowerCase().includes(q) ||
                      (u.email || "").toLowerCase().includes(q) ||
                      (u.phone || "").toLowerCase().includes(q)
                    );
                  })
                  .map((u, idx) => {
                    const accKey = getAccountKey(u.email, u.phone);
                    const bal = Number(userWallets[accKey]) || 0;
                    const inputAmt = adminBalanceInput[accKey] || "";

                    return (
                      <div
                        key={`user-login-${idx}`}
                        className="bg-transparent  border border-white/10 rounded-2xl p-4 flex flex-col gap-3 text-left transition-all hover:border-blue-500/40"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm uppercase shadow-md shrink-0">
                              {(u.name || u.email || "U").slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="text-white font-black text-sm uppercase">
                                {u.name || "User"}
                              </h4>
                              <p className="text-gray-300 text-xs">{u.email || u.phone}</p>
                              {u.phone && u.email && (
                                <p className="text-gray-400 text-[11px]">Phone: {u.phone}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-gray-400 font-bold block uppercase">
                              Balance:
                            </span>
                            <span className="text-green-400 font-black text-base">
                              ₹{bal.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Quick Balance Adjust */}
                        <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                          <input
                            type="number"
                            placeholder="Amount ₹"
                            value={inputAmt}
                            onChange={(e) =>
                              setAdminBalanceInput({
                                ...adminBalanceInput,
                                [accKey]: e.target.value,
                              })
                            }
                            className="w-24 bg-transparent border border-white/20 rounded-lg p-2 text-xs font-bold text-white text-center focus:outline-none focus:border-green-400"
                          />
                          <button
                            onClick={() => {
                              const amt = Number(inputAmt);
                              if (!amt || amt <= 0) {
                                alert("⚠️ Enter valid amount to add!");
                                return;
                              }
                              const updated = {
                                ...userWallets,
                                [accKey]: bal + amt,
                              };
                              setUserWallets(updated);
                              saveToFirebase("userWallets", updated);
                              setAdminBalanceInput({ ...adminBalanceInput, [accKey]: "" });
                              alert(`✅ Added ₹${amt} to ${u.name || u.email || "user"}!`);
                            }}
                            className="flex-1 bg-green-600/30 hover:bg-green-600 text-green-300 hover:text-white border border-green-500/40 font-bold py-2 rounded-lg text-xs uppercase transition-colors"
                          >
                            + Add Money
                          </button>
                          <button
                            onClick={() => {
                              const amt = Number(inputAmt);
                              if (!amt || amt <= 0) {
                                alert("⚠️ Enter valid amount to deduct!");
                                return;
                              }
                              const newBal = Math.max(0, bal - amt);
                              const updated = {
                                ...userWallets,
                                [accKey]: newBal,
                              };
                              setUserWallets(updated);
                              saveToFirebase("userWallets", updated);
                              setAdminBalanceInput({ ...adminBalanceInput, [accKey]: "" });
                              alert(`✅ Deducted ₹${amt} from ${u.name || u.email || "user"}!`);
                            }}
                            className="flex-1 bg-red-600/30 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40 font-bold py-2 rounded-lg text-xs uppercase transition-colors"
                          >
                            - Deduct
                          </button>
                          {u.phone && (
                            <a
                              href={`https://wa.me/${u.phone.replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-green-500/20 text-green-300 hover:bg-green-500/30 rounded-lg border border-green-500/40 transition-colors"
                              title="Chat on WhatsApp"
                            >
                              <MessageCircle size={16} />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Add User Modal */}
              {showAdminAddUserModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
                  <div className="relative w-full max-w-md bg-gradient-to-b from-gray-900 via-black to-gray-900 border border-blue-500/50 rounded-2xl p-5 shadow-[0_0_40px_rgba(59,130,246,0.5)] text-left flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <h3 className="text-white font-black text-base uppercase flex items-center gap-2">
                        <UserPlus size={18} className="text-blue-400" /> ADD NEW USER ACCOUNT
                      </h3>
                      <button
                        onClick={() => setShowAdminAddUserModal(false)}
                        className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-transparent"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-300 block mb-1 uppercase">Full Name</label>
                      <input
                        type="text"
                        value={adminNewUserForm.name}
                        onChange={(e) =>
                          setAdminNewUserForm({ ...adminNewUserForm, name: e.target.value })
                        }
                        placeholder="Player One"
                        className="w-full bg-transparent border border-white/20 rounded-xl p-2.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-300 block mb-1 uppercase">Email Address</label>
                      <input
                        type="email"
                        value={adminNewUserForm.email}
                        onChange={(e) =>
                          setAdminNewUserForm({ ...adminNewUserForm, email: e.target.value })
                        }
                        placeholder="player@gmail.com"
                        className="w-full bg-transparent border border-white/20 rounded-xl p-2.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-300 block mb-1 uppercase">Phone Number</label>
                      <input
                        type="text"
                        value={adminNewUserForm.phone}
                        onChange={(e) =>
                          setAdminNewUserForm({ ...adminNewUserForm, phone: e.target.value })
                        }
                        placeholder="9876543210"
                        className="w-full bg-transparent border border-white/20 rounded-xl p-2.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-300 block mb-1 uppercase">Password</label>
                      <input
                        type="text"
                        value={adminNewUserForm.password}
                        onChange={(e) =>
                          setAdminNewUserForm({ ...adminNewUserForm, password: e.target.value })
                        }
                        placeholder="123456"
                        className="w-full bg-transparent border border-white/20 rounded-xl p-2.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-300 block mb-1 uppercase">Initial Balance (₹)</label>
                      <input
                        type="number"
                        value={adminNewUserForm.balance}
                        onChange={(e) =>
                          setAdminNewUserForm({ ...adminNewUserForm, balance: e.target.value })
                        }
                        placeholder="100"
                        className="w-full bg-transparent border border-white/20 rounded-xl p-2.5 text-xs text-white"
                      />
                    </div>

                    <button
                      onClick={() => {
                        if (!adminNewUserForm.email && !adminNewUserForm.phone) {
                          alert("⚠️ Please provide Email or Phone!");
                          return;
                        }
                        const newUser = {
                          name: adminNewUserForm.name || "User",
                          email: adminNewUserForm.email,
                          phone: adminNewUserForm.phone,
                          password: adminNewUserForm.password || "123456",
                          createdAt: new Date().toISOString(),
                          isLoggedIn: false,
                        };
                        const updatedUsers = [newUser, ...ensureArray(registeredUsers)];
                        setRegisteredUsers(updatedUsers);
                        saveToFirebase("registeredUsers", updatedUsers);

                        const accKey = getAccountKey(newUser.email, newUser.phone);
                        const initBal = Number(adminNewUserForm.balance) || 0;
                        if (initBal > 0) {
                          const updatedWallets = { ...userWallets, [accKey]: initBal };
                          setUserWallets(updatedWallets);
                          saveToFirebase("userWallets", updatedWallets);
                        }
                        setShowAdminAddUserModal(false);
                        setAdminNewUserForm({ name: "", email: "", phone: "", password: "", balance: "0" });
                        alert(`✅ User "${newUser.name}" successfully created!`);
                      }}
                      className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-black py-3 rounded-xl uppercase tracking-wider text-xs shadow-lg transition-all active:scale-95 text-center mt-2"
                    >
                      Create Account
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW 6: ADMIN BANNER & NOTICE */}
          {currentView === "adminBanner" && (
            <div className="flex flex-col gap-4 w-full animate-in fade-in zoom-in-95 duration-300 relative z-10 mt-2 bg-transparent  rounded-3xl p-5 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={() => setCurrentView("admin")}
                  className="p-2 rounded-xl transition-all border-2 animate-satorang-border shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:scale-110"
                >
                  <ArrowLeft size={20} className="text-white" />
                </button>
                <h2 className="text-xl font-black tracking-tight italic drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase">
                  BANNER &{" "}
                  <span className="text-purple-400 drop-shadow-[0_0_15px_rgba(192,132,252,1)]">
                    NOTICE SETTINGS
                  </span>
                </h2>
              </div>

              <div className="bg-transparent  border border-purple-500/40 rounded-2xl p-5 shadow-[0_4px_25px_rgba(192,132,252,0.3)] flex flex-col gap-5 text-left">
                {/* 1. SCROLLING MARQUEE NOTICE */}
                <div className="border-b border-white/10 pb-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-black text-sm uppercase flex items-center gap-1.5">
                        <Megaphone size={16} className="text-fuchsia-400" /> 1. TOP SCROLLING MARQUEE TICKER
                      </h4>
                      <p className="text-gray-400 text-xs">Home screen ke upar chalne wali scrolling notice patti</p>
                    </div>
                    <button
                      onClick={() =>
                        setBannerSettings({
                          ...bannerSettings,
                          marqueeEnabled: !bannerSettings.marqueeEnabled,
                        })
                      }
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${
                        bannerSettings.marqueeEnabled
                          ? "bg-fuchsia-600 text-white shadow-lg"
                          : "bg-transparent text-gray-400"
                      }`}
                    >
                      {bannerSettings.marqueeEnabled ? "ACTIVE" : "DISABLED"}
                    </button>
                  </div>

                  <div>
                    <label className="text-purple-300 font-bold text-xs tracking-wider mb-1 block uppercase">
                      MARQUEE TICKER TEXT
                    </label>
                    <textarea
                      rows={2}
                      value={bannerSettings.marqueeText}
                      onChange={(e) =>
                        setBannerSettings({
                          ...bannerSettings,
                          marqueeText: e.target.value,
                        })
                      }
                      placeholder="Enter announcement text..."
                      className="w-full bg-transparent border border-white/20 rounded-xl p-3 text-xs font-bold text-white focus:outline-none focus:border-purple-400 shadow-inner"
                    />
                  </div>
                </div>

                {/* 2. PROMOTIONAL POSTER BANNER */}
                <div className="border-b border-white/10 pb-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-black text-sm uppercase flex items-center gap-1.5">
                        <Sparkles size={16} className="text-yellow-400" /> 2. HOME PROMOTIONAL BANNER
                      </h4>
                      <p className="text-gray-400 text-xs">Home screen par bada poster card with image & link</p>
                    </div>
                    <button
                      onClick={() =>
                        setBannerSettings({
                          ...bannerSettings,
                          bannerEnabled: !bannerSettings.bannerEnabled,
                        })
                      }
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${
                        bannerSettings.bannerEnabled
                          ? "bg-purple-600 text-white shadow-lg"
                          : "bg-transparent text-gray-400"
                      }`}
                    >
                      {bannerSettings.bannerEnabled ? "ACTIVE" : "DISABLED"}
                    </button>
                  </div>

                  <div>
                    <label className="text-purple-300 font-bold text-xs tracking-wider mb-1 block uppercase">
                      BANNER HEADLINE / TITLE
                    </label>
                    <input
                      type="text"
                      value={bannerSettings.bannerTitle}
                      onChange={(e) =>
                        setBannerSettings({
                          ...bannerSettings,
                          bannerTitle: e.target.value,
                        })
                      }
                      placeholder="e.g. 🔥 FFH4CK VIP PREM STORE - SAFE MODS 🔥"
                      className="w-full bg-transparent border border-white/20 rounded-xl py-2.5 px-3 text-xs font-bold text-white focus:outline-none focus:border-purple-400 shadow-inner"
                    />
                  </div>

                  <div>
                    <label className="text-purple-300 font-bold text-xs tracking-wider mb-1 block uppercase">
                      BANNER SUBTITLE / DESCRIPTION
                    </label>
                    <input
                      type="text"
                      value={bannerSettings.bannerSubtitle}
                      onChange={(e) =>
                        setBannerSettings({
                          ...bannerSettings,
                          bannerSubtitle: e.target.value,
                        })
                      }
                      placeholder="e.g. Instant 24/7 Auto Delivery • 100% Antiban Guaranteed"
                      className="w-full bg-transparent border border-white/20 rounded-xl py-2.5 px-3 text-xs font-bold text-white focus:outline-none focus:border-purple-400 shadow-inner"
                    />
                  </div>

                  <div>
                    <label className="text-purple-300 font-bold text-xs tracking-wider mb-1 block uppercase">
                      BANNER POSTER IMAGE
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={bannerSettings.bannerImage}
                        onChange={(e) =>
                          setBannerSettings({
                            ...bannerSettings,
                            bannerImage: e.target.value,
                          })
                        }
                        placeholder="Image URL or upload from storage"
                        className="flex-1 bg-transparent border border-white/20 rounded-xl py-2.5 px-3 text-xs font-bold text-white focus:outline-none focus:border-purple-400 shadow-inner"
                      />
                      <label className="cursor-pointer bg-transparent hover:bg-transparent text-white font-bold px-3.5 py-2.5 rounded-xl border border-white/20 flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider shrink-0 transition-colors">
                        <Upload size={14} />
                        <span>Upload Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (re) => {
                                if (re.target?.result) {
                                  setBannerSettings({
                                    ...bannerSettings,
                                    bannerImage: re.target.result as string,
                                  });
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="text-purple-300 font-bold text-xs tracking-wider mb-1 block uppercase">
                      BANNER CLICK / TELEGRAM ACTION LINK
                    </label>
                    <input
                      type="text"
                      value={bannerSettings.bannerLink}
                      onChange={(e) =>
                        setBannerSettings({
                          ...bannerSettings,
                          bannerLink: e.target.value,
                        })
                      }
                      placeholder="https://t.me/Premjodvip"
                      className="w-full bg-transparent border border-white/20 rounded-xl py-2.5 px-3 text-xs font-bold text-white focus:outline-none focus:border-purple-400 shadow-inner"
                    />
                  </div>
                </div>

                {/* 3. POPUP NOTICE MODAL */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-black text-sm uppercase flex items-center gap-1.5">
                        <AlertCircle size={16} className="text-cyan-400" /> 3. POPUP ANNOUNCEMENT MODAL
                      </h4>
                      <p className="text-gray-400 text-xs">Website open karne par user ke samne aane wala pop-up notice</p>
                    </div>
                    <button
                      onClick={() =>
                        setBannerSettings({
                          ...bannerSettings,
                          popupEnabled: !bannerSettings.popupEnabled,
                        })
                      }
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${
                        bannerSettings.popupEnabled
                          ? "bg-cyan-600 text-white shadow-lg"
                          : "bg-transparent text-gray-400"
                      }`}
                    >
                      {bannerSettings.popupEnabled ? "ACTIVE" : "DISABLED"}
                    </button>
                  </div>

                  <div>
                    <label className="text-purple-300 font-bold text-xs tracking-wider mb-1 block uppercase">
                      POPUP TITLE
                    </label>
                    <input
                      type="text"
                      value={bannerSettings.popupTitle}
                      onChange={(e) =>
                        setBannerSettings({
                          ...bannerSettings,
                          popupTitle: e.target.value,
                        })
                      }
                      placeholder="e.g. 📢 SPECIAL ANNOUNCEMENT"
                      className="w-full bg-transparent border border-white/20 rounded-xl py-2.5 px-3 text-xs font-bold text-white focus:outline-none focus:border-purple-400 shadow-inner"
                    />
                  </div>

                  <div>
                    <label className="text-purple-300 font-bold text-xs tracking-wider mb-1 block uppercase">
                      POPUP MESSAGE
                    </label>
                    <textarea
                      rows={3}
                      value={bannerSettings.popupMessage}
                      onChange={(e) =>
                        setBannerSettings({
                          ...bannerSettings,
                          popupMessage: e.target.value,
                        })
                      }
                      placeholder="Notice details..."
                      className="w-full bg-transparent border border-white/20 rounded-xl p-3 text-xs font-bold text-white focus:outline-none focus:border-purple-400 shadow-inner"
                    />
                  </div>
                </div>

                {/* Save Button */}
                <button
                  onClick={() => {
                    saveToFirebase(
                      "bannerSettings",
                      bannerSettings,
                    );
                    alert("✅ Banner, Marquee & Notice Settings saved successfully!");
                    setCurrentView("admin");
                  }}
                  className="w-full mt-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-black py-3.5 rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-2 active:scale-95"
                >
                  <Save size={16} /> SAVE BANNER & NOTICE SETTINGS
                </button>
              </div>
            </div>
          )}

          {/* DEDICATED STAFF PANEL (PASSWORD: PREM74) */}
          {currentView === "staff" && (
            <div className="flex flex-col gap-5 w-full animate-in fade-in zoom-in-95 duration-300 relative z-10 mt-2 bg-transparent  rounded-3xl p-5 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              {/* Staff Header */}
              <div className="flex flex-col gap-3 bg-transparent  border border-fuchsia-500/40 p-4 rounded-2xl shadow-[0_0_30px_rgba(217,70,239,0.25)]  text-left">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setCurrentView("home")}
                      className="p-2 bg-transparent hover:bg-transparent rounded-full transition-colors "
                    >
                      <ArrowLeft size={20} className="text-white" />
                    </button>
                    <div>
                      <h2 className="text-2xl font-black tracking-tight italic drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase">
                        STAFF{" "}
                        <span className="text-fuchsia-400 drop-shadow-[0_0_15px_rgba(217,70,239,1)]">
                          PANEL
                        </span>
                      </h2>
                      <span className="text-[10px] font-bold text-fuchsia-300 bg-fuchsia-500/20 px-2.5 py-0.5 rounded-full border border-fuchsia-500/30 uppercase tracking-widest inline-block mt-0.5">
                        🛡️ AUTHORIZED STAFF PORTAL (PASS: PREM74)
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setCurrentView("home");
                      alert("Staff Panel closed.");
                    }}
                    className="px-3.5 py-1.5 bg-red-500/20 hover:bg-red-500/40 border border-red-500/40 rounded-xl text-red-300 text-xs font-black uppercase transition-all"
                  >
                    EXIT
                  </button>
                </div>

                {/* DSLR Top Metric Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mt-1">
                  <div className="bg-transparent  border border-purple-500/30 p-3 rounded-xl flex flex-col items-center justify-center text-center shadow-lg">
                    <User size={20} className="text-purple-400 mb-1" />
                    <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                      Total Users
                    </span>
                    <span className="text-white font-black text-lg">
                      {ensureArray(registeredUsers).length}
                    </span>
                  </div>
                  <div className="bg-transparent  border border-emerald-500/30 p-3 rounded-xl flex flex-col items-center justify-center text-center shadow-lg">
                    <Wallet size={20} className="text-emerald-400 mb-1" />
                    <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                      Total Revenue
                    </span>
                    <span className="text-emerald-400 font-black text-lg">
                      ₹
                      {ensureArray(paymentHistory)
                        .filter((p) => p.status === "SUCCESS")
                        .reduce((acc, curr) => acc + (curr.amount || 0), 0)}
                    </span>
                  </div>
                  <div className="bg-transparent  border border-cyan-500/30 p-3 rounded-xl flex flex-col items-center justify-center text-center shadow-lg">
                    <LayoutDashboard size={20} className="text-cyan-400 mb-1" />
                    <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                      Active Panels
                    </span>
                    <span className="text-cyan-300 font-black text-lg">
                      {ensureArray(panels).length}
                    </span>
                  </div>
                  <div className="bg-transparent  border border-amber-500/30 p-3 rounded-xl flex flex-col items-center justify-center text-center shadow-lg">
                    <Hourglass size={20} className="text-amber-400 mb-1" />
                    <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                      Pending Fund
                    </span>
                    <span className="text-amber-400 font-black text-lg">
                      {
                        ensureArray(paymentHistory).filter(
                          (p) => p.status === "PENDING",
                        ).length
                      }
                    </span>
                  </div>
                </div>

                {/* Staff DSLR Tab Bar */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 mt-1 no-scrollbar">
                  {[
                    {
                      id: "overview",
                      label: "📊 OVERVIEW",
                      color: "from-fuchsia-600 to-purple-600",
                    },
                    {
                      id: "emailKey",
                      label: "📧 EMAIL KEY (EMAILJS)",
                      color: "from-blue-600 to-indigo-600",
                    },
                    {
                      id: "colorTheme",
                      label: "🎨 COLOR THEME",
                      color: "from-cyan-600 to-blue-600",
                    },
                    {
                      id: "refundPanel",
                      label: "💸 REFUND PANEL",
                      color: "from-red-600 to-rose-700",
                    },
                    {
                      id: "resellers",
                      label: `🛡️ RESELLERS (${ensureArray(approvedResellers).length})`,
                      color: "from-amber-500 to-yellow-600",
                    },
                    {
                      id: "addPanel",
                      label: "➕ ADD PANEL",
                      color: "from-pink-500 to-fuchsia-600",
                    },
                    {
                      id: "house",
                      label: "🏠 HOUSE PANEL (24GHANTA)",
                      color: "from-amber-500 to-orange-600",
                    },
                    {
                      id: "managePanels",
                      label: "🗑️ MANAGE PANELS",
                      color: "from-red-500 to-rose-600",
                    },
                    {
                      id: "supportLinks",
                      label: "💬 SUPPORT LINKS",
                      color: "from-sky-500 to-blue-600",
                    },
                    {
                      id: "users",
                      label: `👥 USERS (${ensureArray(registeredUsers).length})`,
                      color: "from-purple-500 to-indigo-600",
                    },
                    {
                      id: "payments",
                      label: `💰 PAYMENTS (${ensureArray(paymentHistory).length})`,
                      color: "from-emerald-500 to-teal-600",
                    },
                    {
                      id: "pendingKeys",
                      label: `⏳ PENDING KEYS (${ensureArray(keyRequests).filter((r) => r.status === "PENDING").length})`,
                      color: "from-amber-600 to-yellow-600",
                    },
                  ].map((tab) => (
                    <button
                      key={`staff-tab-${tab.id}`}
                      onClick={() => setStaffTab(tab.id as any)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                        staffTab === tab.id
                          ? `bg-gradient-to-r ${tab.color} text-white shadow-[0_0_15px_rgba(217,70,239,0.5)] scale-105 border border-white/30`
                          : "bg-transparent text-gray-400 hover:text-white border border-white/10 hover:border-white/20"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* STAFF TAB 1: OVERVIEW */}
              {staffTab === "overview" && (
                <div className="flex flex-col gap-4">
                  <div className="bg-transparent  border border-white/10 rounded-2xl p-5 shadow-2xl  flex flex-col gap-4 text-left">
                    <h3 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-wide">
                      <Sparkles size={18} className="text-fuchsia-400" /> STAFF
                      CONTROL DASHBOARD
                    </h3>
                    <p className="text-gray-300 text-xs">
                      Yahan Staff Member website ke saare core features ko DSLR
                      Quality controls ke saath handle kar sakte hain.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                      <button
                        onClick={() => setStaffTab("emailKey")}
                        className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-indigo-500 p-4 rounded-xl text-white font-black text-sm uppercase flex items-center justify-between shadow-[0_0_20px_rgba(59,130,246,0.35)] transition-all hover:scale-[1.02] md:col-span-2 border border-blue-400/50"
                      >
                        <span className="flex items-center gap-2.5">
                          <Mail size={20} className="text-blue-300" /> 📧 Send
                          Key via Email (EmailJS Direct Integration)
                        </span>
                        <ArrowRight size={18} />
                      </button>
                      <button
                        onClick={() => setStaffTab("refundPanel")}
                        className="bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 hover:from-red-500 hover:to-rose-500 p-4 rounded-xl text-white font-black text-sm uppercase flex items-center justify-between shadow-[0_0_20px_rgba(239,68,68,0.35)] transition-all hover:scale-[1.02] md:col-span-2 border border-red-400/50"
                      >
                        <span className="flex items-center gap-2.5">
                          <X size={20} className="text-red-300" /> ❌ Reject &
                          Refund Panel (EmailJS)
                        </span>
                        <ArrowRight size={18} />
                      </button>

                      <button
                        onClick={() => setStaffTab("resellers")}
                        className="bg-gradient-to-r from-amber-600 via-yellow-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 p-4 rounded-xl text-white font-black text-sm uppercase flex items-center justify-between shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all hover:scale-[1.02] md:col-span-2 border border-yellow-400/40"
                      >
                        <span className="flex items-center gap-2.5">
                          <ShieldCheck size={20} className="text-yellow-300" />{" "}
                          👑 Reseller Admin Control & VIP Rates (
                          {ensureArray(approvedResellers).length})
                        </span>
                        <ArrowRight size={18} />
                      </button>

                      <button
                        onClick={() => setStaffTab("addPanel")}
                        className="bg-gradient-to-r from-pink-600 to-fuchsia-600 hover:from-pink-500 hover:to-fuchsia-500 p-4 rounded-xl text-white font-black text-sm uppercase flex items-center justify-between shadow-[0_0_20px_rgba(217,70,239,0.3)] transition-all hover:scale-[1.02]"
                      >
                        <span className="flex items-center gap-2.5">
                          <PlusCircle size={20} /> ➕ Add New Store Panel
                        </span>
                        <ArrowRight size={18} />
                      </button>

                      <button
                        onClick={() => setStaffTab("house")}
                        className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 p-4 rounded-xl text-white font-black text-sm uppercase flex items-center justify-between shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all hover:scale-[1.02]"
                      >
                        <span className="flex items-center gap-2.5">
                          <Home size={20} /> 🏠 House / 24Ghanta Private Panel
                        </span>
                        <ArrowRight size={18} />
                      </button>

                      <button
                        onClick={() => setStaffTab("managePanels")}
                        className="bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 p-4 rounded-xl text-white font-black text-sm uppercase flex items-center justify-between shadow-[0_0_20px_rgba(244,63,94,0.3)] transition-all hover:scale-[1.02]"
                      >
                        <span className="flex items-center gap-2.5">
                          <Trash2 size={20} /> 🗑️ Delete & Edit Active Panels
                        </span>
                        <ArrowRight size={18} />
                      </button>

                      <button
                        onClick={() => setStaffTab("supportLinks")}
                        className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 p-4 rounded-xl text-white font-black text-sm uppercase flex items-center justify-between shadow-[0_0_20px_rgba(56,189,248,0.3)] transition-all hover:scale-[1.02]"
                      >
                        <span className="flex items-center gap-2.5">
                          <Send size={20} /> 💬 Set Telegram & WhatsApp Links
                        </span>
                        <ArrowRight size={18} />
                      </button>

                      <button
                        onClick={() => setStaffTab("users")}
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 p-4 rounded-xl text-white font-black text-sm uppercase flex items-center justify-between shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all hover:scale-[1.02]"
                      >
                        <span className="flex items-center gap-2.5">
                          <User size={20} /> 👥 All Registered Users (
                          {registeredUsers.length})
                        </span>
                        <ArrowRight size={18} />
                      </button>

                      <button
                        onClick={() => setStaffTab("colorTheme")}
                        className="bg-rainbow-animated border-2 border-white hover:from-cyan-500 hover:to-blue-500 p-4 rounded-xl text-white font-black text-sm uppercase flex items-center justify-between shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all hover:scale-[1.02]"
                      >
                        <span className="flex items-center gap-2.5">
                          <Palette size={20} /> 🎨 Color Changes
                        </span>
                        <ArrowRight size={18} />
                      </button>

                      <button
                        onClick={() => setStaffTab("payments")}
                        className="bg-rainbow-animated border-2 border-white hover:from-emerald-500 hover:to-teal-500 p-4 rounded-xl text-white font-black text-sm uppercase flex items-center justify-between shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all hover:scale-[1.02] md:col-span-2"
                      >
                        <span className="flex items-center gap-2.5">
                          <Wallet size={20} /> 💰 Money & Payments ("Kisne Kisne
                          Paisa Lagaya")
                        </span>
                        <ArrowRight size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STAFF TAB: RESELLERS & DIFFERENTIAL PRICING */}
              {staffTab === "resellers" && (
                <div className="flex flex-col gap-4">
                  {/* Reseller Admin Header & Metrics */}
                  <div className="bg-transparent  border border-amber-500/40 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="text-lg font-black text-amber-400 flex items-center gap-2 uppercase tracking-wide">
                          <ShieldCheck size={22} className="text-yellow-400" />{" "}
                          👑 RESELLER MANAGEMENT & VIP RATES
                        </h3>
                        <p className="text-gray-300 text-xs">
                          Yahan se aap Reseller Gmail IDs approve kar sakte
                          hain, unka Wallet Balance manage kar sakte hain aur
                          Special Reseller VIP Rates configure kar sakte hain.
                        </p>
                      </div>
                      <span className="bg-yellow-400 text-black font-black text-[11px] px-3 py-1 rounded-xl uppercase tracking-wider self-start shrink-0 shadow-md">
                        {ensureArray(approvedResellers).length} Resellers
                      </span>
                    </div>

                    {/* Reseller Summary Metrics */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      <div className="bg-transparent border border-yellow-500/30 p-3 rounded-xl flex flex-col items-center justify-center text-center">
                        <Users size={18} className="text-yellow-400 mb-1" />
                        <span className="text-gray-400 text-[10px] font-bold uppercase">
                          Total Resellers
                        </span>
                        <span className="text-yellow-300 font-black text-base">
                          {ensureArray(approvedResellers).length}
                        </span>
                      </div>
                      <div className="bg-transparent border border-emerald-500/30 p-3 rounded-xl flex flex-col items-center justify-center text-center">
                        <Wallet size={18} className="text-emerald-400 mb-1" />
                        <span className="text-gray-400 text-[10px] font-bold uppercase">
                          Reseller Float
                        </span>
                        <span className="text-emerald-400 font-black text-base">
                          ₹
                          {ensureArray(approvedResellers).reduce(
                            (acc, curr) => acc + (Number(curr.balance) || 0),
                            0,
                          )}
                        </span>
                      </div>
                      <div className="bg-transparent border border-cyan-500/30 p-3 rounded-xl flex flex-col items-center justify-center text-center col-span-2 sm:col-span-1">
                        <Percent size={18} className="text-cyan-400 mb-1" />
                        <span className="text-gray-400 text-[10px] font-bold uppercase">
                          Default VIP Discount
                        </span>
                        <span className="text-cyan-300 font-black text-base">
                          35% OFF (₹50 vs ₹90)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Add New Approved Reseller Form */}
                  <div className="bg-transparent  border border-amber-500/30 rounded-2xl p-5 shadow-xl flex flex-col gap-3 text-left">
                    <h4 className="text-sm font-black text-white uppercase flex items-center gap-2">
                      <PlusCircle size={18} className="text-amber-400" /> ➕ Add
                      / Approve New Reseller Gmail
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-amber-300 text-xs font-bold block mb-1">
                          Reseller Gmail ID (Google Account) *
                        </label>
                        <input
                          type="email"
                          placeholder="e.g., pramk9992@gmail.com"
                          value={newResellerForm.email}
                          onChange={(e) =>
                            setNewResellerForm({
                              ...newResellerForm,
                              email: e.target.value,
                            })
                          }
                          className="w-full bg-transparent border border-white/20 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="text-amber-300 text-xs font-bold block mb-1">
                          Reseller Name / Business
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., Pramod VIP Reseller"
                          value={newResellerForm.name}
                          onChange={(e) =>
                            setNewResellerForm({
                              ...newResellerForm,
                              name: e.target.value,
                            })
                          }
                          className="w-full bg-transparent border border-white/20 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="text-amber-300 text-xs font-bold block mb-1">
                          Contact Mobile Number
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., 9876543210"
                          value={newResellerForm.phone}
                          onChange={(e) =>
                            setNewResellerForm({
                              ...newResellerForm,
                              phone: e.target.value,
                            })
                          }
                          className="w-full bg-transparent border border-white/20 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="text-amber-300 text-xs font-bold block mb-1">
                          Initial Wallet Balance (₹)
                        </label>
                        <input
                          type="number"
                          placeholder="500"
                          value={newResellerForm.balance}
                          onChange={(e) =>
                            setNewResellerForm({
                              ...newResellerForm,
                              balance: Number(e.target.value),
                            })
                          }
                          className="w-full bg-transparent border border-white/20 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const emailVal = newResellerForm.email
                          .toLowerCase()
                          .trim();
                        if (!emailVal || !emailVal.includes("@")) {
                          alert("Kripya valid Gmail ID enter karein!");
                          return;
                        }
                        const existingIdx = approvedResellers.findIndex(
                          (r) => r.email.toLowerCase() === emailVal,
                        );
                        if (existingIdx !== -1) {
                          alert(
                            "Yeh Gmail ID pehle se Approved Resellers list mein mojud hai!",
                          );
                          return;
                        }

                        const newObj = {
                          email: emailVal,
                          name: newResellerForm.name || "VIP Reseller",
                          phone: newResellerForm.phone || "",
                          balance: Number(newResellerForm.balance) || 0,
                          isApproved: true,
                          discountPercent: 35,
                          createdAt: new Date().toLocaleString(),
                        };

                        setApprovedResellers((prev) => [newObj, ...prev]);
                        alert(
                          `✅ Reseller "${emailVal}" successfully Approved with ₹${newObj.balance} Wallet Balance!`,
                        );
                        setNewResellerForm({
                          email: "",
                          name: "",
                          phone: "",
                          balance: 500,
                          isApproved: true,
                        });
                      }}
                      className="mt-2 w-full bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black py-3 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-2 active:scale-95"
                    >
                      <ShieldCheck size={18} /> ➕ APPROVE & ADD RESELLER TO
                      DATABASE
                    </button>
                  </div>

                  {/* Resellers Search & List */}
                  <div className="bg-transparent  border border-white/10 rounded-2xl p-5 shadow-xl flex flex-col gap-3 text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h4 className="text-sm font-black text-white uppercase flex items-center gap-2">
                        <Users size={18} className="text-cyan-400" /> Approved
                        Resellers List ({ensureArray(approvedResellers).length})
                      </h4>
                      <input
                        type="text"
                        placeholder="Search reseller by email / name..."
                        value={searchResellerQuery}
                        onChange={(e) => setSearchResellerQuery(e.target.value)}
                        className="bg-transparent border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 w-full sm:w-64"
                      />
                    </div>

                    <div className="flex flex-col gap-2.5 mt-1">
                      {ensureArray(approvedResellers)
                        .filter((r) => {
                          const q = searchResellerQuery.toLowerCase().trim();
                          return (
                            !q ||
                            r.email.toLowerCase().includes(q) ||
                            (r.name && r.name.toLowerCase().includes(q))
                          );
                        })
                        .map((reseller, rIdx) => (
                          <div
                            key={`reseller-row-${reseller.email}-${rIdx}`}
                            className="bg-transparent border border-yellow-500/30 rounded-xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md hover:border-yellow-400/60 transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-yellow-500/20 border border-yellow-400/50 flex items-center justify-center shrink-0">
                                <Award className="text-yellow-400" size={22} />
                              </div>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="text-white font-black text-sm">
                                    {reseller.name || "VIP Reseller"}
                                  </span>
                                  {reseller.isApproved ? (
                                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                                      <CheckCircle size={10} /> APPROVED VIP
                                    </span>
                                  ) : (
                                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                                      PENDING
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-yellow-300 font-mono select-all">
                                  {reseller.email}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  {reseller.phone
                                    ? `Phone: ${reseller.phone} • `
                                    : ""}
                                  Added: {reseller.createdAt || "Active"}
                                </span>
                              </div>
                            </div>

                            {/* Wallet Controls & Actions */}
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Wallet Balance Tag */}
                              <div className="bg-transparent border border-emerald-500/40 px-3 py-1.5 rounded-xl flex items-center gap-2">
                                <span className="text-[10px] text-gray-400 font-bold uppercase">
                                  Balance:
                                </span>
                                <span className="text-emerald-400 font-black text-sm font-mono">
                                  ₹{reseller.balance}
                                </span>
                              </div>

                              {/* Quick Add Funds */}
                              <div className="flex items-center gap-1">
                                {[100, 500, 1000].map((addAmt) => (
                                  <button
                                    key={`add-${reseller.email}-${addAmt}`}
                                    onClick={() => {
                                      const newBal =
                                        (Number(reseller.balance) || 0) +
                                        addAmt;
                                      setApprovedResellers((prev) =>
                                        prev.map((r) =>
                                          r.email.toLowerCase() ===
                                          reseller.email.toLowerCase()
                                            ? { ...r, balance: newBal }
                                            : r,
                                        ),
                                      );
                                      if (
                                        resellerUser.email.toLowerCase() ===
                                        reseller.email.toLowerCase()
                                      ) {
                                        setResellerUser((prev) => ({
                                          ...prev,
                                          balance: newBal,
                                        }));
                                      }
                                      alert(
                                        `✅ +₹${addAmt} added to ${reseller.email}'s wallet! New Balance: ₹${newBal}`,
                                      );
                                    }}
                                    className="bg-emerald-600/30 hover:bg-emerald-600/60 border border-emerald-500/40 text-emerald-300 font-black text-[10px] px-2 py-1.5 rounded-lg transition-all"
                                  >
                                    +₹{addAmt}
                                  </button>
                                ))}

                                {/* Custom Balance Button */}
                                <button
                                  onClick={() => {
                                    const customVal = prompt(
                                      `Enter custom balance for ${reseller.email}:`,
                                      String(reseller.balance),
                                    );
                                    if (
                                      customVal !== null &&
                                      !isNaN(Number(customVal))
                                    ) {
                                      const parsed = Math.max(
                                        0,
                                        Number(customVal),
                                      );
                                      setApprovedResellers((prev) =>
                                        prev.map((r) =>
                                          r.email.toLowerCase() ===
                                          reseller.email.toLowerCase()
                                            ? { ...r, balance: parsed }
                                            : r,
                                        ),
                                      );
                                      if (
                                        resellerUser.email.toLowerCase() ===
                                        reseller.email.toLowerCase()
                                      ) {
                                        setResellerUser((prev) => ({
                                          ...prev,
                                          balance: parsed,
                                        }));
                                      }
                                      alert(
                                        `✅ Updated wallet balance for ${reseller.email} to ₹${parsed}`,
                                      );
                                    }
                                  }}
                                  className="bg-cyan-600/30 hover:bg-cyan-600/60 border border-cyan-500/40 text-cyan-300 font-black text-[10px] px-2.5 py-1.5 rounded-lg transition-all"
                                >
                                  Edit ₹
                                </button>
                              </div>

                              {/* Status Toggle */}
                              <button
                                onClick={() => {
                                  const toggled = !reseller.isApproved;
                                  setApprovedResellers((prev) =>
                                    prev.map((r) =>
                                      r.email.toLowerCase() ===
                                      reseller.email.toLowerCase()
                                        ? { ...r, isApproved: toggled }
                                        : r,
                                    ),
                                  );
                                  if (
                                    resellerUser.email.toLowerCase() ===
                                    reseller.email.toLowerCase()
                                  ) {
                                    setResellerUser((prev) => ({
                                      ...prev,
                                      isApproved: toggled,
                                    }));
                                  }
                                  alert(
                                    `Reseller status for ${reseller.email} updated to: ${toggled ? "APPROVED" : "DISABLED"}`,
                                  );
                                }}
                                className={`text-[10px] font-black px-2.5 py-1.5 rounded-lg border transition-all ${
                                  reseller.isApproved
                                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30"
                                    : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
                                }`}
                              >
                                {reseller.isApproved
                                  ? "Disable VIP"
                                  : "Approve VIP"}
                              </button>

                              {/* Delete Reseller */}
                              <button
                                onClick={() => {
                                  if (
                                    confirm(
                                      `Kya aap sach me ${reseller.email} ko Resellers list se delete karna chahte hain?`,
                                    )
                                  ) {
                                    setApprovedResellers((prev) =>
                                      prev.filter(
                                        (r) =>
                                          r.email.toLowerCase() !==
                                          reseller.email.toLowerCase(),
                                      ),
                                    );
                                    if (
                                      resellerUser.email.toLowerCase() ===
                                      reseller.email.toLowerCase()
                                    ) {
                                      setResellerUser({
                                        isLoggedIn: false,
                                        email: "",
                                        name: "",
                                        balance: 0,
                                        isApproved: false,
                                      });
                                    }
                                    alert(
                                      `Reseller ${reseller.email} deleted.`,
                                    );
                                  }
                                }}
                                className="p-1.5 bg-red-600/20 hover:bg-red-600/40 border border-red-500/40 text-red-300 rounded-lg transition-all"
                                title="Delete Reseller"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}

                      {ensureArray(approvedResellers).length === 0 && (
                        <div className="p-4 text-center text-gray-400 text-xs bg-transparent rounded-xl border border-white/10">
                          Abhi koi Reseller add nahi hua hai. Upar diye gaye
                          form se naya Reseller Gmail ID add karein.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Differential Pricing Rate Overview Table */}
                  <div className="bg-transparent  border border-cyan-500/30 rounded-2xl p-5 shadow-xl flex flex-col gap-3 text-left">
                    <h4 className="text-sm font-black text-cyan-400 uppercase flex items-center gap-2">
                      <Percent size={18} /> Differential Pricing Matrix (Normal
                      vs Reseller VIP Price)
                    </h4>
                    <p className="text-gray-300 text-xs">
                      Reseller ko har panel par Special VIP Rates (jaise ₹90 ke
                      badle ₹50 ya 35% discount) automatically milta hai jab vah
                      Google login ya Secret Code se login hota hai.
                    </p>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="border-b border-white/10 text-gray-400">
                            <th className="py-2 px-3 font-bold">Panel Name</th>
                            <th className="py-2 px-3 font-bold">Category</th>
                            <th className="py-2 px-3 font-bold">
                              Normal Price
                            </th>
                            <th className="py-2 px-3 font-bold text-yellow-300">
                              👑 VIP Reseller Price
                            </th>
                            <th className="py-2 px-3 font-bold text-emerald-400">
                              Reseller Profit / Margin
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {panels.slice(0, 8).map((p, idx) => {
                            const p1 = p.pricing?.[0]?.price || 90;
                            const resP =
                              (p.pricing?.[0] as any)?.resellerPrice !== undefined
                                ? (p.pricing?.[0] as any).resellerPrice
                                : Math.round(p1 * 0.65);
                            const margin = p1 - resP;
                            return (
                              <tr
                                key={`diff-price-${p.id}-${idx}`}
                                className="hover:bg-transparent"
                              >
                                <td className="py-2 px-3 font-bold text-white">
                                  {p.title}
                                </td>
                                <td className="py-2 px-3 text-cyan-300">
                                  {p.category}
                                </td>
                                <td className="py-2 px-3 line-through text-gray-400">
                                  ₹{p1} ({p.pricing?.[0]?.label || "1 Day"})
                                </td>
                                <td className="py-2 px-3 font-black text-yellow-300 font-mono">
                                  ₹{resP}
                                </td>
                                <td className="py-2 px-3 font-bold text-emerald-400">
                                  +₹{margin} ({((margin / p1) * 100).toFixed(0)}
                                  % Profit)
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* STAFF TAB: COLOR THEME */}
              {staffTab === "colorTheme" && (
                <div className="flex flex-col gap-4">
                  <div className="bg-transparent  border border-cyan-500/40 rounded-2xl p-5 shadow-2xl flex flex-col gap-5 text-left">
                    <h3 className="text-lg font-black text-cyan-400 flex items-center gap-2 uppercase tracking-wide">
                      <Palette size={20} /> 🎨 Theme Color Changes
                    </h3>
                    <p className="text-gray-300 text-xs">
                      Yahan se aap website ka rang (color theme) apne hisaab se
                      badal sakte hain. Niche diye gaye 7 rangon mein se koi ek
                      chunein.
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                      {[
                        {
                          name: "Pink / Fuchsia",
                          hue: 0,
                          colorClass: "bg-pink-500",
                        },
                        {
                          name: "Red Theme",
                          hue: 60,
                          colorClass: "bg-red-500",
                        },
                        {
                          name: "Orange Theme",
                          hue: 90,
                          colorClass: "bg-orange-500",
                        },
                        {
                          name: "Yellow Theme",
                          hue: 120,
                          colorClass: "bg-yellow-500",
                        },
                        {
                          name: "Green Theme",
                          hue: 180,
                          colorClass: "bg-green-500",
                        },
                        {
                          name: "Cyan Theme",
                          hue: 240,
                          colorClass: "bg-cyan-500",
                        },
                        {
                          name: "Blue Theme",
                          hue: 280,
                          colorClass: "bg-blue-500",
                        },
                        {
                          name: "Purple Theme",
                          hue: 330,
                          colorClass: "bg-purple-500",
                        },
                      ].map((theme) => (
                        <button
                          key={`theme-${theme.name}`}
                          onClick={() =>
                            setBgSettings({
                              ...bgSettings,
                              themeHue: theme.hue,
                            })
                          }
                          className={`relative p-3 rounded-xl font-bold text-xs uppercase transition-all duration-300 border-2 overflow-hidden flex flex-col items-center gap-2
                            ${bgSettings.themeHue === theme.hue ? "border-white scale-105 shadow-[0_0_20px_rgba(255,255,255,0.4)]" : "border-transparent hover:border-white/30 hover:scale-105"}
                          `}
                        >
                          <div
                            className={`w-8 h-8 rounded-full ${theme.colorClass} shadow-inner border border-white/20`}
                          />
                          <span className="text-white z-10 text-center leading-tight">
                            {theme.name}
                          </span>
                          {bgSettings.themeHue === theme.hue && (
                            <div className="absolute inset-0 bg-transparent z-0"></div>
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="mt-2 text-center text-[10px] text-gray-400 italic">
                      Note: Rang badalne par website ka global gradient aur
                      buttons ka color change ho jayega.
                    </div>
                  </div>
                </div>
              )}

              {/* STAFF TAB 2: ADD PANEL */}
              {staffTab === "addPanel" && (
                <div className="bg-transparent  border border-fuchsia-500/40 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 text-left">
                  <div className="flex items-center justify-between flex-wrap gap-2 border-b border-white/10 pb-3">
                    <h3 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-wide">
                      <PlusCircle size={20} className="text-fuchsia-400" /> ➕ ADD NEW PANEL TO STORE
                    </h3>
                    <span className="text-xs bg-fuchsia-500/20 text-fuchsia-300 font-bold px-2.5 py-1 rounded-full border border-fuchsia-500/40">
                      Live Store Creator
                    </span>
                  </div>

                  <p className="text-gray-300 text-xs leading-relaxed">
                    Naye panel ki poori details (Name, Photo/Video, Features, Install Link, Video Feedback Telegram/WhatsApp link, aur Custom Pricing) yahan daal kar direct Store par publish karein.
                  </p>

                  <div className="flex flex-col gap-4 bg-transparent p-4 sm:p-5 rounded-2xl border border-white/10 shadow-inner">
                    {/* 1. PANEL NAME & CATEGORY */}
                    <div className="bg-transparent p-3.5 rounded-xl border border-white/10 flex flex-col gap-3">
                      <div className="flex items-center gap-2 text-fuchsia-400 font-black text-xs uppercase tracking-wider">
                        <Award size={15} /> 1. PANEL NAME & CATEGORY
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-white font-bold drop-shadow-[0_0_6px_#000] text-xs uppercase block mb-1">
                            Panel Ka Naam (Title) <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g., A,XYZ MAIN ID FF PROXY NONROOT"
                            value={newPanelForm.title}
                            onChange={(e) =>
                              setNewPanelForm({
                                ...newPanelForm,
                                title: e.target.value,
                              })
                            }
                            className="w-full bg-transparent  border border-white/20 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-fuchsia-400 font-semibold"
                          />
                        </div>

                        <div>
                          <label className="text-white font-bold drop-shadow-[0_0_6px_#000] text-xs uppercase block mb-1">
                            Category
                          </label>
                          <select
                            value={newPanelForm.category}
                            onChange={(e) =>
                              setNewPanelForm({
                                ...newPanelForm,
                                category: e.target.value,
                              })
                            }
                            className="w-full bg-transparent  border border-white/20 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-fuchsia-400 font-semibold cursor-pointer"
                          >
                            <option value="NON ROOT">NON ROOT</option>
                            <option value="24ghanta">24ghanta / HOUSE</option>
                            <option value="ROOT">ROOT</option>
                            <option value="ANDROID">ANDROID</option>
                            <option value="IOS">IOS</option>
                            <option value="FREE FIRE">FREE FIRE</option>
                            <option value="SPECIAL">SPECIAL</option>
                            <option value="VIP CHEATS">VIP CHEATS</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-gray-400 text-[11px] font-bold uppercase block mb-1">
                          Tagline / Badge Text
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., PREMIUM PANELS, 100% SAFE, VIP PRIVATE"
                          value={newPanelForm.badge || ""}
                          onChange={(e) =>
                            setNewPanelForm({
                              ...newPanelForm,
                              badge: e.target.value,
                            })
                          }
                          className="w-full bg-transparent border border-white/10 rounded-lg py-2 px-3 text-xs text-gray-200 focus:outline-none focus:border-fuchsia-400"
                        />
                      </div>
                    </div>

                    {/* 2. PANEL PHOTO & VIDEO */}
                    <div className="bg-transparent p-3.5 rounded-xl border border-white/10 flex flex-col gap-3">
                      <div className="flex items-center gap-2 text-cyan-400 font-black text-xs uppercase tracking-wider">
                        <Camera size={15} /> 2. PANEL PHOTO & VIDEO (MEDIA)
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Photo URL & Upload */}
                        <div>
                          <label className="text-white font-bold drop-shadow-[0_0_6px_#000] text-xs uppercase block mb-1">
                            Panel Photo / Banner URL
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Image URL or Upload from device..."
                              value={newPanelForm.image}
                              onChange={(e) =>
                                setNewPanelForm({
                                  ...newPanelForm,
                                  image: e.target.value,
                                })
                              }
                              className="flex-1 bg-transparent border border-white/20 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-cyan-400"
                            />
                            <label className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-3 py-2.5 rounded-xl cursor-pointer flex items-center gap-1 shrink-0 transition-all active:scale-95 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                              {isUploadingMedia ? (
                                <span className="flex items-center gap-1 text-xs animate-pulse">
                                  <Loader2 className="animate-spin" size={14} /> Uploading...
                                </span>
                              ) : (
                                <>
                                  <Camera size={14} /> Upload Photo
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        processAsyncMediaUpload(
                                          file,
                                          () => setIsUploadingMedia(true),
                                          (url) => {
                                            setNewPanelForm((prev) => ({
                                              ...prev,
                                              image: url,
                                            }));
                                            setIsUploadingMedia(false);
                                          },
                                        );
                                      }
                                    }}
                                  />
                                </>
                              )}
                            </label>
                          </div>
                        </div>

                        {/* Video Link & Upload */}
                        <div>
                          <label className="text-white font-bold drop-shadow-[0_0_6px_#000] text-xs uppercase block mb-1">
                            Panel Live Video Link / Demo Video
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="YouTube Link, MP4 URL, or Upload..."
                              value={newPanelForm.videoLink}
                              onChange={(e) =>
                                setNewPanelForm({
                                  ...newPanelForm,
                                  videoLink: e.target.value,
                                })
                              }
                              className="flex-1 bg-transparent border border-white/20 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-cyan-400"
                            />
                            <label className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-3 py-2.5 rounded-xl cursor-pointer flex items-center gap-1 shrink-0 transition-all active:scale-95 shadow-[0_0_15px_rgba(225,29,72,0.4)]">
                              {isUploadingVideoMedia ? (
                                <span className="flex items-center gap-1 text-xs animate-pulse">
                                  <Loader2 className="animate-spin" size={14} /> Uploading...
                                </span>
                              ) : (
                                <>
                                  <Play size={14} /> Upload Video
                                  <input
                                    type="file"
                                    accept="video/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        processAsyncMediaUpload(
                                          file,
                                          () => setIsUploadingVideoMedia(true),
                                          (url, isVid) => {
                                            setNewPanelForm((prev) => ({
                                              ...prev,
                                              videoLink: url,
                                              isVideo: isVid,
                                            }));
                                            setIsUploadingVideoMedia(false);
                                          },
                                        );
                                      }
                                    }}
                                  />
                                </>
                              )}
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300 select-none">
                          <input
                            type="checkbox"
                            checked={newPanelForm.isVideo}
                            onChange={(e) =>
                              setNewPanelForm({
                                ...newPanelForm,
                                isVideo: e.target.checked,
                              })
                            }
                            className="w-4 h-4 rounded text-fuchsia-600 focus:ring-fuchsia-500 bg-transparent border-white/30"
                          />
                          <span>Card par Main Thumbnail me Video Mode on rakhein</span>
                        </label>

                        {/* Quick Thumbnail Preview */}
                        {(newPanelForm.image || newPanelForm.videoLink) && (
                          <div className="flex items-center gap-2 bg-transparent px-3 py-1.5 rounded-lg border border-white/10">
                            <span className="text-[10px] text-gray-400 font-bold uppercase">Preview:</span>
                            {newPanelForm.image && (
                              <img
                                src={newPanelForm.image}
                                alt="Preview"
                                className="w-8 h-8 rounded object-cover border border-white/20"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = "none";
                                }}
                              />
                            )}
                            <span className="text-[11px] text-green-400 font-bold">Media Ready ✅</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 3. PANEL FEATURES LIST */}
                    <div className="bg-transparent p-3.5 rounded-xl border border-white/10 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-yellow-400 font-black text-xs uppercase tracking-wider">
                          <Zap size={15} /> 3. PANEL FEATURES (Kya Kya Feature Hai)
                        </div>
                        <span className="text-[10px] text-gray-400">1 Feature Per Line</span>
                      </div>

                      <textarea
                        rows={4}
                        placeholder="Main Id safe&#10;Full safe NONROOT&#10;Esp crack anti-blacklist&#10;Auto headshot 100% working&#10;Location ESP&#10;24ghanta Safe"
                        value={newPanelForm.featuresText}
                        onChange={(e) =>
                          setNewPanelForm({
                            ...newPanelForm,
                            featuresText: e.target.value,
                          })
                        }
                        className="w-full bg-transparent border border-white/20 rounded-xl py-2.5 px-3 text-xs font-mono text-white focus:outline-none focus:border-yellow-400"
                      />

                      {/* Quick Feature Chips */}
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Quick Add:</span>
                        {[
                          "Main Id safe",
                          "Full safe NONROOT",
                          "Esp crack anti-blacklist",
                          "Auto headshot 100% working",
                          "24ghanta Safe",
                          "Location ESP & Aimlock",
                          "Anti-Ban 100% Safe Bypass",
                          "VIP Fast Injection",
                        ].map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => {
                              const current = newPanelForm.featuresText ? newPanelForm.featuresText.trim() : "";
                              const updated = current ? `${current}\n${chip}` : chip;
                              setNewPanelForm({
                                ...newPanelForm,
                                featuresText: updated,
                              });
                            }}
                            className="bg-yellow-500/10 hover:bg-yellow-500/25 border border-yellow-500/30 text-yellow-300 text-[10px] font-bold px-2 py-0.5 rounded-md transition-all active:scale-95"
                          >
                            + {chip}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 4. INSTALL PANEL BUTTON LINK */}
                    <div className="bg-transparent p-3.5 rounded-xl border border-white/10 flex flex-col gap-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-cyan-400 font-black text-xs uppercase tracking-wider">
                          <Download size={15} /> 4. "INSTALL PANEL" BUTTON KA LINK
                        </div>
                        <span className="text-[10px] text-cyan-300/80 font-mono">INSTALL/PANEL Button</span>
                      </div>
                      <p className="text-gray-400 text-[11px]">
                        Website par customer jab <strong className="text-cyan-300">INSTALL/PANEL</strong> button dabayega to ye link khulega (Telegram Channel, Direct APK link, Google Drive, Mediafire ya Custom URL).
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g., https://t.me/yourchannel ya Direct APK Download link..."
                          value={newPanelForm.installLink}
                          onChange={(e) =>
                            setNewPanelForm({
                              ...newPanelForm,
                              installLink: e.target.value,
                            })
                          }
                          className="flex-1 bg-transparent border border-white/20 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setNewPanelForm({
                              ...newPanelForm,
                              installLink: supportLinks.telegram || "https://t.me/yourchannel",
                            })
                          }
                          className="bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-400/40 text-cyan-200 text-xs font-bold px-3 py-2.5 rounded-xl whitespace-nowrap transition-all active:scale-95"
                        >
                          📎 Use Telegram
                        </button>
                      </div>
                    </div>

                    {/* 5. VIDEO / FEEDBACK PROOF LINK (Photo, Video, Telegram & WhatsApp) */}
                    <div className="bg-transparent p-3.5 rounded-xl border border-white/10 flex flex-col gap-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-rose-400 font-black text-xs uppercase tracking-wider">
                          <Play size={15} /> 5. "VIDEO / FEEDBACK" PROOF LINK & MEDIA
                        </div>
                        <span className="text-[10px] text-rose-300/80 font-mono">VIDEO/FEEDBACK Button</span>
                      </div>
                      <p className="text-gray-400 text-[11px]">
                        Website par customer jab <strong className="text-rose-300">VIDEO/FEEDBACK</strong> button dabayega to ye open hoga. Aap isme <strong>Telegram channel/proof link, WhatsApp group/support link, YouTube proof video, direct photo/video URL</strong> daal sakte hain ya <strong>Photo/Video direct upload</strong> kar sakte hain.
                      </p>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Telegram proof link, WhatsApp link, YouTube link ya Proof Media URL..."
                          value={newPanelForm.feedbackLink}
                          onChange={(e) =>
                            setNewPanelForm({
                              ...newPanelForm,
                              feedbackLink: e.target.value,
                            })
                          }
                          className="flex-1 bg-transparent border border-white/20 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-rose-400 font-mono"
                        />
                        <label className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-3 py-2.5 rounded-xl cursor-pointer flex items-center gap-1 shrink-0 transition-all active:scale-95 shadow-[0_0_15px_rgba(225,29,72,0.4)]">
                          {isUploadingFeedbackMedia ? (
                            <span className="flex items-center gap-1 text-xs animate-pulse">
                              <Loader2 className="animate-spin" size={14} /> Uploading...
                            </span>
                          ) : (
                            <>
                              <Camera size={14} /> Upload Proof
                              <input
                                type="file"
                                accept="image/*,video/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    processAsyncMediaUpload(
                                      file,
                                      () => setIsUploadingFeedbackMedia(true),
                                      (url) => {
                                        setNewPanelForm((prev) => ({
                                          ...prev,
                                          feedbackLink: url,
                                        }));
                                        setIsUploadingFeedbackMedia(false);
                                      },
                                    );
                                  }
                                }}
                              />
                            </>
                          )}
                        </label>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() =>
                            setNewPanelForm({
                              ...newPanelForm,
                              feedbackLink: supportLinks.telegram || "https://t.me/yourchannel",
                            })
                          }
                          className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/40 text-blue-300 text-xs font-bold px-3 py-1 rounded-lg flex items-center gap-1 transition-all active:scale-95"
                        >
                          💬 Set Telegram Link
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setNewPanelForm({
                              ...newPanelForm,
                              feedbackLink: supportLinks.whatsapp || "https://wa.me/919999999999",
                            })
                          }
                          className="bg-green-500/20 hover:bg-green-500/30 border border-green-400/40 text-green-300 text-xs font-bold px-3 py-1 rounded-lg flex items-center gap-1 transition-all active:scale-95"
                        >
                          🟢 Set WhatsApp Link
                        </button>
                      </div>
                    </div>

                    {/* 6. PANEL PRICING & CUSTOM PLAN NAMES */}
                    <div className="bg-transparent p-3.5 rounded-xl border border-white/10 flex flex-col gap-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2 text-emerald-400 font-black text-xs uppercase tracking-wider">
                          <Coins size={15} /> 6. PANEL PRICING & CUSTOM PLAN NAMES (₹)
                        </div>
                        <span className="text-[10px] text-emerald-300/80">Plan Name + Price customize karein</span>
                      </div>

                      <p className="text-gray-400 text-[11px]">
                        Aap har plan ka <strong>Naam (e.g. 1 Day, 3 Day, 15 House, 24 House, VIP Lifetime, 1 Month)</strong> aur uska <strong>Price (₹)</strong> apne hisaab se likh sakte hain. Store dropdown me vahi show hoga!
                      </p>

                      {/* Dynamic Pricing Plans List */}
                      <div className="flex flex-col gap-2">
                        {(newPanelForm.pricingPlans || []).map((plan, pIdx) => (
                          <div
                            key={`plan-row-${pIdx}`}
                            className="flex items-center gap-2 bg-transparent p-2 rounded-xl border border-white/10"
                          >
                            <span className="text-xs font-bold text-gray-400 w-5 text-center">
                              #{pIdx + 1}
                            </span>
                            <div className="flex-1">
                              <label className="text-[10px] text-gray-400 block font-bold uppercase mb-0.5">
                                Plan Name / Duration (Label)
                              </label>
                              <input
                                type="text"
                                placeholder="e.g., 1 Day, 15 House, VIP Lifetime..."
                                value={plan.label}
                                onChange={(e) => {
                                  const updated = [...(newPanelForm.pricingPlans || [])];
                                  updated[pIdx] = { ...updated[pIdx], label: e.target.value };
                                  setNewPanelForm({
                                    ...newPanelForm,
                                    pricingPlans: updated,
                                  });
                                }}
                                className="w-full bg-transparent border border-white/20 rounded-lg py-1.5 px-2.5 text-xs text-white font-semibold focus:outline-none focus:border-emerald-400"
                              />
                            </div>
                            <div className="w-28 sm:w-36">
                              <label className="text-[10px] text-gray-400 block font-bold uppercase mb-0.5">
                                Price (₹)
                              </label>
                              <div className="relative">
                                <span className="absolute left-2.5 top-1.5 text-xs text-emerald-400 font-bold">₹</span>
                                <input
                                  type="number"
                                  placeholder="90"
                                  value={plan.price}
                                  onChange={(e) => {
                                    const updated = [...(newPanelForm.pricingPlans || [])];
                                    updated[pIdx] = { ...updated[pIdx], price: Number(e.target.value) };
                                    setNewPanelForm({
                                      ...newPanelForm,
                                      pricingPlans: updated,
                                    });
                                  }}
                                  className="w-full bg-transparent border border-white/20 rounded-lg py-1.5 pl-6 pr-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-emerald-400"
                                />
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = (newPanelForm.pricingPlans || []).filter((_, idx) => idx !== pIdx);
                                setNewPanelForm({
                                  ...newPanelForm,
                                  pricingPlans: updated.length > 0 ? updated : [{ label: "1 Day", price: 90 }],
                                });
                              }}
                              className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 rounded-lg transition-colors mt-3"
                              title="Delete Plan"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Add Plan & Quick Presets */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            const current = newPanelForm.pricingPlans || [];
                            setNewPanelForm({
                              ...newPanelForm,
                              pricingPlans: [
                                ...current,
                                { label: `${current.length + 1} Day`, price: 100 },
                              ],
                            });
                          }}
                          className="bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-400/40 text-emerald-300 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all active:scale-95 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                        >
                          <PlusCircle size={14} /> ➕ Add Another Plan / Price
                        </button>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] text-gray-400 font-bold uppercase">Presets:</span>
                          <button
                            type="button"
                            onClick={() =>
                              setNewPanelForm({
                                ...newPanelForm,
                                pricingPlans: [
                                  { label: "1 Day", price: 90 },
                                  { label: "3 Day", price: 58 },
                                  { label: "7 Day", price: 67 },
                                  { label: "15 Day", price: 590 },
                                  { label: "30 Day", price: 5000 },
                                ],
                              })
                            }
                            className="bg-transparent hover:bg-transparent border border-white/20 text-gray-300 text-[10px] font-bold px-2 py-1 rounded-md"
                          >
                            📅 5-Days
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setNewPanelForm({
                                ...newPanelForm,
                                pricingPlans: [
                                  { label: "3 House", price: 50 },
                                  { label: "7 House", price: 90 },
                                  { label: "15 House", price: 150 },
                                  { label: "24 House", price: 220 },
                                ],
                              })
                            }
                            className="bg-transparent hover:bg-transparent border border-white/20 text-gray-300 text-[10px] font-bold px-2 py-1 rounded-md"
                          >
                            ⏰ House / Hours
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setNewPanelForm({
                                ...newPanelForm,
                                pricingPlans: [
                                  { label: "1 Day VIP", price: 120 },
                                  { label: "7 Days VIP", price: 350 },
                                  { label: "30 Days VIP", price: 999 },
                                  { label: "Lifetime VIP", price: 2999 },
                                ],
                              })
                            }
                            className="bg-transparent hover:bg-transparent border border-white/20 text-gray-300 text-[10px] font-bold px-2 py-1 rounded-md"
                          >
                            👑 VIP Lifetime
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* SAVE & PUBLISH BUTTON */}
                    <button
                      type="button"
                      onClick={() => {
                        if (!newPanelForm.title.trim()) {
                          alert("⚠️ Kripya Panel ka Naam (Title) zaroor enter karein!");
                          return;
                        }

                        const parsedFeatures = parseFeaturesList(newPanelForm.featuresText);

                        const finalPricing =
                          Array.isArray(newPanelForm.pricingPlans) && newPanelForm.pricingPlans.length > 0
                            ? newPanelForm.pricingPlans
                            : [
                                { label: "1 Day", price: newPanelForm.price1 || 90 },
                                { label: "3 Day", price: newPanelForm.price3 || 58 },
                                { label: "7 Day", price: newPanelForm.price7 || 67 },
                                { label: "15 Day", price: newPanelForm.price15 || 590 },
                                { label: "30 Day", price: newPanelForm.price30 || 5000 },
                              ];

                        const newPanelItem = {
                          id: Date.now(),
                          title: newPanelForm.title.trim(),
                          category: newPanelForm.category || "NON ROOT",
                          thumbnailTitle: newPanelForm.title.trim(),
                          thumbnailSub: newPanelForm.badge || "PREMIUM PANELS",
                          image:
                            newPanelForm.image ||
                            "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop",
                          isVideo: Boolean(newPanelForm.isVideo),
                          features: parsedFeatures,
                          installLink: newPanelForm.installLink || supportLinks.telegram,
                          videoLink: newPanelForm.videoLink || newPanelForm.feedbackLink || supportLinks.telegram,
                          feedbackLink: newPanelForm.feedbackLink || supportLinks.telegram,
                          exceptFileLink:
                            newPanelForm.exceptFileLink ||
                            newPanelForm.installLink ||
                            supportLinks.telegram,
                          pricing: finalPricing,
                          pricingPlans: finalPricing,
                          options: finalPricing,
                          price1: finalPricing[0]?.price ?? 90,
                          price3: finalPricing[1]?.price ?? 58,
                          price7: finalPricing[2]?.price ?? 67,
                          price15: finalPricing[3]?.price ?? 590,
                          price30: finalPricing[4]?.price ?? 5000,
                        };

                        const updatedPanelsList = [newPanelItem, ...ensureArray(panels)];
                        setPanels(updatedPanelsList);
                        savePanelsToFirebase(updatedPanelsList);

                        alert(
                          `✅ Naya Panel "${newPanelForm.title}" Store par Successfully Add ho gaya hai!`,
                        );

                        // Reset form
                        setNewPanelForm({
                          title: "",
                          category: "NON ROOT",
                          badge: "PREMIUM PANELS",
                          image: "",
                          isVideo: false,
                          videoLink: "",
                          installLink: "",
                          feedbackLink: "",
                          exceptFileLink: "",
                          featuresText:
                            "Main Id safe\nFull safe NONROOT\nEsp crack anti-blacklist\nAuto headshot 100% working",
                          pricingPlans: [
                            { label: "1 Day", price: 90 },
                            { label: "3 Day", price: 58 },
                            { label: "7 Day", price: 67 },
                            { label: "15 Day", price: 590 },
                            { label: "30 Day", price: 5000 },
                          ],
                          price1: 90,
                          price3: 58,
                          price7: 67,
                          price15: 590,
                          price30: 5000,
                        });
                        setStaffTab("managePanels");
                      }}
                      className="mt-2 w-full bg-gradient-to-r from-fuchsia-600 via-purple-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white font-black py-4 rounded-2xl shadow-[0_0_30px_rgba(217,70,239,0.6)] transition-all uppercase tracking-wider text-sm flex items-center justify-center gap-2 active:scale-95 cursor-pointer border border-fuchsia-400/40"
                    >
                      <PlusCircle size={20} /> ➕ SAVE & PUBLISH NEW PANEL TO STORE
                    </button>
                  </div>
                </div>
              )}

              {/* STAFF TAB: HOUSE / 24GHANTA PRIVATE PANEL */}
              {staffTab === "house" && (
                <div className="bg-transparent  border border-amber-500/40 rounded-2xl p-5 shadow-2xl  flex flex-col gap-4 text-left">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-wide">
                      <Home size={20} className="text-amber-400" /> 🏠 HOUSE /
                      24GHANTA PRIVATE LIMITED PANEL
                    </h3>
                    <p className="text-gray-300 text-xs">
                      Is section me private limited panels add karein jisme
                      Hourly (House) pricing aur dedicated Telegram & WhatsApp
                      links add honge.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 bg-transparent  p-4 rounded-xl border border-amber-500/30">
                    <div>
                      <label className="text-amber-400 font-bold text-xs uppercase block mb-1">
                        PANEL TITLE
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., PRIVATE LIMITED 24GHANTA HOUSE PANEL"
                        value={housePanelForm.title}
                        onChange={(e) =>
                          setHousePanelForm({
                            ...housePanelForm,
                            title: e.target.value,
                          })
                        }
                        className="w-full bg-transparent  border border-white/20 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-amber-400 font-bold text-xs uppercase block mb-1">
                          CATEGORY (Store Search Target)
                        </label>
                        <select
                          value={housePanelForm.category}
                          onChange={(e) =>
                            setHousePanelForm({
                              ...housePanelForm,
                              category: e.target.value,
                            })
                          }
                          className="w-full bg-transparent  border border-white/20 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-amber-400"
                        >
                          <option value="24ghanta">
                            24ghanta (Default Search Category)
                          </option>
                          <option value="HOUSE">HOUSE</option>
                          <option value="NON ROOT">NON ROOT</option>
                          <option value="ROOT">ROOT</option>
                          <option value="SPECIAL">SPECIAL</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-amber-400 font-bold text-xs uppercase block mb-1">
                          IMAGE / THUMBNAIL URL OR UPLOAD
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Thumbnail URL..."
                            value={housePanelForm.image}
                            onChange={(e) =>
                              setHousePanelForm({
                                ...housePanelForm,
                                image: e.target.value,
                              })
                            }
                            className="flex-1 bg-transparent  border border-white/20 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-amber-400"
                          />
                          <label className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-3 py-2.5 rounded-xl cursor-pointer flex items-center gap-1 shrink-0">
                            {isUploadingMedia ? (
                              <span className="flex items-center gap-1 text-xs animate-pulse">
                                <Loader2 className="animate-spin" size={14} />{" "}
                                Uploading...
                              </span>
                            ) : (
                              <>
                                <Camera size={14} /> Upload
                                <input
                                  type="file"
                                  accept="image/*,video/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      processAsyncMediaUpload(
                                        file,
                                        () => setIsUploadingMedia(true),
                                        (url, isVideo) => {
                                          setHousePanelForm((prev) => ({
                                            ...prev,
                                            image: url,
                                            isVideo,
                                          }));
                                          setIsUploadingMedia(false);
                                        },
                                      );
                                    }
                                  }}
                                />
                              </>
                            )}
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Dedicated Telegram & WhatsApp Support Links for this Private Panel */}
                    <div className="bg-transparent  border border-white/10 p-3.5 rounded-xl flex flex-col gap-3">
                      <span className="text-xs font-black text-amber-300 uppercase tracking-wide">
                        💬 DEDICATED PRIVATE SUPPORT LINKS (SPECIAL TELEGRAM &
                        WHATSAPP)
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-sky-400 text-[11px] font-bold block mb-1">
                            Telegram Link (Private Channel / Support)
                          </label>
                          <input
                            type="text"
                            placeholder="https://t.me/your_private_channel"
                            value={housePanelForm.telegramLink}
                            onChange={(e) =>
                              setHousePanelForm({
                                ...housePanelForm,
                                telegramLink: e.target.value,
                              })
                            }
                            className="w-full bg-transparent border border-white/20 rounded-lg p-2 text-xs text-white focus:border-sky-400"
                          />
                        </div>
                        <div>
                          <label className="text-green-400 text-[11px] font-bold block mb-1">
                            WhatsApp Link (Private Support)
                          </label>
                          <input
                            type="text"
                            placeholder="https://wa.me/your_number"
                            value={housePanelForm.whatsappLink}
                            onChange={(e) =>
                              setHousePanelForm({
                                ...housePanelForm,
                                whatsappLink: e.target.value,
                              })
                            }
                            className="w-full bg-transparent border border-white/20 rounded-lg p-2 text-xs text-white focus:border-green-400"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Demo Video Link */}
                    <div>
                      <label className="text-amber-400 font-bold text-xs uppercase block mb-1">
                        DEMO / FEEDBACK VIDEO LINK (YOUTUBE)
                      </label>
                      <input
                        type="text"
                        placeholder="https://youtube.com/watch?v=... or shorts URL"
                        value={housePanelForm.videoLink}
                        onChange={(e) =>
                          setHousePanelForm({
                            ...housePanelForm,
                            videoLink: e.target.value,
                          })
                        }
                        className="w-full bg-transparent  border border-white/20 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    {/* Features Text Area */}
                    <div>
                      <label className="text-amber-400 font-bold text-xs uppercase block mb-1">
                        PANEL FEATURES (1 Feature Per Line)
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Private Limited Main ID Safe&#10;Full safe 24ghanta&#10;Anti-blacklist ESP & Headshot&#10;100% Working Private Panel"
                        value={housePanelForm.featuresText}
                        onChange={(e) =>
                          setHousePanelForm({
                            ...housePanelForm,
                            featuresText: e.target.value,
                          })
                        }
                        className="w-full bg-transparent  border border-white/20 rounded-xl py-2.5 px-3 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    {/* HOURLY / HOUSE PRICING SECTION (3 house: 149, 7 house: 230, 15 house: 280, 24 house: 399) */}
                    <div className="bg-transparent  border border-amber-500/40 p-3.5 rounded-xl flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-amber-400 font-black text-xs uppercase flex items-center gap-1.5">
                          <Clock size={16} /> ⏱️ HOURLY / HOUSE PRICING (PRICE
                          IN ₹)
                        </span>
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
                          <input
                            type="checkbox"
                            checked={housePanelForm.includeHours}
                            onChange={(e) =>
                              setHousePanelForm({
                                ...housePanelForm,
                                includeHours: e.target.checked,
                              })
                            }
                            className="accent-amber-500"
                          />
                          Include Hourly Prices
                        </label>
                      </div>

                      {housePanelForm.includeHours && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mt-1">
                          <div className="bg-transparent  p-2 rounded-lg border border-white/10">
                            <span className="text-amber-300 font-bold block mb-1">
                              3 House (3 Hrs)
                            </span>
                            <input
                              type="number"
                              value={housePanelForm.price3h}
                              onChange={(e) =>
                                setHousePanelForm({
                                  ...housePanelForm,
                                  price3h: Number(e.target.value),
                                })
                              }
                              className="w-full bg-transparent border border-white/20 rounded p-1.5 text-white font-bold"
                            />
                          </div>
                          <div className="bg-transparent  p-2 rounded-lg border border-white/10">
                            <span className="text-amber-300 font-bold block mb-1">
                              7 House (7 Hrs)
                            </span>
                            <input
                              type="number"
                              value={housePanelForm.price7h}
                              onChange={(e) =>
                                setHousePanelForm({
                                  ...housePanelForm,
                                  price7h: Number(e.target.value),
                                })
                              }
                              className="w-full bg-transparent border border-white/20 rounded p-1.5 text-white font-bold"
                            />
                          </div>
                          <div className="bg-transparent  p-2 rounded-lg border border-white/10">
                            <span className="text-amber-300 font-bold block mb-1">
                              15 House (15 Hrs)
                            </span>
                            <input
                              type="number"
                              value={housePanelForm.price15h}
                              onChange={(e) =>
                                setHousePanelForm({
                                  ...housePanelForm,
                                  price15h: Number(e.target.value),
                                })
                              }
                              className="w-full bg-transparent border border-white/20 rounded p-1.5 text-white font-bold"
                            />
                          </div>
                          <div className="bg-transparent  p-2 rounded-lg border border-white/10">
                            <span className="text-amber-300 font-bold block mb-1">
                              24 House (24 Hrs)
                            </span>
                            <input
                              type="number"
                              value={housePanelForm.price24h}
                              onChange={(e) =>
                                setHousePanelForm({
                                  ...housePanelForm,
                                  price24h: Number(e.target.value),
                                })
                              }
                              className="w-full bg-transparent border border-white/20 rounded p-1.5 text-white font-bold"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* DAILY PRICING SECTION */}
                    <div className="bg-transparent  border border-white/10 p-3.5 rounded-xl flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-cyan-400 font-black text-xs uppercase flex items-center gap-1.5">
                          📅 DAILY PRICING (DAYS OPTION)
                        </span>
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
                          <input
                            type="checkbox"
                            checked={housePanelForm.includeDays}
                            onChange={(e) =>
                              setHousePanelForm({
                                ...housePanelForm,
                                includeDays: e.target.checked,
                              })
                            }
                            className="accent-cyan-500"
                          />
                          Include Daily Prices
                        </label>
                      </div>

                      {housePanelForm.includeDays && (
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs mt-1">
                          <div>
                            <span className="text-gray-400 block mb-0.5">
                              1 Day
                            </span>
                            <input
                              type="number"
                              value={housePanelForm.price1d}
                              onChange={(e) =>
                                setHousePanelForm({
                                  ...housePanelForm,
                                  price1d: Number(e.target.value),
                                })
                              }
                              className="w-full bg-transparent border border-white/20 rounded p-1.5 text-white"
                            />
                          </div>
                          <div>
                            <span className="text-gray-400 block mb-0.5">
                              3 Day
                            </span>
                            <input
                              type="number"
                              value={housePanelForm.price3d}
                              onChange={(e) =>
                                setHousePanelForm({
                                  ...housePanelForm,
                                  price3d: Number(e.target.value),
                                })
                              }
                              className="w-full bg-transparent border border-white/20 rounded p-1.5 text-white"
                            />
                          </div>
                          <div>
                            <span className="text-gray-400 block mb-0.5">
                              7 Day
                            </span>
                            <input
                              type="number"
                              value={housePanelForm.price7d}
                              onChange={(e) =>
                                setHousePanelForm({
                                  ...housePanelForm,
                                  price7d: Number(e.target.value),
                                })
                              }
                              className="w-full bg-transparent border border-white/20 rounded p-1.5 text-white"
                            />
                          </div>
                          <div>
                            <span className="text-gray-400 block mb-0.5">
                              15 Day
                            </span>
                            <input
                              type="number"
                              value={housePanelForm.price15d}
                              onChange={(e) =>
                                setHousePanelForm({
                                  ...housePanelForm,
                                  price15d: Number(e.target.value),
                                })
                              }
                              className="w-full bg-transparent border border-white/20 rounded p-1.5 text-white"
                            />
                          </div>
                          <div>
                            <span className="text-gray-400 block mb-0.5">
                              30 Day
                            </span>
                            <input
                              type="number"
                              value={housePanelForm.price30d}
                              onChange={(e) =>
                                setHousePanelForm({
                                  ...housePanelForm,
                                  price30d: Number(e.target.value),
                                })
                              }
                              className="w-full bg-transparent border border-white/20 rounded p-1.5 text-white"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const parsedFeatures = parseFeaturesList(housePanelForm.featuresText);

                        const pricingList: { label: string; price: number }[] =
                          [];
                        if (housePanelForm.includeHours) {
                          pricingList.push(
                            {
                              label: "3 House",
                              price: Number(housePanelForm.price3h) || 149,
                            },
                            {
                              label: "7 House",
                              price: Number(housePanelForm.price7h) || 230,
                            },
                            {
                              label: "15 House",
                              price: Number(housePanelForm.price15h) || 280,
                            },
                            {
                              label: "24 House",
                              price: Number(housePanelForm.price24h) || 399,
                            },
                          );
                        }
                        if (housePanelForm.includeDays) {
                          pricingList.push(
                            {
                              label: "1 Day",
                              price: Number(housePanelForm.price1d) || 499,
                            },
                            {
                              label: "3 Day",
                              price: Number(housePanelForm.price3d) || 999,
                            },
                            {
                              label: "7 Day",
                              price: Number(housePanelForm.price7d) || 1499,
                            },
                            {
                              label: "15 Day",
                              price: Number(housePanelForm.price15d) || 2499,
                            },
                            {
                              label: "30 Day",
                              price: Number(housePanelForm.price30d) || 4999,
                            },
                          );
                        }

                        const finalPricingList =
                          pricingList.length > 0
                            ? pricingList
                            : [
                                { label: "3 House", price: 149 },
                                { label: "7 House", price: 230 },
                                { label: "15 House", price: 280 },
                                { label: "24 House", price: 399 },
                              ];

                        const newHousePanel = {
                          id: Date.now(),
                          title:
                            housePanelForm.title ||
                            "PRIVATE LIMITED 24GHANTA PANEL",
                          category: housePanelForm.category || "24ghanta",
                          badge: "24GHANTA PRIVATE LIMITED",
                          thumbnailTitle:
                            housePanelForm.title ||
                            "PRIVATE LIMITED 24GHANTA PANEL",
                          thumbnailSub: "24GHANTA PRIVATE LIMITED",
                          image:
                            housePanelForm.image ||
                            "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop",
                          isVideo: housePanelForm.isVideo,
                          features: parsedFeatures,
                          installLink:
                            housePanelForm.telegramLink ||
                            supportLinks.telegram,
                          videoLink:
                            housePanelForm.videoLink || supportLinks.telegram,
                          exceptFileLink:
                            housePanelForm.whatsappLink ||
                            supportLinks.whatsapp,
                          pricing: finalPricingList,
                          pricingPlans: finalPricingList,
                          options: finalPricingList,
                        };

                        const updatedPanelsList = [newHousePanel, ...ensureArray(panels)];
                        setPanels(updatedPanelsList);
                        savePanelsToFirebase(updatedPanelsList);

                        alert(
                          "✅ 24Ghanta / House Private Panel successfully store par publish ho gaya hai! Website me 24ghanta category button click ya search karne par yah open hoga.",
                        );
                        setStaffTab("managePanels");
                      }}
                      className="mt-2 w-full bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 hover:from-amber-400 hover:to-red-500 text-white font-black py-3.5 rounded-xl shadow-[0_0_25px_rgba(245,158,11,0.5)] transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-2 active:scale-95"
                    >
                      <PlusCircle size={18} /> 🚀 PUBLISH 24GHANTA HOUSE PANEL
                      TO STORE
                    </button>
                  </div>
                </div>
              )}

              {/* STAFF TAB 3: MANAGE / DELETE PANELS */}
              {staffTab === "managePanels" && (
                <div className="flex flex-col gap-4 text-left">
                  <div className="bg-transparent  border border-red-500/40 rounded-2xl p-5 shadow-2xl  flex flex-col gap-4">
                    <h3 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-wide">
                      <Trash2 size={20} className="text-rose-400" /> 🗑️ DELETE &
                      EDIT ACTIVE PANELS ({panels.length})
                    </h3>

                    {staffEditingPanel ? (
                      <div className="bg-transparent  border border-cyan-400/50 p-4 rounded-xl flex flex-col gap-3">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                          <span className="text-cyan-400 font-black text-xs uppercase flex items-center gap-1.5">
                            <Sparkles size={14} /> Editing Panel: {staffEditingPanel.title || `#${staffEditingPanel.id}`}
                          </span>
                          <button
                            onClick={() => setStaffEditingPanel(null)}
                            className="text-gray-400 hover:text-white text-xs font-bold px-2 py-0.5"
                          >
                            ✕ Close
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-gray-300 text-xs font-bold block mb-1">
                              Panel Name / Title
                            </label>
                            <input
                              type="text"
                              value={staffEditingPanel.title}
                              onChange={(e) =>
                                setStaffEditingPanel({
                                  ...staffEditingPanel,
                                  title: e.target.value,
                                })
                              }
                              className="w-full bg-transparent border border-white/20 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                            />
                          </div>
                          <div>
                            <label className="text-gray-300 text-xs font-bold block mb-1">
                              Category
                            </label>
                            <input
                              type="text"
                              value={staffEditingPanel.category}
                              onChange={(e) =>
                                setStaffEditingPanel({
                                  ...staffEditingPanel,
                                  category: e.target.value,
                                })
                              }
                              className="w-full bg-transparent border border-white/20 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-gray-300 text-xs font-bold block mb-1">
                            Image / Thumbnail URL
                          </label>
                          <input
                            type="text"
                            value={staffEditingPanel.image}
                            onChange={(e) =>
                              setStaffEditingPanel({
                                ...staffEditingPanel,
                                image: e.target.value,
                              })
                            }
                            className="w-full bg-transparent border border-white/20 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-cyan-300 text-xs font-bold block mb-1">
                              INSTALL/PANEL Link (Telegram / APK)
                            </label>
                            <input
                              type="text"
                              value={staffEditingPanel.installLink || ""}
                              onChange={(e) =>
                                setStaffEditingPanel({
                                  ...staffEditingPanel,
                                  installLink: e.target.value,
                                })
                              }
                              placeholder="https://t.me/..."
                              className="w-full bg-transparent border border-white/20 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-rose-300 text-xs font-bold block mb-1">
                              VIDEO/FEEDBACK Link (Telegram / WhatsApp / Proof)
                            </label>
                            <input
                              type="text"
                              value={staffEditingPanel.feedbackLink || staffEditingPanel.videoLink || ""}
                              onChange={(e) =>
                                setStaffEditingPanel({
                                  ...staffEditingPanel,
                                  feedbackLink: e.target.value,
                                  videoLink: e.target.value,
                                })
                              }
                              placeholder="https://t.me/... or https://wa.me/..."
                              className="w-full bg-transparent border border-white/20 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-rose-400 font-mono"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-yellow-300 text-xs font-bold block mb-1">
                            Features (1 Per Line)
                          </label>
                          <textarea
                            rows={3}
                            value={parseFeaturesList(staffEditingPanel.features).join("\n")}
                            onChange={(e) =>
                              setStaffEditingPanel({
                                ...staffEditingPanel,
                                features: e.target.value.split("\n"),
                              })
                            }
                            className="w-full bg-transparent border border-white/20 rounded-lg p-2 text-xs text-white font-mono focus:outline-none focus:border-yellow-400"
                          />
                        </div>

                        {/* Pricing Plans Editor */}
                        <div>
                          <label className="text-emerald-300 text-xs font-bold block mb-1">
                            Pricing Plans (Label & ₹ Price)
                          </label>
                          <div className="flex flex-col gap-1.5">
                            {(staffEditingPanel.pricing || []).map((pItem: any, pIdx: number) => (
                              <div key={pIdx} className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={pItem.label}
                                  onChange={(e) => {
                                    const updated = [...(staffEditingPanel.pricing || [])];
                                    updated[pIdx] = { ...updated[pIdx], label: e.target.value };
                                    setStaffEditingPanel({
                                      ...staffEditingPanel,
                                      pricing: updated,
                                    });
                                  }}
                                  placeholder="1 Day, 15 House..."
                                  className="flex-1 bg-transparent border border-white/20 rounded p-1.5 text-xs text-white"
                                />
                                <div className="relative w-28">
                                  <span className="absolute left-2 top-1 text-xs text-emerald-400 font-bold">₹</span>
                                  <input
                                    type="number"
                                    value={pItem.price}
                                    onChange={(e) => {
                                      const updated = [...(staffEditingPanel.pricing || [])];
                                      updated[pIdx] = { ...updated[pIdx], price: Number(e.target.value) };
                                      setStaffEditingPanel({
                                        ...staffEditingPanel,
                                        pricing: updated,
                                      });
                                    }}
                                    className="w-full bg-transparent border border-white/20 rounded p-1.5 pl-5 text-xs text-white font-mono"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = (staffEditingPanel.pricing || []).filter((_: any, idx: number) => idx !== pIdx);
                                    setStaffEditingPanel({
                                      ...staffEditingPanel,
                                      pricing: updated.length > 0 ? updated : [{ label: "1 Day", price: 90 }],
                                    });
                                  }}
                                  className="text-rose-400 hover:text-rose-300 p-1"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => {
                                const current = staffEditingPanel.pricing || [];
                                setStaffEditingPanel({
                                  ...staffEditingPanel,
                                  pricing: [...current, { label: `${current.length + 1} Day`, price: 100 }],
                                });
                              }}
                              className="text-emerald-400 hover:text-emerald-300 text-xs font-bold flex items-center gap-1 self-start mt-1"
                            >
                              <PlusCircle size={13} /> + Add Plan
                            </button>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => {
                              const updatedPanel = {
                                ...staffEditingPanel,
                                features: parseFeaturesList(staffEditingPanel.features),
                              };
                              const updated = ensureArray(panels).map((p) =>
                                p.id === staffEditingPanel.id ? updatedPanel : p,
                              );
                              setPanels(updated);
                              savePanelsToFirebase(updated);
                              setStaffEditingPanel(null);
                              alert("✅ Panel successfully update ho gaya!");
                            }}
                            className="flex-1 bg-rainbow-animated border-2 border-white hover:from-cyan-400 hover:to-blue-500 text-black font-black text-xs py-2.5 rounded-lg uppercase shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                          >
                            💾 Save Changes
                          </button>
                          <button
                            onClick={() => setStaffEditingPanel(null)}
                            className="bg-gray-700 hover:bg-gray-600 text-white font-bold text-xs px-4 py-2 rounded-lg uppercase"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {ensureArray(panels).map((p, idx) => (
                          <div
                            key={`staff-panel-${p.id}-${idx}`}
                            className="bg-transparent  border border-white/10 p-3.5 rounded-xl flex flex-col justify-between gap-3 shadow-lg hover:border-rose-500/40 transition-all"
                          >
                            <div className="flex items-start gap-3">
                              <img
                                src={p.image}
                                alt={p.title}
                                className="w-16 h-16 rounded-lg object-cover border border-white/20 shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop";
                                }}
                              />
                              <div className="flex flex-col overflow-hidden">
                                <span className="text-xs font-bold text-fuchsia-400 bg-fuchsia-500/20 px-2 py-0.5 rounded border border-fuchsia-500/30 w-fit mb-1 uppercase">
                                  {p.category}
                                </span>
                                <h4 className="text-white font-black text-sm truncate">
                                  {p.title}
                                </h4>
                                <span className="text-gray-400 text-[10px] mt-0.5">
                                  Price: ₹{p.pricing?.[0]?.price ?? 90} (1 Day)
                                </span>
                              </div>
                            </div>

                            <div className="flex gap-2 pt-2 border-t border-white/10">
                              <button
                                onClick={() =>
                                  setStaffEditingPanel({
                                    ...p,
                                    features: parseFeaturesList(p.features, p.description),
                                  })
                                }
                                className="flex-1 bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 border border-cyan-500/40 font-bold text-xs py-2 rounded-lg flex items-center justify-center gap-1 uppercase transition-all"
                              >
                                <Edit size={12} /> Edit
                              </button>
                              <button
                                onClick={() => {
                                  if (
                                    confirm(
                                      `Aap sach me panel "${p.title}" ko delete karna chahte hain?`,
                                    )
                                  ) {
                                    const updated = ensureArray(panels).filter(
                                      (item) => item.id !== p.id,
                                    );
                                    setPanels(updated);
                                    savePanelsToFirebase(updated);
                                    alert(`Panel "${p.title}" deleted!`);
                                  }
                                }}
                                className="flex-1 bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 border border-rose-500/40 font-bold text-xs py-2 rounded-lg flex items-center justify-center gap-1 uppercase transition-all"
                              >
                                <Trash2 size={12} /> Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STAFF TAB 4: TELEGRAM & WHATSAPP SUPPORT LINKS */}
              {staffTab === "supportLinks" && (
                <div className="bg-transparent  border border-sky-500/40 rounded-2xl p-5 shadow-2xl  flex flex-col gap-4 text-left">
                  <h3 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-wide">
                    <Send size={20} className="text-sky-400" /> 💬 TELEGRAM &
                    WHATSAPP SUPPORT LINKS
                  </h3>
                  <p className="text-gray-300 text-xs">
                    Staff yahan website par Contact Admin aur Customer Support
                    wale Telegram aur WhatsApp links update kar sakte hain.
                  </p>

                  <div className="flex flex-col gap-3 bg-transparent  p-4 rounded-xl border border-white/10">
                    <div>
                      <label className="text-sky-400 font-black text-xs uppercase block mb-1 flex items-center gap-1">
                        <Send size={14} /> TELEGRAM CHANNEL / SUPPORT LINK
                      </label>
                      <input
                        type="text"
                        value={supportLinks.telegram}
                        onChange={(e) =>
                          setSupportLinks({
                            ...supportLinks,
                            telegram: e.target.value,
                          })
                        }
                        placeholder="https://t.me/yourchannel"
                        className="w-full bg-transparent  border border-white/20 rounded-xl py-3 px-3 text-xs font-bold text-white focus:outline-none focus:border-sky-400"
                      />
                    </div>

                    <div>
                      <label className="text-green-400 font-black text-xs uppercase block mb-1 flex items-center gap-1">
                        <Zap size={14} className="fill-green-400" /> WHATSAPP
                        GROUP / SUPPORT LINK
                      </label>
                      <input
                        type="text"
                        value={supportLinks.whatsapp}
                        onChange={(e) =>
                          setSupportLinks({
                            ...supportLinks,
                            whatsapp: e.target.value,
                          })
                        }
                        placeholder="https://wa.me/1234567890"
                        className="w-full bg-transparent  border border-white/20 rounded-xl py-3 px-3 text-xs font-bold text-white focus:outline-none focus:border-green-400"
                      />
                    </div>

                    <button
                      onClick={() => {
                        saveToFirebase(
                          "supportLinks",
                          supportLinks,
                        );
                        alert(
                          "✅ Telegram aur WhatsApp Links successfully update ho gaye hain!",
                        );
                      }}
                      className="mt-2 w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black py-3.5 rounded-xl shadow-[0_0_20px_rgba(56,189,248,0.5)] transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-2 active:scale-95"
                    >
                      <Save size={16} /> SAVE SUPPORT LINKS
                    </button>
                  </div>
                </div>
              )}

              {/* STAFF TAB 5: USERS LIST ("SARA KA SARA INE TOTAL USI PER DIKHAI DEGA") */}
              {staffTab === "users" && (
                <div className="bg-transparent  border border-purple-500/40 rounded-2xl p-5 shadow-2xl  flex flex-col gap-4 text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h3 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-wide">
                      <User size={20} className="text-purple-400" /> 👥 ALL
                      REGISTERED WEBSITE USERS ({registeredUsers.length})
                    </h3>
                    <span className="text-xs text-purple-300 bg-purple-500/20 px-3 py-1 rounded-full border border-purple-500/30 font-bold w-fit">
                      Total Registered: {registeredUsers.length} Users
                    </span>
                  </div>

                  <div className="relative">
                    <Search
                      size={16}
                      className="absolute left-3 top-3 text-gray-400"
                    />
                    <input
                      type="text"
                      placeholder="Search users by Email or Phone..."
                      value={staffSearchUser}
                      onChange={(e) => setStaffSearchUser(e.target.value)}
                      className="w-full bg-transparent  border border-white/20 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-400"
                    />
                  </div>

                  <div className="flex flex-col gap-3">
                    {registeredUsers
                      .filter((u) => {
                        if (!staffSearchUser.trim()) return true;
                        const s = staffSearchUser.toLowerCase();
                        return (
                          (u.email && u.email.toLowerCase().includes(s)) ||
                          (u.phone && u.phone.includes(s))
                        );
                      })
                      .map((u, idx) => {
                        const uKey = getAccountKey(u.email, u.phone);
                        const bal = userWallets[uKey] ?? 0;
                        const avatarUrl =
                          u.avatar ||
                          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop";

                        return (
                          <div
                            key={`manage-user-${u.email || u.phone || idx}-${idx}`}
                            className="bg-transparent  border border-white/10 p-4 rounded-xl flex flex-col gap-3 shadow-lg hover:border-purple-500/40 transition-all"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <img
                                  src={avatarUrl}
                                  alt={u.email || u.phone}
                                  className="w-12 h-12 rounded-full border-2 border-purple-400 object-cover shrink-0 cursor-pointer hover:scale-105 transition-transform"
                                  onClick={() =>
                                    setPreviewMedia({
                                      url: avatarUrl,
                                      title: `${u.email || u.phone}'s Profile Photo`,
                                    })
                                  }
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src =
                                      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop";
                                  }}
                                />
                                <div className="flex flex-col">
                                  <span className="text-white font-black text-sm">
                                    {u.email || u.phone || "User"}
                                  </span>
                                  {u.phone && u.email && (
                                    <span className="text-gray-300 text-xs font-mono">
                                      📱 {u.phone}
                                    </span>
                                  )}
                                  <span className="text-gray-400 text-[10px] mt-0.5">
                                    Joined: {u.joinDate || "N/A"}
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-col items-end">
                                <span className="text-cyan-400 font-black text-sm">
                                  ₹{bal}
                                </span>
                                <span className="text-gray-400 text-[10px]">
                                  Wallet Balance
                                </span>
                              </div>
                            </div>

                            <div className="bg-transparent  p-2.5 rounded-lg border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                              <span className="text-yellow-400 font-mono">
                                🔑 Password: {u.password}
                              </span>
                              <div className="flex gap-2 w-full sm:w-auto">
                                <button
                                  onClick={() => {
                                    const newBalStr = prompt(
                                      `Set new wallet balance (₹) for ${u.email || u.phone}:`,
                                      String(bal),
                                    );
                                    if (newBalStr !== null) {
                                      const newBal = Number(newBalStr);
                                      if (!isNaN(newBal)) {
                                        setUserWallets((prev) => ({
                                          ...prev,
                                          [uKey]: newBal,
                                        }));
                                        alert(
                                          `✅ Wallet balance updated to ₹${newBal}!`,
                                        );
                                      }
                                    }
                                  }}
                                  className="flex-1 sm:flex-none bg-purple-600 hover:bg-purple-500 text-white font-bold px-3 py-1 rounded text-[11px] uppercase"
                                >
                                  Edit Balance
                                </button>
                                <button
                                  onClick={() => {
                                    if (
                                      confirm(
                                        `Aap user "${u.email || u.phone}" ko delete karna chahte hain?`,
                                      )
                                    ) {
                                      setRegisteredUsers((prev) =>
                                        prev.filter(
                                          (usr) =>
                                            getAccountKey(
                                              usr.email,
                                              usr.phone,
                                            ) !== uKey,
                                        ),
                                      );
                                      alert("User deleted!");
                                    }
                                  }}
                                  className="flex-1 sm:flex-none bg-red-600/30 hover:bg-red-600/60 text-red-300 border border-red-500/40 font-bold px-3 py-1 rounded text-[11px] uppercase"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* STAFF TAB 6: PAYMENTS & MONEY ("KISNE KISNE PAISA LAGAYA") */}
              {staffTab === "payments" && (
                <div className="bg-transparent  border border-emerald-500/40 rounded-2xl p-5 shadow-2xl  flex flex-col gap-4 text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-wide">
                        <Wallet size={20} className="text-emerald-400" /> 💰
                        WEBSITE PAISA & PAYMENT LOGS
                      </h3>
                      <p className="text-gray-300 text-xs">
                        Kis-kis user ne website me paisa add / request lagaya
                        hai wo sab yahan list hoga.
                      </p>
                    </div>
                    <div className="bg-emerald-500/20 border border-emerald-500/40 px-3 py-2 rounded-xl text-emerald-300 font-black text-sm flex items-center gap-2 w-fit">
                      <span>Total Revenue:</span>
                      <span className="text-white text-base">
                        ₹
                        {ensureArray(paymentHistory)
                          .filter((p) => p.status === "SUCCESS")
                          .reduce((acc, curr) => acc + (curr.amount || 0), 0)}
                      </span>
                    </div>
                  </div>

                  {/* Auto UPI Gateway Lock Status Control */}
                  <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
                        <Lock size={16} />
                      </div>
                      <div>
                        <span className="text-xs font-black text-white uppercase flex items-center gap-2">
                          Auto UPI Gateway:{" "}
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${isAutoUpiLocked ? "bg-red-500/30 text-red-300 border-red-500/40" : "bg-emerald-500/30 text-emerald-300 border-emerald-500/40"}`}>
                            {isAutoUpiLocked ? "🔒 LOCKED / BAND HAI" : "🟢 ACTIVE"}
                          </span>
                        </span>
                        <span className="text-[11px] text-gray-400 block">
                          {isAutoUpiLocked
                            ? "Auto UPI abhi band hai. Koi user click karega to payment open nahi hoga."
                            : "Auto UPI abhi active hai."}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !isAutoUpiLocked;
                        setIsAutoUpiLocked(next);
                        saveToFirebase("isAutoUpiLocked", next);
                        set(ref(database, "isAutoUpiLocked"), next).catch(() => {});
                        fetch("/api/auto-pay-status", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ isLocked: next }),
                        }).catch(() => {});
                        if (next && paymentMode === "auto") {
                          setPaymentMode("manual");
                        }
                        alert(
                          next
                            ? "🔒 Auto UPI Payment ko Lock (Band) kar diya gaya hai! Ab koi bhi user auto payment nahi kar payega."
                            : "🔓 Auto UPI Payment ko Unlock kar diya gaya hai!"
                        );
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all shadow-md active:scale-95 cursor-pointer self-start sm:self-auto ${
                        isAutoUpiLocked
                          ? "bg-red-600 hover:bg-red-500 text-white"
                          : "bg-emerald-600 hover:bg-emerald-500 text-white"
                      }`}
                    >
                      {isAutoUpiLocked ? "LOCKED (Click to Unlock)" : "ACTIVE (Click to Lock)"}
                    </button>
                  </div>

                  <div className="relative">
                    <Search
                      size={16}
                      className="absolute left-3 top-3 text-gray-400"
                    />
                    <input
                      type="text"
                      placeholder="Search payments by User Email, Phone, or UTR Number..."
                      value={staffSearchPayment}
                      onChange={(e) => setStaffSearchPayment(e.target.value)}
                      className="w-full bg-transparent  border border-white/20 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div className="flex flex-col gap-3">
                    {paymentHistory
                      .filter((p) => {
                        if (!staffSearchPayment.trim()) return true;
                        const s = staffSearchPayment.toLowerCase();
                        return (
                          (p.userEmail &&
                            p.userEmail.toLowerCase().includes(s)) ||
                          (p.userPhone && p.userPhone.includes(s)) ||
                          (p.utr && p.utr.toLowerCase().includes(s))
                        );
                      })
                      .map((p, idx) => {
                        const targetKey =
                          p.userAccountKey ||
                          getAccountKey(p.userEmail, p.userPhone);
                        const isPending = p.status === "PENDING";
                        const isSuccess = p.status === "SUCCESS";

                        return (
                          <div
                            key={`house-pay-${p.id}-${idx}`}
                            className="bg-transparent  border border-white/10 p-4 rounded-xl flex flex-col gap-3 shadow-lg"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex flex-col">
                                <span className="text-white font-black text-sm">
                                  {p.userEmail || p.userPhone || "User"}
                                </span>
                                <span className="text-gray-400 text-xs font-mono mt-0.5">
                                  UTR / Txn: {p.utr || "N/A"}
                                </span>
                                <span className="text-gray-400 text-[10px]">
                                  Date: {p.date}
                                </span>
                                {p.screenshot && (
                                  <div className="mt-2">
                                    <span className="text-[10px] text-fuchsia-400 font-bold uppercase block mb-1">
                                      User Screenshot:
                                    </span>
                                    <img
                                      src={p.screenshot}
                                      alt="Screenshot"
                                      className="h-16 w-28 object-cover rounded border border-fuchsia-500/40 cursor-pointer hover:scale-105 transition-transform"
                                      onClick={() =>
                                        setPreviewMedia({
                                          url: p.screenshot!,
                                          title: `Payment Screenshot - UTR ${p.utr}`,
                                        })
                                      }
                                    />
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-col items-end gap-1">
                                <span className="text-emerald-400 font-black text-base">
                                  ₹{p.amount}
                                </span>
                                <span
                                  className={`text-[10px] font-black px-2 py-0.5 rounded uppercase border ${
                                    isSuccess
                                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                                      : isPending
                                        ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                                        : "bg-red-500/20 text-red-400 border-red-500/40"
                                  }`}
                                >
                                  {p.status}
                                </span>
                              </div>
                            </div>

                            {isPending && (
                              <div className="flex gap-2 pt-2 border-t border-white/10">
                                <button
                                  onClick={() => {
                                    // Approve payment
                                    setPaymentHistory((prev) =>
                                      prev.map((item) =>
                                        item.id === p.id
                                          ? { ...item, status: "SUCCESS" }
                                          : item,
                                      ),
                                    );
                                    setUserWallets((prev) => {
                                      const cur = prev[targetKey] ?? 0;
                                      return {
                                        ...prev,
                                        [targetKey]: cur + p.amount,
                                      };
                                    });
                                    if (
                                      !userProfile.isLoggedIn ||
                                      getAccountKey(
                                        userProfile.email,
                                        userProfile.phone,
                                      ) === targetKey
                                    ) {
                                      setUserBalance((prev) => prev + p.amount);
                                    }
                                    alert(
                                      `✅ Staff Approved ₹${p.amount} for ${p.userEmail || p.userPhone}! Added to wallet.`,
                                    );
                                  }}
                                  className="flex-1 bg-rainbow-animated border-2 border-white hover:from-emerald-400 hover:to-teal-400 text-black font-black text-xs py-2 rounded-xl uppercase shadow-md flex items-center justify-center gap-1 active:scale-95"
                                >
                                  <CheckCircle size={14} /> Approve & Add ₹
                                  {p.amount}
                                </button>
                                <button
                                  onClick={() => {
                                    setPaymentHistory((prev) =>
                                      prev.map((item) =>
                                        item.id === p.id
                                          ? { ...item, status: "REJECTED" }
                                          : item,
                                      ),
                                    );
                                    alert(`❌ Payment request rejected.`);
                                  }}
                                  className="bg-red-500/20 hover:bg-red-500/40 text-red-300 border border-red-500/40 font-bold text-xs px-4 py-2 rounded-xl uppercase transition-all"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* STAFF TAB 7: PENDING KEYS ("USER JAB KEY BUY KARTA HAI TO KISKA PENDING MEIN HAI") */}
              {staffTab === "pendingKeys" && (
                <div className="bg-transparent  border border-amber-500/40 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-wide">
                        <Key size={20} className="text-amber-400" /> ⏳ PENDING
                        KEY PURCHASES (
                        {
                          keyRequests.filter((r) => r.status === "PENDING")
                            .length
                        }
                        )
                      </h3>
                      <p className="text-gray-300 text-xs">
                        Yahan dekhiye kis-kis user ne key buy karne ke liye
                        request dala hai aur kiska pending mein hai.
                      </p>
                    </div>
                    <div className="bg-amber-500/20 border border-amber-500/40 px-3 py-2 rounded-xl text-amber-300 font-black text-sm flex items-center gap-2 w-fit">
                      <span>Pending Orders:</span>
                      <span className="text-white text-base">
                        {
                          keyRequests.filter((r) => r.status === "PENDING")
                            .length
                        }
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    {ensureArray(keyRequests)
                      .filter((r) => r.status === "PENDING")
                      .map((req, idx) => (
                        <div
                          key={`m-pendingkey-${req.id}-${idx}`}
                          className="bg-transparent  border border-amber-500/30 p-4 rounded-xl flex flex-col gap-3 shadow-lg"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex flex-col">
                              <span className="text-white font-black text-sm">
                                {req.user}
                              </span>
                              {req.userEmail || req.userPhone ? (
                                <span className="text-gray-400 text-xs font-mono mt-0.5">
                                  Account: {req.userEmail || req.userPhone}
                                </span>
                              ) : null}
                              {req.userPassword && (
                                <span className="text-amber-400 text-xs font-mono">
                                  Password: {req.userPassword}
                                </span>
                              )}
                              <span className="text-fuchsia-300 text-xs font-bold mt-1">
                                Panel: {req.panel}{" "}
                                {req.planLabel && `(${req.planLabel})`}
                              </span>
                              <span className="text-gray-400 text-[10px] mt-1">
                                Order Date: {req.date}
                              </span>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-cyan-400 font-black text-base">
                                ₹{req.price}
                              </span>
                              <span className="text-[10px] font-black px-2 py-0.5 rounded uppercase border bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse">
                                PENDING
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
                            <textarea
                              placeholder="Type key message / code here (e.g. 5546272611 or ABCD-1234-EFGH-5678)..."
                              className="w-full bg-transparent border border-white/20 rounded-xl py-2 px-3 text-sm font-bold text-emerald-400 font-mono focus:outline-none focus:border-amber-400 transition-all resize-none h-20"
                              id={`staff-key-input-${req.id}`}
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <button
                                onClick={() => {
                                  const input = document.getElementById(
                                    `staff-key-input-${req.id}`,
                                  ) as HTMLTextAreaElement;
                                  if (input && input.value) {
                                    setKeyRequests((prev) =>
                                      prev.map((r) =>
                                        r.id === req.id
                                          ? {
                                              ...r,
                                              status: "APPROVED",
                                              deliveredKey: input.value.trim(),
                                            }
                                          : r,
                                      ),
                                    );
                                    alert(
                                      `✅ Key approved and saved to database for ${req.user}!`,
                                    );
                                  } else {
                                    alert(
                                      "Please enter key code / message first!",
                                    );
                                  }
                                }}
                                className="w-full bg-rainbow-animated border-2 border-white hover:from-amber-400 hover:to-yellow-400 text-black font-black text-xs py-2.5 rounded-xl uppercase shadow-[0_0_15px_rgba(234,179,8,0.4)] flex items-center justify-center gap-1.5 active:scale-95"
                              >
                                <CheckCircle size={14} /> APPROVE (IN-APP)
                              </button>

                              <button
                                onClick={async () => {
                                  const input = document.getElementById(
                                    `staff-key-input-${req.id}`,
                                  ) as HTMLTextAreaElement;
                                  const targetEmail =
                                    req.userEmail ||
                                    (req.user && req.user.includes("@")
                                      ? req.user
                                      : "");
                                  if (!input || !input.value.trim()) {
                                    alert("कृपया Key कोड दर्ज करें!");
                                    return;
                                  }
                                  let finalEmail = targetEmail;
                                  if (!finalEmail) {
                                    const promptEmail = prompt(
                                      "Enter User's Email ID to send Key via EmailJS:",
                                      "",
                                    );
                                    if (!promptEmail) return;
                                    finalEmail = promptEmail.trim();
                                  }
                                  const keyVal = input.value.trim();
                                  const sent = await handleSendKeyToUser(
                                    finalEmail,
                                    keyVal,
                                    `Hello ${req.user}, here is your ${req.panel} activation key. Thank you for shopping with us!`,
                                  );
                                  if (sent) {
                                    setKeyRequests((prev) =>
                                      prev.map((r) =>
                                        r.id === req.id
                                          ? {
                                              ...r,
                                              status: "APPROVED",
                                              deliveredKey: keyVal,
                                            }
                                          : r,
                                      ),
                                    );
                                  }
                                }}
                                className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs py-2.5 rounded-xl uppercase shadow-[0_0_15px_rgba(59,130,246,0.4)] flex items-center justify-center gap-1.5 active:scale-95"
                              >
                                <Mail size={14} /> 📧 APPROVE & SEND EMAIL
                                (EMAILJS)
                              </button>
                            </div>

                            {/* Staff Portal: REJECT & REFUND BUTTON */}
                            <button
                              type="button"
                              onClick={() => {
                                handleRejectAndRefundKey(
                                  req,
                                  "Out of stock / Technical issue",
                                );
                              }}
                              className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black py-2.5 rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 active:scale-95 border border-red-400/40 mt-1"
                            >
                              <X size={14} /> ❌ REJECT & REFUND ₹{req.price} TO
                              USER WALLET
                            </button>
                          </div>
                        </div>
                      ))}

                    {keyRequests.filter((r) => r.status === "PENDING")
                      .length === 0 && (
                      <div className="bg-transparent  border border-white/10 p-8 rounded-xl text-center flex flex-col items-center justify-center gap-2">
                        <Key size={32} className="text-gray-500" />
                        <span className="text-gray-400 text-sm font-bold">
                          No Pending Key Purchases!
                        </span>
                        <span className="text-gray-500 text-xs">
                          All user key orders have been approved or delivered.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STAFF TAB: REJECT & REFUND PANEL */}
              {staffTab === "refundPanel" && (
                <div className="flex flex-col gap-4 text-left animate-in fade-in duration-200">
                  <div className="bg-transparent  border-2 border-red-500/50 rounded-3xl p-5 sm:p-7 shadow-[0_0_50px_rgba(239,68,68,0.25)] flex flex-col gap-5 relative overflow-hidden">
                    <div className="flex items-center gap-3 border-b border-red-500/30 pb-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-pink-500 p-0.5 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.6)] shrink-0">
                        <div className="w-full h-full bg-transparent rounded-[14px] flex items-center justify-center">
                          <X className="text-red-400" size={24} />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white">
                            Reject & Refund Panel
                          </h3>
                          <span className="bg-red-500/20 text-red-300 border border-red-500/40 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                            EMAILJS LIVE
                          </span>
                        </div>
                        <p className="text-xs text-gray-300">
                          Refund to User Wallet and send automated notification
                          email.
                        </p>
                      </div>
                    </div>

                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const emailElem = document.getElementById(
                          "refundUserEmail",
                        ) as HTMLInputElement;
                        const amountElem = document.getElementById(
                          "refundAmount",
                        ) as HTMLInputElement;
                        const reasonElem = document.getElementById(
                          "refundReason",
                        ) as HTMLTextAreaElement;
                        const statusElem = document.getElementById(
                          "refundStatusMessage",
                        ) as HTMLParagraphElement;

                        const email = emailElem?.value?.trim();
                        const amount = Number(amountElem?.value?.trim());
                        const reason =
                          reasonElem?.value?.trim() ||
                          "आपका ऑर्डर रिजेक्ट कर दिया गया है और पैसे आपके वॉलेट में रिफ़ंड कर दिए गए हैं।";

                        if (!email || !amount) {
                          if (statusElem) {
                            statusElem.innerText =
                              "कृपया User Email और Refund Amount दोनों भरें!";
                            statusElem.className =
                              "mt-4 font-bold text-red-400 text-sm";
                          }
                          return;
                        }

                        if (statusElem) {
                          statusElem.innerText =
                            "रिफ़ंड की जानकारी भेजी जा रही है...";
                          statusElem.className =
                            "mt-4 font-bold text-blue-400 text-sm";
                        }

                        // 1. Add fund to user wallet
                        const tPhone = /^\d+$/.test(email) ? email : "";
                        const targetAccKey = getAccountKey(email, tPhone);

                        setUserWallets((prev) => {
                          const currentVal = Number(prev[targetAccKey]) || 0;
                          return {
                            ...prev,
                            [targetAccKey]: currentVal + amount,
                          };
                        });

                        // 2. Send Email
                        const success = await handleSendRefundEmailToUser(
                          email,
                          amount,
                          reason,
                        );

                        if (success) {
                          if (statusElem) {
                            statusElem.innerText = `सफलतापूर्वक रिफ़ंड ईमेल भेज दिया गया है! ₹${amount} Added to Wallet.`;
                            statusElem.className =
                              "mt-4 font-bold text-green-400 text-sm";
                          }
                          if (emailElem) emailElem.value = "";
                          if (amountElem) amountElem.value = "";
                          if (reasonElem) reasonElem.value = "";
                        } else {
                          if (statusElem) {
                            statusElem.innerText =
                              "Error: ईमेल भेजने में समस्या आई। लेकिन वॉलेट में रिफ़ंड ऐड कर दिया गया है।";
                            statusElem.className =
                              "mt-4 font-bold text-red-400 text-sm";
                          }
                        }
                      }}
                      className="flex flex-col gap-4"
                    >
                      <div>
                        <label className="text-xs font-bold text-red-300 flex items-center gap-1.5 mb-1">
                          <User size={14} /> User Email Address:
                        </label>
                        <input
                          type="email"
                          id="refundUserEmail"
                          placeholder="user@gmail.com"
                          className="w-full bg-transparent border border-white/20 focus:border-red-400 rounded-xl p-3 text-sm text-white placeholder:text-gray-500 focus:outline-none font-mono transition-all"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-red-300 flex items-center gap-1.5 mb-1">
                          <Wallet size={14} /> Refund Amount (₹):
                        </label>
                        <input
                          type="number"
                          id="refundAmount"
                          placeholder="e.g. 100"
                          className="w-full bg-transparent border border-white/20 focus:border-red-400 rounded-xl p-3 text-sm text-white placeholder:text-gray-500 focus:outline-none font-mono transition-all"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-red-300 flex items-center gap-1.5 mb-1">
                          <AlertTriangle size={14} /> Rejection Reason:
                        </label>
                        <textarea
                          id="refundReason"
                          placeholder="कारण लिखें (उदा. Invalid Payment Screenshot)"
                          rows={3}
                          className="w-full bg-transparent border border-white/20 focus:border-red-400 rounded-xl p-3 text-sm text-white placeholder:text-gray-500 focus:outline-none transition-all"
                        ></textarea>
                      </div>

                      <button
                        type="submit"
                        className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black py-3.5 rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all uppercase tracking-wider text-sm flex items-center justify-center gap-2 active:scale-95 border border-red-400/40"
                      >
                        <X size={18} /> REJECT & REFUND ₹ TO USER WALLET
                      </button>

                      <p id="refundStatusMessage" className="mt-2 text-sm"></p>
                    </form>
                  </div>
                </div>
              )}

              {/* STAFF TAB: EMAILJS SEND KEY PANEL ("Key भेजने का Admin Panel") */}
              {staffTab === "emailKey" && (
                <div className="flex flex-col gap-4 text-left animate-in fade-in duration-200">
                  <div className="bg-transparent  border-2 border-blue-500/50 rounded-3xl p-5 sm:p-7 shadow-[0_0_50px_rgba(59,130,246,0.25)] flex flex-col gap-5 relative overflow-hidden">
                    {/* Top Glow & Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-500/30 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 p-0.5 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.6)] shrink-0">
                          <div className="w-full h-full bg-transparent rounded-[14px] flex items-center justify-center">
                            <Mail className="text-blue-400" size={24} />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white">
                              Key भेजने का Admin Panel
                            </h3>
                            <span className="bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                              EMAILJS LIVE
                            </span>
                          </div>
                          <p className="text-xs text-gray-300">
                            Send direct activation keys to customer Gmail/Email
                            with instant automated delivery.
                          </p>
                        </div>
                      </div>

                      {/* Config Credentials Chip */}
                      <div className="flex flex-col gap-1.5 shrink-0">
                        <div className="bg-blue-950/40 border border-blue-400/30 rounded-xl p-2.5 text-[10px] font-mono text-gray-300 flex flex-col gap-0.5">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-blue-300 font-bold flex items-center gap-1">
                              <ShieldCheck size={12} /> EmailJS IDs Configured:
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setShowEmailJsConfigSettings(
                                  !showEmailJsConfigSettings,
                                )
                              }
                              className="text-[10px] text-yellow-400 hover:underline font-sans font-bold"
                            >
                              {showEmailJsConfigSettings
                                ? "Hide Settings"
                                : "⚙️ Edit IDs"}
                            </button>
                          </div>
                          <span>
                            Service:{" "}
                            <strong className="text-white">
                              {emailJsConfig.serviceId}
                            </strong>
                          </span>
                          <span>
                            Template:{" "}
                            <strong className="text-white">
                              {emailJsConfig.templateId}
                            </strong>
                          </span>
                          <span>
                            Public Key:{" "}
                            <strong className="text-white">
                              {emailJsConfig.publicKey.substring(0, 8)}...
                            </strong>
                          </span>
                        </div>

                        {showEmailJsConfigSettings && (
                          <div className="bg-transparent border border-yellow-400/40 rounded-xl p-3 flex flex-col gap-2 animate-in fade-in">
                            <span className="text-xs text-yellow-300 font-bold">
                              EmailJS Live API Credentials
                            </span>
                            <div>
                              <label className="text-[10px] text-gray-300 block">
                                Service ID:
                              </label>
                              <input
                                type="text"
                                value={emailJsConfig.serviceId}
                                onChange={(e) => {
                                  const updated = {
                                    ...emailJsConfig,
                                    serviceId: e.target.value,
                                  };
                                  setEmailJsConfig(updated);
                                  saveToFirebase("emailJsConfig", updated);
                                }}
                                className="w-full bg-transparent border border-white/20 rounded p-1.5 text-xs text-white font-mono"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-gray-300 block">
                                Template ID:
                              </label>
                              <input
                                type="text"
                                value={emailJsConfig.templateId}
                                onChange={(e) => {
                                  const updated = {
                                    ...emailJsConfig,
                                    templateId: e.target.value,
                                  };
                                  setEmailJsConfig(updated);
                                  saveToFirebase("emailJsConfig", updated);
                                }}
                                className="w-full bg-transparent border border-white/20 rounded p-1.5 text-xs text-white font-mono"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-gray-300 block">
                                Public Key:
                              </label>
                              <input
                                type="text"
                                value={emailJsConfig.publicKey}
                                onChange={(e) => {
                                  const updated = {
                                    ...emailJsConfig,
                                    publicKey: e.target.value,
                                  };
                                  setEmailJsConfig(updated);
                                  saveToFirebase("emailJsConfig", updated);
                                }}
                                className="w-full bg-transparent border border-white/20 rounded p-1.5 text-xs text-white font-mono"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* EmailJS Main Form */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendKeyToUser();
                      }}
                      className="flex flex-col gap-4"
                    >
                      {/* 1. User Email */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                            <User size={14} /> यूज़र का Email ID:
                          </label>
                          {registeredUsers.length > 0 && (
                            <span className="text-[10px] text-gray-400">
                              Quick Select registered customer:
                            </span>
                          )}
                        </div>
                        <input
                          type="email"
                          id="userEmail"
                          placeholder="जैसे: user@gmail.com"
                          value={sendKeyEmailForm.userEmail}
                          onChange={(e) =>
                            setSendKeyEmailForm((prev) => ({
                              ...prev,
                              userEmail: e.target.value,
                            }))
                          }
                          className="w-full bg-transparent border border-white/20 focus:border-blue-400 rounded-xl p-3 text-sm text-white placeholder:text-gray-500 focus:outline-none font-mono transition-all"
                          required
                        />

                        {/* Registered user email quick chips */}
                        {registeredUsers.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {registeredUsers
                              .filter((u) => u.email && u.email.includes("@"))
                              .slice(0, 5)
                              .map((u, uIdx) => (
                                <button
                                  key={`quick-u-email-${uIdx}`}
                                  type="button"
                                  onClick={() =>
                                    setSendKeyEmailForm((prev) => ({
                                      ...prev,
                                      userEmail: u.email,
                                    }))
                                  }
                                  className="text-[10px] bg-blue-950/60 hover:bg-blue-900 border border-blue-500/40 text-blue-200 px-2 py-0.5 rounded-lg transition-colors"
                                >
                                  {u.email}
                                </button>
                              ))}
                          </div>
                        )}
                      </div>

                      {/* 2. Key Value */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                            <Key size={14} /> खरीदी गई Key:
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const rand =
                                "PREM-" +
                                Math.random()
                                  .toString(36)
                                  .substring(2, 6)
                                  .toUpperCase() +
                                "-" +
                                Math.random()
                                  .toString(36)
                                  .substring(2, 6)
                                  .toUpperCase() +
                                "-" +
                                Math.floor(1000 + Math.random() * 9000);
                              setSendKeyEmailForm((prev) => ({
                                ...prev,
                                keyValue: rand,
                              }));
                            }}
                            className="text-[10px] text-amber-300 hover:text-amber-200 font-bold underline flex items-center gap-1"
                          >
                            <Sparkles size={11} /> 🎲 Generate Random Key
                          </button>
                        </div>
                        <input
                          type="text"
                          id="keyValue"
                          placeholder="जैसे: ABCD-1234-EFGH-5678 या PREM-VIP-9921"
                          value={sendKeyEmailForm.keyValue}
                          onChange={(e) =>
                            setSendKeyEmailForm((prev) => ({
                              ...prev,
                              keyValue: e.target.value,
                            }))
                          }
                          className="w-full bg-transparent border border-white/20 focus:border-blue-400 rounded-xl p-3 text-sm text-emerald-400 font-mono font-bold placeholder:text-gray-500 focus:outline-none transition-all"
                          required
                        />
                      </div>

                      {/* 3. Admin Message */}
                      <div>
                        <label className="text-xs font-bold text-blue-300 block mb-1">
                          Admin Message (वैकल्पिक):
                        </label>
                        <textarea
                          id="adminMessage"
                          rows={3}
                          placeholder="यूज़र के लिए कोई संदेश (जैसे: Thank you for purchasing Private VIP Panel! Follow Telegram for instant setup guide)..."
                          value={sendKeyEmailForm.adminMessage}
                          onChange={(e) =>
                            setSendKeyEmailForm((prev) => ({
                              ...prev,
                              adminMessage: e.target.value,
                            }))
                          }
                          className="w-full bg-transparent border border-white/20 focus:border-blue-400 rounded-xl p-3 text-xs text-white placeholder:text-gray-500 focus:outline-none transition-all resize-none"
                        />

                        {/* Preset Message Templates */}
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {[
                            "Thank you for purchasing! Here is your private activation key.",
                            "Private 24Ghanta VIP Panel Key. Main ID Safe 100%.",
                            "Your VIP Reseller Key Order is confirmed. Enjoy gaming!",
                          ].map((msg, mIdx) => (
                            <button
                              key={`quick-msg-${mIdx}`}
                              type="button"
                              onClick={() =>
                                setSendKeyEmailForm((prev) => ({
                                  ...prev,
                                  adminMessage: msg,
                                }))
                              }
                              className="text-[10px] bg-transparent hover:bg-transparent border border-white/10 text-gray-300 px-2 py-0.5 rounded-lg transition-colors truncate max-w-[280px]"
                            >
                              "{msg.substring(0, 32)}..."
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Send Button */}
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          type="submit"
                          disabled={emailSendingStatus.loading}
                          className={`flex-1 py-3.5 px-4 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(59,130,246,0.5)] ${
                            emailSendingStatus.loading
                              ? "bg-blue-800 text-gray-300 cursor-not-allowed opacity-75"
                              : "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-indigo-500 text-white hover:scale-[1.01] active:scale-[0.99]"
                          }`}
                        >
                          {emailSendingStatus.loading ? (
                            <>
                              <Loader2 className="animate-spin" size={18} />
                              <span>
                                ईमेल भेजा जा रहा है... कृपया प्रतीक्षा करें।
                              </span>
                            </>
                          ) : (
                            <>
                              <Send size={18} />
                              <span>SEND EMAIL (EMAILJS)</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          disabled={emailSendingStatus.loading}
                          onClick={() => {
                            const testKey =
                              "TEST-KEY-" +
                              Math.floor(100000 + Math.random() * 900000);
                            handleSendKeyToUser(
                              "pramk9992@gmail.com",
                              testKey,
                              "Test key delivery from EmailJS admin panel.",
                            );
                          }}
                          className="bg-transparent hover:bg-transparent border border-white/20 text-blue-200 text-xs font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 shrink-0"
                        >
                          <Sparkles size={14} className="text-yellow-400" />
                          <span>Test Self (`pramk9992@gmail.com`)</span>
                        </button>
                      </div>

                      {/* Status Message Text */}
                      {emailSendingStatus.message && (
                        <div
                          id="statusMessage"
                          className={`p-3 rounded-xl text-center text-xs font-bold border transition-all animate-in fade-in ${
                            emailSendingStatus.status === "success"
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                              : emailSendingStatus.status === "error"
                                ? "bg-red-500/20 text-red-300 border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                                : "bg-blue-500/20 text-blue-300 border-blue-500/40"
                          }`}
                        >
                          {emailSendingStatus.message}
                        </div>
                      )}

                      {/* EmailJS Troubleshooting Guide Box */}
                      <div className="bg-blue-950/30 border border-blue-500/20 rounded-2xl p-3.5 text-[11px] text-gray-300 flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5 font-bold text-blue-300">
                          <AlertCircle
                            size={14}
                            className="text-blue-400 shrink-0"
                          />
                          <span>EmailJS Setup & 422 Error Fix Guide:</span>
                        </div>
                        <ul className="list-disc pl-4 space-y-1 text-gray-300 leading-relaxed text-[11px]">
                          <li>
                            EmailJS Dashboard &gt;{" "}
                            <strong>Email Templates</strong> &gt; Select{" "}
                            <strong className="text-white">your template</strong>.
                          </li>
                          <li>
                            Ensure your template variables match:{" "}
                            <code className="bg-transparent px-1 rounded text-blue-300">
                              user_email
                            </code>
                            ,{" "}
                            <code className="bg-transparent px-1 rounded text-blue-300">
                              delivered_key
                            </code>
                            , and{" "}
                            <code className="bg-transparent px-1 rounded text-blue-300">
                              admin_message
                            </code>
                            .
                          </li>
                          <li>
                            Check for 422 Error: Make sure your Public Key is
                            correct and Account is active.
                          </li>
                        </ul>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* RAZORPAY STANDARD CHECKOUT & ORDER VERIFICATION MODAL */}
      <RazorpayCheckoutModal
        isOpen={isRazorpayModalOpen && !isAutoUpiLocked}
        onClose={() => setIsRazorpayModalOpen(false)}
        defaultAmount={autoAmount || 100}
        userEmail={userProfile.email || ""}
        userPhone={autoWhatsapp || userProfile.phone || ""}
        userName={userProfile.name || "VIP Member"}
        paymentSettings={paymentSettings}
        onPaymentSuccess={(paymentData) => {
          const amt = Number(paymentData.amount);
          const curEmail = userProfile.email || "";
          const curPhone = userProfile.phone || autoWhatsapp || "";
          const accKey = getAccountKey(curEmail, curPhone);

          // 1. Credit wallet balance
          setUserBalance((prev) => (prev || 0) + amt);
          setUserWallets((prev) => ({
            ...prev,
            [accKey]: (prev[accKey] ?? userBalance ?? 0) + amt,
          }));

          // 2. Add authenticated transaction record
          const newTx = {
            id: Date.now(),
            amount: amt,
            whatsapp: autoWhatsapp || curPhone || "N/A",
            utr: `RZP-${paymentData.paymentId.slice(-8)}`,
            status: "SUCCESS",
            date: new Date().toLocaleString(),
            method: "RAZORPAY_GATEWAY",
            userEmail: curEmail || "VIP Member",
            userPhone: curPhone || "N/A",
            userName: userProfile.name || "VIP User",
            userBalance: (userBalance || 0) + amt,
            paymentId: paymentData.paymentId,
            orderId: paymentData.orderId,
            signature: paymentData.signature || "VERIFIED_HMAC_SHA256",
          };

          setAutoPaymentHistory((prev) => [newTx, ...ensureArray(prev)]);
          setPaymentHistory((prev) => [newTx, ...ensureArray(prev)]);
          setCurrentTxId(newTx.id);

          // Sync to Firebase if available
          try {
            const dbRef = ref(database, `payments/${newTx.id}`);
            set(dbRef, newTx).catch(() => {});
          } catch (e) {}
        }}
      />

      {/* 🚀 FIRST TIME WEBSITE LOADING / CONNECTING SCREEN */}
      {isAppLoading && (
        <div
          id="website-initial-loading-screen"
          className="fixed inset-0 z-[999999] bg-[#040711]/95 backdrop-blur-2xl flex flex-col items-center justify-center p-4 text-center select-none overflow-hidden"
        >
          {/* Ambient Cyber Neon Background Glows */}
          <div className="absolute w-72 h-72 rounded-full bg-cyan-500/15 blur-[100px] pointer-events-none animate-pulse"></div>
          <div className="absolute w-72 h-72 rounded-full bg-fuchsia-600/15 blur-[100px] pointer-events-none animate-pulse delay-700"></div>

          <div className="relative z-10 flex flex-col items-center max-w-sm w-full">
            {/* Rotating Cyber Ring & Logo */}
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center mb-6">
              {/* Outer Dashed Glowing Spinner */}
              <div
                className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-400/40 animate-spin"
                style={{ animationDuration: "8s" }}
              ></div>
              {/* Vibrant Fast Neon Ring */}
              <div
                className="absolute inset-1 rounded-full border-2 border-t-cyan-400 border-r-fuchsia-500 border-b-transparent border-l-transparent animate-spin"
                style={{ animationDuration: "1.4s" }}
              ></div>
              {/* Center Core Display */}
              <div className="absolute inset-3 rounded-full bg-gradient-to-tr from-cyan-950/80 via-[#0a0f1d] to-fuchsia-950/80 border border-white/15 shadow-[0_0_30px_rgba(6,182,212,0.35)] flex flex-col items-center justify-center">
                <span className="text-2xl sm:text-3xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-fuchsia-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]">
                  {loadingPercent}%
                </span>
                <span className="text-[9px] uppercase tracking-widest text-cyan-400 font-bold">
                  LOADING
                </span>
              </div>
            </div>

            {/* Brand Title */}
            <h2 className="text-2xl sm:text-3xl font-black italic tracking-wider text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.9)] mb-1">
              FFH4CK<span className="text-yellow-400">JOD</span><span className="text-white">VIP</span>
            </h2>

            {/* Connecting Title */}
            <div className="flex items-center gap-2 text-cyan-300 font-black text-xs sm:text-sm tracking-widest uppercase mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>CONNECTING TO PREM STORE SERVER</span>
            </div>

            {/* User Requested: "connect making website... wait karo" */}
            <p className="text-gray-300 text-xs sm:text-sm max-w-xs mb-5 font-medium leading-relaxed">
              Please wait... Making secure connection to website...
            </p>

            {/* Progress Bar (Max 10%) */}
            <div className="w-full bg-black/70 border border-cyan-500/30 rounded-full h-3.5 p-0.5 overflow-hidden mb-3 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-emerald-400 transition-all duration-100 relative overflow-hidden shadow-[0_0_12px_rgba(6,182,212,0.8)]"
                style={{ width: `${Math.min(100, loadingPercent * 10)}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>

            {/* Dynamic Status Text */}
            <div className="text-[11px] font-mono text-cyan-400/90 h-5 mb-5 flex items-center justify-center gap-1.5">
              <Loader2 size={12} className="animate-spin text-fuchsia-400" />
              <span>
                {loadingPercent <= 2 && "⚡ Establishing Fast Secure Connection..."}
                {loadingPercent >= 3 && loadingPercent <= 5 && "🌐 Making Connection to Website & Services..."}
                {loadingPercent >= 6 && loadingPercent <= 8 && "🛡️ Syncing VIP Mod Panels & Fast Engine..."}
                {loadingPercent === 9 && "🚀 Initializing Instant Delivery..."}
                {loadingPercent >= 10 && "✅ Connection Verified! Welcome to Store!"}
              </span>
            </div>

            {/* System Status Chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
              <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-gray-300 flex items-center gap-1 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Status: Online
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-gray-300 flex items-center gap-1 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                Ping: 18ms
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-gray-300 flex items-center gap-1 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400"></span>
                Anti-Ban: 100% Active
              </span>
            </div>

            {/* Quick Skip Button */}
            <button
              type="button"
              onClick={() => {
                setIsAppLoading(false);
                setLoadingPhase("done");
                setShowImportantNoticeModal(true);
              }}
              className="text-xs text-gray-400 hover:text-cyan-300 underline underline-offset-4 tracking-wider uppercase transition-colors cursor-pointer py-1"
            >
              Skip Loading & Enter Store ⏩
            </button>
          </div>
        </div>
      )}

      {/* 📢 IMPORTANT NOTICE MODAL (महत्वपूर्ण सूचना) */}
      {showImportantNoticeModal && (
        <div
          id="important-notice-modal"
          className="fixed inset-0 z-[999990] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200 select-none"
        >
          <div className="relative bg-[#0b0f19] border border-fuchsia-500/50 rounded-[28px] max-w-md w-full p-5 sm:p-6 shadow-[0_0_50px_rgba(217,70,239,0.3)] text-left flex flex-col gap-4 my-auto overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-44 h-44 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-44 h-44 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-3.5 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-fuchsia-600 to-purple-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(217,70,239,0.6)] shrink-0 border border-white/20">
                  <Megaphone size={22} className="animate-bounce" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 inline-block mb-1">
                    ⚠️ CRITICAL ANNOUNCEMENT
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-white tracking-wide uppercase">
                    IMPORTANT NOTICE
                  </h3>
                  <span className="text-xs text-gray-400 font-semibold">
                    महत्वपूर्ण सूचना - FFH4CK VIP PREM STORE
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowImportantNoticeModal(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-all cursor-pointer border border-white/15 active:scale-95"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Admin Custom Notice Alert (if configured) */}
            {bannerSettings.popupEnabled && bannerSettings.popupMessage && (
              <div className="bg-gradient-to-r from-cyan-950/70 to-blue-950/70 border border-cyan-400/50 rounded-2xl p-3.5 text-xs text-cyan-200 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                <div className="font-black text-white uppercase text-xs flex items-center gap-1.5 mb-1">
                  <Sparkles size={14} className="text-yellow-300" />
                  <span>{bannerSettings.popupTitle || "STORE UPDATE"}</span>
                </div>
                <p className="leading-relaxed text-[11px] text-cyan-100/90 whitespace-pre-line">
                  {bannerSettings.popupMessage}
                </p>
              </div>
            )}

            {/* Core Important Notice Bullet Points */}
            <div className="flex flex-col gap-2.5 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar relative z-10 text-xs text-gray-200">
              {/* Point 1 */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-start gap-2.5 hover:border-fuchsia-500/40 transition-colors">
                <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0 mt-0.5">
                  <Zap size={15} />
                </div>
                <div>
                  <h4 className="font-black text-white text-xs uppercase">
                    ⚡ 24/7 Fast Auto Delivery
                  </h4>
                  <p className="text-[11px] text-gray-300 mt-0.5 leading-relaxed">
                    Sabhi VIP Panels aur Mod Keys payment hote hi turant deliver hoti hain. Aap "My Key" me jakar direct copy kar sakte hain.
                  </p>
                </div>
              </div>

              {/* Point 2 */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-start gap-2.5 hover:border-fuchsia-500/40 transition-colors">
                <div className="w-7 h-7 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck size={15} />
                </div>
                <div>
                  <h4 className="font-black text-white text-xs uppercase">
                    🛡️ 100% Anti-Ban Guaranteed
                  </h4>
                  <p className="text-[11px] text-gray-300 mt-0.5 leading-relaxed">
                    Hamare sabhi panel updates fully safe aur OB49/OB50 latest version ke liye 100% tested hain. Zero ban assurance.
                  </p>
                </div>
              </div>

              {/* Point 3 */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-start gap-2.5 hover:border-fuchsia-500/40 transition-colors">
                <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle size={15} />
                </div>
                <div>
                  <h4 className="font-black text-white text-xs uppercase">
                    💳 Add Fund: Use Manual UPI
                  </h4>
                  <p className="text-[11px] text-gray-300 mt-0.5 leading-relaxed">
                    Auto UPI temporary band (locked) hai. Kripya QR Code scan karein aur payment ke baad 12-digit UTR number enter karke submit karein.
                  </p>
                </div>
              </div>

              {/* Point 4 */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-start gap-2.5 hover:border-fuchsia-500/40 transition-colors">
                <div className="w-7 h-7 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/40 flex items-center justify-center shrink-0 mt-0.5">
                  <MessageCircle size={15} />
                </div>
                <div>
                  <h4 className="font-black text-white text-xs uppercase">
                    📞 Official Help & Support
                  </h4>
                  <p className="text-[11px] text-gray-300 mt-0.5 leading-relaxed">
                    Kisi bhi problem ke liye sirf hamare official Telegram <strong>@Premjodvip</strong> par message karein. Kisi fake account par bharosa na karein.
                  </p>
                </div>
              </div>
            </div>

            {/* Action / Dismiss Button */}
            <div className="pt-2 relative z-10 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setShowImportantNoticeModal(false)}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-fuchsia-600 via-purple-600 to-cyan-500 hover:from-fuchsia-500 hover:to-cyan-400 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(217,70,239,0.5)] transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 size={16} />
                <span>I Understand & Continue / आगे बढ़ें</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🎬 DEDICATED LIVE VIDEO & MEDIA PREVIEW MODAL */}
      {previewMedia && (
        <div
          id="video-media-preview-modal"
          className="fixed inset-0 z-[999995] bg-black/90 backdrop-blur-xl flex items-center justify-center p-3 sm:p-5 select-none animate-in fade-in duration-200"
          onClick={() => setPreviewMedia(null)}
        >
          <div
            className="relative bg-[#080c16] border border-cyan-500/50 rounded-2xl sm:rounded-3xl max-w-4xl w-full p-4 sm:p-5 shadow-[0_0_60px_rgba(6,182,212,0.3)] flex flex-col gap-3.5 overflow-hidden my-auto animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient Background Glows */}
            <div className="absolute top-0 right-0 w-56 h-56 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-56 h-56 bg-red-600/15 rounded-full blur-3xl pointer-events-none"></div>

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3 relative z-10">
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-600 flex items-center justify-center text-white shrink-0 shadow-[0_0_20px_rgba(239,68,68,0.5)] border border-white/20">
                  <Play size={18} className="fill-white ml-0.5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 inline-block mb-0.5">
                    ▶️ VIP VIDEO PLAYER
                  </span>
                  <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wide truncate">
                    {previewMedia.title || "VIP Panel Video Demo"}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2.5 py-1 rounded-xl bg-cyan-600/30 border border-cyan-400/40 text-cyan-300 text-xs font-black flex items-center gap-1.5 shadow-sm">
                  <Film size={13} className="text-cyan-400" />
                  <span>Direct Site Player</span>
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewMedia(null)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-all cursor-pointer border border-white/15 active:scale-95"
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Video Content Render Engine */}
            <div className="relative z-10 w-full flex flex-col items-center justify-center">
              {(() => {
                const targetUrl = previewMedia.youtubeLink || previewMedia.url;
                const ytInfo = getYouTubeInfo(targetUrl);

                // 1. If YouTube Video
                if (ytInfo) {
                  return (
                    <div className="w-full aspect-video rounded-xl sm:rounded-2xl overflow-hidden bg-black border border-cyan-500/40 shadow-[0_0_30px_rgba(0,0,0,0.8)] relative">
                      <iframe
                        src={ytInfo.embedUrl}
                        title={previewMedia.title || "YouTube Live Video"}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      ></iframe>
                    </div>
                  );
                }

                // 2. If Direct Video File (MP4, WebM, MOV, MKV, 3GP, AVI, uploaded to /uploads/, Blob, Data URL)
                const isVideoFile =
                  previewMedia.isVideo ||
                  previewMedia.mediaType === "video" ||
                  (typeof targetUrl === "string" &&
                    (/\.(mp4|webm|mov|mkv|3gp|m4v|avi)/i.test(targetUrl) ||
                      targetUrl.includes("/uploads/") ||
                      targetUrl.startsWith("data:video") ||
                      targetUrl.startsWith("blob:")));

                if (isVideoFile && targetUrl) {
                  return (
                    <div className="w-full rounded-xl sm:rounded-2xl overflow-hidden bg-black border border-cyan-500/40 flex items-center justify-center shadow-2xl max-h-[75vh]">
                      <video
                        key={targetUrl}
                        src={targetUrl}
                        controls
                        autoPlay
                        playsInline
                        className="w-full max-h-[72vh] object-contain rounded-xl"
                      />
                    </div>
                  );
                }

                // 3. Fallback: Image Preview
                if (targetUrl) {
                  return (
                    <div className="w-full flex flex-col items-center gap-3">
                      <div className="w-full rounded-xl sm:rounded-2xl overflow-hidden bg-black/60 border border-white/10 flex items-center justify-center p-2 shadow-2xl max-h-[60vh]">
                        <img
                          src={targetUrl}
                          alt={previewMedia.title || "Preview"}
                          className="max-h-[55vh] w-auto max-w-full rounded-lg object-contain"
                        />
                      </div>
                    </div>
                  );
                }

                return null;
              })()}
            </div>

            {/* Modal Footer Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3 relative z-10 text-xs text-gray-300">
              <span className="flex items-center gap-1.5 text-[11px] text-cyan-300 font-mono">
                <Sparkles size={13} className="text-yellow-400" />
                OB49/OB50 Ultra Safe Gameplay
              </span>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setPreviewMedia(null)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95"
                >
                  Close Video
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Won Spin Coupon Celebratory Modal */}
      {wonCouponModal && (
        <div className="fixed inset-0 z-[999999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b101c] border-2 border-emerald-400 rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-[0_0_50px_rgba(16,185,129,0.5)] flex flex-col items-center text-center gap-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.5)] animate-bounce">
              <Gift size={32} className="text-emerald-400" />
            </div>

            <div>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[11px] px-3 py-1 rounded-full font-black uppercase tracking-wider">
                🎉 SPIN & WIN REWARD
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white mt-2 uppercase tracking-wide">
                AAPNE JEETA ₹{wonCouponModal.discount} COUPON!
              </h3>
              <p className="text-xs text-gray-300 mt-1 font-medium">
                Yeh coupon code sidhe aapke <span className="text-cyan-400 font-bold">BUY KEY</span> checkout page par automatically add ho chuka hai!
              </p>
            </div>

            <div className="w-full bg-[#111827] border-2 border-dashed border-amber-400/60 rounded-2xl p-3.5 flex flex-col items-center gap-1">
              <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest">
                YOUR COUPON CODE
              </span>
              <span className="text-yellow-400 font-mono font-black text-2xl tracking-widest select-all">
                {wonCouponModal.code}
              </span>
              <span className="text-[11px] text-emerald-400 font-bold">
                Flat ₹{wonCouponModal.discount} OFF on Any Key Purchase
              </span>
            </div>

            <div className="flex flex-col gap-2 w-full mt-1">
              <button
                onClick={() => {
                  setAppliedCoupon({
                    code: wonCouponModal.code,
                    discount: wonCouponModal.discount,
                  });
                  setCouponInputCode(wonCouponModal.code);
                  setWonCouponModal(null);
                  setCurrentView("home");
                }}
                className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-black text-sm py-3.5 rounded-xl shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-all flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer active:scale-95"
              >
                <ShoppingBag size={18} />
                <span>BUY KEY ABHI KHAREEDEIN (CODE ADDED)</span>
              </button>

              <button
                onClick={() => setWonCouponModal(null)}
                className="w-full text-center text-xs font-bold text-gray-400 hover:text-white py-1.5 cursor-pointer"
              >
                BAND KAREIN (CLOSE)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Telegram Button (Sabse Niche) */}
      {!isAppLoading && (
        <a
          href={supportLinks.ownerTelegram || supportLinks.telegram || "https://t.me/Premjodvip"}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-5 z-[999] bg-gradient-to-tr from-sky-500 to-blue-500 hover:from-sky-400 hover:to-blue-400 text-white rounded-full p-3.5 sm:p-4 shadow-[0_0_25px_rgba(14,165,233,0.6)] transition-all hover:scale-110 active:scale-95 flex items-center justify-center group border border-sky-300/50 animate-in slide-in-from-bottom-5 fade-in duration-500"
          title="Join Telegram"
        >
          <Send size={26} className="group-hover:animate-pulse drop-shadow-md -ml-0.5 mt-0.5" />
        </a>
      )}

    </div>
  );
}

