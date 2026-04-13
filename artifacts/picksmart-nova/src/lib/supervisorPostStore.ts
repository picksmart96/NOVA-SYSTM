import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SupervisorPost {
  id: string;
  createdAt: string;
  postedBy: string;
  shiftSummary: string;
  safetyTopic: string;
  workloadUpdate: string;
  topSelectorName: string;
  topSelectorRate: string;
  selectorMessage: string;
}

interface SupervisorPostState {
  posts: SupervisorPost[];
  addPost: (data: Omit<SupervisorPost, "id" | "createdAt">) => void;
  deletePost: (id: string) => void;
  latestPost: () => SupervisorPost | null;
}

export const useSupervisorPostStore = create<SupervisorPostState>()(
  persist(
    (set, get) => ({
      posts: [],

      addPost: (data) => {
        const post: SupervisorPost = {
          id: `sp-${Date.now()}`,
          createdAt: new Date().toISOString(),
          ...data,
        };
        set((s) => ({ posts: [post, ...s.posts] }));
      },

      deletePost: (id) => {
        set((s) => ({ posts: s.posts.filter((p) => p.id !== id) }));
      },

      latestPost: () => {
        const posts = get().posts;
        return posts.length > 0 ? posts[0] : null;
      },
    }),
    { name: "psa-supervisor-posts" }
  )
);
