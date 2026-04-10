import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/lib/authStore";
import { Lock, Users, Shield } from "lucide-react";

export default function HomeFooter() {
  const { t } = useTranslation();
  const { logout } = useAuthStore();
  const [, navigate] = useLocation();

  function goLogin(redirect: string) {
    logout();
    navigate(`/login?redirect=${encodeURIComponent(redirect)}`);
  }

  return (
    <footer className="border-t border-slate-800 bg-slate-950 py-12">
      <div className="max-w-7xl mx-auto px-6 space-y-10">

        {/* ── Staff access row ── */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Staff &amp; Admin Access</p>
            <p className="text-white font-bold text-lg">Already have an account?</p>
            <p className="text-slate-400 text-sm mt-0.5">Secure login required every session — sessions do not stay open after you close.</p>
          </div>
          <div className="flex flex-wrap gap-3 justify-center sm:justify-end">
            <button
              onClick={() => goLogin("/owner")}
              className="inline-flex items-center gap-2 rounded-xl border border-yellow-400/40 bg-yellow-400/10 px-5 py-2.5 text-sm font-bold text-yellow-400 hover:bg-yellow-400/20 transition"
            >
              <Shield className="h-4 w-4" />
              Owner Access
            </button>
            <button
              onClick={() => goLogin("/users-access")}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-800 px-5 py-2.5 text-sm font-bold text-white hover:border-yellow-400/40 transition"
            >
              <Users className="h-4 w-4" />
              User &amp; Access
            </button>
            <button
              onClick={() => goLogin("/")}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-5 py-2.5 text-sm font-semibold text-slate-400 hover:text-white transition"
            >
              <Lock className="h-4 w-4" />
              Staff Login
            </button>
          </div>
        </div>

        {/* ── Main footer grid ── */}
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div>
            <h3 className="text-2xl font-bold text-white">PickSmart Academy</h3>
            <p className="mt-3 max-w-xl text-slate-400">
              {t("home.footer.tagline")}
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            <div>
              <h4 className="text-white font-semibold mb-3">{t("home.footer.trainingLabel")}</h4>
              <div className="space-y-2 text-slate-400 text-sm">
                <Link href="/training" className="block hover:text-yellow-400">{t("home.footer.allModules")}</Link>
                <Link href="/mistakes" className="block hover:text-yellow-400">{t("home.footer.commonMistakes")}</Link>
                <Link href="/progress" className="block hover:text-yellow-400">{t("home.footer.trackProgress")}</Link>
                <Link href="/pricing" className="block hover:text-yellow-400">{t("home.footer.pricing")}</Link>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">{t("home.footer.novaLabel")}</h4>
              <div className="space-y-2 text-slate-400 text-sm">
                <Link href="/nova" className="block hover:text-yellow-400">{t("home.footer.myAssignments")}</Link>
                <Link href="/leaderboard" className="block hover:text-yellow-400">{t("home.footer.leaderboard")}</Link>
                <Link href="/demo" className="block hover:text-yellow-400">Live Demo</Link>
                <Link href="/request-access" className="block hover:text-yellow-400">Request Access</Link>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Legal</h4>
              <div className="space-y-2 text-slate-400 text-sm">
                <Link href="/privacy" className="block hover:text-yellow-400">Privacy Policy</Link>
                <Link href="/terms" className="block hover:text-yellow-400">Terms of Service</Link>
              </div>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
