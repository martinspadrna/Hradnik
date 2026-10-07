-- Normalize legacy Wikimedia image URLs so HTTPS Hradník never depends on mixed-content upgrades.
-- Idempotent: rows already using HTTPS are unchanged.
update public.hradnik_places
set photo_urls = replace(
  replace(
    replace(photo_urls::text,
      'http://commons.wikimedia.org/', 'https://commons.wikimedia.org/'),
      'http://thumb.wikimedia.org/', 'https://thumb.wikimedia.org/'),
      'http://upload.wikimedia.org/', 'https://upload.wikimedia.org/')::jsonb
where photo_urls is not null
  and (
    photo_urls::text like '%http://commons.wikimedia.org/%'
    or photo_urls::text like '%http://thumb.wikimedia.org/%'
    or photo_urls::text like '%http://upload.wikimedia.org/%'
  );
