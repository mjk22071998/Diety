import { DietitianLevelProfile } from '../../domain/entities/dietitian-level.entity';

/**
 * IDietitianLevelRepositoryPort
 * 
 * Application port for dietitian reputation profiles, metrics, and disciplinary strikes.
 */
export interface IDietitianLevelRepositoryPort {
  findByDietitianId(dietitianId: string): Promise<DietitianLevelProfile | null>;
  save(profile: DietitianLevelProfile): Promise<void>;
}
