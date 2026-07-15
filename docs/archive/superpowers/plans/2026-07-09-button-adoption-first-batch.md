# Button Adoption First Batch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the approved first batch of hand-written text action buttons with the shared `Button` primitive.

**Architecture:** Reuse `app/src/components/ui/Button.tsx` directly. Keep all state, handlers, translations, icon expressions, and layout order in place; each migration only replaces a hand-written `<button>` shell with `<Button>`.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, existing `Button` primitive and `cn` helper.

## Global Constraints

- Do not migrate every `<button>` in the app.
- Do not touch `InstallSkills` in this slice.
- Do not migrate icon-only hover buttons, tag chips, menu items, tabs, or micro-interaction buttons.
- Do not expand the `Button` variant API in this slice.
- Do not change business logic, translations, data flow, or layout structure.
- Run verification from the repo root with `npm --prefix app run build` and `npm --prefix app run lint`.

---

## File Structure

- Modify `app/src/components/MultiSelectToolbar.tsx`: migrate remaining toolbar text action buttons to `Button`.
- Modify `app/src/views/MySkills.tsx`: import `Button` and migrate selected top toolbar text action buttons.

## Task 1: Migrate MultiSelectToolbar Text Actions

**Files:**
- Modify: `app/src/components/MultiSelectToolbar.tsx`

**Interfaces:**
- Consumes: `Button` from `./ui/Button`.
- Produces: Same `MultiSelectToolbar` component and props.

- [ ] **Step 1: Replace colored update/delete/tag buttons with `Button`**

In `app/src/components/MultiSelectToolbar.tsx`, replace the remaining hand-written text action buttons inside `selectedCount > 0` with `Button`. Preserve each handler, disabled state, label, and icon animation:

```tsx
{anyCanUpdateProject && labels.updateProject && onUpdateProject && (
  <Button
    size="sm"
    onClick={onUpdateProject}
    disabled={updatingProject}
    className="bg-sky-600/90 py-1 text-white hover:bg-sky-500"
    icon={<Download className={cn("h-3.5 w-3.5", updatingProject && "animate-spin")} />}
  >
    {labels.updateProject}
  </Button>
)}
{anyCanUpdateCenter && labels.updateCenter && onUpdateCenter && (
  <Button
    size="sm"
    onClick={onUpdateCenter}
    disabled={updatingCenter}
    className="bg-amber-600/90 py-1 text-white hover:bg-amber-500"
    icon={<Upload className={cn("h-3.5 w-3.5", updatingCenter && "animate-spin")} />}
  >
    {labels.updateCenter}
  </Button>
)}
{onEditTags && labels.editTags && (
  <Button
    size="sm"
    onClick={onEditTags}
    className="bg-violet-600/90 py-1 text-white hover:bg-violet-500"
    icon={<Tag className="h-3.5 w-3.5" />}
  >
    {labels.editTags}
  </Button>
)}
<Button
  size="sm"
  onClick={onDelete}
  className="bg-red-600/90 py-1 text-white hover:bg-red-500"
  icon={<Trash2 className="h-3.5 w-3.5" />}
>
  {labels.delete}
</Button>
{showToggle && (
  <Button
    size="sm"
    onClick={onToggle}
    className={cn(
      "py-1 text-white",
      anyDisabled
        ? "bg-emerald-600/90 hover:bg-emerald-500"
        : "bg-amber-600/90 hover:bg-amber-500"
    )}
    icon={
      anyDisabled
        ? <CheckCircle2 className="h-3.5 w-3.5" />
        : <Circle className="h-3.5 w-3.5" />
    }
  >
    {anyDisabled ? labels.enable : labels.disable}
  </Button>
)}
```

- [ ] **Step 2: Replace select/cancel text buttons with ghost `Button`**

Replace the final `onSelectAll` and `onCancel` buttons with:

```tsx
<Button
  size="sm"
  variant="ghost"
  onClick={onSelectAll}
  className="py-1"
>
  {isAllSelected ? labels.deselectAll : labels.selectAll}
</Button>
<Button
  size="sm"
  variant="ghost"
  onClick={onCancel}
  className="py-1"
>
  {labels.cancel}
</Button>
```

- [ ] **Step 3: Search for remaining hand-written text action shells in `MultiSelectToolbar`**

Run:

```bash
rg -n "<button|</button>" app/src/components/MultiSelectToolbar.tsx
```

Expected: no output.

- [ ] **Step 4: Run build and lint**

Run:

```bash
npm --prefix app run build
npm --prefix app run lint
```

Expected: both commands exit 0.

- [ ] **Step 5: Commit**

```bash
git add app/src/components/MultiSelectToolbar.tsx
git commit -m "refactor(ui): adopt Button in multi-select toolbar"
```

## Task 2: Migrate MySkills Top Toolbar Text Actions

**Files:**
- Modify: `app/src/views/MySkills.tsx`

**Interfaces:**
- Consumes: `Button` from `../components/ui/Button`.
- Produces: Same `MySkills` component behavior.

- [ ] **Step 1: Import `Button`**

Add this import near the other component imports:

```tsx
import { Button } from "../components/ui/Button";
```

- [ ] **Step 2: Replace Git setup/fix/sync/snapshot text action buttons**

In the top toolbar block around `getGitToolbarMode()`, replace only the four text action buttons with `Button`. Preserve conditions and handler bodies.

Use these content forms:

```tsx
<Button
  variant="ghost"
  onClick={() => setSetupOpen(true)}
  disabled={!!gitLoading}
  className="px-3 py-2"
  icon={
    gitLoading === "start" ? (
      <Loader2 className="h-3.5 w-3.5 animate-spin" />
    ) : (
      <GitBranch className="h-3.5 w-3.5" />
    )
  }
>
  {gitLoading === "start" ? t("settings.gitInitializing") : t("settings.gitStartBackup")}
</Button>
```

```tsx
<Button
  variant="ghost"
  onClick={() => {
    setRecoveryReason(gitStatus?.upstream_health ?? "unrelated_histories");
    setRecoveryOpen(true);
  }}
  disabled={!!gitLoading}
  className="px-3 py-2 text-red-500 hover:text-red-500"
  icon={
    gitLoading === "recovery" ? (
      <Loader2 className="h-3.5 w-3.5 animate-spin" />
    ) : (
      <Wrench className="h-3.5 w-3.5" />
    )
  }
>
  {t("mySkills.gitRepoFixSetup")}
</Button>
```

```tsx
<Button
  variant="ghost"
  onClick={handleGitSync}
  disabled={!!gitLoading || mode === "up_to_date"}
  className={cn(
    "px-3 py-2",
    mode === "pending_changes" ? "text-amber-600 dark:text-amber-400" : "text-muted"
  )}
  icon={
    gitLoading === "sync" ? (
      <Loader2 className="h-3.5 w-3.5 animate-spin" />
    ) : mode === "up_to_date" ? (
      <CheckCircle2 className="h-3.5 w-3.5" />
    ) : (
      <ArrowUpCircle className="h-3.5 w-3.5" />
    )
  }
>
  {gitLoading === "sync"
    ? t("mySkills.gitRepoSyncing")
    : mode === "up_to_date"
      ? t("mySkills.gitRepoSynced")
      : t("mySkills.gitRepoSync")}
</Button>
```

```tsx
<Button
  variant="ghost"
  onClick={() => setGitVersionsOpen((v) => !v)}
  disabled={!!gitLoading}
  title={snapshotWhen ? t("mySkills.gitInlineLastSnapshot", { when: snapshotWhen }) : undefined}
  className={cn("ml-1 px-3 py-2", gitVersionsOpen ? "text-secondary" : "text-muted")}
  icon={<History className="h-3.5 w-3.5" />}
>
  {t("mySkills.gitSnapshots")}
</Button>
```

- [ ] **Step 3: Replace check-all and update-available text action buttons**

Replace the two toolbar text action buttons after the git block with:

```tsx
<Button
  variant="ghost"
  onClick={handleCheckAllUpdates}
  disabled={checkingAll}
  className="ml-2 mr-2 border-l border-border-subtle pl-4 pr-3 py-2"
  icon={<RefreshCw className={cn("h-3.5 w-3.5", checkingAll && "animate-spin")} />}
>
  {t("mySkills.updateActions.checkAll")}
</Button>
<Button
  variant="ghost"
  onClick={handleUpdateAvailableSkills}
  disabled={batchUpdating || availableUpdateCount === 0}
  className="mr-2 px-3 py-2 text-accent-light hover:bg-accent-bg hover:text-accent-light"
  icon={<RotateCcw className={cn("h-3.5 w-3.5", batchUpdating && "animate-spin")} />}
>
  {t("mySkills.updateActions.updateAvailable", { count: availableUpdateCount })}
</Button>
```

- [ ] **Step 4: Confirm icon-only view controls remain as `<button>`**

Run:

```bash
sed -n '1400,1435p' app/src/views/MySkills.tsx
```

Expected: the grid/list/multi-select icon-only controls still render as `<button>`.

- [ ] **Step 5: Run build and lint**

Run:

```bash
npm --prefix app run build
npm --prefix app run lint
```

Expected: both commands exit 0.

- [ ] **Step 6: Commit**

```bash
git add app/src/views/MySkills.tsx
git commit -m "refactor(ui): adopt Button in MySkills toolbar"
```

## Task 3: Final Verification

**Files:**
- Inspect: `app/src/components/MultiSelectToolbar.tsx`
- Inspect: `app/src/views/MySkills.tsx`

**Interfaces:**
- Consumes: completed Tasks 1 and 2.
- Produces: verification evidence.

- [ ] **Step 1: Confirm `InstallSkills` was not modified**

Run:

```bash
git diff --name-only HEAD~2..HEAD
```

Expected: output includes `app/src/components/MultiSelectToolbar.tsx` and `app/src/views/MySkills.tsx`; it does not include `app/src/views/InstallSkills.tsx`.

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

Expected: clean worktree, branch ahead of `origin/main` by the new design and implementation commits.
