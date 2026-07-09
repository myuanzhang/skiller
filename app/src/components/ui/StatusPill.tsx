import type { ReactNode } from "react";
import { cn } from "../../utils";

interface StatusPillProps {
  children: ReactNode;
  className?: string;
  title?: string;
}

export function StatusPill({ children, className, title }: StatusPillProps) {
  return (
    <span
      title={title}
      className={cn("rounded-full px-2 py-0.5 text-[12px] font-medium", className)}
    >
      {children}
    </span>
  );
}
