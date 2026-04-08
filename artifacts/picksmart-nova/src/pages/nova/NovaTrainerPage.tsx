import { useMemo, useState } from "react";
import { useTrainerStore } from "@/lib/trainerStore";
import { ASSIGNMENTS } from "@/data/assignments";
import NovaTrainerSession from "@/components/nova/NovaTrainerSession";

export default function NovaTrainerPage() {
  const { selectors } = useTrainerStore();

  const [novaIdInput, setNovaIdInput] = useState("");
  const [activeNovaId, setActiveNovaId] = useState("");
  const [error, setError] = useState("");

  const matchedSelector = useMemo(() => {
    if (!activeNovaId) return null;

    const found = selectors.find(
      (s) => (s.novaId ?? "").toLowerCase() === activeNovaId.toLowerCase()
    );

    if (!found) return null;

    return {
      ...found,
      assignments: ASSIGNMENTS.filter(
        (a) => a.selectorUserId === found.userId
      ),
    };
  }, [activeNovaId, selectors]);

  const handleEnterNova = () => {
    const cleaned = novaIdInput.trim();

    if (!cleaned) {
      setError("Please enter your NOVA ID.");
      return;
    }

    const found = selectors.find(
      (s) => (s.novaId ?? "").toLowerCase() === cleaned.toLowerCase()
    );

    if (!found) {
      setError("Invalid NOVA ID. Please check with your trainer.");
      return;
    }

    setError("");
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
        onExit={() => setActiveNovaId("")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d1a] text-white flex flex-col">

      {/* Top bar */}
      <div className="bg-[#141428] border-b border-white/5 px-6 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold">
          N
        </div>
        <div>
          <p className="text-sm font-semibold leading-none">NOVA Trainer</p>
          <p className="text-xs text-slate-400 mt-0.5">ES3 Script Mode</p>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 gap-8">

        {/* Signal circle */}
        <div className="relative flex items-center justify-center w-44 h-44">
          <div className="absolute inset-0 rounded-full bg-violet-700/10 animate-pulse" />
          <div className="w-32 h-32 rounded-full flex items-center justify-center border-2 border-violet-700/40 bg-[#1a1a2e]">
            <svg
              viewBox="0 0 48 48"
              className="w-14 h-14 text-violet-500/60"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                d="M24 8 C24 8 12 18 12 28 A12 12 0 0 0 36 28 C36 18 24 8 24 8Z"
                strokeWidth="1.5"
                fill="currentColor"
                fillOpacity="0.15"
              />
              <circle cx="24" cy="28" r="3" strokeWidth="1.5" />
              <path d="M6 24 Q10 20 14 24" strokeWidth="1.5" />
              <path d="M34 24 Q38 20 42 24" strokeWidth="1.5" />
              <path d="M2 18 Q8 12 14 18" strokeWidth="1.5" />
              <path d="M34 18 Q40 12 46 18" strokeWidth="1.5" />
            </svg>
          </div>
        </div>

        {/* Entry card */}
        <div className="w-full max-w-md rounded-[28px] border border-slate-800 bg-[#141428] p-8 shadow-2xl text-center">
          <p className="text-yellow-400 text-xs font-semibold uppercase tracking-[0.2em]">
            NOVA Trainer
          </p>

          <h1 className="mt-4 text-2xl sm:text-3xl font-black leading-tight">
            Enter your NOVA ID
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Your NOVA ID is provided by your trainer after registration.
          </p>

          <div className="mt-8">
            <input
              value={novaIdInput}
              onChange={(e) => setNovaIdInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleEnterNova()}
              placeholder="NOVA-XXXXX"
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-5 py-4 text-center text-lg font-semibold tracking-wide outline-none focus:border-yellow-400 transition"
            />
          </div>

          {error && (
            <p className="mt-3 text-red-300 text-sm font-semibold">{error}</p>
          )}

          <button
            onClick={handleEnterNova}
            className="mt-6 w-full rounded-2xl bg-yellow-400 px-6 py-4 text-lg font-bold text-slate-950 hover:bg-yellow-300 transition"
          >
            Enter NOVA
          </button>
        </div>

        {/* Selector list (if any registered) */}
        {selectors.length > 0 && (
          <div className="w-full max-w-md">
            <p className="text-xs text-slate-500 text-center mb-3 uppercase tracking-widest">
              Registered Selectors
            </p>
            <div className="space-y-2">
              {selectors.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setNovaIdInput(s.novaId ?? "");
                    setError("");
                  }}
                  className="w-full flex items-center justify-between rounded-2xl border border-slate-800 bg-[#141428] px-5 py-3 hover:border-yellow-400 transition text-left"
                >
                  <div>
                    <p className="text-sm font-semibold">{s.name}</p>
                    <p className="text-xs text-slate-400">{s.novaId}</p>
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
          </div>
        )}

      </div>
    </div>
  );
}
