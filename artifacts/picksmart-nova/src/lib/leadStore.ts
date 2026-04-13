import { create } from "zustand";

export type LeadStatus =
  | "new_lead"
  | "contacted"
  | "demo_booked"
  | "trial_live"
  | "proposal_sent"
  | "closed_won"
  | "closed_lost"
  | "active_client";

export interface Lead {
  id: string;
  createdAt: string;
  updatedAt: string;
  companyName: string;
  contactName: string;
  contactRole: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  warehouseType: string;
  status: LeadStatus;
  nextAction: string;
  nextActionDate: string | null;
  notes: string;
  contractValue: string | null;
  weeklyPrice: string | null;
  demoDate: string | null;
  proposalDate: string | null;
  trialStart: string | null;
  trialEnd: string | null;
  contractSigned: string | null;
  renewalDate: string | null;
  signedBy: string | null;
  signedAt: string | null;
}

interface LeadState {
  leads: Lead[];
  loading: boolean;
  fetchLeads: () => Promise<void>;
  addLead: (data: Omit<Lead, "id" | "createdAt" | "updatedAt" | "signedBy" | "signedAt">) => Promise<void>;
  updateLead: (id: string, patch: Partial<Lead>) => Promise<void>;
  updateStatus: (id: string, status: LeadStatus) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
}

export const useLeadStore = create<LeadState>()((set, get) => ({
  leads: [],
  loading: false,

  fetchLeads: async () => {
    set({ loading: true });
    try {
      const res = await fetch("/api/leads");
      if (!res.ok) throw new Error("Failed to fetch leads");
      const leads: Lead[] = await res.json();
      set({ leads, loading: false });
    } catch (err) {
      console.error("fetchLeads error:", err);
      set({ loading: false });
    }
  },

  addLead: async (data) => {
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create lead");
    const lead: Lead = await res.json();
    set((s) => ({ leads: [lead, ...s.leads] }));
  },

  updateLead: async (id, patch) => {
    const res = await fetch(`/api/leads/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error("Failed to update lead");
    const updated: Lead = await res.json();
    set((s) => ({
      leads: s.leads.map((l) => (l.id === id ? updated : l)),
    }));
  },

  updateStatus: async (id, status) => {
    await get().updateLead(id, { status });
  },

  deleteLead: async (id) => {
    await fetch(`/api/leads/${id}`, { method: "DELETE" });
    set((s) => ({ leads: s.leads.filter((l) => l.id !== id) }));
  },
}));

export const STATUS_OPTIONS: { value: LeadStatus; label: string; color: string }[] = [
  { value: "new_lead",       label: "New Lead",       color: "bg-slate-700 text-slate-300" },
  { value: "contacted",      label: "Contacted",      color: "bg-blue-500/20 text-blue-300" },
  { value: "demo_booked",    label: "Demo Booked",    color: "bg-violet-500/20 text-violet-300" },
  { value: "trial_live",     label: "Trial Live",     color: "bg-yellow-400/20 text-yellow-300" },
  { value: "proposal_sent",  label: "Proposal Sent",  color: "bg-orange-500/20 text-orange-300" },
  { value: "closed_won",     label: "Closed Won ✓",  color: "bg-green-500/20 text-green-300" },
  { value: "active_client",  label: "Active Client",  color: "bg-green-400/30 text-green-200" },
  { value: "closed_lost",    label: "Closed Lost",    color: "bg-red-500/20 text-red-300" },
];

export const HANDBOOK_SECTIONS = [
  {
    title: "Walk-In Opening Script",
    body: "Hey, I'll be quick. I built a system that helps selectors move faster, make fewer mistakes, and helps supervisors run shifts better.",
  },
  {
    title: "Pain Question",
    body: "Quick question — what's the biggest issue right now? Slow picks, or mistakes?",
  },
  {
    title: "Demo Close Line",
    body: "This is like giving every selector a trainer in their ear while they work.",
  },
  {
    title: "Free Trial Close",
    body: "I'll set it up for your team free for 30 days. If it improves performance, we keep it. If not, you don't pay.",
  },
  {
    title: "Objection Handling",
    body: "\"We already have a system\" → This improves performance inside it. \"We don't have time\" → It runs during the shift. \"How much is it?\" → After the free trial, full enterprise rollout starts at $1,660 per week on a weekly plan.",
  },
  {
    title: "Pricing Anchor",
    body: "Weekly: $1,660 · Monthly: $6,400 · 1-Year: $69,000 · 2-Year: $120,000 · 3-Year: $165,000. The longer the commitment, the better the rate.",
  },
];
