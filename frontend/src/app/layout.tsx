"use client";

import "./globals.css";
import { usePathname } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

const PUBLIC_PATHS = ["/login", "/register"];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
  }));
  const pathname = usePathname();
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  return (
    <html lang="en" className="dark">
      <body className="bg-[#0f0f1a] text-slate-200 antialiased">
        <QueryClientProvider client={queryClient}>
          {isPublic ? (
            <main className="min-h-screen">{children}</main>
          ) : (
            <div className="flex h-screen overflow-hidden">
              <Sidebar />
              <div className="flex flex-1 flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-6 bg-[#0f0f1a]">{children}</main>
              </div>
            </div>
          )}
        </QueryClientProvider>
      </body>
    </html>
  );
}
