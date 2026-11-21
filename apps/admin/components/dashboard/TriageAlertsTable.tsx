"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  ShieldAlert,
  Scale,
  FileCheck,
  ChevronRight,
  Filter,
} from "lucide-react";

export type AlertSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type AlertCategory =
  | "DISPUTE_TRIBUNAL"
  | "CREDENTIAL_AUDIT"
  | "ESCROW_SECURITY"
  | "CLINICAL_SAFETY";

export interface TriageAlert {
  id: string;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  subject: string;
  escrowAmountFormatted?: string;
  timestamp: string;
  actionLabel: string;
}

export const INITIAL_TRIAGE_ALERTS: TriageAlert[] = [
  {
    id: "ALR-8841",
    severity: "CRITICAL",
    category: "CLINICAL_SAFETY",
    title: "Prescription of contra-indicated allergen in renal protocol",
    subject: "Client #C-9021 vs Dietitian #D-1140",
    escrowAmountFormatted: "$1,850.00",
    timestamp: "12m ago",
    actionLabel: "Tribunal Hold",
  },
  {
    id: "ALR-8839",
    severity: "HIGH",
    category: "DISPUTE_TRIBUNAL",
    title: "Deliverable non-performance filed after 72hr milestone window",
    subject: "Contract #CTR-7728 • Escrow Milestone #2",
    escrowAmountFormatted: "$920.00",
    timestamp: "34m ago",
    actionLabel: "Assign Arbitrator",
  },
  {
    id: "ALR-8834",
    severity: "HIGH",
    category: "CREDENTIAL_AUDIT",
    title: "California Board of Registered Dietitians license expiry in 3 days",
    subject: "Dietitian #D-4091 (Sarah Miller, MS, RD)",
    timestamp: "1h ago",
    actionLabel: "Verify OCR",
  },
  {
    id: "ALR-8827",
    severity: "MEDIUM",
    category: "ESCROW_SECURITY",
    title: "Disbursement velocity anomaly: 3 consecutive payouts to new routing address",
    subject: "Dietitian #D-0822 • Payout Ledger #PAY-3310",
    escrowAmountFormatted: "$4,100.00",
    timestamp: "2h ago",
    actionLabel: "Security Freeze",
  },
  {
    id: "ALR-8819",
    severity: "LOW",
    category: "CREDENTIAL_AUDIT",
    title: "Annual malpractice insurance certificate renewal submitted",
    subject: "Dietitian #D-2219 (Marcus Reed, RD)",
    timestamp: "4h ago",
    actionLabel: "Approve Proof",
  },
];

export function TriageAlertsTable({
  initialAlerts = INITIAL_TRIAGE_ALERTS,
}: {
  initialAlerts?: TriageAlert[];
}) {
  const [alerts, setAlerts] = useState<TriageAlert[]>(initialAlerts);
  const [filterSeverity, setFilterSeverity] = useState<string>("ALL");

  const filtered = alerts.filter((a) =>
    filterSeverity === "ALL" ? true : a.severity === filterSeverity
  );

  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-red-500/10 text-red-400 border-red-500/30";
      case "HIGH":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "MEDIUM":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
      case "LOW":
        return "bg-slate-500/10 text-slate-400 border-slate-500/30";
    }
  };

  const getCategoryIcon = (category: AlertCategory) => {
    switch (category) {
      case "CLINICAL_SAFETY":
        return <AlertTriangle className="w-3.5 h-3.5 text-red-400" />;
      case "DISPUTE_TRIBUNAL":
        return <Scale className="w-3.5 h-3.5 text-amber-400" />;
      case "CREDENTIAL_AUDIT":
        return <FileCheck className="w-3.5 h-3.5 text-blue-400" />;
      case "ESCROW_SECURITY":
        return <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  const handleActionClick = (id: string) => {
    // Action feedback
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div
      className="bg-[#1E293B] border border-[#334155] rounded-lg shadow-sm overflow-hidden"
      data-testid="triage-alerts-table"
    >
      <div className="p-4 border-b border-[#334155] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-100 tracking-tight">
              Action Priority Queue (Triage Desk)
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
              {filtered.length} Active Items
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time tribunal dispute triggers, escrow risk alerts, and credential audit expirations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-2.5 py-1 text-xs bg-[#0F172A] border border-[#334155] rounded text-slate-300 focus:outline-none focus:border-blue-500 font-mono"
            data-testid="filter-severity"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="HIGH">High Only</option>
            <option value="MEDIUM">Medium Only</option>
            <option value="LOW">Low Only</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#334155] bg-[#0F172A]/70 text-[11px] font-mono uppercase text-slate-400">
              <th className="py-2.5 px-4 font-semibold">Incident</th>
              <th className="py-2.5 px-3 font-semibold">Severity</th>
              <th className="py-2.5 px-3 font-semibold">Classification & Description</th>
              <th className="py-2.5 px-3 font-semibold">Subject Context</th>
              <th className="py-2.5 px-3 font-semibold text-right">Escrow</th>
              <th className="py-2.5 px-3 font-semibold">Logged</th>
              <th className="py-2.5 px-4 font-semibold text-right">Triage Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#334155]/60">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                  No pending incidents in this severity classification.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-[#243247]/50 transition-colors"
                  data-testid={`incident-row-${item.id}`}
                >
                  <td className="py-3 px-4 font-mono font-medium text-slate-300">
                    {item.id}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono border font-semibold ${getSeverityBadge(
                        item.severity
                      )}`}
                    >
                      {item.severity}
                    </span>
                  </td>
                  <td className="py-3 px-3 max-w-sm">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {getCategoryIcon(item.category)}
                      <span className="text-[10px] font-mono text-slate-400 uppercase">
                        {item.category.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-slate-200 font-medium leading-snug">
                      {item.title}
                    </p>
                  </td>
                  <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                    {item.subject}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-semibold text-slate-200 tabular-nums">
                    {item.escrowAmountFormatted || "—"}
                  </td>
                  <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                    {item.timestamp}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleActionClick(item.id)}
                      className="px-2.5 py-1 text-[11px] font-medium bg-[#0F172A] hover:bg-blue-600 hover:text-white text-slate-200 border border-[#334155] rounded transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>{item.actionLabel}</span>
                      <ChevronRight className="w-3 h-3 text-slate-400" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
