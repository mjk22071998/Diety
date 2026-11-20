import { DietitianVerification } from '../../domain/entities/dietitian-verification.entity';

/**
 * IDietitianVerificationRepositoryPort
 * 
 * Application port for dietitian credential and verification state persistence.
 */
export interface IDietitianVerificationRepositoryPort {
  findById(id: string): Promise<DietitianVerification | null>;
  save(verification: DietitianVerification): Promise<void>;
}
