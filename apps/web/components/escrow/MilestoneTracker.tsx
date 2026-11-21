"use client";

import * as React from "react";
import { ContractStatus } from "@diety/types";

export type MilestoneLifecycleState =
  | "ESCROW_LOCKED"
  | "IN_PROGRESS"
  | "SECURITY_CLEARING"
  | "COMPLETED";

export interface MilestoneItem {
  id: string;
  title: string;
  amountCents: number;
  status: MilestoneLifecycleState;
  completedAt?: string;
}

export interface EscrowContractData {
  id: string;
  requirementId?: string;
  dietitianName: string;
  clientName?: string;
  totalAmountCents: number;
  platformFeeCents: number;
  netAmountCents: number;
  status: MilestoneLifecycleState | ContractStatus;
  clearingEndsAt?: string; // ISO 8601 string
  milestones?: MilestoneItem[];
}

interface MilestoneTrackerProps {
  contract: EscrowContractData;
  onDisputeClick?: () => void;
  onApproveRelease?: () => void;
}

function formatCentsToUsd(cents: number): string {
  const dollars = (cents / 100).toFixed(2);
  return `$${dollars}`;
}

const LIFECYCLE_STEPS: {
  key: MilestoneLifecycleState;
  label: string;
  description: string;
}[] = [
  {
    key: "ESCROW_LOCKED",
    label: "Escrow Locked",
    description: "Funds securely held in platform vault",
  },
  {
    key: "IN_PROGRESS",
    label: "In Progress",
    description: "Clinical consultation & meal plans active",
  },
  {
    key: "SECURITY_CLEARING",
    label: "Security Clearing",
    description: "72h clearing window before payout",
  },
  {
    key: "COMPLETED",
    label: "Completed",
    description: "Disbursed to clinician account",
  },
];

export function MilestoneTracker({
  contract,
  onDisputeClick,
  onApproveRelease,
}: MilestoneTrackerProps) {
  // Normalize status string
  const currentStatus: MilestoneLifecycleState = React.useMemo(() => {
    const s = String(contract.status).toUpperCase();
    if (s.includes("LOCKED") || s === "ACTIVE") return "ESCROW_LOCKED";
    if (s.includes("PROGRESS") || s === "DELIVERED") return "IN_PROGRESS";
    if (s.includes("CLEARING")) return "SECURITY_CLEARING";
    if (s.includes("COMPLETE")) return "COMPLETED";
    return "ESCROW_LOCKED";
  }, [contract.status]);

  // Security clearing countdown calculation
  const [countdownText, setCountdownText] = React.useState<string>("71h 59m");

  React.useEffect(() => {
    if (currentStatus !== "SECURITY_CLEARING") return;

    const targetDate = contract.clearingEndsAt
      ? new Date(contract.clearingEndsAt).getTime()
      : Date.now() + 72 * 60 * 60 * 1000;

    const updateTimer = () => {
      const now = Date.now();
      const diffMs = Math.max(0, targetDate - now);
      const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      setCountdownText(`${totalHours}h ${minutes}m`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [currentStatus, contract.clearingEndsAt]);

  const currentStepIndex = LIFECYCLE_STEPS.findIndex(
    (step) => step.key === currentStatus
  );

  return (
    <div
      data-testid="milestone-tracker"
      className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6"
    >
      {/* Top Header: Contract Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <span className="text-xs uppercase font-semibold text-indigo-600 tracking-wider">
            Escrow Agreement • {contract.id}
          </span>
          <h2 className="text-xl font-serif font-bold text-slate-900 mt-0.5">
            Milestone & Escrow Ledger
          </h2>
          <p className="text-xs text-slate-500">
            Assigned Clinician:{" "}
            <span className="font-semibold text-slate-800">
              {contract.dietitianName}
            </span>
          </p>
        </div>

        {/* Current State Badge */}
        <div className="flex items-center gap-2">
          <span
            data-testid="milestone-status"
            className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${
              currentStatus === "COMPLETED"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : currentStatus === "SECURITY_CLEARING"
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : currentStatus === "IN_PROGRESS"
                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                : "bg-slate-100 text-slate-700 border-slate-300"
            }`}
          >
            {LIFECYCLE_STEPS.find((s) => s.key === currentStatus)?.label}
          </span>
        </div>
      </div>

      {/* 4-Step Lifecycle Progress Tracker */}
      <div className="py-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {LIFECYCLE_STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div
                key={step.key}
                className={`p-3 rounded-lg border text-left transition-all ${
                  isCurrent
                    ? "border-indigo-600 bg-indigo-50/50 shadow-xs"
                    : isCompleted
                    ? "border-emerald-300 bg-emerald-50/40 text-emerald-900"
                    : "border-slate-200 bg-slate-50/60 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono font-bold">
                    0{idx + 1}
                  </span>
                  {isCompleted && (
                    <span className="text-emerald-600 text-xs font-bold">
                      ✓ Done
                    </span>
                  )}
                  {isCurrent && (
                    <span className="text-indigo-600 text-xs font-bold animate-pulse">
                      ● Active
                    </span>
                  )}
                </div>
                <div className="text-xs font-semibold text-slate-900">
                  {step.label}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  {step.description}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 72h Security Clearing Banner if in clearing state */}
      {currentStatus === "SECURITY_CLEARING" && (
        <div
          data-testid="clearing-countdown"
          className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">⏱️</span>
            <div>
              <div className="text-sm font-semibold text-amber-900">
                72h Security Clearing Period Active
              </div>
              <div className="text-xs text-amber-700">
                Clinician submitted delivery. Funds disburse automatically once the countdown finishes unless a dispute is lodged.
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs uppercase font-semibold text-amber-700 block">
              Time Remaining
            </span>
            <span className="font-mono font-bold text-lg text-amber-950">
              {countdownText}
            </span>
          </div>
        </div>
      )}

      {/* Financial Breakdown Table: Total, Platform Fee, Net to Dietitian */}
      <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
          Double-Entry Escrow Breakdown
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <span className="block text-xs uppercase font-medium text-slate-500 tracking-wide">
              Contract Total
            </span>
            <span
              data-testid="contract-total"
              className="text-2xl font-serif font-bold text-slate-900 mt-1 block"
            >
              {formatCentsToUsd(contract.totalAmountCents)}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              100% Client Escrow Deposit
            </span>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <span className="block text-xs uppercase font-medium text-slate-500 tracking-wide">
              Platform Fee
            </span>
            <span
              data-testid="platform-fee"
              className="text-2xl font-serif font-bold text-slate-700 mt-1 block"
            >
              {formatCentsToUsd(contract.platformFeeCents)}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Auditing, AI Telemetry & Vault
            </span>
          </div>

          <div className="bg-white p-4 rounded-lg border border-emerald-200 bg-emerald-50/20 shadow-xs">
            <span className="block text-xs uppercase font-medium text-emerald-800 tracking-wide">
              Net to Dietitian
            </span>
            <span
              data-testid="net-to-dietitian"
              className="text-2xl font-serif font-bold text-emerald-700 mt-1 block"
            >
              {formatCentsToUsd(contract.netAmountCents)}
            </span>
            <span className="text-[11px] text-emerald-600 mt-0.5 block">
              Clinician Payout Amount
            </span>
          </div>
        </div>
      </div>

      {/* Individual Deliverable Milestones if present */}
      {contract.milestones && contract.milestones.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Deliverable Milestones
          </h3>
          <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 overflow-hidden">
            {contract.milestones.map((m, i) => (
              <div
                key={m.id || i}
                className="flex items-center justify-between px-4 py-3 bg-white text-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-slate-400">
                    #{i + 1}
                  </span>
                  <div>
                    <span className="font-medium text-slate-800">{m.title}</span>
                    {m.completedAt && (
                      <span className="text-xs text-slate-400 block">
                        Completed on {m.completedAt}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-semibold text-slate-900 block">
                    {formatCentsToUsd(m.amountCents)}
                  </span>
                  <span className="text-[10px] uppercase font-semibold text-slate-400">
                    {m.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
        <span className="text-xs text-slate-400">
          Dispute window active until security clearing completion.
        </span>

        <div className="flex items-center gap-2">
          {onDisputeClick && (
            <button
              type="button"
              onClick={onDisputeClick}
              className="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
            >
              File a Dispute
            </button>
          )}

          {currentStatus === "SECURITY_CLEARING" && onApproveRelease && (
            <button
              type="button"
              onClick={onApproveRelease}
              className="px-4 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors shadow-xs"
            >
              Early Release Payout
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
