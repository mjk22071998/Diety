import { ConsultationSession } from '../../domain/entities/consultation-session.entity';

/**
 * IConsultationRepositoryPort
 * 
 * Application port for consultation session and WebRTC attendance tracking persistence.
 */
export interface IConsultationRepositoryPort {
  findById(id: string): Promise<ConsultationSession | null>;
  save(session: ConsultationSession): Promise<void>;
}
