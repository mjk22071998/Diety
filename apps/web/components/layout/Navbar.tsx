"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";

export type UserRole = "client" | "dietitian" | "admin" | "guest";

interface NavItem {
  label: string;
  href: string;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  { label: "Find Specialists", href: "/marketplace", roles: ["guest", "client", "dietitian"] },
  { label: "My Consultations", href: "/consultations", roles: ["client", "dietitian"] },
  { label: "Dietary Plans", href: "/plans", roles: ["client", "dietitian"] },
  { label: "Clinical Records", href: "/records", roles: ["client", "dietitian"] },
  { label: "Practitioner Portal", href: "/portal", roles: ["dietitian"] },
  { label: "Admin Console", href: "/admin", roles: ["admin"] },
];

interface NavbarProps {
  currentRole?: UserRole;
  userName?: string;
  onLogout?: () => void;
}

export function Navbar({
  currentRole = "guest",
  userName,
  onLogout,
}: NavbarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const filteredItems = navItems.filter((item) =>
    item.roles.includes(currentRole)
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded bg-indigo-600 text-white font-bold text-sm tracking-tight">
              D+
            </span>
            <div className="flex flex-col">
              <span className="font-heading text-lg font-semibold tracking-tight text-slate-900 leading-none">
                Diety
              </span>
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                Clinical Network
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {filteredItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100",
                  ].join(" ")}
                  aria-current={isActive ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User / Action CTA */}
        <div className="hidden md:flex items-center gap-3">
          {currentRole === "guest" ? (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" size="sm">
                  Join Clinical Registry
                </Button>
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-600 font-medium">
                {userName ?? "Logged In"} ({currentRole})
              </span>
              {onLogout && (
                <Button variant="ghost" size="sm" onClick={onLogout}>
                  Sign Out
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md p-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-600"
            aria-controls="mobile-menu"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">Toggle navigation menu</span>
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              aria-hidden="true"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1" id="mobile-menu">
          {filteredItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={[
                  "block px-3 py-2 rounded-md text-base font-medium",
                  isActive
                    ? "bg-indigo-50 text-indigo-700 font-semibold"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}
          <div className="pt-4 border-t border-slate-200 flex flex-col gap-2">
            {currentRole === "guest" ? (
              <>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-center">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="sm" className="w-full justify-center">
                    Join Clinical Registry
                  </Button>
                </Link>
              </>
            ) : (
              <div className="flex flex-col gap-2">
                <span className="text-xs text-slate-500 px-3">
                  Signed in as {userName ?? "User"} ({currentRole})
                </span>
                {onLogout && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-center"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onLogout();
                    }}
                  >
                    Sign Out
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
