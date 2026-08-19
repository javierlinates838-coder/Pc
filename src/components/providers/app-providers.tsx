"use client";

import { useEffect, useState } from "react";
import { useInventoryStore, useSettingsStore, useBuildStore } from "@/lib/inventory/store";

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
          buildName: "Untitled Rig",
          savedBuilds: [],
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
      <div className="flex min-h-[40vh] items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
          <p className="text-sm font-medium">Loading PC Flip Pro</p>
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            Preparing your reseller tools…
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
