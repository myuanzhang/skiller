import type { ReactNode } from "react";
import { cn } from "../../utils";

export interface ModalProps {
  open?: boolean;
  children: ReactNode;
  className?: string;
  overlayClassName?: string;
  contentClassName?: string;
  onClose?: () => void;
  closeOnBackdrop?: boolean;
  zIndexClassName?: string;
}

export function Modal({
  open = true,
  children,
  className,
  overlayClassName,
  contentClassName,
  onClose,
  closeOnBackdrop = true,
  zIndexClassName = "z-50",
}: ModalProps) {
  if (!open) return null;

  const handleBackdropClick = () => {
    if (closeOnBackdrop) {
      onClose?.();
    }
  };

  return (
    <div className={cn("fixed inset-0 flex items-center justify-center", zIndexClassName, className)}>
      <div
        className={cn("absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in", overlayClassName)}
        onClick={handleBackdropClick}
      />
      <div className={cn("relative animate-in fade-in slide-in-bottom", contentClassName)}>{children}</div>
    </div>
  );
}
