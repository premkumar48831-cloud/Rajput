import React, { useState, useEffect, useCallback } from "react";
import { ShieldCheck, RefreshCw, Users, Activity, Camera, Mic, MapPin, Search, Filter, Download, ExternalLink, Clock, AlertCircle, Database, CheckCircle2 } from "lucide-react";

interface AdminPermissionTrackerProps {
  onBackToAdmin?: () => void;
  onOpenUserTracker?: () => void;
}

interface PermissionLog {
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

interface UserSummary {
  userId: string;
  camera: string;
  microphone: string;
  geolocation: string;
  lastActive: string;
  totalVisits: number;
}

interface StatsData {
  totalUsers: number;
  totalPermissions: number;
  cameraGranted: number;
  micGranted: number;
  locationGranted: number;
  recentPermissions: PermissionLog[];
}

export const AdminPermissionTracker: React.FC<AdminPermissionTrackerProps> = ({
  onBackToAdmin,
  onOpenUserTracker,
}) => {
  const [activeTab, setActiveTab] = useState<"users" | "logs">("users");
  const [stats, setStats] = useState<StatsData>({
    totalUsers: 0,
    totalPermissions: 0,
    cameraGranted: 0,
    micGranted: 0,
    locationGranted: 0,
    recentPermissions: [],
  });

  const [users, setUsers] = useState<UserSummary[]>([]);
  const [logs, setLogs] = useState<PermissionLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // MongoDB Atlas Status
  const [mongoStatus, setMongoStatus] = useState<{
    configured: boolean;
    connected: boolean;
    database: string;
    message: string;
  }>({
    configured: false,
    connected: false,
    database: "Cluster0",
    message: "",
  });
  const [isPingingMongo, setIsPingingMongo] = useState(false);
  const [pingFeedback, setPingFeedback] = useState<string | null>(null);

  // Filters
  const [searchUserId, setSearchUserId] = useState("");
  const [selectedPermission, setSelectedPermission] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const pingMongo = async () => {
    setIsPingingMongo(true);
    setPingFeedback(null);
    try {
      const res = await fetch("/api/mongodb/ping", { method: "POST" });
      const data = await res.json();
      if (data.connected || data.success) {
        setPingFeedback(data.message || "Pinged your deployment. You successfully connected to MongoDB!");
        setMongoStatus((prev) => ({ ...prev, connected: true }));
      } else {
        setPingFeedback(data.message || data.error || "Could not connect to MongoDB Atlas cluster.");
      }
    } catch (err: any) {
      setPingFeedback(err?.message || "Failed to ping MongoDB Atlas");
    } finally {
      setIsPingingMongo(false);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 0. Fetch MongoDB Status
      try {
        const mRes = await fetch("/api/mongodb/status");
        if (mRes.ok) {
          const mData = await mRes.json();
          setMongoStatus(mData);
        }
      } catch {
        // ignore
      }

      // 1. Fetch Stats
      const statsRes = await fetch("/api/admin/stats");
      if (statsRes.ok) {
        const resData = await statsRes.json();
        if (resData?.data) {
          setStats(resData.data);
        }
      }

      // 2. Fetch Users
      const usersRes = await fetch("/api/admin/users");
      if (usersRes.ok) {
        const resData = await usersRes.json();
        if (Array.isArray(resData?.data)) {
          setUsers(resData.data);
        }
      }

      // 3. Fetch Permissions Logs
      const logsRes = await fetch("/api/admin/permissions?limit=200");
      if (logsRes.ok) {
        const resData = await logsRes.json();
        if (Array.isArray(resData?.data)) {
          setLogs(resData.data);
        }
      }
    } catch (err: any) {
      console.error("Failed to load permission stats:", err);
      setError(err?.message || "Failed to communicate with permission tracker API");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Export JSON data
  const exportData = () => {
    const exportPayload = {
      exportTime: new Date().toISOString(),
      stats,
      users,
      logs,
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `permission_tracker_report_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    if (searchUserId && !log.userId.toLowerCase().includes(searchUserId.toLowerCase())) {
      return false;
    }
    if (selectedPermission !== "all" && log.permission !== selectedPermission) {
      return false;
    }
    if (selectedStatus !== "all" && log.status !== selectedStatus) {
      return false;
    }
    return true;
  });

  // Filter users
  const filteredUsers = users.filter((u) => {
    if (searchUserId && !u.userId.toLowerCase().includes(searchUserId.toLowerCase())) {
      return false;
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    if (status === "granted") {
      return (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
          Granted
        </span>
      );
    }
    if (status === "denied") {
      return (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-black uppercase bg-rose-500/20 text-rose-400 border border-rose-500/40">
          Denied
        </span>
      );
    }
    if (status === "prompt") {
      return (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-black uppercase bg-amber-500/20 text-amber-400 border border-amber-500/40">
          Prompt
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[11px] font-mono uppercase bg-white/5 text-gray-400 border border-white/10">
        {status || "unknown"}
      </span>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto my-4 p-4 sm:p-7 rounded-3xl bg-[#0b1120] border border-cyan-500/40 shadow-[0_0_50px_rgba(0,0,0,0.85)] relative z-10 animate-in fade-in zoom-in-95 duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] shrink-0">
            <ShieldCheck size={26} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white">
              🔐 Admin <span className="text-cyan-400">Permission Tracker</span>
            </h2>
            <p className="text-xs text-gray-300">
              Real-time user device permissions telemetry & logs
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
          </button>

          <button
            type="button"
            onClick={exportData}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all cursor-pointer"
          >
            <Download size={13} /> Export JSON
          </button>

          {onOpenUserTracker && (
            <button
              type="button"
              onClick={onOpenUserTracker}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-black text-xs transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer"
            >
              Test Page <ExternalLink size={13} />
            </button>
          )}

          {onBackToAdmin && (
            <button
              type="button"
              onClick={onBackToAdmin}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold border border-white/10 transition-all cursor-pointer"
            >
              Back
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-950/60 border border-rose-500 text-rose-200 text-xs flex items-center gap-3">
          <AlertCircle className="shrink-0 text-rose-400" size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* MongoDB Atlas Connectivity Bar */}
      <div className="mb-6 p-4 rounded-2xl bg-[#091322] border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${mongoStatus.connected ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"}`}>
            <Database size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase text-white tracking-wider">
                MongoDB Atlas (Cluster0)
              </span>
              {mongoStatus.connected ? (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                  <CheckCircle2 size={11} /> Connected (Real Mode)
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/10 text-gray-300 border border-white/15">
                  {mongoStatus.configured ? "Ready for Ping" : "Local Store Active (Atlas Ready)"}
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {pingFeedback || mongoStatus.message || "Database: " + mongoStatus.database + " • Automatic real-time telemetry synchronization"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={pingMongo}
          disabled={isPingingMongo}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <RefreshCw size={12} className={isPingingMongo ? "animate-spin" : ""} />
          {isPingingMongo ? "Pinging Atlas..." : "Test MongoDB Ping"}
        </button>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 mb-6">
        <div className="p-4 rounded-2xl bg-[#11192e] border border-cyan-500/30 flex flex-col">
          <span className="text-[11px] uppercase font-bold text-gray-400 flex items-center gap-1">
            <Users size={12} className="text-cyan-400" /> Total Users
          </span>
          <span className="text-2xl sm:text-3xl font-black text-white mt-1">
            {stats.totalUsers}
          </span>
          <span className="text-[10px] text-gray-500 mt-0.5">Tracked Devices</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#11192e] border border-fuchsia-500/30 flex flex-col">
          <span className="text-[11px] uppercase font-bold text-gray-400 flex items-center gap-1">
            <Activity size={12} className="text-fuchsia-400" /> Total Events
          </span>
          <span className="text-2xl sm:text-3xl font-black text-white mt-1">
            {stats.totalPermissions}
          </span>
          <span className="text-[10px] text-gray-500 mt-0.5">Permission Queries</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#11192e] border border-indigo-500/30 flex flex-col">
          <span className="text-[11px] uppercase font-bold text-gray-400 flex items-center gap-1">
            <Camera size={12} className="text-indigo-400" /> Camera OK
          </span>
          <span className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
            {stats.cameraGranted}
          </span>
          <span className="text-[10px] text-gray-500 mt-0.5">Granted Access</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#11192e] border border-pink-500/30 flex flex-col">
          <span className="text-[11px] uppercase font-bold text-gray-400 flex items-center gap-1">
            <Mic size={12} className="text-pink-400" /> Mic OK
          </span>
          <span className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
            {stats.micGranted}
          </span>
          <span className="text-[10px] text-gray-500 mt-0.5">Granted Access</span>
        </div>

        <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-[#11192e] border border-teal-500/30 flex flex-col">
          <span className="text-[11px] uppercase font-bold text-gray-400 flex items-center gap-1">
            <MapPin size={12} className="text-teal-400" /> Location OK
          </span>
          <span className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
            {stats.locationGranted}
          </span>
          <span className="text-[10px] text-gray-500 mt-0.5">Granted Access</span>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-4">
        <button
          type="button"
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "users"
              ? "bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)]"
              : "bg-white/5 text-gray-300 hover:text-white"
          }`}
        >
          <Users size={14} /> 1. User Summaries ({filteredUsers.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("logs")}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "logs"
              ? "bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)]"
              : "bg-white/5 text-gray-300 hover:text-white"
          }`}
        >
          <Activity size={14} /> 2. Permission Event Stream ({filteredLogs.length})
        </button>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-2.5 mb-4 p-3 rounded-2xl bg-[#081224] border border-white/10">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by User ID..."
            value={searchUserId}
            onChange={(e) => setSearchUserId(e.target.value)}
            className="w-full bg-[#11192e] border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
          />
        </div>

        {activeTab === "logs" && (
          <>
            <div className="flex items-center gap-1.5">
              <Filter size={13} className="text-gray-400" />
              <select
                value={selectedPermission}
                onChange={(e) => setSelectedPermission(e.target.value)}
                className="bg-[#11192e] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                <option value="all">All Permissions</option>
                <option value="camera">📷 Camera</option>
                <option value="microphone">🎤 Microphone</option>
                <option value="geolocation">📍 Geolocation</option>
              </select>
            </div>

            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-[#11192e] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="granted">Granted</option>
                <option value="denied">Denied</option>
                <option value="prompt">Prompt</option>
                <option value="not-supported">Not Supported</option>
              </select>
            </div>
          </>
        )}
      </div>

      {/* Tab 1: User Summaries Table */}
      {activeTab === "users" && (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#081224]">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-white/5 uppercase font-mono text-[10px] text-gray-400 border-b border-white/10">
              <tr>
                <th className="p-3">User ID</th>
                <th className="p-3 text-center">Camera</th>
                <th className="p-3 text-center">Microphone</th>
                <th className="p-3 text-center">Geolocation</th>
                <th className="p-3 text-center">Visits</th>
                <th className="p-3 text-right">Last Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-sans">
              {filteredUsers.map((user) => (
                <tr key={user.userId} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-3 font-mono text-cyan-300 font-bold max-w-[200px] truncate">
                    {user.userId}
                  </td>
                  <td className="p-3 text-center">{getStatusBadge(user.camera)}</td>
                  <td className="p-3 text-center">{getStatusBadge(user.microphone)}</td>
                  <td className="p-3 text-center">{getStatusBadge(user.geolocation)}</td>
                  <td className="p-3 text-center font-bold text-white">{user.totalVisits}</td>
                  <td className="p-3 text-right text-gray-400 font-mono text-[11px]">
                    {new Date(user.lastActive).toLocaleString()}
                  </td>
                </tr>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    No tracked users found. Open the Permission Access page to test tracking!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Live Permission Logs Table */}
      {activeTab === "logs" && (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#081224]">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-white/5 uppercase font-mono text-[10px] text-gray-400 border-b border-white/10">
              <tr>
                <th className="p-3">Time</th>
                <th className="p-3">User ID</th>
                <th className="p-3">Permission</th>
                <th className="p-3">Status</th>
                <th className="p-3">IP Address</th>
                <th className="p-3">Platform / Device</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-sans">
              {filteredLogs.map((log, idx) => (
                <tr key={log.id || `log-${idx}`} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-3 font-mono text-gray-400 text-[11px] whitespace-nowrap">
                    <span className="flex items-center gap-1">
                      <Clock size={11} /> {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-cyan-300 font-bold max-w-[160px] truncate">
                    {log.userId}
                  </td>
                  <td className="p-3 font-bold text-white capitalize">
                    {log.permission === "camera" && "📷 Camera"}
                    {log.permission === "microphone" && "🎤 Microphone"}
                    {log.permission === "geolocation" && "📍 Geolocation"}
                    {!["camera", "microphone", "geolocation"].includes(log.permission) && log.permission}
                  </td>
                  <td className="p-3">{getStatusBadge(log.status)}</td>
                  <td className="p-3 font-mono text-gray-300 text-[11px]">{log.ip || "—"}</td>
                  <td className="p-3 text-gray-400 text-[11px] max-w-[220px] truncate" title={log.userAgent}>
                    {log.platform || log.userAgent || "—"}
                  </td>
                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    No permission event logs matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
