import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { OWNER_TOKEN } from "@/pages/owner-access";

export default function HomeFooter() {
  const { t } = useTranslation();

  const base     = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
  const magicUrl = `${window.location.origin}${base}/owner-access?token=${OWNER_TOKEN}`;

  return (
    <footer className="border-t border-slate-800 bg-slate-950 py-12">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-8 items-start">
        <div>
          <h3 className="text-2xl font-bold text-white">PickSmart Academy</h3>
          <p className="mt-3 max-w-xl text-slate-400">
            {t("home.footer.tagline")}
          </p>
        </div>

        <div className="grid sm:grid-cols-4 gap-6">
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
          <div>
            <h4 className="text-white font-semibold mb-3 text-slate-500">Admin</h4>
            <div className="space-y-2 text-slate-600 text-sm">
              <Link href="/owner" className="block hover:text-yellow-400">
                Admin Panel
              </Link>
              <a
                href={magicUrl}
                className="block hover:text-yellow-400"
              >
                Owner Access
              </a>
              <Link href="/login" className="block hover:text-yellow-400">
                Staff Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
