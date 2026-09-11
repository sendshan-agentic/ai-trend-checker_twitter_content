import type { TrendingTopic, XTrend } from '@/lib/supabase';
import { formatNumber } from '@/lib/utils';
import { findRelevantHandles } from '@/lib/twitterHandles';

export type GeneratedTweet = {
  id: string;
  text: string;
  hashtags: string[];
  mentions: string[];
  basedOn: string;
};

export type DayPlan = {
  day: number;
  label: string;
  dateISO: string;
  tweets: GeneratedTweet[];
};

function cleanHashtag(tag: string): string {
  const trimmed = tag.trim();
  if (!trimmed) return '';
  return trimmed.startsWith('#') ? trimmed : `#${trimmed.replace(/\s+/g, '')}`;
}

function pick<T>(arr: T[], idx: number): T | undefined {
  if (arr.length === 0) return undefined;
  return arr[idx % arr.length];
}

/**
 * Deterministic shuffle so day-to-day ordering looks different even though
 * every day draws from the same underlying pool (only "today" has real
 * trend data — days 2-5 can't know the future, so they reuse today's
 * signal). A fixed seed keeps re-renders stable instead of reshuffling on
 * every keystroke/render.
 */
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const out = [...arr];
  let s = seed || 1;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trim()}…`;
}

/**
 * Builds a rotating pool of the strongest trending topics (by viral score)
 * and strongest hashtags (by rank, global region preferred) so each day of
 * content draws on fresh, high-signal material instead of repeating.
 */
function buildPools(topics: TrendingTopic[], xTrends: XTrend[]) {
  const sortedTopics = [...topics].sort((a, b) => b.viral_score - a.viral_score);

  const globalTrends = xTrends.filter((t) => t.region === 'global');
  const trendPool = (globalTrends.length > 0 ? globalTrends : xTrends)
    .slice()
    .sort((a, b) => a.rank - b.rank);

  const hashtagPool = trendPool.map((t) => cleanHashtag(t.hashtag)).filter(Boolean);
  const fallbackHashtags = ['#AI', '#ArtificialIntelligence', '#TechNews', '#AITrends'];

  return {
    topicPool: sortedTopics,
    trendPool,
    hashtagPool: hashtagPool.length > 0 ? hashtagPool : fallbackHashtags,
  };
}

function hashtagsFor(hashtagPool: string[], offset: number, count: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < count && hashtagPool.length > 0; i++) {
    const tag = pick(hashtagPool, offset + i);
    if (tag && !out.includes(tag)) out.push(tag);
  }
  return out.length > 0 ? out : ['#AI', '#TechNews'];
}

const OPENERS = [
  (t: string) => `${t} is picking up serious momentum`,
  (t: string) => `Keeping an eye on ${t} today`,
  (t: string) => `${t} is still the story everyone's watching`,
  (t: string) => `Circling back to ${t} because it's still moving`,
  (t: string) => `${t} continues to dominate the feed`,
];

const QUESTIONS = [
  (subject: string) => `are you already using AI for ${subject}, or still on the fence?`,
  (subject: string) => `has ${subject} actually changed how your team works, or is it still hype?`,
  (subject: string) => `where do you land on ${subject} — game changer or overrated?`,
  (subject: string) => `what's your honest take on ${subject} so far?`,
  (subject: string) => `is ${subject} on your radar yet, or flying under it?`,
];

const RECAP_LEADS = [
  'AI pulse check',
  'What\u2019s trending in AI',
  'Today\u2019s signal',
  'Worth bookmarking',
  'Catching up on AI',
];

/**
 * Picks `count` distinct items from a shuffled pool, wrapping back to the
 * start (with a further rotation) only once every item has been used once —
 * this spreads repeats out instead of clustering the same 1-2 items together
 * when the pool is small.
 */
function distinctPicks<T>(shuffled: T[], startIdx: number, count: number): T[] {
  if (shuffled.length === 0) return [];
  const out: T[] = [];
  for (let i = 0; i < count; i++) {
    out.push(shuffled[(startIdx + i) % shuffled.length]);
  }
  return out;
}

function mentionsFor(sourceText: string): string[] {
  return findRelevantHandles(sourceText, 2);
}

function mentionLine(mentions: string[]): string {
  return mentions.length > 0 ? `cc ${mentions.join(' ')}` : '';
}

/**
 * Four distinct tweet "slots" per day, each with its own voice/angle so the
 * daily batch doesn't read as four copies of the same template. Each day
 * gets its own shuffled view of the (necessarily shared, since only "today"
 * has real trend data) topic/hashtag pool, plus rotating phrasing, so reused
 * topics still read as fresh posts rather than duplicates.
 */
function buildDayTweets(
  dayIndex: number,
  topicPool: TrendingTopic[],
  hashtagPool: string[]
): GeneratedTweet[] {
  const tweets: GeneratedTweet[] = [];
  const seed = (dayIndex + 1) * 7919; // distinct prime-ish seed per day

  const dayTopics = topicPool.length > 0 ? seededShuffle(topicPool, seed) : [];
  const dayHashtags = hashtagPool.length > 0 ? seededShuffle(hashtagPool, seed + 3) : [];

  const [topicA, topicB, topicC, topicD] = distinctPicks(dayTopics, dayIndex, 4);
  const opener = OPENERS[dayIndex % OPENERS.length];
  const question = QUESTIONS[dayIndex % QUESTIONS.length];
  const recapLead = RECAP_LEADS[dayIndex % RECAP_LEADS.length];

  // Slot 1: Insight / stat tweet built on a top trending topic
  if (topicA) {
    const tags = hashtagsFor(dayHashtags, 0, 3);
    const mentions = mentionsFor(`${topicA.title} ${topicA.category}`);
    const text = `${opener(truncate(topicA.title, 120))} — ${formatNumber(
      topicA.people_talking
    )} people are already talking about it (viral score: ${topicA.viral_score}/100). If you're in ${topicA.category.toLowerCase()}, this is worth watching closely. ${mentionLine(
      mentions
    )} ${tags.join(' ')}`;
    tweets.push({
      id: `d${dayIndex + 1}-1`,
      text: truncate(text.replace(/\s+/g, ' ').trim(), 280),
      hashtags: tags,
      mentions,
      basedOn: topicA.title,
    });
  }

  // Slot 2: Engagement / question tweet built around a trending hashtag
  const trendHashtag = pick(dayHashtags, 1) || '#AI';
  {
    const tags = hashtagsFor(dayHashtags, 1, 3);
    const subject = topicB ? topicB.title.toLowerCase() : 'AI right now';
    const mentions = mentionsFor(`${trendHashtag} ${topicB?.title ?? ''}`);
    const text = `${trendHashtag} is trending today. Quick question for this timeline: ${question(
      subject
    )} Drop a reply — genuinely curious how far along everyone is. ${mentionLine(mentions)} ${tags
      .filter((t) => t !== trendHashtag)
      .join(' ')}`;
    tweets.push({
      id: `d${dayIndex + 1}-2`,
      text: truncate(text.replace(/\s+/g, ' ').trim(), 280),
      hashtags: tags,
      mentions,
      basedOn: trendHashtag,
    });
  }

  // Slot 3: Hot take / opinion tweet built on a (different) top topic
  if (topicC) {
    const tags = hashtagsFor(dayHashtags, 2, 2);
    const mentions = mentionsFor(`${topicC.title} ${topicC.description}`);
    const velocityLine =
      topicC.velocity === 'breakout'
        ? "This isn't slow-building — it's a genuine breakout."
        : topicC.velocity === 'rising'
        ? 'The curve on this is still climbing.'
        : 'This has settled into the conversation as a steady fixture.';
    const text = `Hot take: "${truncate(topicC.title, 100)}" deserves more attention than it's getting. ${velocityLine} ${truncate(
      topicC.description,
      110
    )} ${mentionLine(mentions)} ${tags.join(' ')}`;
    tweets.push({
      id: `d${dayIndex + 1}-3`,
      text: truncate(text.replace(/\s+/g, ' ').trim(), 280),
      hashtags: tags,
      mentions,
      basedOn: topicC.title,
    });
  }

  // Slot 4: Recap / CTA tweet summarizing the day's signal
  const topicForRecap = topicD || topicA;
  {
    const tags = hashtagsFor(dayHashtags, 3, 3);
    const headline = topicForRecap ? topicForRecap.title : 'AI trends';
    const mentions = mentionsFor(headline);
    const text = `${recapLead}: "${truncate(
      headline,
      120
    )}" is leading the conversation. Bookmark this and follow along — we're tracking what's actually breaking through the noise, not just what's loud. ${mentionLine(
      mentions
    )} ${tags.join(' ')}`;
    tweets.push({
      id: `d${dayIndex + 1}-4`,
      text: truncate(text.replace(/\s+/g, ' ').trim(), 280),
      hashtags: tags,
      mentions,
      basedOn: headline,
    });
  }

  return tweets;
}

export function generateFiveDayTwitterPlan(
  topics: TrendingTopic[],
  xTrends: XTrend[],
  startDate: Date = new Date()
): DayPlan[] {
  const { topicPool, hashtagPool } = buildPools(topics, xTrends);

  const days: DayPlan[] = [];
  for (let i = 0; i < 5; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateISO = date.toISOString().slice(0, 10);
    const label = date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });

    days.push({
      day: i + 1,
      label,
      dateISO,
      tweets: topicPool.length > 0 || hashtagPool.length > 0 ? buildDayTweets(i, topicPool, hashtagPool) : [],
    });
  }

  return days;
}
