"use client";

import * as React from "react";
import { Badge, BadgeTier } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DietitianLevel } from "@diety/types";

export interface ProposalItem {
  id: string;
  requirementId: string;
  dietitianId: string;
  dietitianName: string;
  tier: DietitianLevel | "NEW" | "SILVER" | "GOLD" | "PLATINUM" | "new" | "silver" | "gold" | "platinum";
  avatarUrl?: string;
  ratingScore: number; // 1.0 - 5.0
  totalReviews?: number;
  proposedAmountCents: number; // integer cents
  deliveryDate: string; // e.g. "2026-12-15" or "In 4 weeks"
  proposalText: string;
  milestones?: { title: string; amountCents: number; durationDays?: number }[];
}

interface ProposalCardProps {
  proposal: ProposalItem;
  onAccept: (id: string) => void;
  isAccepting?: boolean;
}

export function ProposalCard({
  proposal,
  onAccept,
  isAccepting = false,
}: ProposalCardProps) {
  const normalizedTier = (proposal.tier.toLowerCase() as BadgeTier) || "new";
  const formattedPrice = `$${(proposal.proposedAmountCents / 100).toFixed(2)}`;
  const initials = proposal.dietitianName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      data-testid="proposal-card"
      data-proposal-id={proposal.id}
      className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
    >
      <div>
        {/* Top Header: Clinician Profile & Tier */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            {proposal.avatarUrl ? (
              <img
                src={proposal.avatarUrl}
                alt={proposal.dietitianName}
                className="w-12 h-12 rounded-lg object-cover border border-slate-200"
              />
            ) : (
              <div
                data-testid="dietitian-avatar"
                className="w-12 h-12 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center font-serif font-bold text-indigo-700 text-base"
              >
                {initials}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-semibold text-slate-900 text-base">
                  {proposal.dietitianName}
                </h3>
                <span data-testid="tier-badge">
                  <Badge tier={normalizedTier} />
                </span>
              </div>

              {/* Star Rating & Reviews */}
              <div
                data-testid="star-rating"
                className="flex items-center gap-1.5 mt-1 text-xs text-slate-600"
              >
                <span className="text-amber-500 font-bold" aria-hidden="true">
                  ★
                </span>
                <span className="font-semibold text-slate-900">
                  {proposal.ratingScore.toFixed(1)}
                </span>
                {proposal.totalReviews !== undefined && (
                  <span className="text-slate-400">
                    ({proposal.totalReviews} clinical reviews)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Pricing Display */}
          <div className="text-right">
            <span className="block text-xs uppercase font-semibold text-slate-400 tracking-wider">
              Proposed Fee
            </span>
            <span
              data-testid="proposal-price"
              className="text-2xl font-serif font-bold text-slate-900 tracking-tight"
            >
              {formattedPrice}
            </span>
            <span className="block text-xs text-slate-500">
              {proposal.deliveryDate}
            </span>
          </div>
        </div>

        {/* Clinical Proposal Pitch */}
        <div className="text-sm text-slate-700 line-clamp-3 mb-4 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
          <p>{proposal.proposalText}</p>
        </div>

        {/* Milestones Preview if available */}
        {proposal.milestones && proposal.milestones.length > 0 && (
          <div className="mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
              Milestone Schedule ({proposal.milestones.length})
            </span>
            <div className="space-y-1">
              {proposal.milestones.map((m, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center text-xs text-slate-600 py-0.5"
                >
                  <span className="truncate max-w-[220px]">
                    {idx + 1}. {m.title}
                  </span>
                  <span className="font-mono text-slate-700 font-medium">
                    ${(m.amountCents / 100).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action CTA */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs text-slate-500">
          Escrow backed • 100% dispute protection
        </span>
        <Button
          variant="primary"
          size="sm"
          isLoading={isAccepting}
          onClick={() => onAccept(proposal.id)}
          className="px-4"
        >
          Accept Proposal
        </Button>
      </div>
    </div>
  );
}
