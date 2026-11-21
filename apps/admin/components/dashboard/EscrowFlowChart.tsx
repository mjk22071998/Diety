"use client";

import React, { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export interface EscrowMonthlyData {
  month: string;
  lockedVolume: number; // in USD
  disbursedVolume: number;
  refundedVolume: number;
}

export const ESCROW_CHART_DATA: EscrowMonthlyData[] = [
  { month: "Jun", lockedVolume: 145000, disbursedVolume: 112000, refundedVolume: 3200 },
  { month: "Jul", lockedVolume: 182000, disbursedVolume: 146000, refundedVolume: 4100 },
  { month: "Aug", lockedVolume: 220000, disbursedVolume: 179000, refundedVolume: 5000 },
  { month: "Sep", lockedVolume: 295000, disbursedVolume: 234000, refundedVolume: 6200 },
  { month: "Oct", lockedVolume: 380000, disbursedVolume: 310000, refundedVolume: 8100 },
  { month: "Nov", lockedVolume: 482500, disbursedVolume: 395000, refundedVolume: 9400 },
];

export function EscrowFlowChart({
  data = ESCROW_CHART_DATA,
}: {
  data?: EscrowMonthlyData[];
}) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const formatCurrency = (val: number) => `$${(val / 1000).toFixed(0)}k`;

  return (
    <div
      className="bg-[#1E293B] border border-[#334155] rounded-lg p-5 shadow-sm"
      data-testid="escrow-flow-chart"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-[#334155]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-100 tracking-tight">
              Escrow Flow & Settlement Ledger
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
              Double-Entry Clearing
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Rolling 6-month comparison of escrow deposits locked vs completed disbursements
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-blue-500" />
            <span className="text-slate-300">Locked Deposit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
            <span className="text-slate-300">Disbursed</span>
          </div>
        </div>
      </div>

      <div className="h-[280px] w-full" data-testid="recharts-wrapper">
        {isMounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="lockedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="disbursedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis
                dataKey="month"
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "#334155" }}
              />
              <YAxis
                stroke="#94A3B8"
                fontSize={11}
                tickFormatter={formatCurrency}
                tickLine={false}
                axisLine={{ stroke: "#334155" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0F172A",
                  borderColor: "#334155",
                  borderRadius: "6px",
                  fontSize: "12px",
                  color: "#F1F5F9",
                }}
                formatter={(value: any) => [
                  `$${Number(value ?? 0).toLocaleString()}`,
                  "",
                ]}
              />
              <Area
                type="monotone"
                dataKey="lockedVolume"
                name="Locked Volume"
                stroke="#3B82F6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#lockedGrad)"
              />
              <Area
                type="monotone"
                dataKey="disbursedVolume"
                name="Disbursed Volume"
                stroke="#10B981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#disbursedGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full w-full flex items-center justify-center text-xs text-slate-500 font-mono">
            Initializing chart engine...
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-[#334155] grid grid-cols-3 gap-2 text-center">
        <div>
          <span className="text-[10px] text-slate-400 block uppercase font-mono">
            30d Volume Growth
          </span>
          <span className="text-xs font-semibold text-blue-400 font-mono">+26.9%</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 block uppercase font-mono">
            Clearing Ratio
          </span>
          <span className="text-xs font-semibold text-emerald-400 font-mono">81.8%</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 block uppercase font-mono">
            Disputed Reserve
          </span>
          <span className="text-xs font-semibold text-amber-400 font-mono">1.95%</span>
        </div>
      </div>
    </div>
  );
}
