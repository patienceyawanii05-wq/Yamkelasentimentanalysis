/*
# Expand posts table with advanced sentiment analysis fields

## Overview
This migration adds new columns to the existing `posts` table to support
advanced sentiment analysis features: mixed sentiment, 12 emotion types,
topic detection, intent classification, risk level, AI explanation,
suggested brand response, emotional score, and sarcasm detection.

## Modified Tables

### posts (new columns added)
- `sentiment` — CHECK constraint expanded to include 'mixed'
- `emotion` — CHECK constraint expanded to 12 emotions: joy, happiness,
  excitement, love, trust, anger, frustration, fear, sadness, anxiety,
  surprise, disappointment, plus 'neutral'
- `secondary_emotion` (text, nullable) — second-most prominent emotion
- `emotional_score` (numeric, default 0) — overall emotional intensity 0–1
- `topic` (text, nullable) — detected main topic of the post
- `intent` (text, nullable) — classification: praise, complaint, concern,
  recommendation, question, or general
- `risk_level` (text, default 'low') — low, medium, or high
- `is_sarcastic` (boolean, default false) — sarcasm detection flag
- `ai_explanation` (text, nullable) — generated AI-style explanation text
- `suggested_response` (text, nullable) — suggested brand response text

## Security
- No changes to existing RLS policies — all new columns are accessible
  under the existing owner-scoped CRUD policies already on the table.
- No new tables created.

## Notes
1. All column additions use ALTER TABLE ADD COLUMN IF NOT EXISTS for idempotency.
2. The sentiment CHECK constraint is dropped and recreated to include 'mixed'.
3. The emotion CHECK constraint is dropped and recreated for 12 emotions + neutral.
4. risk_level gets a CHECK constraint for valid values.
5. Existing rows get safe defaults: risk_level='low', is_sarcastic=false,
   emotional_score=0.0.
6. New index on risk_level for complaint monitoring queries.
*/

-- Add new columns
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS secondary_emotion text;
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS emotional_score numeric DEFAULT 0 CHECK (emotional_score >= 0 AND emotional_score <= 1);
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS topic text;
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS intent text;
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS risk_level text NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high'));
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS is_sarcastic boolean NOT NULL DEFAULT false;
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS ai_explanation text;
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS suggested_response text;

-- Expand sentiment CHECK constraint to include 'mixed'
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_sentiment_check;
ALTER TABLE posts ADD CONSTRAINT posts_sentiment_check
  CHECK (sentiment IN ('positive', 'neutral', 'negative', 'mixed'));

-- Expand emotion CHECK constraint for 12 emotions + neutral
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_emotion_check;
ALTER TABLE posts ADD CONSTRAINT posts_emotion_check
  CHECK (emotion IN ('joy', 'happiness', 'excitement', 'love', 'trust',
    'anger', 'frustration', 'fear', 'sadness', 'anxiety',
    'surprise', 'disappointment', 'neutral'));

-- Add secondary_emotion check (same set, nullable)
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_secondary_emotion_check;
ALTER TABLE posts ADD CONSTRAINT posts_secondary_emotion_check
  CHECK (secondary_emotion IS NULL OR secondary_emotion IN (
    'joy', 'happiness', 'excitement', 'love', 'trust',
    'anger', 'frustration', 'fear', 'sadness', 'anxiety',
    'surprise', 'disappointment', 'neutral'));

-- Add intent check constraint
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_intent_check;
ALTER TABLE posts ADD CONSTRAINT posts_intent_check
  CHECK (intent IS NULL OR intent IN (
    'praise', 'complaint', 'concern', 'recommendation', 'question', 'general'));

-- Add index for risk_level filtering (complaint monitoring)
CREATE INDEX IF NOT EXISTS idx_posts_risk_level ON posts(risk_level);
