import { Link } from "wouter";
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
          <div className="aspect-video w-full">
            <iframe
              className="w-full h-full"
              src="https://www.youtube.com/embed/YOUR_VIDEO_ID"
              title="PickSmart Academy Intro Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>

        <div className="mt-10 grid md:grid-cols-3 gap-6">
          {featureCards.map((card) => (
            <div
              key={card.title}
              className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-lg hover:border-yellow-400 transition"
            >
              <h3 className="text-xl font-bold text-white">{card.title}</h3>
              <p className="mt-2 text-slate-300">{card.text}</p>

              <Link
                href={card.href}
                className="mt-5 inline-flex items-center rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-yellow-300 transition"
              >
                {card.buttonText}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
