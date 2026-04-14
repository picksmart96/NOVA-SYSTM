import { Router } from "express";
import { db, sbnUsers, sbnProfiles, sbnPosts, sbnPostReactions, sbnPostHashtags, sbnComments, sbnConversations, sbnConversationMembers, sbnMessages, sbnPerformanceLogs } from "@workspace/db";
import { eq, and, desc, asc, or, count, sql } from "drizzle-orm";

const router = Router();

// ── helpers ──────────────────────────────────────────────────────────────────

function genNovaId() {
  const num = Math.floor(10000 + Math.random() * 90000);
  return `#SL-${num}`;
}

function computeBadge(rate: number, accuracy: number) {
  if (rate >= 110) return "🔥 Elite Selector";
  if (rate >= 100) return "💪 Top Performer";
  if (accuracy >= 99) return "🎯 Accuracy Master";
  return "";
}

async function findOrCreateSbnUser(email: string, fullName: string, username: string) {
  let user = await db.query.sbnUsers.findFirst({ where: eq(sbnUsers.email, email) });
  if (!user) {
    const [u] = await db.insert(sbnUsers).values({ email }).returning();
    user = u;
    const novaId = genNovaId();
    await db.insert(sbnProfiles).values({
      userId: user.id,
      fullName,
      username,
      novaId,
    });
  }
  return user;
}

async function getPostWithAuthor(postId: string) {
  const post = await db.query.sbnPosts.findFirst({
    where: eq(sbnPosts.id, postId),
  });
  if (!post) return null;
  const profile = await db.query.sbnProfiles.findFirst({
    where: eq(sbnProfiles.userId, post.authorUserId),
  });
  return { ...post, profile };
}

// ── FEED ─────────────────────────────────────────────────────────────────────

router.get("/social/feed", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const posts = await db
      .select()
      .from(sbnPosts)
      .where(and(eq(sbnPosts.status, "approved"), eq(sbnPosts.isDeleted, false)))
      .orderBy(desc(sbnPosts.isPinned), desc(sbnPosts.createdAt))
      .limit(limit)
      .offset(offset);

    const enriched = await Promise.all(posts.map(async (post) => {
      const profile = await db.query.sbnProfiles.findFirst({
        where: eq(sbnProfiles.userId, post.authorUserId),
      });
      const hashtags = await db.query.sbnPostHashtags.findMany({
        where: eq(sbnPostHashtags.postId, post.id),
      });
      return { ...post, profile, hashtags: hashtags.map(h => h.hashtag) };
    }));

    res.json({ posts: enriched });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load feed" });
  }
});

// ── CREATE POST ───────────────────────────────────────────────────────────────

router.post("/social/posts", async (req, res) => {
  try {
    const { content, email, fullName, username, hashtags = [] } = req.body;
    if (!content || !email || !fullName) {
      return res.status(400).json({ error: "content, email, fullName required" });
    }

    const user = await findOrCreateSbnUser(email, fullName, username || fullName.toLowerCase().replace(/\s+/g, "_"));

    const [post] = await db.insert(sbnPosts).values({
      authorUserId: user.id,
      content,
      status: "pending",
    }).returning();

    if (hashtags.length > 0) {
      await db.insert(sbnPostHashtags).values(
        hashtags.map((h: string) => ({ postId: post.id, hashtag: h.startsWith("#") ? h : `#${h}` }))
      );
    }

    res.json({ post, message: "Post submitted for review" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create post" });
  }
});

// ── REACTIONS ─────────────────────────────────────────────────────────────────

router.post("/social/posts/:id/react", async (req, res) => {
  try {
    const { id } = req.params;
    const { reactionType, email, fullName } = req.body;
    if (!reactionType || !email) return res.status(400).json({ error: "reactionType and email required" });

    const user = await findOrCreateSbnUser(email, fullName || "Anonymous", email.split("@")[0]);

    const existing = await db.query.sbnPostReactions.findFirst({
      where: and(eq(sbnPostReactions.postId, id), eq(sbnPostReactions.userId, user.id)),
    });

    const colMap: Record<string, any> = {
      like: sbnPosts.likeCount, love: sbnPosts.loveCount,
      funny: sbnPosts.funnyCount, wow: sbnPosts.wowCount, frustrated: sbnPosts.frustratedCount,
    };
    const col = colMap[reactionType] || sbnPosts.likeCount;

    if (existing) {
      await db.delete(sbnPostReactions).where(eq(sbnPostReactions.id, existing.id));
      await db.update(sbnPosts).set({ [reactionType + "Count"]: sql`${col} - 1` }).where(eq(sbnPosts.id, id));
      res.json({ toggled: false });
    } else {
      await db.insert(sbnPostReactions).values({ postId: id, userId: user.id, reactionType });
      await db.update(sbnPosts).set({ [reactionType + "Count"]: sql`${col} + 1` }).where(eq(sbnPosts.id, id));
      res.json({ toggled: true });
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to react" });
  }
});

// ── COMMENTS ─────────────────────────────────────────────────────────────────

router.get("/social/posts/:id/comments", async (req, res) => {
  try {
    const { id } = req.params;
    const comments = await db
      .select()
      .from(sbnComments)
      .where(and(eq(sbnComments.postId, id), eq(sbnComments.isDeleted, false)))
      .orderBy(asc(sbnComments.createdAt));

    const enriched = await Promise.all(comments.map(async (c) => {
      const profile = await db.query.sbnProfiles.findFirst({ where: eq(sbnProfiles.userId, c.authorUserId) });
      return { ...c, profile };
    }));

    res.json({ comments: enriched });
  } catch (e) {
    res.status(500).json({ error: "Failed to load comments" });
  }
});

router.post("/social/posts/:id/comments", async (req, res) => {
  try {
    const { id } = req.params;
    const { content, email, fullName } = req.body;
    if (!content || !email) return res.status(400).json({ error: "content and email required" });

    const user = await findOrCreateSbnUser(email, fullName || "Anonymous", email.split("@")[0]);
    const [comment] = await db.insert(sbnComments).values({
      postId: id, authorUserId: user.id, content,
    }).returning();

    await db.update(sbnPosts).set({ commentsCount: sql`${sbnPosts.commentsCount} + 1` }).where(eq(sbnPosts.id, id));

    res.json({ comment });
  } catch (e) {
    res.status(500).json({ error: "Failed to add comment" });
  }
});

// ── MODERATION (owner) ────────────────────────────────────────────────────────

router.get("/social/moderate/pending", async (req, res) => {
  try {
    const posts = await db
      .select()
      .from(sbnPosts)
      .where(and(eq(sbnPosts.status, "pending"), eq(sbnPosts.isDeleted, false)))
      .orderBy(asc(sbnPosts.createdAt));

    const enriched = await Promise.all(posts.map(async (post) => {
      const profile = await db.query.sbnProfiles.findFirst({ where: eq(sbnProfiles.userId, post.authorUserId) });
      return { ...post, profile };
    }));

    res.json({ posts: enriched, count: enriched.length });
  } catch (e) {
    res.status(500).json({ error: "Failed to load pending posts" });
  }
});

router.post("/social/moderate/posts/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;
    await db.update(sbnPosts).set({
      status: "approved",
      approvedBy: "OWNER",
      approvedAt: new Date(),
    }).where(eq(sbnPosts.id, id));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to approve" });
  }
});

router.post("/social/moderate/posts/:id/reject", async (req, res) => {
  try {
    const { id } = req.params;
    await db.update(sbnPosts).set({ status: "rejected" }).where(eq(sbnPosts.id, id));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to reject" });
  }
});

// ── LEADERBOARD ───────────────────────────────────────────────────────────────

router.get("/social/leaderboard", async (req, res) => {
  try {
    const period = (req.query.period as string) || "weekly";
    const limit = parseInt(req.query.limit as string) || 10;

    let since = new Date();
    if (period === "daily") since.setDate(since.getDate() - 1);
    else if (period === "weekly") since.setDate(since.getDate() - 7);
    else since = new Date(0);

    const rows = await db
      .select({
        userId: sbnPerformanceLogs.userId,
        avgRate: sql<number>`ROUND(AVG(${sbnPerformanceLogs.rate}::numeric), 1)`,
        totalCases: sql<number>`SUM(${sbnPerformanceLogs.casesPicked})`,
        avgAccuracy: sql<number>`ROUND(AVG(${sbnPerformanceLogs.accuracy}::numeric), 1)`,
        warehouseId: sbnPerformanceLogs.warehouseId,
      })
      .from(sbnPerformanceLogs)
      .where(sql`${sbnPerformanceLogs.createdAt} >= ${since}`)
      .groupBy(sbnPerformanceLogs.userId, sbnPerformanceLogs.warehouseId)
      .orderBy(sql`AVG(${sbnPerformanceLogs.rate}::numeric) DESC`)
      .limit(limit);

    const enriched = await Promise.all(rows.map(async (row, i) => {
      const profile = await db.query.sbnProfiles.findFirst({ where: eq(sbnProfiles.userId, row.userId) });
      const badge = computeBadge(Number(row.avgRate), Number(row.avgAccuracy));
      return { rank: i + 1, ...row, profile, badge };
    }));

    res.json({ leaderboard: enriched, period });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load leaderboard" });
  }
});

router.post("/social/performance", async (req, res) => {
  try {
    const { email, fullName, rate, casesPicked, accuracy, shift, warehouseId } = req.body;
    if (!email || rate == null) return res.status(400).json({ error: "email and rate required" });

    const user = await findOrCreateSbnUser(email, fullName || "Anonymous", email.split("@")[0]);
    const [log] = await db.insert(sbnPerformanceLogs).values({
      userId: user.id,
      rate: String(rate),
      casesPicked: casesPicked || 0,
      accuracy: String(accuracy || 100),
      shift: shift || "day",
      warehouseId: warehouseId || "A",
    }).returning();

    const badge = computeBadge(Number(rate), Number(accuracy || 100));
    if (badge) {
      await db.update(sbnProfiles).set({ performanceBadge: badge }).where(eq(sbnProfiles.userId, user.id));
    }

    res.json({ log, badge });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to log performance" });
  }
});

// ── PROFILE ───────────────────────────────────────────────────────────────────

router.get("/social/profile/:userId", async (req, res) => {
  try {
    const profile = await db.query.sbnProfiles.findFirst({ where: eq(sbnProfiles.userId, req.params.userId) });
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    const allLogs = await db.select({
      avgRate: sql<number>`ROUND(AVG(${sbnPerformanceLogs.rate}::numeric), 1)`,
      totalCases: sql<number>`SUM(${sbnPerformanceLogs.casesPicked})`,
      avgAccuracy: sql<number>`ROUND(AVG(${sbnPerformanceLogs.accuracy}::numeric), 1)`,
    }).from(sbnPerformanceLogs).where(eq(sbnPerformanceLogs.userId, req.params.userId));

    const stats = allLogs[0] || { avgRate: 0, totalCases: 0, avgAccuracy: 100 };

    const [totalUsers] = await db.select({ cnt: count() }).from(sbnProfiles);
    const [higherCount] = await db.select({ cnt: count() }).from(sbnPerformanceLogs)
      .where(sql`${sbnPerformanceLogs.rate}::numeric > ${stats.avgRate}`);

    const rankPct = totalUsers.cnt > 0 ? Math.round((1 - Number(higherCount.cnt) / totalUsers.cnt) * 100) : 100;
    const badge = computeBadge(Number(stats.avgRate), Number(stats.avgAccuracy));

    res.json({ profile, stats, rankPct, badge });
  } catch (e) {
    res.status(500).json({ error: "Failed to load profile" });
  }
});

// ── CONVERSATIONS / DM ────────────────────────────────────────────────────────

router.get("/social/conversations", async (req, res) => {
  try {
    const { email } = req.query as { email: string };
    if (!email) return res.status(400).json({ error: "email required" });

    const user = await db.query.sbnUsers.findFirst({ where: eq(sbnUsers.email, email) });
    if (!user) return res.json({ conversations: [] });

    const memberships = await db.query.sbnConversationMembers.findMany({
      where: eq(sbnConversationMembers.userId, user.id),
    });

    const convos = await Promise.all(memberships.map(async (m) => {
      const lastMsg = await db.query.sbnMessages.findFirst({
        where: eq(sbnMessages.conversationId, m.conversationId),
        orderBy: [desc(sbnMessages.createdAt)],
      });
      const otherMembers = await db.query.sbnConversationMembers.findMany({
        where: and(eq(sbnConversationMembers.conversationId, m.conversationId),
          sql`${sbnConversationMembers.userId} != ${user.id}`),
      });
      const profiles = await Promise.all(otherMembers.map(om =>
        db.query.sbnProfiles.findFirst({ where: eq(sbnProfiles.userId, om.userId) })
      ));
      return { conversationId: m.conversationId, lastMsg, otherProfiles: profiles.filter(Boolean) };
    }));

    res.json({ conversations: convos });
  } catch (e) {
    res.status(500).json({ error: "Failed to load conversations" });
  }
});

router.get("/social/conversations/:id/messages", async (req, res) => {
  try {
    const msgs = await db.query.sbnMessages.findMany({
      where: and(eq(sbnMessages.conversationId, req.params.id), eq(sbnMessages.isDeleted, false)),
      orderBy: [asc(sbnMessages.createdAt)],
    });
    const enriched = await Promise.all(msgs.map(async (m) => {
      const profile = await db.query.sbnProfiles.findFirst({ where: eq(sbnProfiles.userId, m.senderUserId) });
      return { ...m, profile };
    }));
    res.json({ messages: enriched });
  } catch (e) {
    res.status(500).json({ error: "Failed to load messages" });
  }
});

router.post("/social/conversations/:id/messages", async (req, res) => {
  try {
    const { content, email, voiceUrl = "" } = req.body;
    if (!email) return res.status(400).json({ error: "email required" });
    const user = await db.query.sbnUsers.findFirst({ where: eq(sbnUsers.email, email) });
    if (!user) return res.status(404).json({ error: "User not found" });

    const [msg] = await db.insert(sbnMessages).values({
      conversationId: req.params.id,
      senderUserId: user.id,
      content: content || "",
      voiceUrl,
    }).returning();
    res.json({ message: msg });
  } catch (e) {
    res.status(500).json({ error: "Failed to send message" });
  }
});

export default router;
