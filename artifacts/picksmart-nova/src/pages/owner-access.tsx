import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useAuthStore } from "@/lib/authStore";
import { Activity, ShieldCheck, Loader2 } from "lucide-react";

const OWNER_TOKEN = import.meta.env.VITE_OWNER_TOKEN as string;

export default function OwnerAccessPage() {
  const [, navigate] = useLocation();
  const loginAsync = useAuthStore((s) => s.loginAsync);
  const attempted = useRef(false);
  const [status, setStatus] = useState<"verifying" | "success" | "failed">("verifying");

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token === OWNER_TOKEN) {
      loginAsync("draogo96", "Draogo1996#").then((ok) => {
        if (ok) {
          setStatus("success");
          setTimeout(() => {
            navigate("/owner", { replace: true });
          }, 400);
        } else {
          setStatus("failed");
        }
      });
    } else {
      setStatus("failed");
    }
  }, []);

  const handleEnter = () => {
    loginAsync("draogo96", "Draogo1996#").then((ok) => {
      if (ok) navigate("/owner", { replace: true });
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-10 max-w-md w-full text-center space-y-6">

        <div className="flex justify-center">
          <div className="bg-yellow-400 text-slate-950 p-3 rounded-2xl">
            <Activity className="h-8 w-8" />
          </div>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-yellow-400 mb-1">PickSmart NOVA</p>
          <h1 className="text-2xl font-black text-white">Owner Access</h1>
        </div>

        {status === "verifying" && (
          <div className="flex items-center justify-center gap-2 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Verifying access…</span>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-green-400">
              <ShieldCheck className="h-5 w-5" />
              <span className="font-bold">Access verified</span>
            </div>
            <p className="text-slate-400 text-sm">Taking you to the Owner Panel…</p>
            <button
              onClick={handleEnter}
              className="w-full rounded-2xl bg-yellow-400 px-6 py-4 font-black text-slate-950 hover:bg-yellow-300 transition"
            >
              Enter Owner Panel
            </button>
          </div>
        )}

        {status === "failed" && (
          <div className="space-y-4">
            <p className="text-red-400 font-bold">Invalid or missing access token.</p>
            <button
              onClick={() => navigate("/login", { replace: true })}
              className="w-full rounded-2xl border border-slate-700 px-6 py-3 font-bold text-white hover:border-yellow-400 transition"
            >
              Go to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export { OWNER_TOKEN };
