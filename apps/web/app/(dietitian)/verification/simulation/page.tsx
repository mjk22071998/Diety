"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Clock,
  Send,
  AlertCircle,
  CheckCircle2,
  Award,
  ChevronRight,
  ShieldAlert,
  ArrowLeft,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PatientDialogueBox } from "@/components/clinical/PatientDialogueBox";
import { useSimulation, INITIAL_PATIENT_SCENARIO } from "@/hooks/useSimulation";

export default function ClinicalSimulationPage() {
  const {
    currentTurn,
    turnsRemaining,
    isMinTurnsMet,
    formattedTime,
    messages,
    isSubmitting,
    error,
    rubricResult,
    turnBadgeText,
    isTurnBadgeAmber,
    submitTurn,
    finalizeExam,
    resetSimulation,
  } = useSimulation();

  const [dietitianInput, setDietitianInput] = useState("");
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dietitianInput.trim() || isSubmitting) return;
    const text = dietitianInput;
    setDietitianInput("");
    await submitTurn(text);
  };

  const handleFinalize = async () => {
    if (isSubmitting) return;
    await finalizeExam(dietitianInput);
    setDietitianInput("");
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Clinical Navigation Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Link
              href="/verification"
              className="text-slate-500 hover:text-slate-800 transition-colors p-1.5 rounded-md hover:bg-slate-200/60"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded font-mono">
                  Autonomous Clinical Simulation Exam
                </span>
                <span className="text-xs text-slate-500 font-mono">Pathway B</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 mt-1">
                Virtual Patient Consultation & Competency Evaluation
              </h1>
            </div>
          </div>

          {/* Session Metrics & Turn Badge */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Session Timer */}
            <div
              data-testid="session-timer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-700 shadow-2xs"
            >
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Session Time:</span>
              <strong className="text-slate-900 font-semibold">{formattedTime}</strong>
            </div>

            {/* Turn Counter Badge */}
            <div
              data-testid="turn-counter-badge"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border font-mono tracking-tight shadow-2xs ${
                isTurnBadgeAmber
                  ? "bg-amber-50 text-amber-800 border-amber-300"
                  : "bg-emerald-50 text-emerald-800 border-emerald-300"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isTurnBadgeAmber ? "bg-amber-500" : "bg-emerald-500"
                }`}
              />
              <span>{turnBadgeText}</span>
            </div>
          </div>
        </div>

        {/* Clinical Scenario Context Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-slate-900 font-mono">
                {INITIAL_PATIENT_SCENARIO.title}
              </h2>
              <p className="text-xs text-slate-600 font-sans">
                <strong>Clinical Objective:</strong> {INITIAL_PATIENT_SCENARIO.clinicalGoal}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded inline-flex items-center gap-1 font-mono">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                Allergens: {INITIAL_PATIENT_SCENARIO.knownAllergens.join(", ")}
              </span>
              <span
                data-testid="min-turns-indicator"
                className={`text-xs px-2.5 py-1 rounded border font-mono ${
                  turnsRemaining > 0
                    ? "bg-slate-100 text-slate-600 border-slate-200"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                }`}
              >
                {turnsRemaining > 0
                  ? `${turnsRemaining} turns remaining to meet minimum`
                  : "Minimum turns fulfilled (≥ 5 turns)"}
              </span>
            </div>
          </div>
        </div>

        {/* Rubric Evaluation Result Modal / Section */}
        {rubricResult && (
          <div
            data-testid="rubric-result-card"
            className="bg-white border-2 border-indigo-500 rounded-xl p-6 sm:p-8 shadow-md transition-all"
          >
            <div className="flex items-start justify-between border-b border-slate-200 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center">
                  <Award className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    Clinical Simulation Rubric Breakdown
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Evaluated by DeepSeek-R1 / Llama 3.1 Clinical Judge
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Passed & Approved for Bidding</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {/* Score Percentage */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block font-mono">
                  Clinical Score
                </span>
                <span
                  data-testid="clinical-score-percent"
                  className="text-3xl font-extrabold text-indigo-600 font-mono mt-1 block"
                >
                  {rubricResult.scorePercent}%
                </span>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Threshold: ≥ 75.0%
                </span>
              </div>

              {/* Allergen Violations */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block font-mono">
                  Allergen Violations
                </span>
                <span
                  data-testid="allergen-violations-count"
                  className={`text-3xl font-extrabold font-mono mt-1 block ${
                    rubricResult.allergenViolationsCount === 0
                      ? "text-emerald-600"
                      : "text-rose-600"
                  }`}
                >
                  {rubricResult.allergenViolationsCount}
                </span>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Zero Tolerance Gate (0 Required)
                </span>
              </div>

              {/* Turns Completed */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block font-mono">
                  Completed Turns
                </span>
                <span className="text-3xl font-extrabold text-slate-800 font-mono mt-1 block">
                  {currentTurn}
                </span>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Validity minimum: 5 turns
                </span>
              </div>
            </div>

            {/* Evaluator Notes */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 mb-6">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono mb-2">
                Clinical Evaluator Notes & Synthesis
              </h4>
              <p
                data-testid="evaluator-notes"
                className="text-sm text-slate-700 font-mono leading-relaxed"
              >
                {rubricResult.clinicalFeedback}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={resetSimulation} className="w-full sm:w-auto">
                <RotateCcw className="w-4 h-4 mr-1.5" />
                Retake Simulation
              </Button>
              <Link href="/verification" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto">
                  <span>Return to Credentialing Hub</span>
                  <ChevronRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Chat Interface: Patient on LEFT | Dietitian on RIGHT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: Dialogue Transcript & Patient Output (Taking 7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider font-mono">
                Consultation Transcript
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {messages.length} interactions logged
              </span>
            </div>

            {/* Scrollable Conversation Container */}
            <div
              ref={chatScrollRef}
              className="bg-white border border-slate-200 rounded-xl p-5 h-[480px] overflow-y-auto space-y-4 shadow-2xs"
            >
              {messages.map((msg) =>
                msg.role === "patient" ? (
                  /* Patient message on LEFT (slate card, slate-700, font-mono text-sm) */
                  <div key={msg.id} className="flex justify-start">
                    <PatientDialogueBox
                      message={msg.content}
                      timestamp={msg.timestamp}
                    />
                  </div>
                ) : (
                  /* Dietitian response on RIGHT (indigo-50 background, font-mono text-sm) */
                  <div key={msg.id} className="flex justify-end">
                    <div
                      data-testid="dietitian-response-card"
                      className="self-end ml-auto w-full max-w-xl bg-indigo-50/80 border border-indigo-200 rounded-lg p-5 shadow-2xs text-left"
                    >
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-indigo-100">
                        <span className="text-xs font-semibold text-indigo-900 font-mono tracking-tight uppercase">
                          Dietitian (You)
                        </span>
                        <span className="text-xs font-mono text-indigo-400">
                          {msg.timestamp}
                        </span>
                      </div>
                      <div className="text-indigo-950 font-mono text-sm leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </div>
                    </div>
                  </div>
                )
              )}

              {isSubmitting && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 border border-slate-200 rounded-lg p-4 text-xs font-mono text-slate-500 animate-pulse">
                    Patient is synthesizing clinical response...
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Dietitian Response Text Area & Submission (Taking 5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                  Dietitian Response Console
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Turn {currentTurn}
                </span>
              </div>

              {error && (
                <div className="mb-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSendResponse} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 font-mono">
                    Clinical Advice & Care Plan
                  </label>
                  <textarea
                    rows={8}
                    required
                    disabled={isSubmitting || !!rubricResult}
                    value={dietitianInput}
                    onChange={(e) => setDietitianInput(e.target.value)}
                    placeholder="Enter your clinical response, dietary recommendations, macro boundaries, or allergen-safe substitutes..."
                    className="w-full p-3.5 text-sm font-mono text-slate-800 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-400 disabled:opacity-60"
                  />
                  <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400 font-mono">
                    <span>Markdown supported</span>
                    <span>{dietitianInput.length} characters</span>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <Button
                    type="submit"
                    disabled={!dietitianInput.trim() || isSubmitting || !!rubricResult}
                    isLoading={isSubmitting}
                    className="w-full inline-flex items-center justify-center gap-2 font-mono text-sm"
                  >
                    <Send className="w-4 h-4" />
                    <span>Submit Turn Response</span>
                  </Button>

                  {/* Complete Exam CTA */}
                  {isMinTurnsMet && !rubricResult && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleFinalize}
                      disabled={isSubmitting}
                      className="w-full inline-flex items-center justify-center gap-2 text-indigo-700 border-indigo-300 font-mono text-xs"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>Complete & Grade Clinical Exam</span>
                    </Button>
                  )}
                </div>
              </form>
            </div>

            {/* Clinical Guidance Footnote */}
            <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200/80 text-[11px] text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700 font-mono">Clinical Safety Protocol:</p>
              <p>
                Patient has documented peanut and shellfish allergies. Proposing dishes with cross-contamination or hidden allergens triggers an automatic failure.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
