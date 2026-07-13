import type { ReactNode } from "react";
import { cn } from "../../utils";

interface SkillCardShellProps {
  viewMode: "grid" | "list";
  active?: boolean;
  selected?: boolean;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}

export function SkillCardShell({
  viewMode,
  active = false,
  selected = false,
  disabled = false,
  className,
  children,
  onClick,
}: SkillCardShellProps) {
  return (
    <div
      className={cn(
        viewMode === "grid"
          ? "app-panel group relative flex h-full cursor-pointer flex-col overflow-hidden transition-[box-shadow,background-color] duration-150 ease-out hover:bg-surface-hover hover:shadow-border-hover active:scale-[0.99]"
          : "app-panel group relative flex cursor-pointer items-center gap-3.5 rounded-panel px-3.5 py-3 transition-[box-shadow,background-color] duration-150 ease-out hover:bg-surface-hover hover:shadow-border-hover active:scale-[0.99]",
        active && "border-l-2 border-l-accent",
        selected && "ring-1 ring-accent border-accent/40",
        disabled && "opacity-60",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
