"use client";

import Link from "next/link";
import { Globe, Activity, Tag } from "lucide-react";
import { formatRelativeTime, platformLabel } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import type { Brand } from "@/types";

interface Props {
  brand: Brand;
}

export default function BrandCard({ brand }: Props) {
  const color = brand.color || "#6366f1";

  return (
    <Link
      href={`/brands/${brand.id}`}
      className="block bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl p-5 hover:border-indigo-500/40 hover:bg-[#1e1e38] transition-all group"
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
          style={{ background: color }}
        >
          {brand.name[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors truncate">
              {brand.name}
            </h3>
            {!brand.is_active && (
              <Badge variant="outline">Paused</Badge>
            )}
          </div>
          {brand.description && (
            <p className="text-xs text-slate-500 mt-0.5 truncate">{brand.description}</p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {brand.enabled_platforms.slice(0, 5).map((p) => (
          <Badge key={p} variant="outline">
            {platformLabel(p)}
          </Badge>
        ))}
        {brand.enabled_platforms.length > 5 && (
          <Badge variant="outline">+{brand.enabled_platforms.length - 5}</Badge>
        )}
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-slate-600">
        {brand.website_url && (
          <span className="flex items-center gap-1">
            <Globe size={11} />
            {new URL(brand.website_url).hostname}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Activity size={11} />
          {brand.last_crawled_at
            ? `Crawled ${formatRelativeTime(brand.last_crawled_at)}`
            : "Never crawled"}
        </span>
        <span className="flex items-center gap-1">
          <Tag size={11} />
          {brand.keywords.length} keywords
        </span>
      </div>
    </Link>
  );
}
