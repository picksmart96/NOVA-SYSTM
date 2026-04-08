import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuthStore, ROLE_RANK } from "@/lib/authStore";
import type { AuthRole } from "@/lib/authStore";

interface Props {
  children: React.ReactNode;
  requiredRole?: AuthRole;
  path: string;
}

/**
 * Guards a page behind both authentication AND an active subscription.
 * Owner account bypasses all checks — full access always.
 * Non-subscribed users are redirected to /pricing.
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
    } else if (!isSubscribed) {
      navigate("/pricing");
    }
  }, [isLoggedIn, isSubscribed, path, navigate]);

  if (!isLoggedIn || !isSubscribed) return null;

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
