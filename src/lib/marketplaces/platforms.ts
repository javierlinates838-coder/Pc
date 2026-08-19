/**
 * Marketplace fee models — synthesized from Rig Flip, BuildFlipper, and platform docs.
 * Local calculation only; no live API.
 */

export type MarketplaceId =
  | "ebay-shipped"
  | "ebay-local"
  | "facebook-local"
  | "facebook-shipped"
  | "mercari"
  | "offerup-local"
  | "offerup-shipped"
  | "craigslist"
  | "swappa"
  | "hardwareswap"
  | "amazon"
  | "local-cash";

export interface MarketplaceProfile {
  id: MarketplaceId;
  name: string;
  shortName: string;
  /** Competitor gap: most tools hide buyer-pay vs seller-pay — we show both sides */
  sellerFeeDescription: string;
  /** Percent of sale price (0–100) */
  platformFeePercent: number;
  /** Flat fee per order */
  platformFeeFlat: number;
  /** Payment processing % (PayPal, etc.) */
  paymentProcessingPercent: number;
  /** Payment processing flat */
  paymentProcessingFlat: number;
  /** Typical buyer reach */
  reach: "local" | "national" | "global";
  /** Risk / friction notes */
  pros: string[];
  cons: string[];
  /** Best for PC flipping */
  bestFor: string;
}

export const MARKETPLACE_PROFILES: MarketplaceProfile[] = [
  {
    id: "ebay-shipped",
    name: "eBay (Shipped)",
    shortName: "eBay",
    sellerFeeDescription: "~13.25% FVF + $0.30/order + payment processing",
    platformFeePercent: 13.25,
    platformFeeFlat: 0.3,
    paymentProcessingPercent: 0,
    paymentProcessingFlat: 0,
    reach: "global",
    pros: ["Huge buyer pool", "Buyer protection builds trust", "Auction option"],
    cons: ["Highest fees", "Returns/disputes", "Shipping logistics"],
    bestFor: "Complete gaming PCs and premium GPUs",
  },
  {
    id: "ebay-local",
    name: "eBay (Local pickup)",
    shortName: "eBay Local",
    sellerFeeDescription: "~13.25% FVF + $0.30 (no shipping label fees)",
    platformFeePercent: 13.25,
    platformFeeFlat: 0.3,
    paymentProcessingPercent: 0,
    paymentProcessingFlat: 0,
    reach: "national",
    pros: ["No shipping risk", "Cash-like speed"],
    cons: ["Still pays eBay fees", "Meetup safety"],
    bestFor: "Heavy full builds, local metro flips",
  },
  {
    id: "facebook-local",
    name: "Facebook Marketplace (Local)",
    shortName: "FB Local",
    sellerFeeDescription: "Free for local pickup",
    platformFeePercent: 0,
    platformFeeFlat: 0,
    paymentProcessingPercent: 0,
    paymentProcessingFlat: 0,
    reach: "local",
    pros: ["Zero platform fees", "Fast local cash", "Huge local volume"],
    cons: ["Scammers", "No buyer protection", "Lowball offers"],
    bestFor: "Budget builds and office PCs",
  },
  {
    id: "facebook-shipped",
    name: "Facebook Marketplace (Shipped)",
    shortName: "FB Ship",
    sellerFeeDescription: "10% selling fee on shipped orders",
    platformFeePercent: 10,
    platformFeeFlat: 0,
    paymentProcessingPercent: 0,
    paymentProcessingFlat: 0,
    reach: "national",
    pros: ["Lower fees than eBay", "Integrated messaging"],
    cons: ["Platform still maturing", "Fee on shipped only"],
    bestFor: "Mid-tier GPUs and complete PCs",
  },
  {
    id: "mercari",
    name: "Mercari",
    shortName: "Mercari",
    sellerFeeDescription: "10% + 2.9% + $0.50 payment processing",
    platformFeePercent: 10,
    platformFeeFlat: 0,
    paymentProcessingPercent: 2.9,
    paymentProcessingFlat: 0.5,
    reach: "national",
    pros: ["Simple mobile UX", "Prepaid labels"],
    cons: ["Stacked fees", "Less PC-specific traffic"],
    bestFor: "Smaller parts and accessories",
  },
  {
    id: "offerup-local",
    name: "OfferUp (Local)",
    shortName: "OfferUp",
    sellerFeeDescription: "Free for local sales",
    platformFeePercent: 0,
    platformFeeFlat: 0,
    paymentProcessingPercent: 0,
    paymentProcessingFlat: 0,
    reach: "local",
    pros: ["No fees locally", "Mobile-first"],
    cons: ["Smaller than FB in many areas"],
    bestFor: "Quick local part flips",
  },
  {
    id: "offerup-shipped",
    name: "OfferUp (Shipped)",
    shortName: "OfferUp Ship",
    sellerFeeDescription: "12.9% on shipped items",
    platformFeePercent: 12.9,
    platformFeeFlat: 0,
    paymentProcessingPercent: 0,
    paymentProcessingFlat: 0,
    reach: "national",
    pros: ["National reach with one app"],
    cons: ["High shipped fee", "Less PC buyer density"],
    bestFor: "Parts under $200",
  },
  {
    id: "craigslist",
    name: "Craigslist",
    shortName: "Craigslist",
    sellerFeeDescription: "Completely free",
    platformFeePercent: 0,
    platformFeeFlat: 0,
    paymentProcessingPercent: 0,
    paymentProcessingFlat: 0,
    reach: "local",
    pros: ["Zero fees", "Cash preferred", "No account friction"],
    cons: ["No protection", "Ghosting", "Sketchy meetups"],
    bestFor: "Bulk office PCs and cash-only flips",
  },
  {
    id: "swappa",
    name: "Swappa",
    shortName: "Swappa",
    sellerFeeDescription: "Seller pays $0 — buyer pays 3% (min $5)",
    platformFeePercent: 0,
    platformFeeFlat: 0,
    paymentProcessingPercent: 0,
    paymentProcessingFlat: 0,
    reach: "national",
    pros: ["Tech-focused buyers", "No seller fee", "Quality bar"],
    cons: ["Strict listing rules", "Phones/GPU focus"],
    bestFor: "Clean GPUs, phones, premium parts",
  },
  {
    id: "hardwareswap",
    name: "r/hardwareswap",
    shortName: "HWSwap",
    sellerFeeDescription: "PayPal G&S: 3.49% + $0.49",
    platformFeePercent: 0,
    platformFeeFlat: 0,
    paymentProcessingPercent: 3.49,
    paymentProcessingFlat: 0.49,
    reach: "national",
    pros: ["Enthusiast buyers", "Low fees", "Fast for GPUs"],
    cons: ["Flair/rules overhead", "Scam risk if F&F"],
    bestFor: "GPUs, CPUs, enthusiast parts",
  },
  {
    id: "amazon",
    name: "Amazon (Used)",
    shortName: "Amazon",
    sellerFeeDescription: "8–15% referral + per-item fees",
    platformFeePercent: 12,
    platformFeeFlat: 0.99,
    paymentProcessingPercent: 0,
    paymentProcessingFlat: 0,
    reach: "global",
    pros: ["Massive trust", "FBA option"],
    cons: ["Strict used electronics rules", "High fees", "Account risk"],
    bestFor: "New/open-box only — rarely ideal for flips",
  },
  {
    id: "local-cash",
    name: "Local Cash / Zelle",
    shortName: "Cash",
    sellerFeeDescription: "No platform fees",
    platformFeePercent: 0,
    platformFeeFlat: 0,
    paymentProcessingPercent: 0,
    paymentProcessingFlat: 0,
    reach: "local",
    pros: ["Maximum margin", "Instant settlement"],
    cons: ["No recourse", "Counterfeit cash risk"],
    bestFor: "Meetups after testing PC",
  },
];

export function getMarketplaceProfile(id: MarketplaceId): MarketplaceProfile {
  return MARKETPLACE_PROFILES.find((p) => p.id === id) ?? MARKETPLACE_PROFILES[0];
}
