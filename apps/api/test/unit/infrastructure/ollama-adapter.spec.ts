import { describe, it, expect, vi } from 'vitest';
import { OllamaAIAdapter } from '../../../src/bounded-contexts/identity/infrastructure/adapters/ollama-ai.adapter';
import { Ollama } from 'ollama';

describe('Task 3.2: Ollama AI Clinical Simulation Adapter (Pure TDD)', () => {
  const createMockOllama = (chatFn: any) => {
    return {
      chat: vi.fn().mockImplementation(chatFn)
    } as unknown as Ollama;
  };

  it('should initialize with latest default models (llama3.1:8b & deepseek-r1:8b)', () => {
    const adapter = new OllamaAIAdapter();
    expect(adapter.simulationModel).toBe('llama3.1:8b');
    expect(adapter.gradingModel).toBe('deepseek-r1:8b');
  });

  it('should generate patient dialogue turn using simulation model (llama3.1:8b)', async () => {
    const mockClient = createMockOllama(async (req: any) => {
      expect(req.model).toBe('llama3.1:8b');
      expect(req.options.temperature).toBe(0.7);
      return {
        message: {
          content: 'Hello doctor, I have been feeling fatigued and having high morning blood sugar.'
        }
      };
    });

    const adapter = new OllamaAIAdapter({ ollamaClient: mockClient });
    const result = await adapter.generatePatientTurn({
      scenarioTitle: 'Type 2 Diabetic Consultation',
      patientPersona: '52 year old male accountant with HbA1c 8.2%',
      conversationHistory: [],
      dietitianMessage: 'Good afternoon, what brings you in today?'
    });

    expect(result.reply).toContain('fatigued');
    expect(result.turnNumber).toBe(1);
  });

  it('should evaluate clinical rubric using deepseek-r1:8b with JSON Schema format', async () => {
    const mockClient = createMockOllama(async (req: any) => {
      expect(req.model).toBe('deepseek-r1:8b');
      expect(req.options.temperature).toBe(0); // Deterministic
      expect(req.format).toBeDefined(); // Guided decoding
      return {
        message: {
          content: JSON.stringify({
            scorePercent: 88,
            allergenViolationsCount: 0,
            allergenSafe: true,
            passed: true,
            clinicalFeedback: 'Excellent macronutrient distribution. All clinical guidelines adhered to.'
          })
        }
      };
    });

    const adapter = new OllamaAIAdapter({ ollamaClient: mockClient });
    const result = await adapter.evaluateClinicalRubric({
      scenarioTitle: 'Type 2 Diabetes + Peanut Allergy',
      knownAllergens: ['Peanuts'],
      clinicalGoal: 'Carbohydrate titration and glycemic stabilization',
      transcript: [
        { role: 'user', content: 'Do you have any food allergies?' },
        { role: 'assistant', content: 'Yes, severe peanut allergy.' }
      ],
      finalDietPlanSubmission: 'Breakfast: Oatmeal with chia seeds and almond butter...'
    });

    expect(result.scorePercent).toBe(88);
    expect(result.allergenViolationsCount).toBe(0);
    expect(result.allergenSafe).toBe(true);
    expect(result.passed).toBe(true);
    expect(result.clinicalFeedback).toContain('Excellent');
  });

  it('should enforce failure invariant if model outputs an allergen violation', async () => {
    const mockClient = createMockOllama(async () => {
      return {
        message: {
          content: JSON.stringify({
            scorePercent: 90,
            allergenViolationsCount: 1, // Allergen violation!
            allergenSafe: false,
            passed: false,
            clinicalFeedback: 'Fatal error: Included peanut oil in dinner stir-fry.'
          })
        }
      };
    });

    const adapter = new OllamaAIAdapter({ ollamaClient: mockClient });
    const result = await adapter.evaluateClinicalRubric({
      scenarioTitle: 'Type 2 Diabetes + Peanut Allergy',
      knownAllergens: ['Peanuts'],
      clinicalGoal: 'Glycemic stabilization',
      transcript: [],
      finalDietPlanSubmission: 'Dinner: Thai stir-fry with peanut sauce'
    });

    // Must be marked failed regardless of high 90% score!
    expect(result.scorePercent).toBe(90);
    expect(result.allergenViolationsCount).toBe(1);
    expect(result.allergenSafe).toBe(false);
    expect(result.passed).toBe(false);
  });

  it('should handle malformed non-JSON model output gracefully with structured fallback', async () => {
    const mockClient = createMockOllama(async () => {
      return {
        message: {
          content: 'Internal model error: raw text without JSON brackets'
        }
      };
    });

    const adapter = new OllamaAIAdapter({ ollamaClient: mockClient });
    const result = await adapter.evaluateClinicalRubric({
      scenarioTitle: 'Test Case',
      knownAllergens: [],
      clinicalGoal: 'Test',
      transcript: [],
      finalDietPlanSubmission: 'Plan'
    });

    expect(result.scorePercent).toBe(0);
    expect(result.passed).toBe(false);
    expect(result.clinicalFeedback).toContain('Evaluation parse failure');
  });
});
