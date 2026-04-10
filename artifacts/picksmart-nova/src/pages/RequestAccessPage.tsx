import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, CheckCircle } from "lucide-react";

export default function RequestAccessPage() {
  const [, navigate] = useLocation();
  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    selectors: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/request-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Server error");
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again or email us directly.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
        <div className="text-center max-w-lg space-y-5">
          <div className="flex justify-center">
            <CheckCircle className="h-16 w-16 text-yellow-400" />
          </div>
          <h1 className="text-3xl font-black text-yellow-400">Request Received</h1>
          <p className="text-slate-300 text-lg leading-relaxed">
            We'll contact you shortly to set up your PickSmart NOVA system and walk you through onboarding your team.
          </p>
          <button
            onClick={() => navigate("/demo")}
            className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-6 py-3 font-bold text-slate-950 hover:bg-yellow-300 transition"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Demo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex justify-center items-start px-4 py-12">
      <div className="w-full max-w-xl space-y-8">

        <button
          onClick={() => navigate("/demo")}
          className="flex items-center gap-2 text-slate-400 hover:text-yellow-400 transition text-sm"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Demo
        </button>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-yellow-400 mb-1">Get Started</p>
          <h1 className="text-3xl font-black">Request Company Access</h1>
          <p className="mt-2 text-slate-400 text-sm">
            Tell us about your warehouse and we'll set up a full PickSmart NOVA account for your team.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-900 rounded-2xl border border-slate-800 p-7 space-y-4">

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Your Name *</label>
            <input
              name="name"
              value={form.name}
              placeholder="First and Last Name"
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-yellow-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Company / Warehouse Name *</label>
            <input
              name="company"
              value={form.company}
              placeholder="e.g. Midwest Distribution LLC"
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-yellow-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address *</label>
            <input
              name="email"
              type="email"
              value={form.email}
              placeholder="you@company.com"
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-yellow-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Phone Number</label>
            <input
              name="phone"
              value={form.phone}
              placeholder="(optional)"
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-yellow-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Number of Selectors</label>
            <select
              name="selectors"
              value={form.selectors}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white focus:border-yellow-400 focus:outline-none"
            >
              <option value="">Select range</option>
              <option value="1-10">1 – 10</option>
              <option value="11-25">11 – 25</option>
              <option value="26-50">26 – 50</option>
              <option value="51-100">51 – 100</option>
              <option value="100+">100+</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Biggest Training Challenges</label>
            <textarea
              name="message"
              value={form.message}
              placeholder="e.g. New selectors struggle with pallet building and pace. Safety scores are low on night shift."
              onChange={handleChange}
              rows={4}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-yellow-400 focus:outline-none resize-none"
            />
          </div>

          {error && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-yellow-400 py-3.5 font-bold text-slate-950 hover:bg-yellow-300 transition disabled:opacity-50"
          >
            {loading ? "Sending…" : "Submit Request"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-600">
          We'll respond within 1 business day to schedule your setup call.
        </p>
      </div>
    </div>
  );
}
