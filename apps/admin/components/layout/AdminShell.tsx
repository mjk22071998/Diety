"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login" || pathname?.startsWith("/login/");

  if (isLoginPage) {
    return (
      <div className="w-full min-h-screen bg-[#0B0F19] flex items-center justify-center p-4">
        {children}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0B0F19]">
      <Sidebar />
      <div className="flex-1 pl-64 flex flex-col min-h-screen">
        {/* Top Audit Header Bar */}
        <header className="h-14 border-b border-[#334155] bg-[#0F172A]/80 backdrop-blur sticky top-0 z-30 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-400">NODE:</span>
            <span className="text-xs font-medium text-slate-200">
              diety-admin-tribunal-prod-01
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-[11px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
              PORT 3302
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400">Audit Enclave Active</span>
            </div>
            <span className="text-slate-600">|</span>
            <span data-testid="system-time">UTC SYSTEM CLOCK</span>
          </div>
        </header>

        {/* Main Content Pane */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
