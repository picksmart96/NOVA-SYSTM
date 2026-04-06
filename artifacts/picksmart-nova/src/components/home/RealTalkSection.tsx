import SectionHeading from "./SectionHeading";
import { realTalkItems } from "../../data/homepageData";

export default function RealTalkSection() {
  return (
    <section className="py-20 bg-slate-900">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-10 items-start">
        <div>
          <SectionHeading
            eyebrow="The Real Talk"
            title="New to Order Selecting? Here's what nobody tells you."
            subtitle="Order selecting is one of the most physically demanding — and highest-paying — entry-level warehouse jobs. But most new hires are thrown in with zero training."
            center={false}
          />

          <div className="mt-8 space-y-5">
            {realTalkItems.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-800 bg-slate-950 p-5"
              >
                <h3 className="text-lg font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-slate-300">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-950 p-8 shadow-2xl">
          <div className="text-sm uppercase tracking-[0.2em] text-yellow-400 font-semibold">
            Proper pallet stacking technique
          </div>
          <div className="mt-6 text-6xl font-black text-white">0 → 100%</div>
          <p className="mt-3 text-slate-300 text-lg">Average rate in weeks</p>
          <div className="mt-10 rounded-2xl bg-slate-900 p-5 border border-slate-800">
            <p className="text-white font-semibold">Rated by selectors</p>
            <p className="mt-2 text-slate-300">
              Real-world techniques built for grocery warehouse picking, not classroom theory.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
