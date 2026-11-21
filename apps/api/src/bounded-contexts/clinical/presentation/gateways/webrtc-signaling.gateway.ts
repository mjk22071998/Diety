import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AttendanceAccumulatorService } from '../../application/services/attendance-accumulator.service';

export interface JoinRoomPayload {
  sessionId: string;
  participantId: string;
}

export interface SignalPayload {
  sessionId: string;
  payload: any;
}

export interface HeartbeatPayload {
  sessionId: string;
  participantId: string;
}

/**
 * WebRtcSignalingGateway
 * 
 * Socket.io WebRTC signaling gateway:
 * - Manages peer discovery and session room isolation.
 * - Relays SDP offers, answers, and ICE candidates between clients and dietitians.
 * - Receives 10-second presence heartbeats and notifies clients upon mutual 15m verification.
 */
@WebSocketGateway({
  namespace: '/signaling',
  cors: { origin: '*' }
})
export class WebRtcSignalingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  public server!: Server;

  constructor(private readonly attendanceService: AttendanceAccumulatorService) {}

  public handleConnection(client: Socket): void {
    client.emit('connected', { socketId: client.id, timestamp: Date.now() });
  }

  public handleDisconnect(client: Socket): void {
    // Notify room if client was registered to a session
    const room = (client as any).currentRoom;
    if (room) {
      client.to(room).emit('peer-disconnected', { socketId: client.id });
    }
  }

  @SubscribeMessage('join-room')
  public handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinRoomPayload
  ): { joined: boolean; room: string } {
    const room = `session:${data.sessionId}`;
    client.join(room);
    (client as any).currentRoom = room;

    client.to(room).emit('peer-joined', {
      socketId: client.id,
      participantId: data.participantId
    });

    return { joined: true, room };
  }

  @SubscribeMessage('signal-offer')
  public handleOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SignalPayload
  ): void {
    const room = `session:${data.sessionId}`;
    client.to(room).emit('signal-offer', data.payload);
  }

  @SubscribeMessage('signal-answer')
  public handleAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SignalPayload
  ): void {
    const room = `session:${data.sessionId}`;
    client.to(room).emit('signal-answer', data.payload);
  }

  @SubscribeMessage('ice-candidate')
  public handleIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SignalPayload
  ): void {
    const room = `session:${data.sessionId}`;
    client.to(room).emit('ice-candidate', data.payload);
  }

  @SubscribeMessage('heartbeat')
  public async handleHeartbeat(
    @ConnectedSocket() _client: Socket,
    @MessageBody() data: HeartbeatPayload
  ): Promise<{ acknowledged: boolean; isVerified: boolean }> {
    const result = await this.attendanceService.processHeartbeat(
      data.sessionId,
      data.participantId
    );

    const room = `session:${data.sessionId}`;

    if (result.isVerified) {
      this.server.to(room).emit('session-verified', {
        sessionId: data.sessionId,
        mutualAttendanceMinutes: result.mutualAttendanceMinutes
      });
    }

    return { acknowledged: true, isVerified: result.isVerified };
  }
}
