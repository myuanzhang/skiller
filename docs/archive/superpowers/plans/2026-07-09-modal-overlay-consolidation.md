# Modal Overlay Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a shared centered modal shell and migrate the approved ordinary dialogs without changing their content or business behavior.

**Architecture:** `app/src/components/ui/Modal.tsx` owns the repeated fixed overlay, backdrop, centered layout, and content wrapper. Existing dialog components keep their title, content, actions, state, async handlers, translations, and panel sizing by passing panel classes into `contentClassName`.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, existing `cn` helper from `app/src/utils.ts`.

## Global Constraints

- Do not redesign dialog content.
- Do not change business logic, validation, or async behavior.
- Do not migrate specialized overlays in this slice.
- Do not add a third-party UI library.
- Preserve blocked close behavior in loading dialogs.
- Run verification from the repo root with `npm --prefix app run build`.

---

## File Structure

- Create `app/src/components/ui/Modal.tsx`: shared ordinary modal shell.
- Modify `app/src/components/ConfirmDialog.tsx`: replace only outer shell with `Modal`.
- Modify `app/src/components/CreatePresetDialog.tsx`: replace only outer shell with `Modal`.
- Modify `app/src/components/RenamePresetDialog.tsx`: replace only outer shell with `Modal`.
- Modify `app/src/components/TagRenameDialog.tsx`: replace only outer shell with `Modal`.
- Modify `app/src/components/CloseActionDialog.tsx`: replace only outer shell with `Modal`.
- Modify `app/src/components/BatchTagDialog.tsx`: replace only outer shell with `Modal`.
- Modify `app/src/components/GitSetupDialog.tsx`: replace only outer shell with `Modal`, preserving loading close guard.
- Modify `app/src/components/GitRecoveryDialog.tsx`: replace only outer shell with `Modal`, preserving loading close guard.

## Task 1: Add Shared Modal Primitive

**Files:**
- Create: `app/src/components/ui/Modal.tsx`

**Interfaces:**
- Produces:
  - `ModalProps`
  - `Modal({ open = true, children, className, overlayClassName, contentClassName, onClose, closeOnBackdrop = true, zIndexClassName = "z-50" }: ModalProps): JSX.Element | null`

- [ ] **Step 1: Create `Modal.tsx`**

Add this exact file:

```tsx
import type { ReactNode } from "react";
import { cn } from "../../utils";

export interface ModalProps {
  open?: boolean;
  children: ReactNode;
  className?: string;
  overlayClassName?: string;
  contentClassName?: string;
  onClose?: () => void;
  closeOnBackdrop?: boolean;
  zIndexClassName?: string;
}

export function Modal({
  open = true,
  children,
  className,
  overlayClassName,
  contentClassName,
  onClose,
  closeOnBackdrop = true,
  zIndexClassName = "z-50",
}: ModalProps) {
  if (!open) return null;

  const handleBackdropClick = () => {
    if (closeOnBackdrop) {
      onClose?.();
    }
  };

  return (
    <div className={cn("fixed inset-0 flex items-center justify-center", zIndexClassName, className)}>
      <div
        className={cn("absolute inset-0 bg-black/70 backdrop-blur-sm", overlayClassName)}
        onClick={handleBackdropClick}
      />
      <div className={cn("relative", contentClassName)}>{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: Run TypeScript build check**

Run:

```bash
npm --prefix app run build
```

Expected: build passes, or any failure is unrelated to `Modal.tsx`. If a type error mentions `Modal.tsx`, fix it before continuing.

- [ ] **Step 3: Commit**

```bash
git add app/src/components/ui/Modal.tsx
git commit -m "feat(ui): add modal shell primitive"
```

## Task 2: Migrate Simple Preset, Tag, Confirm, and Close Dialogs

**Files:**
- Modify: `app/src/components/ConfirmDialog.tsx`
- Modify: `app/src/components/CreatePresetDialog.tsx`
- Modify: `app/src/components/RenamePresetDialog.tsx`
- Modify: `app/src/components/TagRenameDialog.tsx`
- Modify: `app/src/components/CloseActionDialog.tsx`

**Interfaces:**
- Consumes: `Modal` from `./ui/Modal` for files in `app/src/components/`.
- Produces: Same exported dialog component names and props as before.

- [ ] **Step 1: Import `Modal` in each file**

Add this import to each target file:

```tsx
import { Modal } from "./ui/Modal";
```

- [ ] **Step 2: Replace `ConfirmDialog` outer shell**

In `app/src/components/ConfirmDialog.tsx`, keep `if (!open) return null;` unchanged. Replace:

```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center">
  <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
  <div className="relative bg-surface border border-border rounded-xl w-full max-w-sm p-5 shadow-2xl">
```

with:

```tsx
<Modal
  open={open}
  onClose={onClose}
  contentClassName="bg-surface border border-border rounded-xl w-full max-w-sm p-5 shadow-2xl"
>
```

Replace the two final closing tags:

```tsx
  </div>
</div>
```

with:

```tsx
</Modal>
```

- [ ] **Step 3: Replace `CreatePresetDialog` outer shell**

In `app/src/components/CreatePresetDialog.tsx`, keep `if (!open) return null;` unchanged. Replace:

```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center">
  <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
  <div className="relative bg-surface border border-border rounded-xl w-full max-w-[400px] p-5 shadow-2xl">
```

with:

```tsx
<Modal
  open={open}
  onClose={onClose}
  contentClassName="bg-surface border border-border rounded-xl w-full max-w-[400px] p-5 shadow-2xl"
>
```

Replace the two final closing tags with `</Modal>`.

- [ ] **Step 4: Replace `RenamePresetDialog` outer shell**

In `app/src/components/RenamePresetDialog.tsx`, keep `if (!open) return null;` unchanged. Replace:

```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center">
  <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
  <div className="relative bg-surface border border-border rounded-xl w-full max-w-[400px] p-5 shadow-2xl">
```

with:

```tsx
<Modal
  open={open}
  onClose={onClose}
  contentClassName="bg-surface border border-border rounded-xl w-full max-w-[400px] p-5 shadow-2xl"
>
```

Replace the two final closing tags with `</Modal>`.

- [ ] **Step 5: Replace `TagRenameDialog` outer shell**

In `app/src/components/TagRenameDialog.tsx`, keep `if (!open) return null;` unchanged. Replace:

```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center">
  <div className="absolute inset-0 z-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
  <div className="relative z-10 bg-surface border border-border rounded-xl w-full max-w-[400px] p-5 shadow-2xl">
```

with:

```tsx
<Modal
  open={open}
  onClose={onClose}
  contentClassName="bg-surface border border-border rounded-xl w-full max-w-[400px] p-5 shadow-2xl"
>
```

Replace the two final closing tags with `</Modal>`.

- [ ] **Step 6: Replace `CloseActionDialog` outer shell**

In `app/src/components/CloseActionDialog.tsx`, keep `if (!open) return null;` unchanged. Replace:

```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center">
  <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleCancel} />
  <div className="relative bg-surface border border-border rounded-xl w-full max-w-sm p-5 shadow-2xl">
```

with:

```tsx
<Modal
  open={open}
  onClose={handleCancel}
  contentClassName="bg-surface border border-border rounded-xl w-full max-w-sm p-5 shadow-2xl"
>
```

Replace the two final closing tags with `</Modal>`.

- [ ] **Step 7: Search for leftover migrated shell markup**

Run:

```bash
rg -n "absolute inset-0.*bg-black/70 backdrop-blur-sm|fixed inset-0 z-50 flex items-center justify-center" app/src/components/ConfirmDialog.tsx app/src/components/CreatePresetDialog.tsx app/src/components/RenamePresetDialog.tsx app/src/components/TagRenameDialog.tsx app/src/components/CloseActionDialog.tsx
```

Expected: no output.

- [ ] **Step 8: Run build**

Run:

```bash
npm --prefix app run build
```

Expected: build passes.

- [ ] **Step 9: Commit**

```bash
git add app/src/components/ConfirmDialog.tsx app/src/components/CreatePresetDialog.tsx app/src/components/RenamePresetDialog.tsx app/src/components/TagRenameDialog.tsx app/src/components/CloseActionDialog.tsx
git commit -m "refactor(ui): use modal shell in basic dialogs"
```

## Task 3: Migrate Batch and Git Dialogs

**Files:**
- Modify: `app/src/components/BatchTagDialog.tsx`
- Modify: `app/src/components/GitSetupDialog.tsx`
- Modify: `app/src/components/GitRecoveryDialog.tsx`

**Interfaces:**
- Consumes: `Modal` from `./ui/Modal`.
- Produces: Same exported dialog component names and props as before.

- [ ] **Step 1: Import `Modal` in each file**

Add this import to each target file:

```tsx
import { Modal } from "./ui/Modal";
```

- [ ] **Step 2: Replace `BatchTagDialog` outer shell**

In `app/src/components/BatchTagDialog.tsx`, keep `if (!open) return null;` unchanged. Replace:

```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center">
  <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
  <div className="relative bg-surface border border-border rounded-xl w-full max-w-[440px] p-5 shadow-2xl">
```

with:

```tsx
<Modal
  open={open}
  onClose={onClose}
  contentClassName="bg-surface border border-border rounded-xl w-full max-w-[440px] p-5 shadow-2xl"
>
```

Replace the two final closing tags with `</Modal>`.

- [ ] **Step 3: Replace `GitSetupDialog` outer shell**

In `app/src/components/GitSetupDialog.tsx`, keep `if (!open) return null;` unchanged. Replace:

```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center">
  <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !loading && onClose()} />
  <div className="relative bg-surface border border-border rounded-xl w-full max-w-lg p-5 shadow-2xl">
```

with:

```tsx
<Modal
  open={open}
  onClose={onClose}
  closeOnBackdrop={!loading}
  contentClassName="bg-surface border border-border rounded-xl w-full max-w-lg p-5 shadow-2xl"
>
```

Replace the two final closing tags with `</Modal>`.

- [ ] **Step 4: Replace `GitRecoveryDialog` outer shell**

In `app/src/components/GitRecoveryDialog.tsx`, keep `if (!open) return null;` unchanged. Replace:

```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center">
  <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !loading && onClose()} />
  <div className="relative bg-surface border border-border rounded-xl w-full max-w-lg p-5 shadow-2xl">
```

with:

```tsx
<Modal
  open={open}
  onClose={onClose}
  closeOnBackdrop={!loading}
  contentClassName="bg-surface border border-border rounded-xl w-full max-w-lg p-5 shadow-2xl"
>
```

Replace the two final closing tags with `</Modal>`.

- [ ] **Step 5: Search for leftover migrated shell markup**

Run:

```bash
rg -n "absolute inset-0.*bg-black/70 backdrop-blur-sm|fixed inset-0 z-50 flex items-center justify-center" app/src/components/BatchTagDialog.tsx app/src/components/GitSetupDialog.tsx app/src/components/GitRecoveryDialog.tsx
```

Expected: no output.

- [ ] **Step 6: Run build**

Run:

```bash
npm --prefix app run build
```

Expected: build passes.

- [ ] **Step 7: Commit**

```bash
git add app/src/components/BatchTagDialog.tsx app/src/components/GitSetupDialog.tsx app/src/components/GitRecoveryDialog.tsx
git commit -m "refactor(ui): use modal shell in batch and git dialogs"
```

## Task 4: Final Verification

**Files:**
- Inspect: `app/src/components/ui/Modal.tsx`
- Inspect: migrated dialog files from Tasks 2 and 3

**Interfaces:**
- Consumes: all migrated components and build pipeline.
- Produces: verification evidence.

- [ ] **Step 1: Confirm specialized overlays remain untouched**

Run:

```bash
rg -n "bg-black/(40|60|65|70)|CommandPalette|DetailSheet|HelpDialog|AddSkillsSheet" app/src/components/DetailSheet.tsx app/src/components/AddSkillsSheet.tsx app/src/components/CommandPalette.tsx app/src/components/HelpDialog.tsx
```

Expected: output still shows these specialized overlays in their original files.

- [ ] **Step 2: Confirm approved ordinary dialogs import `Modal`**

Run:

```bash
rg -n "import \\{ Modal \\} from \"\\.\\/ui\\/Modal\"" app/src/components/ConfirmDialog.tsx app/src/components/CreatePresetDialog.tsx app/src/components/RenamePresetDialog.tsx app/src/components/TagRenameDialog.tsx app/src/components/CloseActionDialog.tsx app/src/components/BatchTagDialog.tsx app/src/components/GitSetupDialog.tsx app/src/components/GitRecoveryDialog.tsx
```

Expected: one import line in each of the eight files.

- [ ] **Step 3: Confirm duplicated ordinary backdrop shell is removed**

Run:

```bash
rg -n "absolute inset-0.*bg-black/70 backdrop-blur-sm|fixed inset-0 z-50 flex items-center justify-center" app/src/components/ConfirmDialog.tsx app/src/components/CreatePresetDialog.tsx app/src/components/RenamePresetDialog.tsx app/src/components/TagRenameDialog.tsx app/src/components/CloseActionDialog.tsx app/src/components/BatchTagDialog.tsx app/src/components/GitSetupDialog.tsx app/src/components/GitRecoveryDialog.tsx
```

Expected: no output.

- [ ] **Step 4: Run final build**

Run:

```bash
npm --prefix app run build
```

Expected: build passes.

- [ ] **Step 5: Check git status**

Run:

```bash
git status --short --branch
```

Expected: clean worktree after the task commits, with local branch ahead of origin by the design and implementation commits.
