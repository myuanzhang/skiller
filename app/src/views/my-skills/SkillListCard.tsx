import type { ReactNode } from "react";
import { Loader2, Square, SquareCheck } from "lucide-react";
import { SyncDots } from "../../components/SyncDots";
import { SkillCardShell } from "../../components/ui/SkillCardShell";
import type { ManagedSkill, ToolInfo } from "../../lib/tauri";
import { getTagColor } from "../../lib/skillTags";
import { cn } from "../../utils";
import { SkillCardActions } from "./SkillCardActions";

interface StatusBadge {
  label: string;
  className: string;
}

interface SkillListCardProps {
  skill: ManagedSkill;
  displayName: string;
  active: boolean;
  selected: boolean;
  isMultiSelect: boolean;
  dragHandle: ReactNode;
  deleting: boolean;
  badge: StatusBadge | null;
  isMissingLocalSource: boolean;
  updating: boolean;
  checking: boolean;
  canRefresh: boolean;
  refreshLabel: string;
  allTags: string[];
  viewedPresetName: string;
  hasViewedPreset: boolean;
  sourceIcon: ReactNode;
  sourceLabel: string;
  tools: ToolInfo[];
  pendingToolKey: string | null;
  onClick: () => void;
  onRelinkSource: (skill: ManagedSkill) => void;
  onDetachSource: (skill: ManagedSkill) => void;
  onTogglePreset: (skill: ManagedSkill) => void;
  onCheckUpdate: (skill: ManagedSkill) => void;
  onRefreshSkill: (skill: ManagedSkill) => void;
  onDeleteSkill: (skill: ManagedSkill) => void;
  onToggleSkillTarget: (tool: string, enabled: boolean) => void;
}

export function SkillListCard({
  skill,
  displayName,
  active,
  selected,
  isMultiSelect,
  dragHandle,
  deleting,
  badge,
  isMissingLocalSource,
  updating,
  checking,
  canRefresh,
  refreshLabel,
  allTags,
  viewedPresetName,
  hasViewedPreset,
  sourceIcon,
  sourceLabel,
  tools,
  pendingToolKey,
  onClick,
  onRelinkSource,
  onDetachSource,
  onTogglePreset,
  onCheckUpdate,
  onRefreshSkill,
  onDeleteSkill,
  onToggleSkillTarget,
}: SkillListCardProps) {
  return (
    <SkillCardShell
      viewMode="list"
      active={active}
      selected={selected}
      onClick={onClick}
    >
      {deleting && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-xl bg-surface/70 backdrop-blur-[1px]">
          <Loader2 className="h-5 w-5 animate-spin text-muted" />
        </div>
      )}
      {dragHandle}
      {isMultiSelect && (
        selected
          ? <SquareCheck className="h-3.5 w-3.5 shrink-0 text-accent" />
          : <Square className="h-3.5 w-3.5 shrink-0 text-faint" />
      )}

      <h3
        className="w-[180px] shrink-0 truncate text-[14px] font-semibold text-secondary group-hover:text-primary"
        title={displayName}
      >
        {displayName}
      </h3>

      <p className="min-w-0 flex-1 truncate text-[13px] text-muted">
        {skill.description || "—"}
      </p>

      <div className="flex shrink-0 items-center gap-1.5">
        {skill.tags.map((tag) => (
          <span
            key={tag}
            className={cn(
              "inline-flex items-center rounded-full px-1.5 py-0.5 text-[11px] font-medium",
              getTagColor(tag, allTags)
            )}
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="flex shrink-0 items-center gap-2.5">
        {badge && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[12px] font-medium",
              badge.className
            )}
          >
            {badge.label}
          </span>
        )}
        <SyncDots
          skill={skill}
          tools={tools}
          limit={6}
          size="sm"
          onToggle={isMultiSelect ? undefined : onToggleSkillTarget}
          pendingKey={pendingToolKey}
        />
        <span className="inline-flex items-center gap-1 text-[13px] text-muted">
          {sourceIcon}
          {sourceLabel}
        </span>
        {active && (
          <span className="text-[13px] font-medium text-amber-600 dark:text-amber-400/80">
            {viewedPresetName}
          </span>
        )}
      </div>

      <SkillCardActions
        skill={skill}
        variant="list"
        enabledInPreset={active}
        isMissingLocalSource={isMissingLocalSource}
        isMultiSelect={isMultiSelect}
        hasViewedPreset={hasViewedPreset}
        checking={checking}
        updating={updating}
        canRefresh={canRefresh}
        refreshLabel={refreshLabel}
        onRelinkSource={onRelinkSource}
        onDetachSource={onDetachSource}
        onTogglePreset={onTogglePreset}
        onCheckUpdate={onCheckUpdate}
        onRefreshSkill={onRefreshSkill}
        onDeleteSkill={onDeleteSkill}
      />
    </SkillCardShell>
  );
}
