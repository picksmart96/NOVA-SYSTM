import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import type { Lead, LeadStatus } from "@/lib/leadStore";
import { STATUS_OPTIONS } from "@/lib/leadStore";

function Field({ label, value, onChange, type = "text", placeholder = "" }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-yellow-400 uppercase tracking-widest mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-yellow-400 transition"
      />
    </div>
  );
}

export default function DealDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [deal, setDeal] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/leads/${id}`)
      .then((r) => r.json())
      .then((data) => { setDeal(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  function patch(key: keyof Lead, value: string | null) {
    setDeal((d) => d ? { ...d, [key]: value } : d);
  }

  async function saveDeal() {
    if (!deal) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/leads/${deal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deal),
      });
      if (!res.ok) throw new Error("Save failed");
      const updated: Lead = await res.json();
      setDeal(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
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
        <div className="text-center">
          <p className="text-xl font-bold mb-4">Deal not found</p>
          <button onClick={() => navigate("/owner")} className="text-yellow-400 underline">
            Back to Owner Panel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-8">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate("/owner")}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition text-sm"
          >
            <ArrowLeft className="h-4 w-4" /> Back to CRM
          </button>
          <div className="flex items-center gap-3">
            {saved && <span className="text-xs text-green-400 font-bold">✓ Saved</span>}
            <button
              onClick={saveDeal}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-yellow-400 px-5 py-2.5 font-black text-slate-950 hover:bg-yellow-300 transition disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Saving…" : "Save Deal"}
            </button>
          </div>
        </div>

        <h1 className="text-3xl font-black mb-1">{deal.companyName || "Unnamed Deal"}</h1>
        <p className="text-slate-400 mb-8">{deal.contactName}{deal.contactRole ? ` · ${deal.contactRole}` : ""}</p>

        <div className="space-y-6">

          {/* Contact */}
          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Contact Info</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Company Name" value={deal.companyName} onChange={(v) => patch("companyName", v)} />
              <Field label="Contact Name" value={deal.contactName} onChange={(v) => patch("contactName", v)} />
              <Field label="Contact Role" value={deal.contactRole} onChange={(v) => patch("contactRole", v)} />
              <Field label="Email" value={deal.email} onChange={(v) => patch("email", v)} />
              <Field label="Phone" value={deal.phone} onChange={(v) => patch("phone", v)} />
              <Field label="City" value={deal.city} onChange={(v) => patch("city", v)} />
              <Field label="State" value={deal.state} onChange={(v) => patch("state", v)} />
              <Field label="Warehouse Type" value={deal.warehouseType} onChange={(v) => patch("warehouseType", v)} />
            </div>
          </section>

          {/* Deal Financials */}
          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Pricing & Status</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <Field label="Weekly Price ($)" value={deal.weeklyPrice ?? ""} onChange={(v) => patch("weeklyPrice", v || null)} placeholder="1660" />
              <Field label="Yearly Value ($)" value={deal.contractValue ?? ""} onChange={(v) => patch("contractValue", v || null)} placeholder="69000" />
              <div>
                <label className="block text-xs font-bold text-yellow-400 uppercase tracking-widest mb-1.5">Status</label>
                <select
                  value={deal.status}
                  onChange={(e) => patch("status", e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-400 transition"
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Deal Timeline */}
          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Deal Timeline</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Demo Date" value={deal.demoDate ?? ""} onChange={(v) => patch("demoDate", v || null)} type="date" />
              <Field label="Proposal Date" value={deal.proposalDate ?? ""} onChange={(v) => patch("proposalDate", v || null)} type="date" />
              <Field label="Trial Start" value={deal.trialStart ?? ""} onChange={(v) => patch("trialStart", v || null)} type="date" />
              <Field label="Trial End" value={deal.trialEnd ?? ""} onChange={(v) => patch("trialEnd", v || null)} type="date" />
              <Field label="Contract Signed" value={deal.contractSigned ?? ""} onChange={(v) => patch("contractSigned", v || null)} type="date" />
              <Field label="Renewal Date" value={deal.renewalDate ?? ""} onChange={(v) => patch("renewalDate", v || null)} type="date" />
              <Field label="Next Action Date" value={deal.nextActionDate ?? ""} onChange={(v) => patch("nextActionDate", v || null)} type="date" />
            </div>
          </section>

          {/* Notes */}
          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Notes & Next Action</h2>
            <div>
              <label className="block text-xs font-bold text-yellow-400 uppercase tracking-widest mb-1.5">Next Action</label>
              <textarea
                value={deal.nextAction}
                onChange={(e) => patch("nextAction", e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-yellow-400 transition resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-yellow-400 uppercase tracking-widest mb-1.5">Notes</label>
              <textarea
                value={deal.notes}
                onChange={(e) => patch("notes", e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-yellow-400 transition resize-none"
              />
            </div>
          </section>

          {/* Signature */}
          {deal.signedBy && (
            <section className="rounded-3xl border border-green-500/30 bg-green-500/5 p-6">
              <h2 className="text-sm font-black uppercase tracking-widest text-green-400 mb-3">Agreement Signed</h2>
              <p className="text-white font-bold">{deal.signedBy}</p>
              {deal.signedAt && (
                <p className="text-sm text-slate-400 mt-1">
                  {new Date(deal.signedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              )}
            </section>
          )}

          {/* Client Agreement Link */}
          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-3">Client Agreement Link</h2>
            <div className="flex items-center gap-2">
              <input
                value={`${window.location.origin}/deal-sign/${deal.id}`}
                readOnly
                className="flex-1 rounded-xl border border-slate-700 bg-black px-4 py-2.5 text-sm text-slate-400 focus:outline-none"
              />
              <button
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/deal-sign/${deal.id}`)}
                className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-bold text-slate-300 hover:border-yellow-400/50 hover:text-yellow-300 transition"
              >
                Copy
              </button>
              <a
                href={`/deal-sign/${deal.id}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-yellow-400/30 px-4 py-2.5 text-sm font-bold text-yellow-300 hover:bg-yellow-400/10 transition"
              >
                Open
              </a>
            </div>
          </section>

        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={saveDeal}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-yellow-400 px-8 py-3 font-black text-slate-950 hover:bg-yellow-300 transition disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving…" : "Save Deal"}
          </button>
        </div>

      </div>
    </div>
  );
}
