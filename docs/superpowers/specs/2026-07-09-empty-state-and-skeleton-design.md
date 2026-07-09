---
title: Empty State And Skeleton Design
type: design
tags: [skiller, ui, empty-state, skeleton, design-system]
created: 2026-07-09
---

# Empty State And Skeleton Design

## Context

The app now has shared status and action primitives, but several loading and empty states still render as plain text or isolated spinners. This makes page transitions feel abrupt and leaves empty screens visually weaker than the rest of the interface.

## Goal

Add shared `EmptyState` and `Skeleton` primitives, then migrate a narrow first batch of list/document loading and empty states. The change should improve polish while preserving copy, actions, data flow, and layout structure.

## Non-Goals

- Do not redesign `InstallSkills`.
- Do not change data fetching or loading conditions.
- Do not change i18n keys or copy.
- Do not add new dependencies.
- Do not redesign cards, page headers, or Dashboard in this slice.
- Do not replace every spinner in the app.

## Scope

Create:

- `app/src/components/ui/EmptyState.tsx`
  - centered empty/message block with optional icon, title, description, action, and className.

- `app/src/components/ui/Skeleton.tsx`
  - base skeleton block plus small helpers for list rows and document content.

Migrate first consumers:

- `WorkspaceView`
  - local skills list loading state;
  - local skills empty state;
  - local detail document loading/missing/unavailable states.

- `ProjectDetail`
  - project skill list loading state;
  - project skill list empty state;
  - detail document loading/missing/unavailable states.

- `SkillDetailPanel`
  - document loading/missing/unavailable states.

- `MySkills`
  - simple skill list empty state.

Leave later consumers untouched:

- `InstallSkills`
- `Settings`
- command palette empty state
- inline button-level loading spinners
- toast progress states

## Design

`EmptyState` owns the common centered layout:

```tsx
<EmptyState
  icon={<Layers className="h-12 w-12" />}
  title={t("mySkills.noSkills")}
  description={t("mySkills.addFirst")}
  action={<Button>...</Button>}
/>
```

The component should be visually quiet and utilitarian: no large hero card, no decorative backgrounds, no marketing copy. It should use existing colors (`text-faint`, `text-tertiary`, `text-muted`) and allow page-specific min-height/padding through `className`.

`Skeleton` should provide stable dimensions so loading does not collapse content:

```tsx
<Skeleton className="h-4 w-32" />
<SkeletonRows rows={6} />
<DocumentSkeleton />
```

Skeletons should use subdued surface tokens and pulse animation. They should not introduce a new color family.

## Testing

Run from the repo root:

```bash
npm --prefix app run build
npm --prefix app run lint
```

Manual checks after implementation:

- List loading states occupy roughly the same content area as the final list.
- Empty states preserve the same title/description/action copy.
- Document detail loading uses document-shaped placeholders instead of a single text line.
- Missing/unavailable document states remain clear and centered.

## Success Criteria

- `EmptyState` and `Skeleton` primitives exist under `app/src/components/ui/`.
- The selected loading and empty states consume those primitives.
- `InstallSkills` remains untouched.
- Build and lint pass.
