import { describe, it, expect } from 'vitest';
import {
  ConsultationSession,
  ConsultationStatus
} from '../../../src/bounded-contexts/clinical/domain/entities/consultation-session.entity';
import { DomainException } from '../../../src/bounded-contexts/shared/domain/exceptions/domain.exception';

describe('Task 2.5: Clinical Consultation & Attendance Invariant Aggregate (Pure TDD)', () => {
  const createBaseSession = () =>
    ConsultationSession.create({
      id: 'session-101',
      contractId: 'contract-1',
      dietitianId: 'dietitian-1',
      clientId: 'client-1',
      scheduledAt: new Date('2026-11-21T14:00:00Z'),
      durationMinutes: 45
    });

  describe('Session Lifecycle & Attendance Verification', () => {
    it('should initialize consultation in SCHEDULED state with 0 attendance minutes', () => {
      const session = createBaseSession();
      expect(session.id).toBe('session-101');
      expect(session.status).toBe(ConsultationStatus.SCHEDULED);
      expect(session.mutualAttendanceMinutes).toBe(0);
      expect(session.isVerified()).toBe(false);
    });

    it('should transition to IN_PROGRESS when first participant connects', () => {
      const session = createBaseSession();
      session.recordPresence('dietitian-1', 60); // 1 minute
      expect(session.status).toBe(ConsultationStatus.IN_PROGRESS);
    });

    it('should accumulate mutual attendance only when both participants are present', () => {
      const session = createBaseSession();
      // Dietitian was present for 20 mins
      session.recordPresence('dietitian-1', 1200);
      // Client was present for 10 mins
      session.recordPresence('client-1', 600);

      // Mutual attendance is min(1200, 600) = 600 seconds = 10 minutes
      expect(session.mutualAttendanceMinutes).toBe(10);
      expect(session.isVerified()).toBe(false); // < 15 mins
    });

    it('should verify consultation when mutual presence reaches or exceeds 15 minutes', () => {
      const session = createBaseSession();
      // Both present for 18 minutes (1080 seconds)
      session.recordPresence('dietitian-1', 1080);
      session.recordPresence('client-1', 1080);

      session.evaluateAttendance();
      expect(session.mutualAttendanceMinutes).toBe(18);
      expect(session.status).toBe(ConsultationStatus.VERIFIED);
      expect(session.isVerified()).toBe(true);
    });
    it('should throw DomainException if session creation props are invalid', () => {
      expect(() =>
        ConsultationSession.create({
          id: '',
          contractId: 'c-1',
          dietitianId: 'd-1',
          clientId: 'u-1',
          scheduledAt: new Date(),
          durationMinutes: 45
        })
      ).toThrow(DomainException);

      expect(() =>
        ConsultationSession.create({
          id: 's-1',
          contractId: 'c-1',
          dietitianId: 'd-1',
          clientId: 'u-1',
          scheduledAt: new Date(),
          durationMinutes: 0
        })
      ).toThrow(DomainException);
    });

    it('should throw DomainException if recording invalid presence seconds or unknown participant', () => {
      const session = createBaseSession();
      expect(() => session.recordPresence('dietitian-1', -10)).toThrow(DomainException);
      expect(() => session.recordPresence('stranger-99', 60)).toThrow(DomainException);
    });

    it('should throw DomainException if claiming client no-show when client was actually present', () => {
      const session = createBaseSession();
      session.recordPresence('dietitian-1', 1000);
      session.recordPresence('client-1', 400); // 400s >= 300s grace period!

      expect(() => session.claimClientNoShow()).toThrow(DomainException);
    });

    it('should throw DomainException if claiming dietitian no-show when dietitian was actually present', () => {
      const session = createBaseSession();
      session.recordPresence('client-1', 1000);
      session.recordPresence('dietitian-1', 400); // 400s >= 300s grace period!

      expect(() => session.claimDietitianNoShow()).toThrow(DomainException);
    });
  });

  describe('No-Show Invariant Enforcements', () => {
    it('should allow Dietitian to mark CLIENT_NO_SHOW only if Dietitian waited at least 15 minutes', () => {
      const session = createBaseSession();
      // Dietitian waited 16 minutes (960s), client never showed (0s)
      session.recordPresence('dietitian-1', 960);

      session.claimClientNoShow();
      expect(session.status).toBe(ConsultationStatus.CLIENT_NO_SHOW);
      expect(session.isVerified()).toBe(false);
    });

    it('should REJECT CLIENT_NO_SHOW claim if Dietitian waited less than 15 minutes', () => {
      const session = createBaseSession();
      // Dietitian only logged in for 5 minutes (300s)
      session.recordPresence('dietitian-1', 300);

      expect(() => session.claimClientNoShow()).toThrow(DomainException);
    });

    it('should mark DIETITIAN_NO_SHOW if Client waited >= 15 minutes and Dietitian was absent', () => {
      const session = createBaseSession();
      // Client waited 15 minutes (900s), Dietitian was absent (0s)
      session.recordPresence('client-1', 900);

      session.claimDietitianNoShow();
      expect(session.status).toBe(ConsultationStatus.DIETITIAN_NO_SHOW);
      expect(session.isVerified()).toBe(false);
    });

    it('should reject no-show claims on an already verified session', () => {
      const session = createBaseSession();
      session.recordPresence('dietitian-1', 1200);
      session.recordPresence('client-1', 1200);
      session.evaluateAttendance();

      expect(() => session.claimClientNoShow()).toThrow(DomainException);
      expect(() => session.claimDietitianNoShow()).toThrow(DomainException);
    });
  });
});
