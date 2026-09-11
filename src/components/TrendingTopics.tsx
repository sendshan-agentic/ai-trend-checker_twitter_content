import { useState } from 'react';
import { Flame, TrendingUp, Zap } from 'lucide-react';
import type { TrendingTopic } from '@/lib/supabase';
import { formatNumber, getVelocityColor, getCategoryColor, getRegionLabel, getScoreBarColor } from '@/lib/utils';

type TrendingTopicsProps = {
  topics: TrendingTopic[];
};

const regionFilters = ['all', 'global', 'usa', 'india', 'eu'] as const;

export function TrendingTopics({ topics }: TrendingTopicsProps) {
  const [region, setRegion] = useState<string>('all');

  const filtered = region === 'all'
    ? topics
    : topics.filter((t) => t.region === region);

  const sorted = [...filtered].sort((a, b) => b.viral_score - a.viral_score);

  return (
    <div className="rounded-2xl border border-white/5 bg-[#0d0d14] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <h2 className="text-sm font-semibold text-white">Trending Topics</h2>
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
              {r === 'all' ? 'All' : getRegionLabel(r)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        {sorted.map((topic, idx) => (
          <div
            key={topic.id}
            className="group rounded-xl border border-white/5 bg-[#111118] p-4 hover:border-white/10 transition-all"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold text-gray-400">
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-sm font-medium text-white group-hover:text-amber-200 transition-colors">
                    {topic.title}
                  </h3>
                  <span className={`flex-shrink-0 px-2 py-0.5 rounded-md text-[10px] font-medium border ${getVelocityColor(topic.velocity)}`}>
                    {topic.velocity === 'breakout' && <Zap className="w-2.5 h-2.5 inline mr-0.5" />}
                    {topic.velocity}
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed mb-2.5">{topic.description}</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${getCategoryColor(topic.category)}`}>
                    {topic.category}
                  </span>
                  <span className="text-[10px] text-gray-500 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {formatNumber(topic.people_talking)} talking
                  </span>
                  <span className="text-[10px] text-gray-500">
                    {getRegionLabel(topic.region)}
                  </span>
                </div>
                <div className="mt-2.5 flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${getScoreBarColor(topic.viral_score)}`}
                      style={{ width: `${topic.viral_score}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-gray-400 w-8 text-right">
                    {topic.viral_score}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
