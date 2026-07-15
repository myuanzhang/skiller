---
title: Install Skills IA V1 Design
type: design
tags: [skiller, ui, install-skills, information-architecture]
created: 2026-07-09
---

# Install Skills IA V1 Design

## Context

`InstallSkills` is the most complex remaining page. It combines three different workflows:

- marketplace browse/search/filter/install;
- local scan/import/batch import;
- Git URL install/preview/selection.

The page already works, but the information architecture is dense and visually uneven. A full redesign of cards, scan rows, and Git preview would be too large for one safe slice.

## Goal

Redesign the top-level information architecture of `InstallSkills` so users can quickly understand which install path they are using and what the primary action is. Keep all install/search/import behavior unchanged.

## Non-Goals

- Do not change marketplace search, filtering, pagination, or install logic.
- Do not redesign marketplace skill cards in this slice.
- Do not redesign local scan result rows in this slice.
- Do not redesign Git preview dialog in this slice.
- Do not add backend commands or data fetching.
- Do not add dependencies.
- Do not add new i18n keys unless a build issue makes reuse impossible.

## Scope

Modify only:

- `app/src/views/InstallSkills.tsx`

Allowed changes:

- replace the current simple header/tab row with a clearer install workbench header;
- present the three install paths as a compact source switcher with existing labels/icons;
- wrap each tab in a consistent top-level section layout;
- improve the top-level visual hierarchy with existing tokens and primitives.

Not allowed in this slice:

- changing handler logic;
- changing tab IDs or URL params;
- changing list/card internals;
- changing modal/dialog internals;
- changing API calls or state machines.

## Design Direction

Subject: **Skill Intake Desk** inside the broader Agent Skill Registry Workbench.

The page should feel like an intake station with three lanes:

1. Marketplace discovery
2. Local intake
3. Git intake

The visual improvement should be structural, not decorative:

- make the active lane obvious;
- keep the search/filter tools close to Marketplace;
- keep local scan/import actions grouped as local intake;
- keep Git install focused on one URL entry task.

## Layout

The page should remain inside `app-page`.

Top-level structure:

```text
Header
  Title
  Summary / current lane hint using existing copy

Source Switcher
  Market | Local | Git

Active Lane Body
  Existing tab content, lightly framed
```

Use existing icons and labels:

- `install.browseMarket`
- `install.localInstall`
- `install.gitInstall`
- `install.local.description`
- `install.gitDesc`

Do not introduce a marketing hero. This is a desktop utility screen.

## Implementation Strategy

Keep the implementation in `InstallSkills.tsx` for v1. Small local arrays and helper constants are acceptable.

Use existing primitives when possible:

- existing `app-panel`, `app-section-title`, `app-page-header`;
- `Button` only if replacing an equivalent top-level button is straightforward;
- avoid introducing new primitives in this slice.

## Testing

Run from the repo root:

```bash
npm --prefix app run build
npm --prefix app run lint
```

Manual checks after implementation:

- Switching Market / Local / Git still updates the URL tab param.
- Initial `?tab=local` and `?tab=git` still open the correct tab.
- Marketplace search/filter still works.
- Local scan/import buttons still call the same handlers.
- Git URL install still opens the same preview dialog.

## Success Criteria

- `InstallSkills` has clearer top-level install path structure.
- Existing tab behavior and URL params are preserved.
- No backend or install logic changes.
- No other pages are modified.
- Build and lint pass.
