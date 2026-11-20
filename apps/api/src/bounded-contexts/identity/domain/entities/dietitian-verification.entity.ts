import { DomainException } from '../../../shared/domain/exceptions/domain.exception';

export enum VerificationPathway {
  PATHWAY_A_LICENSE = 'PATHWAY_A_LICENSE',
  PATHWAY_B_DEGREE_EXAM = 'PATHWAY_B_DEGREE_EXAM'
}

export enum VerificationStatus {
  PENDING_SUBMISSION = 'PENDING_SUBMISSION',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface PathwayALicenseProps {
  dietitianId: string;
  licenseNumber: string;
  jurisdiction: string;
  licenseExpiryDate: Date;
  licenseDocumentId: string;
}

export interface PathwayBDegreeProps {
  dietitianId: string;
  degreeTitle: string;
  institution: string;
  graduationYear: number;
  degreeDocumentId: string;
}

export interface AiSimulationExamResult {
  clinicalScorePercent: number;
  allergenViolationsCount: number;
  completedTurns: number;
  evaluatorNotes: string;
}

/**
 * DietitianVerification Aggregate Root
 * 
 * Enforces the Dual-Pathway Clinical Credentialing engine:
 * - Pathway A: Government practice license validated against public health registries.
 * - Pathway B: Accredited university degree + Local AI Clinical Simulation Exam (score >= 75%, 0 allergen violations).
 */
export class DietitianVerification {
  public readonly id: string;
  public readonly dietitianId: string;
  public readonly pathway: VerificationPathway;
  private _status: VerificationStatus;

  // Pathway A fields
  public readonly licenseNumber?: string;
  public readonly jurisdiction?: string;
  public readonly licenseExpiryDate?: Date;
  public readonly licenseDocumentId?: string;

  // Pathway B fields
  public readonly degreeTitle?: string;
  public readonly institution?: string;
  public readonly graduationYear?: number;
  public readonly degreeDocumentId?: string;
  private _examScore?: number;
  private _allergenViolations?: number;

  private _reviewNotes?: string;
  public readonly createdAt: Date;
  private _reviewedAt?: Date;

  private constructor(
    id: string,
    dietitianId: string,
    pathway: VerificationPathway,
    status: VerificationStatus,
    extra: Partial<PathwayALicenseProps & PathwayBDegreeProps>
  ) {
    if (!dietitianId) {
      throw new DomainException('Dietitian ID is required', 'INVALID_DIETITIAN_ID');
    }

    this.id = id;
    this.dietitianId = dietitianId;
    this.pathway = pathway;
    this._status = status;
    this.createdAt = new Date();

    if (pathway === VerificationPathway.PATHWAY_A_LICENSE) {
      if (!extra.licenseNumber || !extra.jurisdiction || !extra.licenseExpiryDate) {
        throw new DomainException('Missing required Pathway A license fields', 'INVALID_LICENSE_PROPS');
      }
      if (extra.licenseExpiryDate.getTime() <= Date.now()) {
        throw new DomainException(
          `Cannot submit an already expired license (expired on ${extra.licenseExpiryDate.toISOString()})`,
          'EXPIRED_LICENSE'
        );
      }
      this.licenseNumber = extra.licenseNumber;
      this.jurisdiction = extra.jurisdiction;
      this.licenseExpiryDate = extra.licenseExpiryDate;
      this.licenseDocumentId = extra.licenseDocumentId;
    } else {
      if (!extra.degreeTitle || !extra.institution || !extra.graduationYear) {
        throw new DomainException('Missing required Pathway B degree fields', 'INVALID_DEGREE_PROPS');
      }
      this.degreeTitle = extra.degreeTitle;
      this.institution = extra.institution;
      this.graduationYear = extra.graduationYear;
      this.degreeDocumentId = extra.degreeDocumentId;
    }
  }

  public static createPathwayA(props: PathwayALicenseProps): DietitianVerification {
    const id = `ver-a-${Date.now()}`;
    return new DietitianVerification(
      id,
      props.dietitianId,
      VerificationPathway.PATHWAY_A_LICENSE,
      VerificationStatus.UNDER_REVIEW,
      props
    );
  }

  public static createPathwayB(props: PathwayBDegreeProps): DietitianVerification {
    const id = `ver-b-${Date.now()}`;
    return new DietitianVerification(
      id,
      props.dietitianId,
      VerificationPathway.PATHWAY_B_DEGREE_EXAM,
      VerificationStatus.UNDER_REVIEW,
      props
    );
  }

  public get status(): VerificationStatus {
    return this._status;
  }

  public get examScore(): number | undefined {
    return this._examScore;
  }

  public get allergenViolations(): number | undefined {
    return this._allergenViolations;
  }

  public isApprovedForBidding(): boolean {
    return this._status === VerificationStatus.APPROVED;
  }

  /**
   * Approves government medical license following registry verification
   */
  public approveLicense(auditNotes: string): void {
    if (this.pathway !== VerificationPathway.PATHWAY_A_LICENSE) {
      throw new DomainException('Cannot approve license for non-license pathway', 'INVALID_PATHWAY_ACTION');
    }
    this._status = VerificationStatus.APPROVED;
    this._reviewNotes = auditNotes;
    this._reviewedAt = new Date();
  }

  /**
   * Rejects government medical license if inactive, invalid, or forged
   */
  public rejectLicense(reason: string): void {
    if (this.pathway !== VerificationPathway.PATHWAY_A_LICENSE) {
      throw new DomainException('Cannot reject license for non-license pathway', 'INVALID_PATHWAY_ACTION');
    }
    this._status = VerificationStatus.REJECTED;
    this._reviewNotes = reason;
    this._reviewedAt = new Date();
  }

  /**
   * Records results of the local Ollama AI Clinical Simulation Exam
   * Invariants:
   * 1. Must have completed all 5 interactive turns.
   * 2. Must score >= 75% on objective clinical rubric.
   * 3. Must have 0 allergen safety violations.
   */
  public recordAiSimulationExamResult(exam: AiSimulationExamResult): void {
    if (this.pathway !== VerificationPathway.PATHWAY_B_DEGREE_EXAM) {
      throw new DomainException('Cannot record AI exam for Pathway A license holders', 'INVALID_PATHWAY_ACTION');
    }
    if (exam.completedTurns < 5) {
      throw new DomainException(
        `AI Simulation Exam incomplete: only ${exam.completedTurns}/5 clinical turns completed`,
        'INCOMPLETE_AI_EXAM'
      );
    }

    this._examScore = exam.clinicalScorePercent;
    this._allergenViolations = exam.allergenViolationsCount;
    this._reviewNotes = exam.evaluatorNotes;
    this._reviewedAt = new Date();

    if (exam.clinicalScorePercent >= 75 && exam.allergenViolationsCount === 0) {
      this._status = VerificationStatus.APPROVED;
    } else {
      this._status = VerificationStatus.REJECTED;
    }
  }
}
