import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import {
  StatCards,
  formatCentsToUsd,
  DEFAULT_PLATFORM_METRICS,
} from "@/components/dashboard/StatCards";
import { TriageAlertsTable } from "@/components/dashboard/TriageAlertsTable";
import OverviewDashboardPage from "@/app/page";

// Mock Recharts ResponsiveContainer to avoid 0x0 container warnings in JSDOM
vi.mock("recharts", async () => {
  const original = await vi.importActual<typeof import("recharts")>("recharts");
  return {
    ...original,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: "800px", height: "280px" }}>{children}</div>
    ),
  };
});

beforeEach(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

describe("formatCentsToUsd utility", () => {
  it("formats integer cents into standard USD currency string", () => {
    expect(formatCentsToUsd(48250000)).toBe("$482,500.00");
    expect(formatCentsToUsd(19420000)).toBe("$194,200.00");
    expect(formatCentsToUsd(0)).toBe("$0.00");
    expect(formatCentsToUsd(1250)).toBe("$12.50");
    expect(formatCentsToUsd(99)).toBe("$0.99");
  });
});

describe("KPI Stat Cards", () => {
  it("renders default KPI stat cards with correct formatted dollar values from cents", () => {
    render(<StatCards />);

    // Check titles
    expect(screen.getByText("Gross Merchandise Volume (GMV)")).toBeDefined();
    expect(screen.getByText("Total Escrow Locked")).toBeDefined();
    expect(screen.getByText("Active Tribunal Disputes")).toBeDefined();
    expect(screen.getByText("Pending Credential Audits")).toBeDefined();

    // Check formatted currency values
    expect(screen.getByText("$482,500.00")).toBeDefined();
    expect(screen.getByText("$194,200.00")).toBeDefined();

    // Check count values
    expect(screen.getByText(String(DEFAULT_PLATFORM_METRICS.activeDisputesCount))).toBeDefined();
    expect(screen.getByText(String(DEFAULT_PLATFORM_METRICS.pendingCredentialAuditsCount))).toBeDefined();
  });

  it("renders custom metric values formatted properly from cents", () => {
    const customMetrics = {
      gmvCents: 125000050, // $1,250,000.50
      totalEscrowLockedCents: 45000000, // $450,000.00
      activeDisputesCount: 3,
      pendingCredentialAuditsCount: 9,
    };

    render(<StatCards metrics={customMetrics} />);

    expect(screen.getByText("$1,250,000.50")).toBeDefined();
    expect(screen.getByText("$450,000.00")).toBeDefined();
    expect(screen.getByText("3")).toBeDefined();
    expect(screen.getByText("9")).toBeDefined();
  });
});

describe("Triage Alerts Desk", () => {
  it("renders triage items and handles severity filtering", () => {
    render(<TriageAlertsTable />);

    // Check that initial alerts render
    expect(screen.getByText("Prescription of contra-indicated allergen in renal protocol")).toBeDefined();
    expect(screen.getByText("CRITICAL")).toBeDefined();

    // Filter by CRITICAL
    const select = screen.getByTestId("filter-severity");
    fireEvent.change(select, { target: { value: "CRITICAL" } });

    // Critical alert should still be present
    expect(screen.getByText("Prescription of contra-indicated allergen in renal protocol")).toBeDefined();
  });

  it("allows operator to action triage items", () => {
    render(<TriageAlertsTable />);

    const holdButtons = screen.getAllByRole("button", { name: /tribunal hold/i });
    expect(holdButtons.length).toBeGreaterThan(0);
    const holdButton = holdButtons[0] as HTMLElement;
    fireEvent.click(holdButton);

    // The item is dismissed from priority queue
    expect(screen.queryByText("Prescription of contra-indicated allergen in renal protocol")).toBeNull();
  });
});

describe("Overview Dashboard Page", () => {
  it("renders platform overview page with all sections", () => {
    render(<OverviewDashboardPage />);

    expect(screen.getByText("Platform Liquidity & Tribunal Console")).toBeDefined();
    expect(screen.getByText("Action Priority Queue (Triage Desk)")).toBeDefined();
    expect(screen.getByTestId("kpi-stat-cards")).toBeDefined();
  });
});
