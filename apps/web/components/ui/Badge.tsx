import * as React from "react";

export type BadgeTier = "new" | "silver" | "gold" | "platinum";

interface BadgeProps {
  tier: BadgeTier;
  className?: string;
}

const tierConfig: Record<
  BadgeTier,
  { label: string; className: string }
> = {
  new: {
    label: "New",
    className:
      "bg-slate-100 text-slate-600 border border-slate-200",
  },
  silver: {
    label: "Silver",
    className:
      "bg-slate-200 text-slate-700 border border-slate-300",
  },
  gold: {
    label: "Gold",
    className:
      "bg-amber-50 text-amber-700 border border-amber-200",
  },
  platinum: {
    label: "Platinum",
    className:
      "bg-violet-50 text-violet-700 border border-violet-200",
  },
};

/**
 * Diety Tier Badge — displayed on clinician/dietitian profiles.
 * Avoids saturated, marketing-style badge colors; uses muted tones
 * appropriate for a credentialing context.
 */
export function Badge({ tier, className = "" }: BadgeProps) {
  const { label, className: tierCls } = tierConfig[tier];

  return (
    <span
      className={[
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium tracking-wide",
        tierCls,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      data-tier={tier}
    >
      {label}
    </span>
  );
}
