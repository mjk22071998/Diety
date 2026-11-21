import * as React from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 " +
    "border border-transparent shadow-sm " +
    "disabled:bg-indigo-300 disabled:cursor-not-allowed",
  secondary:
    "bg-white text-indigo-700 hover:bg-indigo-50 active:bg-indigo-100 " +
    "border border-indigo-300 shadow-sm " +
    "disabled:text-indigo-300 disabled:border-indigo-200 disabled:cursor-not-allowed",
  ghost:
    "bg-transparent text-slate-700 hover:bg-slate-100 active:bg-slate-200 " +
    "border border-transparent " +
    "disabled:text-slate-400 disabled:cursor-not-allowed",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm rounded-md gap-1.5",
  md: "px-4 py-2 text-sm rounded-lg gap-2",
  lg: "px-5 py-2.5 text-base rounded-lg gap-2.5",
};

/**
 * Diety Button — clinical, restrained.
 * No rounded-full pill shapes; uses rounded-md/rounded-lg for a data-tool feel.
 */
export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center font-medium " +
    "transition-colors duration-150 ease-in-out " +
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600";

  return (
    <button
      {...props}
      disabled={disabled ?? isLoading}
      className={[base, variantClasses[variant], sizeClasses[size], className]
        .filter(Boolean)
        .join(" ")}
    >
      {isLoading && (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
