import { FolderInput, FolderUp, UploadCloud } from "lucide-react";
import { useTranslation } from "react-i18next";

interface LocalInstallActionsProps {
  onLocalFolderInstall: () => void;
  onLocalFileInstall: () => void;
  onBatchImportFolder: () => void;
}

export function LocalInstallActions({
  onLocalFolderInstall,
  onLocalFileInstall,
  onBatchImportFolder,
}: LocalInstallActionsProps) {
  const { t } = useTranslation();

  return (
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
  );
}
