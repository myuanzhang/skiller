import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "../../utils";

interface MarketPaginationProps {
  totalMarketPages: number;
  currentMarketPage: number;
  visibleMarketPages: number[];
  onChangeMarketPage: (page: number) => void;
}

export function MarketPagination({
  totalMarketPages,
  currentMarketPage,
  visibleMarketPages,
  onChangeMarketPage,
}: MarketPaginationProps) {
  const { t } = useTranslation();

  if (totalMarketPages <= 1) {
    return null;
  }

  return (
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
  );
}
