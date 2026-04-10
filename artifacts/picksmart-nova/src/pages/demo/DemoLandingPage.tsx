import { useLocation } from "wouter";
import { useAuthStore } from "@/lib/authStore";
import { DEMO_STATS, DEMO_ACTIVITY, DEMO_SELECTORS_ONLY } from "@/data/demoWarehouseData";
import {
  Users, Zap, TrendingUp, BookOpen, Mic, Activity,
  BarChart3, ShieldCheck, ChevronRight, FlaskConical,
} from "lucide-react";

export default function DemoLandingPage() {
  const [, navigate] = useLocation();
  const loginAsDemo = useAuthStore((s) => s.loginAsDemo);

  const enter = (role: "selector" | "trainer" | "supervisor", path: string) => {
    loginAsDemo(role);
    navigate(path);
  };

  const activityIcon = (type: string) => {
    if (type === "session")    return <Zap className="h-4 w-4 text-yellow-400" />;
    if (type === "module")     return <BookOpen className="h-4 w-4 text-blue-400" />;
    if (type === "cert")       return <ShieldCheck className="h-4 w-4 text-green-400" />;
    if (type === "improvement") return <TrendingUp className="h-4 w-4 text-emerald-400" />;
    return <Activity className="h-4 w-4 text-slate-400" />;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Top demo notice */}
      <div className="bg-yellow-400 px-4 py-2 text-center text-sm font-bold text-slate-950 flex items-center justify-center gap-2">
        <FlaskConical className="h-4 w-4" />
        Demo Warehouse Preview — sample data for evaluation only
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-10">

        {/* Header */}
        <div className="text-center space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-yellow-400">Live Demo</p>
          <h1 className="text-4xl sm:text-5xl font-black">Demo Distribution Center</h1>
          <p className="mx-auto max-w-2xl text-slate-300 text-lg">
            Explore a realistic ES3 warehouse account — selectors, dashboards, assignments, NOVA tools, and performance data.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          {[
            { label: "Total Users",        value: DEMO_STATS.totalUsers },
            { label: "Active Selectors",   value: DEMO_STATS.activeSelectors },
            { label: "NOVA Active",        value: DEMO_STATS.activeNOVA },
            { label: "Sessions Today",     value: DEMO_STATS.sessionsToday },
            { label: "Pass Rate",          value: `${DEMO_STATS.passRate}%` },
            { label: "Avg Rate",           value: `${DEMO_STATS.avgRate}%` },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-center">
              <p className="text-xs text-slate-500 mb-1">{label}</p>
              <p className="text-2xl font-black text-white">{value}</p>
            </div>
          ))}
        </div>

        {/* Demo cards */}
        <div>
          <h2 className="text-xl font-bold mb-4 text-white">Explore Demo Views</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">

            <DemoCard
              icon={<BookOpen className="h-6 w-6 text-blue-400" />}
              iconBg="bg-blue-400/10 border-blue-400/20"
              title="Training Modules"
              subtitle="Selector view"
              description="See how selectors access 6 training modules, complete lessons, and track their learning progress."
              buttonLabel="View Training"
              onClick={() => enter("selector", "/demo/training")}
            />

            <DemoCard
              icon={<BarChart3 className="h-6 w-6 text-emerald-400" />}
              iconBg="bg-emerald-400/10 border-emerald-400/20"
              title="Leaderboard"
              subtitle="Selector view"
              description="Live picking rates, accuracy scores, and daily streaks for all 10 demo selectors."
              buttonLabel="View Leaderboard"
              onClick={() => enter("selector", "/demo/leaderboard")}
            />

            <DemoCard
              icon={<Mic className="h-6 w-6 text-yellow-400" />}
              iconBg="bg-yellow-400/10 border-yellow-400/20"
              title="NOVA Help AI"
              subtitle="All roles"
              description="Ask NOVA anything about picking, pallets, safety, or ES3. Fully functional voice AI coach."
              buttonLabel="Try NOVA Help"
              onClick={() => enter("selector", "/nova-help")}
            />

            <DemoCard
              icon={<Activity className="h-6 w-6 text-yellow-400" />}
              iconBg="bg-yellow-400/10 border-yellow-400/20"
              title="NOVA Trainer"
              subtitle="Selector view"
              description="Experience the full ES3 voice-directed picking workflow — from equipment sign-on through pallet build."
              buttonLabel="Try NOVA Trainer"
              onClick={() => enter("selector", "/demo/nova-trainer")}
            />

            <DemoCard
              icon={<Users className="h-6 w-6 text-purple-400" />}
              iconBg="bg-purple-400/10 border-purple-400/20"
              title="Trainer Dashboard"
              subtitle="Trainer view"
              description="Manage 10 demo selectors, view assignments, log sessions, and control NOVA activation."
              buttonLabel="View Trainer Dashboard"
              onClick={() => enter("trainer", "/demo/trainer-dashboard")}
            />

            <DemoCard
              icon={<ShieldCheck className="h-6 w-6 text-rose-400" />}
              iconBg="bg-rose-400/10 border-rose-400/20"
              title="Supervisor Dashboard"
              subtitle="Supervisor view"
              description="Company-wide overview: selector performance, trainer management, session audits, and stats."
              buttonLabel="View Supervisor Dashboard"
              onClick={() => enter("supervisor", "/demo/supervisor-dashboard")}
            />
          </div>
        </div>

        {/* Bottom grid: selectors preview + activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Selector preview */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h3 className="text-base font-bold mb-4">Demo Selectors ({DEMO_SELECTORS_ONLY.length})</h3>
            <div className="space-y-2">
              {DEMO_SELECTORS_ONLY.slice(0, 6).map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-xl bg-slate-950 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{s.fullName}</p>
                    <p className="text-xs text-slate-500">{s.novaId} · {s.level}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {s.rate !== null && (
                      <span className="text-sm font-bold text-yellow-400">{s.rate}%</span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      s.novaActive ? "bg-green-500/20 text-green-300" : "bg-slate-700 text-slate-500"
                    }`}>
                      {s.novaActive ? "NOVA On" : "Off"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => enter("trainer", "/demo/trainer-dashboard")}
              className="mt-4 w-full flex items-center justify-center gap-1 rounded-xl border border-slate-700 py-2 text-sm text-slate-400 hover:border-yellow-400 hover:text-yellow-400 transition"
            >
              View all in Trainer Dashboard <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Activity feed */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h3 className="text-base font-bold mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {DEMO_ACTIVITY.map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">{activityIcon(item.type)}</div>
                  <div>
                    <p className="text-sm text-slate-200">{item.text}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA footer */}
        <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/5 p-6 text-center space-y-3">
          <p className="text-lg font-bold text-white">Ready to bring PickSmart NOVA to your warehouse?</p>
          <p className="text-slate-400 text-sm">Company plans include all NOVA tools, trainer dashboards, and supervisor reporting.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-1">
            <a
              href="/pricing"
              className="inline-flex items-center justify-center rounded-xl bg-yellow-400 px-6 py-3 font-bold text-slate-950 hover:bg-yellow-300 transition"
            >
              View Pricing
            </a>
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-950 px-6 py-3 font-semibold text-white hover:border-yellow-400 transition"
            >
              Back to Home
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}

function DemoCard({
  icon, iconBg, title, subtitle, description, buttonLabel, onClick,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  description: string;
  buttonLabel: string;
  onClick: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 flex flex-col gap-4">
      <div className="flex items-start gap-4">
        <div className={`rounded-xl border p-3 ${iconBg}`}>{icon}</div>
        <div>
          <h3 className="font-bold text-white">{title}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>
      </div>
      <p className="text-sm text-slate-300 flex-1">{description}</p>
      <button
        onClick={onClick}
        className="flex items-center justify-center gap-1 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-yellow-300 transition"
      >
        {buttonLabel} <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
