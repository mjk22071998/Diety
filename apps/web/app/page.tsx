import Link from "next/link";
import {
  Activity,
  ShieldCheck,
  Stethoscope,
  Video,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Lock,
} from "lucide-react";

export default function RootPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Banner Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-900/50 backdrop-blur sticky top-0 z-30 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-slate-100">
                Diety
              </span>
              <span className="text-xs font-mono text-emerald-400 ml-2 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                PORT 3300
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              API Connected (:3301)
            </span>
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <main className="max-w-6xl mx-auto px-6 py-16 flex-1 flex flex-col justify-center">
        <div className="max-w-2xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Healthcare Freelance Platform Active</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight">
            Evidence-Based Nutrition & Telehealth Escrow
          </h1>
          <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
            Connect licensed dietitians and patients through verifiable clinical pathways, milestone escrow smart releases, AI clinical simulations, and end-to-end encrypted consultations.
          </p>
        </div>

        {/* Portals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Client Intake Portal */}
          <Link
            href="/requirements/new"
            className="group p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-emerald-500/50 hover:bg-slate-900/80 transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-105 transition-transform">
                <Stethoscope className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                Client Intake Portal
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Post clinical dietary requirements, set macro targets, specify medical allergens, and receive transparent proposals.
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-emerald-400 font-mono">
              <span>Open Requirement Form</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Dietitian Verification & Exam */}
          <Link
            href="/verification"
            className="group p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-blue-500/50 hover:bg-slate-900/80 transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                Dietitian Onboarding
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Verify credentials via CDR state license or complete the AI Clinical Patient Simulation exam scored on USMLE rubrics.
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-blue-400 font-mono">
              <span>Enter Verification Queue</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* WebRTC Video Consultation */}
          <Link
            href="/consultations/demo-room-01"
            className="group p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-purple-500/50 hover:bg-slate-900/80 transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-105 transition-transform">
                <Video className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-400 transition-colors">
                Telehealth Consultation
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Direct WebRTC peer video room with real-time 60-second attendance heartbeat accumulator and cryptographic audit trails.
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-purple-400 font-mono">
              <span>Join Demo Room</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Admin & Disciplinary Tribunal */}
          <a
            href="http://localhost:3302"
            target="_blank"
            rel="noopener noreferrer"
            className="group p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-amber-500/50 hover:bg-slate-900/80 transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-105 transition-transform">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-semibold text-white mb-2 group-hover:text-amber-400 transition-colors">
                Admin & Tribunal Console
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Isolated administrative enclave (:3302). Evidence vault, split-screen dispute arbitration, degree audit, and fee control.
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-amber-400 font-mono">
              <span>Launch Admin (:3302)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </div>
          </a>

          {/* Backend API & WebSockets */}
          <a
            href="http://localhost:3301/health"
            target="_blank"
            rel="noopener noreferrer"
            className="group p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-emerald-500/50 hover:bg-slate-900/80 transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-105 transition-transform">
                <Activity className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                NestJS Backend Health
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Hexagonal domain API (:3301). Live JSON healthcheck, bounded context registry, and WebSocket signaling status.
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-emerald-400 font-mono">
              <span>Inspect Health JSON</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </div>
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 px-6 py-6 text-center text-xs font-mono text-slate-400">
        Diety Healthcare Platform • Running on Ports 3300 (Web), 3301 (API), 3302 (Admin)
      </footer>
    </div>
  );
}
