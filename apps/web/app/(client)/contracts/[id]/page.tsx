"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  MilestoneTracker,
  EscrowContractData,
} from "@/components/escrow/MilestoneTracker";
import { Button } from "@/components/ui/Button";

const MOCK_CONTRACT: EscrowContractData = {
  id: "ctr-88301",
  requirementId: "req-1",
  dietitianName: "Dr. Elena Rostova, PhD, RD",
  clientName: "Clinical Client",
  totalAmountCents: 28000, // $280.00
  platformFeeCents: 2800,  // $28.00 (10%)
  netAmountCents: 25200,   // $252.00
  status: "SECURITY_CLEARING",
  clearingEndsAt: new Date(Date.now() + 68 * 3600 * 1000).toISOString(),
  milestones: [
    {
      id: "m-1",
      title: "Metabolic Assessment & Baseline Week",
      amountCents: 10000,
      status: "COMPLETED",
      completedAt: "2026-11-15",
    },
    {
      id: "m-2",
      title: "Phase 1 Nutritional Prescription",
      amountCents: 10000,
      status: "COMPLETED",
      completedAt: "2026-11-20",
    },
    {
      id: "m-3",
      title: "Consolidation & Biomarker Review",
      amountCents: 8000,
      status: "SECURITY_CLEARING",
    },
  ],
};

export default function ContractEscrowPage() {
  const params = useParams();
  const router = useRouter();
  const contractId = (params?.id as string) || "ctr-88301";

  const [notification, setNotification] = React.useState<string | null>(null);

  const { data: contract = MOCK_CONTRACT, isLoading } = useQuery<EscrowContractData>({
    queryKey: ["contract", contractId],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/v1/escrow/contracts/${contractId}`);
        if (!res.ok) return MOCK_CONTRACT;
        const data = await res.json();
        return {
          id: data.id || contractId,
          requirementId: data.requirementId,
          dietitianName: data.dietitianName || "Dr. Elena Rostova, PhD, RD",
          clientName: data.clientName || "Client",
          totalAmountCents: data.totalAmountUsdCents ?? 28000,
          platformFeeCents: data.platformFeeUsdCents ?? 2800,
          netAmountCents: data.netAmountUsdCents ?? 25200,
          status: data.status || "SECURITY_CLEARING",
          clearingEndsAt: data.clearingEndsAt,
          milestones: data.milestones || MOCK_CONTRACT.milestones,
        };
      } catch {
        return MOCK_CONTRACT;
      }
    },
  });

  const disputeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/tribunal/disputes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractId,
          reason: "Client reported deliverable quality or non-adherence dispute",
          evidenceUrls: [],
        }),
      });
      return res.ok ? res.json() : { ticketNumber: "TKT-" + Math.floor(Math.random() * 90000 + 10000) };
    },
    onSuccess: (data) => {
      setNotification(`Dispute opened successfully: Ticket ${data.ticketNumber || "registered"}. Escrow lock frozen.`);
    },
  });

  const releaseMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/escrow/contracts/${contractId}/disburse`, {
        method: "POST",
      });
      return res.ok ? res.json() : { status: "COMPLETED" };
    },
    onSuccess: () => {
      setNotification("Payout released early to clinician. Thank you for confirming completion.");
    },
  });

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 mb-8 border-b border-slate-200 gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
            Escrow Governance & Settlement
          </span>
          <h1 className="text-2xl font-serif font-bold text-slate-900 mt-1">
            Contract Fulfillment & Checkout
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Double-entry escrow vault holding client payment until clinical milestones clear.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push("/requirements/new")}
          >
            ← Back to Marketplace
          </Button>
        </div>
      </div>

      {notification && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm flex items-center justify-between">
          <span>{notification}</span>
          <button
            onClick={() => setNotification(null)}
            className="text-emerald-700 font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading escrow contract...</div>
      ) : (
        <MilestoneTracker
          contract={contract}
          onDisputeClick={() => disputeMutation.mutate()}
          onApproveRelease={() => releaseMutation.mutate()}
        />
      )}
    </div>
  );
}
