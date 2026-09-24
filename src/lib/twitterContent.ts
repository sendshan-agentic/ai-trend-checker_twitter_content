import type { TrendingTopic, XTrend } from '@/lib/supabase';
import { formatNumber } from '@/lib/utils';
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
  return `${text.slice(0, max - 1).trim()}…`;
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

/**
 * A single piece of real, sourced content — either a full trending topic
 * (rich: title, description, viral score, live discussion count) or a
 * trending hashtag on its own (lighter: we only honestly know its rank and
 * the hashtag text itself, so its copy stays scoped to what's actually
 * true — "the #3 trending AI hashtag today" — never inventing stats a
 * hashtag-only entry doesn't have).
 *
 * Combining both into one pool is what lets a day with only 4-6 real
 * trending *topics* still produce a meaningfully larger set of genuinely
 * distinct content instead of recycling the same handful of topics inside
 * reworded sentences.
 */
type ContentUnit = {
  id: string;
  kind: 'topic' | 'hashtag';
  title: string;
  blurb: string;
  category: string;
  viralScore?: number;
  peopleTalking?: number;
  velocity?: string;
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
      viralScore: t.viral_score,
      peopleTalking: t.people_talking,
      velocity: t.velocity,
      primaryTag: cleanHashtag(t.title.split(/[\s—-]+/)[0] || 'AI'),
      matchText: `${t.title} ${t.category}`,
    }));
}

/** Hashtags whose text already substantially overlaps a topic's title are
 * skipped as their own unit — they're the same story, not new content. */
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

function mentionsFor(sourceText: string): string[] {
  return findRelevantHandles(sourceText, 2);
}

function mentionLine(mentions: string[]): string {
  return mentions.length > 0 ? `cc ${mentions.join(' ')}` : '';
}

/**
 * Archetypes that need a rich description/stats — only used for full
 * "topic" units, since a bare hashtag unit doesn't have that data and we
 * never invent it.
 */
type RichArchetype = (unit: ContentUnit, tags: string[], mentions: string[]) => string;

const RICH_ARCHETYPES: RichArchetype[] = [
  (u, tags) =>
    `${formatNumber(u.peopleTalking ?? 0)} people are already talking about "${truncate(
      u.title,
      90
    )}" — is this actually going to matter in 6 months, or is it just this week's noise? ${tags.join(' ')}`,

  (u, tags) =>
    `Hot take: "${truncate(u.title, 90)}" is more significant than the coverage suggests. ${truncate(
      u.blurb,
      110
    )} Agree or disagree? ${tags.join(' ')}`,

  (u, tags) =>
    `Genuine question: has "${truncate(
      u.title,
      100
    )}" actually changed how you work this week, or is it still mostly theoretical for you? ${tags.join(' ')}`,

  (u, tags) =>
    `Prediction: a year from now, "${truncate(
      u.title,
      90
    )}" is either a footnote nobody remembers or the thing every "how we got here" thread references. No in-between. ${tags.join(
      ' '
    )}`,

  (u, tags) =>
    `Unpopular opinion: the excitement around "${truncate(
      u.title,
      90
    )}" says as much about our appetite for novelty as the actual capability gap it closes. ${tags.join(' ')}`,

  (u, tags) =>
    `In plain terms: "${truncate(u.title, 80)}" means ${truncate(
      u.blurb,
      130
    )} That's the part most hot-take threads are skipping. ${tags.join(' ')}`,

  (u, tags) =>
    `If you're building in ${u.category.toLowerCase()}, "${truncate(
      u.title,
      90
    )}" just quietly changed your roadmap — whether you've clocked it yet or not. What's your move? ${tags.join(' ')}`,

  (u, tags) =>
    `${u.viralScore ?? '—'}/100 viral score, ${formatNumber(
      u.peopleTalking ?? 0
    )} people talking — "${truncate(u.title, 80)}" is one of the loudest signals in AI today. Loud doesn't always mean important. ${tags.join(
      ' '
    )}`,

  (u, tags) => {
    const velocityLine =
      u.velocity === 'breakout'
        ? "this isn't slow-building, it's a genuine breakout"
        : u.velocity === 'rising'
        ? 'the curve on this is still climbing, not flattening'
        : 'this has settled into the conversation as a steady fixture, not a spike';
    return `On "${truncate(u.title, 90)}": ${velocityLine}. Worth tracking if you're anywhere near ${u.category.toLowerCase()}. ${tags.join(
      ' '
    )}`;
  },

  (u, tags, mentions) =>
    mentions.length > 0
      ? `${mentions.join(' ')} — genuinely curious how you'd respond to the reaction "${truncate(
          u.title,
          80
        )}" is getting right now. ${tags.join(' ')}`
      : `Someone from the team behind "${truncate(
          u.title,
          90
        )}" should really do an AMA — the reaction has outpaced the announcement itself. ${tags.join(' ')}`,

  (u, tags) =>
    `What nobody's saying out loud about "${truncate(u.title, 90)}": ${truncate(
      u.blurb,
      120
    )} That's the actual story here, not the headline. ${tags.join(' ')}`,

  (u, tags) =>
    `Against everything else that shipped this month, "${truncate(
      u.title,
      90
    )}" is the one actually worth your attention — most of the rest is repackaged hype. Change my mind. ${tags.join(' ')}`,
];

/**
 * Lighter archetypes for hashtag-only units — scoped strictly to what we
 * actually know (its rank, that it's trending) rather than inventing a
 * description or stats a bare hashtag doesn't have.
 */
type LightArchetype = (unit: ContentUnit, tags: string[]) => string;

const LIGHT_ARCHETYPES: LightArchetype[] = [
  (u, tags) => `${u.title} is ${u.blurb} — anyone actually tracking what's driving it, or is this just algorithm noise? ${tags.join(' ')}`,
  (u, tags) => `Keeping an eye on ${u.title} — it's ${u.blurb}, which usually means something real is brewing underneath. ${tags.join(' ')}`,
  (u, tags) => `${u.title} climbing the charts today (${u.blurb}). Curious what's fueling it — drop your theory below. ${tags.join(' ')}`,
  (u, tags) => `Not everything trending deserves attention, but ${u.title} being ${u.blurb} is worth a second look. ${tags.join(' ')}`,
];

/**
 * Guaranteed once-per-day "storytelling" slot: a myth vs. fact framing.
 * Kept separate from the general archetype pools (rather than picked
 * randomly) so every single day reliably includes exactly one of these,
 * per the requested format — with the slot position rotated day to day so
 * it doesn't always land in the same spot on the page.
 */
function mythVsFactRich(u: ContentUnit, tags: string[]): string {
  return `Myth: "${truncate(
    u.title,
    80
  )}" changes everything overnight. Fact: ${truncate(
    u.blurb,
    120
  )} Real adoption still takes months of integration, testing, and change management. ${tags.join(' ')}`;
}

function mythVsFactLight(u: ContentUnit, tags: string[]): string {
  return `Myth: a hashtag trending means the tech behind it is mature and ready to use. Fact: ${u.title} being ${u.blurb} mostly reflects attention, not readiness. Worth remembering before you commit budget. ${tags.join(
    ' '
  )}`;
}

function hashSeed(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) % 1000000007;
  }
  return h || 1;
}

const SKYA_ROTATION = 8; // matches skyaFeatureLine's rotation length

function buildSkyaTweet(globalIndex: number, unit: ContentUnit | undefined, tags: string[]): GeneratedTweet {
  // Leads with SKYA's own feature/USP, not a restatement of the day's
  // trending topic — only a very light, optional categorical nod at the
  // end keeps it from feeling completely disconnected from the rest of the
  // day's content, without making SKYA's own message secondary.
  const feature = skyaFeatureLine(globalIndex);
  const categoryNote = unit ? ` Worth asking even in ${unit.category.toLowerCase()}.` : '';
  const text = clean(`${feature}${categoryNote} ${tags.join(' ')}`);
  return {
    id: `skya-${globalIndex}`,
    text: truncate(text, 280),
    hashtags: tags,
    mentions: [],
    basedOn: unit ? unit.title : 'SKYA',
  };
}

export function generateFiveDayTwitterPlan(
  topics: TrendingTopic[],
  xTrends: XTrend[],
  startDate: Date = new Date()
): DayPlan[] {
  const topicUnits = topicsToUnits(topics);
  const hashtagUnits = hashtagsToUnits(xTrends, topics);
  const allUnits = [...topicUnits, ...hashtagUnits];

  const globalHashtagPool =
    xTrends.length > 0
      ? xTrends.slice().sort((a, b) => a.rank - b.rank).map((t) => cleanHashtag(t.hashtag)).filter(Boolean)
      : ['#AI', '#ArtificialIntelligence', '#TechNews', '#AITrends'];

  // ONE shuffle for the whole week (not reshuffled per day) — this is what
  // guarantees content only repeats after every other unit has had a turn,
  // instead of the same topic resurfacing the very next day.
  const unitSeed = 424243;
  const shuffledUnits = allUnits.length > 0 ? seededShuffle(allUnits, unitSeed) : [];

  // Per-unit archetype ordering: when a given topic/hashtag inevitably has
  // to be reused (small real data pool, only 5 days of imagination to work
  // with), it cycles through a DIFFERENT shuffled order of styles unique to
  // that unit — so reuse #2 of "Claude Fable 5.2" never lands on the same
  // angle as reuse #1 until every style has actually been tried on it.
  const richArchetypeOrderByUnit = new Map<string, RichArchetype[]>();
  const lightArchetypeOrderByUnit = new Map<string, LightArchetype[]>();
  const usageCountByUnit = new Map<string, number>();

  function nextArchetypeFor(unit: ContentUnit): RichArchetype | LightArchetype {
    const usage = usageCountByUnit.get(unit.id) ?? 0;
    usageCountByUnit.set(unit.id, usage + 1);

    if (unit.kind === 'topic') {
      if (!richArchetypeOrderByUnit.has(unit.id)) {
        richArchetypeOrderByUnit.set(unit.id, seededShuffle(RICH_ARCHETYPES, hashSeed(unit.id)));
      }
      const order = richArchetypeOrderByUnit.get(unit.id)!;
      return order[usage % order.length];
    }

    if (!lightArchetypeOrderByUnit.has(unit.id)) {
      lightArchetypeOrderByUnit.set(unit.id, seededShuffle(LIGHT_ARCHETYPES, hashSeed(unit.id)));
    }
    const order = lightArchetypeOrderByUnit.get(unit.id)!;
    return order[usage % order.length];
  }

  const days: DayPlan[] = [];

  for (let dayIndex = 0; dayIndex < 5; dayIndex++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + dayIndex);
    const dateISO = date.toISOString().slice(0, 10);
    const label = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

    const tweets: GeneratedTweet[] = [];

    if (shuffledUnits.length > 0) {
      const mythSlot = dayIndex % 3; // rotates which of the 3 main slots tells the myth-vs-fact story

      for (let slot = 0; slot < 3; slot++) {
        const globalSlotIndex = dayIndex * 4 + slot;
        const unit = shuffledUnits[globalSlotIndex % shuffledUnits.length];
        const tags = hashtagsFor(globalHashtagPool, globalSlotIndex, slot === 1 ? 2 : 3, [unit.primaryTag]);
        const mentions = mentionsFor(unit.matchText);

        let text: string;
        if (slot === mythSlot) {
          // Guaranteed once-per-day storytelling slot — doesn't consume a
          // turn from that unit's normal archetype rotation, since it's a
          // fixed, separate format rather than one of the general angles.
          text = unit.kind === 'topic' ? mythVsFactRich(unit, tags) : mythVsFactLight(unit, tags);
        } else {
          const archetype = nextArchetypeFor(unit);
          if (unit.kind === 'topic') {
            const base = (archetype as RichArchetype)(unit, tags, mentions);
            text = mentions.length > 0 && !base.includes(mentions[0]) ? `${base} ${mentionLine(mentions)}` : base;
          } else {
            text = (archetype as LightArchetype)(unit, tags);
          }
        }

        tweets.push({
          id: `d${dayIndex + 1}-${slot + 1}`,
          text: truncate(clean(text), 280),
          hashtags: tags,
          mentions: slot === mythSlot ? [] : mentions,
          basedOn: unit.title,
        });
      }

      // 4th slot: SKYA's own feature/USP, only loosely tied to the day.
      const skyaGlobalIndex = dayIndex * 4 + 3;
      const skyaUnit = shuffledUnits[skyaGlobalIndex % shuffledUnits.length];
      const skyaTags = hashtagsFor(globalHashtagPool, skyaGlobalIndex, 2, [skyaUnit.primaryTag]);
      if (!skyaTags.includes(SKYA_HASHTAG)) skyaTags.push(SKYA_HASHTAG);
      tweets.push(buildSkyaTweet(dayIndex, skyaUnit, skyaTags));
    }

    days.push({ day: dayIndex + 1, label, dateISO, tweets });
  }

  return days;
}
