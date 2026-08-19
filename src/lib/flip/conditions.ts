import type { ComponentMap, Condition } from "@/lib/types/components";
import type { ListingConditionHint } from "@/lib/reseller/listing-parser";

export function listingHintToCondition(hint: ListingConditionHint): Condition {
  switch (hint) {
    case "new":
      return "new";
    case "like-new":
      return "like-new";
    case "fair":
      return "fair";
    case "parts":
      return "parts";
    case "used":
      return "used";
    default:
      return "used";
  }
}

export function conditionsForParts(
  parts: ComponentMap,
  defaultCondition: Condition = "used",
  existing?: Partial<Record<string, Condition>>
): Partial<Record<string, Condition>> {
  const map: Partial<Record<string, Condition>> = { ...existing };

  for (const [key, value] of Object.entries(parts)) {
    if (key === "storage" && Array.isArray(value)) {
      for (const s of value) {
        map[s.id] = map[s.id] ?? defaultCondition;
      }
    } else if (value && !Array.isArray(value)) {
      map[value.id] = map[value.id] ?? defaultCondition;
    }
  }

  return map;
}

export function getConditionForComponent(
  componentId: string,
  conditions: Partial<Record<string, Condition>>,
  fallback: Condition = "used"
): Condition {
  return conditions[componentId] ?? fallback;
}
