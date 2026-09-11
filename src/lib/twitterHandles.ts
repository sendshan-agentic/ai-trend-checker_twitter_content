/**
 * Curated map of AI companies/people to their Twitter/X handles. When a
 * trending topic's title/description/category mentions one of these
 * keywords, we can @-mention the relevant account in generated tweets to
 * increase the odds of a reply, retweet, or reach into their audience.
 *
 * Edit this list any time a new player becomes relevant — keys are matched
 * as case-insensitive substrings against the topic's text.
 */
export type HandleEntry = {
  keywords: string[];
  handle: string;
};

export const TWITTER_HANDLES: HandleEntry[] = [
  { keywords: ['openai', 'chatgpt', 'gpt-'], handle: '@OpenAI' },
  { keywords: ['anthropic', 'claude'], handle: '@AnthropicAI' },
  { keywords: ['google', 'gemini', 'deepmind'], handle: '@GoogleDeepMind' },
  { keywords: ['meta ai', 'meta muse', 'llama'], handle: '@AIatMeta' },
  { keywords: ['microsoft', 'copilot'], handle: '@Microsoft' },
  { keywords: ['mistral'], handle: '@MistralAI' },
  { keywords: ['perplexity'], handle: '@perplexity_ai' },
  { keywords: ['nvidia'], handle: '@nvidia' },
  { keywords: ['xai', 'grok'], handle: '@xai' },
  { keywords: ['huggingface', 'hugging face'], handle: '@huggingface' },
  { keywords: ['stability ai', 'stable diffusion'], handle: '@StabilityAI' },
  { keywords: ['cohere'], handle: '@cohere' },
  { keywords: ['runway'], handle: '@runwayml' },
  { keywords: ['midjourney'], handle: '@midjourney' },
  { keywords: ['elevenlabs'], handle: '@elevenlabsio' },
  { keywords: ['sam altman'], handle: '@sama' },
  { keywords: ['dario amodei'], handle: '@DarioAmodei' },
  { keywords: ['demis hassabis'], handle: '@demishassabis' },
  { keywords: ['elon musk'], handle: '@elonmusk' },
  { keywords: ['satya nadella'], handle: '@satyanadella' },
  { keywords: ['sundar pichai'], handle: '@sundarpichai' },
  { keywords: ['doubao', 'bytedance'], handle: '@bytedanceinc' },
];

/**
 * Finds up to `max` relevant handles for a block of text, in the order the
 * keywords appear, without duplicates.
 */
export function findRelevantHandles(text: string, max = 2): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];

  for (const entry of TWITTER_HANDLES) {
    if (found.includes(entry.handle)) continue;
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      found.push(entry.handle);
      if (found.length >= max) break;
    }
  }

  return found;
}
