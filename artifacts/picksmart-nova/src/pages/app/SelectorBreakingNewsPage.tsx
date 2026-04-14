import { useMemo, useState, useRef, useEffect } from "react";
import { useSelectorBreakingNewsStore } from "@/store/selectorBreakingNewsStore";
import type { Post, BreakingNewsUser } from "@/store/selectorBreakingNewsStore";
import {
  Home, Users, Bell, Search, ThumbsUp, MessageCircle, Share2,
  Heart, Laugh, Angry, Bookmark, Flag, X, ChevronRight,
  Camera, Smile, Tag, MoreHorizontal, Plus, Video,
  TrendingUp, Zap, Star,
} from "lucide-react";

// ─── Avatar with DiceBear ──────────────────────────────────────────────────────

function Avatar({
  name,
  size = "md",
  online = false,
}: {
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  online?: boolean;
}) {
  const seed = encodeURIComponent(name || "selector");
  const url = `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
  const dims =
    size === "xl" ? "h-24 w-24"
    : size === "lg" ? "h-14 w-14"
    : size === "sm" ? "h-9 w-9"
    : size === "xs" ? "h-7 w-7"
    : "h-11 w-11";
  return (
    <div className={`relative shrink-0 ${dims}`}>
      <img
        src={url}
        alt={name || "user"}
        className={`${dims} rounded-full object-cover bg-slate-700 border-2 border-slate-600`}
      />
      {online && (
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-400 border-2 border-[#18191a]" />
      )}
    </div>
  );
}

// ─── Time formatter ────────────────────────────────────────────────────────────

function formatTime(ts: number) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

// ─── Reaction popup ────────────────────────────────────────────────────────────

const REACTIONS = [
  { type: "like" as const,       emoji: "👍", label: "Like",     color: "text-blue-400" },
  { type: "love" as const,       emoji: "❤️",  label: "Love",     color: "text-red-400"  },
  { type: "funny" as const,      emoji: "😂", label: "Haha",     color: "text-yellow-400" },
  { type: "wow" as const,        emoji: "😮", label: "Wow",      color: "text-yellow-400" },
  { type: "frustrated" as const, emoji: "😡", label: "Angry",    color: "text-orange-400" },
];

function ReactionPopup({
  onReact,
  myReaction,
}: {
  onReact: (type: keyof Post["reactions"]) => void;
  myReaction?: keyof Post["reactions"];
}) {
  const [show, setShow] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const current = REACTIONS.find((r) => r.type === myReaction);

  return (
    <div
      className="relative"
      onMouseEnter={() => { clearTimeout(timer.current); setShow(true); }}
      onMouseLeave={() => { timer.current = setTimeout(() => setShow(false), 200); }}
    >
      {show && (
        <div className="absolute bottom-full left-0 mb-2 flex gap-1 rounded-full bg-[#3a3b3c] px-3 py-2 shadow-2xl border border-white/10 z-20">
          {REACTIONS.map((r) => (
            <button
              key={r.type}
              onClick={() => { onReact(r.type); setShow(false); }}
              title={r.label}
              className="text-2xl hover:scale-125 transition-transform duration-150"
            >
              {r.emoji}
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => onReact(myReaction ? myReaction : "like")}
        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition hover:bg-white/8 ${
          myReaction ? current?.color : "text-slate-400"
        }`}
      >
        {myReaction ? (
          <span className="text-base">{current?.emoji}</span>
        ) : (
          <ThumbsUp className="h-4 w-4" />
        )}
        {myReaction ? current?.label : "Like"}
      </button>
    </div>
  );
}

// ─── Story Card ────────────────────────────────────────────────────────────────

function StoryCard({ user, isCreate }: { user?: BreakingNewsUser; isCreate?: boolean }) {
  const seed = encodeURIComponent(user?.name || "");
  const bg = `https://api.dicebear.com/9.x/shapes/svg?seed=${seed}&size=120`;

  if (isCreate) {
    return (
      <div className="relative w-28 shrink-0 cursor-pointer overflow-hidden rounded-2xl border border-white/10">
        <div className="h-20 bg-[#3a3b3c]" />
        <div className="absolute left-1/2 top-12 -translate-x-1/2 flex h-10 w-10 items-center justify-center rounded-full border-4 border-[#242526] bg-yellow-400">
          <Plus className="h-5 w-5 text-slate-950" />
        </div>
        <div className="h-16 bg-[#242526] pt-6 pb-2 text-center">
          <p className="text-xs font-semibold text-white">Create Story</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-28 shrink-0 cursor-pointer overflow-hidden rounded-2xl border border-white/10 group">
      <img src={bg} alt="" className="h-full w-full absolute inset-0 object-cover opacity-60 group-hover:opacity-80 transition" style={{ height: "100%" }} />
      <div className="h-36 bg-gradient-to-b from-slate-700/40 to-slate-900/80 relative" />
      <div className="absolute top-3 left-3">
        <Avatar name={user?.name} size="sm" online={user?.isOnline} />
      </div>
      <div className="absolute bottom-3 left-3 right-3">
        <p className="text-xs font-bold text-white leading-tight">{user?.name?.split(" ")[0]}</p>
      </div>
    </div>
  );
}

// ─── Post Card ────────────────────────────────────────────────────────────────

function PostCard({
  post,
  currentUserId,
  getUserById,
  onReact,
  onComment,
  onSave,
  onReport,
  onDelete,
  onViewProfile,
}: {
  post: Post;
  currentUserId: string;
  getUserById: (id: string) => BreakingNewsUser | undefined;
  onReact: (postId: string, type: keyof Post["reactions"]) => void;
  onComment: (postId: string, text: string) => void;
  onSave: (postId: string) => void;
  onReport: (postId: string) => void;
  onDelete: (postId: string) => void;
  onViewProfile: (userId: string) => void;
}) {
  const [comment, setComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const author = getUserById(post.authorId);
  const isOwn = post.authorId === currentUserId;
  const isSaved = post.savedBy.includes(currentUserId);

  const myReaction = REACTIONS.find((r) => post.reactions[r.type]?.includes(currentUserId))?.type;

  const totalReactions = Object.values(post.reactions).reduce((a, b) => a + b.length, 0);

  const topReactions = REACTIONS
    .filter((r) => post.reactions[r.type]?.length > 0)
    .sort((a, b) => post.reactions[b.type].length - post.reactions[a.type].length)
    .slice(0, 3);

  const submitComment = () => {
    if (!comment.trim()) return;
    onComment(post.id, comment);
    setComment("");
    setShowComments(true);
  };

  return (
    <div className="rounded-2xl bg-[#242526] border border-white/8 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 pb-2">
        <button onClick={() => onViewProfile(post.authorId)}>
          <Avatar name={author?.name} size="md" online={author?.isOnline} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onViewProfile(post.authorId)}
              className="font-bold text-white hover:underline text-sm"
            >
              {author?.name}
            </button>
            {author?.level && (
              <span className="rounded-full bg-yellow-400/15 border border-yellow-400/30 px-2 py-0.5 text-[10px] font-black text-yellow-400 uppercase tracking-wider">
                {author.level}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">{author?.handle} · {formatTime(post.createdAt)}</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu((v) => !v)}
            className="p-2 rounded-full hover:bg-white/8 text-slate-400 transition"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-44 rounded-2xl bg-[#3a3b3c] border border-white/10 shadow-2xl z-10 py-1 overflow-hidden">
              <button
                onClick={() => { onSave(post.id); setShowMenu(false); }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-white/8 transition"
              >
                <Bookmark className="h-4 w-4" />
                {isSaved ? "Unsave post" : "Save post"}
              </button>
              {isOwn ? (
                <button
                  onClick={() => { onDelete(post.id); setShowMenu(false); }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-white/8 transition"
                >
                  <X className="h-4 w-4" />
                  Delete post
                </button>
              ) : (
                <button
                  onClick={() => { onReport(post.id); setShowMenu(false); }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-white/8 transition"
                >
                  <Flag className="h-4 w-4" />
                  Report post
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-slate-200 leading-relaxed text-[15px] whitespace-pre-wrap">{post.content}</p>
        {post.hashtags?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {post.hashtags.map((tag) => (
              <span key={tag} className="text-sm text-yellow-400 hover:underline cursor-pointer">{tag}</span>
            ))}
          </div>
        )}
      </div>

      {post.imageUrl && (
        <img
          src={post.imageUrl}
          alt="Post media"
          className="w-full max-h-[500px] object-cover"
        />
      )}

      {/* Reaction counts + comment count bar */}
      {(totalReactions > 0 || post.comments.length > 0) && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-white/5 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            {topReactions.map((r) => (
              <span key={r.type} className="text-base">{r.emoji}</span>
            ))}
            {totalReactions > 0 && <span className="ml-1">{totalReactions}</span>}
          </div>
          {post.comments.length > 0 && (
            <button
              onClick={() => setShowComments((v) => !v)}
              className="hover:underline"
            >
              {post.comments.length} comment{post.comments.length !== 1 ? "s" : ""}
            </button>
          )}
        </div>
      )}

      {/* Action bar */}
      <div className="flex border-t border-white/5 px-2">
        <ReactionPopup
          onReact={(type) => onReact(post.id, type)}
          myReaction={myReaction}
        />
        <button
          onClick={() => setShowComments((v) => !v)}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-slate-400 hover:bg-white/8 transition"
        >
          <MessageCircle className="h-4 w-4" />
          Comment
        </button>
        <button className="flex flex-1 items-center justify-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-slate-400 hover:bg-white/8 transition">
          <Share2 className="h-4 w-4" />
          Share
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="border-t border-white/5 px-4 pb-4 pt-3 space-y-3">
          {post.comments.map((item) => {
            const ca = getUserById(item.authorId);
            return (
              <div key={item.id} className="flex gap-2.5">
                <Avatar name={ca?.name} size="xs" />
                <div className="rounded-2xl bg-[#3a3b3c] px-3 py-2 flex-1 min-w-0">
                  <p className="font-bold text-white text-xs">{ca?.name}</p>
                  <p className="text-sm text-slate-300 mt-0.5">{item.text}</p>
                </div>
              </div>
            );
          })}

          {/* Comment input */}
          <div className="flex gap-2.5 mt-2">
            <Avatar name={getUserById(currentUserId)?.name} size="xs" />
            <div className="flex-1 flex gap-2 items-center rounded-full bg-[#3a3b3c] border border-white/8 px-3 py-1.5">
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitComment()}
                placeholder="Write a comment…"
                className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              />
              <button
                onClick={submitComment}
                disabled={!comment.trim()}
                className="text-yellow-400 font-bold text-xs disabled:opacity-40 hover:text-yellow-300 transition shrink-0"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Profile View ─────────────────────────────────────────────────────────────

function ProfileView({
  user,
  posts,
  currentUserId,
  getUserById,
  onReact,
  onComment,
  onSave,
  onReport,
  onDelete,
  onViewProfile,
  onFollow,
  onClose,
}: {
  user: BreakingNewsUser;
  posts: Post[];
  currentUserId: string;
  getUserById: (id: string) => BreakingNewsUser | undefined;
  onReact: (postId: string, type: keyof Post["reactions"]) => void;
  onComment: (postId: string, text: string) => void;
  onSave: (postId: string) => void;
  onReport: (postId: string) => void;
  onDelete: (postId: string) => void;
  onViewProfile: (userId: string) => void;
  onFollow: (userId: string) => void;
  onClose: () => void;
}) {
  const isOwn = user.id === currentUserId;
  const isFollowing = getUserById(currentUserId)?.following?.includes(user.id);
  const userPosts = posts.filter((p) => p.authorId === user.id);
  const coverSeed = encodeURIComponent(user.name + "-cover");
  const coverUrl = `https://api.dicebear.com/9.x/shapes/svg?seed=${coverSeed}&size=800`;

  return (
    <div className="space-y-0">
      {/* Cover + avatar */}
      <div className="rounded-t-2xl overflow-hidden">
        <div className="h-44 relative overflow-hidden bg-gradient-to-br from-slate-700 to-slate-900">
          <img src={coverUrl} alt="" className="w-full h-full object-cover opacity-40" />
          <button onClick={onClose} className="absolute top-3 right-3 rounded-full bg-black/40 p-2 text-white hover:bg-black/60 transition">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="bg-[#242526] border border-white/8 px-4 pb-4">
          <div className="flex items-end gap-4 -mt-10">
            <div className="relative">
              <img
                src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(user.name)}&backgroundColor=b6e3f4,c0aede,d1d4f9`}
                alt={user.name}
                className="h-24 w-24 rounded-full border-4 border-[#242526] bg-slate-700"
              />
              {user.isOnline && (
                <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-green-400 border-2 border-[#242526]" />
              )}
            </div>
            <div className="flex-1 pt-12">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-xl font-black text-white">{user.name}</h2>
                  <p className="text-sm text-slate-400">{user.handle}</p>
                  {user.level && (
                    <span className="inline-flex mt-1 rounded-full bg-yellow-400/15 border border-yellow-400/30 px-2.5 py-0.5 text-xs font-black text-yellow-400 uppercase tracking-wider">
                      {user.level}
                    </span>
                  )}
                </div>
                {!isOwn && (
                  <button
                    onClick={() => onFollow(user.id)}
                    className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                      isFollowing
                        ? "bg-[#3a3b3c] text-white hover:bg-white/10"
                        : "bg-yellow-400 text-slate-950 hover:bg-yellow-300"
                    }`}
                  >
                    {isFollowing ? "Following ✓" : "+ Follow"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {user.bio && (
            <p className="mt-4 text-slate-300 text-sm">{user.bio}</p>
          )}

          {/* Stats */}
          <div className="mt-4 flex gap-6 text-center">
            <div>
              <p className="text-lg font-black text-white">{user.postsCount}</p>
              <p className="text-xs text-slate-500">Posts</p>
            </div>
            <div>
              <p className="text-lg font-black text-white">{user.followers.length}</p>
              <p className="text-xs text-slate-500">Followers</p>
            </div>
            <div>
              <p className="text-lg font-black text-white">{user.following.length}</p>
              <p className="text-xs text-slate-500">Following</p>
            </div>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="mt-4 space-y-4">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider px-1">Posts</h3>
        {userPosts.length === 0 ? (
          <div className="rounded-2xl bg-[#242526] border border-white/8 p-8 text-center text-slate-500 text-sm">
            No posts yet.
          </div>
        ) : (
          userPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              getUserById={getUserById}
              onReact={onReact}
              onComment={onComment}
              onSave={onSave}
              onReport={onReport}
              onDelete={onDelete}
              onViewProfile={onViewProfile}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SelectorBreakingNewsPage() {
  const {
    currentUserId,
    createPost,
    addComment,
    toggleReaction,
    toggleSavePost,
    reportPost,
    followUser,
    deletePost,
    getCurrentUser,
    getUserById,
    getFeedPosts,
    getSuggestedMembers,
    getOnlineUsers,
    getTrendingHashtags,
    users,
  } = useSelectorBreakingNewsStore();

  const currentUser = getCurrentUser();
  const posts = getFeedPosts();
  const suggestedMembers = getSuggestedMembers();
  const onlineUsers = getOnlineUsers();
  const trendingHashtags = getTrendingHashtags();

  const [postText, setPostText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [hashtagInput, setHashtagInput] = useState("");
  const [activeTab, setActiveTab] = useState<"feed" | "saved" | "profile">("feed");
  const [viewingProfile, setViewingProfile] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const hashtags = useMemo(() => {
    return hashtagInput
      .split(" ")
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => (t.startsWith("#") ? t : `#${t}`));
  }, [hashtagInput]);

  const handleCreatePost = () => {
    if (!postText.trim()) return;
    createPost({ content: postText, imageUrl, hashtags });
    setPostText("");
    setImageUrl("");
    setHashtagInput("");
  };

  const displayedPosts = useMemo(() => {
    if (activeTab === "saved") return posts.filter((p) => p.savedBy.includes(currentUserId));
    return posts;
  }, [posts, currentUserId, activeTab]);

  const profileUser = viewingProfile ? getUserById(viewingProfile) : null;

  const navItems = [
    { icon: Home, label: "Home",    tab: "feed"    as const },
    { icon: Bookmark, label: "Saved",   tab: "saved"   as const },
    { icon: Users,    label: "Profile", tab: "profile" as const },
  ];

  return (
    <div className="min-h-screen bg-[#18191a] text-white">

      {/* ── Top Navbar ─────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-[#242526] border-b border-white/8 shadow-lg">
        <div className="mx-auto max-w-7xl px-4 flex items-center justify-between h-14 gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-yellow-400 flex items-center justify-center">
              <Zap className="h-5 w-5 text-slate-950" />
            </div>
            <span className="font-black text-white hidden sm:block text-sm">Selector Nation</span>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-xs">
            <div className="flex items-center gap-2 rounded-full bg-[#3a3b3c] border border-white/8 px-3 py-2">
              <Search className="h-4 w-4 text-slate-500 shrink-0" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Selector Nation"
                className="bg-transparent text-sm text-white outline-none placeholder:text-slate-500 w-full"
              />
            </div>
          </div>

          {/* Nav icons */}
          <div className="flex items-center gap-1">
            {navItems.map(({ icon: Icon, label, tab }) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setViewingProfile(null); }}
                title={label}
                className={`flex items-center justify-center w-10 h-10 rounded-xl transition ${
                  activeTab === tab && !viewingProfile
                    ? "text-yellow-400 bg-yellow-400/10"
                    : "text-slate-400 hover:bg-white/8"
                }`}
              >
                <Icon className="h-5 w-5" />
              </button>
            ))}
            <button className="flex items-center justify-center w-10 h-10 rounded-xl text-slate-400 hover:bg-white/8 transition" title="Notifications">
              <Bell className="h-5 w-5" />
            </button>
            {/* Own avatar */}
            <button
              onClick={() => { setActiveTab("profile"); setViewingProfile(currentUserId); }}
              className="ml-1"
            >
              <Avatar name={currentUser?.name} size="xs" online />
            </button>
          </div>
        </div>
      </div>

      {/* ── Main layout ────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-2 py-4 grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)_300px]">

        {/* ── Left Sidebar ─────────────────────────────────────────────────── */}
        <aside className="space-y-2 hidden xl:block">
          {/* Own profile card */}
          <button
            onClick={() => { setActiveTab("profile"); setViewingProfile(currentUserId); }}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white/8 transition text-left"
          >
            <Avatar name={currentUser?.name} size="md" online />
            <div className="min-w-0">
              <p className="font-bold text-white text-sm truncate">{currentUser?.name}</p>
              <p className="text-xs text-slate-500 truncate">{currentUser?.handle}</p>
            </div>
          </button>

          <div className="border-t border-white/5 pt-2 space-y-0.5">
            {navItems.map(({ icon: Icon, label, tab }) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setViewingProfile(null); }}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  activeTab === tab && !viewingProfile
                    ? "bg-yellow-400/10 text-yellow-400"
                    : "text-slate-300 hover:bg-white/8"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {label}
              </button>
            ))}
          </div>

          <div className="border-t border-white/5 pt-2">
            <p className="px-3 py-1 text-xs font-bold text-slate-500 uppercase tracking-wider">Your Stats</p>
            <div className="px-3 py-2 grid grid-cols-3 gap-2">
              {[
                { label: "Posts",     value: currentUser?.postsCount || 0 },
                { label: "Following", value: currentUser?.following?.length || 0 },
                { label: "Followers", value: currentUser?.followers?.length || 0 },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl bg-[#242526] border border-white/8 p-2 text-center">
                  <p className="text-base font-black text-white">{value}</p>
                  <p className="text-[10px] text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Trending */}
          {trendingHashtags.length > 0 && (
            <div className="border-t border-white/5 pt-2">
              <p className="px-3 py-1 text-xs font-bold text-slate-500 uppercase tracking-wider">Trending</p>
              <div className="px-3 space-y-0.5">
                {trendingHashtags.slice(0, 5).map((tag) => (
                  <div key={tag} className="flex items-center gap-2 rounded-xl px-2 py-2 hover:bg-white/8 cursor-pointer transition">
                    <TrendingUp className="h-3.5 w-3.5 text-yellow-400 shrink-0" />
                    <span className="text-sm text-slate-300">{tag}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* ── Center Feed ──────────────────────────────────────────────────── */}
        <main className="space-y-4 min-w-0">

          {/* Profile view */}
          {viewingProfile && profileUser ? (
            <ProfileView
              user={profileUser}
              posts={posts}
              currentUserId={currentUserId}
              getUserById={getUserById}
              onReact={toggleReaction}
              onComment={addComment}
              onSave={toggleSavePost}
              onReport={reportPost}
              onDelete={deletePost}
              onViewProfile={(id) => setViewingProfile(id)}
              onFollow={followUser}
              onClose={() => setViewingProfile(null)}
            />
          ) : (
            <>
              {/* Stories */}
              {activeTab === "feed" && (
                <div className="overflow-x-auto pb-1">
                  <div className="flex gap-2 w-max">
                    <StoryCard isCreate />
                    {users.slice(0, 6).map((u) => (
                      <StoryCard key={u.id} user={u} />
                    ))}
                  </div>
                </div>
              )}

              {/* Post creator */}
              {activeTab !== "saved" && (
                <div className="rounded-2xl bg-[#242526] border border-white/8 p-4 space-y-3 shadow-lg">
                  <div className="flex items-center gap-3">
                    <Avatar name={currentUser?.name} size="md" online />
                    <button
                      onClick={() => document.getElementById("post-textarea")?.focus()}
                      className="flex-1 rounded-full bg-[#3a3b3c] border border-white/8 px-4 py-2.5 text-left text-sm text-slate-500 hover:bg-white/8 transition cursor-text"
                    >
                      What's on your mind, {currentUser?.name?.split(" ")[0]}?
                    </button>
                  </div>

                  <textarea
                    id="post-textarea"
                    value={postText}
                    onChange={(e) => setPostText(e.target.value)}
                    rows={postText ? 3 : 1}
                    placeholder="Share what's happening on your shift…"
                    className="w-full bg-transparent text-white text-sm outline-none placeholder:text-slate-600 resize-none px-1"
                  />

                  {postText && (
                    <div className="space-y-2">
                      <input
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="Image URL (optional)"
                        className="w-full rounded-xl bg-[#3a3b3c] border border-white/8 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-yellow-400 transition"
                      />
                      <input
                        value={hashtagInput}
                        onChange={(e) => setHashtagInput(e.target.value)}
                        placeholder="Hashtags: selectorlife stackingtips"
                        className="w-full rounded-xl bg-[#3a3b3c] border border-white/8 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-yellow-400 transition"
                      />
                    </div>
                  )}

                  <div className="border-t border-white/5 pt-3 flex items-center justify-between">
                    <div className="flex gap-1">
                      <button className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-green-400 hover:bg-white/8 transition">
                        <Camera className="h-4 w-4" /> Photo
                      </button>
                      <button className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-yellow-400 hover:bg-white/8 transition">
                        <Smile className="h-4 w-4" /> Feeling
                      </button>
                      <button className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-blue-400 hover:bg-white/8 transition">
                        <Tag className="h-4 w-4" /> Tag
                      </button>
                    </div>
                    <button
                      onClick={handleCreatePost}
                      disabled={!postText.trim()}
                      className="rounded-xl bg-yellow-400 px-5 py-2 text-sm font-bold text-slate-950 hover:bg-yellow-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      Post
                    </button>
                  </div>
                </div>
              )}

              {/* Saved header */}
              {activeTab === "saved" && (
                <div className="rounded-2xl bg-[#242526] border border-white/8 p-4">
                  <h2 className="font-black text-white text-lg">Saved Posts</h2>
                  <p className="text-slate-500 text-sm mt-1">Posts you've bookmarked</p>
                </div>
              )}

              {/* Empty state */}
              {activeTab === "saved" && displayedPosts.length === 0 && (
                <div className="rounded-2xl bg-[#242526] border border-white/8 p-10 text-center">
                  <Bookmark className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500">No saved posts yet. Tap the ··· on any post to save it.</p>
                </div>
              )}

              {/* Feed */}
              {displayedPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={currentUserId}
                  getUserById={getUserById}
                  onReact={toggleReaction}
                  onComment={addComment}
                  onSave={toggleSavePost}
                  onReport={reportPost}
                  onDelete={deletePost}
                  onViewProfile={(id) => setViewingProfile(id)}
                />
              ))}
            </>
          )}
        </main>

        {/* ── Right Sidebar ─────────────────────────────────────────────────── */}
        <aside className="space-y-4 hidden xl:block">

          {/* Sponsored / Community badge */}
          <div className="rounded-2xl bg-[#242526] border border-white/8 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Star className="h-4 w-4 text-yellow-400" />
              <p className="text-xs font-black text-yellow-400 uppercase tracking-wider">Selector Nation</p>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              The global community for warehouse selectors. Share wins, get coaching, and connect with the best in the business.
            </p>
          </div>

          {/* Online now */}
          {onlineUsers.length > 0 && (
            <div className="rounded-2xl bg-[#242526] border border-white/8 p-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Online Now</p>
              <div className="space-y-3">
                {onlineUsers.slice(0, 8).map((member) => (
                  <button
                    key={member.id}
                    onClick={() => setViewingProfile(member.id)}
                    className="w-full flex items-center gap-3 rounded-xl hover:bg-white/8 transition px-1 py-1"
                  >
                    <Avatar name={member.name} size="sm" online={member.isOnline} />
                    <div className="min-w-0 text-left flex-1">
                      <p className="text-sm font-semibold text-white truncate">{member.name}</p>
                      <p className="text-xs text-green-400 truncate">{member.statusText || "Active now"}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Suggested members */}
          {suggestedMembers.length > 0 && (
            <div className="rounded-2xl bg-[#242526] border border-white/8 p-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">People You May Know</p>
              <div className="space-y-3">
                {suggestedMembers.slice(0, 5).map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <button onClick={() => setViewingProfile(member.id)}>
                      <Avatar name={member.name} size="md" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <button
                        onClick={() => setViewingProfile(member.id)}
                        className="font-semibold text-sm text-white hover:underline truncate block text-left"
                      >
                        {member.name}
                      </button>
                      <p className="text-xs text-slate-500">{member.followers.length} followers</p>
                    </div>
                    <button
                      onClick={() => followUser(member.id)}
                      className="shrink-0 rounded-xl bg-yellow-400/15 border border-yellow-400/30 px-3 py-1.5 text-xs font-bold text-yellow-400 hover:bg-yellow-400/25 transition"
                    >
                      + Follow
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Community policy */}
          <div className="rounded-2xl bg-[#242526] border border-white/8 p-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Community Rules</p>
            <div className="space-y-1.5 text-xs text-slate-500">
              <p>✅ Work-related, appropriate content only</p>
              <p>✅ Respect every member</p>
              <p>🚫 No hate speech or harassment</p>
              <p>👑 Owner can warn, suspend, or ban</p>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}
