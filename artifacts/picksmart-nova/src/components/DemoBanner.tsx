import { Link, useLocation } from "wouter";
import { useAuthStore } from "@/lib/authStore";
import { FlaskConical, X } from "lucide-react";

export default function DemoBanner() {
  const logout = useAuthStore((s) => s.logout);
  const currentUser = useAuthStore((s) => s.currentUser);
  const [, navigate] = useLocation();

  if (!currentUser?.isDemoUser) return null;

  const handleExit = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between gap-4 bg-yellow-400 px-4 py-2 text-slate-950">
      <div className="flex items-center gap-2 min-w-0">
        <FlaskConical className="h-4 w-4 shrink-0" />
        <span className="text-sm font-bold truncate">
          Demo Warehouse Preview — sample data for evaluation only
        </span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <Link
          href="/demo"
          className="text-xs font-bold underline hover:no-underline whitespace-nowrap"
        >
          Demo Home
        </Link>
        <button
          onClick={handleExit}
          className="flex items-center gap-1 rounded-lg bg-slate-950/15 px-2 py-1 text-xs font-bold hover:bg-slate-950/25 transition whitespace-nowrap"
        >
          <X className="h-3 w-3" />
          Exit Demo
        </button>
      </div>
    </div>
  );
}
