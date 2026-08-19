import type { BuildPartEntry } from "@/lib/types/components";
import { estimateCompletePcValue } from "@/lib/pricing/estimator";

/** Shared resale estimate used by Deal, Build, and Profit */
export function estimateFlipResale(entries: BuildPartEntry[]): {
  min: number;
  max: number;
  mid: number;
  marketMid: number;
} {
  const market = estimateCompletePcValue(entries);
  return {
    min: Math.round(market.min * 1.05),
    max: Math.round(market.max * 1.1),
    mid: Math.round(market.mid * 1.08),
    marketMid: market.mid,
  };
}
