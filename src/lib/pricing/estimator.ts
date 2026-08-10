import type { PCComponent, Condition, BuildPartEntry } from "@/lib/types/components";
import type { PartValueBreakdown, ValueStrategyComparison } from "@/lib/types/reseller";

const CONDITION_MULTIPLIERS: Record<Condition, number> = {
  new: 1.0,
  "like-new": 0.9,
  used: 0.75,
  fair: 0.55,
  parts: 0.4,
};

export function getConditionMultiplier(condition: Condition): number {
  return CONDITION_MULTIPLIERS[condition];
}

export function estimatePartValue(
  component: PCComponent,
  condition: Condition = "used"
): { min: number; max: number; mid: number } {
  const multiplier = getConditionMultiplier(condition);
  const min = Math.round(component.pricing.usedMin * multiplier);
  const max = Math.round(component.pricing.usedMax * multiplier);
  return { min, max, mid: Math.round((min + max) / 2) };
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

  const bundleMultiplier = 0.85 - compatibilityPenalty;
  const completeMin = Math.round(partOutMin * bundleMultiplier);
  const completeMax = Math.round(partOutMax * bundleMultiplier);

  return {
    min: completeMin,
    max: completeMax,
    mid: Math.round((completeMin + completeMax) / 2),
  };
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

  async fetchPrice(): Promise<{ min: number; max: number } | null> {
    return null;
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
