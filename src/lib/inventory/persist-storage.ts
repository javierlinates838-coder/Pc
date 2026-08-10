import type { StateStorage } from "zustand/middleware";

function createSafeStorage(): StateStorage {
  return {
    getItem: (name) => {
      if (typeof window === "undefined") return null;
      try {
        return window.localStorage.getItem(name);
      } catch {
        return null;
      }
    },
    setItem: (name, value) => {
      if (typeof window === "undefined") return;
      try {
        window.localStorage.setItem(name, value);
      } catch {
        // Ignore quota / private browsing errors
      }
    },
    removeItem: (name) => {
      if (typeof window === "undefined") return;
      try {
        window.localStorage.removeItem(name);
      } catch {
        // Ignore storage errors
      }
    },
  };
}

export const safeLocalStorage = createSafeStorage();

export function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
