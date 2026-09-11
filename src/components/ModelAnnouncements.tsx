import { Megaphone, ExternalLink } from 'lucide-react';
import type { ModelAnnouncement } from '@/lib/supabase';
import { formatDate, getCompanyColor, getCategoryColor, getScoreBarColor } from '@/lib/utils';

type ModelAnnouncementsProps = {
  announcements: ModelAnnouncement[];
};

export function ModelAnnouncements({ announcements }: ModelAnnouncementsProps) {
  const sorted = [...announcements].sort(
    (a, b) => new Date(b.announcement_date).getTime() - new Date(a.announcement_date).getTime()
  );

  return (
    <div className="rounded-2xl border border-white/5 bg-[#0d0d14] p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20">
          <Megaphone className="w-4 h-4 text-violet-400" />
        </div>
        <h2 className="text-sm font-semibold text-white">Foundational Model Makers</h2>
        <span className="text-xs text-gray-500 ml-1">Latest Announcements</span>
      </div>

      <div className="space-y-2.5">
        {sorted.map((ann) => (
          <div
            key={ann.id}
            className="group rounded-xl border border-white/5 bg-[#111118] p-4 hover:border-white/10 transition-all"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${getCompanyColor(ann.company)}`}>
                  {ann.company}
                </span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${getCategoryColor(ann.category)}`}>
                  {ann.category}
                </span>
                <span className="text-[10px] text-gray-500">{formatDate(ann.announcement_date)}</span>
              </div>
              {ann.source_url && (
                <a
                  href={ann.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-300 transition-colors flex-shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
            <h3 className="text-sm font-medium text-white mb-1.5">{ann.model_name}</h3>
            <p className="text-xs text-gray-500 leading-relaxed mb-2.5">{ann.summary}</p>
            {ann.key_features.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
                {ann.key_features.map((feature, i) => (
                  <span
                    key={i}
                    className="px-1.5 py-0.5 rounded text-[10px] bg-white/5 text-gray-400 border border-white/5"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500">Impact Score</span>
              <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${getScoreBarColor(ann.impact_score)}`}
                  style={{ width: `${ann.impact_score}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-gray-400 w-8 text-right">
                {ann.impact_score}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
