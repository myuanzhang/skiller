import type { ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface SortableItemRenderProps {
  /** Spread onto the drag-handle element to start a drag. */
  dragHandleProps: React.HTMLAttributes<HTMLElement>;
  isDragging: boolean;
}

interface Props {
  id: string;
  disabled?: boolean;
  children: (props: SortableItemRenderProps) => ReactNode;
}

/**
 * Thin dnd-kit sortable wrapper. Applies transform/transition to the row and
 * hands the drag-handle props to the child via render-prop, so existing markup
 * (icon, badge, hover actions, grip) can stay put. Mirrors the ergonomics the
 * sidebar previously got from @hello-pangea/dnd's Draggable.
 */
export function SortableItem({ id, disabled, children }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
    position: isDragging ? ("relative" as const) : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children({
        dragHandleProps: { ...attributes, ...listeners },
        isDragging,
      })}
    </div>
  );
}
