import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { Button } from "@/components/ui/Button";
import { Badge, BadgeTier } from "@/components/ui/Badge";

describe("Button UI Component", () => {
  it("renders with correct text content", () => {
    render(<Button>Confirm Appointment</Button>);
    expect(screen.getByRole("button", { name: /confirm appointment/i })).toBeDefined();
  });

  it("applies primary variant styling by default", () => {
    render(<Button>Primary Action</Button>);
    const button = screen.getByRole("button", { name: /primary action/i });
    expect(button.className).toContain("bg-indigo-600");
    expect(button.className).toContain("text-white");
  });

  it("applies secondary variant classes when requested", () => {
    render(<Button variant="secondary">Cancel</Button>);
    const button = screen.getByRole("button", { name: /cancel/i });
    expect(button.className).toContain("bg-white");
    expect(button.className).toContain("text-indigo-700");
    expect(button.className).toContain("border-indigo-300");
  });

  it("applies ghost variant classes when requested", () => {
    render(<Button variant="ghost">Dismiss</Button>);
    const button = screen.getByRole("button", { name: /dismiss/i });
    expect(button.className).toContain("bg-transparent");
    expect(button.className).toContain("text-slate-700");
  });

  it("disables button when disabled or isLoading is true", () => {
    const { rerender } = render(<Button disabled>Disabled Action</Button>);
    expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(true);

    rerender(<Button isLoading>Loading Action</Button>);
    expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("Badge UI Component", () => {
  const tiers: { tier: BadgeTier; expectedLabel: string }[] = [
    { tier: "new", expectedLabel: "New" },
    { tier: "silver", expectedLabel: "Silver" },
    { tier: "gold", expectedLabel: "Gold" },
    { tier: "platinum", expectedLabel: "Platinum" },
  ];

  tiers.forEach(({ tier, expectedLabel }) => {
    it(`renders correct tier label and data attribute for '${tier}'`, () => {
      render(<Badge tier={tier} />);
      const badge = screen.getByText(expectedLabel);
      expect(badge).toBeDefined();
      expect(badge.getAttribute("data-tier")).toBe(tier);
    });
  });
});
