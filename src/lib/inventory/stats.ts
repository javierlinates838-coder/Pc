import type { SavedInventoryPC, InventoryStats } from "@/lib/types/inventory";
import { calculateProfit } from "@/lib/reseller/profit";

const EMPTY_STATS: InventoryStats = {
  totalPCs: 0,
  totalInvested: 0,
  totalRevenue: 0,
  totalEstimatedProfit: 0,
  averageProfitPerPC: 0,
  averageROI: 0,
  bestFlip: null,
  worstFlip: null,
};

export function calculateInventoryStats(pcs: SavedInventoryPC[]): InventoryStats {
  if (pcs.length === 0) {
    return EMPTY_STATS;
  }

  let totalInvested = 0;
  let totalRevenue = 0;
  let totalProfit = 0;
  let totalROI = 0;
  let bestFlip: SavedInventoryPC | null = null;
  let worstFlip: SavedInventoryPC | null = null;
  let bestProfit = -Infinity;
  let worstProfit = Infinity;

  for (const pc of pcs) {
    const profit = calculateProfit(pc.costs);
    totalInvested += profit.totalInvestment;
    totalRevenue += profit.expectedSalePrice;
    totalProfit += profit.estimatedProfit;
    totalROI += profit.roi;

    if (profit.estimatedProfit > bestProfit) {
      bestProfit = profit.estimatedProfit;
      bestFlip = pc;
    }
    if (profit.estimatedProfit < worstProfit) {
      worstProfit = profit.estimatedProfit;
      worstFlip = pc;
    }
  }

  return {
    totalPCs: pcs.length,
    totalInvested,
    totalRevenue,
    totalEstimatedProfit: totalProfit,
    averageProfitPerPC: totalProfit / pcs.length,
    averageROI: totalROI / pcs.length,
    bestFlip,
    worstFlip,
  };
}
