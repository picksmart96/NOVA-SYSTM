import { useState, useEffect, useCallback, useRef } from "react";
import { useAuthStore } from "@/lib/authStore";

export interface PsaAlert {
  id: string;
  companyId: string | null;
  userId: string | null;
  type: string;
  message: string;
  severity: "low" | "medium" | "high";
  read: boolean;
  meta: Record<string, unknown> | null;
  createdAt: string;
}

async function getJwt(): Promise<string | null> {
  const raw = localStorage.getItem("picksmart-auth-store");
  return raw ? (JSON.parse(raw) as { state?: { jwtToken?: string } })?.state?.jwtToken ?? null : null;
}

export function useAlerts(pollMs = 10000) {
  const { currentUser } = useAuthStore();
  const [alerts, setAlerts] = useState<PsaAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAlerts = useCallback(async () => {
    if (!currentUser) return;
    try {
      const jwt = await getJwt();
      const res = await fetch("/api/alerts", {
        headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
      });
      if (res.ok) {
        const data = await res.json() as { alerts: PsaAlert[] };
        setAlerts(data.alerts ?? []);
      }
    } catch { /* silent */ }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);
    fetchAlerts().finally(() => setLoading(false));
    timerRef.current = setInterval(fetchAlerts, pollMs);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [currentUser, fetchAlerts, pollMs]);

  const markRead = useCallback(async (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
    const jwt = await getJwt();
    await fetch(`/api/alerts/${id}/read`, {
      method: "PATCH",
      headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
    }).catch(() => {});
  }, []);

  const markAllRead = useCallback(async () => {
    setAlerts(prev => prev.map(a => ({ ...a, read: true })));
    const jwt = await getJwt();
    await fetch("/api/alerts/read-all", {
      method: "POST",
      headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
    }).catch(() => {});
  }, []);

  const createAlert = useCallback(async (type: string, message: string, severity: "low" | "medium" | "high" = "medium", meta?: Record<string, unknown>) => {
    const jwt = await getJwt();
    const res = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}) },
      body: JSON.stringify({ type, message, severity, meta }),
    });
    if (res.ok) fetchAlerts();
    return res.ok;
  }, [fetchAlerts]);

  const unreadCount = alerts.filter(a => !a.read).length;

  return { alerts, loading, unreadCount, markRead, markAllRead, createAlert, refresh: fetchAlerts };
}
