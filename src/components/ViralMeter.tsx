import { Flame, Gauge, Activity, Rocket } from 'lucide-react';
import type { ViralScore } from '@/lib/supabase';
import { getScoreColor, getScoreBarColor, getRegionLabel } from '@/lib/utils';

type ViralMeterProps = {
  scores: ViralScore[];
};

export function ViralMeter({ scores }: ViralMeterProps) {
  const sorted = [...scores].sort((a, b) => b.viral_score - a.viral_score);

  const getViralLabel = (score: number): { label: string; color: string } => {
    if (score >= 90) return { label: 'EXPLOSIVE', color: 'text-rose-400' };
    if (score >= 80) return { label: 'HIGH VIRAL', color: 'text-amber-400' };
    if (score >= 70) return { label: 'TRENDING', color: 'text-emerald-400' };
    if (score >= 50) return { label: 'MODERATE', color: 'text-sky-400' };
    return { label: 'LOW', color: 'text-gray-400' };
  };

  return (
    <div className="rounded-2xl border border-white/5 bg-[#0d0d14] p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20">
          <Flame className="w-4 h-4 text-rose-400" />
        </div>
        <h2 className="text-sm font-semibold text-white">Viral Topic Meter</h2>
        <span className="text-xs text-gray-500 ml-1">Breakout probability scoring</span>
      </div>

      <div className="space-y-3">
        {sorted.map((score) => {
          const viralLabel = getViralLabel(score.viral_score);
          return (
            <div
              key={score.id}
              className="group rounded-xl border border-white/5 bg-[#111118] p-4 hover:border-white/10 transition-all"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-white">{score.topic_name}</h3>
                  <span className="text-[10px] text-gray-500">{getRegionLabel(score.region)}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-[10px] font-bold tracking-wider ${viralLabel.color}`}>
                    {viralLabel.label}
                  </span>
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl border border-white/10 bg-[#0a0a0f]">
                    <div className={`text-xl font-bold ${getScoreColor(score.viral_score)}`}>
                      {score.viral_score}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-2.5">
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Gauge className="w-3 h-3 text-amber-400/60" />
                    <span className="text-[10px] text-gray-500">Velocity</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getScoreBarColor(score.velocity_score)}`}
                      style={{ width: `${score.velocity_score}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-gray-400 mt-0.5 block">{score.velocity_score}</span>
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Activity className="w-3 h-3 text-sky-400/60" />
                    <span className="text-[10px] text-gray-500">Momentum</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getScoreBarColor(score.momentum_score)}`}
                      style={{ width: `${score.momentum_score}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-gray-400 mt-0.5 block">{score.momentum_score}</span>
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Rocket className="w-3 h-3 text-rose-400/60" />
                    <span className="text-[10px] text-gray-500">Breakout</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getScoreBarColor(score.breakout_probability)}`}
                      style={{ width: `${score.breakout_probability}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-gray-400 mt-0.5 block">{score.breakout_probability}</span>
                </div>
              </div>

              {score.reasoning && (
                <p className="text-[11px] text-gray-500 leading-relaxed italic border-l-2 border-white/5 pl-2.5">
                  {score.reasoning}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
