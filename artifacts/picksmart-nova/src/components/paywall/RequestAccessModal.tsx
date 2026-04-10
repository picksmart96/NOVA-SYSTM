import { useLocation } from "wouter";
import { X, Shield, BookOpen, Mic, BarChart2, Users } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
}

export default function RequestAccessModal({ open, onClose, title = "Request Access" }: Props) {
  const [, navigate] = useLocation();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-400/15 border border-yellow-400/30 flex items-center justify-center">
              <Shield className="h-5 w-5 text-yellow-400" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-yellow-400">
              Demo Access Limit
            </p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <h2 className="text-2xl font-black text-white mb-3">{title}</h2>

        <p className="text-slate-300 text-sm leading-relaxed">
          This feature is reserved for full company accounts. You can keep exploring the demo, 
          but training lessons and NOVA Trainer require company access.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          {[
            { icon: <BookOpen className="h-4 w-4" />, label: "Full training system" },
            { icon: <Mic className="h-4 w-4" />, label: "NOVA Trainer workflow" },
            { icon: <BarChart2 className="h-4 w-4" />, label: "Guided lessons & tests" },
            { icon: <Users className="h-4 w-4" />, label: "Team activation & onboarding" },
          ].map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-300">
              <span className="text-yellow-400">{icon}</span> {label}
            </div>
          ))}
        </div>

        <div className="mt-7 flex flex-wrap gap-3">
          <button
            onClick={() => { onClose(); navigate("/checkout/company"); }}
            className="rounded-2xl bg-yellow-400 px-5 py-3 font-bold text-slate-950 hover:bg-yellow-300 transition"
          >
            Request Company Access
          </button>
          <button
            onClick={onClose}
            className="rounded-2xl border border-slate-700 px-5 py-3 font-semibold text-slate-300 hover:border-slate-500 transition"
          >
            Continue Browsing
          </button>
        </div>
      </div>
    </div>
  );
}
