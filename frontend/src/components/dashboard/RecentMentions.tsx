import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { platformLabel, platformColor, sentimentBg, formatRelativeTime, truncate } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import type { Mention } from "@/types";

interface Props {
  mentions: Mention[];
}

export default function RecentMentions({ mentions }: Props) {
  if (!mentions.length) {
    return (
      <p className="text-center text-slate-600 text-sm py-8">No recent mentions yet.</p>
    );
  }

  return (
    <div className="space-y-3">
      {mentions.map((m) => (
        <div
          key={m.id}
          className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/3 transition-colors"
        >
          <div
            className="w-2 h-2 rounded-full shrink-0 mt-1.5"
            style={{ background: platformColor(m.platform) }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500">{platformLabel(m.platform)}</span>
              {m.sentiment_label && (
                <Badge
                  variant={
                    m.sentiment_label === "positive"
                      ? "positive"
                      : m.sentiment_label === "negative"
                      ? "negative"
                      : "neutral"
                  }
                >
                  {m.sentiment_label}
                </Badge>
              )}
              {m.ai_recommendation != null && (
                <Badge variant={m.ai_recommendation ? "positive" : "negative"}>
                  {m.ai_recommendation ? "✓ Recommended" : "✗ Not recommended"}
                </Badge>
              )}
            </div>
            <p className="text-sm text-slate-300 mt-0.5 leading-snug">
              {truncate(m.title || m.content, 100)}
            </p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-slate-600">{formatRelativeTime(m.created_at)}</span>
              {m.author && <span className="text-xs text-slate-600">by {m.author}</span>}
              {m.url && (
                <a
                  href={m.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  <ExternalLink size={10} /> View
                </a>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
