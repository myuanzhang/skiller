# Empty State And Skeleton Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add shared empty/loading primitives and migrate the selected first batch of list and document states.

**Architecture:** `EmptyState` centralizes quiet centered messaging. `Skeleton`, `SkeletonRows`, and `DocumentSkeleton` provide stable loading placeholders. Existing pages keep their loading conditions, labels, actions, and data flow.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, existing `cn` helper and lucide icons.

## Global Constraints

- Do not redesign `InstallSkills`.
- Do not change data fetching or loading conditions.
- Do not change i18n keys or copy.
- Do not add new dependencies.
- Do not redesign cards, page headers, or Dashboard in this slice.
- Do not replace every spinner in the app.
- Run verification from the repo root with `npm --prefix app run build` and `npm --prefix app run lint`.

---

## File Structure

- Create `app/src/components/ui/EmptyState.tsx`: shared centered empty/message block.
- Create `app/src/components/ui/Skeleton.tsx`: shared skeleton block and helpers.
- Modify `app/src/views/WorkspaceView.tsx`: selected list and document loading/empty states.
- Modify `app/src/views/ProjectDetail.tsx`: selected list and document loading/empty states.
- Modify `app/src/components/SkillDetailPanel.tsx`: selected document loading/empty states.
- Modify `app/src/views/MySkills.tsx`: simple list empty state.

## Task 1: Add EmptyState And Skeleton Primitives

**Files:**
- Create: `app/src/components/ui/EmptyState.tsx`
- Create: `app/src/components/ui/Skeleton.tsx`

**Interfaces:**
- Produces `EmptyState({ icon, title, description, action, className }: EmptyStateProps)`.
- Produces `Skeleton`, `SkeletonRows`, and `DocumentSkeleton`.

- [ ] **Step 1: Create `EmptyState.tsx`**

Add this file:

```tsx
import type { ReactNode } from "react";
import { cn } from "../../utils";

interface EmptyStateProps {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-4 text-center", className)}>
      {icon ? <div className="mb-4 text-faint">{icon}</div> : null}
      <h3 className="mb-1.5 text-[14px] font-semibold text-tertiary">{title}</h3>
      {description ? <p className="max-w-md text-[13px] text-muted">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
```

- [ ] **Step 2: Create `Skeleton.tsx`**

Add this file:

```tsx
import { cn } from "../../utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-control bg-surface-hover/80 dark:bg-surface-active/70",
        className
      )}
    />
  );
}

interface SkeletonRowsProps {
  rows?: number;
  className?: string;
}

export function SkeletonRows({ rows = 6, className }: SkeletonRowsProps) {
  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="app-panel flex items-center gap-3 px-3.5 py-3">
          <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}

interface DocumentSkeletonProps {
  className?: string;
}

export function DocumentSkeleton({ className }: DocumentSkeletonProps) {
  return (
    <div className={cn("mt-3 space-y-4", className)}>
      <Skeleton className="h-5 w-1/2" />
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-11/12" />
        <Skeleton className="h-3.5 w-4/5" />
      </div>
      <div className="space-y-2 pt-2">
        <Skeleton className="h-3.5 w-10/12" />
        <Skeleton className="h-3.5 w-3/4" />
      </div>
    </div>
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
git add app/src/components/ui/EmptyState.tsx app/src/components/ui/Skeleton.tsx
git commit -m "feat(ui): add empty and skeleton primitives"
```

## Task 2: Migrate Top-Level List Loading And Empty States

**Files:**
- Modify: `app/src/views/WorkspaceView.tsx`
- Modify: `app/src/views/ProjectDetail.tsx`
- Modify: `app/src/views/MySkills.tsx`

**Interfaces:**
- Consumes `EmptyState`, `SkeletonRows`, and existing icons/buttons.

- [ ] **Step 1: Add imports**

Add to each relevant file:

```tsx
import { EmptyState } from "../components/ui/EmptyState";
import { SkeletonRows } from "../components/ui/Skeleton";
```

For `MySkills.tsx`, only import `EmptyState`.

- [ ] **Step 2: Migrate `WorkspaceView` list loading**

Replace the local skills loading block:

```tsx
<div className="flex items-center gap-2 py-4 text-[13px] text-muted">
  <Loader2 className="h-3.5 w-3.5 animate-spin" />
  {t("common.loading")}
</div>
```

with:

```tsx
<SkeletonRows rows={viewMode === "grid" ? 6 : 5} className="pb-8" />
```

- [ ] **Step 3: Migrate `WorkspaceView` empty state**

Replace the existing `visibleLocalSkills.length === 0` centered div with:

```tsx
<EmptyState
  className="min-h-[260px]"
  icon={<Globe className="h-12 w-12" />}
  title={localSkills.length === 0 ? t("globalWorkspace.localSkills.empty") : t("mySkills.noMatch")}
  action={
    localSkills.length === 0 ? (
      <Button
        onClick={() => setAddDialogOpen(true)}
        icon={<Plus className="h-3.5 w-3.5" />}
        className="h-auto px-4 py-2"
      >
        {t("globalWorkspace.addSkill")}
      </Button>
    ) : undefined
  }
/>
```

- [ ] **Step 4: Migrate `ProjectDetail` list loading and empty state**

Replace the top-level `loading ? ... : filtered.length === 0 ? ...` branch with `SkeletonRows` for loading and `EmptyState` for empty. Preserve the existing title, description, and `Button` action:

```tsx
{loading ? (
  <SkeletonRows rows={viewMode === "grid" ? 6 : 5} className="pb-8" />
) : filtered.length === 0 ? (
  <EmptyState
    className="flex-1 pb-20"
    icon={<Layers className="h-12 w-12" />}
    title={groupedSkills.length === 0 ? t("project.noSkills") : t("mySkills.noMatch")}
    description={groupedSkills.length === 0 ? t("project.noSkillsHint") : undefined}
    action={
      groupedSkills.length === 0 ? (
        <Button
          onClick={() => {
            setShowExportDialog(true);
            dismissAddCallout();
          }}
          icon={<Plus className="h-3.5 w-3.5" />}
          className="h-auto px-4 py-2"
        >
          {t("project.addSkillsCta")}
        </Button>
      ) : undefined
    }
  />
) : (
```

- [ ] **Step 5: Migrate `MySkills` empty state**

Replace the existing `filtered.length === 0` centered div with:

```tsx
<EmptyState
  className="flex-1 pb-20"
  icon={<Layers className="h-12 w-12" />}
  title={t("mySkills.noSkills")}
  description={skills.length === 0 ? t("mySkills.addFirst") : t("mySkills.noMatch")}
/>
```

- [ ] **Step 6: Run build and lint**

Run:

```bash
npm --prefix app run build
npm --prefix app run lint
```

Expected: both commands exit 0.

- [ ] **Step 7: Commit**

```bash
git add app/src/views/WorkspaceView.tsx app/src/views/ProjectDetail.tsx app/src/views/MySkills.tsx
git commit -m "refactor(ui): use shared empty and list loading states"
```

## Task 3: Migrate Document Detail Loading And Missing States

**Files:**
- Modify: `app/src/views/WorkspaceView.tsx`
- Modify: `app/src/views/ProjectDetail.tsx`
- Modify: `app/src/components/SkillDetailPanel.tsx`

**Interfaces:**
- Consumes `EmptyState` and `DocumentSkeleton`.

- [ ] **Step 1: Add imports**

Add to `SkillDetailPanel.tsx`:

```tsx
import { EmptyState } from "./ui/EmptyState";
import { DocumentSkeleton } from "./ui/Skeleton";
```

Ensure `WorkspaceView.tsx` and `ProjectDetail.tsx` import `DocumentSkeleton` from `../components/ui/Skeleton`.

- [ ] **Step 2: Migrate simple document loading lines**

For selected document loading branches in `WorkspaceView`, `ProjectDetail`, and `SkillDetailPanel`, replace:

```tsx
<div className="mt-12 text-center text-[13px] text-muted">{t("common.loading")}</div>
```

with:

```tsx
<DocumentSkeleton />
```

- [ ] **Step 3: Migrate unavailable/missing document messages**

Replace selected unavailable/missing branches:

```tsx
<div className="mt-12 text-center text-[13px] text-muted">{t("mySkills.sourceDiffUnavailable")}</div>
<div className="mt-12 text-center text-[13px] text-muted">{t("common.documentMissing")}</div>
```

with:

```tsx
<EmptyState className="mt-12" title={t("mySkills.sourceDiffUnavailable")} />
<EmptyState className="mt-12" title={t("common.documentMissing")} />
```

- [ ] **Step 4: Search for selected old document state text blocks**

Run:

```bash
rg -n "mt-12 text-center text-\\[13px\\] text-muted" app/src/views/WorkspaceView.tsx app/src/views/ProjectDetail.tsx app/src/components/SkillDetailPanel.tsx
```

Expected: no output in these three files.

- [ ] **Step 5: Run build and lint**

Run:

```bash
npm --prefix app run build
npm --prefix app run lint
```

Expected: both commands exit 0.

- [ ] **Step 6: Commit**

```bash
git add app/src/views/WorkspaceView.tsx app/src/views/ProjectDetail.tsx app/src/components/SkillDetailPanel.tsx
git commit -m "refactor(ui): use document skeleton and empty states"
```

## Task 4: Final Verification

- [ ] **Step 1: Confirm `InstallSkills` was not modified**

Run:

```bash
git diff --name-only origin/main..HEAD
```

Expected: output does not include `app/src/views/InstallSkills.tsx`.

- [ ] **Step 2: Run final build and lint**

Run:

```bash
npm --prefix app run build
npm --prefix app run lint
```

Expected: both commands exit 0.

- [ ] **Step 3: Check git status**

Run:

```bash
git status --short --branch
```

Expected: clean worktree, branch ahead of `origin/main`.
