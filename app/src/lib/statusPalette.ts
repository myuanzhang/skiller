export type SyncStatusTone =
  | "in_sync"
  | "project_newer"
  | "center_newer"
  | "diverged"
  | "project_only";

export const syncStatusClass: Record<SyncStatusTone, string> = {
  in_sync: "bg-success-bg text-success",
  project_newer: "bg-warning-bg text-warning",
  center_newer: "bg-info-bg text-info",
  // Diverged keeps its distinct violet — no semantic token maps to it, and it
  // must stay visually separate from the danger/warning states above.
  diverged: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  project_only: "bg-surface-hover text-muted",
};

export type AgentDotState = "synced" | "available" | "orphan";

export const agentDotIconClass: Record<AgentDotState, string> = {
  synced: "ring-1 ring-inset ring-accent/60 bg-accent/10 shadow-[0_0_0_1px_rgba(255,255,255,0.35)]",
  // Inactive agents: dimmed but NOT grayscaled — a row of gray blocks reads as
  // dirt on the card. Keep the icon faintly visible so the row still says
  // "available to sync" without becoming visual noise.
  available: "bg-surface opacity-45",
  // Orphan uses amber-500 alpha directly: our --color-warning token is a solid
  // hex, so Tailwind alpha modifiers (ring-warning/60) compile to nothing.
  orphan: "ring-1 ring-inset ring-amber-500/60 bg-amber-500/10",
};

export const agentDotTextClass: Record<AgentDotState, string> = {
  synced: "border border-accent/60 bg-accent/15 text-accent-light shadow-[0_0_0_1px_rgba(255,255,255,0.25)]",
  available: "border border-border-subtle bg-surface-hover text-faint opacity-55",
  orphan: "border border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

export const hiddenAgentDotClass =
  "border border-border-subtle bg-surface-hover font-mono font-semibold text-faint";
