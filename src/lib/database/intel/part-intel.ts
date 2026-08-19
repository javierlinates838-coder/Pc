import type { PCComponent } from "@/lib/types/components";

export interface PartIntel {
  strengths: string[];
  redFlags: string[];
  flipTips: string[];
  marketNotes: string[];
}

const TAG_INTEL: Record<string, Partial<PartIntel>> = {
  "mining-risk": {
    redFlags: ["Historically mined — demand stress test and temp proof"],
    flipTips: ["Price 10–20% below clean comps if no test data"],
  },
  "budget": {
    flipTips: ["Strong volume on FB Marketplace local cash"],
    marketNotes: ["Budget tier — buyers compare to new entry GPUs"],
  },
  "oem": {
    redFlags: ["OEM parts may use proprietary connectors"],
    flipTips: ["Photograph model numbers — buyers search exact SKUs"],
  },
  "prebuilt": {
    redFlags: ["Prebuilt PSU/case may limit upgrades"],
    flipTips: ["List CPU+GPU prominently — hide weak OEM board unless disclosed"],
  },
  "upgrade-candidate": {
    flipTips: ["Bundle upgrade quote in listing to increase perceived value"],
    strengths: ["Easy flip angle: 'upgrade ready'"],
  },
  weak: {
    redFlags: ["Weak component drags complete-PC resale"],
    flipTips: ["Consider part-out if upgrade cost exceeds margin"],
  },
  slow: {
    redFlags: ["Slow RAM or HDD hurts buyer perception"],
    flipTips: ["Swap to NVMe + 16GB before listing for max ROI"],
  },
  "3d-vcache": {
    strengths: ["Gaming CPU with outsized resale demand"],
    marketNotes: ["Enthusiast buyers pay premium on HWSwap/eBay"],
  },
  popular: {
    strengths: ["High search volume — price aggressively to sell fast"],
  },
  enthusiast: {
    marketNotes: ["Longer sell time — target eBay/HWSwap not local"],
  },
};

const CATEGORY_DEFAULTS: Record<string, PartIntel> = {
  cpu: {
    flipTips: ["List exact model — 'i5' alone loses buyer trust"],
    marketNotes: ["Match socket to motherboard in title for search"],
    strengths: [],
    redFlags: [],
  },
  gpu: {
    flipTips: ["Include VRAM, never just 'RTX' — specify 3060 12GB vs 8GB"],
    redFlags: ["Run artifact and hotspot test before listing"],
    strengths: [],
    marketNotes: [],
  },
  motherboard: {
    flipTips: ["Note WiFi/BT and M.2 count — buyers filter on these"],
    strengths: [],
    redFlags: [],
    marketNotes: [],
  },
  ram: {
    flipTips: ["State speed + capacity (e.g. 32GB DDR4-3600)"],
    strengths: [],
    redFlags: [],
    marketNotes: [],
  },
  storage: {
    flipTips: ["NVMe boot drive is minimum for gaming resale in 2026"],
    strengths: [],
    redFlags: [],
    marketNotes: [],
  },
  psu: {
    redFlags: ["Generic PSU is liability — disclose tier or replace"],
    flipTips: ["80+ Gold name-brand PSU adds $30–$50 perceived value"],
    strengths: [],
    marketNotes: [],
  },
  cooler: {
    flipTips: ["State height for case clearance in SFF builds"],
    strengths: [],
    redFlags: [],
    marketNotes: [],
  },
  case: {
    flipTips: ["Show airflow path in photos — RGB alone doesn't sell"],
    strengths: [],
    redFlags: [],
    marketNotes: [],
  },
};

export function getPartIntel(component: PCComponent): PartIntel {
  const base: PartIntel = {
    strengths: [],
    redFlags: [],
    flipTips: [],
    marketNotes: [],
  };

  const catDefaults = CATEGORY_DEFAULTS[component.category];
  if (catDefaults) {
    base.flipTips.push(...(catDefaults.flipTips ?? []));
    base.redFlags.push(...(catDefaults.redFlags ?? []));
    base.strengths.push(...(catDefaults.strengths ?? []));
    base.marketNotes.push(...(catDefaults.marketNotes ?? []));
  }

  if (component.specsSummary) {
    base.marketNotes.push(component.specsSummary);
  }

  for (const tag of component.tags ?? []) {
    const intel = TAG_INTEL[tag];
    if (intel) {
      base.strengths.push(...(intel.strengths ?? []));
      base.redFlags.push(...(intel.redFlags ?? []));
      base.flipTips.push(...(intel.flipTips ?? []));
      base.marketNotes.push(...(intel.marketNotes ?? []));
    }
  }

  if (component.category === "gpu" && component.vramGb >= 12) {
    base.strengths.push("12GB+ VRAM — strong for 1440p and creator buyers");
  }

  if (component.category === "cpu" && component.cores >= 8) {
    base.strengths.push("8+ cores — productivity resale angle");
  }

  // Dedupe
  const dedupe = (arr: string[]) => [...new Set(arr)];
  return {
    strengths: dedupe(base.strengths).slice(0, 4),
    redFlags: dedupe(base.redFlags).slice(0, 4),
    flipTips: dedupe(base.flipTips).slice(0, 4),
    marketNotes: dedupe(base.marketNotes).slice(0, 3),
  };
}

/** Competitor feature matrix for settings / about */
export const COMPETITOR_MATRIX = [
  {
    name: "PCPartPicker",
    strengths: ["Huge catalog", "Compatibility filters", "Price history (online)"],
    flaws: ["No flip profit math", "No marketplace fees", "No deal scraping"],
    weBeatThem: "Full reseller workflow + local scraper + 205-part intel",
  },
  {
    name: "Rig Flip",
    strengths: ["Platform fee calculators", "Inventory tracking"],
    flaws: ["Cloud-only", "Limited compatibility depth", "Paid tiers"],
    weBeatThem: "Offline engine + 3D build + deeper compat rules free",
  },
  {
    name: "BuildFlipper",
    strengths: ["Work logs", "Source analytics", "Part-out flow"],
    flaws: ["Subscription", "No live compat engine", "No listing scraper"],
    weBeatThem: "Listing intel + 12-platform compare + compat in one app",
  },
  {
    name: "Underpriced / fee calculators",
    strengths: ["Multi-platform fee math"],
    flaws: ["No parts database", "No build analysis", "Generic items only"],
    weBeatThem: "PC-specific parts, upgrades, and GPU mining flags",
  },
  {
    name: "UserBenchmark / PassMark",
    strengths: ["Benchmark numbers"],
    flaws: ["No profit tools", "Controversial GPU scores", "No listing help"],
    weBeatThem: "Tier-based performance + flip economics combined",
  },
  {
    name: "Spreadsheets",
    strengths: ["Fully custom"],
    flaws: ["Manual entry", "No compat", "No scraper", "Error-prone fees"],
    weBeatThem: "Auto-parse listings + persist builds + export JSON",
  },
];
