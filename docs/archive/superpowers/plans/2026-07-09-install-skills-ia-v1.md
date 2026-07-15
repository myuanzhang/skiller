# Install Skills IA V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve `InstallSkills` top-level information architecture without changing install/search/import behavior.

**Architecture:** Keep all existing tab bodies and handlers. Replace only the page header and primary tab switcher with a clearer install lane header using existing labels, icons, and `switchTab`.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, existing `cn` helper and lucide icons.

## Global Constraints

- Do not change marketplace search, filtering, pagination, or install logic.
- Do not redesign marketplace skill cards in this slice.
- Do not redesign local scan result rows in this slice.
- Do not redesign Git preview dialog in this slice.
- Do not add backend commands or data fetching.
- Do not add dependencies.
- Do not add new i18n keys.
- Run verification from the repo root with `npm --prefix app run build` and `npm --prefix app run lint`.

---

## File Structure

- Modify `app/src/views/InstallSkills.tsx`: replace only the top-level header/tab switcher.

## Task 1: Redesign InstallSkills Header And Source Switcher

**Files:**
- Modify: `app/src/views/InstallSkills.tsx`

**Interfaces:**
- Consumes existing `activeTab`, `switchTab`, `t`, and existing icons.
- Produces unchanged tab behavior and URL param behavior.

- [ ] **Step 1: Add lane metadata before return**

Add this block after the last `useEffect` and before `return (`:

```tsx
  const installLanes = [
    {
      id: "market" as const,
      label: t("install.browseMarket"),
      description: t("install.browseMarket"),
      icon: Box,
    },
    {
      id: "local" as const,
      label: t("install.localInstall"),
      description: t("install.local.description"),
      icon: UploadCloud,
    },
    {
      id: "git" as const,
      label: t("install.gitInstall"),
      description: t("install.gitDesc"),
      icon: Github,
    },
  ];

  const activeLane = installLanes.find((lane) => lane.id === activeTab) ?? installLanes[0];
```

- [ ] **Step 2: Replace the existing header/tab row**

Replace this current block:

```tsx
<div className="app-page-header border-b-0 pb-0">
  <h1 className="app-page-title mb-4">{t("install.title")}</h1>
  <div className="flex gap-1 border-b border-border-subtle">
    {[
      { id: "market" as const, label: t("install.browseMarket"), icon: Box },
      { id: "local" as const, label: t("install.localInstall"), icon: UploadCloud },
      { id: "git" as const, label: t("install.gitInstall"), icon: Github },
    ].map((tab) => {
      const Icon = tab.icon;
      const isActive = activeTab === tab.id;
      return (
        <button
          key={tab.id}
          onClick={() => switchTab(tab.id)}
          className={cn(
            "mr-4 flex items-center gap-1.5 border-b-2 px-1 pb-1.5 text-[13px] font-medium transition-colors outline-none",
            isActive
              ? "border-accent text-accent"
              : "border-transparent text-muted hover:text-tertiary"
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          {tab.label}
        </button>
      );
    })}
  </div>
</div>
```

with:

```tsx
<div className="app-page-header border-b-0 pb-0">
  <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
    <div className="min-w-0">
      <h1 className="app-page-title">{t("install.title")}</h1>
      <p className="app-page-subtitle max-w-2xl text-tertiary">
        {activeLane.description}
      </p>
    </div>
    <div className="app-badge shrink-0">
      <activeLane.icon className="h-3.5 w-3.5" />
      {activeLane.label}
    </div>
  </div>

  <div className="grid grid-cols-3 gap-2">
    {installLanes.map((lane) => {
      const Icon = lane.icon;
      const isActive = activeTab === lane.id;
      return (
        <button
          key={lane.id}
          onClick={() => switchTab(lane.id)}
          className={cn(
            "app-panel flex items-center gap-3 px-3.5 py-3 text-left transition-all outline-none",
            isActive
              ? "border-accent/50 bg-accent-bg"
              : "hover:border-border hover:bg-surface-hover"
          )}
        >
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
              isActive
                ? "border-accent-border bg-accent-bg text-accent-light"
                : "border-border-subtle bg-background text-muted"
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className={cn("block truncate text-[13px] font-semibold", isActive ? "text-primary" : "text-secondary")}>
              {lane.label}
            </span>
            <span className="mt-0.5 block truncate text-[12px] text-muted">
              {lane.description}
            </span>
          </span>
        </button>
      );
    })}
  </div>
</div>
```

- [ ] **Step 3: Fix active lane icon rendering if TypeScript rejects lowercase JSX member**

If `activeLane.icon` cannot be used as `<activeLane.icon />`, add this line before `return (`:

```tsx
  const ActiveLaneIcon = activeLane.icon;
```

Then render:

```tsx
<ActiveLaneIcon className="h-3.5 w-3.5" />
```

- [ ] **Step 4: Confirm only top-level header area changed**

Run:

```bash
git diff -- app/src/views/InstallSkills.tsx
```

Expected: diff only adds lane metadata and replaces the top-level header/tab switcher. It does not alter marketplace/local/git body handlers or dialog code.

- [ ] **Step 5: Run build and lint**

Run:

```bash
npm --prefix app run build
npm --prefix app run lint
```

Expected: both commands exit 0.

- [ ] **Step 6: Confirm scope**

Run:

```bash
git diff --name-only HEAD
```

Expected:

```text
app/src/views/InstallSkills.tsx
```

- [ ] **Step 7: Commit**

```bash
git add app/src/views/InstallSkills.tsx
git commit -m "refactor(ui): clarify install skills intake layout"
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
