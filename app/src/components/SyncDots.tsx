import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ManagedSkill, ToolInfo } from "../lib/tauri";
import { cn } from "../utils";
import { AgentIcon } from "./AgentIcon";
import { hasAgentIcon } from "../lib/agentIcons";
import {
  agentDotIconClass,
  agentDotTextClass,
  hiddenAgentDotClass,
  type AgentDotState,
} from "../lib/statusPalette";

function shortLabel(displayName: string, key: string): string {
  const words = displayName.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  const word = words[0] || key;
  return word.slice(0, 2).toUpperCase();
}

type DotState = AgentDotState;

interface Dot {
  key: string;
  displayName: string;
  state: DotState;
}

interface Props {
  skill: ManagedSkill;
  tools: ToolInfo[];
  limit?: number;
  size?: "sm" | "md";
  className?: string;
  /**
   * When true, also surface skill targets whose agent is no longer installed/enabled
   * (e.g. CLI uninstalled or disabled in Settings) so the indicator does not silently
   * disappear while the store still treats the skill as synced.
   */
  includeOrphan?: boolean;
  /**
   * When provided, each agent dot becomes a button: clicking syncs/unsyncs the
   * skill from that agent. The handler receives the next desired state.
   */
  onToggle?: (toolKey: string, enabled: boolean) => void;
  /** Tool key currently performing a sync/unsync operation; shows a loader on that dot. */
  pendingKey?: string | null;
}

export function SyncDots({
  skill,
  tools,
  limit,
  size = "md",
  className,
  includeOrphan = false,
  onToggle,
  pendingKey,
}: Props) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const moreButtonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const syncedKeys = new Set(skill.targets.map((t) => t.tool));
  const activeTools = tools.filter((t) => t.installed && t.enabled);
  const activeKeys = new Set(activeTools.map((t) => t.key));

  const dots: Dot[] = activeTools.map((tool) => ({
    key: tool.key,
    displayName: tool.display_name,
    state: syncedKeys.has(tool.key) ? "synced" : "available",
  }));

  if (includeOrphan) {
    for (const target of skill.targets) {
      if (activeKeys.has(target.tool)) continue;
      const known = tools.find((t) => t.key === target.tool);
      dots.push({
        key: target.tool,
        displayName: known?.display_name || target.tool,
        state: "orphan",
      });
    }
  }

  const statePriority: Record<DotState, number> = {
    synced: 0,
    available: 1,
    orphan: 2,
  };
  const orderedDots = dots
    .map((dot, index) => ({ dot, index }))
    .sort((a, b) => statePriority[a.dot.state] - statePriority[b.dot.state] || a.index - b.index)
    .map(({ dot }) => dot);

  const visible = typeof limit === "number" ? orderedDots.slice(0, limit) : orderedDots;
  const hidden = typeof limit === "number" ? orderedDots.slice(limit) : [];
  const hiddenCount = orderedDots.length - visible.length;

  const dim = size === "sm"
    ? "h-[18px] w-[18px] text-[8px]"
    : "h-[20px] w-[20px] text-[9px]";

  const stateTitle: Record<DotState, string> = {
    synced: ` · ${t("mySkills.targetSynced")}`,
    available: "",
    orphan: ` · ${t("mySkills.targetOrphan")}`,
  };

  const clickHint: Record<DotState, string> = {
    synced: ` · ${t("mySkills.targetClickUninstall")}`,
    available: ` · ${t("mySkills.targetClickInstall")}`,
    orphan: ` · ${t("mySkills.targetClickUninstall")}`,
  };

  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: globalThis.MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || moreButtonRef.current?.contains(target)) return;
      setMenuOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const toggleHiddenMenu = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + 6,
      left: Math.min(rect.left, window.innerWidth - 240),
    });
    setMenuOpen((value) => !value);
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {visible.map((dot) => {
        const useIcon = hasAgentIcon(dot.key);
        const isPending = pendingKey === dot.key;
        const interactive = !!onToggle && !isPending;
        const title = `${dot.displayName}${stateTitle[dot.state]}${onToggle ? clickHint[dot.state] : ""}`;
        const baseClass = cn(
          "inline-flex select-none items-center justify-center overflow-hidden rounded-control transition-colors",
          dim,
          useIcon ? agentDotIconClass[dot.state] : cn("border font-mono font-semibold tracking-tight", agentDotTextClass[dot.state]),
          interactive && "cursor-pointer hover:ring-1 hover:ring-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          isPending && "opacity-70",
        );
        const content = isPending ? (
          <Loader2 className="h-3 w-3 animate-spin text-muted" />
        ) : useIcon ? (
          <AgentIcon
            agentKey={dot.key}
            className="h-full w-full rounded-control border-0 bg-transparent"
          />
        ) : (
          shortLabel(dot.displayName, dot.key)
        );

        if (onToggle) {
          return (
            <button
              type="button"
              key={dot.key}
              title={title}
              aria-label={title}
              disabled={isPending}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggle(dot.key, dot.state === "available");
              }}
              className={baseClass}
            >
              {content}
            </button>
          );
        }

        return (
          <span key={dot.key} title={title} className={baseClass}>
            {content}
          </span>
        );
      })}
      {hiddenCount > 0 && (onToggle ? (
        <>
          <button
            ref={moreButtonRef}
            type="button"
            title={`+${hiddenCount} more agents`}
            aria-label={`+${hiddenCount} more agents`}
            onClick={toggleHiddenMenu}
            className={cn(
              "inline-flex select-none items-center justify-center rounded-control transition-colors hover:ring-1 hover:ring-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              hiddenAgentDotClass,
              dim,
              menuOpen && "ring-1 ring-accent/60"
            )}
          >
            +{hiddenCount}
          </button>
          {menuOpen && menuPosition && (
            <div
              ref={menuRef}
              className="fixed z-[70] max-h-72 w-60 overflow-y-auto rounded-lg border border-border bg-surface p-1.5 shadow-lg"
              style={{ top: menuPosition.top, left: menuPosition.left }}
              onClick={(event) => event.stopPropagation()}
            >
              {hidden.map((dot) => {
                const useIcon = hasAgentIcon(dot.key);
                const isPending = pendingKey === dot.key;
                const title = `${dot.displayName}${stateTitle[dot.state]}${clickHint[dot.state]}`;
                return (
                  <button
                    key={dot.key}
                    type="button"
                    disabled={isPending}
                    title={title}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      onToggle(dot.key, dot.state === "available");
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[13px] text-secondary transition-colors hover:bg-surface-hover disabled:opacity-60"
                  >
                    <span
                      className={cn(
                        "inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center overflow-hidden rounded-control",
                        useIcon ? agentDotIconClass[dot.state] : cn("border font-mono text-[9px] font-semibold tracking-tight", agentDotTextClass[dot.state])
                      )}
                    >
                      {isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin text-muted" />
                      ) : useIcon ? (
                        <AgentIcon
                          agentKey={dot.key}
                          className="h-full w-full rounded-control border-0 bg-transparent"
                        />
                      ) : (
                        shortLabel(dot.displayName, dot.key)
                      )}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{dot.displayName}</span>
                  </button>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <span
          title={`+${hiddenCount} more agents`}
          className={cn(
            "inline-flex select-none items-center justify-center rounded-control",
            hiddenAgentDotClass,
            dim,
          )}
        >
          +{hiddenCount}
        </span>
      ))}
    </div>
  );
}
