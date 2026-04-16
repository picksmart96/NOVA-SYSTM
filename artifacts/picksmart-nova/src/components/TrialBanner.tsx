import { useLocation } from "wouter";
import { useAuthStore } from "@/lib/authStore";
import { Zap, X } from "lucide-react";
import { useState } from "react";

export default function TrialBanner() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const [, navigate] = useLocation();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;
  if (!currentUser) return null;
  if (currentUser.isSubscribed) return null;
  if (!currentUser.trialEndsAt) return null;

  const endsAt = new Date(currentUser.trialEndsAt);
  const daysLeft = Math.ceil((endsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  if (daysLeft <= 0) {
    return (
      <div className="bg-red-950 border-b border-red-800 px-4 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-red-300">
          <Zap className="h-4 w-4 text-red-400 shrink-0" />
          <span>Your free trial has <strong className="text-red-200">expired</strong>. Upgrade to keep your access.</span>
        </div>
        <button
          onClick={() => navigate("/upgrade")}
          className="shrink-0 bg-red-500 hover:bg-red-400 text-white font-black text-xs px-4 py-1.5 rounded-lg transition"
        >
          Upgrade Now
        </button>
      </div>
    );
  }

  const isUrgent = daysLeft <= 5;

  return (
    <div className={`border-b px-4 py-2.5 flex items-center justify-between gap-4 ${
      isUrgent ? "bg-orange-950 border-orange-800" : "bg-slate-900 border-slate-700"
    }`}>
      <div className={`flex items-center gap-2 text-sm ${isUrgent ? "text-orange-300" : "text-slate-300"}`}>
        <Zap className={`h-4 w-4 shrink-0 ${isUrgent ? "text-orange-400" : "text-yellow-400"}`} />
        <span>
          Free trial — <strong className={isUrgent ? "text-orange-200" : "text-white"}>{daysLeft} day{daysLeft !== 1 ? "s" : ""} left</strong>.
          {" "}Upgrade to keep full access after your trial ends.
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => navigate("/upgrade")}
          className={`font-black text-xs px-4 py-1.5 rounded-lg transition ${
            isUrgent
              ? "bg-orange-500 hover:bg-orange-400 text-white"
              : "bg-yellow-400 hover:bg-yellow-300 text-slate-950"
          }`}
        >
          Upgrade
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="text-slate-500 hover:text-slate-300 transition"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
