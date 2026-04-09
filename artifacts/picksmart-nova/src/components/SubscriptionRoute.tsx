import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuthStore, ROLE_RANK } from "@/lib/authStore";
import type { AuthRole } from "@/lib/authStore";

interface Props {
  children: React.ReactNode;
  requiredRole?: AuthRole;
  path: string;
}

function LockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-10 w-10 text-yellow-400">
      <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5">
      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
    </svg>
  );
}

const PLAN_HIGHLIGHTS = [
  "All 6 training modules",
  "Video lessons & demonstrations",
  "Advanced speed techniques",
  "Progress tracking & reports",
  "NOVA AI trainer tools",
];

/**
 * Guards a page behind both authentication AND an active subscription.
 * Owner account bypasses all checks — full access always.
 * Non-logged-in users are redirected to /login.
 * Logged-in but non-subscribed users see an inline subscription prompt.
 */
export function SubscriptionRoute({ children, requiredRole = "selector", path }: Props) {
  const [, navigate] = useLocation();
  const { currentUser } = useAuthStore();

  const isLoggedIn = !!currentUser;
  const isOwner = currentUser?.role === "owner";
  const isSubscribed = isOwner || !!currentUser?.isSubscribed;
  const hasRole = isLoggedIn && ROLE_RANK[currentUser!.role] >= ROLE_RANK[requiredRole];

  useEffect(() => {
    if (!isLoggedIn) {
      navigate(`/login?redirect=${encodeURIComponent(path)}`);
    }
  }, [isLoggedIn, path, navigate]);

  if (!isLoggedIn) return null;

  if (!isSubscribed) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <div className="rounded-full bg-yellow-400/10 p-5">
              <LockIcon />
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-black text-white">Subscription Required</h1>
            <p className="mt-3 text-slate-400 text-base leading-relaxed">
              This page is available to subscribers only. Choose a plan to unlock all training modules and NOVA tools.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-left">
            <p className="text-xs font-bold uppercase tracking-widest text-yellow-400 mb-4">What you'll get</p>
            <ul className="space-y-2.5">
              {PLAN_HIGHLIGHTS.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-slate-300">
                  <CheckIcon />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => navigate("/pricing")}
            className="w-full rounded-2xl bg-yellow-400 px-6 py-4 text-base font-black text-slate-950 hover:bg-yellow-300 transition"
          >
            View Plans
          </button>

          <p className="text-xs text-slate-600">Starting at $10 · Cancel anytime · No hidden fees</p>
        </div>
      </div>
    );
  }

  if (!hasRole) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="rounded-3xl border border-red-500/30 bg-slate-900 p-10 max-w-md w-full text-center">
          <h1 className="text-2xl font-black text-white mb-2">Access denied</h1>
          <p className="text-slate-400">You don't have the required role to view this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
