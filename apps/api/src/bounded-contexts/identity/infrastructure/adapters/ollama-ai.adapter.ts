import { Ollama } from 'ollama';
import {
  IAISimulatorPort,
  PatientTurnParams,
  PatientTurnResult,
  RubricEvaluationParams,
  RubricEvaluationResult,
  ChatMessage
} from '../../application/ports/ai-simulator.port';

export interface OllamaAdapterConfig {
  baseUrl?: string;
  simulationModel?: string; // e.g. 'llama3.1:8b'
  gradingModel?: string;     // e.g. 'deepseek-r1:8b'
  ollamaClient?: Ollama;
}

export const CLINICAL_EVALUATION_SCHEMA = {
  type: 'object',
  properties: {
    scorePercent: {
      type: 'integer',
      description: 'Overall clinical competence score from 0 to 100 based on diagnosis and diet plan'
    },
    allergenViolationsCount: {
      type: 'integer',
      description: 'Number of allergen safety violations in the candidate diet recommendation'
    },
    allergenSafe: {
      type: 'boolean',
      description: 'True if zero allergen violations, false otherwise'
    },
    passed: {
      type: 'boolean',
      description: 'True if scorePercent >= 75 and allergenSafe is true'
    },
    clinicalFeedback: {
      type: 'string',
      description: 'Detailed clinical feedback and assessment rationale'
    }
  },
  required: ['scorePercent', 'allergenViolationsCount', 'allergenSafe', 'passed', 'clinicalFeedback']
};

/**
 * OllamaAIAdapter
 * 
 * Deep module integrating with locally hosted open-weight models:
 * - Patient Dialogue: Llama 3.1 8B (natural multi-turn conversational persona).
 * - Rubric Reasoning: DeepSeek-R1 8B (Chain-of-Thought <think> medical reasoning with 92.5% USMLE accuracy)
 *   or Qwen 2.5 7B.
 */
export class OllamaAIAdapter implements IAISimulatorPort {
  private readonly client: Ollama;
  public readonly simulationModel: string;
  public readonly gradingModel: string;

  constructor(config: OllamaAdapterConfig = {}) {
    const host = config.baseUrl || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.client = config.ollamaClient || new Ollama({ host });
    this.simulationModel =
      config.simulationModel || process.env.OLLAMA_SIMULATION_MODEL || 'llama3.1:8b';
    this.gradingModel =
      config.gradingModel || process.env.OLLAMA_GRADING_MODEL || 'deepseek-r1:8b';
  }

  /**
   * Generates the next turn in the clinical patient simulation dialogue
   */
  public async generatePatientTurn(params: PatientTurnParams): Promise<PatientTurnResult> {
    const systemPrompt = `You are a patient participating in a clinical simulation exam.
Scenario: ${params.scenarioTitle}
Your Medical Persona & Background: ${params.patientPersona}
Instructions:
- Stay in character as the patient at all times.
- Answer the dietitian's questions honestly from your persona.
- Do not reveal diagnostic answers unless explicitly asked relevant clinical intake questions.
- Keep responses natural, conversational, and under 4 sentences.`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...params.conversationHistory,
      { role: 'user', content: params.dietitianMessage }
    ];

    const response = await this.client.chat({
      model: this.simulationModel,
      messages: messages as any,
      options: {
        temperature: 0.7
      }
    });

    const turnNumber = Math.floor(params.conversationHistory.length / 2) + 1;

    return {
      reply: response.message.content.trim(),
      turnNumber
    };
  }

  /**
   * Performs chain-of-thought rubric evaluation using DeepSeek-R1 / Qwen with guided JSON Schema
   */
  public async evaluateClinicalRubric(params: RubricEvaluationParams): Promise<RubricEvaluationResult> {
    const systemPrompt = `You are an expert clinical nutrition board examiner grading a dietitian candidate's exam.
CRITICAL SAFETY INVARIANT: If the candidate recommends ANY ingredient that triggers the patient's known allergens, allergenViolationsCount must be >= 1 and allergenSafe must be false.
Candidate must achieve scorePercent >= 75 AND allergenViolationsCount === 0 to pass.

Case Parameters:
- Scenario: ${params.scenarioTitle}
- Patient Known Allergens: ${params.knownAllergens.join(', ')}
- Clinical Target: ${params.clinicalGoal}

Evaluate the consultation transcript and the candidate's final diet plan submission. Output strictly according to the required JSON Schema.`;

    const userContent = `Transcript of Consultation:\n${params.transcript
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n')}\n\nCandidate Final Diet Plan Submission:\n${params.finalDietPlanSubmission}`;

    const response = await this.client.chat({
      model: this.gradingModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent }
      ] as any,
      format: CLINICAL_EVALUATION_SCHEMA as any,
      options: {
        temperature: 0 // Deterministic grading
      }
    });

    try {
      const parsed = JSON.parse(response.message.content) as RubricEvaluationResult;

      // Invariant sanity check: enforce programmatic pass/fail boundary
      const allergenSafe = parsed.allergenViolationsCount === 0;
      const passed = parsed.scorePercent >= 75 && allergenSafe;

      return {
        scorePercent: parsed.scorePercent,
        allergenViolationsCount: parsed.allergenViolationsCount,
        allergenSafe,
        passed,
        clinicalFeedback: parsed.clinicalFeedback
      };
    } catch {
      // In case of non-JSON response from LLM, return structured fallback evaluation
      return {
        scorePercent: 0,
        allergenViolationsCount: 1,
        allergenSafe: false,
        passed: false,
        clinicalFeedback: `Evaluation parse failure. Raw output: ${response.message.content.slice(0, 200)}`
      };
    }
  }
}
