import { IConsultationRepositoryPort } from '../ports/consultation-repository.port';
import { DomainException } from '../../../shared/domain/exceptions/domain.exception';

export interface HeartbeatResult {
  sessionId: string;
  participantId: string;
  creditedSeconds: number;
  mutualAttendanceMinutes: number;
  isVerified: boolean;
}

/**
 * AttendanceAccumulatorService
 * 
 * Verifies live participant presence during encrypted WebRTC video calls:
 * - Ingests 10-second client/dietitian heartbeats.
 * - Anti-fraud damping: clamps anomalous heartbeat deltas (>15s) to prevent presence inflation.
 * - Triggers attendance evaluation upon reaching the 15-minute mutual verification threshold.
 */
export class AttendanceAccumulatorService {
  private readonly lastHeartbeatTimestamps = new Map<string, number>();

  constructor(private readonly consultationRepo: IConsultationRepositoryPort) {}

  public async processHeartbeat(sessionId: string, participantId: string): Promise<HeartbeatResult> {
    const session = await this.consultationRepo.findById(sessionId);
    if (!session) {
      throw new DomainException(`Consultation session '${sessionId}' not found`, 'SESSION_NOT_FOUND');
    }

    const key = `${sessionId}:${participantId}`;
    const now = Date.now();
    const lastTime = this.lastHeartbeatTimestamps.get(key);
    this.lastHeartbeatTimestamps.set(key, now);

    let creditedSeconds = 10; // Default nominal 10-second heartbeat
    if (lastTime) {
      const elapsed = Math.floor((now - lastTime) / 1000);
      if (elapsed > 0 && elapsed <= 15) {
        creditedSeconds = elapsed;
      } else if (elapsed > 15) {
        creditedSeconds = 10; // Clamp suspicious gap to standard 10s
      }
    }

    session.recordPresence(participantId, creditedSeconds);
    session.evaluateAttendance();

    await this.consultationRepo.save(session);

    return {
      sessionId: session.id,
      participantId,
      creditedSeconds,
      mutualAttendanceMinutes: session.mutualAttendanceMinutes,
      isVerified: session.isVerified()
    };
  }

  public clearSession(sessionId: string): void {
    for (const key of this.lastHeartbeatTimestamps.keys()) {
      if (key.startsWith(`${sessionId}:`)) {
        this.lastHeartbeatTimestamps.delete(key);
      }
    }
  }
}
