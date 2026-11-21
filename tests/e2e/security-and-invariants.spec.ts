import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { Money } from '../../apps/api/src/bounded-contexts/shared/domain/value-objects/money.vo';
import { Contract, ContractStatus } from '../../apps/api/src/bounded-contexts/escrow/domain/entities/contract.entity';
import { ConsultationSession, ConsultationStatus } from '../../apps/api/src/bounded-contexts/clinical/domain/entities/consultation-session.entity';
import { DietitianLevelProfile, DietitianTier } from '../../apps/api/src/bounded-contexts/reputation/domain/entities/dietitian-level.entity';
import { DomainException } from '../../apps/api/src/bounded-contexts/shared/domain/exceptions/domain.exception';

test.describe('Phase 8: Architectural & Security Invariant Automated Audit Gate', () => {

  test('Invariant 1: Hexagonal Dependency Inversion (Zero IO imports in domain layer)', async () => {
    const domainBaseDir = path.resolve(__dirname, '../../apps/api/src/bounded-contexts');
    const prohibitedImports = [
      '@nestjs',
      '@prisma',
      'ioredis',
      'minio',
      'bullmq',
      'socket.io',
      'express',
      'axios',
      'fs',
      'net'
    ];

    const violations: { file: string; line: string }[] = [];

    function scanDir(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scanDir(fullPath);
        } else if (entry.isFile() && (entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts'))) {
          // Only check domain folders
          if (fullPath.includes(`${path.sep}domain${path.sep}`)) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const lines = content.split('\n');
            lines.forEach((line, index) => {
              if (line.trim().startsWith('import') || line.trim().startsWith('export * from')) {
                for (const prohibited of prohibitedImports) {
                  if (line.includes(`'${prohibited}`) || line.includes(`"${prohibited}`)) {
                    violations.push({
                      file: fullPath,
                      line: `L${index + 1}: ${line.trim()}`
                    });
                  }
                }
              }
            });
          }
        }
      }
    }

    scanDir(domainBaseDir);
    expect(violations).toEqual([]);
  });

  test('Invariant 2: Exact Integer Financial Balance Invariant (No float drift)', async () => {
    // Exact cent equality: Total == Fee + Net
    const total = Money.fromDollars(100, 'USD'); // $100.00 = 10000 cents
    const startedAt = new Date(Date.now() - 100000);
    const targetDeliveryDate = new Date(Date.now() + 100000);

    const contract = Contract.create({
      id: 'c-test-01',
      proposalId: 'p-test-01',
      dietitianId: 'd-test-01',
      clientId: 'cl-test-01',
      totalAmount: total,
      platformFeePercent: 15, // 15% -> 1500 cents
      requiredConsultations: 1,
      startedAt,
      targetDeliveryDate
    });

    expect(contract.totalAmount.cents).toBe(10000);
    expect(contract.platformFee.cents).toBe(1500);
    expect(contract.netEarnings.cents).toBe(8500);
    expect(contract.totalAmount.cents).toBe(contract.platformFee.cents + contract.netEarnings.cents);

    // Negative values must be rejected
    expect(() => Money.fromCents(-100, 'USD')).toThrow(DomainException);
  });

  test('Invariant 3: Double Disbursement Race Protection Invariant', async () => {
    const contract = Contract.create({
      id: 'c-test-race',
      proposalId: 'p-test-race',
      dietitianId: 'd-test-race',
      clientId: 'cl-test-race',
      totalAmount: Money.fromDollars(200, 'USD'),
      platformFeePercent: 15,
      requiredConsultations: 1,
      startedAt: new Date(Date.now() - 100000),
      targetDeliveryDate: new Date(Date.now() - 1000)
    });

    contract.lockEscrow('ch_123');
    contract.startSecurityClearing();
    contract.completeDisbursement();

    expect(contract.status).toBe(ContractStatus.COMPLETED);

    // Attempting duplicate disbursement must be rejected by aggregate invariant
    expect(() => contract.completeDisbursement()).toThrow(DomainException);
    expect(() => contract.startSecurityClearing()).toThrow(DomainException);
  });

  test('Invariant 4: Attendance Verification Gate (<15m presence strictly rejected)', async () => {
    const session = ConsultationSession.create({
      id: 'session-short',
      contractId: 'c-short',
      dietitianId: 'd-short',
      clientId: 'cl-short',
      scheduledAt: new Date(),
      durationMinutes: 30
    });

    // Only 840 seconds recorded = 14 minutes (1 minute short of 15m threshold of 900s)
    session.recordPresence('d-short', 840);
    session.recordPresence('cl-short', 840);

    session.evaluateAttendance();
    expect(session.isVerified()).toBe(false);
    expect(session.status).not.toBe(ConsultationStatus.VERIFIED);

    // Record additional 60 seconds (1 minute) to hit 900s (15 minutes)
    session.recordPresence('d-short', 60);
    session.recordPresence('cl-short', 60);
    session.evaluateAttendance();
    expect(session.isVerified()).toBe(true);
    expect(session.status).toBe(ConsultationStatus.VERIFIED);
  });

  test('Invariant 5: Three-Strike Disciplinary Permanent Ban Invariant', async () => {
    const profile = DietitianLevelProfile.create({
      dietitianId: 'd-banned-001',
      tier: DietitianTier.NEW
    });

    profile.applyStrike('Violation 1: Missed consultation');
    expect(profile.strikesCount).toBe(1);
    expect(profile.isBiddingSuspended).toBe(false);

    profile.applyStrike('Violation 2: Late meal plan');
    expect(profile.strikesCount).toBe(2);
    expect(profile.tier).toBe(DietitianTier.NEW);
    expect(profile.isBiddingSuspended).toBe(false);

    // Third strike triggers permanent suspension / ban
    profile.applyStrike('Violation 3: Severe malpractice complaint');
    expect(profile.strikesCount).toBe(3);
    expect(profile.isBiddingSuspended).toBe(true);
    expect(profile.maxActiveProposals).toBe(0);
  });
});
