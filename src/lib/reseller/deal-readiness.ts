import type { ComponentMap } from "@/lib/types/components";
import { getPartCount } from "@/lib/build/helpers";

export interface DealReadinessInput {
  parts: ComponentMap;
  parsedPartCount: number;
  listingPrice: number;
}

export interface MissingPartInfo {
  key: string;
  label: string;
  why: string;
}

export const PC_CHECKLIST: MissingPartInfo[] = [
  { key: "cpu", label: "Processor (CPU)", why: "Needed to know what chip is inside" },
  { key: "gpu", label: "Graphics card (GPU)", why: "Often the most valuable part" },
  { key: "ram", label: "RAM", why: "Usually listed as 8GB, 16GB, 32GB" },
  { key: "storage", label: "Storage (SSD/HDD)", why: "Look for NVMe, SSD, or TB sizes" },
  { key: "motherboard", label: "Motherboard", why: "Sometimes listed as B550, B650, Z790" },
  { key: "psu", label: "Power supply", why: "Often shown as 500W, 650W gold, etc." },
];

export interface DealReadiness {
  hasInput: boolean;
  hasParts: boolean;
  hasPrice: boolean;
  hasCoreComponent: boolean;
  partCount: number;
  /** At least one part detected */
  isMeaningful: boolean;
  /** Enough specs for a trustworthy flip recommendation */
  isComplete: boolean;
  foundParts: { key: string; label: string }[];
  missingParts: MissingPartInfo[];
}

function hasStorage(parts: ComponentMap): boolean {
  return Boolean(parts.storage && parts.storage.length > 0);
}

export function getMissingPcParts(parts: ComponentMap): MissingPartInfo[] {
  const missing: MissingPartInfo[] = [];
  for (const item of PC_CHECKLIST) {
    if (item.key === "storage") {
      if (!hasStorage(parts)) missing.push(item);
    } else if (!parts[item.key as keyof ComponentMap]) {
      missing.push(item);
    }
  }
  return missing;
}

export function getFoundPcParts(parts: ComponentMap): { key: string; label: string }[] {
  const found: { key: string; label: string }[] = [];
  for (const item of PC_CHECKLIST) {
    if (item.key === "storage") {
      if (hasStorage(parts)) {
        found.push({ key: item.key, label: item.label });
      }
    } else if (parts[item.key as keyof ComponentMap]) {
      found.push({ key: item.key, label: item.label });
    }
  }
  if (parts.os) found.push({ key: "os", label: "Windows / OS" });
  if (parts.wifi) found.push({ key: "wifi", label: "WiFi" });
  if (parts.cooler) found.push({ key: "cooler", label: "CPU cooler" });
  if (parts.case) found.push({ key: "case", label: "Case" });
  return found;
}

/** Full flip verdict needs price + GPU or CPU + enough supporting parts */
export function isDealComplete(
  parts: ComponentMap,
  parsedPartCount: number,
  listingPrice: number
): boolean {
  if (listingPrice <= 0 || parsedPartCount < 4) return false;

  const hasGpu = Boolean(parts.gpu);
  const hasCpu = Boolean(parts.cpu);
  if (!hasGpu && !hasCpu) return false;
  if (!parts.ram && !hasStorage(parts)) return false;

  if (hasGpu) {
    const supportCount = parsedPartCount - 1 - (hasCpu ? 1 : 0);
    return supportCount >= 2;
  }

  return hasCpu && parsedPartCount >= 3;
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
  const isComplete = isDealComplete(parts, parsedPartCount, listingPrice);
  const isMeaningful = hasParts;

  return {
    hasInput: true,
    hasParts,
    hasPrice,
    hasCoreComponent,
    partCount,
    isMeaningful,
    isComplete,
    foundParts: getFoundPcParts(parts),
    missingParts: getMissingPcParts(parts),
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
    foundParts: [],
    missingParts: PC_CHECKLIST,
  };
}

export function incompleteListingMessage(
  parsedParts: string[],
  missingParts: MissingPartInfo[]
): string {
  if (parsedParts.length === 0) {
    return "Paste the full ad text — include the processor, graphics card, RAM, storage, and asking price.";
  }
  const missingLabels = missingParts.slice(0, 4).map((m) => m.label);
  return `We only matched ${parsedParts.length} part${parsedParts.length === 1 ? "" : "s"} from this listing. Still missing: ${missingLabels.join(", ")}${missingParts.length > 4 ? ", and more" : ""}. Ask the seller or paste a fuller description before trusting the profit math.`;
}
