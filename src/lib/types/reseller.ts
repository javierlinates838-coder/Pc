export interface ResellerCosts {
  purchasePrice: number;
  repairCosts: number;
  upgradeCosts: number;
  shippingCosts: number;
  marketplaceFeePercent: number;
  otherExpenses: number;
  targetSellingPrice: number;
}

export interface ProfitAnalysis {
  totalInvestment: number;
  expectedSalePrice: number;
  estimatedFees: number;
  estimatedProfit: number;
  profitPercentage: number;
  roi: number;
  breakEvenPrice: number;
  maxPurchasePrice: number;
}

export type DealRating = "GREAT" | "GOOD" | "FAIR" | "BAD";

export interface DealAnalysis {
  rating: DealRating;
  listingPrice: number;
  estimatedMarketValue: number;
  estimatedResaleValue: number;
  estimatedProfitPotential: number;
  valuableParts: string[];
  weakParts: string[];
  recommendedUpgrades: string[];
  maxPurchasePrice: number;
  suggestedOfferPrice: number;
  parsedParts: string[];
}

export interface UpgradeRecommendation {
  id: string;
  currentPart: string;
  recommendedPart: string;
  upgradeCost: number;
  resaleIncreaseMin: number;
  resaleIncreaseMax: number;
  additionalProfitMin: number;
  additionalProfitMax: number;
  priority: number;
  reason: string;
}

export type ResellerVerdict =
  | "EXCELLENT FLIP"
  | "GOOD FLIP"
  | "MARGINAL FLIP"
  | "PASS";

export interface ResellerRecommendation {
  verdict: ResellerVerdict;
  reasons: string[];
  recommendedUpgrades: UpgradeRecommendation[];
  suggestedPurchasePrice: number;
  targetResaleMin: number;
  targetResaleMax: number;
  estimatedProfitMin: number;
  estimatedProfitMax: number;
}

export interface QualityScoreBreakdown {
  performance: number;
  balance: number;
  upgradeability: number;
  storage: number;
  cooling: number;
  psuQuality: number;
  motherboardQuality: number;
  ram: number;
  gpu: number;
  resaleAppeal: number;
}

export interface BuildQualityScore {
  total: number;
  breakdown: QualityScoreBreakdown;
  explanation: string[];
}

export interface PerformanceEstimate {
  gaming1080p: string;
  gaming1440p: string;
  productivity: string;
  streaming: string;
  ai: string;
  videoEditing: string;
  overallTier: string;
  disclaimer: string;
}

export interface PartValueBreakdown {
  partName: string;
  category: string;
  usedValueMin: number;
  usedValueMax: number;
  condition: string;
}

export interface ValueStrategyComparison {
  partOutValueMin: number;
  partOutValueMax: number;
  completePcValueMin: number;
  completePcValueMax: number;
  betterStrategy: "part-out" | "complete-pc" | "similar";
  explanation: string;
}
