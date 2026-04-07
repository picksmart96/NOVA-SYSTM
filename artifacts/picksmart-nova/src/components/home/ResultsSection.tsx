import SectionHeading from "./SectionHeading";
import { useTranslation } from "react-i18next";

export default function ResultsSection() {
  const { t } = useTranslation();
  const stats = t("home.results.stats", { returnObjects: true }) as Array<{
    value: string;
    label: string;
  }>;

  return (
    <section className="py-20 bg-slate-900">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeading
          eyebrow={t("home.results.eyebrow")}
          title={t("home.results.title")}
        />

        <div className="mt-12 grid sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-3xl border border-slate-800 bg-slate-950 p-8 text-center shadow-lg"
            >
              <div className="text-4xl font-black text-yellow-400">{stat.value}</div>
              <div className="mt-3 text-slate-300">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
