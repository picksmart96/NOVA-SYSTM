import { useState } from "react";
import { useTrainerStore } from "@/lib/trainerStore";
import { X, BookOpen } from "lucide-react";

interface LogSessionModalProps {
  open: boolean;
  onClose: () => void;
  preselectedSelectorId?: number | null;
}

const SESSION_TYPES = [
  "Coaching",
  "NOVA Activation",
  "Assignment Review",
  "Safety Review",
  "Performance Review",
];

export function LogSessionModal({ open, onClose, preselectedSelectorId = null }: LogSessionModalProps) {
  const { selectors, logSession } = useTrainerStore();
  const [selectorId, setSelectorId] = useState<string>(
    preselectedSelectorId ? String(preselectedSelectorId) : ""
  );
  const [sessionType, setSessionType] = useState("Coaching");
  const [notes, setNotes] = useState("");
  const [toast, setToast] = useState(false);

  if (!open) return null;

  const handleSave = () => {
    const selector = selectors.find((s) => s.id === Number(selectorId));
    if (!selector) return;

    logSession({
      selectorId: selector.id,
      selectorName: selector.name,
      sessionType,
      notes,
    });

    setToast(true);
    setTimeout(() => {
      setToast(false);
      setSelectorId("");
      setSessionType("Coaching");
      setNotes("");
      onClose();
    }, 1400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-yellow-400" /> Log Session
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {toast && (
          <div className="mb-4 rounded-2xl bg-green-500/10 border border-green-500/30 px-4 py-3 text-green-300 text-sm font-bold">
            Session logged successfully.
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Selector</label>
            <select
              value={selectorId}
              onChange={(e) => setSelectorId(e.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-yellow-400"
            >
              <option value="">Choose selector</option>
              {selectors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.novaId})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Session Type</label>
            <select
              value={sessionType}
              onChange={(e) => setSessionType(e.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-yellow-400"
            >
              {SESSION_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Add coaching notes..."
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-yellow-400 placeholder:text-slate-600 resize-none"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={!selectorId}
            className="w-full rounded-2xl bg-yellow-400 px-6 py-3 font-black text-slate-950 hover:bg-yellow-300 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Save Session
          </button>
        </div>
      </div>
    </div>
  );
}
