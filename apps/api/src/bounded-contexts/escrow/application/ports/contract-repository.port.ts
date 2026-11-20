import { Contract } from '../../domain/entities/contract.entity';

/**
 * IContractRepositoryPort
 * 
 * Application port defining persistence operations for contracts & escrow ledgers.
 */
export interface IContractRepositoryPort {
  findById(id: string): Promise<Contract | null>;
  save(contract: Contract): Promise<void>;
  updateContractWithLedger(contract: Contract): Promise<void>;
}
