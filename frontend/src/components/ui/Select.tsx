import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  error?: string;
}

export default function Select({ label, options, error, className, ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-medium text-slate-400">{label}</label>
      )}
      <div className="relative">
        <select
          className={cn(
            "w-full appearance-none px-3 py-2 bg-[#0f0f1a] border border-[#2a2a3e] rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors pr-8",
            error && "border-red-500",
            className
          )}
          {...props}
        >
          {options.map(({ value, label }) => (
            <option key={value} value={value} className="bg-[#1a1a2e]">
              {label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
