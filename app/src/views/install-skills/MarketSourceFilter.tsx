import type { Dispatch, RefObject, SetStateAction } from "react";
import { MoreHorizontal, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "../../utils";

interface MarketSourceFilterProps {
  sourceOptions: string[];
  marketSourceFilter: string;
  onMarketSourceFilterChange: (source: string) => void;
  filterContainerRef: RefObject<HTMLDivElement | null>;
  allBtnMeasureRef: RefObject<HTMLButtonElement | null>;
  moreBtnMeasureRef: RefObject<HTMLButtonElement | null>;
  sourceMeasureRefs: RefObject<(HTMLButtonElement | null)[]>;
  visibleSourceCount: number;
  sourceOverflowBtnRef: RefObject<HTMLButtonElement | null>;
  sourceOverflowPanelRef: RefObject<HTMLDivElement | null>;
  sourceOverflowOpen: boolean;
  sourceOverflowSide: "left" | "right";
  onToggleSourceOverflow: () => void;
  sourceSearch: string;
  onSourceSearchChange: (query: string) => void;
  filteredOverflowSources: string[];
  sourceFocusedIndex: number;
  setSourceFocusedIndex: Dispatch<SetStateAction<number>>;
  resetSourceOverflowState: () => void;
  sourceListRef: RefObject<HTMLDivElement | null>;
}

export function MarketSourceFilter({
  sourceOptions,
  marketSourceFilter,
  onMarketSourceFilterChange,
  filterContainerRef,
  allBtnMeasureRef,
  moreBtnMeasureRef,
  sourceMeasureRefs,
  visibleSourceCount,
  sourceOverflowBtnRef,
  sourceOverflowPanelRef,
  sourceOverflowOpen,
  sourceOverflowSide,
  onToggleSourceOverflow,
  sourceSearch,
  onSourceSearchChange,
  filteredOverflowSources,
  sourceFocusedIndex,
  setSourceFocusedIndex,
  resetSourceOverflowState,
  sourceListRef,
}: MarketSourceFilterProps) {
  const { t } = useTranslation();

  if (sourceOptions.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-border-subtle pt-2">
      <div className="flex items-center gap-3">
        <span className="shrink-0 text-[13px] font-medium text-tertiary">
          {t("install.filters.source")}
        </span>
        <div ref={filterContainerRef} className="relative min-w-0 flex-1">
          <div className="pointer-events-none invisible absolute left-0 top-0 flex h-0 items-center gap-1.5 overflow-hidden" aria-hidden="true">
            <button
              ref={allBtnMeasureRef}
              tabIndex={-1}
              className="rounded-full border px-2.5 py-1 text-[13px] font-medium whitespace-nowrap"
            >
              {t("install.filters.allSources")}
            </button>
            {sourceOptions.map((source, i) => (
              <button
                key={source}
                ref={(el) => { sourceMeasureRefs.current[i] = el; }}
                tabIndex={-1}
                className="rounded-full border px-2.5 py-1 text-[13px] font-medium whitespace-nowrap"
              >
                @{source}
              </button>
            ))}
            <button
              ref={moreBtnMeasureRef}
              tabIndex={-1}
              className="flex items-center rounded-full border px-2 py-1"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onMarketSourceFilterChange("all")}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[13px] font-medium whitespace-nowrap transition-colors",
                marketSourceFilter === "all"
                  ? "border-accent-border bg-accent-bg text-accent-light"
                  : "border-border-subtle bg-background text-muted hover:text-secondary"
              )}
            >
              {t("install.filters.allSources")}
            </button>
            {sourceOptions.slice(0, visibleSourceCount).map((source) => (
              <button
                key={source}
                type="button"
                onClick={() => onMarketSourceFilterChange(source)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[13px] font-medium whitespace-nowrap transition-colors",
                  marketSourceFilter === source
                    ? "border-accent-border bg-accent-bg text-accent-light"
                    : "border-border-subtle bg-background text-muted hover:text-secondary"
                )}
              >
                @{source}
              </button>
            ))}
            {visibleSourceCount < sourceOptions.length && (
              <div className="relative">
                <button
                  ref={sourceOverflowBtnRef}
                  type="button"
                  onClick={onToggleSourceOverflow}
                  className={cn(
                    "flex items-center rounded-full border px-2 py-1 text-[13px] font-medium transition-colors",
                    sourceOverflowOpen
                      ? "border-accent-border bg-accent-bg text-accent-light"
                      : "border-border-subtle bg-background text-muted hover:text-secondary"
                  )}
                  title={`${sourceOptions.length - visibleSourceCount} more`}
                  aria-expanded={sourceOverflowOpen}
                  aria-haspopup="listbox"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
                {sourceOverflowOpen && (
                  <div
                    ref={sourceOverflowPanelRef}
                    role="listbox"
                    className={cn(
                      "absolute top-full z-50 mt-1.5 w-48 overflow-hidden rounded-xl border border-border bg-surface shadow-lg",
                      sourceOverflowSide === "left" ? "left-0" : "right-0"
                    )}
                  >
                    <div className="border-b border-border-subtle px-2 py-1.5">
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted" />
                        <input
                          type="text"
                          value={sourceSearch}
                          onChange={(e) => {
                            onSourceSearchChange(e.target.value);
                            setSourceFocusedIndex(-1);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "ArrowDown") {
                              e.preventDefault();
                              if (filteredOverflowSources.length === 0) return;
                              setSourceFocusedIndex((i) =>
                                Math.min(i + 1, filteredOverflowSources.length - 1)
                              );
                            } else if (e.key === "ArrowUp") {
                              e.preventDefault();
                              if (filteredOverflowSources.length === 0) return;
                              setSourceFocusedIndex((i) =>
                                i <= 0 ? 0 : i - 1
                              );
                            } else if (e.key === "Enter" && sourceFocusedIndex >= 0) {
                              const target = filteredOverflowSources[sourceFocusedIndex];
                              if (target) {
                                onMarketSourceFilterChange(target);
                                resetSourceOverflowState();
                              }
                            } else if (e.key === "Escape") {
                              resetSourceOverflowState();
                            }
                          }}
                          placeholder={t("common.search")}
                          className="app-input w-full bg-background py-1 pl-6 pr-2 text-[12px]"
                          autoFocus
                          autoCapitalize="none"
                          autoCorrect="off"
                          spellCheck={false}
                        />
                      </div>
                    </div>
                    <div ref={sourceListRef} className="max-h-48 overflow-y-auto scrollbar-hide py-1">
                      {filteredOverflowSources.map((source, idx) => (
                        <button
                          key={source}
                          type="button"
                          role="option"
                          aria-selected={marketSourceFilter === source}
                          onClick={() => {
                            onMarketSourceFilterChange(source);
                            resetSourceOverflowState();
                          }}
                          className={cn(
                            "flex w-full items-center px-3 py-1.5 text-left text-[13px] transition-colors",
                            idx === sourceFocusedIndex
                              ? "bg-surface-hover text-primary"
                              : marketSourceFilter === source
                                ? "bg-accent-bg text-accent-light"
                                : "text-secondary hover:bg-surface-hover"
                          )}
                        >
                          @{source}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
