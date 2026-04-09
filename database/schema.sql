-- ============================================================
-- Selector Breaking News (SBN) — Full Schema
-- PickSmart NOVA Social Platform
-- All tables prefixed with sbn_ to namespace the social layer.
-- ============================================================

-- 1. Users (auth/account)
CREATE TABLE IF NOT EXISTS sbn_users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'selector',
  subscription_plan TEXT NOT NULL DEFAULT 'personal',
  is_subscribed BOOLEAN NOT NULL DEFAULT false,
  is_banned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2. Profiles (display / social identity)
CREATE TABLE IF NOT EXISTS sbn_profiles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT UNIQUE NOT NULL REFERENCES sbn_users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  bio TEXT NOT NULL DEFAULT '',
  avatar_url TEXT NOT NULL DEFAULT '',
  cover_image_url TEXT NOT NULL DEFAULT '',
  level_badge TEXT NOT NULL DEFAULT 'Beginner',
  location TEXT NOT NULL DEFAULT '',
  shift_type TEXT NOT NULL DEFAULT '',
  status_text TEXT NOT NULL DEFAULT '',
  is_online BOOLEAN NOT NULL DEFAULT false,
  followers_count INT NOT NULL DEFAULT 0,
  following_count INT NOT NULL DEFAULT 0,
  posts_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sbn_profiles_username ON sbn_profiles(username);

-- 3. Posts
CREATE TABLE IF NOT EXISTS sbn_posts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  author_user_id TEXT NOT NULL REFERENCES sbn_users(id) ON DELETE CASCADE,
  group_id TEXT,
  post_type TEXT NOT NULL DEFAULT 'text',
  content TEXT NOT NULL,
  image_url TEXT NOT NULL DEFAULT '',
  video_url TEXT NOT NULL DEFAULT '',
  visibility TEXT NOT NULL DEFAULT 'public',
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  like_count INT NOT NULL DEFAULT 0,
  love_count INT NOT NULL DEFAULT 0,
  funny_count INT NOT NULL DEFAULT 0,
  wow_count INT NOT NULL DEFAULT 0,
  frustrated_count INT NOT NULL DEFAULT 0,
  comments_count INT NOT NULL DEFAULT 0,
  shares_count INT NOT NULL DEFAULT 0,
  saves_count INT NOT NULL DEFAULT 0,
  reports_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sbn_posts_author ON sbn_posts(author_user_id);
CREATE INDEX IF NOT EXISTS idx_sbn_posts_created_at ON sbn_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sbn_posts_group ON sbn_posts(group_id);

-- 4. Post Hashtags
CREATE TABLE IF NOT EXISTS sbn_post_hashtags (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  post_id TEXT NOT NULL REFERENCES sbn_posts(id) ON DELETE CASCADE,
  hashtag TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sbn_post_hashtags_hashtag ON sbn_post_hashtags(hashtag);
CREATE INDEX IF NOT EXISTS idx_sbn_post_hashtags_post ON sbn_post_hashtags(post_id);

-- 5. Post Reactions (one per user per post)
CREATE TABLE IF NOT EXISTS sbn_post_reactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  post_id TEXT NOT NULL REFERENCES sbn_posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES sbn_users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- 6. Saved Posts (no duplicates)
CREATE TABLE IF NOT EXISTS sbn_saved_posts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL REFERENCES sbn_users(id) ON DELETE CASCADE,
  post_id TEXT NOT NULL REFERENCES sbn_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- 7. Comments (nested via parent_comment_id)
CREATE TABLE IF NOT EXISTS sbn_comments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  post_id TEXT NOT NULL REFERENCES sbn_posts(id) ON DELETE CASCADE,
  author_user_id TEXT NOT NULL REFERENCES sbn_users(id) ON DELETE CASCADE,
  parent_comment_id TEXT REFERENCES sbn_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  reactions_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sbn_comments_post ON sbn_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_sbn_comments_parent ON sbn_comments(parent_comment_id);

-- 8. Comment Reactions (one per user per comment)
CREATE TABLE IF NOT EXISTS sbn_comment_reactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  comment_id TEXT NOT NULL REFERENCES sbn_comments(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES sbn_users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- 9. Follows (no self-follows enforced at app level)
CREATE TABLE IF NOT EXISTS sbn_follows (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  follower_user_id TEXT NOT NULL REFERENCES sbn_users(id) ON DELETE CASCADE,
  following_user_id TEXT NOT NULL REFERENCES sbn_users(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(follower_user_id, following_user_id)
);

CREATE INDEX IF NOT EXISTS idx_sbn_follows_follower ON sbn_follows(follower_user_id);
CREATE INDEX IF NOT EXISTS idx_sbn_follows_following ON sbn_follows(following_user_id);

-- 10. Notifications
CREATE TABLE IF NOT EXISTS sbn_notifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL REFERENCES sbn_users(id) ON DELETE CASCADE,
  actor_user_id TEXT REFERENCES sbn_users(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sbn_notifications_user_read ON sbn_notifications(user_id, is_read);

-- 11. Conversations
CREATE TABLE IF NOT EXISTS sbn_conversations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  conversation_type TEXT NOT NULL DEFAULT 'direct',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 12. Conversation Members
CREATE TABLE IF NOT EXISTS sbn_conversation_members (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  conversation_id TEXT NOT NULL REFERENCES sbn_conversations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES sbn_users(id) ON DELETE CASCADE,
  last_read_at TIMESTAMP,
  joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- 13. Messages
CREATE TABLE IF NOT EXISTS sbn_messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  conversation_id TEXT NOT NULL REFERENCES sbn_conversations(id) ON DELETE CASCADE,
  sender_user_id TEXT NOT NULL REFERENCES sbn_users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT NOT NULL DEFAULT '',
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sbn_messages_conv_created ON sbn_messages(conversation_id, created_at DESC);

-- 14. Groups
CREATE TABLE IF NOT EXISTS sbn_groups (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  cover_image_url TEXT NOT NULL DEFAULT '',
  created_by_user_id TEXT NOT NULL REFERENCES sbn_users(id) ON DELETE CASCADE,
  is_private BOOLEAN NOT NULL DEFAULT false,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  members_count INT NOT NULL DEFAULT 0,
  posts_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sbn_groups_slug ON sbn_groups(slug);

-- 15. Group Members
CREATE TABLE IF NOT EXISTS sbn_group_members (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  group_id TEXT NOT NULL REFERENCES sbn_groups(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES sbn_users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- 16. Reports
CREATE TABLE IF NOT EXISTS sbn_reports (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  reporter_user_id TEXT NOT NULL REFERENCES sbn_users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  reviewed_by_user_id TEXT REFERENCES sbn_users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sbn_reports_status ON sbn_reports(status);

-- 17. Bans
CREATE TABLE IF NOT EXISTS sbn_bans (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL REFERENCES sbn_users(id) ON DELETE CASCADE,
  banned_by_user_id TEXT NOT NULL REFERENCES sbn_users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sbn_bans_user ON sbn_bans(user_id, status);

-- 18. Announcements
CREATE TABLE IF NOT EXISTS sbn_announcements (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by_user_id TEXT NOT NULL REFERENCES sbn_users(id) ON DELETE CASCADE,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 19. Moderation Logs
CREATE TABLE IF NOT EXISTS sbn_moderation_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  admin_user_id TEXT NOT NULL REFERENCES sbn_users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sbn_moderation_logs_admin ON sbn_moderation_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_sbn_moderation_logs_created ON sbn_moderation_logs(created_at DESC);
