# Selector Breaking News — Data Model Relationships

All tables are prefixed `sbn_` to namespace the social layer from the warehouse operations tables.

## Core Entities

### sbn_users ↔ sbn_profiles
- One-to-one. Every user has exactly one profile.
- `sbn_profiles.user_id` → `sbn_users.id` (UNIQUE, CASCADE)
- `sbn_users` holds auth/account data (email, role, subscription, ban status).
- `sbn_profiles` holds display/social data (name, username, bio, avatar, counts).

### sbn_users ↔ sbn_posts
- One-to-many. A user authors many posts.
- `sbn_posts.author_user_id` → `sbn_users.id` (CASCADE)
- `sbn_posts.group_id` optionally links to `sbn_groups.id`.

### sbn_posts ↔ sbn_comments
- One-to-many. A post has many comments.
- `sbn_comments.post_id` → `sbn_posts.id` (CASCADE)
- Comments support threading: `sbn_comments.parent_comment_id` → `sbn_comments.id` (self-referential).

### sbn_posts ↔ sbn_post_reactions
- One-to-many, but UNIQUE(post_id, user_id) enforces one reaction per user per post.
- Reaction counts are denormalized onto `sbn_posts` (like_count, love_count, etc.) for fast reads.
- Updating a reaction: DELETE old row, INSERT new row, update counts.

### sbn_posts ↔ sbn_post_hashtags
- One-to-many. Each hashtag is its own row for indexed search.
- `sbn_post_hashtags.post_id` → `sbn_posts.id` (CASCADE)
- Index on `hashtag` column for fast `#tag` feed queries.

### sbn_posts ↔ sbn_saved_posts
- Many-to-many junction. UNIQUE(user_id, post_id) prevents duplicate saves.
- `saves_count` is denormalized on `sbn_posts`.

### sbn_comments ↔ sbn_comment_reactions
- Same pattern as post reactions. UNIQUE(comment_id, user_id).
- `reactions_count` is denormalized on `sbn_comments`.

### sbn_users ↔ sbn_follows
- Many-to-many self-join. UNIQUE(follower_user_id, following_user_id).
- App logic must prevent self-follows (follower ≠ following).
- `followers_count` and `following_count` are denormalized on `sbn_profiles`.

### sbn_users ↔ sbn_notifications
- One-to-many. `user_id` is the recipient; `actor_user_id` is who triggered it.
- `entity_type` + `entity_id` point to the related object (post, comment, user, etc.).
- Index on (user_id, is_read) for unread count queries.

### sbn_conversations ↔ sbn_conversation_members ↔ sbn_messages
- Conversations are abstract containers (direct or group).
- Members join via `sbn_conversation_members` junction. UNIQUE(conversation_id, user_id).
- Messages attach to conversations. `sender_user_id` → `sbn_users`.
- `last_read_at` on members enables unread message counts per user.
- Index on (conversation_id, created_at DESC) for paginated message loading.

### sbn_groups ↔ sbn_group_members
- One-to-many junction. UNIQUE(group_id, user_id).
- Member roles: `admin`, `moderator`, `member`.
- `members_count` and `posts_count` are denormalized on `sbn_groups`.

### sbn_posts → sbn_groups
- Optional relationship. Posts can belong to a group via `group_id`.
- Group posts still appear on the global feed if `visibility = 'public'`.

### sbn_users ↔ sbn_reports
- `reporter_user_id` is who filed the report.
- `target_type` + `target_id` point to any entity (post, comment, user).
- `reviewed_by_user_id` is the admin who handled it (nullable).
- Index on `status` for moderation queue queries.

### sbn_users ↔ sbn_bans
- `user_id` is the banned user; `banned_by_user_id` is the admin.
- `expires_at` is NULL for permanent bans.
- Check `is_banned` on `sbn_users` for fast auth-level ban checking (sync on ban/lift).

### sbn_announcements
- Standalone posts from admins/trainers. Not part of the social feed.
- `is_pinned` surfaces them at the top of the Breaking News feed.
- `is_active = false` soft-deletes them without losing history.

### sbn_moderation_logs
- Append-only audit trail. Never update or delete rows here.
- `action_type` examples: ban_user, lift_ban, delete_post, dismiss_report, pin_announcement.
- `target_type` + `target_id` reference the affected entity.

## Denormalization Strategy

The following counts are stored directly on parent rows for O(1) reads.
They must be updated transactionally when the related rows change.

| Denormalized Column         | Source Table           | Trigger Event           |
|-----------------------------|------------------------|-------------------------|
| sbn_posts.like_count        | sbn_post_reactions     | INSERT / DELETE reaction |
| sbn_posts.love_count        | sbn_post_reactions     | INSERT / DELETE reaction |
| sbn_posts.funny_count       | sbn_post_reactions     | INSERT / DELETE reaction |
| sbn_posts.wow_count         | sbn_post_reactions     | INSERT / DELETE reaction |
| sbn_posts.frustrated_count  | sbn_post_reactions     | INSERT / DELETE reaction |
| sbn_posts.comments_count    | sbn_comments           | INSERT / soft-delete     |
| sbn_posts.saves_count       | sbn_saved_posts        | INSERT / DELETE          |
| sbn_comments.reactions_count| sbn_comment_reactions  | INSERT / DELETE          |
| sbn_profiles.followers_count| sbn_follows            | INSERT / DELETE          |
| sbn_profiles.following_count| sbn_follows            | INSERT / DELETE          |
| sbn_profiles.posts_count    | sbn_posts              | INSERT / soft-delete     |
| sbn_groups.members_count    | sbn_group_members      | INSERT / DELETE          |
| sbn_groups.posts_count      | sbn_posts (group_id)   | INSERT / soft-delete     |

## Enum Reference

| Field             | Allowed Values                                               |
|-------------------|--------------------------------------------------------------|
| role              | selector, trainer, supervisor, manager, owner                |
| subscription_plan | personal, company, owner                                     |
| post_type         | text, image, video, question, announcement, training_clip    |
| reaction_type     | like, love, funny, wow, frustrated                           |
| notification type | like, comment, reply, follow, mention, message, report_update, group_invite |
| report status     | open, reviewed, dismissed, action_taken                      |
| group role        | admin, moderator, member                                     |
| conversation_type | direct, group                                                |
| ban status        | active, expired, lifted                                      |
