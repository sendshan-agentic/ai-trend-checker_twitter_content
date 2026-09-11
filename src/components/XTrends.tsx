import { useState } from 'react';
import { Hash, TrendingUp } from 'lucide-react';
import type { XTrend } from '@/lib/supabase';
import { getRegionLabel } from '@/lib/utils';

type XTrendsProps = {
  trends: XTrend[];
};

const regionFilters = ['global', 'usa', 'india', 'eu'] as const;

export function XTrends({ trends }: XTrendsProps) {
  const [region, setRegion] = useState<string>('global');

  const filtered = trends.filter((t) => t.region === region);
  const sorted = [...filtered].sort((a, b) => a.rank - b.rank);

  return (
    <div className="rounded-2xl border border-white/5 bg-[#0d0d14] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
            <Hash className="w-4 h-4 text-cyan-400" />
          </div>
          <h2 className="text-sm font-semibold text-white">X.com Trending</h2>
        </div>
        <div className="flex items-center gap-1">
          {regionFilters.map((r) => (
            <button
              key={r}
              onClick={() => setRegion(r)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                region === r
                  ? 'bg-white/10 text-white border border-white/10'
                  : 'text-gray-500 hover:text-gray-300 border border-transparent'
              }`}
            >
              {getRegionLabel(r)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        {sorted.map((trend) => (
          <div
            key={trend.id}
            className="group flex items-center gap-3 rounded-lg px-3 py-2.5 bg-[#111118] border border-white/5 hover:border-white/10 transition-all"
          >
            <div className={`flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${
              trend.rank <= 3
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                : 'bg-white/5 text-gray-500 border border-white/5'
            }`}>
              {trend.rank}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-white group-hover:text-cyan-200 transition-colors">
                {trend.hashtag}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-gray-500 flex-shrink-0">
              <TrendingUp className="w-3 h-3 text-emerald-400/60" />
              {trend.post_volume}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
