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
import { ramBatch3 } from "./ram/batch3";
import { nvmeSSDs, sataSSDs, hdds } from "./storage";
import { storageExtended } from "./storage/extended";
import { storageBatch3 } from "./storage/batch3";
import { psus } from "./psus";
import { psuExtended } from "./psus/extended";
import { psuBatch3 } from "./psus/batch3";
import { pcCases } from "./cases";
import { caseExtended } from "./cases/extended";
import { caseBatch3 } from "./cases/batch3";
import { cpuCoolers } from "./coolers";
import { coolerExtended } from "./coolers/extended";
import { coolerBatch3 } from "./coolers/batch3";
import { cpuBatch2 } from "./cpus/batch2";
import { zen5CPUs } from "./cpus/zen5";
import { cpuBatch4 } from "./cpus/batch4";
import { gpuBatch2 } from "./gpus/batch2";
import { blackwellGPUs } from "./gpus/blackwell";
import { gpuBatch4 } from "./gpus/batch4";
import { motherboardBatch2 } from "./motherboards/batch2";
import { caseFans, wifiModules, operatingSystems } from "./misc";
import { fansBatch3, wifiBatch3 } from "./misc/batch3";
import {
  motherboardBatch4,
  ramBatch4,
  psuBatch4,
  storageBatch4,
  caseBatch4,
} from "./parts-batch4";

export const componentDatabase: PCComponent[] = [
  ...amdRyzenCPUs,
  ...intelCPUs,
  ...amdRyzenExtended,
  ...intelExtended,
  ...cpuBatch2,
  ...zen5CPUs,
  ...cpuBatch4,
  ...nvidiaGPUs,
  ...amdGPUs,
  ...nvidiaExtended,
  ...amdGpuExtended,
  ...gpuBatch2,
  ...blackwellGPUs,
  ...gpuBatch4,
  ...am4Motherboards,
  ...am5Motherboards,
  ...intelMotherboards,
  ...motherboardExtended,
  ...motherboardBatch2,
  ...motherboardBatch4,
  ...ddr4Ram,
  ...ddr5Ram,
  ...ramExtended,
  ...ramBatch3,
  ...ramBatch4,
  ...nvmeSSDs,
  ...sataSSDs,
  ...hdds,
  ...storageExtended,
  ...storageBatch3,
  ...storageBatch4,
  ...psus,
  ...psuExtended,
  ...psuBatch3,
  ...psuBatch4,
  ...pcCases,
  ...caseExtended,
  ...caseBatch3,
  ...caseBatch4,
  ...cpuCoolers,
  ...coolerExtended,
  ...coolerBatch3,
  ...caseFans,
  ...fansBatch3,
  ...wifiModules,
  ...wifiBatch3,
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

export function fuzzyMatchComponent(
  text: string,
  minScore = 8
): PCComponent[] {
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
    .filter((s) => s.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((s) => s.component);
}

export function fuzzyMatchComponentScored(
  text: string,
  minScore = 8
): { component: PCComponent; score: number }[] {
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
    .filter((s) => s.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
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
