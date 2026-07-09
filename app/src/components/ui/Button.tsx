import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-1.5 rounded-md font-medium " +
  "transition-colors outline-none active:scale-[0.98] disabled:cursor-not-allowed " +
  "disabled:opacity-50 disabled:active:scale-100";

const variantClass: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-accent-hover",
  secondary:
    "border border-border-subtle bg-surface text-secondary hover:bg-surface-hover",
  ghost: "text-muted hover:bg-surface-hover hover:text-secondary",
  danger: "bg-danger text-white hover:opacity-90",
};

const sizeClass: Record<Size, string> = {
  sm: "h-8 px-2.5 text-[13px]",
  md: "h-9 px-3 text-[13px]",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Leading icon element, rendered before children. */
  icon?: ReactNode;
}

/**
 * Shared primary/secondary/ghost/danger button. Sizing can be overridden via
 * `className` (cn uses tailwind-merge, so later classes win) for the few
 * bespoke cases (full-width CTA, larger empty-state action, etc.).
 */
export function Button({
  variant = "primary",
  size = "md",
  icon,
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(base, variantClass[variant], sizeClass[size], className)}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
