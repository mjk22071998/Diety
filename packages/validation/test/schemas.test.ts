import { describe, it, expect } from "vitest";
import { UserRole, AllergenType, MealType, ComplaintCategory } from "@diety/types";
import {
  RegisterUserSchema,
  LoginUserSchema,
  CreateRequirementSchema,
  SubmitBidSchema,
  ClinicalSimulationTurnSchema,
  ClinicalSimulationSubmitSchema,
  CreateDietPlanSchema,
  FileDisputeSchema,
} from "../src/index.js";

describe("Validation Schemas Suite", () => {
  // ==========================================================================
  // 1. RegisterUserSchema
  // ==========================================================================
  describe("RegisterUserSchema", () => {
    const validRegistration = {
      email: "dietitian@example.com",
      password: "SecurePassword123!",
      fullName: "Dr. Jane Doe",
      role: UserRole.DIETITIAN,
      phoneCountryCode: "+1",
      phoneNumber: "5551234567",
    };

    it("should accept valid registration input for all roles", () => {
      for (const role of [
        UserRole.CLIENT,
        UserRole.DIETITIAN,
        UserRole.ADMIN,
        UserRole.ARBITRATOR,
      ]) {
        const result = RegisterUserSchema.safeParse({
          ...validRegistration,
          role,
        });
        expect(result.success).toBe(true);
      }
    });

    it("should reject invalid email format", () => {
      const result = RegisterUserSchema.safeParse({
        ...validRegistration,
        email: "not-an-email",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toMatch(/email/i);
      }
    });

    it("should reject passwords shorter than 8 characters", () => {
      const result = RegisterUserSchema.safeParse({
        ...validRegistration,
        password: "short",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toMatch(/8 characters/i);
      }
    });

    it("should reject invalid roles with informative error message", () => {
      const result = RegisterUserSchema.safeParse({
        ...validRegistration,
        role: "SUPERUSER",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toMatch(/role/i);
      }
    });

    it("should reject short full name (< 2 characters)", () => {
      const result = RegisterUserSchema.safeParse({
        ...validRegistration,
        fullName: "A",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toMatch(/2 characters/i);
      }
    });
  });

  // ==========================================================================
  // 2. LoginUserSchema
  // ==========================================================================
  describe("LoginUserSchema", () => {
    it("should accept valid login input", () => {
      const result = LoginUserSchema.safeParse({
        email: "client@example.com",
        password: "ValidPassword123!",
      });
      expect(result.success).toBe(true);
    });

    it("should reject malformed email", () => {
      const result = LoginUserSchema.safeParse({
        email: "bad-email",
        password: "password123",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty password", () => {
      const result = LoginUserSchema.safeParse({
        email: "user@example.com",
        password: "",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toMatch(/required|empty/i);
      }
    });
  });

  // ==========================================================================
  // 3. CreateRequirementSchema
  // ==========================================================================
  describe("CreateRequirementSchema", () => {
    const validRequirement = {
      title: "PCOS Management & Weight Loss",
      description: "Looking for a licensed clinical dietitian to manage insulin resistance.",
      healthGoal: "Weight Loss & Hormone Balance",
      dietaryPreference: "Vegetarian",
      age: 28,
      gender: "Female",
      heightCm: 165,
      currentWeightKg: 78.5,
      targetWeightKg: 62.0,
      caloricTarget: 1800,
      allergens: [AllergenType.PEANUTS, AllergenType.SOYBEANS],
      budgetUsdCents: 25000,
      durationWeeks: 12,
    };

    it("should accept valid requirement input", () => {
      const result = CreateRequirementSchema.safeParse(validRequirement);
      expect(result.success).toBe(true);
    });

    it("should reject non-positive caloricTarget (zero or negative)", () => {
      const zeroResult = CreateRequirementSchema.safeParse({
        ...validRequirement,
        caloricTarget: 0,
      });
      expect(zeroResult.success).toBe(false);

      const negResult = CreateRequirementSchema.safeParse({
        ...validRequirement,
        caloricTarget: -1500,
      });
      expect(negResult.success).toBe(false);
    });

    it("should reject non-positive budgetUsdCents", () => {
      const negBudget = CreateRequirementSchema.safeParse({
        ...validRequirement,
        budgetUsdCents: -5000,
      });
      expect(negBudget.success).toBe(false);
    });

    it("should reject durationWeeks less than 1 or greater than 52", () => {
      const lowResult = CreateRequirementSchema.safeParse({
        ...validRequirement,
        durationWeeks: 0,
      });
      expect(lowResult.success).toBe(false);

      const highResult = CreateRequirementSchema.safeParse({
        ...validRequirement,
        durationWeeks: 53,
      });
      expect(highResult.success).toBe(false);
    });

    it("should reject descriptions shorter than 10 characters", () => {
      const result = CreateRequirementSchema.safeParse({
        ...validRequirement,
        description: "Need help",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid allergen values", () => {
      const result = CreateRequirementSchema.safeParse({
        ...validRequirement,
        allergens: ["NOT_AN_ALLERGEN"],
      });
      expect(result.success).toBe(false);
    });
  });

  // ==========================================================================
  // 4. SubmitBidSchema
  // ==========================================================================
  describe("SubmitBidSchema", () => {
    const validBid = {
      requirementId: "a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d",
      proposedAmountCents: 20000,
      durationWeeks: 8,
      proposalText: "I am a registered dietitian specializing in clinical weight management.",
      milestones: [
        {
          title: "Intake Consultation & Custom Macro Blueprint",
          amountCents: 10000,
          durationDays: 14,
        },
        {
          title: "Follow-up Biometrics & Mid-term Revision",
          amountCents: 10000,
          durationDays: 42,
        },
      ],
    };

    it("should accept valid bid proposal", () => {
      const result = SubmitBidSchema.safeParse(validBid);
      expect(result.success).toBe(true);
    });

    it("should reject non-UUID requirementId", () => {
      const result = SubmitBidSchema.safeParse({
        ...validBid,
        requirementId: "not-a-uuid",
      });
      expect(result.success).toBe(false);
    });

    it("should reject non-positive proposedAmountCents with informative error", () => {
      const resultZero = SubmitBidSchema.safeParse({
        ...validBid,
        proposedAmountCents: 0,
      });
      expect(resultZero.success).toBe(false);
      if (!resultZero.success) {
        expect(resultZero.error.issues[0]?.message).toMatch(/greater than 0|positive/i);
      }

      const resultNeg = SubmitBidSchema.safeParse({
        ...validBid,
        proposedAmountCents: -1000,
      });
      expect(resultNeg.success).toBe(false);
      if (!resultNeg.success) {
        expect(resultNeg.error.issues[0]?.message).toMatch(/greater than 0|positive/i);
      }
    });

    it("should reject durationWeeks out of 1-52 bounds", () => {
      const resultLow = SubmitBidSchema.safeParse({
        ...validBid,
        durationWeeks: 0,
      });
      expect(resultLow.success).toBe(false);

      const resultHigh = SubmitBidSchema.safeParse({
        ...validBid,
        durationWeeks: 60,
      });
      expect(resultHigh.success).toBe(false);
    });

    it("should reject proposalText under 10 characters", () => {
      const result = SubmitBidSchema.safeParse({
        ...validBid,
        proposalText: "Hire me",
      });
      expect(result.success).toBe(false);
    });

    it("should reject milestones with negative or zero amounts", () => {
      const result = SubmitBidSchema.safeParse({
        ...validBid,
        milestones: [{ title: "Phase 1", amountCents: -50 }],
      });
      expect(result.success).toBe(false);
    });
  });

  // ==========================================================================
  // 5. ClinicalSimulationTurnSchema
  // ==========================================================================
  describe("ClinicalSimulationTurnSchema", () => {
    it("should accept valid turn input", () => {
      const result = ClinicalSimulationTurnSchema.safeParse({
        turnNumber: 1,
        message: "Hello Mrs. Higgins, could you describe your typical breakfast?",
      });
      expect(result.success).toBe(true);
    });

    it("should reject turnNumber < 1", () => {
      const resultZero = ClinicalSimulationTurnSchema.safeParse({
        turnNumber: 0,
        message: "Starting simulation question.",
      });
      expect(resultZero.success).toBe(false);

      const resultNeg = ClinicalSimulationTurnSchema.safeParse({
        turnNumber: -2,
        message: "Starting simulation question.",
      });
      expect(resultNeg.success).toBe(false);
    });

    it("should reject empty message", () => {
      const result = ClinicalSimulationTurnSchema.safeParse({
        turnNumber: 2,
        message: "",
      });
      expect(result.success).toBe(false);
    });
  });

  // ==========================================================================
  // 6. ClinicalSimulationSubmitSchema
  // ==========================================================================
  describe("ClinicalSimulationSubmitSchema", () => {
    const validSubmit = {
      finalPlan: "Custom 1800kcal renal-safe nutritional plan with restricted sodium and potassium.",
      dietaryRecommendations: [
        "Limit sodium to 1500mg/day",
        "Maintain adequate hydration with 2.0L water",
        "Distribute complex carbohydrates evenly across 4 meals",
      ],
      candidateNotes: "Patient showed signs of stage 2 CKD contraindications.",
    };

    it("should accept valid clinical exam submission", () => {
      const result = ClinicalSimulationSubmitSchema.safeParse(validSubmit);
      expect(result.success).toBe(true);
    });

    it("should reject finalPlan shorter than 10 characters", () => {
      const result = ClinicalSimulationSubmitSchema.safeParse({
        ...validSubmit,
        finalPlan: "Eat food",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty dietaryRecommendations array", () => {
      const result = ClinicalSimulationSubmitSchema.safeParse({
        ...validSubmit,
        dietaryRecommendations: [],
      });
      expect(result.success).toBe(false);
    });
  });

  // ==========================================================================
  // 7. CreateDietPlanSchema
  // ==========================================================================
  describe("CreateDietPlanSchema", () => {
    const validDietPlan = {
      contractId: "b2c3d4e5-f6a1-4b2c-9d3e-4f5a6b7c8d9e",
      weekNumber: 1,
      dailyCalorieTarget: 2200,
      dailyWaterTargetLiters: 3.0,
      generalNotes: "Initial macro adjustment phase.",
      meals: [
        {
          dayOfWeek: 1,
          mealType: MealType.BREAKFAST,
          foodDescription: "Rolled oats with chia seeds, almond milk, and whey protein",
          calories: 450,
          proteinGrams: 35.0,
          carbsGrams: 55.0,
          fatsGrams: 10.0,
          scheduledTime: "08:30:00",
          instructions: "Soak oats overnight for optimal digestion.",
        },
        {
          dayOfWeek: 1,
          mealType: MealType.LUNCH,
          foodDescription: "Grilled chicken breast with quinoa and steamed broccoli",
          calories: 600,
          proteinGrams: 50.0,
          carbsGrams: 45.0,
          fatsGrams: 15.0,
          scheduledTime: "13:00:00",
        },
      ],
    };

    it("should accept valid diet plan", () => {
      const result = CreateDietPlanSchema.safeParse(validDietPlan);
      expect(result.success).toBe(true);
    });

    it("should reject invalid contractId (not UUID)", () => {
      const result = CreateDietPlanSchema.safeParse({
        ...validDietPlan,
        contractId: "invalid-contract-id",
      });
      expect(result.success).toBe(false);
    });

    it("should reject weekNumber < 1", () => {
      const result = CreateDietPlanSchema.safeParse({
        ...validDietPlan,
        weekNumber: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should reject dailyCalorieTarget <= 0", () => {
      const resultZero = CreateDietPlanSchema.safeParse({
        ...validDietPlan,
        dailyCalorieTarget: 0,
      });
      expect(resultZero.success).toBe(false);

      const resultNeg = CreateDietPlanSchema.safeParse({
        ...validDietPlan,
        dailyCalorieTarget: -100,
      });
      expect(resultNeg.success).toBe(false);
    });

    it("should reject empty meals array", () => {
      const result = CreateDietPlanSchema.safeParse({
        ...validDietPlan,
        meals: [],
      });
      expect(result.success).toBe(false);
    });

    it("should reject meal with negative calories or negative macros", () => {
      const result = CreateDietPlanSchema.safeParse({
        ...validDietPlan,
        meals: [
          {
            dayOfWeek: 1,
            mealType: MealType.DINNER,
            foodDescription: "Salmon fillet with asparagus",
            calories: -500,
            proteinGrams: 40,
            carbsGrams: 5,
            fatsGrams: 20,
          },
        ],
      });
      expect(result.success).toBe(false);
    });

    it("should reject dayOfWeek outside 1-7 range", () => {
      const resultLow = CreateDietPlanSchema.safeParse({
        ...validDietPlan,
        meals: [
          {
            dayOfWeek: 0,
            mealType: MealType.LUNCH,
            foodDescription: "Tofu salad",
            calories: 300,
            proteinGrams: 20,
            carbsGrams: 15,
            fatsGrams: 10,
          },
        ],
      });
      expect(resultLow.success).toBe(false);

      const resultHigh = CreateDietPlanSchema.safeParse({
        ...validDietPlan,
        meals: [
          {
            dayOfWeek: 8,
            mealType: MealType.LUNCH,
            foodDescription: "Tofu salad",
            calories: 300,
            proteinGrams: 20,
            carbsGrams: 15,
            fatsGrams: 10,
          },
        ],
      });
      expect(resultHigh.success).toBe(false);
    });
  });

  // ==========================================================================
  // 8. FileDisputeSchema
  // ==========================================================================
  describe("FileDisputeSchema", () => {
    const validDispute = {
      contractId: "c3d4e5f6-a1b2-4c3d-ae4f-5a6b7c8d9e0f",
      reason: "Dietitian missed 2 scheduled video consultations without prior notice.",
      evidenceUrls: [
        "https://vault.diety.org/evidence/screenshot-1.png",
        "https://vault.diety.org/evidence/chat-transcript.pdf",
      ],
      category: ComplaintCategory.NO_SHOW,
    };

    it("should accept valid dispute ticket filing", () => {
      const result = FileDisputeSchema.safeParse(validDispute);
      expect(result.success).toBe(true);
    });

    it("should reject non-UUID contractId", () => {
      const result = FileDisputeSchema.safeParse({
        ...validDispute,
        contractId: "bad-id",
      });
      expect(result.success).toBe(false);
    });

    it("should reject reason shorter than 10 characters or empty", () => {
      const resultEmpty = FileDisputeSchema.safeParse({
        ...validDispute,
        reason: "",
      });
      expect(resultEmpty.success).toBe(false);

      const resultShort = FileDisputeSchema.safeParse({
        ...validDispute,
        reason: "No show",
      });
      expect(resultShort.success).toBe(false);
      if (!resultShort.success) {
        expect(resultShort.error.issues[0]?.message).toMatch(/10 characters/i);
      }
    });

    it("should reject invalid evidence URLs", () => {
      const result = FileDisputeSchema.safeParse({
        ...validDispute,
        evidenceUrls: ["not-a-valid-url"],
      });
      expect(result.success).toBe(false);
    });
  });
});
