/*
# AI Trends Research Portal - Database Schema

## Overview
Creates the complete schema for a daily AI trends research portal that tracks trending AI topics, foundational model maker announcements, researcher insights, X.com trends, and viral topic scores.

## New Tables

1. **trending_topics** - Global and regional AI trending topics with people-talking estimates and viral scores
   - id (uuid, PK)
   - title (text) - topic name
   - description (text) - what the topic is about
   - category (text) - e.g. "Agents", "Safety", "Open Source", "Multimodal"
   - region (text) - "global", "usa", "india", "eu"
   - people_talking (integer) - approximate number of people discussing
   - viral_score (integer) - 0-100 viral potential score
   - velocity (text) - "rising", "stable", "declining", "breakout"
   - date_tracked (date) - which day this trend was recorded
   - source (text) - where the data came from
   - created_at (timestamptz)

2. **model_announcements** - Announcements from foundational model makers
   - id (uuid, PK)
   - company (text) - e.g. "OpenAI", "Anthropic", "Google DeepMind"
   - model_name (text) - name of the model or product
   - announcement_date (date) - when announced
   - summary (text) - what was announced
   - key_features (text[]) - notable features
   - impact_score (integer) - 0-100 estimated impact
   - category (text) - "Frontier Model", "Open Source", "Agent", "Safety", "Infrastructure"
   - source_url (text) - link to source
   - created_at (timestamptz)

3. **researcher_insights** - What top AI researchers are saying
   - id (uuid, PK)
   - researcher_name (text)
   - affiliation (text) - their organization
   - insight (text) - what they said
   - topic (text) - related topic
   - engagement_count (integer) - approximate engagement
   - date (date)
   - created_at (timestamptz)

4. **x_trends** - X.com trending hashtags and topics by region
   - id (uuid, PK)
   - hashtag (text)
   - region (text) - "global", "usa", "india", "eu"
   - rank (integer) - ranking position
   - post_volume (text) - e.g. "2.1M posts", "450K posts"
   - trend_date (date)
   - created_at (timestamptz)

5. **viral_scores** - Viral topic meter scoring
   - id (uuid, PK)
   - topic_name (text)
   - viral_score (integer) - 0-100 overall viral potential
   - velocity_score (integer) - 0-100 how fast it's growing
   - momentum_score (integer) - 0-100 sustained interest
   - breakout_probability (integer) - 0-100 chance of going viral
   - region (text)
   - date (date)
   - reasoning (text) - why this score
   - created_at (timestamptz)

6. **daily_reports** - Daily compiled summary
   - id (uuid, PK)
   - report_date (date, unique)
   - top_topic (text)
   - total_topics_tracked (integer)
   - total_announcements (integer)
   - summary (text)
   - created_at (timestamptz)

## Security
- All tables have RLS enabled
- All tables allow anon + authenticated CRUD (single-tenant public portal, no sign-in)
*/

-- 1. trending_topics
CREATE TABLE IF NOT EXISTS trending_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  region text NOT NULL DEFAULT 'global',
  people_talking integer NOT NULL DEFAULT 0,
  viral_score integer NOT NULL DEFAULT 0,
  velocity text NOT NULL DEFAULT 'stable',
  date_tracked date NOT NULL DEFAULT CURRENT_DATE,
  source text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE trending_topics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_trending_topics" ON trending_topics;
CREATE POLICY "anon_select_trending_topics" ON trending_topics FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_trending_topics" ON trending_topics;
CREATE POLICY "anon_insert_trending_topics" ON trending_topics FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_trending_topics" ON trending_topics;
CREATE POLICY "anon_update_trending_topics" ON trending_topics FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_trending_topics" ON trending_topics;
CREATE POLICY "anon_delete_trending_topics" ON trending_topics FOR DELETE
  TO anon, authenticated USING (true);

-- 2. model_announcements
CREATE TABLE IF NOT EXISTS model_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company text NOT NULL,
  model_name text NOT NULL,
  announcement_date date NOT NULL,
  summary text NOT NULL,
  key_features text[] DEFAULT '{}',
  impact_score integer NOT NULL DEFAULT 50,
  category text NOT NULL,
  source_url text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE model_announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_model_announcements" ON model_announcements;
CREATE POLICY "anon_select_model_announcements" ON model_announcements FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_model_announcements" ON model_announcements;
CREATE POLICY "anon_insert_model_announcements" ON model_announcements FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_model_announcements" ON model_announcements;
CREATE POLICY "anon_update_model_announcements" ON model_announcements FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_model_announcements" ON model_announcements;
CREATE POLICY "anon_delete_model_announcements" ON model_announcements FOR DELETE
  TO anon, authenticated USING (true);

-- 3. researcher_insights
CREATE TABLE IF NOT EXISTS researcher_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  researcher_name text NOT NULL,
  affiliation text NOT NULL,
  insight text NOT NULL,
  topic text NOT NULL,
  engagement_count integer NOT NULL DEFAULT 0,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE researcher_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_researcher_insights" ON researcher_insights;
CREATE POLICY "anon_select_researcher_insights" ON researcher_insights FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_researcher_insights" ON researcher_insights;
CREATE POLICY "anon_insert_researcher_insights" ON researcher_insights FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_researcher_insights" ON researcher_insights;
CREATE POLICY "anon_update_researcher_insights" ON researcher_insights FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_researcher_insights" ON researcher_insights;
CREATE POLICY "anon_delete_researcher_insights" ON researcher_insights FOR DELETE
  TO anon, authenticated USING (true);

-- 4. x_trends
CREATE TABLE IF NOT EXISTS x_trends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hashtag text NOT NULL,
  region text NOT NULL DEFAULT 'global',
  rank integer NOT NULL DEFAULT 1,
  post_volume text NOT NULL,
  trend_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE x_trends ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_x_trends" ON x_trends;
CREATE POLICY "anon_select_x_trends" ON x_trends FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_x_trends" ON x_trends;
CREATE POLICY "anon_insert_x_trends" ON x_trends FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_x_trends" ON x_trends;
CREATE POLICY "anon_update_x_trends" ON x_trends FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_x_trends" ON x_trends;
CREATE POLICY "anon_delete_x_trends" ON x_trends FOR DELETE
  TO anon, authenticated USING (true);

-- 5. viral_scores
CREATE TABLE IF NOT EXISTS viral_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_name text NOT NULL,
  viral_score integer NOT NULL DEFAULT 0,
  velocity_score integer NOT NULL DEFAULT 0,
  momentum_score integer NOT NULL DEFAULT 0,
  breakout_probability integer NOT NULL DEFAULT 0,
  region text NOT NULL DEFAULT 'global',
  date date NOT NULL DEFAULT CURRENT_DATE,
  reasoning text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE viral_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_viral_scores" ON viral_scores;
CREATE POLICY "anon_select_viral_scores" ON viral_scores FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_viral_scores" ON viral_scores;
CREATE POLICY "anon_insert_viral_scores" ON viral_scores FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_viral_scores" ON viral_scores;
CREATE POLICY "anon_update_viral_scores" ON viral_scores FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_viral_scores" ON viral_scores;
CREATE POLICY "anon_delete_viral_scores" ON viral_scores FOR DELETE
  TO anon, authenticated USING (true);

-- 6. daily_reports
CREATE TABLE IF NOT EXISTS daily_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date date UNIQUE NOT NULL DEFAULT CURRENT_DATE,
  top_topic text,
  total_topics_tracked integer NOT NULL DEFAULT 0,
  total_announcements integer NOT NULL DEFAULT 0,
  summary text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_daily_reports" ON daily_reports;
CREATE POLICY "anon_select_daily_reports" ON daily_reports FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_daily_reports" ON daily_reports;
CREATE POLICY "anon_insert_daily_reports" ON daily_reports FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_daily_reports" ON daily_reports;
CREATE POLICY "anon_update_daily_reports" ON daily_reports FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_daily_reports" ON daily_reports;
CREATE POLICY "anon_delete_daily_reports" ON daily_reports FOR DELETE
  TO anon, authenticated USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_trending_topics_date ON trending_topics(date_tracked);
CREATE INDEX IF NOT EXISTS idx_trending_topics_region ON trending_topics(region);
CREATE INDEX IF NOT EXISTS idx_model_announcements_date ON model_announcements(announcement_date);
CREATE INDEX IF NOT EXISTS idx_x_trends_date ON x_trends(trend_date);
CREATE INDEX IF NOT EXISTS idx_viral_scores_date ON viral_scores(date);
CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON daily_reports(report_date);
