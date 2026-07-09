---
title: Skill Card Shell V1 Design
type: design
tags: [skiller, ui, skill-card, design-system]
created: 2026-07-09
---

# Skill Card Shell V1 Design

## Context

Skill cards are the main repeated surface in Skiller, but each page currently owns its own card shell classes. `WorkspaceView` already has a local `WorkspaceSkillCard` component, while `MySkills` and `ProjectDetail` inline more complex card variants. A cross-page card component would be too broad for a first pass.

## Goal

Create a lightweight `SkillCardShell` visual primitive and migrate only `WorkspaceView`'s local `WorkspaceSkillCard` to it. This establishes the shared card shell language without touching page-specific business logic.

## Non-Goals

- Do not migrate `MySkills` in this slice.
- Do not migrate `ProjectDetail` in this slice.
- Do not change card content, actions, tags, status labels, or click behavior.
- Do not change grid/list layout decisions.
- Do not add dependencies.
- Do not introduce a large generic `SkillCard` business component.

## Scope

Create:

- `app/src/components/ui/SkillCardShell.tsx`
  - handles shared card outer shell only;
  - supports `viewMode: "grid" | "list"`;
  - supports `active`, `selected`, `disabled`, `className`, `children`, and `onClick`;
  - applies the shared hover, border, active left rail, selected ring, and cursor styling.

Migrate:

- `app/src/views/WorkspaceView.tsx`
  - local `WorkspaceSkillCard` uses `SkillCardShell` for both grid and list outer wrappers.
  - inner content remains in `WorkspaceSkillCard`.

Leave untouched:

- `app/src/views/MySkills.tsx`
- `app/src/views/ProjectDetail.tsx`
- action buttons and tags inside cards
- `SyncDots` / `ProjectAgentDots`

## Design

`SkillCardShell` is intentionally visual-only:

```tsx
<SkillCardShell viewMode={viewMode} active={active} selected={selected} onClick={onClick}>
  {children}
</SkillCardShell>
```

It should preserve the existing Workspace card classes:

- grid:
  - `app-panel group relative flex h-full cursor-pointer flex-col overflow-hidden transition-all hover:border-border hover:bg-surface-hover`
- list:
  - `app-panel group relative flex cursor-pointer items-center gap-3.5 rounded-xl border-transparent px-3.5 py-3 transition-all hover:border-border hover:bg-surface-hover`
- active:
  - `border-l-2 border-l-accent`
- selected:
  - `ring-1 ring-accent border-accent/40`
- disabled:
  - visual dimming only via `opacity-60`, no event blocking unless caller already controls it.

The component should not know about skill names, tags, status, agents, presets, or actions.

## Testing

Run from the repo root:

```bash
npm --prefix app run build
npm --prefix app run lint
```

Manual checks after implementation:

- Workspace grid cards keep the same spacing and hover behavior.
- Workspace list cards keep the same row spacing and hover behavior.
- Active cards still show the left accent rail.
- Existing card click behavior still opens the detail sheet.

## Success Criteria

- `SkillCardShell` exists under `app/src/components/ui/`.
- `WorkspaceSkillCard` uses `SkillCardShell` for outer grid/list wrappers.
- No other pages are modified.
- Build and lint pass.
