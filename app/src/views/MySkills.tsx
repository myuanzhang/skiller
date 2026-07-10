import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutGrid,
  List,
  Github,
  HardDrive,
  Globe,
  Layers,
  RefreshCw,
  RotateCcw,
  Loader2,
  SquareCheck,
  Square,
  GripVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { open as dialogOpen } from "@tauri-apps/plugin-dialog";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { cn } from "../utils";
import { useApp } from "../context/AppContext";
import { useMultiSelect } from "../hooks/useMultiSelect";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { TagRenameDialog } from "../components/TagRenameDialog";
import { DeleteSkillButton } from "../components/DeleteSkillButton";
import { SkillDetailPanel } from "../components/SkillDetailPanel";
import { MultiSelectToolbar } from "../components/MultiSelectToolbar";
import { BatchTagDialog } from "../components/BatchTagDialog";
import { GitSetupDialog } from "../components/GitSetupDialog";
import { GitRecoveryDialog } from "../components/GitRecoveryDialog";
import { SyncDots } from "../components/SyncDots";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { SkillCardShell } from "../components/ui/SkillCardShell";
import * as api from "../lib/tauri";
import { getTagColor, UNTAGGED_FILTER } from "../lib/skillTags";
import { GitSnapshotPanel } from "./my-skills/GitSnapshotPanel";
import { GitToolbarControls, type GitToolbarMode } from "./my-skills/GitToolbarControls";
import { MySkillsFilterBar } from "./my-skills/MySkillsFilterBar";
import { MySkillsSearchControls } from "./my-skills/MySkillsSearchControls";
import { SkillCardActions } from "./my-skills/SkillCardActions";
import { SkillTagEditor } from "./my-skills/SkillTagEditor";
import type {
  ManagedSkill,
  ToolInfo,
  GitBackupStatus,
  GitBackupVersion,
  GitUpstreamHealth,
  SkillToolToggle,
} from "../lib/tauri";
import { getErrorMessage, getErrorKind } from "../lib/error";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SortableSkillItemProps {
  id: string;
  disabled: boolean;
  className?: string;
  children: (dragHandle: React.ReactNode) => React.ReactNode;
}

function SortableSkillItem({ id, disabled, className, children }: SortableSkillItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  };

  const handle = !disabled ? (
    <div
      ref={setActivatorNodeRef}
      {...listeners}
      onClick={(e) => e.stopPropagation()}
      className="flex cursor-grab items-center justify-center rounded p-1 text-faint transition-colors hover:bg-surface-hover hover:text-muted active:cursor-grabbing"
    >
      <GripVertical className="h-4 w-4" />
    </div>
  ) : null;

  return (
    <div ref={setNodeRef} style={style} {...attributes} className={cn("h-full", className)}>
      {children(handle)}
    </div>
  );
}

function getToolDisplayName(toolKey: string, tools: ToolInfo[]) {
  return tools.find((tool) => tool.key === toolKey)?.display_name || toolKey;
}

function centralDirName(skill: ManagedSkill) {
  return skill.central_path.split(/[\\/]/).filter(Boolean).pop() || skill.name;
}

function displaySnapshotLabel(tag: string) {
  const raw = tag.startsWith("sm-v-") ? tag.slice("sm-v-".length) : tag;
  const parts = raw.split("-");
  if (parts.length < 3) return raw;
  // Supported forms:
  // 1) YYYYMMDD-HHMMSS-<short_sha>
  // 2) YYYYMMDD-HHMMSS-<millis>-<short_sha>
  return `${parts[0]}-${parts[1]}`;
}

export function MySkills() {
  const { t } = useTranslation();
  const {
    viewedPreset,
    tools,
    managedSkills: skills,
    refreshPresets,
    refreshManagedSkills,
    detailSkillId,
    openSkillDetailById,
    closeSkillDetail,
    projects,
    refreshProjects,
  } = useApp();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterMode, setFilterMode] = useState<"all" | "enabled" | "available">("all");
  const [sourceFilters, setSourceFilters] = useState<Set<string>>(new Set());
  const [tagFilters, setTagFilters] = useState<Set<string>>(new Set());
  const [allTags, setAllTags] = useState<string[]>([]);
  // Tag management from the filter bar (#233): right-click a tag pill to
  // rename (dialog) or delete (confirm). Left-click stays "filter only".
  const [tagMenu, setTagMenu] = useState<{ tag: string; x: number; y: number } | null>(null);
  const [tagToRename, setTagToRename] = useState<string | null>(null);
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const refreshAfterDeleteRef = useRef<number | null>(null);
  const [batchDeleteConfirm, setBatchDeleteConfirm] = useState(false);
  const [batchTagDialogOpen, setBatchTagDialogOpen] = useState(false);
  const [checkingAll, setCheckingAll] = useState(false);
  const [checkingSkillId, setCheckingSkillId] = useState<string | null>(null);
  const [updatingSkillId, setUpdatingSkillId] = useState<string | null>(null);
  const [batchUpdating, setBatchUpdating] = useState(false);
  const [toolToggles, setToolToggles] = useState<SkillToolToggle[] | null>(null);
  const [togglingToolKey, setTogglingToolKey] = useState<string | null>(null);
  const [togglingTarget, setTogglingTarget] = useState<{ skillId: string; tool: string } | null>(null);
  const [gitStatus, setGitStatus] = useState<GitBackupStatus | null>(null);
  const [gitLoading, setGitLoading] = useState<string | null>(null); // "start" | "sync"
  const [gitRemoteConfig, setGitRemoteConfig] = useState("");
  const [gitVersionsOpen, setGitVersionsOpen] = useState(false);
  const [gitVersionsLoading, setGitVersionsLoading] = useState(false);
  const [gitVersions, setGitVersions] = useState<GitBackupVersion[]>([]);
  const [restoreVersionTag, setRestoreVersionTag] = useState<string | null>(null);
  const [restoringVersionTag, setRestoringVersionTag] = useState<string | null>(null);
  const [setupOpen, setSetupOpen] = useState(false);
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  // What the recovery dialog should explain. A merge conflict is not an
  // upstream-health value, so it gets its own reason rather than being forced
  // into `gitStatus.upstream_health` (which stays "healthy" during a conflict).
  const [recoveryReason, setRecoveryReason] = useState<GitUpstreamHealth | "conflict">(
    "unrelated_histories"
  );
  const [tagEditSkillId, setTagEditSkillId] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");
  const tagInputRef = useRef<HTMLInputElement>(null);

  const [presetSkillOrder, setPresetSkillOrder] = useState<string[]>([]);

  const viewedPresetName = viewedPreset?.name || t("mySkills.currentPresetFallback");

  // Fetch sort order whenever active preset changes
  useEffect(() => {
    if (!viewedPreset) {
      setPresetSkillOrder([]);
      return;
    }
    api.getPresetSkillOrder(viewedPreset.id).then(setPresetSkillOrder).catch(() => {});
  }, [viewedPreset, skills]);

  const refreshAllTags = async () => {
    try {
      const tags = await api.getAllTags();
      setAllTags(tags);
    } catch {
      // not critical
    }
  };

  useEffect(() => {
    refreshAllTags();
  }, [skills]);

  // Close the tag context menu on Escape (click-outside is handled by its backdrop).
  useEffect(() => {
    if (!tagMenu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTagMenu(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tagMenu]);

  const toggleFilter = (set: Set<string>, value: string): Set<string> => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  };

  // "Untagged" is mutually exclusive with real tags: a skill can't be both
  // untagged and tagged. Selecting one clears the other kind.
  const toggleTagFilter = (set: Set<string>, value: string): Set<string> => {
    const next = new Set(set);
    if (next.has(value)) {
      next.delete(value);
      return next;
    }
    if (value === UNTAGGED_FILTER) return new Set([UNTAGGED_FILTER]);
    next.delete(UNTAGGED_FILTER);
    next.add(value);
    return next;
  };

  const skillDisplayNames = useMemo(() => {
    const nameCounts = new Map<string, number>();
    for (const skill of skills) {
      nameCounts.set(skill.name, (nameCounts.get(skill.name) || 0) + 1);
    }

    const displayNames = new Map<string, string>();
    for (const skill of skills) {
      const dirName = centralDirName(skill);
      displayNames.set(
        skill.id,
        (nameCounts.get(skill.name) || 0) > 1 && dirName !== skill.name
          ? dirName
          : skill.name
      );
    }
    return displayNames;
  }, [skills]);

  const filtered = useMemo(() => {
    const result = skills.filter((skill) => {
      const displayName = skillDisplayNames.get(skill.id) || skill.name;
      const matchesSearch =
        skill.name.toLowerCase().includes(search.toLowerCase()) ||
        displayName.toLowerCase().includes(search.toLowerCase()) ||
        (skill.description || "").toLowerCase().includes(search.toLowerCase());
      if (!matchesSearch) return false;

      if (sourceFilters.size > 0 && !sourceFilters.has(skill.source_type)) return false;

      if (tagFilters.size > 0) {
        const wantUntagged = tagFilters.has(UNTAGGED_FILTER);
        const matchUntagged = wantUntagged && skill.tags.length === 0;
        const matchTag = skill.tags.some((t) => tagFilters.has(t));
        if (!matchUntagged && !matchTag) return false;
      }

      if (!viewedPreset) return true;

      const enabledInPreset = skill.preset_ids.includes(viewedPreset.id);
      if (filterMode === "enabled") return enabledInPreset;
      if (filterMode === "available") return !enabledInPreset;
      return true;
    });

    // Always sort enabled skills first; within enabled group, use custom sort order
    if (viewedPreset) {
      result.sort((a, b) => {
        const aEnabled = a.preset_ids.includes(viewedPreset.id) ? 0 : 1;
        const bEnabled = b.preset_ids.includes(viewedPreset.id) ? 0 : 1;
        if (aEnabled !== bEnabled) return aEnabled - bEnabled;
        // Within same group, use preset sort order
        const aOrder = presetSkillOrder.indexOf(a.id);
        const bOrder = presetSkillOrder.indexOf(b.id);
        if (aOrder !== -1 && bOrder !== -1) return aOrder - bOrder;
        if (aOrder !== -1) return -1;
        if (bOrder !== -1) return 1;
        return a.name.localeCompare(b.name);
      });
    }

    return result;
  }, [skills, skillDisplayNames, search, sourceFilters, tagFilters, filterMode, viewedPreset, presetSkillOrder]);

  const {
    isMultiSelect, setIsMultiSelect,
    selectedIds,
    toggleSelect,
    isAllSelected,
    anyDisabled,
    handleSelectAll,
    exitMultiSelect,
  } = useMultiSelect({
    items: skills,
    filtered,
    getKey: (s) => s.id,
    isItemActive: (s) => viewedPreset ? s.preset_ids.includes(viewedPreset.id) : true,
  });

  const selectedSkill = useMemo(
    () => skills.find((skill) => skill.id === detailSkillId) || null,
    [detailSkillId, skills]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id || !viewedPreset) return;

      // Only reorder enabled skills (they are always at the front)
      const enabledSkills = filtered.filter((s) => s.preset_ids.includes(viewedPreset.id));
      const oldIndex = enabledSkills.findIndex((s) => s.id === active.id);
      const newIndex = enabledSkills.findIndex((s) => s.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = [...enabledSkills];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);

      // Optimistic update
      setPresetSkillOrder(reordered.map((s) => s.id));

      try {
        await api.reorderPresetSkills(viewedPreset.id, reordered.map((s) => s.id));
      } catch {
        // Revert on failure
        await api.getPresetSkillOrder(viewedPreset.id).then(setPresetSkillOrder).catch(() => {});
      }
    },
    [filtered, viewedPreset]
  );

  const canDrag = !!viewedPreset;

  const mapGitError = (error: unknown) => {
    const kind = getErrorKind(error);
    const message = getErrorMessage(error, "");

    if (kind === "network") {
      return t("settings.gitErrorNetwork");
    }

    if (
      message.includes("Authentication failed")
      || message.includes("Permission denied")
      || message.includes("could not read Username")
    ) {
      return t("settings.gitErrorAuth");
    }
    if (
      message.includes("Could not resolve host")
      || message.includes("Failed to connect")
      || message.includes("Connection timed out")
      || /connection\s+refused/i.test(message)
    ) {
      return t("settings.gitErrorNetwork");
    }
    // Order matters: check specific reject reasons before the generic conflict keyword.
    if (message.includes("unrelated histories") || message.includes("refusing to merge")) {
      return t("settings.gitErrorUnrelatedHistories");
    }
    if (
      message.includes("[rejected]")
      || message.includes("non-fast-forward")
      || message.includes("fetch first")
      || message.includes("failed to push some refs")
    ) {
      return t("settings.gitErrorRejected");
    }
    if (message.includes("no upstream") || message.includes("has no upstream branch")) {
      return t("settings.gitErrorNoUpstream");
    }
    if (message.includes("CONFLICT") || message.includes("conflict")) {
      return t("settings.gitErrorConflict");
    }
    if (message.includes("not a git repository")) {
      return t("settings.gitErrorNotRepo");
    }
    const fallback = t("settings.gitErrorGeneric");
    const detail = message.trim();
    if (detail && detail !== "Error") {
      return `${fallback} (${detail})`;
    }
    return fallback;
  };

  // A merge conflict (or a leftover MERGE_HEAD from an older build, which the
  // backend tags as SYNC_CONFLICT): the merge has been aborted, so the only
  // safe in-app fix is to re-clone from remote. Deliberately does NOT match the
  // generic "already in progress" message, which also covers non-conflict
  // interruptions like a stale index.lock.
  const isSyncConflictError = (error: unknown) => {
    const message = getErrorMessage(error, "");
    return message.includes("SYNC_CONFLICT") || message.includes("CONFLICT");
  };

  // Detect errors that mean "the local repo's relationship to remote needs structural repair".
  const isRecoverableSetupError = (error: unknown) => {
    const message = getErrorMessage(error, "");
    return (
      message.includes("unrelated histories")
      || message.includes("refusing to merge")
      || message.includes("[rejected]")
      || message.includes("non-fast-forward")
      || message.includes("fetch first")
      || message.includes("failed to push some refs")
      || message.includes("no upstream")
      || isSyncConflictError(error)
    );
  };

  const refreshGitStatus = useCallback(async () => {
    try {
      await api.gitBackupFetch().catch(() => {});
      const status = await api.gitBackupStatus();
      setGitStatus(status);
    } catch {
      // not critical
    }
  }, []);

  // Local-only status refresh: no `git fetch`, so it can fire from
  // dependency-driven effects without driving the file-watcher → refresh
  // → fetch feedback loop.
  const refreshGitStatusLocal = useCallback(async () => {
    try {
      const status = await api.gitBackupStatus();
      setGitStatus(status);
    } catch {
      // not critical
    }
  }, []);

  const refreshGitVersions = useCallback(async () => {
    if (!gitStatus?.is_repo) {
      setGitVersions([]);
      return;
    }
    setGitVersionsLoading(true);
    try {
      const versions = await api.gitBackupListVersions(30);
      setGitVersions(versions);
    } catch {
      setGitVersions([]);
    } finally {
      setGitVersionsLoading(false);
    }
  }, [gitStatus?.is_repo]);

  useEffect(() => {
    (async () => {
      const savedRemote = (await api.getSettings("git_backup_remote_url").catch(() => null))?.trim() || "";
      const status = await api.gitBackupStatus().catch(() => null);
      setGitStatus(status);
      // The saved setting is the single source of truth. Do not backfill from
      // `.git/config` — that made a cleared URL reappear after disconnect (#260).
      setGitRemoteConfig(savedRemote);
    })();
  }, []);

  useEffect(() => {
    const handleWindowFocus = () => {
      refreshGitStatus();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshGitStatus();
      }
    };

    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshGitStatus]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      refreshGitStatusLocal();
    }, 400);
    return () => window.clearTimeout(timer);
  }, [skills, refreshGitStatusLocal]);

  useEffect(() => {
    if (gitVersionsOpen && gitStatus?.is_repo) {
      refreshGitVersions();
    }
  }, [gitVersionsOpen, gitStatus?.is_repo, refreshGitVersions]);

  useEffect(() => {
    let cancelled = false;
    const loadToggles = async () => {
      if (!selectedSkill || !viewedPreset) {
        setToolToggles(null);
        return;
      }
      if (!selectedSkill.preset_ids.includes(viewedPreset.id)) {
        setToolToggles(null);
        return;
      }
      try {
        const toggles = await api.getSkillToolToggles(selectedSkill.id, viewedPreset.id);
        if (!cancelled) setToolToggles(toggles);
      } catch {
        if (!cancelled) setToolToggles(null);
      }
    };
    loadToggles();
    return () => {
      cancelled = true;
    };
  }, [selectedSkill, viewedPreset]);

  const handleToggleSkillTool = async (toolKey: string, enabled: boolean) => {
    if (!selectedSkill || !viewedPreset) return;
    setTogglingToolKey(toolKey);
    try {
      await api.setSkillToolToggle(selectedSkill.id, viewedPreset.id, toolKey, enabled);
      const displayName = getToolDisplayName(toolKey, tools);
      toast.success(
        enabled
          ? t("mySkills.agentToggleEnabled", { agent: displayName })
          : t("mySkills.agentToggleDisabled", { agent: displayName })
      );
      const [, toggles] = await Promise.all([
        refreshManagedSkills(),
        api.getSkillToolToggles(selectedSkill.id, viewedPreset.id),
      ]);
      setToolToggles(toggles);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, t("common.error")));
      await refreshManagedSkills();
    } finally {
      setTogglingToolKey(null);
    }
  };

  const handleToggleSkillTarget = useCallback(
    async (skill: ManagedSkill, toolKey: string, enabled: boolean) => {
      if (togglingTarget) return;
      setTogglingTarget({ skillId: skill.id, tool: toolKey });
      const displayName = getToolDisplayName(toolKey, tools);
      try {
        if (enabled) {
          await api.syncSkillToTool(skill.id, toolKey);
          toast.success(t("mySkills.targetInstalled", { name: skill.name, agent: displayName }));
        } else {
          await api.unsyncSkillFromTool(skill.id, toolKey);
          toast.success(t("mySkills.targetUninstalled", { name: skill.name, agent: displayName }));
        }
        await refreshManagedSkills();
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, t("common.error")));
        await refreshManagedSkills();
      } finally {
        setTogglingTarget(null);
      }
    },
    [togglingTarget, tools, t, refreshManagedSkills]
  );

  const scheduleRefreshAfterDelete = useCallback(() => {
    if (refreshAfterDeleteRef.current !== null) {
      window.clearTimeout(refreshAfterDeleteRef.current);
    }
    refreshAfterDeleteRef.current = window.setTimeout(() => {
      refreshAfterDeleteRef.current = null;
      void Promise.all([refreshManagedSkills(), refreshPresets()]);
    }, 300);
  }, [refreshManagedSkills, refreshPresets]);

  useEffect(() => {
    return () => {
      if (refreshAfterDeleteRef.current !== null) {
        window.clearTimeout(refreshAfterDeleteRef.current);
      }
    };
  }, []);

  const handleDeleteSkill = useCallback(
    (skill: ManagedSkill) => {
      setDeletingIds((prev) => {
        if (prev.has(skill.id)) return prev;
        const next = new Set(prev);
        next.add(skill.id);
        return next;
      });
      void (async () => {
        try {
          await api.deleteManagedSkill(skill.id);
          if (selectedSkill?.id === skill.id) closeSkillDetail();
          toast.success(`${skill.name} ${t("mySkills.deleted")}`);
        } catch (error: unknown) {
          toast.error(getErrorMessage(error, t("common.error")));
        } finally {
          setDeletingIds((prev) => {
            if (!prev.has(skill.id)) return prev;
            const next = new Set(prev);
            next.delete(skill.id);
            return next;
          });
          scheduleRefreshAfterDelete();
        }
      })();
    },
    [selectedSkill, closeSkillDetail, t, scheduleRefreshAfterDelete]
  );

  const handleBatchDelete = async () => {
    const ids = Array.from(selectedIds);
    try {
      const result = await api.deleteManagedSkills(ids);
      if (selectedSkill && ids.includes(selectedSkill.id) && !result.failed.includes(selectedSkill.id)) {
        closeSkillDetail();
      }
      if (result.deleted > 0) {
        toast.success(t("mySkills.batchDeleted", { count: result.deleted }));
      }
      if (result.failed.length > 0) {
        toast.error(t("mySkills.batchDeleteFailed", { count: result.failed.length }));
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, t("common.error")));
    } finally {
      exitMultiSelect();
      setBatchDeleteConfirm(false);
      await Promise.all([refreshManagedSkills(), refreshPresets()]);
    }
  };

  const handleBatchEditTags = async (adds: string[], removes: string[]) => {
    const selectedSkillsList = skills.filter((s) => selectedIds.has(s.id));
    let updated = 0;
    let failed = 0;
    for (const skill of selectedSkillsList) {
      const removeSet = new Set(removes);
      const remaining = skill.tags.filter((tag) => !removeSet.has(tag));
      const merged = [...remaining];
      for (const tag of adds) {
        if (!merged.includes(tag)) merged.push(tag);
      }
      const changed =
        merged.length !== skill.tags.length ||
        merged.some((tag, i) => tag !== skill.tags[i]);
      if (!changed) continue;
      try {
        await api.setSkillTags(skill.id, merged);
        updated++;
      } catch {
        failed++;
      }
    }
    if (updated > 0) {
      toast.success(t("mySkills.batchTagsUpdated", { count: updated }));
    }
    if (failed > 0) {
      toast.error(t("mySkills.batchTagsFailed", { count: failed }));
    }
    await refreshManagedSkills();
    await refreshAllTags();
  };

  const handleBatchTogglePreset = async () => {
    if (!viewedPreset) return;
    const selectedSkillsList = skills.filter((s) => selectedIds.has(s.id));
    const enabling = anyDisabled;
    let count = 0;
    let failed = 0;
    for (const skill of selectedSkillsList) {
      try {
        const enabledInPreset = skill.preset_ids.includes(viewedPreset.id);
        if (enabling && !enabledInPreset) {
          await api.addSkillToPreset(skill.id, viewedPreset.id);
          count++;
        } else if (!enabling && enabledInPreset) {
          await api.removeSkillFromPreset(skill.id, viewedPreset.id);
          count++;
        }
      } catch {
        failed++;
        // continue with remaining
      }
    }
    if (count > 0) {
      toast.success(enabling
        ? t("mySkills.batchEnabled", { count })
        : t("mySkills.batchDisabled", { count }));
    }
    if (failed > 0) {
      toast.error(t("mySkills.batchToggleFailed", { count: failed }));
    }
    await Promise.all([refreshManagedSkills(), refreshPresets()]);
  };

  const handleBatchRefresh = async () => {
    const refreshableSkills = skills.filter((skill) => selectedIds.has(skill.id) && canRefresh(skill));
    if (refreshableSkills.length === 0) return;

    setBatchUpdating(true);
    try {
      const result = await api.batchUpdateSkills(refreshableSkills.map((skill) => skill.id));
      if (result.refreshed > 0) {
        toast.success(t("mySkills.batchUpdated", { count: result.refreshed }));
      }
      if (result.unchanged > 0) {
        toast.info(t("mySkills.batchAlreadyUpToDate", { count: result.unchanged }));
      }
      if (result.failed.length > 0) {
        toast.error(t("mySkills.batchUpdateFailed", { count: result.failed.length }));
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, t("common.error")));
    } finally {
      await refreshManagedSkills();
      setBatchUpdating(false);
    }
  };

  const handleUpdateAvailableSkills = async () => {
    const updatableSkills = skills.filter(
      (skill) => skill.update_status === "update_available" && canRefresh(skill)
    );
    if (updatableSkills.length === 0) return;

    setBatchUpdating(true);
    try {
      const result = await api.batchUpdateSkills(updatableSkills.map((skill) => skill.id));
      if (result.refreshed > 0) {
        toast.success(t("mySkills.batchUpdated", { count: result.refreshed }));
      }
      if (result.unchanged > 0) {
        toast.info(t("mySkills.batchAlreadyUpToDate", { count: result.unchanged }));
      }
      if (result.failed.length > 0) {
        toast.error(t("mySkills.batchUpdateFailed", { count: result.failed.length }));
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, t("common.error")));
    } finally {
      await refreshManagedSkills();
      setBatchUpdating(false);
    }
  };

  const handleTogglePreset = async (skill: ManagedSkill) => {
    if (!viewedPreset) return;
    const enabledInPreset = skill.preset_ids.includes(viewedPreset.id);
    if (enabledInPreset) {
      await api.removeSkillFromPreset(skill.id, viewedPreset.id);
      toast.success(`${skill.name} ${t("mySkills.disabledInPreset")}`);
    } else {
      await api.addSkillToPreset(skill.id, viewedPreset.id);
      toast.success(`${skill.name} ${t("mySkills.enabledInPreset")}`);
    }
    await Promise.all([refreshManagedSkills(), refreshPresets()]);
  };

  const handleCheckAllUpdates = async () => {
    setCheckingAll(true);
    try {
      await api.checkAllSkillUpdates(true);
      toast.success(t("mySkills.updateActions.checkedAll"));
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, t("common.error")));
    } finally {
      await refreshManagedSkills();
      setCheckingAll(false);
    }
  };

  const handleCheckUpdate = async (skill: ManagedSkill) => {
    setCheckingSkillId(skill.id);
    try {
      await api.checkSkillUpdate(skill.id, true);
      await refreshManagedSkills();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, t("common.error")));
      await refreshManagedSkills();
    } finally {
      setCheckingSkillId(null);
    }
  };

  const handleRefreshSkill = async (skill: ManagedSkill) => {
    setUpdatingSkillId(skill.id);
    try {
      if (skill.source_type === "local" || skill.source_type === "import") {
        await api.reimportLocalSkill(skill.id);
        toast.success(t("mySkills.updateActions.reimported"));
      } else {
        const result = await api.updateSkill(skill.id);
        if (result.content_changed) {
          toast.success(t("mySkills.updateActions.updated"));
        } else {
          toast.info(t("mySkills.updateActions.alreadyUpToDate"));
        }
      }
      await refreshManagedSkills();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, t("common.error")));
      await refreshManagedSkills();
    } finally {
      setUpdatingSkillId(null);
    }
  };

  const handleRelinkSource = async (skill: ManagedSkill) => {
    const selected = await dialogOpen({ directory: true, multiple: false });
    if (!selected || Array.isArray(selected)) return;

    setUpdatingSkillId(skill.id);
    try {
      await api.relinkLocalSkillSource(skill.id, selected);
      toast.success(t("mySkills.updateActions.relinked"));
      await refreshManagedSkills();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, t("common.error")));
      await refreshManagedSkills();
    } finally {
      setUpdatingSkillId(null);
    }
  };

  const handleDetachSource = async (skill: ManagedSkill) => {
    setUpdatingSkillId(skill.id);
    try {
      await api.detachLocalSkillSource(skill.id);
      toast.success(t("mySkills.updateActions.detachedSource"));
      await refreshManagedSkills();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, t("common.error")));
      await refreshManagedSkills();
    } finally {
      setUpdatingSkillId(null);
    }
  };

  const handleAddTag = async (skill: ManagedSkill, inputValue?: string) => {
    const trimmed = (inputValue ?? tagInput).trim();
    if (!trimmed || skill.tags.includes(trimmed)) {
      setTagInput("");
      return;
    }
    try {
      await api.setSkillTags(skill.id, [...skill.tags, trimmed]);
      toast.success(t("mySkills.tags.tagAdded"));
      setTagEditSkillId(null);
      setTagInput("");
      await refreshManagedSkills();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, t("common.error")));
    }
  };

  const handleRemoveTag = async (skill: ManagedSkill, tagToRemove: string) => {
    try {
      await api.setSkillTags(skill.id, skill.tags.filter((t) => t !== tagToRemove));
      toast.success(t("mySkills.tags.tagsUpdated"));
      await refreshManagedSkills();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, t("common.error")));
    }
  };

  // Replace `oldTag` with `newTag` in the active filter set so the current
  // filtering survives a rename/delete.
  const replaceTagInFilters = (oldTag: string, newTag?: string) =>
    setTagFilters((prev) => {
      if (!prev.has(oldTag)) return prev;
      const next = new Set(prev);
      next.delete(oldTag);
      if (newTag) next.add(newTag);
      return next;
    });

  // Throws on failure so the rename dialog stays open (it only closes after a
  // resolved onRename), matching how RenamePresetDialog behaves.
  const handleRenameTag = async (newName: string) => {
    const oldName = tagToRename;
    if (oldName === null) return;
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) return;
    try {
      await api.renameTag(oldName, trimmed);
      replaceTagInFilters(oldName, trimmed);
      toast.success(t("mySkills.tags.tagRenamed"));
      await refreshManagedSkills();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, t("common.error")));
      throw error;
    }
  };

  const handleDeleteTag = async () => {
    const tag = tagToDelete;
    if (tag === null) return;
    try {
      await api.deleteTag(tag);
      replaceTagInFilters(tag);
      toast.success(t("mySkills.tags.tagDeleted"));
      await refreshManagedSkills();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, t("common.error")));
    }
  };

  const getTagOptions = (skill: ManagedSkill, keyword: string) => {
    const needle = keyword.trim().toLowerCase();
    return allTags.filter((tag) => {
      if (skill.tags.includes(tag)) return false;
      if (!needle) return true;
      return tag.toLowerCase().includes(needle);
    });
  };

  const handleSetupClone = async () => {
    setGitLoading("start");
    try {
      await api.gitBackupClone(gitRemoteConfig);
      toast.success(t("settings.gitCloneSuccess"));
      await refreshGitStatus();
    } catch (e) {
      toast.error(mapGitError(e));
      throw e;
    } finally {
      setGitLoading(null);
    }
  };

  const handleSetupInit = async () => {
    setGitLoading("start");
    try {
      await api.gitBackupInit();
      // If a remote is configured, attach it so the toolbar reflects "needs first push"
      // rather than "synced", and the next click of Sync can push -u origin <branch>.
      if (gitRemoteConfig) {
        try {
          await api.gitBackupSetRemote(gitRemoteConfig);
        } catch (remoteErr) {
          toast.error(mapGitError(remoteErr));
        }
      }
      toast.success(t("settings.gitInitSuccess"));
      await refreshGitStatus();
    } catch (e) {
      toast.error(mapGitError(e));
      throw e;
    } finally {
      setGitLoading(null);
    }
  };

  const handleRecoveryReclone = async () => {
    if (!gitRemoteConfig) {
      toast.info(t("settings.gitNeedRemoteSetup"));
      return;
    }
    setGitLoading("recovery");
    try {
      await api.gitBackupReclone(gitRemoteConfig);
      toast.success(t("settings.gitRecoveryRecloneSuccess"));
      await Promise.all([refreshGitStatus(), refreshManagedSkills()]);
    } catch (e) {
      toast.error(mapGitError(e));
      throw e;
    } finally {
      setGitLoading(null);
    }
  };

  const handleGitSync = async () => {
    setGitLoading("sync");
    try {
      let status = await api.gitBackupStatus();
      if (!status.is_repo) {
        toast.info(t("settings.gitNotInitialized"));
        return;
      }

      if (!status.remote_url && gitRemoteConfig) {
        await api.gitBackupSetRemote(gitRemoteConfig);
        status = await api.gitBackupStatus();
      }

      if (!status.remote_url) {
        toast.info(t("settings.gitNeedRemoteSetup"));
        return;
      }

      // Pre-flight: surface structural problems that would corrupt or block sync.
      // `no_upstream` is intentionally NOT treated as fatal here — the backend's
      // push path retries with `push -u origin <branch>`, which is the correct
      // behavior for a freshly initialized repo or an empty remote. If that
      // retry actually fails we'll still route to the recovery dialog via the
      // post-failure handler below.
      if (
        status.upstream_health === "unrelated_histories"
        || status.upstream_health === "detached"
      ) {
        setRecoveryReason(status.upstream_health);
        setRecoveryOpen(true);
        return;
      }

      let committed = false;
      if (status.has_changes) {
        await api.gitBackupCommit(t("settings.gitCommitPlaceholder"));
        committed = true;
        status = await api.gitBackupStatus();
      }

      if (status.behind > 0) {
        await api.gitBackupPull();
        status = await api.gitBackupStatus();
        toast.success(t("settings.gitPullSuccess"));
      }

      // `no_upstream` means the local branch has commits but no remote-tracking
      // branch yet (fresh init against an empty remote). `ahead` reads 0 in that
      // state because there is no @{upstream} to diff against, so without this
      // the first push is silently skipped and the remote stays empty while we
      // report "Up to date". The backend push path sets upstream via `-u`.
      const needsPush =
        committed || status.ahead > 0 || status.upstream_health === "no_upstream";
      if (needsPush) {
        const snapshotTag = await api.gitBackupCreateSnapshot();
        await api.gitBackupPush();
        toast.success(t("mySkills.gitSyncSuccessWithVersion", { tag: displaySnapshotLabel(snapshotTag) }));
      } else {
        toast.success(t("settings.gitUpToDate"));
      }

      await refreshGitStatus();
      if (gitVersionsOpen) {
        await refreshGitVersions();
      }
    } catch (e) {
      // If sync failed because local/remote diverged, route the user into the recovery flow
      // instead of leaving them with a raw git error.
      if (isRecoverableSetupError(e)) {
        toast.error(mapGitError(e));
        await refreshGitStatus();
        setRecoveryReason(
          isSyncConflictError(e) ? "conflict" : (gitStatus?.upstream_health ?? "unrelated_histories")
        );
        setRecoveryOpen(true);
      } else {
        toast.error(mapGitError(e));
      }
    } finally {
      setGitLoading(null);
    }
  };

  const handleRestoreVersion = async () => {
    if (!restoreVersionTag) return;
    setRestoringVersionTag(restoreVersionTag);
    try {
      await api.gitBackupRestoreVersion(restoreVersionTag);
      toast.success(t("mySkills.gitVersionRestoreSuccess", { tag: displaySnapshotLabel(restoreVersionTag) }));
      toast.info(t("mySkills.gitVersionRestoreNeedSync"));
      await Promise.all([refreshGitStatus(), refreshGitVersions(), refreshManagedSkills()]);
      setRestoreVersionTag(null);
    } catch (error: unknown) {
      toast.error(mapGitError(error));
    } finally {
      setRestoringVersionTag(null);
    }
  };

  const getGitToolbarMode = (): GitToolbarMode => {
    if (!gitStatus) return "loading";
    if (!gitStatus.is_repo) return "uninitialized";
    if (!gitStatus.remote_url && !gitRemoteConfig) return "needs_remote";
    if (
      gitStatus.upstream_health === "unrelated_histories"
      || gitStatus.upstream_health === "detached"
    ) {
      return "needs_fix";
    }
    // First-push case: remote is set but upstream tracking is not yet established.
    // Treat as a normal pending sync — the push path will set upstream automatically.
    if (gitStatus.upstream_health === "no_upstream") {
      return "pending_changes";
    }
    if (gitStatus.has_changes || gitStatus.ahead > 0 || gitStatus.behind > 0) {
      return "pending_changes";
    }
    return "up_to_date";
  };

  const formatSnapshotWhen = (tag: string | null) => {
    if (!tag) return null;
    const label = displaySnapshotLabel(tag);
    // Try to format YYYYMMDD-HHMMSS into MM-DD HH:MM
    const match = label.match(/^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})$/);
    if (match) {
      const [, , month, day, hour, min] = match;
      return `${month}-${day} ${hour}:${min}`;
    }
    return label;
  };

  // Compact inline status: only render when there's actionable info the button alone
  // does not convey. The button already tells the user "Synced" / "Set Up Backup" /
  // "Fix Sync Setup", so we suppress redundant labels for those modes.
  const renderGitInlineStatus = (mode: GitToolbarMode) => {
    if (!gitStatus || mode === "loading" || mode === "up_to_date") return null;
    if (mode === "uninitialized" || mode === "needs_remote" || mode === "needs_fix") {
      return null;
    }
    const parts: string[] = [];
    if (gitStatus.has_changes || gitStatus.ahead > 0) {
      const localCount = Math.max(gitStatus.ahead, gitStatus.has_changes ? 1 : 0);
      parts.push(`↑${localCount}`);
    }
    if (gitStatus.behind > 0) {
      parts.push(`↓${gitStatus.behind}`);
    }
    if (parts.length === 0 && gitStatus.upstream_health === "no_upstream") {
      parts.push("↑");
    }
    if (parts.length === 0) return null;
    return (
      <span
        className="text-[11px] font-medium text-amber-600 dark:text-amber-400 tabular-nums"
        title={[
          gitStatus.has_changes || gitStatus.ahead > 0
            ? t("mySkills.gitInlineLocalChanges", { count: Math.max(gitStatus.ahead, gitStatus.has_changes ? 1 : 0) })
            : null,
          gitStatus.behind > 0 ? t("mySkills.gitInlineRemoteUpdates", { count: gitStatus.behind }) : null,
        ]
          .filter(Boolean)
          .join(" · ")}
      >
        {parts.join(" ")}
      </span>
    );
  };

  const sourceIcon = (type: string) => {
    switch (type) {
      case "git":
      case "skillssh":
        return <Github className="h-3 w-3" />;
      case "local":
      case "import":
        return <HardDrive className="h-3 w-3" />;
      default:
        return <Globe className="h-3 w-3" />;
    }
  };

  const canRefresh = (skill: ManagedSkill) =>
    skill.source_type === "git" ||
    skill.source_type === "skillssh" ||
    ((skill.source_type === "local" || skill.source_type === "import") && !!skill.source_ref);

  const anyRefreshableSelected = useMemo(
    () => skills.some((skill) => selectedIds.has(skill.id) && canRefresh(skill)),
    [skills, selectedIds]
  );
  const availableUpdateCount = useMemo(
    () => skills.filter((skill) => skill.update_status === "update_available" && canRefresh(skill)).length,
    [skills]
  );
  const refreshableSelectedCount = useMemo(
    () => skills.filter((skill) => selectedIds.has(skill.id) && canRefresh(skill)).length,
    [skills, selectedIds]
  );

  const sourceTypeLabel = (skill: ManagedSkill) =>
    skill.source_type === "skillssh" ? "skills.sh" : skill.source_type;

  const formatGitDateTime = (iso: string) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString();
  };

  const renderCurrentVersionText = () => {
    if (!gitStatus?.is_repo) return null;
    if (gitStatus.current_snapshot_tag) {
      return t("mySkills.gitCurrentVersionSnapshot", {
        tag: displaySnapshotLabel(gitStatus.current_snapshot_tag),
      });
    }
    if (gitStatus.restored_from_tag) {
      return t("mySkills.gitCurrentVersionRestored", {
        tag: displaySnapshotLabel(gitStatus.restored_from_tag),
      });
    }
    return t("mySkills.gitCurrentVersionUnknown");
  };

  const refreshLabel = (skill: ManagedSkill) =>
    skill.source_type === "local" || skill.source_type === "import"
      ? t("mySkills.updateActions.reimport")
      : t("mySkills.updateActions.update");

  const statusBadge = (skill: ManagedSkill) => {
    if (skill.update_status === "update_available") {
      return {
        label: "Update",
        className: "bg-amber-500/12 text-amber-600 dark:text-amber-400",
      };
    }
    if (skill.update_status === "source_missing") {
      return {
        label: t("mySkills.updateStatus.sourceMissing"),
        className: "bg-red-500/10 text-red-600 dark:text-red-300",
      };
    }
    if (skill.update_status === "error") {
      return {
        label: t("mySkills.updateStatus.error"),
        className: "bg-red-500/10 text-red-600 dark:text-red-300",
      };
    }
    return null;
  };

  return (
    <div className="app-page">
      <div className="app-page-header pr-2 pb-1 flex items-center justify-between gap-3">
        <h1 className="app-page-title flex items-center gap-2">
          {t("mySkills.title")}
          <span className="app-badge">
            {skills.length}
          </span>
        </h1>

      </div>

      <div className="app-toolbar">
        <MySkillsSearchControls
          search={search}
          onSearchChange={setSearch}
          filterMode={filterMode}
          onFilterModeChange={setFilterMode}
        />

        <div className="app-segmented">
          {(() => {
            const mode = getGitToolbarMode();
            return (
              <GitToolbarControls
                mode={mode}
                inlineStatus={renderGitInlineStatus(mode)}
                gitLoading={gitLoading}
                isRepo={!!gitStatus?.is_repo}
                snapshotWhen={formatSnapshotWhen(gitStatus?.current_snapshot_tag ?? null)}
                gitVersionsOpen={gitVersionsOpen}
                onOpenSetup={() => setSetupOpen(true)}
                onOpenRecovery={() => {
                  setRecoveryReason(gitStatus?.upstream_health ?? "unrelated_histories");
                  setRecoveryOpen(true);
                }}
                onSync={handleGitSync}
                onToggleSnapshots={() => setGitVersionsOpen((value) => !value)}
              />
            );
          })()}
          <Button
            variant="ghost"
            onClick={handleCheckAllUpdates}
            disabled={checkingAll}
            className="ml-2 mr-2 border-l border-border-subtle pl-4 pr-3 py-2"
            icon={<RefreshCw className={cn("h-3.5 w-3.5", checkingAll && "animate-spin")} />}
          >
            {t("mySkills.updateActions.checkAll")}
          </Button>
          <Button
            variant="ghost"
            onClick={handleUpdateAvailableSkills}
            disabled={batchUpdating || availableUpdateCount === 0}
            className="mr-2 px-3 py-2 text-accent-light hover:bg-accent-bg hover:text-accent-light"
            icon={<RotateCcw className={cn("h-3.5 w-3.5", batchUpdating && "animate-spin")} />}
          >
            {t("mySkills.updateActions.updateAvailable", { count: availableUpdateCount })}
          </Button>
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "rounded-md p-2 transition-colors outline-none",
              viewMode === "grid" ? "bg-surface-active text-secondary" : "text-muted hover:text-tertiary"
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "rounded-md p-2 transition-colors outline-none",
              viewMode === "list" ? "bg-surface-active text-secondary" : "text-muted hover:text-tertiary"
            )}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => isMultiSelect ? exitMultiSelect() : setIsMultiSelect(true)}
            className={cn(
              "rounded-md p-2 transition-colors outline-none",
              isMultiSelect ? "bg-surface-active text-secondary" : "text-muted hover:text-tertiary"
            )}
            title={isMultiSelect ? t("mySkills.cancelSelect") : t("mySkills.selectMode")}
          >
            <SquareCheck className="h-4 w-4" />
          </button>
        </div>
      </div>

      <MySkillsFilterBar
        skills={skills}
        sourceFilters={sourceFilters}
        tagFilters={tagFilters}
        allTags={allTags}
        onSourceFilterToggle={(source) => setSourceFilters(toggleFilter(sourceFilters, source))}
        onTagFilterToggle={(tag) => setTagFilters(toggleFilter(tagFilters, tag))}
        onUntaggedFilterToggle={() => setTagFilters(toggleTagFilter(tagFilters, UNTAGGED_FILTER))}
        onTagContextMenu={(tag, event) => {
          event.preventDefault();
          setTagMenu({
            tag,
            x: Math.min(event.clientX, window.innerWidth - 160),
            y: Math.min(event.clientY, window.innerHeight - 90),
          });
        }}
      />

      {isMultiSelect && (
        <MultiSelectToolbar
          selectedCount={selectedIds.size}
          isAllSelected={isAllSelected}
          anyDisabled={viewedPreset ? anyDisabled : false}
          anyUpdatable={anyRefreshableSelected}
          showToggle={!!viewedPreset}
          updating={batchUpdating}
          labels={{
            hint: t("mySkills.selectHint"),
            selected: t("mySkills.selectedCount", { count: selectedIds.size }),
            update: t("mySkills.batchUpdate", { count: refreshableSelectedCount }),
            delete: t("mySkills.deleteSelected", { count: selectedIds.size }),
            enable: t("mySkills.batchEnable", { count: selectedIds.size }),
            disable: t("mySkills.batchDisable", { count: selectedIds.size }),
            selectAll: t("mySkills.selectAll"),
            deselectAll: t("mySkills.deselectAll"),
            cancel: t("common.cancel"),
            editTags: t("mySkills.batchEditTags", { count: selectedIds.size }),
          }}
          onUpdate={handleBatchRefresh}
          onDelete={() => setBatchDeleteConfirm(true)}
          onToggle={handleBatchTogglePreset}
          onSelectAll={handleSelectAll}
          onCancel={exitMultiSelect}
          onEditTags={() => setBatchTagDialogOpen(true)}
        />
      )}

      {gitVersionsOpen && gitStatus?.is_repo && (
        <GitSnapshotPanel
          currentVersionText={renderCurrentVersionText()}
          versions={gitVersions}
          loading={gitVersionsLoading}
          gitBusy={!!gitLoading}
          restoringVersionTag={restoringVersionTag}
          onRefresh={refreshGitVersions}
          onRestoreVersion={setRestoreVersionTag}
          displaySnapshotLabel={displaySnapshotLabel}
          formatGitDateTime={formatGitDateTime}
        />
      )}

      {filtered.length === 0 ? (
        <EmptyState
          className="flex-1 pb-20"
          icon={<Layers className="h-12 w-12" />}
          title={t("mySkills.noSkills")}
          description={skills.length === 0 ? t("mySkills.addFirst") : t("mySkills.noMatch")}
        />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={filtered.map((s) => s.id)}
            strategy={viewMode === "grid" ? rectSortingStrategy : verticalListSortingStrategy}
          >
          <div
            className={cn(
              "pb-8",
              viewMode === "grid"
                ? "grid grid-cols-2 gap-3 lg:grid-cols-3"
                : "flex flex-col gap-0.5"
            )}
          >
          {filtered.map((skill) => {
            const enabledInPreset = viewedPreset
              ? skill.preset_ids.includes(viewedPreset.id)
              : false;
            const badge = statusBadge(skill);
            const isMissingLocalSource =
              skill.update_status === "source_missing"
              && (skill.source_type === "local" || skill.source_type === "import");
            const displayName = skillDisplayNames.get(skill.id) || skill.name;

            if (viewMode === "grid") {
              return (
                <SortableSkillItem
                  key={skill.id}
                  id={skill.id}
                  disabled={!canDrag}
                  className={tagEditSkillId === skill.id ? "relative z-30" : undefined}
                >
                {(dragHandle) => (
                <SkillCardShell
                  viewMode="grid"
                  active={enabledInPreset}
                  selected={isMultiSelect && selectedIds.has(skill.id)}
                  className={tagEditSkillId === skill.id ? "overflow-visible" : undefined}
                  onClick={() =>
                    isMultiSelect ? toggleSelect(skill.id) : openSkillDetailById(skill.id)
                  }
                >
                  <div className={cn("absolute right-2 top-2 z-10 flex items-center gap-0.5 rounded-lg border border-border-subtle bg-surface px-1 py-0.5 opacity-0 shadow-sm transition-all", !isMultiSelect && "group-hover:opacity-100")}>
                    {dragHandle}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCheckUpdate(skill); }}
                      disabled={checkingSkillId === skill.id}
                      className="rounded p-1 text-muted transition-colors hover:bg-surface-hover hover:text-secondary disabled:opacity-50"
                      title={t("mySkills.updateActions.check")}
                    >
                      <RefreshCw className={cn("h-3.5 w-3.5", checkingSkillId === skill.id && "animate-spin")} />
                    </button>
                    {canRefresh(skill) ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRefreshSkill(skill); }}
                        disabled={updatingSkillId === skill.id}
                        className="rounded p-1 text-accent-light transition-colors hover:bg-accent-bg disabled:opacity-50"
                        title={refreshLabel(skill)}
                      >
                        <RotateCcw className={cn("h-3.5 w-3.5", updatingSkillId === skill.id && "animate-spin")} />
                      </button>
                    ) : null}
                    <DeleteSkillButton
                      skill={skill}
                      onConfirm={handleDeleteSkill}
                      buttonClassName="p-1"
                    />
                  </div>
                  {deletingIds.has(skill.id) && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center rounded-xl bg-surface/70 backdrop-blur-[1px]">
                      <Loader2 className="h-5 w-5 animate-spin text-muted" />
                    </div>
                  )}

                  <div className="flex items-center gap-2.5 px-3.5 pr-20 pt-3 pb-1.5">
                    {isMultiSelect && (
                      selectedIds.has(skill.id)
                        ? <SquareCheck className="h-3.5 w-3.5 shrink-0 text-accent" />
                        : <Square className="h-3.5 w-3.5 shrink-0 text-faint" />
                    )}
                    <h3
                      className="flex-1 truncate text-[14px] font-semibold text-primary group-hover:text-accent-light"
                      title={displayName}
                    >
                      {displayName}
                    </h3>
                  </div>

                  <div className="px-3.5 pb-3">
                    <p className="text-[13px] leading-[18px] text-muted truncate">
                      {skill.description || "—"}
                    </p>
                    {badge && (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[13px] font-medium",
                            badge.className
                          )}
                        >
                          {badge.label}
                        </span>
                        {isMissingLocalSource && (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRelinkSource(skill); }}
                              disabled={updatingSkillId === skill.id}
                              className="rounded-full border border-border-subtle px-2 py-0.5 text-[12px] font-medium text-secondary transition-colors hover:bg-surface-hover disabled:opacity-50"
                            >
                              {t("mySkills.updateActions.relink")}
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDetachSource(skill); }}
                              disabled={updatingSkillId === skill.id}
                              className="rounded-full border border-border-subtle px-2 py-0.5 text-[12px] font-medium text-muted transition-colors hover:bg-surface-hover hover:text-secondary disabled:opacity-50"
                            >
                              {t("mySkills.updateActions.detachSource")}
                            </button>
                          </>
                        )}
                      </div>
                    )}
                    <SkillTagEditor
                      skill={skill}
                      allTags={allTags}
                      editing={tagEditSkillId === skill.id}
                      tagInput={tagInput}
                      inputRef={tagInputRef}
                      tagOptions={getTagOptions(skill, tagInput)}
                      onTagInputChange={setTagInput}
                      onAddTag={handleAddTag}
                      onRemoveTag={handleRemoveTag}
                      onStartEdit={(skillId) => { setTagEditSkillId(skillId); setTagInput(""); }}
                      onCancelEdit={() => { setTagEditSkillId(null); setTagInput(""); }}
                    />
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-2 border-t border-border-subtle px-3.5 py-2.5">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span className="inline-flex shrink-0 items-center gap-1 text-[13px] text-muted">
                        {sourceIcon(skill.source_type)}
                        {sourceTypeLabel(skill)}
                      </span>
                      {enabledInPreset && (
                        <>
                          <span className="text-faint">·</span>
                          <span className="truncate text-[13px] font-medium text-amber-600 dark:text-amber-400/80">
                            {viewedPresetName}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <SyncDots
                        skill={skill}
                        tools={tools}
                        limit={6}
                        onToggle={
                          isMultiSelect
                            ? undefined
                            : (tool, enabled) => handleToggleSkillTarget(skill, tool, enabled)
                        }
                        pendingKey={togglingTarget?.skillId === skill.id ? togglingTarget.tool : null}
                      />
                      <SkillCardActions
                        skill={skill}
                        variant="grid"
                        enabledInPreset={enabledInPreset}
                        isMissingLocalSource={false}
                        isMultiSelect={isMultiSelect}
                        hasViewedPreset={!!viewedPreset}
                        checking={checkingSkillId === skill.id}
                        updating={updatingSkillId === skill.id}
                        canRefresh={canRefresh(skill)}
                        refreshLabel={refreshLabel(skill)}
                        onRelinkSource={handleRelinkSource}
                        onDetachSource={handleDetachSource}
                        onTogglePreset={handleTogglePreset}
                        onCheckUpdate={handleCheckUpdate}
                        onRefreshSkill={handleRefreshSkill}
                        onDeleteSkill={handleDeleteSkill}
                      />
                    </div>
                  </div>
                </SkillCardShell>
                )}
                </SortableSkillItem>
              );
            }

            return (
              <SortableSkillItem key={skill.id} id={skill.id} disabled={!canDrag}>
              {(dragHandle) => (
              <SkillCardShell
                viewMode="list"
                active={enabledInPreset}
                selected={isMultiSelect && selectedIds.has(skill.id)}
                onClick={() =>
                  isMultiSelect ? toggleSelect(skill.id) : openSkillDetailById(skill.id)
                }
              >
                {deletingIds.has(skill.id) && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center rounded-xl bg-surface/70 backdrop-blur-[1px]">
                    <Loader2 className="h-5 w-5 animate-spin text-muted" />
                  </div>
                )}
                {dragHandle}
                {isMultiSelect && (
                  selectedIds.has(skill.id)
                    ? <SquareCheck className="h-3.5 w-3.5 shrink-0 text-accent" />
                    : <Square className="h-3.5 w-3.5 shrink-0 text-faint" />
                )}

                <h3
                  className="w-[180px] shrink-0 truncate text-[14px] font-semibold text-secondary group-hover:text-primary"
                  title={displayName}
                >
                  {displayName}
                </h3>

                <p className="min-w-0 flex-1 truncate text-[13px] text-muted">
                  {skill.description || "—"}
                </p>

                <div className="flex shrink-0 items-center gap-1.5">
                  {skill.tags.map((tag) => (
                    <span
                      key={tag}
                      className={cn(
                        "inline-flex items-center rounded-full px-1.5 py-0.5 text-[11px] font-medium",
                        getTagColor(tag, allTags)
                      )}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex shrink-0 items-center gap-2.5">
                  {badge && (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[12px] font-medium",
                        badge.className
                      )}
                    >
                      {badge.label}
                    </span>
                  )}
                  <SyncDots
                    skill={skill}
                    tools={tools}
                    limit={6}
                    size="sm"
                    onToggle={
                      isMultiSelect
                        ? undefined
                        : (tool, enabled) => handleToggleSkillTarget(skill, tool, enabled)
                    }
                    pendingKey={togglingTarget?.skillId === skill.id ? togglingTarget.tool : null}
                  />
                  <span className="inline-flex items-center gap-1 text-[13px] text-muted">
                    {sourceIcon(skill.source_type)}
                    {sourceTypeLabel(skill)}
                  </span>
                  {enabledInPreset && (
                    <span className="text-[13px] font-medium text-amber-600 dark:text-amber-400/80">
                      {viewedPresetName}
                    </span>
                  )}
                </div>

                <SkillCardActions
                  skill={skill}
                  variant="list"
                  enabledInPreset={enabledInPreset}
                  isMissingLocalSource={isMissingLocalSource}
                  isMultiSelect={isMultiSelect}
                  hasViewedPreset={!!viewedPreset}
                  checking={checkingSkillId === skill.id}
                  updating={updatingSkillId === skill.id}
                  canRefresh={canRefresh(skill)}
                  refreshLabel={refreshLabel(skill)}
                  onRelinkSource={handleRelinkSource}
                  onDetachSource={handleDetachSource}
                  onTogglePreset={handleTogglePreset}
                  onCheckUpdate={handleCheckUpdate}
                  onRefreshSkill={handleRefreshSkill}
                  onDeleteSkill={handleDeleteSkill}
                />
              </SkillCardShell>
              )}
              </SortableSkillItem>
            );
          })}
        </div>
          </SortableContext>
        </DndContext>
      )}

      <SkillDetailPanel
        key={selectedSkill?.id ?? "skill-detail-empty"}
        skill={selectedSkill}
        onClose={closeSkillDetail}
        tools={tools}
        toolToggles={toolToggles}
        togglingTool={togglingToolKey}
        onToggleTool={handleToggleSkillTool}
        projects={projects}
        onProjectsChanged={refreshProjects}
      />

      <ConfirmDialog
        open={batchDeleteConfirm}
        message={t("mySkills.batchDeleteConfirm", { count: selectedIds.size })}
        onClose={() => setBatchDeleteConfirm(false)}
        onConfirm={handleBatchDelete}
      />
      <ConfirmDialog
        open={tagToDelete !== null}
        title={t("mySkills.tags.deleteTag")}
        message={t("mySkills.tags.deleteConfirm", { tag: tagToDelete || "" })}
        onClose={() => setTagToDelete(null)}
        onConfirm={handleDeleteTag}
      />
      <TagRenameDialog
        open={tagToRename !== null}
        currentName={tagToRename || ""}
        onClose={() => setTagToRename(null)}
        onRename={handleRenameTag}
      />
      {tagMenu && (
        <>
          {/* Backdrop closes on left- or right-click outside the menu. Explicit
              z-index (z-40/z-50) to avoid the macOS WKWebView stacking bug. */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setTagMenu(null)}
            onContextMenu={(e) => {
              e.preventDefault();
              setTagMenu(null);
            }}
          />
          <div
            className="fixed z-50 min-w-[140px] overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-2xl"
            style={{ top: tagMenu.y, left: tagMenu.x }}
          >
            <button
              onClick={() => {
                setTagToRename(tagMenu.tag);
                setTagMenu(null);
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] text-secondary hover:bg-surface-hover"
            >
              <Pencil className="h-3.5 w-3.5" />
              {t("mySkills.tags.renameTag")}
            </button>
            <button
              onClick={() => {
                setTagToDelete(tagMenu.tag);
                setTagMenu(null);
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] text-red-400 hover:bg-surface-hover"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {t("mySkills.tags.deleteTag")}
            </button>
          </div>
        </>
      )}
      <BatchTagDialog
        open={batchTagDialogOpen}
        skills={skills.filter((s) => selectedIds.has(s.id))}
        allTags={allTags}
        onClose={() => setBatchTagDialogOpen(false)}
        onApply={handleBatchEditTags}
      />
      <ConfirmDialog
        open={restoreVersionTag !== null}
        title={t("mySkills.gitVersionRestoreTitle")}
        message={t("mySkills.gitVersionRestoreConfirm", { tag: displaySnapshotLabel(restoreVersionTag || "") })}
        tone="warning"
        confirmLabel={t("mySkills.gitVersionRestore")}
        onClose={() => setRestoreVersionTag(null)}
        onConfirm={handleRestoreVersion}
      />
      <GitSetupDialog
        open={setupOpen}
        hasRemote={!!gitRemoteConfig}
        onClose={() => setSetupOpen(false)}
        onClone={handleSetupClone}
        onInit={handleSetupInit}
      />
      <GitRecoveryDialog
        open={recoveryOpen}
        reason={recoveryReason}
        onClose={() => setRecoveryOpen(false)}
        onReclone={handleRecoveryReclone}
      />
    </div>
  );
}
