/*
# Add emoji detection columns to posts table

## Modified Tables
### posts
- `detected_emojis` (text[], nullable) — array of emoji characters found in the post
- `emoji_meanings` (text[], nullable) — human-readable meanings for detected emojis

## Security
- No changes to existing RLS policies.
*/

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS detected_emojis text[];
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS emoji_meanings text[];
