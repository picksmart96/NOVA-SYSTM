import { useLocation } from "wouter";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SubscribePromptModal({ open, onClose }: Props) {
  const [, navigate] = useLocation();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-yellow-400">
          Subscription Required
        </p>
        <h2 className="mt-3 text-3xl font-black text-white">
          Subscribe to unlock full access
        </h2>
        <p className="mt-4 text-slate-300">
          You can keep browsing, but this feature requires an active subscription.
        </p>

        <div className="mt-6 space-y-2 text-slate-300 text-sm">
          <p>• Use NOVA Help AI voice coach</p>
          <p>• Run NOVA Trainer picking sessions</p>
          <p>• Start training modules & lessons</p>
          <p>• Join community &amp; post in Selector Nation</p>
          <p>• Access performance tools &amp; leaderboard</p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            onClick={() => { onClose(); navigate("/pricing"); }}
            className="rounded-2xl bg-yellow-400 px-5 py-3 font-bold text-slate-950 hover:bg-yellow-300 transition"
          >
            View Plans
          </button>
          <button
            onClick={() => { onClose(); navigate("/choose-plan"); }}
            className="rounded-2xl border border-slate-700 px-5 py-3 font-semibold text-white hover:border-yellow-400 transition"
          >
            Subscribe Now
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
