"use client";

import { useMemo } from "react";
import { useInventoryStore } from "@/lib/inventory/store";
import { calculateInventoryStats } from "@/lib/inventory/stats";

export function useInventoryStats() {
  const pcs = useInventoryStore((state) => state.pcs);
  return useMemo(() => calculateInventoryStats(pcs), [pcs]);
}
