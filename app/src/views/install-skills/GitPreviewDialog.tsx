import type { Dispatch, SetStateAction } from "react";
import { DownloadCloud, Loader2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "../../utils";
import type { GitSelection } from "./types";

interface GitPreviewDialogProps {
  gitSelections: GitSelection[];
  setGitSelections: Dispatch<SetStateAction<GitSelection[]>>;
  gitConfirmLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function GitPreviewDialog({
  gitSelections,
  setGitSelections,
  gitConfirmLoading,
  onClose,
  onConfirm,
}: GitPreviewDialogProps) {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-panel border border-border bg-surface p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[14px] font-semibold text-primary">{t("install.gitPreview.title")}</h2>
          <button
            onClick={onClose}
            disabled={gitConfirmLoading}
            className="rounded p-1 text-muted transition-colors hover:text-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mb-3 text-[13px] text-muted">{t("install.gitPreview.description")}</p>

        <div className="mb-2 flex gap-2">
          <button
            type="button"
            onClick={() => setGitSelections((prev) => prev.map((s) => ({ ...s, selected: true })))}
            disabled={gitConfirmLoading}
            className="text-[13px] text-accent-light hover:underline"
          >
            {t("install.gitPreview.selectAll")}
          </button>
          <span className="text-faint">·</span>
          <button
            type="button"
            onClick={() => setGitSelections((prev) => prev.map((s) => ({ ...s, selected: false })))}
            disabled={gitConfirmLoading}
            className="text-[13px] text-muted hover:underline"
          >
            {t("install.gitPreview.deselectAll")}
          </button>
        </div>

        {gitSelections.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-muted">{t("install.gitPreview.empty")}</p>
        ) : (
          <div className="max-h-64 space-y-2 overflow-y-auto scrollbar-hide pr-1">
            {gitSelections.map((item, idx) => (
              <div
                key={item.rel_path}
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors",
                  item.selected
                    ? "border-accent-border bg-accent/10"
                    : "border-border-subtle bg-background opacity-50"
                )}
              >
                <input
                  type="checkbox"
                  checked={item.selected}
                  disabled={gitConfirmLoading}
                  onChange={(e) =>
                    setGitSelections((prev) =>
                      prev.map((s, i) => i === idx ? { ...s, selected: e.target.checked } : s)
                    )
                  }
                  className="h-4 w-4 shrink-0 accent-accent"
                />
                <div className="min-w-0 flex-1">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) =>
                      setGitSelections((prev) =>
                        prev.map((s, i) => i === idx ? { ...s, name: e.target.value } : s)
                      )
                    }
                    disabled={!item.selected || gitConfirmLoading}
                    placeholder={t("install.gitPreview.namePlaceholder")}
                    className="app-input w-full bg-background py-1 text-[13px]"
                  />
                  {item.description ? (
                    <p className="mt-1 truncate text-[12px] text-muted">{item.description}</p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={gitConfirmLoading}
            className="px-3 py-1.5 text-[13px] font-medium text-muted hover:text-secondary transition-colors"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={gitConfirmLoading || gitSelections.every((s) => !s.selected)}
            className="app-button-primary"
          >
            {gitConfirmLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <DownloadCloud className="h-3.5 w-3.5" />
            )}
            {t("install.gitPreview.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
