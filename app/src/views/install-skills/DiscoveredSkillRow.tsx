import type { Dispatch, SetStateAction } from "react";
import { Calendar, Check, DownloadCloud, Loader2, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { DiscoveredGroup } from "../../lib/tauri";

interface DiscoveredSkillRowProps {
  group: DiscoveredGroup;
  isImporting: boolean;
  isRenaming: boolean;
  importName: string;
  renameEditing: Record<string, string>;
  setRenameEditing: Dispatch<SetStateAction<Record<string, string>>>;
  onImportDiscovered: (sourcePath: string, name: string) => void;
}

export function DiscoveredSkillRow({
  group,
  isImporting,
  isRenaming,
  importName,
  renameEditing,
  setRenameEditing,
  onImportDiscovered,
}: DiscoveredSkillRowProps) {
  const { t } = useTranslation();
  const [primaryLocation, ...otherLocations] = group.locations;
  const primaryPath = primaryLocation?.found_path;
  const foundDate = new Date(group.found_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <article className="border-b border-border-subtle last:border-b-0">
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
}
