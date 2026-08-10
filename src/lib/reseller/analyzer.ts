import type { ComponentMap, BuildPartEntry } from "@/lib/types/components";
import type {
  DealAnalysis,
  DealRating,
  UpgradeRecommendation,
  ResellerRecommendation,
  ResellerVerdict,
  BuildQualityScore,
  PerformanceEstimate,
} from "@/lib/types/reseller";
import { fuzzyMatchComponent, getComponentById } from "@/lib/database";
import {
  estimatePartValue,
  estimateCompletePcValue,
} from "@/lib/pricing/estimator";
import { calculateProfit } from "./profit";
import type { CPU, GPU, RAM, Storage, Motherboard, Cooler, PSU, Case } from "@/lib/types/components";

export function parseDealListing(text: string): ComponentMap {
  const parts: ComponentMap = {};
  const matches = fuzzyMatchComponent(text);

  for (const match of matches) {
    if (match.category === "cpu" && !parts.cpu) parts.cpu = match as CPU;
    if (match.category === "gpu" && !parts.gpu) parts.gpu = match as GPU;
    if (match.category === "motherboard" && !parts.motherboard)
      parts.motherboard = match as Motherboard;
    if (match.category === "ram" && !parts.ram) parts.ram = match as RAM;
    if (match.category === "storage") {
      if (!parts.storage) parts.storage = [];
      parts.storage.push(match as Storage);
    }
    if (match.category === "cooler" && !parts.cooler)
      parts.cooler = match as Cooler;
    if (match.category === "psu" && !parts.psu) parts.psu = match as PSU;
    if (match.category === "case" && !parts.case) parts.case = match as Case;
  }

  return parts;
}

export function extractListingPrice(text: string): number {
  const priceMatch = text.match(/\$[\d,]+(?:\.\d{2})?/g);
  if (!priceMatch) return 0;
  const lastPrice = priceMatch[priceMatch.length - 1];
  return parseFloat(lastPrice.replace(/[$,]/g, ""));
}

export function analyzeDeal(listingText: string): DealAnalysis {
  const parts = parseDealListing(listingText);
  const listingPrice = extractListingPrice(listingText);

  const buildEntries: BuildPartEntry[] = [];
  const parsedParts: string[] = [];

  for (const [key, value] of Object.entries(parts)) {
    if (key === "storage" && Array.isArray(value)) {
      for (const s of value) {
        buildEntries.push({ component: s, condition: "used" });
        parsedParts.push(s.name);
      }
    } else if (value && !Array.isArray(value)) {
      buildEntries.push({ component: value, condition: "used" });
      parsedParts.push(value.name);
    }
  }

  const marketValue = estimateCompletePcValue(buildEntries);
  const resaleValue = {
    min: Math.round(marketValue.min * 1.05),
    max: Math.round(marketValue.max * 1.1),
    mid: Math.round(marketValue.mid * 1.08),
  };

  const profitAtListing = resaleValue.mid - listingPrice;
  const feePercent = 10;
  const netProfit =
    resaleValue.mid - listingPrice - resaleValue.mid * (feePercent / 100);

  const valuableParts: string[] = [];
  const weakParts: string[] = [];

  for (const entry of buildEntries) {
    const val = estimatePartValue(entry.component, "used");
    if (val.mid >= 100) valuableParts.push(`${entry.component.name} (~$${val.mid})`);
    if (
      entry.component.tags?.includes("weak") ||
      entry.component.tags?.includes("upgrade-candidate") ||
      entry.component.tags?.includes("slow")
    ) {
      weakParts.push(entry.component.name);
    }
  }

  const upgrades = getUpgradeRecommendations(parts);
  const recommendedUpgrades = upgrades.map(
    (u) => `${u.recommendedPart} (+$${u.resaleIncreaseMin}-$${u.resaleIncreaseMax} resale)`
  );

  const maxPurchasePrice = Math.round(resaleValue.mid * 0.65);
  const suggestedOfferPrice = Math.round(resaleValue.mid * 0.55);

  let rating: DealRating;
  const profitMargin = listingPrice > 0 ? netProfit / listingPrice : 0;

  if (netProfit >= 150 && profitMargin >= 0.25) rating = "GREAT";
  else if (netProfit >= 75 && profitMargin >= 0.15) rating = "GOOD";
  else if (netProfit >= 25) rating = "FAIR";
  else rating = "BAD";

  if (listingPrice > resaleValue.max) rating = "BAD";
  if (listingPrice === 0) rating = "FAIR";

  return {
    rating,
    listingPrice,
    estimatedMarketValue: marketValue.mid,
    estimatedResaleValue: resaleValue.mid,
    estimatedProfitPotential: Math.round(netProfit),
    valuableParts,
    weakParts,
    recommendedUpgrades,
    maxPurchasePrice,
    suggestedOfferPrice,
    parsedParts,
  };
}

export function getUpgradeRecommendations(
  parts: ComponentMap
): UpgradeRecommendation[] {
  const upgrades: UpgradeRecommendation[] = [];

  const storage = parts.storage?.[0];
  if (
    storage &&
    (storage.capacityGb < 500 || storage.type === "HDD")
  ) {
    const recommended = getComponentById("ssd-nvme-1tb");
    if (recommended) {
      upgrades.push({
        id: "upgrade-storage-1tb",
        currentPart: storage.name,
        recommendedPart: recommended.name,
        upgradeCost: 45,
        resaleIncreaseMin: 50,
        resaleIncreaseMax: 80,
        additionalProfitMin: 5,
        additionalProfitMax: 35,
        priority: 1,
        reason: "Low storage capacity hurts resale appeal. 1TB NVMe is the sweet spot for buyers.",
      });
    }
  }

  if (parts.ram && parts.ram.capacityGb < 16) {
    const recommended = getComponentById("ram-ddr4-16gb-3200");
    if (recommended) {
      upgrades.push({
        id: "upgrade-ram-16gb",
        currentPart: parts.ram.name,
        recommendedPart: recommended.name,
        upgradeCost: 25,
        resaleIncreaseMin: 30,
        resaleIncreaseMax: 45,
        additionalProfitMin: 5,
        additionalProfitMax: 20,
        priority: 2,
        reason: "8GB RAM is a dealbreaker for most buyers. 16GB is minimum for resale.",
      });
    }
  }

  if (parts.psu && parts.psu.wattage < 550) {
    const recommended = getComponentById("psu-650w-gold");
    if (recommended) {
      upgrades.push({
        id: "upgrade-psu-650w",
        currentPart: parts.psu.name,
        recommendedPart: recommended.name,
        upgradeCost: 55,
        resaleIncreaseMin: 40,
        resaleIncreaseMax: 60,
        additionalProfitMin: -15,
        additionalProfitMax: 5,
        priority: 4,
        reason: "Weak PSU reduces buyer confidence. Only upgrade if PSU is a known issue.",
      });
    }
  }

  if (parts.cooler?.id === "cooler-stock-amd" && parts.cpu) {
    const recommended = getComponentById("cooler-hyper-212");
    if (recommended) {
      upgrades.push({
        id: "upgrade-cooler",
        currentPart: parts.cooler.name,
        recommendedPart: recommended.name,
        upgradeCost: 30,
        resaleIncreaseMin: 15,
        resaleIncreaseMax: 30,
        additionalProfitMin: -15,
        additionalProfitMax: 0,
        priority: 5,
        reason: "Aftermarket cooler improves perceived build quality marginally.",
      });
    }
  }

  if (!parts.case) {
    upgrades.push({
      id: "upgrade-case",
      currentPart: "Budget/Unknown Case",
      recommendedPart: "Corsair 4000D Airflow",
      upgradeCost: 50,
      resaleIncreaseMin: 30,
      resaleIncreaseMax: 50,
      additionalProfitMin: -20,
      additionalProfitMax: 0,
      priority: 6,
      reason: "A clean case improves listing photos and buyer confidence.",
    });
  }

  return upgrades.sort(
    (a, b) => b.additionalProfitMax - a.additionalProfitMax
  );
}

export function generateResellerRecommendation(
  parts: ComponentMap,
  listingPrice: number
): ResellerRecommendation {
  const buildEntries: BuildPartEntry[] = [];
  for (const [key, value] of Object.entries(parts)) {
    if (key === "storage" && Array.isArray(value)) {
      for (const s of value) buildEntries.push({ component: s, condition: "used" });
    } else if (value && !Array.isArray(value)) {
      buildEntries.push({ component: value, condition: "used" });
    }
  }

  const resale = estimateCompletePcValue(buildEntries);
  const upgrades = getUpgradeRecommendations(parts);
  const upgradeCost = upgrades
    .filter((u) => u.additionalProfitMax > 0)
    .slice(0, 2)
    .reduce((sum, u) => sum + u.upgradeCost, 0);

  const profit = calculateProfit({
    purchasePrice: listingPrice,
    repairCosts: 0,
    upgradeCosts: upgradeCost,
    shippingCosts: 20,
    marketplaceFeePercent: 10,
    otherExpenses: 15,
    targetSellingPrice: resale.mid,
  });

  const reasons: string[] = [];
  if (parts.gpu) {
    const gpuVal = estimatePartValue(parts.gpu, "used");
    if (gpuVal.mid >= 150)
      reasons.push(`${parts.gpu.name} is still desirable (~$${gpuVal.mid} used)`);
  }
  if (parts.motherboard?.chipset === "B550")
    reasons.push("B550 platform is upgradeable");
  if (parts.ram && parts.ram.capacityGb >= 16)
    reasons.push(`${parts.ram.capacityGb}GB RAM is acceptable`);
  else if (parts.ram)
    reasons.push(`${parts.ram.capacityGb}GB RAM is weak — upgrade recommended`);

  const weakStorage = parts.storage?.find(
    (s) => s.capacityGb < 500 || s.type === "HDD"
  );
  if (weakStorage) reasons.push(`${weakStorage.capacityGb}GB storage is weak`);

  let verdict: ResellerVerdict;
  if (profit.estimatedProfit >= 120 && profit.roi >= 25)
    verdict = "EXCELLENT FLIP";
  else if (profit.estimatedProfit >= 60 && profit.roi >= 15)
    verdict = "GOOD FLIP";
  else if (profit.estimatedProfit >= 20) verdict = "MARGINAL FLIP";
  else verdict = "PASS";

  return {
    verdict,
    reasons,
    recommendedUpgrades: upgrades.filter((u) => u.additionalProfitMax > 0).slice(0, 3),
    suggestedPurchasePrice: profit.maxPurchasePrice,
    targetResaleMin: resale.min,
    targetResaleMax: resale.max,
    estimatedProfitMin: Math.max(0, profit.estimatedProfit - 30),
    estimatedProfitMax: profit.estimatedProfit + 30,
  };
}

const TIER_SCORES: Record<string, number> = {
  entry: 20,
  budget: 40,
  mid: 60,
  "upper-mid": 75,
  high: 85,
  enthusiast: 95,
};

export function calculateBuildQualityScore(
  parts: ComponentMap
): BuildQualityScore {
  const breakdown = {
    performance: 50,
    balance: 50,
    upgradeability: 50,
    storage: 50,
    cooling: 50,
    psuQuality: 50,
    motherboardQuality: 50,
    ram: 50,
    gpu: 50,
    resaleAppeal: 50,
  };

  const explanations: string[] = [];

  if (parts.cpu) {
    breakdown.performance += (TIER_SCORES[parts.cpu.performanceTier] - 50) * 0.3;
    breakdown.upgradeability +=
      parts.cpu.socket === "AM5" || parts.cpu.socket === "LGA1700" ? 15 : 5;
    explanations.push(
      `CPU: ${parts.cpu.name} (${parts.cpu.performanceTier} tier)`
    );
  }

  if (parts.gpu) {
    breakdown.gpu = TIER_SCORES[parts.gpu.performanceTier];
    breakdown.performance += (breakdown.gpu - 50) * 0.4;
    explanations.push(
      `GPU: ${parts.gpu.name} — primary driver of gaming performance`
    );
  }

  if (parts.ram) {
    breakdown.ram =
      parts.ram.capacityGb >= 32
        ? 85
        : parts.ram.capacityGb >= 16
          ? 65
          : 35;
    if (parts.ram.capacityGb < 16)
      explanations.push("RAM: Below 16GB hurts resale appeal");
  }

  if (parts.storage?.length) {
    const primary = parts.storage[0];
    breakdown.storage =
      primary.type === "HDD"
        ? 25
        : primary.capacityGb >= 1000
          ? 80
          : primary.capacityGb >= 500
            ? 60
            : 35;
    if (primary.capacityGb < 500)
      explanations.push("Storage: Low capacity is a common buyer objection");
  }

  if (parts.psu) {
    const effScore =
      parts.psu.efficiency === "Gold"
        ? 75
        : parts.psu.efficiency === "Platinum"
          ? 85
          : parts.psu.efficiency === "Bronze"
            ? 45
            : 60;
    breakdown.psuQuality = effScore;
    if (parts.psu.wattage < 550)
      explanations.push("PSU: Low wattage limits upgrade potential");
  }

  if (parts.motherboard) {
    breakdown.motherboardQuality =
      parts.motherboard.chipset.startsWith("Z") ||
      parts.motherboard.chipset.startsWith("X")
        ? 80
        : parts.motherboard.chipset.startsWith("B")
          ? 65
          : 45;
    breakdown.upgradeability +=
      parts.motherboard.chipset === "B550" ||
      parts.motherboard.chipset === "B650"
        ? 10
        : 0;
  }

  if (parts.cooler) {
    breakdown.cooling =
      parts.cooler.type === "aio"
        ? 80
        : parts.cooler.id.includes("stock")
          ? 35
          : 60;
  }

  if (parts.cpu && parts.gpu) {
    const cpuScore = TIER_SCORES[parts.cpu.performanceTier];
    const gpuScore = TIER_SCORES[parts.gpu.performanceTier];
    const diff = Math.abs(cpuScore - gpuScore);
    breakdown.balance = diff < 20 ? 80 : diff < 35 ? 60 : 40;
    if (diff >= 35)
      explanations.push("Balance: CPU and GPU are mismatched — may bottleneck");
  }

  breakdown.resaleAppeal = Math.round(
    (breakdown.gpu * 0.35 +
      breakdown.ram * 0.15 +
      breakdown.storage * 0.2 +
      breakdown.psuQuality * 0.1 +
      breakdown.motherboardQuality * 0.1 +
      breakdown.cooling * 0.1) 
  );

  const values = Object.values(breakdown);
  const total = Math.round(
    values.reduce((a, b) => a + b, 0) / values.length
  );

  return {
    total: Math.min(100, Math.max(0, total)),
    breakdown,
    explanation: explanations,
  };
}

export function estimatePerformance(parts: ComponentMap): PerformanceEstimate {
  const gpuTier = parts.gpu?.performanceTier ?? "budget";
  const cpuTier = parts.cpu?.performanceTier ?? "budget";
  const ramGb = parts.ram?.capacityGb ?? 8;

  const disclaimer =
    "These are rough estimates based on component tiers, not benchmark data. Actual performance varies by game, settings, and thermals.";

  const gaming1080pMap: Record<string, string> = {
    entry: "Low settings, older titles",
    budget: "Medium-High 1080p, 60+ FPS in most games",
    mid: "High 1080p, 60-100+ FPS in modern titles",
    "upper-mid": "Ultra 1080p / High 1440p",
    high: "Ultra 1080p / High-Ultra 1440p",
    enthusiast: "Max settings 1440p+",
  };

  const gaming1440pMap: Record<string, string> = {
    entry: "Not recommended",
    budget: "Low-Medium 1440p",
    mid: "Medium-High 1440p",
    "upper-mid": "High 1440p / Entry 4K",
    high: "High-Ultra 1440p / Medium 4K",
    enthusiast: "High 4K",
  };

  return {
    gaming1080p: gaming1080pMap[gpuTier],
    gaming1440p: gaming1440pMap[gpuTier],
    productivity: `${cpuTier} tier CPU — ${cpuTier === "high" || cpuTier === "enthusiast" ? "Strong" : cpuTier === "mid" ? "Good" : "Basic"} for office, browsing, light creative work`,
    streaming:
      gpuTier === "high" || gpuTier === "enthusiast"
        ? "Capable of NVENC streaming at high quality"
        : gpuTier === "mid" || gpuTier === "upper-mid"
          ? "720p-1080p streaming with hardware encoding"
          : "Basic streaming only, may struggle with demanding games",
    ai:
      (parts.gpu?.vramGb ?? 0) >= 12
        ? "Can run local LLMs (7B models) and basic AI workloads"
        : (parts.gpu?.vramGb ?? 0) >= 8
          ? "Entry-level AI inference, small models"
          : "Limited AI capability",
    videoEditing:
      cpuTier === "high" || cpuTier === "enthusiast"
        ? "Good 1080p/1440p editing with hardware acceleration"
        : cpuTier === "mid"
          ? "1080p editing, longer render times at 4K"
          : "Basic 1080p editing only",
    overallTier: gpuTier,
    disclaimer,
  };
}
