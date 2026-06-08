"use client";

import { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowLeft, Play, Trash2, Globe, Twitter } from "lucide-react";
import { brandsApi, analyticsApi, monitorApi } from "@/lib/api";
import StatsCard from "@/components/dashboard/StatsCard";
import SentimentChart from "@/components/dashboard/SentimentChart";
import PlatformBreakdown from "@/components/dashboard/PlatformBreakdown";
import RecentMentions from "@/components/dashboard/RecentMentions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { platformLabel, formatRelativeTime } from "@/lib/utils";

interface Props {
  params: Promise<{ id: string }>;
}

export default function BrandDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const [crawling, setCrawling] = useState(false);

  const { data: brand, isLoading: brandLoading } = useQuery({
    queryKey: ["brand", id],
    queryFn: () => brandsApi.get(id),
  });

  const { data: stats } = useQuery({
    queryKey: ["brand-stats", id],
    queryFn: () => brandsApi.stats(id),
  });

  const { data: analytics } = useQuery({
    queryKey: ["analytics", id, 30],
    queryFn: () => analyticsApi.brand(id, 30),
  });

  const runCrawl = async () => {
    setCrawling(true);
    try {
      await monitorApi.runBrand(id);
    } finally {
      setCrawling(false);
    }
  };

  const deleteBrand = async () => {
    if (!confirm("Delete this brand and all its mentions?")) return;
    await brandsApi.delete(id);
    router.push("/brands");
  };

  if (brandLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!brand) return <p className="text-slate-500">Brand not found.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/brands")}
            className="p-2 rounded-lg hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
            style={{ background: brand.color || "#6366f1" }}
          >
            {brand.name[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">{brand.name}</h1>
            {brand.description && (
              <p className="text-sm text-slate-500">{brand.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={runCrawl} loading={crawling}>
            <Play size={14} /> Crawl Now
          </Button>
          <Button variant="danger" size="sm" onClick={deleteBrand}>
            <Trash2 size={14} /> Delete
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {brand.enabled_platforms.map((p) => (
          <Badge key={p} variant="outline">{platformLabel(p)}</Badge>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Total Mentions" value={(stats?.total_mentions ?? 0).toLocaleString()} />
        <StatsCard label="Last 24h" value={(stats?.mentions_24h ?? 0).toLocaleString()} />
        <StatsCard label="Last 7 days" value={(stats?.mentions_7d ?? 0).toLocaleString()} />
        <StatsCard
          label="Avg Sentiment"
          value={stats?.avg_sentiment != null ? stats.avg_sentiment.toFixed(2) : "—"}
          sub="–1 to +1 scale"
        />
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Positive", pct: stats.positive_pct, color: "bg-green-500" },
            { label: "Neutral", pct: stats.neutral_pct, color: "bg-slate-500" },
            { label: "Negative", pct: stats.negative_pct, color: "bg-red-500" },
          ].map(({ label, pct, color }) => (
            <div key={label} className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500">{label}</span>
                <span className="text-sm font-semibold text-slate-200">{pct.toFixed(1)}%</span>
              </div>
              <div className="h-1.5 bg-[#2a2a3e] rounded-full overflow-hidden">
                <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Sentiment Trend (30d)</CardTitle>
            </CardHeader>
            <CardContent>
              <SentimentChart data={analytics.time_series} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Platforms</CardTitle>
            </CardHeader>
            <CardContent>
              <PlatformBreakdown data={analytics.platform_breakdown} />
            </CardContent>
          </Card>
        </div>
      )}

      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle>Top Mentions</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentMentions
              mentions={analytics.top_mentions.map((m) => ({
                ...m,
                brand_id: id,
                external_id: null,
                content: null,
                author_url: null,
                shares_count: null,
                views_count: null,
                sentiment_positive: null,
                sentiment_negative: null,
                sentiment_neutral: null,
                matched_keywords: [],
                ai_recommendation: null,
                ai_context: null,
                created_at: m.published_at || new Date().toISOString(),
              } as any))}
            />
          </CardContent>
        </Card>
      )}

      <div className="text-xs text-slate-600">
        Last crawled: {brand.last_crawled_at ? formatRelativeTime(brand.last_crawled_at) : "Never"}
      </div>
    </div>
  );
}
