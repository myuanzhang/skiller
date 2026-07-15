---
title: Skill Card Shell V2 ProjectDetail Design
type: design
tags: [skiller, ui, skill-card, project-detail]
created: 2026-07-09
---

# Skill Card Shell V2 ProjectDetail Design

## Context

`SkillCardShell` now centralizes the basic grid/list skill card wrapper and is used by `WorkspaceView`. `ProjectDetail` has matching grid/list wrapper class patterns, with page-specific content and actions inside each card.

## Goal

Migrate only `ProjectDetail`'s skill card outer wrappers to `SkillCardShell`. Preserve all project-specific card content, status labels, agent dots, update actions, enable/delete controls, selection behavior, and layout branching.

## Non-Goals

- Do not migrate `MySkills` in this slice.
- Do not change `SkillCardShell` API unless a build failure proves it necessary.
- Do not extract a project skill card component.
- Do not change update/delete/toggle action placement or behavior.
- Do not change tags, status labels, agent dots, or text content.
- Do not add dependencies.

## Scope

Modify:

- `app/src/views/ProjectDetail.tsx`
  - import `SkillCardShell`;
  - replace the grid card outer wrapper;
  - replace the list card outer wrapper.

Leave untouched:

- `app/src/views/MySkills.tsx`
- `app/src/views/WorkspaceView.tsx`
- `app/src/components/ui/SkillCardShell.tsx`

## Mapping

Existing `ProjectDetail` wrapper state maps directly to `SkillCardShell` props:

- `skill.enabledCount > 0` -> `active`
- `skill.enabledCount === 0` -> `disabled`
- `isMultiSelect && isSelected` -> `selected`
- `viewMode === "grid"` -> `viewMode="grid"`
- list branch -> `viewMode="list"`
- existing `onClick` remains unchanged

## Testing

Run from the repo root:

```bash
npm --prefix app run build
npm --prefix app run lint
```

Manual checks after implementation:

- Project grid cards keep active left rail, disabled dimming, and selected ring.
- Project list rows keep active left rail, disabled dimming, and selected ring.
- Clicking a card still opens detail when not in multi-select.
- Clicking a card still toggles selection when in multi-select.
- Inner update/delete/enable buttons still stop propagation.

## Success Criteria

- `ProjectDetail` consumes `SkillCardShell` for grid and list skill cards.
- `MySkills`, `WorkspaceView`, and `SkillCardShell` remain unchanged.
- Build and lint pass.
