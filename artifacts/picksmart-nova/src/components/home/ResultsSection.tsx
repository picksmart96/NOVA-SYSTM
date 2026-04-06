import SectionHeading from "./SectionHeading";
import { resultsStats } from "../../data/homepageData";

export default function ResultsSection() {
  return (
    <section className="py-20 bg-slate-900">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeading
          eyebrow="Work Smarter, Not Just Harder"
          title="The difference between struggling at 70% and cruising at 100%+ isn't strength — it's technique."
        />

        <div className="mt-12 grid sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {resultsStats.map((stat) => (
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
