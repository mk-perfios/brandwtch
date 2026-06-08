"use client";

import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api";
import StatsCard from "@/components/dashboard/StatsCard";
import SentimentChart from "@/components/dashboard/SentimentChart";
import PlatformBreakdown from "@/components/dashboard/PlatformBreakdown";
import RecentMentions from "@/components/dashboard/RecentMentions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["overview"],
    queryFn: analyticsApi.overview,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const avg = data?.avg_sentiment;
  const avgFormatted = avg != null ? avg.toFixed(2) : "—";
  const avgLabel =
    avg == null ? "flat" : avg >= 0.05 ? "up" : avg <= -0.05 ? "down" : "flat";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">Brand health at a glance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Total Brands"
          value={data?.total_brands ?? 0}
          accent
        />
        <StatsCard
          label="Total Mentions"
          value={(data?.total_mentions ?? 0).toLocaleString()}
          sub="all time"
        />
        <StatsCard
          label="Last 24h"
          value={(data?.mentions_24h ?? 0).toLocaleString()}
          trend={data?.mentions_24h ? "up" : "flat"}
        />
        <StatsCard
          label="Avg Sentiment"
          value={avgFormatted}
          trend={avgLabel as "up" | "down" | "flat"}
          sub="–1 to +1 scale"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sentiment Trend (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.platform_breakdown.length ? (
              <SentimentChart
                data={
                  data.recent_mentions
                    .slice()
                    .reverse()
                    .reduce<any[]>((acc, m) => {
                      const date = m.created_at.slice(0, 10);
                      const ex = acc.find((x) => x.date === date);
                      if (ex) {
                        ex.total++;
                        if (m.sentiment_label === "positive") ex.positive++;
                        else if (m.sentiment_label === "negative") ex.negative++;
                        else ex.neutral++;
                      } else {
                        acc.push({
                          date,
                          total: 1,
                          positive: m.sentiment_label === "positive" ? 1 : 0,
                          negative: m.sentiment_label === "negative" ? 1 : 0,
                          neutral: m.sentiment_label === "neutral" ? 1 : 0,
                          avg_sentiment: m.sentiment_score,
                        });
                      }
                      return acc;
                    }, [])
                }
              />
            ) : (
              <p className="text-slate-600 text-sm py-12 text-center">No data yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.platform_breakdown.length ? (
              <PlatformBreakdown data={data.platform_breakdown} />
            ) : (
              <p className="text-slate-600 text-sm py-12 text-center">No data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Mentions</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentMentions mentions={data?.recent_mentions ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}
