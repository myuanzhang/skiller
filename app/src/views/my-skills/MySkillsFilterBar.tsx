import { CircleSlash, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "../../utils";
import type { ManagedSkill } from "../../lib/tauri";
import { getTagActiveColor, getTagColor, UNTAGGED_FILTER } from "../../lib/skillTags";

type SourceFilter = "local" | "git" | "skillssh";

interface MySkillsFilterBarProps {
  skills: ManagedSkill[];
  sourceFilters: Set<string>;
  tagFilters: Set<string>;
  allTags: string[];
  updatesOnly: boolean;
  updateCount: number;
  onUpdatesOnlyToggle: () => void;
  onSourceFilterToggle: (source: SourceFilter) => void;
  onTagFilterToggle: (tag: string) => void;
  onUntaggedFilterToggle: () => void;
  onTagContextMenu: (tag: string, event: React.MouseEvent<HTMLButtonElement>) => void;
}

export function MySkillsFilterBar({
  skills,
  sourceFilters,
  tagFilters,
  allTags,
  updatesOnly,
  updateCount,
  onUpdatesOnlyToggle,
  onSourceFilterToggle,
  onTagFilterToggle,
  onUntaggedFilterToggle,
  onTagContextMenu,
}: MySkillsFilterBarProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center gap-1.5 px-1 -mt-1">
      {(updatesOnly || updateCount > 0) && (
        <>
          <button
            onClick={onUpdatesOnlyToggle}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-medium transition-colors",
              updatesOnly
                ? "bg-accent text-white dark:bg-accent dark:text-white"
                : "border border-border-subtle bg-surface-hover text-muted hover:text-secondary hover:border-border"
            )}
            title={t("mySkills.updatesOnlyHint")}
          >
            <RefreshCw className="h-3 w-3" />
            {t("mySkills.updatesOnly")}
            <span
              className={cn(
                "tabular-nums",
                updatesOnly ? "text-white/80" : "text-faint"
              )}
            >
              {updateCount}
            </span>
          </button>
          <span className="mx-0.5 h-3 w-px bg-border-subtle" />
        </>
      )}
      {(["local", "git", "skillssh"] as const).map((src) => (
        <button
          key={src}
          onClick={() => onSourceFilterToggle(src)}
          className={cn(
            "rounded-full px-2.5 py-0.5 text-[12px] font-medium transition-colors",
            sourceFilters.has(src)
              ? "bg-accent text-white dark:bg-accent dark:text-white"
              : "border border-border-subtle bg-surface-hover text-muted hover:text-secondary hover:border-border"
          )}
        >
          {t(`mySkills.sourceFilter.${src}`)}
        </button>
      ))}
      {allTags.length > 0 && (
        <>
          <span className="mx-0.5 h-3 w-px bg-border-subtle" />
          {skills.some((skill) => skill.tags.length === 0) && (() => {
            const isActive = tagFilters.has(UNTAGGED_FILTER);
            return (
              <button
                onClick={onUntaggedFilterToggle}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-medium transition-colors",
                  isActive
                    ? "bg-accent text-white dark:bg-accent dark:text-white"
                    : "border border-dashed border-border text-muted hover:text-secondary"
                )}
                title={t("mySkills.tags.untagged")}
              >
                <CircleSlash className="h-3 w-3" />
                {t("mySkills.tags.untagged")}
              </button>
            );
          })()}
          {allTags.map((tag) => {
            const isActive = tagFilters.has(tag);
            return (
              <button
                key={tag}
                onClick={() => onTagFilterToggle(tag)}
                onContextMenu={(event) => onTagContextMenu(tag, event)}
                title={t("mySkills.tags.manageHint")}
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[12px] font-medium transition-colors",
                  isActive
                    ? cn("ring-1 ring-inset ring-black/10 dark:ring-white/15", getTagActiveColor(tag, allTags))
                    : getTagColor(tag, allTags)
                )}
              >
                {tag}
              </button>
            );
          })}
        </>
      )}
    </div>
  );
}
