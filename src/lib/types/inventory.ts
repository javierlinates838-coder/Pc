import type { PCBuild } from "./components";
import type { ResellerCosts } from "./reseller";

export interface SavedInventoryPC {
  id: string;
  name: string;
  build: PCBuild;
  costs: ResellerCosts;
  status: "draft" | "in-progress" | "listed" | "sold";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryStats {
  totalPCs: number;
  totalInvested: number;
  totalRevenue: number;
  totalEstimatedProfit: number;
  averageProfitPerPC: number;
  averageROI: number;
  bestFlip: SavedInventoryPC | null;
  worstFlip: SavedInventoryPC | null;
}
