/**
 * Diety Platform - AI Clinical Simulator Port (Hexagonal Architecture)
 * 
 * Defines the contract for the local Ollama AI inference engine powering
 * the Pathway B automated clinical verification exam.
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface PatientTurnParams {
  scenarioTitle: string;
  patientPersona: string;
  conversationHistory: ChatMessage[];
  dietitianMessage: string;
}

export interface PatientTurnResult {
  reply: string;
  turnNumber: number;
}

export interface RubricEvaluationParams {
  scenarioTitle: string;
  knownAllergens: string[];
  clinicalGoal: string;
  transcript: ChatMessage[];
  finalDietPlanSubmission: string;
}

export interface RubricEvaluationResult {
  scorePercent: number; // 0 - 100
  allergenViolationsCount: number;
  allergenSafe: boolean;
  passed: boolean; // scorePercent >= 75 && allergenViolationsCount === 0
  clinicalFeedback: string;
}

export interface IAISimulatorPort {
  generatePatientTurn(params: PatientTurnParams): Promise<PatientTurnResult>;
  evaluateClinicalRubric(params: RubricEvaluationParams): Promise<RubricEvaluationResult>;
}
