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
  hasPrice: boolean;
  foundCount: number;
  missingLabels: string[];
}): PlainEnglishDeal {
  const {
    rating,
    profitAfterFees,
    askingPrice,
    resalePrice,
    isComplete,
    hasPrice,
    foundCount,
    missingLabels,
  } = args;

  if (foundCount > 0 && !hasPrice) {
    return {
      headline: "Add the asking price",
      explanation: `We matched ${foundCount} parts from this listing. Paste the seller's price too — like "$650" or "$650 OBO" — and we'll calculate whether it's a good flip.`,
      actionLabel: "Add price to the listing text",
      tone: "incomplete",
    };
  }

  if (!isComplete) {
    const missingText =
      missingLabels.length > 0
        ? `Still not listed: ${missingLabels.join(", ")}.`
        : "A few specs are still missing.";
    return {
      headline: foundCount > 0 ? "Almost there" : "Not enough info yet",
      explanation:
        foundCount > 0
          ? `We found ${foundCount} parts. ${missingText} Ask the seller or add those details before trusting the profit math.`
          : "Paste the seller's full ad — include CPU or GPU, RAM, storage, and the asking price.",
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
