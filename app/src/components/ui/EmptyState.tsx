import type { ReactNode } from "react";
import { cn } from "../../utils";

interface EmptyStateProps {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-4 text-center", className)}>
      {icon ? <div className="mb-4 text-faint">{icon}</div> : null}
      <h3 className="mb-1.5 text-[14px] font-semibold text-tertiary">{title}</h3>
      {description ? <p className="max-w-md text-[13px] text-muted">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
