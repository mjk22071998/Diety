import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AttendanceAccumulatorService } from '../../../src/bounded-contexts/clinical/application/services/attendance-accumulator.service';
import { WebRtcSignalingGateway } from '../../../src/bounded-contexts/clinical/presentation/gateways/webrtc-signaling.gateway';
import { IConsultationRepositoryPort } from '../../../src/bounded-contexts/clinical/application/ports/consultation-repository.port';
import { ConsultationSession, ConsultationStatus } from '../../../src/bounded-contexts/clinical/domain/entities/consultation-session.entity';
import { DomainException } from '../../../src/bounded-contexts/shared/domain/exceptions/domain.exception';
import { Server, Socket } from 'socket.io';

describe('Task 4.3: WebRTC Signaling Gateway & Attendance Accumulator (Pure TDD)', () => {
  let mockConsultationRepo: IConsultationRepositoryPort;
  let attendanceService: AttendanceAccumulatorService;
  let gateway: WebRtcSignalingGateway;
  let mockServer: Server;
  let mockSocket: Socket;

  const createBaseSession = (): ConsultationSession => {
    return ConsultationSession.create({
      id: 'session-webrtc-1',
      contractId: 'contract-1',
      dietitianId: 'dietitian-1',
      clientId: 'client-1',
      scheduledAt: new Date(),
      durationMinutes: 45
    });
  };

  beforeEach(() => {
    mockConsultationRepo = {
      findById: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined)
    };

    attendanceService = new AttendanceAccumulatorService(mockConsultationRepo);
    gateway = new WebRtcSignalingGateway(attendanceService);

    mockServer = {
      to: vi.fn().mockReturnValue({
        emit: vi.fn()
      })
    } as unknown as Server;
    gateway.server = mockServer;

    mockSocket = {
      id: 'socket-client-123',
      join: vi.fn(),
      to: vi.fn().mockReturnValue({
        emit: vi.fn()
      }),
      emit: vi.fn()
    } as unknown as Socket;
  });

  describe('AttendanceAccumulatorService', () => {
    it('should credit nominal 10s presence on first heartbeat', async () => {
      const session = createBaseSession();
      (mockConsultationRepo.findById as any).mockResolvedValue(session);

      const result = await attendanceService.processHeartbeat('session-webrtc-1', 'dietitian-1');

      expect(result.creditedSeconds).toBe(10);
      expect(result.isVerified).toBe(false);
      expect(session.dietitianPresenceSeconds).toBe(10);
      expect(mockConsultationRepo.save).toHaveBeenCalledWith(session);
    });

    it('should calculate actual elapsed seconds for subsequent regular heartbeats', async () => {
      const session = createBaseSession();
      (mockConsultationRepo.findById as any).mockResolvedValue(session);

      // First heartbeat
      await attendanceService.processHeartbeat('session-webrtc-1', 'dietitian-1');

      // Second heartbeat
      const result = await attendanceService.processHeartbeat('session-webrtc-1', 'dietitian-1');
      expect(result.creditedSeconds).toBeGreaterThan(0);
      expect(result.creditedSeconds).toBeLessThanOrEqual(15);
    });

    it('should verify session when both dietitian and client reach 15 minutes (900s)', async () => {
      const session = createBaseSession();
      // Pre-seed 890s of mutual presence
      session.recordPresence('dietitian-1', 890);
      session.recordPresence('client-1', 890);
      (mockConsultationRepo.findById as any).mockResolvedValue(session);

      // Client sends heartbeat adding 10s -> 900s reached!
      const clientResult = await attendanceService.processHeartbeat('session-webrtc-1', 'client-1');
      expect(clientResult.isVerified).toBe(false); // Dietitian not yet at 900

      // Dietitian sends heartbeat adding 10s -> both at 900s -> VERIFIED!
      const dietitianResult = await attendanceService.processHeartbeat('session-webrtc-1', 'dietitian-1');
      expect(dietitianResult.isVerified).toBe(true);
      expect(session.isVerified()).toBe(true);
      expect(session.status).toBe(ConsultationStatus.VERIFIED);
    });

    it('should throw DomainException if session is not found', async () => {
      (mockConsultationRepo.findById as any).mockResolvedValue(null);

      await expect(
        attendanceService.processHeartbeat('non-existent-session', 'user-1')
      ).rejects.toThrow(DomainException);
    });

    it('should clamp anomalous gaps greater than 15s to default 10s', async () => {
      const session = createBaseSession();
      (mockConsultationRepo.findById as any).mockResolvedValue(session);

      await attendanceService.processHeartbeat('session-webrtc-1', 'client-1');

      // Mock Date.now to 30 seconds later
      const originalNow = Date.now;
      Date.now = vi.fn().mockReturnValue(originalNow() + 30000);

      const result = await attendanceService.processHeartbeat('session-webrtc-1', 'client-1');
      expect(result.creditedSeconds).toBe(10); // Clamped

      Date.now = originalNow;
    });

    it('should clear session heartbeat cache', async () => {
      const session = createBaseSession();
      (mockConsultationRepo.findById as any).mockResolvedValue(session);
      await attendanceService.processHeartbeat('session-webrtc-1', 'client-1');

      attendanceService.clearSession('session-webrtc-1');

      // Subsequent heartbeat should act like first heartbeat (nominal 10s)
      const result = await attendanceService.processHeartbeat('session-webrtc-1', 'client-1');
      expect(result.creditedSeconds).toBe(10);
    });
  });

  describe('WebRtcSignalingGateway', () => {
    it('should handle client connection and emit connected ack', () => {
      gateway.handleConnection(mockSocket);
      expect(mockSocket.emit).toHaveBeenCalledWith('connected', expect.objectContaining({
        socketId: 'socket-client-123'
      }));
    });

    it('should notify room on disconnect if client was in a session', () => {
      (mockSocket as any).currentRoom = 'session:123';
      gateway.handleDisconnect(mockSocket);
      expect(mockSocket.to).toHaveBeenCalledWith('session:123');
    });

    it('should join socket to room and broadcast peer-joined', () => {
      const result = gateway.handleJoinRoom(mockSocket, {
        sessionId: 'session-xyz',
        participantId: 'dietitian-1'
      });

      expect(result.joined).toBe(true);
      expect(result.room).toBe('session:session-xyz');
      expect(mockSocket.join).toHaveBeenCalledWith('session:session-xyz');
      expect(mockSocket.to).toHaveBeenCalledWith('session:session-xyz');
    });

    it('should relay signal-offer, signal-answer, and ice-candidate to room', () => {
      gateway.handleOffer(mockSocket, {
        sessionId: 'session-xyz',
        payload: { sdp: 'v=0...' }
      });
      expect(mockSocket.to).toHaveBeenCalledWith('session:session-xyz');

      gateway.handleAnswer(mockSocket, {
        sessionId: 'session-xyz',
        payload: { sdp: 'v=0...' }
      });
      expect(mockSocket.to).toHaveBeenCalledWith('session:session-xyz');

      gateway.handleIceCandidate(mockSocket, {
        sessionId: 'session-xyz',
        payload: { candidate: 'candidate:1...' }
      });
      expect(mockSocket.to).toHaveBeenCalledWith('session:session-xyz');
    });

    it('should process heartbeat and emit session-verified when attendance threshold met', async () => {
      vi.spyOn(attendanceService, 'processHeartbeat').mockResolvedValue({
        sessionId: 'session-xyz',
        participantId: 'client-1',
        creditedSeconds: 10,
        mutualAttendanceMinutes: 15,
        isVerified: true
      });

      const response = await gateway.handleHeartbeat(mockSocket, {
        sessionId: 'session-xyz',
        participantId: 'client-1'
      });

      expect(response.acknowledged).toBe(true);
      expect(response.isVerified).toBe(true);
      expect(mockServer.to).toHaveBeenCalledWith('session:session-xyz');
    });
  });
});
