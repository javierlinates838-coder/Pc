import type { ComponentMap, PCComponent } from "@/lib/types/components";
import type { ListingHints, ListingParseResult } from "./listing-parser";
import { estimatePartValue } from "@/lib/pricing/estimator";
import { getPartIntel } from "@/lib/database/intel/part-intel";

export interface DealIntelItem {
  severity: "critical" | "warning" | "info" | "positive";
  title: string;
  detail: string;
}

export interface DealIntelligence {
  redFlags: DealIntelItem[];
  strengths: DealIntelItem[];
  inspectionChecklist: string[];
  competitorGaps: string[];
  unparsedLines: string[];
  bestPlatforms: string[];
}

const MINING_GPU_KEYWORDS = ["3060", "3070", "3080", "5700", "580", "1660", "2060"];

export function buildDealIntelligence(
  parts: ComponentMap,
  parseResult: ListingParseResult,
  estimatedResale: number,
  listingPrice: number
): DealIntelligence {
  const redFlags: DealIntelItem[] = [];
  const strengths: DealIntelItem[] = [];
  const checklist: string[] = [];
  const competitorGaps: string[] = [];
  const hints = parseResult.hints;

  if (hints.miningRisk) {
    redFlags.push({
      severity: "critical",
      title: "Mining / farm listing language",
      detail:
        "Verify GPU health (hotspots, artifacting, fan bearings). Competitors rarely flag this — we surface it upfront.",
    });
    checklist.push("Run GPU stress test 15+ min and check hotspot temps");
    checklist.push("Inspect VRAM thermal pads and fan curves");
  }

  if (parts.gpu && MINING_GPU_KEYWORDS.some((k) => parts.gpu!.name.includes(k))) {
    redFlags.push({
      severity: "warning",
      title: "High mining-era GPU model",
      detail: `${parts.gpu.name} — check seller history and thermals before pricing as gaming-ready.`,
    });
  }

  if (hints.noGpuListed && !parts.gpu) {
    redFlags.push({
      severity: "warning",
      title: "No discrete GPU detected",
      detail: "Confirm whether iGPU/APU or missing GPU — affects resale tier sharply.",
    });
  }

  if (hints.missingPsu) {
    redFlags.push({
      severity: "warning",
      title: "PSU not included",
      detail: "Budget $40–$120 for a reliable PSU before listing as complete.",
    });
  }

  if (hints.oemPrebuilt) {
    redFlags.push({
      severity: "info",
      title: "OEM / prebuilt platform",
      detail: "Check proprietary connectors, BIOS limits, and non-standard PSU/case.",
    });
    checklist.push("Verify proprietary PSU pinout or adapter needs");
    checklist.push("Confirm BIOS supports CPU upgrade path");
  }

  if (hints.condition === "parts" || hints.condition === "fair") {
    redFlags.push({
      severity: "critical",
      title: "Parts / fair condition language",
      detail: "Price as parts or heavy discount — don't assume full gaming resale.",
    });
  }

  if (parseResult.unparsedLines.length > 3) {
    redFlags.push({
      severity: "info",
      title: "Unparsed listing lines",
      detail: `Couldn't match: ${parseResult.unparsedLines.slice(0, 3).join("; ")} — verify manually.`,
    });
    competitorGaps.push(
      "PCPartPicker can't parse Facebook shorthand — our scraper expands i5/rtx/16gb tokens"
    );
  }

  if (!parts.cpu) {
    redFlags.push({
      severity: "warning",
      title: "CPU not identified",
      detail: "Ask seller for exact model — prebuilt listings often hide weak CPUs.",
    });
  }

  if (!parts.motherboard && parts.cpu) {
    checklist.push("Confirm motherboard chipset matches CPU (BIOS flash for AM4?)");
  }

  // Part-specific intel — one strength + one caution max per component
  for (const [key, value] of Object.entries(parts)) {
    if (!value) continue;
    const components = Array.isArray(value) ? value : [value];
    for (const c of components) {
      const intel = getPartIntel(c);
      if (intel.strengths[0]) {
        strengths.push({
          severity: "positive",
          title: c.name,
          detail: intel.strengths[0],
        });
      }
      if (intel.redFlags[0]) {
        redFlags.push({
          severity: "warning",
          title: c.name,
          detail: intel.redFlags[0],
        });
      }
    }
  }

  if (parts.gpu) {
    const gv = estimatePartValue(parts.gpu, "used");
    if (gv.mid >= 200) {
      strengths.push({
        severity: "positive",
        title: "Strong GPU anchor",
        detail: `GPU alone ~$${gv.mid} used — protects downside if complete PC priced right.`,
      });
    }
  }

  if (listingPrice > 0 && estimatedResale > listingPrice * 1.2) {
    strengths.push({
      severity: "positive",
      title: "Margin headroom",
      detail: `Resale est. $${estimatedResale} vs ask $${listingPrice} before fees.`,
    });
  }

  if (hints.localPickupOnly) {
    strengths.push({
      severity: "info",
      title: "Local pickup",
      detail: "Sell on FB/Craigslist cash — zero platform fees (beats eBay calculators).",
    });
  }

  // Default inspection checklist
  const defaultChecks = [
    "Boot to BIOS and verify all drives detected",
    "Check RAM speed in BIOS (not stuck at JEDEC)",
    "Listen for coil whine, fan grind, or pump rattle",
    "Verify Windows activation if included",
    "Photograph serials for inventory",
  ];
  for (const c of defaultChecks) {
    if (!checklist.includes(c)) checklist.push(c);
  }

  const bestPlatforms: string[] = [];
  if (estimatedResale >= 800) bestPlatforms.push("eBay shipped", "FB shipped");
  else if (estimatedResale >= 300) bestPlatforms.push("FB local", "hardwareswap", "OfferUp local");
  else bestPlatforms.push("FB local", "Craigslist cash", "OfferUp local");

  return {
    redFlags: dedupeIntel(redFlags).slice(0, 12),
    strengths: dedupeIntel(strengths).slice(0, 8),
    inspectionChecklist: checklist.slice(0, 10),
    competitorGaps: competitorGaps.slice(0, 5),
    unparsedLines: parseResult.unparsedLines,
    bestPlatforms,
  };
}

function dedupeIntel(items: DealIntelItem[]): DealIntelItem[] {
  const seen = new Set<string>();
  return items.filter((i) => {
    const k = `${i.title}:${i.detail}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function getComponentIntelSummary(component: PCComponent): {
  strengths: string[];
  redFlags: string[];
  flipTips: string[];
} {
  return getPartIntel(component);
}
