import type { RefObject } from "react";
import { Plus, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ManagedSkill } from "../../lib/tauri";
import { getTagColor } from "../../lib/skillTags";
import { cn } from "../../utils";

interface SkillTagEditorProps {
  skill: ManagedSkill;
  allTags: string[];
  editing: boolean;
  tagInput: string;
  inputRef: RefObject<HTMLInputElement | null>;
  tagOptions: string[];
  onTagInputChange: (value: string) => void;
  onAddTag: (skill: ManagedSkill, value?: string) => void;
  onRemoveTag: (skill: ManagedSkill, tag: string) => void;
  onStartEdit: (skillId: string) => void;
  onCancelEdit: () => void;
}

export function SkillTagEditor({
  skill,
  allTags,
  editing,
  tagInput,
  inputRef,
  tagOptions,
  onTagInputChange,
  onAddTag,
  onRemoveTag,
  onStartEdit,
  onCancelEdit,
}: SkillTagEditorProps) {
  const { t } = useTranslation();

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1">
      {skill.tags.map((tag) => (
        <span
          key={tag}
          className={cn(
            "group/tag inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
            getTagColor(tag, allTags)
          )}
        >
          {tag}
          <button
            onClick={(e) => { e.stopPropagation(); onRemoveTag(skill, tag); }}
            className="hidden group-hover/tag:inline-flex rounded-full p-0 opacity-60 hover:opacity-100"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </span>
      ))}
      {editing ? (
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <input
            ref={inputRef}
            type="text"
            value={tagInput}
            onChange={(e) => onTagInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { onAddTag(skill); }
              if (e.key === "Escape") { onCancelEdit(); }
            }}
            onBlur={() => {
              if (tagInput.trim()) onAddTag(skill);
              else onCancelEdit();
            }}
            placeholder={t("mySkills.tags.addTag")}
            className="h-5 w-28 rounded-full border border-border-subtle bg-transparent px-1.5 text-[11px] text-secondary outline-none focus:border-accent"
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            autoFocus
          />
          {tagOptions.length > 0 && (
            <div className="absolute left-0 top-6 z-50 max-h-56 min-w-[112px] max-w-[180px] overflow-y-auto rounded-md border border-border-subtle bg-surface p-1 shadow-lg">
              {tagOptions.map((tagOption) => (
                <button
                  key={tagOption}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => { e.stopPropagation(); onAddTag(skill, tagOption); }}
                  className="w-full truncate rounded px-1.5 py-1 text-left text-[11px] text-secondary hover:bg-surface-hover"
                  title={tagOption}
                >
                  {tagOption}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={(e) => { e.stopPropagation(); onStartEdit(skill.id); }}
          className="inline-flex items-center rounded-full p-0.5 text-faint transition-colors hover:text-muted opacity-0 group-hover:opacity-100"
          title={t("mySkills.tags.addTag")}
        >
          <Plus className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
