import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { Loader2, CheckCircle2, ShieldCheck } from "lucide-react";
import type { Lead } from "@/lib/leadStore";

export default function DealSignPage() {
  const { id } = useParams<{ id: string }>();
  const [deal, setDeal] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [agree, setAgree] = useState(false);
  const [name, setName] = useState("");
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/leads/${id}`)
      .then((r) => r.json())
      .then((data) => { setDeal(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  async function handleAgreeAndPay() {
    if (!agree || !name.trim()) {
      alert("Please enter your full name and check the agreement box.");
      return;
    }
    if (!deal) return;
    setProcessing(true);

    try {
      // Save signature
      await fetch(`/api/leads/${deal.id}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signedBy: name }),
      });

      // Try Stripe checkout
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: deal.companyName,
          email: deal.email,
          weeklyRate: deal.weeklyPrice ? Number(deal.weeklyPrice) : 1660,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
          return;
        }
      }

      // Stripe not configured — still mark as done
      setDone(true);
    } catch (err) {
      console.error(err);
      setDone(true);
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-yellow-400 animate-spin" />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <p className="text-xl font-bold">Agreement not found.</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-6">
          <CheckCircle2 className="h-20 w-20 text-green-400 mx-auto" />
          <h1 className="text-3xl font-black text-white">Agreement Signed!</h1>
          <p className="text-slate-300 text-lg">
            Welcome aboard, <span className="text-yellow-400 font-bold">{deal.companyName}</span>. Your NOVA system is being activated. You'll receive a confirmation shortly.
          </p>
          <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-left">
            <p className="text-xs font-black text-green-400 uppercase tracking-widest mb-2">Signed By</p>
            <p className="text-white font-bold">{name}</p>
          </div>
        </div>
      </div>
    );
  }

  const weeklyRate = deal.weeklyPrice ? Number(deal.weeklyPrice) : 1660;
  const monthlyRate = Math.round(weeklyRate * 4.33);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-full bg-yellow-400 flex items-center justify-center font-black text-slate-950 text-lg">N</div>
          <div>
            <p className="font-black text-lg text-white">PickSmart NOVA</p>
            <p className="text-xs text-slate-400">Service Agreement</p>
          </div>
        </div>

        {/* Agreement */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="h-5 w-5 text-yellow-400" />
            <h1 className="text-xl font-black">Service Agreement</h1>
          </div>

          <p className="text-slate-300">
            This agreement is between <strong className="text-white">PickSmart NOVA</strong> and{" "}
            <strong className="text-yellow-400">{deal.companyName}</strong>.
          </p>

          <div className="space-y-3 text-sm text-slate-300">
            <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
              <p className="font-black text-white mb-2">Service Includes</p>
              <ul className="space-y-1">
                <li>✓ AI Voice Training System (NOVA Trainer)</li>
                <li>✓ Supervisor Command Center</li>
                <li>✓ Selector Performance Tracking & Leaderboard</li>
                <li>✓ Full English / Spanish bilingual support</li>
                <li>✓ NOVA Help AI Voice Coach</li>
                <li>✓ Shift briefings & daily focus assignments</li>
              </ul>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
              <p className="font-black text-white mb-2">Pricing</p>
              <p className="text-yellow-400 font-black text-lg">${weeklyRate.toLocaleString()}/week <span className="text-slate-400 font-normal text-sm">(≈ ${monthlyRate.toLocaleString()}/month)</span></p>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
              <p className="font-black text-white mb-2">Terms</p>
              <ul className="space-y-1">
                <li>✓ 30-day free trial period</li>
                <li>✓ 1-year agreement after trial</li>
                <li>✓ Cancel anytime during trial — zero charge</li>
                <li>✓ Performance-based system — results or it's free</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Signature */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-4">
          <h2 className="text-xl font-black">Sign Agreement</h2>

          <div>
            <label className="block text-xs font-bold text-yellow-400 uppercase tracking-widest mb-1.5">Full Name (Authorized Representative)</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full legal name"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-yellow-400 transition"
            />
          </div>

          <label className="flex items-start gap-3 cursor-pointer select-none">
            <div className="relative mt-0.5">
              <input
                type="checkbox"
                checked={agree}
                onChange={() => setAgree(!agree)}
                className="sr-only"
              />
              <div className={`h-5 w-5 rounded border-2 flex items-center justify-center transition ${agree ? "bg-yellow-400 border-yellow-400" : "border-slate-600 bg-slate-950"}`}>
                {agree && <CheckCircle2 className="h-3.5 w-3.5 text-slate-950" />}
              </div>
            </div>
            <span className="text-sm text-slate-300">
              I agree to the service terms above. I am authorized to sign on behalf of <strong className="text-white">{deal.companyName}</strong>.
            </span>
          </label>
        </div>

        {/* CTA */}
        <button
          onClick={handleAgreeAndPay}
          disabled={processing || !agree || !name.trim()}
          className="w-full rounded-2xl bg-yellow-400 py-4 font-black text-slate-950 text-lg hover:bg-yellow-300 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {processing ? (
            <><Loader2 className="h-5 w-5 animate-spin" /> Processing…</>
          ) : (
            "✅ Agree & Start 30-Day Free Trial"
          )}
        </button>

        <p className="text-center text-xs text-slate-500">
          Secured by PickSmart NOVA · Your data is safe · Cancel anytime during trial
        </p>

      </div>
    </div>
  );
}
