import type { PCComponent, PartCategory } from "@/lib/types/components";
import { amdRyzenCPUs } from "./cpus/amd";
import { intelCPUs } from "./cpus/intel";
import { nvidiaGPUs } from "./gpus/nvidia";
import { amdGPUs } from "./gpus/amd";
import {
  am4Motherboards,
  am5Motherboards,
  intelMotherboards,
} from "./motherboards";
import { ddr4Ram, ddr5Ram } from "./ram";
import { nvmeSSDs, sataSSDs, hdds } from "./storage";
import { psus } from "./psus";
import { pcCases } from "./cases";
import { cpuCoolers } from "./coolers";
import { caseFans, wifiModules, operatingSystems } from "./misc";

export const componentDatabase: PCComponent[] = [
  ...amdRyzenCPUs,
  ...intelCPUs,
  ...nvidiaGPUs,
  ...amdGPUs,
  ...am4Motherboards,
  ...am5Motherboards,
  ...intelMotherboards,
  ...ddr4Ram,
  ...ddr5Ram,
  ...nvmeSSDs,
  ...sataSSDs,
  ...hdds,
  ...psus,
  ...pcCases,
  ...cpuCoolers,
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
    return category
      ? componentsByCategory[category]
      : componentDatabase.slice(0, 50);
  }

  const pool = category ? componentsByCategory[category] : componentDatabase;

  return pool.filter(
    (c) =>
      c.name.toLowerCase().includes(normalized) ||
      c.brand.toLowerCase().includes(normalized) ||
      c.model.toLowerCase().includes(normalized) ||
      c.tags?.some((t) => t.toLowerCase().includes(normalized))
  );
}

export function fuzzyMatchComponent(text: string): PCComponent[] {
  const normalized = text.toLowerCase();
  const tokens = normalized.split(/[\s,]+/).filter(Boolean);

  const scored = componentDatabase.map((component) => {
    const haystack = `${component.name} ${component.brand} ${component.model} ${component.tags?.join(" ") ?? ""}`.toLowerCase();
    let score = 0;
    for (const token of tokens) {
      if (haystack.includes(token)) score += token.length;
    }
    return { component, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((s) => s.component);
}

export { amdRyzenCPUs, intelCPUs, nvidiaGPUs, amdGPUs };
export { am4Motherboards, am5Motherboards, intelMotherboards };
export { ddr4Ram, ddr5Ram };
export { nvmeSSDs, sataSSDs, hdds };
export { psus, pcCases, cpuCoolers, caseFans, wifiModules, operatingSystems };
