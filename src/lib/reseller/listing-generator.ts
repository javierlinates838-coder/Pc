import type { ComponentMap } from "@/lib/types/components";
import { componentMapToEntries } from "@/lib/build/helpers";
import { estimateCompletePcValue, estimatePartValue } from "@/lib/pricing/estimator";
import { analyzeCompatibility } from "@/lib/compatibility/engine";
import { getPartIntel } from "@/lib/database/intel/part-intel";

export interface GeneratedListing {
  title: string;
  titleShort: string;
  description: string;
  bulletPoints: string[];
  hashtags: string[];
  suggestedPriceRange: { min: number; max: number; mid: number };
  photoChecklist: string[];
}

export function generateListingCopy(
  parts: ComponentMap,
  buildName = "Gaming PC"
): GeneratedListing {
  const entries = componentMapToEntries(parts);
  const resale = estimateCompletePcValue(entries);
  const compat = analyzeCompatibility(parts);

  const cpu = parts.cpu?.model ?? "CPU";
  const gpu = parts.gpu?.model ?? "Integrated Graphics";
  const ram = parts.ram ? `${parts.ram.capacityGb}GB ${parts.ram.type}` : "RAM";
  const storage = parts.storage?.length
    ? parts.storage
        .map((s) =>
          s.capacityGb >= 1000
            ? `${s.capacityGb / 1000}TB ${s.type}`
            : `${s.capacityGb}GB ${s.type}`
        )
        .join(" + ")
    : "Storage";

  const titleShort = `${gpu} Gaming PC — ${cpu}, ${ram}`;
  const title =
    titleShort.length > 80
      ? `${gpu} / ${cpu} / ${ram} — Ready to Ship`
      : `${titleShort} — Tested & Clean`;

  const bullets: string[] = [];
  if (parts.cpu) bullets.push(`CPU: ${parts.cpu.name}`);
  if (parts.gpu) bullets.push(`GPU: ${parts.gpu.name} (${parts.gpu.vramGb}GB VRAM)`);
  if (parts.motherboard) bullets.push(`Motherboard: ${parts.motherboard.name}`);
  if (parts.ram) bullets.push(`RAM: ${parts.ram.capacityGb}GB ${parts.ram.type}-${parts.ram.speedMhz}`);
  if (parts.storage?.length) {
    for (const s of parts.storage) {
      bullets.push(`Storage: ${s.name}`);
    }
  }
  if (parts.psu) bullets.push(`PSU: ${parts.psu.wattage}W 80+ ${parts.psu.efficiency}`);
  if (parts.cooler) bullets.push(`Cooler: ${parts.cooler.name}`);
  if (parts.case) bullets.push(`Case: ${parts.case.name}`);

  const compatLine =
    compat.overallStatus === "compatible"
      ? "All parts verified compatible."
      : compat.overallStatus === "warning"
        ? "Build verified with minor notes — ask for details."
        : "Compatibility review recommended before purchase.";

  const intelTips: string[] = [];
  for (const entry of entries.slice(0, 4)) {
    const intel = getPartIntel(entry.component);
    if (intel.flipTips[0]) intelTips.push(intel.flipTips[0]);
  }

  const description = [
    `${buildName} — professionally assembled and tested.`,
    "",
    "SPECS:",
    ...bullets.map((b) => `• ${b}`),
    "",
    compatLine,
    "",
    "CONDITION: Used, fully functional. Fresh thermal paste where applicable.",
    "Includes power cable. Ready for pickup or shipping.",
    "",
    intelTips.length > 0 ? `SELLER NOTES: ${intelTips.join(" ")}` : "",
    "",
    "Message for questions. Serious buyers only.",
  ]
    .filter(Boolean)
    .join("\n");

  const hashtags = [
    "#gamingpc",
    "#pcgaming",
    parts.gpu ? `#${parts.gpu.model.replace(/\s+/g, "").toLowerCase()}` : "#custompc",
    parts.cpu?.socket === "AM5" ? "#am5" : parts.cpu?.socket === "AM4" ? "#am4" : "#intel",
    "#pcflip",
  ];

  const photoChecklist = [
    "Front of case with RGB/fans visible",
    "Interior GPU and cable management",
    "CPU cooler and RAM clearance",
    "Storage drives / M.2 slots",
    "PSU label (wattage + efficiency)",
    "BIOS screenshot (CPU, RAM speed, temps)",
    "Windows desktop or fresh install proof",
    "Benchmark screenshot (optional, boosts conversion)",
  ];

  return {
    title,
    titleShort,
    description,
    bulletPoints: bullets,
    hashtags,
    suggestedPriceRange: {
      min: resale.min,
      max: resale.max,
      mid: resale.mid,
    },
    photoChecklist,
  };
}
