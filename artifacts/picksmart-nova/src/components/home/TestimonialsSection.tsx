import SectionHeading from "./SectionHeading";
import { useTranslation } from "react-i18next";

export default function TestimonialsSection() {
  const { t } = useTranslation();
  const items = t("home.testimonials.items", { returnObjects: true }) as Array<{
    initials: string;
    name: string;
    role: string;
    quote: string;
  }>;

  return (
    <section className="py-20 bg-slate-950">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeading
          eyebrow={t("home.testimonials.eyebrow")}
          title={t("home.testimonials.title")}
          subtitle={t("home.testimonials.subtitle")}
        />

        <div className="mt-12 grid lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item.name}
              className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg"
            >
              <p className="text-slate-200 text-lg leading-8">"{item.quote}"</p>

              <div className="mt-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-yellow-400 text-slate-950 font-bold flex items-center justify-center">
                  {item.initials}
                </div>
                <div>
                  <div className="font-bold text-white">{item.name}</div>
                  <div className="text-sm text-slate-400">{item.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
