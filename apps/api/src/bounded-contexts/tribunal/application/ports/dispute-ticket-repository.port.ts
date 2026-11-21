import { DisputeTicket } from '../../domain/entities/dispute-ticket.entity';

/**
 * IDisputeTicketRepositoryPort
 * 
 * Application port for dispute tickets and tribunal evidence dossiers.
 */
export interface IDisputeTicketRepositoryPort {
  findById(id: string): Promise<DisputeTicket | null>;
  save(ticket: DisputeTicket): Promise<void>;
}
