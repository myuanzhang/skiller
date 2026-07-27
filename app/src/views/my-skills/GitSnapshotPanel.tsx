import { RefreshCw, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "../../utils";
import type { GitBackupVersion } from "../../lib/tauri";

interface GitSnapshotPanelProps {
  currentVersionText: string | null;
  versions: GitBackupVersion[];
  loading: boolean;
  gitBusy: boolean;
  restoringVersionTag: string | null;
  deletingVersionTag: string | null;
  currentSnapshotTag: string | null;
  onRefresh: () => void;
  onRestoreVersion: (tag: string) => void;
  onDeleteVersion: (tag: string) => void;
  displaySnapshotLabel: (tag: string) => string;
  formatGitDateTime: (iso: string) => string;
}

export function GitSnapshotPanel({
  currentVersionText,
  versions,
  loading,
  gitBusy,
  restoringVersionTag,
  deletingVersionTag,
  currentSnapshotTag,
  onRefresh,
  onRestoreVersion,
  onDeleteVersion,
  displaySnapshotLabel,
  formatGitDateTime,
}: GitSnapshotPanelProps) {
  const { t } = useTranslation();
  const busy = !!restoringVersionTag || !!deletingVersionTag;

  return (
    <div className="app-panel -mt-2 mb-2 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="min-w-0">
          <h3 className="text-[13px] font-semibold text-secondary">{t("mySkills.gitVersionHistory")}</h3>
          <div className="truncate text-[11px] text-faint">{currentVersionText}</div>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading || gitBusy}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[13px] text-muted hover:bg-surface-hover hover:text-secondary disabled:opacity-50"
        >
          <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
          {t("settings.refresh")}
        </button>
      </div>
      {loading ? (
        <div className="py-2 text-[13px] text-muted">{t("mySkills.gitVersionLoading")}</div>
      ) : versions.length === 0 ? (
        <div className="py-2 text-[13px] text-muted">{t("mySkills.gitVersionEmpty")}</div>
      ) : (
        <div className="max-h-64 space-y-1 overflow-auto pr-1">
          {versions.map((version) => (
            <div
              key={version.tag}
              className="flex items-center justify-between rounded-md border border-border-subtle bg-bg-secondary px-2.5 py-2"
            >
              <div className="min-w-0 pr-3">
                <div className="truncate text-[13px] font-medium text-secondary">{displaySnapshotLabel(version.tag)}</div>
                <div className="truncate text-[12px] text-muted">
                  {version.message || version.commit}
                </div>
                <div className="text-[11px] text-faint">
                  {version.commit} · {formatGitDateTime(version.committed_at)}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  onClick={() => onRestoreVersion(version.tag)}
                  disabled={busy}
                  className="rounded-md border border-border-subtle px-2 py-1 text-[12px] font-medium text-secondary hover:bg-surface-hover disabled:opacity-50"
                >
                  {restoringVersionTag === version.tag
                    ? t("mySkills.gitVersionRestoring")
                    : t("mySkills.gitVersionRestore")}
                </button>
                {version.tag !== currentSnapshotTag && (
                  <button
                    onClick={() => onDeleteVersion(version.tag)}
                    disabled={busy}
                    title={t("mySkills.gitVersionDelete")}
                    className="inline-flex items-center gap-1 rounded-md border border-border-subtle px-2 py-1 text-[12px] font-medium text-muted hover:border-danger hover:bg-danger-bg hover:text-danger disabled:opacity-50"
                  >
                    {deletingVersionTag === version.tag ? (
                      t("mySkills.gitVersionDeleting")
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
