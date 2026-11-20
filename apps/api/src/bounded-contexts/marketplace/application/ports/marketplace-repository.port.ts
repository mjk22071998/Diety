export interface RequirementSummary {
  id: string;
  status: string;
  isLocked: boolean;
}

export interface CreateProposalData {
  id: string;
  requirementId: string;
  dietitianId: string;
  bidAmountCents: number;
  coverLetter: string;
}

export interface IMarketplaceRepositoryPort {
  findRequirementById(id: string): Promise<RequirementSummary | null>;
  countActiveProposalsByDietitian(dietitianId: string): Promise<number>;
  createProposal(data: CreateProposalData): Promise<void>;
}
