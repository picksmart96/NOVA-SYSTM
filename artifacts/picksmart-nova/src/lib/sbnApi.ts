/**
 * Selector Breaking News (SBN) — Frontend API Layer
 *
 * All types mirror the database schema (sbn_* tables).
 * All API calls go through the shared API server at /api/sbn/*.
 */

// ─── Enum Values ──────────────────────────────────────────────────────────────

export type SbnRole = "selector" | "trainer" | "supervisor" | "manager" | "owner";
export type SbnSubscriptionPlan = "personal" | "company" | "owner";
export type SbnPostType = "text" | "image" | "video" | "question" | "announcement" | "training_clip";
export type SbnVisibility = "public" | "followers" | "group" | "private";
export type SbnReactionType = "like" | "love" | "funny" | "wow" | "frustrated";
export type SbnNotificationType = "like" | "comment" | "reply" | "follow" | "mention" | "message" | "report_update" | "group_invite";
export type SbnReportStatus = "open" | "reviewed" | "dismissed" | "action_taken";
export type SbnGroupMemberRole = "admin" | "moderator" | "member";
export type SbnConversationType = "direct" | "group";
export type SbnBanStatus = "active" | "expired" | "lifted";

// ─── Core Entity Types ────────────────────────────────────────────────────────

export interface SbnUser {
  id: string;
  email: string;
  role: SbnRole;
  subscriptionPlan: SbnSubscriptionPlan;
  isSubscribed: boolean;
  isBanned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SbnProfile {
  id: string;
  userId: string;
  fullName: string;
  username: string;
  bio: string;
  avatarUrl: string;
  coverImageUrl: string;
  levelBadge: string;
  location: string;
  shiftType: string;
  statusText: string;
  isOnline: boolean;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SbnPost {
  id: string;
  authorUserId: string;
  groupId: string | null;
  postType: SbnPostType;
  content: string;
  imageUrl: string;
  videoUrl: string;
  visibility: SbnVisibility;
  isPinned: boolean;
  isDeleted: boolean;
  likeCount: number;
  loveCount: number;
  funnyCount: number;
  wowCount: number;
  frustratedCount: number;
  commentsCount: number;
  sharesCount: number;
  savesCount: number;
  reportsCount: number;
  createdAt: string;
  updatedAt: string;
  author?: SbnProfile;
  hashtags?: string[];
  userReaction?: SbnReactionType | null;
  isSaved?: boolean;
}

export interface SbnComment {
  id: string;
  postId: string;
  authorUserId: string;
  parentCommentId: string | null;
  content: string;
  isDeleted: boolean;
  reactionsCount: number;
  createdAt: string;
  updatedAt: string;
  author?: SbnProfile;
  replies?: SbnComment[];
  userReaction?: SbnReactionType | null;
}

export interface SbnFollow {
  id: string;
  followerUserId: string;
  followingUserId: string;
  createdAt: string;
}

export interface SbnNotification {
  id: string;
  userId: string;
  actorUserId: string | null;
  type: SbnNotificationType;
  entityType: string;
  entityId: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
  actor?: SbnProfile;
}

export interface SbnConversation {
  id: string;
  conversationType: SbnConversationType;
  createdAt: string;
  updatedAt: string;
  members?: SbnConversationMember[];
  lastMessage?: SbnMessage;
}

export interface SbnConversationMember {
  id: string;
  conversationId: string;
  userId: string;
  lastReadAt: string | null;
  joinedAt: string;
  profile?: SbnProfile;
}

export interface SbnMessage {
  id: string;
  conversationId: string;
  senderUserId: string;
  content: string;
  imageUrl: string;
  isDeleted: boolean;
  createdAt: string;
  sender?: SbnProfile;
}

export interface SbnGroup {
  id: string;
  name: string;
  slug: string;
  description: string;
  coverImageUrl: string;
  createdByUserId: string;
  isPrivate: boolean;
  isArchived: boolean;
  membersCount: number;
  postsCount: number;
  createdAt: string;
  updatedAt: string;
  userRole?: SbnGroupMemberRole | null;
}

export interface SbnGroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: SbnGroupMemberRole;
  joinedAt: string;
  profile?: SbnProfile;
}

export interface SbnReport {
  id: string;
  reporterUserId: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: SbnReportStatus;
  reviewedByUserId: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface SbnBan {
  id: string;
  userId: string;
  bannedByUserId: string;
  reason: string;
  status: SbnBanStatus;
  createdAt: string;
  expiresAt: string | null;
}

export interface SbnAnnouncement {
  id: string;
  title: string;
  content: string;
  createdByUserId: string;
  isPinned: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  author?: SbnProfile;
}

export interface SbnModerationLog {
  id: string;
  adminUserId: string;
  actionType: string;
  targetType: string;
  targetId: string;
  notes: string;
  createdAt: string;
  admin?: SbnProfile;
}

// ─── Payload Types ────────────────────────────────────────────────────────────

export interface CreatePostPayload {
  content: string;
  postType?: SbnPostType;
  imageUrl?: string;
  videoUrl?: string;
  visibility?: SbnVisibility;
  groupId?: string;
  hashtags?: string[];
}

export interface CreateCommentPayload {
  postId: string;
  content: string;
  parentCommentId?: string;
}

export interface ReactToPostPayload {
  postId: string;
  reactionType: SbnReactionType;
}

export interface ReactToCommentPayload {
  commentId: string;
  reactionType: SbnReactionType;
}

export interface SendMessagePayload {
  conversationId: string;
  content: string;
  imageUrl?: string;
}

export interface CreateReportPayload {
  targetType: "post" | "comment" | "user";
  targetId: string;
  reason: string;
}

// ─── Feed Response ────────────────────────────────────────────────────────────

export interface SbnFeedPage {
  posts: SbnPost[];
  nextCursor: string | null;
  total: number;
}

// ─── Reaction Helpers ─────────────────────────────────────────────────────────

export const REACTION_EMOJI: Record<SbnReactionType, string> = {
  like:       "👍",
  love:       "❤️",
  funny:      "😂",
  wow:        "😮",
  frustrated: "😤",
};

export const REACTION_LABEL: Record<SbnReactionType, string> = {
  like:       "Like",
  love:       "Love",
  funny:      "Funny",
  wow:        "Wow",
  frustrated: "Frustrated",
};

export function getTotalReactions(post: SbnPost): number {
  return (
    post.likeCount +
    post.loveCount +
    post.funnyCount +
    post.wowCount +
    post.frustratedCount
  );
}

export function getTopReaction(post: SbnPost): SbnReactionType | null {
  const counts: [SbnReactionType, number][] = [
    ["like",       post.likeCount],
    ["love",       post.loveCount],
    ["funny",      post.funnyCount],
    ["wow",        post.wowCount],
    ["frustrated", post.frustratedCount],
  ];
  const top = counts.sort((a, b) => b[1] - a[1])[0];
  return top[1] > 0 ? top[0] : null;
}

// ─── Base API Fetch Helper ────────────────────────────────────────────────────

const BASE = "/api/sbn";

async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? "API error");
  }
  return res.json() as Promise<T>;
}

// ─── Feed ─────────────────────────────────────────────────────────────────────

export const sbnApi = {
  feed: {
    getPublic: (cursor?: string) =>
      apiFetch<SbnFeedPage>(`/feed?${cursor ? `cursor=${cursor}` : ""}`),
    getFollowing: (cursor?: string) =>
      apiFetch<SbnFeedPage>(`/feed/following?${cursor ? `cursor=${cursor}` : ""}`),
  },

  posts: {
    getById: (postId: string) =>
      apiFetch<SbnPost>(`/posts/${postId}`),
    create: (payload: CreatePostPayload) =>
      apiFetch<SbnPost>("/posts", { method: "POST", body: JSON.stringify(payload) }),
    delete: (postId: string) =>
      apiFetch<void>(`/posts/${postId}`, { method: "DELETE" }),
    react: (payload: ReactToPostPayload) =>
      apiFetch<void>("/posts/react", { method: "POST", body: JSON.stringify(payload) }),
    unreact: (postId: string) =>
      apiFetch<void>(`/posts/${postId}/react`, { method: "DELETE" }),
    save: (postId: string) =>
      apiFetch<void>(`/posts/${postId}/save`, { method: "POST" }),
    unsave: (postId: string) =>
      apiFetch<void>(`/posts/${postId}/save`, { method: "DELETE" }),
    getSaved: () =>
      apiFetch<SbnPost[]>("/posts/saved"),
  },

  comments: {
    getForPost: (postId: string) =>
      apiFetch<SbnComment[]>(`/posts/${postId}/comments`),
    create: (payload: CreateCommentPayload) =>
      apiFetch<SbnComment>("/comments", { method: "POST", body: JSON.stringify(payload) }),
    delete: (commentId: string) =>
      apiFetch<void>(`/comments/${commentId}`, { method: "DELETE" }),
    react: (payload: ReactToCommentPayload) =>
      apiFetch<void>("/comments/react", { method: "POST", body: JSON.stringify(payload) }),
  },

  profiles: {
    getByUsername: (username: string) =>
      apiFetch<SbnProfile>(`/profiles/${username}`),
    getMyProfile: () =>
      apiFetch<SbnProfile>("/profiles/me"),
    update: (data: Partial<SbnProfile>) =>
      apiFetch<SbnProfile>("/profiles/me", { method: "PATCH", body: JSON.stringify(data) }),
  },

  follows: {
    follow: (userId: string) =>
      apiFetch<void>(`/follows/${userId}`, { method: "POST" }),
    unfollow: (userId: string) =>
      apiFetch<void>(`/follows/${userId}`, { method: "DELETE" }),
    getFollowers: (userId: string) =>
      apiFetch<SbnProfile[]>(`/follows/${userId}/followers`),
    getFollowing: (userId: string) =>
      apiFetch<SbnProfile[]>(`/follows/${userId}/following`),
  },

  notifications: {
    getAll: () =>
      apiFetch<SbnNotification[]>("/notifications"),
    markRead: (notificationId: string) =>
      apiFetch<void>(`/notifications/${notificationId}/read`, { method: "PATCH" }),
    markAllRead: () =>
      apiFetch<void>("/notifications/read-all", { method: "PATCH" }),
  },

  messages: {
    getConversations: () =>
      apiFetch<SbnConversation[]>("/conversations"),
    getMessages: (conversationId: string) =>
      apiFetch<SbnMessage[]>(`/conversations/${conversationId}/messages`),
    send: (payload: SendMessagePayload) =>
      apiFetch<SbnMessage>("/messages", { method: "POST", body: JSON.stringify(payload) }),
    startDirect: (userId: string) =>
      apiFetch<SbnConversation>("/conversations/direct", { method: "POST", body: JSON.stringify({ userId }) }),
  },

  groups: {
    getAll: () =>
      apiFetch<SbnGroup[]>("/groups"),
    getBySlug: (slug: string) =>
      apiFetch<SbnGroup>(`/groups/${slug}`),
    join: (groupId: string) =>
      apiFetch<void>(`/groups/${groupId}/join`, { method: "POST" }),
    leave: (groupId: string) =>
      apiFetch<void>(`/groups/${groupId}/leave`, { method: "POST" }),
    getMembers: (groupId: string) =>
      apiFetch<SbnGroupMember[]>(`/groups/${groupId}/members`),
  },

  announcements: {
    getActive: () =>
      apiFetch<SbnAnnouncement[]>("/announcements"),
  },

  moderation: {
    report: (payload: CreateReportPayload) =>
      apiFetch<void>("/reports", { method: "POST", body: JSON.stringify(payload) }),
    getReports: () =>
      apiFetch<SbnReport[]>("/admin/reports"),
    reviewReport: (reportId: string, status: SbnReportStatus, notes?: string) =>
      apiFetch<void>(`/admin/reports/${reportId}`, {
        method: "PATCH",
        body: JSON.stringify({ status, notes }),
      }),
    banUser: (userId: string, reason: string, expiresAt?: string) =>
      apiFetch<void>(`/admin/bans`, {
        method: "POST",
        body: JSON.stringify({ userId, reason, expiresAt }),
      }),
    liftBan: (banId: string) =>
      apiFetch<void>(`/admin/bans/${banId}/lift`, { method: "PATCH" }),
    getLogs: () =>
      apiFetch<SbnModerationLog[]>("/admin/moderation-logs"),
  },

  search: {
    posts: (q: string) =>
      apiFetch<SbnPost[]>(`/search/posts?q=${encodeURIComponent(q)}`),
    users: (q: string) =>
      apiFetch<SbnProfile[]>(`/search/users?q=${encodeURIComponent(q)}`),
    hashtag: (tag: string) =>
      apiFetch<SbnPost[]>(`/search/hashtag/${encodeURIComponent(tag)}`),
  },
};
