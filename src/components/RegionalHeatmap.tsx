import { Globe } from 'lucide-react';
import type { TrendingTopic } from '@/lib/supabase';
import { formatNumber, getRegionLabel } from '@/lib/utils';

type RegionalHeatmapProps = {
  topics: TrendingTopic[];
};

export function RegionalHeatmap({ topics }: RegionalHeatmapProps) {
  const regions = ['global', 'usa', 'india', 'eu'];
  const regionData = regions.map((region) => {
    const regionTopics = topics.filter((t) => t.region === region);
    const totalPeople = regionTopics.reduce((sum, t) => sum + t.people_talking, 0);
    const avgScore = regionTopics.length > 0
      ? Math.round(regionTopics.reduce((sum, t) => sum + t.viral_score, 0) / regionTopics.length)
      : 0;
    return { region, totalPeople, avgScore, topicCount: regionTopics.length, topics: regionTopics };
  });

  const maxPeople = Math.max(...regionData.map((r) => r.totalPeople), 1);

  return (
    <div className="rounded-2xl border border-white/5 bg-[#0d0d14] p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <Globe className="w-4 h-4 text-emerald-400" />
        </div>
        <h2 className="text-sm font-semibold text-white">Regional Breakdown</h2>
        <span className="text-xs text-gray-500 ml-1">People talking by region</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {regionData.map((data) => {
          const intensity = data.totalPeople / maxPeople;
          return (
            <div
              key={data.region}
              className="rounded-xl border border-white/5 bg-[#111118] p-4 hover:border-white/10 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-white">{getRegionLabel(data.region)}</span>
                <span className="text-[10px] text-gray-500">{data.topicCount} topics</span>
              </div>
              <div className="text-xl font-bold text-white mb-1">{formatNumber(data.totalPeople)}</div>
              <div className="text-[10px] text-gray-500 mb-3">people talking</div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mb-2">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-500 transition-all"
                  style={{ width: `${intensity * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-gray-500">Avg viral</span>
                <span className="font-mono text-amber-400">{data.avgScore}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
