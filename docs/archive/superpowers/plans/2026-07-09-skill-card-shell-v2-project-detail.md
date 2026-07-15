# Skill Card Shell V2 ProjectDetail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate `ProjectDetail` skill card outer wrappers to the existing `SkillCardShell`.

**Architecture:** Keep `ProjectDetail`'s inline card content and actions unchanged. Replace only the outer grid/list wrappers with `SkillCardShell`, mapping existing wrapper state to existing shell props.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, existing `SkillCardShell`.

## Global Constraints

- Do not migrate `MySkills` in this slice.
- Do not change `SkillCardShell` API unless a build failure proves it necessary.
- Do not extract a project skill card component.
- Do not change update/delete/toggle action placement or behavior.
- Do not change tags, status labels, agent dots, or text content.
- Do not add dependencies.
- Run verification from the repo root with `npm --prefix app run build` and `npm --prefix app run lint`.

---

## File Structure

- Modify `app/src/views/ProjectDetail.tsx`: consume `SkillCardShell` for grid and list card wrappers.

## Task 1: Migrate ProjectDetail Card Shells

**Files:**
- Modify: `app/src/views/ProjectDetail.tsx`

**Interfaces:**
- Consumes `SkillCardShell` from `../components/ui/SkillCardShell`.
- Produces unchanged `ProjectDetail` behavior.

- [ ] **Step 1: Import `SkillCardShell`**

Add near existing UI imports:

```tsx
import { SkillCardShell } from "../components/ui/SkillCardShell";
```

- [ ] **Step 2: Replace grid wrapper**

Replace the grid card outer `<div>`:

```tsx
<div
  key={skillKey}
  className={cn(
    "app-panel group relative flex h-full cursor-pointer flex-col overflow-hidden transition-all hover:border-border hover:bg-surface-hover",
    skill.enabledCount > 0 && "border-l-2 border-l-accent",
    skill.enabledCount === 0 && "opacity-60",
    isMultiSelect && isSelected && "ring-1 ring-accent border-accent/40"
  )}
  onClick={() =>
    isMultiSelect ? toggleSelect(skillKey) : handleOpenDetail(skill)
  }
>
```

with:

```tsx
<SkillCardShell
  key={skillKey}
  viewMode="grid"
  active={skill.enabledCount > 0}
  disabled={skill.enabledCount === 0}
  selected={isMultiSelect && isSelected}
  onClick={() =>
    isMultiSelect ? toggleSelect(skillKey) : handleOpenDetail(skill)
  }
>
```

Replace the matching closing `</div>` with `</SkillCardShell>`.

- [ ] **Step 3: Replace list wrapper**

Replace the list card outer `<div>`:

```tsx
<div
  key={skillKey}
  className={cn(
    "app-panel group flex cursor-pointer items-center gap-3.5 rounded-xl border-transparent px-3.5 py-3 transition-all hover:border-border hover:bg-surface-hover",
    skill.enabledCount > 0 && "border-l-2 border-l-accent",
    skill.enabledCount === 0 && "opacity-60",
    isMultiSelect && isSelected && "ring-1 ring-accent border-accent/40"
  )}
  onClick={() =>
    isMultiSelect ? toggleSelect(skillKey) : handleOpenDetail(skill)
  }
>
```

with:

```tsx
<SkillCardShell
  key={skillKey}
  viewMode="list"
  active={skill.enabledCount > 0}
  disabled={skill.enabledCount === 0}
  selected={isMultiSelect && isSelected}
  onClick={() =>
    isMultiSelect ? toggleSelect(skillKey) : handleOpenDetail(skill)
  }
>
```

Replace the matching closing `</div>` with `</SkillCardShell>`.

- [ ] **Step 4: Confirm direct shell classes are removed from `ProjectDetail` cards**

Run:

```bash
rg -n "app-panel group (relative flex h-full|flex cursor-pointer items-center)" app/src/views/ProjectDetail.tsx
```

Expected: no output for the main grid/list skill card wrappers. If output remains in unrelated UI, inspect before changing.

- [ ] **Step 5: Confirm scope**

Run:

```bash
git diff --name-only HEAD
```

Expected:

```text
app/src/views/ProjectDetail.tsx
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
git add app/src/views/ProjectDetail.tsx
git commit -m "refactor(ui): use skill card shell in project detail"
```

## Task 2: Final Verification

- [ ] **Step 1: Confirm `MySkills`, `WorkspaceView`, and `SkillCardShell` were not modified**

Run:

```bash
git diff --name-only origin/main..HEAD
```

Expected: output does not include:

```text
app/src/views/MySkills.tsx
app/src/views/WorkspaceView.tsx
app/src/components/ui/SkillCardShell.tsx
```

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
