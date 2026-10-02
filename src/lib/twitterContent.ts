import type { TrendingTopic, XTrend } from '@/lib/supabase';
import { findRelevantHandles } from '@/lib/twitterHandles';
import { skyaFeatureLine, SKYA_HASHTAG } from '@/lib/skyaBrand';

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
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  const safe = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${safe.trim()}…`;
}

function clean(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

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

type ContentUnit = {
  id: string;
  kind: 'topic' | 'hashtag';
  title: string;
  blurb: string;
  category: string;
  primaryTag: string;
  matchText: string;
};

function topicsToUnits(topics: TrendingTopic[]): ContentUnit[] {
  return [...topics]
    .sort((a, b) => b.viral_score - a.viral_score)
    .map((t) => ({
      id: `topic-${t.id}`,
      kind: 'topic' as const,
      title: t.title,
      blurb: t.description,
      category: t.category,
      primaryTag: cleanHashtag(t.title.split(/[\s—-]+/)[0] || 'AI'),
      matchText: `${t.title} ${t.category}`,
    }));
}

function hashtagsToUnits(xTrends: XTrend[], topics: TrendingTopic[]): ContentUnit[] {
  const globalTrends = xTrends.filter((t) => t.region === 'global');
  const pool = (globalTrends.length > 0 ? globalTrends : xTrends).slice().sort((a, b) => a.rank - b.rank);
  const topicWords = topics.map((t) => t.title.toLowerCase().replace(/[^a-z0-9]/g, ''));

  return pool
    .filter((t) => {
      const tag = t.hashtag.toLowerCase().replace(/[^a-z0-9]/g, '');
      return !topicWords.some((tw) => tw.includes(tag) || tag.includes(tw.slice(0, 6)));
    })
    .map((t) => ({
      id: `hashtag-${t.id}`,
      kind: 'hashtag' as const,
      title: cleanHashtag(t.hashtag),
      blurb: `the #${t.rank} trending AI hashtag today`,
      category: 'AI Trends',
      primaryTag: cleanHashtag(t.hashtag),
      matchText: t.hashtag,
    }));
}

function hashtagsFor(hashtagPool: string[], offset: number, count: number, avoid: string[] = []): string[] {
  const out: string[] = [];
  for (let i = 0; i < hashtagPool.length && out.length < count; i++) {
    const tag = hashtagPool[(offset + i) % hashtagPool.length];
    if (tag && !out.includes(tag) && !avoid.includes(tag)) out.push(tag);
  }
  if (out.length === 0) out.push('#AI', '#TechNews');
  return out;
}

function mentionsFor(sourceText: string, max = 3): string[] {
  return findRelevantHandles(sourceText, max);
}

/**
 * Short, human phrasings for referencing one item inside a roundup — e.g.
 * "X just dropped" or "X is the one everyone's buzzing about" — varied per
 * day and per position so three items stitched together don't all sound
 * like they came from the same fill-in-the-blank sentence.
 */
function describeItem(unit: ContentUnit, phrasingIndex: number, blurbMax: number): string {
  const name = unit.kind === 'topic' ? `"${truncate(unit.title, 60)}"` : unit.title;
  const blurbRaw = truncate(unit.blurb, blurbMax);
  // Strip any trailing period from the raw blurb before splicing it into a
  // template that supplies its own punctuation — otherwise a description
  // that already ends in "." collides with the template's own "." and
  // produces an obvious ".." artifact.
  const blurb = blurbRaw.endsWith('…') ? blurbRaw : blurbRaw.replace(/\.+$/, '');

  // Deliberately mixed sentence shapes — short fragments, a question, a
  // plain statement, an aside in parentheses — so three items stitched
  // together don't scan as the same sentence with the noun swapped out,
  // which is the single biggest tell of generated copy.
  const topicPhrasings = [
    () => `${name} just happened. ${blurb}`,
    () => `so ${name} is a thing now — ${blurb}`,
    () => `${blurb}. that's ${name} for you`,
    () => `not gonna lie, ${name} caught me off guard. ${blurb}`,
    () => `${name}? yeah, ${blurb}`,
    () => `biggest one today is ${name} — ${blurb}`,
  ];

  const hashtagPhrasings = [
    () => `${name} is everywhere right now, no idea why it took off`,
    () => `also seeing a lot of ${name} today`,
    () => `${name} climbing the charts — worth a look`,
    () => `and ${name} is trending again, for what it's worth`,
  ];

  const pool = unit.kind === 'topic' ? topicPhrasings : hashtagPhrasings;
  return pool[phrasingIndex % pool.length]();
}

const WORLD_INTROS = [
  "what's actually happening in AI today —",
  'quick AI roundup:',
  "a couple of things worth knowing today:",
  "scanning today's AI news, two things stood out.",
  'the AI world kept moving today.',
  "today in AI, briefly:",
  "here's what's trending in AI right now.",
  "not a slow day in AI —",
];

const WORLD_CLOSERS = [
  'which one are you watching?',
  "what's catching your eye here?",
  'curious which of these actually matters in a year.',
  'honestly not sure which one is overhyped yet.',
  "which of these is the real story, you tell me.",
  '',
  '',
];

/**
 * Builds one day's "what's happening" post as a short, human-sounding
 * roundup stitching together 2-3 real trending items, rather than one
 * template sentence about a single topic. Combining different real items
 * each day (the pool keeps rotating forward, never resetting) is what
 * makes repetition genuinely avoidable even with a small daily data set —
 * the combination itself, not just the wording, changes day to day.
 */
function buildWorldRoundup(
  dayIndex: number,
  units: ContentUnit[],
  hashtagPool: string[],
  usedTexts: Set<string>
): GeneratedTweet {
  if (units.length === 0) {
    return {
      id: `d${dayIndex + 1}-world`,
      text: "No fresh trend data to report yet today — check back once today's scan completes.",
      hashtags: [],
      mentions: [],
      basedOn: 'none',
    };
  }

  // Capped at 2 items: 3 real stories plus an intro, a closer and hashtags
  // reliably blows past 280 characters, which is what was cutting the tweet
  // off mid-sentence with no closer or tags at all. Two items, written long
  // enough to feel like real sentences, fits the budget honestly.
  const itemsPerPost = Math.min(units.length, 2);
  const startIdx = dayIndex * 2; // advances the rotation every day, two full day-slots at a time
  const picked: ContentUnit[] = [];
  for (let i = 0; i < itemsPerPost; i++) {
    picked.push(units[(startIdx + i) % units.length]);
  }

  const introSeed = dayIndex;
  let attempt = 0;
  let text = '';
  const tags = picked.flatMap((u) => hashtagsFor(hashtagPool, startIdx, 1, [u.primaryTag]));
  const dedupedTags = [...new Set(tags)].slice(0, 2);
  const tagsStr = dedupedTags.join(' ');

  // Hard duplicate guard: keep rotating the intro/closer/phrasing offsets
  // until the text is provably not identical to anything already produced
  // in this plan. With dozens of intro/closer/phrasing combinations this
  // resolves almost immediately; it exists as a backstop, not the main
  // mechanism. Length is budgeted BEFORE assembly (blurbs are sized to fit
  // along with the intro, closer and hashtags) so nothing gets silently cut
  // off at the 280-char limit — a final truncate() is a safety net, not the
  // normal path.
  do {
    const intro = WORLD_INTROS[(introSeed + attempt) % WORLD_INTROS.length];
    const closer = WORLD_CLOSERS[(introSeed + attempt * 3) % WORLD_CLOSERS.length];

    const fixedLen = intro.length + closer.length + tagsStr.length + (picked.length - 1) * 2 + 10;
    const budgetPerItem = Math.max(40, Math.floor((270 - fixedLen) / picked.length));

    const sentences = picked
      .map((u, i) => describeItem(u, introSeed + attempt + i, budgetPerItem))
      .map((s) => s.replace(/[.…]+$/, '').trim());

    const body = `${sentences.join('. ')}.`;

    const parts = [intro, body, closer, tagsStr].filter(Boolean);
    text = truncate(clean(parts.join(' ')), 280);
    attempt++;
  } while (usedTexts.has(text) && attempt < 20);

  usedTexts.add(text);

  const mentions = mentionsFor(picked.map((u) => u.matchText).join(' '), 2);
  const finalTags = [...new Set(picked.flatMap((u) => hashtagsFor(hashtagPool, startIdx, 1, [u.primaryTag]))).values()].slice(0, 3);

  return {
    id: `d${dayIndex + 1}-world`,
    text,
    hashtags: finalTags,
    mentions,
    basedOn: picked.map((u) => u.title).join(', '),
  };
}

/**
 * Builds the day's SKYA post — led by one of its real feature/USP lines,
 * not a restatement of the day's trending topic.
 */
function buildSkyaTweet(dayIndex: number, hashtagPool: string[], usedTexts: Set<string>): GeneratedTweet {
  let attempt = 0;
  let text = '';
  do {
    const feature = skyaFeatureLine(dayIndex + attempt);
    const tags = hashtagsFor(hashtagPool, dayIndex + attempt, 1);
    const finalTags = [...new Set([...tags, SKYA_HASHTAG])];
    text = truncate(clean(`${feature} ${finalTags.join(' ')}`), 280);
    attempt++;
  } while (usedTexts.has(text) && attempt < 20);

  usedTexts.add(text);

  return {
    id: `skya-${dayIndex}`,
    text,
    hashtags: [SKYA_HASHTAG],
    mentions: [],
    basedOn: 'SKYA',
  };
}

export function generateFiveDayTwitterPlan(
  topics: TrendingTopic[],
  xTrends: XTrend[],
  startDate: Date = new Date()
): DayPlan[] {
  const topicUnits = topicsToUnits(topics);
  const hashtagUnits = hashtagsToUnits(xTrends, topics);

  const globalHashtagPool =
    xTrends.length > 0
      ? xTrends.slice().sort((a, b) => a.rank - b.rank).map((t) => cleanHashtag(t.hashtag)).filter(Boolean)
      : ['#AI', '#ArtificialIntelligence', '#TechNews', '#AITrends'];

  // Shuffle topics and hashtags separately, then put topics first. Topics
  // carry the actual story (a headline + description); hashtags are just a
  // trending tag with no real narrative behind them. Putting topics first
  // means the "what's happening" roundup leads with real stories on as many
  // days as there are topics, and only falls back to hashtag-only items once
  // every real topic has already been featured.
  const shuffledTopics = topicUnits.length > 0 ? seededShuffle(topicUnits, 424243) : [];
  const shuffledHashtagUnits = hashtagUnits.length > 0 ? seededShuffle(hashtagUnits, 909091) : [];
  const shuffledUnits = [...shuffledTopics, ...shuffledHashtagUnits];
  const usedTexts = new Set<string>();

  const days: DayPlan[] = [];
  for (let dayIndex = 0; dayIndex < 5; dayIndex++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + dayIndex);
    const dateISO = date.toISOString().slice(0, 10);
    const label = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

    const worldTweet = buildWorldRoundup(dayIndex, shuffledUnits, globalHashtagPool, usedTexts);
    const skyaTweet = buildSkyaTweet(dayIndex, globalHashtagPool, usedTexts);

    days.push({ day: dayIndex + 1, label, dateISO, tweets: [worldTweet, skyaTweet] });
  }

  return days;
}
