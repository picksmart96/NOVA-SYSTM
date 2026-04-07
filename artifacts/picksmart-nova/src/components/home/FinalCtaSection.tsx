import { Link } from "wouter";
import { useTranslation } from "react-i18next";

export default function FinalCtaSection() {
  const { t } = useTranslation();

  return (
    <section className="py-20 bg-slate-900">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-yellow-400 mb-4">
          {t("home.finalCta.eyebrow")}
        </p>
        <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
          {t("home.finalCta.title")}
        </h2>
        <p className="mt-6 text-lg text-slate-300 max-w-2xl mx-auto">
          {t("home.finalCta.subtitle")}
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/training"
            className="inline-flex items-center justify-center rounded-2xl bg-yellow-400 px-8 py-4 text-slate-950 font-bold text-lg hover:bg-yellow-300 transition"
          >
            {t("home.finalCta.startFree")}
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-950 px-8 py-4 text-white font-semibold text-lg hover:border-yellow-400 transition"
          >
            {t("home.finalCta.viewPricing")}
          </Link>
        </div>
        <p className="mt-6 text-sm text-slate-500">{t("home.finalCta.noCard")}</p>
      </div>
    </section>
  );
}
