import { useState } from "react";
import { useLocation } from "wouter";
import { useCompanyRequestStore, RequestPerson } from "@/lib/companyRequestStore";
import { Check, Plus, Trash2, Users, Briefcase, FileText, Building2, PartyPopper } from "lucide-react";

function PersonRow({
  person, index, onChange, onRemove, showRemove,
}: {
  person: RequestPerson;
  index: number;
  onChange: (field: keyof RequestPerson, value: string) => void;
  onRemove: () => void;
  showRemove: boolean;
}) {
  return (
    <div className="grid sm:grid-cols-3 gap-3 items-start p-4 rounded-2xl border border-slate-700 bg-slate-950">
      <div>
        <label className="block text-xs text-slate-500 mb-1">Full Name</label>
        <input
          value={person.name}
          onChange={(e) => onChange("name", e.target.value)}
          placeholder="e.g. Maria Lopez"
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-yellow-400 placeholder:text-slate-600"
        />
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">Email</label>
        <input
          value={person.email}
          onChange={(e) => onChange("email", e.target.value)}
          placeholder="email@company.com"
          type="email"
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-yellow-400 placeholder:text-slate-600"
        />
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-xs text-slate-500 mb-1">Profession / Title</label>
          <input
            value={person.profession}
            onChange={(e) => onChange("profession", e.target.value)}
            placeholder="e.g. Warehouse Manager"
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-yellow-400 placeholder:text-slate-600"
          />
        </div>
        {showRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="mt-5 text-red-400 hover:text-red-300 transition"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function emptyPerson(): RequestPerson {
  return { name: "", email: "", profession: "" };
}

export default function CompanyOnboardPage() {
  const [, navigate] = useLocation();
  const completeOnboarding = useCompanyRequestStore((s) => s.completeOnboarding);
  const requests = useCompanyRequestStore((s) => s.requests);

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id") ?? "";

  const request = requests.find((r) => r.id === id);

  const [userCount, setUserCount] = useState(5);
  const [trainers, setTrainers] = useState<RequestPerson[]>([emptyPerson()]);
  const [supervisors, setSupervisors] = useState<RequestPerson[]>([emptyPerson()]);
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!request) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <p className="text-slate-400">Request not found. Please start from the checkout page.</p>
          <button onClick={() => navigate("/checkout/company")} className="text-yellow-400 hover:underline">
            Go to Checkout
          </button>
        </div>
      </div>
    );
  }

  function updateTrainer(i: number, field: keyof RequestPerson, value: string) {
    setTrainers((prev) => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p));
  }
  function addTrainer() { setTrainers((p) => [...p, emptyPerson()]); }
  function removeTrainer(i: number) { setTrainers((p) => p.filter((_, idx) => idx !== i)); }

  function updateSupervisor(i: number, field: keyof RequestPerson, value: string) {
    setSupervisors((prev) => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p));
  }
  function addSupervisor() { setSupervisors((p) => [...p, emptyPerson()]); }
  function removeSupervisor(i: number) { setSupervisors((p) => p.filter((_, idx) => idx !== i)); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 700));
    completeOnboarding(id, {
      userCount,
      trainers: trainers.filter((t) => t.name.trim()),
      supervisors: supervisors.filter((s) => s.name.trim()),
      additionalNotes: notes.trim(),
    });
    setSubmitted(true);
    setSubmitting(false);
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center">
              <PartyPopper className="h-9 w-9 text-green-400" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-black">Request Submitted!</h1>
            <p className="mt-3 text-slate-400 text-base leading-relaxed">
              Your company subscription request has been sent to the owner. You'll be contacted at{" "}
              <span className="text-white font-semibold">{request.contactEmail}</span> to arrange payment and finalize access.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 text-left space-y-2 text-sm">
            <p className="font-bold text-white mb-2">What happens next:</p>
            <div className="flex items-start gap-2 text-slate-300">
              <span className="w-5 h-5 rounded-full bg-yellow-400/20 text-yellow-400 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">1</span>
              Owner reviews your company request and team details
            </div>
            <div className="flex items-start gap-2 text-slate-300">
              <span className="w-5 h-5 rounded-full bg-yellow-400/20 text-yellow-400 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">2</span>
              Owner contacts you to arrange payment ({request.contractLabel} — {request.totalLabel})
            </div>
            <div className="flex items-start gap-2 text-slate-300">
              <span className="w-5 h-5 rounded-full bg-yellow-400/20 text-yellow-400 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">3</span>
              Payment confirmed → your team receives invite links and login access
            </div>
          </div>
          <button
            onClick={() => navigate("/")}
            className="w-full rounded-2xl border border-slate-700 py-3 font-semibold text-slate-300 hover:text-white transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-12">
      <div className="mx-auto max-w-3xl">

        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-yellow-400">Step 3 of 3</p>
          <h1 className="mt-2 text-3xl font-black">Team Setup</h1>
          <p className="mt-2 text-slate-400">
            Tell us about your team. This goes directly to the owner so access can be set up for everyone on your list.
          </p>
        </div>

        {/* Company summary */}
        <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-5 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-yellow-400" />
            <div>
              <p className="font-bold text-white">{request.companyName}</p>
              <p className="text-xs text-slate-500">{request.contactEmail}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-2">
            <span className="text-sm font-bold text-yellow-400">{request.contractLabel} — {request.totalLabel}</span>
          </div>
          <div className="flex items-center gap-1.5 text-green-400 text-sm font-semibold">
            <Check className="h-4 w-4" /> Company info saved
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* User count */}
          <Section icon={<Users className="h-5 w-5 text-yellow-400" />} title="How many users do you need?">
            <p className="text-slate-400 text-sm mb-4">
              Total number of people who will need access to the PickSmart NOVA platform (selectors, trainers, supervisors combined).
            </p>
            <div className="flex items-center gap-4">
              <button type="button" onClick={() => setUserCount((n) => Math.max(1, n - 1))}
                className="w-10 h-10 rounded-xl border border-slate-700 bg-slate-900 text-xl font-black hover:border-yellow-400 transition">
                −
              </button>
              <span className="text-4xl font-black w-16 text-center">{userCount}</span>
              <button type="button" onClick={() => setUserCount((n) => n + 1)}
                className="w-10 h-10 rounded-xl border border-slate-700 bg-slate-900 text-xl font-black hover:border-yellow-400 transition">
                +
              </button>
              <span className="text-slate-400 text-sm">users</span>
            </div>
          </Section>

          {/* Trainers */}
          <Section icon={<Briefcase className="h-5 w-5 text-blue-400" />} title="Trainers">
            <p className="text-slate-400 text-sm mb-4">
              List the trainers who will coach selectors and manage NOVA sessions. Include their name, email, and title.
            </p>
            <div className="space-y-3">
              {trainers.map((t, i) => (
                <PersonRow
                  key={i} person={t} index={i}
                  onChange={(f, v) => updateTrainer(i, f, v)}
                  onRemove={() => removeTrainer(i)}
                  showRemove={trainers.length > 1}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={addTrainer}
              className="mt-3 flex items-center gap-2 text-sm text-yellow-400 hover:text-yellow-300 transition font-semibold"
            >
              <Plus className="h-4 w-4" /> Add another trainer
            </button>
          </Section>

          {/* Supervisors / Managers */}
          <Section icon={<Briefcase className="h-5 w-5 text-emerald-400" />} title="Supervisors & Managers">
            <p className="text-slate-400 text-sm mb-4">
              List supervisors and managers who will have access to the supervisor dashboard and reporting tools.
            </p>
            <div className="space-y-3">
              {supervisors.map((s, i) => (
                <PersonRow
                  key={i} person={s} index={i}
                  onChange={(f, v) => updateSupervisor(i, f, v)}
                  onRemove={() => removeSupervisor(i)}
                  showRemove={supervisors.length > 1}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={addSupervisor}
              className="mt-3 flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition font-semibold"
            >
              <Plus className="h-4 w-4" /> Add another supervisor
            </button>
          </Section>

          {/* Notes */}
          <Section icon={<FileText className="h-5 w-5 text-slate-400" />} title="Additional Notes (optional)">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Any special requirements, warehouse details, preferred start date, or questions for the owner…"
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-yellow-400 resize-none placeholder:text-slate-600"
            />
          </Section>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-yellow-400 py-4 text-lg font-black text-slate-950 hover:bg-yellow-300 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? "Sending to owner…" : "Submit Team Details & Send Request"}
          </button>

          <p className="text-center text-slate-600 text-xs">
            Your request goes directly to the owner. You'll be contacted to confirm payment and finalize access.
          </p>
        </form>

      </div>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-7 space-y-1">
      <h2 className="text-lg font-black flex items-center gap-2 mb-4">{icon}{title}</h2>
      {children}
    </div>
  );
}
