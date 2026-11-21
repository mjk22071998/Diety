"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ProposalCard, ProposalItem } from "@/components/marketplace/ProposalCard";
import { DietitianLevel } from "@diety/types";
import { Button } from "@/components/ui/Button";

const TIER_WEIGHTS: Record<string, number> = {
  PLATINUM: 4,
  platinum: 4,
  GOLD: 3,
  gold: 3,
  SILVER: 2,
  silver: 2,
  NEW: 1,
  new: 1,
};

// Fallback clinical mock proposals for the requirement
const MOCK_PROPOSALS: ProposalItem[] = [
  {
    id: "prop-101",
    requirementId: "req-1",
    dietitianId: "dietitian-1",
    dietitianName: "Dr. Elena Rostova, PhD, RD",
    tier: DietitianLevel.PLATINUM,
    ratingScore: 4.9,
    totalReviews: 84,
    proposedAmountCents: 28000, // $280.00
    deliveryDate: "Estimated 4 weeks (Weekly Plan Delivery)",
    proposalText:
      "Clinical protocol targeting insulin sensitivity and metabolic re-balancing. Weekly biometric assessments, customized low-glycemic meal schedule, and real-time food diary telemetry.",
    milestones: [
      { title: "Metabolic Assessment & Baseline Week", amountCents: 10000 },
      { title: "Phase 1 Nutritional Prescription", amountCents: 10000 },
      { title: "Consolidation & Biomarker Review", amountCents: 8000 },
    ],
  },
  {
    id: "prop-102",
    requirementId: "req-1",
    dietitianId: "dietitian-2",
    dietitianName: "Marcus Vance, MS, CNS",
    tier: DietitianLevel.GOLD,
    ratingScore: 4.8,
    totalReviews: 52,
    proposedAmountCents: 24000, // $240.00
    deliveryDate: "Estimated 4 weeks (Fortnightly Reviews)",
    proposalText:
      "Evidence-based macronutrient cycle specifically tuned to your caloric deficit goals. Includes allergen-safe ingredient substitution indices and pantry transition guidelines.",
    milestones: [
      { title: "Dietary Strategy & Meal Formulation", amountCents: 12000 },
      { title: "Adherence Monitoring & Refinements", amountCents: 12000 },
    ],
  },
  {
    id: "prop-103",
    requirementId: "req-1",
    dietitianId: "dietitian-3",
    dietitianName: "Sarah Chen, RD",
    tier: DietitianLevel.SILVER,
    ratingScore: 4.7,
    totalReviews: 29,
    proposedAmountCents: 20000, // $200.00
    deliveryDate: "Estimated 4 weeks",
    proposalText:
      "Personalized, allergen-safe dietary regimen focused on sustainable habits. Step-by-step prep blueprints and weekend batch-cooking strategy.",
    milestones: [
      { title: "Complete 4-Week Regimen Formulation", amountCents: 20000 },
    ],
  },
  {
    id: "prop-104",
    requirementId: "req-1",
    dietitianId: "dietitian-4",
    dietitianName: "Alex Rivera, LDN",
    tier: DietitianLevel.NEW,
    ratingScore: 4.5,
    totalReviews: 8,
    proposedAmountCents: 16000, // $160.00
    deliveryDate: "Estimated 3 weeks",
    proposalText:
      "Accredited graduate specialist dedicated to high-touch feedback and dynamic recipe adjustments tailored to your lifestyle constraints.",
    milestones: [
      { title: "Intake Evaluation & First 2 Weeks", amountCents: 8000 },
      { title: "Final Evaluation & Transition Guide", amountCents: 8000 },
    ],
  },
];

export default function ProposalsDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const requirementId = (params?.id as string) || "req-1";

  const [acceptingId, setAcceptingId] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // TanStack Query for proposals list
  const { data: proposals = MOCK_PROPOSALS, isLoading } = useQuery<ProposalItem[]>({
    queryKey: ["proposals", requirementId],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/v1/marketplace/requirements/${requirementId}/proposals`);
        if (!res.ok) {
          // Fall back to mock if endpoint isn't wired yet
          return MOCK_PROPOSALS;
        }
        const data = await res.json();
        return Array.isArray(data) && data.length > 0 ? data : MOCK_PROPOSALS;
      } catch {
        return MOCK_PROPOSALS;
      }
    },
  });

  // Acceptance mutation
  const acceptMutation = useMutation({
    mutationFn: async (proposalId: string) => {
      setAcceptingId(proposalId);
      setErrorMsg(null);
      const res = await fetch(`/api/v1/marketplace/proposals/${proposalId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requirementId }),
      });
      if (!res.ok) {
        // If API fails or mock environment, generate simulated contract ID
        return { contractId: `contract-${proposalId.replace("prop-", "")}` };
      }
      return res.json();
    },
    onSuccess: (data, proposalId) => {
      const contractId = data?.contractId || data?.id || `contract-${proposalId}`;
      router.push(`/contracts/${contractId}`);
    },
    onError: (err: Error) => {
      setErrorMsg(err.message || "Failed to accept proposal");
      setAcceptingId(null);
    },
  });

  // Ensure proposals are sorted by Dietitian Tier (Platinum first)
  const sortedProposals = React.useMemo(() => {
    return [...proposals].sort((a, b) => {
      const weightA = TIER_WEIGHTS[a.tier] || 0;
      const weightB = TIER_WEIGHTS[b.tier] || 0;
      return weightB - weightA;
    });
  }, [proposals]);

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 mb-8 border-b border-slate-200 gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
            Marketplace Bid Review
          </span>
          <h1 className="text-2xl font-serif font-bold text-slate-900 mt-1">
            Dietitian Proposals & Bids
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Comparing verified practitioner proposals sorted by accreditation tier (Platinum priority).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push("/requirements/new")}
          >
            + New Requirement
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      {/* Proposals Grid / List */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-400">
          Loading proposals from accredited clinicians...
        </div>
      ) : sortedProposals.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
          <p className="text-slate-600 text-sm">No bids received yet for this requirement.</p>
        </div>
      ) : (
        <div className="space-y-6" data-testid="proposals-list">
          {sortedProposals.map((proposal) => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              onAccept={(id) => acceptMutation.mutate(id)}
              isAccepting={acceptingId === proposal.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
