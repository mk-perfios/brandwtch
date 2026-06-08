import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: "up" | "down" | "flat";
  trendValue?: string;
  accent?: boolean;
}

export default function StatsCard({
  label,
  value,
  sub,
  trend,
  trendValue,
  accent,
}: StatsCardProps) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor =
    trend === "up" ? "text-green-400" : trend === "down" ? "text-red-400" : "text-slate-500";

  return (
    <div
      className={cn(
        "bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl px-5 py-4",
        accent && "border-indigo-500/30 bg-indigo-500/5"
      )}
    >
      <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-slate-100 mt-1">{value}</p>
      {(sub || trend) && (
        <div className="flex items-center gap-2 mt-1.5">
          {trend && (
            <span className={cn("flex items-center gap-1 text-xs font-medium", trendColor)}>
              <TrendIcon size={12} />
              {trendValue}
            </span>
          )}
          {sub && <span className="text-xs text-slate-500">{sub}</span>}
        </div>
      )}
    </div>
  );
}
