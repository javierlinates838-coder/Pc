import type { PCComponent, Condition, BuildPartEntry } from "@/lib/types/components";
import type { PartValueBreakdown, ValueStrategyComparison } from "@/lib/types/reseller";

export function getConditionMultiplier(condition: Condition): number {
  const multipliers: Record<Condition, number> = {
    new: 1.0,
    "like-new": 1.03,
    used: 1.0,
    fair: 0.82,
    parts: 0.55,
  };
  return multipliers[condition];
}

/** usedMin/usedMax in the database are already used-market prices. */
export function estimatePartValue(
  component: PCComponent,
  condition: Condition = "used"
): { min: number; max: number; mid: number } {
  const { usedMin, usedMax, newMin, newMax } = component.pricing;

  let min = usedMin;
  let max = usedMax;

  if (condition === "new" && newMin > 0 && newMax > 0) {
    min = newMin;
    max = newMax;
  } else if (condition === "like-new") {
    min = Math.round(usedMin * 1.05);
    max = Math.round(usedMax * 1.02);
  } else if (condition === "fair") {
    min = Math.round(usedMin * 0.82);
    max = Math.round(usedMax * 0.82);
  } else if (condition === "parts") {
    min = Math.round(usedMin * 0.55);
    max = Math.round(usedMax * 0.55);
  }

  return {
    min,
    max,
    mid: Math.round((min + max) / 2),
  };
}

/** Bigger builds get a smaller complete-PC discount vs parting out. */
function bundleMultiplier(partCount: number): number {
  if (partCount >= 7) return 0.94;
  if (partCount >= 5) return 0.92;
  if (partCount >= 3) return 0.9;
  return 0.88;
}

export function estimateCompletePcValue(
  parts: BuildPartEntry[],
  compatibilityPenalty = 0
): { min: number; max: number; mid: number } {
  let partOutMin = 0;
  let partOutMax = 0;

  for (const part of parts) {
    const val = estimatePartValue(part.component, part.condition);
    partOutMin += val.min;
    partOutMax += val.max;
  }

  const mult = bundleMultiplier(parts.length) - compatibilityPenalty;
  const completeMin = Math.round(partOutMin * mult);
  const completeMax = Math.round(partOutMax * mult);

  return {
    min: completeMin,
    max: completeMax,
    mid: Math.round((completeMin + completeMax) / 2),
  };
}

export function sumPartOutValue(parts: BuildPartEntry[]): {
  min: number;
  max: number;
  mid: number;
} {
  let min = 0;
  let max = 0;
  for (const part of parts) {
    const val = estimatePartValue(part.component, part.condition);
    min += val.min;
    max += val.max;
  }
  return { min, max, mid: Math.round((min + max) / 2) };
}

export function buildPartValueBreakdown(
  parts: BuildPartEntry[]
): PartValueBreakdown[] {
  return parts.map((part) => {
    const val = estimatePartValue(part.component, part.condition);
    return {
      partName: part.component.name,
      category: part.component.category,
      usedValueMin: val.min,
      usedValueMax: val.max,
      condition: part.condition,
    };
  });
}

export function compareValueStrategies(
  parts: BuildPartEntry[]
): ValueStrategyComparison {
  const partOutMin = parts.reduce(
    (sum, p) => sum + estimatePartValue(p.component, p.condition).min,
    0
  );
  const partOutMax = parts.reduce(
    (sum, p) => sum + estimatePartValue(p.component, p.condition).max,
    0
  );
  const complete = estimateCompletePcValue(parts);

  const partOutMid = (partOutMin + partOutMax) / 2;
  const completeMid = complete.mid;
  const diff = partOutMid - completeMid;
  const diffPercent = completeMid > 0 ? (diff / completeMid) * 100 : 0;

  let betterStrategy: ValueStrategyComparison["betterStrategy"];
  let explanation: string;

  if (diffPercent > 15) {
    betterStrategy = "part-out";
    explanation = `Parting out could yield $${partOutMin}-$${partOutMax} vs $${complete.min}-$${complete.max} as a complete PC (~${Math.round(diffPercent)}% more via part-out). More effort but higher return.`;
  } else if (diffPercent < -10) {
    betterStrategy = "complete-pc";
    explanation = `Selling as a complete PC ($${complete.min}-$${complete.max}) is likely better than parting out ($${partOutMin}-$${partOutMax}). Buyers pay a premium for ready-to-use systems.`;
  } else {
    betterStrategy = "similar";
    explanation = `Part-out value ($${partOutMin}-$${partOutMax}) and complete PC value ($${complete.min}-$${complete.max}) are similar. Choose based on effort and local market demand.`;
  }

  return {
    partOutValueMin: partOutMin,
    partOutValueMax: partOutMax,
    completePcValueMin: complete.min,
    completePcValueMax: complete.max,
    betterStrategy,
    explanation,
  };
}

export interface MarketPriceProvider {
  name: string;
  fetchPrice(componentId: string): Promise<{ min: number; max: number } | null>;
}

export class LocalPriceEstimator implements MarketPriceProvider {
  name = "local-estimator";

  async fetchPrice(
    componentId: string
  ): Promise<{ min: number; max: number } | null> {
    const { getComponentById } = await import("@/lib/database");
    const component = getComponentById(componentId);
    if (!component) return null;
    return {
      min: component.pricing.usedMin,
      max: component.pricing.usedMax,
    };
  }
}

export class EbayPriceProvider implements MarketPriceProvider {
  name = "ebay";

  async fetchPrice(
    componentId: string
  ): Promise<{ min: number; max: number } | null> {
    const { getComponentById } = await import("@/lib/database");
    const { fetchEbayComps } = await import("@/lib/ebay/comps");

    const component = getComponentById(componentId);
    if (!component) return null;

    try {
      const comps = await fetchEbayComps(component.name, { limit: 20 });
      if (comps.listingCount === 0) return null;

      return {
        min: comps.low,
        max: comps.high,
      };
    } catch {
      return null;
    }
  }
}

export class AmazonPriceProvider implements MarketPriceProvider {
  name = "amazon";

  async fetchPrice(): Promise<{ min: number; max: number } | null> {
    return null;
  }
}

export const priceProviders: MarketPriceProvider[] = [
  new LocalPriceEstimator(),
  new EbayPriceProvider(),
  new AmazonPriceProvider(),
];
