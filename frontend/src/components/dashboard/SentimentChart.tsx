"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { format, parseISO } from "date-fns";
import type { TimeSeriesPoint } from "@/types";

interface SentimentChartProps {
  data: TimeSeriesPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl px-3 py-2.5 text-xs space-y-1">
      <p className="text-slate-400 mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-400 capitalize">{p.dataKey}:</span>
          <span className="text-slate-200 font-medium">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function SentimentChart({ data }: SentimentChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    date: (() => {
      try {
        return format(parseISO(d.date), "MMM d");
      } catch {
        return d.date;
      }
    })(),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={formatted} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="gPos" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gNeg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gNeu" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          formatter={(v) => <span className="text-slate-400 capitalize">{v}</span>}
        />
        <Area type="monotone" dataKey="positive" stroke="#22c55e" fill="url(#gPos)" strokeWidth={2} />
        <Area type="monotone" dataKey="negative" stroke="#ef4444" fill="url(#gNeg)" strokeWidth={2} />
        <Area type="monotone" dataKey="neutral" stroke="#94a3b8" fill="url(#gNeu)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
