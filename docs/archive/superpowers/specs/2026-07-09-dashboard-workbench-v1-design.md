---
title: Dashboard Workbench V1 Design
type: design
tags: [skiller, ui, dashboard, frontend]
created: 2026-07-09
---

# Dashboard Workbench V1 Design

## Context

The dashboard is currently a compact summary page with three stat cards, two actions, and a recent skills list. It is functional, but it does not yet establish the product's visual identity or communicate Skiller as an agent skill registry workbench.

Recent UI work has already created shared primitives for buttons, status pills, skeletons, and empty states. Dashboard v1 should use that foundation to make the first screen feel more intentional without changing backend data or app navigation.

## Goal

Redesign `Dashboard` as a quiet workbench overview using existing data only. The page should make the central library, agent coverage, project health, and recent skill routes easier to scan.

## Non-Goals

- Do not add backend commands or new data fetching.
- Do not add new i18n keys in this slice.
- Do not redesign Sidebar, `MySkills`, `WorkspaceView`, `ProjectDetail`, `InstallSkills`, or Settings.
- Do not introduce decorative backgrounds, marketing hero copy, or large cards nested inside cards.
- Do not add dependencies.

## Design Direction

Subject: **Agent Skill Registry Workbench**.

Audience: developers and knowledge workers who manage skill files across agents and projects.

Single job: show whether the skill system is populated, connected, and healthy, then route the user to the next action.

Visual signature: **Skill Route Rail**. Recent skills should show a restrained route line from a central skill marker to its synced targets. This makes the product's core idea visible without decoration.

## Data

Use existing `useApp()` data:

- `managedSkills`
- `tools`
- `projects`
- `openSkillDetailById`

Derived values:

- total library skills
- synced skills count
- unsynced skills count
- enabled installed agents
- project count
- diverged project skill count
- recent skills, sorted by `updated_at`
- agent target labels per recent skill

## Layout

Desktop layout remains inside `app-page app-page-narrow`.

Use three bands:

1. **Workbench Header**
   - compact title/subtitle using existing `dashboard.greeting` and `dashboard.summary`.
   - right-side health badge: healthy or needs review based on `divergedCount`.

2. **Operations Strip**
   - left large panel: library coverage and route summary.
   - right stacked panels: connected agents and project drift.
   - two primary actions remain visible: scan/import and install.

3. **Recent Route List**
   - replace the plain recent list with rows showing:
     - skill initial marker;
     - skill name and source type;
     - route rail line;
     - target chips or `dashboard.notSynced`.

## Component Strategy

Keep this as a single-file `Dashboard.tsx` redesign for v1. Avoid extracting new components until the design is proven useful. Small local helper functions and arrays are acceptable.

Use existing shared primitives:

- `Button`
- `StatusPill`
- `EmptyState`

Do not create new UI primitives in this slice.

## Testing

Run from the repo root:

```bash
npm --prefix app run build
npm --prefix app run lint
```

Manual checks after implementation:

- Dashboard renders with zero skills.
- Dashboard renders with recent skills.
- Clicking recent skill rows still opens the skill and navigates to Library.
- Scan/import and install buttons still navigate to the same routes.
- Text remains inside cards at desktop width.

## Success Criteria

- `Dashboard.tsx` is visually redesigned using existing data only.
- Existing navigation and recent skill click behavior is preserved.
- No new i18n keys are added.
- No other pages are modified.
- Build and lint pass.
