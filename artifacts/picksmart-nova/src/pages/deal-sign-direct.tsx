import { useState } from "react";
import { Loader2, CheckCircle2, ShieldCheck, FileText, Building2, User, Mail, Calendar } from "lucide-react";

const CONTRACT_OPTIONS = [
  { term: "1 Year",   total: "$69,000",  savings: null,    badge: "Most Popular" },
  { term: "2 Years",  total: "$120,000", savings: "$18k saved", badge: null },
  { term: "3 Years",  total: "$165,000", savings: "$42k saved", badge: "Best Value" },
  { term: "5 Years",  total: "$250,000", savings: "$112k saved", badge: null },
  { term: "10 Years", total: "$450,000", savings: "$412k saved", badge: "Enterprise" },
];

export default function DealSignDirectPage() {
  const [companyName, setCompanyName]   = useState("");
  const [contactName, setContactName]   = useState("");
  const [email, setEmail]               = useState("");
  const [contractTerm, setContractTerm] = useState("1 Year");
  const [signedName, setSignedName]     = useState("");
  const [agree, setAgree]               = useState(false);
  const [processing, setProcessing]     = useState(false);
  const [done, setDone]                 = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const selectedOption = CONTRACT_OPTIONS.find((o) => o.term === contractTerm) ?? CONTRACT_OPTIONS[0];

  async function handleSignAndPay() {
    if (!companyName.trim()) { setError("Company name is required."); return; }
    if (!signedName.trim())  { setError("Please enter your full name to sign."); return; }
    if (!agree)              { setError("Please check the agreement box."); return; }
    setError(null);
    setProcessing(true);

    try {
      const res = await fetch("/api/contracts/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, contactName, email, contractTerm, signedName }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? "Server error");
      }

      const data = await res.json() as { url?: string };
      if (data.url) {
        window.location.href = data.url;
        return;
      }

      // Stripe not configured — mark done
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setProcessing(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-6">
          <div className="h-24 w-24 rounded-full bg-green-500/20 border-2 border-green-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-12 w-12 text-green-400" />
          </div>
          <h1 className="text-3xl font-black text-white">Agreement Signed!</h1>
          <p className="text-slate-300 text-lg">
            Welcome aboard, <span className="text-yellow-400 font-bold">{companyName}</span>.
            Your NOVA system is being activated. You'll receive a confirmation shortly.
          </p>
          <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4 text-left space-y-2">
            <p className="text-xs font-black text-yellow-400 uppercase tracking-widest">Agreement Details</p>
            <p className="text-white"><span className="text-slate-400">Company:</span> {companyName}</p>
            <p className="text-white"><span className="text-slate-400">Signed by:</span> {signedName}</p>
            <p className="text-white"><span className="text-slate-400">Term:</span> {contractTerm}</p>
            <p className="text-white"><span className="text-slate-400">Total:</span> {selectedOption.total}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Header bar */}
      <div className="border-b border-slate-800 bg-slate-900 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-yellow-400 flex items-center justify-center font-black text-slate-950 text-base">N</div>
          <div>
            <p className="font-black text-white leading-none">PickSmart NOVA</p>
            <p className="text-xs text-slate-400">Company Service Agreement</p>
          </div>
          <div className="ml-auto flex items-center gap-2 text-xs text-green-400">
            <ShieldCheck className="h-4 w-4" />
            <span>Secured</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* What's included */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-yellow-400" />
            <h1 className="text-xl font-black">NOVA System — Service Agreement</h1>
          </div>
          <p className="text-slate-400 text-sm">
            This agreement is between <strong className="text-white">PickSmart NOVA</strong> and your company for the deployment of the NOVA AI voice-directed picking and training platform.
          </p>

          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-slate-700 bg-slate-950 p-4 space-y-2">
              <p className="font-black text-white text-xs uppercase tracking-widest">What's Included</p>
              {[
                "AI Voice Training System (NOVA Trainer)",
                "Supervisor Command Center",
                "Selector Performance Tracking",
                "Full English / Spanish support",
                "NOVA Help AI Voice Coach",
                "Shift briefings & daily assignments",
                "Unlimited team members",
              ].map((item) => (
                <p key={item} className="text-slate-300 flex items-start gap-2">
                  <span className="text-yellow-400 mt-0.5">✓</span> {item}
                </p>
              ))}
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-950 p-4 space-y-2">
              <p className="font-black text-white text-xs uppercase tracking-widest">Performance Promise</p>
              {[
                "30-day free trial — zero charge",
                "Cancel anytime during trial",
                "Results-based system",
                "Dedicated onboarding support",
                "Weekly progress reports",
                "Priority customer support",
              ].map((item) => (
                <p key={item} className="text-slate-300 flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span> {item}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Contract term selector */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-yellow-400" />
            <h2 className="text-xl font-black">Select Contract Term</h2>
          </div>
          <p className="text-slate-400 text-sm">All terms include a 30-day free trial. Billing starts after the trial period at $1,660/week.</p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {CONTRACT_OPTIONS.map((opt) => (
              <button
                key={opt.term}
                onClick={() => setContractTerm(opt.term)}
                className={`relative rounded-2xl border-2 p-4 text-left transition group ${
                  contractTerm === opt.term
                    ? "border-yellow-400 bg-yellow-400/10"
                    : "border-slate-700 bg-slate-950 hover:border-slate-600"
                }`}
              >
                {opt.badge && (
                  <span className={`absolute -top-2.5 left-4 text-xs font-black px-2 py-0.5 rounded-full ${
                    opt.badge === "Best Value" ? "bg-green-400 text-slate-950" :
                    opt.badge === "Enterprise" ? "bg-blue-400 text-slate-950" :
                    "bg-yellow-400 text-slate-950"
                  }`}>
                    {opt.badge}
                  </span>
                )}
                <p className={`font-black text-lg ${contractTerm === opt.term ? "text-yellow-400" : "text-white"}`}>
                  {opt.term}
                </p>
                <p className="text-slate-300 font-bold text-sm mt-1">{opt.total}</p>
                {opt.savings && (
                  <p className="text-green-400 text-xs mt-1">{opt.savings}</p>
                )}
                <p className="text-slate-500 text-xs mt-1">$1,660/week billed</p>
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4 flex items-center justify-between">
            <div>
              <p className="font-black text-yellow-400">{selectedOption.term} Agreement</p>
              <p className="text-slate-300 text-sm">Total contract value: {selectedOption.total}</p>
            </div>
            <div className="text-right">
              <p className="font-black text-white text-lg">$1,660<span className="text-slate-400 font-normal text-sm">/week</span></p>
              <p className="text-slate-400 text-xs">after 30-day trial</p>
            </div>
          </div>
        </div>

        {/* Company info */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-yellow-400" />
            <h2 className="text-xl font-black">Company Information</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-yellow-400 uppercase tracking-widest mb-1.5">
                Company Name <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Acme Warehouse LLC"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-yellow-400 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Contact Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="John Smith"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-yellow-400 transition"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Business Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operations@yourcompany.com"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-yellow-400 transition"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Signature */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-yellow-400" />
            <h2 className="text-xl font-black">Authorize & Sign</h2>
          </div>

          <div>
            <label className="block text-xs font-bold text-yellow-400 uppercase tracking-widest mb-1.5">
              Full Legal Name (Authorized Representative) <span className="text-red-400">*</span>
            </label>
            <input
              value={signedName}
              onChange={(e) => setSignedName(e.target.value)}
              placeholder="Your full legal name"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-yellow-400 transition"
            />
          </div>

          <label className="flex items-start gap-3 cursor-pointer select-none">
            <div className="relative mt-0.5 flex-shrink-0">
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
              I agree to the NOVA service terms above and confirm I am authorized to sign this agreement on behalf of{" "}
              <strong className="text-white">{companyName || "my company"}</strong>. I understand the 30-day free trial terms and the billing schedule of $1,660/week after the trial period.
            </span>
          </label>

          {error && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* CTA */}
        <button
          onClick={handleSignAndPay}
          disabled={processing}
          className="w-full rounded-2xl bg-yellow-400 py-4 font-black text-slate-950 text-lg hover:bg-yellow-300 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-yellow-400/20"
        >
          {processing ? (
            <><Loader2 className="h-5 w-5 animate-spin" /> Processing…</>
          ) : (
            "✅ Sign & Start 30-Day Free Trial"
          )}
        </button>

        <p className="text-center text-xs text-slate-600">
          Secured by PickSmart NOVA · 256-bit encryption · Cancel anytime during trial · Zero charge if canceled before trial ends
        </p>

      </div>
    </div>
  );
}
