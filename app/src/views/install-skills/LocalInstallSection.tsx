import type { Dispatch, SetStateAction } from "react";
import {
  Calendar,
  Check,
  DownloadCloud,
  FolderInput,
  FolderSearch,
  FolderUp,
  Loader2,
  Pencil,
  RefreshCw,
  UploadCloud,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { StatusBanner } from "../../components/StatusBanner";
import type { DiscoveredGroup, ScanResult } from "../../lib/tauri";
import { cn } from "../../utils";

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
      <section className="app-panel overflow-hidden">
        <div className="border-b border-border-subtle px-4 py-3.5">
          <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted">
            <span className="inline-flex items-center gap-1.5 rounded-control border border-accent-border bg-accent-bg px-2 py-1 font-medium text-accent-light">
              <FolderUp className="h-3.5 w-3.5" />
              {t("install.local.title")}
            </span>
          </div>
          <h2 className="mt-2 text-[14px] font-semibold text-secondary">
            {t("install.local.title")}
          </h2>
          <p className="mt-1 max-w-2xl text-[13px] leading-5 text-muted">
            {t("install.local.description")}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2.5 p-3.5">
          <button
            type="button"
            onClick={onLocalFolderInstall}
            className="app-button-primary h-auto justify-start px-3 py-3"
          >
            <FolderUp className="h-4 w-4" />
            {t("install.local.selectFolder")}
          </button>
          <button
            type="button"
            onClick={onLocalFileInstall}
            className="app-button-secondary h-auto justify-start bg-background px-3 py-3"
          >
            <UploadCloud className="h-4 w-4" />
            {t("install.local.selectArchive")}
          </button>
          <button
            type="button"
            onClick={onBatchImportFolder}
            className="app-button-secondary h-auto justify-start bg-background px-3 py-3"
          >
            <FolderInput className="h-4 w-4" />
            {t("install.local.batchImport")}
          </button>
        </div>
      </section>

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
                  const [primaryLocation, ...otherLocations] = group.locations;
                  const primaryPath = primaryLocation?.found_path;
                  const isImporting = !!primaryPath && importingPaths.has(primaryPath);
                  const isRenaming = group.name in renameEditing;
                  const importName = renameEditing[group.name] ?? group.name;
                  const foundDate = new Date(group.found_at).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  });

                  return (
                    <article key={group.name} className="border-b border-border-subtle last:border-b-0">
                      <div className="flex items-start justify-between gap-3 px-3 py-2">
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex min-w-0 items-center gap-2">
                            {isRenaming ? (
                              <input
                                autoFocus
                                value={renameEditing[group.name]}
                                onChange={(e) =>
                                  setRenameEditing((prev) => ({ ...prev, [group.name]: e.target.value }))
                                }
                                onBlur={() => {
                                  if (!renameEditing[group.name]?.trim()) {
                                    setRenameEditing((prev) => {
                                      const next = { ...prev };
                                      delete next[group.name];
                                      return next;
                                    });
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Escape") {
                                    setRenameEditing((prev) => {
                                      const next = { ...prev };
                                      delete next[group.name];
                                      return next;
                                    });
                                  } else if (e.key === "Enter") {
                                    (e.target as HTMLInputElement).blur();
                                  }
                                }}
                                className="min-w-0 max-w-[220px] rounded border border-accent-border bg-surface px-1.5 py-0.5 text-[13px] font-semibold text-secondary outline-none focus:ring-1 focus:ring-accent"
                              />
                            ) : (
                              <h3 className="truncate text-[13px] font-semibold text-secondary">
                                {group.name}
                              </h3>
                            )}
                            {!group.imported && !isRenaming ? (
                              <button
                                onClick={() =>
                                  setRenameEditing((prev) => ({ ...prev, [group.name]: group.name }))
                                }
                                className="shrink-0 rounded p-0.5 text-muted transition-colors hover:bg-surface-hover hover:text-secondary"
                                title={t("install.scan.rename")}
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                            ) : null}
                            {group.imported ? (
                              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[13px] font-semibold text-emerald-400">
                                <Check className="h-3 w-3" />
                                {t("install.scan.imported")}
                              </span>
                            ) : null}
                            <span className="shrink-0 rounded-full border border-border-subtle bg-surface px-2 py-0.5 text-[13px] text-muted">
                              {t("install.scan.locations", { count: group.locations.length })}
                            </span>
                            <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-muted">
                              <Calendar className="h-3 w-3" />
                              {foundDate}
                            </span>
                          </div>

                          {primaryLocation ? (
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="inline-flex shrink-0 rounded-control border border-border-subtle bg-surface px-1.5 py-px text-[13px] font-medium text-tertiary">
                                {primaryLocation.tool}
                              </span>
                              <code className="block min-w-0 truncate text-[13px] text-tertiary">
                                {primaryLocation.found_path}
                              </code>
                            </div>
                          ) : null}
                        </div>

                        <div className="flex shrink-0 items-start justify-end">
                          {group.imported ? null : (
                            <button
                              onClick={() => primaryPath && onImportDiscovered(primaryPath, importName)}
                              disabled={!primaryPath || isImporting}
                              className="inline-flex items-center justify-center gap-1.5 rounded-control border border-accent-border bg-accent-dark px-2.5 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-accent disabled:opacity-50"
                            >
                              {isImporting ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <DownloadCloud className="h-3 w-3" />
                              )}
                              {t("install.scan.importOne")}
                            </button>
                          )}
                        </div>
                      </div>

                      {otherLocations.length > 0 ? (
                        <div className="border-t border-border-subtle bg-surface/40 px-3 py-1.5">
                          <div className="space-y-1">
                            {otherLocations.map((location) => (
                              <div key={location.id} className="flex min-w-0 items-center gap-2">
                                <span className="inline-flex shrink-0 rounded-control border border-border-subtle bg-surface px-1.5 py-px text-[13px] font-medium text-tertiary">
                                  {location.tool}
                                </span>
                                <code className="block min-w-0 truncate text-[13px] text-muted">
                                  {location.found_path}
                                </code>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </article>
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
