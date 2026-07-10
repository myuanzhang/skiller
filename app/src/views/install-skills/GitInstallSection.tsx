import { Check, DownloadCloud, Github, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ManagedSkill } from "../../lib/tauri";
import { cn } from "../../utils";

interface GitInstallSectionProps {
  gitUrl: string;
  onGitUrlChange: (url: string) => void;
  gitLoading: boolean;
  gitCancelKey: string | null;
  findInstalledByGitUrl: (url: string) => ManagedSkill | undefined;
  onCancelInstall: (cancelKey: string) => void;
  onGitPreview: () => void;
}

export function GitInstallSection({
  gitUrl,
  onGitUrlChange,
  gitLoading,
  gitCancelKey,
  findInstalledByGitUrl,
  onCancelInstall,
  onGitPreview,
}: GitInstallSectionProps) {
  const { t } = useTranslation();
  const installedSkill = gitUrl.trim() ? findInstalledByGitUrl(gitUrl) : undefined;

  return (
    <div className="animate-in fade-in duration-300">
      <div className="app-panel max-w-2xl overflow-hidden">
        <div className="border-b border-border-subtle px-4 py-3.5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-hover">
              <Github className="h-5 w-5 text-tertiary" />
            </div>
            <div className="min-w-0">
              <h2 className="text-[14px] font-semibold text-primary">{t("install.gitTitle")}</h2>
              <p className="mt-1 max-w-xl text-[13px] leading-5 text-muted">{t("install.gitDesc")}</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 bg-bg-secondary/40 p-4">
          <div>
            <label className="mb-1 block text-[13px] font-medium text-tertiary">
              {t("install.repoUrl")}
            </label>
            <input
              type="text"
              value={gitUrl}
              onChange={(e) => onGitUrlChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !gitLoading && gitUrl.trim()) onGitPreview(); }}
              placeholder={t("install.repoUrlPlaceholder")}
              disabled={gitLoading}
              className="app-input w-full bg-background font-mono"
            />
          </div>
          {installedSkill && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[13px] text-amber-400">
              <Check className="h-3.5 w-3.5 shrink-0" />
              <span>
                {t("install.gitAlreadyInstalled", { name: installedSkill.name })}
              </span>
            </div>
          )}
          <div className="flex gap-2 pt-1">
            {gitLoading ? (
              <button
                onClick={() => gitCancelKey && onCancelInstall(gitCancelKey)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-[13px] font-medium text-red-400 transition-colors hover:bg-red-500/20"
                disabled={!gitCancelKey}
              >
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {t("install.cancel")}
              </button>
            ) : (
              <button
                onClick={onGitPreview}
                disabled={!gitUrl.trim()}
                className={cn(
                  "flex w-full",
                  installedSkill
                    ? "app-button-secondary bg-background"
                    : "app-button-primary"
                )}
              >
                <DownloadCloud className="h-3.5 w-3.5" />
                {installedSkill
                  ? t("install.gitReinstall")
                  : t("install.installClone")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
