import type { BuildPartEntry } from "@/lib/types/components";
import type { ResellerCosts } from "@/lib/types/reseller";
import { estimatePartValue } from "@/lib/pricing/estimator";
import { estimateFlipResale } from "@/lib/flip/resale";
import { compareAllPlatforms } from "@/lib/marketplaces/calculate";

const ASSEMBLY_MISC = 15;

export interface BuildFinancialSummary {
  partsTotal: number;
  costTotal: number;
  listPrice: number;
  profit: number;
  purchasePrice: number;
  netProfitAfterFees: number | null;
  bestPlatformName: string | null;
}

export function getBuildFinancialSummary(
  entries: BuildPartEntry[],
  shippingCost = 20,
  flipCosts?: Partial<ResellerCosts>
): BuildFinancialSummary {
  const partsTotal = entries.reduce(
    (sum, entry) =>
      sum + estimatePartValue(entry.component, entry.condition).mid,
    0
  );

  const costTotal = partsTotal + shippingCost + ASSEMBLY_MISC;
  const resale = estimateFlipResale(entries);
  const listPrice = resale.mid;
  const profit = listPrice - costTotal;

  const purchasePrice = flipCosts?.purchasePrice ?? 0;
  let netProfitAfterFees: number | null = null;
  let bestPlatformName: string | null = null;

  if (purchasePrice > 0) {
    const platforms = compareAllPlatforms({
      salePrice: flipCosts?.targetSellingPrice ?? listPrice,
      purchasePrice,
      repairCosts: flipCosts?.repairCosts ?? 0,
      upgradeCosts: flipCosts?.upgradeCosts ?? 0,
      shippingCost: flipCosts?.shippingCosts ?? shippingCost,
      otherExpenses: flipCosts?.otherExpenses ?? ASSEMBLY_MISC,
    });
    if (platforms[0]) {
      netProfitAfterFees = platforms[0].netProfit;
      bestPlatformName = platforms[0].shortName;
    }
  }

  return {
    partsTotal,
    costTotal,
    listPrice,
    profit,
    purchasePrice,
    netProfitAfterFees,
    bestPlatformName,
  };
}
