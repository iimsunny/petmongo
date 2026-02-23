-- Fix garbled UTF-8 data inserted via PowerShell

UPDATE cities
SET name = '上海'
WHERE id = '11111111-1111-1111-1111-111111111111';

UPDATE categories
SET name = '住宿'
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

UPDATE resources
SET
  name = '云朵旅居 · 宠物友好客栈',
  location_hint = '近地铁 2 号线步行 5 分钟',
  safety_note = '入住需自带宠物垫',
  best_time = '全天'
WHERE id = '55555555-4444-4444-4444-444444444444';

UPDATE resources
SET
  name = '星光草坪 · 可牵绳友好',
  safety_note = '建议避开正午强晒',
  best_time = '傍晚 17:00-19:00'
WHERE id = '55555555-1111-1111-1111-111111111111';

UPDATE resources
SET
  name = '咕噜森林咖啡',
  safety_note = '需自带垫子',
  best_time = '午后 14:00-16:00'
WHERE id = '55555555-2222-2222-2222-222222222222';

UPDATE resources
SET
  name = '海风栈道 · 观景点',
  safety_note = '潮汐注意',
  best_time = '日落前 1 小时'
WHERE id = '55555555-3333-3333-3333-333333333333';
