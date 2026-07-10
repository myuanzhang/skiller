import { Loader2, Search } from "lucide-react";
import { useTranslation } from "react-i18next";

interface MarketLoadMoreButtonProps {
  hasMarketQuery: boolean;
  canLoadMoreSearch: boolean;
  marketLoading: boolean;
  isLoadingMoreSearch: boolean;
  onLoadMoreSearch: () => void;
}

export function MarketLoadMoreButton({
  hasMarketQuery,
  canLoadMoreSearch,
  marketLoading,
  isLoadingMoreSearch,
  onLoadMoreSearch,
}: MarketLoadMoreButtonProps) {
  const { t } = useTranslation();

  if (!hasMarketQuery) {
    return null;
  }

  return (
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
  );
}
