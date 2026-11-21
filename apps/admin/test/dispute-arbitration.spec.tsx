import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import DisputeTribunalCourtPage from "@/app/disputes/[caseId]/page";
import { EvidenceViewer, EvidenceDocument } from "@/components/tribunal/EvidenceViewer";

beforeEach(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

describe("Dispute Tribunal Court & Evidence Review", () => {
  it("renders dispute docket header with caseId, contractId, and escrow total in dollars", () => {
    render(<DisputeTribunalCourtPage params={{ caseId: "DISP-8841" }} />);

    expect(screen.getByTestId("docket-id").textContent).toContain("Docket: DISP-8841");
    expect(screen.getByTestId("contract-id").textContent).toContain("Contract #CTR-7728");
    expect(screen.getByTestId("escrow-total-dollars").textContent).toBe("$1850.00");
    expect(screen.getByTestId("dispute-status-badge").textContent).toBe("UNDER_REVIEW");
  });

  it("renders split-screen review with client claim and dietitian defense", () => {
    render(<DisputeTribunalCourtPage params={{ caseId: "DISP-8841" }} />);

    expect(screen.getByTestId("client-claim-pane")).toBeDefined();
    expect(screen.getByTestId("dietitian-defense-pane")).toBeDefined();

    // Check client claim text
    expect(screen.getByTestId("client-statement").textContent).toContain(
      "contra-indicated high-potassium ingredients"
    );
    expect(screen.getByTestId("contract-expectations").textContent).toContain(
      "Agreed 4-week medical nutrition therapy (MNT)"
    );

    // Check dietitian defense proofs
    expect(screen.getByTestId("attendance-proof").textContent).toContain(
      "42 minutes verified via WebRTC peer signaling session"
    );
    expect(screen.getByTestId("delivery-timestamp").textContent).toContain(
      "2026-11-19 14:22:00 UTC"
    );
  });

  it("renders EvidenceViewer component and supports expanding high-resolution view", () => {
    const mockEvidence: EvidenceDocument[] = [
      {
        id: "DOC-01",
        title: "Test Bloodwork Exhibit",
        description: "Renal panel laboratory report",
        url: "/test-bloodwork.pdf",
        fileType: "pdf",
        uploaderRole: "CLIENT",
        timestamp: "2026-11-20 18:30 UTC",
        fileSizeFormatted: "1.2 MB",
      },
    ];

    render(<EvidenceViewer documents={mockEvidence} title="Test Evidence" />);

    expect(screen.getByText("Test Bloodwork Exhibit")).toBeDefined();
    expect(screen.getByText("CLIENT EXHIBIT")).toBeDefined();

    // Click expand button to open high-res modal
    const expandBtn = screen.getByTestId("expand-evidence-DOC-01");
    fireEvent.click(expandBtn);

    expect(screen.getByTestId("high-res-modal")).toBeDefined();
    expect(screen.getByText("PDF Document Preview")).toBeDefined();

    // Close high-res modal
    const closeBtn = screen.getByTestId("close-high-res-modal");
    fireEvent.click(closeBtn);
    expect(screen.queryByTestId("high-res-modal")).toBeNull();
  });
});

describe("Arbitration Escrow Calculation & Floating Point Drift Check", () => {
  it("updates client and dietitian payout sums across various slider ratios without floating point drift", () => {
    render(<DisputeTribunalCourtPage params={{ caseId: "DISP-8841" }} />);

    const slider = screen.getByTestId("escrow-slider") as HTMLInputElement;
    const clientDisplay = screen.getByTestId("client-refund-amount");
    const dietitianDisplay = screen.getByTestId("dietitian-payout-amount");

    // Total escrow is 185000 cents ($1850.00)
    const testRatios = [
      { slider: 0, clientUsd: "$0.00", dietitianUsd: "$1850.00", clientCents: 0, dietitianCents: 185000 },
      { slider: 25, clientUsd: "$462.50", dietitianUsd: "$1387.50", clientCents: 46250, dietitianCents: 138750 },
      { slider: 33, clientUsd: "$610.50", dietitianUsd: "$1239.50", clientCents: 61050, dietitianCents: 123950 },
      { slider: 50, clientUsd: "$925.00", dietitianUsd: "$925.00", clientCents: 92500, dietitianCents: 92500 },
      { slider: 75, clientUsd: "$1387.50", dietitianUsd: "$462.50", clientCents: 138750, dietitianCents: 46250 },
      { slider: 100, clientUsd: "$1850.00", dietitianUsd: "$0.00", clientCents: 185000, dietitianCents: 0 },
    ];

    for (const ratio of testRatios) {
      fireEvent.change(slider, { target: { value: String(ratio.slider) } });

      expect(clientDisplay.textContent).toBe(ratio.clientUsd);
      expect(dietitianDisplay.textContent).toBe(ratio.dietitianUsd);

      // Verify exact sum equals total escrow with zero drift down to the penny
      const parsedClient = parseFloat(clientDisplay.textContent!.replace("$", ""));
      const parsedDietitian = parseFloat(dietitianDisplay.textContent!.replace("$", ""));
      const exactSum = Math.round((parsedClient + parsedDietitian) * 100);
      expect(exactSum).toBe(185000);
    }
  });

  it("calculates odd penny values without floating point precision issues", () => {
    // Escrow: $1,850.00 (185000 cents). At 37%:
    // client = round(185000 * 37 / 100) = round(68450) = 68450 -> $684.50
    // dietitian = 185000 - 68450 = 116550 -> $1165.50
    render(<DisputeTribunalCourtPage params={{ caseId: "DISP-8841" }} />);

    const slider = screen.getByTestId("escrow-slider") as HTMLInputElement;
    fireEvent.change(slider, { target: { value: "37" } });

    const clientDisplay = screen.getByTestId("client-refund-amount");
    const dietitianDisplay = screen.getByTestId("dietitian-payout-amount");

    expect(clientDisplay.textContent).toBe("$684.50");
    expect(dietitianDisplay.textContent).toBe("$1165.50");

    const clientVal = parseFloat(clientDisplay.textContent!.replace("$", ""));
    const dietitianVal = parseFloat(dietitianDisplay.textContent!.replace("$", ""));
    expect(clientVal + dietitianVal).toBeCloseTo(1850.0, 2);
  });
});

describe("Disciplinary Strike Action", () => {
  it("displays automatic tier demotion warning banner when issuing Strike 2 or 3", () => {
    render(<DisputeTribunalCourtPage params={{ caseId: "DISP-8841" }} />);

    // Initially strike is unchecked, warning banner should not be present
    expect(screen.queryByTestId("strike-warning-banner")).toBeNull();

    // Check the strike checkbox
    const strikeCheckbox = screen.getByTestId("strike-checkbox") as HTMLInputElement;
    fireEvent.click(strikeCheckbox);

    // Respondent had 1 strike. Issuing brings it to Strike 2, triggering warning
    const warningBanner = screen.getByTestId("strike-warning-banner");
    expect(warningBanner).toBeDefined();
    expect(warningBanner.textContent).toContain(
      "Warning: Strike 2/3 triggers immediate automatic tier demotion to New Dietitian."
    );

    // Uncheck strike checkbox
    fireEvent.click(strikeCheckbox);
    expect(screen.queryByTestId("strike-warning-banner")).toBeNull();
  });
});

describe("Mandatory Arbitrator Justification & Ruling Submission", () => {
  it("enforces minimum 20 characters requirement for arbitrator justification before submission", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ status: "RESOLVED" }),
    } as Response);

    render(<DisputeTribunalCourtPage params={{ caseId: "DISP-8841" }} />);

    const submitBtn = screen.getByTestId("issue-ruling-btn") as HTMLButtonElement;
    const textarea = screen.getByTestId("justification-textarea") as HTMLTextAreaElement;
    const charCounter = screen.getByTestId("character-count");

    // 1. Initially empty: button must be disabled
    expect(submitBtn.disabled).toBe(true);
    expect(charCounter.textContent).toContain("0 / 20 characters minimum");

    // 2. Type 10 characters (fewer than 20): button must still be disabled
    fireEvent.change(textarea, { target: { value: "Short note" } });
    expect(submitBtn.disabled).toBe(true);
    expect(charCounter.textContent).toContain("10 / 20 characters minimum");
    expect(screen.getByTestId("justification-error")).toBeDefined();

    // 3. Type 25 characters (>= 20 characters): button must become enabled
    fireEvent.change(textarea, {
      target: {
        value: "Clinical non-performance substantiated with allergen violation.",
      },
    });
    expect(submitBtn.disabled).toBe(false);
    expect(charCounter.textContent).toContain("63 / 20 characters minimum");
    expect(screen.queryByTestId("justification-error")).toBeNull();

    // 4. Click Submit Ruling
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/v1/admin/disputes/DISP-8841/ruling",
        expect.objectContaining({ method: "POST" })
      );
    });

    // Confirmation banner must be displayed
    expect(screen.getByTestId("ruling-confirmation-banner")).toBeDefined();
    expect(screen.getByText("Binding Tribunal Ruling Executed")).toBeDefined();

    fetchSpy.mockRestore();
  });
});
