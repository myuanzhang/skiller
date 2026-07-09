export type SyncStatusTone =
  | "in_sync"
  | "project_newer"
  | "center_newer"
  | "diverged"
  | "project_only";

export const syncStatusClass: Record<SyncStatusTone, string> = {
  in_sync: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  project_newer: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  center_newer: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  diverged: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  project_only: "bg-surface-hover text-muted",
};

export type AgentDotState = "synced" | "available" | "orphan";

export const agentDotIconClass: Record<AgentDotState, string> = {
  synced: "bg-surface",
  available: "bg-surface opacity-45",
  orphan: "ring-1 ring-inset ring-amber-500/60 bg-surface",
};

export const agentDotTextClass: Record<AgentDotState, string> = {
  synced: "border-transparent bg-[var(--color-text-primary)] text-[var(--color-bg)]",
  available: "border border-border-subtle bg-surface-hover text-faint",
  orphan: "border border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

export const hiddenAgentDotClass =
  "border border-border-subtle bg-surface-hover font-mono font-semibold text-faint";
