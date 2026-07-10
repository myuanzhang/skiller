import { useTranslation } from "react-i18next";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { TagRenameDialog } from "../../components/TagRenameDialog";
import { BatchTagDialog } from "../../components/BatchTagDialog";
import { GitSetupDialog } from "../../components/GitSetupDialog";
import { GitRecoveryDialog } from "../../components/GitRecoveryDialog";
import type { GitUpstreamHealth, ManagedSkill } from "../../lib/tauri";
import { TagContextMenu } from "./TagContextMenu";

interface TagMenuState {
  tag: string;
  x: number;
  y: number;
}

interface MySkillsDialogsProps {
  batchDeleteConfirm: boolean;
  selectedCount: number;
  tagToDelete: string | null;
  tagToRename: string | null;
  tagMenu: TagMenuState | null;
  batchTagDialogOpen: boolean;
  selectedSkills: ManagedSkill[];
  allTags: string[];
  restoreVersionTag: string | null;
  setupOpen: boolean;
  hasGitRemote: boolean;
  recoveryOpen: boolean;
  recoveryReason: GitUpstreamHealth | "conflict";
  displaySnapshotLabel: (tag: string) => string;
  onCloseBatchDelete: () => void;
  onConfirmBatchDelete: () => Promise<void>;
  onCloseTagDelete: () => void;
  onConfirmTagDelete: () => Promise<void>;
  onCloseTagRename: () => void;
  onRenameTag: (newName: string) => Promise<void>;
  onCloseTagMenu: () => void;
  onTagMenuRename: (tag: string) => void;
  onTagMenuDelete: (tag: string) => void;
  onCloseBatchTagDialog: () => void;
  onApplyBatchTags: (adds: string[], removes: string[]) => Promise<void>;
  onCloseRestoreVersion: () => void;
  onConfirmRestoreVersion: () => Promise<void>;
  onCloseSetup: () => void;
  onSetupClone: () => Promise<void>;
  onSetupInit: () => Promise<void>;
  onCloseRecovery: () => void;
  onRecoveryReclone: () => Promise<void>;
}

export function MySkillsDialogs({
  batchDeleteConfirm,
  selectedCount,
  tagToDelete,
  tagToRename,
  tagMenu,
  batchTagDialogOpen,
  selectedSkills,
  allTags,
  restoreVersionTag,
  setupOpen,
  hasGitRemote,
  recoveryOpen,
  recoveryReason,
  displaySnapshotLabel,
  onCloseBatchDelete,
  onConfirmBatchDelete,
  onCloseTagDelete,
  onConfirmTagDelete,
  onCloseTagRename,
  onRenameTag,
  onCloseTagMenu,
  onTagMenuRename,
  onTagMenuDelete,
  onCloseBatchTagDialog,
  onApplyBatchTags,
  onCloseRestoreVersion,
  onConfirmRestoreVersion,
  onCloseSetup,
  onSetupClone,
  onSetupInit,
  onCloseRecovery,
  onRecoveryReclone,
}: MySkillsDialogsProps) {
  const { t } = useTranslation();

  return (
    <>
      <ConfirmDialog
        open={batchDeleteConfirm}
        message={t("mySkills.batchDeleteConfirm", { count: selectedCount })}
        onClose={onCloseBatchDelete}
        onConfirm={onConfirmBatchDelete}
      />
      <ConfirmDialog
        open={tagToDelete !== null}
        title={t("mySkills.tags.deleteTag")}
        message={t("mySkills.tags.deleteConfirm", { tag: tagToDelete || "" })}
        onClose={onCloseTagDelete}
        onConfirm={onConfirmTagDelete}
      />
      <TagRenameDialog
        open={tagToRename !== null}
        currentName={tagToRename || ""}
        onClose={onCloseTagRename}
        onRename={onRenameTag}
      />
      {tagMenu && (
        <TagContextMenu
          menu={tagMenu}
          onClose={onCloseTagMenu}
          onRename={onTagMenuRename}
          onDelete={onTagMenuDelete}
        />
      )}
      <BatchTagDialog
        open={batchTagDialogOpen}
        skills={selectedSkills}
        allTags={allTags}
        onClose={onCloseBatchTagDialog}
        onApply={onApplyBatchTags}
      />
      <ConfirmDialog
        open={restoreVersionTag !== null}
        title={t("mySkills.gitVersionRestoreTitle")}
        message={t("mySkills.gitVersionRestoreConfirm", { tag: displaySnapshotLabel(restoreVersionTag || "") })}
        tone="warning"
        confirmLabel={t("mySkills.gitVersionRestore")}
        onClose={onCloseRestoreVersion}
        onConfirm={onConfirmRestoreVersion}
      />
      <GitSetupDialog
        open={setupOpen}
        hasRemote={hasGitRemote}
        onClose={onCloseSetup}
        onClone={onSetupClone}
        onInit={onSetupInit}
      />
      <GitRecoveryDialog
        open={recoveryOpen}
        reason={recoveryReason}
        onClose={onCloseRecovery}
        onReclone={onRecoveryReclone}
      />
    </>
  );
}
