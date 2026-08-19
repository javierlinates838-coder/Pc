import type { MarketplaceId } from "./platforms";
import { MARKETPLACE_PROFILES } from "./platforms";

export interface PlatformProfitInput {
  salePrice: number;
  purchasePrice: number;
  repairCosts?: number;
  upgradeCosts?: number;
  shippingCost?: number;
  otherExpenses?: number;
}

export interface PlatformProfitResult {
  marketplaceId: MarketplaceId;
  name: string;
  shortName: string;
  grossSale: number;
  totalFees: number;
  feeBreakdown: string;
  netProfit: number;
  roiPercent: number;
  marginPercent: number;
  breakEvenPrice: number;
  rank: number;
}

export function calculateSaleFees(
  salePrice: number,
  marketplaceId: MarketplaceId
): { total: number; breakdown: string } {
  const profile = MARKETPLACE_PROFILES.find((p) => p.id === marketplaceId)!;
  const platform =
    salePrice * (profile.platformFeePercent / 100) + profile.platformFeeFlat;
  const payment =
    salePrice * (profile.paymentProcessingPercent / 100) +
    profile.paymentProcessingFlat;
  const total = Math.round((platform + payment) * 100) / 100;
  const parts: string[] = [];
  if (profile.platformFeePercent > 0 || profile.platformFeeFlat > 0) {
    parts.push(
      `Platform ${profile.platformFeePercent}% + $${profile.platformFeeFlat}`
    );
  }
  if (profile.paymentProcessingPercent > 0 || profile.paymentProcessingFlat > 0) {
    parts.push(
      `Pay ${profile.paymentProcessingPercent}% + $${profile.paymentProcessingFlat}`
    );
  }
  if (parts.length === 0) parts.push("No platform fees");
  return { total, breakdown: parts.join(" · ") };
}

export function calculatePlatformProfit(
  input: PlatformProfitInput,
  marketplaceId: MarketplaceId
): Omit<PlatformProfitResult, "rank"> {
  const {
    salePrice,
    purchasePrice,
    repairCosts = 0,
    upgradeCosts = 0,
    shippingCost = 0,
    otherExpenses = 0,
  } = input;

  const investment =
    purchasePrice + repairCosts + upgradeCosts + shippingCost + otherExpenses;
  const { total: totalFees, breakdown } = calculateSaleFees(salePrice, marketplaceId);
  const netProfit = Math.round((salePrice - totalFees - investment) * 100) / 100;
  const roiPercent =
    investment > 0 ? Math.round((netProfit / investment) * 10000) / 100 : 0;
  const marginPercent =
    salePrice > 0 ? Math.round((netProfit / salePrice) * 10000) / 100 : 0;
  const breakEvenPrice =
    Math.round((investment + totalFees) * 100) / 100;

  const profile = MARKETPLACE_PROFILES.find((p) => p.id === marketplaceId)!;

  return {
    marketplaceId,
    name: profile.name,
    shortName: profile.shortName,
    grossSale: salePrice,
    totalFees,
    feeBreakdown: breakdown,
    netProfit,
    roiPercent,
    marginPercent,
    breakEvenPrice,
  };
}

export function compareAllPlatforms(input: PlatformProfitInput): PlatformProfitResult[] {
  const results = MARKETPLACE_PROFILES.map((p) =>
    calculatePlatformProfit(input, p.id)
  );

  const sorted = [...results].sort((a, b) => b.netProfit - a.netProfit);
  return sorted.map((r, i) => ({ ...r, rank: i + 1 }));
}

export function getBestPlatform(input: PlatformProfitInput): PlatformProfitResult {
  return compareAllPlatforms(input)[0];
}
