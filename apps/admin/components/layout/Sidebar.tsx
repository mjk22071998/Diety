"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShieldCheck,
  Scale,
  FileText,
  ShieldAlert,
  Lock,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    name: "Overview",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Credentials Queue",
    href: "/credentials",
    icon: ShieldCheck,
    badge: "14 Pending",
    badgeColor: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  },
  {
    name: "Dispute Tribunal",
    href: "/tribunal",
    icon: Scale,
    badge: "7 Active",
    badgeColor: "bg-red-500/10 text-red-400 border border-red-500/20",
  },
  {
    name: "Audit Logs",
    href: "/audit-logs",
    icon: FileText,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="w-64 bg-[#0F172A] border-r border-[#334155] flex flex-col justify-between h-screen fixed left-0 top-0 z-40 select-none"
      data-testid="admin-sidebar"
    >
      {/* Top Branding Section */}
      <div>
        <div className="h-16 px-5 border-b border-[#334155] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-xs tracking-wider text-slate-100 uppercase">
                Diety Tribunal
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Port 3002 • Node v1.0
              </div>
            </div>
          </div>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            LIVE
          </span>
        </div>

        {/* Navigation Section */}
        <nav className="p-3 space-y-1" aria-label="Admin Navigation">
          <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-slate-400">
            Arbitration & Control
          </div>
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-[#1E293B] text-white border-l-2 border-blue-500 pl-2.5 font-semibold"
                    : "text-slate-300 hover:bg-[#1E293B]/60 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? "text-blue-400" : "text-slate-400"
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Operator Session Footer */}
      <div className="p-4 border-t border-[#334155] bg-[#0B0F19]/60">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Enclave Security</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400">mTLS</span>
        </div>
        <div className="bg-[#1E293B] p-2.5 rounded border border-[#334155]/80">
          <div className="flex items-center justify-between">
            <div className="truncate">
              <p className="text-xs font-medium text-slate-200 truncate">
                Admin Console
              </p>
              <p className="text-[10px] text-slate-400 font-mono">
                Role: ADMIN / ARB
              </p>
            </div>
            <Link
              href="/login"
              className="text-[10px] text-slate-400 hover:text-slate-200 underline"
            >
              Sign out
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
