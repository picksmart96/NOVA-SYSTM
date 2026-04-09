import { useState } from "react";
import { Link } from "wouter";
import { Zap, TrendingUp, Star, MessageSquare, Award, Radio, Flame, ChevronRight, ThumbsUp } from "lucide-react";

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
    hot: true,
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
    hot: false,
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
    hot: true,
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
    hot: false,
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
    hot: true,
  },
];

const ACHIEVEMENTS = [
  { label: "100+ Club", description: "Hit 100%+ rate for 5 consecutive shifts", count: 47 },
  { label: "Pallet Master", description: "Zero pallet falls over 30 assignments", count: 28 },
  { label: "NOVA Pro", description: "Graduate from Training to Production mode", count: 89 },
  { label: "Rising Star", description: "Improve rate by 20%+ in first month", count: 35 },
];

const TICKER_ITEMS = [
  "🔥 Marcus T. just hit 114% — new personal record",
  "📦 Aaliyah J. posted a week 2 comeback story",
  "⚡ 89 selectors earned NOVA Pro this week",
  "🏆 Carlos M. on check codes: 'getting it right the first time is always faster'",
  "📈 247 active members — community growing fast",
];

function LiveTicker() {
  return (
    <div className="bg-yellow-400 text-slate-950 flex items-center overflow-hidden h-9">
      <div className="flex items-center gap-2 px-4 bg-red-600 h-full shrink-0">
        <Radio className="h-3.5 w-3.5 text-white animate-pulse" />
        <span className="text-white text-xs font-black uppercase tracking-widest">Live</span>
      </div>
      <div className="overflow-hidden flex-1">
        <div className="flex animate-[ticker_30s_linear_infinite] whitespace-nowrap">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="text-slate-950 text-xs font-bold px-8">{item}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function PostCard({ post }: { post: typeof POSTS[0] }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);

  function handleLike() {
    if (!liked) { setLikeCount(c => c + 1); }
    else { setLikeCount(c => c - 1); }
    setLiked(l => !l);
  }

  return (
    <div className={`rounded-2xl border bg-slate-900 p-5 transition-all hover:scale-[1.01] ${
      post.hot ? "border-yellow-400/40 shadow-[0_0_20px_rgba(250,204,21,0.08)]" : "border-slate-800"
    }`}>
      {post.hot && (
        <div className="flex items-center gap-1.5 mb-3">
          <Flame className="h-3.5 w-3.5 text-orange-400" />
          <span className="text-orange-400 text-xs font-black uppercase tracking-widest">Trending</span>
        </div>
      )}
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-11 h-11 rounded-full font-black flex items-center justify-center text-sm shrink-0 ${
          post.hot ? "bg-yellow-400 text-slate-950" : "bg-slate-700 text-white"
        }`}>
          {post.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-black text-white text-sm">{post.author}</span>
            {post.badge && (
              <span className="px-2 py-0.5 rounded-full bg-yellow-400/15 border border-yellow-400/40 text-yellow-300 text-xs font-bold">
                🏅 {post.badge}
              </span>
            )}
          </div>
          <span className="text-slate-500 text-xs">{post.time}</span>
        </div>
      </div>
      <p className="text-slate-100 leading-relaxed text-sm font-medium">{post.text}</p>
      <div className="mt-4 pt-4 border-t border-slate-800 flex items-center gap-5">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 text-sm font-bold transition ${liked ? "text-yellow-400" : "text-slate-500 hover:text-yellow-400"}`}
        >
          <ThumbsUp className="h-4 w-4" /> {likeCount}
        </button>
        <button className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-sm font-bold transition">
          <MessageSquare className="h-4 w-4" /> {post.replies} replies
        </button>
      </div>
    </div>
  );
}

export default function SelectorNationPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">

      {/* Live ticker */}
      <LiveTicker />

      {/* Hero */}
      <div className="relative border-b border-slate-800 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 via-slate-900 to-slate-950" />
        <div className="relative px-6 py-14 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-600/20 border border-red-500/40 mb-5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-red-400 text-xs font-black uppercase tracking-widest">Selector Breaking News</span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-black text-white mb-4 leading-none">
            Selector<br /><span className="text-yellow-400">Nation</span>
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto leading-relaxed">
            Real stories from the warehouse floor. Share wins, drop knowledge, and connect with selectors who get it.
          </p>
          <div className="mt-8 flex gap-3 justify-center flex-wrap">
            <div className="px-5 py-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-slate-200 font-bold text-sm">
              <span className="text-yellow-400 font-black text-lg">247</span> Members
            </div>
            <div className="px-5 py-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-slate-200 font-bold text-sm">
              <span className="text-yellow-400 font-black text-lg">1.4k</span> Posts
            </div>
            <div className="px-5 py-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-slate-200 font-bold text-sm">
              <span className="text-yellow-400 font-black text-lg">89</span> NOVA Pros
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 grid lg:grid-cols-3 gap-8">

        {/* Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-400" /> From the Floor
            </h2>
            <span className="flex items-center gap-1.5 text-xs text-green-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> Live feed
            </span>
          </div>

          {POSTS.map(post => <PostCard key={post.id} post={post} />)}

          <button className="w-full mt-2 py-3.5 rounded-2xl border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 font-bold text-sm transition flex items-center justify-center gap-2">
            Load more posts <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">

          {/* Write a post CTA */}
          <div className="rounded-2xl border border-yellow-400/30 bg-gradient-to-br from-yellow-400/10 to-slate-900 p-5">
            <p className="text-yellow-400 text-xs font-black uppercase tracking-widest mb-2">Got a win to share?</p>
            <p className="text-white font-bold text-sm mb-4">Drop your rate, tip, or story. The community wants to hear from you.</p>
            <button className="w-full py-3 rounded-xl bg-yellow-400 text-slate-950 font-black text-sm hover:bg-yellow-300 transition">
              Post to Selector Nation
            </button>
          </div>

          {/* Achievements */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <Award className="h-4 w-4 text-yellow-400" /> Achievements
            </h3>
            <div className="space-y-4">
              {ACHIEVEMENTS.map(a => (
                <div key={a.label} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center shrink-0">
                    <Award className="h-4 w-4 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-black">{a.label}</p>
                    <p className="text-slate-500 text-xs leading-snug">{a.description}</p>
                    <p className="text-yellow-400 text-xs font-bold mt-0.5">{a.count} earners</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Leaderboard teaser */}
          <div className="rounded-2xl border border-yellow-400/25 bg-yellow-400/5 p-5">
            <h3 className="text-xs font-black uppercase tracking-widest text-yellow-400 mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Top Selectors This Week
            </h3>
            <p className="text-slate-300 text-sm mb-4">See who's running the highest rates on the floor right now.</p>
            <Link href="/leaderboard" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-yellow-400 text-slate-950 font-black text-sm hover:bg-yellow-300 transition">
              View Leaderboard <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Training teaser */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">New here?</h3>
            <p className="text-slate-400 text-sm mb-4">Start with Module 1 — free, 25 minutes, immediately useful.</p>
            <Link href="/training" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 text-white font-bold text-sm hover:border-yellow-400 hover:text-yellow-400 transition">
              Browse Training <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
