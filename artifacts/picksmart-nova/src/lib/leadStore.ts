import { create } from "zustand";
import { persist } from "zustand/middleware";

export type LeadStatus =
  | "new_lead"
  | "contacted"
  | "demo_booked"
  | "trial_live"
  | "proposal_sent"
  | "closed_won"
  | "closed_lost";

export interface Lead {
  id: string;
  createdAt: string;
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
  notes: string;
  contractValue: number | null;
}

interface LeadState {
  leads: Lead[];
  addLead: (data: Omit<Lead, "id" | "createdAt">) => void;
  updateStatus: (id: string, status: LeadStatus) => void;
  updateLead: (id: string, patch: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
}

export const useLeadStore = create<LeadState>()(
  persist(
    (set) => ({
      leads: [],

      addLead: (data) => {
        const lead: Lead = {
          id: `lead-${Date.now()}`,
          createdAt: new Date().toISOString(),
          ...data,
        };
        set((s) => ({ leads: [lead, ...s.leads] }));
      },

      updateStatus: (id, status) => {
        set((s) => ({
          leads: s.leads.map((l) => (l.id === id ? { ...l, status } : l)),
        }));
      },

      updateLead: (id, patch) => {
        set((s) => ({
          leads: s.leads.map((l) => (l.id === id ? { ...l, ...patch } : l)),
        }));
      },

      deleteLead: (id) => {
        set((s) => ({ leads: s.leads.filter((l) => l.id !== id) }));
      },
    }),
    { name: "psa-leads" }
  )
);

export const STATUS_OPTIONS: { value: LeadStatus; label: string; color: string }[] = [
  { value: "new_lead",       label: "New Lead",       color: "bg-slate-700 text-slate-300" },
  { value: "contacted",      label: "Contacted",      color: "bg-blue-500/20 text-blue-300" },
  { value: "demo_booked",    label: "Demo Booked",    color: "bg-violet-500/20 text-violet-300" },
  { value: "trial_live",     label: "Trial Live",     color: "bg-yellow-400/20 text-yellow-300" },
  { value: "proposal_sent",  label: "Proposal Sent",  color: "bg-orange-500/20 text-orange-300" },
  { value: "closed_won",     label: "Closed Won",     color: "bg-green-500/20 text-green-300" },
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
