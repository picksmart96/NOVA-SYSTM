import { useState } from "react";
import { VOICE_COMMANDS } from "@/data/voiceCommands";
import { SYSTEM_DEFAULTS } from "@/data/systemDefaults";
import { DOOR_CODES } from "@/data/doorCodes";
import { Headphones, Search, Mic, AlertTriangle, BookOpen, Zap } from "lucide-react";

const FAQS = [
  {
    q: "What is a check code?",
    a: "A check code is a 3-digit number assigned to each slot location. NOVA says the aisle and slot, and you say back the check code displayed on the slot label. This confirms you're picking from the correct location.",
  },
  {
    q: "What if NOVA says 'Invalid'?",
    a: "You entered the wrong check code. NOVA will repeat the aisle and slot. Look at the slot label again and enter the correct 3-digit code. NOVA will loop until you get it right — you cannot skip a slot without the correct code.",
  },
  {
    q: "How does pallet setup work?",
    a: "At the start of every assignment, NOVA guides you through positioning your pallets. Alpha pallet goes first. If your assignment has 2 pallets, you'll also set up Bravo. Use CHEP pallets from the stack.",
  },
  {
    q: "What do I do when I finish picking?",
    a: `After the last case, NOVA gives you your completion instructions: go to Printer ${SYSTEM_DEFAULTS.printerNumber}, apply label ${SYSTEM_DEFAULTS.alphaLabelNumber} to Alpha pallet, apply label ${SYSTEM_DEFAULTS.bravoLabelNumber} to Bravo pallet, then deliver to your door number.`,
  },
  {
    q: "What does my performance percent mean?",
    a: "Your performance percent compares your actual rate to the warehouse goal rate. 100% means you're exactly on goal. Above 100% means you're ahead. Below 100% means you need to pick up pace.",
  },
  {
    q: "Can I pause the session?",
    a: "Yes — say 'pause' or press the pause button in the session screen. Say 'resume' or tap resume to continue. The timer pauses too.",
  },
  {
    q: "What is a short pick?",
    a: "When a slot doesn't have enough product to fill your order, say 'short' and NOVA will log it and move you to the next stop. Report shortages to your supervisor at the end of your shift.",
  },
  {
    q: "What is the difference between Training, Production, and Ultra-Fast mode?",
    a: "Training mode speaks slower with more guidance — great for new hires. Production mode is standard speed. Ultra-Fast mode gives minimal verbal cues and assumes you know the flow. Talk to your trainer before switching modes.",
  },
];

export default function NovaHelpPage() {
  const [search, setSearch] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const filteredCommands = VOICE_COMMANDS.filter(
    c => c.command.toLowerCase().includes(search.toLowerCase()) ||
         c.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Hero */}
      <div className="border-b border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 px-6 py-14 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-yellow-400 mb-5">
          <Headphones className="h-8 w-8 text-slate-950" />
        </div>
        <h1 className="text-4xl font-black text-white mb-3">NOVA Help Center</h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Everything you need to know about the NOVA voice-directed picking system.
          Say "Hey NOVA" anytime during a session to get contextual help.
        </p>
        <div className="mt-4 flex gap-3 justify-center text-sm text-slate-500">
          <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700">"Hey NOVA" to wake</span>
          <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700">"stop" to silence</span>
          <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700">"repeat" to replay</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12 space-y-14">

        {/* Quick Reference Cards */}
        <section>
          <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2"><Zap className="h-5 w-5 text-yellow-400" /> Quick Reference</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">System Defaults</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-400">Printer</span><span className="font-mono font-bold text-yellow-400">{SYSTEM_DEFAULTS.printerNumber}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Alpha Label</span><span className="font-mono font-bold text-yellow-400">{SYSTEM_DEFAULTS.alphaLabelNumber}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Bravo Label</span><span className="font-mono font-bold text-yellow-400">{SYSTEM_DEFAULTS.bravoLabelNumber}</span></div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Door Codes</p>
              <div className="space-y-2 text-sm">
                {DOOR_CODES.slice(0, 3).map(dc => (
                  <div key={dc.doorNumber} className="flex justify-between">
                    <span className="text-slate-400">Door {dc.doorNumber}</span>
                    <span className="font-mono font-bold text-yellow-400">{dc.stagingCode}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Emergency</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-red-400"><AlertTriangle className="h-4 w-4" /><span>Say "emergency stop"</span></div>
                <p className="text-slate-400">NOVA immediately silences and flags your supervisor. Use for injuries or hazards.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Voice Commands */}
        <section>
          <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2"><Mic className="h-5 w-5 text-yellow-400" /> Voice Commands</h2>
          <div className="relative mb-5">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search commands..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-yellow-400 transition"
            />
          </div>
          <div className="space-y-3">
            {filteredCommands.map(cmd => (
              <div key={cmd.command} className="rounded-xl border border-slate-800 bg-slate-900 p-4 flex flex-col md:flex-row md:items-start gap-3">
                <div className="shrink-0">
                  <span className="inline-block px-3 py-1.5 rounded-lg bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 font-mono font-bold text-sm">
                    "{cmd.command}"
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm">{cmd.description}</p>
                  {cmd.aliases.length > 0 && (
                    <p className="text-xs text-slate-500 mt-1">Also: {cmd.aliases.map(a => `"${a}"`).join(", ")}</p>
                  )}
                </div>
                <div className="shrink-0 flex gap-2 flex-wrap">
                  {cmd.modes.map(m => (
                    <span key={m} className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-xs font-medium capitalize">{m.replace("_", " ")}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQs */}
        <section>
          <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2"><BookOpen className="h-5 w-5 text-yellow-400" /> Frequently Asked Questions</h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between text-white font-semibold hover:bg-slate-800/50 transition"
                >
                  {faq.q}
                  <span className="text-slate-500 text-lg">{openFaq === i ? "−" : "+"}</span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-slate-300 text-sm leading-relaxed border-t border-slate-800">
                    <p className="pt-4">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
