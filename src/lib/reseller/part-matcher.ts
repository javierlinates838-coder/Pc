import type { PCComponent, PartCategory } from "@/lib/types/components";
import {
  fuzzyMatchComponentScored,
  searchComponents,
} from "@/lib/database";

/** Extract 4-digit model numbers + suffixes (3060 ti, 9800x3d) */
export function extractModelTokens(text: string): string[] {
  const tokens = new Set<string>();
  const patterns = [
    /\b(\d{4}x3d)\b/gi,
    /\b(rtx|gtx|rx)\s*(\d{4})\s*(ti\s*super|ti|super|xt|xtx)?/gi,
    /\b(\d{4})\s*(ti\s*super|ti|super|xt|xtx)\b/gi,
    /\bryzen\s*\d+\s*(\d{4}x3d|\d{4}[a-z]?)\b/gi,
    /\bi[3579][- ]?(\d{4,5}[a-z]?)\b/gi,
  ];

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      tokens.add(match[0].toLowerCase().replace(/\s+/g, " ").trim());
    }
  }

  const bareFour = text.match(/\b(30[5-9]\d|40[5-9]\d|50[7-9]\d)\b/g);
  bareFour?.forEach((n) => tokens.add(n));

  return [...tokens];
}

/** Guess part category from listing shorthand so "650w psu" never matches a GPU. */
export function inferCategoryFromQuery(query: string): PartCategory | undefined {
  const q = query.toLowerCase();

  if (/\b(psu|power supply)\b/.test(q) || /\b\d{3,4}\s*w(?:att)?\b/.test(q)) {
    return "psu";
  }
  if (
    /\b(motherboard|mobo)\b/.test(q) ||
    /\b[abhxz]\d{3}[me]?\b/.test(q)
  ) {
    return "motherboard";
  }
  if (
    /\b(ram|ddr[45]|dimm)\b/.test(q) ||
    /\b\d+\s*gb\s*(?:ddr|ram)\b/.test(q) ||
    /\b\d+\s*x\s*\d+\s*gb\b/.test(q)
  ) {
    return "ram";
  }
  if (
    /\b(nvme|ssd|hdd|m\.2|storage)\b/.test(q) ||
    /\b\d+(?:\.\d+)?\s*tb\b/.test(q) ||
    /\b\d+\s*gb\s*nvme\b/.test(q)
  ) {
    return "storage";
  }
  if (/\b(cooler|aio|liquid|heatsink)\b/.test(q)) return "cooler";
  if (/\b(case|chassis|tower|itx build)\b/.test(q)) return "case";
  if (/\b(fan|fans)\b/.test(q)) return "fans";
  if (/\b(wifi|wi-fi|wireless)\b/.test(q)) return "wifi";
  if (/\b(windows|win11|win10|os)\b/.test(q)) return "os";
  if (/\b(rtx|gtx|rx|geforce|radeon|gpu|graphics card)\b/.test(q)) {
    return "gpu";
  }
  if (
    /\b(ryzen|threadripper|intel core|core i[3579]|xeon|cpu|processor)\b/.test(
      q
    ) ||
    /\bi[3579][- ]?\d{4,5}/.test(q)
  ) {
    return "cpu";
  }

  return undefined;
}

function componentContainsModel(
  component: PCComponent,
  modelTokens: string[],
  query: string
): boolean {
  if (modelTokens.length === 0) return true;

  const hay = `${component.name} ${component.model}`.toLowerCase();
  const q = query.toLowerCase();

  return modelTokens.some((token) => {
    const digits = token.match(/\d{4}/)?.[0];
    if (digits && !hay.includes(digits)) return false;

    // Don't match 5700X when listing only says 5700 (no x/x3d suffix)
    if (
      component.category === "cpu" &&
      digits &&
      hay.includes(`${digits}x`) &&
      q.includes(digits) &&
      !q.includes(`${digits}x`) &&
      !q.includes("x3d")
    ) {
      return false;
    }

    if (token.includes("x3d") && !hay.includes("x3d")) return false;
    if (token.includes(" ti") && !hay.includes("ti")) return false;
    if (token.includes("super") && !hay.includes("super")) return false;

    return digits ? hay.includes(digits) : hay.includes(token);
  });
}

function defaultMinScore(
  query: string,
  category: PartCategory | undefined,
  hasStrictModel: boolean
): number {
  if (hasStrictModel) return 25;
  if (category === "ram" || category === "storage" || category === "psu") {
    return 8;
  }
  return 12;
}

export function matchComponentFromQuery(
  query: string,
  options?: { minScore?: number; category?: PartCategory }
): PCComponent | null {
  const category = options?.category ?? inferCategoryFromQuery(query);
  const modelTokens = extractModelTokens(query);
  const hasStrictModel = modelTokens.some((t) => /\d{4}/.test(t));
  const minScore =
    options?.minScore ?? defaultMinScore(query, category, hasStrictModel);

  const fuzzy = fuzzyMatchComponentScored(query, minScore);
  const filtered = fuzzy.filter(({ component }) => {
    if (category && component.category !== category) {
      return false;
    }
    return componentContainsModel(component, modelTokens, query);
  });

  if (filtered.length > 0) return filtered[0].component;

  if (query.length >= 4) {
    const search = searchComponents(query, category);
    for (const c of search) {
      if (category && c.category !== category) continue;
      if (componentContainsModel(c, modelTokens, query)) return c;
    }
  }

  return null;
}
