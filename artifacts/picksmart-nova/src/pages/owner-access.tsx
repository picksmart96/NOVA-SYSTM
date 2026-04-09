import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuthStore } from "@/lib/authStore";

const OWNER_TOKEN = "PSA-DRAOGO96-OWNER-2024";

export default function OwnerAccessPage() {
  const [, navigate] = useLocation();
  const { login, currentUser } = useAuthStore();
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token === OWNER_TOKEN) {
      if (!currentUser) {
        login("draogo96", "Draogo1996#");
      }
      navigate("/owner", { replace: true });
    } else {
      navigate("/login", { replace: true });
    }
  }, []);

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center">
      <p className="text-white/50 text-sm">Verifying access…</p>
    </div>
  );
}

export { OWNER_TOKEN };
