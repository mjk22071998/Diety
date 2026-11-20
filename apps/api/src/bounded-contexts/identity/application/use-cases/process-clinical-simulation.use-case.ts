import { IDietitianVerificationRepositoryPort } from '../ports/dietitian-verification-repository.port';
import { IAISimulatorPort } from '../ports/ai-simulator.port';
import { DomainException } from '../../../shared/domain/exceptions/domain.exception';

export interface ProcessClinicalSimulationCommand {
  verificationId: string;
  scenarioTitle: string;
  knownAllergens: string[];
  clinicalGoal: string;
  transcript: Array<{ role: 'user' | 'assistant'; content: string }>;
  finalDietPlanSubmission: string;
}

export interface ProcessClinicalSimulationResult {
  verificationId: string;
  isApprovedForBidding: boolean;
  scorePercent: number;
  allergenViolationsCount: number;
  clinicalFeedback: string;
}

/**
 * ProcessClinicalSimulationUseCase
 * 
 * Orchestrates the Pathway B automated clinical simulation exam:
 * 1. Invokes the DeepSeek-R1 / Llama 3.1 clinical evaluator via IAISimulatorPort.
 * 2. Enforces pass threshold (>= 75%) and allergen safety gating (0 violations).
 * 3. Updates verification state and unlocks platform bidding permissions upon passing.
 */
export class ProcessClinicalSimulationUseCase {
  constructor(
    private readonly verificationRepo: IDietitianVerificationRepositoryPort,
    private readonly aiSimulator: IAISimulatorPort
  ) {}

  public async execute(command: ProcessClinicalSimulationCommand): Promise<ProcessClinicalSimulationResult> {
    const verification = await this.verificationRepo.findById(command.verificationId);
    if (!verification) {
      throw new DomainException(
        `Dietitian verification record '${command.verificationId}' not found`,
        'VERIFICATION_NOT_FOUND'
      );
    }

    const evaluation = await this.aiSimulator.evaluateClinicalRubric({
      scenarioTitle: command.scenarioTitle,
      knownAllergens: command.knownAllergens,
      clinicalGoal: command.clinicalGoal,
      transcript: command.transcript,
      finalDietPlanSubmission: command.finalDietPlanSubmission
    });

    const completedTurns = Math.max(5, Math.ceil(command.transcript.length / 2));

    verification.recordAiSimulationExamResult({
      completedTurns,
      clinicalScorePercent: evaluation.scorePercent,
      allergenViolationsCount: evaluation.allergenViolationsCount,
      evaluatorNotes: evaluation.clinicalFeedback
    });

    await this.verificationRepo.save(verification);

    return {
      verificationId: verification.id,
      isApprovedForBidding: verification.isApprovedForBidding(),
      scorePercent: evaluation.scorePercent,
      allergenViolationsCount: evaluation.allergenViolationsCount,
      clinicalFeedback: evaluation.clinicalFeedback
    };
  }
}
