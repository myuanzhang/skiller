---
title: Status Palette And Pill Design
type: design
tags: [skiller, ui, status, design-system]
created: 2026-07-09
---

# Status Palette And Pill Design

## Context

The app already uses CSS variables, shared panels, `Button`, and `Modal`, but status styling is still scattered. Sync states, agent dot states, and conflict states repeat similar Tailwind class strings in multiple files. This makes the interface harder to tune visually because the same semantic state can drift across pages.

## Goal

Create a shared status palette and a small `StatusPill` primitive, then migrate the first duplicated consumers. The first slice should improve visual consistency without changing layout, data flow, translations, or business behavior.

## Non-Goals

- Do not redesign Dashboard, cards, or page layouts.
- Do not migrate all colored badges in the app.
- Do not change `skillTags` or `presetIcons`; they are separate category/icon palettes.
- Do not change sync status labels or i18n keys.
- Do not add dependencies.

## Scope

Create:

- `app/src/lib/statusPalette.ts`
  - shared sync status classes for `in_sync`, `project_newer`, `center_newer`, `diverged`, and project/local-only states;
  - shared agent dot state classes for `synced`, `available`, and `orphan`;
  - shared hidden-count dot class.

- `app/src/components/ui/StatusPill.tsx`
  - a thin visual primitive for pill-shaped status labels.
  - accepts `children`, `className`, and optional `title`.

Migrate first consumers:

- `WorkspaceView.getLocalStatusMeta`
- `ProjectDetail.getSyncStatusMeta`
- `SyncDots`
- `ProjectAgentDots`

Leave later consumers untouched in this slice:

- `skillTags`
- `presetIcons`
- `PresetBar`
- `SkillPickerRow`
- `Settings`
- `Dashboard`

## Design

`statusPalette.ts` owns semantic class strings. The exported names should describe product meaning rather than color:

```ts
export type SyncStatusTone =
  | "in_sync"
  | "project_newer"
  | "center_newer"
  | "diverged"
  | "project_only";

export const syncStatusClass: Record<SyncStatusTone, string> = { ... };
```

Agent dot classes should preserve the current icon-vs-text behavior:

```ts
export type AgentDotState = "synced" | "available" | "orphan";

export const agentDotIconClass: Record<AgentDotState, string> = { ... };
export const agentDotTextClass: Record<AgentDotState, string> = { ... };
export const hiddenAgentDotClass = "...";
```

`StatusPill` should not know business states. It only provides the shared pill shell:

```tsx
<StatusPill className={syncStatusClass[status]}>
  {label}
</StatusPill>
```

The implementation should preserve current colors in this first slice. Visual redesign comes later after the semantic surface is centralized.

## Testing

Run from the repo root:

```bash
npm --prefix app run build
npm --prefix app run lint
```

Manual checks after implementation:

- Workspace local skill status pills keep the same labels and colors.
- Project skill status pills keep the same labels and colors.
- Agent dots keep the same synced/available/orphan visual treatment.
- Hidden agent count dots keep the same shape and text.

## Success Criteria

- `WorkspaceView` and `ProjectDetail` no longer define duplicate sync status color strings.
- `SyncDots` and `ProjectAgentDots` consume shared agent dot classes.
- `StatusPill` is used for the migrated sync status labels.
- Build and lint pass.
