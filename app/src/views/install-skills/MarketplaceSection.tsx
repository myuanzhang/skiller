import type { Dispatch, RefObject, SetStateAction } from "react";
import {
  Clock,
  Loader2,
  Search,
  Star,
  TrendingUp,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { StatusBanner } from "../../components/StatusBanner";
import type { SkillsShSkill } from "../../lib/tauri";
import { cn } from "../../utils";
import { MarketLoadMoreButton } from "./MarketLoadMoreButton";
import { MarketPagination } from "./MarketPagination";
import { MarketSkillCard } from "./MarketSkillCard";
import { MarketSourceFilter } from "./MarketSourceFilter";
import type { MarketTab } from "./types";

interface MarketplaceSectionProps {
  marketTab: MarketTab;
  onMarketTabChange: (tab: MarketTab) => void;
  hasMarketQuery: boolean;
  marketQuery: string;
  onMarketQueryChange: (query: string) => void;
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
  marketError: string | null;
  onRetryMarket: () => void;
  marketLoading: boolean;
  marketLoadingMore: boolean;
  marketListRef: RefObject<HTMLDivElement | null>;
  filteredMarketSkillsLength: number;
  paginatedMarketSkills: SkillsShSkill[];
  installedSourceRefs: Set<string>;
  installing: string | null;
  onOpenSkillWeb: (skill: SkillsShSkill) => void;
  onCancelInstall: (cancelKey: string) => void;
  onInstallSkillssh: (skill: SkillsShSkill) => void;
  totalMarketPages: number;
  currentMarketPage: number;
  visibleMarketPages: number[];
  onChangeMarketPage: (page: number) => void;
  canLoadMoreSearch: boolean;
  isLoadingMoreSearch: boolean;
  onLoadMoreSearch: () => void;
}

export function MarketplaceSection({
  marketTab,
  onMarketTabChange,
  hasMarketQuery,
  marketQuery,
  onMarketQueryChange,
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
  marketError,
  onRetryMarket,
  marketLoading,
  marketLoadingMore,
  marketListRef,
  filteredMarketSkillsLength,
  paginatedMarketSkills,
  installedSourceRefs,
  installing,
  onOpenSkillWeb,
  onCancelInstall,
  onInstallSkillssh,
  totalMarketPages,
  currentMarketPage,
  visibleMarketPages,
  onChangeMarketPage,
  canLoadMoreSearch,
  isLoadingMoreSearch,
  onLoadMoreSearch,
}: MarketplaceSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="animate-in fade-in duration-300">
      <div className="app-panel mb-3 p-3.5">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1.5 lg:flex-row lg:items-center">
              {!hasMarketQuery ? (
                <div className="app-segmented shrink-0 bg-background">
                  {[
                    { id: "alltime" as const, label: t("install.all"), icon: Clock },
                    { id: "trending" as const, label: t("install.trending"), icon: TrendingUp },
                    { id: "hot" as const, label: t("install.hot"), icon: Star },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = marketTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => onMarketTabChange(tab.id)}
                        className={cn(
                          "app-segmented-button flex items-center gap-1.5",
                          isActive && "app-segmented-button-active"
                        )}
                      >
                        <Icon className="h-3 w-3" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              ) : null}

              <div className="relative flex-1 lg:max-w-[640px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  value={marketQuery}
                  onChange={(event) => onMarketQueryChange(event.target.value)}
                  placeholder={t("install.searchMarket")}
                  className="app-input w-full bg-background pl-9"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                />
              </div>
            </div>
          </div>

          <MarketSourceFilter
            sourceOptions={sourceOptions}
            marketSourceFilter={marketSourceFilter}
            onMarketSourceFilterChange={onMarketSourceFilterChange}
            filterContainerRef={filterContainerRef}
            allBtnMeasureRef={allBtnMeasureRef}
            moreBtnMeasureRef={moreBtnMeasureRef}
            sourceMeasureRefs={sourceMeasureRefs}
            visibleSourceCount={visibleSourceCount}
            sourceOverflowBtnRef={sourceOverflowBtnRef}
            sourceOverflowPanelRef={sourceOverflowPanelRef}
            sourceOverflowOpen={sourceOverflowOpen}
            sourceOverflowSide={sourceOverflowSide}
            onToggleSourceOverflow={onToggleSourceOverflow}
            sourceSearch={sourceSearch}
            onSourceSearchChange={onSourceSearchChange}
            filteredOverflowSources={filteredOverflowSources}
            sourceFocusedIndex={sourceFocusedIndex}
            setSourceFocusedIndex={setSourceFocusedIndex}
            resetSourceOverflowState={resetSourceOverflowState}
            sourceListRef={sourceListRef}
          />
        </div>
      </div>

      {marketError ? (
        <div className="mb-4">
          <StatusBanner
            compact
            title={t("common.requestFailed")}
            description={marketError}
            actionLabel={t("common.retry")}
            onAction={onRetryMarket}
            tone="danger"
          />
        </div>
      ) : null}

      {marketLoading && !marketLoadingMore ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted" />
        </div>
      ) : (
        <div className="pb-8">
          <div ref={marketListRef} className="scroll-mt-4" />

          {filteredMarketSkillsLength === 0 ? (
            <div className="app-panel flex flex-col items-center justify-center rounded-2xl px-6 py-14 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-background text-muted">
                <Search className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-[14px] font-semibold text-secondary">
                {t("install.noResults.title")}
              </h3>
              <p className="mt-1 max-w-md text-[13px] text-muted">
                {t("install.noResults.description")}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3">
                {paginatedMarketSkills.map((skill) => {
                  const sourceRef = `${skill.source}/${skill.skill_id}`;
                  return (
                    <MarketSkillCard
                      key={skill.id}
                      skill={skill}
                      marketTab={marketTab}
                      marketSourceFilter={marketSourceFilter}
                      isInstalled={installedSourceRefs.has(sourceRef)}
                      installing={installing}
                      onMarketSourceFilterChange={onMarketSourceFilterChange}
                      onOpenSkillWeb={onOpenSkillWeb}
                      onCancelInstall={onCancelInstall}
                      onInstallSkillssh={onInstallSkillssh}
                    />
                  );
                })}
              </div>

              <MarketPagination
                totalMarketPages={totalMarketPages}
                currentMarketPage={currentMarketPage}
                visibleMarketPages={visibleMarketPages}
                onChangeMarketPage={onChangeMarketPage}
              />

              <MarketLoadMoreButton
                hasMarketQuery={hasMarketQuery}
                canLoadMoreSearch={canLoadMoreSearch}
                marketLoading={marketLoading}
                isLoadingMoreSearch={isLoadingMoreSearch}
                onLoadMoreSearch={onLoadMoreSearch}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
