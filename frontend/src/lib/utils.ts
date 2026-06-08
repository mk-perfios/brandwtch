import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow } from "date-fns";
import type { Platform, SentimentLabel } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function sentimentColor(label: SentimentLabel | null | undefined): string {
  switch (label) {
    case "positive":
      return "text-green-400";
    case "negative":
      return "text-red-400";
    default:
      return "text-slate-400";
  }
}

export function sentimentBg(label: SentimentLabel | null | undefined): string {
  switch (label) {
    case "positive":
      return "bg-green-500/10 text-green-400 border-green-500/20";
    case "negative":
      return "bg-red-500/10 text-red-400 border-red-500/20";
    default:
      return "bg-slate-500/10 text-slate-400 border-slate-500/20";
  }
}

export function platformLabel(platform: string): string {
  const labels: Record<string, string> = {
    reddit: "Reddit",
    twitter: "Twitter / X",
    google: "Google",
    quora: "Quora",
    hacker_news: "Hacker News",
    youtube: "YouTube",
    news: "News",
    ai_claude: "Claude",
    ai_chatgpt: "ChatGPT",
    ai_gemini: "Gemini",
    ai_perplexity: "Perplexity",
    ai_content: "AI Content",
    other: "Other",
  };
  return labels[platform] ?? platform;
}

export function platformColor(platform: string): string {
  const colors: Record<string, string> = {
    reddit: "#ff4500",
    twitter: "#1d9bf0",
    google: "#4285f4",
    quora: "#a82400",
    hacker_news: "#ff6600",
    youtube: "#ff0000",
    news: "#22c55e",
    ai_claude: "#cc785c",
    ai_chatgpt: "#10a37f",
    ai_gemini: "#4285f4",
    ai_perplexity: "#20b2aa",
    ai_content: "#8b5cf6",
    other: "#64748b",
  };
  return colors[platform] ?? "#64748b";
}

export const ALL_PLATFORMS: Platform[] = [
  "reddit",
  "twitter",
  "google",
  "quora",
  "hacker_news",
  "youtube",
  "news",
  "ai_claude",
  "ai_chatgpt",
  "ai_gemini",
  "ai_perplexity",
  "ai_content",
];

export function formatRelativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return dateStr;
  }
}

export function truncate(str: string | null | undefined, len = 120): string {
  if (!str) return "";
  return str.length > len ? str.slice(0, len) + "…" : str;
}

export function scoreToPercent(score: number | null | undefined): string {
  if (score == null) return "—";
  return `${Math.round((score + 1) * 50)}%`;
}
