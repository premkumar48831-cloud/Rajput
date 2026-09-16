import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Zap,
  CreditCard,
  QrCode,
  Loader2,
  X,
  ExternalLink,
  Wallet,
  Sparkles,
  Lock,
  ArrowRight,
  Info
} from "lucide-react";

interface RazorpayCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAmount?: number | string;
  userEmail?: string;
  userPhone?: string;
  userName?: string;
  paymentSettings?: any;
  onPaymentSuccess: (paymentData: {
    paymentId: string;
    orderId: string;
    amount: number;
    signature?: string;
    method: string;
  }) => void;
}

export const RazorpayCheckoutModal: React.FC<RazorpayCheckoutModalProps> = ({
  isOpen,
  onClose,
  defaultAmount = 100,
  userEmail = "",
  userPhone = "",
  userName = "VIP User",
  paymentSettings,
  onPaymentSuccess,
}) => {
  const [amount, setAmount] = useState<number | string>(defaultAmount || 100);
  const [email, setEmail] = useState(userEmail || "");
  const [phone, setPhone] = useState(userPhone || "");
  const [name, setName] = useState(userName || "VIP User");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    paymentId: string;
    orderId: string;
    amount: number;
  } | null>(null);

  const [gatewayConfig, setGatewayConfig] = useState<{
    keyId: string;
    isConfigured: boolean;
  }>({
    keyId: paymentSettings?.razorpayAppId || "rzp_test_TbWSIPFPtuOiJb",
    isConfigured: true,
  });

  // Fetch gateway configuration from server backend safely with graceful fallback
  useEffect(() => {
    let isSubscribed = true;

    const loadConfig = async () => {
      try {
        const res = await fetch("/api/razorpay/config");
        if (res.ok) {
          const data = await res.json();
          if (isSubscribed && data && data.status) {
            setGatewayConfig({
              keyId: data.key_id || paymentSettings?.razorpayAppId || "rzp_test_TbWSIPFPtuOiJb",
              isConfigured: Boolean(data.isConfigured),
            });
          }
        }
      } catch {
        // Quiet fallback to prop/default settings if backend is restarting or unreachable
        if (isSubscribed) {
          setGatewayConfig({
            keyId: paymentSettings?.razorpayAppId || "rzp_test_TbWSIPFPtuOiJb",
            isConfigured: true,
          });
        }
      }
    };

    loadConfig();

    return () => {
      isSubscribed = false;
    };
  }, [paymentSettings?.razorpayAppId]);

  useEffect(() => {
    if (defaultAmount) {
      setAmount(defaultAmount);
    }
    if (userEmail) setEmail(userEmail);
    if (userPhone) setPhone(userPhone);
    if (userName) setName(userName);
    setErrorMsg(null);
    setSuccessData(null);
  }, [isOpen, defaultAmount, userEmail, userPhone, userName]);

  if (!isOpen) return null;

  const handlePayNow = async () => {
    setErrorMsg(null);
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount < 1) {
      setErrorMsg("Please enter a valid amount (minimum ₹1)");
      return;
    }

    const cleanPhone = phone.trim().replace(/\D/g, "");
    if (cleanPhone && cleanPhone.length < 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);

    try {
      // Step 1: Request Order ID from backend
      const customKeyId = paymentSettings?.razorpayAppId || "";
      const customKeySecret = paymentSettings?.razorpaySecretKey || "";

      const orderRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: numericAmount,
          currency: "INR",
          key_id: customKeyId || "rzp_test_TbWSIPFPtuOiJb",
          key_secret: customKeySecret || "ia1CT66DiuzfVLnsM5pxu3Y7",
          notes: {
            userEmail: email || "Guest",
            userPhone: cleanPhone || "N/A",
            userName: name || "VIP User",
          },
        }),
      });

      const orderData = await orderRes.json();

      if (!orderData.status || !orderData.order_id) {
        throw new Error(orderData.error || "Failed to initiate Razorpay order from backend.");
      }

      const activeKey = orderData.key_id || gatewayConfig.keyId || "rzp_test_TbWSIPFPtuOiJb";

      // Check if Razorpay Checkout script is loaded
      if (typeof (window as any).Razorpay === "undefined") {
        // Dynamically load script if not yet ready
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Razorpay Checkout SDK."));
          document.body.appendChild(script);
        });
      }

      // Step 2: Configure & Launch Razorpay Standard Checkout
      const options = {
        key: activeKey,
        amount: orderData.amount, // in paise
        currency: orderData.currency || "INR",
        name: "FFH4X VIP Store & Panel",
        description: `Wallet Fund Credit of ₹${numericAmount}`,
        image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&h=120&fit=crop",
        order_id: orderData.order_id,
        prefill: {
          name: name || "VIP Member",
          email: email || "user@example.com",
          contact: cleanPhone || "9999999999",
        },
        notes: {
          purpose: "Wallet Recharge",
          user_email: email,
        },
        theme: {
          color: "#06b6d4",
          backdrop_color: "rgba(0,0,0,0.85)",
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          setLoading(false);
          setVerifying(true);

          try {
            // Step 3: Backend Signature & Authentic Verification
            const verifyRes = await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id || orderData.order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                amount: numericAmount,
                user_details: {
                  email,
                  phone: cleanPhone,
                  name,
                },
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyData.status && verifyData.verified) {
              setSuccessData({
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id || orderData.order_id,
                amount: numericAmount,
              });

              onPaymentSuccess({
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id || orderData.order_id,
                amount: numericAmount,
                signature: response.razorpay_signature,
                method: "RAZORPAY_GATEWAY",
              });
            } else {
              setErrorMsg(verifyData.error || "Payment verification failed. Please contact support.");
            }
          } catch (err: any) {
            console.error("Verification error:", err);
            setErrorMsg(err?.message || "Failed to verify payment with backend.");
          } finally {
            setVerifying(false);
          }
        },
      };

      const razorpayInstance = new (window as any).Razorpay(options);

      razorpayInstance.on("payment.failed", (failResponse: any) => {
        setLoading(false);
        setErrorMsg(
          failResponse.error?.description || "Payment was cancelled or failed by the bank."
        );
      });

      razorpayInstance.open();
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err?.message || "An error occurred while launching Razorpay Checkout.");
    }
  };

  const presetAmounts = [100, 250, 500, 1000, 2000, 5000];

  return (
    <div className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#070b14] border border-cyan-500/40 rounded-3xl max-w-lg w-full overflow-hidden shadow-[0_0_60px_rgba(6,182,212,0.35)] flex flex-col relative text-left">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0c1527] via-[#0e1d3a] to-[#0c1527] px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <Zap size={22} className="fill-cyan-400 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white font-black text-base tracking-wide uppercase">
                  Razorpay <span className="text-cyan-400">Checkout</span>
                </h3>
                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 border border-green-500/40 rounded text-[10px] font-bold uppercase flex items-center gap-1">
                  <ShieldCheck size={11} /> 256-Bit SSL
                </span>
              </div>
              <p className="text-xs text-gray-400 font-mono">
                Secure Backend Order & Signature Verification
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
          {successData ? (
            /* SUCCESS CONFIRMATION STATE */
            <div className="flex flex-col items-center text-center gap-4 py-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-400 flex items-center justify-center text-green-400 shadow-[0_0_30px_rgba(34,197,94,0.5)]">
                <CheckCircle2 size={36} />
              </div>

              <div>
                <h4 className="text-2xl font-black text-white uppercase tracking-wide">
                  Payment Verified!
                </h4>
                <p className="text-xs text-gray-300 mt-1">
                  ₹{successData.amount} has been successfully credited to your wallet balance.
                </p>
              </div>

              {/* Receipt Details Card */}
              <div className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 font-mono text-xs space-y-2 text-left">
                <div className="flex justify-between border-b border-white/10 pb-1.5">
                  <span className="text-gray-400">Payment ID:</span>
                  <span className="text-cyan-300 font-bold select-all">
                    {successData.paymentId}
                  </span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-1.5">
                  <span className="text-gray-400">Order ID:</span>
                  <span className="text-gray-300 font-bold select-all">
                    {successData.orderId}
                  </span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-1.5">
                  <span className="text-gray-400">Amount Paid:</span>
                  <span className="text-green-400 font-black text-sm">
                    ₹{successData.amount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Verification:</span>
                  <span className="text-green-300 font-bold flex items-center gap-1">
                    <ShieldCheck size={13} /> Authenticated by Backend
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-black font-black rounded-xl text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all cursor-pointer"
              >
                Done & Go to Dashboard
              </button>
            </div>
          ) : (
            /* CHECKOUT & ORDER SUMMARY FORM */
            <>
              {errorMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Order Summary Card */}
              <div className="bg-gradient-to-br from-[#0a1222] via-[#0d182e] to-[#070d1a] border border-cyan-500/30 rounded-2xl p-4 shadow-[0_0_30px_rgba(6,182,212,0.15)] flex flex-col gap-3">
                <div className="flex justify-between items-center border-b border-white/10 pb-2.5">
                  <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Wallet size={14} className="text-cyan-400" /> Order Summary
                  </span>
                  <span className="text-[11px] font-mono text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                    Direct Gateway
                  </span>
                </div>

                {/* Amount presets */}
                <div className="flex flex-wrap gap-1.5">
                  {presetAmounts.map((preset) => (
                    <button
                      key={`preset-${preset}`}
                      type="button"
                      onClick={() => setAmount(preset)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        Number(amount) === preset
                          ? "bg-cyan-500 text-black font-black shadow-[0_0_12px_rgba(6,182,212,0.6)]"
                          : "bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10"
                      }`}
                    >
                      ₹{preset}
                    </button>
                  ))}
                </div>

                {/* Amount Input */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                    Recharge Amount (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400 font-black text-lg">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="w-full bg-[#040812] border border-cyan-400/40 rounded-xl py-2.5 pl-8 pr-4 text-lg font-black text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(0,229,255,0.3)] transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="bg-black/40 rounded-xl p-3 border border-white/5 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-gray-400">
                    <span>Recharge Fund Value:</span>
                    <span className="text-white font-bold">₹{Number(amount) || 0}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Processing & Gateway Fee:</span>
                    <span className="text-green-400 font-bold">₹0 (Free)</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-white/10">
                    <span>Total Payable:</span>
                    <span className="text-cyan-400 text-base font-mono font-black">
                      ₹{Number(amount) || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* User Billing / Contact Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                    WhatsApp / Phone
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit number"
                    className="w-full bg-[#050914] border border-white/10 rounded-xl py-2 px-3 text-xs font-bold text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-400 transition-all font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-[#050914] border border-white/10 rounded-xl py-2 px-3 text-xs font-bold text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-400 transition-all font-mono"
                  />
                </div>
              </div>

              {/* Supported Payment Options Badge */}
              <div className="p-3 bg-black/40 border border-white/5 rounded-xl flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                  <CreditCard size={14} /> Supports:
                </span>
                <span className="text-[11px] text-gray-300 font-mono">
                  UPI, GPay, PhonePe, Paytm, QR, Cards, NetBanking
                </span>
              </div>

              {/* Pay Now Button */}
              <button
                type="button"
                onClick={handlePayNow}
                disabled={loading || verifying}
                className="w-full py-4 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-sm sm:text-base rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.6)] flex items-center justify-center gap-2 uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50 cursor-pointer border border-cyan-300/40"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Generating Order...
                  </>
                ) : verifying ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Verifying Payment...
                  </>
                ) : (
                  <>
                    <Zap size={18} className="text-yellow-300 fill-yellow-300" />
                    Pay ₹{Number(amount) || 0} via Razorpay Gateway
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              {/* Credential Status Info Helper */}
              <div className="p-3 rounded-xl bg-[#03060c] border border-white/10 text-[11px] text-gray-400 flex items-start gap-2">
                <Info size={14} className="text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-gray-300 font-bold block">
                    Razorpay Credentials Setup:
                  </span>
                  Set <code className="text-yellow-400 font-mono">RAZORPAY_KEY_ID</code> and{" "}
                  <code className="text-yellow-400 font-mono">RAZORPAY_KEY_SECRET</code> in{" "}
                  <code className="text-cyan-300 font-mono">.env</code> to connect your live or test Razorpay account.
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
