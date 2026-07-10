import type { ReactNode } from "react";
import { ArrowUpCircle, CheckCircle2, GitBranch, History, Loader2, Wrench } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/Button";
import { cn } from "../../utils";

export type GitToolbarMode =
  | "loading"
  | "uninitialized"
  | "needs_remote"
  | "needs_fix"
  | "up_to_date"
  | "pending_changes";

interface GitToolbarControlsProps {
  mode: GitToolbarMode;
  inlineStatus: ReactNode;
  gitLoading: string | null;
  isRepo: boolean;
  snapshotWhen: string | null;
  gitVersionsOpen: boolean;
  onOpenSetup: () => void;
  onOpenRecovery: () => void;
  onSync: () => void;
  onToggleSnapshots: () => void;
}

export function GitToolbarControls({
  mode,
  inlineStatus,
  gitLoading,
  isRepo,
  snapshotWhen,
  gitVersionsOpen,
  onOpenSetup,
  onOpenRecovery,
  onSync,
  onToggleSnapshots,
}: GitToolbarControlsProps) {
  const { t } = useTranslation();

  return (
    <>
      {inlineStatus ? (
        <span className="mr-0.5 inline-flex items-center px-1 leading-tight">
          {inlineStatus}
        </span>
      ) : null}

      {mode === "uninitialized" || mode === "needs_remote" ? (
        <Button
          variant="ghost"
          onClick={onOpenSetup}
          disabled={!!gitLoading}
          className="px-3 py-2"
          icon={
            gitLoading === "start" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <GitBranch className="h-3.5 w-3.5" />
            )
          }
        >
          {gitLoading === "start" ? t("settings.gitInitializing") : t("settings.gitStartBackup")}
        </Button>
      ) : mode === "needs_fix" ? (
        <Button
          variant="ghost"
          onClick={onOpenRecovery}
          disabled={!!gitLoading}
          className="px-3 py-2 text-red-500 hover:text-red-500"
          icon={
            gitLoading === "recovery" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Wrench className="h-3.5 w-3.5" />
            )
          }
        >
          {t("mySkills.gitRepoFixSetup")}
        </Button>
      ) : (
        <Button
          variant="ghost"
          onClick={onSync}
          disabled={!!gitLoading || mode === "up_to_date"}
          className={cn(
            "px-3 py-2",
            mode === "pending_changes" ? "text-amber-600 dark:text-amber-400" : "text-muted"
          )}
          icon={
            gitLoading === "sync" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : mode === "up_to_date" ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <ArrowUpCircle className="h-3.5 w-3.5" />
            )
          }
        >
          {gitLoading === "sync"
            ? t("mySkills.gitRepoSyncing")
            : mode === "up_to_date"
              ? t("mySkills.gitRepoSynced")
              : t("mySkills.gitRepoSync")}
        </Button>
      )}

      {isRepo ? (
        <Button
          variant="ghost"
          onClick={onToggleSnapshots}
          disabled={!!gitLoading}
          title={snapshotWhen ? t("mySkills.gitInlineLastSnapshot", { when: snapshotWhen }) : undefined}
          className={cn("ml-1 px-3 py-2", gitVersionsOpen ? "text-secondary" : "text-muted")}
          icon={<History className="h-3.5 w-3.5" />}
        >
          {t("mySkills.gitSnapshots")}
        </Button>
      ) : null}
    </>
  );
}
