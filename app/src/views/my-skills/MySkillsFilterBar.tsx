import { CircleSlash } from "lucide-react";
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
  onSourceFilterToggle,
  onTagFilterToggle,
  onUntaggedFilterToggle,
  onTagContextMenu,
}: MySkillsFilterBarProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center gap-1 px-1 -mt-2 -mb-3">
      {(["local", "git", "skillssh"] as const).map((src) => (
        <button
          key={src}
          onClick={() => onSourceFilterToggle(src)}
          className={cn(
            "rounded-full px-2.5 py-0.5 text-[12px] font-medium transition-colors",
            sourceFilters.has(src)
              ? "bg-accent text-white dark:bg-accent dark:text-white"
              : "bg-surface-hover text-muted hover:text-secondary"
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
                  isActive ? getTagActiveColor(tag, allTags) : getTagColor(tag, allTags)
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
