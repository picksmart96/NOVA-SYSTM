-- ============================================================
-- Selector Breaking News (SBN) — Seed Data
-- PickSmart NOVA Social Platform
-- ============================================================

-- Seed Users (password_hash values are bcrypt of "Password123!")
INSERT INTO sbn_users (id, email, password_hash, role, subscription_plan, is_subscribed)
VALUES
  ('usr-draogo96',       'draogo96@picksmart.app',    '$2b$10$example_hash_owner',       'owner',      'owner',    true),
  ('usr-jmendez',        'jmendez@picksmart.app',     '$2b$10$example_hash_trainer',     'trainer',    'company',  true),
  ('usr-kthomas',        'kthomas@picksmart.app',     '$2b$10$example_hash_supervisor',  'supervisor', 'company',  true),
  ('usr-selector1',      'mike.r@picksmart.app',      '$2b$10$example_hash_sel1',        'selector',   'personal', true),
  ('usr-selector2',      'deja.w@picksmart.app',      '$2b$10$example_hash_sel2',        'selector',   'personal', true),
  ('usr-selector3',      'carlos.m@picksmart.app',    '$2b$10$example_hash_sel3',        'selector',   'personal', false),
  ('usr-selector4',      'tamika.h@picksmart.app',    '$2b$10$example_hash_sel4',        'selector',   'personal', true),
  ('usr-selector5',      'jerome.b@picksmart.app',    '$2b$10$example_hash_sel5',        'selector',   'personal', true)
ON CONFLICT (id) DO NOTHING;

-- Seed Profiles
INSERT INTO sbn_profiles (user_id, full_name, username, bio, level_badge, location, shift_type)
VALUES
  ('usr-draogo96',  'D. Raogo',      'draogo96',    'Owner & NOVA architect. Building the future of warehouse training.', 'Legend',          'Warehouse HQ',   'All Shifts'),
  ('usr-jmendez',   'Jorge Mendez',  'jorge_m',     'Night crew trainer. 6 years strong. Teaching selectors to dominate.',  'Gold Selector',   'Building A',     'Night'),
  ('usr-kthomas',   'Kim Thomas',    'kim_sup',     'Supervisor keeping the floor running smooth. Data-driven decisions.',  'Supervisor Pro',  'Building B',     'Day'),
  ('usr-selector1', 'Mike Robinson', 'mike_picks',  'Day shift picker. Chasing that 100% accuracy every run.',             'Silver Selector', 'Aisle 1-20',     'Day'),
  ('usr-selector2', 'Deja Williams', 'deja_w',      'Night shift queen. Fastest hands in the building fr.',                'Gold Selector',   'Aisle 21-40',    'Night'),
  ('usr-selector3', 'Carlos Medina', 'carlos_m',    'New to the floor but learning fast. NOVA is a game changer.',         'Beginner',        'Aisle 1-10',     'Day'),
  ('usr-selector4', 'Tamika Harris', 'tamika_h',    '3 years in. Mentoring new selectors on weekends.',                   'Gold Selector',   'Aisle 41-60',    'Night'),
  ('usr-selector5', 'Jerome Brown',  'jerome_b',    'Weekend warrior. Grocery dept specialist.',                           'Silver Selector', 'Grocery Section','Weekend')
ON CONFLICT (user_id) DO NOTHING;

-- Seed Groups
INSERT INTO sbn_groups (id, name, slug, description, created_by_user_id, members_count, posts_count)
VALUES
  ('grp-nightcrew',   'Night Crew Selectors',     'night-crew',      'All things night shift. Tips, vents, and wins.', 'usr-jmendez',   4, 3),
  ('grp-newbies',     'New Selector Support',      'new-selectors',   'Ask anything. No dumb questions here.',           'usr-kthomas',   3, 2),
  ('grp-grocery',     'Grocery Dept',              'grocery-dept',    'Grocery section selectors only.',                 'usr-selector5', 2, 1),
  ('grp-challenge',   'Weekly Pick Challenge',     'pick-challenge',  'Compete for fastest pick times each week.',       'usr-jmendez',   5, 4)
ON CONFLICT (id) DO NOTHING;

-- Seed Group Members
INSERT INTO sbn_group_members (group_id, user_id, role)
VALUES
  ('grp-nightcrew', 'usr-jmendez',   'admin'),
  ('grp-nightcrew', 'usr-selector2', 'member'),
  ('grp-nightcrew', 'usr-selector4', 'member'),
  ('grp-nightcrew', 'usr-selector5', 'member'),
  ('grp-newbies',   'usr-kthomas',   'admin'),
  ('grp-newbies',   'usr-selector3', 'member'),
  ('grp-newbies',   'usr-selector1', 'member'),
  ('grp-grocery',   'usr-selector5', 'admin'),
  ('grp-grocery',   'usr-selector3', 'member'),
  ('grp-challenge', 'usr-jmendez',   'admin'),
  ('grp-challenge', 'usr-selector1', 'member'),
  ('grp-challenge', 'usr-selector2', 'member'),
  ('grp-challenge', 'usr-selector4', 'member'),
  ('grp-challenge', 'usr-selector5', 'member')
ON CONFLICT (group_id, user_id) DO NOTHING;

-- Seed Posts
INSERT INTO sbn_posts (id, author_user_id, post_type, content, visibility, like_count, love_count, comments_count, is_pinned)
VALUES
  ('pst-001', 'usr-selector2', 'text',
   'Just hit 97% accuracy on a 400-case pull 🔥 Night shift hitting different tonight. Who else out here grinding?',
   'public', 14, 6, 3, false),

  ('pst-002', 'usr-jmendez', 'announcement',
   'NOVA update dropping next week — new voice command shortcuts for double slots. Mandatory training brief Friday 10pm.',
   'public', 8, 3, 5, true),

  ('pst-003', 'usr-selector1', 'question',
   'Anyone else getting the wrong check code called on aisle 7 slots? Happened twice this week. Is it a system issue or am I tripping?',
   'public', 2, 0, 7, false),

  ('pst-004', 'usr-selector4', 'text',
   'Real talk — the new pallet wrap technique Jorge showed us saved me 12 minutes last night. Compounding over a week that''s huge.',
   'public', 10, 4, 2, false),

  ('pst-005', 'usr-selector3', 'question',
   'What''s the fastest way to recover when you miss a slot and the next stop is 3 aisles back? Still figuring out backtracking.',
   'public', 1, 0, 4, false),

  ('pst-006', 'usr-draogo96', 'announcement',
   'Welcome to Selector Breaking News — the social hub for every selector, trainer, and supervisor on the floor. Post your wins, ask questions, share tips. This is your space. 💛',
   'public', 22, 18, 1, true),

  ('pst-007', 'usr-selector5', 'text',
   'Grocery dept heads up — the new slot layout for the banana section went live tonight. First 3 aisles shifted 2 slots left. Check your maps.',
   'public', 6, 2, 3, false),

  ('pst-008', 'usr-kthomas', 'text',
   'Productivity report: building B night crew averaged 94.2% this week. Top performer was Deja at 97.4%. Keep it up team.',
   'public', 9, 7, 2, false)
ON CONFLICT (id) DO NOTHING;

-- Seed Post Hashtags
INSERT INTO sbn_post_hashtags (post_id, hashtag)
VALUES
  ('pst-001', 'nightshift'), ('pst-001', 'accuracy'), ('pst-001', 'grind'),
  ('pst-002', 'nova'), ('pst-002', 'update'), ('pst-002', 'training'),
  ('pst-003', 'checkcode'), ('pst-003', 'help'), ('pst-003', 'aisle7'),
  ('pst-004', 'tips'), ('pst-004', 'palletwrap'), ('pst-004', 'efficiency'),
  ('pst-005', 'newbie'), ('pst-005', 'help'), ('pst-005', 'backtracking'),
  ('pst-006', 'welcome'), ('pst-006', 'selectornation'),
  ('pst-007', 'grocery'), ('pst-007', 'slotupdate'),
  ('pst-008', 'performance'), ('pst-008', 'buildingb')
ON CONFLICT DO NOTHING;

-- Seed Post Reactions
INSERT INTO sbn_post_reactions (post_id, user_id, reaction_type)
VALUES
  ('pst-001', 'usr-jmendez',   'love'),
  ('pst-001', 'usr-selector1', 'like'),
  ('pst-001', 'usr-selector4', 'like'),
  ('pst-001', 'usr-kthomas',   'wow'),
  ('pst-002', 'usr-selector2', 'like'),
  ('pst-002', 'usr-selector4', 'like'),
  ('pst-004', 'usr-selector1', 'love'),
  ('pst-004', 'usr-selector2', 'love'),
  ('pst-006', 'usr-selector1', 'love'),
  ('pst-006', 'usr-selector2', 'love'),
  ('pst-006', 'usr-selector3', 'like'),
  ('pst-006', 'usr-selector4', 'love'),
  ('pst-006', 'usr-selector5', 'like'),
  ('pst-006', 'usr-jmendez',   'like'),
  ('pst-006', 'usr-kthomas',   'like'),
  ('pst-008', 'usr-jmendez',   'love'),
  ('pst-008', 'usr-selector2', 'love')
ON CONFLICT (post_id, user_id) DO NOTHING;

-- Seed Comments
INSERT INTO sbn_comments (id, post_id, author_user_id, parent_comment_id, content)
VALUES
  ('cmt-001', 'pst-001', 'usr-selector4',  NULL,      'Let''s gooo! Night crew eating 🔥 What was your pull size?'),
  ('cmt-002', 'pst-001', 'usr-selector2',  'cmt-001', '412 cases. Double pallet night. NOVA called every slot clean.'),
  ('cmt-003', 'pst-001', 'usr-jmendez',    NULL,      'That''s what I''m talking about. Keep stacking those numbers.'),

  ('cmt-004', 'pst-002', 'usr-selector4',  NULL,      'Will the briefing be recorded for those of us off Friday?'),
  ('cmt-005', 'pst-002', 'usr-jmendez',    'cmt-004', 'Yes, NOVA will have the replay available in the training module by Saturday.'),

  ('cmt-006', 'pst-003', 'usr-jmendez',    NULL,      'Yes known issue on aisle 7 slots 14-18. Maintenance ticket open. Use manual verify for now.'),
  ('cmt-007', 'pst-003', 'usr-selector4',  NULL,      'Same thing happened to me Tuesday. Supervisor confirmed it.'),
  ('cmt-008', 'pst-003', 'usr-selector1',  'cmt-006', 'Thank you! I was second-guessing myself hard.'),

  ('cmt-009', 'pst-005', 'usr-jmendez',    NULL,      'Rule one: don''t panic. Mark it missed, note it on your sheet, finish the run, then circle back at the end.'),
  ('cmt-010', 'pst-005', 'usr-selector4',  NULL,      'What Jorge said. Never backtrack mid-run. Kills your time.'),
  ('cmt-011', 'pst-005', 'usr-selector3',  'cmt-009', 'This helped so much. I was stopping mid-run every time.'),

  ('cmt-012', 'pst-006', 'usr-selector1',  NULL,      'This is fire. Been waiting for something like this. 💛'),

  ('cmt-013', 'pst-007', 'usr-selector3',  NULL,      'Thanks for the heads up! Almost walked into the wrong aisle tonight.'),
  ('cmt-014', 'pst-007', 'usr-selector5',  'cmt-013', 'Management posted the updated map in the break room too.'),

  ('cmt-015', 'pst-008', 'usr-selector2',  NULL,      'Appreciate the shoutout Kim 🙌 Team effort though fr.')
ON CONFLICT (id) DO NOTHING;

-- Seed Follows
INSERT INTO sbn_follows (follower_user_id, following_user_id)
VALUES
  ('usr-selector1', 'usr-jmendez'),
  ('usr-selector1', 'usr-selector2'),
  ('usr-selector2', 'usr-jmendez'),
  ('usr-selector2', 'usr-selector4'),
  ('usr-selector3', 'usr-jmendez'),
  ('usr-selector3', 'usr-selector1'),
  ('usr-selector4', 'usr-jmendez'),
  ('usr-selector4', 'usr-kthomas'),
  ('usr-selector5', 'usr-jmendez'),
  ('usr-selector5', 'usr-selector2'),
  ('usr-jmendez',   'usr-kthomas'),
  ('usr-kthomas',   'usr-jmendez')
ON CONFLICT (follower_user_id, following_user_id) DO NOTHING;

-- Seed Notifications
INSERT INTO sbn_notifications (user_id, actor_user_id, type, entity_type, entity_id, message)
VALUES
  ('usr-selector2', 'usr-selector4', 'like',    'post',    'pst-001', 'Tamika reacted to your post'),
  ('usr-selector2', 'usr-jmendez',   'comment', 'comment', 'cmt-003', 'Jorge commented on your post'),
  ('usr-jmendez',   'usr-selector4', 'comment', 'comment', 'cmt-004', 'Tamika commented on your announcement'),
  ('usr-selector1', 'usr-jmendez',   'comment', 'comment', 'cmt-006', 'Jorge replied on a post you commented on'),
  ('usr-selector3', 'usr-jmendez',   'follow',  'user',    'usr-jmendez', 'Jorge is now following you')
ON CONFLICT DO NOTHING;

-- Seed Announcements (owner + trainer)
INSERT INTO sbn_announcements (id, title, content, created_by_user_id, is_pinned, is_active)
VALUES
  ('ann-001',
   'Welcome to Selector Breaking News',
   'Your new social hub is live. Post updates, ask questions, share wins, and connect with your crew. This platform belongs to all of us. — draogo96',
   'usr-draogo96', true, true),
  ('ann-002',
   'NOVA Voice Update — New Commands Available',
   'Version 2.4 is live. New shortcuts: "skip slot", "confirm double", and "call supervisor" are now active. See the Training tab for the full guide.',
   'usr-jmendez', false, true)
ON CONFLICT (id) DO NOTHING;
