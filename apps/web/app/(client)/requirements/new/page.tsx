"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AllergenType } from "@diety/types";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useIntakeStore } from "@/stores/intake.store";
import { Button } from "@/components/ui/Button";

// ============================================================================
// Step 1 Validation Schema: Personal Health Metrics
// ============================================================================
const Step1Schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(150),
  description: z.string().min(10, "Description must be at least 10 characters"),
  healthGoal: z.string().min(2, "Health goal is required"),
  dietaryPreference: z.string().min(2, "Dietary preference is required"),
  age: z.number().int("Age must be an integer").positive("Age must be greater than 0"),
  gender: z.string().min(1, "Gender is required"),
  heightCm: z.number().positive("Height must be greater than 0"),
  currentWeightKg: z.number().positive("Current weight must be greater than 0"),
  targetWeightKg: z.number().positive("Target weight must be greater than 0"),
});
type Step1FormData = z.infer<typeof Step1Schema>;

// ============================================================================
// Step 2 Validation Schema: Goals & Macros
// ============================================================================
const Step2Schema = z.object({
  caloricTarget: z.number().int().positive("Caloric target must be greater than 0"),
  durationWeeks: z.number().int().min(1, "Duration must be at least 1 week").max(52, "Duration cannot exceed 52 weeks"),
  budgetUsd: z.number().positive("Budget must be greater than $0"),
});
type Step2FormData = z.infer<typeof Step2Schema>;

const ALL_ALLERGENS: { id: AllergenType; label: string }[] = [
  { id: AllergenType.MILK, label: "Dairy / Milk" },
  { id: AllergenType.EGGS, label: "Eggs" },
  { id: AllergenType.FISH, label: "Fish" },
  { id: AllergenType.CRUSTACEAN_SHELLFISH, label: "Shellfish" },
  { id: AllergenType.TREE_NUTS, label: "Tree Nuts" },
  { id: AllergenType.PEANUTS, label: "Peanuts" },
  { id: AllergenType.WHEAT, label: "Wheat" },
  { id: AllergenType.SOYBEANS, label: "Soy" },
  { id: AllergenType.SESAME, label: "Sesame" },
  { id: AllergenType.GLUTEN, label: "Gluten" },
  { id: AllergenType.MUSTARD, label: "Mustard" },
  { id: AllergenType.CELERY, label: "Celery" },
  { id: AllergenType.SULFITES, label: "Sulfites" },
];

export default function ClientIntakePage() {
  const router = useRouter();
  const {
    currentStep,
    setStep,
    nextStep,
    prevStep,
    healthMetrics,
    goals,
    updateHealthMetrics,
    updateGoals,
    toggleAllergen,
    getPayload,
    reset,
  } = useIntakeStore();

  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [createdId, setCreatedId] = React.useState<string | null>(null);

  // Step 1 Form
  const {
    register: registerStep1,
    handleSubmit: handleSubmitStep1,
    formState: { errors: errorsStep1 },
  } = useForm<Step1FormData>({
    resolver: zodResolver(Step1Schema),
    defaultValues: {
      title: healthMetrics.title,
      description: healthMetrics.description,
      healthGoal: healthMetrics.healthGoal,
      dietaryPreference: healthMetrics.dietaryPreference,
      age: healthMetrics.age,
      gender: healthMetrics.gender,
      heightCm: healthMetrics.heightCm,
      currentWeightKg: healthMetrics.currentWeightKg,
      targetWeightKg: healthMetrics.targetWeightKg,
    },
  });

  // Step 2 Form
  const {
    register: registerStep2,
    handleSubmit: handleSubmitStep2,
    formState: { errors: errorsStep2 },
  } = useForm<Step2FormData>({
    resolver: zodResolver(Step2Schema),
    defaultValues: {
      caloricTarget: goals.caloricTarget,
      durationWeeks: goals.durationWeeks,
      budgetUsd: goals.budgetUsdCents / 100,
    },
  });

  // Macro distribution local state
  const [proteinRatio, setProteinRatio] = React.useState(goals.proteinRatio);
  const [carbsRatio, setCarbsRatio] = React.useState(goals.carbsRatio);
  const [fatsRatio, setFatsRatio] = React.useState(goals.fatsRatio);

  const totalMacroRatio = proteinRatio + carbsRatio + fatsRatio;

  // TanStack Query Mutation
  const createRequirementMutation = useMutation({
    mutationFn: async () => {
      const payload = getPayload();
      const res = await fetch("/api/v1/marketplace/requirements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.detail || errorJson.title || "Submission failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      const reqId = data?.id || "req-" + Date.now();
      setCreatedId(reqId);
    },
    onError: (err: Error) => {
      setSubmitError(err.message || "An unexpected error occurred");
    },
  });

  const onStep1Submit = (data: Step1FormData) => {
    updateHealthMetrics(data);
    nextStep();
  };

  const onStep2Submit = (data: Step2FormData) => {
    updateGoals({
      caloricTarget: Number(data.caloricTarget),
      durationWeeks: Number(data.durationWeeks),
      budgetUsdCents: Math.round(Number(data.budgetUsd) * 100),
      proteinRatio,
      carbsRatio,
      fatsRatio,
    });
    nextStep();
  };

  const onFinalSubmit = () => {
    setSubmitError(null);
    createRequirementMutation.mutate();
  };

  if (createdId) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6">
        <div className="bg-white border border-emerald-200 rounded-xl p-8 text-center shadow-sm">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mb-4">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-serif font-bold text-slate-900 mb-2">Requirement Submitted</h2>
          <p className="text-slate-600 mb-6 text-sm">
            Your clinical intake profile is published to accredited dietitians. Review bids and compare proposals.
          </p>
          <div className="flex justify-center gap-3">
            <Button
              variant="primary"
              onClick={() => router.push(`/requirements/${createdId}/proposals`)}
            >
              View Dietitian Proposals
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                reset();
                setCreatedId(null);
              }}
            >
              Start Another Requirement
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6">
      {/* Header */}
      <div className="mb-8 border-b border-slate-200 pb-5">
        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
          Clinical Intake Workflow
        </span>
        <h1 className="text-3xl font-serif font-bold text-slate-900 mt-1">
          Client Health Requirement
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Precision health intake data for credentialed dietitians and clinical meal planners.
        </p>

        {/* Multi-step Progress Bar */}
        <div className="mt-6 flex items-center justify-between">
          {[
            { step: 1, title: "1. Health Metrics" },
            { step: 2, title: "2. Nutrition Goals" },
            { step: 3, title: "3. Review & Submit" },
          ].map((item) => (
            <button
              key={item.step}
              type="button"
              onClick={() => setStep(item.step as 1 | 2 | 3)}
              className={`flex-1 text-center py-2 border-b-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
                currentStep === item.step
                  ? "border-indigo-600 text-indigo-600"
                  : currentStep > item.step
                  ? "border-emerald-500 text-emerald-600"
                  : "border-slate-200 text-slate-400"
              }`}
            >
              {item.title}
            </button>
          ))}
        </div>
      </div>

      {/* STEP 1: Personal Health Metrics */}
      {currentStep === 1 && (
        <form onSubmit={handleSubmitStep1(onStep1Submit)} className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
            <h2 className="text-lg font-serif font-semibold text-slate-900 border-b border-slate-100 pb-3">
              Biometric & Health Baseline
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-700 mb-1">
                  Project Title
                </label>
                <input
                  {...registerStep1("title")}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g. Metabolic Health & Weight Optimization"
                />
                {errorsStep1.title && (
                  <p className="text-red-500 text-sm mt-1">{errorsStep1.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-700 mb-1">
                  Primary Health Goal
                </label>
                <input
                  {...registerStep1("healthGoal")}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g. Blood Sugar Regulation & Lean Mass"
                />
                {errorsStep1.healthGoal && (
                  <p className="text-red-500 text-sm mt-1">{errorsStep1.healthGoal.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-700 mb-1">
                Detailed Medical / Nutrition Description
              </label>
              <textarea
                {...registerStep1("description")}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Describe current diet, medical conditions, medications, or specific routine challenges..."
              />
              {errorsStep1.description && (
                <p className="text-red-500 text-sm mt-1">{errorsStep1.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-700 mb-1">
                  Age (years)
                </label>
                <input
                  type="number"
                  {...registerStep1("age", { valueAsNumber: true })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
                {errorsStep1.age && (
                  <p className="text-red-500 text-sm mt-1">{errorsStep1.age.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-700 mb-1">
                  Gender
                </label>
                <select
                  {...registerStep1("gender")}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
                {errorsStep1.gender && (
                  <p className="text-red-500 text-sm mt-1">{errorsStep1.gender.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-700 mb-1">
                  Height (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  {...registerStep1("heightCm", { valueAsNumber: true })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
                {errorsStep1.heightCm && (
                  <p className="text-red-500 text-sm mt-1">{errorsStep1.heightCm.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-700 mb-1">
                  Dietary Preference
                </label>
                <select
                  {...registerStep1("dietaryPreference")}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="Balanced Omnivore">Balanced Omnivore</option>
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Vegan">Vegan</option>
                  <option value="Pescatarian">Pescatarian</option>
                  <option value="Ketogenic">Ketogenic</option>
                  <option value="Low-FODMAP">Low-FODMAP</option>
                </select>
                {errorsStep1.dietaryPreference && (
                  <p className="text-red-500 text-sm mt-1">{errorsStep1.dietaryPreference.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-700 mb-1">
                  Current Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  {...registerStep1("currentWeightKg", { valueAsNumber: true })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
                {errorsStep1.currentWeightKg && (
                  <p className="text-red-500 text-sm mt-1">{errorsStep1.currentWeightKg.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-700 mb-1">
                  Target Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  {...registerStep1("targetWeightKg", { valueAsNumber: true })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
                {errorsStep1.targetWeightKg && (
                  <p className="text-red-500 text-sm mt-1">{errorsStep1.targetWeightKg.message}</p>
                )}
              </div>
            </div>

            {/* Allergens Chip Input */}
            <div className="pt-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-700 mb-2">
                Allergies & Intolerances (Select all that apply)
              </label>
              <div
                className="flex flex-wrap gap-2"
                data-testid="allergen-chip-container"
              >
                {ALL_ALLERGENS.map((allergen) => {
                  const isSelected = healthMetrics.allergens.includes(allergen.id);
                  return (
                    <button
                      key={allergen.id}
                      type="button"
                      data-testid="allergen-chip"
                      data-allergen={allergen.id}
                      onClick={() => toggleAllergen(allergen.id)}
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        isSelected
                          ? "bg-red-50 text-red-700 border-red-300 shadow-xs font-semibold"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {isSelected ? "✕ " : "+ "}
                      {allergen.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Clinical safety note: AI and practitioner meal plans strictly exclude any chosen allergen.
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" variant="primary">
              Continue to Goals & Targets →
            </Button>
          </div>
        </form>
      )}

      {/* STEP 2: Goals & Macro Ratios */}
      {currentStep === 2 && (
        <form onSubmit={handleSubmitStep2(onStep2Submit)} className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
            <h2 className="text-lg font-serif font-semibold text-slate-900 border-b border-slate-100 pb-3">
              Nutritional Targets & Timeline
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-700 mb-1">
                  Daily Caloric Target (kcal)
                </label>
                <input
                  type="number"
                  {...registerStep2("caloricTarget", { valueAsNumber: true })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
                {errorsStep2.caloricTarget && (
                  <p className="text-red-500 text-sm mt-1">{errorsStep2.caloricTarget.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-700 mb-1">
                  Program Duration (Weeks)
                </label>
                <input
                  type="number"
                  min="1"
                  max="52"
                  {...registerStep2("durationWeeks", { valueAsNumber: true })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
                {errorsStep2.durationWeeks && (
                  <p className="text-red-500 text-sm mt-1">{errorsStep2.durationWeeks.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-700 mb-1">
                  Budget (USD $)
                </label>
                <input
                  type="number"
                  step="5"
                  {...registerStep2("budgetUsd", { valueAsNumber: true })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
                {errorsStep2.budgetUsd && (
                  <p className="text-red-500 text-sm mt-1">{errorsStep2.budgetUsd.message}</p>
                )}
              </div>
            </div>

            {/* Macro Sliders */}
            <div className="border-t border-slate-100 pt-5 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                  Target Macronutrient Ratio Split
                </span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded ${
                    totalMacroRatio === 100
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  Total: {totalMacroRatio}% {totalMacroRatio !== 100 && "(Adjust to 100%)"}
                </span>
              </div>

              {/* Protein Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Protein</span>
                  <span className="font-semibold text-slate-900">{proteinRatio}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="60"
                  value={proteinRatio}
                  onChange={(e) => setProteinRatio(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Carbs Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Carbohydrates</span>
                  <span className="font-semibold text-slate-900">{carbsRatio}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="70"
                  value={carbsRatio}
                  onChange={(e) => setCarbsRatio(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Fats Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Healthy Fats</span>
                  <span className="font-semibold text-slate-900">{fatsRatio}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="50"
                  value={fatsRatio}
                  onChange={(e) => setFatsRatio(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <Button type="button" variant="secondary" onClick={prevStep}>
              ← Back to Metrics
            </Button>
            <Button type="submit" variant="primary">
              Continue to Review →
            </Button>
          </div>
        </form>
      )}

      {/* STEP 3: Review & Submit */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
            <h2 className="text-lg font-serif font-semibold text-slate-900 border-b border-slate-100 pb-3">
              Review Clinical Intake Summary
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Biometrics & Requirements
                </h3>
                <dl className="text-sm space-y-1.5 text-slate-700">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <dt className="text-slate-500">Project Title:</dt>
                    <dd className="font-medium text-slate-900">{healthMetrics.title}</dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <dt className="text-slate-500">Goal:</dt>
                    <dd className="font-medium text-slate-900">{healthMetrics.healthGoal}</dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <dt className="text-slate-500">Dietary Style:</dt>
                    <dd className="font-medium text-slate-900">{healthMetrics.dietaryPreference}</dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <dt className="text-slate-500">Age / Gender:</dt>
                    <dd className="font-medium text-slate-900">{healthMetrics.age}y / {healthMetrics.gender}</dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <dt className="text-slate-500">Height / Weight:</dt>
                    <dd className="font-medium text-slate-900">
                      {healthMetrics.heightCm} cm | {healthMetrics.currentWeightKg} kg → {healthMetrics.targetWeightKg} kg
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Nutrition Parameters & Budget
                </h3>
                <dl className="text-sm space-y-1.5 text-slate-700">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <dt className="text-slate-500">Caloric Target:</dt>
                    <dd className="font-medium text-slate-900">{goals.caloricTarget} kcal / day</dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <dt className="text-slate-500">Macro Split (P / C / F):</dt>
                    <dd className="font-medium text-slate-900">
                      {goals.proteinRatio}% / {goals.carbsRatio}% / {goals.fatsRatio}%
                    </dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <dt className="text-slate-500">Duration:</dt>
                    <dd className="font-medium text-slate-900">{goals.durationWeeks} weeks</dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <dt className="text-slate-500">Max Budget:</dt>
                    <dd className="font-semibold text-emerald-700">
                      ${(goals.budgetUsdCents / 100).toFixed(2)} USD
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Allergens summary */}
            <div className="pt-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                Identified Allergen Restrictions
              </span>
              {healthMetrics.allergens.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No specific food allergens recorded.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {healthMetrics.allergens.map((allergen) => (
                    <span
                      key={allergen}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-200"
                    >
                      {allergen}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {submitError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {submitError}
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <Button type="button" variant="secondary" onClick={prevStep}>
              ← Edit Goals
            </Button>
            <Button
              type="button"
              variant="primary"
              isLoading={createRequirementMutation.isPending}
              onClick={onFinalSubmit}
            >
              Confirm & Post Requirement
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
