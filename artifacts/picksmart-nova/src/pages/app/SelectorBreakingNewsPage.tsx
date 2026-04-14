import { useMemo, useState } from "react";
import { useSelectorBreakingNewsStore } from "@/store/selectorBreakingNewsStore";
import type { Post, BreakingNewsUser } from "@/store/selectorBreakingNewsStore";

// ─── Sub-components ───────────────────────────────────────────────────────────

function Avatar({ name, size = "md" }: { name?: string; size?: "sm" | "md" | "lg" }) {
  const dims =
    size === "lg" ? "h-16 w-16 text-xl"
    : size === "sm" ? "h-10 w-10 text-sm"
    : "h-12 w-12 text-base";
  return (
    <div className={`${dims} flex items-center justify-center rounded-full bg-yellow-400 font-black uppercase text-slate-950 shrink-0`}>
      {name?.slice(0, 1) || "S"}
    </div>
  );
}

function SidebarCard({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
      {title ? <h3 className="text-lg font-bold text-slate-900 mb-4">{title}</h3> : null}
      <div className={title ? "space-y-3" : ""}>{children}</div>
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3 text-center">
      <p className="text-xl font-black text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
    </div>
  );
}

function formatTime(ts: number) {
  const diff = Date.now() - ts;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function ReactionButton({
  emoji,
  label,
  count = 0,
  active,
  onClick,
}: {
  emoji: string;
  label: string;
  count?: number;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border px-3 py-2 text-sm transition ${
        active
          ? "border-yellow-500 bg-yellow-50 text-yellow-700 font-semibold"
          : "border-gray-200 text-slate-600 hover:border-yellow-400 hover:text-slate-900"
      }`}
    >
      {emoji} {label}{count > 0 ? ` ${count}` : ""}
    </button>
  );
}

function PostCard({
  post,
  currentUserId,
  getUserById,
  onReact,
  onComment,
  onSave,
  onReport,
  onDelete,
}: {
  post: Post;
  currentUserId: string;
  getUserById: (id: string) => BreakingNewsUser | undefined;
  onReact: (postId: string, type: keyof Post["reactions"]) => void;
  onComment: (postId: string, text: string) => void;
  onSave: (postId: string) => void;
  onReport: (postId: string) => void;
  onDelete: (postId: string) => void;
}) {
  const [comment, setComment] = useState("");
  const author = getUserById(post.authorId);
  const hasReaction = (type: keyof Post["reactions"]) =>
    post.reactions[type]?.includes(currentUserId);
  const isSaved = post.savedBy.includes(currentUserId);
  const isOwn = post.authorId === currentUserId;

  const submitComment = () => {
    if (!comment.trim()) return;
    onComment(post.id, comment);
    setComment("");
  };

  const EMOJIS = ["😀","😂","😎","🔥","💪","👏","🙌","❤️","👍","😮","😅","🎧","📦","🚚","🙏","✅"];

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Avatar name={author?.name || "U"} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-slate-900">{author?.name}</h3>
            <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-bold text-yellow-700">
              {author?.level}
            </span>
          </div>
          <p className="text-sm text-slate-400">{author?.handle} · {formatTime(post.createdAt)}</p>
        </div>
        {isOwn && (
          <button
            onClick={() => onDelete(post.id)}
            className="text-xs text-slate-400 hover:text-red-500 transition ml-auto shrink-0"
          >
            Delete
          </button>
        )}
      </div>

      {/* Content */}
      <p className="mt-4 whitespace-pre-wrap text-slate-800 leading-7">{post.content}</p>

      {post.imageUrl && (
        <img
          src={post.imageUrl}
          alt="Post"
          className="mt-4 max-h-96 w-full rounded-2xl object-cover border border-gray-200"
        />
      )}

      {post.hashtags?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {post.hashtags.map((tag) => (
            <span key={tag} className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-slate-600">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Reactions */}
      <div className="mt-5 flex flex-wrap gap-2">
        <ReactionButton emoji="👍" label="Like" count={post.reactions.like.length} active={hasReaction("like")} onClick={() => onReact(post.id, "like")} />
        <ReactionButton emoji="❤️" label="Love" count={post.reactions.love.length} active={hasReaction("love")} onClick={() => onReact(post.id, "love")} />
        <ReactionButton emoji="😂" label="Funny" count={post.reactions.funny.length} active={hasReaction("funny")} onClick={() => onReact(post.id, "funny")} />
        <ReactionButton emoji="😮" label="Wow" count={post.reactions.wow.length} active={hasReaction("wow")} onClick={() => onReact(post.id, "wow")} />
        <ReactionButton emoji="😡" label="Frustrated" count={post.reactions.frustrated.length} active={hasReaction("frustrated")} onClick={() => onReact(post.id, "frustrated")} />
        <ReactionButton emoji="🔖" label={isSaved ? "Saved" : "Save"} active={isSaved} onClick={() => onSave(post.id)} />
        <ReactionButton emoji="🚩" label="Report" onClick={() => onReport(post.id)} />
      </div>

      {/* Comments */}
      {post.comments.length > 0 && (
        <div className="mt-5 space-y-3">
          {post.comments.map((item) => {
            const ca = getUserById(item.authorId);
            return (
              <div key={item.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
                <p className="font-semibold text-slate-900 text-sm">{ca?.name}</p>
                <p className="mt-1 text-sm text-slate-700">{item.text}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Comment input */}
      <div className="mt-5 flex gap-3">
        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitComment()}
          placeholder="Write a comment..."
          className="flex-1 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-yellow-400 text-sm"
        />
        <button
          onClick={submitComment}
          className="rounded-2xl bg-yellow-400 px-4 py-3 font-bold text-slate-950 hover:bg-yellow-300 text-sm"
        >
          Post
        </button>
      </div>

      {/* Emoji quick-add */}
      <div className="mt-4 flex flex-wrap gap-1.5 text-base">
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            className="rounded-xl border border-gray-200 bg-gray-50 px-2 py-1.5 transition hover:border-yellow-400 hover:bg-yellow-50"
            onClick={() => setComment((prev) => `${prev}${emoji}`)}
          >
            {emoji}
          </button>
        ))}
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
  } = useSelectorBreakingNewsStore();

  const currentUser = getCurrentUser();
  const posts = getFeedPosts();
  const suggestedMembers = getSuggestedMembers();
  const onlineUsers = getOnlineUsers();
  const trendingHashtags = getTrendingHashtags();

  const [postText, setPostText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [hashtagInput, setHashtagInput] = useState("");
  const [activeMenu, setActiveMenu] = useState("Home Feed");

  const hashtags = useMemo(() => {
    return hashtagInput
      .split(" ")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => (item.startsWith("#") ? item : `#${item}`));
  }, [hashtagInput]);

  const handleCreatePost = () => {
    createPost({ content: postText, imageUrl, hashtags });
    setPostText("");
    setImageUrl("");
    setHashtagInput("");
  };

  const displayedPosts = useMemo(() => {
    if (activeMenu === "Saved Posts") {
      return posts.filter((p) => p.savedBy.includes(currentUserId));
    }
    return posts;
  }, [posts, currentUserId, activeMenu]);

  const menuItems = ["Home Feed", "Profile", "Saved Posts", "Notifications", "Groups", "Community Policy"];

  return (
    <div className="min-h-screen bg-white px-4 py-6 text-slate-900 md:px-6">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-yellow-600">Community</p>
          <h1 className="mt-3 text-4xl font-black text-slate-900 md:text-5xl">Selector Breaking News</h1>
          <p className="mt-3 text-lg text-slate-500">Built for selectors. Powered by community.</p>
        </div>

        {/* Search */}
        <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
          <input
            placeholder="Search posts, people, hashtags"
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-yellow-400"
          />
        </div>

        {/* 3-column grid */}
        <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_300px]">

          {/* Left sidebar */}
          <div className="space-y-6">
            <SidebarCard>
              <div className="flex items-center gap-4">
                <Avatar name={currentUser?.name} size="lg" />
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{currentUser?.name}</h2>
                  <span className="mt-2 inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-700">
                    {currentUser?.level}
                  </span>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-600">{currentUser?.bio}</p>
              <div className="mt-5 grid grid-cols-3 gap-3">
                <StatBlock label="Following" value={currentUser?.following.length || 0} />
                <StatBlock label="Followers" value={currentUser?.followers.length || 0} />
                <StatBlock label="Posts" value={currentUser?.postsCount || 0} />
              </div>
            </SidebarCard>

            <SidebarCard title="Menu">
              {menuItems.map((item) => (
                <button
                  key={item}
                  onClick={() => setActiveMenu(item)}
                  className={`block w-full rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                    activeMenu === item
                      ? "border-yellow-400 bg-yellow-50 text-yellow-700"
                      : "border-gray-100 bg-gray-50 text-slate-700 hover:border-yellow-300 hover:text-slate-900"
                  }`}
                >
                  {item}
                </button>
              ))}
            </SidebarCard>

            <SidebarCard title="Community Policy">
              <div className="space-y-2 text-sm text-slate-600">
                <p>✅ Work-related and appropriate content only</p>
                <p>✅ Respect all members</p>
                <p>🚫 No nudity, hate, threats, or illegal content</p>
                <p>🚫 No harassment or bullying</p>
                <p>👑 Owner can warn, suspend, or ban users</p>
              </div>
            </SidebarCard>
          </div>

          {/* Feed */}
          <div className="space-y-6">
            {activeMenu !== "Community Policy" && activeMenu !== "Profile" && (
              <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <Avatar name={currentUser?.name} />
                  <div className="flex-1 space-y-3">
                    <textarea
                      value={postText}
                      onChange={(e) => setPostText(e.target.value)}
                      rows={4}
                      placeholder="What's going on in your shift?"
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-yellow-400 text-sm resize-none"
                    />
                    <input
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Add image URL (optional)"
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-yellow-400 text-sm"
                    />
                    <input
                      value={hashtagInput}
                      onChange={(e) => setHashtagInput(e.target.value)}
                      placeholder="Add hashtags: selectorlife stackingtips"
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-yellow-400 text-sm"
                    />
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    onClick={postText.trim() ? handleCreatePost : undefined}
                    disabled={!postText.trim()}
                    className="rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-yellow-300 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Post to Breaking News
                  </button>
                </div>
              </div>
            )}

            {activeMenu === "Saved Posts" && displayedPosts.length === 0 && (
              <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center text-slate-500">
                No saved posts yet. Hit 🔖 on any post to save it here.
              </div>
            )}

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
              />
            ))}
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {trendingHashtags.length > 0 && (
              <SidebarCard title="Trending Hashtags">
                <div className="flex flex-wrap gap-2">
                  {trendingHashtags.map((tag) => (
                    <span key={tag} className="rounded-full border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-slate-700">
                      {tag}
                    </span>
                  ))}
                </div>
              </SidebarCard>
            )}

            {suggestedMembers.length > 0 && (
              <SidebarCard title="Suggested Members">
                <div className="space-y-4">
                  {suggestedMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar name={member.name} size="sm" />
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-slate-900 truncate">{member.name}</p>
                          <p className="text-xs text-slate-500">{member.followers.length} followers</p>
                        </div>
                      </div>
                      <button
                        onClick={() => followUser(member.id)}
                        className="rounded-xl bg-yellow-400 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-yellow-300 shrink-0"
                      >
                        Follow
                      </button>
                    </div>
                  ))}
                </div>
              </SidebarCard>
            )}

            {onlineUsers.length > 0 && (
              <SidebarCard title="Online Now">
                <div className="space-y-4">
                  {onlineUsers.map((member) => (
                    <div key={member.id} className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar name={member.name} size="sm" />
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-400 border-2 border-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-slate-900">{member.name}</p>
                        <p className="text-xs text-green-600">{member.statusText || "Online"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </SidebarCard>
            )}

            <SidebarCard title="Announcements">
              <div className="space-y-3 text-sm text-slate-600">
                <p>Only appropriate, work-related pictures are allowed on Selector Breaking News.</p>
                <p>Owner dashboard controls reports, posts, warnings, suspensions, and bans.</p>
              </div>
            </SidebarCard>
          </div>
        </div>
      </div>
    </div>
  );
}
