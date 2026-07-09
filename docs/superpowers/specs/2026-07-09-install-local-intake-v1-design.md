---
title: Install Local Intake V1 Design
type: design
tags: [skiller, ui, install-skills, local-intake]
created: 2026-07-09
---

# Install Local Intake V1 Design

## Context

The Local tab currently has two adjacent panels: a manual import panel with three actions, and a scan panel with scan summary, rescan/import-all actions, loading/empty states, and discovered rows. The logic works, but visually the first panel feels detached from the scan workflow.

## Goal

Improve the Local install path's top-level structure by framing manual intake and scan intake as one coherent local intake workflow. Preserve all import, scan, rename, and batch behavior.

## Non-Goals

- Do not change scan/import/batch import logic.
- Do not redesign discovered skill rows in this slice.
- Do not change rename behavior.
- Do not change local error handling.
- Do not change marketplace or Git sections.
- Do not add new i18n keys.
- Do not add dependencies.

## Scope

Modify only:

- `app/src/views/InstallSkills.tsx`

Allowed:

- replace the Local tab's top manual import panel and scan panel header with a clearer shared local intake frame;
- keep the three manual import buttons and their existing handlers;
- keep scan summary, rescan, import-all, loading, empty, and row rendering behavior;
- improve layout and spacing with existing tokens/classes.

Not allowed:

- changing `runScan`, `handleLocalFolderInstall`, `handleLocalFileInstall`, `handleBatchImportFolder`, `handleImportDiscovered`, or `handleImportAllDiscovered`;
- changing `scanGroups.map(...)` row internals;
- changing toasts or API calls.

## Design

Structure the Local tab as:

```text
Local intake panel
  Header: Local import explanation
  Manual actions: folder / archive / batch folder

Scan panel
  Header: Scan summary + rescan/import all actions
  Body: existing loading/empty/scanGroups rows
```

This keeps the existing two-stage workflow but makes the relationship clearer:

1. User can manually import a known source.
2. User can scan known agent locations and import discovered skills.

Use existing visual tokens only:

- `app-panel`
- `app-panel-muted`
- `app-button-primary`
- `app-button-secondary`
- `border-border-subtle`
- `bg-background`

## Testing

Run from the repo root:

```bash
npm --prefix app run build
npm --prefix app run lint
```

Manual checks after implementation:

- Folder import button still calls `handleLocalFolderInstall`.
- Archive import button still calls `handleLocalFileInstall`.
- Batch import button still calls `handleBatchImportFolder`.
- Rescan button still calls `runScan`.
- Import all still uses the same disabled conditions.
- Scan rows still render unchanged.

## Success Criteria

- Local tab top-level structure reads as one coherent intake workflow.
- Scan result rows are not redesigned.
- Marketplace and Git sections are not modified.
- No new i18n keys are added.
- Build and lint pass.
