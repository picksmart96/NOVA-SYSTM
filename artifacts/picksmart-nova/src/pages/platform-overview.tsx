import { useState } from "react";
import { Link } from "wouter";
import {
  Globe, Users, Zap, Shield, BookOpen, Mic, Warehouse,
  ClipboardList, LayoutDashboard, Lock, Smartphone, CreditCard,
  Database, Code2, Key, ChevronDown, ChevronRight, Copy, Check,
  Terminal, Radio, Star, TrendingUp, MapPin, Activity, Briefcase,
  DoorOpen, LogOut, FileText, ArrowLeft,
} from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import { useLocation } from "wouter";

const MASTER_CREDS = {
  username: "draogo96",
  password: "Draogo1996#",
  magic: "/owner-access?token=PSA-DRAOGO96-OWNER-2024",
};

const LIVE_URLS = {
  main: "https://picksmartacademy.net",
  backup: "https://nova-warehouse-control.replit.app",
  trial: "https://picksmartacademy.net/trial",
};

type SectionKey = string;

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };
  return { copied, copy };
}

function CopyBtn({ text, label }: { text: string; label: string }) {
  const { copied, copy } = useCopy();
  return (
    <button
      onClick={() => copy(text, label)}
      className="ml-2 inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-300 hover:border-yellow-400 hover:text-yellow-400 transition"
    >
      {copied === label ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
      {copied === label ? "Copied" : "Copy"}
    </button>
  );
}

function Section({
  id, icon: Icon, title, color, children,
}: {
  id: string; icon: React.ElementType; title: string; color: string; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-800/60 transition"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="h-4 w-4" />
          </div>
          <span className="text-base font-black text-white">{title}</span>
        </div>
        {open ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
      </button>
      {open && <div className="px-6 pb-6 space-y-4">{children}</div>}
    </div>
  );
}

function Row({ label, value, mono, copy }: { label: string; value: string; mono?: boolean; copy?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
      <span className="text-slate-400 text-sm">{label}</span>
      <div className="flex items-center gap-1">
        <span className={`text-sm font-semibold text-white ${mono ? "font-mono tracking-wide" : ""}`}>{value}</span>
        {copy && <CopyBtn text={value} label={label} />}
      </div>
    </div>
  );
}

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border ${color}`}>{text}</span>
  );
}

function PageEntry({ path, title, desc, roles }: { path: string; title: string; desc: string; roles?: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 py-2.5 border-b border-slate-800 last:border-0">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <code className="text-yellow-400 text-xs font-mono bg-yellow-400/5 border border-yellow-400/20 px-1.5 py-0.5 rounded">{path}</code>
          <span className="text-white text-sm font-bold">{title}</span>
        </div>
        <p className="text-slate-400 text-xs leading-relaxed">{desc}</p>
      </div>
      {roles && (
        <span className="text-xs text-slate-500 font-semibold shrink-0 mt-1 sm:mt-0 sm:ml-4">{roles}</span>
      )}
    </div>
  );
}

export default function PlatformOverviewPage() {
  const { currentUser, logout } = useAuthStore();
  const [, navigate] = useLocation();

  const isOwner = currentUser?.role === "owner";
  if (!isOwner) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Lock className="h-12 w-12 text-red-400 mx-auto" />
          <p className="text-white text-xl font-black">Owner Access Only</p>
          <Link href="/login" className="text-yellow-400 text-sm underline">Sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/95 backdrop-blur px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/command">
              <button className="rounded-xl border border-slate-700 bg-slate-900 p-2 hover:border-yellow-400 transition">
                <ArrowLeft className="h-4 w-4" />
              </button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-yellow-400" />
                <span className="text-xs font-bold text-yellow-400 uppercase tracking-widest">Owner Only</span>
              </div>
              <h1 className="text-lg font-black leading-tight">Platform Overview</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 hidden sm:block">PickSmart Academy + NOVA</span>
            <button
              onClick={() => { logout(); navigate("/login"); }}
              className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-red-400 hover:border-red-400/40 transition flex items-center gap-1.5"
            >
              <LogOut className="h-3 w-3" /> Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-5">

        {/* Intro banner */}
        <div className="rounded-2xl border border-yellow-400/20 bg-gradient-to-r from-yellow-400/5 to-transparent p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-yellow-400 flex items-center justify-center shrink-0">
              <Zap className="h-6 w-6 text-slate-950" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white mb-1">PickSmart Academy + NOVA</h2>
              <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">
                Multi-warehouse SaaS training platform with real-time NOVA voice-directed picking (ES3/Jennifer-style),
                role-based navigation, full English/Spanish bilingual support, and a companion Expo mobile app.
                Dark navy + safety yellow industrial design.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {["React + Vite", "Tailwind CSS", "Node.js API", "PostgreSQL", "WebSocket", "Stripe", "Expo Mobile"].map(t => (
                  <Badge key={t} text={t} color="border-slate-600 text-slate-300 bg-slate-800/60" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── LIVE URLS ── */}
        <Section id="urls" icon={Globe} title="Live URLs" color="bg-green-500/15 text-green-400">
          <Row label="Primary Domain" value={LIVE_URLS.main} mono copy />
          <Row label="Backup / Dev URL" value={LIVE_URLS.backup} mono copy />
          <Row label="Trial Signup Link (send to companies)" value={LIVE_URLS.trial} mono copy />
        </Section>

        {/* ── CREDENTIALS ── */}
        <Section id="creds" icon={Key} title="Master Credentials" color="bg-red-500/15 text-red-400">
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 mb-2">
            <p className="text-red-300 text-xs font-bold">🔒 OWNER ONLY — Do not share these credentials</p>
          </div>
          <Row label="Username" value={MASTER_CREDS.username} mono copy />
          <Row label="Password" value={MASTER_CREDS.password} mono copy />
          <Row label="Magic Link (bypass login)" value={MASTER_CREDS.magic} mono copy />
          <Row label="Role" value="owner (isMaster=true)" />
          <Row label="Session" value="JWT · 30-day expiry · signed with SESSION_SECRET" />
          <Row label="Mobile Token Storage" value="AsyncStorage key: nova_token" mono />
        </Section>

        {/* ── ROLES ── */}
        <Section id="roles" icon={Users} title="User Roles" color="bg-blue-500/15 text-blue-400">
          <p className="text-slate-400 text-sm mb-3">Roles are hierarchical — higher roles inherit all lower-role permissions.</p>
          {[
            { role: "selector",   color: "border-blue-500/30 text-blue-300 bg-blue-500/10",    can: "Take training, run NOVA picking sessions, view leaderboard, log pick rate" },
            { role: "trainer",    color: "border-green-500/30 text-green-300 bg-green-500/10", can: "All above + register selectors, activate NOVA, log sessions, build & assign pick assignments" },
            { role: "supervisor", color: "border-orange-500/30 text-orange-300 bg-orange-500/10", can: "All above + shift oversight, weekly reports, shift posts, trainer management, NOVA activation panel" },
            { role: "manager",    color: "border-purple-500/30 text-purple-300 bg-purple-500/10", can: "All above + team performance overview, 7-day pick rate trends, training resource hub" },
            { role: "director",   color: "border-yellow-500/30 text-yellow-300 bg-yellow-500/10", can: "All above + organizational user overview, performance data, mass invite link generator" },
            { role: "owner",      color: "border-red-500/30 text-red-300 bg-red-500/10",      can: "Full access to everything — Command Center, Control Panel, trial signups dashboard, NOVA activity log" },
          ].map(({ role, color, can }) => (
            <div key={role} className="py-2.5 border-b border-slate-800 last:border-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge text={role} color={color} />
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">{can}</p>
            </div>
          ))}
          <div className="mt-2 rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1 text-xs text-slate-400">
            <p><span className="text-white font-bold">Landing pages by role:</span></p>
            <p>owner → <code className="text-yellow-400">/command</code> &nbsp;|&nbsp; trainer → <code className="text-yellow-400">/trainer-portal</code> &nbsp;|&nbsp; supervisor → <code className="text-yellow-400">/supervisor</code> &nbsp;|&nbsp; selector → <code className="text-yellow-400">/selector</code></p>
          </div>
        </Section>

        {/* ── ALL PAGES ── */}
        <Section id="pages" icon={Globe} title="All Pages & Routes" color="bg-slate-500/20 text-slate-300">

          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Public / Marketing</p>
          <PageEntry path="/" title="Home" desc="Landing page, portal cards for logged-in users, trial CTA" />
          <PageEntry path="/pricing" title="Pricing" desc="Plan comparison — Personal, Company, Enterprise" />
          <PageEntry path="/trial" title="Trial Signup" desc="30-day free trial for companies. Auto-assigns trainer role, company plan, isSubscribed=true, trialEndsAt = +30 days" />
          <PageEntry path="/choose-plan" title="Choose Plan" desc="Plan selection before Stripe checkout" />
          <PageEntry path="/checkout-company" title="Company Checkout" desc="Stripe payment for company plan" />
          <PageEntry path="/checkout-personal" title="Personal Checkout" desc="Stripe payment for personal plan" />
          <PageEntry path="/upgrade" title="Upgrade" desc="Upgrade pricing — weekly $1,660 via Stripe; 1yr $69k, 2yr $120k, 3yr $165k, 5yr $250k, 10yr $450k via Contact Sales" />
          <PageEntry path="/download" title="Download" desc="Mobile app download page (Expo / App Store links)" />
          <PageEntry path="/refer" title="Refer" desc="Referral program page" />
          <PageEntry path="/privacy" title="Privacy Policy" desc="Legal privacy policy" />
          <PageEntry path="/terms" title="Terms of Service" desc="Legal terms" />

          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-4 mb-2">Authentication</p>
          <PageEntry path="/login" title="Login" desc="Username + password. JWT-based auth, 30-day session" />
          <PageEntry path="/register" title="Register" desc="New account creation" />
          <PageEntry path="/forgot" title="Forgot Password" desc="Password recovery flow" />
          <PageEntry path="/invite/:token" title="Invite Accept" desc="Accept a trainer or selector invite link" />
          <PageEntry path="/owner-access" title="Owner Magic Link" desc="Token-based login bypass — owner only" roles="Owner" />

          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-4 mb-2">Training</p>
          <PageEntry path="/training" title="Training Modules" desc="6 learning modules — beginner to advanced warehouse picking skills" roles="All" />
          <PageEntry path="/nova-help" title="NOVA Help" desc="AI voice coach with analytics, feedback, and guidance" roles="All" />
          <PageEntry path="/progress" title="My Progress" desc="Personal training progress tracker" roles="All" />
          <PageEntry path="/leaderboard" title="Leaderboard" desc="Pick rate rankings, goal tracking, 7-day trends" roles="All" />
          <PageEntry path="/mistakes" title="Common Mistakes" desc="Mistake library with coaching tips" roles="All" />
          <PageEntry path="/selector-breaking-news" title="Selector Nation" desc="Community news feed for selectors" roles="All" />
          <PageEntry path="/lesson/:id" title="Lesson Session" desc="Active lesson player for training modules" roles="All" />

          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-4 mb-2">NOVA Voice System</p>
          <PageEntry path="/selector" title="NOVA Selector" desc="Live NOVA voice-directed picking session for selectors" roles="Selector+" />
          <PageEntry path="/nova-trainer" title="NOVA Trainer" desc="Trainer-mode NOVA session viewer" roles="Trainer+" />
          <PageEntry path="/nova/warehouse" title="Warehouse Reference" desc="Aisle and zone reference map" roles="Trainer+" />
          <PageEntry path="/nova/assignments/:id" title="Assignment Detail" desc="Stop-by-stop assignment view" roles="Trainer+" />
          <PageEntry path="/nova/voice-commands" title="Voice Commands" desc="Complete list of NOVA voice commands" roles="Trainer+" />
          <PageEntry path="/nova/slots" title="Slot Master" desc="Full slot layout reference table" roles="Trainer+" />

          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-4 mb-2">Staff Portals</p>
          <PageEntry path="/trainer-portal" title="Trainer Portal" desc="Register selectors, activate NOVA, log sessions, build and assign pick assignments, view mistake log and sessions" roles="Trainer+" />
          <PageEntry path="/warehouse-setup" title="Warehouse Setup" desc="Configure warehouse name, aisle/slot counts, pallet limits, door codes, check method (check-digits / scan / none)" roles="Trainer+" />
          <PageEntry path="/assignment-builder" title="Assignment Builder" desc="Build pick assignments with stops, aisles, slots, quantities, door numbers" roles="Trainer+" />
          <PageEntry path="/supervisor" title="Supervisor Dashboard" desc="9 tabs: overview, assignments, NOVA activation, selectors, trainers, people, sessions, shift post, weekly report. Trainer invite generator." roles="Supervisor+" />
          <PageEntry path="/manager" title="Manager Portal" desc="Team roster, 7-day pick rate rankings, training resource links" roles="Manager+" />

          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-4 mb-2">Owner / Command (Private)</p>
          <PageEntry path="/command" title="Command Center" desc="Your private hub — all portal links, quick invite tool, real-time NOVA activity panel (30s refresh), trial signups tracker with email follow-up" roles="Owner" />
          <PageEntry path="/owner" title="Owner Dashboard" desc="Account management, billing status" roles="Owner" />
          <PageEntry path="/control-panel" title="Control Panel" desc="Director-level user overview, performance data, invite link generator" roles="Owner" />
          <PageEntry path="/users-access" title="Users Access" desc="User account management" roles="Owner" />
          <PageEntry path="/platform-overview" title="Platform Overview" desc="This page — full platform documentation" roles="Owner" />

          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-4 mb-2">Sales & Deals</p>
          <PageEntry path="/deal-sign/:id" title="Deal Sign" desc="Custom deal agreement signing page for enterprise clients" />
          <PageEntry path="/deal-detail" title="Deal Detail" desc="Deal summary view" />
        </Section>

        {/* ── NOVA SYSTEM ── */}
        <Section id="nova" icon={Mic} title="NOVA Voice System" color="bg-purple-500/15 text-purple-400">
          <p className="text-slate-400 text-sm">NOVA is the voice-directed picking engine — walks selectors through every pick stop using audio prompts, exactly like a real warehouse ES3/Jennifer system.</p>

          <div className="mt-3 space-y-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Session Flow</p>
            {[
              { step: "1", text: '"Hey NOVA" → wake word activates session' },
              { step: "2", text: "NOVA reads selector's equipment ID for confirmation" },
              { step: "3", text: "Safety check — selector confirms equipment is clear" },
              { step: "4", text: "Load summary — aisles, total cases, pallets, goal time, door number" },
              { step: "5", text: "Setup Alpha + Bravo — pallet positioning instructions" },
              { step: "6", text: "Pick-by-pick: NOVA calls aisle → slot → quantity → check code" },
              { step: "7", text: "Selector confirms each pick verbally or via keypad input" },
              { step: "8", text: "Completion with door/dock delivery instructions" },
            ].map(({ step, text }) => (
              <div key={step} className="flex gap-3 items-start">
                <div className="w-5 h-5 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-purple-300 text-[10px] font-black">{step}</span>
                </div>
                <p className="text-slate-300 text-sm">{text}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Check Method (set in Warehouse Setup)</p>
            {[
              { method: "check-digits", desc: "Selector must say/enter a 2-digit code to confirm each pick. Most common in real warehouses." },
              { method: "scan",         desc: "Barcode scan mode — skips the check code step, auto-advances to next pick" },
              { method: "none",         desc: "No verification — auto-advances immediately after quantity is read" },
            ].map(({ method, desc }) => (
              <div key={method} className="flex gap-3">
                <code className="text-yellow-400 text-xs font-mono shrink-0 mt-0.5 bg-yellow-400/5 border border-yellow-400/20 px-1.5 py-0.5 rounded h-fit">{method}</code>
                <p className="text-slate-400 text-xs">{desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-xl border border-green-500/20 bg-green-500/5 p-4">
            <p className="text-xs font-bold text-green-400 mb-2">Session Tracking</p>
            <p className="text-slate-400 text-xs">Every NOVA session launch fires a <code className="text-yellow-400">nova_trainer_launched</code> event to the database. Visible in your Command Center "NOVA Trainer Sessions" panel. Auto-refreshes every 30 seconds. Stores: selector name, trainer, timestamp, equipment ID.</p>
          </div>

          <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">WebSocket Server</p>
            <p className="text-slate-400 text-xs">Real-time NOVA sessions run over WebSocket at <code className="text-yellow-400">/api/ws/nova-trainer</code>. State machine handles all phases. Both web and mobile app connect to the same server.</p>
            <p className="text-slate-400 text-xs mt-1">Key internal files: <code className="text-slate-300">novaTrainerStateMachine.ts</code> · <code className="text-slate-300">novaRealtimeServer.ts</code></p>
          </div>
        </Section>

        {/* ── ONBOARDING FLOW ── */}
        <Section id="onboarding" icon={Star} title="Trial & Onboarding Flow" color="bg-yellow-500/15 text-yellow-400">
          <div className="flex items-center gap-2 flex-wrap">
            {["/trial", "→", "/warehouse-setup", "→", "/trainer-portal"].map((s, i) => (
              s === "→"
                ? <ChevronRight key={i} className="h-4 w-4 text-slate-600" />
                : <code key={s} className="text-yellow-400 text-sm font-mono bg-yellow-400/5 border border-yellow-400/20 px-2 py-1 rounded">{s}</code>
            ))}
          </div>
          <div className="mt-4 space-y-0">
            <Row label="Trial URL to send companies" value={LIVE_URLS.trial} mono copy />
            <Row label="Trial duration" value="30 days" />
            <Row label="Auto-assigned role" value="trainer" />
            <Row label="Plan" value="company" />
            <Row label="isSubscribed" value="true (full access immediately)" />
            <Row label="trialEndsAt" value="now + 30 days (stored in DB)" />
          </div>
          <p className="text-slate-400 text-xs mt-3">After trial: company sees upgrade prompt. All data is preserved. Stripe checkout converts them to paid.</p>
        </Section>

        {/* ── PRICING ── */}
        <Section id="pricing" icon={CreditCard} title="Pricing & Plans" color="bg-emerald-500/15 text-emerald-400">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Subscription Plans</p>
          {[
            { plan: "Personal",   price: "$29/mo",       stripe: true,  desc: "Individual selector training, progress tracking, NOVA Help" },
            { plan: "Company",    price: "$199/mo",      stripe: true,  desc: "Full platform: trainer portal, NOVA, assignments, all staff roles" },
            { plan: "Enterprise", price: "Contact Sales", stripe: false, desc: "Custom pricing, dedicated support, multi-location" },
          ].map(({ plan, price, stripe, desc }) => (
            <div key={plan} className="py-2.5 border-b border-slate-800 last:border-0 flex items-start justify-between gap-4">
              <div>
                <p className="text-white font-bold text-sm">{plan}</p>
                <p className="text-slate-400 text-xs mt-0.5">{desc}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-yellow-400 font-black text-sm">{price}</p>
                <p className="text-xs text-slate-600 mt-0.5">{stripe ? "Stripe" : "Manual"}</p>
              </div>
            </div>
          ))}

          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-4 mb-2">Upgrade / Upsell Pricing</p>
          {[
            { term: "Weekly",  price: "$1,660",  via: "Stripe" },
            { term: "1 Year",  price: "$69,000", via: "Contact Sales" },
            { term: "2 Years", price: "$120,000",via: "Contact Sales" },
            { term: "3 Years", price: "$165,000",via: "Contact Sales" },
            { term: "5 Years", price: "$250,000",via: "Contact Sales" },
            { term: "10 Years",price: "$450,000",via: "Contact Sales" },
          ].map(({ term, price, via }) => (
            <div key={term} className="flex justify-between items-center py-1.5 border-b border-slate-800/60 last:border-0">
              <span className="text-slate-300 text-sm">{term}</span>
              <div className="text-right">
                <span className="text-white font-black text-sm">{price}</span>
                <span className="text-slate-500 text-xs ml-2">· {via}</span>
              </div>
            </div>
          ))}
        </Section>

        {/* ── MOBILE APP ── */}
        <Section id="mobile" icon={Smartphone} title="Mobile App (Expo / React Native)" color="bg-cyan-500/15 text-cyan-400">
          <p className="text-slate-400 text-sm">Available for Android and iOS via Expo Go. Same credentials as the web app. Connects to the real API server.</p>
          <div className="mt-3 space-y-0">
            <Row label="API Base URL" value="https://nova-warehouse-control.replit.app" mono copy />
            <Row label="Env Variable" value="EXPO_PUBLIC_API_URL" mono />
            <Row label="Auth" value="JWT stored in AsyncStorage as nova_token" mono />
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-4 mb-2">Tabs</p>
          {[
            { tab: "Picking",  desc: "Full NOVA voice-directed picking session over WebSocket. Selector enters NOVA ID, gets guided pick-by-pick. Check codes entered by keypad." },
            { tab: "Trainer",  desc: "Manage selectors, view assignments, send invite emails to new selectors" },
            { tab: "NOVA Help",desc: "AI voice coach — same as web version" },
            { tab: "Training", desc: "Access to all 6 training modules" },
            { tab: "Command",  desc: "Quick links to all web portals" },
            { tab: "Profile",  desc: "Account info, language toggle (EN/ES), sign out" },
          ].map(({ tab, desc }) => (
            <div key={tab} className="py-2 border-b border-slate-800 last:border-0">
              <p className="text-white font-bold text-sm">{tab}</p>
              <p className="text-slate-400 text-xs mt-0.5">{desc}</p>
            </div>
          ))}
        </Section>

        {/* ── BILINGUAL ── */}
        <Section id="i18n" icon={Globe} title="Bilingual Support (EN / ES)" color="bg-indigo-500/15 text-indigo-400">
          <p className="text-slate-400 text-sm">Full English / Spanish toggle throughout the entire platform. Every NOVA voice prompt, UI label, navigation item, training content, and form supports both languages.</p>
          <div className="mt-3 space-y-0">
            <Row label="Toggle location" value="Top navigation bar (all pages)" />
            <Row label="NOVA voice language" value="Switches automatically with user language preference" />
            <Row label="Mobile" value="Language toggle on Profile tab — persists across sessions" />
            <Row label="i18n library" value="react-i18next" mono />
          </div>
        </Section>

        {/* ── TECH STACK ── */}
        <Section id="tech" icon={Code2} title="Tech Stack" color="bg-slate-500/20 text-slate-300">
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { layer: "Frontend",    detail: "React 19 + Vite + TypeScript + Tailwind CSS",  note: "Wouter for routing (NOT react-router-dom)" },
              { layer: "Mobile",      detail: "Expo SDK + React Native",                       note: "6-tab app, Expo Go compatible" },
              { layer: "Backend API", detail: "Node.js + Express",                             note: "Monorepo package: @workspace/api-server" },
              { layer: "Database",    detail: "PostgreSQL via Drizzle ORM",                    note: "Schema in lib/db/src/schema/" },
              { layer: "Real-time",   detail: "WebSocket (ws library)",                        note: "NOVA picking sessions at /api/ws/nova-trainer" },
              { layer: "Auth",        detail: "JWT (jsonwebtoken)",                            note: "30-day expiry, signed with SESSION_SECRET" },
              { layer: "Payments",    detail: "Stripe",                                        note: "Replit integration installed" },
              { layer: "Email",       detail: "Google Mail",                                   note: "Replit integration installed — invite emails" },
              { layer: "Monorepo",    detail: "pnpm workspaces",                               note: "packages: api-server, picksmart-nova, picksmart-nova-mobile, db" },
              { layer: "State",       detail: "Zustand",                                       note: "authStore, trainerStore, warehouseStore, etc." },
            ].map(({ layer, detail, note }) => (
              <div key={layer} className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
                <p className="text-xs font-bold text-yellow-400 uppercase tracking-wide mb-1">{layer}</p>
                <p className="text-white text-sm font-semibold">{detail}</p>
                <p className="text-slate-500 text-xs mt-0.5">{note}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* ── DATABASE ── */}
        <Section id="db" icon={Database} title="Database Schema (Key Tables)" color="bg-orange-500/15 text-orange-400">
          {[
            { table: "users",             desc: "All accounts — id, username, fullName, role, isSubscribed, subscriptionPlan, trialEndsAt, companyName, email, isMaster, jwtToken" },
            { table: "warehouse_profiles", desc: "Per-company warehouse config — checkMethod (check-digits/scan/none), name, aisleCount, slotCount, maxPalletCount, doorCode" },
            { table: "assignments",        desc: "Pick assignments — assignmentNumber, startAisle, endAisle, totalCases, pallets, goalTimeMinutes, doorNumber, doorCode, stops" },
            { table: "assignment_stops",   desc: "Individual stop records — aisle, slot, checkCode, qty, stopOrder, linked to assignment" },
            { table: "selector_sessions",  desc: "Logged NOVA/training sessions — selectorId, trainerId, sessionType, startedAt, completedAt" },
            { table: "metrics",            desc: "Event tracking — userId, eventType (nova_trainer_launched, etc.), metadata JSON, createdAt" },
            { table: "weekly_reports",     desc: "Supervisor weekly reports — warehouseName, week, selectors with cases/hours/rate" },
            { table: "slot_master",        desc: "Slot layout reference — warehouseId, aisle, slot, productName" },
          ].map(({ table, desc }) => (
            <div key={table} className="py-2.5 border-b border-slate-800 last:border-0">
              <code className="text-orange-400 text-xs font-mono bg-orange-500/5 border border-orange-500/20 px-1.5 py-0.5 rounded">{table}</code>
              <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">{desc}</p>
            </div>
          ))}
          <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950 p-3">
            <p className="text-xs text-slate-500"><span className="text-white font-semibold">DB imports:</span> Use <code className="text-yellow-400">from "@workspace/db"</code> · <code className="text-yellow-400">slotMasterTable</code> in warehouse.ts</p>
          </div>
        </Section>

        {/* ── NAVIGATION SECURITY ── */}
        <Section id="nav" icon={Lock} title="Navigation Security" color="bg-red-500/15 text-red-400">
          <p className="text-slate-400 text-sm mb-3">These pages are <strong className="text-white">not</strong> shown in the top navigation bar for any user. They are only accessible from the Command Center (owner) or by direct URL.</p>
          {[
            { page: "Supervisor Dashboard", path: "/supervisor",     note: "Accessible from Command Center" },
            { page: "Manager Portal",        path: "/manager",        note: "Accessible from Command Center" },
            { page: "Control Panel",         path: "/control-panel",  note: "Owner-only route, Command Center only" },
            { page: "Platform Overview",     path: "/platform-overview", note: "Owner-only, this page" },
          ].map(({ page, path, note }) => (
            <div key={path} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
              <div>
                <p className="text-white text-sm font-semibold">{page}</p>
                <p className="text-slate-500 text-xs">{note}</p>
              </div>
              <code className="text-red-400 text-xs font-mono">{path}</code>
            </div>
          ))}
        </Section>

        {/* ── IMPORTANT FILES ── */}
        <Section id="files" icon={Terminal} title="Important Code Files" color="bg-slate-500/20 text-slate-300">
          {[
            { file: "artifacts/api-server/src/lib/novaTrainerStateMachine.ts",  desc: "Core NOVA state machine — all phases, prompts, transitions" },
            { file: "artifacts/api-server/src/lib/novaRealtimeServer.ts",       desc: "WebSocket server — handles connections, routes input to state machine" },
            { file: "artifacts/api-server/src/routes/metrics.ts",               desc: "NOVA session tracking API — nova_trainer_launched events" },
            { file: "artifacts/picksmart-nova/src/pages/command.tsx",           desc: "Command Center — your private owner hub" },
            { file: "artifacts/picksmart-nova/src/pages/trainer-portal.tsx",    desc: "Trainer Portal page" },
            { file: "artifacts/picksmart-nova/src/pages/supervisor.tsx",        desc: "Supervisor Dashboard — 9 tabs" },
            { file: "artifacts/picksmart-nova/src/hooks/useRoleNav.ts",         desc: "Controls which nav links appear per role" },
            { file: "artifacts/picksmart-nova/src/App.tsx",                     desc: "All route definitions and access guards" },
            { file: "artifacts/picksmart-nova/src/lib/authStore.ts",            desc: "Zustand auth store — currentUser, JWT, login/logout" },
            { file: "artifacts/picksmart-nova-mobile/context/AuthContext.tsx",  desc: "Mobile auth context — API login, AsyncStorage JWT" },
            { file: "artifacts/picksmart-nova-mobile/app/(tabs)/picking.tsx",   desc: "Mobile NOVA picking screen" },
            { file: "artifacts/picksmart-nova-mobile/app/(tabs)/trainer.tsx",   desc: "Mobile trainer management screen" },
            { file: "lib/db/src/schema/",                                        desc: "All Drizzle ORM table definitions" },
          ].map(({ file, desc }) => (
            <div key={file} className="py-2.5 border-b border-slate-800 last:border-0">
              <div className="flex items-start gap-2">
                <code className="text-slate-400 text-[11px] font-mono leading-relaxed break-all">{file}</code>
              </div>
              <p className="text-slate-500 text-xs mt-1">{desc}</p>
            </div>
          ))}
        </Section>

        {/* Back to Command */}
        <div className="flex justify-center pb-4">
          <Link href="/command">
            <button className="rounded-2xl border border-yellow-400/30 bg-yellow-400/5 px-8 py-3 font-black text-yellow-400 hover:bg-yellow-400/10 hover:border-yellow-400 transition flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Command Center
            </button>
          </Link>
        </div>

      </div>
    </div>
  );
}
