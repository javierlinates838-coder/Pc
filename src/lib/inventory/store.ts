"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { PCBuild, ComponentMap, BuildPartEntry, Condition, Storage } from "@/lib/types/components";
import type { ResellerCosts } from "@/lib/types/reseller";
import type { SavedInventoryPC } from "@/lib/types/inventory";
import { calculateProfit } from "@/lib/reseller/profit";
import { componentMapToEntries, conditionsFromPcBuild, pcBuildToComponentMap } from "@/lib/build/helpers";
import { conditionsForParts } from "@/lib/flip/conditions";
import { defaultFlipCosts } from "@/lib/flip/defaults";
import { estimateFlipResale } from "@/lib/flip/resale";
import { createId, safeLocalStorage } from "@/lib/inventory/persist-storage";

export interface SavedBuildSnapshot {
  id: string;
  name: string;
  parts: ComponentMap;
  createdAt: string;
  updatedAt: string;
}

export interface FlipLoadOptions {
  name?: string;
  conditions?: Partial<Record<string, Condition>>;
  defaultCondition?: Condition;
  costs?: Partial<ResellerCosts>;
  inventoryId?: string | null;
}

interface BuildStore {
  currentBuild: ComponentMap;
  conditions: Partial<Record<string, Condition>>;
  buildName: string;
  savedBuilds: SavedBuildSnapshot[];
  flipCosts: ResellerCosts;
  activeInventoryId: string | null;
  setPart: (category: keyof ComponentMap, component: unknown) => void;
  removePart: (category: keyof ComponentMap) => void;
  setCondition: (componentId: string, condition: Condition) => void;
  setAllConditions: (condition: Condition) => void;
  setBuildName: (name: string) => void;
  setFlipCosts: (costs: Partial<ResellerCosts>) => void;
  clearBuild: () => void;
  loadBuild: (parts: ComponentMap, nameOrOptions?: string | FlipLoadOptions) => void;
  loadInventoryPc: (pc: SavedInventoryPC) => void;
  saveCurrentBuild: () => boolean;
  loadSavedBuild: (id: string) => void;
  deleteSavedBuild: (id: string) => void;
  updateActiveInventory: () => boolean;
}

interface InventoryStore {
  pcs: SavedInventoryPC[];
  addPC: (
    build: ComponentMap,
    costs: ResellerCosts,
    name?: string,
    conditions?: Partial<Record<string, Condition>>
  ) => SavedInventoryPC | null;
  updatePC: (id: string, updates: Partial<SavedInventoryPC>) => void;
  removePC: (id: string) => void;
}

interface SettingsStore {
  defaultMarketplaceFee: number;
  defaultShippingCost: number;
  setDefaultMarketplaceFee: (fee: number) => void;
  setDefaultShippingCost: (cost: number) => void;
}

function buildEntriesFromStore(
  parts: ComponentMap,
  conditions: Partial<Record<string, Condition>>
): BuildPartEntry[] {
  return componentMapToEntries(parts, conditions);
}

function partsToPcBuildParts(
  build: ComponentMap,
  conditions: Partial<Record<string, Condition>>
): PCBuild["parts"] {
  return Object.fromEntries(
    Object.entries(build).map(([k, v]) => [
      k,
      Array.isArray(v)
        ? v.map((c) => ({
            component: c,
            condition: conditions[c.id] ?? "used",
          }))
        : v
          ? {
              component: v,
              condition: conditions[v.id] ?? "used",
            }
          : undefined,
    ])
  );
}

const emptyFlipCosts = (): ResellerCosts => ({
  purchasePrice: 0,
  repairCosts: 0,
  upgradeCosts: 0,
  shippingCosts: 20,
  marketplaceFeePercent: 10,
  otherExpenses: 15,
  targetSellingPrice: 0,
});

export const useBuildStore = create<BuildStore>()(
  persist(
    (set, get) => ({
      currentBuild: {},
      conditions: {},
      buildName: "Untitled Rig",
      savedBuilds: [],
      flipCosts: emptyFlipCosts(),
      activeInventoryId: null,
      setPart: (category, component) =>
        set((state) => {
          if (category === "storage" && component) {
            const storageItem = component as Storage;
            const existing = state.currentBuild.storage ?? [];
            const nextConditions = {
              ...state.conditions,
              [storageItem.id]:
                state.conditions[storageItem.id] ?? "used",
            };
            return {
              currentBuild: {
                ...state.currentBuild,
                storage: [...existing, storageItem],
              },
              conditions: nextConditions,
            };
          }
          const comp = component as { id: string };
          return {
            currentBuild: {
              ...state.currentBuild,
              [category]: component as ComponentMap[typeof category],
            },
            conditions: comp?.id
              ? {
                  ...state.conditions,
                  [comp.id]: state.conditions[comp.id] ?? "used",
                }
              : state.conditions,
          };
        }),
      removePart: (category) =>
        set((state) => {
          const next = { ...state.currentBuild };
          const removed = next[category];
          delete next[category];
          const nextConditions = { ...state.conditions };
          if (category === "storage" && Array.isArray(removed)) {
            for (const s of removed) delete nextConditions[s.id];
          } else if (removed && !Array.isArray(removed) && "id" in removed) {
            delete nextConditions[(removed as { id: string }).id];
          }
          return { currentBuild: next, conditions: nextConditions };
        }),
      setCondition: (componentId, condition) =>
        set((state) => ({
          conditions: { ...state.conditions, [componentId]: condition },
        })),
      setAllConditions: (condition) =>
        set((state) => ({
          conditions: conditionsForParts(
            state.currentBuild,
            condition,
            state.conditions
          ),
        })),
      setFlipCosts: (costs) =>
        set((state) => ({
          flipCosts: { ...state.flipCosts, ...costs },
        })),
      setBuildName: (name) => set({ buildName: name }),
      clearBuild: () =>
        set({
          currentBuild: {},
          conditions: {},
          buildName: "Untitled Rig",
          flipCosts: emptyFlipCosts(),
          activeInventoryId: null,
        }),
      loadBuild: (parts, nameOrOptions) => {
        const opts: FlipLoadOptions =
          typeof nameOrOptions === "string"
            ? { name: nameOrOptions }
            : nameOrOptions ?? {};

        const defaultCondition = opts.defaultCondition ?? "used";
        const conditions = opts.conditions
          ? { ...conditionsForParts(parts, defaultCondition), ...opts.conditions }
          : conditionsForParts(parts, defaultCondition);

        const settings = useSettingsStore.getState();
        const entries = componentMapToEntries(parts, conditions);
        const resale = entries.length > 0 ? estimateFlipResale(entries) : null;

        const flipCosts = defaultFlipCosts(settings, {
          ...opts.costs,
          targetSellingPrice:
            opts.costs?.targetSellingPrice ?? resale?.mid ?? 0,
        });

        set({
          currentBuild: parts,
          conditions,
          buildName: opts.name ?? "Loaded Build",
          flipCosts,
          activeInventoryId: opts.inventoryId ?? null,
        });
      },
      loadInventoryPc: (pc) => {
        const parts = pcBuildToComponentMap(pc.build);
        const conditions = conditionsFromPcBuild(pc.build);
        get().loadBuild(parts, {
          name: pc.name,
          conditions,
          costs: pc.costs,
          inventoryId: pc.id,
        });
      },
      saveCurrentBuild: () => {
        const { currentBuild, buildName, savedBuilds } = get();
        if (Object.keys(currentBuild).length === 0) return false;
        const existing = savedBuilds.find((b) => b.name === buildName);
        if (existing) {
          set({
            savedBuilds: savedBuilds.map((b) =>
              b.id === existing.id
                ? {
                    ...b,
                    parts: currentBuild,
                    updatedAt: new Date().toISOString(),
                  }
                : b
            ),
          });
          return true;
        }
        const snapshot: SavedBuildSnapshot = {
          id: createId(),
          name: buildName,
          parts: currentBuild,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set({ savedBuilds: [...savedBuilds, snapshot] });
        return true;
      },
      loadSavedBuild: (id) => {
        const snap = get().savedBuilds.find((b) => b.id === id);
        if (snap) {
          get().loadBuild(snap.parts, {
            name: snap.name,
            inventoryId: null,
          });
        }
      },
      deleteSavedBuild: (id) =>
        set((state) => ({
          savedBuilds: state.savedBuilds.filter((b) => b.id !== id),
        })),
      updateActiveInventory: () => {
        const {
          activeInventoryId,
          currentBuild,
          conditions,
          buildName,
          flipCosts,
        } = get();
        if (!activeInventoryId || Object.keys(currentBuild).length === 0) {
          return false;
        }
        const inventory = useInventoryStore.getState();
        const existing = inventory.pcs.find((p) => p.id === activeInventoryId);
        if (!existing) return false;

        inventory.updatePC(activeInventoryId, {
          name: buildName,
          build: {
            ...existing.build,
            name: buildName,
            parts: partsToPcBuildParts(currentBuild, conditions),
            updatedAt: new Date().toISOString(),
          },
          costs: flipCosts,
        });
        return true;
      },
    }),
    {
      name: "pc-reseller-build",
      storage: createJSONStorage(() => safeLocalStorage),
      skipHydration: true,
      partialize: (state) => ({
        currentBuild: state.currentBuild,
        conditions: state.conditions,
        buildName: state.buildName,
        savedBuilds: state.savedBuilds,
        flipCosts: state.flipCosts,
        activeInventoryId: state.activeInventoryId,
      }),
    }
  )
);

export const useInventoryStore = create<InventoryStore>()(
  persist(
    (set, get) => ({
      pcs: [],
      addPC: (build, costs, name, conditions = {}) => {
        if (Object.keys(build).length === 0) return null;

        const entries = buildEntriesFromStore(build, conditions);
        const resale = estimateFlipResale(entries);
        const resolvedCosts: ResellerCosts = {
          ...costs,
          targetSellingPrice:
            costs.targetSellingPrice > 0
              ? costs.targetSellingPrice
              : resale.mid,
        };

        const profit = calculateProfit(resolvedCosts);
        const pcName = name ?? `PC #${get().pcs.length + 1}`;

        const pc: SavedInventoryPC = {
          id: createId(),
          name: pcName,
          build: {
            id: createId(),
            name: pcName,
            parts: partsToPcBuildParts(build, conditions),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          costs: resolvedCosts,
          status: "draft",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({ pcs: [...state.pcs, pc] }));
        void profit;
        return pc;
      },
      updatePC: (id, updates) =>
        set((state) => ({
          pcs: state.pcs.map((pc) =>
            pc.id === id
              ? { ...pc, ...updates, updatedAt: new Date().toISOString() }
              : pc
          ),
        })),
      removePC: (id) => {
        set((state) => ({ pcs: state.pcs.filter((pc) => pc.id !== id) }));
        if (useBuildStore.getState().activeInventoryId === id) {
          useBuildStore.setState({ activeInventoryId: null });
        }
      },
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
