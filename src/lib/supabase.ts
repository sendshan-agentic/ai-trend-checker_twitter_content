import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type TrendingTopic = {
  id: string;
  title: string;
  description: string;
  category: string;
  region: string;
  people_talking: number;
  viral_score: number;
  velocity: string;
  date_tracked: string;
  source: string | null;
  created_at: string;
};

export type ModelAnnouncement = {
  id: string;
  company: string;
  model_name: string;
  announcement_date: string;
  summary: string;
  key_features: string[];
  impact_score: number;
  category: string;
  source_url: string | null;
  created_at: string;
};

export type ResearcherInsight = {
  id: string;
  researcher_name: string;
  affiliation: string;
  insight: string;
  topic: string;
  engagement_count: number;
  date: string;
  created_at: string;
};

export type XTrend = {
  id: string;
  hashtag: string;
  region: string;
  rank: number;
  post_volume: string;
  trend_date: string;
  created_at: string;
};

export type ViralScore = {
  id: string;
  topic_name: string;
  viral_score: number;
  velocity_score: number;
  momentum_score: number;
  breakout_probability: number;
  region: string;
  date: string;
  reasoning: string | null;
  created_at: string;
};

export type DailyReport = {
  id: string;
  report_date: string;
  top_topic: string;
  total_topics_tracked: number;
  total_announcements: number;
  summary: string;
  created_at: string;
};
