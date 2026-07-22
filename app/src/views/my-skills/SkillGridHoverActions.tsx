import type { ReactNode } from "react";
import { RefreshCw, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DeleteSkillButton } from "../../components/DeleteSkillButton";
import type { ManagedSkill } from "../../lib/tauri";
import { cn } from "../../utils";

interface SkillGridHoverActionsProps {
  skill: ManagedSkill;
  dragHandle: ReactNode;
  isMultiSelect: boolean;
  checking: boolean;
  updating: boolean;
  canRefresh: boolean;
  refreshLabel: string;
  onCheckUpdate: (skill: ManagedSkill) => void;
  onRefreshSkill: (skill: ManagedSkill) => void;
  onDeleteSkill: (skill: ManagedSkill) => void;
}

export function SkillGridHoverActions({
  skill,
  dragHandle,
  isMultiSelect,
  checking,
  updating,
  canRefresh,
  refreshLabel,
  onCheckUpdate,
  onRefreshSkill,
  onDeleteSkill,
}: SkillGridHoverActionsProps) {
  const { t } = useTranslation();

  return (
    <div className={cn("absolute right-2 top-2 z-10 flex items-center gap-0.5 rounded-lg border border-border-subtle bg-surface px-1 py-0.5 opacity-0 shadow-sm transition-all", !isMultiSelect && "group-hover:opacity-100")}>
      {dragHandle}
      <button
        onClick={(e) => { e.stopPropagation(); onCheckUpdate(skill); }}
        disabled={checking}
        className="rounded p-1 text-muted transition-colors hover:bg-surface-hover hover:text-secondary disabled:opacity-50"
        title={t("mySkills.updateActions.check")}
      >
        <RefreshCw className={cn("h-3.5 w-3.5", checking && "animate-spin")} />
      </button>
      {canRefresh && skill.update_status === "update_available" ? (
        <button
          onClick={(e) => { e.stopPropagation(); onRefreshSkill(skill); }}
          disabled={updating}
          className="rounded p-1 text-accent-light transition-colors hover:bg-accent-bg disabled:opacity-50"
          title={refreshLabel}
        >
          <RotateCcw className={cn("h-3.5 w-3.5", updating && "animate-spin")} />
        </button>
      ) : null}
      <DeleteSkillButton
        skill={skill}
        onConfirm={onDeleteSkill}
        buttonClassName="p-1"
      />
    </div>
  );
}
