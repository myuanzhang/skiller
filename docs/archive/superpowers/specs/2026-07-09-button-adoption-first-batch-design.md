---
title: Button Adoption First Batch Design
type: design
tags: [skiller, ui, button, refactor]
created: 2026-07-09
---

# Button Adoption First Batch Design

## Context

The UI refactor has introduced a shared `Button` primitive, but several action buttons still use hand-written Tailwind class strings. The remaining surface is broad, especially in `InstallSkills`, so the first adoption slice should be narrow and easy to verify.

## Goal

Replace selected hand-written text action buttons with the shared `Button` primitive while preserving current visuals, handlers, disabled states, loading icons, and layout.

## Non-Goals

- Do not migrate every `<button>` in the app.
- Do not touch `InstallSkills` in this slice.
- Do not migrate icon-only hover buttons, tag chips, menu items, tabs, or micro-interaction buttons.
- Do not expand the `Button` variant API in this slice.
- Do not change business logic, translations, data flow, or layout structure.

## Scope

Migrate a focused first batch:

- `app/src/components/MultiSelectToolbar.tsx`
  - Remaining hand-written toolbar action buttons.
  - Preserve sky, amber, violet, and red semantic colors with `className` overrides where needed.

- `app/src/views/MySkills.tsx`
  - Top toolbar text action buttons around multi-select, refresh/check, batch update, and view mode controls.
  - Leave card hover icon buttons and tag/action micro-controls unchanged.

`InstallSkills` remains a later dedicated slice because it contains several distinct button roles and local interaction patterns.

## Design

Use the existing `Button` primitive from `app/src/components/ui/Button.tsx`.

For buttons matching existing variants:

- neutral toolbar actions use `variant="ghost"` or `variant="secondary"`;
- destructive actions use `variant="danger"` only when the existing visual is a filled destructive action;
- primary accent actions use the default `variant="primary"`.

For colored toolbar actions that do not fit the current variants, use `Button` with explicit `className` overrides. This keeps the first batch adoption local and avoids adding speculative variants.

Use `icon={...}` for leading icons instead of manually placing icon elements inside the button body. Keep existing loading icon animation expressions unchanged.

## Testing

Run from the repo root:

```bash
npm --prefix app run build
npm --prefix app run lint
```

Manual checks after implementation:

- Multi-select toolbar still shows the same actions under the same conditions.
- Loading icons still animate for update/check operations.
- Disabled states remain disabled.
- `MySkills` toolbar keeps the same spacing and action order.
- View mode toggles remain readable and do not shift layout.

## Success Criteria

- `MultiSelectToolbar` uses `Button` for its remaining text action buttons.
- `MySkills` top toolbar uses `Button` for the selected first-batch text action buttons.
- `InstallSkills` and micro-interaction buttons remain untouched.
- `npm --prefix app run build` passes.
- `npm --prefix app run lint` passes.
