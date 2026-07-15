# Dashboard Workbench V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign Dashboard into a workbench overview using existing data only.

**Architecture:** Keep the redesign local to `app/src/views/Dashboard.tsx`. Use existing `Button`, `StatusPill`, and `EmptyState` primitives plus local derived arrays for metrics and recent skill route rows.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, lucide-react icons, existing i18n keys.

## Global Constraints

- Do not add backend commands or new data fetching.
- Do not add new i18n keys in this slice.
- Do not redesign Sidebar, `MySkills`, `WorkspaceView`, `ProjectDetail`, `InstallSkills`, or Settings.
- Do not introduce decorative backgrounds, marketing hero copy, or large cards nested inside cards.
- Do not add dependencies.
- Run verification from the repo root with `npm --prefix app run build` and `npm --prefix app run lint`.

---

## File Structure

- Modify `app/src/views/Dashboard.tsx`: replace the current three-card layout with a workbench overview.

## Task 1: Redesign Dashboard

**Files:**
- Modify: `app/src/views/Dashboard.tsx`

**Interfaces:**
- Consumes existing `useApp()` fields: `tools`, `projects`, `managedSkills`, `openSkillDetailById`.
- Consumes existing routes: `/install?tab=local`, `/install`, `/my-skills`.
- Produces the same `Dashboard` export.

- [ ] **Step 1: Update imports**

Use this import set:

```tsx
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Download,
  GitBranch,
  Layers,
  Plus,
  Route,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useApp } from "../context/AppContext";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { StatusPill } from "../components/ui/StatusPill";
import { cn } from "../utils";
```

- [ ] **Step 2: Add derived dashboard values**

Inside `Dashboard`, keep existing `enabledAgents`, `totalSkills`, `syncedSkills`, `divergedCount`, and `recentSkills`. Add:

```tsx
const unsyncedSkills = totalSkills - syncedSkills;
const projectCount = projects.length;
const healthy = divergedCount === 0;
const healthLabel = healthy ? t("dashboard.synced") : t("project.syncStatus.diverged");
const healthClass = healthy
  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
  : "bg-amber-500/10 text-amber-700 dark:text-amber-300";

const metricCards = [
  {
    title: t("dashboard.librarySkills"),
    value: String(totalSkills),
    detail: `${syncedSkills} ${t("dashboard.synced")} · ${unsyncedSkills} ${t("dashboard.notSynced")}`,
    icon: Layers,
    tone: "text-accent-light bg-accent-bg",
  },
  {
    title: t("dashboard.connectedAgents"),
    value: String(enabledAgents.length),
    detail: t("sidebar.globalWorkspace"),
    icon: Bot,
    tone: "text-sky-600 bg-sky-500/10 dark:text-sky-300",
  },
  {
    title: t("sidebar.projects"),
    value: String(projectCount),
    detail: divergedCount > 0 ? `${divergedCount} ${t("project.syncStatus.diverged")}` : t("dashboard.synced"),
    icon: GitBranch,
    tone: divergedCount > 0
      ? "text-amber-600 bg-amber-500/10 dark:text-amber-300"
      : "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400",
  },
];
```

- [ ] **Step 3: Replace returned JSX**

Replace the existing return body with the workbench layout:

```tsx
return (
  <div className="app-page app-page-narrow">
    <div className="app-page-header flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="app-page-title">{t("dashboard.greeting")}</h1>
        <p className="app-page-subtitle text-tertiary">
          {t("dashboard.summary", {
            skills: totalSkills,
            agents: enabledAgents.length,
            projects: projectCount,
          })}
        </p>
      </div>
      <StatusPill className={cn("px-2.5 py-1", healthClass)}>
        {healthLabel}
      </StatusPill>
    </div>

    <section className="grid grid-cols-[minmax(0,1.5fr)_minmax(260px,0.8fr)] gap-3.5">
      <div className="app-panel overflow-hidden">
        <div className="flex items-start justify-between gap-4 border-b border-border-subtle px-4 py-4">
          <div>
            <p className="app-section-title mb-2">{t("dashboard.syncCoverage")}</p>
            <div className="flex items-end gap-2">
              <span className="text-[32px] font-semibold leading-none text-primary tabular-nums">
                {totalSkills === 0 ? "0" : `${syncedSkills}/${totalSkills}`}
              </span>
              <span className="pb-1 text-[13px] text-muted">{t("dashboard.synced")}</span>
            </div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-accent-border bg-accent-bg text-accent-light">
            <Route className="h-4 w-4" />
          </div>
        </div>

        <div className="grid grid-cols-3 divide-x divide-border-subtle">
          {metricCards.map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.title} className="px-4 py-3.5">
                <div className="mb-2 flex items-center gap-2">
                  <span className={cn("flex h-7 w-7 items-center justify-center rounded-control", metric.tone)}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="app-section-title">{metric.title}</span>
                </div>
                <div className="text-xl font-semibold leading-none text-primary tabular-nums">{metric.value}</div>
                <p className="mt-1 truncate text-[12px] text-muted">{metric.detail}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          onClick={() => navigate("/install?tab=local")}
          icon={<Download className="h-4 w-4" />}
          className="h-auto justify-start px-4 py-3"
        >
          {t("dashboard.scanImport")}
        </Button>
        <Button
          variant="secondary"
          onClick={() => navigate("/install")}
          icon={<Plus className="h-4 w-4 text-tertiary" />}
          className="h-auto justify-start px-4 py-3"
        >
          {t("dashboard.installNew")}
        </Button>
        <div className="app-panel flex flex-1 items-center gap-3 px-4 py-3">
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg border", healthy ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500" : "border-amber-500/20 bg-amber-500/10 text-amber-500")}>
            {healthy ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-secondary">{t("dashboard.syncCoverage")}</p>
            <p className="truncate text-[12px] text-muted">
              {healthy ? t("dashboard.synced") : `${divergedCount} ${t("project.syncStatus.diverged")}`}
            </p>
          </div>
        </div>
      </div>
    </section>

    <section>
      <div className="mb-2.5 flex items-center justify-between">
        <h2 className="app-section-title">{t("dashboard.recentActivity")}</h2>
        <button
          type="button"
          onClick={() => navigate("/my-skills")}
          className="inline-flex items-center gap-1 text-[12px] font-medium text-muted transition-colors hover:text-secondary"
        >
          {t("sidebar.mySkills")}
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      {recentSkills.length === 0 ? (
        <div className="app-panel">
          <EmptyState
            className="min-h-[220px]"
            icon={<Layers className="h-12 w-12" />}
            title={t("mySkills.noSkills")}
            description={t("mySkills.addFirst")}
          />
        </div>
      ) : (
        <div className="app-panel overflow-hidden divide-y divide-border-subtle">
          {recentSkills.map((skill) => {
            const targets = skill.targets.map((target) => target.tool);
            const routed = targets.length > 0;
            return (
              <div
                key={skill.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  openSkillDetailById(skill.id);
                  navigate("/my-skills");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    openSkillDetailById(skill.id);
                    navigate("/my-skills");
                  }
                }}
                className="group grid cursor-pointer grid-cols-[minmax(0,1fr)_minmax(180px,0.7fr)] items-center gap-4 px-4 py-3 transition-colors hover:bg-surface-hover"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-accent-border bg-accent-bg text-[13px] font-semibold text-accent-light">
                    {skill.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <h4 className="truncate text-[13px] font-semibold text-secondary group-hover:text-primary">
                        {skill.name}
                      </h4>
                      <StatusPill className="shrink-0 border border-border bg-surface-hover px-1.5 py-px text-[10px] font-normal text-muted">
                        {skill.source_type}
                      </StatusPill>
                    </div>
                    <p className="mt-0.5 truncate text-[12px] text-muted">
                      {routed ? t("dashboard.synced") : t("dashboard.notSynced")}
                    </p>
                  </div>
                </div>

                <div className="flex min-w-0 items-center justify-end gap-2">
                  <span className={cn("h-px min-w-8 flex-1", routed ? "bg-accent-border" : "bg-border-subtle")} />
                  <div className="flex min-w-0 flex-wrap justify-end gap-1">
                    {routed ? (
                      targets.slice(0, 3).map((target) => (
                        <span
                          key={target}
                          className="rounded-full border border-border-subtle bg-surface px-2 py-0.5 text-[11px] font-medium text-muted"
                        >
                          {target}
                        </span>
                      ))
                    ) : (
                      <span className="rounded-full border border-border-subtle bg-surface px-2 py-0.5 text-[11px] font-medium text-faint">
                        {t("dashboard.notSynced")}
                      </span>
                    )}
                    {targets.length > 3 ? (
                      <span className="rounded-full border border-border-subtle bg-surface px-2 py-0.5 text-[11px] font-medium text-faint">
                        +{targets.length - 3}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  </div>
);
```

- [ ] **Step 4: Run build and lint**

Run:

```bash
npm --prefix app run build
npm --prefix app run lint
```

Expected: both commands exit 0.

- [ ] **Step 5: Confirm scope**

Run:

```bash
git diff --name-only HEAD
```

Expected: only `app/src/views/Dashboard.tsx` is listed.

- [ ] **Step 6: Commit**

```bash
git add app/src/views/Dashboard.tsx
git commit -m "refactor(ui): redesign dashboard workbench"
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
