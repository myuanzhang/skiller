---
title: Modal Overlay Consolidation Design
type: design
tags: [skiller, ui, modal, refactor]
created: 2026-07-09
---

# Modal Overlay Consolidation Design

## Context

The UI refactor plan identifies repeated dialog overlay shells as a maintainability problem. Several dialogs duplicate the same fixed overlay, dark backdrop, blur, close-on-backdrop behavior, and centered content layout. The recent UI work already added shared primitives and tokens, so this slice should continue that direction without changing user-facing flows.

## Goal

Create one shared modal shell for ordinary centered dialogs and migrate a small set of matching dialogs to it. The change must preserve existing visuals and close behavior while removing duplicated overlay markup.

## Non-Goals

- Do not redesign dialog content.
- Do not change business logic, validation, or async behavior.
- Do not migrate specialized overlays in this slice.
- Do not add a third-party UI library.

## Candidate Components

Migrate ordinary centered dialogs whose shell behavior is effectively the same:

- `ConfirmDialog`
- `CreatePresetDialog`
- `RenamePresetDialog`
- `BatchTagDialog`
- `TagRenameDialog`
- `CloseActionDialog`
- `GitSetupDialog`
- `GitRecoveryDialog`

Leave specialized overlays unchanged:

- `DetailSheet`, because it is a side sheet with different motion and layout.
- `AddSkillsSheet`, because it is a large sheet with custom internal loading overlay behavior.
- `CommandPalette`, because it uses a top-aligned command overlay.
- `HelpDialog`, because it is simple and has its own app-level help behavior.

## Design

Add `app/src/components/ui/Modal.tsx` with a small API:

```tsx
interface ModalProps {
  open?: boolean;
  children: React.ReactNode;
  className?: string;
  overlayClassName?: string;
  contentClassName?: string;
  onClose?: () => void;
  closeOnBackdrop?: boolean;
  zIndexClassName?: string;
}
```

The component owns:

- the fixed full-screen positioning;
- the dark blurred backdrop;
- optional backdrop click close;
- centered flex layout;
- a content wrapper slot.

The component does not own:

- dialog title/content/actions;
- keyboard handling;
- loading guards;
- form submission;
- translations.

Consumers keep their existing content markup and pass the previous panel classes into `contentClassName`. If a dialog must block backdrop close while loading, it passes either no `onClose` during loading or `closeOnBackdrop={false}` while keeping its own close buttons disabled.

## Migration Plan

Start with the simplest components first:

1. `ConfirmDialog`
2. `CreatePresetDialog`
3. `RenamePresetDialog`
4. `TagRenameDialog`
5. `CloseActionDialog`
6. `BatchTagDialog`
7. `GitSetupDialog`
8. `GitRecoveryDialog`

Each migration should only replace the outer shell. Existing content, handlers, translations, and class names inside the dialog body should remain intact.

## Testing

Run from `app/`:

```bash
npm run build
```

Manual checks after implementation:

- Dialog still opens at the same position.
- Backdrop click closes the dialog where it previously did.
- Backdrop click remains blocked during loading where it was previously blocked.
- Primary, cancel, and close actions still call the same handlers.
- No visible layout shift in migrated dialogs.

## Success Criteria

- Shared `Modal` primitive exists under `app/src/components/ui/`.
- The approved ordinary dialogs no longer duplicate `absolute inset-0 bg-black/70 backdrop-blur-sm` shell markup.
- Specialized overlays remain unchanged.
- `npm run build` passes.
