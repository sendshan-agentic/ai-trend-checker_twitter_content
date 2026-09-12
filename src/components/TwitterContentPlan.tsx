import { useEffect, useMemo, useState } from 'react';
import { Twitter, Download, Loader2, Copy, Check, Hash } from 'lucide-react';
import type { TrendingTopic, XTrend } from '@/lib/supabase';
import { generateFiveDayTwitterPlan } from '@/lib/twitterContent';
import { exportTwitterPlanToDocx } from '@/lib/exportTwitterPlanDocx';

type TwitterContentPlanProps = {
  topics: TrendingTopic[];
  xTrends: XTrend[];
  /** The date currently selected in the app (YYYY-MM-DD), used as day 1 of
   * the plan so the content always starts from whatever data is showing —
   * once trend data refreshes daily, this naturally advances the plan too. */
  referenceDate?: string;
};

export function TwitterContentPlan({ topics, xTrends, referenceDate }: TwitterContentPlanProps) {
  const [activeDay, setActiveDay] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const startDate = useMemo(
    () => (referenceDate ? new Date(`${referenceDate}T00:00:00`) : new Date()),
    [referenceDate]
  );
  const plan = useMemo(
    () => generateFiveDayTwitterPlan(topics, xTrends, startDate),
    [topics, xTrends, startDate]
  );
  const hasData = topics.length > 0 || xTrends.length > 0;

  // If the underlying trend data changes (new date selected, or a fresh
  // day's data comes in), snap back to Day 1 instead of leaving the user on
  // a stale tab index.
  useEffect(() => {
    setActiveDay(0);
  }, [topics, xTrends]);

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // Clipboard access can fail silently (e.g. permissions) — no-op.
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await exportTwitterPlanToDocx(plan);
    } finally {
      setDownloading(false);
    }
  };

  const day = plan[activeDay];

  return (
    <div className="rounded-2xl border border-white/5 bg-[#0d0d14] p-5">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20">
            <Twitter className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">5-Day Twitter Content Plan</h2>
            <p className="text-[11px] text-gray-500">
              4 posts/day · built from today's trending topics &amp; hashtags · English
            </p>
          </div>
        </div>

        <button
          onClick={handleDownload}
          disabled={downloading || !hasData}
          className="flex items-center gap-2 text-xs font-medium text-white px-3 py-1.5 rounded-lg bg-sky-500/20 border border-sky-500/30 hover:bg-sky-500/30 transition-all disabled:opacity-50"
        >
          {downloading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          {downloading ? 'Preparing .docx...' : 'Download as DOCX'}
        </button>
      </div>

      {!hasData ? (
        <p className="text-xs text-gray-500">
          No trend data loaded for this date yet — content will generate automatically once trends are
          available.
        </p>
      ) : (
        <>
          <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1">
            {plan.map((d, idx) => (
              <button
                key={d.day}
                onClick={() => setActiveDay(idx)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  activeDay === idx
                    ? 'bg-white/10 text-white border-white/10'
                    : 'text-gray-500 hover:text-gray-300 border-transparent'
                }`}
              >
                Day {d.day} · {d.label}
              </button>
            ))}
          </div>

          <div className="space-y-2.5">
            {day?.tweets.map((tweet, idx) => (
              <div
                key={tweet.id}
                className="group rounded-xl border border-white/5 bg-[#111118] p-4 hover:border-white/10 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-xs font-bold text-sky-400">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{tweet.text}</p>
                    <div className="mt-2.5 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {tweet.mentions.map((handle) => (
                          <span
                            key={handle}
                            className="px-2 py-0.5 rounded-md text-[10px] font-medium text-sky-300 bg-sky-500/10 border border-sky-500/20"
                          >
                            {handle}
                          </span>
                        ))}
                        {tweet.hashtags.map((tag) => (
                          <span
                            key={tag}
                            className="flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-medium text-cyan-300 bg-cyan-500/10 border border-cyan-500/20"
                          >
                            <Hash className="w-2.5 h-2.5" />
                            {tag.replace('#', '')}
                          </span>
                        ))}
                      </div>
                      <button
                        onClick={() => handleCopy(tweet.id, tweet.text)}
                        className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-white px-2 py-1 rounded-md border border-white/5 hover:border-white/10 transition-all"
                      >
                        {copiedId === tweet.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copy
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
