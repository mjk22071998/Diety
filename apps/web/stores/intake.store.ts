import { create } from "zustand";
import { AllergenType } from "@diety/types";
import type { CreateRequirementInput } from "@diety/validation";

export interface HealthMetrics {
  title: string;
  description: string;
  healthGoal: string;
  dietaryPreference: string;
  age: number;
  gender: string;
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number;
  allergens: AllergenType[];
}

export interface IntakeGoals {
  caloricTarget: number;
  proteinRatio: number; // percentage (e.g. 30)
  carbsRatio: number;   // percentage (e.g. 45)
  fatsRatio: number;    // percentage (e.g. 25)
  durationWeeks: number;
  budgetUsdCents: number;
}

export interface IntakeState {
  currentStep: 1 | 2 | 3;
  healthMetrics: HealthMetrics;
  goals: IntakeGoals;
  setStep: (step: 1 | 2 | 3) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateHealthMetrics: (metrics: Partial<HealthMetrics>) => void;
  updateGoals: (goals: Partial<IntakeGoals>) => void;
  toggleAllergen: (allergen: AllergenType) => void;
  reset: () => void;
  getPayload: () => CreateRequirementInput;
}

const initialHealthMetrics: HealthMetrics = {
  title: "Clinical Nutrition & Dietary Management",
  description: "Comprehensive medical nutrition therapy and weekly meal plan requirement.",
  healthGoal: "Weight Management & Metabolic Health",
  dietaryPreference: "Balanced Omnivore",
  age: 32,
  gender: "Not specified",
  heightCm: 175,
  currentWeightKg: 80,
  targetWeightKg: 72,
  allergens: [],
};

const initialGoals: IntakeGoals = {
  caloricTarget: 2000,
  proteinRatio: 30,
  carbsRatio: 40,
  fatsRatio: 30,
  durationWeeks: 4,
  budgetUsdCents: 25000, // $250.00
};

export const useIntakeStore = create<IntakeState>((set, get) => ({
  currentStep: 1,
  healthMetrics: initialHealthMetrics,
  goals: initialGoals,

  setStep: (step) => set({ currentStep: step }),

  nextStep: () =>
    set((state) => ({
      currentStep: Math.min(state.currentStep + 1, 3) as 1 | 2 | 3,
    })),

  prevStep: () =>
    set((state) => ({
      currentStep: Math.max(state.currentStep - 1, 1) as 1 | 2 | 3,
    })),

  updateHealthMetrics: (metrics) =>
    set((state) => ({
      healthMetrics: { ...state.healthMetrics, ...metrics },
    })),

  updateGoals: (goals) =>
    set((state) => ({
      goals: { ...state.goals, ...goals },
    })),

  toggleAllergen: (allergen: AllergenType) =>
    set((state) => {
      const exists = state.healthMetrics.allergens.includes(allergen);
      const allergens = exists
        ? state.healthMetrics.allergens.filter((a) => a !== allergen)
        : [...state.healthMetrics.allergens, allergen];
      return {
        healthMetrics: {
          ...state.healthMetrics,
          allergens,
        },
      };
    }),

  reset: () =>
    set({
      currentStep: 1,
      healthMetrics: initialHealthMetrics,
      goals: initialGoals,
    }),

  getPayload: (): CreateRequirementInput => {
    const { healthMetrics, goals } = get();
    return {
      title: healthMetrics.title.trim(),
      description: healthMetrics.description.trim(),
      healthGoal: healthMetrics.healthGoal.trim(),
      dietaryPreference: healthMetrics.dietaryPreference.trim(),
      age: Number(healthMetrics.age),
      gender: healthMetrics.gender.trim(),
      heightCm: Number(healthMetrics.heightCm),
      currentWeightKg: Number(healthMetrics.currentWeightKg),
      targetWeightKg: Number(healthMetrics.targetWeightKg),
      caloricTarget: Number(goals.caloricTarget),
      allergens: healthMetrics.allergens,
      budgetUsdCents: Number(goals.budgetUsdCents),
      durationWeeks: Number(goals.durationWeeks),
    };
  },
}));
