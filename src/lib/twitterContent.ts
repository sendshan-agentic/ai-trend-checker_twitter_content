import type { TrendingTopic, XTrend } from '@/lib/supabase';
import { formatNumber } from '@/lib/utils';
import { findRelevantHandles } from '@/lib/twitterHandles';
import { skyaCtaLine, SKYA_HASHTAG } from '@/lib/skyaBrand';

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

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trim()}…`;
}

function clean(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Deterministic shuffle so ordering looks different day to day even though
 * every day necessarily draws from the same underlying pool (only "today"
 * has real trend data — future days can't know what hasn't happened yet).
 * A fixed seed keeps re-renders stable instead of reshuffling every render.
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

function distinctPicks<T>(shuffled: T[], startIdx: number, count: number): T[] {
  if (shuffled.length === 0) return [];
  const out: T[] = [];
  for (let i = 0; i < count; i++) {
    out.push(shuffled[(startIdx + i) % shuffled.length]);
  }
  return out;
}

function buildPools(topics: TrendingTopic[], xTrends: XTrend[]) {
  const sortedTopics = [...topics].sort((a, b) => b.viral_score - a.viral_score);

  const globalTrends = xTrends.filter((t) => t.region === 'global');
  const trendPool = (globalTrends.length > 0 ? globalTrends : xTrends).slice().sort((a, b) => a.rank - b.rank);

  const hashtagPool = trendPool.map((t) => cleanHashtag(t.hashtag)).filter(Boolean);
  const fallbackHashtags = ['#AI', '#ArtificialIntelligence', '#TechNews', '#AITrends'];

  return {
    topicPool: sortedTopics,
    hashtagPool: hashtagPool.length > 0 ? hashtagPool : fallbackHashtags,
  };
}

function hashtagsFor(hashtagPool: string[], offset: number, count: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < count && hashtagPool.length > 0; i++) {
    const tag = hashtagPool[(offset + i) % hashtagPool.length];
    if (tag && !out.includes(tag)) out.push(tag);
  }
  return out.length > 0 ? out : ['#AI', '#TechNews'];
}

function mentionsFor(sourceText: string): string[] {
  return findRelevantHandles(sourceText, 2);
}

function mentionLine(mentions: string[]): string {
  return mentions.length > 0 ? `cc ${mentions.join(' ')}` : '';
}

function shortDescription(topic: TrendingTopic, max = 110): string {
  return truncate(topic.description, max);
}

/**
 * Each archetype is a genuinely different *kind* of tweet — a question, a
 * bet, a direct challenge, a contrarian angle — not a reworded copy of the
 * same "X is trending, Y people talking, category line" template. Picking a
 * different archetype per slot per day (see buildDayTweets) is what
 * actually varies the content, rather than just swapping in a new topic
 * name inside one fixed sentence shape.
 */
type Archetype = (topic: TrendingTopic, tags: string[], mentions: string[]) => string;

const ARCHETYPES: Archetype[] = [
  // 1. Stat-led question
  (topic, tags) =>
    `${formatNumber(topic.people_talking)} people are already talking about "${truncate(
      topic.title,
      90
    )}" — is this actually going to matter in 6 months, or is it just this week's noise? ${tags.join(' ')}`,

  // 2. Hot take
  (topic, tags) =>
    `Hot take: "${truncate(topic.title, 90)}" is more significant than the coverage suggests. ${shortDescription(
      topic
    )} Agree or disagree? ${tags.join(' ')}`,

  // 3. Direct question to the timeline
  (topic, tags) =>
    `Genuine question: has "${truncate(
      topic.title,
      100
    )}" actually changed how you work this week, or is it still mostly theoretical for you? Curious how far along people actually are. ${tags.join(
      ' '
    )}`,

  // 4. Prediction / binary bet
  (topic, tags) =>
    `Prediction: a year from now, "${truncate(
      topic.title,
      90
    )}" is either a footnote nobody remembers or the thing every "how we got here" thread references. No in-between. ${tags.join(' ')}`,

  // 5. Contrarian angle
  (topic, tags) =>
    `Unpopular opinion: the excitement around "${truncate(
      topic.title,
      90
    )}" says as much about our appetite for novelty as it does about the actual capability gap it closes. ${tags.join(' ')}`,

  // 6. Plain-terms explainer
  (topic, tags) =>
    `In plain terms: "${truncate(topic.title, 80)}" means ${shortDescription(
      topic,
      130
    )} That's the part most hot-take threads are skipping. ${tags.join(' ')}`,

  // 7. Direct challenge to builders in that category
  (topic, tags) =>
    `If you're building in ${topic.category.toLowerCase()}, "${truncate(
      topic.title,
      90
    )}" just quietly changed your roadmap — whether you've clocked it yet or not. What's your move? ${tags.join(' ')}`,

  // 8. Numbers-led skepticism
  (topic, tags) =>
    `${topic.viral_score}/100 viral score, ${formatNumber(
      topic.people_talking
    )} people talking — "${truncate(topic.title, 80)}" is the loudest signal in AI today. Loud doesn't always mean important though. ${tags.join(
      ' '
    )}`,

  // 9. Velocity-framed take
  (topic, tags) => {
    const velocityLine =
      topic.velocity === 'breakout'
        ? "this isn't slow-building, it's a genuine breakout"
        : topic.velocity === 'rising'
        ? 'the curve on this is still climbing, not flattening'
        : 'this has settled into the conversation as a steady fixture, not a spike';
    return `On "${truncate(topic.title, 90)}": ${velocityLine}. Worth tracking closely if you're anywhere near ${topic.category.toLowerCase()}. ${tags.join(
      ' '
    )}`;
  },

  // 10. Direct callout to the company/leader
  (topic, tags, mentions) =>
    mentions.length > 0
      ? `${mentions.join(' ')} — genuinely curious how you'd respond to the reaction "${truncate(
          topic.title,
          80
        )}" is getting right now. ${tags.join(' ')}`
      : `Someone from the team behind "${truncate(
          topic.title,
          90
        )}" should really do an AMA — the reaction to this has been bigger than the announcement itself. ${tags.join(' ')}`,

  // 11. "Nobody's saying this" angle
  (topic, tags) =>
    `What nobody's saying out loud about "${truncate(topic.title, 90)}": ${shortDescription(
      topic,
      120
    )} That's the actual story here, not the headline. ${tags.join(' ')}`,

  // 12. Comparison / ranking framing
  (topic, tags) =>
    `Against everything else that shipped this month, "${truncate(
      topic.title,
      90
    )}" is the one actually worth your attention — most of the rest is repackaged hype. Change my mind. ${tags.join(' ')}`,
];

const SKYA_ARCHETYPE_COUNT = 5; // matches skyaCtaLine's rotation length

function buildSkyaTweet(dayIndex: number, topic: TrendingTopic | undefined, tags: string[]): GeneratedTweet {
  const headline = topic ? topic.title : 'AI trends';
  const text = clean(
    `Everyone's watching "${truncate(headline, 90)}" today. ${skyaCtaLine(dayIndex % SKYA_ARCHETYPE_COUNT)} ${tags.join(
      ' '
    )}`
  );
  return {
    id: `d${dayIndex + 1}-skya`,
    text: truncate(text, 280),
    hashtags: tags,
    mentions: [],
    basedOn: headline,
  };
}

/**
 * Builds one day's 4 tweets by pairing each of 3 distinct topics with a
 * distinct archetype (no two slots in the same day share a topic OR a
 * style), plus a fixed 4th SKYA tie-in slot. Both the topic order and the
 * archetype order are shuffled per day with different seeds, so even when
 * the same small topic pool gets reused across the 5-day window (there's no
 * real future trend data — only "today" is real), the day-to-day feel is
 * genuinely different rather than the same sentence with a new noun
 * dropped in.
 */
function buildDayTweets(dayIndex: number, topicPool: TrendingTopic[], hashtagPool: string[]): GeneratedTweet[] {
  if (topicPool.length === 0 && hashtagPool.length === 0) return [];

  const topicSeed = (dayIndex + 1) * 7919;
  const archetypeSeed = (dayIndex + 1) * 104729;
  const hashtagSeed = (dayIndex + 1) * 15485863;

  const dayTopics = topicPool.length > 0 ? seededShuffle(topicPool, topicSeed) : [];
  const dayArchetypes = seededShuffle(ARCHETYPES, archetypeSeed);
  const dayHashtags = hashtagPool.length > 0 ? seededShuffle(hashtagPool, hashtagSeed) : [];

  const [topicA, topicB, topicC, topicD] = distinctPicks(dayTopics, dayIndex, 4);
  const [archetypeA, archetypeB, archetypeC] = distinctPicks(dayArchetypes, dayIndex, 3);

  const tweets: GeneratedTweet[] = [];
  const mainTopics = [topicA, topicB, topicC];
  const mainArchetypes = [archetypeA, archetypeB, archetypeC];

  mainTopics.forEach((topic, slot) => {
    if (!topic) return;
    const archetype = mainArchetypes[slot] ?? ARCHETYPES[0];
    const tags = hashtagsFor(dayHashtags, slot, slot === 1 ? 2 : 3);
    const mentions = mentionsFor(`${topic.title} ${topic.category}`);
    const withMentions =
      mentions.length > 0 && slot !== 2 // avoid double-tagging when the callout archetype already leads with mentions
        ? `${archetype(topic, tags, mentions)} ${mentionLine(mentions)}`
        : archetype(topic, tags, mentions);

    tweets.push({
      id: `d${dayIndex + 1}-${slot + 1}`,
      text: truncate(clean(withMentions), 280),
      hashtags: tags,
      mentions,
      basedOn: topic.title,
    });
  });

  // 4th slot: always the SKYA tie-in, so the brand gets one natural mention
  // per day without every tweet reading like an ad.
  const skyaTags = hashtagsFor(dayHashtags, 3, 2);
  if (!skyaTags.includes(SKYA_HASHTAG)) skyaTags.push(SKYA_HASHTAG);
  tweets.push(buildSkyaTweet(dayIndex, topicD || topicA, skyaTags));

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
      tweets: buildDayTweets(i, topicPool, hashtagPool),
    });
  }

  return days;
}
