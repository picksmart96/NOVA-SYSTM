import { create } from "zustand";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BreakingNewsUser {
  id: string;
  name: string;
  handle: string;
  level: string;
  bio: string;
  avatar: string;
  followers: string[];
  following: string[];
  postsCount: number;
  isOnline: boolean;
  statusText: string;
  role: string;
  isBanned: boolean;
}

export interface Comment {
  id: string;
  authorId: string;
  text: string;
  createdAt: number;
}

export interface Report {
  id: string;
  userId: string;
  reason: string;
  createdAt: number;
}

export interface Post {
  id: string;
  authorId: string;
  content: string;
  imageUrl: string;
  hashtags: string[];
  createdAt: number;
  reactions: {
    like: string[];
    love: string[];
    funny: string[];
    wow: string[];
    frustrated: string[];
  };
  comments: Comment[];
  savedBy: string[];
  reports: Report[];
}

interface Store {
  currentUserId: string;
  users: BreakingNewsUser[];
  posts: Post[];
  setCurrentUser: (userId: string) => void;
  createPost: (args: { content: string; imageUrl?: string; hashtags?: string[] }) => void;
  addComment: (postId: string, text: string) => void;
  toggleReaction: (postId: string, type: keyof Post["reactions"]) => void;
  toggleSavePost: (postId: string) => void;
  reportPost: (postId: string, reason?: string) => void;
  followUser: (targetUserId: string) => void;
  deletePost: (postId: string) => void;
  getCurrentUser: () => BreakingNewsUser | undefined;
  getUserById: (userId: string) => BreakingNewsUser | undefined;
  getFeedPosts: () => Post[];
  getSavedPosts: () => Post[];
  getSuggestedMembers: () => BreakingNewsUser[];
  getOnlineUsers: () => BreakingNewsUser[];
  getTrendingHashtags: () => string[];
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const initialUsers: BreakingNewsUser[] = [
  {
    id: "user-001",
    name: "Soumaila Ouedraogo",
    handle: "@soumaila",
    level: "Pro Selector",
    bio: "We are here to help.",
    avatar: "",
    followers: [],
    following: [],
    postsCount: 0,
    isOnline: true,
    statusText: "Ready to chat",
    role: "selector",
    isBanned: false,
  },
  {
    id: "user-002",
    name: "Marcus Hill",
    handle: "@nightshiftmarcus",
    level: "Pro Selector",
    bio: "Night shift. Clean pallets. Strong rate.",
    avatar: "",
    followers: [],
    following: [],
    postsCount: 1,
    isOnline: true,
    statusText: "Ready to chat",
    role: "selector",
    isBanned: false,
  },
  {
    id: "user-003",
    name: "Tasha Green",
    handle: "@stackqueen",
    level: "Intermediate",
    bio: "Stack clean. Move fast. Stay safe.",
    avatar: "",
    followers: [],
    following: [],
    postsCount: 1,
    isOnline: true,
    statusText: "Ready to chat",
    role: "selector",
    isBanned: false,
  },
  {
    id: "user-004",
    name: "Andre Lewis",
    handle: "@andrebuilds",
    level: "Beginner",
    bio: "Learning every shift.",
    avatar: "",
    followers: [],
    following: [],
    postsCount: 0,
    isOnline: false,
    statusText: "",
    role: "selector",
    isBanned: false,
  },
];

const initialPosts: Post[] = [
  {
    id: "post-001",
    authorId: "user-002",
    content:
      "Best stacking advice for new selectors: build a square base first, keep heavy items low, and don't rush the wrap. Clean pallets save time later. 💪",
    imageUrl: "",
    hashtags: ["#stackingtips", "#selectorlife"],
    createdAt: Date.now() - 1000 * 60 * 60 * 6,
    reactions: {
      like: ["user-001"],
      love: ["user-003"],
      funny: [],
      wow: [],
      frustrated: [],
    },
    comments: [
      {
        id: "comment-001",
        authorId: "user-003",
        text: "Facts 🔥 This helps your rate and keeps the load safer.",
        createdAt: Date.now() - 1000 * 60 * 60 * 5,
      },
      {
        id: "comment-002",
        authorId: "user-004",
        text: "I needed this. My first pallets were terrible 😅",
        createdAt: Date.now() - 1000 * 60 * 60 * 4,
      },
    ],
    savedBy: [],
    reports: [],
  },
  {
    id: "post-002",
    authorId: "user-003",
    content:
      "What headset commands helped you learn faster? Mine were Ready, Repeat, and Short. Drop yours below. 🎧",
    imageUrl: "",
    hashtags: ["#voicepicking", "#warehousewins"],
    createdAt: Date.now() - 1000 * 60 * 60 * 11,
    reactions: {
      like: ["user-001"],
      love: [],
      funny: [],
      wow: [],
      frustrated: [],
    },
    comments: [],
    savedBy: [],
    reports: [],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uid(prefix = "id") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useSelectorBreakingNewsStore = create<Store>((set, get) => ({
  currentUserId: "user-001",
  users: initialUsers,
  posts: initialPosts,

  setCurrentUser: (userId) => set({ currentUserId: userId }),

  createPost: ({ content, imageUrl = "", hashtags = [] }) =>
    set((state) => {
      if (!content.trim()) return state;
      const post: Post = {
        id: uid("post"),
        authorId: state.currentUserId,
        content: content.trim(),
        imageUrl: imageUrl.trim(),
        hashtags: hashtags.filter(Boolean),
        createdAt: Date.now(),
        reactions: { like: [], love: [], funny: [], wow: [], frustrated: [] },
        comments: [],
        savedBy: [],
        reports: [],
      };
      return {
        posts: [post, ...state.posts],
        users: state.users.map((u) =>
          u.id === state.currentUserId ? { ...u, postsCount: (u.postsCount || 0) + 1 } : u
        ),
      };
    }),

  addComment: (postId, text) =>
    set((state) => {
      if (!text.trim()) return state;
      return {
        posts: state.posts.map((post) =>
          post.id === postId
            ? {
                ...post,
                comments: [
                  ...post.comments,
                  { id: uid("comment"), authorId: state.currentUserId, text: text.trim(), createdAt: Date.now() },
                ],
              }
            : post
        ),
      };
    }),

  toggleReaction: (postId, type) =>
    set((state) => ({
      posts: state.posts.map((post) => {
        if (post.id !== postId) return post;
        const updated = { ...post.reactions } as Post["reactions"];
        (Object.keys(updated) as (keyof Post["reactions"])[]).forEach((k) => {
          updated[k] = updated[k].filter((id) => id !== state.currentUserId);
        });
        if (!post.reactions[type]?.includes(state.currentUserId)) {
          updated[type] = [...(updated[type] || []), state.currentUserId];
        }
        return { ...post, reactions: updated };
      }),
    })),

  toggleSavePost: (postId) =>
    set((state) => ({
      posts: state.posts.map((post) => {
        if (post.id !== postId) return post;
        const saved = post.savedBy.includes(state.currentUserId)
          ? post.savedBy.filter((id) => id !== state.currentUserId)
          : [...post.savedBy, state.currentUserId];
        return { ...post, savedBy: saved };
      }),
    })),

  reportPost: (postId, reason = "Reported by user") =>
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              reports: post.reports.some((r) => r.userId === state.currentUserId)
                ? post.reports
                : [
                    ...post.reports,
                    { id: uid("report"), userId: state.currentUserId, reason, createdAt: Date.now() },
                  ],
            }
          : post
      ),
    })),

  followUser: (targetUserId) =>
    set((state) => {
      const me = state.users.find((u) => u.id === state.currentUserId);
      if (!me || targetUserId === state.currentUserId) return state;
      const alreadyFollowing = me.following.includes(targetUserId);
      return {
        users: state.users.map((u) => {
          if (u.id === state.currentUserId) {
            return {
              ...u,
              following: alreadyFollowing
                ? u.following.filter((id) => id !== targetUserId)
                : [...u.following, targetUserId],
            };
          }
          if (u.id === targetUserId) {
            return {
              ...u,
              followers: alreadyFollowing
                ? u.followers.filter((id) => id !== state.currentUserId)
                : [...u.followers, state.currentUserId],
            };
          }
          return u;
        }),
      };
    }),

  deletePost: (postId) =>
    set((state) => {
      const post = state.posts.find((p) => p.id === postId);
      if (!post) return state;
      return {
        posts: state.posts.filter((p) => p.id !== postId),
        users: state.users.map((u) =>
          u.id === post.authorId ? { ...u, postsCount: Math.max((u.postsCount || 1) - 1, 0) } : u
        ),
      };
    }),

  getCurrentUser: () => {
    const state = get();
    return state.users.find((u) => u.id === state.currentUserId);
  },

  getUserById: (userId) => {
    const state = get();
    return state.users.find((u) => u.id === userId);
  },

  getFeedPosts: () => {
    const state = get();
    return [...state.posts].sort((a, b) => b.createdAt - a.createdAt);
  },

  getSavedPosts: () => {
    const state = get();
    return state.posts.filter((p) => p.savedBy.includes(state.currentUserId));
  },

  getSuggestedMembers: () => {
    const state = get();
    const me = state.users.find((u) => u.id === state.currentUserId);
    return state.users.filter(
      (u) => u.id !== state.currentUserId && !me?.following.includes(u.id) && !u.isBanned
    );
  },

  getOnlineUsers: () => {
    const state = get();
    return state.users.filter((u) => u.isOnline && !u.isBanned && u.id !== state.currentUserId);
  },

  getTrendingHashtags: () => {
    const state = get();
    const counts: Record<string, number> = {};
    state.posts.forEach((post) => {
      post.hashtags.forEach((tag) => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag]) => tag);
  },
}));
