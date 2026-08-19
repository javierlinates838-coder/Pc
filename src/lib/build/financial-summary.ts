import type { BuildPartEntry } from "@/lib/types/components";
import {
  estimateCompletePcValue,
  estimatePartValue,
} from "@/lib/pricing/estimator";

const ASSEMBLY_MISC = 15;

export interface BuildFinancialSummary {
  partsTotal: number;
  costTotal: number;
  listPrice: number;
  profit: number;
}

export function getBuildFinancialSummary(
  entries: BuildPartEntry[],
  shippingCost = 20
): BuildFinancialSummary {
  const partsTotal = entries.reduce(
    (sum, entry) =>
      sum + estimatePartValue(entry.component, entry.condition).mid,
    0
  );

  const costTotal = partsTotal + shippingCost + ASSEMBLY_MISC;
  const resale = estimateCompletePcValue(entries);
  const listPrice = resale.mid;
  const profit = listPrice - costTotal;

  return {
    partsTotal,
    costTotal,
    listPrice,
    profit,
  };
}
