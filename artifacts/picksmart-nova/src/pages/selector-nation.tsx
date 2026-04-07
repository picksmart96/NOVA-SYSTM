import { Link } from "wouter";
import { Users, TrendingUp, Star, MessageSquare, Award } from "lucide-react";

const POSTS = [
  {
    id: 1,
    author: "Marcus T.",
    initials: "MT",
    time: "2 hours ago",
    text: "Hit 114% today with the route planning technique from Module 4. That dead-end aisle trick saves 3–4 seconds per pass. It adds up fast over a full shift.",
    likes: 18,
    replies: 5,
    badge: "Top Selector",
  },
  {
    id: 2,
    author: "Deja R.",
    initials: "DR",
    time: "5 hours ago",
    text: "Module 3 on pallet building is legit. My Bravo pallet used to fall every time I hit the dock. Haven't had a fall in 3 weeks since stacking heavy on bottom consistently.",
    likes: 24,
    replies: 8,
    badge: null,
  },
  {
    id: 3,
    author: "Carlos M.",
    initials: "CM",
    time: "Yesterday",
    text: "PSA: Don't skip the check codes. I know it feels slow but NOVA loops until you get it right for a reason. Getting it right the first time is always faster than retrying.",
    likes: 31,
    replies: 12,
    badge: "100+ Club",
  },
  {
    id: 4,
    author: "James R.",
    initials: "JR",
    time: "Yesterday",
    text: "Anyone else using ultra-fast mode? Once you know the flow it's way faster. But I recommend at least 4 weeks in production mode first. The reps matter.",
    likes: 14,
    replies: 6,
    badge: null,
  },
  {
    id: 5,
    author: "Aaliyah J.",
    initials: "AJ",
    time: "2 days ago",
    text: "Week 2 selector here. Coming in from 67% to 82% this week. Watching the shift simulation module every night before bed. Something is clicking. Keep going newbies.",
    likes: 42,
    replies: 19,
    badge: "Rising Star",
  },
];

const ACHIEVEMENTS = [
  { label: "100+ Club", description: "Hit 100%+ rate for 5 consecutive shifts", count: 47, color: "yellow" },
  { label: "Pallet Master", description: "Complete 30 assignments with zero pallet falls", count: 28, color: "blue" },
  { label: "NOVA Pro", description: "Graduate from Training to Production mode", count: 89, color: "green" },
  { label: "Rising Star", description: "Improve rate by 20%+ in first month", count: 35, color: "purple" },
];

export default function SelectorNationPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Hero */}
      <div className="border-b border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 px-6 py-14 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-yellow-400 mb-5">
          <Users className="h-8 w-8 text-slate-950" />
        </div>
        <h1 className="text-4xl font-black text-white mb-3">Selector Nation</h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          The community for warehouse order selectors. Share wins, learn from the floor, and connect with fellow selectors who've been there.
        </p>
        <div className="mt-6 flex gap-4 justify-center text-sm">
          <div className="px-4 py-2 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
            <span className="text-yellow-400 font-black">247</span> Members
          </div>
          <div className="px-4 py-2 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
            <span className="text-yellow-400 font-black">1.4k</span> Posts
          </div>
          <div className="px-4 py-2 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
            <span className="text-yellow-400 font-black">89</span> NOVA Pros
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12 grid lg:grid-cols-3 gap-8">
        {/* Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-black text-white flex items-center gap-2"><MessageSquare className="h-5 w-5 text-yellow-400" /> From the Floor</h2>
            <span className="text-sm text-slate-500">Showing recent activity</span>
          </div>

          {POSTS.map(post => (
            <div key={post.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-5 hover:border-slate-700 transition">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-yellow-400 text-slate-950 font-black flex items-center justify-center text-sm shrink-0">
                  {post.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white text-sm">{post.author}</span>
                    {post.badge && (
                      <span className="px-2 py-0.5 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 text-xs font-bold">
                        {post.badge}
                      </span>
                    )}
                    <span className="text-slate-500 text-xs">{post.time}</span>
                  </div>
                </div>
              </div>
              <p className="text-slate-200 leading-relaxed text-sm">{post.text}</p>
              <div className="mt-4 flex items-center gap-5 text-slate-500 text-sm">
                <button className="flex items-center gap-1.5 hover:text-yellow-400 transition">
                  <Star className="h-4 w-4" /> {post.likes}
                </button>
                <button className="flex items-center gap-1.5 hover:text-yellow-400 transition">
                  <MessageSquare className="h-4 w-4" /> {post.replies}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Achievements */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <Award className="h-4 w-4 text-yellow-400" /> Achievements
            </h3>
            <div className="space-y-3">
              {ACHIEVEMENTS.map(a => (
                <div key={a.label} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center shrink-0">
                    <Award className="h-4 w-4 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">{a.label}</p>
                    <p className="text-slate-500 text-xs">{a.description}</p>
                    <p className="text-yellow-400 text-xs font-bold mt-0.5">{a.count} earners</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Leaderboard teaser */}
          <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/5 p-5">
            <h3 className="text-sm font-bold uppercase tracking-widest text-yellow-400 mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Top Selectors
            </h3>
            <p className="text-slate-300 text-sm mb-4">See who's hitting the highest rates this week.</p>
            <Link href="/leaderboard" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-400 text-slate-950 font-bold text-sm hover:bg-yellow-300 transition">
              View Leaderboard
            </Link>
          </div>

          {/* Training teaser */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-3">Not started yet?</h3>
            <p className="text-slate-400 text-sm mb-4">Start with Module 1 — it's free and takes 25 minutes.</p>
            <Link href="/training" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 text-white font-semibold text-sm hover:border-yellow-400 transition">
              Browse Training
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
