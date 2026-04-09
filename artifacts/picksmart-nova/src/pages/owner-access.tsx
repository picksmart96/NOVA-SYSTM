import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuthStore } from "@/lib/authStore";

const OWNER_TOKEN = "PSA-DRAOGO96-OWNER-2024";

export default function OwnerAccessPage() {
  const [, navigate] = useLocation();
  const login = useAuthStore((s) => s.login);
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token === OWNER_TOKEN) {
      // Always force owner login — overrides any existing session
      const ok = login("draogo96", "Draogo1996#");
      navigate(ok ? "/owner" : "/login", { replace: true });
    } else {
      navigate("/login", { replace: true });
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <p className="text-white/40 text-sm">Verifying access…</p>
    </div>
  );
}

export { OWNER_TOKEN };
