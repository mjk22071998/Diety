import React from "react";
import { StatCards } from "@/components/dashboard/StatCards";
import { EscrowFlowChart } from "@/components/dashboard/EscrowFlowChart";
import { TriageAlertsTable } from "@/components/dashboard/TriageAlertsTable";
import { ShieldCheck, RefreshCw } from "lucide-react";

export default function OverviewDashboardPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#334155]/60">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">
            Platform Liquidity & Tribunal Console
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time regulatory compliance, escrow clearing metrics, and credential verification queues.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="px-3 py-1.5 bg-[#1E293B] hover:bg-[#243247] border border-[#334155] rounded text-xs font-mono text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
            <span>Sync Ledger</span>
          </button>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded text-xs font-mono text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Audited OK</span>
          </div>
        </div>
      </div>

      {/* 4 KPI Stat Cards */}
      <section aria-label="Key Performance Indicators">
        <StatCards />
      </section>

      {/* Escrow Flow Chart */}
      <section aria-label="Escrow Flow Analysis">
        <EscrowFlowChart />
      </section>

      {/* Triage Priority Desk */}
      <section aria-label="Action Priority Queue">
        <TriageAlertsTable />
      </section>
    </div>
  );
}
