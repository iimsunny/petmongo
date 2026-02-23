INSERT INTO resources (
  id, name, category_id, city_id, cover_url, location_hint,
  safety_note, best_time, verified, status
) VALUES (
  '77777777-1111-1111-1111-111111111111',
  '五龙湖公园',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '11111111-1111-1111-1111-111111111111',
  NULL,
  '超大活动草坪，草坪质量非常好',
  '有交通管制，无机动车危险',
  '全天',
  TRUE,
  'approved'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO resource_tags (resource_id, tag_id) VALUES
  ('77777777-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444'),
  ('77777777-1111-1111-1111-111111111111', '44444444-1111-1111-1111-111111111111')
ON CONFLICT DO NOTHING;

INSERT INTO media_assets (id, resource_id, type, url, thumb_url, sort_order) VALUES
  ('77777777-2222-2222-2222-222222222222', '77777777-1111-1111-1111-111111111111', 'image', '/media/微信图片_20260125131840_59_2.jpg', NULL, 1),
  ('77777777-3333-3333-3333-333333333333', '77777777-1111-1111-1111-111111111111', 'image', '/media/微信图片_20260125131841_60_2.jpg', NULL, 2),
  ('77777777-4444-4444-4444-444444444444', '77777777-1111-1111-1111-111111111111', 'image', '/media/微信图片_20260125131842_62_2.jpg', NULL, 3)
ON CONFLICT (id) DO NOTHING;
