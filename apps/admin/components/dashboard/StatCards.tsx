import React from "react";
import { DollarSign, Lock, Scale, FileCheck, ArrowUpRight } from "lucide-react";

export interface PlatformMetrics {
  gmvCents: number;
  totalEscrowLockedCents: number;
  activeDisputesCount: number;
  pendingCredentialAuditsCount: number;
}

export const DEFAULT_PLATFORM_METRICS: PlatformMetrics = {
  gmvCents: 48250000, // $482,500.00
  totalEscrowLockedCents: 19420000, // $194,200.00
  activeDisputesCount: 7,
  pendingCredentialAuditsCount: 14,
};

/**
 * Formats an amount in integer cents into standard USD currency string ($X,XXX.XX).
 */
export function formatCentsToUsd(cents: number): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars);
}

export function StatCards({
  metrics = DEFAULT_PLATFORM_METRICS,
}: {
  metrics?: PlatformMetrics;
}) {
  const formattedGmv = formatCentsToUsd(metrics.gmvCents);
  const formattedEscrow = formatCentsToUsd(metrics.totalEscrowLockedCents);

  const cards = [
    {
      title: "Gross Merchandise Volume (GMV)",
      value: formattedGmv,
      rawMetric: metrics.gmvCents,
      delta: "+18.4% vs prev 30d",
      deltaType: "positive",
      icon: DollarSign,
      accentBorder: "border-blue-500/40",
      accentBg: "bg-blue-500/10",
      accentText: "text-blue-400",
      testId: "kpi-gmv",
    },
    {
      title: "Total Escrow Locked",
      value: formattedEscrow,
      rawMetric: metrics.totalEscrowLockedCents,
      delta: "41 active contracts in clearing",
      deltaType: "neutral",
      icon: Lock,
      accentBorder: "border-emerald-500/40",
      accentBg: "bg-emerald-500/10",
      accentText: "text-emerald-400",
      testId: "kpi-escrow",
    },
    {
      title: "Active Tribunal Disputes",
      value: String(metrics.activeDisputesCount),
      rawMetric: metrics.activeDisputesCount,
      delta: "2 priority hearings scheduled today",
      deltaType: "urgent",
      icon: Scale,
      accentBorder: "border-red-500/40",
      accentBg: "bg-red-500/10",
      accentText: "text-red-400",
      testId: "kpi-disputes",
    },
    {
      title: "Pending Credential Audits",
      value: String(metrics.pendingCredentialAuditsCount),
      rawMetric: metrics.pendingCredentialAuditsCount,
      delta: "4 state medical boards awaiting OCR check",
      deltaType: "warning",
      icon: FileCheck,
      accentBorder: "border-amber-500/40",
      accentBg: "bg-amber-500/10",
      accentText: "text-amber-400",
      testId: "kpi-audits",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="kpi-stat-cards">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            data-testid={card.testId}
            className={`bg-[#1E293B] border border-[#334155] rounded-lg p-4 flex flex-col justify-between shadow-sm hover:border-[#475569] transition-colors relative overflow-hidden`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400 truncate">
                {card.title}
              </span>
              <div
                className={`w-7 h-7 rounded flex items-center justify-center shrink-0 border ${card.accentBorder} ${card.accentBg} ${card.accentText}`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>

            <div>
              <div
                className="text-2xl font-bold text-slate-100 font-mono tracking-tight tabular-nums"
                data-testid={`${card.testId}-value`}
              >
                {card.value}
              </div>
              <div className="mt-2 flex items-center text-[11px] text-slate-400">
                {card.deltaType === "positive" && (
                  <ArrowUpRight className="w-3 h-3 text-emerald-400 mr-1 shrink-0" />
                )}
                {card.deltaType === "urgent" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 mr-1.5 shrink-0" />
                )}
                {card.deltaType === "warning" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5 shrink-0" />
                )}
                <span className="truncate">{card.delta}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
