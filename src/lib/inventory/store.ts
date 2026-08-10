"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { PCBuild, ComponentMap, BuildPartEntry, Condition, Storage } from "@/lib/types/components";
import type { ResellerCosts } from "@/lib/types/reseller";
import type { SavedInventoryPC } from "@/lib/types/inventory";
import { calculateProfit } from "@/lib/reseller/profit";
import { estimateCompletePcValue } from "@/lib/pricing/estimator";
import { createId, safeLocalStorage } from "@/lib/inventory/persist-storage";

function buildToEntries(parts: ComponentMap): BuildPartEntry[] {
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

interface BuildStore {
  currentBuild: ComponentMap;
  conditions: Partial<Record<string, Condition>>;
  buildName: string;
  setPart: (category: keyof ComponentMap, component: unknown) => void;
  removePart: (category: keyof ComponentMap) => void;
  setCondition: (componentId: string, condition: Condition) => void;
  setBuildName: (name: string) => void;
  clearBuild: () => void;
  loadBuild: (parts: ComponentMap, name?: string) => void;
}

interface InventoryStore {
  pcs: SavedInventoryPC[];
  addPC: (build: ComponentMap, costs: ResellerCosts, name?: string) => void;
  updatePC: (id: string, updates: Partial<SavedInventoryPC>) => void;
  removePC: (id: string) => void;
}

interface SettingsStore {
  defaultMarketplaceFee: number;
  defaultShippingCost: number;
  setDefaultMarketplaceFee: (fee: number) => void;
  setDefaultShippingCost: (cost: number) => void;
}

export const useBuildStore = create<BuildStore>((set) => ({
  currentBuild: {},
  conditions: {},
  buildName: "New Build",
  setPart: (category, component) =>
    set((state) => {
      if (category === "storage" && component) {
        const storageItem = component as Storage;
        const existing = state.currentBuild.storage ?? [];
        return {
          currentBuild: {
            ...state.currentBuild,
            storage: [...existing, storageItem],
          },
        };
      }
      return {
        currentBuild: {
          ...state.currentBuild,
          [category]: component as ComponentMap[typeof category],
        },
      };
    }),
  removePart: (category) =>
    set((state) => {
      const next = { ...state.currentBuild };
      delete next[category];
      return { currentBuild: next };
    }),
  setCondition: (componentId, condition) =>
    set((state) => ({
      conditions: { ...state.conditions, [componentId]: condition },
    })),
  setBuildName: (name) => set({ buildName: name }),
  clearBuild: () => set({ currentBuild: {}, conditions: {}, buildName: "New Build" }),
  loadBuild: (parts, name) =>
    set({ currentBuild: parts, buildName: name ?? "Loaded Build" }),
}));

export const useInventoryStore = create<InventoryStore>()(
  persist(
    (set, get) => ({
      pcs: [],
      addPC: (build, costs, name) => {
        const entries = buildToEntries(build);
        const resale = estimateCompletePcValue(entries);
        const profit = calculateProfit({
          ...costs,
          targetSellingPrice: costs.targetSellingPrice || resale.mid,
        });

        const pc: SavedInventoryPC = {
          id: createId(),
          name: name ?? `PC #${get().pcs.length + 1}`,
          build: {
            id: createId(),
            name: name ?? `PC #${get().pcs.length + 1}`,
            parts: Object.fromEntries(
              Object.entries(build).map(([k, v]) => [
                k,
                Array.isArray(v)
                  ? v.map((c) => ({ component: c, condition: "used" as Condition }))
                  : v
                    ? { component: v, condition: "used" as Condition }
                    : undefined,
              ])
            ),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          costs: { ...costs, targetSellingPrice: costs.targetSellingPrice || resale.mid },
          status: "draft",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({ pcs: [...state.pcs, pc] }));
        return profit;
      },
      updatePC: (id, updates) =>
        set((state) => ({
          pcs: state.pcs.map((pc) =>
            pc.id === id
              ? { ...pc, ...updates, updatedAt: new Date().toISOString() }
              : pc
          ),
        })),
      removePC: (id) =>
        set((state) => ({ pcs: state.pcs.filter((pc) => pc.id !== id) })),
    }),
    {
      name: "pc-reseller-inventory",
      storage: createJSONStorage(() => safeLocalStorage),
      skipHydration: true,
    }
  )
);

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      defaultMarketplaceFee: 10,
      defaultShippingCost: 20,
      setDefaultMarketplaceFee: (fee) => set({ defaultMarketplaceFee: fee }),
      setDefaultShippingCost: (cost) => set({ defaultShippingCost: cost }),
    }),
    {
      name: "pc-reseller-settings",
      storage: createJSONStorage(() => safeLocalStorage),
      skipHydration: true,
    }
  )
);
