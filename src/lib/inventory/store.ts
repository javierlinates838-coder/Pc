"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PCBuild, ComponentMap, BuildPartEntry, Condition, Storage } from "@/lib/types/components";
import type { ResellerCosts } from "@/lib/types/reseller";
import type { SavedInventoryPC, InventoryStats } from "@/lib/types/inventory";
import { calculateProfit } from "@/lib/reseller/profit";
import { estimateCompletePcValue } from "@/lib/pricing/estimator";
import { v4 as uuidv4 } from "uuid";

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
  getStats: () => InventoryStats;
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
          id: uuidv4(),
          name: name ?? `PC #${get().pcs.length + 1}`,
          build: {
            id: uuidv4(),
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
      getStats: () => {
        const pcs = get().pcs;
        if (pcs.length === 0) {
          return {
            totalPCs: 0,
            totalInvested: 0,
            totalRevenue: 0,
            totalEstimatedProfit: 0,
            averageProfitPerPC: 0,
            averageROI: 0,
            bestFlip: null,
            worstFlip: null,
          };
        }

        let totalInvested = 0;
        let totalRevenue = 0;
        let totalProfit = 0;
        let totalROI = 0;
        let bestFlip: SavedInventoryPC | null = null;
        let worstFlip: SavedInventoryPC | null = null;
        let bestProfit = -Infinity;
        let worstProfit = Infinity;

        for (const pc of pcs) {
          const profit = calculateProfit(pc.costs);
          totalInvested += profit.totalInvestment;
          totalRevenue += profit.expectedSalePrice;
          totalProfit += profit.estimatedProfit;
          totalROI += profit.roi;

          if (profit.estimatedProfit > bestProfit) {
            bestProfit = profit.estimatedProfit;
            bestFlip = pc;
          }
          if (profit.estimatedProfit < worstProfit) {
            worstProfit = profit.estimatedProfit;
            worstFlip = pc;
          }
        }

        return {
          totalPCs: pcs.length,
          totalInvested,
          totalRevenue,
          totalEstimatedProfit: totalProfit,
          averageProfitPerPC: totalProfit / pcs.length,
          averageROI: totalROI / pcs.length,
          bestFlip,
          worstFlip,
        };
      },
    }),
    { name: "pc-reseller-inventory" }
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
    { name: "pc-reseller-settings" }
  )
);
