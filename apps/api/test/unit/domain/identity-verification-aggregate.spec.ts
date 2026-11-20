import { describe, it, expect } from 'vitest';
import {
  DietitianVerification,
  VerificationPathway,
  VerificationStatus
} from '../../../src/bounded-contexts/identity/domain/entities/dietitian-verification.entity';
import { DomainException } from '../../../src/bounded-contexts/shared/domain/exceptions/domain.exception';

describe('Task 2.4: Identity & Dual-Pathway Credential Verification Aggregate (Pure TDD)', () => {
  describe('Pathway A: Government License Verification', () => {
    it('should initialize Pathway A in PENDING_SUBMISSION status', () => {
      const verification = DietitianVerification.createPathwayA({
        dietitianId: 'dietitian-1',
        licenseNumber: 'RD-98234-CA',
        jurisdiction: 'California, US',
        licenseExpiryDate: new Date('2028-12-31T00:00:00Z'),
        licenseDocumentId: 'doc-license-1'
      });

      expect(verification.pathway).toBe(VerificationPathway.PATHWAY_A_LICENSE);
      expect(verification.status).toBe(VerificationStatus.UNDER_REVIEW);
      expect(verification.isApprovedForBidding()).toBe(false);
    });

    it('should reject creation if license is already expired', () => {
      expect(() =>
        DietitianVerification.createPathwayA({
          dietitianId: 'dietitian-1',
          licenseNumber: 'RD-98234-CA',
          jurisdiction: 'California, US',
          licenseExpiryDate: new Date('2020-01-01T00:00:00Z'), // Past date
          licenseDocumentId: 'doc-license-1'
        })
      ).toThrow(DomainException);
    });

    it('should approve license and enable bidding when government registry audit passes', () => {
      const verification = DietitianVerification.createPathwayA({
        dietitianId: 'dietitian-1',
        licenseNumber: 'RD-98234-CA',
        jurisdiction: 'California, US',
        licenseExpiryDate: new Date('2028-12-31T00:00:00Z'),
        licenseDocumentId: 'doc-license-1'
      });

      verification.approveLicense('Audit: Confirmed active on California Medical Board');
      expect(verification.status).toBe(VerificationStatus.APPROVED);
      expect(verification.isApprovedForBidding()).toBe(true);
    });

    it('should reject license and bar bidding when registry audit fails', () => {
      const verification = DietitianVerification.createPathwayA({
        dietitianId: 'dietitian-1',
        licenseNumber: 'RD-FAKENO-99',
        jurisdiction: 'California, US',
        licenseExpiryDate: new Date('2028-12-31T00:00:00Z'),
        licenseDocumentId: 'doc-license-1'
      });

      verification.rejectLicense('Audit: License not found in registry');
      expect(verification.status).toBe(VerificationStatus.REJECTED);
      expect(verification.isApprovedForBidding()).toBe(false);
    });
    it('should throw DomainException if dietitianId is empty', () => {
      expect(() =>
        DietitianVerification.createPathwayA({
          dietitianId: '',
          licenseNumber: 'RD-123',
          jurisdiction: 'NY',
          licenseExpiryDate: new Date('2028-01-01T00:00:00Z'),
          licenseDocumentId: 'doc-1'
        })
      ).toThrow(DomainException);
    });

    it('should throw DomainException if required license fields are missing', () => {
      expect(() =>
        DietitianVerification.createPathwayA({
          dietitianId: 'dietitian-1',
          licenseNumber: '',
          jurisdiction: 'NY',
          licenseExpiryDate: new Date('2028-01-01T00:00:00Z'),
          licenseDocumentId: 'doc-1'
        })
      ).toThrow(DomainException);
    });

    it('should throw DomainException when trying to approve or reject license on Pathway B', () => {
      const verification = DietitianVerification.createPathwayB({
        dietitianId: 'dietitian-2',
        degreeTitle: 'B.S. Nutrition',
        institution: 'Harvard',
        graduationYear: 2023,
        degreeDocumentId: 'doc-deg'
      });

      expect(() => verification.approveLicense('note')).toThrow(DomainException);
      expect(() => verification.rejectLicense('note')).toThrow(DomainException);
    });

    it('should throw DomainException when recording AI exam on Pathway A', () => {
      const verification = DietitianVerification.createPathwayA({
        dietitianId: 'dietitian-1',
        licenseNumber: 'RD-1234',
        jurisdiction: 'CA',
        licenseExpiryDate: new Date('2028-01-01T00:00:00Z'),
        licenseDocumentId: 'doc-1'
      });

      expect(() =>
        verification.recordAiSimulationExamResult({
          clinicalScorePercent: 80,
          allergenViolationsCount: 0,
          completedTurns: 5,
          evaluatorNotes: 'Notes'
        })
      ).toThrow(DomainException);
    });

    it('should throw DomainException if required degree fields are missing', () => {
      expect(() =>
        DietitianVerification.createPathwayB({
          dietitianId: 'dietitian-2',
          degreeTitle: '',
          institution: 'Harvard',
          graduationYear: 2023,
          degreeDocumentId: 'doc-deg'
        })
      ).toThrow(DomainException);
    });
  });

  describe('Pathway B: Degree Audit & AI Clinical Simulation Exam', () => {
    it('should initialize Pathway B under review awaiting AI simulation exam', () => {
      const verification = DietitianVerification.createPathwayB({
        dietitianId: 'dietitian-2',
        degreeTitle: 'B.S. Clinical Nutrition',
        institution: 'UC Davis',
        graduationYear: 2024,
        degreeDocumentId: 'doc-degree-2'
      });

      expect(verification.pathway).toBe(VerificationPathway.PATHWAY_B_DEGREE_EXAM);
      expect(verification.status).toBe(VerificationStatus.UNDER_REVIEW);
      expect(verification.isApprovedForBidding()).toBe(false);
    });

    it('should approve Pathway B when AI clinical score >= 75% AND allergen violations === 0', () => {
      const verification = DietitianVerification.createPathwayB({
        dietitianId: 'dietitian-2',
        degreeTitle: 'B.S. Clinical Nutrition',
        institution: 'UC Davis',
        graduationYear: 2024,
        degreeDocumentId: 'doc-degree-2'
      });

      verification.recordAiSimulationExamResult({
        clinicalScorePercent: 88,
        allergenViolationsCount: 0,
        completedTurns: 5,
        evaluatorNotes: 'Demonstrated exceptional clinical assessment for CKD stage 3 patient'
      });

      expect(verification.status).toBe(VerificationStatus.APPROVED);
      expect(verification.isApprovedForBidding()).toBe(true);
      expect(verification.examScore).toBe(88);
    });

    it('should reject Pathway B if clinical score is below 75%', () => {
      const verification = DietitianVerification.createPathwayB({
        dietitianId: 'dietitian-2',
        degreeTitle: 'B.S. Clinical Nutrition',
        institution: 'UC Davis',
        graduationYear: 2024,
        degreeDocumentId: 'doc-degree-2'
      });

      verification.recordAiSimulationExamResult({
        clinicalScorePercent: 72, // Below 75%
        allergenViolationsCount: 0,
        completedTurns: 5,
        evaluatorNotes: 'Failed macronutrient calculation for diabetic patient'
      });

      expect(verification.status).toBe(VerificationStatus.REJECTED);
      expect(verification.isApprovedForBidding()).toBe(false);
    });

    it('should reject Pathway B if candidate commits ANY allergen violation even with high score (e.g. 90%)', () => {
      const verification = DietitianVerification.createPathwayB({
        dietitianId: 'dietitian-2',
        degreeTitle: 'B.S. Clinical Nutrition',
        institution: 'UC Davis',
        graduationYear: 2024,
        degreeDocumentId: 'doc-degree-2'
      });

      // Score is 92%, but prescribed peanuts to an anaphylactic patient!
      verification.recordAiSimulationExamResult({
        clinicalScorePercent: 92,
        allergenViolationsCount: 1, // Critical safety violation!
        completedTurns: 5,
        evaluatorNotes: 'Severe fatal violation: Included tree nuts in anaphylaxis scenario'
      });

      expect(verification.status).toBe(VerificationStatus.REJECTED);
      expect(verification.isApprovedForBidding()).toBe(false);
    });

    it('should reject if exam had fewer than 5 required clinical turns', () => {
      const verification = DietitianVerification.createPathwayB({
        dietitianId: 'dietitian-2',
        degreeTitle: 'B.S. Clinical Nutrition',
        institution: 'UC Davis',
        graduationYear: 2024,
        degreeDocumentId: 'doc-degree-2'
      });

      expect(() =>
        verification.recordAiSimulationExamResult({
          clinicalScorePercent: 90,
          allergenViolationsCount: 0,
          completedTurns: 3, // Incomplete!
          evaluatorNotes: 'Candidate disconnected'
        })
      ).toThrow(DomainException);
    });
  });
});
