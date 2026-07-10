import type { Dispatch, SetStateAction } from "react";
import {
  DownloadCloud,
  FolderSearch,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { StatusBanner } from "../../components/StatusBanner";
import type { DiscoveredGroup, ScanResult } from "../../lib/tauri";
import { cn } from "../../utils";
import { DiscoveredSkillRow } from "./DiscoveredSkillRow";
import { LocalInstallActions } from "./LocalInstallActions";

interface LocalInstallSectionProps {
  localError: string | null;
  scanResult: ScanResult | null;
  scanGroups: DiscoveredGroup[];
  pendingGroups: DiscoveredGroup[];
  scanLoading: boolean;
  importingAll: boolean;
  importingPaths: Set<string>;
  renameEditing: Record<string, string>;
  setRenameEditing: Dispatch<SetStateAction<Record<string, string>>>;
  onLocalFolderInstall: () => void;
  onLocalFileInstall: () => void;
  onBatchImportFolder: () => void;
  onRunScan: () => void;
  onImportAllDiscovered: () => void;
  onImportDiscovered: (sourcePath: string, name: string) => void;
}

export function LocalInstallSection({
  localError,
  scanResult,
  scanGroups,
  pendingGroups,
  scanLoading,
  importingAll,
  importingPaths,
  renameEditing,
  setRenameEditing,
  onLocalFolderInstall,
  onLocalFileInstall,
  onBatchImportFolder,
  onRunScan,
  onImportAllDiscovered,
  onImportDiscovered,
}: LocalInstallSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 pb-8 animate-in fade-in duration-300">
      <LocalInstallActions
        onLocalFolderInstall={onLocalFolderInstall}
        onLocalFileInstall={onLocalFileInstall}
        onBatchImportFolder={onBatchImportFolder}
      />

      {localError ? (
        <StatusBanner
          compact
          title={t("common.requestFailed")}
          description={localError}
          actionLabel={t("common.retry")}
          onAction={onRunScan}
          tone="danger"
        />
      ) : null}

      <section className="app-panel overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle bg-bg-secondary/60 px-4 py-3.5">
          <div>
            <h2 className="text-[13px] font-semibold text-secondary">{t("install.scan.title")}</h2>
            <p className="mt-0.5 text-[13px] text-muted">
              {scanResult
                ? t("install.scan.summary", {
                    tools: scanResult.tools_scanned,
                    skills: scanResult.skills_found,
                  })
                : t("install.scan.initial")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRunScan}
              disabled={scanLoading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-hover px-3 py-2 text-[13px] font-medium text-secondary transition-colors hover:bg-surface-active disabled:opacity-50"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", scanLoading && "animate-spin")} />
              {t("install.scan.rescan")}
            </button>
            <button
              onClick={onImportAllDiscovered}
              disabled={scanLoading || importingAll || pendingGroups.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-accent-border bg-accent-dark px-3 py-2 text-[13px] font-medium text-white transition-colors hover:bg-accent disabled:opacity-50"
            >
              {importingAll ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <DownloadCloud className="h-3.5 w-3.5" />
              )}
              {t("install.scan.importAll")}
            </button>
          </div>
        </div>

        <div className="space-y-4 p-4">
          {scanLoading ? (
            <div className="flex items-center justify-center gap-2.5 py-12 text-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-[13px]">{t("install.scan.scanning")}</span>
            </div>
          ) : scanResult && scanGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface-hover">
                <FolderSearch className="h-5 w-5 text-muted" />
              </div>
              <h3 className="mb-1 text-[13px] font-semibold text-tertiary">
                {t("install.scan.noResults")}
              </h3>
              <p className="text-[13px] text-muted">{t("install.scan.noResultsHint")}</p>
            </div>
          ) : (
            <>
              <div className="app-panel-muted overflow-hidden">
                {scanGroups.map((group) => {
                  const primaryLocation = group.locations[0];
                  const primaryPath = primaryLocation?.found_path;
                  const isImporting = !!primaryPath && importingPaths.has(primaryPath);
                  const isRenaming = group.name in renameEditing;
                  const importName = renameEditing[group.name] ?? group.name;

                  return (
                    <DiscoveredSkillRow
                      key={group.name}
                      group={group}
                      isImporting={isImporting}
                      isRenaming={isRenaming}
                      importName={importName}
                      renameEditing={renameEditing}
                      setRenameEditing={setRenameEditing}
                      onImportDiscovered={onImportDiscovered}
                    />
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
