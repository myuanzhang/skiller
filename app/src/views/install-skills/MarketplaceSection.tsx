import type { Dispatch, RefObject, SetStateAction } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  DownloadCloud,
  ExternalLink,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Star,
  TrendingUp,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { StatusBanner } from "../../components/StatusBanner";
import type { SkillsShSkill } from "../../lib/tauri";
import { cn } from "../../utils";
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

function formatInstallCount(installs: number) {
  if (installs >= 1_000_000) return `${(installs / 1_000_000).toFixed(1)}M`;
  if (installs >= 1_000) return `${(installs / 1_000).toFixed(1)}K`;
  return installs;
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

          {sourceOptions.length > 0 && (
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
          )}
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
                  const displayName = skill.name || skill.skill_id;
                  const showSkillId = skill.skill_id.trim() !== displayName.trim();
                  const owner = skill.source.split("/")[0];
                  const avatarUrl = `https://github.com/${owner}.png?size=32`;
                  const sourceRef = `${skill.source}/${skill.skill_id}`;
                  const isInstalled = installedSourceRefs.has(sourceRef);

                  return (
                    <div
                      key={skill.id}
                      className="app-panel group flex min-h-[132px] flex-col justify-between gap-3 p-3 transition-colors hover:border-border hover:bg-surface-hover"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-2.5">
                          <img
                            src={avatarUrl}
                            alt={owner}
                            className="mt-0.5 h-8 w-8 shrink-0 rounded-lg border border-border-subtle"
                            loading="lazy"
                          />
                          <div className="min-w-0">
                            <h3 className="truncate text-[13px] font-semibold text-secondary group-hover:text-primary">
                              {displayName}
                            </h3>
                            {showSkillId ? (
                              <p className="mt-0.5 truncate font-mono text-[12px] leading-4 text-muted">
                                {skill.skill_id}
                              </p>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => onMarketSourceFilterChange(skill.source)}
                              disabled={marketSourceFilter === skill.source}
                              title={t("install.onlyThisContributor")}
                              className={cn(
                                "mt-2 inline-flex max-w-full rounded-control border border-accent-border bg-accent-bg px-1.5 py-0.5 text-[12px] leading-4 font-medium text-accent-light transition-colors",
                                marketSourceFilter === skill.source
                                  ? "cursor-default opacity-90"
                                  : "hover:bg-accent-bg/80"
                              )}
                            >
                              <span className="truncate">@{skill.source}</span>
                            </button>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            onClick={() => onOpenSkillWeb(skill)}
                            className="rounded-control p-1 text-muted transition-colors hover:bg-surface-hover hover:text-secondary"
                            title={t("install.viewOnWeb")}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </button>
                          {isInstalled ? (
                            <span
                              className="rounded-control border border-emerald-500/20 bg-emerald-500/10 p-1 text-emerald-400"
                              title={t("install.installed")}
                            >
                              <Check className="h-3.5 w-3.5" />
                            </span>
                          ) : installing === skill.id ? (
                            <button
                              onClick={() => onCancelInstall(`${skill.source}/${skill.skill_id}`)}
                              className="inline-flex items-center gap-1 rounded-control border border-red-500/30 bg-red-500/10 px-1.5 py-1 text-red-400 transition-colors hover:bg-red-500/20"
                              title={t("install.cancel")}
                              aria-label={t("install.cancel")}
                            >
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              <span className="text-[11px] leading-none font-medium">
                                {t("install.cancel")}
                              </span>
                            </button>
                          ) : (
                            <button
                              onClick={() => onInstallSkillssh(skill)}
                              disabled={installing !== null}
                              className="rounded-control border border-accent-border bg-accent-dark p-1 text-white transition-colors hover:bg-accent disabled:opacity-50"
                              title={t("install.oneClickInstall")}
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 border-t border-border-subtle pt-2">
                        {marketTab === "alltime" && skill.installs > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-control border border-border-subtle bg-background px-1.5 py-0.5 text-[13px] leading-4 text-muted">
                            <DownloadCloud className="h-3 w-3" />
                            {formatInstallCount(skill.installs)}
                          </span>
                        )}
                        {isInstalled ? (
                          <span className="inline-flex items-center gap-1 rounded-control border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[13px] leading-4 font-medium text-emerald-400">
                            <Check className="h-3 w-3" />
                            {t("install.installed")}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalMarketPages > 1 ? (
                <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5">
                  <button
                    onClick={() => onChangeMarketPage(Math.max(1, currentMarketPage - 1))}
                    disabled={currentMarketPage === 1}
                    className="inline-flex items-center gap-1 rounded-control border border-border-subtle bg-surface px-3 py-1.5 text-[13px] font-medium text-secondary transition-colors hover:bg-surface-hover disabled:opacity-50"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    {t("install.pagination.previous")}
                  </button>

                  {visibleMarketPages.map((page, index) => {
                    const previousPage = visibleMarketPages[index - 1];
                    const showGap = previousPage && page - previousPage > 1;

                    return (
                      <div key={page} className="flex items-center gap-1.5">
                        {showGap ? <span className="px-1 text-[13px] text-faint">...</span> : null}
                        <button
                          onClick={() => onChangeMarketPage(page)}
                          className={cn(
                            "min-w-8 rounded-control border px-2.5 py-1.5 text-[13px] font-semibold transition-colors",
                            page === currentMarketPage
                              ? "border-accent-border bg-accent-dark text-white"
                              : "border-border-subtle bg-surface text-secondary hover:bg-surface-hover"
                          )}
                        >
                          {page}
                        </button>
                      </div>
                    );
                  })}

                  <button
                    onClick={() => onChangeMarketPage(Math.min(totalMarketPages, currentMarketPage + 1))}
                    disabled={currentMarketPage === totalMarketPages}
                    className="inline-flex items-center gap-1 rounded-control border border-border-subtle bg-surface px-3 py-1.5 text-[13px] font-medium text-secondary transition-colors hover:bg-surface-hover disabled:opacity-50"
                  >
                    {t("install.pagination.next")}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : null}

              {hasMarketQuery ? (
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={onLoadMoreSearch}
                    disabled={!canLoadMoreSearch || marketLoading}
                    className="inline-flex items-center gap-2 rounded-control border border-border-subtle bg-surface px-3.5 py-2 text-[13px] font-medium text-secondary transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {marketLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Search className="h-3.5 w-3.5" />
                    )}
                    {isLoadingMoreSearch
                      ? t("install.loadingMore")
                      : t("install.loadMoreSearch")}
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>
      )}
    </div>
  );
}
