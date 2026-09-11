import { Quote, Heart } from 'lucide-react';
import type { ResearcherInsight } from '@/lib/supabase';
import { formatNumber, formatDate, getCategoryColor } from '@/lib/utils';

type ResearcherInsightsProps = {
  insights: ResearcherInsight[];
};

export function ResearcherInsights({ insights }: ResearcherInsightsProps) {
  const sorted = [...insights].sort(
    (a, b) => b.engagement_count - a.engagement_count
  );

  return (
    <div className="rounded-2xl border border-white/5 bg-[#0d0d14] p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20">
          <Quote className="w-4 h-4 text-sky-400" />
        </div>
        <h2 className="text-sm font-semibold text-white">Researcher Insights</h2>
        <span className="text-xs text-gray-500 ml-1">What top minds are saying</span>
      </div>

      <div className="space-y-2.5">
        {sorted.map((insight) => (
          <div
            key={insight.id}
            className="group rounded-xl border border-white/5 bg-[#111118] p-4 hover:border-white/10 transition-all"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-sky-500/20 to-violet-500/20 border border-white/10 flex items-center justify-center text-xs font-bold text-white">
                {insight.researcher_name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div>
                    <h3 className="text-sm font-medium text-white">{insight.researcher_name}</h3>
                    <p className="text-[10px] text-gray-500">{insight.affiliation}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${getCategoryColor(insight.topic)}`}>
                    {insight.topic}
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed mt-2">{insight.insight}</p>
                <div className="flex items-center gap-3 mt-2.5">
                  <span className="text-[10px] text-gray-500 flex items-center gap-1">
                    <Heart className="w-3 h-3 text-rose-400/60" />
                    {formatNumber(insight.engagement_count)} engagement
                  </span>
                  <span className="text-[10px] text-gray-600">{formatDate(insight.date)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
