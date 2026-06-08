"use client";

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { platformLabel, platformColor } from "@/lib/utils";
import type { PlatformBreakdown as PlatformBreakdownType } from "@/types";

interface Props {
  data: PlatformBreakdownType[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl px-3 py-2.5 text-xs space-y-1">
      <p className="text-slate-200 font-medium">{platformLabel(d.platform)}</p>
      <p className="text-slate-400">{d.count} mentions</p>
    </div>
  );
};

export default function PlatformBreakdown({ data }: Props) {
  const sorted = [...data].sort((a, b) => b.count - a.count).slice(0, 8);

  return (
    <div className="flex gap-4 items-center">
      <div className="shrink-0">
        <ResponsiveContainer width={140} height={140}>
          <PieChart>
            <Pie
              data={sorted}
              dataKey="count"
              nameKey="platform"
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={65}
              strokeWidth={0}
            >
              {sorted.map((entry) => (
                <Cell key={entry.platform} fill={platformColor(entry.platform)} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex-1 space-y-2 min-w-0">
        {sorted.map((d) => {
          const total = sorted.reduce((s, x) => s + x.count, 0);
          const pct = total ? Math.round((d.count / total) * 100) : 0;
          return (
            <div key={d.platform} className="flex items-center gap-2 text-xs">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: platformColor(d.platform) }}
              />
              <span className="text-slate-400 truncate flex-1">{platformLabel(d.platform)}</span>
              <span className="text-slate-300 font-medium shrink-0">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
