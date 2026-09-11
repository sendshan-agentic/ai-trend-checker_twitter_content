import { TrendingUp, Calendar, Activity, ChevronLeft, ChevronRight } from 'lucide-react';

type HeaderProps = {
  reportDate: string;
  totalTopics: number;
  totalAnnouncements: number;
  availableDates: string[];
  selectedDate: string;
  onDateChange: (date: string) => void;
};

export function Header({
  totalTopics,
  totalAnnouncements,
  availableDates,
  selectedDate,
  onDateChange,
}: HeaderProps) {
  const currentIndex = availableDates.indexOf(selectedDate);
  const canGoPrev = currentIndex < availableDates.length - 1;
  const canGoNext = currentIndex > 0;

  const goPrev = () => {
    if (canGoPrev) onDateChange(availableDates[currentIndex + 1]);
  };
  const goNext = () => {
    if (canGoNext) onDateChange(availableDates[currentIndex - 1]);
  };

  return (
    <header className="border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500">
              <TrendingUp className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-base font-semibold text-white tracking-tight">AI Pulse</h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">Daily Trends Research Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Date Navigator */}
            <div className="flex items-center gap-1.5 rounded-xl border border-white/5 bg-white/5 px-2 py-1.5">
              <button
                onClick={goPrev}
                disabled={!canGoPrev}
                className="p-1 rounded-md text-gray-500 hover:text-white hover:bg-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1.5 px-1">
                <Calendar className="w-3.5 h-3.5 text-rose-400" />
                <select
                  value={selectedDate}
                  onChange={(e) => onDateChange(e.target.value)}
                  className="bg-transparent text-sm text-white border-none outline-none cursor-pointer appearance-none pr-1"
                >
                  {availableDates.map((d) => (
                    <option key={d} value={d} className="bg-[#111118]">
                      {new Date(d + "T00:00:00").toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={goNext}
                disabled={!canGoNext}
                className="p-1 rounded-md text-gray-500 hover:text-white hover:bg-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="hidden lg:flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-sm text-gray-400">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>{totalTopics} topics</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-gray-400">
                <Activity className="w-4 h-4 text-amber-400" />
                <span>{totalAnnouncements} announcements</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
