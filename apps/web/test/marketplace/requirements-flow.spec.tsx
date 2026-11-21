import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ClientIntakePage from "@/app/(client)/requirements/new/page";
import { ProposalCard, ProposalItem } from "@/components/marketplace/ProposalCard";
import {
  MilestoneTracker,
  EscrowContractData,
} from "@/components/escrow/MilestoneTracker";
import { AllergenType, DietitianLevel } from "@diety/types";
import { useIntakeStore } from "@/stores/intake.store";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useParams: () => ({
    id: "req-1",
  }),
}));

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe("Task 5.2: Client Marketplace & Escrow Flow", () => {
  beforeEach(() => {
    useIntakeStore.getState().reset();
  });

  describe("Task 5.2.1: Multi-step Client Intake Form", () => {
    it("renders allergen chip input on Step 1", () => {
      renderWithQuery(<ClientIntakePage />);

      // Verify page renders Step 1
      expect(screen.getByText(/biometric & health baseline/i)).toBeDefined();

      // Verify allergen chip container and chips render
      const allergenChips = screen.getAllByTestId("allergen-chip");
      expect(allergenChips.length).toBeGreaterThan(0);

      // Verify specific allergen chips exist
      const dairyChip = screen.getByRole("button", { name: /\+ Dairy \/ Milk/i });
      expect(dairyChip).toBeDefined();

      const glutenChip = screen.getByRole("button", { name: /\+ Gluten/i });
      expect(glutenChip).toBeDefined();

      const peanutChip = screen.getByRole("button", { name: /\+ Peanuts/i });
      expect(peanutChip).toBeDefined();
    });

    it("toggles allergen selection when chip is clicked", () => {
      renderWithQuery(<ClientIntakePage />);

      const peanutChip = screen.getByRole("button", { name: /\+ Peanuts/i });
      fireEvent.click(peanutChip);

      // Store should now have PEANUTS allergen
      expect(useIntakeStore.getState().healthMetrics.allergens).toContain(
        AllergenType.PEANUTS
      );

      // Chip text changes to selected indicator
      expect(screen.getByRole("button", { name: /✕ Peanuts/i })).toBeDefined();

      // Clicking again unselects
      fireEvent.click(screen.getByRole("button", { name: /✕ Peanuts/i }));
      expect(useIntakeStore.getState().healthMetrics.allergens).not.toContain(
        AllergenType.PEANUTS
      );
    });

    it("allows navigating through steps in the intake store", () => {
      // Set step to 2 in store
      useIntakeStore.getState().setStep(2);
      const { unmount } = renderWithQuery(<ClientIntakePage />);

      expect(screen.getByText(/nutritional targets & timeline/i)).toBeDefined();
      expect(screen.getByText(/daily caloric target/i)).toBeDefined();
      expect(screen.getByText(/target macronutrient ratio split/i)).toBeDefined();

      unmount();

      // Set step to 3 in store
      useIntakeStore.getState().setStep(3);
      renderWithQuery(<ClientIntakePage />);

      expect(screen.getByText(/review clinical intake summary/i)).toBeDefined();
      expect(screen.getByRole("button", { name: /confirm & post requirement/i })).toBeDefined();
    });
  });

  describe("Task 5.2.2: Proposal Comparison Dashboard & ProposalCard", () => {
    const mockProposal: ProposalItem = {
      id: "prop-test-1",
      requirementId: "req-1",
      dietitianId: "dietitian-test-1",
      dietitianName: "Dr. Elena Rostova",
      tier: DietitianLevel.PLATINUM,
      ratingScore: 4.9,
      totalReviews: 84,
      proposedAmountCents: 28000, // $280.00
      deliveryDate: "Estimated 4 weeks",
      proposalText:
        "Evidence-based clinical protocol targeting metabolic health.",
    };

    it("renders tier badge and rating on ProposalCard", () => {
      const handleAccept = vi.fn();
      render(<ProposalCard proposal={mockProposal} onAccept={handleAccept} />);

      // 1. Verify Dietitian name renders
      expect(screen.getByText("Dr. Elena Rostova")).toBeDefined();

      // 2. Verify tier badge renders with correct Platinum tier
      const tierBadge = screen.getByTestId("tier-badge");
      expect(tierBadge).toBeDefined();
      expect(tierBadge.textContent).toContain("Platinum");

      // 3. Verify rating score renders 4.9
      const starRating = screen.getByTestId("star-rating");
      expect(starRating).toBeDefined();
      expect(starRating.textContent).toContain("4.9");
      expect(starRating.textContent).toContain("84 clinical reviews");

      // 4. Verify formatted proposed price
      const priceElement = screen.getByTestId("proposal-price");
      expect(priceElement.textContent).toBe("$280.00");
    });

    it("triggers onAccept with proposal ID when CTA clicked", () => {
      const handleAccept = vi.fn();
      render(<ProposalCard proposal={mockProposal} onAccept={handleAccept} />);

      const acceptButton = screen.getByRole("button", {
        name: /accept proposal/i,
      });
      fireEvent.click(acceptButton);

      expect(handleAccept).toHaveBeenCalledTimes(1);
      expect(handleAccept).toHaveBeenCalledWith("prop-test-1");
    });
  });

  describe("Task 5.2.3: Escrow Checkout & MilestoneTracker", () => {
    const mockContract: EscrowContractData = {
      id: "ctr-test-99",
      dietitianName: "Dr. Elena Rostova, PhD, RD",
      totalAmountCents: 25000, // $250.00
      platformFeeCents: 2500,  // $25.00
      netAmountCents: 22500,   // $225.00
      status: "SECURITY_CLEARING",
      clearingEndsAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    };

    it("shows correct price breakdown from cent values", () => {
      render(<MilestoneTracker contract={mockContract} />);

      // 1. Total amount ($25000 cents -> $250.00)
      const totalEl = screen.getByTestId("contract-total");
      expect(totalEl.textContent).toBe("$250.00");

      // 2. Platform fee ($2500 cents -> $25.00)
      const feeEl = screen.getByTestId("platform-fee");
      expect(feeEl.textContent).toBe("$25.00");

      // 3. Net to dietitian ($22500 cents -> $225.00)
      const netEl = screen.getByTestId("net-to-dietitian");
      expect(netEl.textContent).toBe("$225.00");
    });

    it("renders milestone lifecycle status and security clearing countdown", () => {
      render(<MilestoneTracker contract={mockContract} />);

      // Status badge should indicate Security Clearing
      const statusBadge = screen.getByTestId("milestone-status");
      expect(statusBadge.textContent).toContain("Security Clearing");

      // Clearing countdown section should be displayed
      const countdownSection = screen.getByTestId("clearing-countdown");
      expect(countdownSection).toBeDefined();
      expect(countdownSection.textContent).toContain(
        "72h Security Clearing Period Active"
      );
    });
  });
});
