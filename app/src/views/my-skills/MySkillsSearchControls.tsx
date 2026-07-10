import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "../../utils";

type FilterMode = "all" | "enabled" | "available";

interface MySkillsSearchControlsProps {
  search: string;
  onSearchChange: (value: string) => void;
  filterMode: FilterMode;
  onFilterModeChange: (mode: FilterMode) => void;
}

export function MySkillsSearchControls({
  search,
  onSearchChange,
  filterMode,
  onFilterModeChange,
}: MySkillsSearchControlsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-1 gap-3">
      <div className="relative w-full max-w-[280px]">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t("mySkills.searchPlaceholder")}
          className="app-input w-full pl-9 font-medium"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
      </div>

      <div className="app-segmented">
        {(["all", "enabled", "available"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => onFilterModeChange(mode)}
            className={cn(
              "app-segmented-button",
              filterMode === mode && "app-segmented-button-active"
            )}
          >
            {t(`mySkills.filters.${mode}`)}
          </button>
        ))}
      </div>
    </div>
  );
}
