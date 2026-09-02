import type { ComponentMap } from "@/lib/types/components";
import { getPartCount } from "@/lib/build/helpers";

export interface DealReadinessInput {
  parts: ComponentMap;
  parsedPartCount: number;
  listingPrice: number;
}

export interface DealReadiness {
  hasInput: boolean;
  hasParts: boolean;
  hasPrice: boolean;
  hasCoreComponent: boolean;
  partCount: number;
  /** Enough parts + CPU/GPU + price for profit verdict */
  isMeaningful: boolean;
  /** Ready for full hero, platform table, and eBay comps */
  isComplete: boolean;
}

export function getDealReadiness({
  parts,
  parsedPartCount,
  listingPrice,
}: DealReadinessInput): DealReadiness {
  const partCount = getPartCount(parts);
  const hasCoreComponent = Boolean(parts.cpu || parts.gpu);
  const hasParts = parsedPartCount > 0;
  const hasPrice = listingPrice > 0;
  const isMeaningful =
    hasParts && hasPrice && hasCoreComponent && partCount >= 2;
  const isComplete = isMeaningful;

  return {
    hasInput: true,
    hasParts,
    hasPrice,
    hasCoreComponent,
    partCount,
    isMeaningful,
    isComplete,
  };
}

export function getEmptyDealReadiness(): DealReadiness {
  return {
    hasInput: false,
    hasParts: false,
    hasPrice: false,
    hasCoreComponent: false,
    partCount: 0,
    isMeaningful: false,
    isComplete: false,
  };
}

export function incompleteListingMessage(parsedParts: string[]): string {
  if (parsedParts.length === 0) {
    return "Paste a full listing with CPU, GPU, RAM, storage, and asking price.";
  }
  return `We found ${parsedParts.length} part${parsedParts.length === 1 ? "" : "s"} (${parsedParts.join(", ")}) but need a CPU or GPU plus more specs for a reliable flip verdict. Paste the full ad with processor, graphics card, RAM, and storage.`;
}
