/*
# Add platform column to posts table

## Overview
This migration adds a `platform` column to the posts table so each analyzed
post can be tagged with the social media platform it came from. Supported
platforms: X (Twitter), Facebook, Instagram, LinkedIn, Reddit, YouTube, TikTok.

## Modified Tables
### posts (new column)
- `platform` (text, NOT NULL, default 'x') — the source social media platform.
  Valid values: 'x', 'facebook', 'instagram', 'linkedin', 'reddit', 'youtube', 'tiktok'.

## Security
- No changes to existing RLS policies. The new column is accessible under
  the existing owner-scoped CRUD policies.

## Notes
1. Uses ADD COLUMN IF NOT EXISTS for idempotency.
2. Default is 'x' (formerly Twitter) so existing rows get a sensible platform.
3. CHECK constraint enforces valid platform values.
4. Index added for platform-based filtering.
*/

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS platform text NOT NULL DEFAULT 'x';

ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_platform_check;
ALTER TABLE posts ADD CONSTRAINT posts_platform_check
  CHECK (platform IN ('x', 'facebook', 'instagram', 'linkedin', 'reddit', 'youtube', 'tiktok'));

CREATE INDEX IF NOT EXISTS idx_posts_platform ON posts(platform);
