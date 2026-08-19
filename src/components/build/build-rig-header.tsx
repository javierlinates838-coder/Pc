"use client";

interface BuildRigHeaderProps {
  buildName: string;
  onNameChange: (name: string) => void;
  onSave?: () => void;
  subtitle?: string;
}

export function BuildRigHeader({
  buildName,
  onNameChange,
  onSave,
  subtitle = "Step 2 — the parts in your current flip. Add or change them here.",
}: BuildRigHeaderProps) {
  return (
    <header className="space-y-3">
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-sm font-bold text-white shadow-[0_0_16px_rgba(255,77,157,0.45)]"
          aria-hidden
        >
          B
        </div>
        <div className="min-w-0 flex-1">
          <input
            type="text"
            value={buildName}
            onChange={(e) => onNameChange(e.target.value)}
            className="w-full truncate bg-transparent text-base font-bold uppercase tracking-wide text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted-foreground)] sm:text-lg"
            placeholder="Untitled rig"
            aria-label="Build name"
          />
        </div>
        <span className="shrink-0 rounded-full border border-[var(--color-border)] bg-[var(--color-secondary)]/50 px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
          Saved local
        </span>
        {onSave && (
          <button
            type="button"
            onClick={onSave}
            className="shrink-0 rounded-full bg-[var(--color-primary)] px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-white shadow-[0_0_12px_rgba(255,77,157,0.35)]"
          >
            Save build
          </button>
        )}
      </div>
      <p className="text-xs leading-relaxed text-[var(--color-muted-foreground)] sm:text-sm">
        {subtitle}
      </p>
    </header>
  );
}
