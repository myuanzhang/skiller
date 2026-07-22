import type { ReactNode, RefObject } from "react";
import { FolderOpen, Loader2, Square, SquareCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { SyncDots } from "../../components/SyncDots";
import { SkillCardShell } from "../../components/ui/SkillCardShell";
import type { ManagedSkill, SkillUsageStat, ToolInfo } from "../../lib/tauri";
import * as api from "../../lib/tauri";
import { cn } from "../../utils";
import { SkillCardActions } from "./SkillCardActions";
import { SkillGridHoverActions } from "./SkillGridHoverActions";
import { SkillTagEditor } from "./SkillTagEditor";
import { UpdateBadge } from "./UpdateBadge";

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
  usage?: SkillUsageStat;
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
  usage,
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
  const usageTitle = usage
    ? [
        t("mySkills.usage.count", { count: usage.count }),
        usage.last_used_at ? t("mySkills.usage.lastUsed", { time: new Date(usage.last_used_at).toLocaleString() }) : null,
        usage.agents.length > 0 ? usage.agents.map((a) => `${a.agent}: ${a.count}`).join(", ") : null,
      ].filter(Boolean).join(" · ")
    : "";

  const handleSourceClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.openSkillSource(skill.id);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(t("mySkills.sourceOpenFailed", { message }));
    }
  };

  const handleLocalCopyClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.openSkillLocalCopy(skill.id);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(t("mySkills.sourceOpenFailed", { message }));
    }
  };

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
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-panel bg-surface/70 backdrop-blur-[1px]">
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
          className={cn(
            "flex-1 truncate text-[14px] font-semibold group-hover:text-accent-light",
            isMissingLocalSource
              ? "text-muted line-through decoration-border-subtle"
              : "text-primary"
          )}
          title={displayName}
        >
          {displayName}
        </h3>
      </div>

      <div className="px-3.5 pb-3">
        <p className={cn(
          "min-h-[36px] text-[13px] leading-[18px] line-clamp-2",
          isMissingLocalSource ? "text-faint line-through decoration-border-subtle/50" : "text-muted"
        )}>
          {skill.description || "—"}
        </p>
        {(badge || (skill.update_status === "update_available" && canRefresh)) && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <UpdateBadge
              skill={skill}
              badge={badge}
              canRefresh={canRefresh}
              updating={updating}
              refreshLabel={refreshLabel}
              onRefreshSkill={onRefreshSkill}
            />
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
          {skill.source_type === "local" ? (
            <button
              onClick={handleLocalCopyClick}
              className="inline-flex shrink-0 items-center justify-center rounded-control p-0.5 text-muted transition-colors hover:bg-surface-hover hover:text-secondary"
              title={t("mySkills.sourceOpenDir")}
            >
              <FolderOpen className="h-3 w-3" />
            </button>
          ) : (
            <>
              <button
                onClick={handleLocalCopyClick}
                className="inline-flex shrink-0 items-center justify-center rounded-control p-0.5 text-muted transition-colors hover:bg-surface-hover hover:text-secondary"
                title={t("mySkills.sourceOpenDir")}
              >
                <FolderOpen className="h-3 w-3" />
              </button>
              <span className="text-faint">|</span>
              <button
                onClick={handleSourceClick}
                className="inline-flex shrink-0 items-center gap-1 text-[13px] text-muted transition-colors hover:text-secondary"
                title={skill.source_ref || skill.source_ref_resolved ? t("mySkills.sourceOpenUrl") : undefined}
              >
                {sourceIcon}
                {sourceLabel}
              </button>
            </>
          )}
          {active && (
            <>
              <span className="text-faint">·</span>
              <span className="truncate text-[13px] font-medium text-amber-600 dark:text-amber-400/80">
                {viewedPresetName}
              </span>
            </>
          )}
          {usage && usage.count > 0 && (
            <>
              <span className="text-faint">·</span>
              <span
                className="shrink-0 text-[13px] font-medium text-accent-light"
                title={usageTitle}
              >
                {t("mySkills.usage.short", { count: usage.count })}
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
