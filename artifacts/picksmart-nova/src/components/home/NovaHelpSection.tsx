import { Link } from "wouter";
import { ArrowRight } from "lucide-react";

function RadarIcon() {
  return (
    <div className="flex items-center justify-center">
      <div className="relative h-28 w-28">
        <div className="absolute inset-0       rounded-full border-[3px] border-yellow-400/90" />
        <div className="absolute inset-[10px] rounded-full border-[3px] border-yellow-400/70" />
        <div className="absolute inset-[20px] rounded-full border-[3px] border-yellow-400/50" />
        <div className="absolute inset-[30px] rounded-full border-[3px] border-yellow-400/30" />
        <div className="absolute inset-[41px] rounded-full bg-yellow-400" />
        <div className="absolute inset-0 rounded-full bg-yellow-400/5 blur-xl" />
      </div>
    </div>
  );
}

export default function NovaHelpSection() {
  return (
    <section className="py-20 bg-slate-950">
      <div className="max-w-3xl mx-auto px-6">
        <div className="relative overflow-hidden rounded-3xl border border-yellow-400/30 bg-gradient-to-b from-slate-900 to-slate-950 p-10 text-center shadow-2xl">
          {/* Background glow */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-64 w-64 rounded-full bg-yellow-400/5 blur-3xl" />
          </div>

          <div className="relative z-10">
            <RadarIcon />

            <h2 className="mt-6 text-4xl sm:text-5xl font-black text-white">
              Meet NOVA
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300 leading-relaxed">
              Ask NOVA anything about training, mentoring, selector struggles,
              safety, pallet building, pace, and performance improvement.
            </p>

            <Link
              href="/meet-nova"
              className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-yellow-400 px-8 py-4 text-base font-bold text-slate-950 hover:bg-yellow-300 transition shadow-lg shadow-yellow-400/20"
            >
              Click Here to Ask Everything You Want to Know About PickSmart Academy
              <ArrowRight className="h-5 w-5 shrink-0" />
            </Link>

            <p className="mt-4 text-xs text-slate-500">
              Powered by NOVA AI — no login required for demo
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
