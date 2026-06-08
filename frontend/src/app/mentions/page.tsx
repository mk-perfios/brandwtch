"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { mentionsApi, brandsApi } from "@/lib/api";
import MentionCard from "@/components/mentions/MentionCard";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { platformLabel, ALL_PLATFORMS } from "@/lib/utils";

const SENTIMENT_OPTIONS = [
  { value: "", label: "All sentiments" },
  { value: "positive", label: "Positive" },
  { value: "negative", label: "Negative" },
  { value: "neutral", label: "Neutral" },
];

const PLATFORM_OPTIONS = [
  { value: "", label: "All platforms" },
  ...ALL_PLATFORMS.map((p) => ({ value: p, label: platformLabel(p) })),
];

const DAY_OPTIONS = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
];

export default function MentionsPage() {
  const [brandId, setBrandId] = useState("");
  const [platform, setPlatform] = useState("");
  const [sentiment, setSentiment] = useState("");
  const [days, setDays] = useState("30");
  const [page, setPage] = useState(1);

  const { data: brands = [] } = useQuery({
    queryKey: ["brands"],
    queryFn: brandsApi.list,
  });

  const brandOptions = [
    { value: "", label: "All brands" },
    ...brands.map((b) => ({ value: b.id, label: b.name })),
  ];

  const { data, isLoading } = useQuery({
    queryKey: ["mentions", { brandId, platform, sentiment, days, page }],
    queryFn: () =>
      mentionsApi.list({
        brand_id: brandId || undefined,
        platform: platform || undefined,
        sentiment: sentiment || undefined,
        days: parseInt(days),
        page,
        size: 20,
      }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Mentions</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {data?.total.toLocaleString() ?? "…"} mentions found
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="w-44">
          <Select
            options={brandOptions}
            value={brandId}
            onChange={(e) => { setBrandId(e.target.value); setPage(1); }}
          />
        </div>
        <div className="w-44">
          <Select
            options={PLATFORM_OPTIONS}
            value={platform}
            onChange={(e) => { setPlatform(e.target.value); setPage(1); }}
          />
        </div>
        <div className="w-44">
          <Select
            options={SENTIMENT_OPTIONS}
            value={sentiment}
            onChange={(e) => { setSentiment(e.target.value); setPage(1); }}
          />
        </div>
        <div className="w-36">
          <Select
            options={DAY_OPTIONS}
            value={days}
            onChange={(e) => { setDays(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        </div>
      ) : !data?.items.length ? (
        <div className="text-center py-20 text-slate-600">No mentions found for these filters.</div>
      ) : (
        <div className="space-y-3">
          {data.items.map((m) => (
            <MentionCard key={m.id} mention={m} />
          ))}
        </div>
      )}

      {data && data.pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft size={14} /> Prev
          </Button>
          <span className="text-sm text-slate-500">
            Page {page} of {data.pages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
            disabled={page === data.pages}
          >
            Next <ChevronRight size={14} />
          </Button>
        </div>
      )}
    </div>
  );
}
