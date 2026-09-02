import type { BuildPartEntry } from "@/lib/types/components";
import {
  estimateCompletePcValue,
  sumPartOutValue,
} from "@/lib/pricing/estimator";

export type ResaleSource = "local" | "ebay" | "blend";

export interface ResaleValuation {
  resaleMid: number;
  resaleMin: number;
  resaleMax: number;
  localMid: number;
  partOutMid: number;
  ebayMedian?: number;
  source: ResaleSource;
  sourceLabel: string;
}

export function resolveResaleValuation(
  entries: BuildPartEntry[],
  ebayMedian?: number | null,
  ebayListingCount = 0
): ResaleValuation {
  const local = estimateCompletePcValue(entries);
  const partOut = sumPartOutValue(entries);
  const localMid = local.mid;

  if (ebayMedian && ebayMedian > 0 && ebayListingCount >= 3) {
    const targetFromEbay = Math.round(ebayMedian * 0.96);

    if (targetFromEbay > localMid * 1.12) {
      return {
        resaleMid: targetFromEbay,
        resaleMin: Math.round(ebayMedian * 0.85),
        resaleMax: Math.round(ebayMedian * 1.05),
        localMid,
        partOutMid: partOut.mid,
        ebayMedian,
        source: "ebay",
        sourceLabel: `Based on eBay median (${ebayListingCount} listings)`,
      };
    }

    const blended = Math.round(localMid * 0.35 + targetFromEbay * 0.65);
    return {
      resaleMid: blended,
      resaleMin: Math.min(local.min, Math.round(ebayMedian * 0.85)),
      resaleMax: Math.max(local.max, Math.round(ebayMedian * 1.02)),
      localMid,
      partOutMid: partOut.mid,
      ebayMedian,
      source: "blend",
      sourceLabel: "Blend of parts database + eBay median",
    };
  }

  return {
    resaleMid: localMid,
    resaleMin: local.min,
    resaleMax: local.max,
    localMid,
    partOutMid: partOut.mid,
    source: "local",
    sourceLabel: "Based on matched parts in our database",
  };
}
