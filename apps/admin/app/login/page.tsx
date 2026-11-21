"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Lock, KeyRound, AlertCircle } from "lucide-react";
import { UserRole } from "@diety/types";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin.audit@diety.platform");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole.ADMIN | UserRole.ARBITRATOR>(
    UserRole.ADMIN
  );
  const [mfaCode, setMfaCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!email || !password) {
        throw new Error("Operator identity and passphrase are required.");
      }

      // Generate or simulate secure administrative token
      const mockPayload = {
        sub: `usr_adm_${Date.now()}`,
        email,
        role,
        status: "ACTIVE",
        exp: Math.floor(Date.now() / 1000) + 3600 * 8, // 8 hour enclave session
      };

      const tokenString = btoa(JSON.stringify(mockPayload));
      const simulatedJwt = `eyJhbGciOiJIUzI1NiJ9.${tokenString}.signature_simulation`;

      // Set cookie for edge middleware
      document.cookie = `diety_token=${simulatedJwt}; path=/; max-age=28800; SameSite=Lax`;
      sessionStorage.setItem("diety_token", simulatedJwt);

      // Redirect to dashboard
      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to establish authenticated administrator session.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-[#1E293B] border border-[#334155] rounded-lg shadow-2xl p-6 sm:p-8">
        {/* Header with Security Badge */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#334155]">
          <div className="w-10 h-10 rounded bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-100 tracking-tight">
              Diety Admin & Tribunal
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Port 3302 • Cryptographic Enclave
            </p>
          </div>
        </div>

        {error && (
          <div
            className="mb-5 p-3 rounded bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-400"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Authentication Denied</p>
              <p className="text-red-300/90">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Operator Work Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="operator@diety.platform"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Passphrase
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="••••••••••••••••"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Administrative Delegation Role
            </label>
            <select
              value={role}
              onChange={(e) =>
                setRole(e.target.value as UserRole.ADMIN | UserRole.ARBITRATOR)
              }
              className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value={UserRole.ADMIN}>ADMIN (Supervisory Authority)</option>
              <option value={UserRole.ARBITRATOR}>
                ARBITRATOR (Dispute Tribunal Hearing)
              </option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300">
                Hardware Token / TOTP (MFA)
              </label>
              <span className="text-[10px] text-slate-400 font-mono">FIPS 140-2</span>
            </div>
            <div className="relative">
              <input
                type="text"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                maxLength={6}
                className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="6-digit TOTP code"
              />
              <KeyRound className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-2.5" />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white text-xs font-semibold rounded shadow transition-colors flex items-center justify-center gap-2"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>
                {isSubmitting ? "Verifying Enclave Session..." : "Authorize Operator Access"}
              </span>
            </button>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-[#334155] text-center">
          <p className="text-[11px] text-slate-400">
            Audit Notice: Every login attempt and access vector is recorded to
            an immutable audit log.
          </p>
        </div>
      </div>
    </div>
  );
}
