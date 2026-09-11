import { FileText, ArrowUpRight } from 'lucide-react';
import type { DailyReport } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';

type DailySummaryProps = {
  report: DailyReport | null;
};

export function DailySummary({ report }: DailySummaryProps) {
  if (!report) {
    return (
      <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-[#111118] to-[#0d0d14] p-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20">
            <FileText className="w-4 h-4 text-rose-400" />
          </div>
          <h2 className="text-sm font-semibold text-white">Daily Intelligence Report</h2>
        </div>
        <p className="text-sm text-gray-500">
          No compiled report for this date. Click "Update Today's Trends" to generate a fresh report.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-[#111118] to-[#0d0d14] p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20">
            <FileText className="w-4 h-4 text-rose-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Daily Intelligence Report</h2>
            <p className="text-xs text-gray-500">{formatDate(report.report_date)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {report.total_topics_tracked} topics
          </span>
          <span className="px-2 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
            {report.total_announcements} announcements
          </span>
        </div>
      </div>
      <div className="mb-3">
        <div className="flex items-center gap-1.5 text-xs text-rose-400 mb-2">
          <ArrowUpRight className="w-3.5 h-3.5" />
          <span className="font-medium uppercase tracking-wider">Top Story</span>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">{report.top_topic}</h3>
      </div>
      <p className="text-sm text-gray-400 leading-relaxed">{report.summary}</p>
    </div>
  );
}
