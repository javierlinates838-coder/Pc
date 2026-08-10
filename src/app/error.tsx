"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="max-w-md text-sm text-[var(--color-muted-foreground)]">
        The app hit an unexpected error. This can happen after an update or if
        saved browser data is corrupted.
      </p>
      <div className="flex gap-3">
        <Button onClick={() => reset()}>Try again</Button>
        <Button
          variant="outline"
          onClick={() => {
            try {
              localStorage.removeItem("pc-reseller-inventory");
              localStorage.removeItem("pc-reseller-settings");
            } catch {
              // ignore
            }
            window.location.href = "/";
          }}
        >
          Reset saved data
        </Button>
      </div>
    </div>
  );
}
