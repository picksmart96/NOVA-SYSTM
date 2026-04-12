import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Building2, Users, CheckCircle2, Send, Phone, Mail } from "lucide-react";

type FormState = "idle" | "sending" | "sent";

export default function CompanyRequestPage() {
  const [formState, setFormState] = useState<FormState>("idle");
  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    teamSize: "",
    message: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.company || !form.email) return;
    setFormState("sending");

    try {
      await fetch("/api/company-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } catch {
      // fire-and-forget — show success regardless
    }

    setFormState("sent");
  }

  if (formState === "sent") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-10 w-10 text-green-400" />
          </div>
          <h1 className="text-4xl font-black text-white">Request Sent</h1>
          <p className="text-slate-300 text-lg leading-relaxed">
            Thank you, <span className="text-yellow-400 font-bold">{form.name}</span>. Our team will
            reach out to you at <span className="text-yellow-400 font-bold">{form.email}</span> within
            one business day to discuss your company's plan.
          </p>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-left space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">What to expect</p>
            <p className="text-slate-300">• A team member will contact you directly</p>
            <p className="text-slate-300">• We'll walk through your team size and needs</p>
            <p className="text-slate-300">• Custom pricing confirmed before any commitment</p>
            <p className="text-slate-300">• No obligation to proceed</p>
          </div>
          <Link href="/pricing">
            <button className="w-full rounded-2xl bg-yellow-400 px-6 py-4 font-black text-slate-950 hover:bg-yellow-300 transition">
              Back to Pricing
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white px-6 py-12">
      <div className="mx-auto max-w-2xl">

        <Link
          href="/pricing"
          className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition text-sm font-medium mb-8"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Pricing
        </Link>

        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-yellow-400" />
            </div>
            <span className="px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-xs font-bold text-yellow-300 uppercase tracking-widest">
              Company Plan
            </span>
          </div>
          <h1 className="text-5xl font-black">Talk to Our Team</h1>
          <p className="mt-4 text-lg text-slate-300 leading-relaxed">
            Company pricing is customized to your team size, contract length, and operational needs.
            Fill out the form below and we'll reach out within one business day.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 mb-10">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 text-center">
            <Users className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
            <p className="font-bold text-white">Unlimited Users</p>
            <p className="text-xs text-slate-400 mt-1">Every seat covered</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 text-center">
            <Phone className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
            <p className="font-bold text-white">Dedicated Support</p>
            <p className="text-xs text-slate-400 mt-1">Direct team access</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 text-center">
            <Mail className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
            <p className="font-bold text-white">Custom Contracts</p>
            <p className="text-xs text-slate-400 mt-1">Weekly · Monthly · Yearly</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-800 bg-slate-900 p-8 space-y-6">
          <h2 className="text-2xl font-black">Request Information</h2>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                Full Name <span className="text-yellow-400">*</span>
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="Your name"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder-slate-600 focus:border-yellow-400 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                Company Name <span className="text-yellow-400">*</span>
              </label>
              <input
                name="company"
                value={form.company}
                onChange={handleChange}
                required
                placeholder="Your company"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder-slate-600 focus:border-yellow-400 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                Work Email <span className="text-yellow-400">*</span>
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="you@company.com"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder-slate-600 focus:border-yellow-400 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                Phone (optional)
              </label>
              <input
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="(555) 000-0000"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder-slate-600 focus:border-yellow-400 focus:outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
              Team Size
            </label>
            <select
              name="teamSize"
              value={form.teamSize}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-yellow-400 focus:outline-none transition"
            >
              <option value="">Select team size</option>
              <option value="1-10">1 – 10 users</option>
              <option value="11-25">11 – 25 users</option>
              <option value="26-50">26 – 50 users</option>
              <option value="51-100">51 – 100 users</option>
              <option value="100+">100+ users</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
              Message (optional)
            </label>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              rows={4}
              placeholder="Tell us about your operation, preferred contract length, or any questions..."
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder-slate-600 focus:border-yellow-400 focus:outline-none transition resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={!form.name || !form.company || !form.email || formState === "sending"}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-6 py-4 text-lg font-black text-slate-950 hover:bg-yellow-300 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {formState === "sending" ? (
              <>
                <div className="w-5 h-5 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-5 w-5" />
                Send Request
              </>
            )}
          </button>

          <p className="text-center text-xs text-slate-500">
            No commitment required. We'll contact you to discuss options before anything is confirmed.
          </p>
        </form>

      </div>
    </div>
  );
}
