# Status Palette And Pill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralize the first duplicated status styles and migrate sync status labels plus agent dot state classes to shared primitives.

**Architecture:** `app/src/lib/statusPalette.ts` owns semantic Tailwind class strings. `app/src/components/ui/StatusPill.tsx` provides the shared pill shell. Existing pages keep labels, handlers, and data flow; they only consume shared classes and the new pill primitive.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, existing `cn` helper.

## Global Constraints

- Do not redesign Dashboard, cards, or page layouts.
- Do not migrate all colored badges in the app.
- Do not change `skillTags` or `presetIcons`; they are separate category/icon palettes.
- Do not change sync status labels or i18n keys.
- Do not add dependencies.
- Preserve current colors in this first slice.
- Run verification from the repo root with `npm --prefix app run build` and `npm --prefix app run lint`.

---

## File Structure

- Create `app/src/lib/statusPalette.ts`: shared sync status and agent dot classes.
- Create `app/src/components/ui/StatusPill.tsx`: shared status pill shell.
- Modify `app/src/views/WorkspaceView.tsx`: use `syncStatusClass` and `StatusPill`.
- Modify `app/src/views/ProjectDetail.tsx`: use `syncStatusClass` and `StatusPill`.
- Modify `app/src/components/SyncDots.tsx`: use shared agent dot classes.
- Modify `app/src/components/ProjectAgentDots.tsx`: use shared agent dot classes.

## Task 1: Add Shared Status Palette And StatusPill

**Files:**
- Create: `app/src/lib/statusPalette.ts`
- Create: `app/src/components/ui/StatusPill.tsx`

**Interfaces:**
- Produces `SyncStatusTone`, `AgentDotState`, `syncStatusClass`, `agentDotIconClass`, `agentDotTextClass`, `hiddenAgentDotClass`.
- Produces `StatusPill({ children, className, title }: StatusPillProps)`.

- [ ] **Step 1: Create `statusPalette.ts`**

Add this file:

```ts
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
```

- [ ] **Step 2: Create `StatusPill.tsx`**

Add this file:

```tsx
import type { ReactNode } from "react";
import { cn } from "../../utils";

interface StatusPillProps {
  children: ReactNode;
  className?: string;
  title?: string;
}

export function StatusPill({ children, className, title }: StatusPillProps) {
  return (
    <span
      title={title}
      className={cn("rounded-full px-2 py-0.5 text-[12px] font-medium", className)}
    >
      {children}
    </span>
  );
}
```

- [ ] **Step 3: Run build and lint**

Run:

```bash
npm --prefix app run build
npm --prefix app run lint
```

Expected: both commands exit 0.

- [ ] **Step 4: Commit**

```bash
git add app/src/lib/statusPalette.ts app/src/components/ui/StatusPill.tsx
git commit -m "feat(ui): add shared status palette"
```

## Task 2: Migrate WorkspaceView And ProjectDetail Sync Pills

**Files:**
- Modify: `app/src/views/WorkspaceView.tsx`
- Modify: `app/src/views/ProjectDetail.tsx`

**Interfaces:**
- Consumes `syncStatusClass` from `../lib/statusPalette`.
- Consumes `StatusPill` from `../components/ui/StatusPill`.

- [ ] **Step 1: Import shared primitives in both files**

Add to `WorkspaceView.tsx`:

```tsx
import { StatusPill } from "../components/ui/StatusPill";
import { syncStatusClass, type SyncStatusTone } from "../lib/statusPalette";
```

Add the same two imports to `ProjectDetail.tsx`.

- [ ] **Step 2: Update `WorkspaceView.getLocalStatusMeta`**

Change its return type behavior so each case returns `syncStatusClass[...]`:

```tsx
function getLocalStatusMeta(t: (key: string) => string, status: ProjectSkill["sync_status"]) {
  const tone = status as SyncStatusTone;
  switch (status) {
    case "in_sync":
      return {
        label: t("globalWorkspace.localSkills.status.inSync"),
        className: syncStatusClass[tone],
      };
    case "project_newer":
      return {
        label: t("globalWorkspace.localSkills.status.localNewer"),
        className: syncStatusClass[tone],
      };
    case "center_newer":
      return {
        label: t("globalWorkspace.localSkills.status.centerNewer"),
        className: syncStatusClass[tone],
      };
    case "diverged":
      return {
        label: t("globalWorkspace.localSkills.status.diverged"),
        className: syncStatusClass[tone],
      };
    default:
      return {
        label: t("globalWorkspace.localSkills.status.localOnly"),
        className: syncStatusClass.project_only,
      };
  }
}
```

- [ ] **Step 3: Replace WorkspaceView status label span with `StatusPill`**

Replace:

```tsx
<span className={cn("rounded-full px-2 py-0.5 text-[12px] font-medium", status.className)}>
  {status.label}
</span>
```

with:

```tsx
<StatusPill className={status.className}>{status.label}</StatusPill>
```

- [ ] **Step 4: Update `ProjectDetail.getSyncStatusMeta`**

Change each status case to return `syncStatusClass[...]`, mirroring the `WorkspaceView` implementation but preserving existing project i18n labels.

- [ ] **Step 5: Replace ProjectDetail status label spans with `StatusPill`**

Find spans with this class shape:

```tsx
className={cn("rounded-full px-2 py-0.5 text-[12px] font-medium", status.className)}
```

Replace each with:

```tsx
<StatusPill className={status.className}>{status.label}</StatusPill>
```

- [ ] **Step 6: Confirm duplicate sync status color literals are removed from both files**

Run:

```bash
rg -n "bg-emerald-500/10 text-emerald-600|bg-amber-500/10 text-amber-700|bg-sky-500/10 text-sky-700|bg-violet-500/10 text-violet-700|bg-surface-hover text-muted" app/src/views/WorkspaceView.tsx app/src/views/ProjectDetail.tsx
```

Expected: no output from `getLocalStatusMeta` or `getSyncStatusMeta`. If output remains in unrelated UI, inspect it before changing.

- [ ] **Step 7: Run build and lint**

Run:

```bash
npm --prefix app run build
npm --prefix app run lint
```

Expected: both commands exit 0.

- [ ] **Step 8: Commit**

```bash
git add app/src/views/WorkspaceView.tsx app/src/views/ProjectDetail.tsx
git commit -m "refactor(ui): use shared sync status pills"
```

## Task 3: Migrate Agent Dot State Classes

**Files:**
- Modify: `app/src/components/SyncDots.tsx`
- Modify: `app/src/components/ProjectAgentDots.tsx`

**Interfaces:**
- Consumes `agentDotIconClass`, `agentDotTextClass`, `hiddenAgentDotClass`, and `AgentDotState` from `../lib/statusPalette`.

- [ ] **Step 1: Import shared agent dot classes in both files**

Add this import to each file:

```tsx
import {
  agentDotIconClass,
  agentDotTextClass,
  hiddenAgentDotClass,
  type AgentDotState,
} from "../lib/statusPalette";
```

- [ ] **Step 2: Replace local dot state type aliases**

In both files, replace:

```ts
type DotState = "synced" | "available" | "orphan";
```

with:

```ts
type DotState = AgentDotState;
```

- [ ] **Step 3: Remove local class maps**

Delete `iconStateClass` and `textStateClass` from both files.

- [ ] **Step 4: Update dot base class usage**

Replace:

```tsx
useIcon ? iconStateClass[dot.state] : cn("border font-mono font-semibold tracking-tight", textStateClass[dot.state])
```

with:

```tsx
useIcon ? agentDotIconClass[dot.state] : cn("border font-mono font-semibold tracking-tight", agentDotTextClass[dot.state])
```

- [ ] **Step 5: Update hidden count class usage**

Replace the hidden-count class string:

```tsx
"inline-flex select-none items-center justify-center rounded-control border border-border-subtle bg-surface-hover font-mono font-semibold text-faint"
```

with:

```tsx
cn("inline-flex select-none items-center justify-center rounded-control", hiddenAgentDotClass)
```

- [ ] **Step 6: Confirm local class maps are gone**

Run:

```bash
rg -n "iconStateClass|textStateClass|border border-amber-500/40 bg-amber-500/10|border border-border-subtle bg-surface-hover font-mono" app/src/components/SyncDots.tsx app/src/components/ProjectAgentDots.tsx
```

Expected: no output.

- [ ] **Step 7: Run build and lint**

Run:

```bash
npm --prefix app run build
npm --prefix app run lint
```

Expected: both commands exit 0.

- [ ] **Step 8: Commit**

```bash
git add app/src/components/SyncDots.tsx app/src/components/ProjectAgentDots.tsx
git commit -m "refactor(ui): share agent dot status classes"
```

## Task 4: Final Verification

**Files:**
- Inspect: all files modified by Tasks 1-3.

- [ ] **Step 1: Run final build and lint**

Run:

```bash
npm --prefix app run build
npm --prefix app run lint
```

Expected: both commands exit 0.

- [ ] **Step 2: Check git status**

Run:

```bash
git status --short --branch
```

Expected: clean worktree, branch ahead of `origin/main` by the new design, plan, and implementation commits.
