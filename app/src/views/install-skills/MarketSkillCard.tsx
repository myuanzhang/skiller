import { Check, DownloadCloud, ExternalLink, Loader2, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { SkillsShSkill } from "../../lib/tauri";
import { cn } from "../../utils";
import type { MarketTab } from "./types";

interface MarketSkillCardProps {
  skill: SkillsShSkill;
  marketTab: MarketTab;
  marketSourceFilter: string;
  isInstalled: boolean;
  installing: string | null;
  onMarketSourceFilterChange: (source: string) => void;
  onOpenSkillWeb: (skill: SkillsShSkill) => void;
  onCancelInstall: (cancelKey: string) => void;
  onInstallSkillssh: (skill: SkillsShSkill) => void;
}

function formatInstallCount(installs: number) {
  if (installs >= 1_000_000) return `${(installs / 1_000_000).toFixed(1)}M`;
  if (installs >= 1_000) return `${(installs / 1_000).toFixed(1)}K`;
  return installs;
}

export function MarketSkillCard({
  skill,
  marketTab,
  marketSourceFilter,
  isInstalled,
  installing,
  onMarketSourceFilterChange,
  onOpenSkillWeb,
  onCancelInstall,
  onInstallSkillssh,
}: MarketSkillCardProps) {
  const { t } = useTranslation();
  const displayName = skill.name || skill.skill_id;
  const showSkillId = skill.skill_id.trim() !== displayName.trim();
  const owner = skill.source.split("/")[0];
  const avatarUrl = `https://github.com/${owner}.png?size=32`;

  return (
    <div className="app-panel group flex min-h-[132px] flex-col justify-between gap-3 p-3 transition-colors hover:border-border hover:bg-surface-hover">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <img
            src={avatarUrl}
            alt={owner}
            className="mt-0.5 h-8 w-8 shrink-0 rounded-lg border border-border-subtle"
            loading="lazy"
          />
          <div className="min-w-0">
            <h3 className="truncate text-[13px] font-semibold text-secondary group-hover:text-primary">
              {displayName}
            </h3>
            {showSkillId ? (
              <p className="mt-0.5 truncate font-mono text-[12px] leading-4 text-muted">
                {skill.skill_id}
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => onMarketSourceFilterChange(skill.source)}
              disabled={marketSourceFilter === skill.source}
              title={t("install.onlyThisContributor")}
              className={cn(
                "mt-2 inline-flex max-w-full rounded-control border border-accent-border bg-accent-bg px-1.5 py-0.5 text-[12px] leading-4 font-medium text-accent-light transition-colors",
                marketSourceFilter === skill.source
                  ? "cursor-default opacity-90"
                  : "hover:bg-accent/15"
              )}
            >
              <span className="truncate">@{skill.source}</span>
            </button>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => onOpenSkillWeb(skill)}
            className="rounded-control p-1 text-muted transition-colors hover:bg-surface-hover hover:text-secondary"
            title={t("install.viewOnWeb")}
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
          {isInstalled ? (
            <span
              className="rounded-control border border-emerald-500/20 bg-emerald-500/10 p-1 text-emerald-400"
              title={t("install.installed")}
            >
              <Check className="h-3.5 w-3.5" />
            </span>
          ) : installing === skill.id ? (
            <button
              onClick={() => onCancelInstall(`${skill.source}/${skill.skill_id}`)}
              className="inline-flex items-center gap-1 rounded-control border border-red-500/30 bg-red-500/10 px-1.5 py-1 text-red-400 transition-colors hover:bg-red-500/20"
              title={t("install.cancel")}
              aria-label={t("install.cancel")}
            >
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span className="text-[11px] leading-none font-medium">
                {t("install.cancel")}
              </span>
            </button>
          ) : (
            <button
              onClick={() => onInstallSkillssh(skill)}
              disabled={installing !== null}
              className="rounded-control border border-accent-border bg-accent-dark p-1 text-white transition-colors hover:bg-accent disabled:opacity-50"
              title={t("install.oneClickInstall")}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 border-t border-border-subtle pt-2">
        {marketTab === "alltime" && skill.installs > 0 && (
          <span className="inline-flex items-center gap-1 rounded-control border border-border-subtle bg-background px-1.5 py-0.5 text-[13px] leading-4 text-muted">
            <DownloadCloud className="h-3 w-3" />
            {formatInstallCount(skill.installs)}
          </span>
        )}
        {isInstalled ? (
          <span className="inline-flex items-center gap-1 rounded-control border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[13px] leading-4 font-medium text-emerald-400">
            <Check className="h-3 w-3" />
            {t("install.installed")}
          </span>
        ) : null}
      </div>
    </div>
  );
}
