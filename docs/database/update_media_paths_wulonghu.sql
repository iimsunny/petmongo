-- Move media urls to new structured path
UPDATE media_assets
SET url = REPLACE(url, '/media/', '/media/resources/wulonghu/')
WHERE resource_id = '77777777-1111-1111-1111-111111111111'
  AND url LIKE '/media/%';
