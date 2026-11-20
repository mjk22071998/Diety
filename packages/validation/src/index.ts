/**
 * @diety/validation
 * Isomorphic Zod validation schemas for platform API perimeter and client forms.
 */

import { z } from "zod";
import {
  UserRole,
  AllergenType,
  MealType,
  ComplaintCategory,
} from "@diety/types";

// ============================================================================
// 1. Identity & Authentication Schemas
// ============================================================================

export const RegisterUserSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long"),
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters long"),
  role: z.nativeEnum(UserRole, {
    message: "Invalid role specified",
  }),
  phoneCountryCode: z
    .string()
    .regex(/^\+[0-9]{1,4}$/, "Invalid country code format")
    .optional(),
  phoneNumber: z
    .string()
    .min(5, "Phone number is too short")
    .optional(),
});
export type RegisterUserInput = z.infer<typeof RegisterUserSchema>;

export const LoginUserSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});
export type LoginUserInput = z.infer<typeof LoginUserSchema>;

// ============================================================================
// 2. Marketplace & Requirements Schemas
// ============================================================================

export const CreateRequirementSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(150, "Title cannot exceed 150 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters"),
  healthGoal: z.string().min(2, "Health goal is required"),
  dietaryPreference: z.string().min(2, "Dietary preference is required"),
  age: z
    .number()
    .int("Age must be an integer")
    .positive("Age must be a positive integer"),
  gender: z.string().min(1, "Gender is required"),
  heightCm: z.number().positive("Height must be greater than 0"),
  currentWeightKg: z.number().positive("Current weight must be greater than 0"),
  targetWeightKg: z.number().positive("Target weight must be greater than 0"),
  caloricTarget: z
    .number()
    .int("Caloric target must be an integer")
    .positive("Caloric target must be greater than 0"),
  allergens: z.array(
    z.nativeEnum(AllergenType, {
      message: "Invalid allergen specified",
    })
  ),
  budgetUsdCents: z
    .number()
    .int("Budget must be an integer in cents")
    .positive("Budget must be greater than 0"),
  durationWeeks: z
    .number()
    .int("Duration must be an integer")
    .min(1, "Duration must be at least 1 week")
    .max(52, "Duration cannot exceed 52 weeks"),
});
export type CreateRequirementInput = z.infer<typeof CreateRequirementSchema>;

// ============================================================================
// 3. Bidding & Proposals Schemas
// ============================================================================

export const SubmitBidMilestoneSchema = z.object({
  title: z.string().min(1, "Milestone title is required"),
  amountCents: z
    .number()
    .int("Milestone amount must be an integer in cents")
    .positive("Milestone amount must be greater than 0"),
  durationDays: z
    .number()
    .int("Duration must be an integer")
    .positive("Duration must be positive")
    .optional(),
});
export type SubmitBidMilestoneInput = z.infer<typeof SubmitBidMilestoneSchema>;

export const SubmitBidSchema = z.object({
  requirementId: z.string().uuid("Requirement ID must be a valid UUID"),
  proposedAmountCents: z
    .number()
    .int("Proposed amount must be an integer in cents")
    .positive("Proposed amount must be greater than 0"),
  durationWeeks: z
    .number()
    .int("Duration must be an integer")
    .min(1, "Duration must be at least 1 week")
    .max(52, "Duration cannot exceed 52 weeks"),
  proposalText: z
    .string()
    .min(10, "Proposal text must be at least 10 characters"),
  milestones: z.array(SubmitBidMilestoneSchema).optional(),
});
export type SubmitBidInput = z.infer<typeof SubmitBidSchema>;

// ============================================================================
// 4. Clinical AI Simulation Schemas
// ============================================================================

export const ClinicalSimulationTurnSchema = z.object({
  turnNumber: z
    .number()
    .int("Turn number must be an integer")
    .min(1, "Turn number must be at least 1"),
  message: z.string().min(1, "Message cannot be empty"),
  scenarioId: z.string().uuid("Scenario ID must be a valid UUID").optional(),
});
export type ClinicalSimulationTurnInput = z.infer<
  typeof ClinicalSimulationTurnSchema
>;

export const ClinicalSimulationSubmitSchema = z.object({
  finalPlan: z
    .string()
    .min(10, "Final plan must be at least 10 characters"),
  dietaryRecommendations: z
    .array(z.string().min(1, "Recommendation cannot be empty"))
    .min(1, "At least one dietary recommendation is required"),
  candidateNotes: z.string().optional(),
});
export type ClinicalSimulationSubmitInput = z.infer<
  typeof ClinicalSimulationSubmitSchema
>;

// ============================================================================
// 5. Clinical Meal Plan Schemas
// ============================================================================

export const CreateDietPlanMealSchema = z.object({
  dayOfWeek: z
    .number()
    .int("Day of week must be an integer")
    .min(1, "Day of week must be between 1 and 7")
    .max(7, "Day of week must be between 1 and 7"),
  mealType: z.union([
    z.nativeEnum(MealType),
    z.string().min(1, "Meal type cannot be empty"),
  ]),
  foodDescription: z.string().min(1, "Food description is required"),
  calories: z
    .number()
    .int("Calories must be an integer")
    .nonnegative("Calories must be non-negative"),
  proteinGrams: z.number().nonnegative("Protein grams must be non-negative"),
  carbsGrams: z.number().nonnegative("Carbohydrates grams must be non-negative"),
  fatsGrams: z.number().nonnegative("Fats grams must be non-negative"),
  scheduledTime: z.string().optional(),
  instructions: z.string().optional(),
});
export type CreateDietPlanMealInput = z.infer<typeof CreateDietPlanMealSchema>;

export const CreateDietPlanSchema = z.object({
  contractId: z.string().uuid("Contract ID must be a valid UUID"),
  weekNumber: z
    .number()
    .int("Week number must be an integer")
    .min(1, "Week number must be at least 1"),
  dailyCalorieTarget: z
    .number()
    .int("Daily calorie target must be an integer")
    .positive("Daily calorie target must be greater than 0"),
  dailyWaterTargetLiters: z
    .number()
    .nonnegative("Water target must be non-negative")
    .default(2.5),
  generalNotes: z.string().optional(),
  meals: z
    .array(CreateDietPlanMealSchema)
    .min(1, "At least one meal must be included"),
});
export type CreateDietPlanInput = z.infer<typeof CreateDietPlanSchema>;

// ============================================================================
// 6. Dispute & Disciplinary Tribunal Schemas
// ============================================================================

export const FileDisputeSchema = z.object({
  contractId: z.string().uuid("Contract ID must be a valid UUID"),
  reason: z
    .string()
    .min(10, "Reason must be at least 10 characters long"),
  evidenceUrls: z.array(z.string().url("Evidence URL must be a valid URL")),
  category: z
    .union([z.nativeEnum(ComplaintCategory), z.string()])
    .optional(),
});
export type FileDisputeInput = z.infer<typeof FileDisputeSchema>;
