# Skill Card Shell V3 MySkills Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate `MySkills` skill card outer wrappers to the existing `SkillCardShell`.

**Architecture:** Keep `MySkills` inline card content and interactions unchanged. Replace only grid/list outer wrappers with `SkillCardShell`, preserving tag-edit popover visibility with `className="overflow-visible"` while editing.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, existing `SkillCardShell`.

## Global Constraints

- Do not change tag editing behavior.
- Do not change drag-and-drop behavior.
- Do not change `SyncDots`, delete, refresh, update, source relink/detach, or preset toggle actions.
- Do not extract a `MySkills` card component.
- Do not change `SkillCardShell` API.
- Do not change filtering, sorting, or selection behavior.
- Run verification from the repo root with `npm --prefix app run build` and `npm --prefix app run lint`.

---

## File Structure

- Modify `app/src/views/MySkills.tsx`: consume `SkillCardShell` for grid and list card wrappers.

## Task 1: Migrate MySkills Card Shells

**Files:**
- Modify: `app/src/views/MySkills.tsx`

**Interfaces:**
- Consumes `SkillCardShell` from `../components/ui/SkillCardShell`.
- Produces unchanged `MySkills` behavior.

- [ ] **Step 1: Import `SkillCardShell`**

Add near existing UI imports:

```tsx
import { SkillCardShell } from "../components/ui/SkillCardShell";
```

- [ ] **Step 2: Replace grid wrapper**

Replace the grid card outer `<div>`:

```tsx
<div
  className={cn(
    "app-panel group relative flex h-full cursor-pointer flex-col transition-all hover:border-border hover:bg-surface-hover",
    enabledInPreset && "border-l-2 border-l-accent",
    isMultiSelect && selectedIds.has(skill.id) && "ring-1 ring-accent border-accent/40"
  )}
  onClick={() =>
    isMultiSelect ? toggleSelect(skill.id) : openSkillDetailById(skill.id)
  }
>
```

with:

```tsx
<SkillCardShell
  viewMode="grid"
  active={enabledInPreset}
  selected={isMultiSelect && selectedIds.has(skill.id)}
  className={tagEditSkillId === skill.id ? "overflow-visible" : undefined}
  onClick={() =>
    isMultiSelect ? toggleSelect(skill.id) : openSkillDetailById(skill.id)
  }
>
```

Replace the matching closing `</div>` with `</SkillCardShell>`.

- [ ] **Step 3: Replace list wrapper**

Replace the list card outer `<div>`:

```tsx
<div
  className={cn(
    "app-panel group relative flex cursor-pointer items-center gap-3.5 rounded-xl border-transparent px-3.5 py-3 transition-all hover:border-border hover:bg-surface-hover",
    enabledInPreset && "border-l-2 border-l-accent",
    isMultiSelect && selectedIds.has(skill.id) && "ring-1 ring-accent border-accent/40"
  )}
  onClick={() =>
    isMultiSelect ? toggleSelect(skill.id) : openSkillDetailById(skill.id)
  }
>
```

with:

```tsx
<SkillCardShell
  viewMode="list"
  active={enabledInPreset}
  selected={isMultiSelect && selectedIds.has(skill.id)}
  onClick={() =>
    isMultiSelect ? toggleSelect(skill.id) : openSkillDetailById(skill.id)
  }
>
```

Replace the matching closing `</div>` with `</SkillCardShell>`.

- [ ] **Step 4: Confirm direct shell classes are removed from `MySkills` cards**

Run:

```bash
rg -n "app-panel group relative flex (h-full cursor-pointer flex-col|cursor-pointer items-center)" app/src/views/MySkills.tsx
```

Expected: no output for the main grid/list skill card wrappers. If output remains in unrelated UI, inspect before changing.

- [ ] **Step 5: Confirm tag edit overflow override remains**

Run:

```bash
rg -n "overflow-visible|relative z-30" app/src/views/MySkills.tsx
```

Expected: output includes both the `SortableSkillItem` z-index guard and the `SkillCardShell` `overflow-visible` override.

- [ ] **Step 6: Confirm scope**

Run:

```bash
git diff --name-only HEAD
```

Expected:

```text
app/src/views/MySkills.tsx
```

- [ ] **Step 7: Run build and lint**

Run:

```bash
npm --prefix app run build
npm --prefix app run lint
```

Expected: both commands exit 0.

- [ ] **Step 8: Commit**

```bash
git add app/src/views/MySkills.tsx
git commit -m "refactor(ui): use skill card shell in MySkills"
```

## Task 2: Final Verification

- [ ] **Step 1: Confirm only MySkills changed in implementation**

Run:

```bash
git diff --name-only HEAD~1..HEAD
```

Expected:

```text
app/src/views/MySkills.tsx
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
