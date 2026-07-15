# Install Local Intake V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clarify the Local install path top-level structure without changing scan/import behavior.

**Architecture:** Keep all Local handlers and scan row rendering unchanged. Reframe the manual import panel and scan panel header using existing tokens and buttons.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, existing classes and lucide icons.

## Global Constraints

- Do not change scan/import/batch import logic.
- Do not redesign discovered skill rows in this slice.
- Do not change rename behavior.
- Do not change local error handling.
- Do not change marketplace or Git sections.
- Do not add new i18n keys.
- Do not add dependencies.
- Run verification from the repo root with `npm --prefix app run build` and `npm --prefix app run lint`.

---

## File Structure

- Modify `app/src/views/InstallSkills.tsx`: update only Local tab top-level panel framing.

## Task 1: Reframe Local Intake Header And Scan Header

**Files:**
- Modify: `app/src/views/InstallSkills.tsx`

**Interfaces:**
- Consumes existing handlers: `handleLocalFolderInstall`, `handleLocalFileInstall`, `handleBatchImportFolder`, `runScan`, `handleImportAllDiscovered`.
- Produces unchanged Local tab behavior.

- [ ] **Step 1: Replace the manual Local intake panel**

Inside `activeTab === "local"`, replace the first `section className="app-panel overflow-hidden"` block that contains `install.local.title` and the three manual action buttons with:

```tsx
<section className="app-panel overflow-hidden">
  <div className="border-b border-border-subtle px-4 py-3.5">
    <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted">
      <span className="inline-flex items-center gap-1.5 rounded-control border border-accent-border bg-accent-bg px-2 py-1 font-medium text-accent-light">
        <FolderUp className="h-3.5 w-3.5" />
        {t("install.local.title")}
      </span>
    </div>
    <h2 className="mt-2 text-[14px] font-semibold text-secondary">
      {t("install.local.title")}
    </h2>
    <p className="mt-1 max-w-2xl text-[13px] leading-5 text-muted">
      {t("install.local.description")}
    </p>
  </div>

  <div className="grid grid-cols-3 gap-2.5 p-3.5">
    <button
      type="button"
      onClick={handleLocalFolderInstall}
      className="app-button-primary h-auto justify-start px-3 py-3"
    >
      <FolderUp className="h-4 w-4" />
      {t("install.local.selectFolder")}
    </button>
    <button
      type="button"
      onClick={handleLocalFileInstall}
      className="app-button-secondary h-auto justify-start bg-background px-3 py-3"
    >
      <UploadCloud className="h-4 w-4" />
      {t("install.local.selectArchive")}
    </button>
    <button
      type="button"
      onClick={handleBatchImportFolder}
      className="app-button-secondary h-auto justify-start bg-background px-3 py-3"
    >
      <FolderInput className="h-4 w-4" />
      {t("install.local.batchImport")}
    </button>
  </div>
</section>
```

- [ ] **Step 2: Reframe scan panel header only**

In the second Local `section className="app-panel overflow-hidden"`, replace only its header div:

```tsx
<div className="flex items-center justify-between gap-4 border-b border-border-subtle px-4 py-3.5">
```

with:

```tsx
<div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle bg-bg-secondary/60 px-4 py-3.5">
```

Keep the header's children and the scan body unchanged.

- [ ] **Step 3: Confirm scan rows were not changed**

Run:

```bash
git diff -- app/src/views/InstallSkills.tsx
```

Expected: diff changes the first Local intake panel and one scan panel header class. It does not alter `scanGroups.map(...)`, row internals, handlers, marketplace section, Git section, or Git preview dialog.

- [ ] **Step 4: Run build and lint**

Run:

```bash
npm --prefix app run build
npm --prefix app run lint
```

Expected: both commands exit 0.

- [ ] **Step 5: Confirm changed files**

Run:

```bash
git diff --name-only HEAD
```

Expected:

```text
app/src/views/InstallSkills.tsx
```

- [ ] **Step 6: Commit**

```bash
git add app/src/views/InstallSkills.tsx
git commit -m "refactor(ui): clarify local install intake"
```

## Task 2: Final Verification

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

Expected: clean worktree, branch ahead of `origin/main`.
