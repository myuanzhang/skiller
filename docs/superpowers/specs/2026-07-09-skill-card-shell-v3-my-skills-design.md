---
title: Skill Card Shell V3 MySkills Design
type: design
tags: [skiller, ui, skill-card, my-skills]
created: 2026-07-09
---

# Skill Card Shell V3 MySkills Design

## Context

`SkillCardShell` now wraps `WorkspaceView` and `ProjectDetail` card shells. `MySkills` is the remaining major skill card surface, but it has the most interactions: drag handles, tag editing, source repair actions, preset toggles, sync dots, update checks, refresh actions, and deletion.

## Goal

Migrate only `MySkills` skill card outer wrappers to `SkillCardShell`. Preserve all existing internal content and interactions.

## Non-Goals

- Do not change tag editing behavior.
- Do not change drag-and-drop behavior.
- Do not change `SyncDots`, delete, refresh, update, source relink/detach, or preset toggle actions.
- Do not extract a `MySkills` card component.
- Do not change `SkillCardShell` API.
- Do not change filtering, sorting, or selection behavior.

## Scope

Modify:

- `app/src/views/MySkills.tsx`
  - import `SkillCardShell`;
  - replace the grid card outer wrapper;
  - replace the list card outer wrapper.

Leave untouched:

- `WorkspaceView`
- `ProjectDetail`
- `SkillCardShell`
- `SyncDots`
- `DeleteSkillButton`

## Mapping

Existing `MySkills` wrapper state maps to `SkillCardShell` props:

- `enabledInPreset` -> `active`
- `isMultiSelect && selectedIds.has(skill.id)` -> `selected`
- no disabled mapping in this slice
- existing `onClick` stays unchanged
- grid branch -> `viewMode="grid"`
- list branch -> `viewMode="list"`

Special case:

- `SkillCardShell` grid mode includes `overflow-hidden`.
- `MySkills` grid card currently allows tag suggestion popovers to escape the card while editing.
- When `tagEditSkillId === skill.id`, pass `className="overflow-visible"` to preserve tag suggestion visibility.
- Keep the existing `SortableSkillItem` `className={tagEditSkillId === skill.id ? "relative z-30" : undefined}`.

## Testing

Run from the repo root:

```bash
npm --prefix app run build
npm --prefix app run lint
```

Manual checks after implementation:

- MySkills grid cards keep active left rail and selected ring.
- MySkills list rows keep active left rail and selected ring.
- Clicking a card still opens detail when not in multi-select.
- Clicking a card still toggles selection when in multi-select.
- Tag add input and suggestion popover still appear above the card.
- Drag handles still render and start drag.
- Hover actions still appear only when expected.

## Success Criteria

- `MySkills` consumes `SkillCardShell` for grid and list skill card wrappers.
- `WorkspaceView`, `ProjectDetail`, and `SkillCardShell` remain unchanged.
- Build and lint pass.
