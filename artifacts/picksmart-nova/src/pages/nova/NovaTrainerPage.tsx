import { useEffect, useMemo, useState } from "react";
import { Settings } from "lucide-react";
import { useTrainerStore } from "@/lib/trainerStore";
import { useAuthStore } from "@/lib/authStore";
import { ASSIGNMENTS } from "@/data/assignments";
import NovaTrainerSession from "@/components/nova/NovaTrainerSession";
import LockedAction from "@/components/paywall/LockedAction";
import { useWarehouseProfileStore } from "@/lib/warehouseProfileStore";
import { useLocation } from "wouter";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

function ConcentricOrb() {
  return (
    <div className="relative flex items-center justify-center w-44 h-44 mx-auto">
      <div className="absolute inset-0 rounded-full border-2 border-yellow-400/15" />
      <div className="absolute inset-4 rounded-full border-2 border-yellow-400/25" />
      <div className="absolute inset-8 rounded-full border-2 border-yellow-500/40" />
      <div className="absolute inset-12 rounded-full border-2 border-yellow-400/60" />
      <div className="absolute inset-16 rounded-full border-[3px] border-yellow-400/80" />
      <div className="absolute inset-[76px] rounded-full bg-yellow-400 shadow-[0_0_24px_6px_rgba(250,204,21,0.45)]" />
    </div>
  );
}

export default function NovaTrainerPage() {
  const { selectors } = useTrainerStore();
  const { lock, jwtToken, currentUser } = useAuthStore();
  const { profile, fetchProfile } = useWarehouseProfileStore();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (jwtToken) fetchProfile(jwtToken, API_BASE);
  }, [jwtToken, fetchProfile]);

  const [novaIdInput, setNovaIdInput] = useState("");
  const [activeNovaId, setActiveNovaId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const matchedSelector = useMemo(() => {
    if (!activeNovaId) return null;
    const found = selectors.find(
      (s) => (s.novaId ?? "").toLowerCase() === activeNovaId.toLowerCase()
    );
    if (!found) return null;
    return {
      ...found,
      assignments: ASSIGNMENTS.filter((a) => a.selectorUserId === found.userId),
    };
  }, [activeNovaId, selectors]);

  const handleEnterNova = async () => {
    const cleaned = novaIdInput.trim();
    if (!cleaned) {
      setError("Please enter your NOVA ID.");
      return;
    }
    const found = selectors.find(
      (s) => (s.novaId ?? "").toLowerCase() === cleaned.toLowerCase()
    );
    if (!found) {
      setError("Invalid NOVA ID. Check with your trainer.");
      return;
    }
    setError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 300));
    setLoading(false);
    setActiveNovaId(cleaned);

    fetch(`${API_BASE}/api/track`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(jwtToken ? { Authorization: `Bearer ${jwtToken}` } : {}),
      },
      body: JSON.stringify({
        event: "nova_trainer_launched",
        userId: (currentUser as any)?.id ?? undefined,
        meta: JSON.stringify({ selectorNovaId: cleaned, selectorName: found.name }),
      }),
    }).catch(() => {});
  };

  if (matchedSelector) {
    return (
      <NovaTrainerSession
        selector={{
          userId: matchedSelector.userId,
          novaId: matchedSelector.novaId,
          name: matchedSelector.name,
          fullName: matchedSelector.name,
        }}
        selectorId={matchedSelector.id}
        onExit={() => { setActiveNovaId(""); lock(); }}
        autoStart
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1220] flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">

        {/* Concentric Orb */}
        <ConcentricOrb />

        {/* Heading */}
        <div className="text-center space-y-3">
          <h1 className="text-5xl font-black text-white tracking-tight leading-tight">
            NOVA Trainer
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed text-center max-w-xs mx-auto">
            Practice voice-directed picking, safety sign-on, and ES3 procedures with NOVA guiding every step.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="w-full rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300 text-sm font-medium text-center">
            {error}
          </div>
        )}

        {/* NOVA ID Input */}
        <div className="w-full space-y-3">
          <input
            value={novaIdInput}
            onChange={(e) => setNovaIdInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleEnterNova()}
            placeholder="Enter your NOVA ID"
            autoFocus
            className="w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-5 py-4 text-white text-center text-lg tracking-widest font-semibold outline-none focus:border-yellow-400 transition placeholder:text-slate-600 placeholder:tracking-normal placeholder:font-normal placeholder:text-base"
          />

          <LockedAction onAllowedClick={handleEnterNova} className="w-full">
            <button
              disabled={loading || !novaIdInput.trim()}
              className="w-full rounded-2xl bg-yellow-400 px-6 py-5 font-black text-slate-950 text-lg hover:bg-yellow-300 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              <span>{loading ? "Starting…" : "Begin Training Session"}</span>
              {!loading && <span className="text-xl">→</span>}
            </button>
          </LockedAction>
        </div>

        {/* Quick-select selectors */}
        {selectors.length > 0 && (
          <div className="w-full space-y-2">
            <p className="text-xs text-slate-600 text-center uppercase tracking-widest mb-3">
              Registered Selectors
            </p>
            {selectors.map((s) => (
              <button
                key={s.id}
                onClick={() => { setNovaIdInput(s.novaId ?? ""); setError(""); }}
                className="w-full flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/60 px-5 py-3 hover:border-yellow-400/50 transition text-left"
              >
                <div>
                  <p className="text-sm font-semibold text-white">{s.name}</p>
                  <p className="text-xs text-slate-500">{s.novaId}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  s.novaActive ? "bg-green-500/20 text-green-300" : "bg-slate-700 text-slate-400"
                }`}>
                  {s.novaActive ? "Active" : "Inactive"}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Warehouse profile */}
        {profile ? (
          <div className="w-full rounded-2xl border border-green-500/20 bg-green-500/5 px-4 py-3 flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0">
              <Settings className="h-3.5 w-3.5 text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-green-300 font-bold truncate">
                Warehouse: {profile.systemType?.replace("-", " ")} · {profile.locationFormat?.replace("-", " ")}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">NOVA calibrated for your operation</p>
            </div>
            <button
              onClick={() => navigate("/warehouse-setup")}
              className="text-[10px] text-slate-500 hover:text-slate-300 transition shrink-0"
            >
              Edit
            </button>
          </div>
        ) : (
          <button
            onClick={() => navigate("/warehouse-setup")}
            className="w-full rounded-2xl border border-dashed border-yellow-400/30 bg-yellow-400/5 px-4 py-3 flex items-center gap-3 hover:border-yellow-400/60 transition"
          >
            <div className="w-7 h-7 rounded-lg bg-yellow-400/10 flex items-center justify-center shrink-0">
              <Settings className="h-3.5 w-3.5 text-yellow-400" />
            </div>
            <div className="text-left">
              <p className="text-sm text-yellow-400 font-bold">Configure Your Warehouse</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Set your location format, pallet system & more</p>
            </div>
          </button>
        )}

        {/* Footer */}
        <p className="text-slate-600 text-sm text-center">
          Powered by NOVA AI — PickSmart Academy
        </p>

      </div>
    </div>
  );
}
