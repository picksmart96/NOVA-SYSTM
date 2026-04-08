import { useMemo, useState } from "react";
import { Activity, Mic } from "lucide-react";
import { useTrainerStore } from "@/lib/trainerStore";
import { useAuthStore } from "@/lib/authStore";
import { ASSIGNMENTS } from "@/data/assignments";
import NovaTrainerSession from "@/components/nova/NovaTrainerSession";

export default function NovaTrainerPage() {
  const { selectors } = useTrainerStore();
  const { lock } = useAuthStore();

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
        onExit={() => { setActiveNovaId(""); lock(); }}
        autoStart
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="bg-yellow-400 text-slate-950 p-2 rounded-xl">
            <Activity className="h-6 w-6" />
          </div>
          <span className="text-2xl font-black text-white tracking-tight">
            PickSmart <span className="text-yellow-400">NOVA</span>
          </span>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center">
              <Mic className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">NOVA Trainer</h1>
            </div>
          </div>

          {error && (
            <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300 text-sm font-medium">
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm text-slate-400 mb-2">NOVA ID</label>
              <input
                value={novaIdInput}
                onChange={(e) => setNovaIdInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleEnterNova()}
                placeholder="NOVA-XXXXX"
                autoFocus
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white text-center tracking-widest font-semibold outline-none focus:border-yellow-400 transition placeholder:text-slate-600 placeholder:tracking-normal placeholder:font-normal"
              />
            </div>

            <button
              onClick={handleEnterNova}
              disabled={loading || !novaIdInput.trim()}
              className="w-full rounded-2xl bg-yellow-400 px-6 py-3 font-black text-slate-950 hover:bg-yellow-300 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? "Starting…" : "Begin Session"}
            </button>
          </div>
        </div>

        {/* Quick-select list */}
        {selectors.length > 0 && (
          <div className="mt-6 space-y-2">
            <p className="text-xs text-slate-600 text-center uppercase tracking-widest mb-3">
              Registered Selectors
            </p>
            {selectors.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setNovaIdInput(s.novaId ?? "");
                  setError("");
                }}
                className="w-full flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900 px-5 py-3 hover:border-yellow-400 transition text-left"
              >
                <div>
                  <p className="text-sm font-semibold text-white">{s.name}</p>
                  <p className="text-xs text-slate-500">{s.novaId}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  s.novaActive
                    ? "bg-green-500/20 text-green-300"
                    : "bg-slate-700 text-slate-400"
                }`}>
                  {s.novaActive ? "Active" : "Inactive"}
                </span>
              </button>
            ))}
          </div>
        )}

        <p className="mt-8 text-center text-slate-600 text-sm">
          PickSmart Academy — Voice Training System
        </p>

      </div>
    </div>
  );
}
