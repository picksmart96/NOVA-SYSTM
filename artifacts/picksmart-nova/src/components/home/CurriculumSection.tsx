import SectionHeading from "./SectionHeading";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";

export default function CurriculumSection() {
  const { t } = useTranslation();
  const modules = t("home.curriculum.modules", { returnObjects: true }) as Array<{
    number: string;
    badge: string;
    title: string;
    text: string;
  }>;

  return (
    <section className="py-20 bg-slate-950">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeading
          eyebrow={t("home.curriculum.eyebrow")}
          title={t("home.curriculum.title")}
          subtitle={t("home.curriculum.subtitle")}
        />

        <div className="mt-12 grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {modules.map((module) => (
            <div
              key={module.number}
              className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-400">{module.number}</p>
                {module.badge ? (
                  <span className="rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold text-slate-950">
                    {module.badge}
                  </span>
                ) : null}
              </div>

              <h3 className="mt-4 text-2xl font-bold text-white">{module.title}</h3>
              <p className="mt-3 text-slate-300">{module.text}</p>

              <Link
                href="/training"
                className="mt-6 inline-flex items-center rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-white hover:border-yellow-400"
              >
                {t("home.curriculum.viewModule")}
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/training"
            className="inline-flex items-center rounded-2xl bg-yellow-400 px-6 py-3 font-bold text-slate-950 hover:bg-yellow-300"
          >
            {t("home.curriculum.browseAll")}
          </Link>
        </div>
      </div>
    </section>
  );
}
