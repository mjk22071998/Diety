import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";

import DashboardScreen from "../app/(tabs)/index";
import ContractsScreen from "../app/(tabs)/contracts";
import ProfileScreen from "../app/(tabs)/profile";
import { useAuthStore, initialMockUser } from "../lib/auth-store";

describe("Native Mobile Tab Screens", () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: { ...initialMockUser },
      isAuthenticated: true,
      token: "mock-token",
    });
  });

  describe("DashboardScreen", () => {
    it("renders user greeting and verified practitioner status badge", () => {
      render(<DashboardScreen />);

      expect(screen.getByTestId("dashboard-screen")).toBeDefined();
      expect(screen.getByTestId("user-greeting")).toBeDefined();
      expect(screen.getByText("Hello, Alex Rivera, RD")).toBeDefined();
      expect(screen.getByTestId("active-status")).toBeDefined();
      expect(screen.getByText("Verified Practitioner")).toBeDefined();
    });

    it("renders upcoming consultation and active contracts metrics", () => {
      render(<DashboardScreen />);

      expect(screen.getByText("Next Scheduled Consultation")).toBeDefined();
      expect(screen.getByText("Metabolic & Gut Health Protocol Review")).toBeDefined();
      expect(screen.getByTestId("join-consultation-btn")).toBeDefined();
      expect(screen.getByText("Active Contracts")).toBeDefined();
      expect(screen.getByText("Plan Adherence")).toBeDefined();
    });
  });

  describe("ContractsScreen", () => {
    it("renders contracts, total escrow vault value, and milestone list", () => {
      render(<ContractsScreen />);

      expect(screen.getByTestId("contracts-screen")).toBeDefined();
      expect(screen.getByText("Contracts & Milestones")).toBeDefined();
      expect(screen.getByText("$1,350.00")).toBeDefined();
      expect(screen.getByText("Smart Escrow")).toBeDefined();

      expect(screen.getByText("CTR-8821")).toBeDefined();
      expect(screen.getByText("Targeted Gastrointestinal & FODMAP Therapy")).toBeDefined();
      expect(screen.getByText("CTR-7904")).toBeDefined();
      expect(screen.getByText("CTR-6210")).toBeDefined();
    });

    it("filters contracts by status chip", () => {
      render(<ContractsScreen />);

      // Filter by ACTIVE
      const activeFilter = screen.getByTestId("filter-chip-ACTIVE");
      fireEvent.click(activeFilter);

      expect(screen.getByText("CTR-8821")).toBeDefined();
      expect(screen.queryByText("CTR-6210")).toBeNull();
    });
  });

  describe("ProfileScreen", () => {
    it("renders practitioner credentials badge and security controls", async () => {
      await act(async () => {
        render(<ProfileScreen />);
      });

      expect(screen.getByTestId("profile-screen")).toBeDefined();
      expect(screen.getByText("Alex Rivera, RD")).toBeDefined();
      expect(screen.getByTestId("practitioner-credentials-badge")).toBeDefined();
      expect(screen.getByText("CDR Board Certified (#860124)")).toBeDefined();
      expect(screen.getByTestId("biometric-switch")).toBeDefined();
      expect(screen.getByTestId("logout-btn")).toBeDefined();
    });

    it("triggers logout when Sign Out is pressed", async () => {
      await act(async () => {
        render(<ProfileScreen />);
      });

      const logoutBtn = screen.getByTestId("logout-btn");
      await act(async () => {
        fireEvent.click(logoutBtn);
      });

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });
  });
});
