import SectionHeading from "./SectionHeading";
import { Link } from "wouter";

export default function NovaHelpSection() {
  return (
    <section className="py-20 bg-slate-900">
      <div className="max-w-5xl mx-auto px-6">
        <SectionHeading
          eyebrow="Ask NOVA Anything"
          title="Get instant help with picking strategies, safety tips, and performance advice"
        />

        <div className="mt-10 rounded-3xl border border-slate-800 bg-slate-950 p-8 shadow-2xl text-center">
          <h3 className="text-2xl font-bold text-white">NOVA Help</h3>
          <p className="mt-4 text-yellow-400 font-semibold">
            Say "Hey NOVA" to wake me
          </p>
          <p className="mt-3 text-slate-300">
            Say "Hey NOVA" to wake me up. I'll keep listening after each answer.
            Say "stop" anytime to silence me.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            "Hey NOVA" to wake · "stop" to silence
          </p>

          <Link
            href="/nova"
            className="mt-6 inline-flex items-center rounded-2xl bg-yellow-400 px-6 py-3 font-bold text-slate-950 hover:bg-yellow-300"
          >
            Open NOVA
          </Link>
        </div>
      </div>
    </section>
  );
}
