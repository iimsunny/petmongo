CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE discover_posts
ADD COLUMN IF NOT EXISTS status VARCHAR(16) NOT NULL DEFAULT 'pending';

ALTER TABLE discover_posts
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

ALTER TABLE discover_posts
ADD COLUMN IF NOT EXISTS reviewer_id UUID;

ALTER TABLE discover_posts
ADD COLUMN IF NOT EXISTS review_note VARCHAR(240);

-- Existing historical posts are treated as approved.
UPDATE discover_posts
SET status = 'approved'
WHERE status IS DISTINCT FROM 'approved'
  AND created_at < NOW();

CREATE INDEX IF NOT EXISTS idx_discover_posts_status_created_at
ON discover_posts(status, created_at DESC);
