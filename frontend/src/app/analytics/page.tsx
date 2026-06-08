"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { analyticsApi, brandsApi } from "@/lib/api";
import StatsCard from "@/components/dashboard/StatsCard";
import SentimentChart from "@/components/dashboard/SentimentChart";
import PlatformBreakdown from "@/components/dashboard/PlatformBreakdown";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import { platformLabel, sentimentBg, formatRelativeTime, truncate } from "@/lib/utils";
import { ExternalLink } from "lucide-react";

const DAY_OPTIONS = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
];

export default function AnalyticsPage() {
  const [days, setDays] = useState("30");

  const { data: brands = [] } = useQuery({
    queryKey: ["brands"],
    queryFn: brandsApi.list,
  });

  const [brandId, setBrandId] = useState("");

  const brandOptions = [
    { value: "", label: "All brands (overview)" },
    ...brands.map((b) => ({ value: b.id, label: b.name })),
  ];

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["analytics", brandId, days],
    queryFn: () =>
      brandId
        ? analyticsApi.brand(brandId, parseInt(days))
        : (Promise.resolve(null) as any),
    enabled: !!brandId,
  });

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ["overview"],
    queryFn: analyticsApi.overview,
    enabled: !brandId,
  });

  const loading = isLoading || overviewLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">Deep dive into your brand performance</p>
        </div>
        <div className="flex gap-2">
          <div className="w-48">
            <Select options={brandOptions} value={brandId} onChange={(e) => setBrandId(e.target.value)} />
          </div>
          <div className="w-28">
            <Select options={DAY_OPTIONS} value={days} onChange={(e) => setDays(e.target.value)} />
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        </div>
      )}

      {!brandId && overview && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard label="Total Brands" value={overview.total_brands} accent />
            <StatsCard label="Total Mentions" value={overview.total_mentions.toLocaleString()} />
            <StatsCard label="Last 24h" value={overview.mentions_24h.toLocaleString()} />
            <StatsCard
              label="Avg Sentiment"
              value={overview.avg_sentiment?.toFixed(2) ?? "—"}
              sub="–1 to +1"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>Platform Breakdown</CardTitle></CardHeader>
              <CardContent><PlatformBreakdown data={overview.platform_breakdown} /></CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Recent Mentions</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {overview.recent_mentions.slice(0, 5).map((m) => (
                  <div key={m.id} className="flex items-start gap-2 py-1.5 border-b border-[#2a2a3e] last:border-0">
                    <span className="text-xs text-slate-500 shrink-0">{platformLabel(m.platform)}</span>
                    <span className="text-xs text-slate-300 flex-1 truncate">{m.title || m.content || "—"}</span>
                    {m.sentiment_label && (
                      <span className={`text-xs px-1.5 py-0.5 rounded border ${sentimentBg(m.sentiment_label)} shrink-0`}>
                        {m.sentiment_label}
                      </span>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {brandId && analytics && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard label="Total" value={analytics.sentiment.total.toLocaleString()} />
            <StatsCard
              label="Positive"
              value={`${analytics.sentiment.positive_pct.toFixed(1)}%`}
              trend="up"
            />
            <StatsCard
              label="Negative"
              value={`${analytics.sentiment.negative_pct.toFixed(1)}%`}
              trend="down"
            />
            <StatsCard
              label="Avg Score"
              value={analytics.sentiment.avg_score?.toFixed(2) ?? "—"}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>Sentiment Over Time</CardTitle></CardHeader>
              <CardContent>
                <SentimentChart data={analytics.time_series} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Platform Breakdown</CardTitle></CardHeader>
              <CardContent>
                <PlatformBreakdown data={analytics.platform_breakdown} />
              </CardContent>
            </Card>
          </div>

          {Object.keys(analytics.trending_keywords).length > 0 && (
            <Card>
              <CardHeader><CardTitle>Trending Keywords</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(analytics.trending_keywords)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 20)
                    .map(([kw, count]) => (
                      <span
                        key={kw}
                        className="px-2.5 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-lg text-xs"
                      >
                        {kw} <span className="opacity-60">×{count}</span>
                      </span>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {analytics.top_mentions.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Top Mentions</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {analytics.top_mentions.map((m) => (
                  <div key={m.id} className="flex items-start gap-3 py-2 border-b border-[#2a2a3e] last:border-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs text-slate-500">{platformLabel(m.platform)}</span>
                        {m.sentiment_label && (
                          <span className={`text-xs px-1.5 py-0.5 rounded border ${sentimentBg(m.sentiment_label)}`}>
                            {m.sentiment_label}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-300">{truncate(m.title, 120)}</p>
                      <div className="flex items-center gap-3 mt-1">
                        {m.author && <span className="text-xs text-slate-600">{m.author}</span>}
                        {m.upvotes != null && (
                          <span className="text-xs text-slate-600">{m.upvotes} upvotes</span>
                        )}
                        <span className="text-xs text-slate-600">{formatRelativeTime(m.published_at)}</span>
                        {m.url && (
                          <a href={m.url} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                            <ExternalLink size={10} /> View
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {brandId && !analytics && !loading && (
        <div className="text-center py-20 text-slate-600">No analytics data for this brand yet.</div>
      )}
    </div>
  );
}
