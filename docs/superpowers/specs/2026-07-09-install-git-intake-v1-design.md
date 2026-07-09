---
title: Install Git Intake V1 Design
type: design
tags: [skiller, ui, install-skills, git-intake]
created: 2026-07-09
---

# Install Git Intake V1 Design

## Context

After the Install Skills IA, marketplace card, and local intake updates, the Git tab remains visually simpler than the other install paths. It currently presents a compact card with an icon, description, repository URL input, optional reinstall warning, and one action button. The Git preview dialog already handles multi-skill selection and should remain unchanged.

## Goal

Improve the Git URL intake panel so the clone-preview workflow is clearer, while preserving all Git install, cancel, preview, and confirm behavior.

## Non-Goals

- Do not change `handleGitPreview`, `handleGitConfirm`, or `handleGitPreviewClose`.
- Do not redesign the Git preview dialog in this slice.
- Do not change Git URL validation or keyboard behavior.
- Do not change toast/progress behavior.
- Do not change marketplace or local sections.
- Do not add new i18n keys.
- Do not add dependencies.

## Scope

Modify only:

- `app/src/views/InstallSkills.tsx`

Allowed:

- replace the Git tab's top-level `app-panel max-w-lg p-5` with a fuller intake panel;
- keep the same input, warning, loading/cancel button, and clone/preview button;
- improve spacing, grouping, and visual hierarchy with existing tokens/classes.

Not allowed:

- changing the Git preview modal;
- changing state variables;
- changing handlers;
- changing API calls.

## Design

Structure the Git tab as:

```text
Git intake panel
  Header: icon + title + description
  URL form block
    label
    input
    already installed warning
  Action row
    cancel while loading OR clone/preview
```

Use existing copy:

- `install.gitTitle`
- `install.gitDesc`
- `install.repoUrl`
- `install.repoUrlPlaceholder`
- `install.gitAlreadyInstalled`
- `install.cancel`
- `install.gitReinstall`
- `install.installClone`

Use existing visual tokens:

- `app-panel`
- `app-input`
- `app-button-primary`
- `app-button-secondary`
- `border-border-subtle`
- `bg-background`
- existing amber warning style

## Testing

Run from the repo root:

```bash
npm --prefix app run build
npm --prefix app run lint
```

Manual checks after implementation:

- Enter key in URL input still triggers preview when allowed.
- Clone/preview button still calls `handleGitPreview`.
- Loading state still shows cancel button.
- Cancel button still calls `handleCancelInstall(gitCancelKey)`.
- Already-installed warning still appears for matching Git source refs.
- Git preview dialog remains unchanged.

## Success Criteria

- Git tab URL intake panel has clearer hierarchy.
- Git preview dialog is not modified.
- Marketplace/local sections are not modified.
- No new i18n keys are added.
- Build and lint pass.
