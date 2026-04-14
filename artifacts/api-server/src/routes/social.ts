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

// ── WEEKLY REPORTS ────────────────────────────────────────────────────────────

router.get("/social/weekly-reports", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const publishedOnly = req.query.published === "true";
    const reports = await db.execute(sql`
      SELECT r.id, r.warehouse_name, r.warehouse_country, r.warehouse_state,
             r.week, r.created_at, r.is_published, r.submitted_by, r.submitted_by_name,
             json_agg(s.* ORDER BY s.rank ASC) AS top_selectors
      FROM sbn_weekly_reports r
      LEFT JOIN sbn_weekly_top_selectors s ON s.report_id = r.id
      ${publishedOnly ? sql`WHERE r.is_published = TRUE` : sql``}
      GROUP BY r.id
      ORDER BY r.created_at DESC
      LIMIT ${limit}
    `);
    res.json({ reports: reports.rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load weekly reports" });
  }
});

router.post("/social/weekly-reports", async (req, res) => {
  try {
    const { warehouseName, warehouseCountry, warehouseState, week, selectors, submittedBy, submittedByName } = req.body;
    if (!warehouseName || !week || !Array.isArray(selectors)) {
      return res.status(400).json({ error: "warehouseName, week, and selectors[] required" });
    }
    const rows = await db.execute(sql`
      INSERT INTO sbn_weekly_reports (warehouse_name, warehouse_country, warehouse_state, week, submitted_by, submitted_by_name)
      VALUES (${warehouseName}, ${warehouseCountry || ""}, ${warehouseState || ""}, ${week}, ${submittedBy || null}, ${submittedByName || ""})
      RETURNING id, warehouse_name, warehouse_country, warehouse_state, week, created_at, is_published
    `);
    const report = (rows as any).rows?.[0];
    if (!report?.id) return res.status(500).json({ error: "Failed to create report" });

    for (let i = 0; i < Math.min(selectors.length, 5); i++) {
      const s = selectors[i];
      await db.execute(sql`
        INSERT INTO sbn_weekly_top_selectors (report_id, selector_name, rank, cases_picked, hours_worked, rate)
        VALUES (${report.id}, ${s.name || "Unknown"}, ${i + 1}, ${s.cases || 0}, ${s.hours || 0}, ${s.rate || 0})
      `);
    }

    res.json({ report, message: "Weekly report submitted" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to submit weekly report" });
  }
});

router.patch("/social/weekly-reports/:id/publish", async (req, res) => {
  try {
    const { id } = req.params;
    const { publish } = req.body;
    const isPublished = publish !== false;
    await db.execute(sql`
      UPDATE sbn_weekly_reports SET is_published = ${isPublished} WHERE id = ${parseInt(id)}
    `);
    res.json({ success: true, is_published: isPublished });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update publish status" });
  }
});

router.delete("/social/weekly-reports/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute(sql`DELETE FROM sbn_weekly_top_selectors WHERE report_id = ${parseInt(id)}`);
    await db.execute(sql`DELETE FROM sbn_weekly_reports WHERE id = ${parseInt(id)}`);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to delete report" });
  }
});

// ── GOLD STATUS ───────────────────────────────────────────────────────────────

router.post("/social/check-gold", async (req, res) => {
  try {
    const { email, month } = req.body;
    if (!email || !month) return res.status(400).json({ error: "email and month required" });

    const user = await db.query.sbnUsers.findFirst({ where: eq(sbnUsers.email, email) });
    if (!user) return res.status(404).json({ error: "User not found" });

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [stats] = await db.select({
      avgRate: sql<number>`ROUND(AVG(${sbnPerformanceLogs.rate}::numeric), 1)`,
      avgAccuracy: sql<number>`ROUND(AVG(${sbnPerformanceLogs.accuracy}::numeric), 1)`,
      totalHours: sql<number>`SUM(${sbnPerformanceLogs.casesPicked}::numeric * 0.01)`,
    }).from(sbnPerformanceLogs)
      .where(and(
        eq(sbnPerformanceLogs.userId, user.id),
        sql`${sbnPerformanceLogs.createdAt} >= ${monthStart}`,
      ));

    const rate = Number(stats?.avgRate || 0);
    const accuracy = Number(stats?.avgAccuracy || 100);
    const hours = Number(stats?.totalHours || 0);
    const achieved = rate >= 100 && accuracy >= 95 && hours >= 80;

    await db.execute(sql`
      INSERT INTO sbn_monthly_gold (user_id, month, achieved)
      VALUES (${user.id}, ${month}, ${achieved})
      ON CONFLICT (user_id, month) DO UPDATE SET achieved = EXCLUDED.achieved
    `);

    res.json({ achieved, rate, accuracy, hours, month });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to check gold status" });
  }
});

router.get("/social/gold-achievers", async (req, res) => {
  try {
    const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);
    const rows = await db.execute(sql`
      SELECT g.*, p.full_name, p.nova_id, p.performance_badge, p.country
      FROM sbn_monthly_gold g
      JOIN sbn_profiles p ON p.user_id = g.user_id
      WHERE g.month = ${month} AND g.achieved = true
      ORDER BY g.created_at ASC
    `);
    res.json({ achievers: (rows as any).rows || [], month });
  } catch (e) {
    res.status(500).json({ error: "Failed to load gold achievers" });
  }
});

// ── REFERRALS ─────────────────────────────────────────────────────────────────

function genReferralCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

router.get("/social/referrals", async (req, res) => {
  try {
    const { email } = req.query as { email: string };
    if (!email) return res.status(400).json({ error: "email required" });

    const user = await db.query.sbnUsers.findFirst({ where: eq(sbnUsers.email, email) });
    if (!user) return res.json({ referralCode: null, referrals: [], totalInvites: 0 });

    let profile = await db.query.sbnProfiles.findFirst({ where: eq(sbnProfiles.userId, user.id) });
    if (!profile) return res.json({ referralCode: null, referrals: [], totalInvites: 0 });

    if (!profile.referralCode) {
      const code = genReferralCode();
      await db.update(sbnProfiles).set({ referralCode: code }).where(eq(sbnProfiles.userId, user.id));
      profile = { ...profile, referralCode: code };
    }

    const referrals = await db.execute(sql`
      SELECT r.*, true as joined FROM sbn_referrals r WHERE r.referrer_user_id = ${user.id}
      ORDER BY r.created_at DESC
    `);

    res.json({
      referralCode: profile.referralCode,
      referralLink: `https://picksmartacademy.net/join?ref=${profile.referralCode}`,
      referrals: (referrals as any).rows || [],
      totalInvites: (referrals as any).rows?.length || 0,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load referral info" });
  }
});

router.post("/social/referrals/invite", async (req, res) => {
  try {
    const { referrerEmail, invitedEmail } = req.body;
    if (!referrerEmail || !invitedEmail) return res.status(400).json({ error: "referrerEmail and invitedEmail required" });

    const referrer = await db.query.sbnUsers.findFirst({ where: eq(sbnUsers.email, referrerEmail) });
    if (!referrer) return res.status(404).json({ error: "Referrer not found" });

    await db.execute(sql`
      INSERT INTO sbn_referrals (referrer_user_id, referred_email, joined)
      VALUES (${referrer.id}, ${invitedEmail}, false)
      ON CONFLICT DO NOTHING
    `);

    res.json({ ok: true, message: "Invite tracked" });
  } catch (e) {
    res.status(500).json({ error: "Failed to track invite" });
  }
});

// ── COMPANY REFERRALS ─────────────────────────────────────────────────────────

router.get("/social/company-referrals", async (req, res) => {
  try {
    const rows = await db.execute(sql`
      SELECT * FROM company_referrals ORDER BY created_at DESC
    `);
    res.json({ referrals: (rows as any).rows || [] });
  } catch (e) {
    res.status(500).json({ error: "Failed to load company referrals" });
  }
});

router.post("/social/company-referrals", async (req, res) => {
  try {
    const { referrerCompanyName, referredCompanyName, referredCompanyEmail, dealId } = req.body;
    if (!referredCompanyName) return res.status(400).json({ error: "referredCompanyName required" });
    const rows = await db.execute(sql`
      INSERT INTO company_referrals (referrer_company_name, referred_company_name, referred_company_email, deal_id)
      VALUES (${referrerCompanyName || null}, ${referredCompanyName}, ${referredCompanyEmail || null}, ${dealId || null})
      RETURNING *
    `);
    res.json({ referral: (rows as any).rows?.[0] });
  } catch (e) {
    res.status(500).json({ error: "Failed to create company referral" });
  }
});

router.patch("/social/company-referrals/:id/reward", async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await db.execute(sql`
      UPDATE company_referrals
      SET reward_earned = true, payment_verified = true, reward_paid_at = now()
      WHERE id = ${id}
      RETURNING *
    `);
    res.json({ referral: (rows as any).rows?.[0] });
  } catch (e) {
    res.status(500).json({ error: "Failed to mark reward" });
  }
});

// ── FINANCE SUMMARY ────────────────────────────────────────────────────────────

router.get("/social/finance-summary", async (req, res) => {
  try {
    const leadsRows = await db.execute(sql`
      SELECT * FROM owner_leads ORDER BY created_at DESC
    `);
    const leads: any[] = (leadsRows as any).rows || [];

    const activeClients = leads.filter((l: any) => l.status === "active_client");
    const revenue = activeClients.reduce((sum: number, l: any) => sum + Number(l.contract_value || 0), 0);
    const monthlyRecurring = activeClients.reduce((sum: number, l: any) => {
      if (l.weekly_price) return sum + Number(l.weekly_price) * 4;
      if (l.contract_value) return sum + Number(l.contract_value) / 12;
      return sum;
    }, 0);

    const companyRefRows = await db.execute(sql`SELECT * FROM company_referrals`);
    const companyRefs: any[] = (companyRefRows as any).rows || [];

    const selectorRefRows = await db.execute(sql`SELECT * FROM sbn_referrals`);
    const selectorRefs: any[] = (selectorRefRows as any).rows || [];

    const rewardedCompany = companyRefs.filter((r: any) => r.reward_earned);
    const rewardedSelector = selectorRefs.filter((r: any) => r.reward_given);
    const payouts = rewardedCompany.length * 500 + rewardedSelector.length * 25;
    const profit = revenue - payouts;

    const monthKey = (d: string) => {
      if (!d) return "Unknown";
      const dt = new Date(d);
      return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    };

    const revenueByMonth: Record<string, number> = {};
    activeClients.forEach((c: any) => {
      const k = monthKey(c.contract_signed || c.created_at);
      revenueByMonth[k] = (revenueByMonth[k] || 0) + Number(c.contract_value || 0);
    });

    const payoutByMonth: Record<string, number> = {};
    rewardedCompany.forEach((r: any) => { const k = monthKey(r.created_at); payoutByMonth[k] = (payoutByMonth[k] || 0) + 500; });
    rewardedSelector.forEach((r: any) => { const k = monthKey(r.created_at); payoutByMonth[k] = (payoutByMonth[k] || 0) + 25; });

    res.json({
      revenue, payouts, profit, monthlyRecurring,
      activeClientCount: activeClients.length,
      pendingCount: leads.filter((l: any) => l.status !== "active_client" && l.status !== "closed_lost").length,
      paidCompanies: activeClients,
      rewardedCompanyReferrals: rewardedCompany,
      rewardedSelectorReferrals: rewardedSelector,
      allCompanyReferrals: companyRefs,
      allSelectorReferrals: selectorRefs,
      monthlyRevenue: Object.entries(revenueByMonth)
        .map(([month, amount]) => ({ month, amount }))
        .sort((a, b) => b.month.localeCompare(a.month)),
      monthlyPayouts: Object.entries(payoutByMonth)
        .map(([month, amount]) => ({ month, amount }))
        .sort((a, b) => b.month.localeCompare(a.month)),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load finance summary" });
  }
});

// ── WEEKLY EMAIL REPORT ────────────────────────────────────────────────────────

router.post("/social/finance-report-email", async (req, res) => {
  try {
    const leadsRows = await db.execute(sql`SELECT * FROM owner_leads WHERE status = 'active_client'`);
    const activeClients: any[] = (leadsRows as any).rows || [];
    const revenue = activeClients.reduce((s: number, c: any) => s + Number(c.contract_value || 0), 0);

    const companyRefRows = await db.execute(sql`SELECT * FROM company_referrals WHERE reward_earned = true`);
    const selectorRefRows = await db.execute(sql`SELECT * FROM sbn_referrals WHERE reward_given = true`);
    const payouts = ((companyRefRows as any).rows?.length || 0) * 500 + ((selectorRefRows as any).rows?.length || 0) * 25;
    const profit = revenue - payouts;

    const companyList = activeClients.map((c: any) => `${c.company_name} — $${Number(c.contract_value || 0).toLocaleString()}`).join("\n");

    const htmlBody = `
      <div style="font-family:sans-serif;color:#1e293b;max-width:600px;margin:0 auto">
        <div style="background:#0f172a;padding:24px;border-radius:12px;margin-bottom:16px">
          <h1 style="color:#facc15;font-size:24px;margin:0">⚡ NOVA Weekly Finance Report</h1>
          <p style="color:#94a3b8;margin:8px 0 0">Generated ${new Date().toLocaleDateString("en-US", { weekday:"long",month:"long",day:"numeric",year:"numeric" })}</p>
        </div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
          <tr>
            <td style="padding:12px;background:#f8fafc;border:1px solid #e2e8f0;font-weight:bold">Total Revenue</td>
            <td style="padding:12px;background:#f8fafc;border:1px solid #e2e8f0;color:#16a34a;font-weight:bold">$${revenue.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding:12px;border:1px solid #e2e8f0;font-weight:bold">Referral Payouts</td>
            <td style="padding:12px;border:1px solid #e2e8f0;color:#dc2626;font-weight:bold">-$${payouts.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding:12px;background:#f8fafc;border:1px solid #e2e8f0;font-weight:bold">Net Profit</td>
            <td style="padding:12px;background:#f8fafc;border:1px solid #e2e8f0;color:#2563eb;font-weight:bold;font-size:18px">$${profit.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding:12px;border:1px solid #e2e8f0;font-weight:bold">Active Clients</td>
            <td style="padding:12px;border:1px solid #e2e8f0">${activeClients.length}</td>
          </tr>
        </table>
        ${activeClients.length > 0 ? `
          <h2 style="color:#0f172a;font-size:16px">Active Companies</h2>
          <ul style="margin:0;padding-left:20px">
            ${activeClients.map((c: any) => `<li>${c.company_name} — <strong>$${Number(c.contract_value || 0).toLocaleString()}</strong></li>`).join("")}
          </ul>
        ` : ""}
        <p style="color:#94a3b8;font-size:12px;margin-top:24px">Sent by NOVA Platform · PickSmart Academy</p>
      </div>
    `;

    const { default: nodemailer } = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER || process.env.EMAIL_FROM,
        pass: process.env.GMAIL_PASS || process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `NOVA Reports <${process.env.GMAIL_USER || process.env.EMAIL_FROM}>`,
      to: req.body.toEmail || process.env.GMAIL_USER || process.env.EMAIL_FROM,
      subject: `⚡ NOVA Weekly Finance Report — $${profit.toLocaleString()} profit`,
      html: htmlBody,
      text: `NOVA Weekly Finance Report\nRevenue: $${revenue}\nPayouts: $${payouts}\nProfit: $${profit}\nActive Clients: ${activeClients.length}\n\n${companyList}`,
    });

    res.json({ ok: true, message: "Report sent" });
  } catch (e: any) {
    console.error("[finance-report-email]", e);
    res.status(500).json({ error: "Failed to send report", detail: e?.message });
  }
});

export default router;
