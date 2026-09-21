import React, { useState, useEffect, useCallback } from "react";
import { Camera, Mic, MapPin, CheckCircle2, XCircle, Clock, AlertTriangle, Copy, Check, ArrowLeft, ExternalLink, Shield } from "lucide-react";

interface PermissionTrackerProps {
  onBackToStore?: () => void;
}

export const PermissionTracker: React.FC<PermissionTrackerProps> = ({ onBackToStore }) => {
  const [userId, setUserId] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [statuses, setStatuses] = useState<{
    camera: "granted" | "denied" | "prompt" | "not-supported" | "unknown";
    microphone: "granted" | "denied" | "prompt" | "not-supported" | "unknown";
    geolocation: "granted" | "denied" | "prompt" | "not-supported" | "unknown";
  }>({
    camera: "unknown",
    microphone: "unknown",
    geolocation: "unknown",
  });

  const [loading, setLoading] = useState<{
    camera?: boolean;
    microphone?: boolean;
    geolocation?: boolean;
  }>({});

  // Generate in-memory persistent session User ID
  useEffect(() => {
    const generated = "user_" + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    setUserId(generated);
  }, []);

  // Fetch client IP address
  const getUserIP = useCallback(async (): Promise<string> => {
    try {
      const res = await fetch("https://api.ipify.org?format=json");
      if (res.ok) {
        const data = await res.json();
        return data.ip || "unknown";
      }
    } catch {
      // Fallback
    }
    return "unknown";
  }, []);

  // Send tracked permission data to backend
  const sendToBackend = useCallback(async (
    permission: "camera" | "microphone" | "geolocation",
    status: string
  ) => {
    try {
      const currentUserId = userId || "guest_user";
      const ip = await getUserIP();
      const payload = {
        userId: currentUserId,
        permission,
        status,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        ip,
        platform: navigator.platform,
        language: navigator.language,
      };

      await fetch("/api/track-permission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn("Could not log permission to backend:", err);
    }
  }, [userId, getUserIP]);

  // Check initial permission status via Permissions API
  const checkPermissionState = useCallback(async (
    name: "camera" | "microphone" | "geolocation"
  ) => {
    try {
      if (!navigator.permissions || !navigator.permissions.query) {
        return;
      }
      // Note: In some browsers camera/microphone queries require specific descriptor shape or are not supported
      const permissionName = (name === "geolocation" ? "geolocation" : (name as any));
      const res = await navigator.permissions.query({ name: permissionName });
      const state = res.state as "granted" | "denied" | "prompt";
      setStatuses((prev) => ({ ...prev, [name]: state }));

      res.onchange = () => {
        const newState = res.state as "granted" | "denied" | "prompt";
        setStatuses((prev) => ({ ...prev, [name]: newState }));
        sendToBackend(name, newState);
      };
    } catch {
      // Not queryable directly
    }
  }, [sendToBackend]);

  useEffect(() => {
    checkPermissionState("camera");
    checkPermissionState("microphone");
    checkPermissionState("geolocation");
  }, [checkPermissionState]);

  // Request Camera
  const requestCamera = async () => {
    setLoading((prev) => ({ ...prev, camera: true }));
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setStatuses((prev) => ({ ...prev, camera: "not-supported" }));
        await sendToBackend("camera", "not-supported");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((t) => t.stop());
      setStatuses((prev) => ({ ...prev, camera: "granted" }));
      await sendToBackend("camera", "granted");
    } catch (err) {
      console.warn("Camera request denied:", err);
      setStatuses((prev) => ({ ...prev, camera: "denied" }));
      await sendToBackend("camera", "denied");
    } finally {
      setLoading((prev) => ({ ...prev, camera: false }));
    }
  };

  // Request Microphone
  const requestMicrophone = async () => {
    setLoading((prev) => ({ ...prev, microphone: true }));
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setStatuses((prev) => ({ ...prev, microphone: "not-supported" }));
        await sendToBackend("microphone", "not-supported");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setStatuses((prev) => ({ ...prev, microphone: "granted" }));
      await sendToBackend("microphone", "granted");
    } catch (err) {
      console.warn("Microphone request denied:", err);
      setStatuses((prev) => ({ ...prev, microphone: "denied" }));
      await sendToBackend("microphone", "denied");
    } finally {
      setLoading((prev) => ({ ...prev, microphone: false }));
    }
  };

  // Request Geolocation
  const requestLocation = async () => {
    setLoading((prev) => ({ ...prev, geolocation: true }));
    try {
      if (!("geolocation" in navigator)) {
        setStatuses((prev) => ({ ...prev, geolocation: "not-supported" }));
        await sendToBackend("geolocation", "not-supported");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async () => {
          setStatuses((prev) => ({ ...prev, geolocation: "granted" }));
          await sendToBackend("geolocation", "granted");
          setLoading((prev) => ({ ...prev, geolocation: false }));
        },
        async (err) => {
          console.warn("Location permission denied:", err);
          setStatuses((prev) => ({ ...prev, geolocation: "denied" }));
          await sendToBackend("geolocation", "denied");
          setLoading((prev) => ({ ...prev, geolocation: false }));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } catch {
      setStatuses((prev) => ({ ...prev, geolocation: "denied" }));
      await sendToBackend("geolocation", "denied");
      setLoading((prev) => ({ ...prev, geolocation: false }));
    }
  };

  const copyId = () => {
    navigator.clipboard.writeText(userId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderStatusBadge = (status: string) => {
    if (status === "granted") {
      return (
        <div className="flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-bold text-xs rounded-xl mt-2.5 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
          <CheckCircle2 size={14} /> ✓ Permission Granted
        </div>
      );
    }
    if (status === "denied") {
      return (
        <div className="flex items-center justify-center gap-1.5 py-2 px-3 bg-rose-500/15 border border-rose-500/40 text-rose-400 font-bold text-xs rounded-xl mt-2.5 shadow-[0_0_15px_rgba(244,63,94,0.2)]">
          <XCircle size={14} /> ✗ Permission Denied
        </div>
      );
    }
    if (status === "prompt") {
      return (
        <div className="flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold text-xs rounded-xl mt-2.5">
          <Clock size={14} /> ⏳ Waiting for permission...
        </div>
      );
    }
    if (status === "not-supported") {
      return (
        <div className="flex items-center justify-center gap-1.5 py-2 px-3 bg-gray-500/15 border border-gray-500/40 text-gray-300 font-bold text-xs rounded-xl mt-2.5">
          <AlertTriangle size={14} /> ⚠ Not supported in your browser
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-xl w-full mx-auto my-6 p-5 sm:p-8 rounded-3xl bg-[#0b1120] border border-cyan-500/40 shadow-[0_0_50px_rgba(0,0,0,0.85)] relative z-10 animate-in fade-in zoom-in-95 duration-300">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
            <Shield size={26} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white">
              🔐 Permission <span className="text-cyan-400">Access</span>
            </h2>
            <p className="text-xs text-gray-300">
              Live Permission Tracker & Verification Engine
            </p>
          </div>
        </div>

        {onBackToStore && (
          <button
            type="button"
            onClick={onBackToStore}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/15 rounded-xl text-xs font-bold transition-all"
          >
            <ArrowLeft size={14} /> Store
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* 1. Camera Access Card */}
        <div className="p-4 rounded-2xl bg-[#11192e] border border-indigo-500/30 hover:border-indigo-500/60 transition-all shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5 font-bold text-white text-sm sm:text-base">
              <span className="text-xl">📷</span> Camera Access
            </div>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-white/5 text-gray-400 border border-white/10">
              MediaDevices API
            </span>
          </div>

          <button
            type="button"
            onClick={requestCamera}
            disabled={loading.camera}
            className="w-full py-3 px-4 rounded-xl font-black text-sm uppercase tracking-wider text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-95 active:scale-98 transition-all shadow-[0_0_20px_rgba(99,102,241,0.35)] cursor-pointer disabled:opacity-50"
          >
            {loading.camera ? "Requesting Camera Access..." : "Allow Camera"}
          </button>
          {renderStatusBadge(statuses.camera)}
        </div>

        {/* 2. Microphone Access Card */}
        <div className="p-4 rounded-2xl bg-[#11192e] border border-fuchsia-500/30 hover:border-fuchsia-500/60 transition-all shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5 font-bold text-white text-sm sm:text-base">
              <span className="text-xl">🎤</span> Microphone Access
            </div>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-white/5 text-gray-400 border border-white/10">
              AudioStream API
            </span>
          </div>

          <button
            type="button"
            onClick={requestMicrophone}
            disabled={loading.microphone}
            className="w-full py-3 px-4 rounded-xl font-black text-sm uppercase tracking-wider text-white bg-gradient-to-r from-fuchsia-500 via-pink-500 to-rose-500 hover:opacity-95 active:scale-98 transition-all shadow-[0_0_20px_rgba(217,70,239,0.35)] cursor-pointer disabled:opacity-50"
          >
            {loading.microphone ? "Requesting Mic Access..." : "Allow Microphone"}
          </button>
          {renderStatusBadge(statuses.microphone)}
        </div>

        {/* 3. Location Access Card */}
        <div className="p-4 rounded-2xl bg-[#11192e] border border-cyan-500/30 hover:border-cyan-500/60 transition-all shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5 font-bold text-white text-sm sm:text-base">
              <span className="text-xl">📍</span> Location Access
            </div>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-white/5 text-gray-400 border border-white/10">
              Geolocation API
            </span>
          </div>

          <button
            type="button"
            onClick={requestLocation}
            disabled={loading.geolocation}
            className="w-full py-3 px-4 rounded-xl font-black text-sm uppercase tracking-wider text-white bg-gradient-to-r from-cyan-500 via-teal-500 to-blue-500 hover:opacity-95 active:scale-98 transition-all shadow-[0_0_20px_rgba(6,182,212,0.35)] cursor-pointer disabled:opacity-50"
          >
            {loading.geolocation ? "Requesting Location..." : "Allow Location"}
          </button>
          {renderStatusBadge(statuses.geolocation)}
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 rounded-2xl bg-[#081528] border-l-4 border-cyan-400 text-xs text-gray-300 space-y-1.5 leading-relaxed">
        <p className="font-bold text-cyan-300 flex items-center gap-1.5 text-sm mb-1">
          <span>ℹ️</span> Information & Security
        </p>
        <p>• Your permission choices are securely tracked in the server database</p>
        <p>• This helps verify device compatibility and improve VIP features</p>
        <p>• All tracking data is encrypted and protected with real IP telemetry</p>
      </div>

      {/* User ID display */}
      <div className="mt-5 p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-2">
        <div className="font-mono text-xs text-gray-300 truncate">
          <span className="text-cyan-400 font-bold">Your ID:</span> {userId || "Generating..."}
        </div>
        <button
          type="button"
          onClick={copyId}
          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1 shrink-0 transition-all"
        >
          {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      {/* Standalone Page Link */}
      <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
        <span>View standalone version:</span>
        <a
          href="/permissions"
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold underline underline-offset-2"
        >
          Open /permissions.html <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
};
