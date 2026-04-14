import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  Zap, TrendingUp, Award, Radio, Flame, ChevronRight, ThumbsUp, Send, X,
  Trophy, Users, Heart, Laugh, Eye, BarChart2, User, Loader2, Star,
  MessageSquare, Globe, Shield, Target, ArrowRight, CheckCircle,
} from "lucide-react";
import { useAuthStore } from "@/lib/authStore";

const API = import.meta.env.BASE_URL + "api";

// ── Shared helpers ────────────────────────────────────────────────────────────

const AVATARS = [
  "bg-yellow-400 text-slate-950",
  "bg-blue-500 text-white",
  "bg-green-500 text-white",
  "bg-purple-500 text-white",
  "bg-red-500 text-white",
  "bg-orange-400 text-slate-950",
];
function avatarColor(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return AVATARS[Math.abs(h) % AVATARS.length];
}
function initials(name: string) {
  return name.split(" ").map(p => p[0]).join("").toUpperCase().slice(0, 2);
}
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
const COUNTRIES = ["🇺🇸 USA", "🇨🇦 Canada", "🇬🇧 UK", "🇲🇽 Mexico", "🇧🇷 Brazil"];
const MEDALS = ["🥇", "🥈", "🥉"];

// ── Live Ticker ───────────────────────────────────────────────────────────────

const TICKER_ITEMS = [
  "🔥 Elite Selectors running 112%+ across Warehouse A & B",
  "📦 New post: Route planning technique adds 3–4 sec per aisle",
  "⚡ Top 10 leaderboard updated — see who's #1 this week",
  "🏆 Accuracy Masters hitting 99.8% — check codes are everything",
  "🌎 Selector Nation expanding — join the global network",
];

function LiveTicker() {
  return (
    <div className="bg-yellow-400 text-slate-950 flex items-center overflow-hidden h-9 select-none">
      <div className="flex items-center gap-2 px-4 bg-red-600 h-full shrink-0">
        <Radio className="h-3.5 w-3.5 text-white animate-pulse" />
        <span className="text-white text-xs font-black uppercase tracking-widest">Live</span>
      </div>
      <div className="overflow-hidden flex-1">
        <div className="flex animate-[ticker_35s_linear_infinite] whitespace-nowrap">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="text-slate-950 text-xs font-bold px-8">{item}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC LANDING PAGE
// ═══════════════════════════════════════════════════════════════════════════════

function PublicLanding() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [weeklyReports, setWeeklyReports] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API}/social/leaderboard?period=weekly&limit=3`)
      .then(r => r.json()).then(d => setLeaderboard(d.leaderboard || [])).catch(() => {});
    fetch(`${API}/social/weekly-reports?limit=3&published=true`)
      .then(r => r.json()).then(d => setWeeklyReports(d.reports || [])).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* ── Hero ── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/15 via-slate-900 to-slate-950" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-yellow-400/5 to-transparent" />
        <div className="relative max-w-6xl mx-auto px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-400/20 border border-yellow-400/40 mb-6">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-yellow-400 text-xs font-black uppercase tracking-widest">The Global Selector Network</span>
          </div>
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black leading-none mb-4">
            Selector<br /><span className="text-yellow-400">Nation</span>
          </h1>
          <p className="text-slate-300 text-xl max-w-2xl mx-auto leading-relaxed mb-4">
            Built for selectors. Powered by performance.
          </p>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed mb-10">
            The first global network where warehouse workers train, compete, and get recognized.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/pricing" className="px-8 py-4 rounded-2xl bg-yellow-400 text-slate-950 font-black text-base hover:bg-yellow-300 transition flex items-center gap-2">
              Start Your Free Trial <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/meet-nova" className="px-8 py-4 rounded-2xl border border-slate-600 text-white font-black text-base hover:border-yellow-400 hover:text-yellow-400 transition flex items-center gap-2">
              Watch How It Works
            </Link>
          </div>

          {/* Stat row */}
          <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { icon: "🔥", num: "10,000+", label: "Selectors Connected" },
              { icon: "📦", num: "Millions", label: "Cases Picked" },
              { icon: "🎯", num: "99%", label: "Accuracy System" },
              { icon: "🌎", num: "U.S. + Global", label: "Active & Expanding" },
            ].map(s => (
              <div key={s.label} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-center">
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="text-yellow-400 font-black text-lg">{s.num}</div>
                <div className="text-slate-400 text-xs font-bold mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── What is Selector Nation ── */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <p className="text-yellow-400 text-xs font-black uppercase tracking-widest mb-3">The Platform</p>
          <h2 className="text-4xl font-black text-white">More than a tool.</h2>
          <p className="text-slate-400 text-lg mt-4 max-w-2xl mx-auto">It's where selectors improve, teams compete, and top performers get recognized — worldwide.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: <TrendingUp className="h-6 w-6" />, title: "Performance Tracking", desc: "Log every shift. Track your rate, accuracy, and cases picked over time." },
            { icon: <Trophy className="h-6 w-6" />, title: "Warehouse Competition", desc: "Warehouse A vs B. Weekly leaderboards. Top performers get recognized." },
            { icon: <Shield className="h-6 w-6" />, title: "NOVA AI Training", desc: "Train during real shifts with real-time voice coaching from NOVA." },
            { icon: <Globe className="h-6 w-6" />, title: "Global Recognition", desc: "Get ranked globally. Earn badges. Claim Gold Status monthly." },
          ].map(f => (
            <div key={f.title} className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <div className="w-11 h-11 rounded-xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center text-yellow-400 mb-4">
                {f.icon}
              </div>
              <h3 className="font-black text-white text-base mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── NOVA Section ── */}
      <div className="border-y border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950">
        <div className="max-w-6xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-yellow-400 text-xs font-black uppercase tracking-widest mb-4">Your AI Voice Trainer</p>
            <h2 className="text-4xl font-black text-white mb-4">Meet NOVA</h2>
            <p className="text-slate-300 text-lg leading-relaxed mb-2">
              This isn't training <em>after</em> work. This is training <strong className="text-white">while</strong> you work.
            </p>
            <p className="text-slate-400 leading-relaxed mb-8">
              NOVA works during real shifts — calling pick locations, confirming check codes, catching mistakes before they happen, and coaching on the fly.
            </p>
            <div className="space-y-3 mb-8">
              {[
                "Real-time voice coaching during picks",
                "Mistake prevention & check code confirmation",
                "Performance tracking per shift",
                "Supervisor control & override",
              ].map(f => (
                <div key={f} className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 shrink-0" />
                  <span className="text-slate-300 font-medium">{f}</span>
                </div>
              ))}
            </div>
            <Link href="/meet-nova" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-yellow-400 text-slate-950 font-black text-sm hover:bg-yellow-300 transition">
              Talk to NOVA Now <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="rounded-3xl border border-yellow-400/20 bg-slate-900 p-8 space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center">
                <Zap className="h-5 w-5 text-slate-950" />
              </div>
              <div>
                <p className="font-black text-white">NOVA</p>
                <p className="text-green-400 text-xs font-bold">● Live during shift</p>
              </div>
            </div>
            {[
              { speaker: "NOVA", msg: "Aisle 7, slot B-14. Pick 3 cases of code 2847." },
              { speaker: "Selector", msg: "2847 confirmed." },
              { speaker: "NOVA", msg: "Confirmed. Moving to aisle 9. You're running 108% — great pace." },
              { speaker: "NOVA", msg: "Pallet weight at 85%. Layer change recommended on next pick." },
            ].map((line, i) => (
              <div key={i} className={`flex gap-3 ${line.speaker === "Selector" ? "flex-row-reverse" : ""}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${line.speaker === "NOVA" ? "bg-yellow-400 text-slate-950" : "bg-slate-700 text-white"}`}>
                  {line.speaker === "NOVA" ? "N" : "S"}
                </div>
                <div className={`rounded-2xl px-4 py-2.5 max-w-xs text-sm ${line.speaker === "NOVA" ? "bg-slate-800 text-slate-200" : "bg-yellow-400/20 border border-yellow-400/30 text-yellow-300"}`}>
                  {line.msg}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Live Leaderboard ── */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <p className="text-yellow-400 text-xs font-black uppercase tracking-widest mb-3">Global Rankings</p>
          <h2 className="text-4xl font-black text-white">Top Selectors Worldwide</h2>
          <p className="text-slate-400 text-lg mt-4">See how your team ranks against selectors from coast to coast.</p>
        </div>

        {leaderboard.length === 0 ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-10 text-center max-w-2xl mx-auto">
            <div className="space-y-3">
              {[
                { name: "Marcus Hill", rate: "112%", badge: "🔥 Elite Selector", country: "🇺🇸 Pennsylvania" },
                { name: "Tasha Green", rate: "108%", badge: "💪 Top Performer", country: "🇺🇸 Texas" },
                { name: "Andre Lewis", rate: "105%", badge: "💪 Top Performer", country: "🇨🇦 Ontario" },
              ].map((s, i) => (
                <div key={i} className={`flex items-center gap-4 p-4 rounded-2xl border ${i === 0 ? "border-yellow-400/40 bg-yellow-400/5" : "border-slate-700 bg-slate-800/50"}`}>
                  <span className="text-2xl">{MEDALS[i]}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-white">{s.name}</span>
                      <span className="px-2 py-0.5 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 text-xs font-bold">{s.badge}</span>
                    </div>
                    <span className="text-slate-500 text-xs">{s.country}</span>
                  </div>
                  <span className={`text-2xl font-black ${i === 0 ? "text-yellow-400" : "text-green-400"}`}>{s.rate}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3 max-w-2xl mx-auto">
            {leaderboard.map((entry, i) => {
              const name = entry.profile?.fullName || "Selector";
              return (
                <div key={entry.userId} className={`flex items-center gap-4 p-4 rounded-2xl border ${i === 0 ? "border-yellow-400/40 bg-yellow-400/5" : "border-slate-700 bg-slate-800/50"}`}>
                  <span className="text-2xl">{MEDALS[i] || `#${i + 1}`}</span>
                  <div className={`w-11 h-11 rounded-full font-black flex items-center justify-center text-sm shrink-0 ${avatarColor(name)}`}>{initials(name)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-white">{name}</span>
                      {entry.badge && <span className="px-2 py-0.5 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 text-xs font-bold">{entry.badge}</span>}
                    </div>
                    <span className="text-slate-500 text-xs">{entry.profile?.country || "🇺🇸 USA"}</span>
                  </div>
                  <span className={`text-2xl font-black ${Number(entry.avgRate) >= 110 ? "text-yellow-400" : "text-green-400"}`}>{entry.avgRate}%</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="text-center mt-8">
          <p className="text-slate-400 text-sm mb-4">See how your team ranks. Log your performance and compete globally.</p>
        </div>
      </div>

      {/* ── Weekly Reports Preview ── */}
      {weeklyReports.length > 0 && (
        <div className="border-t border-slate-800 bg-slate-900/50">
          <div className="max-w-6xl mx-auto px-6 py-16">
            <div className="text-center mb-10">
              <p className="text-yellow-400 text-xs font-black uppercase tracking-widest mb-3">Supervisor Reports</p>
              <h2 className="text-3xl font-black text-white">Weekly Top 5</h2>
              <p className="text-slate-400 mt-2">Supervisors showcase their team's best performers each week.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {weeklyReports.slice(0, 3).map((report: any) => {
                const location = [report.warehouse_state, report.warehouse_country].filter(Boolean).join(", ");
                return (
                  <div key={report.id} className="rounded-2xl border border-yellow-400/20 bg-slate-900 p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-black text-white leading-tight">{report.warehouse_name}</p>
                        {location && <p className="text-slate-400 text-xs mt-0.5">📍 {location}</p>}
                        <p className="text-slate-500 text-xs mt-0.5">Week of {report.week}</p>
                      </div>
                      <Trophy className="h-5 w-5 text-yellow-400 shrink-0 ml-2" />
                    </div>
                    <div className="space-y-2">
                      {(report.top_selectors || []).filter((s: any) => s?.selector_name).slice(0, 5).map((s: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <span className="text-base">{MEDALS[i] || `${i + 1}.`}</span>
                          <span className="font-bold text-white flex-1 truncate">{s.selector_name}</span>
                          <span className="text-slate-400 text-xs shrink-0">{s.cases_picked?.toLocaleString()} cases</span>
                          <span className="text-yellow-400 font-black text-xs shrink-0">{s.rate}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Community Section ── */}
      <div className="border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-yellow-400 text-xs font-black uppercase tracking-widest mb-4">Community</p>
            <h2 className="text-4xl font-black text-white mb-4">Connect with selectors across the country.</h2>
            <p className="text-slate-400 leading-relaxed mb-6">
              Share tips. Learn faster. Compete globally. From Pennsylvania to Texas to worldwide.
            </p>
            <div className="space-y-3 mb-8">
              {[
                "Post wins, tips, and stories from the floor",
                "React and comment on other selectors' posts",
                "Follow top performers and learn from them",
                "Earn badges: 🔥 Elite · 💪 Top Performer · 🎯 Accuracy Master",
              ].map(f => (
                <div key={f} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-yellow-400 shrink-0" />
                  <span className="text-slate-300 text-sm font-medium">{f}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {[
              { name: "Marcus T.", badge: "🔥 Elite Selector", time: "2h ago", text: "Hit 114% today with the route planning technique from Module 4. Dead-end aisle trick saves 3–4 seconds per pass." },
              { name: "Aaliyah J.", badge: "Rising Star", time: "Yesterday", text: "Week 2 selector here. Went from 67% to 82% this week. Something is clicking. Keep going newbies! 💛" },
              { name: "Carlos M.", badge: "100+ Club", time: "2d ago", text: "PSA: Don't skip the check codes. Getting it right the first time is always faster than retrying." },
            ].map((post, i) => (
              <div key={i} className={`rounded-2xl border p-4 ${i === 0 ? "border-yellow-400/30 bg-yellow-400/5" : "border-slate-800 bg-slate-900"}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-full font-black flex items-center justify-center text-xs shrink-0 ${avatarColor(post.name)}`}>{initials(post.name)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-black text-white text-sm">{post.name}</span>
                      <span className="px-2 py-0.5 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-300 text-xs font-bold">{post.badge}</span>
                      <span className="text-slate-600 text-xs">{post.time}</span>
                    </div>
                    <p className="text-slate-300 text-sm leading-snug">{post.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Supervisor Dashboard ── */}
      <div className="border-t border-slate-800 bg-gradient-to-br from-yellow-400/5 to-slate-950">
        <div className="max-w-6xl mx-auto px-6 py-20 text-center">
          <p className="text-yellow-400 text-xs font-black uppercase tracking-widest mb-4">For Supervisors</p>
          <h2 className="text-4xl font-black text-white mb-4">Supervisor Dashboard</h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-4">Track your team. Improve performance. Control your shift.</p>
          <p className="text-slate-400 max-w-2xl mx-auto mb-10">
            Report your weekly Top 5 selectors and showcase your team on the global platform.
          </p>
          <div className="grid sm:grid-cols-3 gap-5 max-w-3xl mx-auto mb-10">
            {[
              { icon: <BarChart2 className="h-6 w-6" />, title: "Real-Time Tracking", desc: "Monitor rate, accuracy, and cases picked per selector per shift." },
              { icon: <Target className="h-6 w-6" />, title: "Weekly Reports", desc: "Submit your Top 5 performers and get them ranked globally." },
              { icon: <Shield className="h-6 w-6" />, title: "NOVA Control", desc: "Override, adjust, and coach selectors directly through NOVA." },
            ].map(f => (
              <div key={f.title} className="rounded-2xl border border-slate-700 bg-slate-900 p-5 text-left">
                <div className="w-11 h-11 rounded-xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center text-yellow-400 mb-3">{f.icon}</div>
                <h4 className="font-black text-white mb-1">{f.title}</h4>
                <p className="text-slate-400 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Gold Status ── */}
      <div className="border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <div className="text-4xl mb-4">🥇</div>
            <h2 className="text-4xl font-black text-white mb-4">Monthly Gold Status</h2>
            <p className="text-slate-400 text-lg">Achieve Gold Status by sustaining elite performance for an entire month.</p>
          </div>
          <div className="max-w-lg mx-auto rounded-3xl border border-yellow-400/30 bg-gradient-to-br from-yellow-400/10 to-slate-900 p-8 text-center">
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { icon: "📈", req: "100%+", label: "Rate" },
                { icon: "🎯", req: "95%+", label: "Accuracy" },
                { icon: "⏱️", req: "80+ hrs", label: "Hours Worked" },
              ].map(r => (
                <div key={r.label} className="bg-slate-900/60 rounded-2xl p-4">
                  <div className="text-2xl mb-1">{r.icon}</div>
                  <div className="text-yellow-400 font-black text-lg">{r.req}</div>
                  <div className="text-slate-400 text-xs font-bold">{r.label}</div>
                </div>
              ))}
            </div>
            <p className="text-slate-300 text-sm mb-6">Companies reward Gold achievers with bonuses, gift cards, and recognition on the global platform.</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {["🔥 Elite Selector", "🏆 3x Weekly Leader", "🥇 Gold Status — March", "🌍 Top 2% Global"].map(b => (
                <span key={b} className="px-3 py-1.5 rounded-full bg-yellow-400/15 border border-yellow-400/30 text-yellow-300 text-xs font-bold">{b}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Referral ── */}
      <div className="border-t border-slate-800 bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-6 py-16 text-center">
          <div className="text-3xl mb-4">👥</div>
          <h2 className="text-3xl font-black text-white mb-4">Invite & Earn</h2>
          <p className="text-slate-400 max-w-xl mx-auto mb-6">Share your referral link. When selectors you invite join, you earn rewards and badges.</p>
          <div className="flex flex-wrap gap-3 justify-center mb-8">
            {[
              { badge: "👥 Recruiter", req: "5 invites" },
              { badge: "🔥 Team Builder", req: "10 invites" },
              { badge: "👑 Network Leader", req: "25 invites" },
            ].map(b => (
              <div key={b.badge} className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-3 text-center">
                <p className="font-black text-white text-sm">{b.badge}</p>
                <p className="text-slate-500 text-xs mt-0.5">{b.req}</p>
              </div>
            ))}
          </div>
          <Link href="/pricing" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl border border-slate-600 text-white font-black hover:border-yellow-400 hover:text-yellow-400 transition text-sm">
            Join to Get Your Code <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-6 py-24 text-center">
          <h2 className="text-5xl font-black text-white mb-4">Start your 30-day free trial.</h2>
          <p className="text-slate-400 text-xl mb-10">See real performance improvement in your warehouse.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/pricing" className="px-8 py-4 rounded-2xl bg-yellow-400 text-slate-950 font-black text-base hover:bg-yellow-300 transition flex items-center gap-2">
              Start Now — Free 30 Days <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/meet-nova" className="px-8 py-4 rounded-2xl border border-slate-600 text-white font-black text-base hover:border-yellow-400 hover:text-yellow-400 transition">
              Talk to NOVA
            </Link>
          </div>
          <p className="text-slate-600 text-sm mt-6">No credit card required. Cancel anytime.</p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMMUNITY FEED (logged-in)
// ═══════════════════════════════════════════════════════════════════════════════

interface Post {
  id: string; content: string; authorUserId: string; status: string;
  likeCount: number; loveCount: number; funnyCount: number; wowCount: number;
  isPinned: boolean; hashtags: string[]; createdAt: string;
  profile?: { fullName: string; novaId?: string; country?: string; performanceBadge?: string; levelBadge?: string; isOnline?: boolean };
}
interface LeaderEntry {
  rank: number; userId: string; avgRate: number; totalCases: number;
  avgAccuracy: number; warehouseId: string; badge: string;
  profile?: { fullName: string; novaId?: string; country?: string };
}

function PostCard({ post, currentEmail, onReacted }: { post: Post; currentEmail: string; onReacted: () => void }) {
  const [reacted, setReacted] = useState<string | null>(null);
  const [counts, setCounts] = useState({ like: post.likeCount, love: post.loveCount, funny: post.funnyCount, wow: post.wowCount });
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);

  const name = post.profile?.fullName || "Anonymous";
  const badge = post.profile?.performanceBadge || post.profile?.levelBadge || null;

  async function react(type: string) {
    if (!currentEmail) return;
    const prev = reacted;
    setReacted(r => r === type ? null : type);
    if (prev === type) setCounts(c => ({ ...c, [type]: Math.max(0, c[type as keyof typeof c] - 1) }));
    else {
      if (prev) setCounts(c => ({ ...c, [prev]: Math.max(0, c[prev as keyof typeof c] - 1) }));
      setCounts(c => ({ ...c, [type]: c[type as keyof typeof c] + 1 }));
    }
    await fetch(`${API}/social/posts/${post.id}/react`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reactionType: type, email: currentEmail }),
    }).catch(() => {});
  }

  async function loadComments() {
    if (loadingComments) return;
    setLoadingComments(true);
    const r = await fetch(`${API}/social/posts/${post.id}/comments`).catch(() => null);
    if (r?.ok) { const d = await r.json(); setComments(d.comments || []); }
    setLoadingComments(false);
  }

  async function submitComment() {
    if (!commentText.trim() || !currentEmail) return;
    await fetch(`${API}/social/posts/${post.id}/comments`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: commentText, email: currentEmail }),
    });
    setCommentText(""); loadComments();
  }

  useEffect(() => { if (showComments) loadComments(); }, [showComments]);

  const REACTIONS = [
    { type: "like", icon: <ThumbsUp className="h-4 w-4" />, count: counts.like },
    { type: "love", icon: <Heart className="h-4 w-4" />, count: counts.love },
    { type: "funny", icon: <Laugh className="h-4 w-4" />, count: counts.funny },
    { type: "wow", icon: <Eye className="h-4 w-4" />, count: counts.wow },
  ];

  return (
    <div className={`rounded-2xl border bg-slate-900 p-5 ${post.isPinned ? "border-yellow-400/50" : "border-slate-800"}`}>
      {post.isPinned && <div className="flex items-center gap-1.5 mb-3"><Star className="h-3.5 w-3.5 text-yellow-400" /><span className="text-yellow-400 text-xs font-black uppercase tracking-widest">Pinned</span></div>}
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-11 h-11 rounded-full font-black flex items-center justify-center text-sm shrink-0 ${avatarColor(name)}`}>{initials(name)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-black text-white text-sm">{name}</span>
            {post.profile?.novaId && <span className="text-slate-500 text-xs font-mono">{post.profile.novaId}</span>}
            {badge && <span className="px-2 py-0.5 rounded-full bg-yellow-400/15 border border-yellow-400/40 text-yellow-300 text-xs font-bold">{badge}</span>}
            {post.profile?.isOnline && <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />}
          </div>
          <span className="text-slate-500 text-xs">{timeAgo(post.createdAt)}</span>
        </div>
      </div>
      <p className="text-slate-100 leading-relaxed text-sm font-medium">{post.content}</p>
      {post.hashtags?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">{post.hashtags.map(h => <span key={h} className="text-yellow-400 text-xs font-bold">{h}</span>)}</div>
      )}
      <div className="mt-4 pt-4 border-t border-slate-800 flex items-center gap-3 flex-wrap">
        {REACTIONS.map(r => (
          <button key={r.type} onClick={() => react(r.type)} className={`flex items-center gap-1.5 text-sm font-bold transition ${reacted === r.type ? "text-yellow-400" : "text-slate-500 hover:text-yellow-400"}`}>
            {r.icon} {r.count > 0 && <span>{r.count}</span>}
          </button>
        ))}
        <button onClick={() => setShowComments(v => !v)} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-sm font-bold transition ml-auto">
          <MessageSquare className="h-4 w-4" /> {showComments ? "Hide" : "Comments"}
        </button>
      </div>
      {showComments && (
        <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
          {loadingComments ? <div className="flex justify-center py-3"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
          : comments.length === 0 ? <p className="text-slate-500 text-sm text-center">No comments yet.</p>
          : comments.map(c => (
            <div key={c.id} className="flex gap-2.5">
              <div className={`w-8 h-8 rounded-full font-black flex items-center justify-center text-xs shrink-0 ${avatarColor(c.profile?.fullName || "A")}`}>{initials(c.profile?.fullName || "A")}</div>
              <div className="flex-1 bg-slate-800 rounded-xl px-3 py-2">
                <span className="text-white text-xs font-black">{c.profile?.fullName || "Anonymous"}</span>
                <p className="text-slate-300 text-xs mt-0.5">{c.content}</p>
              </div>
            </div>
          ))}
          {currentEmail && (
            <div className="flex gap-2 mt-2">
              <input value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => e.key === "Enter" && submitComment()} placeholder="Add a comment…"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400" />
              <button onClick={submitComment} className="px-3 py-2 rounded-xl bg-yellow-400 text-slate-950 font-black hover:bg-yellow-300 transition"><Send className="h-4 w-4" /></button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CreatePostModal({ onClose, onPosted, currentUser }: { onClose: () => void; onPosted: () => void; currentUser: any }) {
  const [content, setContent] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [displayName, setDisplayName] = useState(currentUser?.fullName || "");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    if (!content.trim() || !displayName.trim()) return;
    setSubmitting(true);
    const email = currentUser?.email || `${displayName.toLowerCase().replace(/\s+/g, ".")}@selector.nation`;
    const tags = hashtags.split(/[\s,]+/).filter(Boolean).map(h => h.startsWith("#") ? h : `#${h}`);
    await fetch(`${API}/social/posts`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, email, fullName: displayName, username: displayName.toLowerCase().replace(/\s+/g, "_"), hashtags: tags }),
    });
    setSubmitting(false); setDone(true);
    setTimeout(() => { onPosted(); onClose(); }, 1500);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-black text-white text-lg">Post to Selector Nation</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        {done ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-yellow-400 font-black text-lg">Post submitted for review!</p>
            <p className="text-slate-400 text-sm mt-1">The owner will approve it shortly.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1.5">Your Name</label>
              <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Marcus Hill"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400" />
            </div>
            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1.5">Your Story / Win / Tip</label>
              <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Share your rate, a tip, or something the community needs to hear…" rows={4}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400 resize-none" />
            </div>
            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1.5">Hashtags</label>
              <input value={hashtags} onChange={e => setHashtags(e.target.value)} placeholder="#rate #pallet #checkcode"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400" />
            </div>
            <p className="text-slate-500 text-xs bg-slate-800 rounded-xl p-3 border border-slate-700">📋 Posts go to a pending queue and are reviewed before appearing in the feed.</p>
            <button onClick={submit} disabled={submitting || !content.trim() || !displayName.trim()}
              className="w-full py-3.5 rounded-xl bg-yellow-400 text-slate-950 font-black text-sm hover:bg-yellow-300 transition disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Submitting…" : "Submit Post for Review"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function LeaderboardTab() {
  const [period, setPeriod] = useState<"daily" | "weekly" | "global">("weekly");
  const [board, setBoard] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [wh, setWh] = useState<"all" | "A" | "B">("all");

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/social/leaderboard?period=${period}&limit=15`)
      .then(r => r.json()).then(d => { setBoard(d.leaderboard || []); setLoading(false); }).catch(() => setLoading(false));
  }, [period]);

  const filtered = wh === "all" ? board : board.filter(e => e.warehouseId === wh);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2">
          {(["daily", "weekly", "global"] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-2 rounded-xl text-sm font-black capitalize transition ${period === p ? "bg-yellow-400 text-slate-950" : "bg-slate-800 text-slate-400 hover:text-white border border-slate-700"}`}>{p}</button>
          ))}
        </div>
        <div className="flex gap-2">
          {(["all", "A", "B"] as const).map(w => (
            <button key={w} onClick={() => setWh(w)} className={`px-3 py-2 rounded-xl text-sm font-bold transition ${wh === w ? "bg-slate-700 text-white" : "bg-slate-800/50 text-slate-500 hover:text-white"}`}>
              {w === "all" ? "All Warehouses" : `Wh ${w}`}
            </button>
          ))}
        </div>
      </div>
      {loading ? <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-yellow-400" /></div>
      : filtered.length === 0 ? (
        <div className="text-center py-16"><Trophy className="h-12 w-12 text-slate-600 mx-auto mb-4" /><p className="text-slate-400 font-bold">No performance data yet.</p></div>
      ) : (
        <div className="space-y-2">
          {filtered.map((entry, i) => {
            const name = entry.profile?.fullName || "Unknown";
            return (
              <div key={entry.userId} className={`flex items-center gap-4 p-4 rounded-2xl border ${i === 0 ? "border-yellow-400/50 bg-yellow-400/5" : "border-slate-800 bg-slate-900/50"}`}>
                <div className="text-2xl w-8 text-center font-black">{MEDALS[i] || `#${entry.rank}`}</div>
                <div className={`w-11 h-11 rounded-full font-black flex items-center justify-center text-sm shrink-0 ${avatarColor(name)}`}>{initials(name)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-white text-sm">{name}</span>
                    {entry.profile?.novaId && <span className="text-slate-500 text-xs font-mono">{entry.profile.novaId}</span>}
                    {entry.badge && <span className="px-2 py-0.5 rounded-full bg-yellow-400/15 border border-yellow-400/40 text-yellow-300 text-xs font-bold">{entry.badge}</span>}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                    <span>{entry.profile?.country || "🇺🇸 USA"}</span>
                    <span>Wh {entry.warehouseId}</span>
                    <span>{Number(entry.totalCases).toLocaleString()} cases</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className={`text-2xl font-black ${Number(entry.avgRate) >= 110 ? "text-yellow-400" : Number(entry.avgRate) >= 100 ? "text-green-400" : "text-slate-300"}`}>{entry.avgRate}%</div>
                  <div className="text-slate-500 text-xs">avg rate</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ProfileTab({ currentUser }: { currentUser: any }) {
  const [logRate, setLogRate] = useState("");
  const [logCases, setLogCases] = useState("");
  const [logWh, setLogWh] = useState("A");
  const [logging, setLogging] = useState(false);
  const [logMsg, setLogMsg] = useState("");

  async function logPerformance() {
    if (!logRate || !currentUser?.email) return;
    setLogging(true);
    const r = await fetch(`${API}/social/performance`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: currentUser.email, fullName: currentUser.fullName || "Selector", rate: parseFloat(logRate), casesPicked: parseInt(logCases) || 0, warehouseId: logWh }),
    });
    const d = await r.json().catch(() => ({}));
    setLogging(false);
    setLogMsg(d.badge ? `Logged! Badge: ${d.badge}` : "Performance logged!");
    setLogRate(""); setLogCases("");
    setTimeout(() => setLogMsg(""), 4000);
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="rounded-2xl border border-yellow-400/30 bg-gradient-to-br from-yellow-400/10 to-slate-900 p-5">
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-14 h-14 rounded-full font-black flex items-center justify-center text-lg ${avatarColor(currentUser?.fullName || "S")}`}>{initials(currentUser?.fullName || "S?")}</div>
          <div>
            <p className="font-black text-white text-base">{currentUser?.fullName || "Your Profile"}</p>
            <p className="text-slate-400 text-xs">{currentUser?.email}</p>
            <p className="text-slate-500 text-xs font-mono mt-0.5">NOVA ID assigned on first post</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><BarChart2 className="h-4 w-4 text-yellow-400" /> Log My Performance</h4>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Rate (%)</label>
              <input value={logRate} onChange={e => setLogRate(e.target.value)} placeholder="e.g. 112" type="number"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400" />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Cases Picked</label>
              <input value={logCases} onChange={e => setLogCases(e.target.value)} placeholder="e.g. 1200" type="number"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400" />
            </div>
          </div>
          <select value={logWh} onChange={e => setLogWh(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400">
            <option value="A">Warehouse A</option>
            <option value="B">Warehouse B</option>
          </select>
          <button onClick={logPerformance} disabled={logging || !logRate} className="w-full py-2.5 rounded-xl bg-yellow-400 text-slate-950 font-black text-sm hover:bg-yellow-300 transition disabled:opacity-50">
            {logging ? "Logging…" : "Log Performance"}
          </button>
          {logMsg && <p className="text-green-400 text-sm font-bold text-center">{logMsg}</p>}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-4 text-center">
        <p className="text-slate-400 text-sm font-bold">Invite selectors and earn rewards</p>
        <Link href="/refer" className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-yellow-400/40 text-yellow-400 font-black text-sm hover:bg-yellow-400/10 transition">
          Get My Referral Link <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function CommunityFeed({ currentUser }: { currentUser: any }) {
  const [tab, setTab] = useState<"feed" | "leaderboard" | "profile">("feed");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [offset, setOffset] = useState(0);

  async function loadFeed(reset = false) {
    setLoading(true);
    const o = reset ? 0 : offset;
    const r = await fetch(`${API}/social/feed?limit=10&offset=${o}`).catch(() => null);
    if (r?.ok) { const d = await r.json(); if (reset) setPosts(d.posts || []); else setPosts(p => [...p, ...(d.posts || [])]); setOffset(o + 10); }
    setLoading(false);
  }

  useEffect(() => { loadFeed(true); }, []);

  const TABS = [
    { id: "feed", label: "Feed", icon: <Zap className="h-4 w-4" /> },
    { id: "leaderboard", label: "Leaderboard", icon: <Trophy className="h-4 w-4" /> },
    { id: "profile", label: "My Profile", icon: <User className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {showCreate && <CreatePostModal onClose={() => setShowCreate(false)} onPosted={() => { setShowCreate(false); loadFeed(true); }} currentUser={currentUser} />}
      <LiveTicker />
      <div className="relative border-b border-slate-800 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 via-slate-900 to-slate-950" />
        <div className="relative px-6 py-12 text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-black text-white mb-4">Selector<span className="text-yellow-400">Nation</span></h1>
          <p className="text-slate-300">Real stories from the floor. Share wins, drop knowledge, earn your badge.</p>
          <div className="mt-6 flex gap-3 justify-center">
            <button onClick={() => setShowCreate(true)} className="px-6 py-3 rounded-2xl bg-yellow-400 text-slate-950 font-black text-sm hover:bg-yellow-300 transition flex items-center gap-2">
              <Zap className="h-4 w-4" /> Share Your Win
            </button>
            <button onClick={() => setTab("leaderboard")} className="px-6 py-3 rounded-2xl border border-yellow-400/40 text-yellow-400 font-black text-sm hover:bg-yellow-400/10 transition flex items-center gap-2">
              <Trophy className="h-4 w-4" /> Leaderboard
            </button>
          </div>
        </div>
      </div>
      <div className="border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-5xl mx-auto px-4 flex">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              className={`flex items-center gap-2 px-5 py-4 text-sm font-black border-b-2 transition ${tab === t.id ? "border-yellow-400 text-yellow-400" : "border-transparent text-slate-500 hover:text-white"}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {tab === "feed" && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-lg font-black text-white flex items-center gap-2"><Zap className="h-5 w-5 text-yellow-400" /> From the Floor</h2>
                <span className="flex items-center gap-1.5 text-xs text-green-400 font-bold"><span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> Live feed</span>
              </div>
              {loading && posts.length === 0 ? <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-yellow-400" /></div>
              : posts.length === 0 ? (
                <div className="text-center py-20">
                  <Users className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-300 font-black text-lg">No posts yet!</p>
                  <button onClick={() => setShowCreate(true)} className="mt-6 px-6 py-3 rounded-2xl bg-yellow-400 text-slate-950 font-black text-sm hover:bg-yellow-300 transition">Post Something</button>
                </div>
              ) : (
                <>
                  {posts.map(post => <PostCard key={post.id} post={post} currentEmail={currentUser?.email || ""} onReacted={() => {}} />)}
                  <button onClick={() => loadFeed(false)} disabled={loading} className="w-full mt-2 py-3.5 rounded-2xl border border-slate-700 text-slate-400 hover:text-white font-bold text-sm transition flex items-center justify-center gap-2">
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />} Load more <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
            <div className="space-y-5">
              <div className="rounded-2xl border border-yellow-400/30 bg-gradient-to-br from-yellow-400/10 to-slate-900 p-5">
                <p className="text-yellow-400 text-xs font-black uppercase tracking-widest mb-2">Got a win?</p>
                <p className="text-white font-bold text-sm mb-4">The community wants to hear from you.</p>
                <button onClick={() => setShowCreate(true)} className="w-full py-3 rounded-xl bg-yellow-400 text-slate-950 font-black text-sm hover:bg-yellow-300 transition">Post to Selector Nation</button>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2"><Award className="h-4 w-4 text-yellow-400" /> Performance Badges</h3>
                <div className="space-y-3">
                  {[{ badge: "🔥 Elite Selector", desc: "Rate 110%+", color: "text-orange-400" }, { badge: "💪 Top Performer", desc: "Rate 100–110%", color: "text-green-400" }, { badge: "🎯 Accuracy Master", desc: "Accuracy 99%+", color: "text-blue-400" }, { badge: "🥇 Gold Status", desc: "Monthly excellence", color: "text-yellow-400" }].map(b => (
                    <div key={b.badge} className="flex items-center gap-3">
                      <span className="text-lg">{b.badge.split(" ")[0]}</span>
                      <div><p className={`text-sm font-black ${b.color}`}>{b.badge.slice(2)}</p><p className="text-slate-500 text-xs">{b.desc}</p></div>
                    </div>
                  ))}
                </div>
              </div>
              <Link href="/refer" className="flex items-center justify-between p-4 rounded-2xl border border-slate-700 bg-slate-900 hover:border-yellow-400/40 transition">
                <div><p className="font-black text-white text-sm">Invite & Earn</p><p className="text-slate-500 text-xs mt-0.5">Share your code, earn badges</p></div>
                <ChevronRight className="h-5 w-5 text-slate-400" />
              </Link>
            </div>
          </div>
        )}
        {tab === "leaderboard" && <LeaderboardTab />}
        {tab === "profile" && <ProfileTab currentUser={currentUser} />}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT — smart routing between landing and community
// ═══════════════════════════════════════════════════════════════════════════════

export default function SelectorNationPage() {
  const { currentUser } = useAuthStore();
  const isLoggedIn = !!currentUser;

  if (isLoggedIn) {
    return <CommunityFeed currentUser={currentUser} />;
  }

  return (
    <>
      <LiveTicker />
      <PublicLanding />
    </>
  );
}
