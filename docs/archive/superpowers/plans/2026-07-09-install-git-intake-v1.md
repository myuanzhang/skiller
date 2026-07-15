# Install Git Intake V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clarify the Git URL intake panel without changing Git preview/install behavior.

**Architecture:** Keep all state and handlers unchanged. Replace only the Git tab's top-level panel JSX/classes; leave the Git preview dialog untouched.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, existing classes and lucide icons.

## Global Constraints

- Do not change `handleGitPreview`, `handleGitConfirm`, or `handleGitPreviewClose`.
- Do not redesign the Git preview dialog in this slice.
- Do not change Git URL validation or keyboard behavior.
- Do not change toast/progress behavior.
- Do not change marketplace or local sections.
- Do not add new i18n keys.
- Do not add dependencies.
- Run verification from the repo root with `npm --prefix app run build` and `npm --prefix app run lint`.

---

## File Structure

- Modify `app/src/views/InstallSkills.tsx`: update only the Git tab URL intake panel.

## Task 1: Reframe Git URL Intake Panel

**Files:**
- Modify: `app/src/views/InstallSkills.tsx`

**Interfaces:**
- Consumes existing `gitUrl`, `gitLoading`, `gitCancelKey`, `handleGitPreview`, `handleCancelInstall`, and `findInstalledByGitUrl`.
- Produces unchanged Git preview/install behavior.

- [ ] **Step 1: Replace Git tab panel JSX**

Replace the `activeTab === "git"` panel content:

```tsx
<div className="app-panel max-w-lg p-5">
  ...
</div>
```

with:

```tsx
<div className="app-panel max-w-2xl overflow-hidden">
  <div className="border-b border-border-subtle px-4 py-3.5">
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-hover">
        <Github className="h-5 w-5 text-tertiary" />
      </div>
      <div className="min-w-0">
        <h2 className="text-[14px] font-semibold text-primary">{t("install.gitTitle")}</h2>
        <p className="mt-1 max-w-xl text-[13px] leading-5 text-muted">{t("install.gitDesc")}</p>
      </div>
    </div>
  </div>

  <div className="space-y-3 bg-bg-secondary/40 p-4">
    <div>
      <label className="mb-1 block text-[13px] font-medium text-tertiary">
        {t("install.repoUrl")}
      </label>
      <input
        type="text"
        value={gitUrl}
        onChange={(e) => setGitUrl(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !gitLoading && gitUrl.trim()) handleGitPreview(); }}
        placeholder={t("install.repoUrlPlaceholder")}
        disabled={gitLoading}
        className="app-input w-full bg-background font-mono"
      />
    </div>
    {gitUrl.trim() && findInstalledByGitUrl(gitUrl) && (
      <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[13px] text-amber-400">
        <Check className="h-3.5 w-3.5 shrink-0" />
        <span>
          {t("install.gitAlreadyInstalled", { name: findInstalledByGitUrl(gitUrl)!.name })}
        </span>
      </div>
    )}
    <div className="flex gap-2 pt-1">
      {gitLoading ? (
        <button
          onClick={() => gitCancelKey && handleCancelInstall(gitCancelKey)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-[13px] font-medium text-red-400 transition-colors hover:bg-red-500/20"
          disabled={!gitCancelKey}
        >
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {t("install.cancel")}
        </button>
      ) : (
        <button
          onClick={handleGitPreview}
          disabled={!gitUrl.trim()}
          className={cn(
            "flex w-full",
            gitUrl.trim() && findInstalledByGitUrl(gitUrl)
              ? "app-button-secondary bg-background"
              : "app-button-primary"
          )}
        >
          <DownloadCloud className="h-3.5 w-3.5" />
          {gitUrl.trim() && findInstalledByGitUrl(gitUrl)
            ? t("install.gitReinstall")
            : t("install.installClone")}
        </button>
      )}
    </div>
  </div>
</div>
```

- [ ] **Step 2: Confirm preview dialog is untouched**

Run:

```bash
git diff -- app/src/views/InstallSkills.tsx
```

Expected: diff changes only the `activeTab === "git"` top panel. It does not alter `Git preview / selection dialog`, handlers, marketplace section, or local section.

- [ ] **Step 3: Run build and lint**

Run:

```bash
npm --prefix app run build
npm --prefix app run lint
```

Expected: both commands exit 0.

- [ ] **Step 4: Confirm changed files**

Run:

```bash
git diff --name-only HEAD
```

Expected:

```text
app/src/views/InstallSkills.tsx
```

- [ ] **Step 5: Commit**

```bash
git add app/src/views/InstallSkills.tsx
git commit -m "refactor(ui): clarify git install intake"
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
