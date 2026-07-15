import { Loader2, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ManagedSkill } from "../../lib/tauri";
import { cn } from "../../utils";

interface StatusBadge {
  label: string;
  className: string;
}

interface UpdateBadgeProps {
  skill: ManagedSkill;
  badge: StatusBadge | null;
  /** Whether this skill's source supports pulling an update. */
  canRefresh: boolean;
  /** Update in progress — shows a spinner and disables the button. */
  updating: boolean;
  /** Action label (e.g. "Update" / "Reimport"), used when actionable. */
  refreshLabel: string;
  onRefreshSkill: (skill: ManagedSkill) => void;
}

/**
 * Status indicator for a skill's update state. When an update is available AND
 * the source can be pulled, it renders as an actual button that performs the
 * update on click — matching the affordance users expect from the pill. Other
 * states (source missing, check error, or update-available-but-not-refreshable)
 * render as a passive, non-clickable pill so nothing that looks like a status
 * is mistaken for an action.
 */
export function UpdateBadge({
  skill,
  badge,
  canRefresh,
  updating,
  refreshLabel,
  onRefreshSkill,
}: UpdateBadgeProps) {
  const { t } = useTranslation();

  if (skill.update_status === "update_available" && canRefresh) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRefreshSkill(skill);
        }}
        disabled={updating}
        title={refreshLabel}
        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/12 px-2 py-0.5 text-[12px] font-medium text-amber-600 transition-colors hover:bg-amber-500/20 disabled:opacity-60 dark:text-amber-400"
      >
        {updating ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <RotateCcw className="h-3 w-3" />
        )}
        {refreshLabel}
      </button>
    );
  }

  if (!badge) return null;

  // Passive status: `update_available` without a refreshable source falls back
  // to a noun-form label so it doesn't read as a clickable command.
  const label =
    skill.update_status === "update_available"
      ? t("mySkills.updateStatus.available")
      : badge.label;

  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[12px] font-medium", badge.className)}>
      {label}
    </span>
  );
}
