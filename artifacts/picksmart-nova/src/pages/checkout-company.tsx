import { useState } from "react";
import { useLocation } from "wouter";
import { useAuthStore } from "@/lib/authStore";
import { useCompanyRequestStore, CONTRACT_OPTIONS, ContractType } from "@/lib/companyRequestStore";
import {
  Check, ChevronRight, Shield, Building2, Phone, Mail,
  User, FileText, Clock, Star,
} from "lucide-react";

const FEATURES = [
  "Everything in Professional Single",
  "NOVA Trainer voice-directed picking",
  "Trainer Dashboard & coaching tools",
  "Supervisor Dashboard & live tracking",
  "Unlimited company users",
  "Bilingual English / Spanish support",
  "Selector Breaking News community feed",
  "Full onboarding + handbook access",
];

export default function CompanyCheckoutPage() {
  const [, navigate] = useLocation();
  const { currentUser } = useAuthStore();
  const submitCheckout = useCompanyRequestStore((s) => s.submitCheckout);

  const params = new URLSearchParams(window.location.search);
  const defaultBilling = (params.get("billing") ?? "weekly") as ContractType;
  const validKeys = CONTRACT_OPTIONS.map((c) => c.key);
  const initialKey = validKeys.includes(defaultBilling) ? defaultBilling : "weekly";

  const [contractType, setContractType] = useState<ContractType>(initialKey);
  const [step, setStep] = useState<"contract" | "info">("contract");

  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState(currentUser?.fullName ?? "");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const selected = CONTRACT_OPTIONS.find((c) => c.key === contractType)!;

  function validateInfo() {
    const e: Record<string, string> = {};
    if (!companyName.trim()) e.companyName = "Company name is required";
    if (!contactName.trim()) e.contactName = "Contact name is required";
    if (!contactEmail.trim() || !contactEmail.includes("@")) e.contactEmail = "Valid email is required";
    if (!contactPhone.trim()) e.contactPhone = "Phone number is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateInfo()) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));
    const id = submitCheckout({
      companyName: companyName.trim(),
      contactName: contactName.trim(),
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.trim(),
      contractType,
    });
    navigate(`/checkout/company/onboard?id=${id}`);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-12">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-10">
          <button
            onClick={() => step === "info" ? setStep("contract") : navigate("/pricing")}
            className="text-slate-500 hover:text-white text-sm mb-4 flex items-center gap-1 transition"
          >
            ← {step === "info" ? "Back to contract selection" : "Back to pricing"}
          </button>
          <p className="text-xs font-bold uppercase tracking-widest text-yellow-400">Checkout</p>
          <h1 className="mt-2 text-4xl font-black">Company Unlimited Plan</h1>
          <p className="mt-2 text-slate-400">Choose your contract term, then complete your company details.</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3 mb-10">
          {[
            { n: 1, label: "Select Contract" },
            { n: 2, label: "Company Details" },
            { n: 3, label: "Team Setup" },
          ].map(({ n, label }, i) => {
            const done = (step === "info" && n === 1) || n < (step === "contract" ? 1 : 2);
            const active = (step === "contract" && n === 1) || (step === "info" && n === 2);
            return (
              <div key={n} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition ${
                  done ? "bg-green-500 text-white" : active ? "bg-yellow-400 text-slate-950" : "bg-slate-800 text-slate-500"
                }`}>
                  {done ? <Check className="h-4 w-4" /> : n}
                </div>
                <span className={`text-sm font-semibold ${active ? "text-white" : "text-slate-500"}`}>{label}</span>
                {i < 2 && <div className="w-8 h-px bg-slate-700" />}
              </div>
            );
          })}
        </div>

        <div className="grid xl:grid-cols-3 gap-8">

          {/* Left: main form */}
          <div className="xl:col-span-2 space-y-6">

            {/* ── STEP 1: Contract type ── */}
            {step === "contract" && (
              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 space-y-6">
                <h2 className="text-xl font-black flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-400" /> Choose Your Contract Term
                </h2>

                <div className="space-y-3">
                  {CONTRACT_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setContractType(opt.key)}
                      className={`w-full text-left rounded-2xl border p-4 transition flex items-center justify-between gap-3 ${
                        contractType === opt.key
                          ? "border-yellow-400 bg-yellow-400/10"
                          : "border-slate-700 bg-slate-950 hover:border-slate-500"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          contractType === opt.key ? "border-yellow-400 bg-yellow-400" : "border-slate-600"
                        }`}>
                          {contractType === opt.key && <Check className="h-3 w-3 text-slate-950" />}
                        </div>
                        <div>
                          <p className="font-bold text-white">{opt.label}</p>
                          <p className="text-xs text-slate-500">{opt.sublabel}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-black text-white">{opt.totalLabel}</p>
                        <p className="text-xs text-slate-500">${opt.weeklyRate.toLocaleString()}/week effective</p>
                        {opt.savings && (
                          <span className="inline-block mt-1 rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-bold text-green-400">
                            {opt.savings}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setStep("info")}
                  className="w-full rounded-2xl bg-yellow-400 py-4 font-black text-slate-950 hover:bg-yellow-300 transition flex items-center justify-center gap-2"
                >
                  Continue with {selected.label} Contract <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}

            {/* ── STEP 2: Company info ── */}
            {step === "info" && (
              <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-800 bg-slate-900 p-8 space-y-6">
                <h2 className="text-xl font-black flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-yellow-400" /> Company Details
                </h2>
                <p className="text-slate-400 text-sm -mt-3">
                  This information will be reviewed by the owner before access is granted.
                </p>

                <div className="grid sm:grid-cols-2 gap-5">
                  <Field
                    label="Company Name"
                    icon={<Building2 className="h-4 w-4" />}
                    value={companyName}
                    onChange={setCompanyName}
                    placeholder="e.g. ACME Distribution LLC"
                    error={errors.companyName}
                  />
                  <Field
                    label="Primary Contact Name"
                    icon={<User className="h-4 w-4" />}
                    value={contactName}
                    onChange={setContactName}
                    placeholder="Your full name"
                    error={errors.contactName}
                  />
                  <Field
                    label="Email Address"
                    icon={<Mail className="h-4 w-4" />}
                    value={contactEmail}
                    onChange={setContactEmail}
                    placeholder="you@company.com"
                    type="email"
                    error={errors.contactEmail}
                  />
                  <Field
                    label="Phone Number"
                    icon={<Phone className="h-4 w-4" />}
                    value={contactPhone}
                    onChange={setContactPhone}
                    placeholder="+1 (555) 000-0000"
                    type="tel"
                    error={errors.contactPhone}
                  />
                </div>

                <div className="rounded-2xl border border-slate-700 bg-slate-950 p-4 text-sm text-slate-400">
                  <p className="font-semibold text-white mb-1">What happens next?</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>You'll set up your team details on the next screen</li>
                    <li>Your request is sent directly to the owner for review</li>
                    <li>Owner contacts you to arrange payment</li>
                    <li>Once payment is confirmed, access is granted to your team</li>
                  </ol>
                </div>

                {!currentUser && (
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-300 text-sm">
                    You're submitting as a guest. After your request is approved, you'll receive login credentials from the owner.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-2xl bg-yellow-400 py-4 font-black text-slate-950 hover:bg-yellow-300 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? "Submitting…" : "Submit Request & Set Up Team →"}
                </button>
              </form>
            )}
          </div>

          {/* Right: order summary */}
          <div className="space-y-5">
            <div className="rounded-3xl border border-yellow-400/30 bg-slate-900 p-6 space-y-5 sticky top-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-yellow-400">Order Summary</p>
                <h3 className="mt-2 text-2xl font-black">Company Unlimited</h3>
                <p className="text-slate-400 text-sm mt-1">{selected.label} Contract</p>
              </div>

              <div className="rounded-2xl border border-slate-700 bg-slate-950 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Contract term</span>
                  <span className="font-bold">{selected.label}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Effective weekly rate</span>
                  <span className="font-bold">${selected.weeklyRate.toLocaleString()}/wk</span>
                </div>
                {selected.savings && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Savings</span>
                    <span className="font-bold text-green-400">{selected.savings}</span>
                  </div>
                )}
                <div className="border-t border-slate-700 pt-2 flex justify-between font-black text-lg">
                  <span>Total</span>
                  <span className="text-yellow-400">{selected.totalLabel}</span>
                </div>
              </div>

              <ul className="space-y-2">
                {FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                    <Check className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-3 flex items-start gap-2 text-xs text-slate-500">
                <Shield className="h-4 w-4 shrink-0 mt-0.5 text-slate-500" />
                Payment arranged directly with owner after approval. No card stored during checkout.
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Star className="h-3.5 w-3.5 text-yellow-400" />
                Users & Access and Owner controls remain private to owner only.
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function Field({
  label, icon, value, onChange, placeholder, type = "text", error,
}: {
  label: string; icon: React.ReactNode; value: string;
  onChange: (v: string) => void; placeholder: string;
  type?: string; error?: string;
}) {
  return (
    <div>
      <label className="block text-sm text-slate-400 mb-2">{label}</label>
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">{icon}</div>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-2xl border bg-slate-950 pl-10 pr-4 py-3 text-white outline-none transition placeholder:text-slate-600 ${
            error ? "border-red-500 focus:border-red-400" : "border-slate-700 focus:border-yellow-400"
          }`}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
