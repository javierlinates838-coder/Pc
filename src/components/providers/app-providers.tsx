"use client";

import { useEffect, useState } from "react";
import { useInventoryStore, useSettingsStore, useBuildStore } from "@/lib/inventory/store";
import { ActiveRigBar } from "@/components/layout/active-rig-bar";
import { PageStepBanner } from "@/components/layout/page-step-banner";
import { WorkflowStepper } from "@/components/layout/workflow-stepper";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      try {
        await Promise.all([
          useInventoryStore.persist.rehydrate(),
          useSettingsStore.persist.rehydrate(),
          useBuildStore.persist.rehydrate(),
        ]);
      } catch {
        // Corrupted storage should not crash the app
        useInventoryStore.setState({ pcs: [] });
        useSettingsStore.setState({
          defaultMarketplaceFee: 10,
          defaultShippingCost: 20,
        });
        useBuildStore.setState({
          currentBuild: {},
          conditions: {},
          buildName: "Untitled Rig",
          savedBuilds: [],
          flipCosts: {
            purchasePrice: 0,
            repairCosts: 0,
            upgradeCosts: 0,
            shippingCosts: 20,
            marketplaceFeePercent: 10,
            otherExpenses: 15,
            targetSellingPrice: 0,
          },
          activeInventoryId: null,
        });
      }

      if (!cancelled) setReady(true);
    }

    hydrate();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="glass-panel w-full max-w-sm rounded-2xl p-8 text-center neon-border">
          <div className="mx-auto mb-5 h-12 w-12 rounded-xl loader-shimmer" />
          <p className="text-sm font-semibold text-gradient">PC Flip Pro</p>
          <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">
            Booting flip intelligence engine…
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 hidden lg:block">
        <WorkflowStepper />
      </div>
      <div className="mb-3 lg:hidden">
        <WorkflowStepper compact />
      </div>
      <ActiveRigBar />
      <PageStepBanner />
      {children}
    </>
  );
}
