CREATE TABLE IF NOT EXISTS discover_posts (
  id UUID PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  author_name VARCHAR(64) NOT NULL,
  author_avatar_url TEXT,
  cover_url TEXT,
  media_url TEXT,
  category VARCHAR(32) NOT NULL,
  city VARCHAR(64),
  tags TEXT[] NOT NULL DEFAULT '{}',
  post_type VARCHAR(16) NOT NULL DEFAULT 'image',
  likes INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE discover_posts
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE discover_posts
  ADD COLUMN IF NOT EXISTS media_url TEXT;

ALTER TABLE discover_posts
  ADD COLUMN IF NOT EXISTS post_type VARCHAR(16) NOT NULL DEFAULT 'image';

INSERT INTO discover_posts (
  id, title, author_name, author_avatar_url, cover_url, media_url, category, city, tags, post_type, likes
) VALUES
  (
    '88888888-1111-1111-1111-111111111111',
    '户外遛狗指南：秋天的好去处',
    '泡泡小熊',
    NULL,
    NULL,
    NULL,
    '户外',
    '上海',
    ARRAY['遛狗', '户外', '秋游'],
    'image',
    1887
  ),
  (
    '88888888-2222-2222-2222-222222222222',
    '宠物健康检查清单',
    '橘子汽水',
    NULL,
    NULL,
    NULL,
    '宠物健康',
    '上海',
    ARRAY['体检', '健康', '护理'],
    'image',
    421
  ),
  (
    '88888888-3333-3333-3333-333333333333',
    '室内训练：坐下与等待',
    'Sein',
    NULL,
    NULL,
    NULL,
    '宠物训练',
    '上海',
    ARRAY['训练', '坐下', '等待'],
    'image',
    102
  ),
  (
    '88888888-4444-4444-4444-444444444444',
    '冬季宠物用品推荐',
    '糖糖',
    NULL,
    NULL,
    NULL,
    '宠物用品',
    '上海',
    ARRAY['冬季', '用品', '保暖'],
    'image',
    356
  ),
  (
    '88888888-5555-5555-5555-555555555555',
    '带狗狗旅行需要准备什么',
    '木木',
    NULL,
    NULL,
    NULL,
    '旅行',
    '上海',
    ARRAY['旅行', '清单', '出行'],
    'image',
    97
  ),
  (
    '88888888-6666-6666-6666-666666666666',
    '推荐：本周最受欢迎的草坪路线',
    '柠檬派',
    NULL,
    NULL,
    NULL,
    '推荐',
    '上海',
    ARRAY['草坪', '路线', '推荐'],
    'image',
    2690
  ),
  (
    '88888888-7777-7777-7777-777777777777',
    '视频：狗狗城市散步记录',
    '阿布',
    NULL,
    NULL,
    'https://example.com/video/dogwalk.mp4',
    '推荐',
    '上海',
    ARRAY['视频', '散步', '记录'],
    'video',
    542
  )
ON CONFLICT (id) DO NOTHING;

UPDATE discover_posts SET
  tags = ARRAY['遛狗', '户外', '秋游'],
  post_type = 'image'
WHERE id = '88888888-1111-1111-1111-111111111111';

UPDATE discover_posts SET
  tags = ARRAY['体检', '健康', '护理'],
  post_type = 'image'
WHERE id = '88888888-2222-2222-2222-222222222222';

UPDATE discover_posts SET
  tags = ARRAY['训练', '坐下', '等待'],
  post_type = 'image'
WHERE id = '88888888-3333-3333-3333-333333333333';

UPDATE discover_posts SET
  tags = ARRAY['冬季', '用品', '保暖'],
  post_type = 'image'
WHERE id = '88888888-4444-4444-4444-444444444444';

UPDATE discover_posts SET
  tags = ARRAY['旅行', '清单', '出行'],
  post_type = 'image'
WHERE id = '88888888-5555-5555-5555-555555555555';

UPDATE discover_posts SET
  tags = ARRAY['草坪', '路线', '推荐'],
  post_type = 'image'
WHERE id = '88888888-6666-6666-6666-666666666666';

UPDATE discover_posts SET
  tags = ARRAY['视频', '散步', '记录'],
  post_type = 'video'
WHERE id = '88888888-7777-7777-7777-777777777777';
