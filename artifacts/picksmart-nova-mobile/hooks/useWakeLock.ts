import { useCallback, useEffect, useRef } from "react";
import { Platform } from "react-native";

export function useWakeLock(enabled: boolean) {
  const wakeLockRef = useRef<any>(null);

  const requestWakeLock = useCallback(async () => {
    if (Platform.OS !== "web") return;
    if (typeof navigator === "undefined" || !("wakeLock" in navigator)) return;
    try {
      wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
    } catch {
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try { await wakeLockRef.current.release(); } catch {}
      wakeLockRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const handleVisibility = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible" && enabled) {
        requestWakeLock();
      }
    };
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibility);
    }
    return () => {
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibility);
      }
    };
  }, [enabled, requestWakeLock]);

  useEffect(() => {
    if (enabled) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }
    return () => {
      releaseWakeLock();
    };
  }, [enabled]);
}
