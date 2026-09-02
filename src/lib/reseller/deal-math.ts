import { getBestPlatform } from "@/lib/marketplaces/calculate";
import {
  FLIP_OTHER_EXPENSES,
  FLIP_PLATFORM_SHIPPING,
} from "@/lib/flip/defaults";

export interface DealProfitLedger {
  askingPrice: number;
  resalePrice: number;
  saleFees: number;
  saleFeeNote: string;
  shippingPrep: number;
  otherCosts: number;
  totalYouSpend: number;
  netProfit: number;
  bestPlatform: string;
  offerPrice: number;
}

export function buildDealProfitLedger(args: {
  askingPrice: number;
  resalePrice: number;
  localPickup?: boolean;
}): DealProfitLedger {
  const shippingPrep = args.localPickup ? 10 : FLIP_PLATFORM_SHIPPING;
  const otherCosts = FLIP_OTHER_EXPENSES;
  const totalYouSpend = args.askingPrice + shippingPrep + otherCosts;

  const best = getBestPlatform({
    salePrice: args.resalePrice,
    purchasePrice: args.askingPrice,
    shippingCost: shippingPrep,
    otherExpenses: otherCosts,
  });

  const offerPrice = Math.round(args.resalePrice * 0.55);

  return {
    askingPrice: args.askingPrice,
    resalePrice: args.resalePrice,
    saleFees: best.totalFees,
    saleFeeNote: best.feeBreakdown,
    shippingPrep,
    otherCosts,
    totalYouSpend,
    netProfit: best.netProfit,
    bestPlatform: best.shortName,
    offerPrice,
  };
}
