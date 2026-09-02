import type { DealRating } from "@/lib/types/reseller";
import { formatCurrency } from "@/lib/utils";

export interface PlainEnglishDeal {
  headline: string;
  explanation: string;
  actionLabel: string;
  tone: "great" | "good" | "caution" | "bad" | "incomplete";
}

export function getPlainEnglishDeal(args: {
  rating: DealRating;
  profitAfterFees: number;
  askingPrice: number;
  resalePrice: number;
  isComplete: boolean;
  foundCount: number;
  missingCount: number;
}): PlainEnglishDeal {
  const {
    rating,
    profitAfterFees,
    askingPrice,
    resalePrice,
    isComplete,
    foundCount,
    missingCount,
  } = args;

  if (!isComplete) {
    return {
      headline: "Not enough info yet",
      explanation:
        foundCount > 0
          ? `We found ${foundCount} part${foundCount === 1 ? "" : "s"}, but ${missingCount} common PC parts are still missing from the listing. Profit math is unreliable until you paste RAM, storage, or a fuller spec list.`
          : "Paste the seller's full ad — include CPU, GPU, RAM, storage, and the asking price.",
      actionLabel: "Add more listing details",
      tone: "incomplete",
    };
  }

  const profitText =
    profitAfterFees >= 0
      ? `about ${formatCurrency(profitAfterFees)} profit`
      : `about ${formatCurrency(Math.abs(profitAfterFees))} loss`;

  if (rating === "GREAT") {
    return {
      headline: "Strong flip — worth pursuing",
      explanation: `Pay ${formatCurrency(askingPrice)}, sell for roughly ${formatCurrency(resalePrice)}, and you could make ${profitText} after fees.`,
      actionLabel: "Good deal — negotiate and inspect",
      tone: "great",
    };
  }

  if (rating === "GOOD") {
    return {
      headline: "Decent opportunity",
      explanation: `At ${formatCurrency(askingPrice)} asking, resale looks around ${formatCurrency(resalePrice)}. Expect ${profitText} after fees if the PC checks out in person.`,
      actionLabel: "Worth a look — verify condition",
      tone: "good",
    };
  }

  if (rating === "FAIR") {
    return {
      headline: "Tight margins — negotiate hard",
      explanation: `Seller wants ${formatCurrency(askingPrice)} but resale is about ${formatCurrency(resalePrice)}. You'd see ${profitText} after fees unless you get a better price.`,
      actionLabel: "Only buy at a lower offer",
      tone: "caution",
    };
  }

  return {
    headline: profitAfterFees < 0 ? "Walk away — you'd lose money" : "Not worth it",
    explanation: `Seller wants ${formatCurrency(askingPrice)}, but this PC is worth about ${formatCurrency(resalePrice)}. After platform fees and costs, you're looking at ${profitText}.`,
    actionLabel: profitAfterFees < 0 ? "Don't buy at this price" : "Pass unless price drops a lot",
    tone: "bad",
  };
}
