import type { ResellerCosts } from "@/lib/types/reseller";

export const FLIP_OTHER_EXPENSES = 15;
export const FLIP_PLATFORM_SHIPPING = 25;

export function defaultFlipCosts(
  settings: { defaultShippingCost: number; defaultMarketplaceFee: number },
  overrides?: Partial<ResellerCosts>
): ResellerCosts {
  return {
    purchasePrice: overrides?.purchasePrice ?? 0,
    repairCosts: overrides?.repairCosts ?? 0,
    upgradeCosts: overrides?.upgradeCosts ?? 0,
    shippingCosts: overrides?.shippingCosts ?? settings.defaultShippingCost,
    marketplaceFeePercent:
      overrides?.marketplaceFeePercent ?? settings.defaultMarketplaceFee,
    otherExpenses: overrides?.otherExpenses ?? FLIP_OTHER_EXPENSES,
    targetSellingPrice: overrides?.targetSellingPrice ?? 0,
  };
}
