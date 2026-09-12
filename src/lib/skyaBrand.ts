/**
 * SKYA (skya.one) is Skyram Next's own AI Visibility Intelligence product —
 * it checks whether a business shows up when people ask ChatGPT/Perplexity/
 * Gemini about their industry. Every day's recap tweet ties the day's AI
 * news back to that same underlying idea ("is your brand visible to AI?")
 * so the content plan quietly promotes SKYA without every post reading like
 * an ad.
 */
const SKYA_CTA_LINES = [
  "Speaking of AI's growing reach — is your own brand even visible when people ask ChatGPT or Perplexity about your industry? Free 60-second check: skya.one",
  'Every one of these AI shifts changes how customers *find* you too. See if your business shows up in AI search results — free checker: skya.one',
  "If AI is this central to search now, the real question is: does AI even know your brand exists? Find out in 60 seconds: skya.one",
  'Worth asking: when someone prompts an AI for recommendations in your space, do you show up? Check your AI visibility score free: skya.one',
  "This is exactly why AI visibility matters as much as SEO did. Test your brand's AI visibility score free: skya.one",
];

export function skyaCtaLine(dayIndex: number): string {
  return SKYA_CTA_LINES[dayIndex % SKYA_CTA_LINES.length];
}

export const SKYA_HASHTAG = '#AIVisibility';
