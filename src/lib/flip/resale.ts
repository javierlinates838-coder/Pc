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
    min: market.min,
    max: market.max,
    mid: market.mid,
    marketMid: market.mid,
  };
}
