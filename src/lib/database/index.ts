import type { PCComponent, PartCategory } from "@/lib/types/components";
import { getSearchableText } from "./component-specs";
import { amdRyzenCPUs } from "./cpus/amd";
import { intelCPUs } from "./cpus/intel";
import { amdRyzenExtended } from "./cpus/amd-extended";
import { intelExtended } from "./cpus/intel-extended";
import { nvidiaGPUs } from "./gpus/nvidia";
import { amdGPUs } from "./gpus/amd";
import { nvidiaExtended } from "./gpus/nvidia-extended";
import { amdGpuExtended } from "./gpus/amd-extended";
import {
  am4Motherboards,
  am5Motherboards,
  intelMotherboards,
} from "./motherboards";
import { motherboardExtended } from "./motherboards/extended";
import { ddr4Ram, ddr5Ram } from "./ram";
import { ramExtended } from "./ram/extended";
import { nvmeSSDs, sataSSDs, hdds } from "./storage";
import { storageExtended } from "./storage/extended";
import { psus } from "./psus";
import { psuExtended } from "./psus/extended";
import { pcCases } from "./cases";
import { caseExtended } from "./cases/extended";
import { cpuCoolers } from "./coolers";
import { coolerExtended } from "./coolers/extended";
import { caseFans, wifiModules, operatingSystems } from "./misc";

export const componentDatabase: PCComponent[] = [
  ...amdRyzenCPUs,
  ...intelCPUs,
  ...amdRyzenExtended,
  ...intelExtended,
  ...nvidiaGPUs,
  ...amdGPUs,
  ...nvidiaExtended,
  ...amdGpuExtended,
  ...am4Motherboards,
  ...am5Motherboards,
  ...intelMotherboards,
  ...motherboardExtended,
  ...ddr4Ram,
  ...ddr5Ram,
  ...ramExtended,
  ...nvmeSSDs,
  ...sataSSDs,
  ...hdds,
  ...storageExtended,
  ...psus,
  ...psuExtended,
  ...pcCases,
  ...caseExtended,
  ...cpuCoolers,
  ...coolerExtended,
  ...caseFans,
  ...wifiModules,
  ...operatingSystems,
];

export const componentsByCategory: Record<PartCategory, PCComponent[]> = {
  cpu: componentDatabase.filter((c) => c.category === "cpu"),
  gpu: componentDatabase.filter((c) => c.category === "gpu"),
  motherboard: componentDatabase.filter((c) => c.category === "motherboard"),
  ram: componentDatabase.filter((c) => c.category === "ram"),
  cooler: componentDatabase.filter((c) => c.category === "cooler"),
  psu: componentDatabase.filter((c) => c.category === "psu"),
  storage: componentDatabase.filter((c) => c.category === "storage"),
  case: componentDatabase.filter((c) => c.category === "case"),
  fans: componentDatabase.filter((c) => c.category === "fans"),
  wifi: componentDatabase.filter((c) => c.category === "wifi"),
  os: componentDatabase.filter((c) => c.category === "os"),
};

export function getComponentById(id: string): PCComponent | undefined {
  return componentDatabase.find((c) => c.id === id);
}

export function searchComponents(
  query: string,
  category?: PartCategory
): PCComponent[] {
  const normalized = query.toLowerCase().trim();
  if (!normalized) {
    return category ? componentsByCategory[category] : componentDatabase;
  }

  const pool = category ? componentsByCategory[category] : componentDatabase;

  return pool.filter((c) => getSearchableText(c).includes(normalized));
}

export function fuzzyMatchComponent(text: string): PCComponent[] {
  const normalized = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) return [];

  const tokens = normalized.split(" ").filter((t) => t.length > 1);

  const scored = componentDatabase.map((component) => {
    const haystack = getSearchableText(component);
    let score = 0;

    const name = component.name.toLowerCase();
    if (normalized.includes(name) || name.includes(normalized)) {
      score += 100;
    }

    for (const token of tokens) {
      if (haystack.includes(token)) score += token.length;
    }

    const modelMatch = name.match(/\d{4}[a-z]?|\d{3,4}xt?/gi);
    if (modelMatch) {
      for (const m of modelMatch) {
        if (normalized.includes(m.toLowerCase())) score += 10;
      }
    }

    return { component, score };
  });

  return scored
    .filter((s) => s.score >= 4)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((s) => s.component);
}

export function getDatabaseStats() {
  const byCategory = {} as Record<PartCategory, number>;
  for (const c of componentDatabase) {
    byCategory[c.category] = (byCategory[c.category] ?? 0) + 1;
  }
  return {
    total: componentDatabase.length,
    byCategory,
  };
}

export { getComponentSpecLines, getSearchableText } from "./component-specs";
