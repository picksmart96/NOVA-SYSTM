import SectionHeading from "./SectionHeading";
import { featureCards } from "../../data/homepageData";

export default function IntroVideoSection() {
  return (
    <section className="py-20 bg-slate-950">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeading
          eyebrow="Watch First"
          title="What Is PickSmart Academy?"
          subtitle="Watch this short video to understand how our training works, what you'll learn, and why selectors trust PickSmart to level up their career."
        />

        <div className="mt-10 rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl">
          <div className="aspect-video w-full bg-slate-950 flex items-center justify-center text-slate-400">
            Replace with your intro video embed
          </div>
        </div>

        <div className="mt-10 grid md:grid-cols-3 gap-6">
          {featureCards.map((card) => (
            <div
              key={card.title}
              className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg"
            >
              <h3 className="text-xl font-bold text-white">{card.title}</h3>
              <p className="mt-2 text-slate-300">{card.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
