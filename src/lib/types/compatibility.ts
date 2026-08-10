export type CompatibilityStatus = "compatible" | "warning" | "incompatible";

export interface CompatibilityResult {
  id: string;
  status: CompatibilityStatus;
  title: string;
  message: string;
  category: string;
  partsInvolved: string[];
}

export interface CompatibilityReport {
  results: CompatibilityResult[];
  overallStatus: CompatibilityStatus;
  compatibleCount: number;
  warningCount: number;
  incompatibleCount: number;
}
