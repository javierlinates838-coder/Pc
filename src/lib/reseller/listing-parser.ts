import type { ComponentMap } from "@/lib/types/components";
import { fuzzyMatchComponentScored } from "@/lib/database";
import { matchComponentFromQuery } from "./part-matcher";
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
  { pattern: /\bryzen\s*7\s*(\d{4}x3d)/i, query: "ryzen 7 $1" },
  { pattern: /\bryzen\s*9\s*(\d{4}x3d)/i, query: "ryzen 9 $1" },
];

const GPU_PATTERNS: { pattern: RegExp; query: string }[] = [
  { pattern: /\brtx\s*(\d{4}\s*(?:ti|super|xt)?)/i, query: "rtx $1" },
  { pattern: /\bgtx\s*(\d{4}\s*(?:ti|super)?)/i, query: "gtx $1" },
  { pattern: /\brx\s*(\d{4}\s*(?:xt|xtx)?)/i, query: "rx $1" },
  { pattern: /\b(\d{4})\s*ti\s*super\b/i, query: "rtx $1 ti super" },
  { pattern: /\b(\d{4})\s*ti\b/i, query: "rtx $1 ti" },
  { pattern: /\b(\d{4})\s*super\b/i, query: "rtx $1 super" },
  { pattern: /\brtx\s*50(\d{2})\s*(ti|super)?/i, query: "rtx 50$1 $2" },
  { pattern: /\b(50\d{2})\s*(ti|super)?\b/i, query: "rtx $1 $2" },
  { pattern: /\b(\d{4})\s*xt\b/i, query: "rx $1 xt" },
];

/** Known chipset codes — avoids false matches on random numbers */
const BOARD_PATTERNS: { pattern: RegExp; query: string }[] = [
  { pattern: /\bb(450|550|650|760)\b/i, query: "b$1" },
  { pattern: /\bz(390|490|590|690|790)\b/i, query: "z$1" },
  { pattern: /\bx(470|570|670)\b/i, query: "x$1" },
  { pattern: /\bh(410|510|610)\b/i, query: "h$1" },
  { pattern: /\b(a320|b350|x370|b450|b550|x570)\b/i, query: "$1" },
];

const RAM_PATTERNS: { pattern: RegExp; query: string }[] = [
  { pattern: /\b(\d+)\s*gb\s*(?:\(\s*\d+x\d+gb\s*\)\s*)?(?:ddr[45][- ]?\d+)?\s*ram\b/i, query: "$1gb ddr4 ram" },
  { pattern: /\b(\d+)\s*x\s*(\d+)\s*gb\s*(?:ddr[45])?\s*ram\b/i, query: "$1x$2gb ddr4 ram" },
  { pattern: /\bddr[45][- ]?\d+\s*(\d+)\s*gb\b/i, query: "$1gb ddr5 ram" },
];

const STORAGE_PATTERNS: { pattern: RegExp; query: string }[] = [
  { pattern: /\b(\d+(?:\.\d+)?)\s*tb\s*(?:nvme|ssd|m\.2)?/i, query: "$1tb nvme ssd" },
  { pattern: /\b(\d+)\s*gb\s*nvme\b/i, query: "$1gb nvme ssd" },
  { pattern: /\b(\d+)\s*gb\s*ssd\b/i, query: "$1gb sata ssd" },
  { pattern: /\b(\d{2,4})\s*ssd\b/i, query: "$1gb sata ssd" },
];

const PSU_PATTERNS: { pattern: RegExp; query: string }[] = [
  { pattern: /\b(\d{3,4})\s*w(?:att)?\s*(?:gold|platinum|bronze|silver)?\s*(?:psu|power supply)?/i, query: "$1w psu" },
  { pattern: /\b(psu|power supply)\s*(\d{3,4})\s*w/i, query: "$2w psu" },
];

const LINE_MATCH_MIN_SCORE = 12;
const BLOB_MATCH_MIN_SCORE = 35;

/** Remove wattages, capacities, and chipsets so they are not mistaken for prices. */
function stripSpecNumbers(text: string): string {
  return text
    .replace(/\b\d{3,4}\s*w(?:att)?(?:\s*(?:gold|bronze|platinum|silver))?/gi, " ")
    .replace(/\b[abhxz]\d{3}[me]?\b/gi, " ")
    .replace(/\b\d+(?:\.\d+)?\s*(?:gb|tb)\b/gi, " ")
    .replace(
      /\b(?:rtx|gtx|rx)\s*\d{3,4}(?:\s*(?:ti|super|xt|xtx))?\b/gi,
      " "
    )
    .replace(/\bryzen\s*\d+\s*\d{4}[a-z]?\b/gi, " ")
    .replace(/\bi[3579][- ]?\d{4,5}[a-z]?\b/gi, " ");
}

export function extractListingPrice(text: string): number {
  const normalized = text.replace(/,/g, "");
  const forPrice = stripSpecNumbers(normalized);

  const asking = forPrice.match(
    /(?:asking|price|listed at|sell(?:ing)? for)\s*[:.]?\s*\$?\s*(\d+(?:\.\d{2})?)/i
  );
  if (asking) return parseFloat(asking[1]);

  const obo = forPrice.match(
    /\$?\s*(\d+(?:\.\d{2})?)\s*(?:obo|o\.b\.o\.?|or best offer)/i
  );
  if (obo) return parseFloat(obo[1]);

  const dollars = forPrice.match(/\$?\s*(\d+(?:\.\d{2})?)\s*dollars?/i);
  if (dollars) return parseFloat(dollars[1]);

  const prices = normalized.match(/\$[\d]+(?:\.\d{2})?/g);
  if (prices?.length) {
    return parseFloat(prices[prices.length - 1].replace(/[$,]/g, ""));
  }

  // Trailing bare number often means price: "RTX 3060 12GB - 450"
  const trailing = forPrice.match(
    /(?:[-–—]\s*|\s)(\d{2,4})(?:\s*(?:obo|firm))?$/i
  );
  if (trailing) {
    const n = parseFloat(trailing[1]);
    if (n >= 25 && n <= 15000) return n;
  }

  return 0;
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
    if (
      (key === "nvme" || key === "ssd" || key === "1tb") &&
      /\d\s*tb/i.test(lower)
    ) {
      continue;
    }
    if (key === "ssd" && /\b\d{2,4}\s*ssd\b/i.test(lower)) {
      continue;
    }
    if (
      (key === "16gb" || key === "8gb") &&
      /\b(32|64)\s*gb/i.test(lower)
    ) {
      continue;
    }
    if (
      key === "wifi" &&
      /has wifi|with wifi|wifi included|wifi ready/i.test(lower) &&
      !/\bwifi\s*6|\bax\d|module|adapter|pcie/i.test(lower)
    ) {
      continue;
    }
    if (
      (key === "windows" || key === "win11" || key === "win10") &&
      !/\bwindows\s*(?:11|10)|win\s*(?:11|10)\b/i.test(lower)
    ) {
      continue;
    }
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
    if (m) {
      queries.push(`motherboard ${query.replace("$1", m[1])}`);
      queries.push(query.replace("$1", m[1]));
    }
  }
  for (const { pattern, query } of RAM_PATTERNS) {
    const m = line.match(pattern);
    if (m) {
      queries.push(
        query.replace("$1", m[1]).replace("$2", m[2] ?? "")
      );
    }
  }
  for (const { pattern, query } of STORAGE_PATTERNS) {
    const m = line.match(pattern);
    if (m) queries.push(query.replace("$1", m[1]));
  }
  for (const { pattern, query } of PSU_PATTERNS) {
    const m = line.match(pattern);
    if (m) queries.push(query.replace("$1", m[1]).replace("$2", m[2] ?? ""));
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
    integratedGraphicsOnly:
      /\bintegrated graphics|\bapu\b|5600g|7600g|5700g|8600g\b/.test(lower),
    miningRisk:
      /\bmining|miner|hashrate|hiveos|nicehash|24\/7|mining farm|gpu farm\b/.test(
        lower
      ),
    localPickupOnly: /\blocal only|pickup only|no shipping|cash only\b/.test(
      lower
    ),
    includesWindows: /\bwindows|win11|win10|w11|w10\b/.test(lower),
    missingPsu: /\bno psu|without psu|psu not included\b/.test(lower),
    oemPrebuilt: /\bdell|hp |lenovo|optiplex|pavilion|omen|prebuilt|pre-built\b/.test(
      lower
    ),
    negotiable: /\bobo|negotiable|or best offer\b/.test(lower),
    urgency: /\bmoving|urgent|today only|need gone\b/.test(lower),
  };
}

function assignPart(parts: ComponentMap, match: { id: string; category: string; name: string }) {
  if (match.category === "cpu" && !parts.cpu) parts.cpu = match as CPU;
  if (match.category === "gpu" && !parts.gpu) parts.gpu = match as GPU;
  if (match.category === "motherboard" && !parts.motherboard)
    parts.motherboard = match as Motherboard;
  if (match.category === "ram") {
    const next = match as RAM;
    if (!parts.ram || next.capacityGb >= parts.ram.capacityGb) {
      parts.ram = next;
    }
  }
  if (match.category === "storage") {
    if (!parts.storage) parts.storage = [];
    const exists = parts.storage.some((s) => s.id === match.id);
    if (!exists) parts.storage.push(match as Storage);
  }
  if (match.category === "cooler" && !parts.cooler) parts.cooler = match as Cooler;
  if (match.category === "psu" && !parts.psu) parts.psu = match as PSU;
  if (match.category === "case" && !parts.case) parts.case = match as Case;
  if (match.category === "os" && !parts.os) {
    parts.os = match as import("@/lib/types/components").OperatingSystem;
  }
  if (match.category === "wifi" && !parts.wifi) {
    parts.wifi = match as import("@/lib/types/components").WiFiModule;
  }
  if (match.category === "fans" && !parts.fans) {
    parts.fans = match as import("@/lib/types/components").Fans;
  }
}

function tryMatchQuery(
  q: string,
  parts: ComponentMap,
  parsedPartNames: string[]
): boolean {
  const matched = matchComponentFromQuery(q);
  if (!matched) return false;

  if (matched.category === "ram" && parts.ram) {
    const next = matched as RAM;
    if (next.capacityGb <= parts.ram.capacityGb) return false;
    const oldIdx = parsedPartNames.indexOf(parts.ram.name);
    if (oldIdx >= 0) parsedPartNames.splice(oldIdx, 1);
  }

  const before = countDetectedParts(parts);
  assignPart(parts, matched);
  if (countDetectedParts(parts) > before || matched.category === "ram") {
    if (!parsedPartNames.includes(matched.name)) {
      parsedPartNames.push(matched.name);
    }
    return true;
  }
  return false;
}

function splitListingLines(text: string, normalized: string): string[] {
  const prepped = text
    .replace(/\b(fans)\s*\/\s*(cooler)\b/gi, "$1 and $2")
    .replace(/\b(gpu|cpu|ram|psu)\s*\/\s*/gi, "$1 - ");

  const raw = prepped
    .split(/\n|•|;|\|/)
    .flatMap((segment) =>
      segment.split(/\s*\+\s*|\s+&\s+|\s+and\s+/i)
    )
    .flatMap((segment) => {
      if (/\d+\s*gb\s*ram/i.test(segment) && /\d+\s*ssd/i.test(segment)) {
        const ram = segment.match(/.*?\d+\s*gb\s*ram/i)?.[0];
        const storage = segment.match(/\d+\s*ssd.*/i)?.[0];
        return [ram, storage].filter(Boolean) as string[];
      }
      return [segment];
    })
    .map((l) => l.trim())
    .filter((l) => l.length > 2 && !/^\$[\d,]+$/.test(l));

  return raw.length > 0 ? raw : [normalized];
}

function countDetectedParts(parts: ComponentMap): number {
  let n = 0;
  for (const [key, value] of Object.entries(parts)) {
    if (key === "storage" && Array.isArray(value)) n += value.length;
    else if (value) n += 1;
  }
  return n;
}

export function scrapeListingText(text: string): ListingParseResult {
  const normalized = normalizeListingText(text);
  const hints = detectHints(normalized);
  const parts: ComponentMap = {};
  const parsedPartNames: string[] = [];
  const unparsedLines: string[] = [];
  const expandedTokens: string[] = [];

  const sourceLines = splitListingLines(text, normalized);

  for (const line of sourceLines) {
    if (/^(asking|price|obo|firm|contact)/i.test(line)) continue;

    const queries = expandLine(line);
    expandedTokens.push(...queries);

    let matched = false;
    let lineHasStorage = false;
    for (const q of [...queries].sort((a, b) => b.length - a.length)) {
      if (lineHasStorage && /\d\s*(tb|gb)|nvme|ssd|hdd/i.test(q)) continue;
      const storageBefore = parts.storage?.length ?? 0;
      if (tryMatchQuery(q, parts, parsedPartNames)) {
        matched = true;
        if ((parts.storage?.length ?? 0) > storageBefore) {
          lineHasStorage = true;
        }
      }
    }

    if (!matched && line.length > 4 && !/^\d+$/.test(line)) {
      unparsedLines.push(line);
    }
  }

  if (countDetectedParts(parts) === 0) {
    const blobMatches = fuzzyMatchComponentScored(normalized, BLOB_MATCH_MIN_SCORE);
    for (const { component } of blobMatches.slice(0, 4)) {
      assignPart(parts, component);
      if (!parsedPartNames.includes(component.name)) {
        parsedPartNames.push(component.name);
      }
    }
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
