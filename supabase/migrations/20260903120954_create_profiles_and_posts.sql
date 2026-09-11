/*
# Create profiles and posts tables for Sentiment Analysis app

## Overview
This migration creates the core database schema for a Social Media Sentiment Analysis application.
It includes user profiles (extending Supabase's built-in auth.users) and analyzed posts with sentiment data.

## New Tables

### profiles
- `id` (uuid, primary key) — references auth.users.id, cascading on delete
- `name` (text, not null) — user's display name
- `created_at` (timestamptz) — account creation timestamp

### posts
- `id` (uuid, primary key) — auto-generated
- `content` (text, not null) — the social media post text
- `sentiment` (text, not null) — classification: 'positive', 'neutral', or 'negative'
- `confidence_score` (numeric, not null) — confidence between 0 and 1
- `emotion` (text, not null) — emotion classification: 'joy', 'anger', 'sadness', 'fear', 'surprise', or 'neutral'
- `keywords` (jsonb) — array of extracted keyword strings
- `created_at` (timestamptz) — when the post was analyzed
- `user_id` (uuid, not null) — owner of the post, defaults to auth.uid()

## Security
- RLS enabled on both tables.
- profiles: users can read/update only their own profile.
- posts: owner-scoped CRUD — each authenticated user can only access their own posts.
- All policies use auth.uid() for ownership checks.

## Notes
1. user_id on posts defaults to auth.uid() so frontend inserts that omit user_id still pass RLS.
2. Indexes added on user_id and created_at for query performance.
3. profiles uses ON DELETE CASCADE so deleting an auth user removes their profile.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  sentiment text NOT NULL CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  confidence_score numeric NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  emotion text NOT NULL CHECK (emotion IN ('joy', 'anger', 'sadness', 'fear', 'surprise', 'neutral')),
  keywords jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_posts" ON posts;
CREATE POLICY "select_own_posts" ON posts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_posts" ON posts;
CREATE POLICY "insert_own_posts" ON posts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_posts" ON posts;
CREATE POLICY "update_own_posts" ON posts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_posts" ON posts;
CREATE POLICY "delete_own_posts" ON posts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_sentiment ON posts(sentiment);
