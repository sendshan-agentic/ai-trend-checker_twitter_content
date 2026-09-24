/**
 * SKYA (skya.one) is an AI Visibility Intelligence platform: "See what AI
 * says about your brand. Then fix it." It tracks what ChatGPT, Gemini,
 * Perplexity, Claude, Google AI Overview/Mode, DeepSeek, Grok, and Copilot
 * are saying about a brand — continuously, not as a one-time score — and,
 * unlike typical visibility tools, ships a ranked, ready-to-paste fix
 * instead of stopping at a dashboard number.
 *
 * These lines are drawn directly from SKYA's own pitch deck messaging.
 * They present SKYA on its own terms — no parent-company attribution.
 */
const SKYA_FEATURE_LINES = [
  'Skya doesn\u2019t just give you an AI visibility score — it shows exactly why: which AI platforms are saying what about your brand, and where the gaps are. skya.one',
  'AI models are already answering questions about your brand — sometimes fabricating pricing, features, or claims. Skya catches it before it compounds. skya.one',
  'Most AI visibility tools stop at a score. Skya ships a ready-to-paste fix, ranked by impact, with one-click installers — no dev queue. skya.one',
  'Skya scans 9 AI platforms continuously, 24/7 — not a one-time snapshot — and shows the exact gap between you and every named competitor. skya.one',
  'Six specialist agents, one dashboard: AI Visibility, On-Page Audit, Competitor Intelligence, Keyword Gap, Hallucination Detection, and Reputation. skya.one',
  'Skya\u2019s Hallucination Agent runs 38 calibrated prompts across 4 AI platforms and hands you a 30/90-day fix roadmap. skya.one',
  'No rip-and-replace needed. Connect Semrush or Marketo in one click, or use Skya\u2019s built-in SEO layer if you don\u2019t have one yet. skya.one',
  'Enter your domain and Skya delivers a live dashboard plus a branded PDF audit in under 90 seconds. 7-day free trial, no card required. skya.one',
  'Every Skya report is live and shareable — signed token links, branded PDF exports, and a transparent activity trail. No stale screenshots. skya.one',
  'When someone asks AI who\u2019s best in your category, is it you or a competitor getting named? Skya shows your exact AI share of voice. skya.one',
];

export function skyaFeatureLine(i: number): string {
  return SKYA_FEATURE_LINES[i % SKYA_FEATURE_LINES.length];
}

export const SKYA_HASHTAG = '#AIVisibility';

