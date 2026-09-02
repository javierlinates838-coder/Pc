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

  const bareFour = text.match(/\b(30[5-9]\d|40[5-9]\d|50\d{2})\b/g);
  bareFour?.forEach((n) => tokens.add(n));

  return [...tokens];
}

function componentContainsModel(
  component: PCComponent,
  modelTokens: string[]
): boolean {
  if (modelTokens.length === 0) return true;

  const hay = `${component.name} ${component.model}`.toLowerCase();

  return modelTokens.some((token) => {
    const digits = token.match(/\d{4}/)?.[0];
    if (digits && !hay.includes(digits)) return false;

    if (token.includes("x3d") && !hay.includes("x3d")) return false;
    if (token.includes(" ti") && !hay.includes("ti")) return false;
    if (token.includes("super") && !hay.includes("super")) return false;

    return digits ? hay.includes(digits) : hay.includes(token);
  });
}

export function matchComponentFromQuery(
  query: string,
  options?: { minScore?: number; category?: PartCategory }
): PCComponent | null {
  const modelTokens = extractModelTokens(query);
  const hasStrictModel = modelTokens.some((t) => /\d{4}/.test(t));
  const minScore = options?.minScore ?? (hasStrictModel ? 25 : 12);

  const fuzzy = fuzzyMatchComponentScored(query, minScore);
  const filtered = fuzzy.filter(({ component }) => {
    if (options?.category && component.category !== options.category) {
      return false;
    }
    return componentContainsModel(component, modelTokens);
  });

  if (filtered.length > 0) return filtered[0].component;

  if (query.length >= 4) {
    const search = searchComponents(query);
    for (const c of search) {
      if (options?.category && c.category !== options.category) continue;
      if (componentContainsModel(c, modelTokens)) return c;
    }
  }

  return null;
}
