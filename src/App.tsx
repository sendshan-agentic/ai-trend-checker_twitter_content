import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type {
  TrendingTopic,
  ModelAnnouncement,
  ResearcherInsight,
  XTrend,
  ViralScore,
  DailyReport,
} from "@/lib/supabase";
import { Header } from "@/components/Header";
import { OverviewStats } from "@/components/OverviewStats";
import { DailySummary } from "@/components/DailySummary";
import { TrendingTopics } from "@/components/TrendingTopics";
import { ModelAnnouncements } from "@/components/ModelAnnouncements";
import { ResearcherInsights } from "@/components/ResearcherInsights";
import { XTrends } from "@/components/XTrends";
import { ViralMeter } from "@/components/ViralMeter";
import { RegionalHeatmap } from "@/components/RegionalHeatmap";
import { TwitterContentPlan } from "@/components/TwitterContentPlan";
import { applyTopicCorrections } from "@/lib/topicCorrections";
import { Loader2, RefreshCw, AlertCircle } from "lucide-react";

export default function App() {
  const [topics, setTopics] = useState<TrendingTopic[]>([]);
  const [announcements, setAnnouncements] = useState<ModelAnnouncement[]>([]);
  const [insights, setInsights] = useState<ResearcherInsight[]>([]);
  const [xTrends, setXTrends] = useState<XTrend[]>([]);
  const [viralScores, setViralScores] = useState<ViralScore[]>([]);
  const [report, setReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState<string | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");

  async function fetchAvailableDates(): Promise<string[]> {
    const { data: reportDates, error: err1 } = await supabase
      .from("daily_reports")
      .select("report_date")
      .order("report_date", { ascending: false });

    const { data: topicDates, error: err2 } = await supabase
      .from("trending_topics")
      .select("date_tracked")
      .order("date_tracked", { ascending: false });

    if (err1 && err2) {
      throw new Error("Failed to fetch dates from database");
    }

    const dateSet = new Set<string>();
    (reportDates || []).forEach((r) => dateSet.add(r.report_date));
    (topicDates || []).forEach((t) => dateSet.add(t.date_tracked));

    return Array.from(dateSet).sort((a, b) => b.localeCompare(a));
  }

  // Initial load: fetch available dates, default to latest
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const dates = await fetchAvailableDates();
        if (cancelled) return;
        setAvailableDates(dates);
        if (dates.length > 0) {
          setSelectedDate(dates[0]);
        } else {
          // No dates found — stop loading so the page renders
          setLoading(false);
          setError("No trend data found yet. Click 'Update Today's Trends' to fetch the latest data.");
        }
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : "Failed to connect to the database"
        );
        setLoading(false);
      }
    }
    init();

    return () => {
      cancelled = true;
    };
  }, []);

  // Load data whenever selectedDate changes
  useEffect(() => {
    if (!selectedDate) return;

    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const [
          topicsRes,
          announcementsRes,
          insightsRes,
          xTrendsRes,
          viralScoresRes,
          reportRes,
        ] = await Promise.all([
          supabase
            .from("trending_topics")
            .select("*")
            .eq("date_tracked", selectedDate)
            .order("viral_score", { ascending: false }),
          supabase
            .from("model_announcements")
            .select("*")
            .eq("announcement_date", selectedDate)
            .order("impact_score", { ascending: false }),
          supabase
            .from("researcher_insights")
            .select("*")
            .eq("date", selectedDate)
            .order("engagement_count", { ascending: false }),
          supabase
            .from("x_trends")
            .select("*")
            .eq("trend_date", selectedDate)
            .order("rank", { ascending: true }),
          supabase
            .from("viral_scores")
            .select("*")
            .eq("date", selectedDate)
            .order("viral_score", { ascending: false }),
          supabase
            .from("daily_reports")
            .select("*")
            .eq("report_date", selectedDate)
            .maybeSingle(),
        ]);

        if (cancelled) return;

        setTopics(applyTopicCorrections(topicsRes.data || []));
        setAnnouncements(announcementsRes.data || []);
        setInsights(insightsRes.data || []);
        setXTrends(xTrendsRes.data || []);
        setViralScores(viralScoresRes.data || []);
        setReport(reportRes.data);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Failed to load trend data"
        );
        setLoading(false);
      }
    }
    fetchData();

    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshMsg(null);
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/daily-trends-update`;
      const headers = {
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      };
      const response = await fetch(apiUrl, { method: "POST", headers });
      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
      }
      const data = await response.json();
      setRefreshMsg(
        `Updated: ${data.topics_added || 0} new topics tracked for ${data.date}`
      );

      // Refresh available dates and switch to latest
      const dates = await fetchAvailableDates();
      setAvailableDates(dates);
      if (dates.length > 0) {
        setSelectedDate(dates[0]);
      }
    } catch (err) {
      setRefreshMsg(
        err instanceof Error ? err.message : "Failed to update trends"
      );
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin text-rose-400" />
          <span className="text-sm">Compiling AI intelligence...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100">
      <Header
        reportDate={selectedDate}
        totalTopics={topics.length}
        totalAnnouncements={announcements.length}
        availableDates={availableDates}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Error Banner */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Refresh Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {refreshMsg && (
              <div
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border ${
                  refreshMsg.startsWith("Updated")
                    ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                    : "text-rose-400 bg-rose-500/10 border-rose-500/20"
                }`}
              >
                {refreshMsg.startsWith("Updated") ? (
                  <RefreshCw className="w-3 h-3" />
                ) : (
                  <AlertCircle className="w-3 h-3" />
                )}
                {refreshMsg}
              </div>
            )}
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-white px-3 py-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Updating..." : "Update Today's Trends"}
          </button>
        </div>

        <OverviewStats
          topics={topics}
          announcements={announcements}
          xTrends={xTrends}
          viralScores={viralScores}
        />

        <DailySummary report={report} />

        <RegionalHeatmap topics={topics} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TrendingTopics topics={topics} />
          <ViralMeter scores={viralScores} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ModelAnnouncements announcements={announcements} />
          <ResearcherInsights insights={insights} />
        </div>

        <XTrends trends={xTrends} />

        <TwitterContentPlan topics={topics} xTrends={xTrends} />

        <footer className="pt-8 pb-4 text-center">
          <p className="text-xs text-gray-600">
            AI Pulse — Daily AI Trends Research Portal
            {selectedDate &&
              ` — Data for ${new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}`}
          </p>
          <p className="text-[10px] text-gray-700 mt-1">
            Data compiled from X.com, LinkedIn, Reddit, industry publications,
            and lab announcements. Use the date selector to browse previous days.
          </p>
        </footer>
      </main>
    </div>
  );
}
