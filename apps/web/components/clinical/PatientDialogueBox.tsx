"use client";

import * as React from "react";
import { User, Activity } from "lucide-react";

export interface PatientDialogueBoxProps {
  message: string;
  patientName?: string;
  demographics?: string;
  chiefComplaint?: string;
  timestamp?: string;
  isLoading?: boolean;
  className?: string;
}

/**
 * PatientDialogueBox
 * 
 * Displays the AI-generated patient dialogue on the LEFT side of the clinical simulation.
 * Clinical styling: Slate card, font-mono text-sm, slate-700 typography.
 */
export function PatientDialogueBox({
  message,
  patientName = "Virtual Patient (Llama 3.1 Clinical)",
  demographics,
  chiefComplaint,
  timestamp,
  isLoading = false,
  className = "",
}: PatientDialogueBoxProps) {
  return (
    <div
      data-testid="patient-dialogue-box"
      data-alignment="left"
      className={[
        "self-start mr-auto w-full max-w-2xl",
        "bg-slate-100 border border-slate-200 rounded-lg p-5 shadow-xs text-left",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-7 h-7 rounded bg-slate-200 text-slate-700">
            <User className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700 font-mono tracking-tight uppercase">
                {patientName}
              </span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Active Patient" />
            </div>
            {demographics && (
              <span className="text-xs text-slate-500 block">
                {demographics}
              </span>
            )}
          </div>
        </div>

        {timestamp && (
          <span className="text-xs font-mono text-slate-400">
            {timestamp}
          </span>
        )}
      </div>

      {chiefComplaint && (
        <div className="mb-3 px-3 py-1.5 bg-slate-200/60 rounded text-xs text-slate-600 font-sans flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-slate-500" />
          <span>
            <strong className="font-medium text-slate-700">Presenting Labs / History:</strong> {chiefComplaint}
          </span>
        </div>
      )}

      <div className="text-slate-700 font-mono text-sm leading-relaxed whitespace-pre-wrap">
        {isLoading ? (
          <div className="flex items-center gap-2 text-slate-400 italic">
            <span className="inline-block animate-pulse">Patient is answering clinical questions...</span>
          </div>
        ) : (
          <p data-testid="patient-message-content">{message}</p>
        )}
      </div>
    </div>
  );
}
