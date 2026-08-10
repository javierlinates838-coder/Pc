import type { ResellerCosts, ProfitAnalysis } from "@/lib/types/reseller";

export function calculateProfit(costs: ResellerCosts): ProfitAnalysis {
  const totalInvestment =
    costs.purchasePrice +
    costs.repairCosts +
    costs.upgradeCosts +
    costs.shippingCosts +
    costs.otherExpenses;

  const expectedSalePrice = costs.targetSellingPrice;
  const estimatedFees =
    Math.round(expectedSalePrice * (costs.marketplaceFeePercent / 100) * 100) /
    100;

  const estimatedProfit =
    Math.round(
      (expectedSalePrice - estimatedFees - totalInvestment) * 100
    ) / 100;

  const profitPercentage =
    totalInvestment > 0
      ? Math.round((estimatedProfit / totalInvestment) * 10000) / 100
      : 0;

  const roi = profitPercentage;

  const breakEvenPrice =
    Math.round((totalInvestment + estimatedFees) * 100) / 100;

  const targetMargin = 0.2;
  const maxPurchasePrice = Math.max(
    0,
    Math.round(
      (expectedSalePrice * (1 - costs.marketplaceFeePercent / 100) *
        (1 - targetMargin) -
        costs.repairCosts -
        costs.upgradeCosts -
        costs.shippingCosts -
        costs.otherExpenses) *
        100
    ) / 100
  );

  return {
    totalInvestment,
    expectedSalePrice,
    estimatedFees,
    estimatedProfit,
    profitPercentage,
    roi,
    breakEvenPrice,
    maxPurchasePrice,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? "" : ""}${value.toFixed(1)}%`;
}
