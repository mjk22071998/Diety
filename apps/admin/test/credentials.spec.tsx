import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import CredentialAuditQueuePage from "@/app/credentials/page";

beforeEach(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

describe("Credential Audit Queue", () => {
  it("renders the audit queue page and initial candidate records", () => {
    render(<CredentialAuditQueuePage />);

    expect(
      screen.getByText("Virtualized Credential Audit Queue")
    ).toBeDefined();
    expect(screen.getByTestId("credential-audit-queue")).toBeDefined();

    // Verify key candidates from seed are displayed
    expect(screen.getByText("Dr. Evelyn Vance, PhD, RD")).toBeDefined();
    expect(screen.getByText("Julian Hayes, MS")).toBeDefined();
    expect(screen.getByText("Claire Beauchamp, RD, LDN")).toBeDefined();
  });

  it("filters credential table rows by status correctly via status tabs", async () => {
    render(<CredentialAuditQueuePage />);

    // 1. Initially all are visible
    expect(screen.getByText("Dr. Evelyn Vance, PhD, RD")).toBeDefined(); // PENDING
    expect(screen.getByText("Claire Beauchamp, RD, LDN")).toBeDefined(); // APPROVED
    expect(screen.getByText("Marcus Thorne, MS")).toBeDefined(); // FLAGGED

    // 2. Click "Pending Review" tab
    const pendingTab = screen.getByTestId("filter-tab-pending");
    fireEvent.click(pendingTab);

    // Pending candidates must be visible
    expect(screen.getByText("Dr. Evelyn Vance, PhD, RD")).toBeDefined();
    expect(screen.getByText("Julian Hayes, MS")).toBeDefined();

    // Approved and Flagged candidates should be filtered out
    expect(screen.queryByText("Claire Beauchamp, RD, LDN")).toBeNull();
    expect(screen.queryByText("Marcus Thorne, MS")).toBeNull();

    // 3. Click "Approved" tab
    const approvedTab = screen.getByTestId("filter-tab-approved");
    fireEvent.click(approvedTab);

    expect(screen.getByText("Claire Beauchamp, RD, LDN")).toBeDefined();
    expect(screen.getByText("Amira Patel, RD")).toBeDefined();
    expect(screen.queryByText("Dr. Evelyn Vance, PhD, RD")).toBeNull();
    expect(screen.queryByText("Julian Hayes, MS")).toBeNull();

    // 4. Click "Flagged / Rejected" tab
    const flaggedTab = screen.getByTestId("filter-tab-flagged");
    fireEvent.click(flaggedTab);

    expect(screen.getByText("Marcus Thorne, MS")).toBeDefined();
    expect(screen.getByText("Derrick Chen, BS")).toBeDefined();
    expect(screen.queryByText("Dr. Evelyn Vance, PhD, RD")).toBeNull();
    expect(screen.queryByText("Claire Beauchamp, RD, LDN")).toBeNull();

    // 5. Restore "All Candidates" tab
    const allTab = screen.getByTestId("filter-tab-all");
    fireEvent.click(allTab);

    expect(screen.getByText("Dr. Evelyn Vance, PhD, RD")).toBeDefined();
    expect(screen.getByText("Claire Beauchamp, RD, LDN")).toBeDefined();
    expect(screen.getByText("Marcus Thorne, MS")).toBeDefined();
  });

  it("filters credential table rows by search query", () => {
    render(<CredentialAuditQueuePage />);

    const searchInput = screen.getByTestId("credentials-search-input");
    fireEvent.change(searchInput, { target: { value: "Cornell" } });

    // Julian Hayes from Cornell should remain
    expect(screen.getByText("Julian Hayes, MS")).toBeDefined();
    // Stanford dietitian should be filtered out
    expect(screen.queryByText("Dr. Evelyn Vance, PhD, RD")).toBeNull();
  });

  it("opens inspection drawer with degree thumbnail, license expiry, and AI rubric on Audit Dossier click", () => {
    render(<CredentialAuditQueuePage />);

    // Audit Julian Hayes (Pathway B: Degree + Simulation)
    const auditBtn = screen.getByTestId("audit-dossier-btn-VER-9012");
    fireEvent.click(auditBtn);

    // Drawer should open
    expect(screen.getByTestId("audit-dossier-drawer")).toBeDefined();
    expect(screen.getByText("Dossier Audit #VER-9012")).toBeDefined();
    expect(screen.getByTestId("degree-preview-thumbnail")).toBeDefined();
    expect(screen.getByTestId("license-expiry-date")).toBeDefined();

    // Pathway B should display AI Simulation Score Rubric
    expect(screen.getByTestId("simulation-rubric-card")).toBeDefined();
    expect(screen.getByTestId("rubric-overall-score").textContent).toContain("94/100");
    expect(screen.getByTestId("rubric-allergen-score").textContent).toContain("100%");
    expect(screen.getByTestId("simulation-pass-status").textContent).toContain("SIMULATION PASSED");

    // Close drawer
    const closeBtn = screen.getByTestId("close-dossier-drawer");
    fireEvent.click(closeBtn);
    expect(screen.queryByTestId("audit-dossier-drawer")).toBeNull();
  });

  it("allows approving or rejecting a candidate credential and updates status badge", async () => {
    // Mock global fetch to test PATCH /api/v1/admin/verifications/[id]
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ status: "APPROVED" }),
    } as Response);

    render(<CredentialAuditQueuePage />);

    // Audit Dr. Evelyn Vance (VER-9011) which is PENDING
    const auditBtn = screen.getByTestId("audit-dossier-btn-VER-9011");
    fireEvent.click(auditBtn);

    const approveBtn = screen.getByTestId("approve-credential-btn");
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/v1/admin/verifications/VER-9011",
        expect.objectContaining({ method: "PATCH" })
      );
    });

    // Check patch feedback banner
    expect(
      screen.getByText("Dossier VER-9011 successfully transitioned to APPROVED.")
    ).toBeDefined();

    // Close drawer
    const closeBtn = screen.getByTestId("close-dossier-drawer");
    fireEvent.click(closeBtn);

    // Verify status badge in table updated to APPROVED
    const statusBadge = screen.getByTestId("status-badge-VER-9011");
    expect(statusBadge.textContent).toBe("APPROVED");

    fetchSpy.mockRestore();
  });
});
