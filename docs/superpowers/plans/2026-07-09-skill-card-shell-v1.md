# Skill Card Shell V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a visual-only skill card shell primitive and migrate `WorkspaceView`'s local card wrapper to it.

**Architecture:** `SkillCardShell` owns only the repeated outer classes for grid/list skill cards. `WorkspaceSkillCard` keeps all content, tags, status, actions, and click behavior.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, existing `cn` helper.

## Global Constraints

- Do not migrate `MySkills` in this slice.
- Do not migrate `ProjectDetail` in this slice.
- Do not change card content, actions, tags, status labels, or click behavior.
- Do not change grid/list layout decisions.
- Do not add dependencies.
- Do not introduce a large generic `SkillCard` business component.
- Run verification from the repo root with `npm --prefix app run build` and `npm --prefix app run lint`.

---

## File Structure

- Create `app/src/components/ui/SkillCardShell.tsx`: visual-only card wrapper.
- Modify `app/src/views/WorkspaceView.tsx`: consume `SkillCardShell` inside `WorkspaceSkillCard`.

## Task 1: Add SkillCardShell Primitive

**Files:**
- Create: `app/src/components/ui/SkillCardShell.tsx`

**Interfaces:**
- Produces `SkillCardShell({ viewMode, active, selected, disabled, className, children, onClick }: SkillCardShellProps)`.

- [ ] **Step 1: Create `SkillCardShell.tsx`**

Add this file:

```tsx
import type { ReactNode } from "react";
import { cn } from "../../utils";

interface SkillCardShellProps {
  viewMode: "grid" | "list";
  active?: boolean;
  selected?: boolean;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}

export function SkillCardShell({
  viewMode,
  active = false,
  selected = false,
  disabled = false,
  className,
  children,
  onClick,
}: SkillCardShellProps) {
  return (
    <div
      className={cn(
        viewMode === "grid"
          ? "app-panel group relative flex h-full cursor-pointer flex-col overflow-hidden transition-all hover:border-border hover:bg-surface-hover"
          : "app-panel group relative flex cursor-pointer items-center gap-3.5 rounded-xl border-transparent px-3.5 py-3 transition-all hover:border-border hover:bg-surface-hover",
        active && "border-l-2 border-l-accent",
        selected && "ring-1 ring-accent border-accent/40",
        disabled && "opacity-60",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Run build and lint**

Run:

```bash
npm --prefix app run build
npm --prefix app run lint
```

Expected: both commands exit 0.

- [ ] **Step 3: Commit**

```bash
git add app/src/components/ui/SkillCardShell.tsx
git commit -m "feat(ui): add skill card shell"
```

## Task 2: Migrate WorkspaceSkillCard Shell

**Files:**
- Modify: `app/src/views/WorkspaceView.tsx`

**Interfaces:**
- Consumes `SkillCardShell` from `../components/ui/SkillCardShell`.
- Produces unchanged local `WorkspaceSkillCard` behavior.

- [ ] **Step 1: Import `SkillCardShell`**

Add near existing UI imports:

```tsx
import { SkillCardShell } from "../components/ui/SkillCardShell";
```

- [ ] **Step 2: Replace list wrapper**

In `WorkspaceSkillCard`, replace the list view outer `<div>`:

```tsx
<div
  className={cn(
    "app-panel group relative flex cursor-pointer items-center gap-3.5 rounded-xl border-transparent px-3.5 py-3 transition-all hover:border-border hover:bg-surface-hover",
    active && "border-l-2 border-l-accent"
  )}
  onClick={onClick}
>
```

with:

```tsx
<SkillCardShell viewMode="list" active={active} onClick={onClick}>
```

Replace the matching closing `</div>` with `</SkillCardShell>`.

- [ ] **Step 3: Replace grid wrapper**

In `WorkspaceSkillCard`, replace the grid view outer `<div>`:

```tsx
<div
  className={cn(
    "app-panel group relative flex h-full cursor-pointer flex-col overflow-hidden transition-all hover:border-border hover:bg-surface-hover",
    active && "border-l-2 border-l-accent"
  )}
  onClick={onClick}
>
```

with:

```tsx
<SkillCardShell viewMode="grid" active={active} onClick={onClick}>
```

Replace the matching closing `</div>` with `</SkillCardShell>`.

- [ ] **Step 4: Confirm no direct shell class remains in `WorkspaceSkillCard`**

Run:

```bash
rg -n "app-panel group relative flex (h-full cursor-pointer flex-col|cursor-pointer items-center)" app/src/views/WorkspaceView.tsx
```

Expected: no output for `WorkspaceSkillCard`. If output remains outside `WorkspaceSkillCard`, inspect before changing.

- [ ] **Step 5: Confirm scope**

Run:

```bash
git diff --name-only HEAD
```

Expected: only these files:

```text
app/src/views/WorkspaceView.tsx
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
git add app/src/views/WorkspaceView.tsx
git commit -m "refactor(ui): use skill card shell in workspace"
```

## Task 3: Final Verification

- [ ] **Step 1: Confirm `MySkills` and `ProjectDetail` were not modified**

Run:

```bash
git diff --name-only origin/main..HEAD
```

Expected: output does not include `app/src/views/MySkills.tsx` or `app/src/views/ProjectDetail.tsx`.

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
