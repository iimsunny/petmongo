CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Optional: add a dedicated media table for places (multiple images/videos per place)
CREATE TABLE IF NOT EXISTS place_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  type VARCHAR(16) NOT NULL DEFAULT 'image',
  url TEXT NOT NULL,
  thumb_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_place_media_place_id ON place_media(place_id);
CREATE INDEX IF NOT EXISTS idx_place_media_sort ON place_media(place_id, sort_order);

-- 2) Optional: keep a cover_url on places for card fallback
ALTER TABLE places ADD COLUMN IF NOT EXISTS cover_url TEXT;

-- 3) Set cover image for 五龙湖公园
UPDATE places
SET cover_url = '/media/resources/wulonghu/wulonghu-1.jpg'
WHERE name = '五龙湖公园';

-- 4) Insert gallery images for 五龙湖公园 (idempotent by URL)
INSERT INTO place_media (place_id, type, url, sort_order)
SELECT p.id, 'image', v.url, v.sort_order
FROM places p
JOIN (
  VALUES
    ('/media/resources/wulonghu/wulonghu-1.jpg', 1),
    ('/media/resources/wulonghu/wulonghu-2.jpg', 2),
    ('/media/resources/wulonghu/wulonghu-3.jpg', 3)
) AS v(url, sort_order) ON TRUE
WHERE p.name = '五龙湖公园'
  AND NOT EXISTS (
    SELECT 1
    FROM place_media pm
    WHERE pm.place_id = p.id
      AND pm.url = v.url
  );
