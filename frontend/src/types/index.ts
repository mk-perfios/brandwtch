export interface User {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: "free" | "pro" | "enterprise";
  created_at: string;
}

export interface OrgMember {
  user_id: string;
  org_id: string;
  role: "owner" | "admin" | "member";
  joined_at: string;
  user?: User;
}

export interface Brand {
  id: string;
  org_id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  website_url: string | null;
  twitter_handle: string | null;
  reddit_username: string | null;
  youtube_channel_id: string | null;
  keywords: string[];
  enabled_platforms: string[];
  crawl_interval_minutes: number;
  is_active: boolean;
  last_crawled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BrandCreate {
  name: string;
  description?: string;
  color?: string;
  website_url?: string;
  twitter_handle?: string;
  reddit_username?: string;
  youtube_channel_id?: string;
  keywords?: string[];
  enabled_platforms?: string[];
  crawl_interval_minutes?: number;
}

export interface BrandStats {
  brand_id: string;
  total_mentions: number;
  mentions_24h: number;
  mentions_7d: number;
  avg_sentiment: number | null;
  positive_pct: number;
  negative_pct: number;
  neutral_pct: number;
  top_platform: string | null;
}

export type SentimentLabel = "positive" | "negative" | "neutral";

export type Platform =
  | "reddit"
  | "twitter"
  | "google"
  | "quora"
  | "hacker_news"
  | "youtube"
  | "news"
  | "ai_claude"
  | "ai_chatgpt"
  | "ai_gemini"
  | "ai_perplexity"
  | "ai_content"
  | "other";

export interface Mention {
  id: string;
  brand_id: string;
  platform: Platform;
  external_id: string | null;
  url: string | null;
  title: string | null;
  content: string | null;
  author: string | null;
  author_url: string | null;
  upvotes: number | null;
  comments_count: number | null;
  shares_count: number | null;
  views_count: number | null;
  sentiment_label: SentimentLabel | null;
  sentiment_score: number | null;
  sentiment_positive: number | null;
  sentiment_negative: number | null;
  sentiment_neutral: number | null;
  matched_keywords: string[];
  ai_recommendation: boolean | null;
  ai_context: string | null;
  published_at: string | null;
  created_at: string;
}

export interface MentionPage {
  items: Mention[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface TimeSeriesPoint {
  date: string;
  total: number;
  positive: number;
  negative: number;
  neutral: number;
  avg_sentiment: number | null;
}

export interface PlatformBreakdown {
  platform: string;
  count: number;
  positive: number;
  negative: number;
  neutral: number;
  avg_sentiment: number | null;
}

export interface SentimentSummary {
  total: number;
  positive: number;
  negative: number;
  neutral: number;
  avg_score: number | null;
  positive_pct: number;
  negative_pct: number;
  neutral_pct: number;
}

export interface TopMention {
  id: string;
  platform: string;
  title: string | null;
  url: string | null;
  author: string | null;
  upvotes: number | null;
  sentiment_label: SentimentLabel | null;
  sentiment_score: number | null;
  published_at: string | null;
}

export interface AnalyticsDashboard {
  brand_id: string;
  days: number;
  sentiment: SentimentSummary;
  time_series: TimeSeriesPoint[];
  platform_breakdown: PlatformBreakdown[];
  top_mentions: TopMention[];
  trending_keywords: Record<string, number>;
}

export interface OverviewStats {
  total_brands: number;
  total_mentions: number;
  mentions_24h: number;
  avg_sentiment: number | null;
  platform_breakdown: PlatformBreakdown[];
  recent_mentions: Mention[];
}

export type AlertType =
  | "sentiment_drop"
  | "mention_spike"
  | "negative_surge"
  | "keyword_alert"
  | "platform_down";

export type AlertSeverity = "low" | "medium" | "high" | "critical";

export interface Alert {
  id: string;
  brand_id: string;
  name: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  threshold_value: number | null;
  threshold_window_hours: number;
  platforms: string[] | null;
  notify_email: string | null;
  notify_webhook: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AlertEvent {
  id: string;
  alert_id: string;
  message: string;
  data: Record<string, unknown>;
  resolved: boolean;
  triggered_at: string;
}

export interface AlertCreate {
  brand_id: string;
  name: string;
  alert_type: AlertType;
  severity?: AlertSeverity;
  threshold_value?: number;
  threshold_window_hours?: number;
  platforms?: string[];
  notify_email?: string;
  notify_webhook?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
  org: Organization;
}

export interface MonitorStatus {
  brand_id: string;
  brand_name: string;
  last_crawled_at: string | null;
  is_active: boolean;
  enabled_platforms: string[];
}
