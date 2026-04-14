import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "wouter";
import {
  Zap, TrendingUp, Star, MessageSquare, Award, Radio, Flame,
  ChevronRight, ThumbsUp, Send, X, Trophy, Globe, Users,
  Heart, Laugh, Eye, Frown, BarChart2, User, MapPin, Loader2,
} from "lucide-react";
import { useAuthStore } from "@/lib/authStore";

const API = import.meta.env.BASE_URL + "api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PostAuthor {
  fullName: string;
  username: string;
  novaId?: string;
  country?: string;
  performanceBadge?: string;
  levelBadge?: string;
  isOnline?: boolean;
}

interface Post {
  id: string;
  content: string;
  authorUserId: string;
  status: string;
  likeCount: number;
  loveCount: number;
  funnyCount: number;
  wowCount: number;
  isPinned: boolean;
  hashtags: string[];
  createdAt: string;
  profile?: PostAuthor;
}

interface LeaderEntry {
  rank: number;
  userId: string;
  avgRate: number;
  totalCases: number;
  avgAccuracy: number;
  warehouseId: string;
  badge: string;
  profile?: PostAuthor;
}

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

const TICKER_ITEMS = [
  "🔥 Elite Selectors running 112%+ across Warehouse A & B",
  "📦 New post: 'Route planning technique adds 3–4 sec per aisle'",
  "⚡ Top 10 leaderboard updated — see who's #1 this week",
  "🏆 Accuracy Masters hitting 99.8% — check codes are everything",
  "📈 Selector Nation growing — share your rate, earn your badge",
];

// ── Live Ticker ───────────────────────────────────────────────────────────────

function LiveTicker() {
  return (
    <div className="bg-yellow-400 text-slate-950 flex items-center overflow-hidden h-9">
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

// ── Post Card ─────────────────────────────────────────────────────────────────

function PostCard({ post, currentEmail, onReacted }: { post: Post; currentEmail: string; onReacted: () => void }) {
  const [reacted, setReacted] = useState<string | null>(null);
  const [counts, setCounts] = useState({ like: post.likeCount, love: post.loveCount, funny: post.funnyCount, wow: post.wowCount });
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);

  const profileName = post.profile?.fullName || "Anonymous";
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
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reactionType: type, email: currentEmail, fullName: profileName }),
    }).catch(() => {});
    onReacted();
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
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: commentText, email: currentEmail, fullName: profileName }),
    });
    setCommentText("");
    loadComments();
  }

  useEffect(() => { if (showComments) loadComments(); }, [showComments]);

  const REACTIONS = [
    { type: "like", icon: <ThumbsUp className="h-4 w-4" />, count: counts.like },
    { type: "love", icon: <Heart className="h-4 w-4" />, count: counts.love },
    { type: "funny", icon: <Laugh className="h-4 w-4" />, count: counts.funny },
    { type: "wow", icon: <Eye className="h-4 w-4" />, count: counts.wow },
  ];

  return (
    <div className={`rounded-2xl border bg-slate-900 p-5 transition-all ${post.isPinned ? "border-yellow-400/50 shadow-[0_0_20px_rgba(250,204,21,0.1)]" : "border-slate-800"}`}>
      {post.isPinned && (
        <div className="flex items-center gap-1.5 mb-3">
          <Star className="h-3.5 w-3.5 text-yellow-400" />
          <span className="text-yellow-400 text-xs font-black uppercase tracking-widest">Pinned</span>
        </div>
      )}
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-11 h-11 rounded-full font-black flex items-center justify-center text-sm shrink-0 ${avatarColor(profileName)}`}>
          {initials(profileName)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-black text-white text-sm">{profileName}</span>
            {post.profile?.novaId && (
              <span className="text-slate-500 text-xs font-mono">{post.profile.novaId}</span>
            )}
            {badge && (
              <span className="px-2 py-0.5 rounded-full bg-yellow-400/15 border border-yellow-400/40 text-yellow-300 text-xs font-bold">{badge}</span>
            )}
            {post.profile?.country && (
              <span className="text-slate-500 text-xs">{post.profile.country}</span>
            )}
            {post.profile?.isOnline && (
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" title="Online" />
            )}
          </div>
          <span className="text-slate-500 text-xs">{timeAgo(post.createdAt)}</span>
        </div>
      </div>
      <p className="text-slate-100 leading-relaxed text-sm font-medium">{post.content}</p>
      {post.hashtags?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {post.hashtags.map(h => (
            <span key={h} className="text-yellow-400 text-xs font-bold">{h}</span>
          ))}
        </div>
      )}
      <div className="mt-4 pt-4 border-t border-slate-800 flex items-center gap-3 flex-wrap">
        {REACTIONS.map(r => (
          <button
            key={r.type}
            onClick={() => react(r.type)}
            className={`flex items-center gap-1.5 text-sm font-bold transition ${reacted === r.type ? "text-yellow-400" : "text-slate-500 hover:text-yellow-400"}`}
          >
            {r.icon} {r.count > 0 && <span>{r.count}</span>}
          </button>
        ))}
        <button
          onClick={() => setShowComments(v => !v)}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-sm font-bold transition ml-auto"
        >
          <MessageSquare className="h-4 w-4" /> {post.content ? "" : ""}{showComments ? "Hide" : "Comments"}
        </button>
      </div>
      {showComments && (
        <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
          {loadingComments ? (
            <div className="flex justify-center py-3"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
          ) : comments.length === 0 ? (
            <p className="text-slate-500 text-sm text-center">No comments yet. Be first!</p>
          ) : (
            comments.map(c => (
              <div key={c.id} className="flex gap-2.5">
                <div className={`w-8 h-8 rounded-full font-black flex items-center justify-center text-xs shrink-0 ${avatarColor(c.profile?.fullName || "A")}`}>
                  {initials(c.profile?.fullName || "A")}
                </div>
                <div className="flex-1 bg-slate-800 rounded-xl px-3 py-2">
                  <span className="text-white text-xs font-black">{c.profile?.fullName || "Anonymous"}</span>
                  <p className="text-slate-300 text-xs mt-0.5">{c.content}</p>
                </div>
              </div>
            ))
          )}
          {currentEmail && (
            <div className="flex gap-2 mt-2">
              <input
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && submitComment()}
                placeholder="Add a comment…"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400"
              />
              <button onClick={submitComment} className="px-3 py-2 rounded-xl bg-yellow-400 text-slate-950 font-black text-sm hover:bg-yellow-300 transition">
                <Send className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Create Post Modal ─────────────────────────────────────────────────────────

function CreatePostModal({ onClose, onPosted, currentUser }: {
  onClose: () => void;
  onPosted: () => void;
  currentUser: any;
}) {
  const [content, setContent] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [displayName, setDisplayName] = useState(currentUser?.fullName || "");
  const [country, setCountry] = useState("🇺🇸 USA");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    if (!content.trim() || !displayName.trim()) return;
    setSubmitting(true);
    const email = currentUser?.email || `${displayName.toLowerCase().replace(/\s+/g, ".")}@selector.nation`;
    const tags = hashtags.split(/[\s,]+/).filter(Boolean).map(h => h.startsWith("#") ? h : `#${h}`);
    await fetch(`${API}/social/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, email, fullName: displayName, username: displayName.toLowerCase().replace(/\s+/g, "_"), hashtags: tags }),
    });
    setSubmitting(false);
    setDone(true);
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
              <input
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Marcus Hill"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400"
              />
            </div>
            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1.5">Country</label>
              <select
                value={country}
                onChange={e => setCountry(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-yellow-400"
              >
                {COUNTRIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1.5">Your Story / Win / Tip</label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Share your rate, a tip, or something the community needs to hear…"
                rows={4}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400 resize-none"
              />
              <p className="text-slate-500 text-xs mt-1 text-right">{content.length}/500</p>
            </div>
            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1.5">Hashtags (optional)</label>
              <input
                value={hashtags}
                onChange={e => setHashtags(e.target.value)}
                placeholder="#rate #pallet #checkcode"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400"
              />
            </div>
            <p className="text-slate-500 text-xs bg-slate-800 rounded-xl p-3 border border-slate-700">
              📋 Posts go to a pending queue and are reviewed before appearing in the feed.
            </p>
            <button
              onClick={submit}
              disabled={submitting || !content.trim() || !displayName.trim()}
              className="w-full py-3.5 rounded-xl bg-yellow-400 text-slate-950 font-black text-sm hover:bg-yellow-300 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {submitting ? "Submitting…" : "Submit Post for Review"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Leaderboard Tab ───────────────────────────────────────────────────────────

function LeaderboardTab() {
  const [period, setPeriod] = useState<"daily" | "weekly" | "global">("weekly");
  const [board, setBoard] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [wh, setWh] = useState<"all" | "A" | "B">("all");

  async function load() {
    setLoading(true);
    const r = await fetch(`${API}/social/leaderboard?period=${period}&limit=15`).catch(() => null);
    if (r?.ok) { const d = await r.json(); setBoard(d.leaderboard || []); }
    setLoading(false);
  }

  useEffect(() => { load(); }, [period]);

  const filtered = wh === "all" ? board : board.filter(e => e.warehouseId === wh);
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2">
          {(["daily", "weekly", "global"] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-sm font-black capitalize transition ${period === p ? "bg-yellow-400 text-slate-950" : "bg-slate-800 text-slate-400 hover:text-white border border-slate-700"}`}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {(["all", "A", "B"] as const).map(w => (
            <button
              key={w}
              onClick={() => setWh(w)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition ${wh === w ? "bg-slate-700 text-white" : "bg-slate-800/50 text-slate-500 hover:text-white"}`}
            >
              {w === "all" ? "All Warehouses" : `Warehouse ${w}`}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-yellow-400" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Trophy className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 font-bold">No performance data yet.</p>
          <p className="text-slate-500 text-sm mt-1">Selectors need to log their rates to appear here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((entry, i) => {
            const name = entry.profile?.fullName || "Unknown Selector";
            const country = entry.profile?.country || "🇺🇸 USA";
            const novaId = entry.profile?.novaId || "";
            return (
              <div
                key={entry.userId}
                className={`flex items-center gap-4 p-4 rounded-2xl border transition ${i === 0 ? "border-yellow-400/50 bg-yellow-400/5" : i === 1 ? "border-slate-600 bg-slate-900" : "border-slate-800 bg-slate-900/50"}`}
              >
                <div className="text-2xl w-8 text-center font-black">{medals[i] || `#${entry.rank}`}</div>
                <div className={`w-11 h-11 rounded-full font-black flex items-center justify-center text-sm shrink-0 ${avatarColor(name)}`}>
                  {initials(name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-white text-sm">{name}</span>
                    {novaId && <span className="text-slate-500 text-xs font-mono">{novaId}</span>}
                    {entry.badge && (
                      <span className="px-2 py-0.5 rounded-full bg-yellow-400/15 border border-yellow-400/40 text-yellow-300 text-xs font-bold">{entry.badge}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                    <span>{country}</span>
                    <span>Wh {entry.warehouseId}</span>
                    <span>{entry.totalCases?.toLocaleString()} cases</span>
                    <span>{entry.avgAccuracy}% accuracy</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className={`text-2xl font-black ${Number(entry.avgRate) >= 110 ? "text-yellow-400" : Number(entry.avgRate) >= 100 ? "text-green-400" : "text-slate-300"}`}>
                    {entry.avgRate}%
                  </div>
                  <div className="text-slate-500 text-xs">avg rate</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-4 text-center">
        <p className="text-slate-400 text-sm font-bold">Your selectors don't appear here yet?</p>
        <p className="text-slate-500 text-xs mt-1">Performance logs are submitted automatically through the picking session or manually by a supervisor.</p>
      </div>
    </div>
  );
}

// ── My Profile Card ───────────────────────────────────────────────────────────

function ProfileCard({ currentUser }: { currentUser: any }) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [logRate, setLogRate] = useState("");
  const [logCases, setLogCases] = useState("");
  const [logWh, setLogWh] = useState("A");
  const [logging, setLogging] = useState(false);
  const [logMsg, setLogMsg] = useState("");

  async function loadProfile() {
    if (!currentUser?.email) return;
    setLoading(true);
    const userRes = await fetch(`${API}/social/profile/${encodeURIComponent(currentUser.email)}`).catch(() => null);
    setLoading(false);
  }

  async function logPerformance() {
    if (!logRate || !currentUser?.email) return;
    setLogging(true);
    const r = await fetch(`${API}/social/performance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: currentUser.email,
        fullName: currentUser.fullName || "Selector",
        rate: parseFloat(logRate),
        casesPicked: parseInt(logCases) || 0,
        warehouseId: logWh,
      }),
    });
    const d = await r.json().catch(() => ({}));
    setLogging(false);
    setLogMsg(d.badge ? `Performance logged! Badge earned: ${d.badge}` : "Performance logged!");
    setLogRate(""); setLogCases("");
    setTimeout(() => setLogMsg(""), 4000);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-yellow-400/30 bg-gradient-to-br from-yellow-400/10 to-slate-900 p-5">
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-14 h-14 rounded-full font-black flex items-center justify-center text-lg ${avatarColor(currentUser?.fullName || "S")}`}>
            {initials(currentUser?.fullName || "S?")}
          </div>
          <div>
            <p className="font-black text-white text-base">{currentUser?.fullName || "Your Profile"}</p>
            <p className="text-slate-400 text-xs">{currentUser?.email}</p>
            <p className="text-slate-500 text-xs font-mono mt-0.5">NOVA ID: auto-assigned on first post</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-800 rounded-xl p-3 text-center">
            <p className="text-yellow-400 font-black text-lg">—</p>
            <p className="text-slate-400 text-xs">Avg Rate</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-3 text-center">
            <p className="text-yellow-400 font-black text-lg">—</p>
            <p className="text-slate-400 text-xs">Global Rank</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-yellow-400" /> Log My Performance
        </h4>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Rate (%)</label>
              <input
                value={logRate}
                onChange={e => setLogRate(e.target.value)}
                placeholder="e.g. 112"
                type="number"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Cases Picked</label>
              <input
                value={logCases}
                onChange={e => setLogCases(e.target.value)}
                placeholder="e.g. 1200"
                type="number"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Warehouse</label>
            <select
              value={logWh}
              onChange={e => setLogWh(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400"
            >
              <option value="A">Warehouse A</option>
              <option value="B">Warehouse B</option>
            </select>
          </div>
          <button
            onClick={logPerformance}
            disabled={logging || !logRate}
            className="w-full py-2.5 rounded-xl bg-yellow-400 text-slate-950 font-black text-sm hover:bg-yellow-300 transition disabled:opacity-50"
          >
            {logging ? "Logging…" : "Log Performance"}
          </button>
          {logMsg && <p className="text-green-400 text-sm font-bold text-center">{logMsg}</p>}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SelectorNationPage() {
  const { currentUser } = useAuthStore();
  const [tab, setTab] = useState<"feed" | "leaderboard" | "profile">("feed");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [offset, setOffset] = useState(0);

  async function loadFeed(reset = false) {
    setLoading(true);
    const o = reset ? 0 : offset;
    const r = await fetch(`${API}/social/feed?limit=10&offset=${o}`).catch(() => null);
    if (r?.ok) {
      const d = await r.json();
      if (reset) setPosts(d.posts || []);
      else setPosts(p => [...p, ...(d.posts || [])]);
      setOffset(o + 10);
    }
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
      {showCreate && (
        <CreatePostModal
          onClose={() => setShowCreate(false)}
          onPosted={() => { setShowCreate(false); loadFeed(true); }}
          currentUser={currentUser}
        />
      )}

      <LiveTicker />

      {/* Hero */}
      <div className="relative border-b border-slate-800 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 via-slate-900 to-slate-950" />
        <div className="relative px-6 py-12 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-600/20 border border-red-500/40 mb-5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-red-400 text-xs font-black uppercase tracking-widest">Selector Breaking News</span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-black text-white mb-4 leading-none">
            Selector<br /><span className="text-yellow-400">Nation</span>
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto leading-relaxed">
            Real stories from the warehouse floor. Share wins, drop knowledge, earn your badge.
          </p>
          <div className="mt-8 flex gap-3 justify-center flex-wrap">
            <button
              onClick={() => setShowCreate(true)}
              className="px-6 py-3 rounded-2xl bg-yellow-400 text-slate-950 font-black text-sm hover:bg-yellow-300 transition flex items-center gap-2"
            >
              <Zap className="h-4 w-4" /> Share Your Win
            </button>
            <button
              onClick={() => setTab("leaderboard")}
              className="px-6 py-3 rounded-2xl border border-yellow-400/40 text-yellow-400 font-black text-sm hover:bg-yellow-400/10 transition flex items-center gap-2"
            >
              <Trophy className="h-4 w-4" /> View Leaderboard
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-5xl mx-auto px-4 flex">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`flex items-center gap-2 px-5 py-4 text-sm font-black border-b-2 transition ${tab === t.id ? "border-yellow-400 text-yellow-400" : "border-transparent text-slate-500 hover:text-white"}`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* Feed Tab */}
        {tab === "feed" && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-400" /> From the Floor
                </h2>
                <span className="flex items-center gap-1.5 text-xs text-green-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> Live feed
                </span>
              </div>

              {loading && posts.length === 0 ? (
                <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-yellow-400" /></div>
              ) : posts.length === 0 ? (
                <div className="text-center py-20">
                  <Users className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-300 font-black text-lg">No posts yet!</p>
                  <p className="text-slate-500 text-sm mt-1">Be the first selector to share something.</p>
                  <button
                    onClick={() => setShowCreate(true)}
                    className="mt-6 px-6 py-3 rounded-2xl bg-yellow-400 text-slate-950 font-black text-sm hover:bg-yellow-300 transition"
                  >
                    Post Something
                  </button>
                </div>
              ) : (
                <>
                  {posts.map(post => (
                    <PostCard
                      key={post.id}
                      post={post}
                      currentEmail={currentUser?.email || ""}
                      onReacted={() => {}}
                    />
                  ))}
                  <button
                    onClick={() => loadFeed(false)}
                    disabled={loading}
                    className="w-full mt-2 py-3.5 rounded-2xl border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 font-bold text-sm transition flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Load more posts <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              <div className="rounded-2xl border border-yellow-400/30 bg-gradient-to-br from-yellow-400/10 to-slate-900 p-5">
                <p className="text-yellow-400 text-xs font-black uppercase tracking-widest mb-2">Got a win to share?</p>
                <p className="text-white font-bold text-sm mb-4">Drop your rate, tip, or story. The community wants to hear from you.</p>
                <button
                  onClick={() => setShowCreate(true)}
                  className="w-full py-3 rounded-xl bg-yellow-400 text-slate-950 font-black text-sm hover:bg-yellow-300 transition"
                >
                  Post to Selector Nation
                </button>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                  <Award className="h-4 w-4 text-yellow-400" /> Performance Badges
                </h3>
                <div className="space-y-3">
                  {[
                    { badge: "🔥 Elite Selector", desc: "Rate 110%+", color: "text-orange-400" },
                    { badge: "💪 Top Performer", desc: "Rate 100–110%", color: "text-green-400" },
                    { badge: "🎯 Accuracy Master", desc: "Accuracy 99%+", color: "text-blue-400" },
                  ].map(b => (
                    <div key={b.badge} className="flex items-center gap-3">
                      <span className="text-lg">{b.badge.split(" ")[0]}</span>
                      <div>
                        <p className={`text-sm font-black ${b.color}`}>{b.badge.slice(2)}</p>
                        <p className="text-slate-500 text-xs">{b.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-yellow-400/25 bg-yellow-400/5 p-5">
                <h3 className="text-xs font-black uppercase tracking-widest text-yellow-400 mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" /> Leaderboard
                </h3>
                <p className="text-slate-300 text-sm mb-4">See who's running the highest rates on the floor.</p>
                <button
                  onClick={() => setTab("leaderboard")}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-yellow-400 text-slate-950 font-black text-sm hover:bg-yellow-300 transition"
                >
                  View Leaderboard <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">New here?</h3>
                <p className="text-slate-400 text-sm mb-4">Start with Module 1 — free, 25 minutes, immediately useful.</p>
                <Link href="/training" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 text-white font-bold text-sm hover:border-yellow-400 hover:text-yellow-400 transition">
                  Browse Training <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard Tab */}
        {tab === "leaderboard" && <LeaderboardTab />}

        {/* Profile Tab */}
        {tab === "profile" && (
          <div className="max-w-lg mx-auto">
            {currentUser ? (
              <ProfileCard currentUser={currentUser} />
            ) : (
              <div className="text-center py-20">
                <User className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-300 font-black text-lg">Sign in to view your profile</p>
                <Link href="/login" className="mt-4 inline-flex px-6 py-3 rounded-2xl bg-yellow-400 text-slate-950 font-black text-sm hover:bg-yellow-300 transition">
                  Sign In
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
