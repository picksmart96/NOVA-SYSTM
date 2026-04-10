import { Link } from "wouter";
import { useTranslation } from "react-i18next";

const HERO_STAT_HREFS = ["/training", "/training", "/progress", "/mistakes", "/progress", "/mistakes"];

export default function HeroSection() {
  const { t } = useTranslation();
  const heroStats = t("home.heroStats", { returnObjects: true }) as string[];

  return (
    <section className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_rgba(250,204,21,0.25),_transparent_30%),radial-gradient(circle_at_left,_rgba(59,130,246,0.15),_transparent_28%)]" />
      <div className="relative max-w-7xl mx-auto px-6 py-20 md:py-28">
        <p className="text-yellow-400 text-sm font-semibold uppercase tracking-[0.24em] mb-5">
          {t("hero.builtFor")}
        </p>

        <h1 className="text-5xl md:text-7xl font-black text-white leading-[0.95] max-w-4xl">
          {t("hero.title1")}
          <br />
          {t("hero.title2")}
          <br />
          {t("hero.title3")}
        </h1>

        <p className="mt-6 max-w-2xl text-lg md:text-xl text-slate-300">
          {t("hero.subtitle")}
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Link
            href="/training"
            className="inline-flex items-center justify-center rounded-2xl bg-yellow-400 px-6 py-3 text-slate-950 font-bold hover:bg-yellow-300 transition"
          >
            {t("hero.startTraining")}
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 px-6 py-3 text-white font-semibold hover:border-yellow-400 transition"
          >
            {t("hero.viewPlans")}
          </Link>
          <Link
            href="/demo"
            className="inline-flex items-center justify-center rounded-2xl border border-yellow-400/40 bg-yellow-400/10 px-6 py-3 text-yellow-300 font-semibold hover:bg-yellow-400/20 transition"
          >
            View Live Demo
          </Link>
        </div>

        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-300">
          <span>{t("hero.noExperience")}</span>
          <span>{t("hero.firstModuleFree")}</span>
          <span>{t("hero.cancelAnytime")}</span>
        </div>

        <div className="mt-12 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {heroStats.map((label, i) => (
            <Link
              key={label}
              href={HERO_STAT_HREFS[i] ?? "/training"}
              className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-4 text-center text-sm text-slate-200 shadow-lg hover:border-yellow-400 hover:text-white transition"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
