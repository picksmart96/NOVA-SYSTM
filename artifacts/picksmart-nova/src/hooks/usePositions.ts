import { useState, useEffect, useCallback, useRef } from "react";
import { useAuthStore } from "@/lib/authStore";

export interface SelectorPosition {
  id: string;
  selectorId: string;
  selectorName: string | null;
  companyId: string | null;
  currentAisle: string | null;
  currentSlot: string | null;
  nextAisle: string | null;
  nextSlot: string | null;
  status: string;
  updatedAt: string;
}

async function getJwt(): Promise<string | null> {
  const raw = localStorage.getItem("picksmart-auth-store");
  return raw ? (JSON.parse(raw) as { state?: { jwtToken?: string } })?.state?.jwtToken ?? null : null;
}

export function usePositions(pollMs = 5000) {
  const { currentUser } = useAuthStore();
  const [positions, setPositions] = useState<SelectorPosition[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchPositions = useCallback(async () => {
    if (!currentUser) return;
    try {
      const jwt = await getJwt();
      const res = await fetch("/api/positions", {
        headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
      });
      if (res.ok) {
        const data = await res.json() as { positions: SelectorPosition[] };
        setPositions(data.positions ?? []);
      }
    } catch { /* silent */ }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    fetchPositions();
    timerRef.current = setInterval(fetchPositions, pollMs);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [currentUser, fetchPositions, pollMs]);

  const updateMyPosition = useCallback(async (currentAisle: string, currentSlot: string, nextAisle?: string, nextSlot?: string, status = "active") => {
    const jwt = await getJwt();
    await fetch("/api/positions", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}) },
      body: JSON.stringify({ currentAisle, currentSlot, nextAisle, nextSlot, status }),
    }).catch(() => {});
  }, []);

  const sendCoaching = useCallback(async (selectorId: string, message: string): Promise<boolean> => {
    const jwt = await getJwt();
    const res = await fetch("/api/coaching", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}) },
      body: JSON.stringify({ selectorId, message }),
    });
    return res.ok;
  }, []);

  function getPositionStatus(updatedAt: string): "active" | "moving" | "delayed" {
    const diff = Date.now() - new Date(updatedAt).getTime();
    if (diff < 15000) return "active";
    if (diff < 60000) return "moving";
    return "delayed";
  }

  return { positions, fetchPositions, updateMyPosition, sendCoaching, getPositionStatus };
}

export function useMyCoaching(pollMs = 8000) {
  const { currentUser } = useAuthStore();
  const [messages, setMessages] = useState<Array<{ id: string; message: string; fromName: string | null; read: boolean; createdAt: string }>>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!currentUser) return;
    try {
      const jwt = await getJwt();
      const res = await fetch("/api/coaching/mine", {
        headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
      });
      if (res.ok) {
        const data = await res.json() as { messages: Array<{ id: string; message: string; fromName: string | null; read: boolean; createdAt: string }> };
        setMessages(data.messages ?? []);
      }
    } catch { /* silent */ }
  }, [currentUser]);

  const markRead = useCallback(async (id: string) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m));
    const jwt = await getJwt();
    await fetch(`/api/coaching/${id}/read`, { method: "PATCH", headers: jwt ? { Authorization: `Bearer ${jwt}` } : {} }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    fetchMessages();
    timerRef.current = setInterval(fetchMessages, pollMs);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [currentUser, fetchMessages, pollMs]);

  return { messages, markRead, refresh: fetchMessages };
}
