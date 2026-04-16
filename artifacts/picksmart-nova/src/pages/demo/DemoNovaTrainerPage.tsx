import { useState } from "react";
import { Activity, Mic } from "lucide-react";
import { DEMO_SELECTORS_ONLY } from "@/data/demoWarehouseData";
import NovaTrainerSession from "@/components/nova/NovaTrainerSession";
import DemoBanner from "@/components/DemoBanner";

export default function DemoNovaTrainerPage() {
  const [activeSelector, setActiveSelector] = useState<typeof DEMO_SELECTORS_ONLY[0] | null>(null);

  if (activeSelector) {
    return (
      <>
        <DemoBanner />
        <NovaTrainerSession
          selector={{
            userId: activeSelector.userId,
            novaId: activeSelector.novaId,
            name: activeSelector.fullName,
            fullName: activeSelector.fullName,
          }}
          onExit={() => setActiveSelector(null)}
          autoStart
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <DemoBanner />

      <div className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md space-y-6">

          {/* Logo */}
          <div className="flex items-center justify-center gap-3">
            <div className="bg-yellow-400 text-slate-950 p-2 rounded-xl">
              <Activity className="h-6 w-6" />
            </div>
            <span className="text-2xl font-black text-white tracking-tight">
              PickSmart <span className="text-yellow-400">NOVA</span>
            </span>
          </div>

          {/* Card */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center">
                <Mic className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white">NOVA Trainer</h1>
                <p className="text-xs text-slate-500">Demo — select a selector to begin</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-yellow-400/20 bg-yellow-400/5 px-4 py-3 text-sm text-yellow-200">
              This is a live NOVA session demo. NOVA will guide you through the full NOVA voice-picking workflow including equipment sign-on, safety check, assignment load, and stop-by-stop picking directions.
            </div>
          </div>

          {/* Demo selector list */}
          <div className="space-y-2">
            <p className="text-xs text-slate-500 text-center uppercase tracking-widest mb-3">
              Demo Selectors — click to start session
            </p>
            {DEMO_SELECTORS_ONLY.filter((s) => s.novaActive).map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSelector(s)}
                className="w-full flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900 px-5 py-3.5 hover:border-yellow-400 hover:bg-yellow-400/5 transition text-left"
              >
                <div>
                  <p className="text-sm font-semibold text-white">{s.fullName}</p>
                  <p className="text-xs text-slate-500">{s.novaId} · {s.level}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-yellow-400">{s.rate}%</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-green-500/20 text-green-300">
                    NOVA Active
                  </span>
                </div>
              </button>
            ))}
          </div>

          <p className="text-center text-slate-600 text-xs">
            Demo Distribution Center — Voice Training System
          </p>
        </div>
      </div>
    </div>
  );
}
