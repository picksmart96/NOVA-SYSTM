import { useState, useEffect, useRef } from "react";
import { Bell, X, AlertTriangle, ShieldAlert, TrendingDown, CheckCheck, Info } from "lucide-react";
import { useAlerts, type PsaAlert } from "@/hooks/useAlerts";
import { useAuthStore } from "@/lib/authStore";

const SEVERITY_COLOR: Record<string, string> = {
  high: "text-red-400 bg-red-500/10 border-red-500/30",
  medium: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  low: "text-blue-400 bg-blue-500/10 border-blue-500/30",
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  security: <ShieldAlert className="h-4 w-4 shrink-0" />,
  performance: <TrendingDown className="h-4 w-4 shrink-0" />,
  billing: <Info className="h-4 w-4 shrink-0" />,
  business: <Info className="h-4 w-4 shrink-0" />,
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function AlertCenter() {
  const { currentUser } = useAuthStore();
  const { alerts, unreadCount, markRead, markAllRead } = useAlerts(12000);
  const [open, setOpen] = useState(false);
  const [notifPerm, setNotifPerm] = useState<NotificationPermission>("default");
  const panelRef = useRef<HTMLDivElement>(null);
  const prevUnreadRef = useRef(0);

  const canShowAlerts = currentUser?.role === "owner" || currentUser?.role === "supervisor" ||
    currentUser?.role === "manager" || currentUser?.role === "trainer";

  useEffect(() => {
    if ("Notification" in window) setNotifPerm(Notification.permission);
  }, []);

  // Browser push notification on new high-severity alert
  useEffect(() => {
    if (unreadCount > prevUnreadRef.current && notifPerm === "granted") {
      const newest = alerts.find(a => !a.read && a.severity === "high");
      if (newest) {
        new Notification(`🚨 NOVA Alert: ${newest.type.toUpperCase()}`, {
          body: newest.message,
          icon: "/nova-logo.png",
        });
      }
    }
    prevUnreadRef.current = unreadCount;
  }, [unreadCount, alerts, notifPerm]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const requestNotifPerm = async () => {
    if ("Notification" in window) {
      const p = await Notification.requestPermission();
      setNotifPerm(p);
    }
  };

  if (!currentUser || !canShowAlerts) return null;

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(v => !v)}
        className="relative flex items-center justify-center w-9 h-9 rounded-full hover:bg-secondary/60 transition-colors"
        aria-label="Alerts"
      >
        <Bell className="h-5 w-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-[22rem] max-h-[80vh] flex flex-col rounded-xl border border-border bg-card shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
              <span className="font-bold text-sm">NOVA Alerts</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{unreadCount}</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead()}
                  title="Mark all read"
                  className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition"
                >
                  <CheckCheck className="h-4 w-4" />
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-secondary">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Notification permission prompt */}
          {notifPerm === "default" && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-yellow-500/10 border-b border-yellow-500/20 text-xs text-yellow-300">
              <Bell className="h-3.5 w-3.5 shrink-0" />
              <span className="flex-1">Enable browser notifications for critical alerts</span>
              <button
                onClick={requestNotifPerm}
                className="shrink-0 rounded bg-yellow-400 px-2 py-0.5 text-slate-900 font-bold text-xs hover:bg-yellow-300 transition"
              >
                Enable
              </button>
            </div>
          )}

          {/* Alert list */}
          <div className="overflow-y-auto flex-1 divide-y divide-border/50">
            {alerts.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No alerts — all clear ✓
              </div>
            ) : (
              alerts.slice(0, 50).map(alert => (
                <AlertRow key={alert.id} alert={alert} onRead={() => markRead(alert.id)} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AlertRow({ alert, onRead }: { alert: PsaAlert; onRead: () => void }) {
  const colorClass = SEVERITY_COLOR[alert.severity] ?? SEVERITY_COLOR.medium;
  const icon = TYPE_ICON[alert.type] ?? <Info className="h-4 w-4 shrink-0" />;

  return (
    <div
      className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-secondary/30 ${!alert.read ? "bg-secondary/10" : ""}`}
      onClick={onRead}
    >
      <div className={`mt-0.5 p-1 rounded border ${colorClass}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className={`text-xs font-bold uppercase tracking-wider ${colorClass.split(" ")[0]}`}>
            {alert.type}
          </span>
          <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(alert.createdAt)}</span>
        </div>
        <p className="text-sm text-foreground leading-snug line-clamp-2">{alert.message}</p>
        {!alert.read && (
          <div className="mt-1 flex items-center gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            <span className="text-[10px] text-muted-foreground">Unread</span>
          </div>
        )}
      </div>
    </div>
  );
}
