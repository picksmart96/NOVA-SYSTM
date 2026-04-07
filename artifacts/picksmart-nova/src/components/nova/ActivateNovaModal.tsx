import { useState } from "react";
import { useTrainerStore } from "@/lib/trainerStore";
import { X, Zap } from "lucide-react";

interface ActivateNovaModalProps {
  open: boolean;
  onClose: () => void;
}

export function ActivateNovaModal({ open, onClose }: ActivateNovaModalProps) {
  const { selectors, toggleNova } = useTrainerStore();
  const [toast, setToast] = useState<string | null>(null);

  if (!open) return null;

  const handleToggle = (selectorId: number) => {
    const selector = selectors.find((s) => s.id === selectorId);
    if (!selector) return;

    toggleNova(selectorId);

    const msg = selector.novaActive
      ? `NOVA deactivated for ${selector.name}`
      : `NOVA activated for ${selector.name}`;

    setToast(msg);
    setTimeout(() => {
      setToast(null);
      onClose();
    }, 1600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-400" /> Activate NOVA
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {toast && (
          <div className="mb-4 rounded-2xl bg-green-500/10 border border-green-500/30 px-4 py-3 text-green-300 text-sm font-bold">
            {toast}
          </div>
        )}

        <p className="text-slate-400 text-sm mb-5">Click a selector to toggle their NOVA active status.</p>

        <div className="space-y-3 max-h-80 overflow-y-auto">
          {selectors.map((selector) => (
            <button
              key={selector.id}
              onClick={() => handleToggle(selector.id)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-4 flex items-center justify-between hover:border-yellow-400 transition text-left group"
            >
              <div>
                <p className="font-bold text-white capitalize">{selector.name}</p>
                <p className="text-xs text-slate-500">{selector.novaId} · {selector.level}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border transition ${
                selector.novaActive
                  ? "bg-green-500/20 text-green-300 border-green-500/30 group-hover:bg-red-500/20 group-hover:text-red-300 group-hover:border-red-500/30"
                  : "bg-slate-800 text-slate-400 border-slate-700 group-hover:bg-green-500/20 group-hover:text-green-300 group-hover:border-green-500/30"
              }`}>
                {selector.novaActive ? "NOVA Active → Deactivate" : "Inactive → Activate"}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
