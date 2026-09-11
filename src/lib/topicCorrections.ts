import type { TrendingTopic } from '@/lib/supabase';

/**
 * Manual correction layer for trending topics.
 *
 * The topic data comes from an automated pipeline (the daily-trends-update
 * Supabase function), which occasionally gets a fact wrong — e.g. describing
 * a tool's category incorrectly. Rather than editing the database by hand
 * every time, add an entry here: whenever a topic's title contains `match`
 * (case-insensitive), the listed fields are overridden everywhere the topic
 * is used across the app (cards, Twitter content plan, DOCX export).
 *
 * This list is meant to be edited by non-engineers on the team — just add a
 * new object to the array below whenever something is wrong.
 */
export type TopicCorrection = {
  /** Case-insensitive substring to match against the topic's title. */
  match: string;
  title?: string;
  category?: string;
  description?: string;
};

export const TOPIC_CORRECTIONS: TopicCorrection[] = [
  {
    match: 'meta muse',
    title: 'Meta Muse — AI Personal Agent',
    category: 'AI Agents',
    description:
      "Meta's Muse is an AI personal agent designed to handle day-to-day tasks and assist users directly, not a music-generation tool.",
  },
  // Add more corrections below as they come up, e.g.:
  // { match: 'some wrong topic name', title: 'Correct Title', category: 'Correct Category' },
];

export function applyTopicCorrections(topics: TrendingTopic[]): TrendingTopic[] {
  if (topics.length === 0 || TOPIC_CORRECTIONS.length === 0) return topics;

  return topics.map((topic) => {
    const correction = TOPIC_CORRECTIONS.find((c) =>
      topic.title.toLowerCase().includes(c.match.toLowerCase())
    );
    if (!correction) return topic;

    return {
      ...topic,
      title: correction.title ?? topic.title,
      category: correction.category ?? topic.category,
      description: correction.description ?? topic.description,
    };
  });
}
