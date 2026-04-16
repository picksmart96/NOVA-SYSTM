import { useState } from "react";
import { useLocation } from "wouter";
import { useAuthStore } from "@/lib/authStore";
import {
  Activity, CheckCircle2, Zap, Shield, Star,
  Phone, Mail, ArrowLeft, Loader2
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

const PLANS = [
  {
    id: "weekly",
    label: "Weekly",
    price: "$1,660",
    per: "per week",
    billedAs: "Billed weekly via card",
    badge: null,
    cta: "Start Weekly Plan",
    stripe: true,
    features: [
      "Full platform access",
      "Unlimited selectors & trainers",
      "NOVA voice-directed sessions",
      "Real-time mistake tracking",
      "CSV assignment upload",
      "Cancel anytime",
    ],
  },
  {
    id: "1yr",
    label: "1 Year",
    price: "$69,000",
    per: "per year",
    billedAs: "~$1,327/week · Save 20%",
    badge: "Most Popular",
    cta: "Request Contract",
    stripe: false,
    features: [
      "Everything in Weekly",
      "Dedicated onboarding support",
      "Custom warehouse configuration",
      "Priority email & phone support",
      "Volume selector seats included",
      "Annual billing invoice",
    ],
  },
  {
    id: "2yr",
    label: "2 Years",
    price: "$120,000",
    per: "2-year term",
    billedAs: "~$1,154/week · Save 31%",
    badge: null,
    cta: "Request Contract",
    stripe: false,
    features: [
      "Everything in 1 Year",
      "Rate locked for term",
      "Dedicated account manager",
      "Quarterly business reviews",
      "Custom module branding",
      "Multi-warehouse support",
    ],
  },
  {
    id: "3yr",
    label: "3 Years",
    price: "$165,000",
    per: "3-year term",
    billedAs: "~$1,058/week · Save 36%",
    badge: null,
    cta: "Request Contract",
    stripe: false,
    features: [
      "Everything in 2 Years",
      "SLA uptime guarantee",
      "Custom integrations",
      "On-site training sessions",
      "Unlimited warehouse profiles",
      "Executive sponsorship",
    ],
  },
  {
    id: "5yr",
    label: "5 Years",
    price: "$250,000",
    per: "5-year term",
    billedAs: "~$962/week · Save 42%",
    badge: "Best Value",
    cta: "Request Contract",
    stripe: false,
    features: [
      "Everything in 3 Years",
      "Lowest cost per week",
      "First access to new features",
      "Dedicated infrastructure",
      "Custom API access",
      "Full white-label option",
    ],
  },
  {
    id: "10yr",
    label: "10 Years",
    price: "$450,000",
    per: "10-year term",
    billedAs: "~$865/week · Save 48%",
    badge: null,
    cta: "Request Contract",
    stripe: false,
    features: [
      "Everything in 5 Years",
      "Lifetime rate lock",
      "Strategic platform partnership",
      "Full feature roadmap input",
      "Dedicated dev resources",
      "Enterprise SLA",
    ],
  },
];

export default function UpgradePage() {
  const [, navigate] = useLocation();
  const currentUser = useAuthStore((s) => s.currentUser);
  const [loading, setLoading] = useState<string | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({ name: currentUser?.fullName ?? "", email: currentUser?.email ?? "", message: "" });
  const [sent, setSent] = useState(false);

  async function handleWeekly() {
    setLoading("weekly");
    try {
      const res = await fetch(`${API_BASE}/create-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentUser?.email ?? "", billing: "weekly" }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) window.location.href = data.url;
    } catch {
      alert("Failed to start checkout. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  function openContact(planId: string) {
    setSelectedPlan(planId);
    setContactOpen(true);
    setSent(false);
  }

  async function sendContactRequest() {
    const plan = PLANS.find((p) => p.id === selectedPlan);
    setLoading("contact");
    try {
      await fetch(`${API_BASE}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: contactForm.name,
          email: contactForm.email,
          companyName: currentUser?.companyName ?? "",
          message: `Upgrade request: ${plan?.label} plan (${plan?.price}). ${contactForm.message}`,
          source: "upgrade-page",
        }),
      });
      setSent(true);
    } catch {
      setSent(true);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Header */}
      <div className="border-b border-slate-800 px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate("/command")}
          className="text-slate-400 hover:text-white flex items-center gap-2 text-sm transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="flex items-center gap-2 ml-auto">
          <div className="bg-yellow-400 text-slate-950 p-1.5 rounded-lg">
            <Activity className="h-4 w-4" />
          </div>
          <span className="font-black text-sm">PickSmart <span className="text-yellow-400">NOVA</span></span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-14">

        {/* Hero */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-xs font-black uppercase tracking-wider px-4 py-1.5 rounded-full mb-6">
            <Zap className="h-3.5 w-3.5" /> Upgrade Your Plan
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            Upgrade to a paid plan
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Your 30-day trial gives you a taste — paid plans unlock everything with no limits.
            Weekly contracts start immediately. Annual plans include dedicated support.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-14">
          {PLANS.map((plan) => {
            const isPopular = plan.badge === "Most Popular";
            const isBest = plan.badge === "Best Value";
            const highlight = isPopular || isBest;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border p-6 flex flex-col transition ${
                  highlight
                    ? "border-yellow-400/60 bg-yellow-400/5"
                    : "border-slate-800 bg-slate-900"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-yellow-400 text-slate-950 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1">
                      <Star className="h-3 w-3" /> {plan.badge}
                    </span>
                  </div>
                )}

                <div className="mb-5">
                  <p className="text-sm text-slate-400 font-medium mb-1">{plan.label}</p>
                  <div className="flex items-end gap-1.5">
                    <span className="text-3xl font-black text-white">{plan.price}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{plan.per}</p>
                  <p className={`text-xs mt-1 font-medium ${highlight ? "text-yellow-400" : "text-slate-400"}`}>
                    {plan.billedAs}
                  </p>
                </div>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                      <CheckCircle2 className="h-4 w-4 text-yellow-400 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => plan.stripe ? handleWeekly() : openContact(plan.id)}
                  disabled={loading === "weekly" && plan.stripe}
                  className={`w-full rounded-xl py-3 font-black text-sm flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
                    highlight
                      ? "bg-yellow-400 text-slate-950 hover:bg-yellow-300"
                      : "bg-slate-800 text-white hover:bg-slate-700 border border-slate-700"
                  }`}
                >
                  {loading === "weekly" && plan.stripe ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Redirecting…</>
                  ) : (
                    plan.cta
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Trust strip */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="flex flex-col items-center gap-2">
            <Shield className="h-6 w-6 text-yellow-400" />
            <p className="font-bold text-sm">Secure Payment</p>
            <p className="text-xs text-slate-500">Weekly billing via Stripe — card charged weekly, cancel any time.</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Phone className="h-6 w-6 text-yellow-400" />
            <p className="font-bold text-sm">Dedicated Support</p>
            <p className="text-xs text-slate-500">Annual plans include a dedicated account manager and onboarding.</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Mail className="h-6 w-6 text-yellow-400" />
            <p className="font-bold text-sm">Questions?</p>
            <p className="text-xs text-slate-500">
              Email us at{" "}
              <a href="mailto:sales@picksmartacademy.net" className="text-yellow-400 hover:underline">
                sales@picksmartacademy.net
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Contact modal */}
      {contactOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-8 shadow-2xl">
            {sent ? (
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500/40 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-green-400" />
                </div>
                <h2 className="text-xl font-black">Request Sent!</h2>
                <p className="text-slate-400 text-sm">
                  We received your request for the <strong className="text-white">{PLANS.find((p) => p.id === selectedPlan)?.label} plan</strong>.
                  Our team will reach out within 1 business day.
                </p>
                <button
                  onClick={() => setContactOpen(false)}
                  className="w-full rounded-xl bg-yellow-400 text-slate-950 font-black py-3 text-sm hover:bg-yellow-300 transition"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-black">Request Contract</h2>
                  <p className="text-slate-400 text-sm mt-1">
                    <span className="text-yellow-400 font-bold">{PLANS.find((p) => p.id === selectedPlan)?.label} — {PLANS.find((p) => p.id === selectedPlan)?.price}</span>
                    {" "}· Our team will send you a contract within 1 business day.
                  </p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Your Name</label>
                    <input
                      value={contactForm.name}
                      onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-yellow-400/40"
                      placeholder="John Martinez"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Work Email</label>
                    <input
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-yellow-400/40"
                      placeholder="john@company.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Anything else? (optional)</label>
                    <textarea
                      value={contactForm.message}
                      onChange={(e) => setContactForm((f) => ({ ...f, message: e.target.value }))}
                      rows={3}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-yellow-400/40 resize-none"
                      placeholder="Number of selectors, warehouse locations, questions…"
                    />
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={() => setContactOpen(false)}
                      className="flex-1 rounded-xl border border-slate-700 text-slate-300 font-bold py-3 text-sm hover:text-white hover:border-slate-500 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={sendContactRequest}
                      disabled={!contactForm.name || !contactForm.email || loading === "contact"}
                      className="flex-1 rounded-xl bg-yellow-400 text-slate-950 font-black py-3 text-sm hover:bg-yellow-300 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading === "contact" ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : "Send Request"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
