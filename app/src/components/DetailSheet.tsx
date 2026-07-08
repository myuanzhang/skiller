import { createPortal } from "react-dom";
import { ArrowLeft, X } from "lucide-react";
import type { ReactNode } from "react";

const IS_MACOS = navigator.userAgent.includes("Mac");

interface DetailSheetProps {
  open: boolean;
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  onClose: () => void;
  /** When provided, renders a back button at the top-left that returns to the
   *  previous view (e.g. the agent's skill list). */
  onBack?: () => void;
  /** Label shown next to the back arrow. Defaults to "Back". */
  backLabel?: string;
  children: ReactNode;
}

export function DetailSheet({
  open,
  title,
  description,
  meta,
  onClose,
  onBack,
  backLabel,
  children,
}: DetailSheetProps) {
  if (!open) return null;

  return createPortal(
    <div className="fixed top-[28px] right-0 bottom-0 left-[220px] z-40 isolate">
      <div
        className={
          IS_MACOS
            ? "absolute inset-0 z-0 bg-black/65"
            : "absolute inset-0 z-0 bg-black/60 backdrop-blur-sm"
        }
        onClick={onClose}
      />
      <div className="absolute inset-0 z-10 flex min-h-0 flex-col overflow-hidden border-l border-border-subtle bg-bg-secondary">
        {onBack ? (
          <button
            onClick={onBack}
            className="absolute top-4 left-5 z-10 flex shrink-0 items-center gap-1 rounded-control py-1.5 pr-2.5 pl-1.5 text-[13px] font-medium text-muted transition-colors outline-none hover:bg-surface-hover hover:text-secondary"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel ?? "Back"}
          </button>
        ) : null}
        <button
          onClick={onClose}
          className="absolute top-4 right-5 z-10 shrink-0 rounded-control p-1.5 text-muted transition-colors outline-none hover:bg-surface-hover hover:text-secondary"
        >
          <X className="h-4 w-4" />
        </button>
        <div
          className={`min-h-0 flex-1 overflow-y-auto px-6 pb-6 scrollbar-hide ${
            onBack ? "pt-14" : "pt-5"
          }`}
        >
          <h2 className="mb-3 min-w-0 pr-10 text-[28px] font-semibold leading-tight tracking-tight text-primary">
            <span className="block">{title}</span>
          </h2>
          {description ? (
            <div className="text-[15px] leading-7 text-secondary">{description}</div>
          ) : null}
          {meta ? <div className="mt-4">{meta}</div> : null}
          <div className="mt-5">{children}</div>
        </div>
      </div>
    </div>,
    document.body
  );
}
