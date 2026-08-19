import type { ComponentMap, BuildPartEntry, PCBuild, Storage } from "@/lib/types/components";

export function componentMapToEntries(parts: ComponentMap): BuildPartEntry[] {
  const entries: BuildPartEntry[] = [];
  for (const [key, value] of Object.entries(parts)) {
    if (key === "storage" && Array.isArray(value)) {
      for (const s of value) entries.push({ component: s, condition: "used" });
    } else if (value && !Array.isArray(value)) {
      entries.push({ component: value, condition: "used" });
    }
  }
  return entries;
}

export function getPartCount(parts: ComponentMap): number {
  let count = 0;
  for (const value of Object.values(parts)) {
    if (Array.isArray(value)) count += value.length;
    else if (value) count++;
  }
  return count;
}

/** Convert persisted PCBuild back to ComponentMap for reload */
export function pcBuildToComponentMap(build: PCBuild): ComponentMap {
  const map: ComponentMap = {};
  for (const [key, entry] of Object.entries(build.parts)) {
    if (!entry) continue;
    if (key === "storage" && Array.isArray(entry)) {
      map.storage = entry.map((e) => e.component as Storage);
    } else if (!Array.isArray(entry)) {
      const cat = key as keyof ComponentMap;
      if (cat !== "storage") {
        (map as Record<string, unknown>)[cat] = entry.component;
      }
    }
  }
  return map;
}
