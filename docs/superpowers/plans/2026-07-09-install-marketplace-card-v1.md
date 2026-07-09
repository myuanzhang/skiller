# Install Marketplace Card V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve marketplace skill card scan hierarchy without changing marketplace behavior.

**Architecture:** Keep card data derivation and handlers unchanged inside `paginatedMarketSkills.map(...)`. Replace only the card JSX/classes so identity, source metadata, and actions are easier to scan.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, existing `cn` helper and lucide icons.

## Global Constraints

- Do not change marketplace search, filtering, pagination, loading, or caching logic.
- Do not change local install or Git install sections.
- Do not change install/cancel handlers.
- Do not add new i18n keys.
- Do not add dependencies.
- Do not create a new extracted component in this slice.
- Run verification from the repo root with `npm --prefix app run build` and `npm --prefix app run lint`.

---

## File Structure

- Modify `app/src/views/InstallSkills.tsx`: update only marketplace card JSX inside `paginatedMarketSkills.map(...)`.

## Task 1: Redesign Marketplace Card Presentation

**Files:**
- Modify: `app/src/views/InstallSkills.tsx`

**Interfaces:**
- Consumes existing `SkillsShSkill` fields and existing handlers.
- Produces unchanged install/cancel/filter/external-link behavior.

- [ ] **Step 1: Replace marketplace card JSX**

Inside `paginatedMarketSkills.map((skill) => { ... })`, keep these existing derivations unchanged:

```tsx
const displayName = skill.name || skill.skill_id;
const showSkillId = skill.skill_id.trim() !== displayName.trim();
const owner = skill.source.split("/")[0];
const avatarUrl = `https://github.com/${owner}.png?size=32`;
const sourceRef = `${skill.source}/${skill.skill_id}`;
const isInstalled = installedSourceRefs.has(sourceRef);
```

Replace only the returned card JSX with:

```tsx
return (
  <div
    key={skill.id}
    className="app-panel group flex min-h-[132px] flex-col justify-between gap-3 p-3 transition-colors hover:border-border hover:bg-surface-hover"
  >
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-2.5">
        <img
          src={avatarUrl}
          alt={owner}
          className="mt-0.5 h-8 w-8 shrink-0 rounded-lg border border-border-subtle"
          loading="lazy"
        />
        <div className="min-w-0">
          <h3 className="truncate text-[13px] font-semibold text-secondary group-hover:text-primary">
            {displayName}
          </h3>
          {showSkillId ? (
            <p className="mt-0.5 truncate font-mono text-[12px] leading-4 text-muted">
              {skill.skill_id}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => setMarketSourceFilter(skill.source)}
            disabled={marketSourceFilter === skill.source}
            title={t("install.onlyThisContributor")}
            className={cn(
              "mt-2 inline-flex max-w-full rounded-control border border-accent-border bg-accent-bg px-1.5 py-0.5 text-[12px] leading-4 font-medium text-accent-light transition-colors",
              marketSourceFilter === skill.source
                ? "cursor-default opacity-90"
                : "hover:bg-accent-bg/80"
            )}
          >
            <span className="truncate">@{skill.source}</span>
          </button>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          onClick={() => openUrl(`https://skills.sh/${skill.source}/${skill.skill_id}`)}
          className="rounded-control p-1 text-muted transition-colors hover:bg-surface-hover hover:text-secondary"
          title={t("install.viewOnWeb")}
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </button>
        {isInstalled ? (
          <span
            className="rounded-control border border-emerald-500/20 bg-emerald-500/10 p-1 text-emerald-400"
            title={t("install.installed")}
          >
            <Check className="h-3.5 w-3.5" />
          </span>
        ) : installing === skill.id ? (
          <button
            onClick={() => handleCancelInstall(`${skill.source}/${skill.skill_id}`)}
            className="inline-flex items-center gap-1 rounded-control border border-red-500/30 bg-red-500/10 px-1.5 py-1 text-red-400 transition-colors hover:bg-red-500/20"
            title={t("install.cancel")}
            aria-label={t("install.cancel")}
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span className="text-[11px] leading-none font-medium">
              {t("install.cancel")}
            </span>
          </button>
        ) : (
          <button
            onClick={() => handleInstallSkillssh(skill)}
            disabled={installing !== null}
            className="rounded-control border border-accent-border bg-accent-dark p-1 text-white transition-colors hover:bg-accent disabled:opacity-50"
            title={t("install.oneClickInstall")}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>

    <div className="flex flex-wrap items-center gap-1.5 border-t border-border-subtle pt-2">
      {marketTab === "alltime" && skill.installs > 0 && (
        <span className="inline-flex items-center gap-1 rounded-control border border-border-subtle bg-background px-1.5 py-0.5 text-[13px] leading-4 text-muted">
          <DownloadCloud className="h-3 w-3" />
          {skill.installs >= 1_000_000
            ? `${(skill.installs / 1_000_000).toFixed(1)}M`
            : skill.installs >= 1_000
              ? `${(skill.installs / 1_000).toFixed(1)}K`
              : skill.installs}
        </span>
      )}
      {isInstalled ? (
        <span className="inline-flex items-center gap-1 rounded-control border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[13px] leading-4 font-medium text-emerald-400">
          <Check className="h-3 w-3" />
          {t("install.installed")}
        </span>
      ) : null}
    </div>
  </div>
);
```

- [ ] **Step 2: Confirm scope**

Run:

```bash
git diff -- app/src/views/InstallSkills.tsx
```

Expected: diff changes only the JSX returned by `paginatedMarketSkills.map(...)`; it does not alter state, effects, handlers, pagination, local tab, Git tab, or Git preview dialog.

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
git commit -m "refactor(ui): improve install marketplace cards"
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
