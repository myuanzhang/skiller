import { RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "../../utils";
import type { GitBackupVersion } from "../../lib/tauri";

interface GitSnapshotPanelProps {
  currentVersionText: string | null;
  versions: GitBackupVersion[];
  loading: boolean;
  gitBusy: boolean;
  restoringVersionTag: string | null;
  onRefresh: () => void;
  onRestoreVersion: (tag: string) => void;
  displaySnapshotLabel: (tag: string) => string;
  formatGitDateTime: (iso: string) => string;
}

export function GitSnapshotPanel({
  currentVersionText,
  versions,
  loading,
  gitBusy,
  restoringVersionTag,
  onRefresh,
  onRestoreVersion,
  displaySnapshotLabel,
  formatGitDateTime,
}: GitSnapshotPanelProps) {
  const { t } = useTranslation();

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
              <button
                onClick={() => onRestoreVersion(version.tag)}
                disabled={!!restoringVersionTag}
                className="shrink-0 rounded-md border border-border-subtle px-2 py-1 text-[12px] font-medium text-secondary hover:bg-surface-hover disabled:opacity-50"
              >
                {restoringVersionTag === version.tag
                  ? t("mySkills.gitVersionRestoring")
                  : t("mySkills.gitVersionRestore")}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
