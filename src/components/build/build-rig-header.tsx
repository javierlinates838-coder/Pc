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
  subtitle,
}: BuildRigHeaderProps) {
  return (
    <header className="space-y-2">
      <div className="flex items-center gap-2">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-bold text-white shadow-[0_0_12px_rgba(255,77,157,0.4)]"
          aria-hidden
        >
          B
        </div>
        <input
          type="text"
          value={buildName}
          onChange={(e) => onNameChange(e.target.value)}
          className="min-w-0 flex-1 bg-transparent text-sm font-bold uppercase tracking-wide text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted-foreground)] sm:text-base"
          placeholder="Untitled rig"
          aria-label="Build name"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-secondary)]/50 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
          Saved on device
        </span>
        {onSave && (
          <button
            type="button"
            onClick={onSave}
            className="rounded-full bg-[var(--color-primary)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-[0_0_12px_rgba(255,77,157,0.35)]"
          >
            Save build
          </button>
        )}
      </div>
      {subtitle && (
        <p className="text-xs leading-relaxed text-[var(--color-muted-foreground)]">
          {subtitle}
        </p>
      )}
    </header>
  );
}
