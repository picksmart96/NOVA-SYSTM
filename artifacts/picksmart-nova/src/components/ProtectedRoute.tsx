import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuthStore } from "@/lib/authStore";
import type { AuthRole } from "@/lib/authStore";
import { ROLE_RANK } from "@/lib/authStore";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: AuthRole;
  path: string;
}

export function ProtectedRoute({ children, requiredRole = "selector", path }: ProtectedRouteProps) {
  const [, navigate] = useLocation();
  const { currentUser } = useAuthStore();

  const isLoggedIn = !!currentUser;
  const hasPermission = isLoggedIn && ROLE_RANK[currentUser!.role] >= ROLE_RANK[requiredRole];

  useEffect(() => {
    if (!isLoggedIn) {
      navigate(`/login?redirect=${encodeURIComponent(path)}`);
    }
  }, [isLoggedIn, path, navigate]);

  if (!isLoggedIn) return null;

  if (!hasPermission) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="rounded-3xl border border-red-500/30 bg-slate-900 p-10 max-w-md w-full text-center">
          <h1 className="text-2xl font-black text-white mb-2">Access denied</h1>
          <p className="text-slate-400">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
