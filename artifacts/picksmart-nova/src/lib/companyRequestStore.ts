import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ContractType =
  | "weekly" | "monthly"
  | "1yr" | "2yr" | "3yr" | "5yr" | "10yr";

export interface ContractOption {
  key: ContractType;
  label: string;
  sublabel: string;
  weeklyRate: number;
  totalPrice: number;
  totalLabel: string;
  savings: string | null;
}

export const CONTRACT_OPTIONS: ContractOption[] = [
  { key: "weekly",  label: "Weekly",       sublabel: "Week-to-week, cancel anytime",    weeklyRate: 1660,  totalPrice: 1660,   totalLabel: "$1,660 / week",    savings: null },
  { key: "monthly", label: "Monthly",      sublabel: "Billed each month",              weeklyRate: 1600,  totalPrice: 6400,   totalLabel: "$6,400 / month",   savings: "Save 3%" },
  { key: "1yr",     label: "1-Year",       sublabel: "Annual contract",                weeklyRate: 1327,  totalPrice: 69000,  totalLabel: "$69,000 / year",   savings: "Save 20%" },
  { key: "2yr",     label: "2-Year",       sublabel: "Two-year agreement",             weeklyRate: 1154,  totalPrice: 120000, totalLabel: "$120,000 total",   savings: "Save 30%" },
  { key: "3yr",     label: "3-Year",       sublabel: "Three-year agreement",           weeklyRate: 1058,  totalPrice: 165000, totalLabel: "$165,000 total",   savings: "Save 36%" },
  { key: "5yr",     label: "5-Year",       sublabel: "Five-year agreement",            weeklyRate: 962,   totalPrice: 250000, totalLabel: "$250,000 total",   savings: "Save 42%" },
  { key: "10yr",    label: "10-Year",      sublabel: "Ten-year partnership",           weeklyRate: 865,   totalPrice: 450000, totalLabel: "$450,000 total",   savings: "Save 48%" },
];

export interface RequestPerson {
  name: string;
  email: string;
  profession: string;
}

export interface CompanyRequest {
  id: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contractType: ContractType;
  contractLabel: string;
  weeklyRate: number;
  totalLabel: string;
  submittedAt: string;
  userCount?: number;
  trainers?: RequestPerson[];
  supervisors?: RequestPerson[];
  additionalNotes?: string;
  onboardingComplete: boolean;
  status: "pending_payment" | "pending_onboarding" | "pending_approval" | "approved" | "rejected";
  approvedAt?: string;
  rejectedAt?: string;
  ownerNote?: string;
}

interface CompanyRequestState {
  requests: CompanyRequest[];
  submitCheckout: (data: {
    companyName: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    contractType: ContractType;
  }) => string;
  completeOnboarding: (id: string, data: {
    userCount: number;
    trainers: RequestPerson[];
    supervisors: RequestPerson[];
    additionalNotes: string;
  }) => void;
  approveRequest: (id: string, note?: string) => void;
  rejectRequest: (id: string, note?: string) => void;
}

export const useCompanyRequestStore = create<CompanyRequestState>()(
  persist(
    (set, get) => ({
      requests: [],

      submitCheckout: (data) => {
        const contract = CONTRACT_OPTIONS.find((c) => c.key === data.contractType)!;
        const id = crypto.randomUUID();
        const req: CompanyRequest = {
          id,
          companyName: data.companyName,
          contactName: data.contactName,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone,
          contractType: data.contractType,
          contractLabel: contract.label,
          weeklyRate: contract.weeklyRate,
          totalLabel: contract.totalLabel,
          submittedAt: new Date().toISOString(),
          onboardingComplete: false,
          status: "pending_onboarding",
        };
        set((s) => ({ requests: [req, ...s.requests] }));
        return id;
      },

      completeOnboarding: (id, data) => {
        set((s) => ({
          requests: s.requests.map((r) =>
            r.id === id
              ? {
                  ...r,
                  userCount: data.userCount,
                  trainers: data.trainers,
                  supervisors: data.supervisors,
                  additionalNotes: data.additionalNotes,
                  onboardingComplete: true,
                  status: "pending_approval" as const,
                }
              : r
          ),
        }));
      },

      approveRequest: (id, note) => {
        set((s) => ({
          requests: s.requests.map((r) =>
            r.id === id
              ? { ...r, status: "approved" as const, approvedAt: new Date().toISOString(), ownerNote: note }
              : r
          ),
        }));
      },

      rejectRequest: (id, note) => {
        set((s) => ({
          requests: s.requests.map((r) =>
            r.id === id
              ? { ...r, status: "rejected" as const, rejectedAt: new Date().toISOString(), ownerNote: note }
              : r
          ),
        }));
      },
    }),
    { name: "picksmart-company-requests" }
  )
);
