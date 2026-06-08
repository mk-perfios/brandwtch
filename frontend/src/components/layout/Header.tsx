"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User, ChevronDown, RefreshCw } from "lucide-react";
import { authApi } from "@/lib/api";
import type { User as UserType } from "@/types";

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }
    authApi.me().then(setUser).catch(() => router.push("/login"));
  }, [router]);

  const logout = () => {
    localStorage.clear();
    router.push("/login");
  };

  return (
    <header className="h-16 shrink-0 flex items-center justify-between px-6 bg-[#1a1a2e] border-b border-[#2a2a3e]">
      <div />
      <div className="flex items-center gap-3">
        {user && (
          <div className="relative">
            <button
              onClick={() => setOpen((o) => !o)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-semibold text-white">
                {(user.full_name || user.email)[0].toUpperCase()}
              </div>
              <span className="text-sm text-slate-300">{user.full_name || user.email}</span>
              <ChevronDown size={14} className="text-slate-500" />
            </button>

            {open && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl shadow-xl z-50 py-1">
                <button
                  onClick={logout}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/5 transition-colors"
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
