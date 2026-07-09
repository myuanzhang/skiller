import { Trash2, CheckCircle2, Circle, RotateCcw, Tag, Download, Upload } from "lucide-react";
import { cn } from "../utils";
import { Button } from "./ui/Button";

interface MultiSelectToolbarLabels {
  hint: string;
  selected: string;
  update?: string;
  updateProject?: string;
  updateCenter?: string;
  delete: string;
  enable: string;
  disable: string;
  selectAll: string;
  deselectAll: string;
  cancel: string;
  editTags?: string;
}

interface MultiSelectToolbarProps {
  selectedCount: number;
  isAllSelected: boolean;
  anyDisabled: boolean;
  anyUpdatable?: boolean;
  anyCanUpdateProject?: boolean;
  anyCanUpdateCenter?: boolean;
  showToggle: boolean;
  updating?: boolean;
  updatingProject?: boolean;
  updatingCenter?: boolean;
  labels: MultiSelectToolbarLabels;
  onUpdate?: () => void;
  onUpdateProject?: () => void;
  onUpdateCenter?: () => void;
  onDelete: () => void;
  onToggle: () => void;
  onSelectAll: () => void;
  onCancel: () => void;
  onEditTags?: () => void;
}

export function MultiSelectToolbar({
  selectedCount,
  isAllSelected,
  anyDisabled,
  anyUpdatable = false,
  anyCanUpdateProject = false,
  anyCanUpdateCenter = false,
  showToggle,
  updating = false,
  updatingProject = false,
  updatingCenter = false,
  labels,
  onUpdate,
  onUpdateProject,
  onUpdateCenter,
  onDelete,
  onToggle,
  onSelectAll,
  onCancel,
  onEditTags,
}: MultiSelectToolbarProps) {
  return (
    <div className="flex items-center gap-2 px-1 py-1.5">
      <span className="text-[13px] text-muted">
        {selectedCount > 0 ? labels.selected : labels.hint}
      </span>
      {selectedCount > 0 && (
        <>
          {anyUpdatable && labels.update && onUpdate && (
            <Button
              size="sm"
              onClick={onUpdate}
              disabled={updating}
              className="py-1"
              icon={<RotateCcw className={cn("h-3.5 w-3.5", updating && "animate-spin")} />}
            >
              {labels.update}
            </Button>
          )}
          {anyCanUpdateProject && labels.updateProject && onUpdateProject && (
            <Button
              size="sm"
              onClick={onUpdateProject}
              disabled={updatingProject}
              className="bg-sky-600/90 py-1 text-white hover:bg-sky-500"
              icon={<Download className={cn("h-3.5 w-3.5", updatingProject && "animate-spin")} />}
            >
              {labels.updateProject}
            </Button>
          )}
          {anyCanUpdateCenter && labels.updateCenter && onUpdateCenter && (
            <Button
              size="sm"
              onClick={onUpdateCenter}
              disabled={updatingCenter}
              className="bg-amber-600/90 py-1 text-white hover:bg-amber-500"
              icon={<Upload className={cn("h-3.5 w-3.5", updatingCenter && "animate-spin")} />}
            >
              {labels.updateCenter}
            </Button>
          )}
          {onEditTags && labels.editTags && (
            <Button
              size="sm"
              onClick={onEditTags}
              className="bg-violet-600/90 py-1 text-white hover:bg-violet-500"
              icon={<Tag className="h-3.5 w-3.5" />}
            >
              {labels.editTags}
            </Button>
          )}
          <Button
            size="sm"
            onClick={onDelete}
            className="bg-red-600/90 py-1 text-white hover:bg-red-500"
            icon={<Trash2 className="h-3.5 w-3.5" />}
          >
            {labels.delete}
          </Button>
          {showToggle && (
            <Button
              size="sm"
              onClick={onToggle}
              className={cn(
                "py-1 text-white",
                anyDisabled
                  ? "bg-emerald-600/90 hover:bg-emerald-500"
                  : "bg-amber-600/90 hover:bg-amber-500"
              )}
              icon={
                anyDisabled
                  ? <CheckCircle2 className="h-3.5 w-3.5" />
                  : <Circle className="h-3.5 w-3.5" />
              }
            >
              {anyDisabled ? labels.enable : labels.disable}
            </Button>
          )}
        </>
      )}
      <Button
        size="sm"
        variant="ghost"
        onClick={onSelectAll}
        className="py-1"
      >
        {isAllSelected ? labels.deselectAll : labels.selectAll}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={onCancel}
        className="py-1"
      >
        {labels.cancel}
      </Button>
    </div>
  );
}
