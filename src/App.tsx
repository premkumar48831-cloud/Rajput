import React, { useState, useEffect, useRef } from 'react';
import lordPremThrone from './assets/images/lord_prem_throne_1786425782320.jpg';
import { LiveNotifications } from './components/LiveNotifications';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, push, onDisconnect, remove } from 'firebase/database';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import emailjs from '@emailjs/browser';
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
  Mail,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';

export function formatExternalUrl(url?: string | null): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed || trimmed === '#') return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function ensureArray<T = any>(val: any): T[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'object') return Object.values(val) as T[];
  return [];
}

export function processAsyncMediaUpload(
  file: File,
  onStartLoading?: () => void,
  onFinishLoading?: (mediaUrl: string, isVideo: boolean) => void
) {
  if (!file) return;
  if (onStartLoading) onStartLoading();

  const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|webm|mkv|avi|3gp|m4v)$/i.test(file.name);

  // Preserve 100% Ultra HD resolution & clarity for all photos
  setTimeout(() => {
    if (isVideo) {
      const objectUrl = URL.createObjectURL(file);
      if (onFinishLoading) onFinishLoading(objectUrl, true);
    } else {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const rawResult = evt.target?.result as string;
        if (rawResult && onFinishLoading) {
          onFinishLoading(rawResult, false);
        }
      };
      reader.onerror = () => {
        const fallbackUrl = URL.createObjectURL(file);
        if (onFinishLoading) onFinishLoading(fallbackUrl, false);
      };
      reader.readAsDataURL(file);
    }
  }, 20);
}

export function sanitizeForFirebase<T>(obj: T): T {
  if (obj === undefined) return "" as any;
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForFirebase(item)) as any;
  }
  const cleanObj: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj as Record<string, any>)) {
    if (val !== undefined) {
      if (typeof val === 'string' && val.length > 500000) {
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
    const regExp = /^.*(?:youtu\.be\/|v\/|u\/\w\/|embed\/|shorts\/|live\/|watch\?v=|\&v=)([^#\&\?]*).*/;
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
      youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`
    };
  }
  return null;
}

// FIREBASE GOOGLE LOGIN & DATABASE CONFIG (ffh4ckjodvip)
const firebaseConfig = {
  apiKey: "AIzaSyBy8u8SYI79TVaOetb-fYljejSjEP6UlAw",
  authDomain: "ffh4ckjodvip.firebaseapp.com",
  projectId: "ffh4ckjodvip",
  storageBucket: "ffh4ckjodvip.firebasestorage.app",
  messagingSenderId: "532017699520",
  appId: "1:532017699520:web:f329492297cd927270ab25",
  measurementId: "G-V0QZ7W0V3S",
  databaseURL: "https://ffh4ckjodvip-default-rtdb.firebaseio.com"
};

const firebaseApp = initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp);

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'addFund' | 'spinWin' | 'referEarn' | 'admin' | 'adminUserHistory' | 'adminPayment' | 'adminKeys' | 'adminSpin' | 'adminRefer' | 'login' | 'profile' | 'customerSupport' | 'adminSupport' | 'adminPaymentSettings' | 'adminLogins' | 'adminAddPanel' | 'adminDeletePanel' | 'adminBgImage' | 'adminAccessFiles' | 'keyPending' | 'adminOwner' | 'staff'>('home');
  const [staffTab, setStaffTab] = useState<'overview' | 'addPanel' | 'house' | 'managePanels' | 'supportLinks' | 'users' | 'payments' | 'userBanner' | 'fullHistory' | 'pendingKeys' | 'colorTheme' | 'resellers' | 'emailKey' | 'refundPanel'>('overview');
  const [staffSearchUser, setStaffSearchUser] = useState('');
  const [staffSearchPayment, setStaffSearchPayment] = useState('');
  const [staffEditingPanel, setStaffEditingPanel] = useState<any | null>(null);
  const [staffPassword, setStaffPassword] = useState('');
  const [showAdminAuthModal, setShowAdminAuthModal] = useState(false);
  const [adminAuthPass, setAdminAuthPass] = useState('');

  // Reseller System State (Google Auth & Differential Pricing)
  const [showSecretAdminToast, setShowSecretAdminToast] = useState(false);
  const [showResellerModal, setShowResellerModal] = useState(false);
  const [isSigningInGoogle, setIsSigningInGoogle] = useState(false);
  const [resellerLoginEmail, setResellerLoginEmail] = useState('');
  const [resellerLoginPass, setResellerLoginPass] = useState('');
  const [searchResellerQuery, setSearchResellerQuery] = useState('');
  const [newResellerForm, setNewResellerForm] = useState({
    email: '',
    name: '',
    phone: '',
    balance: 500,
    isApproved: true
  });

  const [resellerUser, setResellerUser] = useState<{
    isLoggedIn: boolean;
    email: string;
    name: string;
    phone?: string;
    balance: number;
    isApproved: boolean;
  }>(() => {
    const saved = localStorage.getItem('app_resellerUser');
    return saved ? JSON.parse(saved) : {
      isLoggedIn: false,
      email: '',
      name: '',
      balance: 0,
      isApproved: false
    };
  });

  useEffect(() => {
    localStorage.setItem('app_resellerUser', JSON.stringify(resellerUser));
  }, [resellerUser]);

  const [approvedResellers, setApprovedResellers] = useState<{
    email: string;
    name?: string;
    phone?: string;
    balance: number;
    isApproved: boolean;
    discountPercent?: number;
    createdAt: string;
  }[]>(() => {
    const saved = localStorage.getItem('app_approvedResellers');
    return saved ? JSON.parse(saved) : [
      {
        email: 'pramk9992@gmail.com',
        name: 'Pramod Kumar (Main VIP Reseller)',
        phone: '9876543210',
        balance: 1500,
        isApproved: true,
        discountPercent: 35,
        createdAt: '2026-08-01 10:00:00'
      },
      {
        email: 'reseller1@gmail.com',
        name: 'Apex VIP Reseller',
        phone: '9812345678',
        balance: 500,
        isApproved: true,
        discountPercent: 30,
        createdAt: '2026-08-10 14:30:00'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('app_approvedResellers', JSON.stringify(approvedResellers));
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
        const existing = approvedResellers.find(r => r.email.toLowerCase() === cleanEmail);
        if (existing) {
          setResellerUser({
            isLoggedIn: true,
            email: existing.email,
            name: existing.name || user.displayName || 'Reseller VIP',
            phone: existing.phone || '',
            balance: existing.balance || 0,
            isApproved: existing.isApproved !== false
          });
          alert(`üéâ Welcome back, ${user.displayName || cleanEmail}!\nReseller VIP Access Activated with ‚Çπ${existing.balance} Wallet Balance.`);
        } else {
          // Auto register new Google account as approved reseller
          const newReseller = {
            email: cleanEmail,
            name: user.displayName || 'Google Verified Reseller',
            phone: '',
            balance: 500,
            isApproved: true,
            discountPercent: 35,
            createdAt: new Date().toLocaleString()
          };
          setApprovedResellers(prev => [newReseller, ...prev]);
          setResellerUser({
            isLoggedIn: true,
            email: cleanEmail,
            name: user.displayName || 'Google Verified Reseller',
            balance: 500,
            isApproved: true
          });
          alert(`üéâ Google Sign-in Verified!\nApproved Reseller VIP profile activated for: ${cleanEmail}`);
        }
      }
    } catch (err: any) {
      console.warn("Google Auth popup issue or blocked in iframe, offering instant direct fallback:", err);
      const manualEmail = prompt("Google Sign-In popup restricted in preview. Enter your Reseller Gmail ID to verify VIP access:", "pramk9992@gmail.com");
      if (manualEmail && manualEmail.includes('@')) {
        const cleanEmail = manualEmail.toLowerCase().trim();
        const existing = approvedResellers.find(r => r.email.toLowerCase() === cleanEmail);
        if (existing) {
          setResellerUser({
            isLoggedIn: true,
            email: existing.email,
            name: existing.name || 'Verified Reseller',
            phone: existing.phone || '',
            balance: existing.balance || 0,
            isApproved: existing.isApproved !== false
          });
          alert(`üéâ Logged in as Approved Reseller: ${cleanEmail} (Wallet: ‚Çπ${existing.balance})`);
        } else {
          const newReseller = {
            email: cleanEmail,
            name: 'Verified Reseller',
            phone: '',
            balance: 500,
            isApproved: true,
            discountPercent: 35,
            createdAt: new Date().toLocaleString()
          };
          setApprovedResellers(prev => [newReseller, ...prev]);
          setResellerUser({
            isLoggedIn: true,
            email: cleanEmail,
            name: 'Verified Reseller',
            balance: 500,
            isApproved: true
          });
          alert(`üéâ Reseller VIP Account Activated for ${cleanEmail}!`);
        }
      }
    } finally {
      setIsSigningInGoogle(false);
    }
  };

  const handleManualResellerLogin = () => {
    const emailVal = resellerLoginEmail.toLowerCase().trim();
    if (!emailVal || !emailVal.includes('@')) {
      alert("Kripya valid Reseller Gmail ID enter karein!");
      return;
    }
    const existing = approvedResellers.find(r => r.email.toLowerCase() === emailVal);
    if (existing) {
      if (!existing.isApproved) {
        alert("‚ö†Ô∏è Aapka Reseller Account abhi Admin dwara PENDING hai. Admin dwara approve hone ke baad VIP rates milenge.");
        return;
      }
      setResellerUser({
        isLoggedIn: true,
        email: existing.email,
        name: existing.name || 'Verified Reseller',
        phone: existing.phone || '',
        balance: existing.balance || 0,
        isApproved: true
      });
      alert(`üéâ Reseller Login Successful! Welcome ${existing.name || emailVal}. Wallet: ‚Çπ${existing.balance}`);
      setResellerLoginEmail('');
      setResellerLoginPass('');
    } else {
      // Auto-create and approve
      const newReseller = {
        email: emailVal,
        name: 'Verified Reseller',
        phone: '',
        balance: 500,
        isApproved: true,
        discountPercent: 35,
        createdAt: new Date().toLocaleString()
      };
      setApprovedResellers(prev => [newReseller, ...prev]);
      setResellerUser({
        isLoggedIn: true,
        email: emailVal,
        name: 'Verified Reseller',
        balance: 500,
        isApproved: true
      });
      alert(`üéâ Reseller Account created and VIP activated for ${emailVal}!`);
      setResellerLoginEmail('');
      setResellerLoginPass('');
    }
  };

  // EMAILJS KEY SENDER SYSTEM (Configured with User's Exact IDs)
  const EMAILJS_PUBLIC_KEY = 'huTOpMHbOaE_WYEpW';
  const EMAILJS_SERVICE_ID = 'service_v7djd5d';
  const EMAILJS_TEMPLATE_ID = 'template_5g45pm3';

  const [emailJsConfig, setEmailJsConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('satorang_emailjs_config');
      if (saved) {
         const parsed = JSON.parse(saved);
         if (parsed.serviceId !== 'service_58soxwr') return parsed;
      }
    } catch (e) {}
    return {
      publicKey: EMAILJS_PUBLIC_KEY,
      serviceId: EMAILJS_SERVICE_ID,
      templateId: EMAILJS_TEMPLATE_ID
    };
  });

  const [showEmailJsConfigSettings, setShowEmailJsConfigSettings] = useState(false);

  useEffect(() => {
    try {
      if (emailJsConfig.publicKey) {
        emailjs.init(emailJsConfig.publicKey.trim());
      }
    } catch (e) {
      console.warn('EmailJS init warning:', e);
    }
  }, [emailJsConfig.publicKey]);

  const [sendKeyEmailForm, setSendKeyEmailForm] = useState({
    userEmail: '',
    keyValue: '',
    adminMessage: ''
  });

  const [emailSendingStatus, setEmailSendingStatus] = useState<{
    loading: boolean;
    status: 'idle' | 'sending' | 'success' | 'error';
    message: string;
  }>({
    loading: false,
    status: 'idle',
    message: ''
  });

  const handleSendKeyToUser = async (targetEmail?: string, targetKey?: string, targetMsg?: string) => {
    // 1. ‡§á‡§®‡§™‡•Å‡§ü ‡§´‡§º‡•Ä‡§≤‡•ç‡§°‡•ç‡§∏ ‡§∏‡•á ‡§°‡•á‡§ü‡§æ ‡§™‡•ç‡§∞‡§æ‡§™‡•ç‡§§ ‡§ï‡§∞‡§®‡§æ
    const emailElem = document.getElementById("userEmail") as HTMLInputElement | null;
    const keyElem = document.getElementById("keyValue") as HTMLInputElement | null;
    const msgElem = document.getElementById("adminMessage") as HTMLTextAreaElement | null;
    const statusElem = document.getElementById("statusMessage");

    const rawEmail = (targetEmail || (emailElem ? emailElem.value : sendKeyEmailForm.userEmail) || '').trim();
    const cleanEmail = rawEmail.replace(/[\u200B-\u200D\uFEFF\u00A0\r\n\t]/g, '').trim();
    const key = (targetKey || (keyElem ? keyElem.value : sendKeyEmailForm.keyValue) || '').trim();
    const message = (targetMsg !== undefined ? targetMsg : (msgElem ? msgElem.value : sendKeyEmailForm.adminMessage) || '').trim();

    // 2. ‡§Ö‡§ó‡§∞ ‡§à‡§Æ‡•á‡§≤ ‡§Ø‡§æ ‡§ï‡•Ä ‡§ñ‡§æ‡§≤‡•Ä ‡§π‡•à, ‡§§‡•ã ‡§´‡•â‡§∞‡•ç‡§Æ ‡§∏‡§¨‡§Æ‡§ø‡§ü ‡§® ‡§π‡•ã‡§®‡•á ‡§¶‡•á‡§Ç (‡§ñ‡§æ‡§≤‡•Ä ‡§à‡§Æ‡•á‡§≤ ‡§∏‡•á 422 ‡§è‡§∞‡§∞ ‡§Ü‡§§‡§æ ‡§π‡•à)
    if (!cleanEmail || !key) {
      if (statusElem) {
        statusElem.innerText = "‡§ï‡•É‡§™‡§Ø‡§æ ‡§∏‡§π‡•Ä Email ‡§î‡§∞ Key ‡§¶‡•ã‡§®‡•ã‡§Ç ‡§≠‡§∞‡•á‡§Ç!";
        statusElem.style.color = "red";
      }
      setEmailSendingStatus({
        loading: false,
        status: 'error',
        message: '‡§ï‡•É‡§™‡§Ø‡§æ ‡§∏‡§π‡•Ä Email ‡§î‡§∞ Key ‡§¶‡•ã‡§®‡•ã‡§Ç ‡§≠‡§∞‡•á‡§Ç!'
      });
      alert('‡§ï‡•É‡§™‡§Ø‡§æ ‡§∏‡§π‡•Ä Email ‡§î‡§∞ Key ‡§¶‡•ã‡§®‡•ã‡§Ç ‡§≠‡§∞‡•á‡§Ç!');
      return false;
    }

    if (statusElem) {
      statusElem.innerText = "‡§≠‡•á‡§ú‡§æ ‡§ú‡§æ ‡§∞‡§π‡§æ ‡§π‡•à...";
      statusElem.style.color = "blue";
    }

    setEmailSendingStatus({
      loading: true,
      status: 'sending',
      message: `‡§≠‡•á‡§ú‡§æ ‡§ú‡§æ ‡§∞‡§π‡§æ ‡§π‡•à (${cleanEmail})... ‡§ï‡•É‡§™‡§Ø‡§æ ‡§™‡•ç‡§∞‡§§‡•Ä‡§ï‡•ç‡§∑‡§æ ‡§ï‡§∞‡•á‡§Ç‡•§`
    });

    // 3. ‡§ü‡•á‡§Æ‡•ç‡§™‡•ç‡§≤‡•á‡§ü ‡§µ‡•á‡§∞‡§ø‡§è‡§¨‡§≤‡•ç‡§∏ (EmailJS ‡§°‡•à‡§∂‡§¨‡•ã‡§∞‡•ç‡§° template_5g45pm3 ‡§∏‡•á 100% ‡§Æ‡•à‡§ö)
    const templateParams: Record<string, string> = {
      user_email: cleanEmail,    // EmailJS ‡§ï‡•á "To Email" {{user_email}} ‡§ï‡•á ‡§≤‡§ø‡§è
      to_email: cleanEmail,      // ‡§¨‡•à‡§ï‡§Ö‡§™ {{to_email}} ‡§ï‡•á ‡§≤‡§ø‡§è
      email: cleanEmail,         // ‡§¨‡•à‡§ï‡§Ö‡§™ {{email}} ‡§ï‡•á ‡§≤‡§ø‡§è
      to: cleanEmail,            // ‡§¨‡•à‡§ï‡§Ö‡§™ {{to}} ‡§ï‡•á ‡§≤‡§ø‡§è
      key_value: key,            // {{key_value}} ‡§ï‡•á ‡§≤‡§ø‡§è
      key: key,                  // ‡§¨‡•à‡§ï‡§Ö‡§™ {{key}} ‡§ï‡•á ‡§≤‡§ø‡§è
      admin_message: message,    // {{admin_message}} ‡§ï‡•á ‡§≤‡§ø‡§è
      message: message           // ‡§¨‡•à‡§ï‡§Ö‡§™ {{message}} ‡§ï‡•á ‡§≤‡§ø‡§è
    };

    const sId = (emailJsConfig.serviceId || EMAILJS_SERVICE_ID).trim();
    const tId = (emailJsConfig.templateId || EMAILJS_TEMPLATE_ID).trim();
    const pKey = (emailJsConfig.publicKey || EMAILJS_PUBLIC_KEY).trim();

    try {
      emailjs.init(pKey);
      
      let sentSuccess = false;
      let responseDetails = '';

      try {
        const response = await emailjs.send(sId, tId, templateParams, pKey);
        console.log('SUCCESS!', response.status, response.text);
        sentSuccess = response.status === 200 || response.text === 'OK';
        responseDetails = response.text || 'OK';
      } catch (sdkError: any) {
        console.warn('SDK send error, fallback to direct EmailJS endpoint...', sdkError);
        const restRes = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_id: sId,
            template_id: tId,
            user_id: pKey,
            template_params: templateParams
          })
        });

        if (restRes.ok) {
          sentSuccess = true;
          responseDetails = await restRes.text();
        } else {
          const errText = await restRes.text();
          console.warn('Direct EmailJS REST failed, trying backend /api/send-email...', errText);
          const srvRes = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(templateParams)
          });
          if (srvRes.ok) {
            sentSuccess = true;
            responseDetails = 'Delivered via server-side gateway';
          } else {
            throw new Error(errText || `HTTP ${restRes.status}`);
          }
        }
      }

      if (sentSuccess) {
        if (statusElem) {
          statusElem.innerText = "‡§∏‡§´‡§≤‡§§‡§æ‡§™‡•Ç‡§∞‡•ç‡§µ‡§ï ‡§à‡§Æ‡•á‡§≤ ‡§≠‡•á‡§ú ‡§¶‡§ø‡§Ø‡§æ ‡§ó‡§Ø‡§æ ‡§π‡•à!";
          statusElem.style.color = "green";
        }

        setEmailSendingStatus({
          loading: false,
          status: 'success',
          message: `‡§∏‡§´‡§≤‡§§‡§æ‡§™‡•Ç‡§∞‡•ç‡§µ‡§ï ‡§à‡§Æ‡•á‡§≤ (${cleanEmail}) ‡§™‡§∞ Key ‡§≠‡•á‡§ú ‡§¶‡§ø‡§Ø‡§æ ‡§ó‡§Ø‡§æ ‡§π‡•à!`
        });

        // ‡§´‡•â‡§∞‡•ç‡§Æ ‡§∏‡§æ‡§´‡§º ‡§ï‡§∞‡§®‡§æ
        if (emailElem) emailElem.value = "";
        if (keyElem) keyElem.value = "";
        if (msgElem) msgElem.value = "";

        setSendKeyEmailForm({
          userEmail: '',
          keyValue: '',
          adminMessage: ''
        });

        alert(`‚úÖ ‡§∏‡§´‡§≤‡§§‡§æ‡§™‡•Ç‡§∞‡•ç‡§µ‡§ï ‡§à‡§Æ‡•á‡§≤ (${cleanEmail}) ‡§™‡§∞ Key ‡§≠‡•á‡§ú ‡§¶‡§ø‡§Ø‡§æ ‡§ó‡§Ø‡§æ ‡§π‡•à!`);
        return true;
      }
      return false;
    } catch (error: any) {
      console.log('FAILED...', error);
      const errorMsg = "Error " + (error?.status || '422') + ": ‡§°‡•á‡§ü‡§æ ‡§Æ‡•à‡§ö ‡§®‡§π‡•Ä‡§Ç ‡§π‡•Å‡§Ü ‡§Ø‡§æ ‡§ñ‡§æ‡§≤‡•Ä ‡§π‡•à‡•§";
      
      if (statusElem) {
        statusElem.innerText = errorMsg;
        statusElem.style.color = "red";
      }

      setEmailSendingStatus({
        loading: false,
        status: 'error',
        message: errorMsg
      });

      alert(`‚ùå ${errorMsg}\n\n‡§°‡§ø‡§ü‡•á‡§≤‡•ç‡§∏: ${error?.text || error?.message || 'EmailJS Template ‡§Æ‡•á‡§Ç To Email ‡§ï‡•ã {{user_email}} ‡§™‡§∞ ‡§∏‡•á‡§ü ‡§ï‡§∞‡•á‡§Ç‡•§'}`);
      return false;
    }
  };

  // Expose sendKeyToUser globally on window for direct script execution
  useEffect(() => {
    (window as any).sendKeyToUser = () => handleSendKeyToUser();
  }, [emailJsConfig, sendKeyEmailForm]);

  // Dedicated House / 24Ghanta Private Panel Form State
  const [housePanelForm, setHousePanelForm] = useState({
    title: 'PRIVATE LIMITED 24GHANTA PANEL',
    category: '24ghanta',
    image: '',
    isVideo: false,
    videoLink: '',
    telegramLink: '',
    whatsappLink: '',
    featuresText: "Private Limited Main ID Safe\nFull safe 24ghanta\nAnti-blacklist ESP & Headshot\n100% Working Private Panel",
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
  const [selectedCategory, setSelectedCategory] = useState('Category');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewMedia, setPreviewMedia] = useState<{ url: string; isVideo?: boolean; title?: string; youtubeLink?: string } | null>(null);

  // Initial 10% Loading Screen & Modals Sequence
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [loadingPercent, setLoadingPercent] = useState(1);
  const [loadingPhase, setLoadingPhase] = useState<'ring' | 'flowers' | 'done'>('ring');
  const [showLordPremModal, setShowLordPremModal] = useState(false);
  const [showImportantNoticeModal, setShowImportantNoticeModal] = useState(false);

  const getAccountKey = (email?: string, phone?: string) => {
    const raw = (email || phone || '').toLowerCase().trim();
    if (!raw) return 'guest';
    return raw.replace(/[.#$*+?[\]\\/]/g, '_');
  };

  // Admin Configurable Spin Rewards (e.g., 5, 10, 20, 30, 50)
  const [spinRewards, setSpinRewards] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('app_spinRewards');
      return saved ? JSON.parse(saved) : [5, 10, 20, 30, 50];
    } catch (e) {
      return [5, 10, 20, 30, 50];
    }
  });

  useEffect(() => {
    localStorage.setItem('app_spinRewards', JSON.stringify(spinRewards));
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

  const [couponInputCode, setCouponInputCode] = useState('');
  const [couponErrorMsg, setCouponErrorMsg] = useState('');
  const [couponSuccessMsg, setCouponSuccessMsg] = useState('');
  const [showBuySuccessPendingModal, setShowBuySuccessPendingModal] = useState<boolean>(false);

  // New Spin Reward input for admin
  const [newSpinRewardInput, setNewSpinRewardInput] = useState('');

  // Voice Payment Guidance State & Web Speech Synthesis
  const [isSpeakingGuide, setIsSpeakingGuide] = useState(false);

  // üå∏ Female Voice Engine for "Welcome to Prem Store"
  const [hasPlayedIntroVoice, setHasPlayedIntroVoice] = useState(false);

  const playWelcomeVoice = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const text = "Welcome to Prem Store";
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.pitch = 1.18; // Sweet, crisp female voice pitch
      utterance.rate = 0.95;  // Clear, natural cadence
      utterance.volume = 1.0; // High clarity

      const voices = window.speechSynthesis.getVoices();
      // Prioritize female voices (Hindi or English)
      const femaleVoice = voices.find(v => 
        (v.name.toLowerCase().includes('female') || 
         v.name.toLowerCase().includes('zira') || 
         v.name.toLowerCase().includes('samantha') || 
         v.name.toLowerCase().includes('kavya') ||
         v.name.toLowerCase().includes('swara') ||
         v.name.toLowerCase().includes('heera') ||
         v.name.toLowerCase().includes('victoria') ||
         v.name.toLowerCase().includes('karen')) &&
        (v.lang.startsWith('hi') || v.lang.startsWith('en'))
      ) || voices.find(v => v.name.toLowerCase().includes('female')) ||
        voices.find(v => v.lang === 'hi-IN' || v.lang === 'en-IN') ||
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
    if (!isAppLoading && !showLordPremModal && !showImportantNoticeModal && !hasPlayedIntroVoice) {
      setHasPlayedIntroVoice(true);
      const timer = setTimeout(() => {
        playWelcomeVoice();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isAppLoading, showLordPremModal, showImportantNoticeModal, hasPlayedIntroVoice]);

  const voiceGuideText = "Welcome! Paise add karne ki prakriya behad aasan hai. Step 1: Apna manpasand amount select karein. Step 2: Niche Generate QR Code par click karein. Step 3: Screen par dikh rahe QR code ka screenshot lein aur payment karein. Step 4: Payment ke baad mile 12-digit ke UTR number ko save karein. Step 5: App mein niche I Have Paid par click karein. Step 6: Apna 12-digit ka UTR number enter karein aur Submit Payment par click karein. Aapka transaction surakshit roop se submit ho gaya hai. Thank you!";

  const playPaymentVoiceGuide = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(voiceGuideText);
      utterance.lang = 'hi-IN';
      utterance.volume = 1.0; // Loud volume
      utterance.rate = 0.95; // High clarity rate
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const hiVoice = voices.find(v => v.lang && (v.lang.includes('hi') || v.lang.includes('HI') || v.name.includes('Hindi')));
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
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
    setIsSpeakingGuide(false);
  };

  useEffect(() => {
    if (currentView === 'addFund') {
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

  const isAnyInitialModalOpen = isAppLoading || showLordPremModal || showImportantNoticeModal;

  useEffect(() => {
    if (isAnyInitialModalOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      window.scrollTo(0, 0);
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isAnyInitialModalOpen]);

  useEffect(() => {
    let progressInterval: any;
    if (isAppLoading && loadingPhase === 'ring') {
      progressInterval = setInterval(() => {
        setLoadingPercent((prev) => {
          if (prev >= 10) {
            clearInterval(progressInterval);
            setTimeout(() => {
              setIsAppLoading(false);
              setLoadingPhase('done');
              setShowLordPremModal(true);
            }, 300);
            return 10;
          }
          return prev + 1;
        });
      }, 100); // Smooth 1% to 10% loading count
    }
    return () => clearInterval(progressInterval);
  }, [isAppLoading, loadingPhase]);

  const [userAccountProfiles, setUserAccountProfiles] = useState<Record<string, { avatar?: string; keysBought?: number; totalAdded?: number; joinDate?: string }>>({});

  useEffect(() => {
    localStorage.setItem('app_userAccountProfiles', JSON.stringify(userAccountProfiles));
  }, [userAccountProfiles]);

  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('app_userProfile');
    if (saved) {
      try {
        const profile = JSON.parse(saved);
        if (profile && profile.isLoggedIn) {
          const key = getAccountKey(profile.email, profile.phone);
          const savedProfiles = localStorage.getItem('app_userAccountProfiles');
          const profiles = savedProfiles ? JSON.parse(savedProfiles) : {};
          if (key && profiles[key]) {
            return {
              ...profile,
              avatar: profiles[key].avatar || profile.avatar,
              keysBought: profiles[key].keysBought ?? profile.keysBought,
              totalAdded: profiles[key].totalAdded ?? profile.totalAdded,
              joinDate: profiles[key].joinDate || profile.joinDate
            };
          }
        }
        return profile;
      } catch (e) {}
    }
    return {
      isLoggedIn: false,
      email: '',
      phone: '',
      password: '',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
      joinDate: '',
      keysBought: 0,
      totalAdded: 0
    };
  });

  useEffect(() => {
    localStorage.setItem('app_userProfile', JSON.stringify(userProfile));
    if (userProfile.isLoggedIn) {
      const key = getAccountKey(userProfile.email, userProfile.phone);
      if (key && key !== 'guest') {
        setUserAccountProfiles(prev => ({
          ...prev,
          [key]: {
            avatar: userProfile.avatar,
            keysBought: userProfile.keysBought,
            totalAdded: userProfile.totalAdded,
            joinDate: userProfile.joinDate
          }
        }));
      }
    }
  }, [userProfile]);

  // Account-Specific Spin Timestamps, Coupon Used Timestamps, and Account Coupons
  const [userSpinTimestamps, setUserSpinTimestamps] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('app_userSpinTimestamps');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('app_userSpinTimestamps', JSON.stringify(userSpinTimestamps));
  }, [userSpinTimestamps]);

  const [userCouponUsedTimestamps, setUserCouponUsedTimestamps] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('app_userCouponUsedTimestamps');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('app_userCouponUsedTimestamps', JSON.stringify(userCouponUsedTimestamps));
  }, [userCouponUsedTimestamps]);

  const [userAccountCoupons, setUserAccountCoupons] = useState<Record<string, any[]>>(() => {
    try {
      const saved = localStorage.getItem('app_userAccountCoupons');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('app_userAccountCoupons', JSON.stringify(userAccountCoupons));
  }, [userAccountCoupons]);

  const activeAccKey = getAccountKey(userProfile.email, userProfile.phone);
  const lastSpinTimestamp = userProfile.isLoggedIn ? (userSpinTimestamps[activeAccKey] || 0) : 0;
  const lastCouponUsedTimestamp = userProfile.isLoggedIn ? (userCouponUsedTimestamps[activeAccKey] || 0) : 0;
  const userCoupons = userProfile.isLoggedIn ? (userAccountCoupons[activeAccKey] || []) : [];

  const [userWallets, setUserWallets] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('app_userWallets');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('app_userWallets', JSON.stringify(userWallets));
  }, [userWallets]);

  const [userBalance, setUserBalance] = useState(() => {
    const savedProfile = localStorage.getItem('app_userProfile');
    const profile = savedProfile ? JSON.parse(savedProfile) : null;
    if (profile && profile.isLoggedIn) {
      const key = getAccountKey(profile.email, profile.phone);
      const savedWallets = localStorage.getItem('app_userWallets');
      const wallets = savedWallets ? JSON.parse(savedWallets) : {};
      if (key && key in wallets) {
        return Number(wallets[key]);
      }
    }
    const saved = localStorage.getItem('app_userBalance');
    return saved ? Number(saved) : 0;
  });

  useEffect(() => {
    if (userProfile.isLoggedIn) {
      const activeKey = getAccountKey(userProfile.email, userProfile.phone);
      if (userWallets[activeKey] !== undefined && userWallets[activeKey] !== userBalance) {
        setUserBalance(userWallets[activeKey]);
      }
    }
  }, [userWallets, userProfile.isLoggedIn, userProfile.email, userProfile.phone]);

  useEffect(() => {
    localStorage.setItem('app_userBalance', userBalance.toString());
    if (userProfile.isLoggedIn) {
      const key = getAccountKey(userProfile.email, userProfile.phone);
      if (key && key !== 'guest') {
        setUserWallets(prev => {
          if (prev[key] === userBalance) return prev;
          return { ...prev, [key]: userBalance };
        });
      }
    }
  }, [userBalance, userProfile.isLoggedIn, userProfile.email, userProfile.phone]);

  const [paymentSettings, setPaymentSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('app_paymentSettings');
      return saved ? JSON.parse(saved) : {
        qrImage: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg',
        upiId: '9876543210@paytm'
      };
    } catch (e) {
      return {
        qrImage: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg',
        upiId: '9876543210@paytm'
      };
    }
  });

  useEffect(() => {
    localStorage.setItem('app_paymentSettings', JSON.stringify(paymentSettings));
  }, [paymentSettings]);

  const [supportLinks, setSupportLinks] = useState(() => {
    try {
      const saved = localStorage.getItem('app_supportLinks');
      return saved ? JSON.parse(saved) : {
        telegram: 'https://t.me/yourchannel',
        whatsapp: 'https://wa.me/1234567890',
        ownerTelegram: 'https://t.me/Premjodvip'
      };
    } catch (e) {
      return {
        telegram: 'https://t.me/yourchannel',
        whatsapp: 'https://wa.me/1234567890',
        ownerTelegram: 'https://t.me/Premjodvip'
      };
    }
  });

  useEffect(() => {
    localStorage.setItem('app_supportLinks', JSON.stringify(supportLinks));
  }, [supportLinks]);

  const [accessFileSteps, setAccessFileSteps] = useState(() => {
    try {
      const saved = localStorage.getItem('app_accessFileSteps');
      return saved ? JSON.parse(saved) : {
        step1Title: 'Step 1: Watch YouTube Video Tutorial',
        step1Url: 'https://www.youtube.com',
        step2Title: 'Step 2: Join Telegram Channel For Files',
        step2Url: 'https://t.me/yourchannel',
        step3Title: 'Step 3: Join WhatsApp Group For Support',
        step3Url: 'https://wa.me/1234567890',
        directFileUrl: 'https://t.me/yourchannel'
      };
    } catch (e) {
      return {
        step1Title: 'Step 1: Watch YouTube Video Tutorial',
        step1Url: 'https://www.youtube.com',
        step2Title: 'Step 2: Join Telegram Channel For Files',
        step2Url: 'https://t.me/yourchannel',
        step3Title: 'Step 3: Join WhatsApp Group For Support',
        step3Url: 'https://wa.me/1234567890',
        directFileUrl: 'https://t.me/yourchannel'
      };
    }
  });

  useEffect(() => {
    localStorage.setItem('app_accessFileSteps', JSON.stringify(accessFileSteps));
  }, [accessFileSteps]);

  const [showAccessFilesModal, setShowAccessFilesModal] = useState(false);
  const [activePanelFileUrl, setActivePanelFileUrl] = useState('');

  const [panels, setPanels] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('app_panels');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {}
    return [
      {
        id: 1,
        title: "A,XYZ MAIN ID FF PROXY NONROOT",
        thumbnailTitle: "A,XYZ CHEATS BALA FF MAIN",
        thumbnailSub: "PREMIUM PANELS",
        image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop",
        isVideo: false,
        features: ["Main Id safe", "Full safe NONROOT", "Esp crack anti-blacklist", "Auto headshot 100% working"],
        installLink: "https://t.me/yourchannel",
        videoLink: "https://t.me/yourchannel",
        exceptFileLink: "https://t.me/yourchannel",
        pricing: [
          { label: "1 Day", price: 90 },
          { label: "3 Day", price: 58 },
          { label: "7 Day", price: 67 },
          { label: "15 Day", price: 590 },
          { label: "30 Day", price: 5000 }
        ]
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('app_panels', JSON.stringify(panels));
  }, [panels]);

  const [bgSettings, setBgSettings] = useState(() => {
    const saved = localStorage.getItem('app_bgSettings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          enabled: parsed.enabled !== undefined ? parsed.enabled : true,
          customImage: parsed.customImage || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop',
          enableFlowers: parsed.enableFlowers !== undefined ? parsed.enableFlowers : true,
          flowerSpeed: parsed.flowerSpeed || 1,
          darknessOverlay: parsed.darknessOverlay || 0,
          themeHue: parsed.themeHue || 0
        };
      } catch (e) {
        console.error(e);
      }
    }
    return {
      enabled: true,
      customImage: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop',
      enableFlowers: true,
      flowerSpeed: 1,
      darknessOverlay: 0,
      themeHue: 0
    };
  });

  useEffect(() => {
    localStorage.setItem('app_bgSettings', JSON.stringify(bgSettings));
  }, [bgSettings]);

  const [flowerParticles] = useState(() => {
    const colors = [
      { primary: '#FF0055', secondary: '#FF5A92', center: '#FFE500' }, // Vibrant Rose Red
      { primary: '#FFD600', secondary: '#FFF176', center: '#FF6D00' }, // Sun Gold Yellow
      { primary: '#00E676', secondary: '#B9F6CA', center: '#FFFF00' }, // Emerald Green
      { primary: '#00E5FF', secondary: '#80D8FF', center: '#FFFFFF' }, // Electric Cyan
      { primary: '#3D5AFE', secondary: '#8C9EFF', center: '#00E5FF' }, // Royal Indigo
      { primary: '#D500F9', secondary: '#EA80FC', center: '#FFD600' }, // Vivid Violet
      { primary: '#FF6D00', secondary: '#FFAB40', center: '#FFFF00' }, // Sunset Orange
      { primary: '#FF1744', secondary: '#FF80AB', center: '#FFEA00' }  // Neon Crimson
    ];
    return Array.from({ length: 48 }).map((_, i) => {
      const palette = colors[i % colors.length];
      return {
        id: i,
        left: (i * 2.1 + Math.sin(i * 1.8) * 12 + (i % 3) * 4) % 96,
        size: 32 + (i % 6) * 6, // 32px to 62px large crisp size
        duration: 4.5 + (i % 5) * 1.2, // Smooth duration
        delay: (i * 0.28) % 7,
        color: palette.primary,
        secondaryColor: palette.secondary,
        centerColor: palette.center
      };
    });
  });

  const [expandedPanels, setExpandedPanels] = useState<Record<number, boolean>>({});
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  const [newPanelForm, setNewPanelForm] = useState({
    title: '',
    category: 'NON ROOT',
    image: '',
    isVideo: false,
    videoLink: '',
    exceptFileLink: '',
    featuresText: "Main Id safe\nFull safe NONROOT\nEsp crack anti-blacklist\nAuto headshot 100% working",
    price1: 90,
    price3: 58,
    price7: 67,
    price15: 590,
    price30: 5000
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

  const [spinRequests, setSpinRequests] = useState<{
    id: number;
    email: string;
    phone: string;
    password: string;
    prizeWon: number;
    date: string;
    status: string;
  }[]>(() => {
    try {
      const saved = localStorage.getItem('app_spinRequests');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('app_spinRequests', JSON.stringify(spinRequests));
  }, [spinRequests]);

  const [referRequests, setReferRequests] = useState<{
    id: number;
    referrerEmail: string;
    referrerPhone: string;
    referrerPassword: string;
    referredEmail: string;
    referredPhone: string;
    bonusAmount: number;
    date: string;
    status: string;
  }[]>(() => {
    try {
      const saved = localStorage.getItem('app_referRequests');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('app_referRequests', JSON.stringify(referRequests));
  }, [referRequests]);

  // Admin Configurable Referral Website Link & Bonus Amount
  const [referWebsiteLink, setReferWebsiteLink] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('app_referWebsiteLink');
      return saved || 'https://website.com';
    } catch (e) {
      return 'https://website.com';
    }
  });

  useEffect(() => {
    localStorage.setItem('app_referWebsiteLink', referWebsiteLink);
  }, [referWebsiteLink]);

  const [referBonusAmount, setReferBonusAmount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('app_referBonusAmount');
      return saved ? Number(saved) : 50;
    } catch (e) {
      return 50;
    }
  });

  useEffect(() => {
    localStorage.setItem('app_referBonusAmount', referBonusAmount.toString());
  }, [referBonusAmount]);

  const [referSettingsSavedMsg, setReferSettingsSavedMsg] = useState('');

  const [isSpinning, setIsSpinning] = useState(false);
  const [spinRotation, setSpinRotation] = useState(0);
  const [spinResult, setSpinResult] = useState<number | null>(null);

  const [keyRequests, setKeyRequests] = useState<{
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
  }[]>(() => {
    try {
      const saved = localStorage.getItem('app_keyRequests');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('app_keyRequests', JSON.stringify(keyRequests));
  }, [keyRequests]);

  const [manualKeyForm, setManualKeyForm] = useState({
    targetAccount: '',
    panelTitle: '',
    keyVal: '',
    price: 80
  });

  const [registeredUsers, setRegisteredUsers] = useState<{name?: string, email: string, phone: string, password: string, avatar?: string, joinDate: string}[]>(() => {
    try {
      const saved = localStorage.getItem('app_registeredUsers');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [bannedUsers, setBannedUsers] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('app_bannedUsers');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [authStats, setAuthStats] = useState(() => {
    try {
      const saved = localStorage.getItem('app_authStats');
      return saved ? JSON.parse(saved) : { logins: 0, logouts: 0 };
    } catch (e) {
      return { logins: 0, logouts: 0 };
    }
  });

  useEffect(() => {
    localStorage.setItem('app_bannedUsers', JSON.stringify(bannedUsers));
  }, [bannedUsers]);

  useEffect(() => {
    localStorage.setItem('app_authStats', JSON.stringify(authStats));
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
    activeTab?: 'info' | 'keys' | 'payments';
  } | null>(null);

  useEffect(() => {
    localStorage.setItem('app_registeredUsers', JSON.stringify(registeredUsers));
  }, [registeredUsers]);



  const [unreadLogins, setUnreadLogins] = useState(0);
  const [showRejectedAlert, setShowRejectedAlert] = useState(true);
  const [selectedPlans, setSelectedPlans] = useState<Record<number, number>>({});
  const [avatarUrlInput, setAvatarUrlInput] = useState('');

  const handleSaveAvatar = (photoUrlOrBase64: string) => {
    if (!photoUrlOrBase64) return;
    
    setUserProfile(prev => ({ ...prev, avatar: photoUrlOrBase64 }));

    const userAccKey = getAccountKey(userProfile.email, userProfile.phone);
    setRegisteredUsers(prev => {
      const exists = prev.some(u => getAccountKey(u.email, u.phone) === userAccKey);
      if (exists) {
        return prev.map(u => {
          if (getAccountKey(u.email, u.phone) === userAccKey) {
            return { ...u, avatar: photoUrlOrBase64 };
          }
          return u;
        });
      } else {
        return [
          {
            name: userProfile.email ? userProfile.email.split('@')[0] : (userProfile.phone || 'User'),
            email: userProfile.email || '',
            phone: userProfile.phone || '',
            password: userProfile.password || '',
            avatar: photoUrlOrBase64,
            joinDate: userProfile.joinDate || new Date().toLocaleString()
          },
          ...prev
        ];
      }
    });

    alert("‚úÖ Aapki Profile Photo permanent save ho gayi hai!");
  };

  const [isSigningInUserGoogle, setIsSigningInUserGoogle] = useState(false);
  const [userAuthTab, setUserAuthTab] = useState<'login' | 'register'>('login');
  const [userLoginForm, setUserLoginForm] = useState({ identifier: '', password: '' });
  const [userRegisterForm, setUserRegisterForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [userAuthError, setUserAuthError] = useState('');
  const [showGoogleLoginModal, setShowGoogleLoginModal] = useState(false);
  const [googleModalEmail, setGoogleModalEmail] = useState('');
  const [googleModalName, setGoogleModalName] = useState('');
  const [googleModalPass, setGoogleModalPass] = useState('');
  const [googleModalError, setGoogleModalError] = useState('');

  const validateEmailFormat = (email: string) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase().trim());
  };

  const validatePhoneFormat = (phone: string) => {
    const cleanDigits = phone.replace(/[\s\-\+]/g, '').slice(-10);
    return /^[6-9]\d{9}$/.test(cleanDigits);
  };

  const processSuccessfulGoogleLogin = (emailVal: string, displayName: string, photoVal: string, phoneVal: string) => {
    const cleanEmail = emailVal.trim().toLowerCase();
    const cleanPhone = phoneVal ? phoneVal.replace(/[\s\-\+]/g, '').slice(-10) : '';
    const name = displayName || cleanEmail.split('@')[0] || 'Google User';
    const avatar = photoVal || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop';
    const accKey = getAccountKey(cleanEmail, cleanPhone);

    const isExistingInWallets = accKey in userWallets;
    const existingUser = registeredUsers.find(u => getAccountKey(u.email, u.phone) === accKey);

    if (isExistingInWallets || existingUser) {
      const savedBal = userWallets[accKey] ?? 0;
      const savedAccProfile = userAccountProfiles[accKey];
      setUserBalance(savedBal);
      setUserProfile({
        ...userProfile,
        isLoggedIn: true,
        email: cleanEmail,
        phone: cleanPhone || existingUser?.phone || '',
        password: 'GoogleLoginVerified',
        avatar: avatar || savedAccProfile?.avatar || existingUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
        keysBought: savedAccProfile?.keysBought ?? 0,
        totalAdded: savedAccProfile?.totalAdded ?? 0,
        joinDate: savedAccProfile?.joinDate || existingUser?.joinDate || new Date().toLocaleString()
      });
      alert("üéâ ‡§∏‡•ç‡§µ‡§æ‡§ó‡§§ ‡§π‡•à " + name + "!\nGoogle Login ‡§∏‡§´‡§≤ ‡§π‡•Å‡§Ü‡•§ ‡§Ü‡§™‡§ï‡§æ Wallet Balance: ‚Çπ" + savedBal);
    } else {
      setUserWallets(prev => ({ ...prev, [accKey]: 0 }));
      setUserBalance(0);
      const joinDateStr = new Date().toLocaleString();
      setUserAccountProfiles(prev => ({
        ...prev,
        [accKey]: {
          avatar,
          keysBought: 0,
          totalAdded: 0,
          joinDate: joinDateStr
        }
      }));
      setUserProfile({
        ...userProfile,
        isLoggedIn: true,
        email: cleanEmail,
        phone: cleanPhone,
        password: 'GoogleLoginVerified',
        avatar,
        keysBought: 0,
        totalAdded: 0,
        joinDate: joinDateStr
      });
      const newUser = {
        name,
        email: cleanEmail,
        phone: cleanPhone,
        password: 'GoogleLoginVerified',
        avatar,
        joinDate: joinDateStr
      };
      setRegisteredUsers(prev => [newUser, ...prev]);
      setUnreadLogins(prev => prev + 1);

      try {
        const rtdbRef = ref(database, 'registeredUsers');
        set(rtdbRef, [newUser, ...registeredUsers]);
      } catch (e) {}

      alert("üéâ ‡§∏‡•ç‡§µ‡§æ‡§ó‡§§ ‡§π‡•à " + name + "!\n‡§®‡§Ø‡§æ Google Account ‡§∏‡§´‡§≤‡§§‡§æ‡§™‡•Ç‡§∞‡•ç‡§µ‡§ï ‡§¨‡§® ‡§ó‡§Ø‡§æ ‡§π‡•à (Wallet Balance: ‚Çπ0)‡•§");
    }
    setShowGoogleLoginModal(false);
    setCurrentView('home');
  };

  const handleGoogleUserSignIn = async () => {
    try {
      setIsSigningInUserGoogle(true);
      const auth = getAuth(firebaseApp);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      if (user && user.email) {
        processSuccessfulGoogleLogin(user.email, user.displayName || '', user.photoURL || '', user.phoneNumber || '');
      } else {
        setShowGoogleLoginModal(true);
      }
    } catch (err: any) {
      console.warn("Google Auth popup issue or blocked in iframe:", err);
      setShowGoogleLoginModal(true);
      setGoogleModalError('');
    } finally {
      setIsSigningInUserGoogle(false);
    }
  };

  const handleUserLoginSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setUserAuthError('');
    const rawId = userLoginForm.identifier.trim();
    const pass = userLoginForm.password.trim();

    if (!rawId) {
      setUserAuthError('‚ùå ‡§ï‡•É‡§™‡§Ø‡§æ ‡§Ö‡§™‡§®‡§æ Registered Email ID ‡§Ø‡§æ 10-‡§Ö‡§Ç‡§ï‡•ã‡§Ç ‡§ï‡§æ Mobile Number ‡§¶‡§∞‡•ç‡§ú ‡§ï‡§∞‡•á‡§Ç!');
      return;
    }
    if (!pass) {
      setUserAuthError('‚ùå ‡§ï‡•É‡§™‡§Ø‡§æ ‡§Ö‡§™‡§®‡§æ Password ‡§¶‡§∞‡•ç‡§ú ‡§ï‡§∞‡•á‡§Ç!');
      return;
    }

    const isEmail = rawId.includes('@');
    let cleanEmail = '';
    let cleanPhone = '';

    if (isEmail) {
      if (!validateEmailFormat(rawId)) {
        setUserAuthError('‚ùå ‡§Ö‡§Æ‡§æ‡§®‡•ç‡§Ø Email Format! ‡§ï‡•É‡§™‡§Ø‡§æ ‡§∏‡§π‡•Ä Email ID (‡§â‡§¶‡§æ. name@gmail.com) ‡§¶‡§∞‡•ç‡§ú ‡§ï‡§∞‡•á‡§Ç‡•§');
        return;
      }
      cleanEmail = rawId.toLowerCase();
    } else {
      const digits = rawId.replace(/[\s\-\+]/g, '').slice(-10);
      if (!validatePhoneFormat(digits)) {
        setUserAuthError('‚ùå ‡§Ö‡§Æ‡§æ‡§®‡•ç‡§Ø Mobile Number! ‡§ï‡•É‡§™‡§Ø‡§æ 10 ‡§Ö‡§Ç‡§ï‡•ã‡§Ç ‡§ï‡§æ ‡§µ‡•à‡§ß ‡§Æ‡•ã‡§¨‡§æ‡§á‡§≤ ‡§®‡§Ç‡§¨‡§∞ ‡§¶‡§∞‡•ç‡§ú ‡§ï‡§∞‡•á‡§Ç (‡§â‡§¶‡§æ. 9876543210)‡•§');
        return;
      }
      cleanPhone = digits;
    }

    // Strict validation against registeredUsers
    const user = registeredUsers.find(u => {
      if (cleanEmail && u.email && u.email.toLowerCase() === cleanEmail) return true;
      if (cleanPhone && u.phone && u.phone.replace(/[\s\-\+]/g, '').slice(-10) === cleanPhone) return true;
      return false;
    });

    if (!user) {
      setUserAuthError('‚ùå ‡§Ø‡§π Account ‡§Æ‡•å‡§ú‡•Ç‡§¶ ‡§®‡§π‡•Ä‡§Ç ‡§π‡•à! ‡§ï‡•ã‡§à ‡§≠‡•Ä ‡§ó‡§≤‡§§ ‡§Ø‡§æ ‡§´‡§∞‡•ç‡§ú‡•Ä ‡§ú‡§æ‡§®‡§ï‡§æ‡§∞‡•Ä ‡§∏‡•á ‡§≤‡•â‡§ó‡§ø‡§® ‡§®‡§π‡•Ä‡§Ç ‡§π‡•ã ‡§∏‡§ï‡§§‡§æ‡•§ ‡§ï‡•É‡§™‡§Ø‡§æ ‡§™‡§π‡§≤‡•á "‡§®‡§Ø‡§æ ‡§Ö‡§ï‡§æ‡§â‡§Ç‡§ü ‡§¨‡§®‡§æ‡§è‡§Ç (Register)" ‡§ü‡•à‡§¨ ‡§∏‡•á ‡§Ö‡§∏‡§≤‡•Ä Email & Phone ‡§¶‡•á‡§ï‡§∞ ‡§∞‡§ú‡§ø‡§∏‡•ç‡§ü‡§∞ ‡§ï‡§∞‡•á‡§Ç‡•§');
      return;
    }

    if (user.password !== pass && user.password !== 'GoogleLoginVerified') {
      setUserAuthError('‚ùå ‡§ó‡§≤‡§§ ‡§™‡§æ‡§∏‡§µ‡§∞‡•ç‡§° (Incorrect Password)! ‡§Ü‡§™‡§®‡•á ‡§ú‡•ã ‡§™‡§æ‡§∏‡§µ‡§∞‡•ç‡§° ‡§°‡§æ‡§≤‡§æ ‡§π‡•à ‡§µ‡§π ‡§á‡§∏ ‡§Ö‡§ï‡§æ‡§â‡§Ç‡§ü ‡§∏‡•á ‡§Æ‡•á‡§≤ ‡§®‡§π‡•Ä‡§Ç ‡§ñ‡§æ‡§§‡§æ ‡§π‡•à‡•§ ‡§ï‡•É‡§™‡§Ø‡§æ ‡§∏‡§π‡•Ä ‡§™‡§æ‡§∏‡§µ‡§∞‡•ç‡§° ‡§°‡§æ‡§≤‡•á‡§Ç‡•§');
      return;
    }

    const accKey = getAccountKey(user.email, user.phone);
    const savedBal = userWallets[accKey] ?? 0;
    const savedAccProfile = userAccountProfiles[accKey];

    setUserBalance(savedBal);
    setUserProfile({
      ...userProfile,
      isLoggedIn: true,
      email: user.email || '',
      phone: user.phone || '',
      password: user.password,
      avatar: savedAccProfile?.avatar || user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
      keysBought: savedAccProfile?.keysBought ?? 0,
      totalAdded: savedAccProfile?.totalAdded ?? 0,
      joinDate: savedAccProfile?.joinDate || user.joinDate || new Date().toLocaleString()
    });

    alert("üéâ ‡§∏‡•ç‡§µ‡§æ‡§ó‡§§ ‡§π‡•à " + (user.name || user.email || user.phone) + "!\n‡§≤‡•â‡§ó‡§ø‡§® ‡§∏‡§´‡§≤ ‡§π‡•Å‡§Ü‡•§ ‡§Ü‡§™‡§ï‡§æ Wallet Balance: ‚Çπ" + savedBal);
    setCurrentView('home');
  };

  const handleUserRegisterSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setUserAuthError('');
    const name = userRegisterForm.name.trim();
    const email = userRegisterForm.email.trim().toLowerCase();
    const rawPhone = userRegisterForm.phone.replace(/[\s\-\+]/g, '').slice(-10);
    const pass = userRegisterForm.password.trim();
    const confirmPass = userRegisterForm.confirmPassword.trim();

    if (!name || name.length < 3) {
      setUserAuthError('‚ùå ‡§ï‡•É‡§™‡§Ø‡§æ ‡§Ö‡§™‡§®‡§æ ‡§Ö‡§∏‡§≤‡•Ä ‡§®‡§æ‡§Æ (‡§ï‡§Æ ‡§∏‡•á ‡§ï‡§Æ 3 ‡§Ö‡§ï‡•ç‡§∑‡§∞) ‡§¶‡§∞‡•ç‡§ú ‡§ï‡§∞‡•á‡§Ç!');
      return;
    }
    if (!email || !validateEmailFormat(email)) {
      setUserAuthError('‚ùå ‡§ï‡•É‡§™‡§Ø‡§æ ‡§Ö‡§∏‡§≤‡•Ä ‡§è‡§µ‡§Ç ‡§µ‡•à‡§ß Email ID ‡§¶‡§∞‡•ç‡§ú ‡§ï‡§∞‡•á‡§Ç (‡§â‡§¶‡§æ. yourname@gmail.com)! ‡§ï‡•ã‡§à ‡§≠‡•Ä ‡§´‡§∞‡•ç‡§ú‡•Ä ‡§Ü‡§à‡§°‡•Ä ‡§∏‡•ç‡§µ‡•Ä‡§ï‡§æ‡§∞ ‡§®‡§π‡•Ä‡§Ç ‡§π‡•ã‡§ó‡•Ä‡•§');
      return;
    }
    if (!rawPhone || !validatePhoneFormat(rawPhone)) {
      setUserAuthError('‚ùå ‡§ï‡•É‡§™‡§Ø‡§æ 10 ‡§Ö‡§Ç‡§ï‡•ã‡§Ç ‡§ï‡§æ Real Mobile Number ‡§¶‡§∞‡•ç‡§ú ‡§ï‡§∞‡•á‡§Ç (‡§â‡§¶‡§æ. 9876543210)!');
      return;
    }
    if (!pass || pass.length < 6) {
      setUserAuthError('‚ùå Password ‡§ï‡§Æ ‡§∏‡•á ‡§ï‡§Æ 6 ‡§Ö‡§ï‡•ç‡§∑‡§∞‡•ã‡§Ç ‡§ï‡§æ ‡§π‡•ã‡§®‡§æ ‡§Ö‡§®‡§ø‡§µ‡§æ‡§∞‡•ç‡§Ø ‡§π‡•à!');
      return;
    }
    if (pass !== confirmPass) {
      setUserAuthError('‚ùå ‡§¶‡•ã‡§®‡•ã‡§Ç Password ‡§Ü‡§™‡§∏ ‡§Æ‡•á‡§Ç ‡§Æ‡•á‡§≤ ‡§®‡§π‡•Ä‡§Ç ‡§ñ‡§æ ‡§∞‡§π‡•á ‡§π‡•à‡§Ç! ‡§ï‡•É‡§™‡§Ø‡§æ ‡§∏‡§π‡•Ä Confirm Password ‡§¶‡§∞‡•ç‡§ú ‡§ï‡§∞‡•á‡§Ç‡•§');
      return;
    }

    const emailExists = registeredUsers.some(u => u.email && u.email.toLowerCase() === email);
    if (emailExists) {
      setUserAuthError("‚ùå ‡§Ø‡§π Email ID (" + email + ") ‡§™‡§π‡§≤‡•á ‡§∏‡•á ‡§∞‡§ú‡§ø‡§∏‡•ç‡§ü‡§∞‡•ç‡§° ‡§π‡•à! ‡§ï‡•É‡§™‡§Ø‡§æ ‡§∏‡•Ä‡§ß‡•á Login ‡§ü‡•à‡§¨ ‡§™‡§∞ ‡§ú‡§æ‡§è‡§Ç‡•§");
      return;
    }

    const phoneExists = registeredUsers.some(u => u.phone && u.phone.replace(/[\s\-\+]/g, '').slice(-10) === rawPhone);
    if (phoneExists) {
      setUserAuthError("‚ùå ‡§Ø‡§π Mobile Number (" + rawPhone + ") ‡§™‡§π‡§≤‡•á ‡§∏‡•á ‡§∞‡§ú‡§ø‡§∏‡•ç‡§ü‡§∞‡•ç‡§° ‡§π‡•à! ‡§ï‡•É‡§™‡§Ø‡§æ ‡§∏‡•Ä‡§ß‡•á Login ‡§ü‡•à‡§¨ ‡§™‡§∞ ‡§ú‡§æ‡§è‡§Ç‡•§");
      return;
    }

    const joinDateStr = new Date().toLocaleString();
    const freshAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop';
    const accKey = getAccountKey(email, rawPhone);

    setUserWallets(prev => ({ ...prev, [accKey]: 0 }));
    setUserBalance(0);

    setUserAccountProfiles(prev => ({
      ...prev,
      [accKey]: {
        avatar: freshAvatar,
        keysBought: 0,
        totalAdded: 0,
        joinDate: joinDateStr
      }
    }));

    const newUser = {
      name,
      email,
      phone: rawPhone,
      password: pass,
      avatar: freshAvatar,
      joinDate: joinDateStr
    };

    setRegisteredUsers(prev => [newUser, ...prev]);
    setUnreadLogins(prev => prev + 1);

    setUserProfile({
      ...userProfile,
      isLoggedIn: true,
      email,
      phone: rawPhone,
      password: pass,
      avatar: freshAvatar,
      keysBought: 0,
      totalAdded: 0,
      joinDate: joinDateStr
    });

    try {
      const rtdbRef = ref(database, 'registeredUsers');
      set(rtdbRef, [newUser, ...registeredUsers]);
    } catch (err) {
      console.warn("RTDB sync:", err);
    }

    alert("üéâ ‡§¨‡§ß‡§æ‡§à ‡§π‡•ã " + name + "!\n‡§Ü‡§™‡§ï‡§æ ‡§®‡§Ø‡§æ ‡§Ö‡§ï‡§æ‡§â‡§Ç‡§ü ‡§Ö‡§∏‡§≤‡•Ä Email (" + email + ") & Mobile (" + rawPhone + ") ‡§ï‡•á ‡§∏‡§æ‡§• ‡§∏‡§´‡§≤‡§§‡§æ‡§™‡•Ç‡§∞‡•ç‡§µ‡§ï ‡§¨‡§® ‡§ó‡§Ø‡§æ ‡§π‡•à‡•§\nWallet Balance: ‚Çπ0 (‡§ï‡•É‡§™‡§Ø‡§æ Add Fund ‡§∏‡•á ‡§™‡•à‡§∏‡•á ‡§ú‡•ã‡§°‡§º‡•á‡§Ç)‡•§");
    setCurrentView('home');
  };

  const handleGoogleModalSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setGoogleModalError('');
    const emailVal = googleModalEmail.trim().toLowerCase();
    const nameVal = googleModalName.trim();

    if (!emailVal) {
      setGoogleModalError('‚ùå ‡§ï‡•É‡§™‡§Ø‡§æ ‡§Ö‡§™‡§®‡§æ Google (Gmail) ID ‡§¶‡§∞‡•ç‡§ú ‡§ï‡§∞‡•á‡§Ç!');
      return;
    }
    if (!validateEmailFormat(emailVal)) {
      setGoogleModalError('‚ùå ‡§Ö‡§Æ‡§æ‡§®‡•ç‡§Ø Email Format! ‡§ï‡•É‡§™‡§Ø‡§æ ‡§µ‡•à‡§ß Google Email ID (‡§ú‡•à‡§∏‡•á name@gmail.com) ‡§¶‡§∞‡•ç‡§ú ‡§ï‡§∞‡•á‡§Ç‡•§');
      return;
    }

    processSuccessfulGoogleLogin(
      emailVal,
      nameVal || emailVal.split('@')[0],
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
      ''
    );
  };

  useEffect(() => {
    const q = searchQuery.trim();
    if (q === 'PREM74') {
      setCurrentView('staff');
      setSearchQuery('');
      alert("‚ö° STAFF PANEL UNLOCKED! Welcome Staff Portal.");
    } else if (q === 'Prem74' || q === 'prem74') {
      setCurrentView('admin');
      setSearchQuery('');
    }
  }, [searchQuery]);

  const [amount, setAmount] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [qrGenerated, setQrGenerated] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [unreadKeys, setUnreadKeys] = useState(0);
  const [unreadSpins, setUnreadSpins] = useState(0);
  const [unreadRefers, setUnreadRefers] = useState(0);

  useEffect(() => {
    if (currentView === 'keyPending') {
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

  const handleOpenCheckout = (price: any, panelTitle: string, explicitResellerPrice?: number) => {
    const isResellerActive = resellerUser.isLoggedIn && resellerUser.isApproved;
    const panelObj = panels.find(p => p.title === panelTitle);
    const planObj = panelObj?.pricing.find(pr => pr.price == price || (explicitResellerPrice && (pr as any).resellerPrice === explicitResellerPrice));
    
    // Completely secure Out of Stock check
    const isOutOfStock = !planObj || isNaN(Number(planObj.price)) || Number(planObj.price) < 0 || (planObj.label && planObj.label.toLowerCase().includes('stock')) || (typeof planObj.price === 'string' && planObj.price.toLowerCase().includes('stock'));
    
    if (isOutOfStock) {
      alert(`Is panel ko abhi nahin khareed sakte hain (Out of Stock). Kripya dropdown se dusra plan select karein.`);
      return; // Do not open checkout modal
    }
    
    const numPrice = Number(planObj.price);
    // Differential Pricing calculation
    const effectiveResellerPrice = explicitResellerPrice !== undefined 
      ? explicitResellerPrice 
      : (planObj && (planObj as any).resellerPrice !== undefined ? (planObj as any).resellerPrice : Math.round(numPrice * 0.65));
    
    const activeChargePrice = isResellerActive ? effectiveResellerPrice : numPrice;
    const activeWalletBal = isResellerActive ? (resellerUser.balance > 0 ? resellerUser.balance : userBalance) : userBalance;

    if (activeWalletBal < activeChargePrice) {
      alert(`Insufficient balance! Your wallet balance is ‚Çπ${activeWalletBal} but panel price is ‚Çπ${activeChargePrice}. Redirecting to add funds...`);
      setCurrentView("addFund");
      return;
    }

    const planLabel = planObj?.label ? `${planObj.label} nonroot` : "1 DAY nonroot";

    setCheckoutData({
      panelTitle: panelTitle,
      planLabel: isResellerActive ? `${planLabel} [üëë RESELLER VIP RATE]` : planLabel,
      originalPrice: activeChargePrice,
      panelObj: panelObj
    });
    setAppliedCoupon(null);
    setCouponInputCode("");
    setCouponErrorMsg("");
    setCouponSuccessMsg("");
  };

  const handleApplyCoupon = () => {
    setCouponErrorMsg('');
    setCouponSuccessMsg('');

    const trimmedCode = couponInputCode.trim().toUpperCase();
    if (!trimmedCode) {
      setCouponErrorMsg('Please enter a coupon code.');
      return;
    }

    // Check if 24 hours passed since last coupon used
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    if (now - lastCouponUsedTimestamp < twentyFourHours) {
      const remainingMs = twentyFourHours - (now - lastCouponUsedTimestamp);
      const remHours = Math.floor(remainingMs / (1000 * 60 * 60));
      const remMins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
      setCouponErrorMsg(`Aapne 24 ghante me pehle hi 1 coupon use kar liya hai. Agla coupon ${remHours}h ${remMins}m baad use kar sakte hain.`);
      return;
    }

    // Strict validation: Must match exact coupon in userCoupons array (no fake or tampered codes allowed)
    const matchedCoupon = userCoupons.find(c => c.code.trim().toUpperCase() === trimmedCode);
    if (matchedCoupon) {
      if (matchedCoupon.isUsed) {
        setCouponErrorMsg('Yeh coupon pehle hi use ho chuka hai! Ek coupon sirf 1 baar hi valid hota hai.');
        return;
      }
      const twentyFourHours = 24 * 60 * 60 * 1000;
      if (now - matchedCoupon.createdAt > twentyFourHours) {
        setCouponErrorMsg('Yeh coupon code 24 ghante se purana ho gaya hai aur expire/hide ho chuka hai!');
        return;
      }
      setAppliedCoupon({ code: matchedCoupon.code, discount: matchedCoupon.discount });
      setCouponSuccessMsg(`üéâ Coupon Applied! ‚Çπ${matchedCoupon.discount} discount!`);
    } else {
      setCouponErrorMsg("Don't use fake/tampered coupon! Invalid or altered coupon code.");
    }
  };

  const handleRequestKey = () => {
    if (!checkoutData) return;

    const isResellerActive = resellerUser.isLoggedIn && resellerUser.isApproved;
    const originalPrice = checkoutData.originalPrice;
    const discount = appliedCoupon ? appliedCoupon.discount : 0;
    const finalPrice = Math.max(0, originalPrice - discount);

    const activeBal = isResellerActive ? (resellerUser.balance > 0 ? resellerUser.balance : userBalance) : userBalance;

    if (activeBal >= finalPrice) {
      if (isResellerActive && resellerUser.balance >= finalPrice) {
        // Deduct from Reseller Wallet
        const newBal = resellerUser.balance - finalPrice;
        setResellerUser(prev => ({ ...prev, balance: newBal }));
        setApprovedResellers(prev => prev.map(r => r.email.toLowerCase() === resellerUser.email.toLowerCase() ? { ...r, balance: newBal } : r));
      } else {
        setUserBalance(prev => prev - finalPrice);
      }

      setUserProfile(prev => ({ ...prev, keysBought: prev.keysBought + 1 }));
      setUnreadKeys(prev => prev + 1);

      const curEmail = (isResellerActive ? resellerUser.email : userProfile.email) || '';
      const curPhone = userProfile.phone || '';
      const curPassword = userProfile.password || '';
      const accKey = getAccountKey(curEmail, curPhone);

      const newRequest = {
        id: Date.now(),
        user: curEmail || curPhone || (isResellerActive ? 'Reseller VIP' : 'Guest'),
        userEmail: curEmail,
        userPhone: curPhone,
        userPassword: curPassword,
        userAccountKey: accKey,
        panel: checkoutData.panelTitle,
        planLabel: checkoutData.planLabel,
        originalPrice: originalPrice,
        discountAmount: discount,
        couponCodeUsed: appliedCoupon ? appliedCoupon.code : '',
        price: finalPrice,
        status: 'PENDING',
        deliveredKey: '',
        date: new Date().toLocaleString(),
        exceptFileLink: checkoutData.panelObj?.exceptFileLink || supportLinks.telegram
      };

      setKeyRequests(prev => [newRequest, ...prev]);

      if (appliedCoupon) {
        const accKey = getAccountKey(userProfile.email, userProfile.phone);
        const nowTime = Date.now();
        setUserCouponUsedTimestamps(prev => ({ ...prev, [accKey]: nowTime }));
        setUserAccountCoupons(prev => {
          const list = prev[accKey] || [];
          const updated = list.map(c => c.code === appliedCoupon.code ? { ...c, isUsed: true, usedAt: nowTime } : c);
          return { ...prev, [accKey]: updated };
        });
      }

      setCheckoutData(null);
      setAppliedCoupon(null);
      setCouponInputCode('');
      setShowBuySuccessPendingModal(true);
    } else {
      const msg = new SpeechSynthesisUtterance("Doston kripya kijiye apna wallet check Karen and Paisa add Karen Uske bad aap yahan se panel khareed sakte ho thank you");
      msg.lang = 'hi-IN';
      window.speechSynthesis.speak(msg);
      alert(`Balance kam hai! Needed: ‚Çπ${finalPrice}, Wallet Balance: ‚Çπ${activeBal}. Kripya wallet me fund add karein.`);
      if (isResellerActive) {
        setShowResellerModal(true);
      } else {
        setCurrentView('addFund');
      }
    }
  };


  const handleSendRefundEmailToUser = async (targetEmail: string, refundAmount: number, reason: string) => {
    const sId = 'service_v7djd5d';
    const tId = 'template_srpbzgk';
    const pKey = 'huTOpMHbOaE_WYEpW';
    const templateParams = {
      user_email: targetEmail.trim(),
      refund_amount: String(refundAmount),
      reason_message: reason || "‡§Ü‡§™‡§ï‡§æ ‡§ë‡§∞‡•ç‡§°‡§∞ ‡§∞‡§ø‡§ú‡•á‡§ï‡•ç‡§ü ‡§ï‡§∞ ‡§¶‡§ø‡§Ø‡§æ ‡§ó‡§Ø‡§æ ‡§π‡•à ‡§î‡§∞ ‡§™‡•à‡§∏‡•á ‡§Ü‡§™‡§ï‡•á ‡§µ‡•â‡§≤‡•á‡§ü ‡§Æ‡•á‡§Ç ‡§∞‡§ø‡§´‡§º‡§Ç‡§° ‡§ï‡§∞ ‡§¶‡§ø‡§è ‡§ó‡§è ‡§π‡•à‡§Ç‡•§"
    };
    try {
      emailjs.init(pKey);
      const response = await emailjs.send(sId, tId, templateParams, pKey);
      return response.status === 200 || response.text === 'OK';
    } catch (sdkError) {
      console.warn('SDK send error for refund, fallback to direct EmailJS endpoint...', sdkError);
      try {
        const restRes = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_id: sId,
            template_id: tId,
            user_id: pKey,
            template_params: templateParams
          })
        });
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
      if (req.user.includes('@')) tEmail = req.user;
      else if (/^\d+$/.test(req.user)) tPhone = req.user;
    }
    const targetAccKey = req.userAccountKey || getAccountKey(tEmail, tPhone);
    const targetEmail = (tEmail || '').trim();

    // 1. Update userWallets in global state
    setUserWallets(prev => {
      const currentVal = Number(prev[targetAccKey]) || 0;
      return {
        ...prev,
        [targetAccKey]: currentVal + refundAmount
      };
    });

    // 2. If the current logged-in user is this user, update active userBalance immediately
    const currentActiveAccKey = getAccountKey(userProfile.email, userProfile.phone);
    if (userProfile.isLoggedIn && (currentActiveAccKey === targetAccKey || (targetEmail && userProfile.email?.toLowerCase() === targetEmail.toLowerCase()))) {
      setUserBalance(prev => prev + refundAmount);
    }

    // 3. If it's an approved reseller, update reseller balance
    if (targetEmail) {
      setApprovedResellers(prev => prev.map(r => r.email.toLowerCase() === targetEmail.toLowerCase() ? { ...r, balance: (Number(r.balance) || 0) + refundAmount } : r));
      if (resellerUser.isLoggedIn && resellerUser.email.toLowerCase() === targetEmail.toLowerCase()) {
        setResellerUser(prev => ({ ...prev, balance: (Number(prev.balance) || 0) + refundAmount }));
      }
    }

    // 4. Update keyRequests status to 'REJECTED'
    const rejectReasonText = customReason ? customReason.trim() : 'Out of stock / Server maintenance';
    setKeyRequests(prev => prev.map(r => r.id === req.id ? {
      ...r,
      status: 'REJECTED',
      deliveredKey: `REFUNDED ‚Çπ${refundAmount} TO WALLET`
    } : r));

    // 5. Send notification email if email exists
    let emailSent = false;
    if (targetEmail) {
      try {
        const emailReason = `Namaste ${req.user},\n\nAapka ${req.panel} (${req.planLabel || 'Key'}) ka order reject kar diya gaya hai aur ‚Çπ${refundAmount} aapke wallet me turant refund kar diye gaye hain.\n\nReason: ${rejectReasonText}\n\nAap wallet balance se store se dusra key buy kar sakte hain.`;
        emailSent = await handleSendRefundEmailToUser(
          targetEmail,
          refundAmount,
          emailReason
        );
      } catch (err) {
        console.warn('Refund email error:', err);
      }
    }

    alert(`‚úÖ Order Reject ho gaya hai aur ‚Çπ${refundAmount} user (${req.user}) ke wallet me turant refund ho gaya hai!${emailSent ? ' Email notification bhi bhej diya gaya hai.' : ''}`);
  };

  const [fundStep, setFundStep] = useState<'generate' | 'confirm' | 'checking'>('generate');
  const [paymentMode, setPaymentMode] = useState<'auto' | 'manual'>('auto');
  const [utr, setUtr] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState<string>('');
  const [currentTxId, setCurrentTxId] = useState<number | null>(() => {
    const saved = localStorage.getItem('app_currentTxId');
    return saved ? Number(saved) : null;
  });

  useEffect(() => {
    if (currentTxId !== null) {
      localStorage.setItem('app_currentTxId', currentTxId.toString());
    } else {
      localStorage.removeItem('app_currentTxId');
    }
  }, [currentTxId]);

  const [paymentHistory, setPaymentHistory] = useState<{
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
  }[]>(() => {
    try {
      const saved = localStorage.getItem('app_paymentHistory');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('app_paymentHistory', JSON.stringify(paymentHistory));
  }, [paymentHistory]);

  const [onlineUsersCount, setOnlineUsersCount] = useState(1);

  // Firebase Realtime Database Presence API
  useEffect(() => {
    const presenceRef = ref(database, 'presence');
    const myPresenceRef = push(presenceRef);
    let specificRef: any = null;

    if (myPresenceRef.key) {
      specificRef = ref(database, `presence/${myPresenceRef.key}`);
      onDisconnect(specificRef).remove();
      set(specificRef, {
        online: true,
        timestamp: Date.now()
      }).catch(e => {});
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
    const stateRef = ref(database, 'appState');
    const unsubscribe = onValue(stateRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.initialized) {
        isSyncingFromFirebase.current = true;
        if (data.panels) setPanels(ensureArray(data.panels));
        if (data.registeredUsers) setRegisteredUsers(ensureArray(data.registeredUsers));
        if (data.bannedUsers) setBannedUsers(ensureArray(data.bannedUsers));
        if (data.paymentHistory) setPaymentHistory(ensureArray(data.paymentHistory));
        if (data.keyRequests) setKeyRequests(ensureArray(data.keyRequests));
        if (data.paymentSettings) setPaymentSettings(data.paymentSettings);
        if (data.supportLinks) setSupportLinks(data.supportLinks);
        if (data.accessFileSteps) setAccessFileSteps(data.accessFileSteps);
        if (data.referWebsiteLink) setReferWebsiteLink(data.referWebsiteLink);
        if (data.referBonusAmount) setReferBonusAmount(data.referBonusAmount);
        if (data.spinRewards) setSpinRewards(ensureArray(data.spinRewards));
        if (data.spinRequests) setSpinRequests(ensureArray(data.spinRequests));
        if (data.referRequests) setReferRequests(ensureArray(data.referRequests));
        if (data.userWallets) setUserWallets(data.userWallets);
        if (data.userAccountProfiles) setUserAccountProfiles(data.userAccountProfiles);
        if (data.userSpinTimestamps) setUserSpinTimestamps(data.userSpinTimestamps);
        if (data.userCouponUsedTimestamps) setUserCouponUsedTimestamps(data.userCouponUsedTimestamps);
        if (data.userAccountCoupons) setUserAccountCoupons(data.userAccountCoupons);
        if (data.bgSettings) setBgSettings(data.bgSettings);
        if (data.authStats) setAuthStats(data.authStats);
        // userProfile and userBalance are local to the current session, do not load them from global appState
        }
        setTimeout(() => {
          isSyncingFromFirebase.current = false;
          setInitialDataLoaded(true);
        }, 300);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isSyncingFromFirebase.current || !initialDataLoaded) return;
    const payload = {
      initialized: true,
      panels,
      registeredUsers,
      bannedUsers,
      paymentHistory,
      keyRequests,
      paymentSettings,
      supportLinks,
      accessFileSteps,
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
      updatedAt: Date.now()
    };
    set(ref(database, 'appState'), sanitizeForFirebase(payload)).catch(e => {});
  }, [
    panels,
    registeredUsers,
    bannedUsers,
    paymentHistory,
    keyRequests,
    paymentSettings,
    supportLinks,
    accessFileSteps,
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
    authStats
  ]);

  const playTickSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);

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
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioCtx.currentTime;
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
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
    if (!amount) return;
    setIsGenerating(true);
    setQrGenerated(false);
    setCountdown(10);
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



  return (
    <div 
      className="h-[100dvh] w-full text-white font-sans relative overflow-hidden selection:bg-cyan-500/30 antialiased flex flex-col items-center justify-start"
    >
      <style>{`
        img, video {
          filter: hue-rotate(-${bgSettings.themeHue || 0}deg);
        }
      `}</style>

      {/* Background Wallpaper Layer - 100% Fixed, Ultra HD Clarity (Crystal Clear from Top to Bottom) */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none">
        {bgSettings.enabled && bgSettings.customImage ? (
          <img 
            src={bgSettings.customImage} 
            alt="Website Background" 
            className="w-full h-full object-cover object-center pointer-events-none select-none transition-all duration-300"
            style={{ 
              filter: `contrast(1.02) brightness(${100 - (bgSettings.darknessOverlay || 0)}%)`
            }}
          />
        ) : (
          <img 
            src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop" 
            alt="Default Background" 
            className="w-full h-full object-cover object-center pointer-events-none select-none"
            style={{ 
              filter: `contrast(1.02) brightness(${100 - (bgSettings.darknessOverlay || 0)}%)` 
            }}
          />
        )}
      </div>

      {/* Live Sato-Rang (7 Rainbow Colors) Falling Flowers - Stationary Ambient Layer */}
      {bgSettings.enableFlowers && (
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
                animationDelay: `${flower.delay}s`,
                color: flower.color
              }}
            >
              {/* Ultra Fresh Sato-Rang 8-Petal Bloom Flower */}
              <svg 
                viewBox="0 0 100 100" 
                className="w-full h-full transform transition-transform" 
                style={{ filter: `drop-shadow(0 0 10px ${flower.color}) brightness(1.3)` }}
              >
                <defs>
                  <radialGradient id={`flw-grad-bg-${flower.id}`} cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.98" />
                    <stop offset="45%" stopColor={flower.color} stopOpacity="1" />
                    <stop offset="100%" stopColor={flower.secondaryColor || flower.color} stopOpacity="0.9" />
                  </radialGradient>
                </defs>

                {/* Outer 8 HD Bloom Petals */}
                <g fill={`url(#flw-grad-bg-${flower.id})`}>
                  <ellipse cx="50" cy="22" rx="14" ry="20" />
                  <ellipse cx="50" cy="78" rx="14" ry="20" />
                  <ellipse cx="22" cy="50" rx="20" ry="14" />
                  <ellipse cx="78" cy="50" rx="20" ry="14" />
                  <ellipse cx="30" cy="30" rx="16" ry="16" transform="rotate(45 30 30)" />
                  <ellipse cx="70" cy="30" rx="16" ry="16" transform="rotate(-45 70 30)" />
                  <ellipse cx="30" cy="70" rx="16" ry="16" transform="rotate(-45 30 70)" />
                  <ellipse cx="70" cy="70" rx="16" ry="16" transform="rotate(45 70 70)" />
                </g>

                {/* Inner Contrast Layer */}
                <g fill={flower.secondaryColor || '#FFF'} opacity="0.9">
                  <circle cx="50" cy="32" r="8" />
                  <circle cx="68" cy="50" r="8" />
                  <circle cx="50" cy="68" r="8" />
                  <circle cx="32" cy="50" r="8" />
                </g>

                {/* Golden Center Pistil Ring */}
                <circle cx="50" cy="50" r="14" fill={flower.centerColor || "#FFD700"} stroke="#FFFFFF" strokeWidth="2.5" />
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
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] transition-opacity"
          onClick={() => setIsMenuOpen(false)}
        ></div>
      )}

      {/* Drawer Menu */}
      <div className={`fixed top-0 left-0 h-full w-72 bg-[#090c16]/95 backdrop-blur-2xl border-r border-white/15 z-[70] transform transition-transform duration-300 ease-in-out shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Menu Header */}
        <div className="p-4 flex items-center justify-between border-b border-white/10 relative overflow-hidden bg-gradient-to-r from-red-500/10 via-amber-500/10 to-cyan-500/10">
          <div className="flex flex-col">
             <span className="text-xl font-black italic tracking-tighter text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.95)]">FFH4CK<span className="text-yellow-400">JOD</span><span className="text-white">VIP</span></span>
          </div>
          <button onClick={() => setIsMenuOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors active:scale-95 border border-white/10 hover:border-cyan-400/50">
            <X size={22} className="text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
          </button>
        </div>

        {/* 7-Color Sato-Rang HD Menu Buttons List */}
        <div className="flex flex-col py-3.5 px-3 gap-2.5 overflow-y-auto flex-1 custom-scrollbar">
          {[
            { 
              icon: LayoutDashboard, 
              label: 'Dashboard', 
              view: 'home', 
              color: '#FF0055', // Sato-Rang 1: Red/Rose
              bgGrad: 'from-[#FF0055]/20 via-[#FF0055]/5 to-transparent',
              borderGlow: 'border-[#FF0055]/40 hover:border-[#FF0055]',
              shadowGlow: '0 0 15px rgba(255,0,85,0.35)',
              tag: 'MAIN'
            },
            { 
              icon: PlusCircle, 
              label: 'Add fund', 
              view: 'addFund', 
              color: '#FF6600', // Sato-Rang 2: Orange
              bgGrad: 'from-[#FF6600]/20 via-[#FF6600]/5 to-transparent',
              borderGlow: 'border-[#FF6600]/40 hover:border-[#FF6600]',
              shadowGlow: '0 0 15px rgba(255,102,0,0.35)',
              tag: 'WALLET'
            },
            { 
              icon: Key, 
              label: 'My key', 
              view: 'myKeys', 
              color: '#FFDD00', // Sato-Rang 3: Yellow/Gold
              bgGrad: 'from-[#FFDD00]/20 via-[#FFDD00]/5 to-transparent',
              borderGlow: 'border-[#FFDD00]/40 hover:border-[#FFDD00]',
              shadowGlow: '0 0 15px rgba(255,221,0,0.35)',
              tag: 'KEYS'
            },
            { 
              icon: Dices, 
              label: 'Spin&win', 
              view: 'spinWin', 
              color: '#00E676', // Sato-Rang 4: Green/Emerald
              bgGrad: 'from-[#00E676]/20 via-[#00E676]/5 to-transparent',
              borderGlow: 'border-[#00E676]/40 hover:border-[#00E676]',
              shadowGlow: '0 0 15px rgba(0,230,118,0.35)',
              tag: 'BONUS'
            },
            { 
              icon: Gift, 
              label: 'Refer&earn', 
              view: 'referEarn', 
              color: '#00E5FF', // Sato-Rang 5: Cyan/Sky
              bgGrad: 'from-[#00E5FF]/20 via-[#00E5FF]/5 to-transparent',
              borderGlow: 'border-[#00E5FF]/40 hover:border-[#00E5FF]',
              shadowGlow: '0 0 15px rgba(0,229,255,0.35)',
              tag: 'EARN'
            },
            { 
              icon: User, 
              label: 'Profile', 
              view: 'profile', 
              color: '#3B82F6', // Sato-Rang 6: Blue
              bgGrad: 'from-[#3B82F6]/20 via-[#3B82F6]/5 to-transparent',
              borderGlow: 'border-[#3B82F6]/40 hover:border-[#3B82F6]',
              shadowGlow: '0 0 15px rgba(59,130,246,0.35)',
              tag: 'USER'
            },
            { 
              icon: Headset, 
              label: 'Customer support', 
              view: 'customerSupport', 
              color: '#7C4DFF', // Sato-Rang 7: Purple/Violet
              bgGrad: 'from-[#7C4DFF]/20 via-[#7C4DFF]/5 to-transparent',
              borderGlow: 'border-[#7C4DFF]/40 hover:border-[#7C4DFF]',
              shadowGlow: '0 0 15px rgba(124,77,255,0.35)',
              tag: '24/7'
            },
            { 
              icon: LogIn, 
              label: 'Login', 
              view: 'login', 
              color: '#F50057', // Sato-Rang Extra: Magenta/Pink
              bgGrad: 'from-[#F50057]/20 via-[#F50057]/5 to-transparent',
              borderGlow: 'border-[#F50057]/40 hover:border-[#F50057]',
              shadowGlow: '0 0 15px rgba(245,0,87,0.35)',
              tag: 'AUTH'
            }
          ].map((item, idx) => {
            const isActive = currentView === item.view;
            return (
              <button 
                key={`sidemenu-${item.view}-${idx}`} 
                onClick={() => {
                  setCurrentView(item.view as any);
                  setIsMenuOpen(false);
                }}
                className={`relative flex items-center justify-between px-3.5 py-3 rounded-xl transition-all duration-300 w-full text-left group overflow-hidden border backdrop-blur-md ${item.borderGlow} ${isActive ? 'scale-[1.02] bg-white/10' : 'bg-black/30 hover:bg-white/5 hover:scale-[1.02]'}`}
                style={{ 
                  boxShadow: isActive ? item.shadowGlow : undefined 
                }}
              >
                {/* Sato-Rang Ambient Glow Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-r ${item.bgGrad} opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none`}></div>
                
                {/* Left Live Indicator Bar */}
                <div 
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-7 rounded-r-full transition-all group-hover:h-9"
                  style={{ 
                    backgroundColor: item.color,
                    boxShadow: `0 0 10px ${item.color}`
                  }}
                />

                <div className="flex items-center gap-3.5 relative z-10 pl-2">
                  {/* HD Vibrant Glow Icon */}
                  <div 
                    className="p-1.5 rounded-lg bg-black/40 border transition-all duration-300 group-hover:scale-110"
                    style={{ 
                      borderColor: `${item.color}55`,
                      boxShadow: `0 0 8px ${item.color}40`
                    }}
                  >
                    <item.icon 
                      size={19} 
                      style={{ 
                        color: item.color,
                        filter: `drop-shadow(0 0 6px ${item.color})`
                      }} 
                    />
                  </div>

                  {/* Button Title */}
                  <span 
                    className="font-bold text-sm tracking-wide text-gray-100 group-hover:text-white transition-colors"
                    style={{
                      textShadow: isActive ? `0 0 8px ${item.color}` : undefined
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
                    boxShadow: `0 0 6px ${item.color}30`
                  }}
                >
                  {item.tag}
                </span>
              </button>
            );
          })}
        </div>

        {/* Drawer Footer */}
        <div className="p-3 border-t border-white/10 bg-black/40 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-gray-300 px-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: '#00E676' }} />
              <span className="text-[11px] font-semibold text-emerald-400">Server Online</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main App Window - Fixed Full Screen Window */}
      <div 
        className="relative z-10 flex flex-col h-full w-full max-w-[360px] sm:max-w-[390px] mx-auto overflow-hidden transition-all duration-500"
      >
        {/* Fixed Top Controls Bar - Crystal Clear Glass (Top Wallpaper Completely Visible in Ultra HD) */}
        <div className="flex-shrink-0 z-50 bg-black/15 backdrop-blur-[2px] border-b border-white/10 shadow-[0_2px_15px_rgba(0,0,0,0.25)] flex flex-col transition-all">
          {/* Main Header/Nav - Menu + Title + Wallet */}
          <header className="flex items-center justify-between px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <button onClick={() => setIsMenuOpen(true)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors active:scale-95 bg-black/20 backdrop-blur-sm border border-white/10" aria-label="Open Menu">
                <Menu size={22} className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
              </button>
              <h1 className="text-lg font-black italic tracking-wider mt-0.5 text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.9)]">FFH4CK<span className="text-amber-400 font-black">JOD</span><span className="text-white font-black">VIP</span></h1>
            </div>

            <div className="flex items-center gap-2">
              {/* Wallet Balance Button */}
              <div onClick={() => setCurrentView('addFund')} className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md border border-cyan-400/70 rounded-full px-3 py-1 shadow-[0_0_15px_rgba(0,229,255,0.3)] cursor-pointer hover:border-cyan-300 hover:bg-cyan-950/40 transition-all active:scale-95">
                <Wallet size={14} className="text-cyan-400" />
                <span className="text-cyan-300 font-bold text-xs tracking-wide">‚Çπ {userBalance.toFixed(2)}</span>
              </div>
            </div>
          </header>

          {/* Fixed Category Button & Search Bar for Home View */}
          {currentView === 'home' && (
            <div className="px-3 pb-2.5 pt-0.5 flex flex-col gap-2">
              {/* Premium Store & Category Button */}
              <div className="flex items-center justify-between mt-0.5 relative z-20">
                <h2 className="text-lg font-black tracking-tight italic drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                  PREMIUM <span className="text-fuchsia-400 drop-shadow-[0_0_15px_rgba(217,70,239,1)] animate-pulse-slow">STORE</span>
                </h2>
                <div className="relative">
                  {/* Category Button with 7-Color Live Satorang Animated Border */}
                  <div className="relative p-0.5 rounded-xl animate-satorang-border shadow-[0_0_25px_rgba(255,0,128,0.7)]">
                    <button 
                      onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                      className="relative w-full flex items-center gap-2 bg-black/95 backdrop-blur-2xl text-white px-3.5 py-2 rounded-[10px] font-black text-xs transition-all hover:bg-black active:scale-95"
                    >
                      <Filter size={14} className="animate-satorang-text" />
                      <span className="animate-satorang-text tracking-wide uppercase font-black">{selectedCategory}</span>
                    </button>
                  </div>

                  {/* Category Dropdown with 7-Color Live Satorang Animated Border & Live Color Cycling */}
                  {isCategoryOpen && (
                    <div className="absolute top-full right-0 mt-2.5 w-52 p-0.5 rounded-2xl animate-satorang-border shadow-[0_20px_50px_rgba(0,0,0,0.95)] z-50">
                      <div className="bg-black/95 backdrop-blur-2xl rounded-[14px] overflow-hidden p-2 flex flex-col gap-1.5">
                        <div className="px-2 py-1 text-[10px] font-black uppercase tracking-widest animate-satorang-text border-b border-white/10 mb-1 text-center">
                          ‚ú¶ SELECT CATEGORY ‚ú¶
                        </div>
                        {[
                          "All",
                          "24ghanta",
                          "Root",
                          "Non root",
                          "Steamer",
                          "Pc",
                          "Bgmi",
                          "Moba legend"
                        ].map((cat, idx) => (
                          <button
                            key={`cat-${cat}-${idx}`}
                            onClick={() => {
                              setSelectedCategory(cat);
                              setIsCategoryOpen(false);
                            }}
                            className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white bg-black/80 hover:bg-white/15 transition-all flex items-center justify-between group border border-white/10 hover:border-white/30"
                          >
                            <span className="animate-satorang-text group-hover:scale-105 transition-transform">{cat}</span>
                            <span className="w-2 h-2 rounded-full bg-rainbow-animated shadow-[0_0_10px_rgba(255,255,255,0.8)]"></span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Search Bar with Hidden Admin & Reseller Triggers */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-20">
                  <Search size={15} className="text-cyan-400 group-focus-within:text-cyan-300 transition-colors" />
                </div>
                <div className="absolute inset-0 bg-cyan-400/5 rounded-xl blur-md group-focus-within:bg-cyan-400/15 transition-all"></div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    const val = e.target.value;
                    const clean = val.toLowerCase().trim();
                    setSearchQuery(val);

                    if (clean === 'premadmin' || clean === '#adminaccess' || clean === 'adminaccess' || clean === '#admin') {
                      setSearchQuery('');
                      setCurrentView('staff');
                      playSuccessChime();
                      setShowSecretAdminToast(true);
                      setTimeout(() => setShowSecretAdminToast(false), 4500);
                    } else if (clean === 'premreseller' || clean === '#reselleraccess' || clean === 'reselleraccess' || clean === 'reseller' || clean === '#reseller') {
                      setSearchQuery('');
                      setShowResellerModal(true);
                      playSuccessChime();
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const clean = searchQuery.toLowerCase().trim();
                      if (clean === 'premadmin' || clean === '#adminaccess' || clean === 'adminaccess' || clean === '#admin') {
                        e.preventDefault();
                        setSearchQuery('');
                        setCurrentView('staff');
                        playSuccessChime();
                        setShowSecretAdminToast(true);
                        setTimeout(() => setShowSecretAdminToast(false), 4500);
                      } else if (clean === 'premreseller' || clean === '#reselleraccess' || clean === 'reselleraccess' || clean === 'reseller' || clean === '#reseller') {
                        e.preventDefault();
                        setSearchQuery('');
                        setShowResellerModal(true);
                        playSuccessChime();
                      }
                    }
                  }}
                  placeholder="Search panels..."
                  className="w-full bg-black/40 backdrop-blur-md border border-cyan-500/30 focus:border-cyan-400 rounded-xl py-1.5 pl-9 pr-3 text-white focus:outline-none focus:shadow-[0_0_15px_rgba(0,229,255,0.3)] transition-all placeholder:text-gray-400 relative z-10 text-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Feed - ONLY the Panels Scroll Up & Down */}
        <main className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden p-3 pb-28 flex flex-col gap-4 custom-scrollbar">
          
          {currentView === 'home' && (
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
                        <span className="text-xs font-black text-yellow-300 uppercase tracking-wide">üëë RESELLER VIP ACTIVE</span>
                        <span className="bg-emerald-500 text-black text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase">VERIFIED</span>
                      </div>
                      <span className="text-[11px] text-gray-200">{resellerUser.email} ‚Ä¢ Reseller Balance: <strong className="text-cyan-300 font-mono">‚Çπ{resellerUser.balance}</strong></span>
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

              {panels.filter(p => {
                const q = searchQuery.toLowerCase().trim();
                const pCat = p.category ? p.category.toLowerCase() : '';
                const pCatClean = pCat.replace(/\s+/g, '');
                const selCatClean = selectedCategory.toLowerCase().replace(/\s+/g, '');

                const matchesSearch = !q || 
                  p.title.toLowerCase().includes(q) || 
                  pCat.includes(q) ||
                  (q === '24ghanta' && (pCat.includes('24ghanta') || pCat.includes('house')));

                const matchesCat = selectedCategory === 'Category' || selectedCategory === 'All' || 
                  pCatClean === selCatClean ||
                  (selCatClean === '24ghanta' && (pCatClean.includes('24ghanta') || pCatClean.includes('house')));

                return matchesSearch && matchesCat;
              }).map((panel, pIdx) => {
                const imgYt = getYouTubeInfo(panel.image);
                const videoYt = getYouTubeInfo(panel.videoLink);
                const activeYt = videoYt || imgYt;
                const displayThumbnail = activeYt 
                  ? activeYt.thumbnailUrl 
                  : (panel.image || "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop");

                const isResellerActive = resellerUser.isLoggedIn && resellerUser.isApproved;
                const activeSelectedPrice = selectedPlans[panel.id] || panel.pricing[0]?.price || 0;
                const activePlan = panel.pricing.find(pr => pr.price === activeSelectedPrice) || panel.pricing[0];
                const activeResellerPrice = activePlan ? ((activePlan as any).resellerPrice ?? Math.round(activePlan.price * 0.65)) : Math.round(activeSelectedPrice * 0.65);

                return (
                  <div key={`store-panel-${panel.id}-${pIdx}`} className="relative rounded-2xl animate-satorang-border shadow-[0_6px_25px_rgba(0,0,0,0.4)] group overflow-hidden mx-0.5 mb-4 flex-shrink-0 transition-all duration-300 hover:scale-[1.01]">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none"></div>
                    
                    {/* Water-like Clear Transparent Glass Body */}
                    <div className="bg-black/20 hover:bg-black/15 backdrop-blur-[2px] rounded-[14px] p-3 flex flex-col gap-2.5 h-full w-full relative z-10 transition-colors">
                      
                      {/* Video / Photo Thumbnail - Compact Height & Clear */}
                      <div 
                        onClick={() => {
                          const activeYtUrl = videoYt ? panel.videoLink : (imgYt ? panel.image : null);
                          if (activeYtUrl) {
                            setPreviewMedia({ url: activeYtUrl, isVideo: true, title: panel.title + " - Live YouTube Video", youtubeLink: activeYtUrl });
                          } else {
                            setPreviewMedia({ url: panel.image, isVideo: panel.isVideo, title: panel.title });
                          }
                        }}
                        className="relative w-full h-36 sm:h-40 rounded-xl overflow-hidden border border-cyan-500/30 bg-black/40 shadow-[0_0_15px_rgba(0,0,0,0.6)] cursor-pointer group/media"
                      >
                        {panel.isVideo && !imgYt ? (
                          <video 
                            src={panel.image} 
                            autoPlay 
                            loop 
                            muted 
                            playsInline 
                            className="w-full h-full object-cover opacity-100 transition-transform duration-500 group-hover/media:scale-105"
                          />
                        ) : (
                          <img 
                            src={displayThumbnail} 
                            alt={panel.title} 
                            onError={(e) => {
                              if (activeYt && e.currentTarget.src !== activeYt.fallbackThumbnailUrl) {
                                e.currentTarget.src = activeYt.fallbackThumbnailUrl;
                              }
                            }}
                            className="w-full h-full object-cover opacity-100 transition-transform duration-500 group-hover/media:scale-105"
                          />
                        )}
                        
                        {/* Top dark fade for text legibility */}
                        <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/80 to-transparent pointer-events-none"></div>

                        {/* Central Glowing YouTube Play Icon Overlay */}
                        {activeYt && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-none group-hover/media:bg-black/10 transition-colors pointer-events-none z-10">
                            <div className="w-10 h-10 rounded-full bg-red-600/90 border-2 border-white shadow-[0_0_20px_rgba(220,38,38,0.9)] flex items-center justify-center transition-transform group-hover/media:scale-110">
                              <Play className="fill-white text-white ml-0.5 w-5 h-5" />
                            </div>
                          </div>
                        )}

                        {/* Top Right YouTube Badge */}
                        {activeYt && (
                          <div className="absolute top-2 right-2 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1 shadow-md border border-red-400/40 z-10">
                            <Youtube size={10} className="fill-white" />
                            <span>YouTube</span>
                          </div>
                        )}
                        
                        {/* Thumbnail Title Tag */}
                        <div className="absolute top-2 left-2.5 right-20 pointer-events-none z-10">
                          <h3 className="text-[12px] font-black text-white leading-tight uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,1)] tracking-wide truncate">
                            {panel.thumbnailTitle}
                          </h3>
                          <p className="text-[9px] font-bold text-cyan-300 drop-shadow-[0_1px_2px_rgba(0,0,0,1)] truncate">{panel.thumbnailSub}</p>
                        </div>

                        {/* Tap to View HD Badge */}
                        <div className="absolute bottom-1.5 left-2 bg-black/40 backdrop-blur-sm border border-cyan-400/40 text-cyan-300 text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-md z-10">
                          <Zap size={9} className="fill-cyan-400" /> Tap for HD
                        </div>

                        {/* YouTube / Demo Play Button */}
                        <div className="absolute bottom-1.5 right-2 flex items-center gap-1 z-10">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              const activeYtUrl = videoYt ? panel.videoLink : (imgYt ? panel.image : null);
                              if (activeYtUrl) {
                                setPreviewMedia({ url: activeYtUrl, isVideo: true, title: panel.title + " Demo Video", youtubeLink: activeYtUrl });
                              } else {
                                window.open(panel.videoLink || panel.installLink, '_blank');
                              }
                            }} 
                            className="bg-red-600 hover:bg-red-500 text-white font-bold text-[9px] px-2 py-1 rounded-md flex items-center gap-1 shadow-[0_0_12px_rgba(220,38,38,0.8)] transition-transform hover:scale-105 active:scale-95"
                          >
                            <Play className="fill-white w-2.5 h-2.5" />
                            <span>Live Video</span>
                          </button>
                        </div>
                      </div>

                      {/* Center Panel Name */}
                      <div className="text-center my-0.5">
                        <h3 className="text-[16px] font-black text-white tracking-wider uppercase font-sans drop-shadow-[0_2px_4px_rgba(0,0,0,1)] antialiased select-all">
                          {panel.title}
                        </h3>
                      </div>

                      {/* Features List */}
                      <div className={`flex flex-col gap-1 mt-0.5 transition-all overflow-y-auto pr-1 custom-scrollbar ${expandedPanels[panel.id] ? 'max-h-56' : 'max-h-20'}`}>
                        {(expandedPanels[panel.id] ? panel.features : panel.features.slice(0, 3)).map((feature, idx) => (
                          <div key={`feat-${panel.id}-${idx}`} className="flex items-center gap-1.5 bg-black/25 backdrop-blur-none border border-white/10 rounded-lg py-1 px-2 shrink-0">
                            <Zap size={12} className="text-fuchsia-400 fill-fuchsia-400 shrink-0" />
                            <span className="font-semibold text-gray-200 text-[11px] truncate">{feature}</span>
                          </div>
                        ))}
                      </div>

                      {/* Expand Arrow Toggle */}
                      <div className="flex justify-center">
                        <button 
                          onClick={() => setExpandedPanels(prev => ({ ...prev, [panel.id]: !prev[panel.id] }))} 
                          className="p-0.5 hover:bg-fuchsia-500/10 rounded-full transition-colors flex items-center gap-1 text-[10px] text-fuchsia-400 font-bold"
                          title={expandedPanels[panel.id] ? "Hide Features" : "Show All Features"}
                        >
                          {expandedPanels[panel.id] ? (
                            <>
                              <span>Hide Details</span>
                              <ChevronUp size={16} className="text-fuchsia-400" />
                            </>
                          ) : (
                            <>
                              <span>View All ({panel.features.length})</span>
                              <ChevronDown size={16} className="text-fuchsia-500 animate-bounce" />
                            </>
                          )}
                        </button>
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-1.5">
                        <button 
                          onClick={() => {
                            const targetUrl = panel.installLink || panel.exceptFileLink || accessFileSteps.directFileUrl || supportLinks.telegram;
                            if (targetUrl) {
                              window.open(targetUrl, '_blank');
                            } else {
                              alert('No install link provided');
                            }
                          }} 
                          className="flex items-center justify-center gap-1 border border-cyan-400/60 bg-cyan-950/40 backdrop-blur-sm hover:bg-cyan-900/60 text-white rounded-lg py-2 text-[10px] font-bold tracking-wider transition-all shadow-[0_0_12px_rgba(0,229,255,0.2)] hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <Download size={12} className="text-cyan-400" />
                          INSTALL/PANEL
                        </button>
                        <button 
                          onClick={() => {
                            const targetUrl = panel.videoLink || panel.image;
                            setPreviewMedia({ 
                              url: targetUrl, 
                              isVideo: true, 
                              title: panel.title + " - Video Feedback", 
                              youtubeLink: targetUrl 
                            });
                          }} 
                          className="flex items-center justify-center gap-1 border border-red-500/60 bg-red-950/40 backdrop-blur-sm hover:bg-red-900/60 text-white rounded-lg py-2 text-[10px] font-bold tracking-wider transition-all shadow-[0_0_12px_rgba(239,68,68,0.2)] hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <Play size={12} className="fill-white" />
                          VIDEO/FEEDBACK
                        </button>
                      </div>

                      {/* Differential Pricing Tag (If Reseller is active) */}
                      {isResellerActive && (
                        <div className="flex items-center justify-between text-[11px] bg-yellow-500/20 border border-yellow-400/50 px-2 py-1 rounded-lg text-yellow-300 font-black shadow-[0_0_10px_rgba(234,179,8,0.2)]">
                          <span className="flex items-center gap-1">
                            <Award size={13} className="text-yellow-400" /> üëë VIP Reseller Price:
                          </span>
                          <span className="font-mono text-xs text-yellow-200">
                            ‚Çπ{activeResellerPrice} <span className="line-through text-gray-400 text-[10px] font-normal font-sans ml-1">‚Çπ{activeSelectedPrice}</span>
                          </span>
                        </div>
                      )}

                      {/* Pricing Dropdown */}
                      <div className="relative mt-0.5">
                        <select 
                          value={selectedPlans[panel.id] || panel.pricing[0]?.price || ''}
                          className={`w-full appearance-none bg-black/40 backdrop-blur-sm hover:bg-black/60 text-white font-bold rounded-lg py-2 px-2.5 pr-7 focus:outline-none focus:ring-1 transition-all cursor-pointer text-[12px] border ${
                            isResellerActive 
                              ? 'border-yellow-400/70 focus:ring-yellow-400 text-yellow-100 shadow-[0_0_12px_rgba(234,179,8,0.3)]' 
                              : 'border-fuchsia-400/40 focus:ring-fuchsia-400 shadow-[0_0_12px_rgba(217,70,239,0.2)]'
                          }`}
                          onChange={(e) => {
                            const price = e.target.value;
                            setSelectedPlans(prev => ({...prev, [panel.id]: price}));
                          }}
                        >
                          {panel.pricing.map((plan, idx) => {
                            const isOutOfStock = isNaN(Number(plan.price)) || Number(plan.price) < 0 || (plan.label && plan.label.toLowerCase().includes('stock')) || (typeof plan.price === 'string' && plan.price.toLowerCase().includes('stock'));
                            const planResellerP = (plan as any).resellerPrice !== undefined ? (plan as any).resellerPrice : Math.round(plan.price * 0.65);
                            if (isOutOfStock) {
                              return (
                                <option key={`price-${panel.id}-${plan.price}-${idx}`} value={plan.price} disabled className="bg-[#0b0e18] text-red-400 font-bold">
                                  üö´ {plan.label} (OUT OF STOCK)
                                </option>
                              );
                            }
                            return (
                              <option key={`price-${panel.id}-${plan.price}-${idx}`} value={plan.price} className="bg-[#0b0e18] text-white">
                                {isResellerActive
                                  ? `üëë ‚Çπ${planResellerP} VIP (Normal: ‚Çπ${plan.price}) - ${plan.label}`
                                  : `‚Çπ${plan.price} - ${plan.label}`
                                }
                              </option>
                            );
                          })}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-2.5 pointer-events-none">
                          <ChevronDown size={14} className={isResellerActive ? "text-yellow-400" : "text-white"} />
                        </div>
                      </div>

                      {/* Buy Button */}
                      <button 
                        onClick={() => {
                          const price = selectedPlans[panel.id] !== undefined ? selectedPlans[panel.id] : panel.pricing[0]?.price;
                          if (price === undefined || price === null || price === '') {
                            alert('Please select a plan from the dropdown above.');
                            return;
                          }
                          handleOpenCheckout(price, panel.title);
                        }}
                        className={`relative w-full overflow-hidden text-white font-black text-[12px] py-2.5 rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98] mt-0.5 uppercase tracking-wider ${
                          isResellerActive
                            ? 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-black shadow-[0_0_20px_rgba(234,179,8,0.5)] border border-yellow-300'
                            : 'bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 hover:from-violet-500 hover:via-fuchsia-500 hover:to-pink-500 shadow-[0_0_20px_rgba(192,38,211,0.4)] border border-fuchsia-300/40'
                        }`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
                        <span className="relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                          {isResellerActive ? `üëë BUY KEY (VIP: ‚Çπ${activeResellerPrice})` : 'BUY KEY'}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {currentView === 'keyPending' && (
            <div className="flex flex-col items-center gap-5 w-full animate-in fade-in zoom-in-95 duration-300 relative z-10 mt-2 text-center py-6">
              <div className="w-20 h-20 bg-yellow-500/20 border-2 border-yellow-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.4)] animate-pulse">
                <Key size={36} className="text-yellow-400" />
              </div>
              <div>
                <h2 className="text-2xl font-black italic tracking-tight text-white uppercase drop-shadow-md">
                  KEY ORDER <span className="text-yellow-400">SUBMITTED</span>
                </h2>
                <p className="text-gray-300 text-xs font-semibold mt-2 max-w-xs mx-auto leading-relaxed">
                  Aapka key request admin ko bhej diya gaya hai. Admin dwara key approve karne ke baad aapko <span className="text-yellow-400 font-bold">"My Key"</span> section me aapka key mil jayega!
                </p>
              </div>

              {countdown > 0 ? (
                <div className="flex flex-col items-center gap-2 bg-black/20 backdrop-blur-md border border-yellow-500/30 p-4 rounded-2xl w-full max-w-xs ">
                  <span className="text-5xl font-black text-yellow-400 drop-shadow-[0_0_15px_rgba(234,179,8,0.8)] animate-bounce">
                    {countdown}
                  </span>
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Processing Key Request</span>
                </div>
              ) : (
                <div className="bg-green-500/20 border border-green-500/50 p-4 rounded-2xl text-green-400 font-bold text-xs w-full max-w-xs shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                  Request Registered Successfully!
                </div>
              )}

              <button 
                onClick={() => setCurrentView('myKeys')}
                className="w-full max-w-xs bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-black py-3.5 rounded-xl shadow-[0_0_20px_rgba(234,179,8,0.5)] transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-2 mt-2"
              >
                <Key size={18} /> GO TO MY KEYS
              </button>
            </div>
          )}

          {currentView === 'myKeys' && (() => {
            const activeAccKey = getAccountKey(userProfile.email, userProfile.phone);
            const userKeyRequests = ensureArray(keyRequests).filter(req => {
              if (req.userAccountKey) {
                return req.userAccountKey === activeAccKey;
              }
              if (!userProfile.isLoggedIn) return false;
              const reqEmail = (req.userEmail || '').toLowerCase();
              const reqPhone = (req.userPhone || '').toLowerCase();
              const reqUser = (req.user || '').toLowerCase();
              const uEmail = (userProfile.email || '').toLowerCase();
              const uPhone = (userProfile.phone || '').toLowerCase();
              return (uEmail && (reqEmail === uEmail || reqUser.includes(uEmail))) || 
                     (uPhone && (reqPhone === uPhone || reqUser.includes(uPhone)));
            });

            return (
              <div className="flex flex-col gap-5 w-full animate-in fade-in zoom-in-95 duration-300 relative z-10 mt-2 bg-black/20 backdrop-blur-xl rounded-3xl p-5 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setCurrentView('home')} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors ">
                      <ArrowLeft size={20} className="text-white" />
                    </button>
                    <h2 className="text-2xl font-black tracking-tight italic drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase">
                      MY <span className="text-fuchsia-500 drop-shadow-[0_0_15px_rgba(217,70,239,1)] animate-pulse-slow">KEYS</span>
                    </h2>
                  </div>
                  <button onClick={() => setCurrentView('home')} className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                    + Buy Key
                  </button>
                </div>

                <div className="flex flex-col gap-4">
                  {userKeyRequests.length === 0 ? (
                    <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl p-8 text-center flex flex-col items-center shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                      <Key size={40} className="text-gray-500 mb-3" />
                      <p className="text-gray-200 font-bold text-sm mb-1">No Keys Purchased Yet</p>
                      <p className="text-gray-400 text-xs mb-4">Aapne abhi tak koi key buy nahi kiya hai. Store se buy karein!</p>
                      <button onClick={() => setCurrentView('home')} className="bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-black px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(217,70,239,0.5)]">
                        Explore Store
                      </button>
                    </div>
                  ) : (
                    userKeyRequests.map((req, idx) => {
                      if (req.status === 'REJECTED') {
                        return (
                          <div 
                            key={`mykey-rejected-${req.id}-${idx}`} 
                            className="relative bg-black/20 backdrop-blur-md border-2 border-red-500/70 rounded-[22px] p-5 shadow-[0_0_30px_rgba(239,68,68,0.4)] overflow-hidden flex flex-col gap-1 transition-all hover:border-red-400"
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
                                {req.planLabel || '- 1 DAY nonroot'}
                              </div>

                              <div className="text-white font-black text-base">
                                Order Amount: ‚Çπ{req.price}
                              </div>

                              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3.5 my-1.5 flex flex-col gap-1 text-left">
                                <span className="text-red-400 font-black text-xs uppercase flex items-center gap-1">
                                  <AlertTriangle size={14} /> ORDER CANCELLED & REFUNDED
                                </span>
                                <p className="text-gray-300 text-xs font-medium">
                                  Aapka yeh order reject kar diya gaya hai aur <strong className="text-emerald-400">‚Çπ{req.price}</strong> aapke wallet me turant refund kar diye gaye hain.
                                </p>
                              </div>

                              <div className="flex items-center justify-between bg-black/40 border border-emerald-500/40 rounded-xl p-2.5 px-3.5">
                                <span className="text-gray-300 text-xs font-bold">Wallet Refund:</span>
                                <span className="text-emerald-400 font-black font-mono text-sm">+‚Çπ{req.price} (SUCCESS)</span>
                              </div>

                              <button
                                onClick={() => setCurrentView('home')}
                                className="w-full mt-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black py-3 rounded-xl uppercase tracking-wider text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
                              >
                                üõí Buy Another Key / Explore Store
                              </button>
                            </div>
                          </div>
                        );
                      }

                      const isDelivered = req.status === 'APPROVED' || req.status === 'DELIVERED';

                      if (!isDelivered) {
                        return (
                          <div 
                            key={`mykey-pending-${req.id}-${idx}`} 
                            className="relative bg-black/20 backdrop-blur-md  border-2 border-purple-500/70 rounded-[22px] p-5 shadow-[0_0_30px_rgba(168,85,247,0.4)]  overflow-hidden flex flex-col gap-1 transition-all hover:border-purple-400"
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-red-950/20 via-purple-950/30 to-black pointer-events-none"></div>

                            <div className="relative z-10 flex flex-col gap-1">
                              <h3 className="text-white font-black text-lg tracking-tight uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                                {req.panel}
                              </h3>
                              
                              <div className="text-gray-200 font-bold text-xs tracking-wide">
                                {req.planLabel || '- 1 DAY nonroot'}
                              </div>

                              <div className="text-white font-black text-base mt-1">
                                Amount: ‚Çπ{req.price}
                              </div>

                              <div className="flex items-center gap-1.5 my-1">
                                <span className="text-yellow-400 font-black text-sm flex items-center gap-1 drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]">
                                  ‚è≥ PENDING
                                </span>
                              </div>

                              <div className="bg-black/20 backdrop-blur-md border border-amber-500/40 rounded-xl p-4 my-2 flex items-center justify-center gap-2 text-center shadow-[inset_0_0_20px_rgba(245,158,11,0.2)]">
                                <Hourglass size={18} className="text-amber-400 animate-spin shrink-0" />
                                <span className="text-amber-400 font-black text-xs sm:text-sm tracking-wide">
                                  ‚è≥ ‚è≥ Wait... Order pending, please wait...
                                </span>
                              </div>

                              <a 
                                href={supportLinks.telegram || 'https://t.me/yourchannel'} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="w-full mt-1 border-2 border-amber-500 bg-amber-500/10 hover:bg-amber-500/25 text-amber-400 font-black py-3 rounded-xl flex items-center justify-center gap-2 uppercase tracking-wider text-xs shadow-[0_0_18px_rgba(245,158,11,0.5)] transition-all hover:scale-[1.01] active:scale-[0.99]"
                              >
                                <Send size={16} className="text-amber-400" /> CONTACT ADMIN
                              </a>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div 
                          key={`mykey-delivered-${req.id}-${idx}`} 
                          className="relative bg-black/20 backdrop-blur-md  border-2 border-purple-500/70 rounded-[22px] p-5 shadow-[0_0_30px_rgba(168,85,247,0.4)]  overflow-hidden flex flex-col gap-1 transition-all hover:border-purple-400"
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/20 via-purple-950/30 to-black pointer-events-none"></div>

                          <div className="relative z-10 flex flex-col gap-1">
                            <h3 className="text-white font-black text-lg tracking-tight uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                              {req.panel}
                            </h3>
                            
                            <div className="text-gray-200 font-bold text-xs tracking-wide">
                              {req.planLabel || '- 1 DAY nonroot'}
                            </div>

                            <div className="text-white font-black text-base mt-1">
                              Amount: ‚Çπ{req.price}
                            </div>

                            <div className="flex items-center gap-1.5 my-1">
                              <div className="bg-green-500/20 text-green-400 px-2.5 py-1 rounded-md font-black text-xs border border-green-500/50 flex items-center gap-1.5 shadow-[0_0_12px_rgba(34,197,94,0.4)]">
                                <CheckCircle size={14} className="text-green-400" />
                                <span className="text-green-400 font-black uppercase tracking-wider">DELIVERED</span>
                              </div>
                            </div>

                            <div className="bg-black/40 backdrop-blur-md border border-cyan-500/50 rounded-xl p-3 my-2 flex items-center justify-between gap-2 shadow-[0_0_20px_rgba(0,229,255,0.2)]">
                              <div className="flex items-center gap-2 overflow-hidden pr-2">
                                <span className="text-green-400 font-black text-sm shrink-0">Key :</span>
                                <span className="text-emerald-400 font-mono font-black text-sm sm:text-base tracking-wider truncate select-all">{req.deliveredKey}</span>
                              </div>

                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(req.deliveredKey);
                                  alert('Key copied to clipboard!');
                                }}
                                className="bg-cyan-400 hover:bg-cyan-300 text-black font-black px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-[0_0_18px_rgba(0,229,255,0.7)] text-xs uppercase tracking-wider shrink-0 transition-all hover:scale-105 active:scale-95"
                              >
                                <Copy size={14} /> COPY
                              </button>
                            </div>

                            {(() => {
                              const fileTargetUrl = formatExternalUrl(accessFileSteps.directFileUrl)
                                || formatExternalUrl(req.exceptFileLink)
                                || formatExternalUrl(accessFileSteps.step2Url)
                                || formatExternalUrl(supportLinks.telegram)
                                || 'https://t.me/yourchannel';

                              return (
                                <a 
                                  href={fileTargetUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="w-full mt-1 border-2 border-emerald-400 bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-300 font-black py-3 rounded-xl flex items-center justify-center gap-2 uppercase tracking-wider text-xs shadow-[0_0_18px_rgba(16,185,129,0.5)] transition-all hover:scale-[1.01] active:scale-[0.99]"
                                >
                                  <FolderDown size={16} className="text-emerald-400 animate-pulse" /> ACCESS FILES
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
          
          {currentView === 'addFund' && (
            <div className="flex flex-col gap-6 w-full animate-in fade-in zoom-in-95 duration-300 relative z-10 mt-2 bg-black/20 backdrop-blur-xl rounded-3xl p-5 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black tracking-tight italic drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase">
                  Add <span className="text-fuchsia-500 drop-shadow-[0_0_15px_rgba(217,70,239,1)] animate-pulse-slow">Funds</span>
                </h2>
              </div>

              {/* Steps Container */}
              <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-[24px] p-4 sm:p-5 shadow-[0_0_40px_rgba(0,0,0,0.8)]  relative overflow-hidden flex flex-col items-center w-[92%] mx-auto mt-2">
                
                {fundStep === 'generate' && (
                  <div className="flex flex-col items-center gap-5 w-full animate-in fade-in duration-300">
                    
                    {/* QR Code Container */}
                    <div className="relative flex flex-col items-center w-full my-1">
                      <div className="relative w-56 h-56 rounded-3xl p-[3px] bg-gradient-to-tr from-red-500 via-orange-400 via-yellow-400 via-green-400 via-cyan-400 via-blue-500 to-purple-600 shadow-[0_0_20px_rgba(255,0,0,0.25),0_0_25px_rgba(0,255,100,0.25),0_0_30px_rgba(0,200,255,0.3)] flex items-center justify-center transition-all duration-300">
                        <div className="w-full h-full bg-white/[0.05] backdrop-blur-md  rounded-[22px] flex items-center justify-center relative overflow-hidden p-2">
                          <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-cyan-400 z-10 pointer-events-none"></div>
                          <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-yellow-400 z-10 pointer-events-none"></div>
                          <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-pink-400 z-10 pointer-events-none"></div>
                          <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-green-400 z-10 pointer-events-none"></div>

                          {!qrGenerated && !isGenerating && (
                            <div className="text-center p-3 flex flex-col items-center justify-center">
                              <div className="relative w-16 h-16 mb-2 flex items-center justify-center">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-red-500/20 via-green-500/20 to-blue-500/20 flex items-center justify-center border border-white/20 shadow-inner">
                                  <QrCode size={26} className="text-cyan-300 drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]" />
                                </div>
                              </div>
                              <p className="text-cyan-300 font-bold text-xs tracking-wide">Enter Amount Below</p>
                              <p className="text-gray-400 font-medium text-[11px] mt-0.5">Click "GENERATE DYNAMIC QR"</p>
                            </div>
                          )}

                          {isGenerating && (
                            <div className="flex flex-col items-center justify-center gap-2.5 p-2 animate-in fade-in zoom-in duration-300">
                              {/* 7-Color Ring */}
                              <div className="relative w-24 h-24 rounded-full p-[3px] bg-gradient-to-tr from-red-500 via-orange-500 via-yellow-400 via-green-500 via-cyan-400 via-blue-600 to-purple-600 animate-spin shadow-[0_0_25px_rgba(255,0,128,0.5),0_0_30px_rgba(0,255,255,0.5)]">
                                <div className="w-full h-full bg-white/[0.05] backdrop-blur-md  rounded-full flex items-center justify-center relative overflow-hidden">
                                  <div className="absolute inset-0 bg-gradient-to-tr from-red-500/20 via-green-500/20 to-blue-500/20 animate-pulse"></div>
                                  <span className="relative z-10 text-3xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-yellow-300 via-green-300 via-cyan-300 to-purple-400 drop-shadow-[0_0_12px_rgba(255,255,255,0.9)]">
                                    {countdown}s
                                  </span>
                                </div>
                              </div>
                              <div className="text-center">
                                <span className="text-[9px] text-gray-400 font-semibold tracking-wide">
                                  Generating Professional QR...
                                </span>
                              </div>
                            </div>
                          )}

                          {qrGenerated && (
                            <div className="relative w-full h-full bg-white rounded-xl p-2.5 flex flex-col items-center justify-between shadow-[0_0_25px_rgba(255,255,255,0.9)] animate-in zoom-in-95 duration-300 border border-cyan-400 border-dashed">
                              <div className="w-full flex items-center justify-between pb-1 border-b border-gray-200 px-1">
                                <span className="text-[10px] font-black text-purple-700 tracking-wider flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-green-500"></span> ‚Çπ{amount || '80'} QR ACTIVE
                                </span>
                                <span className="text-[9px] font-black text-green-600 uppercase tracking-widest">
                                  DYNAMIC QR
                                </span>
                              </div>

                              <div className="w-36 h-36 flex items-center justify-center overflow-hidden rounded-lg bg-white p-1">
                                <img 
                                  src={paymentSettings.qrImage} 
                                  alt="Payment QR" 
                                  className="w-full h-full object-contain filter contrast-125 brightness-105"
                                />
                              </div>

                              <div className="text-[9px] font-extrabold text-gray-800 uppercase tracking-wider flex items-center gap-1 pt-0.5 border-t border-gray-100 w-full justify-center">
                                <CheckCircle size={10} className="text-green-600" /> SCAN & PAY ‚Çπ{amount || '80'}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Official UPI ID Copy Box */}
                    <div className="w-full bg-black/20 backdrop-blur-md border border-cyan-400/50 rounded-2xl p-3 flex items-center justify-between shadow-[0_0_15px_rgba(0,229,255,0.2)]">
                      <div className="flex flex-col text-left">
                        <span className="text-[10px] text-gray-400 font-bold uppercase">Official UPI ID:</span>
                        <span className="font-bold text-sm text-cyan-300 tracking-wide truncate">{paymentSettings.upiId}</span>
                      </div>
                      <button 
                        type="button"
                        className="p-2 hover:bg-cyan-500/20 border border-cyan-500/40 rounded-xl transition-colors cursor-pointer flex-shrink-0 flex items-center gap-1 text-cyan-300 text-xs font-bold"
                        onClick={() => {
                          navigator.clipboard.writeText(paymentSettings.upiId);
                          alert('‚úÖ UPI ID Copied!');
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
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="Enter Amount (‚Çπ)"
                          className="w-full bg-black/20 backdrop-blur-md border border-cyan-500/50 rounded-2xl py-3.5 px-4 text-center text-xl font-black text-cyan-300 placeholder:text-gray-600 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all"
                          disabled={isGenerating}
                        />
                      </div>
                    </div>

                    {/* Generate Dynamic QR Button */}
                    <button 
                      type="button"
                      onClick={handleGenerateQR}
                      disabled={isGenerating || !amount || Number(amount) <= 0}
                      className="w-full bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-500 hover:from-cyan-300 hover:to-teal-300 disabled:opacity-50 disabled:cursor-not-allowed text-black font-black text-xs py-4 rounded-2xl shadow-[0_0_25px_rgba(0,229,255,0.7)] uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <RefreshCw size={16} className={isGenerating ? "animate-spin" : ""} />
                      {qrGenerated ? `GENERATE DYNAMIC QR FOR ‚Çπ${amount || '80'}` : `GENERATE DYNAMIC QR FOR ‚Çπ${amount || '80'}`}
                    </button>

                    {/* "I HAVE PAID - PROCEED" Button */}
                    <button 
                      type="button"
                      onClick={() => setFundStep('confirm')}
                      className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-black font-black text-sm py-4 rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.8)] transition-all flex items-center justify-center gap-2 uppercase tracking-wider active:scale-95 cursor-pointer"
                    >
                      <ArrowRight size={20} className="stroke-[3]" />
                      I HAVE PAID - PROCEED
                    </button>

                  </div>
                )}

                {fundStep === 'confirm' && (
                  <div className="flex flex-col items-center gap-5 w-full animate-in slide-in-from-right-4 duration-300">
                    <div className="w-full flex items-center justify-between">
                       <button onClick={() => setFundStep('generate')} className="p-2 hover:bg-white/10 rounded-full transition-colors -ml-2 text-cyan-400 font-bold flex items-center gap-1 text-xs">
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
                      Aapne jitna payment kiya hai wo amount aur 12-digit UTR number darj karke <span className="text-fuchsia-400 font-bold">"SUBMIT PAYMENT UPI"</span> per click karein.
                    </p>

                    <div className="w-full space-y-3">
                      {/* 1. Paid Amount */}
                      <div className="space-y-1.5 text-left">
                        <label className="text-cyan-400 font-bold text-xs tracking-wider uppercase block">
                          1. Enter Amount Paid (‚Çπ)
                        </label>
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="Confirm Paid Amount"
                          className="w-full bg-black/20 backdrop-blur-md border border-white/20 rounded-xl py-3 px-4 text-center text-base font-bold text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(0,229,255,0.3)] transition-all"
                        />
                      </div>

                      {/* 2. UTR Number */}
                      <div className="space-y-1.5 text-left">
                        <label className="text-cyan-400 font-bold text-xs tracking-wider uppercase block">
                          2. Enter 12-Digit UTR / Transaction ID
                        </label>
                        <input
                          type="text"
                          value={utr}
                          onChange={(e) => setUtr(e.target.value)}
                          placeholder="Enter 12-Digit UTR Number"
                          className="w-full bg-black/20 backdrop-blur-md border border-white/20 rounded-xl py-3 px-4 text-center text-base font-bold text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(0,229,255,0.3)] transition-all font-mono"
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
                        const curEmail = userProfile.email || '';
                        const curPhone = userProfile.phone || '';
                        const curPassword = userProfile.password || '';
                        const accKey = getAccountKey(curEmail, curPhone);
                        const newTxId = Date.now();

                        const newPayment = {
                          id: newTxId,
                          amount: Number(amount),
                          utr: utr.trim(),
                          screenshot: paymentScreenshot || '',
                          status: 'PENDING',
                          date: new Date().toLocaleString(),
                          userEmail: curEmail,
                          userPhone: curPhone,
                          userPassword: curPassword,
                          userAccountKey: accKey
                        };

                        setCurrentTxId(newTxId);
                        setPaymentHistory(prev => [newPayment, ...ensureArray(prev)]);
                        setFundStep('checking');
                      }}
                      disabled={!amount || !utr}
                      className="w-full mt-2 bg-gradient-to-r from-fuchsia-500 via-purple-600 to-pink-500 hover:from-fuchsia-400 hover:to-pink-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm py-3.5 rounded-xl shadow-[0_0_25px_rgba(217,70,239,0.7)] transition-all flex items-center justify-center gap-2 uppercase tracking-wider active:scale-95"
                    >
                      <Send size={18} className="fill-white" />
                      SUBMIT PAYMENT UPI
                    </button>
                  </div>
                )}

                {fundStep === 'checking' && (() => {
                  const safeHist = ensureArray(paymentHistory);
                  const activeTx = currentTxId ? safeHist.find(p => p.id === currentTxId) : safeHist[0];
                  
                  if (activeTx?.status === 'SUCCESS') {
                    return (
                      <div className="flex flex-col items-center justify-center gap-4 w-full py-8 animate-in zoom-in-95 duration-500 text-center">
                        <div className="relative">
                          <div className="absolute inset-0 bg-green-500/30 rounded-full blur-2xl animate-pulse"></div>
                          <div className="w-16 h-16 bg-green-500/20 border-2 border-green-400 rounded-full flex items-center justify-center relative z-10 shadow-[0_0_25px_rgba(34,197,94,0.8)]">
                            <CheckCircle size={44} className="text-green-400 animate-in zoom-in duration-300" />
                          </div>
                        </div>
                        
                        <h3 className="text-2xl font-black text-green-400 drop-shadow-[0_0_15px_rgba(34,197,94,0.9)] uppercase tracking-wide">
                          Payment Add Successful
                        </h3>
                        
                        <p className="text-green-300 font-bold text-xs leading-relaxed max-w-[260px]">
                          üéâ Main Admin dwara payment accept kar diya gaya hai! ‚Çπ{activeTx.amount} aapke account mein add ho chuka hai.
                        </p>

                        <div className="bg-black/20 backdrop-blur-md border border-green-500/40 rounded-xl p-3 text-xs w-full max-w-[260px] text-left space-y-1 mt-1 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                          <div className="flex justify-between"><span className="text-gray-400">Added Amount:</span> <span className="text-green-400 font-black text-sm">‚Çπ{activeTx.amount}</span></div>
                          <div className="flex justify-between"><span className="text-gray-400">UTR / Ref ID:</span> <span className="text-white font-mono font-bold">{activeTx.utr}</span></div>
                          <div className="flex justify-between"><span className="text-gray-400">Status:</span> <span className="text-green-400 font-black uppercase">SUCCESS (APPROVED)</span></div>
                        </div>

                        <button 
                          onClick={() => {
                            setFundStep('generate');
                            setAmount('');
                            setUtr('');
                            setPaymentScreenshot('');
                            setCurrentTxId(null);
                          }}
                          className="w-full max-w-[260px] mt-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-black font-black text-xs py-3 rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.6)] uppercase tracking-wider transition-all"
                        >
                          Add More Funds / Home
                        </button>
                      </div>
                    );
                  }

                  if (activeTx?.status === 'REJECTED') {
                    return (
                      <div className="flex flex-col items-center justify-center gap-4 w-full py-8 animate-in zoom-in-95 duration-500 text-center">
                        <div className="w-16 h-16 bg-red-500/20 border-2 border-red-500 rounded-full flex items-center justify-center shadow-[0_0_25px_rgba(239,68,68,0.8)]">
                          <X size={40} className="text-red-400" />
                        </div>
                        
                        <h3 className="text-xl font-black text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.8)] uppercase">
                          Payment Rejected
                        </h3>
                        
                        <p className="text-red-300 text-xs leading-relaxed max-w-[260px]">
                          Admin ne aapka payment request reject kar diya hai. Kripya UTR number check karke dobara try karein.
                        </p>

                        <button 
                          onClick={() => {
                            setFundStep('confirm');
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
                        <Loader2 size={52} className="text-yellow-400 animate-spin relative z-10 drop-shadow-[0_0_15px_rgba(234,179,8,1)]" />
                      </div>
                      
                      <h3 className="text-xl font-black text-yellow-400 drop-shadow-[0_0_12px_rgba(234,179,8,0.8)] uppercase tracking-wider">
                        Payment Checking Pending...
                      </h3>
                      
                      <p className="text-gray-300 text-center text-xs leading-relaxed max-w-[260px]">
                        Aapka payment check kiya ja raha hai. Jab tak Main Admin panel se accept na karein tab tak checking chal rahi hai...
                      </p>

                      {activeTx && (
                        <div className="bg-black/20 backdrop-blur-md border border-yellow-500/30 rounded-xl p-3 text-xs w-full max-w-[260px] text-left space-y-1 mt-1">
                          <div className="flex justify-between"><span className="text-gray-400">Amount:</span> <span className="text-white font-bold">‚Çπ{activeTx.amount}</span></div>
                          <div className="flex justify-between"><span className="text-gray-400">UTR No:</span> <span className="text-cyan-400 font-mono font-bold">{activeTx.utr}</span></div>
                          <div className="flex justify-between"><span className="text-gray-400">Status:</span> <span className="text-yellow-400 font-bold animate-pulse">PENDING (CHECKING...)</span></div>
                          {activeTx.screenshot && (
                            <div className="mt-2 pt-2 border-t border-white/10 flex flex-col gap-1">
                              <span className="text-[10px] text-gray-400 font-bold uppercase">Uploaded Screenshot:</span>
                              <img src={activeTx.screenshot} alt="Screenshot" className="h-20 object-contain rounded border border-white/20" />
                            </div>
                          )}
                        </div>
                      )}

                      <button 
                        type="button"
                        onClick={() => {
                          setFundStep('confirm');
                        }}
                        className="w-full max-w-[260px] mt-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs py-2.5 rounded-xl border border-cyan-400/40 uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <ArrowLeft size={16} /> Edit / Re-Submit Payment Details
                      </button>
                    </div>
                  );
                })()}

              </div>

              {/* PAYMENT HISTORY */}
              <div className="mt-4 pb-10">
                <h2 className="text-xl font-black tracking-tight italic drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase mb-4">
                  PAYMENT <span className="text-fuchsia-500 drop-shadow-[0_0_15px_rgba(217,70,239,1)]">HISTORY</span>
                </h2>
                
                <div className="flex flex-col gap-3">
                  {(() => {
                    const activeKey = getAccountKey(userProfile.email, userProfile.phone);
                    const userPaymentHistory = ensureArray(paymentHistory).filter(history => {
                      if (history.userAccountKey) {
                        return history.userAccountKey === activeKey;
                      }
                      if (!userProfile.isLoggedIn) return false;
                      const hEmail = (history.userEmail || '').toLowerCase();
                      const hPhone = (history.userPhone || '').toLowerCase();
                      const uEmail = (userProfile.email || '').toLowerCase();
                      const uPhone = (userProfile.phone || '').toLowerCase();
                      return (uEmail && hEmail === uEmail) || (uPhone && hPhone === uPhone);
                    });

                    if (userPaymentHistory.length === 0) {
                      return (
                        <div className="text-center text-gray-500 text-xs py-6 bg-black/40 backdrop-blur-md rounded-xl border border-white/5">
                          No payment history for this account yet.
                        </div>
                      );
                    }

                    return userPaymentHistory.map((history, idx) => {
                      const isSuccess = history.status === 'SUCCESS';
                      const isRejected = history.status === 'REJECTED';
                      return (
                        <div 
                          key={`payhist-${history.id}-${idx}`} 
                          className={`border-l-[4px] ${isSuccess ? 'border-green-500 bg-green-950/30 border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.15)]' : isRejected ? 'border-red-500 bg-red-950/20 border-red-500/30' : 'border-yellow-500 bg-black/20 backdrop-blur-md border-fuchsia-500/20'} rounded-r-xl rounded-l-sm p-3 relative overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.5)] `}
                        >
                           <div className="absolute -right-4 -bottom-4 opacity-[0.03]">
                             <Zap size={80} className="fill-fuchsia-500" />
                           </div>
                           <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/5 to-transparent pointer-events-none"></div>
                           
                           <div className="flex justify-between items-start mb-1.5 relative z-10">
                             <span className={`text-2xl font-black tracking-tight drop-shadow-md ${isSuccess ? 'text-green-400' : isRejected ? 'text-red-400' : 'text-white'}`}>
                               ‚Çπ{history.amount}
                             </span>
                             
                             {isSuccess ? (
                               <div className="flex items-center gap-1.5 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-[10px] font-black border border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.3)] uppercase">
                                  <CheckCircle size={12} className="text-green-400" />
                                  Payment Add Successful
                               </div>
                             ) : isRejected ? (
                               <div className="flex items-center gap-1.5 bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-[10px] font-black border border-red-500/40 uppercase">
                                  <X size={12} className="text-red-400" />
                                  Payment Rejected
                               </div>
                             ) : (
                               <div className="flex items-center gap-1.5 bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-[10px] font-black border border-yellow-500/40 shadow-[0_0_10px_rgba(234,179,8,0.2)] uppercase">
                                  <Hourglass size={12} className="animate-spin-slow text-yellow-400" />
                                  Checking Payment...
                               </div>
                             )}
                           </div>
                           
                           <div className="flex flex-col relative z-10 text-xs space-y-0.5">
                              <span className="text-gray-300 font-medium">UTR: <span className="text-cyan-300 font-mono font-bold">{history.utr}</span></span>
                              {history.userEmail || history.userPhone ? (
                                <span className="text-gray-400 text-[11px]">Account: <span className="text-white font-semibold">{history.userEmail || history.userPhone}</span></span>
                              ) : null}
                              <span className="text-gray-500 text-[10px] mt-0.5 tracking-wider">{history.date}</span>
                           </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          )}

          {currentView === 'spinWin' && (
            <div className="flex flex-col gap-6 w-full animate-in fade-in zoom-in-95 duration-300 relative z-10 mt-2 bg-black/20 backdrop-blur-xl rounded-3xl p-5 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black tracking-tight italic drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase">
                  DAILY <span className="text-fuchsia-500 drop-shadow-[0_0_15px_rgba(217,70,239,1)] animate-pulse-slow">SPIN & WIN</span>
                </h2>
              </div>
              
              <div className="bg-black/20 backdrop-blur-md border border-purple-500/50 rounded-[24px] p-4 sm:p-5 shadow-[0_0_40px_rgba(168,85,247,0.4)]  relative overflow-hidden flex flex-col items-center w-[94%] mx-auto mt-2">
                 <div className="text-center mb-6 relative z-10">
                    <h3 className="text-xl font-bold text-cyan-400 drop-shadow-[0_0_10px_rgba(0,229,255,0.8)] flex items-center justify-center gap-2">
                      <Gift size={20} /> SPIN & WIN COUPON
                    </h3>
                    <p className="text-gray-300 text-xs sm:text-sm mt-1 max-w-sm mx-auto">
                      Spin now to win instant Coupon Discounts for Buy Key checkout! (24 ghante me 1 spin chance)
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
                        background: 'conic-gradient(from 0deg, #ff0055 0 72deg, #aa00ff 72deg 144deg, #00e5ff 144deg 216deg, #00ff55 216deg 288deg, #ffaa00 288deg 360deg)',
                        transform: `rotate(${spinRotation}deg)`
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
                                  transform: `rotate(${angle}deg) translateY(-85px)`
                                }}
                              >
                                ‚Çπ{reward}
                              </div>
                            );
                          })}
                       </div>
                    </div>

                    {/* Pointer Indicator */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-4 text-yellow-400 drop-shadow-[0_2px_8px_rgba(234,179,8,1)] z-20">
                       <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 22h20L12 2z" transform="rotate(180 12 12)"/></svg>
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
                   const remMins = Math.floor((remMs % (1000 * 60 * 60)) / (1000 * 60));

                   return (
                     <>
                       {isLocked && (
                          <div className="mb-4 bg-amber-500/20 border border-amber-500/50 rounded-xl p-3 text-center text-amber-300 font-bold text-xs w-full animate-in zoom-in-95 ">
                            ‚è≥ Next Spin Available In: <span className="text-yellow-400 text-sm font-mono font-black">{remHours}h {remMins}m</span>
                            <br />
                            <span className="text-[11px] font-medium text-gray-300">(24 ghante me ek baar hi spin available hota hai)</span>
                          </div>
                       )}

                       <button 
                          disabled={isSpinning || isLocked}
                          onClick={() => {
                            if (!userProfile.isLoggedIn) {
                              alert("Kripya pehle login karein tabhi aap spin kar sakte hain!");
                              setCurrentView('login');
                              return;
                            }

                            if (isLocked) {
                              alert(`Aapne 24 ghante me 1 spin kar liya hai. Agla spin ${remHours}h ${remMins}m baad milega!`);
                              return;
                            }

                            setIsSpinning(true);
                            const rewardIndex = Math.floor(Math.random() * spinRewards.length);
                            const wonAmount = spinRewards[rewardIndex] || 10;
                            
                            // Target angle calculation
                            const sliceAngle = 360 / Math.max(1, spinRewards.length);
                            const targetDeg = spinRotation + 1800 + (360 - (rewardIndex * sliceAngle)) + Math.floor(Math.random() * (sliceAngle / 2));
                            
                            setSpinRotation(targetDeg);

                            setTimeout(() => {
                              setIsSpinning(false);
                              const accKey = getAccountKey(userProfile.email, userProfile.phone);
                              const nowTime = Date.now();
                              setUserSpinTimestamps(prev => ({ ...prev, [accKey]: nowTime }));
                              
                              const newCode = 'SPIN' + wonAmount + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
                              setUserAccountCoupons(prev => {
                                const existingList = prev[accKey] || [];
                                const updatedList = [
                                  { code: newCode, discount: wonAmount, createdAt: nowTime, isUsed: false },
                                  ...existingList.filter(c => !c.isUsed && (nowTime - c.createdAt < 24 * 60 * 60 * 1000))
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
                                status: 'APPROVED'
                              };
                              setSpinRequests(prev => [newSpin, ...prev]);
                              setUnreadSpins(prev => prev + 1);

                              setWonCouponModal({
                                code: newCode,
                                discount: wonAmount
                              });
                            }, 3600);
                          }}
                          className="w-full relative z-10 bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-purple-600 hover:from-cyan-300 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-base py-3.5 rounded-xl shadow-[0_0_25px_rgba(217,70,239,0.6)] transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
                       >
                          <Gift size={20} className="fill-white" />
                          {isSpinning ? 'SPINNING WHEEL...' : (isLocked ? 'SPIN LOCKED (24H COOLDOWN)' : 'SPIN NOW')}
                       </button>
                     </>
                   );
                 })()}

                 {/* Available Coupons Section (Only active, unused, <24h coupons are visible) */}
                 {(() => {
                   const activeCoupons = userCoupons.filter(c => !c.isUsed && (Date.now() - c.createdAt < 24 * 60 * 60 * 1000));
                   if (activeCoupons.length === 0) return null;

                   return (
                     <div className="w-full mt-6 bg-black/50 border border-fuchsia-500/30 rounded-xl p-4">
                       <div className="flex justify-between items-center mb-2">
                         <h4 className="text-fuchsia-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                           <Tag size={14} /> My Active Coupons ({activeCoupons.length})
                         </h4>
                         <span className="text-[10px] text-amber-300 font-semibold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                           Valid 24 Hours ‚Ä¢ 1 Time Use
                         </span>
                       </div>
                       <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
                         {activeCoupons.map((coupon, idx) => {
                           const remMs = (24 * 60 * 60 * 1000) - (Date.now() - coupon.createdAt);
                           const remHours = Math.max(0, Math.floor(remMs / (1000 * 60 * 60)));
                           const remMins = Math.max(0, Math.floor((remMs % (1000 * 60 * 60)) / (1000 * 60)));

                           return (
                             <div key={`active-coupon-card-${coupon.code}-${idx}`} className="bg-purple-950/40 border border-purple-500/30 rounded-lg p-2.5 flex justify-between items-center text-xs">
                               <div>
                                 <div className="flex items-center gap-2">
                                   <span className="text-yellow-400 font-mono font-bold text-sm block">{coupon.code}</span>
                                   <span className="text-[10px] bg-green-500/20 text-green-300 font-bold px-1.5 py-0.2 rounded border border-green-500/30">ACTIVE</span>
                                 </div>
                                 <span className="text-gray-300 text-[10px] block mt-0.5">‚Çπ{coupon.discount} Discount ‚Ä¢ Hide in {remHours}h {remMins}m</span>
                               </div>
                               <button 
                                 onClick={() => {
                                   navigator.clipboard.writeText(coupon.code);
                                   alert(`Coupon code '${coupon.code}' copied! Apply it on BUY KEY checkout page.`);
                                 }}
                                 className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold text-[11px] px-2.5 py-1 rounded flex items-center gap-1 shadow-[0_0_10px_rgba(217,70,239,0.5)]"
                               >
                                 <Copy size={12} /> COPY CODE
                               </button>
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

          {currentView === 'referEarn' && (() => {
            const cleanBaseLink = formatExternalUrl(referWebsiteLink) || 'https://website.com';
            const userRefCode = userProfile.email || userProfile.phone || 'guest';
            const finalShareLink = cleanBaseLink.includes('?') 
              ? `${cleanBaseLink}&ref=${userRefCode}`
              : `${cleanBaseLink}?ref=${userRefCode}`;

            const shareText = `üéâ Join using my official referral link and get ‚Çπ${referBonusAmount} bonus discount on panels & keys!\nüëâ Link: ${finalShareLink}`;

            return (
              <div className="flex flex-col gap-6 w-full animate-in fade-in zoom-in-95 duration-300 relative z-10 mt-2 bg-black/20 backdrop-blur-xl rounded-3xl p-5 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-black tracking-tight italic drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase">
                    REFER & <span className="text-fuchsia-500 drop-shadow-[0_0_15px_rgba(217,70,239,1)] animate-pulse-slow">EARN</span>
                  </h2>
                </div>

                <div className="bg-black/20 backdrop-blur-md border border-yellow-500/50 rounded-[24px] p-5 sm:p-6 shadow-[0_0_40px_rgba(234,179,8,0.4)]  relative overflow-hidden flex flex-col items-center w-[92%] mx-auto mt-2">
                   <div className="text-center mb-5 relative z-10">
                      <h3 className="text-xl font-bold text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)] flex items-center justify-center gap-2">
                        <Gift size={24} className="fill-yellow-500" /> Invite Friends & Earn ‚Çπ{referBonusAmount}
                      </h3>
                      <p className="text-gray-300 text-sm mt-3 leading-relaxed font-medium">
                        Apne doston ko apna referral link share karein. Jab wo register karenge toh unka aur aapka dono ka account details Admin Panel ke "Refer Earn" section me bhej diya jayega aur aapko <strong className="text-yellow-400">‚Çπ{referBonusAmount}</strong> bonus credit hoga!
                      </p>
                   </div>
                   
                   {/* Website Referral Link Box */}
                   <div className="w-full bg-black/20 backdrop-blur-md border border-yellow-500/40 rounded-xl p-3.5 mb-4 relative z-10">
                      <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                        <Globe size={12} /> Your Official Website Referral Link:
                      </span>
                      <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg p-2.5 text-yellow-300 overflow-hidden whitespace-nowrap text-ellipsis text-xs font-mono font-bold shadow-inner">
                        {finalShareLink}
                      </div>
                   </div>

                   {/* Action Share Buttons */}
                   <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6 relative z-10">
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(finalShareLink);
                          setUnreadRefers(prev => prev + 1);
                          alert('Referral link copied to clipboard!');
                        }}
                        className="bg-yellow-500 hover:bg-yellow-400 text-black font-black py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(234,179,8,0.4)] transition-all active:scale-95 text-xs uppercase"
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
                   <div className="w-full bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-xl mb-6 relative z-10 text-left">
                      <span className="text-yellow-400 text-xs font-bold block mb-2">Simulate New User Joining Via Your Link:</span>
                      <input 
                        type="text" 
                        id="referred-user-input"
                        placeholder="Enter referred user's Email / Phone"
                        className="w-full bg-black/20 backdrop-blur-md border border-white/20 rounded-lg p-2.5 text-xs font-bold text-white mb-2 focus:outline-none focus:border-yellow-400"
                      />
                      <button 
                        onClick={() => {
                          const input = document.getElementById('referred-user-input') as HTMLInputElement;
                          if (input && input.value) {
                            const newRef = {
                              id: Date.now(),
                              referrerEmail: userProfile.email || 'guest@user.com',
                              referrerPhone: userProfile.phone || '9876543210',
                              referrerPassword: userProfile.password || '******',
                              referredEmail: input.value,
                              referredPhone: input.value,
                              bonusAmount: referBonusAmount,
                              date: new Date().toLocaleString(),
                              status: 'PENDING'
                            };
                            setReferRequests(prev => [newRef, ...prev]);
                            setUnreadRefers(prev => prev + 1);
                            alert(`Referral details registered! Admin ke Refer Earn panel me ‚Çπ${referBonusAmount} bonus approval request chala gaya hai.`);
                            input.value = '';
                          } else {
                            alert('Please enter referred user info');
                          }
                        }}
                        className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black text-xs py-2.5 rounded-lg uppercase tracking-wider"
                      >
                        Submit Referral To Admin (‚Çπ{referBonusAmount} Bonus)
                      </button>
                   </div>

                   <div className="w-full border-t border-white/10 pt-6 grid grid-cols-3 gap-2 text-center relative z-10">
                      <div className="flex flex-col gap-1.5 border-r border-white/10">
                         <span className="text-gray-400 text-xs font-semibold">Total Referrals</span>
                         <span className="text-white font-black text-2xl drop-shadow-md">{referRequests.length}</span>
                      </div>
                      <div className="flex flex-col gap-1.5 border-r border-white/10">
                         <span className="text-gray-400 text-xs font-semibold">Accepted</span>
                         <span className="text-cyan-400 font-black text-2xl drop-shadow-md">{referRequests.filter(r => r.status === 'ACCEPTED').length}</span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                         <span className="text-gray-400 text-xs font-semibold">Bonus Received</span>
                         <span className="text-green-500 font-black text-2xl drop-shadow-[0_0_10px_rgba(34,197,94,0.3)]">
                           ‚Çπ{referRequests.filter(r => r.status === 'ACCEPTED').reduce((acc, r) => acc + r.bonusAmount, 0)}
                         </span>
                      </div>
                   </div>
                </div>
              </div>
            );
          })()}

          {currentView === 'admin' && (
            <div className="flex flex-col gap-6 w-full animate-in fade-in zoom-in-95 duration-300 relative z-10 mt-2 bg-black/20 backdrop-blur-xl rounded-3xl p-5 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-2xl font-black tracking-tight italic drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase">
                  ADMIN <span className="text-fuchsia-500 drop-shadow-[0_0_15px_rgba(217,70,239,1)] animate-pulse-slow">PANEL</span>
                </h2>
              </div>

              <div className="flex flex-col gap-4">
                 {[
                    { title: "Add New Panel", icon: PlusCircle, desc: "Manage store panels", color: "from-pink-400 to-fuchsia-600", view: 'adminAddPanel', badge: 0 },
                    { title: "Delete Panel", icon: Trash2, desc: "Edit & delete active panels", color: "from-red-500 to-rose-700", view: 'adminDeletePanel', badge: ensureArray(panels).length },
                    { title: "Background Image", icon: ImageIcon, desc: "Gallery photo & 7-color live flowers", color: "from-amber-400 to-fuchsia-600", view: 'adminBgImage', badge: 0 },
                    { title: "Payment Fund", icon: Wallet, desc: "Manage payment requests", color: "from-cyan-400 to-blue-600", view: 'adminPayment', badge: ensureArray(paymentHistory).filter(p => p.status === 'PENDING').length },
                    { title: "USER WALLETS & HISTORY", icon: User, desc: "Manage users, photos & balances", color: "from-purple-500 to-pink-600", view: 'adminUserHistory', badge: 0 },
                    { title: "User Logins", icon: LogIn, desc: "View registered users", color: "from-blue-400 to-indigo-600", view: 'adminLogins', badge: unreadLogins },
                    { title: "Payment Settings", icon: CreditCard, desc: "QR & UPI Details", color: "from-teal-400 to-emerald-600", view: 'adminPaymentSettings', badge: 0 },
                    { title: "ACCESS FILES", icon: FolderDown, desc: "Telegram & File link setting", color: "from-emerald-400 to-cyan-600", view: 'adminAccessFiles', badge: 0 },
                    { title: "OWNER", icon: Send, desc: "Website bottom Telegram logo link", color: "from-sky-400 to-blue-600", view: 'adminOwner', badge: 0 },
                    { title: "Support Setup", icon: Headset, desc: "Telegram & WhatsApp links", color: "from-orange-400 to-red-600", view: 'adminSupport', badge: 0 },
                    { title: "My Key", icon: Key, desc: "Manage & assign keys", color: "from-yellow-400 to-orange-600", view: 'adminKeys', badge: unreadKeys },
                    { title: "Spin Win", icon: Dices, desc: "Spin & Win logs", color: "from-green-400 to-emerald-600", view: 'adminSpin', badge: unreadSpins },
                    { title: "Refer Earn", icon: Gift, desc: "Manage referral bonuses", color: "from-red-400 to-rose-600", view: 'adminRefer', badge: unreadRefers },
                    { title: "STAFF PANEL", icon: Sparkles, desc: "Staff portal (PASS: PREM74)", color: "from-fuchsia-500 to-pink-600", view: 'staff', badge: 0 },
                 ].map((btn, idx) => (
                    <button 
                      key={`admin-dash-btn-${btn.view}-${idx}`} 
                      onClick={() => {
                        setCurrentView(btn.view as any);
                        if (btn.view === 'adminKeys') setUnreadKeys(0);
                        if (btn.view === 'adminSpin') setUnreadSpins(0);
                        if (btn.view === 'adminRefer') setUnreadRefers(0);
                        if (btn.view === 'adminLogins') setUnreadLogins(0);
                      }}
                      className={`relative rounded-xl p-[2px] bg-live-gradient animate-color-shift bg-gradient-to-r ${btn.color} shadow-[0_0_20px_rgba(0,0,0,0.5)] group overflow-hidden`}
                    >
                      <div className="bg-black/20 backdrop-blur-md rounded-[10px] p-4 flex items-center gap-4  h-full w-full relative z-10 transition-colors group-hover:bg-black/20 backdrop-blur-md ">
                         <div className={`p-3 rounded-lg bg-gradient-to-br ${btn.color} shadow-inner`}>
                            <btn.icon size={24} className="text-white drop-shadow-md" />
                         </div>
                         <div className="flex flex-col text-left">
                            <span className="text-white font-black text-lg tracking-wide uppercase drop-shadow-md">{btn.title}</span>
                            <span className="text-gray-400 text-xs font-semibold">{btn.desc}</span>
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
                 <div className="mt-2 bg-black/20 backdrop-blur-md border border-fuchsia-500/30 rounded-xl p-4 shadow-[0_0_30px_rgba(217,70,239,0.2)]">
                    <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                      <Zap size={16} className="text-fuchsia-500 animate-pulse" /> 
                      Live Notifications
                    </h3>
                    <div className="flex flex-col gap-2">
                       <div className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs text-gray-300 shadow-inner flex justify-between items-center">
                          <span><span className="text-cyan-400 font-bold">User99</span> bought 1 Week Key.</span>
                          <span className="text-[10px] text-gray-500">Just now</span>
                       </div>
                       <div className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs text-gray-300 shadow-inner flex justify-between items-center">
                          <span><span className="text-green-400 font-bold">Prem</span> requested fund ‚Çπ500.</span>
                          <span className="text-[10px] text-gray-500">2m ago</span>
                       </div>
                       <div className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs text-gray-300 shadow-inner flex justify-between items-center">
                          <span><span className="text-purple-400 font-bold">Ali</span> won ‚Çπ50 in Spin.</span>
                          <span className="text-[10px] text-gray-500">10m ago</span>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {currentView === 'adminUserHistory' && (
            <div className="flex flex-col gap-4 w-full animate-in fade-in zoom-in-95 duration-300 relative z-10 mt-2 bg-black/20 backdrop-blur-xl rounded-3xl p-5 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-3 mb-2">
                <button onClick={() => setCurrentView('admin')} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors ">
                  <ArrowLeft size={20} className="text-white" />
                </button>
                <h2 className="text-xl font-black tracking-tight italic drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase">
                  USER <span className="text-fuchsia-500 drop-shadow-[0_0_15px_rgba(217,70,239,1)]">WALLETS & HISTORY</span>
                </h2>
              </div>

              {ensureArray(registeredUsers).length === 0 ? (
                <div className="text-center text-gray-400 text-sm mt-10">No registered users yet. New user signups will appear here.</div>
              ) : (
                ensureArray(registeredUsers).map((user, idx) => {
                  const uKey = getAccountKey(user.email, user.phone);
                  const bal = userWallets[uKey] ?? 0;

                  // Filter payment fund requests for this user
                  const userPayments = ensureArray(paymentHistory).filter(p => 
                    (p.userEmail && user.email && p.userEmail.toLowerCase() === user.email.toLowerCase()) ||
                    (p.userPhone && user.phone && p.userPhone === user.phone)
                  );
                  const totalPaid = userPayments
                    .filter(p => p.status === 'APPROVED')
                    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

                  // Filter key requests for this user
                  const userKeys = ensureArray(keyRequests).filter(r => 
                    (r.userEmail && user.email && r.userEmail.toLowerCase() === user.email.toLowerCase()) ||
                    (r.userPhone && user.phone && r.userPhone === user.phone) ||
                    (user.email && r.user === user.email) ||
                    (user.phone && r.user === user.phone)
                  );
                  const keysDeliveredCount = userKeys.filter(r => r.status === 'APPROVED' || r.status === 'DELIVERED').length;

                  const displayName = user.name || (user.email ? user.email.split('@')[0] : (user.phone || "User"));
                  const avatarUrl = user.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop";

                  return (
                    <div key={`reguser-${user.email || user.phone || idx}-${idx}`} className="bg-black/20 backdrop-blur-md border-l-4 border-cyan-400 rounded-r-xl rounded-l-sm p-4 relative overflow-hidden shadow-[0_4px_25px_rgba(0,0,0,0.6)]  flex flex-col gap-3 text-left">
                       <div className="flex justify-between items-start gap-2">
                         <div className="flex items-center gap-3">
                           <img 
                             src={avatarUrl} 
                             alt={displayName}
                             className="w-12 h-12 rounded-full border-2 border-cyan-400/80 object-cover shadow-[0_0_12px_rgba(0,229,255,0.4)] shrink-0"
                             onError={(e) => {
                               (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop";
                             }}
                           />
                           <div className="flex flex-col">
                             <span className="text-white font-black text-base drop-shadow-md">{displayName}</span>
                             {user.email && <span className="text-cyan-300 text-xs font-mono">üìß {user.email}</span>}
                             {user.phone && <span className="text-gray-300 text-xs font-mono">üì± {user.phone}</span>}
                             <span className="text-yellow-400 text-xs font-mono mt-0.5">üîë Password: {user.password}</span>
                             <span className="text-gray-400 text-[10px] mt-0.5">Joined: {user.joinDate}</span>
                           </div>
                         </div>

                         <div className="text-right shrink-0">
                           <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">BALANCE</span>
                           <span className="text-cyan-400 font-black text-xl drop-shadow-[0_0_10px_rgba(0,229,255,0.5)]">‚Çπ{bal}</span>
                         </div>
                       </div>

                       {/* Stats Bar (Total Paisa & Total Keys) */}
                       <div className="grid grid-cols-2 gap-2 bg-black/50 p-2.5 rounded-lg border border-white/10 text-xs font-mono">
                         <div className="flex flex-col">
                           <span className="text-gray-400 text-[10px] uppercase font-bold">TOTAL PAISA LAGAYA</span>
                           <span className="text-emerald-400 font-black text-sm">‚Çπ{totalPaid}</span>
                         </div>
                         <div className="flex flex-col border-l border-white/10 pl-2">
                           <span className="text-gray-400 text-[10px] uppercase font-bold">KEYS BOUGHT</span>
                           <span className="text-fuchsia-400 font-black text-sm">{keysDeliveredCount} Keys</span>
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
                               activeTab: 'info'
                             });
                           }}
                           className="flex-1 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/40 hover:to-blue-500/40 text-cyan-400 border border-cyan-500/40 rounded-lg py-2.5 text-xs font-black transition-all flex items-center justify-center gap-1.5 uppercase shadow-[0_0_10px_rgba(0,229,255,0.2)] active:scale-95"
                         >
                           <Edit size={14} /> EDIT USER & WALLET
                         </button>
                         <button 
                           onClick={() => {
                             if (confirm(`Aap sach me user "${displayName}" ko delete karna chahte hain?`)) {
                               setRegisteredUsers(prev => prev.filter(u => getAccountKey(u.email, u.phone) !== uKey));
                               setUserWallets(prev => {
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
                <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-md  flex items-center justify-center p-3 overflow-y-auto animate-in fade-in">
                  <div className="bg-black/20 backdrop-blur-md border border-cyan-500/40 rounded-2xl max-w-md w-full max-h-[92vh] overflow-y-auto p-4 flex flex-col gap-4 shadow-[0_0_50px_rgba(0,229,255,0.3)] relative text-left my-auto">
                    
                    {/* Modal Header */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2">
                        <User size={20} className="text-cyan-400" />
                        <h3 className="text-white font-black text-lg italic tracking-wide uppercase">
                          EDIT USER & <span className="text-cyan-400">WALLET DETAILS</span>
                        </h3>
                      </div>
                      <button 
                        onClick={() => setEditingAdminUser(null)}
                        className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    {/* User Avatar & Photo URL */}
                    <div className="flex flex-col items-center gap-2 bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/10">
                      <div className="relative group">
                        <img 
                          src={editingAdminUser.avatar} 
                          alt="User Avatar" 
                          className="w-20 h-20 rounded-full object-cover border-2 border-cyan-400 shadow-[0_0_20px_rgba(0,229,255,0.4)]"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop";
                          }}
                        />
                        <div className="absolute bottom-0 right-0 bg-cyan-500 text-black p-1 rounded-full shadow">
                          <Camera size={12} />
                        </div>
                      </div>
                      
                      <div className="w-full">
                        <label className="text-cyan-400 font-bold text-[10px] uppercase tracking-wider block mb-1">
                          PROFILE PHOTO URL
                        </label>
                        <input 
                          type="text" 
                          value={editingAdminUser.avatar}
                          onChange={(e) => setEditingAdminUser({ ...editingAdminUser, avatar: e.target.value })}
                          placeholder="https://..."
                          className="w-full bg-black/20 backdrop-blur-md border border-white/20 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                    </div>

                    {/* User Name & Info Form */}
                    <div className="flex flex-col gap-3">
                      <div>
                        <label className="text-cyan-400 font-bold text-[10px] uppercase tracking-wider block mb-1">
                          USER NAME
                        </label>
                        <input 
                          type="text" 
                          value={editingAdminUser.name}
                          onChange={(e) => setEditingAdminUser({ ...editingAdminUser, name: e.target.value })}
                          placeholder="User Full Name"
                          className="w-full bg-black/20 backdrop-blur-md border border-white/20 rounded-lg p-2.5 text-xs font-bold text-white focus:outline-none focus:border-cyan-400"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-cyan-400 font-bold text-[10px] uppercase tracking-wider block mb-1">
                            GMAIL / EMAIL ID
                          </label>
                          <input 
                            type="email" 
                            value={editingAdminUser.email}
                            onChange={(e) => setEditingAdminUser({ ...editingAdminUser, email: e.target.value })}
                            placeholder="user@gmail.com"
                            className="w-full bg-black/20 backdrop-blur-md border border-white/20 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                          />
                        </div>
                        <div>
                          <label className="text-cyan-400 font-bold text-[10px] uppercase tracking-wider block mb-1">
                            PHONE NUMBER
                          </label>
                          <input 
                            type="text" 
                            value={editingAdminUser.phone}
                            onChange={(e) => setEditingAdminUser({ ...editingAdminUser, phone: e.target.value })}
                            placeholder="Mobile Number"
                            className="w-full bg-black/20 backdrop-blur-md border border-white/20 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-cyan-400 font-bold text-[10px] uppercase tracking-wider block mb-1">
                          ACCOUNT PASSWORD
                        </label>
                        <div className="relative flex items-center">
                          <input 
                            type={editingAdminUser.showPassword ? "text" : "password"} 
                            value={editingAdminUser.password}
                            onChange={(e) => setEditingAdminUser({ ...editingAdminUser, password: e.target.value })}
                            placeholder="User Password"
                            className="w-full bg-black/20 backdrop-blur-md border border-white/20 rounded-lg p-2.5 text-xs font-bold text-yellow-400 pr-10 focus:outline-none focus:border-cyan-400"
                          />
                          <button 
                            type="button"
                            onClick={() => setEditingAdminUser({ ...editingAdminUser, showPassword: !editingAdminUser.showPassword })}
                            className="absolute right-2 text-gray-400 hover:text-white p-1"
                          >
                            {editingAdminUser.showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
                        <span className="text-cyan-300 font-mono text-xs">Current: ‚Çπ{editingAdminUser.balance}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-white font-black text-lg">‚Çπ</span>
                        <input 
                          type="number"
                          value={editingAdminUser.balance}
                          onChange={(e) => setEditingAdminUser({ ...editingAdminUser, balance: Number(e.target.value) || 0 })}
                          className="w-full bg-black/20 backdrop-blur-md border border-cyan-400/60 rounded-lg p-2 text-lg font-black text-cyan-300 focus:outline-none focus:border-cyan-400"
                        />
                      </div>

                      {/* Quick Balance Adjustment Buttons */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <button 
                          type="button"
                          onClick={() => setEditingAdminUser({ ...editingAdminUser, balance: editingAdminUser.balance + 100 })}
                          className="bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-500/40 px-2 py-1 rounded text-[10px] font-bold"
                        >
                          +‚Çπ100
                        </button>
                        <button 
                          type="button"
                          onClick={() => setEditingAdminUser({ ...editingAdminUser, balance: editingAdminUser.balance + 500 })}
                          className="bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-500/40 px-2 py-1 rounded text-[10px] font-bold"
                        >
                          +‚Çπ500
                        </button>
                        <button 
                          type="button"
                          onClick={() => setEditingAdminUser({ ...editingAdminUser, balance: editingAdminUser.balance + 1000 })}
                          className="bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-500/40 px-2 py-1 rounded text-[10px] font-bold"
                        >
                          +‚Çπ1000
                        </button>
                        <button 
                          type="button"
                          onClick={() => setEditingAdminUser({ ...editingAdminUser, balance: Math.max(0, editingAdminUser.balance - 100) })}
                          className="bg-red-500/20 hover:bg-red-500/40 text-red-300 border border-red-500/40 px-2 py-1 rounded text-[10px] font-bold"
                        >
                          -‚Çπ100
                        </button>
                        <button 
                          type="button"
                          onClick={() => setEditingAdminUser({ ...editingAdminUser, balance: 0 })}
                          className="bg-gray-500/20 hover:bg-gray-500/40 text-gray-300 border border-gray-500/40 px-2 py-1 rounded text-[10px] font-bold"
                        >
                          Reset ‚Çπ0
                        </button>
                      </div>
                    </div>

                    {/* Tabs for Activity Details */}
                    <div className="flex border-b border-white/10 gap-1 mt-1">
                      <button
                        type="button"
                        onClick={() => setEditingAdminUser({ ...editingAdminUser, activeTab: 'info' })}
                        className={`py-1.5 px-3 text-xs font-bold rounded-t-lg transition-colors ${
                          (!editingAdminUser.activeTab || editingAdminUser.activeTab === 'info')
                            ? 'bg-cyan-500/20 text-cyan-400 border-b-2 border-cyan-400'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Overview
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingAdminUser({ ...editingAdminUser, activeTab: 'keys' })}
                        className={`py-1.5 px-3 text-xs font-bold rounded-t-lg transition-colors ${
                          editingAdminUser.activeTab === 'keys'
                            ? 'bg-cyan-500/20 text-cyan-400 border-b-2 border-cyan-400'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Keys ({
                          keyRequests.filter(r => 
                            (r.userEmail && editingAdminUser.email && r.userEmail.toLowerCase() === editingAdminUser.email.toLowerCase()) ||
                            (r.userPhone && editingAdminUser.phone && r.userPhone === editingAdminUser.phone) ||
                            (editingAdminUser.email && r.user === editingAdminUser.email) ||
                            (editingAdminUser.phone && r.user === editingAdminUser.phone)
                          ).length
                        })
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingAdminUser({ ...editingAdminUser, activeTab: 'payments' })}
                        className={`py-1.5 px-3 text-xs font-bold rounded-t-lg transition-colors ${
                          editingAdminUser.activeTab === 'payments'
                            ? 'bg-cyan-500/20 text-cyan-400 border-b-2 border-cyan-400'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Payments ({
                          ensureArray(paymentHistory).filter(p => 
                            (p.userEmail && editingAdminUser.email && p.userEmail.toLowerCase() === editingAdminUser.email.toLowerCase()) ||
                            (p.userPhone && editingAdminUser.phone && p.userPhone === editingAdminUser.phone)
                          ).length
                        })
                      </button>
                    </div>

                    {/* Tab Content */}
                    {(!editingAdminUser.activeTab || editingAdminUser.activeTab === 'info') && (
                      <div className="bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/10 flex flex-col gap-2 text-xs font-mono">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Join Date:</span>
                          <span className="text-white font-bold">{editingAdminUser.joinDate || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total Money Added:</span>
                          <span className="text-emerald-400 font-bold">
                            ‚Çπ{
                              paymentHistory
                                .filter(p => 
                                  ((p.userEmail && editingAdminUser.email && p.userEmail.toLowerCase() === editingAdminUser.email.toLowerCase()) ||
                                   (p.userPhone && editingAdminUser.phone && p.userPhone === editingAdminUser.phone)) &&
                                  p.status === 'APPROVED'
                                )
                                .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
                            }
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total Keys Delivered:</span>
                          <span className="text-fuchsia-400 font-bold">
                            {
                              keyRequests.filter(r => 
                                ((r.userEmail && editingAdminUser.email && r.userEmail.toLowerCase() === editingAdminUser.email.toLowerCase()) ||
                                 (r.userPhone && editingAdminUser.phone && r.userPhone === editingAdminUser.phone) ||
                                 (editingAdminUser.email && r.user === editingAdminUser.email) ||
                                 (editingAdminUser.phone && r.user === editingAdminUser.phone)) &&
                                (r.status === 'APPROVED' || r.status === 'DELIVERED')
                              ).length
                            } Keys
                          </span>
                        </div>
                      </div>
                    )}

                    {editingAdminUser.activeTab === 'keys' && (
                      <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                        {(() => {
                          const userKeys = ensureArray(keyRequests).filter(r => 
                            (r.userEmail && editingAdminUser.email && r.userEmail.toLowerCase() === editingAdminUser.email.toLowerCase()) ||
                            (r.userPhone && editingAdminUser.phone && r.userPhone === editingAdminUser.phone) ||
                            (editingAdminUser.email && r.user === editingAdminUser.email) ||
                            (editingAdminUser.phone && r.user === editingAdminUser.phone)
                          );
                          if (userKeys.length === 0) {
                            return <div className="text-center text-gray-500 text-xs py-4">No keys bought yet by this user.</div>;
                          }
                          return userKeys.map((k, idx) => (
                            <div key={`userkey-${k.id}-${idx}`} className="bg-black/20 backdrop-blur-md p-2.5 rounded-lg border border-white/10 text-xs flex flex-col gap-1">
                              <div className="flex justify-between font-bold text-white">
                                <span>{k.panelTitle || 'Panel Key'}</span>
                                <span className="text-cyan-400">‚Çπ{k.price}</span>
                              </div>
                              {k.deliveredKey && (
                                <div className="text-yellow-400 font-mono text-[11px] bg-black/20 backdrop-blur-md p-1 rounded border border-yellow-500/30 select-all">
                                  üîë {k.deliveredKey}
                                </div>
                              )}
                              <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                                <span>Status: <strong className={k.status === 'APPROVED' ? 'text-green-400' : 'text-yellow-400'}>{k.status}</strong></span>
                                <span>{k.date}</span>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    )}

                    {editingAdminUser.activeTab === 'payments' && (
                      <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                        {(() => {
                          const userPay = ensureArray(paymentHistory).filter(p => 
                            (p.userEmail && editingAdminUser.email && p.userEmail.toLowerCase() === editingAdminUser.email.toLowerCase()) ||
                            (p.userPhone && editingAdminUser.phone && p.userPhone === editingAdminUser.phone)
                          );
                          if (userPay.length === 0) {
                            return <div className="text-center text-gray-500 text-xs py-4">No payment history found for this user.</div>;
                          }
                          return userPay.map((p, idx) => (
                            <div key={`userpay-${p.id}-${idx}`} className="bg-black/20 backdrop-blur-md p-2.5 rounded-lg border border-white/10 text-xs flex flex-col gap-1">
                              <div className="flex justify-between font-bold">
                                <span className="text-emerald-400">‚Çπ{p.amount}</span>
                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                                  p.status === 'APPROVED' ? 'bg-green-500/20 text-green-400' :
                                  p.status === 'REJECTED' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                                }`}>{p.status}</span>
                              </div>
                              <div className="text-gray-300 font-mono text-[10px]">UTR: {p.utr}</div>
                              <div className="text-gray-500 text-[10px] text-right">{p.date}</div>
                            </div>
                          ));
                        })()}
                      </div>
                    )}

                    {/* Save & Action Footer */}
                    <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
                      <button 
                        onClick={() => {
                          const oldKey = getAccountKey(editingAdminUser.originalEmail, editingAdminUser.originalPhone);
                          const newKey = getAccountKey(editingAdminUser.email, editingAdminUser.phone);

                          // Update registeredUsers array
                          setRegisteredUsers(prev => prev.map(u => {
                            if (getAccountKey(u.email, u.phone) === oldKey) {
                              return {
                                name: editingAdminUser.name,
                                email: editingAdminUser.email,
                                phone: editingAdminUser.phone,
                                password: editingAdminUser.password,
                                avatar: editingAdminUser.avatar,
                                joinDate: editingAdminUser.joinDate
                              };
                            }
                            return u;
                          }));

                          // Update userWallets record
                          setUserWallets(prev => {
                            const copy = { ...prev };
                            if (oldKey !== newKey) {
                              delete copy[oldKey];
                            }
                            copy[newKey] = editingAdminUser.balance;
                            return copy;
                          });

                          // If the edited user is currently logged in, sync their session live!
                          const currentAccountKey = getAccountKey(userProfile.email, userProfile.phone);
                          if (userProfile.isLoggedIn && (currentAccountKey === oldKey || currentAccountKey === newKey)) {
                            setUserBalance(editingAdminUser.balance);
                            setUserProfile(prev => ({
                              ...prev,
                              email: editingAdminUser.email,
                              phone: editingAdminUser.phone,
                              password: editingAdminUser.password,
                              avatar: editingAdminUser.avatar
                            }));
                          }

                          alert(`User "${editingAdminUser.name || editingAdminUser.email}" details and wallet balance updated to ‚Çπ${editingAdminUser.balance}!`);
                          setEditingAdminUser(null);
                        }}
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black py-3 rounded-xl shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-2 active:scale-95"
                      >
                        <Save size={16} /> SAVE USER DETAILS & BALANCE
                      </button>

                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            if (confirm(`User "${editingAdminUser.name || editingAdminUser.email}" ko delete karna chahte hain?`)) {
                              const oldKey = getAccountKey(editingAdminUser.originalEmail, editingAdminUser.originalPhone);
                              setRegisteredUsers(prev => prev.filter(u => getAccountKey(u.email, u.phone) !== oldKey));
                              setUserWallets(prev => {
                                const copy = { ...prev };
                                delete copy[oldKey];
                                return copy;
                              });
                              alert('User account deleted successfully!');
                              setEditingAdminUser(null);
                            }
                          }}
                          className="flex-1 bg-red-500/20 hover:bg-red-500/40 text-red-400 border border-red-500/30 rounded-lg py-2 text-xs font-bold transition-colors flex items-center justify-center gap-1 uppercase active:scale-95"
                        >
                          <Trash2 size={14} /> DELETE USER
                        </button>
                        
                        <button 
                          onClick={() => setEditingAdminUser(null)}
                          className="flex-1 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg py-2 text-xs font-bold transition-colors uppercase active:scale-95"
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

          {currentView === 'adminPayment' && (
            <div className="flex flex-col gap-4 w-full animate-in fade-in zoom-in-95 duration-300 relative z-10 mt-2 bg-black/20 backdrop-blur-xl rounded-3xl p-5 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-3 mb-2">
                <button onClick={() => setCurrentView('admin')} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors ">
                  <ArrowLeft size={20} className="text-white" />
                </button>
                <h2 className="text-xl font-black tracking-tight italic drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase">
                  PAYMENT <span className="text-fuchsia-500 drop-shadow-[0_0_15px_rgba(217,70,239,1)]">FUND REQUESTS</span>
                </h2>
              </div>

              {/* Pending Requests Section */}
              <div className="flex flex-col gap-3">
                <h3 className="text-xs font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-2">
                  <Hourglass size={14} className="animate-spin" /> Pending Requests ({ensureArray(paymentHistory).filter(p => p.status === 'PENDING').length})
                </h3>

                {ensureArray(paymentHistory).filter(p => p.status === 'PENDING').length === 0 ? (
                  <div className="text-center text-gray-400 text-xs py-6 bg-black/20 backdrop-blur-md /60 border border-white/10 rounded-xl">
                    No pending payment requests at the moment.
                  </div>
                ) : (
                  ensureArray(paymentHistory).filter(p => p.status === 'PENDING').map((req, idx) => (
                     <div key={`pending-payreq-${req.id}-${idx}`} className="bg-black/20 backdrop-blur-md border border-fuchsia-500/40 rounded-xl p-4 relative overflow-hidden shadow-[0_4px_25px_rgba(0,0,0,0.6)]  flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-gray-400 text-xs font-semibold block">Requested Fund</span>
                            <span className="text-fuchsia-400 font-black text-2xl drop-shadow-[0_0_10px_rgba(217,70,239,0.5)]">‚Çπ{req.amount}</span>
                          </div>
                          <span className="text-[10px] font-black px-2.5 py-1 rounded-md bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 flex items-center gap-1 uppercase">
                            <Hourglass size={10} className="animate-spin" /> PENDING
                          </span>
                        </div>

                        {/* USER ACCOUNT & PAYMENT DETAILS */}
                        <div className="bg-black/20 backdrop-blur-md p-3 rounded-lg border border-white/10 text-xs font-mono flex flex-col gap-1.5">
                          <div className="text-cyan-400 font-bold border-b border-white/10 pb-1 uppercase tracking-wider flex items-center gap-1">
                            <User size={12} /> Account Details:
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">üìß Email:</span>
                            <span className="text-white font-bold">{req.userEmail || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">üì± Mobile:</span>
                            <span className="text-white font-bold">{req.userPhone || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">üîë Password:</span>
                            <span className="text-yellow-400 font-bold">{req.userPassword || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between pt-1 border-t border-white/10">
                            <span className="text-gray-400">üßæ UTR / Txn ID:</span>
                            <span className="text-cyan-300 font-bold select-all">{req.utr}</span>
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
                              setPaymentHistory(prev => prev.map(p => p.id === req.id ? { ...p, status: 'REJECTED' } : p));
                              alert('Payment rejected!');
                            }}
                            className="flex-1 bg-red-500/20 hover:bg-red-500/40 text-red-400 border border-red-500/40 rounded-lg py-2 text-xs font-black transition-all uppercase tracking-wider"
                          >
                            REJECT
                          </button>
                          <button 
                            onClick={() => {
                              const targetKey = req.userAccountKey || getAccountKey(req.userEmail, req.userPhone);
                              
                              // 1. Update status
                              setPaymentHistory(prev => prev.map(p => p.id === req.id ? { ...p, status: 'SUCCESS' } : p));
                              
                              // 2. Add funds to userWallets
                              setUserWallets(prev => {
                                const cur = prev[targetKey] ?? 0;
                                return { ...prev, [targetKey]: cur + req.amount };
                              });

                              // 3. Update current userBalance if matching active user
                              const activeKey = getAccountKey(userProfile.email, userProfile.phone);
                              if (!userProfile.isLoggedIn || activeKey === targetKey || targetKey === 'guest') {
                                setUserBalance(prev => prev + req.amount);
                              }

                              alert(`Payment ‚Çπ${req.amount} ACCEPTED! Added to wallet of ${req.userEmail || req.userPhone || 'User'}.`);
                            }}
                            className="flex-1 bg-green-500 hover:bg-green-400 text-black shadow-[0_0_15px_rgba(34,197,94,0.5)] rounded-lg py-2 text-xs font-black transition-all uppercase tracking-wider"
                          >
                            ACCEPT & ADD ‚Çπ{req.amount}
                          </button>
                        </div>
                     </div>
                  ))
                )}
              </div>

              {/* Processed Payments Logs */}
              {ensureArray(paymentHistory).filter(p => p.status !== 'PENDING').length > 0 && (
                <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-white/10">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Recent History ({ensureArray(paymentHistory).filter(p => p.status !== 'PENDING').length})
                  </h3>
                  {ensureArray(paymentHistory).filter(p => p.status !== 'PENDING').map((req, idx) => (
                    <div key={`processed-payreq-${req.id}-${idx}`} className="bg-black/50 border border-white/10 rounded-xl p-3 flex justify-between items-center text-xs">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-white font-bold">‚Çπ{req.amount} - {req.userEmail || req.userPhone || 'User'}</span>
                        <span className="text-gray-400 text-[10px]">UTR: {req.utr}</span>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${req.status === 'SUCCESS' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                        {req.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentView === 'adminKeys' && (
            <div className="flex flex-col gap-4 w-full animate-in fade-in zoom-in-95 duration-300 relative z-10 mt-2 bg-black/20 backdrop-blur-xl rounded-3xl p-5 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-3 mb-2">
                <button onClick={() => setCurrentView('admin')} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors ">
                  <ArrowLeft size={20} className="text-white" />
                </button>
                <h2 className="text-xl font-black tracking-tight italic drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase">
                  MANAGE <span className="text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,1)]">KEYS</span>
                </h2>
              </div>

              {/* Direct Key Sender Form for Admin */}
              <div className="bg-black/20 backdrop-blur-md border border-purple-500/40 rounded-xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.5)]  flex flex-col gap-3">
                <h3 className="text-xs font-black text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Key size={14} className="text-purple-400" /> Send Key Directly To Any User Account
                </h3>

                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-gray-300">1. Target User (Select or Type Email/Phone):</label>
                  <input 
                    type="text"
                    placeholder="Enter user email or phone (e.g. user@gmail.com)"
                    value={manualKeyForm.targetAccount}
                    onChange={(e) => setManualKeyForm(prev => ({ ...prev, targetAccount: e.target.value }))}
                    className="w-full bg-black/20 backdrop-blur-md border border-white/20 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-purple-400"
                  />
                  {ensureArray(registeredUsers).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {ensureArray(registeredUsers).map((u, i) => (
                        <button 
                          key={`user-opt-${u.email || u.phone || i}-${i}`} 
                          type="button"
                          onClick={() => setManualKeyForm(prev => ({ ...prev, targetAccount: u.email || u.phone }))}
                          className="text-[10px] bg-purple-950/60 hover:bg-purple-900 border border-purple-500/30 text-purple-300 px-2 py-0.5 rounded"
                        >
                          {u.email || u.phone}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-gray-300">2. Select Panel:</label>
                  <select
                    value={manualKeyForm.panelTitle}
                    onChange={(e) => setManualKeyForm(prev => ({ ...prev, panelTitle: e.target.value }))}
                    className="w-full bg-black/20 backdrop-blur-md border border-white/20 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-purple-400"
                  >
                    <option value="">Select a panel...</option>
                    {ensureArray(panels).map((p, pIdx) => (
                      <option key={`panel-opt-${p.id}-${pIdx}`} value={p.title}>{p.title}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-gray-300">3. Key Value / Code:</label>
                  <input 
                    type="text"
                    placeholder="Enter key code (e.g. 5546272611)"
                    value={manualKeyForm.keyVal}
                    onChange={(e) => setManualKeyForm(prev => ({ ...prev, keyVal: e.target.value }))}
                    className="w-full bg-black/20 backdrop-blur-md border border-white/20 rounded-lg p-2.5 text-xs font-mono text-emerald-400 font-bold focus:outline-none focus:border-purple-400"
                  />
                </div>

                <button 
                  onClick={() => {
                    if (!manualKeyForm.targetAccount || !manualKeyForm.keyVal) {
                      alert('Please enter Target User and Key Value');
                      return;
                    }
                    const panelName = manualKeyForm.panelTitle || panels[0]?.title || 'DRIPCLIENT FF NONROOT ANDROID';
                    const targetAccKey = getAccountKey(
                      manualKeyForm.targetAccount.includes('@') ? manualKeyForm.targetAccount : '',
                      !manualKeyForm.targetAccount.includes('@') ? manualKeyForm.targetAccount : ''
                    );

                    const directKeyReq = {
                      id: Date.now(),
                      user: manualKeyForm.targetAccount,
                      userEmail: manualKeyForm.targetAccount.includes('@') ? manualKeyForm.targetAccount : '',
                      userPhone: !manualKeyForm.targetAccount.includes('@') ? manualKeyForm.targetAccount : '',
                      userPassword: 'Via Admin',
                      userAccountKey: targetAccKey,
                      panel: panelName,
                      planLabel: '- 1 DAY nonroot',
                      price: manualKeyForm.price || 80,
                      status: 'APPROVED',
                      deliveredKey: manualKeyForm.keyVal.trim(),
                      date: new Date().toLocaleString(),
                      exceptFileLink: supportLinks.telegram
                    };

                    setKeyRequests(prev => [directKeyReq, ...prev]);
                    setManualKeyForm({ targetAccount: '', panelTitle: '', keyVal: '', price: 80 });
                    alert(`Key delivered directly to ${manualKeyForm.targetAccount}!`);
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
                  <div key={`allkeyreq-${req.id}-${idx}`} className="bg-black/20 backdrop-blur-md border border-yellow-500/30 rounded-xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.5)] ">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-white font-bold text-sm block">{req.user}</span>
                        {req.userEmail || req.userPhone ? (
                          <span className="text-gray-400 text-[11px] block">Account: {req.userEmail || req.userPhone}</span>
                        ) : null}
                        {req.userPassword && <span className="text-yellow-400 text-[10px] font-mono block">Pass: {req.userPassword}</span>}
                        <span className="text-purple-300 text-xs font-bold block mt-1">{req.panel} {req.planLabel && `(${req.planLabel})`}</span>
                        
                        {/* Pricing & Coupon Breakdown */}
                        <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg p-2.5 my-1.5 flex flex-col gap-1 text-xs">
                          <div className="flex justify-between items-center font-bold">
                            <span className="text-gray-300">Amount Paid:</span>
                            <span className="text-cyan-400 font-mono text-sm">‚Çπ{req.price}</span>
                          </div>
                          {req.discountAmount && req.discountAmount > 0 ? (
                            <div className="flex justify-between items-center text-[11px] text-green-400 font-bold border-t border-white/10 pt-1 mt-0.5">
                              <span className="flex items-center gap-1"><Tag size={12} /> Coupon Discount:</span>
                              <span>-‚Çπ{req.discountAmount} ({req.couponCodeUsed || 'DISCOUNT'})</span>
                            </div>
                          ) : (
                            <div className="flex justify-between items-center text-[10px] text-gray-500 border-t border-white/10 pt-1 mt-0.5">
                              <span>Coupon Discount:</span>
                              <span>No Coupon Used</span>
                            </div>
                          )}
                        </div>

                        <span className="text-gray-500 text-[10px]">{req.date}</span>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-1 rounded-md border uppercase ${
                        req.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 animate-pulse' :
                        req.status === 'REJECTED' ? 'bg-red-500/20 text-red-400 border-red-500/40' :
                        'bg-green-500/20 text-green-400 border-green-500/30'
                      }`}>
                        {req.status === 'PENDING' ? 'PENDING' : req.status === 'REJECTED' ? 'REJECTED & REFUNDED' : 'DELIVERED'}
                      </span>
                    </div>
                    {req.status === 'PENDING' ? (
                      <div className="flex flex-col gap-2 mt-2">
                        <textarea
                          placeholder="Type key message / code here (e.g. 5546272611 or ABCD-1234-EFGH)..."
                          className="w-full bg-black/50 border border-white/20 rounded-lg py-2 px-3 text-sm font-bold text-emerald-400 font-mono focus:outline-none focus:border-yellow-400 transition-all resize-none h-20"
                          id={`key-input-${req.id}`}
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <button 
                            onClick={() => {
                              const input = document.getElementById(`key-input-${req.id}`) as HTMLTextAreaElement;
                              if (input && input.value) {
                                setKeyRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'APPROVED', deliveredKey: input.value.trim() } : r));
                                alert('Key delivered to user successfully!');
                              } else {
                                alert('Please enter a key message');
                              }
                            }}
                            className="bg-yellow-500 hover:bg-yellow-400 text-black font-black py-2.5 rounded-lg shadow-[0_0_15px_rgba(234,179,8,0.4)] transition-colors w-full uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 active:scale-95"
                          >
                            <CheckCircle size={14} /> APPROVE (IN-APP)
                          </button>

                          <button 
                            onClick={async () => {
                              const input = document.getElementById(`key-input-${req.id}`) as HTMLTextAreaElement;
                              const targetEmail = req.userEmail || (req.user && req.user.includes('@') ? req.user : '');
                              if (!input || !input.value.trim()) {
                                alert('Please enter a key message');
                                return;
                              }
                              let finalEmail = targetEmail;
                              if (!finalEmail) {
                                const promptEmail = prompt("Enter User's Email ID to send Key via EmailJS:", "");
                                if (!promptEmail) return;
                                finalEmail = promptEmail.trim();
                              }
                              const keyVal = input.value.trim();
                              const sent = await handleSendKeyToUser(finalEmail, keyVal, `Hello ${req.user}, here is your ${req.panel} activation key. Thank you for your purchase!`);
                              if (sent) {
                                setKeyRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'APPROVED', deliveredKey: keyVal } : r));
                              }
                            }}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black py-2.5 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-colors w-full uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 active:scale-95"
                          >
                            <Mail size={14} /> üìß SEND VIA EMAILJS
                          </button>
                        </div>

                        {/* REJECT & REFUND BUTTON */}
                        <button
                          type="button"
                          onClick={() => {
                            handleRejectAndRefundKey(req, "Out of stock / Technical issue");
                          }}
                          className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black py-2.5 rounded-lg shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-colors uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 active:scale-95 border border-red-400/40 mt-0.5"
                        >
                          <X size={14} /> ‚ùå REJECT & REFUND ‚Çπ{req.price} (WALLET + EMAIL)
                        </button>
                      </div>
                    ) : req.status === 'REJECTED' ? (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mt-2 flex flex-col gap-1 text-left">
                        <div className="flex items-center justify-between">
                          <span className="text-red-400 text-xs font-black uppercase flex items-center gap-1">
                            <X size={14} /> ORDER REJECTED & REFUNDED
                          </span>
                          <span className="text-emerald-400 font-mono font-bold text-xs">‚Çπ{req.price} Added Back to Wallet</span>
                        </div>
                        <span className="text-gray-300 text-[11px]">‚Çπ{req.price} user ({req.user}) ke account wallet balance me refund kar diya gaya hai.</span>
                      </div>
                    ) : (
                      <div className="bg-black/20 backdrop-blur-md border border-green-500/30 rounded-lg p-3 mt-2">
                        <span className="text-gray-400 text-[10px] font-bold block mb-1">Delivered Key Code:</span>
                        <span className="text-emerald-400 font-mono text-xs font-bold whitespace-pre-wrap break-all">{req.deliveredKey}</span>
                      </div>
                    )}
                  </div>
                ))}
                
                {keyRequests.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No key orders present.</p>
                )}
              </div>
            </div>
          )}

          {currentView === 'adminSpin' && (
            <div className="flex flex-col gap-4 w-full animate-in fade-in zoom-in-95 duration-300 relative z-10 mt-2 bg-black/20 backdrop-blur-xl rounded-3xl p-5 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-3 mb-2">
                <button onClick={() => setCurrentView('admin')} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors ">
                  <ArrowLeft size={20} className="text-white" />
                </button>
                <h2 className="text-xl font-black tracking-tight italic drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase">
                  SPIN <span className="text-fuchsia-500 drop-shadow-[0_0_15px_rgba(217,70,239,1)]">WIN MANAGER</span>
                </h2>
              </div>

              {/* Spin Rewards Configurator for Admin */}
              <div className="bg-black/20 backdrop-blur-md border border-fuchsia-500/40 rounded-2xl p-4 shadow-[0_0_25px_rgba(217,70,239,0.3)]  flex flex-col gap-3">
                <h3 className="text-sm font-black text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                  <Dices size={16} /> Edit Spin Reward Amounts (‚Çπ)
                </h3>
                <p className="text-xs text-gray-300">
                  Admin yahan se spin wheel me jo-jo reward amounts dikhne hain unhe add ya remove kar sakte hain (e.g. 5, 10, 20, 30, 50).
                </p>

                <div className="flex flex-wrap gap-2 my-1">
                  {ensureArray(spinRewards).map((amt, idx) => (
                    <div key={`spinreward-${amt}-${idx}`} className="bg-fuchsia-950/60 border border-fuchsia-400/50 rounded-lg px-3 py-1.5 flex items-center gap-2">
                      <span className="text-yellow-400 font-mono font-black text-sm">‚Çπ{amt}</span>
                      <button 
                        onClick={() => {
                          if (spinRewards.length <= 2) {
                            alert('Kam se kam 2 reward amounts hone chahie wheel par.');
                            return;
                          }
                          setSpinRewards(prev => prev.filter((_, i) => i !== idx));
                        }}
                        className="text-red-400 hover:text-red-300 text-xs font-bold"
                        title="Remove amount"
                      >
                        ‚úï
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
                    className="flex-1 bg-black/20 backdrop-blur-md border border-white/20 rounded-lg py-2 px-3 text-xs font-bold text-white focus:outline-none focus:border-cyan-400"
                  />
                  <button 
                    onClick={() => {
                      const val = Number(newSpinRewardInput);
                      if (val && val > 0) {
                        if (spinRewards.includes(val)) {
                          alert('Yeh reward amount pehle se added hai.');
                          return;
                        }
                        setSpinRewards(prev => [...prev, val].sort((a, b) => a - b));
                        setNewSpinRewardInput('');
                        alert(`Reward ‚Çπ${val} added to spin wheel!`);
                      } else {
                        alert('Kripya valid reward amount daalein.');
                      }
                    }}
                    className="bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs px-4 rounded-lg uppercase tracking-wider"
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
                  <div key={`spinreq-${spin.id}-${idx}`} className="bg-black/20 backdrop-blur-md border border-green-500/30 rounded-xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.5)]  flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-green-400 font-bold text-sm block">Coupon Won: ‚Çπ{spin.prizeWon}</span>
                        <span className="text-gray-500 text-[10px]">{spin.date}</span>
                      </div>
                      <span className="text-[10px] font-black px-2 py-1 rounded-md border bg-green-500/20 text-green-400 border-green-500/30">
                        COMPLETED
                      </span>
                    </div>

                    <div className="bg-black/50 p-2.5 rounded-lg border border-white/10 text-xs font-mono flex flex-col gap-1">
                      <span className="text-gray-300">üìß Email: <strong className="text-white">{spin.email || 'N/A'}</strong></span>
                      <span className="text-gray-300">üì± Phone: <strong className="text-white">{spin.phone || 'N/A'}</strong></span>
                    </div>
                  </div>
                ))}

                {spinRequests.length === 0 && (
                  <div className="text-center text-gray-400 text-sm mt-4">No recent spin activity.</div>
                )}
              </div>
            </div>
          )}

          {currentView === 'adminRefer' && (
            <div className="flex flex-col gap-4 w-full animate-in fade-in zoom-in-95 duration-300 relative z-10 mt-2 bg-black/20 backdrop-blur-xl rounded-3xl p-5 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <button onClick={() => setCurrentView('admin')} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors ">
                    <ArrowLeft size={20} className="text-white" />
                  </button>
                  <h2 className="text-xl font-black tracking-tight italic drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase">
                    REFER <span className="text-fuchsia-500 drop-shadow-[0_0_15px_rgba(217,70,239,1)]">EARN LOGS & SETTINGS</span>
                  </h2>
                </div>
              </div>

              {/* Card 1: Admin Website Link Configuration */}
              <div className="bg-black/20 backdrop-blur-md border border-yellow-500/50 rounded-2xl p-5 shadow-[0_0_30px_rgba(234,179,8,0.2)]  flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="text-sm font-black text-yellow-400 uppercase tracking-wider flex items-center gap-2">
                    <Globe size={18} className="text-yellow-400" /> Website Referral Link Setting
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
                        className="w-full bg-black/20 backdrop-blur-md border border-yellow-500/40 rounded-xl py-3 px-3.5 pl-10 text-xs font-mono font-bold text-yellow-300 focus:outline-none focus:border-yellow-400 focus:shadow-[0_0_15px_rgba(234,179,8,0.3)]"
                      />
                      <Globe size={16} className="absolute left-3 top-3.5 text-yellow-500/70" />
                    </div>
                    <span className="text-[10px] text-gray-400 block mt-1 leading-normal">
                      ‚òÖ Yahan apni website ka link dalein (jaise: <span className="text-cyan-300 font-mono">https://mywebsite.com</span>). Koi bhi user jab refer karne jaega, to uski referral link automatic is website link me convert hokar share hogi!
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                    <div>
                      <label className="text-xs font-bold text-gray-300 block mb-1">
                        Referral Bonus Amount (‚Çπ):
                      </label>
                      <input
                        type="number"
                        value={referBonusAmount}
                        onChange={(e) => setReferBonusAmount(Number(e.target.value) || 0)}
                        placeholder="50"
                        className="w-full bg-black/20 backdrop-blur-md border border-yellow-500/40 rounded-xl py-2.5 px-3.5 text-xs font-bold text-white focus:outline-none focus:border-yellow-400"
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        onClick={() => {
                          localStorage.setItem('app_referWebsiteLink', referWebsiteLink);
                          localStorage.setItem('app_referBonusAmount', referBonusAmount.toString());
                          setReferSettingsSavedMsg('‚úì Website Referral Link & Bonus Amount Updated Successfully!');
                          setTimeout(() => setReferSettingsSavedMsg(''), 4000);
                        }}
                        className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(234,179,8,0.5)] transition-all active:scale-95"
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
                  <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-3 mt-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      User Generated Referral Link Preview:
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-cyan-300 bg-black/20 backdrop-blur-md p-2 rounded-lg border border-cyan-500/30 flex-1 overflow-hidden whitespace-nowrap text-ellipsis">
                        {(referWebsiteLink.trim() || 'https://website.com').includes('?') 
                          ? `${referWebsiteLink.trim() || 'https://website.com'}&ref=user@email.com`
                          : `${referWebsiteLink.trim() || 'https://website.com'}?ref=user@email.com`}
                      </span>
                      <button
                        onClick={() => {
                          const testUrl = (referWebsiteLink.trim() || 'https://website.com').includes('?') 
                            ? `${referWebsiteLink.trim() || 'https://website.com'}&ref=admin`
                            : `${referWebsiteLink.trim() || 'https://website.com'}?ref=admin`;
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
                  <Gift size={16} /> User Referral Requests ({referRequests.length})
                </h3>
                {referRequests.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to clear all refer logs?')) {
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
                  <div key={`referreq-${ref.id}-${idx}`} className="bg-black/20 backdrop-blur-md border border-yellow-500/30 rounded-xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.5)]  flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-yellow-400 font-bold text-sm block">Bonus Amount: ‚Çπ{ref.bonusAmount}</span>
                        <span className="text-gray-500 text-[10px]">{ref.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black px-2 py-1 rounded-md border ${ref.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'bg-green-500/20 text-green-400 border-green-500/30'}`}>
                          {ref.status}
                        </span>
                        <button
                          onClick={() => {
                            setReferRequests(prev => prev.filter(r => r.id !== ref.id));
                          }}
                          className="text-red-400 hover:text-red-300 p-1"
                          title="Delete Log"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="bg-black/50 p-2.5 rounded-lg border border-white/10 text-xs font-mono flex flex-col gap-1 text-left">
                      <span className="text-gray-300">üë§ Referrer Email: <strong className="text-white">{ref.referrerEmail}</strong></span>
                      <span className="text-gray-300">üì± Referrer Phone: <strong className="text-white">{ref.referrerPhone}</strong></span>
                      <span className="text-gray-300">üîë Referrer Pass: <strong className="text-yellow-400">{ref.referrerPassword}</strong></span>
                      <span className="text-cyan-400 mt-1 border-t border-white/10 pt-1">üë• Joined Friend: <strong>{ref.referredEmail}</strong></span>
                    </div>

                    {ref.status === 'PENDING' ? (
                      <button 
                        onClick={() => {
                          setReferRequests(prev => prev.map(r => r.id === ref.id ? { ...r, status: 'ACCEPTED' } : r));
                          setUserBalance(prev => prev + ref.bonusAmount);
                          alert(`Referral bonus accepted! ‚Çπ${ref.bonusAmount} added to referrer balance.`);
                        }}
                        className="bg-yellow-500 hover:bg-yellow-400 text-black font-black py-2 rounded-lg text-xs uppercase transition-colors"
                      >
                        Approve & Credit ‚Çπ{ref.bonusAmount} Bonus
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-green-400 text-center">‚úì Bonus Credited to User Balance</span>
                    )}
                  </div>
                ))}

                {referRequests.length === 0 && (
                  <div className="text-center text-gray-400 text-sm mt-6 bg-black/40 backdrop-blur-md p-6 rounded-xl border border-white/10">
                    No pending referral requests.
                  </div>
                )}
              </div>
            </div>
          )}

          {currentView === 'login' && (
            <div className="flex flex-col gap-6 w-full animate-in fade-in zoom-in-95 duration-300 relative z-10 mt-2 bg-black/40 backdrop-blur-2xl rounded-3xl p-5 sm:p-7 border border-white/15 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-fuchsia-600 to-cyan-500 p-0.5 flex items-center justify-center shadow-[0_0_20px_rgba(217,70,239,0.5)] shrink-0">
                    <div className="w-full h-full bg-black/80 rounded-[14px] flex items-center justify-center">
                      <User className="text-cyan-400" size={24} />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight italic drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase">
                      USER <span className="text-fuchsia-500 drop-shadow-[0_0_15px_rgba(217,70,239,1)]">AUTHENTICATION</span>
                    </h2>
                    <p className="text-[11px] text-gray-300 font-medium">‡§∏‡•Å‡§∞‡§ï‡•ç‡§∑‡§ø‡§§ ‡§≤‡•â‡§ó‡§ø‡§® ‡§µ ‡§®‡§Ø‡§æ ‡§Ö‡§ï‡§æ‡§â‡§Ç‡§ü ‡§∞‡§ú‡§ø‡§∏‡•ç‡§ü‡•ç‡§∞‡•á‡§∂‡§®</p>
                  </div>
                </div>
                {userProfile.isLoggedIn && (
                  <span className="bg-green-500/20 text-green-400 border border-green-500/40 text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_10px_rgba(34,197,94,0.3)]">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-ping"></span> LOGGED IN
                  </span>
                )}
              </div>

              {!userProfile.isLoggedIn ? (
                <div className="flex flex-col gap-5">
                  {/* VIP Notice Banner */}
                  <div className="bg-gradient-to-r from-fuchsia-950/40 via-purple-950/40 to-cyan-950/40 border border-fuchsia-500/30 rounded-2xl p-3.5 flex items-center gap-3 text-xs text-gray-200">
                    <ShieldCheck className="text-fuchsia-400 shrink-0" size={22} />
                    <div>
                      <p className="font-bold text-white text-xs sm:text-sm">‡§Ö‡§∏‡§≤‡•Ä ‡§î‡§∞ ‡§∏‡•Å‡§∞‡§ï‡•ç‡§∑‡§ø‡§§ ‡§≤‡•â‡§ó‡§ø‡§® ‡§∏‡§ø‡§∏‡•ç‡§ü‡§Æ (Strict Real Verification)</p>
                      <p className="text-[11px] text-gray-300">‡§ï‡•á‡§µ‡§≤ ‡§µ‡•à‡§ß Real Email ID, 10-‡§Ö‡§Ç‡§ï‡•ã‡§Ç ‡§ï‡§æ Mobile Number ‡§è‡§µ‡§Ç ‡§∏‡§π‡•Ä Password ‡§∏‡•á ‡§π‡•Ä ‡§≤‡•â‡§ó‡§ø‡§® ‡§π‡•ã‡§ó‡§æ‡•§</p>
                    </div>
                  </div>

                  {/* 1. PRIMARY GOOGLE LOGIN BUTTON */}
                  <div className="flex flex-col gap-2">
                    <button
                      id="loginBtn"
                      type="button"
                      onClick={handleGoogleUserSignIn}
                      disabled={isSigningInUserGoogle}
                      className="w-full bg-white hover:bg-gray-100 text-gray-900 font-black text-sm py-3.5 px-5 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all flex items-center justify-center gap-3 active:scale-98 border-2 border-white hover:border-cyan-300 cursor-pointer group"
                    >
                      {isSigningInUserGoogle ? (
                        <Loader2 size={22} className="animate-spin text-gray-800" />
                      ) : (
                        <svg className="w-6 h-6 shrink-0 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                        </svg>
                      )}
                      <span className="tracking-wide">GOOGLE (GMAIL) ‡§∏‡•á LOGIN ‡§ï‡§∞‡•á‡§Ç</span>
                    </button>
                    <p className="text-[10px] text-gray-400 text-center">Google Popup ‡§Ø‡§æ Real Gmail ID ‡§¶‡•ç‡§µ‡§æ‡§∞‡§æ ‡§∏‡•Å‡§∞‡§ï‡•ç‡§∑‡§ø‡§§ ‡§è‡§ï-‡§ï‡•ç‡§≤‡§ø‡§ï ‡§≤‡•â‡§ó‡§ø‡§®</p>
                  </div>

                  {/* DIVIDER */}
                  <div className="flex items-center gap-3 my-1">
                    <div className="flex-1 border-t border-white/15"></div>
                    <span className="text-[11px] text-cyan-400 font-bold uppercase tracking-widest px-2">‡§Ø‡§æ REAL CREDENTIALS ‡§¶‡•ç‡§µ‡§æ‡§∞‡§æ</span>
                    <div className="flex-1 border-t border-white/15"></div>
                  </div>

                  {/* TABS: LOGIN vs REGISTER */}
                  <div className="grid grid-cols-2 gap-2 bg-black/60 p-1.5 rounded-2xl border border-white/10">
                    <button
                      type="button"
                      onClick={() => { setUserAuthTab('login'); setUserAuthError(''); }}
                      className={`py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        userAuthTab === 'login'
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_20px_rgba(0,229,255,0.4)] border border-cyan-300/40'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Key size={14} /> 1. LOGIN (‡§≤‡•â‡§ó‡§ø‡§®)
                    </button>

                    <button
                      type="button"
                      onClick={() => { setUserAuthTab('register'); setUserAuthError(''); }}
                      className={`py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        userAuthTab === 'register'
                          ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-[0_0_20px_rgba(217,70,239,0.4)] border border-fuchsia-300/40'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <UserPlus size={14} /> 2. CREATE ACCOUNT (‡§∞‡§ú‡§ø‡§∏‡•ç‡§ü‡§∞)
                    </button>
                  </div>

                  {/* ERROR BANNER */}
                  {userAuthError && (
                    <div className="bg-red-950/60 border-2 border-red-500/80 rounded-2xl p-3.5 text-red-200 text-xs flex items-start gap-2.5 shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-in fade-in zoom-in-95">
                      <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={18} />
                      <div className="flex-1 font-semibold leading-relaxed">
                        {userAuthError}
                      </div>
                    </div>
                  )}

                  {/* TAB 1: LOGIN FORM */}
                  {userAuthTab === 'login' && (
                    <form onSubmit={handleUserLoginSubmit} className="flex flex-col gap-3.5">
                      <div>
                        <label className="text-xs font-bold text-gray-200 block mb-1.5 flex items-center justify-between">
                          <span>Registered Email ID ‡§Ø‡§æ 10-‡§Ö‡§Ç‡§ï‡•ã‡§Ç ‡§ï‡§æ Mobile Number:</span>
                          <span className="text-[10px] text-cyan-400 font-normal">Real Email / Phone Required</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="e.g. rahul@gmail.com ‡§Ø‡§æ 9876543210"
                            value={userLoginForm.identifier}
                            onChange={(e) => {
                              setUserLoginForm({ ...userLoginForm, identifier: e.target.value });
                              if (userAuthError) setUserAuthError('');
                            }}
                            className="w-full bg-black/60 border border-white/20 focus:border-cyan-400 rounded-xl px-3.5 py-3 text-xs sm:text-sm text-white placeholder:text-gray-500 focus:outline-none transition-all shadow-inner"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-200 block mb-1.5 flex items-center justify-between">
                          <span>Password (‡§™‡§æ‡§∏‡§µ‡§∞‡•ç‡§°):</span>
                          <span className="text-[10px] text-gray-400 font-normal">Strict Password Check</span>
                        </label>
                        <div className="relative">
                          <input
                            type="password"
                            placeholder="‡§Ö‡§™‡§®‡§æ ‡§∏‡•Å‡§∞‡§ï‡•ç‡§∑‡§ø‡§§ ‡§™‡§æ‡§∏‡§µ‡§∞‡•ç‡§° ‡§¶‡§∞‡•ç‡§ú ‡§ï‡§∞‡•á‡§Ç"
                            value={userLoginForm.password}
                            onChange={(e) => {
                              setUserLoginForm({ ...userLoginForm, password: e.target.value });
                              if (userAuthError) setUserAuthError('');
                            }}
                            className="w-full bg-black/60 border border-white/20 focus:border-cyan-400 rounded-xl px-3.5 py-3 text-xs sm:text-sm text-white placeholder:text-gray-500 focus:outline-none transition-all shadow-inner"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-sm py-3.5 rounded-xl shadow-[0_0_25px_rgba(0,229,255,0.4)] transition-all uppercase tracking-wider cursor-pointer active:scale-98 mt-1 flex items-center justify-center gap-2"
                      >
                        <Key size={18} /> VERIFY & LOGIN (‡§≤‡•â‡§ó‡§ø‡§® ‡§ï‡§∞‡•á‡§Ç)
                      </button>

                      <p className="text-gray-400 text-xs text-center mt-1">
                        ‡§®‡§Ø‡§æ ‡§Ø‡•Ç‡§ú‡§º‡§∞ ‡§π‡•à‡§Ç?{' '}
                        <button
                          type="button"
                          onClick={() => { setUserAuthTab('register'); setUserAuthError(''); }}
                          className="text-cyan-400 font-bold hover:underline cursor-pointer"
                        >
                          ‡§Ø‡§π‡§æ‡§Å ‡§ï‡•ç‡§≤‡§ø‡§ï ‡§ï‡§∞‡§ï‡•á ‡§®‡§Ø‡§æ ‡§Ö‡§ï‡§æ‡§â‡§Ç‡§ü ‡§¨‡§®‡§æ‡§è‡§Ç (Create Account)
                        </button>
                      </p>
                    </form>
                  )}

                  {/* TAB 2: REGISTER FORM */}
                  {userAuthTab === 'register' && (
                    <form onSubmit={handleUserRegisterSubmit} className="flex flex-col gap-3">
                      <div>
                        <label className="text-xs font-bold text-gray-200 block mb-1">
                          Full Name (‡§Ü‡§™‡§ï‡§æ ‡§™‡•Ç‡§∞‡§æ ‡§®‡§æ‡§Æ):
                        </label>
                        <input
                          type="text"
                          placeholder="‡§â‡§¶‡§æ. Rahul Sharma"
                          value={userRegisterForm.name}
                          onChange={(e) => {
                            setUserRegisterForm({ ...userRegisterForm, name: e.target.value });
                            if (userAuthError) setUserAuthError('');
                          }}
                          className="w-full bg-black/60 border border-white/20 focus:border-fuchsia-400 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-gray-500 focus:outline-none shadow-inner"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-200 block mb-1 flex items-center justify-between">
                          <span>Real Email ID (‡§Ö‡§∏‡§≤‡•Ä ‡§à‡§Æ‡•á‡§≤ ‡§™‡§§‡§æ):</span>
                          <span className="text-[10px] text-fuchsia-400">Valid Format e.g. name@gmail.com</span>
                        </label>
                        <input
                          type="email"
                          placeholder="‡§â‡§¶‡§æ. rahul@gmail.com"
                          value={userRegisterForm.email}
                          onChange={(e) => {
                            setUserRegisterForm({ ...userRegisterForm, email: e.target.value });
                            if (userAuthError) setUserAuthError('');
                          }}
                          className="w-full bg-black/60 border border-white/20 focus:border-fuchsia-400 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-gray-500 focus:outline-none shadow-inner"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-200 block mb-1 flex items-center justify-between">
                          <span>Real 10-Digit Mobile Number (10-‡§Ö‡§Ç‡§ï‡•ã‡§Ç ‡§ï‡§æ ‡§Æ‡•ã‡§¨‡§æ‡§á‡§≤):</span>
                          <span className="text-[10px] text-fuchsia-400">10 Digits (6-9 Start)</span>
                        </label>
                        <input
                          type="tel"
                          maxLength={10}
                          placeholder="‡§â‡§¶‡§æ. 9876543210"
                          value={userRegisterForm.phone}
                          onChange={(e) => {
                            setUserRegisterForm({ ...userRegisterForm, phone: e.target.value.replace(/[^0-9]/g, '') });
                            if (userAuthError) setUserAuthError('');
                          }}
                          className="w-full bg-black/60 border border-white/20 focus:border-fuchsia-400 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-gray-500 focus:outline-none shadow-inner"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-xs font-bold text-gray-200 block mb-1">
                            Create Password (‡§ï‡§Æ ‡§∏‡•á ‡§ï‡§Æ 6 ‡§Ö‡§ï‡•ç‡§∑‡§∞):
                          </label>
                          <input
                            type="password"
                            placeholder="‡§®‡§Ø‡§æ ‡§™‡§æ‡§∏‡§µ‡§∞‡•ç‡§° ‡§¨‡§®‡§æ‡§è‡§Ç"
                            value={userRegisterForm.password}
                            onChange={(e) => {
                              setUserRegisterForm({ ...userRegisterForm, password: e.target.value });
                              if (userAuthError) setUserAuthError('');
                            }}
                            className="w-full bg-black/60 border border-white/20 focus:border-fuchsia-400 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-gray-500 focus:outline-none shadow-inner"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-200 block mb-1">
                            Confirm Password (‡§™‡§æ‡§∏‡§µ‡§∞‡•ç‡§° ‡§¶‡•ã‡§¨‡§æ‡§∞‡§æ):
                          </label>
                          <input
                            type="password"
                            placeholder="‡§µ‡§π‡•Ä ‡§™‡§æ‡§∏‡§µ‡§∞‡•ç‡§° ‡§¶‡•ã‡§¨‡§æ‡§∞‡§æ ‡§¶‡§∞‡•ç‡§ú ‡§ï‡§∞‡•á‡§Ç"
                            value={userRegisterForm.confirmPassword}
                            onChange={(e) => {
                              setUserRegisterForm({ ...userRegisterForm, confirmPassword: e.target.value });
                              if (userAuthError) setUserAuthError('');
                            }}
                            className="w-full bg-black/60 border border-white/20 focus:border-fuchsia-400 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-gray-500 focus:outline-none shadow-inner"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-pink-600 via-fuchsia-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-black text-sm py-3.5 rounded-xl shadow-[0_0_25px_rgba(217,70,239,0.5)] transition-all uppercase tracking-wider cursor-pointer active:scale-98 mt-1 flex items-center justify-center gap-2"
                      >
                        <UserPlus size={18} /> CREATE VERIFIED ACCOUNT (‡§Ö‡§ï‡§æ‡§â‡§Ç‡§ü ‡§¨‡§®‡§æ‡§è‡§Ç)
                      </button>

                      <p className="text-gray-400 text-xs text-center mt-1">
                        ‡§™‡§π‡§≤‡•á ‡§∏‡•á ‡§Ö‡§ï‡§æ‡§â‡§Ç‡§ü ‡§π‡•à?{' '}
                        <button
                          type="button"
                          onClick={() => { setUserAuthTab('login'); setUserAuthError(''); }}
                          className="text-fuchsia-400 font-bold hover:underline cursor-pointer"
                        >
                          ‡§Ø‡§π‡§æ‡§Å ‡§ï‡•ç‡§≤‡§ø‡§ï ‡§ï‡§∞‡§ï‡•á Login ‡§ï‡§∞‡•á‡§Ç
                        </button>
                      </p>
                    </form>
                  )}
                </div>
              ) : (
                /* LOGGED IN USER PROFILE SUMMARY */
                <div className="bg-black/30 backdrop-blur-md border border-green-500/40 rounded-3xl p-6 shadow-[0_0_50px_rgba(34,197,94,0.2)] flex flex-col items-center text-center">
                  <div className="relative mb-4">
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center border-2 border-green-400 overflow-hidden shadow-[0_0_30px_rgba(34,197,94,0.4)]">
                      {userProfile.avatar ? (
                        <img src={userProfile.avatar} alt="User Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User size={40} className="text-green-400" />
                      )}
                    </div>
                    <span className="absolute -bottom-1 -right-1 bg-green-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full border border-black shadow">
                      VERIFIED
                    </span>
                  </div>

                  <h3 id="userInfo" className="text-white font-black text-lg sm:text-xl mb-1">
                    ‡§∏‡•ç‡§µ‡§æ‡§ó‡§§ ‡§π‡•à, {userProfile.email || userProfile.phone || 'VIP Member'}!
                  </h3>
                  <p className="text-gray-300 text-xs mb-3">
                    {userProfile.email ? `Email: ${userProfile.email}` : ''}
                    {userProfile.phone ? ` | Phone: ${userProfile.phone}` : ''}
                  </p>

                  <div className="grid grid-cols-2 gap-3 w-full max-w-sm mb-5">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                      <p className="text-[10px] text-gray-400 uppercase font-bold">Wallet Balance</p>
                      <p className="text-cyan-400 font-black text-xl">‚Çπ{userBalance}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                      <p className="text-[10px] text-gray-400 uppercase font-bold">Keys Bought</p>
                      <p className="text-fuchsia-400 font-black text-xl">{userProfile.keysBought ?? 0}</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                    <button
                      onClick={() => setCurrentView('home')}
                      className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs py-3 rounded-xl shadow-[0_0_15px_rgba(0,229,255,0.3)] transition-all uppercase tracking-wider"
                    >
                      GO TO HOME (‡§ï‡•Ä ‡§ñ‡§∞‡•Ä‡§¶‡•á‡§Ç)
                    </button>
                    <button
                      id="logoutBtn"
                      onClick={async () => {
                        try {
                          const auth = getAuth(firebaseApp);
                          await signOut(auth);
                        } catch (e) {}
                        if (userProfile.isLoggedIn) {
                          const key = getAccountKey(userProfile.email, userProfile.phone);
                          if (key && key !== 'guest') {
                            setUserWallets(prev => ({ ...prev, [key]: userBalance }));
                            setUserAccountProfiles(prev => ({
                              ...prev,
                              [key]: {
                                avatar: userProfile.avatar,
                                keysBought: userProfile.keysBought,
                                totalAdded: userProfile.totalAdded,
                                joinDate: userProfile.joinDate
                              }
                            }));
                          }
                        }
                        setUserProfile({
                          isLoggedIn: false,
                          email: '',
                          phone: '',
                          password: '',
                          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
                          joinDate: '',
                          keysBought: 0,
                          totalAdded: 0
                        });
                        setUserBalance(0);
                        alert("Logged out successfully! Account profile and wallet saved.");
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
          {currentView === 'profile' && (
            <div className="flex flex-col gap-6 w-full animate-in fade-in zoom-in-95 duration-300 relative z-10 mt-2 bg-black/20 backdrop-blur-xl rounded-3xl p-5 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
               <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black tracking-tight italic drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase">
                  MY <span className="text-fuchsia-500 drop-shadow-[0_0_15px_rgba(217,70,239,1)] animate-pulse-slow">PROFILE</span>
                </h2>
              </div>

              {!userProfile.isLoggedIn ? (
                <div className="text-center mt-10">
                  <p className="text-gray-400 mb-4">You need to login first.</p>
                  <button onClick={() => setCurrentView('login')} className="bg-cyan-500 text-black font-bold px-6 py-2 rounded-full">Go to Login</button>
                </div>
              ) : (
                <div className="bg-black/20 backdrop-blur-md border border-fuchsia-500/30 rounded-[24px] p-5 shadow-[0_0_40px_rgba(0,0,0,0.8)]  flex flex-col items-center w-full">
                  <div className="relative mb-3 group cursor-pointer">
                    <img 
                      src={userProfile.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop"} 
                      alt="Profile" 
                      className="w-28 h-28 rounded-full object-cover border-4 border-fuchsia-500 shadow-[0_0_25px_rgba(217,70,239,0.5)] transition-all hover:scale-105" 
                      onClick={() => setPreviewMedia({ url: userProfile.avatar, title: 'Your Permanent Profile Photo' })}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop";
                      }}
                    />
                    <label className="absolute bottom-0 right-0 bg-fuchsia-600 hover:bg-fuchsia-500 text-white p-2 rounded-full cursor-pointer shadow-lg border-2 border-black transition-all active:scale-95" title="Change Photo">
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
                  <div className="w-full max-w-sm flex flex-col gap-2 mb-5 bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/10">
                    <label className="w-full bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-black py-2.5 px-4 rounded-xl shadow-[0_0_15px_rgba(217,70,239,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer text-xs uppercase active:scale-95">
                      <Camera size={16} /> üì∏ UPLOAD PHOTO FROM DEVICE
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
                        className="flex-1 bg-black/20 backdrop-blur-md border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-fuchsia-400"
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          if (!avatarUrlInput.trim()) {
                            alert('Kripya valid Image URL enter karein!');
                            return;
                          }
                          handleSaveAvatar(avatarUrlInput.trim());
                          setAvatarUrlInput('');
                        }}
                        className="bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs px-3 py-1.5 rounded-lg uppercase"
                      >
                        Save URL
                      </button>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-1">{userProfile.email || "User"}</h3>
                  <p className="text-gray-400 text-sm mb-6">{userProfile.phone || "No Phone Added"}</p>

                  <div className="w-full grid grid-cols-2 gap-3 mb-2">
                    <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-xl p-3 flex flex-col items-center">
                      <span className="text-gray-400 text-xs font-semibold mb-1">Total Added</span>
                      <span className="text-cyan-400 font-black text-lg">‚Çπ{userBalance}</span>
                    </div>
                    <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-xl p-3 flex flex-col items-center">
                      <span className="text-gray-400 text-xs font-semibold mb-1">Keys Bought</span>
                      <span className="text-fuchsia-500 font-black text-lg">{userProfile.keysBought}</span>
                    </div>
                  </div>
                  <div className="w-full bg-black/40 backdrop-blur-md border border-white/5 rounded-xl p-3 flex justify-between items-center mt-2">
                     <span className="text-gray-400 text-sm font-semibold">Joined On</span>
                     <span className="text-white font-bold text-sm">{userProfile.joinDate}</span>
                  </div>

                  <div className="w-full mt-4 flex flex-col gap-3">
                    {(() => {
                      const activeAccKey = getAccountKey(userProfile.email, userProfile.phone);
                      const userKeyRequests = keyRequests.filter(req => {
                        if (req.userAccountKey) {
                          return req.userAccountKey === activeAccKey;
                        }
                        if (!userProfile.isLoggedIn) return false;
                        const reqEmail = (req.userEmail || '').toLowerCase();
                        const reqPhone = (req.userPhone || '').toLowerCase();
                        const reqUser = (req.user || '').toLowerCase();
                        const uEmail = (userProfile.email || '').toLowerCase();
                        const uPhone = (userProfile.phone || '').toLowerCase();
                        return (uEmail && (reqEmail === uEmail || reqUser.includes(uEmail))) || 
                               (uPhone && (reqPhone === uPhone || reqUser.includes(uPhone)));
                      });

                      return (
                        <>
                          <h4 className="text-white font-bold text-sm mb-1 flex items-center gap-2">
                            <Key size={16} className="text-fuchsia-400" /> My Keys & Orders ({ensureArray(userKeyRequests).length})
                          </h4>

                          {/* Pending Orders */}
                          {ensureArray(userKeyRequests).filter(r => r.status === 'PENDING').map((req, idx) => (
                            <div key={`staff-pendingkey-${req.id}-${idx}`} className="bg-amber-950/30 border border-amber-500/50 rounded-xl p-3 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                              <div className="flex justify-between items-start mb-1">
                                <div className="text-white text-xs font-bold">{req.panel}</div>
                                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                  <Clock size={10} /> PENDING
                                </span>
                              </div>
                              <div className="text-[11px] text-cyan-300 font-semibold mb-1">Plan: {req.planLabel || '1 DAY'} ‚Ä¢ Paid: ‚Çπ{req.price}</div>
                              <div className="text-[10px] text-gray-400 italic">Admin aapko thodi der me manually key deliver karenge.</div>
                              <div className="text-[10px] text-gray-500 text-right mt-1">{req.date}</div>
                            </div>
                          ))}

                          {/* Delivered Keys */}
                          {ensureArray(userKeyRequests).filter(r => r.status === 'APPROVED' || r.status === 'DELIVERED').map((req, idx) => (
                             <div key={`staff-deliveredkey-${req.id}-${idx}`} className="bg-emerald-950/30 border border-emerald-500/50 rounded-xl p-3 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                               <div className="flex justify-between items-start mb-1">
                                 <div className="text-white text-xs font-bold">{req.panel}</div>
                                 <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                   <CheckCircle size={10} /> DELIVERED
                                 </span>
                               </div>
                               <div className="text-[11px] text-cyan-300 font-semibold mb-2">Plan: {req.planLabel || '1 DAY'} ‚Ä¢ Date: {req.date}</div>
                               <div className="flex justify-between items-center bg-black/20 backdrop-blur-md border border-emerald-500/30 p-2.5 rounded-lg">
                                 <span className="text-emerald-400 font-mono text-xs font-bold whitespace-pre-wrap break-all w-full pr-2 text-left">{req.deliveredKey}</span>
                                 <button onClick={() => {
                                   navigator.clipboard.writeText(req.deliveredKey);
                                   alert('Key copied!');
                                 }} className="text-black bg-emerald-400 hover:bg-emerald-300 p-2 rounded-md font-bold transition-colors shrink-0 flex items-center gap-1 text-xs">
                                   <Copy size={12}/> Copy
                                 </button>
                               </div>
                             </div>
                          ))}

                          {userKeyRequests.length === 0 && (
                            <p className="text-gray-500 text-xs text-center py-4 bg-black/20 backdrop-blur-md rounded-lg border border-white/5">No keys or pending orders yet for this account.</p>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}

          {currentView === 'customerSupport' && (
            <div className="flex flex-col gap-6 w-full animate-in fade-in zoom-in-95 duration-300 relative z-10 mt-2 bg-black/20 backdrop-blur-xl rounded-3xl p-5 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
               <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black tracking-tight italic drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase">
                  CUSTOMER <span className="text-fuchsia-500 drop-shadow-[0_0_15px_rgba(217,70,239,1)] animate-pulse-slow">SUPPORT</span>
                </h2>
              </div>
              
              <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-[24px] p-6 shadow-[0_0_40px_rgba(0,0,0,0.8)]  flex flex-col items-center w-full mt-4">
                <Headset size={48} className="text-cyan-400 mb-6 drop-shadow-[0_0_15px_rgba(0,229,255,0.5)]" />
                <p className="text-gray-300 text-center text-sm mb-8 font-medium">
                  We are here to help you! Reach out to us on our official support channels for quick resolutions.
                </p>

                <div className="w-full flex flex-col gap-4">
                  <a href={supportLinks.telegram} target="_blank" rel="noreferrer" className="w-full flex items-center justify-center gap-3 bg-[#0088cc] hover:bg-[#0077b3] text-white font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(0,136,204,0.4)] transition-all">
                    <Send size={20} /> Telegram Support
                  </a>
                  <a href={supportLinks.whatsapp} target="_blank" rel="noreferrer" className="w-full flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(37,211,102,0.4)] transition-all">
                    <Zap size={20} className="fill-white" /> WhatsApp Support
                  </a>
                </div>
              </div>
            </div>
          )}

          {currentView === 'adminOwner' && (
            <div className="flex flex-col gap-4 w-full animate-in fade-in zoom-in-95 duration-300 relative z-10 mt-2 bg-black/20 backdrop-blur-xl rounded-3xl p-5 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-3 mb-2">
                <button onClick={() => setCurrentView('admin')} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors ">
                  <ArrowLeft size={20} className="text-white" />
                </button>
                <h2 className="text-xl font-black tracking-tight italic drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase">
                  OWNER <span className="text-sky-400 drop-shadow-[0_0_15px_rgba(56,189,248,1)]">TELEGRAM LINK</span>
                </h2>
              </div>
              
              <div className="bg-black/20 backdrop-blur-md border border-sky-500/40 rounded-2xl p-5 shadow-[0_4px_25px_rgba(56,189,248,0.3)]  flex flex-col gap-4 text-left">
                <div className="flex items-center gap-3 bg-sky-500/10 p-3 rounded-xl border border-sky-500/30">
                  <div className="bg-[#0088cc] p-3 rounded-full text-white shadow-[0_0_15px_rgba(0,136,204,0.8)] shrink-0">
                    <Send size={24} />
                  </div>
                  <div>
                    <h4 className="text-white font-black text-sm uppercase">Website Bottom Telegram Logo</h4>
                    <p className="text-gray-300 text-xs mt-0.5">Website ke sabse niche jo Telegram ka blue logo button hai, click karne par user yahan dale hue link par jayega.</p>
                  </div>
                </div>

                <div>
                  <label className="text-sky-400 font-bold text-xs tracking-wider mb-2 block uppercase">
                    OWNER TELEGRAM LINK (NICHE WALE TELEGRAM LOGO KE LIYE)
                  </label>
                  <input
                    type="text"
                    value={supportLinks.ownerTelegram || supportLinks.telegram || ''}
                    onChange={(e) => setSupportLinks({
                      ...supportLinks,
                      ownerTelegram: e.target.value,
                      telegram: e.target.value
                    })}
                    placeholder="https://t.me/yourusername"
                    className="w-full bg-black/20 backdrop-blur-md border border-white/20 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-sky-400 shadow-inner transition-all"
                  />
                </div>

                <button 
                  onClick={() => { 
                    localStorage.setItem('app_supportLinks', JSON.stringify(supportLinks));
                    alert('‚úÖ Owner Telegram Link permanently save ho gaya hai!'); 
                    setCurrentView('admin'); 
                  }} 
                  className="mt-2 w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black py-3.5 rounded-xl shadow-[0_0_20px_rgba(56,189,248,0.5)] transition-all uppercase tracking-wider text-xs active:scale-95 flex items-center justify-center gap-2"
                >
                  <Save size={16} /> SAVE OWNER TELEGRAM LINK
                </button>
              </div>
            </div>
          )}

          {currentView === 'adminSupport' && (
            <div className="flex flex-col gap-4 w-full animate-in fade-in zoom-in-95 duration-300 relative z-10 mt-2 bg-black/20 backdrop-blur-xl rounded-3xl p-5 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-3 mb-2">
                <button onClick={() => setCurrentView('admin')} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors ">
                  <ArrowLeft size={20} className="text-white" />
                </button>
                <h2 className="text-xl font-black tracking-tight italic drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase">
                  SUPPORT <span className="text-fuchsia-500 drop-shadow-[0_0_15px_rgba(217,70,239,1)]">LINKS</span>
                </h2>
              </div>
              
              <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.5)] ">
                <label className="text-cyan-400 font-bold text-xs tracking-wider mb-2 block">TELEGRAM LINK</label>
                <input
                  type="text"
                  value={supportLinks.telegram}
                  onChange={(e) => setSupportLinks({...supportLinks, telegram: e.target.value})}
                  className="w-full bg-black/40 backdrop-blur-md border border-white/20 rounded-lg py-3 px-3 mb-4 text-sm font-bold text-white focus:outline-none focus:border-cyan-400 transition-all"
                />
                <label className="text-green-400 font-bold text-xs tracking-wider mb-2 block">WHATSAPP LINK</label>
                <input
                  type="text"
                  value={supportLinks.whatsapp}
                  onChange={(e) => setSupportLinks({...supportLinks, whatsapp: e.target.value})}
                  className="w-full bg-black/40 backdrop-blur-md border border-white/20 rounded-lg py-3 px-3 text-sm font-bold text-white focus:outline-none focus:border-green-400 transition-all"
                />
                <button onClick={() => { alert('Links updated successfully!'); setCurrentView('admin'); }} className="mt-4 w-full bg-cyan-500 hover:bg-cyan-400 text-black font-black py-3 rounded-lg transition-colors">SAVE LINKS</button>
              </div>
            </div>
          )}



          {currentView === 'adminAccessFiles' && (
            <div className="flex flex-col gap-4 w-full animate-in fade-in zoom-in-95 duration-300 relative z-10 mt-2 bg-black/20 backdrop-blur-xl rounded-3xl p-5 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-3 mb-2">
                <button onClick={() => setCurrentView('admin')} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors ">
                  <ArrowLeft size={20} className="text-white" />
                </button>
                <h2 className="text-xl font-black tracking-tight italic drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase">
                  ACCESS FILES <span className="text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,1)]">TELEGRAM LINK</span>
                </h2>
              </div>
              
              <div className="bg-black/20 backdrop-blur-md border border-emerald-500/40 rounded-2xl p-5 shadow-[0_4px_25px_rgba(16,185,129,0.2)]  flex flex-col gap-4 text-left">
                <p className="text-gray-300 text-xs font-medium bg-emerald-950/40 border border-emerald-500/30 p-3.5 rounded-xl">
                  Jab koi user <strong className="text-emerald-400">"My Key"</strong> (Delivery/Purchased Key) page me sabse niche <strong className="text-emerald-400">"ACCESS FILES"</strong> button par click karega, toh user direct yahan set kiye gaye Telegram link par chala jayega.
                </p>

                <div className="flex flex-col gap-1.5 bg-black/20 backdrop-blur-md p-3.5 rounded-xl border border-emerald-500/30">
                  <label className="text-emerald-400 font-black text-xs uppercase flex items-center gap-1.5">
                    <Send size={16} /> ACCESS FILES TELEGRAM LINK
                  </label>
                  <input
                    type="text"
                    placeholder="https://t.me/yourchannel"
                    value={accessFileSteps.directFileUrl}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAccessFileSteps(prev => ({ ...prev, directFileUrl: val, step2Url: val }));
                    }}
                    className="w-full bg-black/20 backdrop-blur-md border border-white/20 rounded-lg py-3 px-3 text-sm font-bold text-white focus:outline-none focus:border-emerald-400 transition-all"
                  />
                </div>

                <button 
                  onClick={() => { 
                    const formattedUrl = formatExternalUrl(accessFileSteps.directFileUrl) || 'https://t.me/yourchannel';
                    const updated = { ...accessFileSteps, directFileUrl: formattedUrl, step2Url: formattedUrl };
                    setAccessFileSteps(updated);
                    localStorage.setItem('app_accessFileSteps', JSON.stringify(updated));
                    alert('‚úÖ ACCESS FILES Telegram Link successfully save ho gaya!'); 
                    setCurrentView('admin'); 
                  }} 
                  className="w-full mt-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-black py-3.5 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-2 active:scale-95"
                >
                  <Save size={16} /> SAVE TELEGRAM LINK
                </button>
              </div>
            </div>
          )}

          {/* DEDICATED STAFF PANEL (PASSWORD: PREM74) */}
          {currentView === 'staff' && (
            <div className="flex flex-col gap-5 w-full animate-in fade-in zoom-in-95 duration-300 relative z-10 mt-2 bg-black/20 backdrop-blur-xl rounded-3xl p-5 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              {/* Staff Header */}
              <div className="flex flex-col gap-3 bg-black/20 backdrop-blur-md border border-fuchsia-500/40 p-4 rounded-2xl shadow-[0_0_30px_rgba(217,70,239,0.25)]  text-left">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setCurrentView('home')} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors ">
                      <ArrowLeft size={20} className="text-white" />
                    </button>
                    <div>
                      <h2 className="text-2xl font-black tracking-tight italic drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase">
                        STAFF <span className="text-fuchsia-400 drop-shadow-[0_0_15px_rgba(217,70,239,1)]">PANEL</span>
                      </h2>
                      <span className="text-[10px] font-bold text-fuchsia-300 bg-fuchsia-500/20 px-2.5 py-0.5 rounded-full border border-fuchsia-500/30 uppercase tracking-widest inline-block mt-0.5">
                        üõ°Ô∏è AUTHORIZED STAFF PORTAL (PASS: PREM74)
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setCurrentView('home'); alert("Staff Panel closed."); }}
                    className="px-3.5 py-1.5 bg-red-500/20 hover:bg-red-500/40 border border-red-500/40 rounded-xl text-red-300 text-xs font-black uppercase transition-all"
                  >
                    EXIT
                  </button>
                </div>

                {/* DSLR Top Metric Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mt-1">
                  <div className="bg-black/20 backdrop-blur-md border border-purple-500/30 p-3 rounded-xl flex flex-col items-center justify-center text-center shadow-lg">
                    <User size={20} className="text-purple-400 mb-1" />
                    <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Total Users</span>
                    <span className="text-white font-black text-lg">{ensureArray(registeredUsers).length}</span>
                  </div>
                  <div className="bg-black/20 backdrop-blur-md border border-emerald-500/30 p-3 rounded-xl flex flex-col items-center justify-center text-center shadow-lg">
                    <Wallet size={20} className="text-emerald-400 mb-1" />
                    <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Total Revenue</span>
                    <span className="text-emerald-400 font-black text-lg">‚Çπ{ensureArray(paymentHistory).filter(p => p.status === 'SUCCESS').reduce((acc, curr) => acc + (curr.amount || 0), 0)}</span>
                  </div>
                  <div className="bg-black/20 backdrop-blur-md border border-cyan-500/30 p-3 rounded-xl flex flex-col items-center justify-center text-center shadow-lg">
                    <LayoutDashboard size={20} className="text-cyan-400 mb-1" />
                    <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Active Panels</span>
                    <span className="text-cyan-300 font-black text-lg">{ensureArray(panels).length}</span>
                  </div>
                  <div className="bg-black/20 backdrop-blur-md border border-amber-500/30 p-3 rounded-xl flex flex-col items-center justify-center text-center shadow-lg">
                    <Hourglass size={20} className="text-amber-400 mb-1" />
                    <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Pending Fund</span>
                    <span className="text-amber-400 font-black text-lg">{ensureArray(paymentHistory).filter(p => p.status === 'PENDING').length}</span>
                  </div>
                </div>

                {/* Staff DSLR Tab Bar */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 mt-1 no-scrollbar">
                  {[
                    { id: 'overview', label: 'üìä OVERVIEW', color: 'from-fuchsia-600 to-purple-600' },
                    { id: 'emailKey', label: 'üìß EMAIL KEY (EMAILJS)', color: 'from-blue-600 to-indigo-600' },
                    { id: 'resellers', label: `üõ°Ô∏è RESELLERS (${ensureArray(approvedResellers).length})`, color: 'from-amber-500 to-yellow-600' },
                    { id: 'addPanel', label: '‚ûï ADD PANEL', color: 'from-pink-500 to-fuchsia-600' },
                    { id: 'house', label: 'üè† HOUSE PANEL (24GHANTA)', color: 'from-amber-500 to-orange-600' },
                    { id: 'managePanels', label: 'üóëÔ∏è MANAGE PANELS', color: 'from-red-500 to-rose-600' },
                    { id: 'supportLinks', label: 'üí¨ SUPPORT LINKS', color: 'from-sky-500 to-blue-600' },
                    { id: 'users', label: `üë• USERS (${ensureArray(registeredUsers).length})`, color: 'from-purple-500 to-indigo-600' },
                    { id: 'payments', label: `üí∞ PAYMENTS (${ensureArray(paymentHistory).length})`, color: 'from-emerald-500 to-teal-600' },
                    { id: 'pendingKeys', label: `‚è≥ PENDING KEYS (${ensureArray(keyRequests).filter(r => r.status === 'PENDING').length})`, color: 'from-amber-600 to-yellow-600' },
                  ].map((tab) => (
                    <button
                      key={`staff-tab-${tab.id}`}
                      onClick={() => setStaffTab(tab.id as any)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                        staffTab === tab.id
                          ? `bg-gradient-to-r ${tab.color} text-white shadow-[0_0_15px_rgba(217,70,239,0.5)] scale-105 border border-white/30`
                          : 'bg-black/50 text-gray-400 hover:text-white border border-white/10 hover:border-white/20'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* STAFF TAB 1: OVERVIEW */}
              {staffTab === 'overview' && (
                <div className="flex flex-col gap-4">
                  <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-2xl  flex flex-col gap-4 text-left">
                    <h3 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-wide">
                      <Sparkles size={18} className="text-fuchsia-400" /> STAFF CONTROL DASHBOARD
                    </h3>
                    <p className="text-gray-300 text-xs">
                      Yahan Staff Member website ke saare core features ko DSLR Quality controls ke saath handle kar sakte hain.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                      <button 
                        onClick={() => setStaffTab('emailKey')}
                        className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-indigo-500 p-4 rounded-xl text-white font-black text-sm uppercase flex items-center justify-between shadow-[0_0_20px_rgba(59,130,246,0.35)] transition-all hover:scale-[1.02] md:col-span-2 border border-blue-400/50"
                      >
                        <span className="flex items-center gap-2.5"><Mail size={20} className="text-blue-300" /> üìß Send Key via Email (EmailJS Direct Integration)</span>
                        <ArrowRight size={18} />
                      </button>
                      <button 
                        onClick={() => setStaffTab('refundPanel')}
                        className="bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 hover:from-red-500 hover:to-rose-500 p-4 rounded-xl text-white font-black text-sm uppercase flex items-center justify-between shadow-[0_0_20px_rgba(239,68,68,0.35)] transition-all hover:scale-[1.02] md:col-span-2 border border-red-400/50"
                      >
                        <span className="flex items-center gap-2.5"><X size={20} className="text-red-300" /> ‚ùå Reject & Refund Panel (EmailJS)</span>
                        <ArrowRight size={18} />
                      </button>

                      <button 
                        onClick={() => setStaffTab('resellers')}
                        className="bg-gradient-to-r from-amber-600 via-yellow-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 p-4 rounded-xl text-white font-black text-sm uppercase flex items-center justify-between shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all hover:scale-[1.02] md:col-span-2 border border-yellow-400/40"
                      >
                        <span className="flex items-center gap-2.5"><ShieldCheck size={20} className="text-yellow-300" /> üëë Reseller Admin Control & VIP Rates ({ensureArray(approvedResellers).length})</span>
                        <ArrowRight size={18} />
                      </button>

                      <button 
                        onClick={() => setStaffTab('addPanel')}
                        className="bg-gradient-to-r from-pink-600 to-fuchsia-600 hover:from-pink-500 hover:to-fuchsia-500 p-4 rounded-xl text-white font-black text-sm uppercase flex items-center justify-between shadow-[0_0_20px_rgba(217,70,239,0.3)] transition-all hover:scale-[1.02]"
                      >
                        <span className="flex items-center gap-2.5"><PlusCircle size={20} /> ‚ûï Add New Store Panel</span>
                        <ArrowRight size={18} />
                      </button>

                      <button 
                        onClick={() => setStaffTab('house')}
                        className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 p-4 rounded-xl text-white font-black text-sm uppercase flex items-center justify-between shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all hover:scale-[1.02]"
                      >
                        <span className="flex items-center gap-2.5"><Home size={20} /> üè† House / 24Ghanta Private Panel</span>
                        <ArrowRight size={18} />
                      </button>

                      <button 
                        onClick={() => setStaffTab('managePanels')}
                        className="bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 p-4 rounded-xl text-white font-black text-sm uppercase flex items-center justify-between shadow-[0_0_20px_rgba(244,63,94,0.3)] transition-all hover:scale-[1.02]"
                      >
                        <span className="flex items-center gap-2.5"><Trash2 size={20} /> üóëÔ∏è Delete & Edit Active Panels</span>
                        <ArrowRight size={18} />
                      </button>

                      <button 
                        onClick={() => setStaffTab('supportLinks')}
                        className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 p-4 rounded-xl text-white font-black text-sm uppercase flex items-center justify-between shadow-[0_0_20px_rgba(56,189,248,0.3)] transition-all hover:scale-[1.02]"
                      >
                        <span className="flex items-center gap-2.5"><Send size={20} /> üí¨ Set Telegram & WhatsApp Links</span>
                        <ArrowRight size={18} />
                      </button>

                      <button 
                        onClick={() => setStaffTab('users')}
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 p-4 rounded-xl text-white font-black text-sm uppercase flex items-center justify-between shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all hover:scale-[1.02]"
                      >
                        <span className="flex items-center gap-2.5"><User size={20} /> üë• All Registered Users ({registeredUsers.length})</span>
                        <ArrowRight size={18} />
                      </button>

                      <button 
                        onClick={() => setStaffTab('colorTheme')}
                        className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 p-4 rounded-xl text-white font-black text-sm uppercase flex items-center justify-between shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all hover:scale-[1.02]"
                      >
                        <span className="flex items-center gap-2.5"><Palette size={20} /> üé® Color Changes</span>
                        <ArrowRight size={18} />
                      </button>

                      <button 
                        onClick={() => setStaffTab('payments')}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 p-4 rounded-xl text-white font-black text-sm uppercase flex items-center justify-between shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all hover:scale-[1.02] md:col-span-2"
                      >
                        <span className="flex items-center gap-2.5"><Wallet size={20} /> üí∞ Money & Payments ("Kisne Kisne Paisa Lagaya")</span>
                        <ArrowRight size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STAFF TAB: RESELLERS & DIFFERENTIAL PRICING */}
              {staffTab === 'resellers' && (
                <div className="flex flex-col gap-4">
                  {/* Reseller Admin Header & Metrics */}
                  <div className="bg-black/20 backdrop-blur-md border border-amber-500/40 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="text-lg font-black text-amber-400 flex items-center gap-2 uppercase tracking-wide">
                          <ShieldCheck size={22} className="text-yellow-400" /> üëë RESELLER MANAGEMENT & VIP RATES
                        </h3>
                        <p className="text-gray-300 text-xs">
                          Yahan se aap Reseller Gmail IDs approve kar sakte hain, unka Wallet Balance manage kar sakte hain aur Special Reseller VIP Rates configure kar sakte hain.
                        </p>
                      </div>
                      <span className="bg-yellow-400 text-black font-black text-[11px] px-3 py-1 rounded-xl uppercase tracking-wider self-start shrink-0 shadow-md">
                        {ensureArray(approvedResellers).length} Resellers
                      </span>
                    </div>

                    {/* Reseller Summary Metrics */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      <div className="bg-black/40 border border-yellow-500/30 p-3 rounded-xl flex flex-col items-center justify-center text-center">
                        <Users size={18} className="text-yellow-400 mb-1" />
                        <span className="text-gray-400 text-[10px] font-bold uppercase">Total Resellers</span>
                        <span className="text-yellow-300 font-black text-base">{ensureArray(approvedResellers).length}</span>
                      </div>
                      <div className="bg-black/40 border border-emerald-500/30 p-3 rounded-xl flex flex-col items-center justify-center text-center">
                        <Wallet size={18} className="text-emerald-400 mb-1" />
                        <span className="text-gray-400 text-[10px] font-bold uppercase">Reseller Float</span>
                        <span className="text-emerald-400 font-black text-base">‚Çπ{ensureArray(approvedResellers).reduce((acc, curr) => acc + (Number(curr.balance) || 0), 0)}</span>
                      </div>
                      <div className="bg-black/40 border border-cyan-500/30 p-3 rounded-xl flex flex-col items-center justify-center text-center col-span-2 sm:col-span-1">
                        <Percent size={18} className="text-cyan-400 mb-1" />
                        <span className="text-gray-400 text-[10px] font-bold uppercase">Default VIP Discount</span>
                        <span className="text-cyan-300 font-black text-base">35% OFF (‚Çπ50 vs ‚Çπ90)</span>
                      </div>
                    </div>
                  </div>

                  {/* Add New Approved Reseller Form */}
                  <div className="bg-black/20 backdrop-blur-md border border-amber-500/30 rounded-2xl p-5 shadow-xl flex flex-col gap-3 text-left">
                    <h4 className="text-sm font-black text-white uppercase flex items-center gap-2">
                      <PlusCircle size={18} className="text-amber-400" /> ‚ûï Add / Approve New Reseller Gmail
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-amber-300 text-xs font-bold block mb-1">Reseller Gmail ID (Google Account) *</label>
                        <input
                          type="email"
                          placeholder="e.g., pramk9992@gmail.com"
                          value={newResellerForm.email}
                          onChange={(e) => setNewResellerForm({ ...newResellerForm, email: e.target.value })}
                          className="w-full bg-black/40 border border-white/20 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="text-amber-300 text-xs font-bold block mb-1">Reseller Name / Business</label>
                        <input
                          type="text"
                          placeholder="e.g., Pramod VIP Reseller"
                          value={newResellerForm.name}
                          onChange={(e) => setNewResellerForm({ ...newResellerForm, name: e.target.value })}
                          className="w-full bg-black/40 border border-white/20 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="text-amber-300 text-xs font-bold block mb-1">Contact Mobile Number</label>
                        <input
                          type="text"
                          placeholder="e.g., 9876543210"
                          value={newResellerForm.phone}
                          onChange={(e) => setNewResellerForm({ ...newResellerForm, phone: e.target.value })}
                          className="w-full bg-black/40 border border-white/20 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="text-amber-300 text-xs font-bold block mb-1">Initial Wallet Balance (‚Çπ)</label>
                        <input
                          type="number"
                          placeholder="500"
                          value={newResellerForm.balance}
                          onChange={(e) => setNewResellerForm({ ...newResellerForm, balance: Number(e.target.value) })}
                          className="w-full bg-black/40 border border-white/20 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const emailVal = newResellerForm.email.toLowerCase().trim();
                        if (!emailVal || !emailVal.includes('@')) {
                          alert("Kripya valid Gmail ID enter karein!");
                          return;
                        }
                        const existingIdx = approvedResellers.findIndex(r => r.email.toLowerCase() === emailVal);
                        if (existingIdx !== -1) {
                          alert("Yeh Gmail ID pehle se Approved Resellers list mein mojud hai!");
                          return;
                        }

                        const newObj = {
                          email: emailVal,
                          name: newResellerForm.name || 'VIP Reseller',
                          phone: newResellerForm.phone || '',
                          balance: Number(newResellerForm.balance) || 0,
                          isApproved: true,
                          discountPercent: 35,
                          createdAt: new Date().toLocaleString()
                        };

                        setApprovedResellers(prev => [newObj, ...prev]);
                        alert(`‚úÖ Reseller "${emailVal}" successfully Approved with ‚Çπ${newObj.balance} Wallet Balance!`);
                        setNewResellerForm({ email: '', name: '', phone: '', balance: 500, isApproved: true });
                      }}
                      className="mt-2 w-full bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black py-3 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-2 active:scale-95"
                    >
                      <ShieldCheck size={18} /> ‚ûï APPROVE & ADD RESELLER TO DATABASE
                    </button>
                  </div>

                  {/* Resellers Search & List */}
                  <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-xl flex flex-col gap-3 text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h4 className="text-sm font-black text-white uppercase flex items-center gap-2">
                        <Users size={18} className="text-cyan-400" /> Approved Resellers List ({ensureArray(approvedResellers).length})
                      </h4>
                      <input
                        type="text"
                        placeholder="Search reseller by email / name..."
                        value={searchResellerQuery}
                        onChange={(e) => setSearchResellerQuery(e.target.value)}
                        className="bg-black/40 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 w-full sm:w-64"
                      />
                    </div>

                    <div className="flex flex-col gap-2.5 mt-1">
                      {ensureArray(approvedResellers).filter(r => {
                        const q = searchResellerQuery.toLowerCase().trim();
                        return !q || r.email.toLowerCase().includes(q) || (r.name && r.name.toLowerCase().includes(q));
                      }).map((reseller, rIdx) => (
                        <div key={`reseller-row-${reseller.email}-${rIdx}`} className="bg-black/40 border border-yellow-500/30 rounded-xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md hover:border-yellow-400/60 transition-all">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-yellow-500/20 border border-yellow-400/50 flex items-center justify-center shrink-0">
                              <Award className="text-yellow-400" size={22} />
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="text-white font-black text-sm">{reseller.name || 'VIP Reseller'}</span>
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
                              <span className="text-xs text-yellow-300 font-mono select-all">{reseller.email}</span>
                              <span className="text-[10px] text-gray-400">
                                {reseller.phone ? `Phone: ${reseller.phone} ‚Ä¢ ` : ''}Added: {reseller.createdAt || 'Active'}
                              </span>
                            </div>
                          </div>

                          {/* Wallet Controls & Actions */}
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Wallet Balance Tag */}
                            <div className="bg-black/60 border border-emerald-500/40 px-3 py-1.5 rounded-xl flex items-center gap-2">
                              <span className="text-[10px] text-gray-400 font-bold uppercase">Balance:</span>
                              <span className="text-emerald-400 font-black text-sm font-mono">‚Çπ{reseller.balance}</span>
                            </div>

                            {/* Quick Add Funds */}
                            <div className="flex items-center gap-1">
                              {[100, 500, 1000].map(addAmt => (
                                <button
                                  key={`add-${reseller.email}-${addAmt}`}
                                  onClick={() => {
                                    const newBal = (Number(reseller.balance) || 0) + addAmt;
                                    setApprovedResellers(prev => prev.map(r => r.email.toLowerCase() === reseller.email.toLowerCase() ? { ...r, balance: newBal } : r));
                                    if (resellerUser.email.toLowerCase() === reseller.email.toLowerCase()) {
                                      setResellerUser(prev => ({ ...prev, balance: newBal }));
                                    }
                                    alert(`‚úÖ +‚Çπ${addAmt} added to ${reseller.email}'s wallet! New Balance: ‚Çπ${newBal}`);
                                  }}
                                  className="bg-emerald-600/30 hover:bg-emerald-600/60 border border-emerald-500/40 text-emerald-300 font-black text-[10px] px-2 py-1.5 rounded-lg transition-all"
                                >
                                  +‚Çπ{addAmt}
                                </button>
                              ))}

                              {/* Custom Balance Button */}
                              <button
                                onClick={() => {
                                  const customVal = prompt(`Enter custom balance for ${reseller.email}:`, String(reseller.balance));
                                  if (customVal !== null && !isNaN(Number(customVal))) {
                                    const parsed = Math.max(0, Number(customVal));
                                    setApprovedResellers(prev => prev.map(r => r.email.toLowerCase() === reseller.email.toLowerCase() ? { ...r, balance: parsed } : r));
                                    if (resellerUser.email.toLowerCase() === reseller.email.toLowerCase()) {
                                      setResellerUser(prev => ({ ...prev, balance: parsed }));
                                    }
                                    alert(`‚úÖ Updated wallet balance for ${reseller.email} to ‚Çπ${parsed}`);
                                  }
                                }}
                                className="bg-cyan-600/30 hover:bg-cyan-600/60 border border-cyan-500/40 text-cyan-300 font-black text-[10px] px-2.5 py-1.5 rounded-lg transition-all"
                              >
                                Edit ‚Çπ
                              </button>
                            </div>

                            {/* Status Toggle */}
                            <button
                              onClick={() => {
                                const toggled = !reseller.isApproved;
                                setApprovedResellers(prev => prev.map(r => r.email.toLowerCase() === reseller.email.toLowerCase() ? { ...r, isApproved: toggled } : r));
                                if (resellerUser.email.toLowerCase() === reseller.email.toLowerCase()) {
                                  setResellerUser(prev => ({ ...prev, isApproved: toggled }));
                                }
                                alert(`Reseller status for ${reseller.email} updated to: ${toggled ? 'APPROVED' : 'DISABLED'}`);
                              }}
                              className={`text-[10px] font-black px-2.5 py-1.5 rounded-lg border transition-all ${
                                reseller.isApproved
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                              }`}
                            >
                              {reseller.isApproved ? 'Disable VIP' : 'Approve VIP'}
                            </button>

                            {/* Delete Reseller */}
                            <button
                              onClick={() => {
                                if (confirm(`Kya aap sach me ${reseller.email} ko Resellers list se delete karna chahte hain?`)) {
                                  setApprovedResellers(prev => prev.filter(r => r.email.toLowerCase() !== reseller.email.toLowerCase()));
                                  if (resellerUser.email.toLowerCase() === reseller.email.toLowerCase()) {
                                    setResellerUser({ isLoggedIn: false, email: '', name: '', balance: 0, isApproved: false });
                                  }
                                  alert(`Reseller ${reseller.email} deleted.`);
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
                        <div className="p-4 text-center text-gray-400 text-xs bg-black/40 rounded-xl border border-white/10">
                          Abhi koi Reseller add nahi hua hai. Upar diye gaye form se naya Reseller Gmail ID add karein.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Differential Pricing Rate Overview Table */}
                  <div className="bg-black/20 backdrop-blur-md border border-cyan-500/30 rounded-2xl p-5 shadow-xl flex flex-col gap-3 text-left">
                    <h4 className="text-sm font-black text-cyan-400 uppercase flex items-center gap-2">
                      <Percent size={18} /> Differential Pricing Matrix (Normal vs Reseller VIP Price)
                    </h4>
                    <p className="text-gray-300 text-xs">
                      Reseller ko har panel par Special VIP Rates (jaise ‚Çπ90 ke badle ‚Çπ50 ya 35% discount) automatically milta hai jab vah Google login ya Secret Code se login hota hai.
                    </p>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="border-b border-white/10 text-gray-400">
                            <th className="py-2 px-3 font-bold">Panel Name</th>
                            <th className="py-2 px-3 font-bold">Category</th>
                            <th className="py-2 px-3 font-bold">Normal Price</th>
                            <th className="py-2 px-3 font-bold text-yellow-300">üëë VIP Reseller Price</th>
                            <th className="py-2 px-3 font-bold text-emerald-400">Reseller Profit / Margin</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {panels.slice(0, 8).map((p, idx) => {
                            const p1 = p.pricing[0]?.price || 90;
                            const resP = (p.pricing[0] as any)?.resellerPrice !== undefined ? (p.pricing[0] as any).resellerPrice : Math.round(p1 * 0.65);
                            const margin = p1 - resP;
                            return (
                              <tr key={`diff-price-${p.id}-${idx}`} className="hover:bg-white/5">
                                <td className="py-2 px-3 font-bold text-white">{p.title}</td>
                                <td className="py-2 px-3 text-cyan-300">{p.category}</td>
                                <td className="py-2 px-3 line-through text-gray-400">‚Çπ{p1} ({p.pricing[0]?.label || '1 Day'})</td>
                                <td className="py-2 px-3 font-black text-yellow-300 font-mono">‚Çπ{resP}</td>
                                <td className="py-2 px-3 font-bold text-emerald-400">+‚Çπ{margin} ({(margin / p1 * 100).toFixed(0)}% Profit)</td>
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
              {staffTab === 'colorTheme' && (
                <div className="flex flex-col gap-4">
                  <div className="bg-black/20 backdrop-blur-md border border-cyan-500/40 rounded-2xl p-5 shadow-2xl flex flex-col gap-5 text-left">
                    <h3 className="text-lg font-black text-cyan-400 flex items-center gap-2 uppercase tracking-wide">
                      <Palette size={20} /> üé® Theme Color Changes
                    </h3>
                    <p className="text-gray-300 text-xs">
                      Yahan se aap website ka rang (color theme) apne hisaab se badal sakte hain. Niche diye gaye 7 rangon mein se koi ek chunein.
                    </p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                      {[
                        { name: 'Pink / Fuchsia', hue: 0, colorClass: 'bg-pink-500' },
                        { name: 'Red Theme', hue: 60, colorClass: 'bg-red-500' },
                        { name: 'Orange Theme', hue: 90, colorClass: 'bg-orange-500' },
                        { name: 'Yellow Theme', hue: 120, colorClass: 'bg-yellow-500' },
                        { name: 'Green Theme', hue: 180, colorClass: 'bg-green-500' },
                        { name: 'Cyan Theme', hue: 240, colorClass: 'bg-cyan-500' },
                        { name: 'Blue Theme', hue: 280, colorClass: 'bg-blue-500' },
                        { name: 'Purple Theme', hue: 330, colorClass: 'bg-purple-500' },
                      ].map(theme => (
                        <button
                          key={`theme-${theme.name}`}
                          onClick={() => setBgSettings({ ...bgSettings, themeHue: theme.hue })}
                          className={`relative p-3 rounded-xl font-bold text-xs uppercase transition-all duration-300 border-2 overflow-hidden flex flex-col items-center gap-2
                            ${bgSettings.themeHue === theme.hue ? 'border-white scale-105 shadow-[0_0_20px_rgba(255,255,255,0.4)]' : 'border-transparent hover:border-white/30 hover:scale-105'}
                          `}
                        >
                          <div className={`w-8 h-8 rounded-full ${theme.colorClass} shadow-inner border border-white/20`} />
                          <span className="text-white z-10 text-center leading-tight">{theme.name}</span>
                          {bgSettings.themeHue === theme.hue && (
                            <div className="absolute inset-0 bg-white/10 z-0"></div>
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="mt-2 text-center text-[10px] text-gray-400 italic">
                      Note: Rang badalne par website ka global gradient aur buttons ka color change ho jayega.
                    </div>
                  </div>
                </div>
              )}

              {/* STAFF TAB 2: ADD PANEL */}
              {staffTab === 'addPanel' && (
                <div className="bg-black/20 backdrop-blur-md border border-fuchsia-500/40 rounded-2xl p-5 shadow-2xl  flex flex-col gap-4 text-left">
                  <h3 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-wide">
                    <PlusCircle size={20} className="text-fuchsia-400" /> ‚ûï ADD NEW PANEL TO STORE
                  </h3>
                  <p className="text-gray-300 text-xs">
                    Is form me naye panel ki puri details enter karke direct website store par add kar sakte hain.
                  </p>

                  <div className="flex flex-col gap-3 bg-black/50 p-4 rounded-xl border border-white/10">
                    <div>
                      <label className="text-fuchsia-400 font-bold text-xs uppercase block mb-1">PANEL TITLE</label>
                      <input
                        type="text"
                        placeholder="e.g., DRIPCLIENT FF NONROOT"
                        value={newPanelForm.title}
                        onChange={(e) => setNewPanelForm({ ...newPanelForm, title: e.target.value })}
                        className="w-full bg-black/20 backdrop-blur-md border border-white/20 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-fuchsia-400"
                      />
                    </div>

                    <div>
                      <label className="text-fuchsia-400 font-bold text-xs uppercase block mb-1">CATEGORY</label>
                      <select
                        value={newPanelForm.category}
                        onChange={(e) => setNewPanelForm({ ...newPanelForm, category: e.target.value })}
                        className="w-full bg-black/20 backdrop-blur-md border border-white/20 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-fuchsia-400"
                      >
                        <option value="NON ROOT">NON ROOT</option>
                        <option value="24ghanta">24ghanta / HOUSE</option>
                        <option value="ROOT">ROOT</option>
                        <option value="ANDROID">ANDROID</option>
                        <option value="IOS">IOS</option>
                        <option value="FREE FIRE">FREE FIRE</option>
                        <option value="SPECIAL">SPECIAL</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-fuchsia-400 font-bold text-xs uppercase block mb-1">IMAGE / VIDEO THUMBNAIL URL OR UPLOAD</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Image or Video Thumbnail URL..."
                          value={newPanelForm.image}
                          onChange={(e) => setNewPanelForm({ ...newPanelForm, image: e.target.value })}
                          className="flex-1 bg-black/20 backdrop-blur-md border border-white/20 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-fuchsia-400"
                        />
                        <label className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-bold px-3 py-2.5 rounded-xl cursor-pointer flex items-center gap-1 shrink-0">
                          {isUploadingMedia ? (
                            <span className="flex items-center gap-1 text-xs animate-pulse">
                              <Loader2 className="animate-spin" size={14} /> Uploading...
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
                                    processAsyncMediaUpload(file, () => setIsUploadingMedia(true), (url, isVideo) => {
                                      setNewPanelForm(prev => ({ ...prev, image: url, isVideo }));
                                      setIsUploadingMedia(false);
                                    });
                                  }
                                }}
                              />
                            </>
                          )}
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="text-fuchsia-400 font-bold text-xs uppercase block mb-1">PANEL FEATURES (1 Feature Per Line)</label>
                      <textarea
                        rows={4}
                        placeholder="Main Id safe&#10;Full safe NONROOT&#10;Esp crack anti-blacklist&#10;Auto headshot 100% working"
                        value={newPanelForm.featuresText}
                        onChange={(e) => setNewPanelForm({ ...newPanelForm, featuresText: e.target.value })}
                        className="w-full bg-black/20 backdrop-blur-md border border-white/20 rounded-xl py-2.5 px-3 text-xs font-mono text-white focus:outline-none focus:border-fuchsia-400"
                      />
                    </div>

                    <div className="bg-black/20 backdrop-blur-md border border-white/10 p-3 rounded-xl">
                      <label className="text-fuchsia-400 font-bold text-xs uppercase block mb-2">PRICING DETAILS (‚Çπ)</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-gray-400 block mb-0.5">1 Day</span>
                          <input type="number" value={newPanelForm.price1} onChange={(e) => setNewPanelForm({ ...newPanelForm, price1: Number(e.target.value) })} className="w-full bg-black/20 backdrop-blur-md border border-white/20 rounded-lg p-2 text-white" />
                        </div>
                        <div>
                          <span className="text-gray-400 block mb-0.5">3 Day</span>
                          <input type="number" value={newPanelForm.price3} onChange={(e) => setNewPanelForm({ ...newPanelForm, price3: Number(e.target.value) })} className="w-full bg-black/20 backdrop-blur-md border border-white/20 rounded-lg p-2 text-white" />
                        </div>
                        <div>
                          <span className="text-gray-400 block mb-0.5">7 Day</span>
                          <input type="number" value={newPanelForm.price7} onChange={(e) => setNewPanelForm({ ...newPanelForm, price7: Number(e.target.value) })} className="w-full bg-black/20 backdrop-blur-md border border-white/20 rounded-lg p-2 text-white" />
                        </div>
                        <div>
                          <span className="text-gray-400 block mb-0.5">15 Day</span>
                          <input type="number" value={newPanelForm.price15} onChange={(e) => setNewPanelForm({ ...newPanelForm, price15: Number(e.target.value) })} className="w-full bg-black/20 backdrop-blur-md border border-white/20 rounded-lg p-2 text-white" />
                        </div>
                        <div>
                          <span className="text-gray-400 block mb-0.5">30 Day</span>
                          <input type="number" value={newPanelForm.price30} onChange={(e) => setNewPanelForm({ ...newPanelForm, price30: Number(e.target.value) })} className="w-full bg-black/20 backdrop-blur-md border border-white/20 rounded-lg p-2 text-white" />
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const parsedFeatures = newPanelForm.featuresText
                          ? newPanelForm.featuresText.split('\n').map(f => f.trim()).filter(Boolean)
                          : ["Main Id safe", "Full safe NONROOT", "Esp crack anti-blacklist", "Auto headshot 100% working"];

                        setPanels(prev => [{
                          id: Date.now(),
                          title: newPanelForm.title || "STAFF PANEL NEW",
                          category: newPanelForm.category || "NON ROOT",
                          thumbnailTitle: newPanelForm.title || "STAFF PANEL NEW",
                          thumbnailSub: "PREMIUM PANELS",
                          image: newPanelForm.image || "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop",
                          isVideo: newPanelForm.isVideo,
                          features: parsedFeatures,
                          installLink: supportLinks.telegram,
                          videoLink: newPanelForm.videoLink || supportLinks.telegram,
                          exceptFileLink: newPanelForm.exceptFileLink || supportLinks.telegram,
                          pricing: [
                            { label: "1 Day", price: newPanelForm.price1 },
                            { label: "3 Day", price: newPanelForm.price3 },
                            { label: "7 Day", price: newPanelForm.price7 },
                            { label: "15 Day", price: newPanelForm.price15 },
                            { label: "30 Day", price: newPanelForm.price30 }
                          ]
                        }, ...prev]);

                        alert("‚úÖ Staff Member: Naya Panel Store par Successfully Add ho gaya hai!");
                        setNewPanelForm({ title: '', category: 'NON ROOT', image: '', isVideo: false, videoLink: '', exceptFileLink: '', featuresText: "Main Id safe\nFull safe NONROOT\nEsp crack anti-blacklist\nAuto headshot 100% working", price1: 90, price3: 58, price7: 67, price15: 590, price30: 5000 });
                        setStaffTab('managePanels');
                      }}
                      className="mt-2 w-full bg-gradient-to-r from-fuchsia-600 via-purple-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white font-black py-3.5 rounded-xl shadow-[0_0_25px_rgba(217,70,239,0.5)] transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-2 active:scale-95"
                    >
                      <PlusCircle size={18} /> ‚ûï SAVE & ADD PANEL TO STORE
                    </button>
                  </div>
                </div>
              )}

              {/* STAFF TAB: HOUSE / 24GHANTA PRIVATE PANEL */}
              {staffTab === 'house' && (
                <div className="bg-black/20 backdrop-blur-md border border-amber-500/40 rounded-2xl p-5 shadow-2xl  flex flex-col gap-4 text-left">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-wide">
                      <Home size={20} className="text-amber-400" /> üè† HOUSE / 24GHANTA PRIVATE LIMITED PANEL
                    </h3>
                    <p className="text-gray-300 text-xs">
                      Is section me private limited panels add karein jisme Hourly (House) pricing aur dedicated Telegram & WhatsApp links add honge.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 bg-black/20 backdrop-blur-md p-4 rounded-xl border border-amber-500/30">
                    <div>
                      <label className="text-amber-400 font-bold text-xs uppercase block mb-1">PANEL TITLE</label>
                      <input
                        type="text"
                        placeholder="e.g., PRIVATE LIMITED 24GHANTA HOUSE PANEL"
                        value={housePanelForm.title}
                        onChange={(e) => setHousePanelForm({ ...housePanelForm, title: e.target.value })}
                        className="w-full bg-black/20 backdrop-blur-md border border-white/20 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-amber-400 font-bold text-xs uppercase block mb-1">CATEGORY (Store Search Target)</label>
                        <select
                          value={housePanelForm.category}
                          onChange={(e) => setHousePanelForm({ ...housePanelForm, category: e.target.value })}
                          className="w-full bg-black/20 backdrop-blur-md border border-white/20 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-amber-400"
                        >
                          <option value="24ghanta">24ghanta (Default Search Category)</option>
                          <option value="HOUSE">HOUSE</option>
                          <option value="NON ROOT">NON ROOT</option>
                          <option value="ROOT">ROOT</option>
                          <option value="SPECIAL">SPECIAL</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-amber-400 font-bold text-xs uppercase block mb-1">IMAGE / THUMBNAIL URL OR UPLOAD</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Thumbnail URL..."
                            value={housePanelForm.image}
                            onChange={(e) => setHousePanelForm({ ...housePanelForm, image: e.target.value })}
                            className="flex-1 bg-black/20 backdrop-blur-md border border-white/20 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-amber-400"
                          />
                          <label className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-3 py-2.5 rounded-xl cursor-pointer flex items-center gap-1 shrink-0">
                            {isUploadingMedia ? (
                              <span className="flex items-center gap-1 text-xs animate-pulse">
                                <Loader2 className="animate-spin" size={14} /> Uploading...
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
                                      processAsyncMediaUpload(file, () => setIsUploadingMedia(true), (url, isVideo) => {
                                        setHousePanelForm(prev => ({ ...prev, image: url, isVideo }));
                                        setIsUploadingMedia(false);
                                      });
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
                    <div className="bg-black/20 backdrop-blur-md border border-white/10 p-3.5 rounded-xl flex flex-col gap-3">
                      <span className="text-xs font-black text-amber-300 uppercase tracking-wide">üí¨ DEDICATED PRIVATE SUPPORT LINKS (SPECIAL TELEGRAM & WHATSAPP)</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-sky-400 text-[11px] font-bold block mb-1">Telegram Link (Private Channel / Support)</label>
                          <input
                            type="text"
                            placeholder="https://t.me/your_private_channel"
                            value={housePanelForm.telegramLink}
                            onChange={(e) => setHousePanelForm({ ...housePanelForm, telegramLink: e.target.value })}
                            className="w-full bg-black border border-white/20 rounded-lg p-2 text-xs text-white focus:border-sky-400"
                          />
                        </div>
                        <div>
                          <label className="text-green-400 text-[11px] font-bold block mb-1">WhatsApp Link (Private Support)</label>
                          <input
                            type="text"
                            placeholder="https://wa.me/your_number"
                            value={housePanelForm.whatsappLink}
                            onChange={(e) => setHousePanelForm({ ...housePanelForm, whatsappLink: e.target.value })}
                            className="w-full bg-black border border-white/20 rounded-lg p-2 text-xs text-white focus:border-green-400"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Demo Video Link */}
                    <div>
                      <label className="text-amber-400 font-bold text-xs uppercase block mb-1">DEMO / FEEDBACK VIDEO LINK (YOUTUBE)</label>
                      <input
                        type="text"
                        placeholder="https://youtube.com/watch?v=... or shorts URL"
                        value={housePanelForm.videoLink}
                        onChange={(e) => setHousePanelForm({ ...housePanelForm, videoLink: e.target.value })}
                        className="w-full bg-black/20 backdrop-blur-md border border-white/20 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    {/* Features Text Area */}
                    <div>
                      <label className="text-amber-400 font-bold text-xs uppercase block mb-1">PANEL FEATURES (1 Feature Per Line)</label>
                      <textarea
                        rows={3}
                        placeholder="Private Limited Main ID Safe&#10;Full safe 24ghanta&#10;Anti-blacklist ESP & Headshot&#10;100% Working Private Panel"
                        value={housePanelForm.featuresText}
                        onChange={(e) => setHousePanelForm({ ...housePanelForm, featuresText: e.target.value })}
                        className="w-full bg-black/20 backdrop-blur-md border border-white/20 rounded-xl py-2.5 px-3 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    {/* HOURLY / HOUSE PRICING SECTION (3 house: 149, 7 house: 230, 15 house: 280, 24 house: 399) */}
                    <div className="bg-black/20 backdrop-blur-md border border-amber-500/40 p-3.5 rounded-xl flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-amber-400 font-black text-xs uppercase flex items-center gap-1.5">
                          <Clock size={16} /> ‚è±Ô∏è HOURLY / HOUSE PRICING (PRICE IN ‚Çπ)
                        </span>
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
                          <input
                            type="checkbox"
                            checked={housePanelForm.includeHours}
                            onChange={(e) => setHousePanelForm({ ...housePanelForm, includeHours: e.target.checked })}
                            className="accent-amber-500"
                          />
                          Include Hourly Prices
                        </label>
                      </div>

                      {housePanelForm.includeHours && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mt-1">
                          <div className="bg-black/20 backdrop-blur-md p-2 rounded-lg border border-white/10">
                            <span className="text-amber-300 font-bold block mb-1">3 House (3 Hrs)</span>
                            <input
                              type="number"
                              value={housePanelForm.price3h}
                              onChange={(e) => setHousePanelForm({ ...housePanelForm, price3h: Number(e.target.value) })}
                              className="w-full bg-black border border-white/20 rounded p-1.5 text-white font-bold"
                            />
                          </div>
                          <div className="bg-black/20 backdrop-blur-md p-2 rounded-lg border border-white/10">
                            <span className="text-amber-300 font-bold block mb-1">7 House (7 Hrs)</span>
                            <input
                              type="number"
                              value={housePanelForm.price7h}
                              onChange={(e) => setHousePanelForm({ ...housePanelForm, price7h: Number(e.target.value) })}
                              className="w-full bg-black border border-white/20 rounded p-1.5 text-white font-bold"
                            />
                          </div>
                          <div className="bg-black/20 backdrop-blur-md p-2 rounded-lg border border-white/10">
                            <span className="text-amber-300 font-bold block mb-1">15 House (15 Hrs)</span>
                            <input
                              type="number"
                              value={housePanelForm.price15h}
                              onChange={(e) => setHousePanelForm({ ...housePanelForm, price15h: Number(e.target.value) })}
                              className="w-full bg-black border border-white/20 rounded p-1.5 text-white font-bold"
                            />
                          </div>
                          <div className="bg-black/20 backdrop-blur-md p-2 rounded-lg border border-white/10">
                            <span className="text-amber-300 font-bold block mb-1">24 House (24 Hrs)</span>
                            <input
                              type="number"
                              value={housePanelForm.price24h}
                              onChange={(e) => setHousePanelForm({ ...housePanelForm, price24h: Number(e.target.value) })}
                              className="w-full bg-black border border-white/20 rounded p-1.5 text-white font-bold"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* DAILY PRICING SECTION */}
                    <div className="bg-black/20 backdrop-blur-md border border-white/10 p-3.5 rounded-xl flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-cyan-400 font-black text-xs uppercase flex items-center gap-1.5">
                          üìÖ DAILY PRICING (DAYS OPTION)
                        </span>
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
                          <input
                            type="checkbox"
                            checked={housePanelForm.includeDays}
                            onChange={(e) => setHousePanelForm({ ...housePanelForm, includeDays: e.target.checked })}
                            className="accent-cyan-500"
                          />
                          Include Daily Prices
                        </label>
                      </div>

                      {housePanelForm.includeDays && (
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs mt-1">
                          <div>
                            <span className="text-gray-400 block mb-0.5">1 Day</span>
                            <input type="number" value={housePanelForm.price1d} onChange={(e) => setHousePanelForm({ ...housePanelForm, price1d: Number(e.target.value) })} className="w-full bg-black border border-white/20 rounded p-1.5 text-white" />
                          </div>
                          <div>
                            <span className="text-gray-400 block mb-0.5">3 Day</span>
                            <input type="number" value={housePanelForm.price3d} onChange={(e) => setHousePanelForm({ ...housePanelForm, price3d: Number(e.target.value) })} className="w-full bg-black border border-white/20 rounded p-1.5 text-white" />
                          </div>
                          <div>
                            <span className="text-gray-400 block mb-0.5">7 Day</span>
                            <input type="number" value={housePanelForm.price7d} onChange={(e) => setHousePanelForm({ ...housePanelForm, price7d: Number(e.target.value) })} className="w-full bg-black border border-white/20 rounded p-1.5 text-white" />
                          </div>
                          <div>
                            <span className="text-gray-400 block mb-0.5">15 Day</span>
                            <input type="number" value={housePanelForm.price15d} onChange={(e) => setHousePanelForm({ ...housePanelForm, price15d: Number(e.target.value) })} className="w-full bg-black border border-white/20 rounded p-1.5 text-white" />
                          </div>
                          <div>
                            <span className="text-gray-400 block mb-0.5">30 Day</span>
                            <input type="number" value={housePanelForm.price30d} onChange={(e) => setHousePanelForm({ ...housePanelForm, price30d: Number(e.target.value) })} className="w-full bg-black border border-white/20 rounded p-1.5 text-white" />
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const parsedFeatures = housePanelForm.featuresText
                          ? housePanelForm.featuresText.split('\n').map(f => f.trim()).filter(Boolean)
                          : ["Private Limited Main ID Safe", "Full safe 24ghanta", "Anti-blacklist ESP & Headshot", "100% Working Private Panel"];

                        const pricingList: { label: string; price: number }[] = [];
                        if (housePanelForm.includeHours) {
                          pricingList.push(
                            { label: "3 House", price: Number(housePanelForm.price3h) || 149 },
                            { label: "7 House", price: Number(housePanelForm.price7h) || 230 },
                            { label: "15 House", price: Number(housePanelForm.price15h) || 280 },
                            { label: "24 House", price: Number(housePanelForm.price24h) || 399 }
                          );
                        }
                        if (housePanelForm.includeDays) {
                          pricingList.push(
                            { label: "1 Day", price: Number(housePanelForm.price1d) || 499 },
                            { label: "3 Day", price: Number(housePanelForm.price3d) || 999 },
                            { label: "7 Day", price: Number(housePanelForm.price7d) || 1499 },
                            { label: "15 Day", price: Number(housePanelForm.price15d) || 2499 },
                            { label: "30 Day", price: Number(housePanelForm.price30d) || 4999 }
                          );
                        }

                        const newHousePanel = {
                          id: Date.now(),
                          title: housePanelForm.title || "PRIVATE LIMITED 24GHANTA PANEL",
                          category: housePanelForm.category || "24ghanta",
                          thumbnailTitle: housePanelForm.title || "PRIVATE LIMITED 24GHANTA PANEL",
                          thumbnailSub: "24GHANTA PRIVATE LIMITED",
                          image: housePanelForm.image || "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop",
                          isVideo: housePanelForm.isVideo,
                          features: parsedFeatures,
                          installLink: housePanelForm.telegramLink || supportLinks.telegram,
                          videoLink: housePanelForm.videoLink || supportLinks.telegram,
                          exceptFileLink: housePanelForm.whatsappLink || supportLinks.whatsapp,
                          pricing: pricingList.length > 0 ? pricingList : [
                            { label: "3 House", price: 149 },
                            { label: "7 House", price: 230 },
                            { label: "15 House", price: 280 },
                            { label: "24 House", price: 399 }
                          ]
                        };

                        setPanels(prev => [newHousePanel, ...prev]);

                        alert("‚úÖ 24Ghanta / House Private Panel successfully store par publish ho gaya hai! Website me 24ghanta category button click ya search karne par yah open hoga.");
                        setStaffTab('managePanels');
                      }}
                      className="mt-2 w-full bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 hover:from-amber-400 hover:to-red-500 text-white font-black py-3.5 rounded-xl shadow-[0_0_25px_rgba(245,158,11,0.5)] transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-2 active:scale-95"
                    >
                      <PlusCircle size={18} /> üöÄ PUBLISH 24GHANTA HOUSE PANEL TO STORE
                    </button>
                  </div>
                </div>
              )}

              {/* STAFF TAB 3: MANAGE / DELETE PANELS */}
              {staffTab === 'managePanels' && (
                <div className="flex flex-col gap-4 text-left">
                  <div className="bg-black/20 backdrop-blur-md border border-red-500/40 rounded-2xl p-5 shadow-2xl  flex flex-col gap-4">
                    <h3 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-wide">
                      <Trash2 size={20} className="text-rose-400" /> üóëÔ∏è DELETE & EDIT ACTIVE PANELS ({panels.length})
                    </h3>

                    {staffEditingPanel ? (
                      <div className="bg-black/20 backdrop-blur-md border border-cyan-400/50 p-4 rounded-xl flex flex-col gap-3">
                        <span className="text-cyan-400 font-black text-xs uppercase">Editing Panel ID #{staffEditingPanel.id}</span>
                        <div>
                          <label className="text-gray-400 text-xs font-bold block mb-1">Title</label>
                          <input
                            type="text"
                            value={staffEditingPanel.title}
                            onChange={(e) => setStaffEditingPanel({ ...staffEditingPanel, title: e.target.value })}
                            className="w-full bg-black border border-white/20 rounded p-2 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="text-gray-400 text-xs font-bold block mb-1">Category</label>
                          <input
                            type="text"
                            value={staffEditingPanel.category}
                            onChange={(e) => setStaffEditingPanel({ ...staffEditingPanel, category: e.target.value })}
                            className="w-full bg-black border border-white/20 rounded p-2 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="text-gray-400 text-xs font-bold block mb-1">Image URL</label>
                          <input
                            type="text"
                            value={staffEditingPanel.image}
                            onChange={(e) => setStaffEditingPanel({ ...staffEditingPanel, image: e.target.value })}
                            className="w-full bg-black border border-white/20 rounded p-2 text-xs text-white"
                          />
                        </div>
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => {
                              setPanels(prev => prev.map(p => p.id === staffEditingPanel.id ? staffEditingPanel : p));
                              setStaffEditingPanel(null);
                              alert("‚úÖ Panel successfully update ho gaya!");
                            }}
                            className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs py-2 rounded uppercase"
                          >
                            Save Changes
                          </button>
                          <button
                            onClick={() => setStaffEditingPanel(null)}
                            className="bg-gray-700 hover:bg-gray-600 text-white font-bold text-xs px-4 py-2 rounded uppercase"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {ensureArray(panels).map((p, idx) => (
                          <div key={`staff-panel-${p.id}-${idx}`} className="bg-black/20 backdrop-blur-md border border-white/10 p-3.5 rounded-xl flex flex-col justify-between gap-3 shadow-lg hover:border-rose-500/40 transition-all">
                            <div className="flex items-start gap-3">
                              <img
                                src={p.image}
                                alt={p.title}
                                className="w-16 h-16 rounded-lg object-cover border border-white/20 shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop";
                                }}
                              />
                              <div className="flex flex-col overflow-hidden">
                                <span className="text-xs font-bold text-fuchsia-400 bg-fuchsia-500/20 px-2 py-0.5 rounded border border-fuchsia-500/30 w-fit mb-1 uppercase">
                                  {p.category}
                                </span>
                                <h4 className="text-white font-black text-sm truncate">{p.title}</h4>
                                <span className="text-gray-400 text-[10px] mt-0.5">
                                  Price: ‚Çπ{p.pricing?.[0]?.price ?? 90} (1 Day)
                                </span>
                              </div>
                            </div>

                            <div className="flex gap-2 pt-2 border-t border-white/10">
                              <button
                                onClick={() => setStaffEditingPanel({ ...p })}
                                className="flex-1 bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 border border-cyan-500/40 font-bold text-xs py-2 rounded-lg flex items-center justify-center gap-1 uppercase transition-all"
                              >
                                <Edit size={12} /> Edit
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Aap sach me panel "${p.title}" ko delete karna chahte hain?`)) {
                                    setPanels(prev => prev.filter(item => item.id !== p.id));
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
              {staffTab === 'supportLinks' && (
                <div className="bg-black/20 backdrop-blur-md border border-sky-500/40 rounded-2xl p-5 shadow-2xl  flex flex-col gap-4 text-left">
                  <h3 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-wide">
                    <Send size={20} className="text-sky-400" /> üí¨ TELEGRAM & WHATSAPP SUPPORT LINKS
                  </h3>
                  <p className="text-gray-300 text-xs">
                    Staff yahan website par Contact Admin aur Customer Support wale Telegram aur WhatsApp links update kar sakte hain.
                  </p>

                  <div className="flex flex-col gap-3 bg-black/20 backdrop-blur-md p-4 rounded-xl border border-white/10">
                    <div>
                      <label className="text-sky-400 font-black text-xs uppercase block mb-1 flex items-center gap-1">
                        <Send size={14} /> TELEGRAM CHANNEL / SUPPORT LINK
                      </label>
                      <input
                        type="text"
                        value={supportLinks.telegram}
                        onChange={(e) => setSupportLinks({ ...supportLinks, telegram: e.target.value })}
                        placeholder="https://t.me/yourchannel"
                        className="w-full bg-black/20 backdrop-blur-md border border-white/20 rounded-xl py-3 px-3 text-xs font-bold text-white focus:outline-none focus:border-sky-400"
                      />
                    </div>

                    <div>
                      <label className="text-green-400 font-black text-xs uppercase block mb-1 flex items-center gap-1">
                        <Zap size={14} className="fill-green-400" /> WHATSAPP GROUP / SUPPORT LINK
                      </label>
                      <input
                        type="text"
                        value={supportLinks.whatsapp}
                        onChange={(e) => setSupportLinks({ ...supportLinks, whatsapp: e.target.value })}
                        placeholder="https://wa.me/1234567890"
                        className="w-full bg-black/20 backdrop-blur-md border border-white/20 rounded-xl py-3 px-3 text-xs font-bold text-white focus:outline-none focus:border-green-400"
                      />
                    </div>

                    <button
                      onClick={() => {
                        localStorage.setItem('app_supportLinks', JSON.stringify(supportLinks));
                        alert('‚úÖ Telegram aur WhatsApp Links successfully update ho gaye hain!');
                      }}
                      className="mt-2 w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black py-3.5 rounded-xl shadow-[0_0_20px_rgba(56,189,248,0.5)] transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-2 active:scale-95"
                    >
                      <Save size={16} /> SAVE SUPPORT LINKS
                    </button>
                  </div>
                </div>
              )}

              {/* STAFF TAB 5: USERS LIST ("SARA KA SARA INE TOTAL USI PER DIKHAI DEGA") */}
              {staffTab === 'users' && (
                <div className="bg-black/20 backdrop-blur-md border border-purple-500/40 rounded-2xl p-5 shadow-2xl  flex flex-col gap-4 text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h3 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-wide">
                      <User size={20} className="text-purple-400" /> üë• ALL REGISTERED WEBSITE USERS ({registeredUsers.length})
                    </h3>
                    <span className="text-xs text-purple-300 bg-purple-500/20 px-3 py-1 rounded-full border border-purple-500/30 font-bold w-fit">
                      Total Registered: {registeredUsers.length} Users
                    </span>
                  </div>

                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search users by Email or Phone..."
                      value={staffSearchUser}
                      onChange={(e) => setStaffSearchUser(e.target.value)}
                      className="w-full bg-black/20 backdrop-blur-md border border-white/20 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-400"
                    />
                  </div>

                  <div className="flex flex-col gap-3">
                    {registeredUsers
                      .filter(u => {
                        if (!staffSearchUser.trim()) return true;
                        const s = staffSearchUser.toLowerCase();
                        return (u.email && u.email.toLowerCase().includes(s)) || (u.phone && u.phone.includes(s));
                      })
                      .map((u, idx) => {
                        const uKey = getAccountKey(u.email, u.phone);
                        const bal = userWallets[uKey] ?? 0;
                        const avatarUrl = u.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop";

                        return (
                          <div key={`manage-user-${u.email || u.phone || idx}-${idx}`} className="bg-black/20 backdrop-blur-md border border-white/10 p-4 rounded-xl flex flex-col gap-3 shadow-lg hover:border-purple-500/40 transition-all">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <img
                                  src={avatarUrl}
                                  alt={u.email || u.phone}
                                  className="w-12 h-12 rounded-full border-2 border-purple-400 object-cover shrink-0 cursor-pointer hover:scale-105 transition-transform"
                                  onClick={() => setPreviewMedia({ url: avatarUrl, title: `${u.email || u.phone}'s Profile Photo` })}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop";
                                  }}
                                />
                                <div className="flex flex-col">
                                  <span className="text-white font-black text-sm">{u.email || u.phone || "User"}</span>
                                  {u.phone && u.email && <span className="text-gray-300 text-xs font-mono">üì± {u.phone}</span>}
                                  <span className="text-gray-400 text-[10px] mt-0.5">Joined: {u.joinDate || 'N/A'}</span>
                                </div>
                              </div>

                              <div className="flex flex-col items-end">
                                <span className="text-cyan-400 font-black text-sm">‚Çπ{bal}</span>
                                <span className="text-gray-400 text-[10px]">Wallet Balance</span>
                              </div>
                            </div>

                            <div className="bg-black/20 backdrop-blur-md p-2.5 rounded-lg border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                              <span className="text-yellow-400 font-mono">üîë Password: {u.password}</span>
                              <div className="flex gap-2 w-full sm:w-auto">
                                <button
                                  onClick={() => {
                                    const newBalStr = prompt(`Set new wallet balance (‚Çπ) for ${u.email || u.phone}:`, String(bal));
                                    if (newBalStr !== null) {
                                      const newBal = Number(newBalStr);
                                      if (!isNaN(newBal)) {
                                        setUserWallets(prev => ({ ...prev, [uKey]: newBal }));
                                        alert(`‚úÖ Wallet balance updated to ‚Çπ${newBal}!`);
                                      }
                                    }
                                  }}
                                  className="flex-1 sm:flex-none bg-purple-600 hover:bg-purple-500 text-white font-bold px-3 py-1 rounded text-[11px] uppercase"
                                >
                                  Edit Balance
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Aap user "${u.email || u.phone}" ko delete karna chahte hain?`)) {
                                      setRegisteredUsers(prev => prev.filter(usr => getAccountKey(usr.email, usr.phone) !== uKey));
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
              {staffTab === 'payments' && (
                <div className="bg-black/20 backdrop-blur-md border border-emerald-500/40 rounded-2xl p-5 shadow-2xl  flex flex-col gap-4 text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-wide">
                        <Wallet size={20} className="text-emerald-400" /> üí∞ WEBSITE PAISA & PAYMENT LOGS
                      </h3>
                      <p className="text-gray-300 text-xs">
                        Kis-kis user ne website me paisa add / request lagaya hai wo sab yahan list hoga.
                      </p>
                    </div>
                    <div className="bg-emerald-500/20 border border-emerald-500/40 px-3 py-2 rounded-xl text-emerald-300 font-black text-sm flex items-center gap-2 w-fit">
                      <span>Total Revenue:</span>
                      <span className="text-white text-base">‚Çπ{ensureArray(paymentHistory).filter(p => p.status === 'SUCCESS').reduce((acc, curr) => acc + (curr.amount || 0), 0)}</span>
                    </div>
                  </div>

                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search payments by User Email, Phone, or UTR Number..."
                      value={staffSearchPayment}
                      onChange={(e) => setStaffSearchPayment(e.target.value)}
                      className="w-full bg-black/20 backdrop-blur-md border border-white/20 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div className="flex flex-col gap-3">
                    {paymentHistory
                      .filter(p => {
                        if (!staffSearchPayment.trim()) return true;
                        const s = staffSearchPayment.toLowerCase();
                        return (
                          (p.userEmail && p.userEmail.toLowerCase().includes(s)) ||
                          (p.userPhone && p.userPhone.includes(s)) ||
                          (p.utr && p.utr.toLowerCase().includes(s))
                        );
                      })
                      .map((p, idx) => {
                        const targetKey = p.userAccountKey || getAccountKey(p.userEmail, p.userPhone);
                        const isPending = p.status === 'PENDING';
                        const isSuccess = p.status === 'SUCCESS';

                        return (
                          <div key={`house-pay-${p.id}-${idx}`} className="bg-black/20 backdrop-blur-md border border-white/10 p-4 rounded-xl flex flex-col gap-3 shadow-lg">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex flex-col">
                                <span className="text-white font-black text-sm">{p.userEmail || p.userPhone || 'User'}</span>
                                <span className="text-gray-400 text-xs font-mono mt-0.5">UTR / Txn: {p.utr || 'N/A'}</span>
                                <span className="text-gray-400 text-[10px]">Date: {p.date}</span>
                                {p.screenshot && (
                                  <div className="mt-2">
                                    <span className="text-[10px] text-fuchsia-400 font-bold uppercase block mb-1">User Screenshot:</span>
                                    <img 
                                      src={p.screenshot} 
                                      alt="Screenshot" 
                                      className="h-16 w-28 object-cover rounded border border-fuchsia-500/40 cursor-pointer hover:scale-105 transition-transform" 
                                      onClick={() => setPreviewMedia({ url: p.screenshot!, title: `Payment Screenshot - UTR ${p.utr}` })}
                                    />
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-col items-end gap-1">
                                <span className="text-emerald-400 font-black text-base">‚Çπ{p.amount}</span>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase border ${
                                  isSuccess ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' :
                                  isPending ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
                                  'bg-red-500/20 text-red-400 border-red-500/40'
                                }`}>
                                  {p.status}
                                </span>
                              </div>
                            </div>

                            {isPending && (
                              <div className="flex gap-2 pt-2 border-t border-white/10">
                                <button
                                  onClick={() => {
                                    // Approve payment
                                    setPaymentHistory(prev => prev.map(item => item.id === p.id ? { ...item, status: 'SUCCESS' } : item));
                                    setUserWallets(prev => {
                                      const cur = prev[targetKey] ?? 0;
                                      return { ...prev, [targetKey]: cur + p.amount };
                                    });
                                    if (!userProfile.isLoggedIn || getAccountKey(userProfile.email, userProfile.phone) === targetKey) {
                                      setUserBalance(prev => prev + p.amount);
                                    }
                                    alert(`‚úÖ Staff Approved ‚Çπ${p.amount} for ${p.userEmail || p.userPhone}! Added to wallet.`);
                                  }}
                                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-xs py-2 rounded-xl uppercase shadow-md flex items-center justify-center gap-1 active:scale-95"
                                >
                                  <CheckCircle size={14} /> Approve & Add ‚Çπ{p.amount}
                                </button>
                                <button
                                  onClick={() => {
                                    setPaymentHistory(prev => prev.map(item => item.id === p.id ? { ...item, status: 'REJECTED' } : item));
                                    alert(`‚ùå Payment request rejected.`);
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
              {staffTab === 'pendingKeys' && (
                <div className="bg-black/20 backdrop-blur-md border border-amber-500/40 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-wide">
                        <Key size={20} className="text-amber-400" /> ‚è≥ PENDING KEY PURCHASES ({keyRequests.filter(r => r.status === 'PENDING').length})
                      </h3>
                      <p className="text-gray-300 text-xs">
                        Yahan dekhiye kis-kis user ne key buy karne ke liye request dala hai aur kiska pending mein hai.
                      </p>
                    </div>
                    <div className="bg-amber-500/20 border border-amber-500/40 px-3 py-2 rounded-xl text-amber-300 font-black text-sm flex items-center gap-2 w-fit">
                      <span>Pending Orders:</span>
                      <span className="text-white text-base">{keyRequests.filter(r => r.status === 'PENDING').length}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    {ensureArray(keyRequests)
                      .filter(r => r.status === 'PENDING')
                      .map((req, idx) => (
                        <div key={`m-pendingkey-${req.id}-${idx}`} className="bg-black/20 backdrop-blur-md border border-amber-500/30 p-4 rounded-xl flex flex-col gap-3 shadow-lg">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex flex-col">
                              <span className="text-white font-black text-sm">{req.user}</span>
                              {req.userEmail || req.userPhone ? (
                                <span className="text-gray-400 text-xs font-mono mt-0.5">Account: {req.userEmail || req.userPhone}</span>
                              ) : null}
                              {req.userPassword && <span className="text-amber-400 text-xs font-mono">Password: {req.userPassword}</span>}
                              <span className="text-fuchsia-300 text-xs font-bold mt-1">Panel: {req.panel} {req.planLabel && `(${req.planLabel})`}</span>
                              <span className="text-gray-400 text-[10px] mt-1">Order Date: {req.date}</span>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-cyan-400 font-black text-base">‚Çπ{req.price}</span>
                              <span className="text-[10px] font-black px-2 py-0.5 rounded uppercase border bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse">
                                PENDING
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
                            <textarea
                              placeholder="Type key message / code here (e.g. 5546272611 or ABCD-1234-EFGH-5678)..."
                              className="w-full bg-black/50 border border-white/20 rounded-xl py-2 px-3 text-sm font-bold text-emerald-400 font-mono focus:outline-none focus:border-amber-400 transition-all resize-none h-20"
                              id={`staff-key-input-${req.id}`}
                            />
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <button
                                onClick={() => {
                                  const input = document.getElementById(`staff-key-input-${req.id}`) as HTMLTextAreaElement;
                                  if (input && input.value) {
                                    setKeyRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'APPROVED', deliveredKey: input.value.trim() } : r));
                                    alert(`‚úÖ Key approved and saved to database for ${req.user}!`);
                                  } else {
                                    alert('Please enter key code / message first!');
                                  }
                                }}
                                className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-xs py-2.5 rounded-xl uppercase shadow-[0_0_15px_rgba(234,179,8,0.4)] flex items-center justify-center gap-1.5 active:scale-95"
                              >
                                <CheckCircle size={14} /> APPROVE (IN-APP)
                              </button>

                              <button
                                onClick={async () => {
                                  const input = document.getElementById(`staff-key-input-${req.id}`) as HTMLTextAreaElement;
                                  const targetEmail = req.userEmail || (req.user && req.user.includes('@') ? req.user : '');
                                  if (!input || !input.value.trim()) {
                                    alert('‡§ï‡•É‡§™‡§Ø‡§æ Key ‡§ï‡•ã‡§° ‡§¶‡§∞‡•ç‡§ú ‡§ï‡§∞‡•á‡§Ç!');
                                    return;
                                  }
                                  let finalEmail = targetEmail;
                                  if (!finalEmail) {
                                    const promptEmail = prompt("Enter User's Email ID to send Key via EmailJS:", "");
                                    if (!promptEmail) return;
                                    finalEmail = promptEmail.trim();
                                  }
                                  const keyVal = input.value.trim();
                                  const sent = await handleSendKeyToUser(finalEmail, keyVal, `Hello ${req.user}, here is your ${req.panel} activation key. Thank you for shopping with us!`);
                                  if (sent) {
                                    setKeyRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'APPROVED', deliveredKey: keyVal } : r));
                                  }
                                }}
                                className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs py-2.5 rounded-xl uppercase shadow-[0_0_15px_rgba(59,130,246,0.4)] flex items-center justify-center gap-1.5 active:scale-95"
                              >
                                <Mail size={14} /> üìß APPROVE & SEND EMAIL (EMAILJS)
                              </button>
                            </div>

                            {/* Staff Portal: REJECT & REFUND BUTTON */}
                            <button
                              type="button"
                              onClick={() => {
                                handleRejectAndRefundKey(req, "Out of stock / Technical issue");
                              }}
                              className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black py-2.5 rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 active:scale-95 border border-red-400/40 mt-1"
                            >
                              <X size={14} /> ‚ùå REJECT & REFUND ‚Çπ{req.price} TO USER WALLET
                            </button>
                          </div>
                        </div>
                      ))}

                    {keyRequests.filter(r => r.status === 'PENDING').length === 0 && (
                      <div className="bg-black/20 backdrop-blur-md border border-white/10 p-8 rounded-xl text-center flex flex-col items-center justify-center gap-2">
                        <Key size={32} className="text-gray-500" />
                        <span className="text-gray-400 text-sm font-bold">No Pending Key Purchases!</span>
                        <span className="text-gray-500 text-xs">All user key orders have been approved or delivered.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              
              {/* STAFF TAB: REJECT & REFUND PANEL */}
              {staffTab === 'refundPanel' && (
                <div className="flex flex-col gap-4 text-left animate-in fade-in duration-200">
                  <div className="bg-black/40 backdrop-blur-xl border-2 border-red-500/50 rounded-3xl p-5 sm:p-7 shadow-[0_0_50px_rgba(239,68,68,0.25)] flex flex-col gap-5 relative overflow-hidden">
                    
                    <div className="flex items-center gap-3 border-b border-red-500/30 pb-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-pink-500 p-0.5 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.6)] shrink-0">
                        <div className="w-full h-full bg-black/70 rounded-[14px] flex items-center justify-center">
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
                          Refund to User Wallet and send automated notification email.
                        </p>
                      </div>
                    </div>

                    <form 
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const emailElem = document.getElementById("refundUserEmail") as HTMLInputElement;
                        const amountElem = document.getElementById("refundAmount") as HTMLInputElement;
                        const reasonElem = document.getElementById("refundReason") as HTMLTextAreaElement;
                        const statusElem = document.getElementById("refundStatusMessage") as HTMLParagraphElement;

                        const email = emailElem?.value?.trim();
                        const amount = Number(amountElem?.value?.trim());
                        const reason = reasonElem?.value?.trim() || "‡§Ü‡§™‡§ï‡§æ ‡§ë‡§∞‡•ç‡§°‡§∞ ‡§∞‡§ø‡§ú‡•á‡§ï‡•ç‡§ü ‡§ï‡§∞ ‡§¶‡§ø‡§Ø‡§æ ‡§ó‡§Ø‡§æ ‡§π‡•à ‡§î‡§∞ ‡§™‡•à‡§∏‡•á ‡§Ü‡§™‡§ï‡•á ‡§µ‡•â‡§≤‡•á‡§ü ‡§Æ‡•á‡§Ç ‡§∞‡§ø‡§´‡§º‡§Ç‡§° ‡§ï‡§∞ ‡§¶‡§ø‡§è ‡§ó‡§è ‡§π‡•à‡§Ç‡•§";

                        if (!email || !amount) {
                          if (statusElem) {
                            statusElem.innerText = "‡§ï‡•É‡§™‡§Ø‡§æ User Email ‡§î‡§∞ Refund Amount ‡§¶‡•ã‡§®‡•ã‡§Ç ‡§≠‡§∞‡•á‡§Ç!";
                            statusElem.className = "mt-4 font-bold text-red-400 text-sm";
                          }
                          return;
                        }

                        if (statusElem) {
                          statusElem.innerText = "‡§∞‡§ø‡§´‡§º‡§Ç‡§° ‡§ï‡•Ä ‡§ú‡§æ‡§®‡§ï‡§æ‡§∞‡•Ä ‡§≠‡•á‡§ú‡•Ä ‡§ú‡§æ ‡§∞‡§π‡•Ä ‡§π‡•à...";
                          statusElem.className = "mt-4 font-bold text-blue-400 text-sm";
                        }

                        // 1. Add fund to user wallet
                        const tPhone = /^\d+$/.test(email) ? email : '';
                        const targetAccKey = getAccountKey(email, tPhone);
                        
                        setUserWallets(prev => {
                          const currentVal = Number(prev[targetAccKey]) || 0;
                          return { ...prev, [targetAccKey]: currentVal + amount };
                        });

                        // 2. Send Email
                        const success = await handleSendRefundEmailToUser(email, amount, reason);

                        if (success) {
                          if (statusElem) {
                            statusElem.innerText = `‡§∏‡§´‡§≤‡§§‡§æ‡§™‡•Ç‡§∞‡•ç‡§µ‡§ï ‡§∞‡§ø‡§´‡§º‡§Ç‡§° ‡§à‡§Æ‡•á‡§≤ ‡§≠‡•á‡§ú ‡§¶‡§ø‡§Ø‡§æ ‡§ó‡§Ø‡§æ ‡§π‡•à! ‚Çπ${amount} Added to Wallet.`;
                            statusElem.className = "mt-4 font-bold text-green-400 text-sm";
                          }
                          if (emailElem) emailElem.value = "";
                          if (amountElem) amountElem.value = "";
                          if (reasonElem) reasonElem.value = "";
                        } else {
                          if (statusElem) {
                            statusElem.innerText = "Error: ‡§à‡§Æ‡•á‡§≤ ‡§≠‡•á‡§ú‡§®‡•á ‡§Æ‡•á‡§Ç ‡§∏‡§Æ‡§∏‡•ç‡§Ø‡§æ ‡§Ü‡§à‡•§ ‡§≤‡•á‡§ï‡§ø‡§® ‡§µ‡•â‡§≤‡•á‡§ü ‡§Æ‡•á‡§Ç ‡§∞‡§ø‡§´‡§º‡§Ç‡§° ‡§ê‡§° ‡§ï‡§∞ ‡§¶‡§ø‡§Ø‡§æ ‡§ó‡§Ø‡§æ ‡§π‡•à‡•§";
                            statusElem.className = "mt-4 font-bold text-red-400 text-sm";
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
                          className="w-full bg-black/50 border border-white/20 focus:border-red-400 rounded-xl p-3 text-sm text-white placeholder:text-gray-500 focus:outline-none font-mono transition-all"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-red-300 flex items-center gap-1.5 mb-1">
                          <Wallet size={14} /> Refund Amount (‚Çπ):
                        </label>
                        <input
                          type="number"
                          id="refundAmount"
                          placeholder="e.g. 100"
                          className="w-full bg-black/50 border border-white/20 focus:border-red-400 rounded-xl p-3 text-sm text-white placeholder:text-gray-500 focus:outline-none font-mono transition-all"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-red-300 flex items-center gap-1.5 mb-1">
                          <AlertTriangle size={14} /> Rejection Reason:
                        </label>
                        <textarea
                          id="refundReason"
                          placeholder="‡§ï‡§æ‡§∞‡§£ ‡§≤‡§ø‡§ñ‡•á‡§Ç (‡§â‡§¶‡§æ. Invalid Payment Screenshot)"
                          rows={3}
                          className="w-full bg-black/50 border border-white/20 focus:border-red-400 rounded-xl p-3 text-sm text-white placeholder:text-gray-500 focus:outline-none transition-all"
                        ></textarea>
                      </div>

                      <button 
                        type="submit"
                        className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black py-3.5 rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all uppercase tracking-wider text-sm flex items-center justify-center gap-2 active:scale-95 border border-red-400/40"
                      >
                        <X size={18} /> REJECT & REFUND ‚Çπ TO USER WALLET
                      </button>

                      <p id="refundStatusMessage" className="mt-2 text-sm"></p>
                    </form>
                  </div>
                </div>
              )}

              {/* STAFF TAB: EMAILJS SEND KEY PANEL ("Key ‡§≠‡•á‡§ú‡§®‡•á ‡§ï‡§æ Admin Panel") */}
              {staffTab === 'emailKey' && (
                <div className="flex flex-col gap-4 text-left animate-in fade-in duration-200">
                  <div className="bg-black/40 backdrop-blur-xl border-2 border-blue-500/50 rounded-3xl p-5 sm:p-7 shadow-[0_0_50px_rgba(59,130,246,0.25)] flex flex-col gap-5 relative overflow-hidden">
                    {/* Top Glow & Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-500/30 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 p-0.5 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.6)] shrink-0">
                          <div className="w-full h-full bg-black/70 rounded-[14px] flex items-center justify-center">
                            <Mail className="text-blue-400" size={24} />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white">
                              Key ‡§≠‡•á‡§ú‡§®‡•á ‡§ï‡§æ Admin Panel
                            </h3>
                            <span className="bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                              EMAILJS LIVE
                            </span>
                          </div>
                          <p className="text-xs text-gray-300">
                            Send direct activation keys to customer Gmail/Email with instant automated delivery.
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
                              onClick={() => setShowEmailJsConfigSettings(!showEmailJsConfigSettings)}
                              className="text-[10px] text-yellow-400 hover:underline font-sans font-bold"
                            >
                              {showEmailJsConfigSettings ? 'Hide Settings' : '‚öôÔ∏è Edit IDs'}
                            </button>
                          </div>
                          <span>Service: <strong className="text-white">{emailJsConfig.serviceId}</strong></span>
                          <span>Template: <strong className="text-white">{emailJsConfig.templateId}</strong></span>
                          <span>Public Key: <strong className="text-white">{emailJsConfig.publicKey.substring(0, 8)}...</strong></span>
                        </div>

                        {showEmailJsConfigSettings && (
                          <div className="bg-black/70 border border-yellow-400/40 rounded-xl p-3 flex flex-col gap-2 animate-in fade-in">
                            <span className="text-xs text-yellow-300 font-bold">EmailJS Live API Credentials</span>
                            <div>
                              <label className="text-[10px] text-gray-300 block">Service ID:</label>
                              <input 
                                type="text"
                                value={emailJsConfig.serviceId}
                                onChange={(e) => {
                                  const updated = { ...emailJsConfig, serviceId: e.target.value };
                                  setEmailJsConfig(updated);
                                  localStorage.setItem('satorang_emailjs_config', JSON.stringify(updated));
                                }}
                                className="w-full bg-black/60 border border-white/20 rounded p-1.5 text-xs text-white font-mono"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-gray-300 block">Template ID:</label>
                              <input 
                                type="text"
                                value={emailJsConfig.templateId}
                                onChange={(e) => {
                                  const updated = { ...emailJsConfig, templateId: e.target.value };
                                  setEmailJsConfig(updated);
                                  localStorage.setItem('satorang_emailjs_config', JSON.stringify(updated));
                                }}
                                className="w-full bg-black/60 border border-white/20 rounded p-1.5 text-xs text-white font-mono"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-gray-300 block">Public Key:</label>
                              <input 
                                type="text"
                                value={emailJsConfig.publicKey}
                                onChange={(e) => {
                                  const updated = { ...emailJsConfig, publicKey: e.target.value };
                                  setEmailJsConfig(updated);
                                  localStorage.setItem('satorang_emailjs_config', JSON.stringify(updated));
                                }}
                                className="w-full bg-black/60 border border-white/20 rounded p-1.5 text-xs text-white font-mono"
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
                            <User size={14} /> ‡§Ø‡•Ç‡§ú‡§º‡§∞ ‡§ï‡§æ Email ID:
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
                          placeholder="‡§ú‡•à‡§∏‡•á: user@gmail.com"
                          value={sendKeyEmailForm.userEmail}
                          onChange={(e) => setSendKeyEmailForm(prev => ({ ...prev, userEmail: e.target.value }))}
                          className="w-full bg-black/50 border border-white/20 focus:border-blue-400 rounded-xl p-3 text-sm text-white placeholder:text-gray-500 focus:outline-none font-mono transition-all"
                          required
                        />

                        {/* Registered user email quick chips */}
                        {registeredUsers.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {registeredUsers
                              .filter(u => u.email && u.email.includes('@'))
                              .slice(0, 5)
                              .map((u, uIdx) => (
                                <button
                                  key={`quick-u-email-${uIdx}`}
                                  type="button"
                                  onClick={() => setSendKeyEmailForm(prev => ({ ...prev, userEmail: u.email }))}
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
                            <Key size={14} /> ‡§ñ‡§∞‡•Ä‡§¶‡•Ä ‡§ó‡§à Key:
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const rand = 'PREM-' + Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000);
                              setSendKeyEmailForm(prev => ({ ...prev, keyValue: rand }));
                            }}
                            className="text-[10px] text-amber-300 hover:text-amber-200 font-bold underline flex items-center gap-1"
                          >
                            <Sparkles size={11} /> üé≤ Generate Random Key
                          </button>
                        </div>
                        <input
                          type="text"
                          id="keyValue"
                          placeholder="‡§ú‡•à‡§∏‡•á: ABCD-1234-EFGH-5678 ‡§Ø‡§æ PREM-VIP-9921"
                          value={sendKeyEmailForm.keyValue}
                          onChange={(e) => setSendKeyEmailForm(prev => ({ ...prev, keyValue: e.target.value }))}
                          className="w-full bg-black/50 border border-white/20 focus:border-blue-400 rounded-xl p-3 text-sm text-emerald-400 font-mono font-bold placeholder:text-gray-500 focus:outline-none transition-all"
                          required
                        />
                      </div>

                      {/* 3. Admin Message */}
                      <div>
                        <label className="text-xs font-bold text-blue-300 block mb-1">
                          Admin Message (‡§µ‡•à‡§ï‡§≤‡•ç‡§™‡§ø‡§ï):
                        </label>
                        <textarea
                          id="adminMessage"
                          rows={3}
                          placeholder="‡§Ø‡•Ç‡§ú‡§º‡§∞ ‡§ï‡•á ‡§≤‡§ø‡§è ‡§ï‡•ã‡§à ‡§∏‡§Ç‡§¶‡•á‡§∂ (‡§ú‡•à‡§∏‡•á: Thank you for purchasing Private VIP Panel! Follow Telegram for instant setup guide)..."
                          value={sendKeyEmailForm.adminMessage}
                          onChange={(e) => setSendKeyEmailForm(prev => ({ ...prev, adminMessage: e.target.value }))}
                          className="w-full bg-black/50 border border-white/20 focus:border-blue-400 rounded-xl p-3 text-xs text-white placeholder:text-gray-500 focus:outline-none transition-all resize-none"
                        />
                        
                        {/* Preset Message Templates */}
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {[
                            "Thank you for purchasing! Here is your private activation key.",
                            "Private 24Ghanta VIP Panel Key. Main ID Safe 100%.",
                            "Your VIP Reseller Key Order is confirmed. Enjoy gaming!"
                          ].map((msg, mIdx) => (
                            <button
                              key={`quick-msg-${mIdx}`}
                              type="button"
                              onClick={() => setSendKeyEmailForm(prev => ({ ...prev, adminMessage: msg }))}
                              className="text-[10px] bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 px-2 py-0.5 rounded-lg transition-colors truncate max-w-[280px]"
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
                              ? 'bg-blue-800 text-gray-300 cursor-not-allowed opacity-75'
                              : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-indigo-500 text-white hover:scale-[1.01] active:scale-[0.99]'
                          }`}
                        >
                          {emailSendingStatus.loading ? (
                            <>
                              <Loader2 className="animate-spin" size={18} />
                              <span>‡§à‡§Æ‡•á‡§≤ ‡§≠‡•á‡§ú‡§æ ‡§ú‡§æ ‡§∞‡§π‡§æ ‡§π‡•à... ‡§ï‡•É‡§™‡§Ø‡§æ ‡§™‡•ç‡§∞‡§§‡•Ä‡§ï‡•ç‡§∑‡§æ ‡§ï‡§∞‡•á‡§Ç‡•§</span>
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
                            const testKey = 'TEST-KEY-' + Math.floor(100000 + Math.random() * 900000);
                            handleSendKeyToUser('pramk9992@gmail.com', testKey, 'Test key delivery from EmailJS admin panel.');
                          }}
                          className="bg-white/10 hover:bg-white/20 border border-white/20 text-blue-200 text-xs font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 shrink-0"
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
                            emailSendingStatus.status === 'success' 
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                              : emailSendingStatus.status === 'error'
                              ? 'bg-red-500/20 text-red-300 border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                              : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                          }`}
                        >
                          {emailSendingStatus.message}
                        </div>
                      )}

                      {/* EmailJS Troubleshooting Guide Box */}
                      <div className="bg-blue-950/30 border border-blue-500/20 rounded-2xl p-3.5 text-[11px] text-gray-300 flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5 font-bold text-blue-300">
                          <AlertCircle size={14} className="text-blue-400 shrink-0" />
                          <span>EmailJS Setup & 422 Error Fix Guide:</span>
                        </div>
                        <ul className="list-disc pl-4 space-y-1 text-gray-300 leading-relaxed text-[11px]">
                          <li>
                            EmailJS Dashboard &gt; <strong>Email Templates</strong> &gt; Select <strong className="text-white">{emailJsConfig.templateId}</strong> &gt; Click <strong>Settings</strong> tab.
                          </li>
                          <li>
                            Ensure <strong>"To Email"</strong> field contains <code className="bg-black/50 text-emerald-400 px-1.5 py-0.5 rounded font-mono">{"{{user_email}}"}</code> or <code className="bg-black/50 text-emerald-400 px-1.5 py-0.5 rounded font-mono">{"{{to_email}}"}</code>.
                          </li>
                          <li>
                            Content body can use <code className="bg-black/50 text-yellow-300 px-1.5 py-0.5 rounded font-mono">{"{{key_value}}"}</code> and <code className="bg-black/50 text-yellow-300 px-1.5 py-0.5 rounded font-mono">{"{{admin_message}}"}</code>.
                          </li>
                        </ul>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentView === 'adminPaymentSettings' && (
            <div className="flex flex-col gap-4 w-full animate-in fade-in zoom-in-95 duration-300 relative z-10 mt-2 bg-black/20 backdrop-blur-xl rounded-3xl p-5 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-3 mb-2">
                <button onClick={() => setCurrentView('admin')} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors ">
                  <ArrowLeft size={20} className="text-white" />
                </button>
                <h2 className="text-xl font-black tracking-tight italic drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase">
                  PAYMENT <span className="text-fuchsia-500 drop-shadow-[0_0_15px_rgba(217,70,239,1)]">DETAILS OWNER</span>
                </h2>
              </div>
              
              <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.5)]  flex flex-col items-center text-center">
                <p className="text-gray-400 text-xs font-semibold mb-4">Upload your QR Code image or paste URL for permanent storage.</p>
                <div className="relative mb-4 w-36 h-36 bg-white rounded-xl flex items-center justify-center overflow-hidden border-2 border-dashed border-cyan-400/50">
                  <img src={paymentSettings.qrImage} alt="QR" className="w-full h-full object-contain p-1" />
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (evt) => {
                          if (evt.target?.result) {
                            setPaymentSettings(prev => ({ ...prev, qrImage: evt.target!.result as string }));
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <div className="absolute bottom-0 w-full bg-black/20 backdrop-blur-md text-cyan-300 text-[10px] py-1 font-bold pointer-events-none">Tap to Upload Image</div>
                </div>

                <div className="w-full text-left mb-4">
                  <label className="text-cyan-400 font-bold text-xs tracking-wider mb-2 block">QR CODE IMAGE / DATA URL</label>
                  <input
                    type="text"
                    value={paymentSettings.qrImage}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, qrImage: e.target.value })}
                    placeholder="https://... or data:image/..."
                    className="w-full bg-black/40 backdrop-blur-md border border-white/20 rounded-lg py-3 px-3 text-xs font-mono font-bold text-white focus:outline-none focus:border-cyan-400 transition-all truncate"
                  />
                </div>
                
                <div className="w-full text-left">
                  <label className="text-cyan-400 font-bold text-xs tracking-wider mb-2 block">UPI ID / NUMBER</label>
                  <input
                    type="text"
                    value={paymentSettings.upiId}
                    onChange={(e) => setPaymentSettings({...paymentSettings, upiId: e.target.value})}
                    placeholder="e.g. 9876543210@paytm"
                    className="w-full bg-black/40 backdrop-blur-md border border-white/20 rounded-lg py-3 px-3 text-sm font-bold text-white focus:outline-none focus:border-cyan-400 transition-all"
                  />
                </div>
                
                <button onClick={() => { 
                  localStorage.setItem('app_paymentSettings', JSON.stringify(paymentSettings));
                  alert('Payment settings saved permanently!'); 
                  setCurrentView('admin'); 
                }} className="mt-6 w-full bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-black py-3 rounded-lg shadow-[0_0_15px_rgba(217,70,239,0.4)] transition-colors">SAVE PAYMENT DETAILS PERMANENTLY</button>
              </div>
            </div>
          )}

          {currentView === 'adminLogins' && (
            <div className="flex flex-col gap-4 w-full animate-in fade-in zoom-in-95 duration-300 relative z-10 mt-2 bg-black/20 backdrop-blur-xl rounded-3xl p-5 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-3 mb-2">
                <button onClick={() => setCurrentView('admin')} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors ">
                  <ArrowLeft size={20} className="text-white" />
                </button>
                <h2 className="text-xl font-black tracking-tight italic drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase">
                  USER <span className="text-fuchsia-500 drop-shadow-[0_0_15px_rgba(217,70,239,1)]">LOGINS</span>
                </h2>
              </div>
              
              <div className="flex flex-col gap-3">
                {ensureArray(registeredUsers).length === 0 ? (
                   <div className="text-center text-gray-400 text-sm mt-10">No registered users yet.</div>
                ) : (
                  ensureArray(registeredUsers).map((u, idx) => {
                    const avatarUrl = u.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop";
                    return (
                      <div key={`m-user-${u.email || u.phone || idx}-${idx}`} className="bg-black/20 backdrop-blur-md border-l-4 border-green-500 rounded-r-xl rounded-l-sm p-4 relative overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.5)]  flex flex-col gap-2">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex items-center gap-3">
                            <img 
                              src={avatarUrl} 
                              alt={u.email || u.phone}
                              className="w-12 h-12 rounded-full border-2 border-green-400 object-cover shadow-[0_0_10px_rgba(34,197,94,0.4)] shrink-0 cursor-pointer hover:scale-105 transition-transform"
                              onClick={() => setPreviewMedia({ url: avatarUrl, title: `${u.email || u.phone}'s Profile Photo` })}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop";
                              }}
                            />
                            <div className="flex flex-col text-left">
                              <span className="text-white font-bold text-base">{u.email || u.phone || "User"}</span>
                              {u.phone && u.email && <span className="text-gray-300 text-xs font-mono">üì± {u.phone}</span>}
                              <span className="text-gray-400 text-[10px] mt-0.5">Joined: {u.joinDate}</span>
                            </div>
                          </div>
                          <div className="bg-green-500/20 text-green-400 text-[10px] font-black px-2 py-1 rounded-md border border-green-500/30 shrink-0">REGISTERED</div>
                        </div>
                        <div className="mt-1 bg-black/50 p-2 rounded text-xs text-yellow-400 font-mono border border-white/10 text-left">
                          üîë Password: {u.password}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {currentView === 'adminAddPanel' && (
            <div className="flex flex-col gap-4 w-full animate-in fade-in zoom-in-95 duration-300 relative z-10 mt-2 bg-black/20 backdrop-blur-xl rounded-3xl p-5 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-3 mb-2">
                <button onClick={() => setCurrentView('admin')} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors ">
                  <ArrowLeft size={20} className="text-white" />
                </button>
                <h2 className="text-xl font-black tracking-tight italic drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase">
                  ADD NEW <span className="text-fuchsia-500 drop-shadow-[0_0_15px_rgba(217,70,239,1)]">PANEL</span>
                </h2>
              </div>
              
              <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.5)]  flex flex-col gap-4">
                <div>
                  <label className="text-cyan-400 font-bold text-xs tracking-wider mb-2 block">DSLR QUALITY IMAGE/VIDEO URL OR UPLOAD</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="https://..."
                      value={newPanelForm.image}
                      onChange={(e) => setNewPanelForm({...newPanelForm, image: e.target.value})}
                      className="w-full bg-black/40 backdrop-blur-md border border-white/20 rounded-lg py-3 px-3 text-sm font-bold text-white focus:outline-none focus:border-cyan-400 transition-all"
                    />
                    <label className="bg-cyan-500 hover:bg-cyan-400 text-black font-black py-3 px-4 rounded-lg cursor-pointer transition-colors flex items-center justify-center shrink-0">
                      {isUploadingMedia ? (
                        <span className="flex items-center gap-1.5 text-xs animate-pulse">
                          <Loader2 className="animate-spin" size={16} /> Uploading...
                        </span>
                      ) : (
                        <>
                          Upload
                          <input 
                            type="file" 
                            accept="image/*,video/*" 
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                processAsyncMediaUpload(file, () => setIsUploadingMedia(true), (url, isVideo) => {
                                  setNewPanelForm(prev => ({...prev, image: url, isVideo}));
                                  setIsUploadingMedia(false);
                                });
                              }
                            }}
                          />
                        </>
                      )}
                    </label>
                  </div>
                </div>
                <div>
                  <label className="text-cyan-400 font-bold text-xs tracking-wider mb-2 block">PANEL TITLE / EPISODE</label>
                  <input
                    type="text"
                    placeholder="e.g. A,XYZ MAIN ID FF PROXY"
                    value={newPanelForm.title}
                    onChange={(e) => setNewPanelForm({...newPanelForm, title: e.target.value})}
                    className="w-full bg-black/40 backdrop-blur-md border border-white/20 rounded-lg py-3 px-3 text-sm font-bold text-white focus:outline-none focus:border-cyan-400 transition-all"
                  />
                </div>
                <div>
                  <label className="text-cyan-400 font-bold text-xs tracking-wider mb-2 block">SELECT CATEGORY (ROOT, NON ROOT, STEAMER, PC, BGMI, MOBA LEGEND)</label>
                  <select
                    value={newPanelForm.category}
                    onChange={(e) => setNewPanelForm({...newPanelForm, category: e.target.value})}
                    className="w-full bg-black/20 backdrop-blur-md border border-cyan-400/40 rounded-lg py-3 px-3 text-sm font-bold text-cyan-300 focus:outline-none focus:border-cyan-400 transition-all cursor-pointer"
                  >
                    <option value="ROOT" className="bg-black text-white">ROOT</option>
                    <option value="NON ROOT" className="bg-black text-white">NON ROOT</option>
                    <option value="STEAMER" className="bg-black text-white">STEAMER</option>
                    <option value="PC" className="bg-black text-white">PC</option>
                    <option value="BGMI" className="bg-black text-white">BGMI</option>
                    <option value="MOBA LEGEND" className="bg-black text-white">MOBA LEGEND</option>
                  </select>
                </div>
                <div>
                  <label className="text-cyan-400 font-bold text-xs tracking-wider mb-2 block">INSTALL PANEL LINK (TELEGRAM)</label>
                  <input
                    type="text"
                    value={supportLinks.telegram}
                    onChange={(e) => setSupportLinks({...supportLinks, telegram: e.target.value})}
                    className="w-full bg-black/40 backdrop-blur-md border border-white/20 rounded-lg py-3 px-3 text-sm font-bold text-white focus:outline-none focus:border-cyan-400 transition-all"
                  />
                </div>
                <div>
                  <label className="text-cyan-400 font-bold text-xs tracking-wider mb-1 block">VIDEO FEEDBACK LINK (YOUTUBE URL / SHORTS / DEMO)</label>
                  <input
                    type="text"
                    placeholder="https://youtube.com/watch?v=... or shorts link"
                    value={newPanelForm.videoLink}
                    onChange={(e) => setNewPanelForm({...newPanelForm, videoLink: e.target.value})}
                    className="w-full bg-black/40 backdrop-blur-md border border-white/20 rounded-lg py-3 px-3 text-sm font-bold text-white focus:outline-none focus:border-cyan-400 transition-all"
                  />
                  <span className="text-cyan-300/80 text-[10px] font-semibold block mt-1">
                    ‚òÖ YouTube link paste karne par video website par live chalega aur YouTube app me kholne ka option bhi milega.
                  </span>

                  {/* YouTube Live Detected Box */}
                  {(() => {
                    const yt = getYouTubeInfo(newPanelForm.image) || getYouTubeInfo(newPanelForm.videoLink);
                    if (yt) {
                      return (
                        <div className="mt-2 bg-red-950/60 border border-red-500/60 rounded-xl p-3 flex flex-col gap-2 animate-in fade-in">
                          <div className="flex items-center gap-2 text-red-400 font-black text-xs">
                            <Youtube size={16} className="fill-red-500 text-red-500" />
                            <span>YouTube Video Detected & Thumbnail Ready!</span>
                          </div>
                          <div className="flex items-center gap-3 bg-black/20 backdrop-blur-md p-2 rounded-lg border border-white/10">
                            <img src={yt.thumbnailUrl} alt="YouTube Thumbnail" className="w-24 h-14 object-cover rounded-md border border-red-500/40" />
                            <div className="flex-1 text-xs">
                              <span className="text-white font-bold block truncate">ID: {yt.videoId}</span>
                              <span className="text-cyan-300 text-[10px] block truncate">{yt.youtubeUrl}</span>
                              <button 
                                type="button"
                                onClick={() => setPreviewMedia({ url: yt.youtubeUrl, isVideo: true, title: "Admin YouTube Live Preview", youtubeLink: yt.youtubeUrl })}
                                className="mt-1 bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-sm"
                              >
                                <Play size={10} className="fill-white" /> Test Live Play
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
                <div>
                  <label className="text-cyan-400 font-bold text-xs tracking-wider mb-2 block">PANEL FEATURES / DETAILS (Each line = 1 feature)</label>
                  <textarea
                    rows={4}
                    placeholder="Full safe NONROOT&#10;Esp crack anti-blacklist&#10;Auto headshot 100% working&#10;Main ID safe"
                    value={newPanelForm.featuresText}
                    onChange={(e) => setNewPanelForm({...newPanelForm, featuresText: e.target.value})}
                    className="w-full bg-black/40 backdrop-blur-md border border-white/20 rounded-lg py-2.5 px-3 text-xs font-mono font-semibold text-white focus:outline-none focus:border-cyan-400 transition-all resize-y"
                  />
                  <span className="text-gray-400 text-[10px] block mt-1">Enter each feature on a new line to show under the panel details.</span>
                </div>
                <div className="border border-white/10 p-3 rounded-lg bg-black/10 backdrop-blur-sm">
                  <label className="text-fuchsia-400 font-bold text-xs tracking-wider mb-2 block">SET KEY PRICES</label>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-white w-12">1 Day:</span>
                      <input type="number" value={newPanelForm.price1} onChange={(e) => setNewPanelForm({...newPanelForm, price1: Number(e.target.value)})} className="w-full bg-black/20 backdrop-blur-md border border-white/20 rounded p-1 text-white text-xs focus:border-fuchsia-500" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white w-12">3 Day:</span>
                      <input type="number" value={newPanelForm.price3} onChange={(e) => setNewPanelForm({...newPanelForm, price3: Number(e.target.value)})} className="w-full bg-black/20 backdrop-blur-md border border-white/20 rounded p-1 text-white text-xs focus:border-fuchsia-500" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white w-12">7 Day:</span>
                      <input type="number" value={newPanelForm.price7} onChange={(e) => setNewPanelForm({...newPanelForm, price7: Number(e.target.value)})} className="w-full bg-black/20 backdrop-blur-md border border-white/20 rounded p-1 text-white text-xs focus:border-fuchsia-500" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white w-12">15 Day:</span>
                      <input type="number" value={newPanelForm.price15} onChange={(e) => setNewPanelForm({...newPanelForm, price15: Number(e.target.value)})} className="w-full bg-black/20 backdrop-blur-md border border-white/20 rounded p-1 text-white text-xs focus:border-fuchsia-500" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white w-12">30 Day:</span>
                      <input type="number" value={newPanelForm.price30} onChange={(e) => setNewPanelForm({...newPanelForm, price30: Number(e.target.value)})} className="w-full bg-black/20 backdrop-blur-md border border-white/20 rounded p-1 text-white text-xs focus:border-fuchsia-500" />
                    </div>
                  </div>
                </div>
                
                <button onClick={() => { 
                  const parsedFeatures = newPanelForm.featuresText
                    ? newPanelForm.featuresText.split('\n').map(f => f.trim()).filter(Boolean)
                    : ["Main Id safe", "Full safe NONROOT", "Esp crack anti-blacklist", "Auto headshot 100% working"];

                  setPanels(prev => [{
                    id: Date.now(),
                    title: newPanelForm.title || "NEW PANEL",
                    category: newPanelForm.category || "NON ROOT",
                    thumbnailTitle: newPanelForm.title || "NEW PANEL",
                    thumbnailSub: "PREMIUM PANELS",
                    image: newPanelForm.image || "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop",
                    isVideo: newPanelForm.isVideo,
                    features: parsedFeatures,
                    installLink: supportLinks.telegram,
                    videoLink: newPanelForm.videoLink || supportLinks.telegram,
                    exceptFileLink: newPanelForm.exceptFileLink || supportLinks.telegram,
                    pricing: [
                      { label: "1 Day", price: newPanelForm.price1 },
                      { label: "3 Day", price: newPanelForm.price3 },
                      { label: "7 Day", price: newPanelForm.price7 },
                      { label: "15 Day", price: newPanelForm.price15 },
                      { label: "30 Day", price: newPanelForm.price30 }
                    ]
                  }, ...prev]);
                  alert('Panel saved successfully!'); 
                  setCurrentView('admin'); 
                  setNewPanelForm({ title: '', category: 'NON ROOT', image: '', isVideo: false, videoLink: '', exceptFileLink: '', featuresText: "Main Id safe\nFull safe NONROOT\nEsp crack anti-blacklist\nAuto headshot 100% working", price1: 90, price3: 58, price7: 67, price15: 590, price30: 5000 });
                }} className="mt-2 w-full bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-black py-3 rounded-lg shadow-[0_0_15px_rgba(217,70,239,0.4)] transition-colors">ADD PANEL</button>
              </div>
            </div>
          )}

          {currentView === 'adminDeletePanel' && (
            <div className="flex flex-col gap-4 w-full animate-in fade-in zoom-in-95 duration-300 relative z-10 mt-2 bg-black/20 backdrop-blur-xl rounded-3xl p-5 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-3 mb-2">
                <button onClick={() => { setEditingPanel(null); setCurrentView('admin'); }} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors ">
                  <ArrowLeft size={20} className="text-white" />
                </button>
                <h2 className="text-xl font-black tracking-tight italic drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase">
                  DELETE & EDIT <span className="text-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,1)]">PANELS</span>
                </h2>
              </div>

              {editingPanel ? (
                <div className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-md  p-5 overflow-y-auto">
                  <div className="max-w-[360px] mx-auto bg-black/20 backdrop-blur-md border border-cyan-400/50 rounded-xl p-5 shadow-[0_4px_30px_rgba(0,229,255,0.3)]  flex flex-col gap-4">
                    <div className="flex justify-between items-center border-b border-white/10 pb-3">
                      <h3 className="text-cyan-400 font-black text-lg uppercase flex items-center gap-2">
                        <Edit size={18} /> EDIT PANEL #{editingPanel.id}
                      </h3>
                      <button 
                        onClick={() => setEditingPanel(null)}
                        className="text-gray-400 hover:text-white bg-white/10 p-1.5 rounded-lg transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>

                  <div>
                    <label className="text-cyan-400 font-bold text-xs tracking-wider mb-2 block">IMAGE/VIDEO URL OR UPLOAD</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="https://..."
                        value={editingPanel.image}
                        onChange={(e) => setEditingPanel({...editingPanel, image: e.target.value})}
                        className="w-full bg-black/40 backdrop-blur-md border border-white/20 rounded-lg py-3 px-3 text-sm font-bold text-white focus:outline-none focus:border-cyan-400 transition-all"
                      />
                      <label className="bg-cyan-500 hover:bg-cyan-400 text-black font-black py-3 px-4 rounded-lg cursor-pointer transition-colors flex items-center justify-center shrink-0">
                        {isUploadingMedia ? (
                          <span className="flex items-center gap-1.5 text-xs animate-pulse">
                            <Loader2 className="animate-spin" size={16} /> Uploading...
                          </span>
                        ) : (
                          <>
                            Upload
                            <input 
                              type="file" 
                              accept="image/*,video/*" 
                              className="hidden" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  processAsyncMediaUpload(file, () => setIsUploadingMedia(true), (url, isVideo) => {
                                    setEditingPanel(prev => prev ? ({...prev, image: url, isVideo}) : null);
                                    setIsUploadingMedia(false);
                                  });
                                }
                              }}
                            />
                          </>
                        )}
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="text-cyan-400 font-bold text-xs tracking-wider mb-2 block">PANEL TITLE / NAME</label>
                    <input
                      type="text"
                      value={editingPanel.title}
                      onChange={(e) => setEditingPanel({...editingPanel, title: e.target.value})}
                      className="w-full bg-black/40 backdrop-blur-md border border-white/20 rounded-lg py-3 px-3 text-sm font-bold text-white focus:outline-none focus:border-cyan-400 transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-cyan-400 font-bold text-xs tracking-wider mb-2 block">SELECT CATEGORY</label>
                    <select
                      value={editingPanel.category}
                      onChange={(e) => setEditingPanel({...editingPanel, category: e.target.value})}
                      className="w-full bg-black/20 backdrop-blur-md border border-cyan-400/40 rounded-lg py-3 px-3 text-sm font-bold text-cyan-300 focus:outline-none focus:border-cyan-400 transition-all cursor-pointer"
                    >
                      <option value="ROOT" className="bg-black text-white">ROOT</option>
                      <option value="NON ROOT" className="bg-black text-white">NON ROOT</option>
                      <option value="STEAMER" className="bg-black text-white">STEAMER</option>
                      <option value="PC" className="bg-black text-white">PC</option>
                      <option value="BGMI" className="bg-black text-white">BGMI</option>
                      <option value="MOBA LEGEND" className="bg-black text-white">MOBA LEGEND</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-cyan-400 font-bold text-xs tracking-wider mb-1 block">VIDEO FEEDBACK LINK (YOUTUBE URL / SHORTS / DEMO)</label>
                    <input
                      type="text"
                      placeholder="https://youtube.com/watch?v=... or shorts link"
                      value={editingPanel.videoLink}
                      onChange={(e) => setEditingPanel({...editingPanel, videoLink: e.target.value})}
                      className="w-full bg-black/40 backdrop-blur-md border border-white/20 rounded-lg py-3 px-3 text-sm font-bold text-white focus:outline-none focus:border-cyan-400 transition-all"
                    />
                    <span className="text-cyan-300/80 text-[10px] font-semibold block mt-1">
                      ‚òÖ YouTube link paste karne par video website par live chalega aur YouTube app me kholne ka option bhi milega.
                    </span>

                    {/* YouTube Live Detected Box for Edit Panel */}
                    {(() => {
                      const yt = getYouTubeInfo(editingPanel.image) || getYouTubeInfo(editingPanel.videoLink);
                      if (yt) {
                        return (
                          <div className="mt-2 bg-red-950/60 border border-red-500/60 rounded-xl p-3 flex flex-col gap-2 animate-in fade-in">
                            <div className="flex items-center gap-2 text-red-400 font-black text-xs">
                              <Youtube size={16} className="fill-red-500 text-red-500" />
                              <span>YouTube Video Detected & Thumbnail Ready!</span>
                            </div>
                            <div className="flex items-center gap-3 bg-black/20 backdrop-blur-md p-2 rounded-lg border border-white/10">
                              <img src={yt.thumbnailUrl} alt="YouTube Thumbnail" className="w-24 h-14 object-cover rounded-md border border-red-500/40" />
                              <div className="flex-1 text-xs">
                                <span className="text-white font-bold block truncate">ID: {yt.videoId}</span>
                                <span className="text-cyan-300 text-[10px] block truncate">{yt.youtubeUrl}</span>
                                <button 
                                  type="button"
                                  onClick={() => setPreviewMedia({ url: yt.youtubeUrl, isVideo: true, title: "Admin YouTube Live Preview", youtubeLink: yt.youtubeUrl })}
                                  className="mt-1 bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-sm"
                                >
                                  <Play size={10} className="fill-white" /> Test Live Play
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  <div>
                    <label className="text-cyan-400 font-bold text-xs tracking-wider mb-1 block">PANEL INSTALL / FILE DOWNLOAD LINK (TELEGRAM / DIRECT URL)</label>
                    <input
                      type="text"
                      placeholder="https://t.me/... or file download link"
                      value={editingPanel.exceptFileLink}
                      onChange={(e) => setEditingPanel({...editingPanel, exceptFileLink: e.target.value})}
                      className="w-full bg-black/40 backdrop-blur-md border border-white/20 rounded-lg py-3 px-3 text-sm font-bold text-white focus:outline-none focus:border-cyan-400 transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-cyan-400 font-bold text-xs tracking-wider mb-2 block">PANEL FEATURES (Each line = 1 feature)</label>
                    <textarea
                      rows={4}
                      value={editingPanel.featuresText}
                      onChange={(e) => setEditingPanel({...editingPanel, featuresText: e.target.value})}
                      className="w-full bg-black/40 backdrop-blur-md border border-white/20 rounded-lg py-2.5 px-3 text-xs font-mono font-semibold text-white focus:outline-none focus:border-cyan-400 transition-all resize-y"
                    />
                  </div>

                  <div className="border border-white/10 p-3 rounded-lg bg-black/10 backdrop-blur-sm">
                    <label className="text-fuchsia-400 font-bold text-xs tracking-wider mb-2 block">KEY PRICES</label>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-white w-12">1 Day:</span>
                        <input type="number" value={editingPanel.price1} onChange={(e) => setEditingPanel({...editingPanel, price1: Number(e.target.value)})} className="w-full bg-black/20 backdrop-blur-md border border-white/20 rounded p-1 text-white text-xs focus:border-fuchsia-500" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white w-12">3 Day:</span>
                        <input type="number" value={editingPanel.price3} onChange={(e) => setEditingPanel({...editingPanel, price3: Number(e.target.value)})} className="w-full bg-black/20 backdrop-blur-md border border-white/20 rounded p-1 text-white text-xs focus:border-fuchsia-500" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white w-12">7 Day:</span>
                        <input type="number" value={editingPanel.price7} onChange={(e) => setEditingPanel({...editingPanel, price7: Number(e.target.value)})} className="w-full bg-black/20 backdrop-blur-md border border-white/20 rounded p-1 text-white text-xs focus:border-fuchsia-500" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white w-12">15 Day:</span>
                        <input type="number" value={editingPanel.price15} onChange={(e) => setEditingPanel({...editingPanel, price15: Number(e.target.value)})} className="w-full bg-black/20 backdrop-blur-md border border-white/20 rounded p-1 text-white text-xs focus:border-fuchsia-500" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white w-12">30 Day:</span>
                        <input type="number" value={editingPanel.price30} onChange={(e) => setEditingPanel({...editingPanel, price30: Number(e.target.value)})} className="w-full bg-black/20 backdrop-blur-md border border-white/20 rounded p-1 text-white text-xs focus:border-fuchsia-500" />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-2">
                    <button 
                      onClick={() => setEditingPanel(null)}
                      className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-black py-3 rounded-lg transition-colors text-xs uppercase"
                    >
                      CANCEL
                    </button>
                    <button 
                      onClick={() => {
                        setPanels(prev => prev.map(p => {
                          if (p.id === editingPanel.id) {
                            const updatedFeatures = editingPanel.featuresText.split('\n').map(f => f.trim()).filter(Boolean);
                            return {
                              ...p,
                              title: editingPanel.title || "PANEL",
                              category: editingPanel.category || "NON ROOT",
                              thumbnailTitle: editingPanel.title || "PANEL",
                              image: editingPanel.image || p.image,
                              isVideo: editingPanel.isVideo,
                              videoLink: editingPanel.videoLink,
                              installLink: editingPanel.exceptFileLink || p.installLink || '',
                              exceptFileLink: editingPanel.exceptFileLink || p.exceptFileLink || '',
                              features: updatedFeatures.length > 0 ? updatedFeatures : p.features,
                              pricing: [
                                { label: "1 Day", price: editingPanel.price1 },
                                { label: "3 Day", price: editingPanel.price3 },
                                { label: "7 Day", price: editingPanel.price7 },
                                { label: "15 Day", price: editingPanel.price15 },
                                { label: "30 Day", price: editingPanel.price30 },
                              ]
                            };
                          }
                          return p;
                        }));
                        setEditingPanel(null);
                        alert('Panel details updated successfully!');
                      }}
                      className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black py-3 rounded-lg shadow-[0_0_15px_rgba(0,229,255,0.4)] transition-colors text-xs uppercase"
                    >
                      SAVE CHANGES
                    </button>
                  </div>
                </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {ensureArray(panels).length === 0 ? (
                    <div className="text-center text-gray-400 text-sm mt-10 bg-black/40 backdrop-blur-md p-6 rounded-xl border border-white/10">No active panels on website.</div>
                  ) : (
                    ensureArray(panels).map((p, idx) => (
                      <div key={`manage-panel-${p.id}-${idx}`} className="bg-black/20 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.5)]  flex flex-col gap-3">
                        <div className="flex gap-3 items-center">
                          <div className="w-16 h-16 rounded-lg bg-black/50 overflow-hidden shrink-0 border border-white/10 relative">
                            {p.isVideo ? (
                              <video src={p.image} className="w-full h-full object-cover" />
                            ) : (
                              <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                            )}
                            <span className="absolute bottom-0 right-0 bg-black/20 backdrop-blur-md text-cyan-400 text-[8px] font-bold px-1 rounded-tl">
                              {p.category || 'PANEL'}
                            </span>
                          </div>
                          <div className="flex-1 overflow-hidden text-left">
                            <h4 className="text-white font-bold text-sm truncate">{p.title}</h4>
                            <span className="text-cyan-400 text-xs font-semibold block">{p.category || 'NON ROOT'}</span>
                            <span className="text-gray-400 text-[10px] block mt-0.5">
                              Prices: ‚Çπ{p.pricing?.[0]?.price} (1D) - ‚Çπ{p.pricing?.[p.pricing.length - 1]?.price} (30D)
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                          <button 
                            onClick={() => {
                              setEditingPanel({
                                id: p.id,
                                title: p.title,
                                category: p.category || 'NON ROOT',
                                image: p.image,
                                isVideo: p.isVideo || false,
                                videoLink: p.videoLink || '',
                                exceptFileLink: p.installLink || p.exceptFileLink || '',
                                featuresText: (p.features || []).join('\n'),
                                price1: p.pricing?.find(pr => pr.label.includes('1'))?.price || 90,
                                price3: p.pricing?.find(pr => pr.label.includes('3'))?.price || 58,
                                price7: p.pricing?.find(pr => pr.label.includes('7'))?.price || 67,
                                price15: p.pricing?.find(pr => pr.label.includes('15'))?.price || 590,
                                price30: p.pricing?.find(pr => pr.label.includes('30'))?.price || 5000,
                              });
                            }}
                            className="flex-1 bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-400 border border-cyan-500/30 rounded-lg py-2.5 text-xs font-black transition-all flex items-center justify-center gap-1.5 uppercase active:scale-95 shadow-[0_0_10px_rgba(0,229,255,0.2)]"
                          >
                            <Edit size={14} /> EDIT PANEL
                          </button>
                          <button 
                            onClick={() => {
                              setPanels(prev => prev.filter(panel => panel.id !== p.id));
                            }}
                            className="flex-1 bg-red-500/20 hover:bg-red-500/40 text-red-400 border border-red-500/30 rounded-lg py-2.5 text-xs font-black transition-all flex items-center justify-center gap-1.5 uppercase active:scale-95 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                          >
                            <Trash2 size={14} /> DELETE PANEL
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {currentView === 'adminBgImage' && (
            <div className="flex flex-col gap-4 w-full animate-in fade-in zoom-in-95 duration-300 relative z-10 mt-2 pb-6">
              <div className="flex items-center gap-3 mb-1">
                <button onClick={() => setCurrentView('admin')} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors ">
                  <ArrowLeft size={20} className="text-white" />
                </button>
                <h2 className="text-xl font-black tracking-tight italic drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase">
                  BACKGROUND <span className="text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,1)]">IMAGE & FLOWERS</span>
                </h2>
              </div>

              {/* Gallery Photo Upload Box */}
              <div className="bg-black/20 backdrop-blur-md border border-amber-500/40 rounded-xl p-4 shadow-[0_4px_25px_rgba(245,158,11,0.2)]  flex flex-col gap-3">
                <h3 className="text-amber-400 font-black text-sm uppercase flex items-center gap-2">
                  <ImageIcon size={18} /> UPLOAD PHOTO FROM GALLERY (DSLR)
                </h3>
                <p className="text-gray-300 text-xs font-semibold">
                  Apne mobile gallery se koi bhi DSLR quality photo select karein. Ye poori website par live dikhai degi.
                </p>

                <label className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-fuchsia-600 hover:from-amber-400 hover:to-fuchsia-500 text-black font-black py-3.5 px-4 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.4)] text-xs uppercase tracking-wider">
                  <Download size={18} className="text-black" />
                  Gallery Se Photo Choose Karein
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (evt) => {
                          if (evt.target?.result) {
                            setBgSettings(prev => ({
                              ...prev,
                              enabled: true,
                              customImage: evt.target!.result as string
                            }));
                            alert('Gallery photo background set successfully!');
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>

                <div className="flex flex-col gap-1.5 mt-2">
                  <label className="text-gray-400 font-bold text-[10px] uppercase tracking-wider">OR PASTE DSLR PHOTO LINK (URL)</label>
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/..."
                    value={bgSettings.customImage}
                    onChange={(e) => setBgSettings({ ...bgSettings, enabled: true, customImage: e.target.value })}
                    className="w-full bg-black/50 border border-white/20 rounded-lg py-2.5 px-3 text-xs font-semibold text-white focus:outline-none focus:border-amber-400 transition-all"
                  />
                </div>
              </div>

              {/* Preset HD Wallpapers */}
              <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.5)]  flex flex-col gap-3">
                <h3 className="text-cyan-400 font-black text-xs uppercase flex items-center gap-1.5">
                  <Sparkles size={16} /> DSLR HD PRESET WALLPAPERS
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { name: "Neon Cyber", url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop" },
                    { name: "AMOLED Bloom", url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=2070&auto=format&fit=crop" },
                    { name: "Galaxy Glow", url: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=2070&auto=format&fit=crop" },
                    { name: "Crystal Fall", url: "https://images.unsplash.com/photo-1434394354979-a235cd36269d?q=80&w=2070&auto=format&fit=crop" },
                    { name: "Dark Floral", url: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=2070&auto=format&fit=crop" },
                    { name: "Gold Dust", url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=2070&auto=format&fit=crop" }
                  ].map((preset, idx) => (
                    <button
                      key={`wall-preset-${preset.name}-${idx}`}
                      onClick={() => setBgSettings({ ...bgSettings, enabled: true, customImage: preset.url })}
                      className={`relative h-20 rounded-lg overflow-hidden border transition-all ${bgSettings.customImage === preset.url ? 'border-amber-400 scale-105 shadow-[0_0_12px_rgba(251,191,36,0.8)]' : 'border-white/20 hover:border-white/50'}`}
                    >
                      <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-md flex items-end p-1">
                        <span className="text-[9px] font-bold text-white truncate drop-shadow">{preset.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Sato-Rang (7 Color) Falling Flowers Settings */}
              <div className="bg-black/20 backdrop-blur-md border border-fuchsia-500/40 rounded-xl p-4 shadow-[0_4px_25px_rgba(217,70,239,0.2)]  flex flex-col gap-3">
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <h3 className="text-fuchsia-400 font-black text-xs uppercase flex items-center gap-1.5">
                    <Palette size={16} /> RANG BIRANGI SATO RANG PHOOL (LIVE FLOWERS)
                  </h3>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={bgSettings.enableFlowers} 
                      onChange={(e) => setBgSettings({ ...bgSettings, enableFlowers: e.target.checked })} 
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-fuchsia-600"></div>
                  </label>
                </div>

                <p className="text-gray-300 text-xs">
                  Red, Yellow, Green, Cyan, Blue, Violet & Orange (Sato Rang) ke live bloom phool har second display ke upar girte rahenge.
                </p>

                <div className="grid grid-cols-2 gap-3 mt-1">
                  <div>
                    <label className="text-gray-400 font-bold text-[10px] uppercase block mb-1">FALLING SPEED</label>
                    <select
                      value={bgSettings.flowerSpeed}
                      onChange={(e) => setBgSettings({ ...bgSettings, flowerSpeed: Number(e.target.value) })}
                      className="w-full bg-black/20 backdrop-blur-md border border-white/20 rounded-lg py-2 px-2 text-xs font-bold text-fuchsia-300 focus:outline-none focus:border-fuchsia-500"
                    >
                      <option value={0.6} className="bg-black text-white">Fast (Tez Girna)</option>
                      <option value={1} className="bg-black text-white">Normal (Smooth)</option>
                      <option value={1.8} className="bg-black text-white">Slow (Dheere Dheere)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-400 font-bold text-[10px] uppercase block mb-1">TEXT READABILITY TINT</label>
                    <select
                      value={bgSettings.darknessOverlay}
                      onChange={(e) => setBgSettings({ ...bgSettings, darknessOverlay: Number(e.target.value) })}
                      className="w-full bg-black/20 backdrop-blur-md border border-white/20 rounded-lg py-2 px-2 text-xs font-bold text-cyan-300 focus:outline-none focus:border-cyan-500"
                    >
                      <option value={15} className="bg-black text-white">100% Bright (DSLR Clear)</option>
                      <option value={30} className="bg-black text-white">Medium Tint (Recommended)</option>
                      <option value={50} className="bg-black text-white">Darker Tint</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setBgSettings({
                      enabled: false,
                      customImage: '',
                      enableFlowers: true,
                      flowerSpeed: 1,
                      darknessOverlay: 30
                    });
                    alert('Background reset to original theme!');
                  }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-xl transition-colors text-xs uppercase"
                >
                  Reset Default
                </button>
                <button
                  onClick={() => {
                    alert('Background Image and 7-Color Live Falling Flowers applied live to whole website!');
                    setCurrentView('home');
                  }}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-fuchsia-600 hover:from-amber-400 hover:to-fuchsia-500 text-black font-black py-3 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.5)] transition-all text-xs uppercase tracking-wider"
                >
                  Apply Live
                </button>
              </div>
            </div>
          )}

          {currentView === 'keyPending' && (
            <div className="flex flex-col items-center justify-center gap-6 w-full h-[60vh] animate-in fade-in zoom-in-95 duration-300 relative z-10 mt-2">
              {keyRequests.find(r => r.user === (userProfile.email || userProfile.phone || 'Guest') && r.status === 'PENDING') ? (
                <>
                  <div className="relative w-48 h-48 flex items-center justify-center">
                     {/* Circular Animation */}
                     <svg className="absolute inset-0 w-full h-full animate-[spin_4s_linear_infinite]" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="96" cy="96" r="80" fill="none" stroke="#d946ef" strokeWidth="4" strokeDasharray="100, 20" strokeLinecap="round" />
                     </svg>
                     <svg className="absolute inset-0 w-full h-full animate-[spin_3s_linear_infinite_reverse]" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="96" cy="96" r="90" fill="none" stroke="#00e5ff" strokeWidth="2" strokeDasharray="50, 40" strokeLinecap="round" opacity="0.5" />
                     </svg>
                     
                     <div className="text-center flex flex-col items-center">
                       <Key size={40} className="text-fuchsia-400 animate-pulse mb-2" />
                       <span className="text-white font-black text-2xl drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">{countdown}s</span>
                     </div>
                  </div>
                  <div className="text-center">
                    <h2 className="text-xl font-black tracking-tight text-white uppercase drop-shadow-md mb-2">
                      PENDING <span className="text-fuchsia-500">KEY</span>
                    </h2>
                    <p className="text-gray-400 text-sm max-w-[250px] mx-auto">Wait for the system to process your key request. Admin is approving.</p>
                  </div>
                  <button onClick={() => setCurrentView('home')} className="mt-4 px-6 py-2 border border-white/20 rounded-full text-white font-bold hover:bg-white/10 transition-colors">
                    Back to Home
                  </button>
                </>
              ) : (
                <div className="text-center bg-green-500/10 border border-green-500/30 p-6 rounded-2xl w-full max-w-sm">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                    <CheckCircle size={32} className="text-green-400" />
                  </div>
                  <h2 className="text-xl font-black text-white mb-2">KEY APPROVED!</h2>
                  <p className="text-gray-400 text-sm mb-4">Your key has been delivered.</p>
                  <div className="bg-black/50 border border-white/10 p-4 rounded-lg mb-4 flex flex-col items-center justify-center relative">
                    <span className="text-green-400 font-mono text-sm tracking-wider whitespace-pre-wrap break-all w-full text-left">
                      {keyRequests.find(r => r.user === (userProfile.email || userProfile.phone || 'Guest') && r.status === 'APPROVED')?.deliveredKey}
                    </span>
                    <button 
                      onClick={() => {
                         const key = keyRequests.find(r => r.user === (userProfile.email || userProfile.phone || 'Guest') && r.status === 'APPROVED')?.deliveredKey;
                         if(key) {
                           navigator.clipboard.writeText(key);
                           alert('Key copied!');
                         }
                      }}
                      className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors bg-white/10 p-1.5 rounded"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                  <button onClick={() => setCurrentView('profile')} className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-3 rounded-xl shadow-[0_0_15px_rgba(34,197,94,0.4)] transition-transform hover:scale-105">
                    View in Profile
                  </button>
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* Full HD Media Preview Modal */}
      {previewMedia && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md  flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-black/20 backdrop-blur-md border border-cyan-500/40 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,229,255,0.4)] flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20 backdrop-blur-md">
              <span className="text-white font-black text-sm uppercase tracking-wide truncate">{previewMedia.title || "Panel Media HD View"}</span>
              <button 
                onClick={() => setPreviewMedia(null)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-3 flex-1 flex items-center justify-center overflow-auto bg-black flex-col">
              {(() => {
                const yt = getYouTubeInfo(previewMedia.youtubeLink) || getYouTubeInfo(previewMedia.url);
                if (yt) {
                  return (
                    <div className="w-full flex flex-col items-center gap-3">
                      <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/20 shadow-[0_8px_32px_rgba(255,255,255,0.15)] bg-transparent">
                        <iframe 
                          src={yt.embedUrl} 
                          title={previewMedia.title || "YouTube Video"}
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full pt-1">
                        <span className="text-cyan-400 font-bold text-xs flex items-center gap-1.5 bg-cyan-950/60 px-3 py-1.5 rounded-lg border border-cyan-500/30">
                          <Zap size={14} className="fill-cyan-400" /> Website Par Live Play Ho Raha Hai
                        </span>
                        <a 
                          href={yt.youtubeUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-black py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(220,38,38,0.8)] text-xs uppercase tracking-wider transition-all hover:scale-105 active:scale-95"
                        >
                          <Youtube size={18} className="fill-white" />
                          YouTube App Par Dekhein (Open in YouTube)
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    </div>
                  );
                }

                if (previewMedia.isVideo) {
                  return (
                    <video 
                      src={previewMedia.url} 
                      controls 
                      autoPlay 
                      className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
                    />
                  );
                }

                return (
                  <img 
                    src={previewMedia.url} 
                    alt={previewMedia.title} 
                    className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
                  />
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Single Telegram Logo - Fixed at the very bottom right of the website */}
      <a 
        href={supportLinks.ownerTelegram || supportLinks.telegram || 'https://t.me/Premjodvip'}
        target="_blank"
        rel="noreferrer"
        className="floating-telegram-btn fixed bottom-5 right-5 sm:bottom-6 sm:right-6 bg-[#0088cc] hover:bg-[#0099e6] p-3 sm:p-3.5 rounded-full shadow-[0_0_25px_rgba(0,136,204,0.9)] border-2 border-white/80 hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center pointer-events-auto group cursor-pointer"
        style={{ position: 'fixed', zIndex: 9999 }}
        aria-label="Telegram Support"
        title="Official Telegram"
      >
        <Send size={20} className="text-white ml-[-1px] mt-[1px] drop-shadow-[0_0_8px_rgba(255,255,255,0.9)] group-hover:rotate-12 transition-transform" />
      </a>

      {/* 1. First Time Full Screen DSLR Quality Circular Ring Loading Screen & Flower Rain Phase */}
      {isAppLoading && (
        <div className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden touch-none overscroll-none">
          {/* Ambient Glow Orbs */}
          <div className="absolute top-[20%] left-[20%] w-80 h-80 bg-fuchsia-600/30 rounded-full blur-[120px] animate-pulse pointer-events-none"></div>
          <div className="absolute bottom-[20%] right-[20%] w-80 h-80 bg-cyan-500/30 rounded-full blur-[120px] animate-pulse pointer-events-none"></div>

          {loadingPhase === 'ring' ? (
            <div className="relative max-w-[370px] w-full bg-black/95 backdrop-blur-2xl border-3 rounded-[32px] animate-satorang-border shadow-[0_0_80px_rgba(255,0,128,0.8)] p-6 flex flex-col items-center justify-center gap-6 animate-in fade-in duration-300">
              {/* DSLR Glowing Animated Circular Ring */}
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
                {/* Outer Rainbow Ring 1 */}
                <svg className="absolute inset-0 w-full h-full animate-[spin_5s_linear_infinite]" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="46" fill="none" stroke="url(#rainbow-grad-1)" strokeWidth="3" strokeDasharray="180, 50" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="rainbow-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ff0055" />
                      <stop offset="33%" stopColor="#ffcc00" />
                      <stop offset="66%" stopColor="#00e5ff" />
                      <stop offset="100%" stopColor="#d500f9" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Inner Counter Rotating Ring 2 */}
                <svg className="absolute inset-0 w-full h-full animate-[spin_3.5s_linear_infinite_reverse]" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="url(#rainbow-grad-2)" strokeWidth="2.5" strokeDasharray="100, 60" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="rainbow-grad-2" x1="100%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#00e676" />
                      <stop offset="50%" stopColor="#ff6d00" />
                      <stop offset="100%" stopColor="#3d5afe" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Pulsing Core Ring 3 */}
                <div className="absolute inset-6 rounded-full border border-fuchsia-500/40 bg-gradient-to-br from-fuchsia-950/60 via-black to-cyan-950/60 shadow-[0_0_50px_rgba(217,70,239,0.5)] flex flex-col items-center justify-center p-4">
                  <Sparkles size={32} className="text-yellow-400 animate-bounce mb-1 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]" />
                  <h1 className="text-xl sm:text-2xl font-black italic tracking-wider text-white uppercase drop-shadow-[0_2px_10px_rgba(255,255,255,0.8)]">
                    PREM <span className="text-amber-400">STORE</span>
                  </h1>
                  <span className="text-2xl sm:text-3xl font-black text-cyan-300 font-mono tracking-tight mt-1 drop-shadow-[0_0_15px_rgba(0,229,255,0.8)]">
                    {loadingPercent}%
                  </span>
                </div>
              </div>

              {/* Progress Text & Badge */}
              <div className="flex flex-col items-center gap-2 max-w-xs">
                <span className="text-xs font-black tracking-widest text-emerald-400 uppercase bg-emerald-950/80 border border-emerald-500/50 px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                  PREM STORE PREMIUM PANEL
                </span>
                <p className="text-gray-400 text-[11px] font-semibold">Preparing premium cheats, files & panels...</p>
              </div>

              {/* Animated Progress Bar */}
              <div className="w-64 h-2 bg-black/20 backdrop-blur-md border border-white/20 rounded-full overflow-hidden shadow-inner p-0.5">
                <div 
                  className="h-full bg-rainbow-animated rounded-full transition-all duration-75 ease-out shadow-[0_0_15px_rgba(255,255,255,0.8)]"
                  style={{ width: `${loadingPercent * 10}%` }}
                ></div>
              </div>
            </div>
          ) : (
            /* Phase 2: Live Flower Rain Celebration */
            <div className="relative flex flex-col items-center justify-center gap-4 animate-in zoom-in-90 duration-500 z-10">
              <div className="p-6 rounded-3xl bg-black/20 backdrop-blur-md border-2 border-fuchsia-500 shadow-[0_0_60px_rgba(217,70,239,0.8)] text-center flex flex-col items-center">
                <Sparkles size={48} className="text-amber-300 animate-spin mb-2" />
                <h2 className="text-3xl font-black italic text-white uppercase tracking-wider drop-shadow-[0_0_20px_rgba(255,255,255,1)]">
                  PREM <span className="text-fuchsia-400">STORE</span>
                </h2>
                <p className="text-xs font-bold text-cyan-300 tracking-widest uppercase mt-1 animate-pulse">
                  üå∏ LIVE FLOWER RAIN ACTIVATED üå∏
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. LORD PREM Welcome Banner Popup Modal (With 7-Color Animated Rainbow Border) */}
      {!isAppLoading && showLordPremModal && (
        <div className="fixed top-0 left-0 right-0 bottom-0 w-full h-full z-[120] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-4 animate-in fade-in zoom-in-95 duration-300 select-none touch-none overscroll-none">
          {/* Card Wrapper with 7-Color Live Animated Rainbow Border - Exact Dead Center */}
          <div className="relative max-w-[350px] sm:max-w-[390px] w-full bg-black/90 backdrop-blur-xl border-3 rounded-[26px] animate-satorang-border shadow-[0_0_80px_rgba(255,0,128,0.9)] overflow-hidden flex flex-col">
            
            {/* Top Right Floating Close Button (Black/Yellow Ring) */}
            <button 
              onClick={() => {
                setShowLordPremModal(false);
                setShowImportantNoticeModal(true);
              }}
              className="absolute top-2.5 right-2.5 z-30 bg-black/90 border-2 border-yellow-400 hover:border-yellow-300 text-yellow-400 hover:text-white rounded-full p-1.5 shadow-[0_0_15px_rgba(250,204,21,0.9)] transition-transform hover:scale-110 active:scale-90"
              aria-label="Close modal"
            >
              <X size={18} strokeWidth={3} />
            </button>

            {/* Poster Main Banner Body */}
            <div className="relative w-full aspect-[16/12] bg-black overflow-hidden flex flex-col items-center justify-between p-4">
              {/* Generated Throne Image Background - 8K HD Crystal Clear Clarity */}
              <img 
                src={lordPremThrone} 
                alt="LORD PREM Throne" 
                className="absolute inset-0 w-full h-full object-cover opacity-95 filter brightness-110 contrast-150 saturate-150 scale-100"
                referrerPolicy="no-referrer"
              />
              
              {/* Dark Gradient Overlay for Typography Readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60 pointer-events-none"></div>

              {/* Header Handles Line */}
              <div className="relative z-10 text-center pt-1">
                <div className="rainbow-box-container inline-block mx-auto mb-2 shadow-[0_0_20px_rgba(255,0,85,0.4)]">
                  <div className="rainbow-box-content bg-black/80 px-4 py-2 rounded-2xl flex items-center justify-center">
                    <span className="animate-satorang-text text-xs sm:text-sm font-black uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,1)] flex items-center justify-center gap-1.5">
                      ‚ú¶ CONNECT WEBSITE MAKING ‚ú¶
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 mt-1.5 text-xs font-black tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                  <a 
                    href="https://t.me/Premjodvip" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-cyan-300 hover:text-cyan-200 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-400/60 px-2.5 py-1 rounded-full transition-all flex items-center gap-1 active:scale-95 shadow-[0_0_10px_rgba(0,229,255,0.3)]"
                  >
                    @Premjodvip
                  </a>
                  <a 
                    href="https://t.me/FFH4XJOD" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-amber-400 hover:text-amber-300 bg-amber-950/80 hover:bg-amber-900 border border-amber-400/60 px-2.5 py-1 rounded-full transition-all flex items-center gap-1 active:scale-95 shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                  >
                    @FFH4XJOD
                  </a>
                </div>
              </div>

              {/* Central Title: LORD PREM with 1-Second Live Satorang (7 Colors) Color Cycling */}
              <div className="relative z-10 text-center my-auto">
                <h1 className="text-4xl sm:text-5xl font-black tracking-tight italic uppercase animate-satorang-text drop-shadow-[0_4px_20px_rgba(0,0,0,1)] leading-none">
                  LORD
                </h1>
                <h1 className="text-4xl sm:text-5xl font-black tracking-wider italic uppercase animate-satorang-text drop-shadow-[0_4px_20px_rgba(0,0,0,1)] leading-tight mt-1" style={{ animationDelay: "0.5s" }}>
                  PREM
                </h1>
              </div>

              {/* Bottom Decorative Accent */}
              <div className="relative z-10 w-full flex items-center justify-center gap-2 pb-1">
                <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-amber-400 to-transparent"></div>
                <span className="text-[10px] font-black text-amber-300 tracking-widest uppercase">FFH4CKJODVIP</span>
                <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-amber-400 to-transparent"></div>
              </div>
            </div>

            {/* Bottom Bright Green CUSTOMER SUPPORT Button */}
            <div className="p-3 bg-black/60 backdrop-blur-md border-t border-white/10 flex flex-col">
              <a 
                href={supportLinks.telegram || 'https://t.me/yourchannel'} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={() => {
                  setShowLordPremModal(false);
                  setShowImportantNoticeModal(true);
                }}
                className="w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-black font-black py-3 px-4 rounded-xl flex items-center justify-center gap-2 uppercase tracking-wider text-xs sm:text-sm shadow-[0_0_25px_rgba(16,185,129,0.8)] transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Send size={18} className="fill-black text-emerald-950 shrink-0" />
                CUSTOMER SUPPORT
              </a>
            </div>
          </div>
        </div>
      )}

      
      {!isAppLoading && !showLordPremModal && showImportantNoticeModal && (
        <div className="fixed top-0 left-0 right-0 bottom-0 w-full h-full z-[120] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-4 animate-in fade-in zoom-in-95 duration-300 select-none overflow-y-auto">
          {/* Card Wrapper with Long/Spacious Height (Lambai) & 7-Color Live Animated Rainbow Border */}
          <div className="relative max-w-[360px] sm:max-w-[420px] w-full bg-black/95 backdrop-blur-2xl border-3 rounded-[26px] animate-satorang-border shadow-[0_0_80px_rgba(255,204,0,0.9)] overflow-hidden flex flex-col p-4 sm:p-5 gap-3 text-left my-auto">
            
            {/* Top Right Close Button */}
            <button 
              onClick={() => setShowImportantNoticeModal(false)}
              className="absolute top-3 right-3 z-30 bg-black/90 border border-yellow-400 hover:border-yellow-300 text-yellow-400 hover:text-white rounded-full p-1.5 transition-transform hover:scale-110 active:scale-90 shadow-md"
              aria-label="Close notice"
            >
              <X size={16} />
            </button>

            {/* Header */}
            <div className="flex flex-col items-center justify-center text-center gap-1 border-b border-white/15 pb-2 pr-6">
              <div className="text-3xl text-yellow-400 animate-bounce leading-none">‚ö†Ô∏è</div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight uppercase italic drop-shadow-[0_2px_10px_rgba(0,0,0,1)] animate-satorang-text">
                IMPORTANT NOTICE
              </h2>
            </div>

            {/* Body Text with Great Vertical Readability (Achhi Lambai) */}
            <div className="flex flex-col gap-2.5 text-xs sm:text-[13px] text-gray-200 leading-relaxed font-medium">
              <p className="text-amber-300 font-black text-center text-xs sm:text-sm bg-amber-950/40 border border-amber-400/30 p-2 rounded-xl">
                üì¢ Please dhyan se suno or padho uske baad panel buy karo!
              </p>

              <p className="text-gray-200">
                Agar tumhara phone <strong className="text-pink-400 font-black">NON ROOT</strong> hai, To <strong className="text-emerald-400 font-black">Root panel</strong> mat Buy karna Nhi To work Nhi karega Isliye Achhe se Panel ka Naam padh ke Buy Kiya karo.
              </p>

              <p className="text-gray-200">
                Apka Phone <strong className="text-cyan-400 font-black">NON ROOT</strong> hai, To <strong className="text-cyan-400 font-black">Non-Root</strong> Hi buy kiya karo. Me nahi chahta ki tumhara ek bhi rupiya waste ho.
              </p>

              <p className="font-bold text-white bg-white/5 border border-white/10 p-2 rounded-xl text-center text-[11px] sm:text-xs">
                Isliye apne device ke hisaab se hi panel buy karo.
              </p>

              {/* Root & Non-Root Boxes */}
              <div className="flex flex-col gap-2 my-1">
                <div className="bg-emerald-950/70 border border-emerald-500/50 p-2.5 rounded-xl flex items-center gap-2 text-xs font-bold text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                  <span>‚úÖ <span className="text-emerald-400 font-black">Root Device</span> Hai ‚Üí <span className="text-emerald-400 font-black">Root Panel</span> Buy Karo</span>
                </div>
                <div className="bg-cyan-950/70 border border-cyan-500/50 p-2.5 rounded-xl flex items-center gap-2 text-xs font-bold text-cyan-300 shadow-[0_0_10px_rgba(0,229,255,0.2)]">
                  <span>‚úÖ <span className="text-cyan-400 font-black">Non-Root Device</span> Hai ‚Üí <span className="text-cyan-400 font-black">Non-Root Panel</span> Buy Karo</span>
                </div>
              </div>

              {/* Warning reminder */}
              <div className="flex items-center justify-center gap-1.5 text-xs text-amber-200/90 fxú‰[]r„∆~˜)fô‘.π%P‡üVíWrq)≠óeâRD…ójÀ;Ü‰X¯Û EÀ|…[^í‰¡ï[$◊…‚#§g Å¡Ä§÷q%©¿.ëÛ”›Ûı◊=Ωæ#ﬂ±QD"√"^DXÂ¯3§\Ø√ {«?ˇÙóø˛ÛoFΩ©ÔáÕiHú≈≤}ÔEÑÊ8åZ¯3Ü\ﬂ#ã◊ª‚•´◊ª6ΩœﬂåoÂÓ=ÓæD=á2#jÙfEæá^Ó.ÛÔé‰}eﬂÎ9‘∫;z¨÷–—1z,¨'$—pÍœ˚n‡≥{ëÂ‹∑±Sc'$µœÔ^º'éÂª‰kZWmñKÂÜÂ‡0`óUÊ∆xÊ8h41&€mDæ¡–ò˘ÆPÔŒÿ3MtO1¥≥¶!|Úﬂ–$ò±¿!‚◊‘ø'ÏpıF'Ω∑j«Ô	]ŒßÙ1ˆπÇl›°`a¥ÛgûMl„¡A·€˛‹∏5ø5ømö¡√∑l2¬’f„’Œ+sßŸ:ÿ1Îù⁄1ÏÖ4¢æg`X¿,≥0hXw‘õsj&}—ÿ!Üv√ÿú–w≥0¢„EÚsÇ£â∞—{rZ&}–©‰$W∞aJ7Éì”´·uwpÇû£ﬁ≈‡∫?∏9’ôŸÎ]iŸªä·Â~÷ñâıqªk’—õõo–Wßﬂ†ﬁª”ﬁW7◊Ë¸‚§{Ü™=∂#Ï=á`Üﬁù†ﬂÕ∞C£E-còè÷îXw˛,:¡Fœü£™jÑñÔÖ¢·Å˝„÷¢@Gà≈7nB¬Í4<Û'b˜=ﬁâÚ®oÆtÍ3:°v.ﬂ4G(;ózÓ°˙¶MCl#Çóp8îÿ=¿÷˙"ˇªû6<D¶⁄…8;ˆ9é¶u?TÕe^F:ZMÌAö≈Ï@	}Å™99å∞É=ËÔôL˚ËÕ‡Á˘´ñˇ©ªkYß.¶|ºÌ%Û«‘!Yu¿4≤Oàh˝„èπÊ¡0êﬂ|1ôë0z¡áéø~æÇ:F¢ÛP5kß`óY‹”ËÏÜâ2é‡d9Âü#å‹Ö/1∂LÂ«∆m£e~‡P#6˛Ó4ÖOõA'#g∆å&Ï˛ç€4 ¥›√¿h#ÏQGƒ†c[|˛‡√»‘ÉùãÏ√Z =†bEÜ«WœëiÏ ƒ,<ã|≈≠®eƒ¡BÀ`2¿Rk0ÈüB|£›7V@Z≤:X‹»g I∏ªmÓÒwìÖ0LΩLL∂À!·+=Ó¶ÎôR€&û!ˇcXæÉ∏†Ñº:·ZıéÑDÆ4‰jEÄTø≈·Á⁄–◊pÏ K<_©Ô+x?uΩT=_MÌ,Á´(Ùùxnv≠ÿﬁZ`X-3/w)æX⁄âﬂjß^Iy–J\S±e∆c%*Zåó„ âØcüπÒã“4¶‚PÃD©Æ]),3‹¡#‚U§êúT€jò–ÔQH GèçΩ%
#Êﬂë˜‘é¶Gè≠%⁄-“ùƒi4˝é`.>çfU(ÏUaaâ‡G…!¿›F#x0c_GÂîŒÁo ˇ$íÁ jN¥åb∑Y¶l˛∞cnFìÇﬁ√)„∆ÃmæFGª˘⁄µöÖ¿RÄ√¿Ñ&o$÷J”T¥“¨w4z——D:⁄°¶Õ¨–ƒrFú¡ñó€|íÂZ)7äƒN^ë&
ÙÅZYÜ&Äk%Ñ&H`?ëÇπ√ˇkî,xän‚ª”¶vAAa=∑çIÒHÍBlX±®ê∏îG	ï„+rO…úsa†%Ç,V‘¡·ın∞•∏uÃ_nçs h‘√ÃF=~lµO¿hocZÊ∏ÒÍÉbØÈ÷»πDÈ<åv
wcçPœ”D∫-öÿ¸àDs"∑!~\≤iMæiõz3Á∑†-°°v¢!√≠ÁÊ∑Ó?+«ó›¡Ètœµ‹y›êY œ;&úD∫»’LbÁ›4ÖÛéÿÃ≥¿Wés4π£ÁöFYñMjÕÜ˝_UƒYwÄNNØª˝≥·SUa-∞ó—ÉÿõäHaãûq˜ˇ&—À´~Ô…¶ùçñÖ0ˇÒáø?Ê¢ñßäÒ1FÒ@P7õ_Gÿ≤q	√éùeâ+ë!vÔ‚ÊÚå≤?ÑoÉkTÕØ¢n˘6Y÷ ÖõÙcpÒÈ„∆R9ñJRCV?]lAd4û`ä)¡¥Ûà∑)	R9~€tœP˜úKÒ©∂(¬3^3ÛPCé5µ⁄;çW;˚2bëV<˛D.˜Œ±I˜¿–¬=™èOt: ˘YŒÌ”x¢≠RÃ‘†ó≠Û∆ÇÃóö≠∑U-·ÜÈÍ-Á:•üç&'õËÜ8gÂÙÖFÊb“[‚Ø†%˙—©Ã¢b»Øhƒ≤®Ë‹cg”ñƒ≠œ;‚ì-Ó7~AX9≈ﬁöWIXÊ_¨ízÑŸÑDu—±f„Ú<ìE¶ EÑUNÎ_÷—≤?hòF∑_å’¯•√h¨¨f_o5M3õÈx8¥H`P@á˘„˚÷,<OÍ Ûî…y+Däåb2,Q3wM‡±&pè•,ÉwêµÌê.gÿR zaÊÈØ&∑¨¶ììTs&ôú	Ê2˘‰$√\íM~0⁄R¶AÈﬂv—ùöVíŒ:…ÍΩèó÷≥3¬…Ω˜ñ[‚î1üùáÓæ7DLå(éπëar»P˙ZÚ ©®Ã∏’pfY$∑SÎ‡’qW=∆#áLÔﬁc
Ä‰'[á¡D!˙~6'˜4P]‰g‹∫>¶`f’‚ ÒÃ™”&$∂`@¿LI›ÛÁ’2êU∑Åv7BØQ≥˝rœ‰ˇ7L”¨’ÍÒ&—T‰v∑‰N∞ÓÜ&ö”ª˚2Á+©$*·°ï„o¯WQD®*∂-Ï0ƒ}ÜàåkákôR©ú3¨ı8øéƒ]T´V∞É¨æ˝ ^'ıxÚr?ï>GËé,é?
√1¨¿¯Ì£H˙»ø¬ Àèz@ì◊∆ºÏé®õÂö’GƒG:DÒê;iäB‹JÛKÕ)ü“oOŸB’è?ˇÙß?&JèG}Ü8œ ÙºL|ˆq€1x®æx±ˆï¬!cˆ {É¯H†cr?ÁdW∑M’wÆéyNOlÅ¯Vö∫-R*p<_Æ†ë∫û”S®ƒ!ÑÆz∞òÀÁöùıÑŸ´lÉKF#©È≠€éô
†ê¡Ÿ qµ†Ïã∑o◊∆D¢„R$ØZ	Y*ÒO€KÂ4æk…mΩêQoÏoófì,´≥â±Á∏◊ˆ1⁄∫XuM∆@iú` Áù*«ÒZ◊Öˇ‡1ÛGÄâΩîÜMÂ©ôläªr,Â[6x—ãÛç%É∑Ù<t˝\÷≈jﬁò2˜ó#I&zEæÁ«ó_ë≈⁄≥£µu…J;q©CD∞#ñM≤œ2‹4+úîõä˜RLí8§V:Çö1ƒ-Î6÷7$	@∞\EJn{;ç˝ŒN£……Ì~±Ç"t∑ç∫ŸTËÔ≠Y?ÿˇ∞≈Iî8’ÎQf9§ôƒü˚À¸·±„d≥â0¡#¨¨S{:gÉo˚WÁ W'ßW‚®°™§JÄØÙ‡KÀh5î+Sè$UÎõŒ\‰∞*P
?.~ :Ñxâ.(›aq€A#åmNGP@<˛.bxJ&àCÿvÅ√ESﬂ¶àø‰B‹éÉ;_¥°=Ôû@‹[GÒ·>oT9_ ÿ
a…‹#ÕByò(ﬁÒ@—SØ^êO†à¶ÄÁ çî,k’|¡J[¨ozΩ”·ÌÕ⁄ç÷¢À”¡IÂì*X¬©?3[ƒ¨ÁRJMGÂ©¯øßV°˝ﬂ^´ÙJS_©–—¨mS©Bà#c¢´U8X’*t:¸†∞…[î*»ÖvnóÈkr?í˙Ñæ•´≈+,7˘¡2¸qDœ\î_*Ï∆_≤N W∞—≤riÈ±ò◊p$bAÁ·°r1<‘k€\ÆeÖ*àÍ≤ÓlYwÆ¨‰ì#„¸ërÅ9¨óÊDπañy'ÄÊ¡‰Yπ‘Â≤Œ>œä∑d›]IZ“È?l¥°5'∫ÿ¡_nGm5E‹÷dZ´jú¢¬∑™∑hjÉÒ¢’Ä—dô,b5ŸB%En€’Q»WÚS!Ùügm“¬àlâO/ cH°ßO-íhåhízñ!sâ©ΩVé•ø¶ab!œ¿∆ZüP¥ Â¢©ZF\ÄâtL-·  ÷AÛ'‹/-X–Ã*I1ßqâB[≤îF£;9_ú¶‰<<•@R0»»°IQ0íf$–ú „ç¶‰;d”ìÖ?@=¥Ã„ihÊ“ã©9ÛºB·‘feŒ-…R
5A\ZeﬁKë¸+G…\ÏMqÇïŸƒÁ+¯ù†eü¥æB≠ã¬9u≥√¡„SÇÛcPœÑËH"/y>ZB7Yüå„ÖEÀ/‹à©öz˝©Ë∂Ü∫‰\\`Øgë•%ˆ26c†ÿËkJÊ’†¯M]VLì€6:”≈°ÈÉLöÜÙOä@7÷⁄õ;Mp√Çª	rÚü(µ◊Fñ¬bøÓüæGÁ¢¿¨§<•<»€æ4u£ïl©‚4˜î¶9”íØí¬“%°b÷µ¢ûeï¢ñÜ›g√í}±€¸káÙ&l¨Âgˇ  ˇˇ R>d