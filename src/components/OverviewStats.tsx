import { TrendingUp, Users, Zap, Building2, Globe } from 'lucide-react';
import type { TrendingTopic, ModelAnnouncement, XTrend, ViralScore } from '@/lib/supabase';
import { formatNumber } from '@/lib/utils';

type OverviewStatsProps = {
  topics: TrendingTopic[];
  announcements: ModelAnnouncement[];
  xTrends: XTrend[];
  viralScores: ViralScore[];
};

export function OverviewStats({ topics, announcements, xTrends, viralScores }: OverviewStatsProps) {
  const totalPeople = topics.reduce((sum, t) => sum + t.people_talking, 0);
  const avgViralScore = viralScores.length > 0
    ? Math.round(viralScores.reduce((sum, v) => sum + v.viral_score, 0) / viralScores.length)
    : 0;
  const topTopic = [...topics].sort((a, b) => b.viral_score - a.viral_score)[0];

  const stats = [
    {
      label: 'People Talking About AI',
      value: formatNumber(totalPeople),
      icon: Users,
      color: 'from-sky-500/20 to-sky-500/5',
      iconColor: 'text-sky-400',
      sub: 'across all tracked topics',
    },
    {
      label: 'Trending Topics Tracked',
      value: topics.length.toString(),
      icon: TrendingUp,
      color: 'from-emerald-500/20 to-emerald-500/5',
      iconColor: 'text-emerald-400',
      sub: 'global + regional',
    },
    {
      label: 'Model Announcements',
      value: announcements.length.toString(),
      icon: Building2,
      color: 'from-amber-500/20 to-amber-500/5',
      iconColor: 'text-amber-400',
      sub: 'from foundational labs',
    },
    {
      label: 'Avg Viral Score',
      value: avgViralScore.toString(),
      icon: Zap,
      color: 'from-rose-500/20 to-rose-500/5',
      iconColor: 'text-rose-400',
      sub: topTopic ? `top: ${topTopic.title.slice(0, 30)}...` : 'no data',
    },
    {
      label: 'X.com Trending Tags',
      value: xTrends.length.toString(),
      icon: Globe,
      color: 'from-violet-500/20 to-violet-500/5',
      iconColor: 'text-violet-400',
      sub: 'across 4 regions',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br ${stat.color} p-4 transition-all hover:border-white/10 hover:scale-[1.02]`}
        >
          <div className="flex items-center justify-between mb-3">
            <stat.icon className={`w-5 h-5 ${stat.iconColor}`} strokeWidth={2} />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{stat.value}</div>
          <div className="text-xs text-gray-400 mt-1">{stat.label}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">{stat.sub}</div>
        </div>
      ))}
    </div>
  );
}
