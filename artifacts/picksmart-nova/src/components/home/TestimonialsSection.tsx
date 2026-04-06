import SectionHeading from "./SectionHeading";
import { testimonials } from "../../data/homepageData";

export default function TestimonialsSection() {
  return (
    <section className="py-20 bg-slate-950">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeading
          eyebrow="From the Floor"
          title="Selectors Who've Been There"
          subtitle="Real feedback from warehouse workers who went through the training."
        />

        <div className="mt-12 grid lg:grid-cols-3 gap-6">
          {testimonials.map((item) => (
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
