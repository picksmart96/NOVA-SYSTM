import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Copy, CheckCircle, Users, Trophy, ChevronRight, ArrowRight, Loader2 } from "lucide-react";
import { useAuthStore } from "@/lib/authStore";

const API = import.meta.env.BASE_URL + "api";

interface ReferralInfo {
  referralCode: string | null;
  referralLink: string;
  referrals: { id: string; referred_email: string; joined: boolean; reward_given: boolean; created_at: string }[];
  totalInvites: number;
}

const BADGE_TIERS = [
  { badge: "👥 Recruiter", req: 5, color: "border-blue-400/30 bg-blue-400/5 text-blue-300" },
  { badge: "🔥 Team Builder", req: 10, color: "border-orange-400/30 bg-orange-400/5 text-orange-300" },
  { badge: "👑 Network Leader", req: 25, color: "border-yellow-400/30 bg-yellow-400/5 text-yellow-300" },
];

export default function ReferPage() {
  const { currentUser } = useAuthStore();
  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState("");

  async function load() {
    if (!currentUser?.email) { setLoading(false); return; }
    setLoading(true);
    const r = await fetch(`${API}/social/referrals?email=${encodeURIComponent(currentUser.email)}`).catch(() => null);
    if (r?.ok) { const d = await r.json(); setInfo(d); }
    setLoading(false);
  }

  useEffect(() => { load(); }, [currentUser?.email]);

  function copy() {
    if (!info?.referralLink) return;
    navigator.clipboard.writeText(info.referralLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  async function invite() {
    if (!inviteEmail.trim() || !currentUser?.email) return;
    setInviting(true);
    const r = await fetch(`${API}/social/referrals/invite`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referrerEmail: currentUser.email, invitedEmail: inviteEmail.trim() }),
    });
    const d = await r.json().catch(() => ({}));
    setInviting(false);
    setInviteMsg("Invite tracked!");
    setInviteEmail("");
    load();
    setTimeout(() => setInviteMsg(""), 3000);
  }

  const totalInvites = info?.totalInvites || 0;
  const currentTier = BADGE_TIERS.filter(t => totalInvites >= t.req).pop() || null;
  const nextTier = BADGE_TIERS.find(t => totalInvites < t.req) || null;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Hero */}
      <div className="border-b border-slate-800 bg-gradient-to-br from-yellow-400/10 to-slate-950">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <div className="text-5xl mb-4">👥</div>
          <h1 className="text-5xl font-black text-white mb-4">Invite &amp; Earn</h1>
          <p className="text-slate-300 text-xl max-w-xl mx-auto">Share your code with other selectors. When they join, you both win.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">

        {/* Badge tiers */}
        <div className="grid sm:grid-cols-3 gap-4">
          {BADGE_TIERS.map(t => {
            const earned = totalInvites >= t.req;
            const progress = Math.min(totalInvites / t.req, 1);
            return (
              <div key={t.badge} className={`rounded-2xl border p-5 ${earned ? t.color : "border-slate-800 bg-slate-900"}`}>
                <p className={`font-black text-lg mb-1 ${earned ? "" : "text-slate-400"}`}>{t.badge}</p>
                <p className={`text-sm mb-3 ${earned ? "opacity-80" : "text-slate-500"}`}>{t.req} invites</p>
                <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${progress * 100}%` }} />
                </div>
                <p className="text-xs text-slate-500 mt-1.5">{Math.min(totalInvites, t.req)} / {t.req}</p>
                {earned && <div className="mt-2 flex items-center gap-1.5 text-green-400 text-xs font-black"><CheckCircle className="h-3.5 w-3.5" /> Earned!</div>}
              </div>
            );
          })}
        </div>

        {/* Your code */}
        {!currentUser ? (
          <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/5 p-8 text-center">
            <p className="text-yellow-400 font-black text-lg mb-2">Sign in to get your referral code</p>
            <p className="text-slate-400 text-sm mb-6">Your unique code is generated automatically when you join.</p>
            <Link href="/login" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-yellow-400 text-slate-950 font-black hover:bg-yellow-300 transition">Sign In <ArrowRight className="h-4 w-4" /></Link>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-yellow-400" /></div>
        ) : (
          <div className="rounded-2xl border border-yellow-400/30 bg-gradient-to-br from-yellow-400/10 to-slate-900 p-6">
            <p className="text-yellow-400 text-xs font-black uppercase tracking-widest mb-4">Your Referral Code</p>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-5 py-4">
                <p className="font-mono text-2xl font-black text-white tracking-widest">{info?.referralCode || "—"}</p>
              </div>
              <button onClick={copy} className={`px-5 py-4 rounded-xl font-black text-sm transition flex items-center gap-2 ${copied ? "bg-green-500 text-white" : "bg-yellow-400 text-slate-950 hover:bg-yellow-300"}`}>
                {copied ? <><CheckCircle className="h-4 w-4" /> Copied!</> : <><Copy className="h-4 w-4" /> Copy Code</>}
              </button>
            </div>
            {info?.referralLink && (
              <div>
                <p className="text-xs text-slate-500 mb-2">Or share your full link:</p>
                <div className="flex items-center gap-2">
                  <input readOnly value={info.referralLink}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 font-mono focus:outline-none" />
                  <button onClick={copy} className="px-3 py-2 rounded-lg bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition">Copy</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Invite by email */}
        {currentUser && !loading && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h3 className="font-black text-white text-base mb-1">Invite a Selector by Email</h3>
            <p className="text-slate-400 text-sm mb-4">Send an invite and we'll track it toward your badge count.</p>
            <div className="flex gap-3">
              <input
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && invite()}
                placeholder="selector@warehouse.com"
                type="email"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400"
              />
              <button onClick={invite} disabled={inviting || !inviteEmail.trim()}
                className="px-5 py-3 rounded-xl bg-yellow-400 text-slate-950 font-black text-sm hover:bg-yellow-300 transition disabled:opacity-50 flex items-center gap-2">
                {inviting && <Loader2 className="h-4 w-4 animate-spin" />} Send Invite
              </button>
            </div>
            {inviteMsg && <p className="text-green-400 text-sm font-bold mt-3">{inviteMsg}</p>}
          </div>
        )}

        {/* Invite list */}
        {currentUser && !loading && (info?.referrals || []).length > 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-white flex items-center gap-2"><Users className="h-5 w-5 text-yellow-400" /> Your Invites</h3>
              <span className="px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-xs font-black">{totalInvites} total</span>
            </div>
            <div className="space-y-2">
              {(info?.referrals || []).map(r => (
                <div key={r.id} className="flex items-center gap-3 py-2.5 border-b border-slate-800 last:border-0">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-black text-white">
                    {r.referred_email[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-bold truncate">{r.referred_email}</p>
                    <p className="text-slate-500 text-xs">{new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-xs font-black px-2.5 py-1 rounded-full ${r.joined ? "bg-green-500/20 text-green-400" : "bg-slate-700 text-slate-400"}`}>
                    {r.joined ? "Joined" : "Invited"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress to next tier */}
        {currentUser && !loading && nextTier && (
          <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-5 flex items-center gap-4">
            <Trophy className="h-8 w-8 text-yellow-400 shrink-0" />
            <div className="flex-1">
              <p className="font-black text-white text-sm">Next badge: {nextTier.badge}</p>
              <p className="text-slate-400 text-xs mt-0.5">Invite {nextTier.req - totalInvites} more selectors to unlock</p>
              <div className="h-1.5 rounded-full bg-slate-700 mt-2 overflow-hidden">
                <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${(totalInvites / nextTier.req) * 100}%` }} />
              </div>
            </div>
          </div>
        )}

        {/* How it works */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h3 className="font-black text-white mb-4 flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-400" /> How It Works</h3>
          <div className="space-y-4">
            {[
              { step: "1", text: "Copy your unique referral code or share your link." },
              { step: "2", text: "Your contact signs up using your code or link." },
              { step: "3", text: "You both get access and you earn progress toward your badge." },
              { step: "4", text: "Unlock Recruiter → Team Builder → Network Leader as you grow." },
            ].map(s => (
              <div key={s.step} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-yellow-400 text-slate-950 font-black flex items-center justify-center text-sm shrink-0">{s.step}</div>
                <p className="text-slate-300 text-sm leading-relaxed pt-1">{s.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center pb-4">
          <Link href="/selector-nation" className="inline-flex items-center gap-2 text-slate-400 hover:text-yellow-400 text-sm font-bold transition">
            ← Back to Selector Nation
          </Link>
        </div>
      </div>
    </div>
  );
}
