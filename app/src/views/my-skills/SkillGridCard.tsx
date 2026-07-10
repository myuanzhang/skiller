import type { ReactNode, RefObject } from "react";
import { Loader2, Square, SquareCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SyncDots } from "../../components/SyncDots";
import { SkillCardShell } from "../../components/ui/SkillCardShell";
import type { ManagedSkill, ToolInfo } from "../../lib/tauri";
import { cn } from "../../utils";
import { SkillCardActions } from "./SkillCardActions";
import { SkillGridHoverActions } from "./SkillGridHoverActions";
import { SkillTagEditor } from "./SkillTagEditor";

interface StatusBadge {
  label: string;
  className: string;
}

interface SkillGridCardProps {
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
  tagEditing: boolean;
  tagInput: string;
  tagInputRef: RefObject<HTMLInputElement | null>;
  tagOptions: string[];
  viewedPresetName: string;
  hasViewedPreset: boolean;
  sourceIcon: ReactNode;
  sourceLabel: string;
  tools: ToolInfo[];
  pendingToolKey: string | null;
  onClick: () => void;
  onTagInputChange: (value: string) => void;
  onAddTag: (skill: ManagedSkill, value?: string) => void;
  onRemoveTag: (skill: ManagedSkill, tag: string) => void;
  onStartTagEdit: (skillId: string) => void;
  onCancelTagEdit: () => void;
  onRelinkSource: (skill: ManagedSkill) => void;
  onDetachSource: (skill: ManagedSkill) => void;
  onTogglePreset: (skill: ManagedSkill) => void;
  onCheckUpdate: (skill: ManagedSkill) => void;
  onRefreshSkill: (skill: ManagedSkill) => void;
  onDeleteSkill: (skill: ManagedSkill) => void;
  onToggleSkillTarget: (tool: string, enabled: boolean) => void;
}

export function SkillGridCard({
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
  tagEditing,
  tagInput,
  tagInputRef,
  tagOptions,
  viewedPresetName,
  hasViewedPreset,
  sourceIcon,
  sourceLabel,
  tools,
  pendingToolKey,
  onClick,
  onTagInputChange,
  onAddTag,
  onRemoveTag,
  onStartTagEdit,
  onCancelTagEdit,
  onRelinkSource,
  onDetachSource,
  onTogglePreset,
  onCheckUpdate,
  onRefreshSkill,
  onDeleteSkill,
  onToggleSkillTarget,
}: SkillGridCardProps) {
  const { t } = useTranslation();

  return (
    <SkillCardShell
      viewMode="grid"
      active={active}
      selected={selected}
      className={tagEditing ? "overflow-visible" : undefined}
      onClick={onClick}
    >
      <SkillGridHoverActions
        skill={skill}
        dragHandle={dragHandle}
        isMultiSelect={isMultiSelect}
        checking={checking}
        updating={updating}
        canRefresh={canRefresh}
        refreshLabel={refreshLabel}
        onCheckUpdate={onCheckUpdate}
        onRefreshSkill={onRefreshSkill}
        onDeleteSkill={onDeleteSkill}
      />
      {deleting && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-xl bg-surface/70 backdrop-blur-[1px]">
          <Loader2 className="h-5 w-5 animate-spin text-muted" />
        </div>
      )}

      <div className="flex items-center gap-2.5 px-3.5 pr-20 pt-3 pb-1.5">
        {isMultiSelect && (
          selected
            ? <SquareCheck className="h-3.5 w-3.5 shrink-0 text-accent" />
            : <Square className="h-3.5 w-3.5 shrink-0 text-faint" />
        )}
        <h3
          className="flex-1 truncate text-[14px] font-semibold text-primary group-hover:text-accent-light"
          title={displayName}
        >
          {displayName}
        </h3>
      </div>

      <div className="px-3.5 pb-3">
        <p className="text-[13px] leading-[18px] text-muted truncate">
          {skill.description || "—"}
        </p>
        {badge && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[13px] font-medium",
                badge.className
              )}
            >
              {badge.label}
            </span>
            {isMissingLocalSource && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); onRelinkSource(skill); }}
                  disabled={updating}
                  className="rounded-full border border-border-subtle px-2 py-0.5 text-[12px] font-medium text-secondary transition-colors hover:bg-surface-hover disabled:opacity-50"
                >
                  {t("mySkills.updateActions.relink")}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDetachSource(skill); }}
                  disabled={updating}
                  className="rounded-full border border-border-subtle px-2 py-0.5 text-[12px] font-medium text-muted transition-colors hover:bg-surface-hover hover:text-secondary disabled:opacity-50"
                >
                  {t("mySkills.updateActions.detachSource")}
                </button>
              </>
            )}
          </div>
        )}
        <SkillTagEditor
          skill={skill}
          allTags={allTags}
          editing={tagEditing}
          tagInput={tagInput}
          inputRef={tagInputRef}
          tagOptions={tagOptions}
          onTagInputChange={onTagInputChange}
          onAddTag={onAddTag}
          onRemoveTag={onRemoveTag}
          onStartEdit={onStartTagEdit}
          onCancelEdit={onCancelTagEdit}
        />
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-border-subtle px-3.5 py-2.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="inline-flex shrink-0 items-center gap-1 text-[13px] text-muted">
            {sourceIcon}
            {sourceLabel}
          </span>
          {active && (
            <>
              <span className="text-faint">·</span>
              <span className="truncate text-[13px] font-medium text-amber-600 dark:text-amber-400/80">
                {viewedPresetName}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <SyncDots
            skill={skill}
            tools={tools}
            limit={6}
            onToggle={isMultiSelect ? undefined : onToggleSkillTarget}
            pendingKey={pendingToolKey}
          />
          <SkillCardActions
            skill={skill}
            variant="grid"
            enabledInPreset={active}
            isMissingLocalSource={false}
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
        </div>
      </div>
    </SkillCardShell>
  );
}
