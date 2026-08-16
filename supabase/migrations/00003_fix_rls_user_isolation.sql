-- Migration: Fix RLS User Isolation
--
-- Problem: The original RLS policies (00002) allow ANY user to read/write
-- ALL conversations and results, breaking user data isolation.
-- This migration replaces those open policies with user-scoped ones
-- that check the JWT sub claim or x-user-id header.
--
-- Also fixes the archives SELECT policy to only expose public records,
-- and keeps signals open (public read/write by design).

-- ============================================================
-- 1. conversations — scope to owning user
-- ============================================================
DROP POLICY IF EXISTS "Anyone can select conversations" ON conversations;
DROP POLICY IF EXISTS "Anyone can insert conversations" ON conversations;
DROP POLICY IF EXISTS "Users can read own conversations"  ON conversations;
DROP POLICY IF EXISTS "Users can insert own conversations" ON conversations;

CREATE POLICY "Users can read own conversations" ON conversations
  FOR SELECT
  USING (
    user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    OR user_id = (current_setting('request.headers', true)::json->>'x-user-id')
  );

CREATE POLICY "Users can insert own conversations" ON conversations
  FOR INSERT
  WITH CHECK (
    user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    OR user_id = (current_setting('request.headers', true)::json->>'x-user-id')
  );

-- ============================================================
-- 2. results — scope to owning user
-- ============================================================
DROP POLICY IF EXISTS "Anyone can select results" ON results;
DROP POLICY IF EXISTS "Anyone can insert results" ON results;
DROP POLICY IF EXISTS "Users can read own results"  ON results;
DROP POLICY IF EXISTS "Users can insert own results" ON results;

CREATE POLICY "Users can read own results" ON results
  FOR SELECT
  USING (
    user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    OR user_id = (current_setting('request.headers', true)::json->>'x-user-id')
  );

CREATE POLICY "Users can insert own results" ON results
  FOR INSERT
  WITH CHECK (
    user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    OR user_id = (current_setting('request.headers', true)::json->>'x-user-id')
  );

-- ============================================================
-- 3. signals — remain open (public by design)
-- ============================================================
DROP POLICY IF EXISTS "Anyone can insert signals" ON signals;
DROP POLICY IF EXISTS "Anyone can read signals"   ON signals;
DROP POLICY IF EXISTS "Anyone can select signals"  ON signals;

CREATE POLICY "Anyone can insert signals" ON signals
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read signals" ON signals
  FOR SELECT
  USING (true);

-- ============================================================
-- 4. archives — only expose public records for SELECT
-- ============================================================
DROP POLICY IF EXISTS "Anyone can read archives"      ON archives;
DROP POLICY IF EXISTS "Anyone can select public archives" ON archives;
DROP POLICY IF EXISTS "Public archives are readable"  ON archives;

CREATE POLICY "Public archives are readable" ON archives
  FOR SELECT
  USING (is_public = true);
