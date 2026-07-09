import { cn } from "../../utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-control bg-surface-hover/80 dark:bg-surface-active/70",
        className
      )}
    />
  );
}

interface SkeletonRowsProps {
  rows?: number;
  className?: string;
}

export function SkeletonRows({ rows = 6, className }: SkeletonRowsProps) {
  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="app-panel flex items-center gap-3 px-3.5 py-3">
          <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}

interface DocumentSkeletonProps {
  className?: string;
}

export function DocumentSkeleton({ className }: DocumentSkeletonProps) {
  return (
    <div className={cn("mt-3 space-y-4", className)}>
      <Skeleton className="h-5 w-1/2" />
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-11/12" />
        <Skeleton className="h-3.5 w-4/5" />
      </div>
      <div className="space-y-2 pt-2">
        <Skeleton className="h-3.5 w-10/12" />
        <Skeleton className="h-3.5 w-3/4" />
      </div>
    </div>
  );
}
