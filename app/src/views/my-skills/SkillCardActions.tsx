import { RefreshCw, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DeleteSkillButton } from "../../components/DeleteSkillButton";
import type { ManagedSkill } from "../../lib/tauri";
import { cn } from "../../utils";

interface SkillCardActionsProps {
  skill: ManagedSkill;
  variant: "grid" | "list";
  enabledInPreset: boolean;
  isMissingLocalSource: boolean;
  isMultiSelect: boolean;
  hasViewedPreset: boolean;
  checking: boolean;
  updating: boolean;
  canRefresh: boolean;
  refreshLabel: string;
  onRelinkSource: (skill: ManagedSkill) => void;
  onDetachSource: (skill: ManagedSkill) => void;
  onTogglePreset: (skill: ManagedSkill) => void;
  onCheckUpdate: (skill: ManagedSkill) => void;
  onRefreshSkill: (skill: ManagedSkill) => void;
  onDeleteSkill: (skill: ManagedSkill) => void;
}

export function SkillCardActions({
  skill,
  variant,
  enabledInPreset,
  isMissingLocalSource,
  isMultiSelect,
  hasViewedPreset,
  checking,
  updating,
  canRefresh,
  refreshLabel,
  onRelinkSource,
  onDetachSource,
  onTogglePreset,
  onCheckUpdate,
  onRefreshSkill,
  onDeleteSkill,
}: SkillCardActionsProps) {
  const { t } = useTranslation();
  const isGrid = variant === "grid";

  return (
    <div
      className={
        isGrid
          ? "flex items-center gap-2 shrink-0"
          : cn("flex shrink-0 items-center gap-1 opacity-0 transition-opacity", !isMultiSelect && "group-hover:opacity-100")
      }
    >
      {isMissingLocalSource && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); onRelinkSource(skill); }}
            disabled={updating}
            className={
              isGrid
                ? "rounded-full border border-border-subtle px-2 py-0.5 text-[12px] font-medium text-secondary transition-colors hover:bg-surface-hover disabled:opacity-50"
                : "rounded px-2 py-0.5 text-[13px] font-medium text-secondary transition-colors hover:bg-surface-hover disabled:opacity-50"
            }
          >
            {t("mySkills.updateActions.relink")}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDetachSource(skill); }}
            disabled={updating}
            className={
              isGrid
                ? "rounded-full border border-border-subtle px-2 py-0.5 text-[12px] font-medium text-muted transition-colors hover:bg-surface-hover hover:text-secondary disabled:opacity-50"
                : "rounded px-2 py-0.5 text-[13px] font-medium text-muted transition-colors hover:bg-surface-hover hover:text-secondary disabled:opacity-50"
            }
          >
            {t("mySkills.updateActions.detachSource")}
          </button>
        </>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); onTogglePreset(skill); }}
        disabled={!hasViewedPreset}
        className={cn(
          isGrid
            ? "rounded px-2 py-1 text-[13px] font-medium transition-colors outline-none"
            : "rounded px-2 py-0.5 text-[13px] font-medium transition-colors outline-none",
          enabledInPreset
            ? "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
            : "text-muted hover:bg-surface-hover hover:text-secondary"
        )}
      >
        {enabledInPreset ? t("mySkills.enabledButton") : t("mySkills.enable")}
      </button>
      {!isGrid ? (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); onCheckUpdate(skill); }}
            disabled={checking}
            className="rounded p-0.5 text-muted transition-colors hover:bg-surface-hover hover:text-secondary disabled:opacity-50"
            title={t("mySkills.updateActions.check")}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", checking && "animate-spin")} />
          </button>
          {canRefresh && skill.update_status === "update_available" ? (
            <button
              onClick={(e) => { e.stopPropagation(); onRefreshSkill(skill); }}
              disabled={updating}
              className="rounded p-0.5 text-accent-light transition-colors hover:bg-accent-bg disabled:opacity-50"
              title={refreshLabel}
            >
              <RotateCcw className={cn("h-3.5 w-3.5", updating && "animate-spin")} />
            </button>
          ) : null}
          <DeleteSkillButton
            skill={skill}
            onConfirm={onDeleteSkill}
            buttonClassName="p-0.5"
          />
        </>
      ) : null}
    </div>
  );
}
