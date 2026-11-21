import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { PatientDialogueBox } from "@/components/clinical/PatientDialogueBox";
import ClinicalSimulationPage from "@/app/(dietitian)/verification/simulation/page";
import * as simulationHook from "@/hooks/useSimulation";

describe("Task 5.3: AI Clinical Simulation & Verification Portal", () => {
  describe("PatientDialogueBox Component", () => {
    it("renders patient message on left", () => {
      const testMessage = "Good morning. My eGFR dropped to 54 and HbA1c is 8.4%. What should I eat?";
      render(
        <PatientDialogueBox
          message={testMessage}
          patientName="Simulated Patient"
          demographics="46yo Male • CKD Stage 3a"
        />
      );

      const dialogueBox = screen.getByTestId("patient-dialogue-box");
      expect(dialogueBox).toBeDefined();

      // Verify left alignment
      expect(dialogueBox.getAttribute("data-alignment")).toBe("left");
      expect(dialogueBox.className).toContain("self-start");
      expect(dialogueBox.className).toContain("mr-auto");

      // Verify text content
      const content = screen.getByTestId("patient-message-content");
      expect(content.textContent).toBe(testMessage);

      // Verify clinical slate card aesthetic
      expect(dialogueBox.className).toContain("bg-slate-100");
      expect(dialogueBox.className).toContain("border-slate-200");
    });
  });

  describe("Turn Counter & Remaining Turns", () => {
    it("Turn counter shows correct remaining turns when < 5 turns (amber badge)", () => {
      // Mock useSimulation hook to return turn 3 (2 remaining of 5 min)
      vi.spyOn(simulationHook, "useSimulation").mockReturnValue({
        currentTurn: 3,
        totalTurns: 10,
        minTurns: 5,
        turnsRemaining: 2,
        isMinTurnsMet: false,
        timerSeconds: 125,
        formattedTime: "02:05",
        messages: [
          {
            id: "msg-0",
            role: "patient",
            content: "Patient initial message",
            timestamp: "00:00",
          },
        ],
        latestPatientMessage: "Patient initial message",
        isSubmitting: false,
        error: null,
        rubricResult: null,
        turnBadgeText: "Turn 3 of 10 minimum",
        isTurnBadgeAmber: true,
        submitTurn: vi.fn(),
        finalizeExam: vi.fn(),
        resetSimulation: vi.fn(),
      });

      render(<ClinicalSimulationPage />);

      // Verify turn counter badge
      const badge = screen.getByTestId("turn-counter-badge");
      expect(badge.textContent).toContain("Turn 3 of 10 minimum");
      expect(badge.className).toContain("bg-amber-50");
      expect(badge.className).toContain("text-amber-800");

      // Verify remaining turns indicator
      const indicator = screen.getByTestId("min-turns-indicator");
      expect(indicator.textContent).toContain("2 turns remaining to meet minimum");
    });

    it("Turn counter shows correct remaining turns when >= 5 turns (green badge)", () => {
      // Mock useSimulation hook to return turn 6 (0 remaining of 5 min)
      vi.spyOn(simulationHook, "useSimulation").mockReturnValue({
        currentTurn: 6,
        totalTurns: 10,
        minTurns: 5,
        turnsRemaining: 0,
        isMinTurnsMet: true,
        timerSeconds: 310,
        formattedTime: "05:10",
        messages: [
          {
            id: "msg-0",
            role: "patient",
            content: "Patient message",
            timestamp: "00:00",
          },
        ],
        latestPatientMessage: "Patient message",
        isSubmitting: false,
        error: null,
        rubricResult: null,
        turnBadgeText: "Turn 6 of 10 minimum",
        isTurnBadgeAmber: false,
        submitTurn: vi.fn(),
        finalizeExam: vi.fn(),
        resetSimulation: vi.fn(),
      });

      render(<ClinicalSimulationPage />);

      const badge = screen.getByTestId("turn-counter-badge");
      expect(badge.textContent).toContain("Turn 6 of 10 minimum");
      expect(badge.className).toContain("bg-emerald-50");
      expect(badge.className).toContain("text-emerald-800");

      const indicator = screen.getByTestId("min-turns-indicator");
      expect(indicator.textContent).toContain("Minimum turns fulfilled (≥ 5 turns)");
    });
  });

  describe("Rubric Result Breakdown", () => {
    it("Rubric result displays clinical score percentage", () => {
      const mockRubric = {
        scorePercent: 92,
        allergenViolationsCount: 0,
        clinicalFeedback:
          "Excellent clinical reasoning. Strictly respected the CKD stage 3a protein restrictions and zero peanut/shellfish contamination.",
        isApprovedForBidding: true,
      };

      vi.spyOn(simulationHook, "useSimulation").mockReturnValue({
        currentTurn: 6,
        totalTurns: 10,
        minTurns: 5,
        turnsRemaining: 0,
        isMinTurnsMet: true,
        timerSeconds: 420,
        formattedTime: "07:00",
        messages: [],
        latestPatientMessage: "",
        isSubmitting: false,
        error: null,
        rubricResult: mockRubric,
        turnBadgeText: "Turn 6 of 10 minimum",
        isTurnBadgeAmber: false,
        submitTurn: vi.fn(),
        finalizeExam: vi.fn(),
        resetSimulation: vi.fn(),
      });

      render(<ClinicalSimulationPage />);

      // Verify rubric result card is displayed
      const rubricCard = screen.getByTestId("rubric-result-card");
      expect(rubricCard).toBeDefined();

      // Test: Rubric result displays clinical score percentage
      const scoreElement = screen.getByTestId("clinical-score-percent");
      expect(scoreElement.textContent).toBe("92%");

      // Also verify allergen violations count and notes
      const allergenElement = screen.getByTestId("allergen-violations-count");
      expect(allergenElement.textContent).toBe("0");

      const notesElement = screen.getByTestId("evaluator-notes");
      expect(notesElement.textContent).toContain("zero peanut/shellfish contamination");
    });
  });
});
