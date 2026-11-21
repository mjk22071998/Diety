"use client";

import React from "react";
import Link from "next/link";
import {
  Scale,
  Clock,
  ArrowRight,
} from "lucide-react";
import { SAMPLE_DISPUTES } from "@/app/disputes/[caseId]/page";

export default function TribunalDisputesListPage() {
  const disputes = Object.values(SAMPLE_DISPUTES);

  return (
    <div className="space-y-6" data-testid="tribunal-disputes-queue">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">
              Dispute Tribunal Court Docket
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Active evidentiary hearings, escrow arbitration splits, and disciplinary tribunal proceedings.
          </p>
        </div>

        <div className="bg-[#1E293B] border border-[#334155] rounded px-3 py-1.5 flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-400">ACTIVE DOCKETS:</span>
          <span className="text-xs font-mono font-bold text-red-400">
            {disputes.length} IN PROGRESS
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {disputes.map((docket) => (
          <div
            key={docket.docketId}
            className="bg-[#1E293B] border border-[#334155] hover:border-[#475569] rounded-lg p-5 shadow-sm transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-sm font-bold font-mono text-slate-100">
                  {docket.docketId}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Contract #{docket.contractId}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                  {docket.status}
                </span>
              </div>

              <div className="text-xs text-slate-300">
                <span className="font-semibold text-slate-200">
                  {docket.client.name}
                </span>{" "}
                vs{" "}
                <span className="font-semibold text-slate-200">
                  {docket.dietitian.name}
                </span>
              </div>

              <p className="text-xs text-slate-400 line-clamp-1">
                {docket.client.statement}
              </p>

              <div className="flex items-center gap-4 text-[11px] font-mono text-slate-500 pt-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Opened: {docket.openedTimestamp}
                </span>
                <span>•</span>
                <span>
                  Exhibits: {docket.client.evidence.length + docket.dietitian.evidence.length} filed
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right">
                <span className="text-[10px] font-mono uppercase text-slate-400 block">
                  Escrow Locked
                </span>
                <span className="text-base font-bold font-mono text-emerald-400">
                  ${(docket.escrowTotalCents / 100).toFixed(2)}
                </span>
              </div>

              <Link
                href={`/disputes/${docket.docketId}`}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Enter Court</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
