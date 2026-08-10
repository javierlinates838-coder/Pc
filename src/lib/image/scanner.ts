import type { PCComponent, PartCategory } from "@/lib/types/components";
import { fuzzyMatchComponent, componentDatabase } from "@/lib/database";

export interface ScanMatch {
  component: PCComponent;
  confidence: "high" | "medium" | "low";
  matchedOn: string[];
}

export interface ScanResult {
  matches: ScanMatch[];
  extractedText: string;
  suggestedCategory?: PartCategory;
}

const PART_PATTERNS: { pattern: RegExp; category: PartCategory }[] = [
  { pattern: /ryzen\s*\d|core\s*i[3579]|intel\s*i[3579]/i, category: "cpu" },
  { pattern: /rtx\s*\d|gtx\s*\d|rx\s*\d|radeon/i, category: "gpu" },
  { pattern: /b\d{3}|x\d{3}|z\d{3}|a\d{3}|motherboard|mobo/i, category: "motherboard" },
  { pattern: /ddr[45]|ram|memory|\d+gb.*mhz/i, category: "ram" },
  { pattern: /nvme|ssd|hdd|m\.2|sata/i, category: "storage" },
  { pattern: /\d+w|psu|power\s*supply|80\+\s*(gold|bronze|platinum)/i, category: "psu" },
  { pattern: /cooler|aio|nh-d|hyper\s*212|kraken|h100/i, category: "cooler" },
  { pattern: /case|tower|meshify|nzxt|4000d/i, category: "case" },
];

function detectCategory(text: string): PartCategory | undefined {
  for (const { pattern, category } of PART_PATTERNS) {
    if (pattern.test(text)) return category;
  }
  return undefined;
}

function calculateConfidence(
  component: PCComponent,
  text: string
): { confidence: ScanMatch["confidence"]; matchedOn: string[] } {
  const normalized = text.toLowerCase();
  const matchedOn: string[] = [];
  let score = 0;

  if (normalized.includes(component.model.toLowerCase())) {
    matchedOn.push(`Model: ${component.model}`);
    score += 40;
  }
  if (normalized.includes(component.brand.toLowerCase())) {
    matchedOn.push(`Brand: ${component.brand}`);
    score += 20;
  }

  const nameParts = component.name.toLowerCase().split(/\s+/);
  for (const part of nameParts) {
    if (part.length > 2 && normalized.includes(part)) {
      matchedOn.push(`Keyword: ${part}`);
      score += 10;
    }
  }

  if (component.category === "gpu") {
    const vramMatch = normalized.match(/(\d+)\s*gb/i);
    if (vramMatch && "vramGb" in component) {
      if (parseInt(vramMatch[1]) === component.vramGb) {
        matchedOn.push(`VRAM: ${component.vramGb}GB`);
        score += 15;
      }
    }
  }

  if (component.category === "cpu") {
    const socketPatterns = ["am4", "am5", "lga1700", "lga1200"];
    for (const socket of socketPatterns) {
      if (normalized.includes(socket) && "socket" in component) {
        if (component.socket.toLowerCase().includes(socket)) {
          matchedOn.push(`Socket: ${component.socket}`);
          score += 15;
        }
      }
    }
  }

  const confidence: ScanMatch["confidence"] =
    score >= 50 ? "high" : score >= 25 ? "medium" : "low";

  return { confidence, matchedOn };
}

export function scanFromText(text: string): ScanResult {
  const category = detectCategory(text);
  const fuzzyMatches = fuzzyMatchComponent(text);

  const matches: ScanMatch[] = fuzzyMatches.slice(0, 5).map((component) => {
    const { confidence, matchedOn } = calculateConfidence(component, text);
    return { component, confidence, matchedOn };
  });

  return {
    matches,
    extractedText: text,
    suggestedCategory: category,
  };
}

export async function scanFromFilename(filename: string): Promise<ScanResult> {
  const nameWithoutExt = filename.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
  return scanFromText(nameWithoutExt);
}

export async function scanFromImageFile(file: File): Promise<ScanResult> {
  const filenameResult = await scanFromFilename(file.name);

  if (filenameResult.matches.length > 0 && filenameResult.matches[0].confidence !== "low") {
    return {
      ...filenameResult,
      extractedText: `Filename analysis: ${file.name}`,
    };
  }

  return {
    matches: componentDatabase.slice(0, 3).map((component) => ({
      component,
      confidence: "low" as const,
      matchedOn: ["Unable to identify from image — manual selection recommended"],
    })),
    extractedText: `Image uploaded: ${file.name} (${(file.size / 1024).toFixed(1)} KB). Visual recognition requires API integration. Use filename hints or manual search.`,
    suggestedCategory: filenameResult.suggestedCategory,
  };
}

export interface ImageRecognitionProvider {
  name: string;
  identify(imageData: ArrayBuffer): Promise<ScanResult>;
}

export class LocalImageScanner implements ImageRecognitionProvider {
  name = "local-pattern-matcher";

  async identify(): Promise<ScanResult> {
    return {
      matches: [],
      extractedText: "Local scanner requires text input or filename.",
    };
  }
}

export class OpenAIImageProvider implements ImageRecognitionProvider {
  name = "openai-vision";

  async identify(): Promise<ScanResult> {
    return {
      matches: [],
      extractedText: "OpenAI Vision API not configured. Add API key in Settings.",
    };
  }
}

export const imageProviders: ImageRecognitionProvider[] = [
  new LocalImageScanner(),
  new OpenAIImageProvider(),
];
