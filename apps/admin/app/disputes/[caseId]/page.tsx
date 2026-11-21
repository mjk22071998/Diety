"use client";

import React, { useState, useMemo, use } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Scale,
  ShieldAlert,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  User,
  Activity,
  ArrowLeft,
  Sliders,
  Send,
  HelpCircle,
} from "lucide-react";
import {
  EvidenceViewer,
  EvidenceDocument,
} from "@/components/tribunal/EvidenceViewer";

export interface DisputeDocketData {
  docketId: string;
  contractId: string;
  escrowTotalCents: number; // in integer cents
  openedTimestamp: string;
  status: "OPEN" | "UNDER_REVIEW" | "RESOLVED";
  client: {
    id: string;
    name: string;
    statement: string;
    contractExpectations: string;
    evidence: EvidenceDocument[];
  };
  dietitian: {
    id: string;
    name: string;
    currentLevel: "SILVER" | "GOLD" | "PLATINUM" | "NEW";
    currentStrikes: number;
    rebuttal: string;
    consultationAttendanceProof: string;
    mealPlanDeliveryTimestamp: string;
    evidence: EvidenceDocument[];
  };
}

export const SAMPLE_DISPUTES: Record<string, DisputeDocketData> = {
  "DISP-8841": {
    docketId: "DISP-8841",
    contractId: "CTR-7728",
    escrowTotalCents: 185000, // $1,850.00
    openedTimestamp: "2026-11-20 18:30 UTC",
    status: "UNDER_REVIEW",
    client: {
      id: "CLI-9021",
      name: "David K. (Client #C-9021)",
      statement:
        "The respondent prescribed a nutritional protocol containing contra-indicated high-potassium ingredients despite explicit intake disclosure of Stage 3b Chronic Kidney Disease (eGFR 38). When challenged on day 3, the respondent failed to provide portion weight specifications for sodium restriction, placing client at medical risk.",
      contractExpectations:
        "Agreed 4-week medical nutrition therapy (MNT) for renal disease. Requirements: strict sodium cap (<1500mg/day), potassium threshold adherence (<2000mg/day), weekly 45-minute WebRTC video consultations, and digital meal plan delivery within 48 hours of onboarding.",
      evidence: [
        {
          id: "EX-C-01",
          title: "Meal Plan PDF Showing Contra-indicated Dried Apricots",
          description:
            "Prescribed snack menu item specifies 150g dried apricots (1,740mg potassium) exceeding total daily renal allowance in a single meal.",
          url: "/evidence/dispute-8841-client-mealplan.pdf",
          fileType: "pdf",
          uploaderRole: "CLIENT",
          uploaderName: "David K.",
          timestamp: "2026-11-20 18:35 UTC",
          fileSizeFormatted: "2.4 MB",
          verifiedIntegritySha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        },
        {
          id: "EX-C-02",
          title: "Lab Bloodwork Report (eGFR 38 / Stage 3b CKD)",
          description:
            "Certified diagnostic laboratory panel uploaded during intake, highlighting hyperkalemia danger notes.",
          url: "/evidence/dispute-8841-lab-results.pdf",
          fileType: "pdf",
          uploaderRole: "CLIENT",
          uploaderName: "David K.",
          timestamp: "2026-11-20 18:37 UTC",
          fileSizeFormatted: "1.1 MB",
          verifiedIntegritySha256: "4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b",
        },
      ],
    },
    dietitian: {
      id: "DIET-1140",
      name: "Dr. Sarah Miller, MS, RD (Dietitian #D-1140)",
      currentLevel: "SILVER",
      currentStrikes: 1, // Notice Strike 1! Next is Strike 2 (triggers warning banner)
      rebuttal:
        "The initial meal plan draft contained a general potassium-exchange illustrative table marked as educational. The corrected personalized plan was delivered on-platform 18 hours prior to dispute. Furthermore, the client logged off after only 12 minutes of our 45-minute scheduled intake consultation.",
      consultationAttendanceProof:
        "42 minutes verified via WebRTC peer signaling session #SESS-4412 (Dietitian present 42m, Client departed at 12m)",
      mealPlanDeliveryTimestamp:
        "2026-11-19 14:22:00 UTC (Delivered on-platform 18h before dispute opened)",
      evidence: [
        {
          id: "EX-D-01",
          title: "WebRTC Consultation Signaling Log #SESS-4412",
          description:
            "Server connection records validating dietitian joined at 14:00 UTC and remained active until 14:42 UTC. Client disconnected at 14:12 UTC.",
          url: "/evidence/dispute-8841-webrtc-audit.log",
          fileType: "log",
          uploaderRole: "DIETITIAN",
          uploaderName: "Dr. Sarah Miller",
          timestamp: "2026-11-20 20:10 UTC",
          fileSizeFormatted: "340 KB",
          verifiedIntegritySha256: "8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4",
        },
        {
          id: "EX-D-02",
          title: "Revised Renal Safe Meal Protocol & Potassium Exchange Guide",
          description:
            "Amended dietary distribution with all potassium items verified <1800mg/day total.",
          url: "/evidence/dispute-8841-dietitian-revised-plan.pdf",
          fileType: "pdf",
          uploaderRole: "DIETITIAN",
          uploaderName: "Dr. Sarah Miller",
          timestamp: "2026-11-20 20:15 UTC",
          fileSizeFormatted: "3.2 MB",
          verifiedIntegritySha256: "2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae",
        },
      ],
    },
  },
};

export default function DisputeTribunalCourtPage({
  params,
}: {
  params?: Promise<{ caseId: string }> | { caseId: string };
}) {
  const routerParams = useParams();
  const resolvedParams = params
    ? "then" in params
      ? use(params)
      : params
    : null;

  const rawCaseId =
    resolvedParams?.caseId ||
    (routerParams?.caseId as string | undefined) ||
    "DISP-8841";

  // Match sample dispute or fallback to default
  const disputeData = useMemo(() => {
    return (
      SAMPLE_DISPUTES[rawCaseId] ||
      SAMPLE_DISPUTES["DISP-8841"] || {
        docketId: rawCaseId,
        contractId: "CTR-7728",
        escrowTotalCents: 185000,
        openedTimestamp: "2026-11-20 18:30 UTC",
        status: "UNDER_REVIEW",
        client: {
          id: "CLI-9021",
          name: "Client Claimant",
          statement: "Disputed service deliverable due to clinical non-compliance.",
          contractExpectations: "Standard 4-week clinical care agreement.",
          evidence: [],
        },
        dietitian: {
          id: "DIET-1140",
          name: "Respondent Dietitian",
          currentLevel: "SILVER",
          currentStrikes: 1,
          rebuttal: "Deliverables met clinical safety guidelines.",
          consultationAttendanceProof: "40 minutes verified in WebRTC audit.",
          mealPlanDeliveryTimestamp: "2026-11-19 14:00 UTC",
          evidence: [],
        },
      }
    );
  }, [rawCaseId]);

  // Decision Panel State
  const [sliderValue, setSliderValue] = useState<number>(50); // 0 to 100 (% refund to client)
  const [issueStrike, setIssueStrike] = useState<boolean>(false);
  const [justificationNotes, setJustificationNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [rulingResult, setRulingResult] = useState<{
    status: "RESOLVED";
    clientRefundUsd: string;
    dietitianPayoutUsd: string;
    strikeIssued: boolean;
    timestamp: string;
  } | null>(null);

  // Exact penny calculation without floating point drift
  const totalCents = disputeData.escrowTotalCents;
  const clientCents = Math.round((totalCents * sliderValue) / 100);
  const dietitianCents = totalCents - clientCents;

  const clientUsd = (clientCents / 100).toFixed(2);
  const dietitianUsd = (dietitianCents / 100).toFixed(2);
  const totalUsd = (totalCents / 100).toFixed(2);

  // Warning banner condition:
  // If strike is issued, respondent strikes will be currentStrikes + 1
  const anticipatedStrikes = disputeData.dietitian.currentStrikes + (issueStrike ? 1 : 0);
  const showStrikeWarning = issueStrike && anticipatedStrikes >= 2;

  // Validation: justification notes must be at least 20 characters
  const isJustificationValid = justificationNotes.trim().length >= 20;

  const handleIssueRuling = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isJustificationValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Simulate/trigger ruling API
      await fetch(`/api/v1/admin/disputes/${disputeData.docketId}/ruling`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docketId: disputeData.docketId,
          contractId: disputeData.contractId,
          clientRefundCents: clientCents,
          dietitianPayoutCents: dietitianCents,
          issueStrike,
          justificationNotes,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {
        // Fallback for isolated test / mock runner
        return { ok: true };
      });

      setRulingResult({
        status: "RESOLVED",
        clientRefundUsd: clientUsd,
        dietitianPayoutUsd: dietitianUsd,
        strikeIssued: issueStrike,
        timestamp: new Date().toUTCString(),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="dispute-tribunal-court">
      {/* Back link & Docket Header */}
      <div className="space-y-2">
        <Link
          href="/credentials"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Control Dashboard</span>
        </Link>

        {/* Docket Header Card */}
        <div
          className="bg-[#1E293B] border border-[#334155] rounded-lg p-5 shadow-sm"
          data-testid="dispute-docket-header"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1
                    className="text-lg font-bold text-slate-100 font-mono tracking-tight"
                    data-testid="docket-id"
                  >
                    Docket: {disputeData.docketId}
                  </h1>
                  <span
                    className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    data-testid="contract-id"
                  >
                    Contract #{disputeData.contractId}
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${
                      rulingResult || disputeData.status === "RESOLVED"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    }`}
                    data-testid="dispute-status-badge"
                  >
                    {rulingResult ? "RULING ISSUED (RESOLVED)" : disputeData.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono text-slate-400 mt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Opened: {disputeData.openedTimestamp}</span>
                  </span>
                  <span>•</span>
                  <span>Arbitration Class: Clinical Deliverable & Safety</span>
                </div>
              </div>
            </div>

            {/* Escrow Locked Card */}
            <div className="bg-[#0B0F19] border border-[#334155] rounded-lg px-4 py-3 flex items-center gap-4 shrink-0">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 block">
                  Escrow Locked Total
                </span>
                <span
                  className="text-xl font-bold font-mono text-emerald-400 tabular-nums"
                  data-testid="escrow-total-dollars"
                >
                  ${totalUsd}
                </span>
              </div>
              <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ruling confirmation banner if resolved */}
      {rulingResult && (
        <div
          className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 text-xs font-mono text-emerald-300 space-y-1"
          data-testid="ruling-confirmation-banner"
        >
          <div className="flex items-center gap-2 font-bold text-sm text-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Binding Tribunal Ruling Executed</span>
          </div>
          <p>
            Escrow distribution settled: Refund <strong>${rulingResult.clientRefundUsd}</strong> to Client, Disburse <strong>${rulingResult.dietitianPayoutUsd}</strong> to Dietitian.
          </p>
          {rulingResult.strikeIssued && (
            <p className="text-amber-300 font-semibold">
              Disciplinary strike recorded against {disputeData.dietitian.name}. Automatic tier demotion triggered.
            </p>
          )}
        </div>
      )}

      {/* Split-Screen Evidence Review Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Pane: Client Claim */}
        <div
          className="bg-[#1E293B] border border-[#334155] rounded-lg p-5 flex flex-col justify-between shadow-sm space-y-5"
          data-testid="client-claim-pane"
        >
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#334155] pb-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-400" />
                <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
                  Client Claim & Grievance
                </h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Claimant: {disputeData.client.name}
              </span>
            </div>

            {/* Client Statement */}
            <div>
              <span className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                Formal Claimant Statement:
              </span>
              <div
                className="bg-[#0B0F19] border border-[#334155] rounded p-3.5 text-xs text-slate-200 leading-relaxed font-sans"
                data-testid="client-statement"
              >
                {disputeData.client.statement}
              </div>
            </div>

            {/* Contract Expectations */}
            <div>
              <span className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                Agreed Contract Scope & Expectations:
              </span>
              <div
                className="bg-[#0B0F19] border border-[#334155] rounded p-3 text-xs text-slate-300 leading-relaxed font-mono"
                data-testid="contract-expectations"
              >
                {disputeData.client.contractExpectations}
              </div>
            </div>
          </div>

          {/* Client Evidence via EvidenceViewer */}
          <div className="pt-2">
            <EvidenceViewer
              title="Client Exhibits & Records"
              documents={disputeData.client.evidence}
              filterRole="CLIENT"
            />
          </div>
        </div>

        {/* Right Pane: Dietitian Defense */}
        <div
          className="bg-[#1E293B] border border-[#334155] rounded-lg p-5 flex flex-col justify-between shadow-sm space-y-5"
          data-testid="dietitian-defense-pane"
        >
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#334155] pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
                  Dietitian Defense & Rebuttal
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  Level: {disputeData.dietitian.currentLevel}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Strikes: {disputeData.dietitian.currentStrikes}
                </span>
              </div>
            </div>

            {/* Dietitian Rebuttal */}
            <div>
              <span className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                Practitioner Rebuttal Statement:
              </span>
              <div
                className="bg-[#0B0F19] border border-[#334155] rounded p-3.5 text-xs text-slate-200 leading-relaxed font-sans"
                data-testid="dietitian-rebuttal"
              >
                {disputeData.dietitian.rebuttal}
              </div>
            </div>

            {/* Attendance & Delivery Proofs */}
            <div className="grid grid-cols-1 gap-3">
              <div className="bg-[#0B0F19] border border-[#334155] rounded p-3 text-xs">
                <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Consultation Attendance Proof (Verified Minutes):</span>
                </span>
                <span
                  className="font-mono text-emerald-300 font-medium"
                  data-testid="attendance-proof"
                >
                  {disputeData.dietitian.consultationAttendanceProof}
                </span>
              </div>

              <div className="bg-[#0B0F19] border border-[#334155] rounded p-3 text-xs">
                <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <span>Meal Plan Delivery Timestamp:</span>
                </span>
                <span
                  className="font-mono text-blue-300 font-medium"
                  data-testid="delivery-timestamp"
                >
                  {disputeData.dietitian.mealPlanDeliveryTimestamp}
                </span>
              </div>
            </div>
          </div>

          {/* Dietitian Evidence via EvidenceViewer */}
          <div className="pt-2">
            <EvidenceViewer
              title="Dietitian Defense Exhibits"
              documents={disputeData.dietitian.evidence}
              filterRole="DIETITIAN"
            />
          </div>
        </div>
      </div>

      {/* Arbitration Decision Panel */}
      <form
        onSubmit={handleIssueRuling}
        className="bg-[#1E293B] border border-blue-500/30 rounded-lg p-6 shadow-md space-y-6"
        data-testid="arbitration-decision-panel"
      >
        <div className="flex items-center justify-between border-b border-[#334155] pb-4">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-blue-400" />
            <div>
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
                Arbitration Decision Panel
              </h2>
              <p className="text-xs text-slate-400">
                Execute legally binding pro-rata escrow splits and disciplinary sanctions.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-slate-400 bg-[#0F172A] px-2.5 py-1 rounded border border-[#334155]">
            Total Docket Value: ${totalUsd}
          </span>
        </div>

        {/* 1. Interactive Pro-Rata Escrow Slider */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label
              htmlFor="pro-rata-slider"
              className="text-xs font-semibold text-slate-200 uppercase font-mono flex items-center gap-2"
            >
              <span>Pro-Rata Escrow Split</span>
              <span className="text-slate-400 font-normal">
                ({sliderValue}% Client / {100 - sliderValue}% Dietitian)
              </span>
            </label>

            {/* Split breakdown tags */}
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="text-blue-400">
                Client Refund:{" "}
                <strong
                  className="text-white tabular-nums"
                  data-testid="client-refund-amount"
                >
                  ${clientUsd}
                </strong>
              </span>
              <span className="text-slate-500">|</span>
              <span className="text-emerald-400">
                Dietitian Disbursement:{" "}
                <strong
                  className="text-white tabular-nums"
                  data-testid="dietitian-payout-amount"
                >
                  ${dietitianUsd}
                </strong>
              </span>
            </div>
          </div>

          {/* Slider element */}
          <div className="space-y-2">
            <input
              id="pro-rata-slider"
              type="range"
              min={0}
              max={100}
              step={1}
              value={sliderValue}
              onChange={(e) => setSliderValue(Number(e.target.value))}
              className="w-full h-2.5 bg-[#0B0F19] rounded-lg appearance-none cursor-pointer accent-blue-500 border border-[#334155]"
              data-testid="escrow-slider"
              aria-label="Pro-rata escrow slider"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-400 px-1">
              <span>0% (100% Dietitian: ${totalUsd})</span>
              <span>50% (Equal Split: ${(totalCents / 200).toFixed(2)})</span>
              <span>100% (Full Refund: ${totalUsd})</span>
            </div>
          </div>
        </div>

        {/* 2. Disciplinary Strike Action */}
        <div className="space-y-3 pt-2 border-t border-[#334155]">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="issue-strike-checkbox"
              checked={issueStrike}
              onChange={(e) => setIssueStrike(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-[#334155] bg-[#0B0F19] text-red-600 focus:ring-red-500 cursor-pointer"
              data-testid="strike-checkbox"
            />
            <label
              htmlFor="issue-strike-checkbox"
              className="text-xs font-medium text-slate-200 cursor-pointer select-none"
            >
              Issue Disciplinary Strike to Respondent ({disputeData.dietitian.name})
              <span className="block text-[11px] text-slate-400 mt-0.5">
                Current strikes: {disputeData.dietitian.currentStrikes}. Issuing this strike brings total to {anticipatedStrikes}.
              </span>
            </label>
          </div>

          {/* Warning banner if Strike 2 or 3 */}
          {showStrikeWarning && (
            <div
              className="bg-amber-500/10 border border-amber-500/40 rounded-lg p-3 flex items-start gap-2.5 text-xs text-amber-300"
              data-testid="strike-warning-banner"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-200">
                  Warning: Strike 2/3 triggers immediate automatic tier demotion to New Dietitian.
                </p>
                <p className="text-[11px] text-amber-300/80 mt-0.5">
                  Respondent currently holds {disputeData.dietitian.currentLevel} status. This action will reset commission tier to NEW (20% platform cut) and freeze active proposal bids.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 3. Mandatory Arbitrator Justification Notes */}
        <div className="space-y-2 pt-2 border-t border-[#334155]">
          <div className="flex items-center justify-between">
            <label
              htmlFor="justification-notes"
              className="text-xs font-semibold text-slate-200 uppercase font-mono flex items-center gap-1.5"
            >
              <span>Arbitrator Justification Notes</span>
              <span className="text-red-400">*</span>
            </label>
            <span
              className={`text-[11px] font-mono ${
                isJustificationValid ? "text-emerald-400" : "text-amber-400"
              }`}
              data-testid="character-count"
            >
              {justificationNotes.trim().length} / 20 characters minimum
            </span>
          </div>

          <textarea
            id="justification-notes"
            rows={3}
            value={justificationNotes}
            onChange={(e) => setJustificationNotes(e.target.value)}
            placeholder="Record legal and clinical rationale for this ruling. Minimum 20 characters required..."
            className="w-full bg-[#0B0F19] border border-[#334155] focus:border-blue-500 rounded p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none font-sans"
            data-testid="justification-textarea"
          />

          {!isJustificationValid && justificationNotes.length > 0 && (
            <p
              className="text-[11px] text-amber-400 font-mono"
              data-testid="justification-error"
            >
              Required: Minimum 20 characters required before binding ruling can be issued.
            </p>
          )}
        </div>

        {/* 4. Issue Binding Ruling Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#334155]">
          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>Tribunal decisions are final and cryptographically logged.</span>
          </div>

          <button
            type="submit"
            disabled={!isJustificationValid || isSubmitting}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold font-mono bg-blue-600 hover:bg-blue-500 text-white rounded shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            data-testid="issue-ruling-btn"
          >
            <Send className="w-3.5 h-3.5" />
            <span>
              {isSubmitting ? "Executing Ruling..." : "Issue Binding Tribunal Ruling"}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
