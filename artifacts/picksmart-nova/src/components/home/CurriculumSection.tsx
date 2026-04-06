import SectionHeading from "./SectionHeading";
import { modules } from "../../data/homepageData";
import { Link } from "wouter";

export default function CurriculumSection() {
  return (
    <section className="py-20 bg-slate-950">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeading
          eyebrow="The Curriculum"
          title="What You'll Learn"
          subtitle="Six comprehensive modules covering everything from your first day to hitting top rates."
        />

        <div className="mt-12 grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {modules.map((module) => (
            <div
              key={module.title}
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
                View Module
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/training"
            className="inline-flex items-center rounded-2xl bg-yellow-400 px-6 py-3 font-bold text-slate-950 hover:bg-yellow-300"
          >
            Browse All Modules
          </Link>
        </div>
      </div>
    </section>
  );
}
