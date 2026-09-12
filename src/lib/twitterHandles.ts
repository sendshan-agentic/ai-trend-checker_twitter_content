/**
 * Curated map of AI companies/people to their Twitter/X handles. When a
 * trending topic's title/description/category mentions one of these
 * keywords, we @-mention the relevant company AND its associated leader
 * (e.g. a Claude/Anthropic topic tags both @AnthropicAI and @DarioAmodei) to
 * increase the odds of a reply, retweet, or reach into their audience.
 *
 * Edit this list any time a new player becomes relevant — keys are matched
 * as case-insensitive substrings against the topic's text.
 */
export type HandleEntry = {
  keywords: string[];
  /** Company/product handle. */
  handle: string;
  /** Associated founder/CEO/lead handle, tagged alongside the company. */
  leaderHandle?: string;
};

export const TWITTER_HANDLES: HandleEntry[] = [
  { keywords: ['openai', 'chatgpt', 'gpt-'], handle: '@OpenAI', leaderHandle: '@sama' },
  { keywords: ['anthropic', 'claude'], handle: '@AnthropicAI', leaderHandle: '@DarioAmodei' },
  { keywords: ['google', 'gemini', 'deepmind'], handle: '@GoogleDeepMind', leaderHandle: '@demishassabis' },
  { keywords: ['meta ai', 'meta muse', 'llama'], handle: '@AIatMeta', leaderHandle: '@ylecun' },
  { keywords: ['microsoft', 'copilot'], handle: '@Microsoft', leaderHandle: '@satyanadella' },
  { keywords: ['mistral'], handle: '@MistralAI' },
  { keywords: ['perplexity'], handle: '@perplexity_ai', leaderHandle: '@AravSrinivas' },
  { keywords: ['nvidia'], handle: '@nvidia', leaderHandle: '@jensenhuang' },
  { keywords: ['xai', 'grok'], handle: '@xai', leaderHandle: '@elonmusk' },
  { keywords: ['huggingface', 'hugging face'], handle: '@huggingface' },
  { keywords: ['stability ai', 'stable diffusion'], handle: '@StabilityAI' },
  { keywords: ['cohere'], handle: '@cohere' },
  { keywords: ['runway'], handle: '@runwayml' },
  { keywords: ['midjourney'], handle: '@midjourney' },
  { keywords: ['elevenlabs'], handle: '@elevenlabsio' },
  { keywords: ['doubao', 'bytedance'], handle: '@bytedanceinc' },
];

/**
 * Finds up to `max` relevant company + leader handles for a block of text,
 * in the order the keywords appear, without duplicates.
 */
export function findRelevantHandles(text: string, max = 3): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];

  for (const entry of TWITTER_HANDLES) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      if (!found.includes(entry.handle)) found.push(entry.handle);
      if (entry.leaderHandle && !found.includes(entry.leaderHandle)) {
        found.push(entry.leaderHandle);
      }
    }
    if (found.length >= max) break;
  }

  return found.slice(0, max);
}
