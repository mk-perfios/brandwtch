import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "positive" | "negative" | "neutral" | "indigo" | "outline";
  className?: string;
}

export default function Badge({ children, variant = "default", className }: BadgeProps) {
  const variants = {
    default: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    positive: "bg-green-500/10 text-green-400 border-green-500/20",
    negative: "bg-red-500/10 text-red-400 border-red-500/20",
    neutral: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    outline: "bg-transparent text-slate-400 border-[#2a2a3e]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
