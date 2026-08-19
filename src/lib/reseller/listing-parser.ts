import type { ComponentMap } from "@/lib/types/components";
import { fuzzyMatchComponent, searchComponents } from "@/lib/database";
import type { CPU, GPU, RAM, Storage, Motherboard, Cooler, PSU, Case } from "@/lib/types/components";

export type ListingConditionHint = "new" | "like-new" | "used" | "fair" | "parts" | "unknown";

export interface ListingHints {
  condition: ListingConditionHint;
  noGpuListed: boolean;
  integratedGraphicsOnly: boolean;
  miningRisk: boolean;
  localPickupOnly: boolean;
  includesWindows: boolean;
  missingPsu: boolean;
  oemPrebuilt: boolean;
  negotiable: boolean;
  urgency: boolean;
}

export interface ListingParseResult {
  parts: ComponentMap;
  parsedPartNames: string[];
  unparsedLines: string[];
  hints: ListingHints;
  expandedTokens: string[];
  listingPrice: number;
  /** Lines we tried to match */
  sourceLines: string[];
}

const SHORTHAND_EXPANSIONS: Record<string, string> = {
  "16gb": "16gb ddr4 ram",
  "32gb": "32gb ddr4 ram",
  "8gb": "8gb ddr4 ram",
  "64gb": "64gb ddr4 ram",
  "1tb": "1tb nvme ssd",
  "2tb": "2tb nvme ssd",
  "500gb": "500gb nvme ssd",
  "256gb": "256gb nvme ssd",
  "nvme": "1tb nvme ssd",
  "ssd": "500gb sata ssd",
  "hdd": "2tb hdd",
  "liquid": "aio liquid cooler",
  "aio": "240mm aio cooler",
  "water": "aio liquid cooler",
  "wifi": "wifi 6 ax200",
  "win11": "windows 11",
  "win10": "windows 10",
  "windows": "windows 11",
  "no os": "no operating system",
};

const CPU_PATTERNS: { pattern: RegExp; query: string }[] = [
  { pattern: /\bi3[- ]?(\d{4,5}[a-z]?)/i, query: "i3-$1" },
  { pattern: /\bi5[- ]?(\d{4,5}[a-z]?)/i, query: "i5-$1" },
  { pattern: /\bi7[- ]?(\d{4,5}[a-z]?)/i, query: "i7-$1" },
  { pattern: /\bi9[- ]?(\d{4,5}[a-z]?)/i, query: "i9-$1" },
  { pattern: /\bryzen\s*3\s*(\d{4}[a-z]?)/i, query: "ryzen 3 $1" },
  { pattern: /\bryzen\s*5\s*(\d{4}[a-z]?)/i, query: "ryzen 5 $1" },
  { pattern: /\bryzen\s*7\s*(\d{4}[a-z]?)/i, query: "ryzen 7 $1" },
  { pattern: /\bryzen\s*9\s*(\d{4}[a-z]?)/i, query: "ryzen 9 $1" },
  { pattern: /\br5\s*(\d{4}[a-z]?)/i, query: "ryzen 5 $1" },
  { pattern: /\br7\s*(\d{4}[a-z]?)/i, query: "ryzen 7 $1" },
];

const GPU_PATTERNS: { pattern: RegExp; query: string }[] = [
  { pattern: /\brtx\s*(\d{4}\s*(?:ti|super|xt)?)/i, query: "rtx $1" },
  { pattern: /\bgtx\s*(\d{4}\s*(?:ti|super)?)/i, query: "gtx $1" },
  { pattern: /\brx\s*(\d{4}\s*(?:xt|xtx)?)/i, query: "rx $1" },
  { pattern: /\b(\d{4})\s*xt\b/i, query: "rx $1 xt" },
];

const BOARD_PATTERNS: { pattern: RegExp; query: string }[] = [
  { pattern: /\bb(\d{3,4})m?\b/i, query: "b$1" },
  { pattern: /\bz(\d{3,4})\b/i, query: "z$1" },
  { pattern: /\bx(\d{3,4})\b/i, query: "x$1" },
  { pattern: /\bh(\d{3,4})\b/i, query: "h$1" },
];

export function extractListingPrice(text: string): number {
  const asking = text.match(/(?:asking|obo|price|listed at)\s*[:.]?\s*\$[\d,]+/gi);
  if (asking?.length) {
    const m = asking[0].match(/\$[\d,]+(?:\.\d{2})?/);
    if (m) return parseFloat(m[0].replace(/[$,]/g, ""));
  }
  const prices = text.match(/\$[\d,]+(?:\.\d{2})?/g);
  if (!prices) return 0;
  const last = prices[prices.length - 1];
  return parseFloat(last.replace(/[$,]/g, ""));
}

function normalizeListingText(text: string): string {
  return text
    .replace(/https?:\/\/[^\s]+/gi, " ")
    .replace(/www\.[^\s]+/gi, " ")
    .replace(/[^\w\s$.,\-+×x/|]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function expandLine(line: string): string[] {
  const lower = line.toLowerCase().trim();
  const queries: string[] = [line];

  for (const [key, expansion] of Object.entries(SHORTHAND_EXPANSIONS)) {
    if (lower.includes(key)) queries.push(expansion);
  }

  for (const { pattern, query } of CPU_PATTERNS) {
    const m = line.match(pattern);
    if (m) queries.push(query.replace("$1", m[1]));
  }
  for (const { pattern, query } of GPU_PATTERNS) {
    const m = line.match(pattern);
    if (m) queries.push(query.replace("$1", m[1].trim()));
  }
  for (const { pattern, query } of BOARD_PATTERNS) {
    const m = line.match(pattern);
    if (m) queries.push(`motherboard ${query.replace("$1", m[1])}`);
  }

  return [...new Set(queries)];
}

function detectHints(text: string): ListingHints {
  const lower = text.toLowerCase();
  return {
    condition: lower.match(/\blike new|mint\b/)
      ? "like-new"
      : lower.match(/\bnew\b/) && !lower.match(/\bused\b/)
        ? "new"
        : lower.match(/\bfair|rough|cosmetic\b/)
          ? "fair"
          : lower.match(/\bfor parts|not working|dead\b/)
            ? "parts"
            : lower.match(/\bused|refurb\b/)
              ? "used"
              : "unknown",
    noGpuListed:
      /\bno gpu|without gpu|cpu only|no graphics|igpu only|integrated graphics only\b/.test(
        lower
      ),
    integratedGraphicsOnly: /\bintegrated graphics|apu|5600g|7600\b/.test(lower),
    miningRisk:
      /\bmining|miner|rig|hash|eth|hiveos|nicehash|24\/7|farm\b/.test(lower),
    localPickupOnly: /\blocal only|pickup only|no shipping|cash only\b/.test(
      lower
    ),
    includesWindows: /\bwindows|win11|win10|w11|w10\b/.test(lower),
    missingPsu: /\bno psu|without psu|psu not included\b/.test(lower),
    oemPrebuilt: /\bdell|hp |lenovo|optiplex|pavilion|omen|prebuilt|pre-built\b/.test(
      lower
    ),
    negotiable: /\bobo|negotiable|firm\b/.test(lower),
    urgency: /\bmoving|urgent|today only|need gone\b/.test(lower),
  };
}

function assignPart(parts: ComponentMap, match: ReturnType<typeof fuzzyMatchComponent>[0]) {
  if (match.category === "cpu" && !parts.cpu) parts.cpu = match as CPU;
  if (match.category === "gpu" && !parts.gpu) parts.gpu = match as GPU;
  if (match.category === "motherboard" && !parts.motherboard)
    parts.motherboard = match as Motherboard;
  if (match.category === "ram" && !parts.ram) parts.ram = match as RAM;
  if (match.category === "storage") {
    if (!parts.storage) parts.storage = [];
    const exists = parts.storage.some((s) => s.id === match.id);
    if (!exists) parts.storage.push(match as Storage);
  }
  if (match.category === "cooler" && !parts.cooler) parts.cooler = match as Cooler;
  if (match.category === "psu" && !parts.psu) parts.psu = match as PSU;
  if (match.category === "case" && !parts.case) parts.case = match as Case;
}

export function scrapeListingText(text: string): ListingParseResult {
  const normalized = normalizeListingText(text);
  const hints = detectHints(normalized);
  const parts: ComponentMap = {};
  const parsedPartNames: string[] = [];
  const unparsedLines: string[] = [];
  const expandedTokens: string[] = [];

  const lines = text
    .split(/\n|•|;|\||\//)
    .map((l) => l.trim())
    .filter((l) => l.length > 2 && !/^\$[\d,]+$/.test(l.trim()));

  const sourceLines = lines.length > 0 ? lines : [normalized];

  for (const line of sourceLines) {
    if (/^(asking|price|obo|firm|contact)/i.test(line)) continue;

    const queries = expandLine(line);
    expandedTokens.push(...queries);

    let matched = false;
    for (const q of queries) {
      const fuzzy = fuzzyMatchComponent(q);
      if (fuzzy.length > 0) {
        assignPart(parts, fuzzy[0]);
        if (!parsedPartNames.includes(fuzzy[0].name)) {
          parsedPartNames.push(fuzzy[0].name);
        }
        matched = true;
        break;
      }
      const search = searchComponents(q);
      if (search.length > 0) {
        assignPart(parts, search[0]);
        if (!parsedPartNames.includes(search[0].name)) {
          parsedPartNames.push(search[0].name);
        }
        matched = true;
        break;
      }
    }

    if (!matched && line.length > 4 && !/^\d+$/.test(line)) {
      unparsedLines.push(line);
    }
  }

  // Whole-text fallback pass (PCPartPicker-style full blob)
  const blobMatches = fuzzyMatchComponent(normalized);
  for (const m of blobMatches.slice(0, 8)) {
    assignPart(parts, m);
    if (!parsedPartNames.includes(m.name)) parsedPartNames.push(m.name);
  }

  return {
    parts,
    parsedPartNames,
    unparsedLines: unparsedLines.slice(0, 8),
    hints,
    expandedTokens: [...new Set(expandedTokens)].slice(0, 20),
    listingPrice: extractListingPrice(text),
    sourceLines,
  };
}

export function parseDealListing(text: string): ComponentMap {
  return scrapeListingText(text).parts;
}
