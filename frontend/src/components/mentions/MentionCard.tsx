import { ExternalLink, ThumbsUp, MessageCircle, Eye } from "lucide-react";
import {
  platformLabel,
  platformColor,
  sentimentBg,
  formatRelativeTime,
  truncate,
} from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import type { Mention } from "@/types";

interface Props {
  mention: Mention;
}

export default function MentionCard({ mention: m }: Props) {
  return (
    <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl p-4 hover:border-[#3a3a5e] transition-colors">
      <div className="flex items-start gap-3">
        <div
          className="w-2.5 h-2.5 rounded-full shrink-0 mt-1.5"
          style={{ background: platformColor(m.platform) }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className="text-xs font-medium text-slate-400">
              {platformLabel(m.platform)}
            </span>
            {m.sentiment_label && (
              <span
                className={`text-xs px-2 py-0.5 rounded-md border font-medium ${sentimentBg(m.sentiment_label)}`}
              >
                {m.sentiment_label}
                {m.sentiment_score != null && ` (${m.sentiment_score.toFixed(2)})`}
              </span>
            )}
            {m.ai_recommendation != null && (
              <Badge variant={m.ai_recommendation ? "positive" : "negative"}>
                AI: {m.ai_recommendation ? "✓ Recommended" : "✗ Not recommended"}
              </Badge>
            )}
          </div>

          {m.title && (
            <h4 className="text-sm font-semibold text-slate-200 leading-snug mb-1">
              {m.title}
            </h4>
          )}

          {m.content && (
            <p className="text-sm text-slate-400 leading-relaxed">{truncate(m.content, 200)}</p>
          )}

          {m.ai_context && (
            <div className="mt-2 px-3 py-2 bg-indigo-500/5 border border-indigo-500/20 rounded-lg">
              <p className="text-xs text-indigo-300 leading-relaxed">{truncate(m.ai_context, 300)}</p>
            </div>
          )}

          <div className="flex items-center gap-4 mt-2.5">
            {m.author && (
              <span className="text-xs text-slate-600">
                {m.author_url ? (
                  <a href={m.author_url} target="_blank" rel="noopener noreferrer" className="hover:text-slate-400">
                    {m.author}
                  </a>
                ) : (
                  m.author
                )}
              </span>
            )}
            {m.upvotes != null && (
              <span className="flex items-center gap-1 text-xs text-slate-600">
                <ThumbsUp size={11} /> {m.upvotes}
              </span>
            )}
            {m.comments_count != null && (
              <span className="flex items-center gap-1 text-xs text-slate-600">
                <MessageCircle size={11} /> {m.comments_count}
              </span>
            )}
            {m.views_count != null && (
              <span className="flex items-center gap-1 text-xs text-slate-600">
                <Eye size={11} /> {m.views_count.toLocaleString()}
              </span>
            )}
            <span className="text-xs text-slate-600 ml-auto">
              {formatRelativeTime(m.published_at || m.created_at)}
            </span>
            {m.url && (
              <a
                href={m.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <ExternalLink size={11} /> View
              </a>
            )}
          </div>

          {m.matched_keywords.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {m.matched_keywords.map((kw) => (
                <span key={kw} className="text-xs px-1.5 py-0.5 bg-slate-500/10 text-slate-500 rounded">
                  {kw}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
