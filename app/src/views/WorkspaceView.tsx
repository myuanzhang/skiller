import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import {
  AlertTriangle,
  ChevronRight,
  Download,
  FileText,
  FolderOpen,
  Globe,
  LayoutGrid,
  List,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  CircleSlash,
  Tag,
  Trash2,
  Upload,
  Zap,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { cn } from "../utils";
import { useApp } from "../context/AppContext";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { PresetBar } from "../components/PresetBar";
import { AgentIcon } from "../components/AgentIcon";
import { DetailSheet } from "../components/DetailSheet";
import { SkillMarkdown } from "../components/SkillMarkdown";
import { DocumentDiffViewer } from "../components/DocumentDiffViewer";
import * as api from "../lib/tauri";
import type { ManagedSkill, ProjectSkill } from "../lib/tauri";import { getErrorMessage } from "../lib/error";
import { getTagActiveColor, getTagColor, UNTAGGED_FILTER } from "../lib/skillTags";
import { AddSkillsSheet } from "../components/AddSkillsSheet";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { DocumentSkeleton, SkeletonRows } from "../components/ui/Skeleton";
import { SkillCardShell } from "../components/ui/SkillCardShell";
import { StatusPill } from "../components/ui/StatusPill";
import { syncStatusClass, type SyncStatusTone } from "../lib/statusPalette";
import type { WorkspaceConfig } from "./workspaceConfigs";

function compactHomePath(path: string) {
  return path.replace(/^\/Users\/[^/]+/, "~");
}

/** Short label for a scan dir, e.g. "/Users/x/.agents/skills" -> ".agents". */
function scanDirShortLabel(dir: string): string {
  const compact = compactHomePath(dir);
  const seg = compact.split("/").find((s) => s.startsWith("."));
  return seg ?? compact;
}

/**
 * Given a skill's absolute path and the agent's ordered scan dirs (primary
 * first), return the owning scan dir. Longest-prefix match handles nested roots.
 */
function ownerScanDir(skillPath: string, scanDirs: string[]): string | null {
  let best: string | null = null;
  for (const dir of scanDirs) {
    const prefix = dir.endsWith("/") ? dir : `${dir}/`;
    if (skillPath === dir || skillPath.startsWith(prefix)) {
      if (!best || dir.length > best.length) best = dir;
    }
  }
  return best;
}

/** Sentinel bucket key grouping all read-only (vendor/plugin) skills together. */
const READONLY_DIR_KEY = "__readonly__";

/**
 * Bucket key used by the directory filter. Read-only skills collapse into one
 * bucket regardless of which vendor dir they live in; everything else buckets
 * by its owning scan dir (primary or an additional shared dir like `.agents`).
 */
function skillDirBucketKey(skill: ProjectSkill, scanDirs: string[]): string {
  if (skill.read_only) return READONLY_DIR_KEY;
  return ownerScanDir(skill.path, scanDirs) ?? scanDirs[0] ?? "";
}

function buildBrokenSymlinkSkill(
  name: string,
  skillsDir: string,
  agent: string,
  agentDisplayName: string
): ProjectSkill {
  return {
    name,
    dir_name: name,
    relative_path: name,
    description: `${compactHomePath(skillsDir)}/${name}`,
    path: `${skillsDir}/${name}`,
    files: [],
    enabled: true,
    agent,
    agent_display_name: agentDisplayName,
    tags: [],
    in_center: false,
    sync_status: "project_only",
    center_skill_id: null,
  };
}

interface WorkspaceSkillCardTag {
  label: string;
  className: string;
}

interface WorkspaceSkillCardStatus {
  label: string;
  className: string;
}

function WorkspaceSkillCard({
  viewMode,
  title,
  description,
  tags = [],
  status,
  fileCount = 0,
  usageCount = 0,
  active = false,
  isBroken = false,
  sourceBadge,
  readOnly = null,
  conflictBadge = null,
  onOpenDir,
  openDirLabel,
  actions,
  actionsHover = false,
  onClick,
}: {
  viewMode: "grid" | "list";
  title: string;
  description?: string | null;
  tags?: WorkspaceSkillCardTag[];
  status: WorkspaceSkillCardStatus;
  fileCount?: number;
  /** How many times this skill was triggered under the current agent (0 = hide). */
  usageCount?: number;
  active?: boolean;
  isBroken?: boolean;
  /** Optional chip marking which non-primary scan dir this skill lives in. */
  sourceBadge?: { label: string; title: string; onClick?: () => void } | null;
  /** Vendor/plugin-managed: pre-translated chip label/hint. Implies no write actions. */
  readOnly?: { label: string; title: string } | null;
  /** Same-name skill exists in another scan dir of this agent (ambiguous which one the agent loads). */
  conflictBadge?: { label: string; title: string } | null;
  /** Opens the skill's own directory in the OS file browser. */
  onOpenDir?: () => void;
  openDirLabel?: string;
  actions?: ReactNode;
  actionsHover?: boolean;
  onClick?: () => void;
}) {
  const { t } = useTranslation();
  const usageBadge =
    usageCount > 0 ? (
      <span
        className="flex shrink-0 items-center gap-1 text-[12px] text-faint"
        title={t("mySkills.usage.count", { count: usageCount })}
      >
        <Zap className="h-3 w-3" />
        {usageCount}
      </span>
    ) : null;
  if (viewMode === "list") {
    return (
      <SkillCardShell
        viewMode="list"
        active={active}
        onClick={onClick}
        className={cn(isBroken && "cursor-default border-red-500/40 bg-red-500/5 hover:border-red-500/50 hover:bg-red-500/10")}
      >
        <h3
          className={cn(
            "w-[180px] shrink-0 truncate text-[14px] font-semibold",
            isBroken ? "text-red-600 line-through decoration-red-500/70 dark:text-red-300" : "text-secondary group-hover:text-primary"
          )}
          title={title}
        >
          {title}
        </h3>
        {readOnly && (
          <span
            title={readOnly.title}
            className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-warning-border bg-warning-bg px-1.5 py-0.5 text-[10px] font-medium text-warning"
          >
            <Lock className="h-2.5 w-2.5" />
            {readOnly.label}
          </span>
        )}
        {conflictBadge && (
          <span
            title={conflictBadge.title}
            className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-amber-500/40 bg-amber-500/12 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400"
          >
            <AlertTriangle className="h-2.5 w-2.5" />
            {conflictBadge.label}
          </span>
        )}
        {sourceBadge && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              sourceBadge.onClick?.();
            }}
            title={sourceBadge.title}
            className="inline-flex shrink-0 items-center rounded-full border border-info-border bg-info-bg px-1.5 py-0.5 font-mono text-[10px] font-medium text-info transition-colors hover:bg-info/15"
          >
            {sourceBadge.label}
          </button>
        )}
        <p className={cn(
          "min-w-0 flex-1 truncate text-[13px]",
          isBroken ? "text-red-600/80 line-through decoration-red-500/50 dark:text-red-300/80" : "text-muted"
        )}>
          {description || "-"}
        </p>
        {tags.length > 0 && (
          <div className="flex shrink-0 items-center gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag.label}
                className={cn(
                  "inline-flex items-center rounded-full px-1.5 py-0.5 text-[11px] font-medium",
                  tag.className
                )}
              >
                {tag.label}
              </span>
            ))}
          </div>
        )}
        <div className="flex shrink-0 items-center gap-2.5">
          <StatusPill className={status.className}>{status.label}</StatusPill>
          {usageBadge}
          {fileCount > 0 && (
            <span className="flex items-center gap-1 text-[12px] text-faint">
              <FileText className="h-3 w-3" />
              {fileCount}
            </span>
          )}
          {onOpenDir && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDir();
              }}
              title={openDirLabel}
              className="inline-flex shrink-0 items-center justify-center rounded-control p-0.5 text-muted transition-colors hover:bg-surface-hover hover:text-secondary"
            >
              <FolderOpen className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {actions && (
          <div
            className={cn(
              "flex shrink-0 items-center gap-1",
              actionsHover && "opacity-0 transition-opacity group-hover:opacity-100"
            )}
          >
            {actions}
          </div>
        )}
      </SkillCardShell>
    );
  }

  return (
    <SkillCardShell
      viewMode="grid"
      active={active}
      onClick={onClick}
      className={cn(isBroken && "cursor-default border-red-500/40 bg-red-500/5 hover:border-red-500/50 hover:bg-red-500/10")}
    >
      <div className="flex items-center gap-2.5 px-3.5 pt-3 pb-1.5">
        <h3
          className={cn(
            "flex-1 truncate text-[14px] font-semibold",
            isBroken ? "text-red-600 line-through decoration-red-500/70 dark:text-red-300" : "text-primary group-hover:text-accent-light"
          )}
          title={title}
        >
          {title}
        </h3>
        {readOnly && (
          <span
            title={readOnly.title}
            className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-warning-border bg-warning-bg px-1.5 py-0.5 text-[10px] font-medium text-warning"
          >
            <Lock className="h-2.5 w-2.5" />
            {readOnly.label}
          </span>
        )}
        {conflictBadge && (
          <span
            title={conflictBadge.title}
            className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-amber-500/40 bg-amber-500/12 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400"
          >
            <AlertTriangle className="h-2.5 w-2.5" />
            {conflictBadge.label}
          </span>
        )}
        {sourceBadge && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              sourceBadge.onClick?.();
            }}
            title={sourceBadge.title}
            className="inline-flex shrink-0 items-center rounded-full border border-info-border bg-info-bg px-1.5 py-0.5 font-mono text-[10px] font-medium text-info transition-colors hover:bg-info/15"
          >
            {sourceBadge.label}
          </button>
        )}
        {usageBadge}
        {fileCount > 0 && (
          <span className="flex shrink-0 items-center gap-1 text-[12px] text-faint">
            <FileText className="h-3 w-3" />
            {fileCount}
          </span>
        )}
      </div>
      <div className="px-3.5 pb-3">
        <p className={cn(
          "truncate text-[13px] leading-[18px]",
          isBroken ? "text-red-600/80 line-through decoration-red-500/50 dark:text-red-300/80" : "text-muted"
        )}>
          {description || "-"}
        </p>
        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1">
            {tags.map((tag) => (
              <span
                key={tag.label}
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
                  tag.className
                )}
              >
                {tag.label}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-border-subtle px-3.5 py-2.5">
        <StatusPill className={status.className}>{status.label}</StatusPill>
        <div className="flex shrink-0 items-center gap-1.5">
          {onOpenDir && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDir();
              }}
              title={openDirLabel}
              className="inline-flex shrink-0 items-center justify-center rounded-control p-0.5 text-muted transition-colors hover:bg-surface-hover hover:text-secondary"
            >
              <FolderOpen className="h-3.5 w-3.5" />
            </button>
          )}
          {actions}
        </div>
      </div>
    </SkillCardShell>
  );
}

function getLocalStatusMeta(t: (key: string) => string, status: ProjectSkill["sync_status"]) {
  const tone = status as SyncStatusTone;
  switch (status) {
    case "in_sync":
      return {
        label: t("globalWorkspace.localSkills.status.inSync"),
        className: syncStatusClass[tone],
      };
    case "project_newer":
      return {
        label: t("globalWorkspace.localSkills.status.localNewer"),
        className: syncStatusClass[tone],
      };
    case "center_newer":
      return {
        label: t("globalWorkspace.localSkills.status.centerNewer"),
        className: syncStatusClass[tone],
      };
    case "diverged":
      return {
        label: t("globalWorkspace.localSkills.status.diverged"),
        className: syncStatusClass[tone],
      };
    default:
      return {
        label: t("globalWorkspace.localSkills.status.localOnly"),
        className: syncStatusClass.project_only,
      };
  }
}

export function WorkspaceView({ config }: { config: WorkspaceConfig }) {
  const { agentKey } = useParams<{ agentKey?: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { tools, managedSkills, presets, refreshManagedSkills, refreshTools, workspaceCloseSignal } = useApp();

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [showAllScanDirs, setShowAllScanDirs] = useState(false);
  const [tagFilters, setTagFilters] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<ProjectSkill["sync_status"] | null>(null);
  const [dirFilter, setDirFilter] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [removingLocalSkillId, setRemovingLocalSkillId] = useState<string | null>(null);
  const [localSkills, setLocalSkills] = useState<ProjectSkill[]>([]);
  const [localSkillsLoading, setLocalSkillsLoading] = useState(false);
  const [brokenSymlinks, setBrokenSymlinks] = useState<string[]>([]);
  const [localActionKey, setLocalActionKey] = useState<string | null>(null);
  const [localDetailSkill, setLocalDetailSkill] = useState<ProjectSkill | null>(null);
  const [localDocContent, setLocalDocContent] = useState<string | null>(null);
  const [localCenterDocContent, setLocalCenterDocContent] = useState<string | null>(null);
  const [localDocLoading, setLocalDocLoading] = useState(false);
  const [localCenterDocLoading, setLocalCenterDocLoading] = useState(false);
  const [localContentTab, setLocalContentTab] = useState<"local" | "diff" | "center">("local");
  const [uploadConfirmSkill, setUploadConfirmSkill] = useState<ProjectSkill | null>(null);
  const [pullConfirmSkill, setPullConfirmSkill] = useState<ProjectSkill | null>(null);
  const [deleteLocalConfirmSkill, setDeleteLocalConfirmSkill] = useState<ProjectSkill | null>(null);
  const localDetailRequestRef = useRef(0);
  // Trigger counts for the current agent, keyed by skill name. Option X: show
  // how many times each skill fired *under this agent*, not the global total.
  const [usageCountByName, setUsageCountByName] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!agentKey) {
      setUsageCountByName({});
      return;
    }
    let cancelled = false;
    api.getSkillUsageStats()
      .then((stats) => {
        if (cancelled) return;
        const byName: Record<string, number> = {};
        for (const stat of stats) {
          const forAgent = stat.agents.find((a) => a.agent === agentKey);
          if (forAgent && forAgent.count > 0) byName[stat.skill_name] = forAgent.count;
        }
        setUsageCountByName(byName);
      })
      .catch(() => {
        if (!cancelled) setUsageCountByName({});
      });
    return () => {
      cancelled = true;
    };
  }, [agentKey]);

  // Cross-category redirect: a deep link like /global-workspace/openclaw should
  // land on /personal-workspace/openclaw. Compute it before any filtering so a
  // category mismatch doesn't briefly render "agent not found".
  const requestedTool = useMemo(
    () => (agentKey ? tools.find((t) => t.key === agentKey) ?? null : null),
    [agentKey, tools]
  );
  const needsRedirect =
    !!agentKey &&
    !!requestedTool &&
    requestedTool.category !== config.category;
  const redirectTarget = needsRedirect && requestedTool
    ? (requestedTool.category === "personal"
        ? `/personal-workspace/${requestedTool.key}`
        : `/global-workspace/${requestedTool.key}`)
    : null;

  const installedTools = useMemo(
    () => tools.filter((t) => t.installed && t.enabled && t.category === config.category),
    [tools, config.category]
  );

  const skillCountByAgent = useMemo(() => {
    const map: Record<string, number> = {};
    for (const tool of installedTools) {
      map[tool.key] = managedSkills.filter((s) =>
        s.targets.some((target) => target.tool === tool.key)
      ).length;
    }
    return map;
  }, [installedTools, managedSkills]);

  const currentTool = useMemo(
    () => (agentKey ? installedTools.find((t) => t.key === agentKey) ?? null : null),
    [agentKey, installedTools]
  );

  const openScanDir = useCallback(
    async (dir: string) => {
      if (!agentKey) return;
      try {
        await api.openAgentScanDir(agentKey, dir);
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, t("common.error")));
      }
    },
    [agentKey, t]
  );

  const openSkillDir = useCallback(
    async (skill: ProjectSkill) => {
      if (!agentKey) return;
      try {
        await api.openAgentSkillDir(agentKey, skill.path);
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, t("common.error")));
      }
    },
    [agentKey, t]
  );

  // Preset actions must target what is actually rendered: a single agent when
  // `currentTool` resolves, otherwise every installed agent in this category.
  // Falling back to the raw URL `agentKey` would let a stale deep link (a
  // bookmarked route for a since-disabled or uninstalled agent) mutate the
  // hidden agent while the overview is shown.
  const presetBarAgentKeys = useMemo(
    () => (currentTool ? [currentTool.key] : installedTools.map((t) => t.key)),
    [currentTool, installedTools]
  );
  const currentToolKey = currentTool?.key ?? null;
  const currentToolSkillsDir = currentTool?.skills_dir ?? null;
  const currentToolDisplayName = currentTool?.display_name ?? "";

  const localSkillsRequestRef = useRef(0);
  const loadLocalSkills = useCallback(async () => {
    const requestId = ++localSkillsRequestRef.current;
    if (!currentToolKey || !currentToolSkillsDir) {
      setLocalSkills([]);
      setBrokenSymlinks([]);
      return;
    }
    setLocalSkillsLoading(true);
    try {
      const [skills, broken] = await Promise.all([
        api.getGlobalLocalSkills(currentToolKey),
        api.detectBrokenSymlinks(currentToolSkillsDir).catch((error: unknown) => {
          toast.error(getErrorMessage(error, t("common.error")));
          return [];
        }),
      ]);
      if (localSkillsRequestRef.current === requestId) {
        const existingPaths = new Set(skills.map((skill) => skill.relative_path));
        const brokenOnly = broken
          .filter((name) => !existingPaths.has(name))
          .map((name) =>
            buildBrokenSymlinkSkill(name, currentToolSkillsDir, currentToolKey, currentToolDisplayName)
          );
        setBrokenSymlinks(broken);
        setLocalSkills([...skills, ...brokenOnly]);
      }
    } catch (error: unknown) {
      if (localSkillsRequestRef.current === requestId) {
        toast.error(getErrorMessage(error, t("common.error")));
        setLocalSkills([]);
        setBrokenSymlinks([]);
      }
    } finally {
      if (localSkillsRequestRef.current === requestId) setLocalSkillsLoading(false);
    }
  }, [currentToolDisplayName, currentToolKey, currentToolSkillsDir, t]);

  const loadedAgentKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!currentToolKey) {
      loadedAgentKeyRef.current = null;
      setLocalSkills([]);
      setBrokenSymlinks([]);
      return;
    }
    if (loadedAgentKeyRef.current === currentToolKey) return;
    loadedAgentKeyRef.current = currentToolKey;
    void loadLocalSkills();
    return () => {
      localSkillsRequestRef.current += 1;
      loadedAgentKeyRef.current = null;
    };
  }, [currentToolKey, loadLocalSkills]);

  useEffect(() => {
    localDetailRequestRef.current += 1;
    setLocalDetailSkill(null);
    setUploadConfirmSkill(null);
    setPullConfirmSkill(null);
    setDeleteLocalConfirmSkill(null);
    setTagFilters(new Set());
    setStatusFilter(null);
    setDirFilter(null);
  }, [currentTool?.key]);

  // Close the skill detail when a workspace nav item is clicked, even if the
  // route (agentKey) doesn't change — e.g. clicking the current agent or the
  // "All Agents" entry while a detail sheet is open. The initial mount is
  // skipped so opening a workspace fresh doesn't force-close anything.
  const workspaceCloseSeenRef = useRef(workspaceCloseSignal);
  useEffect(() => {
    if (workspaceCloseSeenRef.current === workspaceCloseSignal) return;
    workspaceCloseSeenRef.current = workspaceCloseSignal;
    localDetailRequestRef.current += 1;
    setLocalDetailSkill(null);
  }, [workspaceCloseSignal]);

  const agentSkills = useMemo(
    () =>
      agentKey
        ? managedSkills.filter((skill) =>
            skill.targets.some((target) => target.tool === agentKey)
          )
        : [],
    [agentKey, managedSkills]
  );

  const allLocalTags = useMemo(() => {
    const tags = new Set<string>();
    for (const skill of localSkills) {
      for (const tag of skill.tags) {
        if (tag.trim()) tags.add(tag);
      }
    }
    return Array.from(tags).sort((a, b) => a.localeCompare(b));
  }, [localSkills]);

  const visibleLocalSkills = useMemo(() => {
    const q = search.trim().toLowerCase();
    return localSkills
      .filter((skill) => {
        if (q) {
          const matchesQuery =
            skill.name.toLowerCase().includes(q) ||
            skill.dir_name.toLowerCase().includes(q) ||
            (skill.description || "").toLowerCase().includes(q);
          if (!matchesQuery) return false;
        }
        if (tagFilters.size > 0) {
          const wantUntagged = tagFilters.has(UNTAGGED_FILTER);
          const matchUntagged = wantUntagged && skill.tags.length === 0;
          const matchTag = skill.tags.some((tag) => tagFilters.has(tag));
          if (!matchUntagged && !matchTag) return false;
        }
        if (statusFilter !== null && skill.sync_status !== statusFilter) {
          return false;
        }
        if (dirFilter !== null) {
          const scanDirs = currentTool?.scan_dirs ?? (currentTool ? [currentTool.skills_dir] : []);
          if (skillDirBucketKey(skill, scanDirs) !== dirFilter) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const priority: Record<ProjectSkill["sync_status"], number> = {
          project_only: 0,
          project_newer: 1,
          diverged: 2,
          center_newer: 3,
          in_sync: 4,
        };
        return (
          priority[a.sync_status] - priority[b.sync_status] ||
          a.name.localeCompare(b.name)
        );
      });
  }, [localSkills, search, tagFilters, statusFilter, dirFilter, currentTool]);

  // Sync statuses actually present for this agent, ordered like the sort
  // priority above, so the filter row only offers relevant buttons.
  const presentStatuses = useMemo(() => {
    const order: ProjectSkill["sync_status"][] = [
      "project_only",
      "project_newer",
      "diverged",
      "center_newer",
      "in_sync",
    ];
    const present = new Set(localSkills.map((s) => s.sync_status));
    return order.filter((status) => present.has(status));
  }, [localSkills]);

  // Directory buckets actually present among this agent's skills, ordered
  // primary → additional shared dirs → read-only. Each carries a label and
  // count so the filter row only offers dirs that hold skills.
  const presentDirBuckets = useMemo(() => {
    if (!currentTool) return [];
    const scanDirs = currentTool.scan_dirs ?? [currentTool.skills_dir];
    const counts = new Map<string, number>();
    for (const skill of localSkills) {
      const key = skillDirBucketKey(skill, scanDirs);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const buckets: { key: string; label: string; count: number }[] = [];
    // Primary first, then each additional scan dir in declared order.
    scanDirs.forEach((dir, i) => {
      const count = counts.get(dir) ?? 0;
      if (count === 0) return;
      buckets.push({
        key: dir,
        label: i === 0 ? t("globalWorkspace.localSkills.primaryDir") : scanDirShortLabel(dir),
        count,
      });
    });
    // Read-only skills collapse into one bucket regardless of vendor dir.
    const readonlyCount = counts.get(READONLY_DIR_KEY) ?? 0;
    if (readonlyCount > 0) {
      buckets.push({
        key: READONLY_DIR_KEY,
        label: t("globalWorkspace.localSkills.readOnly"),
        count: readonlyCount,
      });
    }
    return buckets;
  }, [currentTool, localSkills, t]);

  // Skill dir_names that appear in more than one scan dir of this agent. Since
  // the agent's own loader — not Skiller — decides which copy wins (and each
  // agent's precedence differs), we surface the ambiguity rather than hide or
  // guess a "winner". Maps dir_name -> sorted list of absolute paths.
  const conflictingSkillPaths = useMemo(() => {
    const byName = new Map<string, string[]>();
    for (const skill of localSkills) {
      const list = byName.get(skill.dir_name) ?? [];
      list.push(skill.path);
      byName.set(skill.dir_name, list);
    }
    const conflicts = new Map<string, string[]>();
    for (const [name, paths] of byName) {
      if (paths.length > 1) {
        conflicts.set(name, paths.slice().sort());
      }
    }
    return conflicts;
  }, [localSkills]);

  const installedIds = useMemo(() => new Set(agentSkills.map((s) => s.id)), [agentSkills]);

  const managedLocalIds = useMemo(
    () =>
      new Set(
        localSkills
          .map((skill) => skill.center_skill_id)
          .filter((id): id is string => !!id && installedIds.has(id))
      ),
    [installedIds, localSkills]
  );

  const managedLocalCount = useMemo(
    () => localSkills.filter((skill) => !!skill.center_skill_id && managedLocalIds.has(skill.center_skill_id)).length,
    [localSkills, managedLocalIds]
  );

  const localOnlyCount = useMemo(
    () => localSkills.filter((skill) => !skill.center_skill_id).length,
    [localSkills]
  );

  const handleRemoveLocalManagedSkill = async (skill: ProjectSkill) => {
    if (!agentKey || !skill.center_skill_id || !managedLocalIds.has(skill.center_skill_id)) return;
    setRemovingLocalSkillId(skill.relative_path);
    try {
      await api.unsyncSkillFromTool(skill.center_skill_id, agentKey);
      await Promise.all([refreshManagedSkills(), refreshTools(), loadLocalSkills()]);
      toast.success(t("globalWorkspace.removedToast", { name: skill.name }));
    } catch (e) {
      toast.error(getErrorMessage(e, t("common.error")));
    } finally {
      setRemovingLocalSkillId(null);
    }
  };

  const handleSheetInstalled = useCallback(async () => {
    await Promise.all([refreshManagedSkills(), refreshTools(), loadLocalSkills()]);
  }, [loadLocalSkills, refreshManagedSkills, refreshTools]);

  const handleUploadLocalSkill = useCallback(
    async (skill: ProjectSkill) => {
      if (!currentTool) return;
      const key = `upload:${skill.relative_path}`;
      setLocalActionKey(key);
      try {
        await api.importGlobalLocalSkillToCenter(currentTool.key, skill.relative_path);
        toast.success(t("globalWorkspace.localSkills.uploadedToast", { name: skill.name, agent: currentTool.display_name }));
        await Promise.all([loadLocalSkills(), refreshManagedSkills()]);
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, t("common.error")));
      } finally {
        setLocalActionKey(null);
        setUploadConfirmSkill(null);
      }
    },
    [currentTool, loadLocalSkills, refreshManagedSkills, t]
  );

  const handleDeleteLocalSkill = useCallback(
    async (skill: ProjectSkill) => {
      if (!currentTool) return;
      const key = `delete:${skill.relative_path}`;
      setLocalActionKey(key);
      try {
        await api.deleteGlobalLocalSkill(currentTool.key, skill.relative_path);
        toast.success(t("globalWorkspace.localSkills.deletedLocalToast", { name: skill.name, agent: currentTool.display_name }));
        await loadLocalSkills();
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, t("common.error")));
      } finally {
        setLocalActionKey(null);
        setDeleteLocalConfirmSkill(null);
      }
    },
    [currentTool, loadLocalSkills, t]
  );

  const handlePullLocalSkill = useCallback(
    async (skill: ProjectSkill) => {
      if (!currentTool) return;
      const key = `pull:${skill.relative_path}`;
      setLocalActionKey(key);
      try {
        await api.updateGlobalLocalSkillFromCenter(currentTool.key, skill.relative_path);
        toast.success(t("globalWorkspace.localSkills.pulledToast", { name: skill.name, agent: currentTool.display_name }));
        await loadLocalSkills();
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, t("common.error")));
      } finally {
        setLocalActionKey(null);
        setPullConfirmSkill(null);
      }
    },
    [currentTool, loadLocalSkills, t]
  );

  const openLocalDetail = useCallback(
    async (skill: ProjectSkill) => {
      if (!currentTool) return;
      const requestId = localDetailRequestRef.current + 1;
      localDetailRequestRef.current = requestId;
      setLocalDetailSkill(skill);
      setLocalContentTab("local");
      setLocalDocContent(null);
      setLocalCenterDocContent(null);
      setLocalDocLoading(true);
      setLocalCenterDocLoading(!!skill.center_skill_id);

      api
        .getGlobalLocalSkillDocument(currentTool.key, skill.relative_path)
        .then((doc) => {
          if (localDetailRequestRef.current === requestId) setLocalDocContent(doc.content);
        })
        .catch(() => {
          if (localDetailRequestRef.current === requestId) setLocalDocContent(null);
        })
        .finally(() => {
          if (localDetailRequestRef.current === requestId) setLocalDocLoading(false);
        });

      if (skill.center_skill_id) {
        api
          .getSkillDocument(skill.center_skill_id)
          .then((doc) => {
            if (localDetailRequestRef.current === requestId) setLocalCenterDocContent(doc.content);
          })
          .catch(() => {
            if (localDetailRequestRef.current === requestId) setLocalCenterDocContent(null);
          })
          .finally(() => {
            if (localDetailRequestRef.current === requestId) setLocalCenterDocLoading(false);
          });
      }
    },
    [currentTool]
  );

  const existsInGlobal = useCallback(
    (skill: ManagedSkill, agentK: string) =>
      skill.targets.some((target) => target.tool === agentK),
    []
  );

  const handlePresetAdd = useCallback(async (skill: ManagedSkill, agentK: string) => {
    await api.syncSkillToTool(skill.id, agentK);
  }, []);

  const handlePresetRemove = useCallback(async (skill: ManagedSkill, agentK: string) => {
    await api.unsyncSkillFromTool(skill.id, agentK);
  }, []);

  const handlePresetComplete = useCallback(async () => {
    await Promise.all([refreshManagedSkills(), refreshTools(), loadLocalSkills()]);
  }, [loadLocalSkills, refreshManagedSkills, refreshTools]);

  const renderLocalSkillActions = (skill: ProjectSkill, variant: "grid" | "list") => {
    // Vendor/plugin-managed skills are display-only: no pull/adopt/remove/delete.
    if (skill.read_only) return null;
    const uploadKey = `upload:${skill.relative_path}`;
    const pullKey = `pull:${skill.relative_path}`;
    const deleteKey = `delete:${skill.relative_path}`;
    const isBroken = brokenSymlinks.includes(skill.relative_path);
    const canPull = skill.sync_status === "center_newer" || skill.sync_status === "diverged";
    const isInSync = skill.sync_status === "in_sync";
    const isManaged = !!skill.center_skill_id && managedLocalIds.has(skill.center_skill_id);
    const canAdoptLocal = !isManaged;
    const canDeleteLocal = !isManaged;
    const removing = removingLocalSkillId === skill.relative_path;
    const buttonClassName = variant === "grid"
      ? "rounded px-2 py-1 text-[13px] font-medium text-muted transition-colors outline-none hover:bg-surface-hover hover:text-secondary disabled:opacity-50"
      : "rounded p-0.5 text-muted transition-colors hover:bg-surface-hover hover:text-secondary disabled:opacity-50";

    if (isBroken) {
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setDeleteLocalConfirmSkill(skill);
          }}
          disabled={localActionKey === deleteKey}
          title={t("globalWorkspace.localSkills.deleteLocal")}
          className={cn(buttonClassName, "text-red-500 hover:bg-red-500/10 hover:text-red-500")}
        >
          {localActionKey === deleteKey ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </button>
      );
    }

    return (
      <>
        {!isInSync && canPull && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setPullConfirmSkill(skill);
            }}
            disabled={localActionKey === pullKey}
            className={buttonClassName}
            title={t("globalWorkspace.localSkills.pull")}
          >
            {localActionKey === pullKey ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
          </button>
        )}

        {canAdoptLocal && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (skill.sync_status === "project_only" || skill.sync_status === "in_sync") {
                void handleUploadLocalSkill(skill);
              } else {
                setUploadConfirmSkill(skill);
              }
            }}
            disabled={localActionKey === uploadKey}
            className={buttonClassName}
            title={t("globalWorkspace.localSkills.upload")}
          >
            {localActionKey === uploadKey ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
          </button>
        )}

        {isManaged ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              void handleRemoveLocalManagedSkill(skill);
            }}
            disabled={removing}
            title={t("globalWorkspace.localSkills.removeManaged")}
            className={cn(buttonClassName, "hover:bg-red-500/10 hover:text-red-500")}
          >
            {removing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </button>
        ) : canDeleteLocal ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteLocalConfirmSkill(skill);
            }}
            disabled={localActionKey === deleteKey}
            title={t("globalWorkspace.localSkills.deleteLocal")}
            className={cn(buttonClassName, "hover:bg-red-500/10 hover:text-red-500")}
          >
            {localActionKey === deleteKey ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </button>
        ) : null}
      </>
    );
  };

  if (redirectTarget) {
    return <Navigate to={redirectTarget} replace />;
  }

  if (installedTools.length === 0) {
    return (
      <div className="app-page">
        <div className="app-panel flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-surface-hover">
            <Globe className="h-5 w-5 text-muted" />
          </div>
          <p className="text-[13px] font-medium text-secondary">{t(config.i18nKeys.noAgents)}</p>
          <p className="mt-1 max-w-[260px] text-[12px] leading-relaxed text-muted">
            {t(config.i18nKeys.noAgentsHint)}
          </p>
        </div>
      </div>
    );
  }

  if (!currentTool) {
    return (
      <div className="app-page">
        <div className="app-page-header flex flex-col gap-2.5 pb-3 pr-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="app-page-title flex items-center gap-2.5">
                <Globe className="h-5 w-5 text-accent" />
                {t(config.i18nKeys.allAgentsTitle)}
                <span className="app-badge">{installedTools.length}</span>
              </h1>
            </div>
          </div>

          {presets.length > 0 && (
            <PresetBar
              presets={presets}
              managedSkills={managedSkills}
              agentKeys={presetBarAgentKeys}
              existsInWorkspace={existsInGlobal}
              onAddSkill={handlePresetAdd}
              onRemoveSkill={handlePresetRemove}
              onComplete={handlePresetComplete}
            />
          )}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {installedTools.map((tool) => {
            const count = skillCountByAgent[tool.key] ?? 0;
            return (
              <button
                key={tool.key}
                onClick={() => navigate(`${config.basePath}/${tool.key}`)}
                className="app-panel group flex items-center gap-3 p-3.5 text-left transition-all hover:border-border hover:bg-surface-hover"
              >
                <AgentIcon
                  agentKey={tool.key}
                  displayName={tool.display_name}
                  className="h-9 w-9 rounded-lg transition-colors group-hover:border-border"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-secondary">{tool.display_name}</p>
                  <p className="text-[12px] text-muted">{t("globalWorkspace.skillCount", { count })}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-faint transition-transform group-hover:translate-x-0.5" />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="app-page">
      {/* Header */}
      <div className="app-page-header flex flex-col gap-2.5 pb-3 pr-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-[1_1_360px]">
            <h1 className="app-page-title flex items-center gap-2.5">
              <AgentIcon
                agentKey={currentTool.key}
                displayName={currentTool.display_name}
                className="h-7 w-7 rounded-lg"
              />
              {currentTool.display_name}
              <span className="app-badge">{localSkills.length}</span>
            </h1>
            <p className="mt-1 truncate text-[13px] text-muted" title={currentTool.skills_dir}>
              <button
                type="button"
                onClick={() => void openScanDir(currentTool.skills_dir)}
                className="rounded-control underline decoration-transparent underline-offset-2 transition-colors hover:text-secondary hover:decoration-muted"
                title={t("globalWorkspace.localSkills.openDir")}
              >
                {compactHomePath(currentTool.skills_dir)}
              </button>
              {(() => {
                const scanDirs = currentTool.scan_dirs ?? [];
                const readonlyDirs = currentTool.readonly_dirs ?? [];
                const extraCount =
                  scanDirs.filter((d) => d !== currentTool.skills_dir).length + readonlyDirs.length;
                if (extraCount === 0) return null;
                const allExtra = [
                  ...scanDirs.filter((d) => d !== currentTool.skills_dir),
                  ...readonlyDirs,
                ];
                return (
                  <button
                    type="button"
                    onClick={() => setShowAllScanDirs((v) => !v)}
                    className="ml-1.5 rounded-full border border-info-border bg-info-bg px-1.5 py-0.5 text-[11px] font-medium text-info transition-colors hover:bg-info/15"
                    title={allExtra.map(compactHomePath).join("\n")}
                  >
                    +{extraCount} {t("globalWorkspace.localSkills.otherDirs")}
                  </button>
                );
              })()}
              <span className="px-1.5">·</span>
              {t("globalWorkspace.localSkills.summary", {
                total: localSkills.length,
                managed: managedLocalCount,
                localOnly: localOnlyCount,
              })}
            </p>
            {showAllScanDirs && (() => {
              const scanDirs = currentTool.scan_dirs ?? [];
              const readonlyDirs = currentTool.readonly_dirs ?? [];
              const rows: { dir: string; kind: "primary" | "extra" | "readonly" }[] = [
                ...scanDirs.map((dir, i) => ({
                  dir,
                  kind: (i === 0 ? "primary" : "extra") as "primary" | "extra",
                })),
                ...readonlyDirs.map((dir) => ({ dir, kind: "readonly" as const })),
              ];
              if (rows.length <= 1) return null;
              return (
                <ul className="mt-1.5 flex flex-col gap-1 text-[12px]">
                  {rows.map(({ dir, kind }) => (
                    <li key={dir}>
                      <button
                        type="button"
                        onClick={() => void openScanDir(dir)}
                        title={t("globalWorkspace.localSkills.openDir")}
                        className="group/dir flex w-full min-w-0 items-center gap-1.5 rounded-control py-0.5 pr-2 font-mono text-muted transition-colors hover:text-secondary"
                      >
                        <span
                          className={cn(
                            "inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                            kind === "primary"
                              ? "bg-surface-hover text-faint"
                              : kind === "readonly"
                                ? "border border-warning-border bg-warning-bg text-warning"
                                : "border border-info-border bg-info-bg text-info"
                          )}
                        >
                          {kind === "readonly" && <Lock className="h-2.5 w-2.5" />}
                          {kind === "primary"
                            ? t("globalWorkspace.localSkills.primaryDir")
                            : kind === "readonly"
                              ? t("globalWorkspace.localSkills.readOnly")
                              : scanDirShortLabel(dir)}
                        </span>
                        <span className="truncate" title={dir}>{compactHomePath(dir)}</span>
                        <FolderOpen className="h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover/dir:opacity-100" />
                      </button>
                    </li>
                  ))}
                </ul>
              );
            })()}
          </div>

          <div className="flex min-w-0 flex-[2_1_520px] flex-wrap items-center justify-end gap-2">
            <div className="relative w-full min-w-[220px] max-w-[320px]">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("globalWorkspace.localSkills.searchPlaceholder")}
                className="app-input h-9 w-full rounded-md pl-8 font-medium"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>

            <div className="app-segmented shrink-0">
              <button
                onClick={() => void loadLocalSkills()}
                disabled={localSkillsLoading}
                className="rounded-md p-2 text-muted transition-colors outline-none hover:text-tertiary disabled:opacity-50"
                title={t("settings.refresh")}
              >
                <RefreshCw className={cn("h-4 w-4", localSkillsLoading && "animate-spin")} />
              </button>
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
            </div>

            <Button
              onClick={() => setAddDialogOpen(true)}
              icon={<Plus className="h-3.5 w-3.5" />}
              className="shrink-0"
            >
              {t("globalWorkspace.addSkill")}
            </Button>
          </div>
        </div>

        {presentStatuses.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[12px] text-muted">
              <SlidersHorizontal className="h-3 w-3" />
              {t("globalWorkspace.localSkills.statusFilter")}
            </span>
            <button
              onClick={() => setStatusFilter(null)}
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[12px] font-medium transition-colors",
                statusFilter === null
                  ? "bg-accent text-white dark:bg-accent dark:text-white"
                  : "bg-surface-hover text-muted hover:text-secondary"
              )}
            >
              {t("globalWorkspace.localSkills.allStatus")}
            </button>
            {presentStatuses.map((status) => {
              const meta = getLocalStatusMeta(t, status);
              const active = statusFilter === status;
              // `localOnly` shares `bg-surface-hover` with the unselected pill
              // style, so its selected state is invisible. Give it a distinct
              // high-contrast highlight instead of reusing the status color.
              const activeClass =
                status === "project_only"
                  ? "bg-[rgb(var(--color-text-primary))] text-[rgb(var(--color-bg))]"
                  : meta.className;
              return (
                <button
                  key={status}
                  onClick={() => setStatusFilter((prev) => (prev === status ? null : status))}
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[12px] font-medium transition-colors",
                    active
                      ? cn(activeClass, "ring-1 ring-inset ring-border")
                      : "bg-surface-hover text-muted hover:text-secondary"
                  )}
                >
                  {meta.label}
                </button>
              );
            })}
          </div>
        )}

        {presentDirBuckets.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[12px] text-muted">
              <FolderOpen className="h-3 w-3" />
              {t("globalWorkspace.localSkills.dirFilter")}
            </span>
            <button
              onClick={() => setDirFilter(null)}
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[12px] font-medium transition-colors",
                dirFilter === null
                  ? "bg-accent text-white dark:bg-accent dark:text-white"
                  : "bg-surface-hover text-muted hover:text-secondary"
              )}
            >
              {t("globalWorkspace.localSkills.allDirs")}
            </button>
            {presentDirBuckets.map((bucket) => {
              const active = dirFilter === bucket.key;
              const isReadonly = bucket.key === READONLY_DIR_KEY;
              return (
                <button
                  key={bucket.key}
                  onClick={() => setDirFilter((prev) => (prev === bucket.key ? null : bucket.key))}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-medium transition-colors",
                    active
                      ? isReadonly
                        ? "border border-warning-border bg-warning-bg text-warning ring-1 ring-inset ring-border"
                        : "bg-accent text-white dark:bg-accent dark:text-white"
                      : "bg-surface-hover text-muted hover:text-secondary"
                  )}
                >
                  {isReadonly && <Lock className="h-2.5 w-2.5" />}
                  {bucket.label}
                  <span className="tabular-nums opacity-70">{bucket.count}</span>
                </button>
              );
            })}
          </div>
        )}

        {allLocalTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[12px] text-muted">
              <Tag className="h-3 w-3" />
              {t("mySkills.tags.filter")}
            </span>
            <button
              onClick={() => setTagFilters(new Set())}
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[12px] font-medium transition-colors",
                tagFilters.size === 0
                  ? "bg-accent text-white dark:bg-accent dark:text-white"
                  : "bg-surface-hover text-muted hover:text-secondary"
              )}
            >
              {t("mySkills.tags.allTags")}
            </button>
            {localSkills.some((s) => s.tags.length === 0) && (() => {
              const isActive = tagFilters.has(UNTAGGED_FILTER);
              return (
                <button
                  onClick={() => {
                    setTagFilters((prev) => {
                      // "Untagged" is mutually exclusive with real tags.
                      if (prev.has(UNTAGGED_FILTER)) return new Set();
                      return new Set([UNTAGGED_FILTER]);
                    });
                  }}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-medium transition-colors",
                    isActive
                      ? "bg-accent text-white dark:bg-accent dark:text-white"
                      : "border border-dashed border-border text-muted hover:text-secondary"
                  )}
                  title={t("mySkills.tags.untagged")}
                >
                  <CircleSlash className="h-3 w-3" />
                  {t("mySkills.tags.untagged")}
                </button>
              );
            })()}
            {allLocalTags.map((tag) => {
              const active = tagFilters.has(tag);
              return (
                <button
                  key={tag}
                  onClick={() => {
                    setTagFilters((prev) => {
                      const next = new Set(prev);
                      if (next.has(tag)) {
                        next.delete(tag);
                      } else {
                        next.delete(UNTAGGED_FILTER);
                        next.add(tag);
                      }
                      return next;
                    });
                  }}
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[12px] font-medium transition-colors",
                    active ? getTagActiveColor(tag, allLocalTags) : getTagColor(tag, allLocalTags)
                  )}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        )}

        {/* Preset bar */}
        {presets.length > 0 && (
          <PresetBar
            presets={presets}
            managedSkills={managedSkills}
            agentKeys={presetBarAgentKeys}
            existsInWorkspace={existsInGlobal}
            onAddSkill={handlePresetAdd}
            onRemoveSkill={handlePresetRemove}
            onComplete={handlePresetComplete}
          />
        )}
      </div>

      {localSkillsLoading ? (
        <SkeletonRows rows={viewMode === "grid" ? 6 : 5} className="pb-8" />
      ) : visibleLocalSkills.length === 0 ? (
        <EmptyState
          className="min-h-[260px]"
          icon={<Globe className="h-12 w-12" />}
          title={localSkills.length === 0 ? t("globalWorkspace.localSkills.empty") : t("mySkills.noMatch")}
          action={
            localSkills.length === 0 ? (
              <Button
                onClick={() => setAddDialogOpen(true)}
                icon={<Plus className="h-3.5 w-3.5" />}
                className="h-auto px-4 py-2"
              >
                {t("globalWorkspace.addSkill")}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div
          className={cn(
            "pb-8",
            viewMode === "grid"
              ? "grid grid-cols-2 gap-3 lg:grid-cols-3"
              : "flex flex-col gap-0.5"
          )}
        >
          {visibleLocalSkills.map((skill) => {
            const statusMeta = getLocalStatusMeta(t, skill.sync_status);
            const isManaged = !!skill.center_skill_id && managedLocalIds.has(skill.center_skill_id);
            const isBroken = brokenSymlinks.includes(skill.relative_path);

            // Badge skills that live in a non-primary scan dir (e.g. the shared
            // ~/.agents/skills), so cross-agent skills are visually distinct.
            const scanDirs = currentTool.scan_dirs ?? [currentTool.skills_dir];
            const owner = ownerScanDir(skill.path, scanDirs);
            const sourceBadge =
              owner && owner !== scanDirs[0]
                ? {
                    label: scanDirShortLabel(owner),
                    title: compactHomePath(owner),
                    onClick: () => void openScanDir(owner),
                  }
                : null;

            // Same-name skill in another scan dir: surface the ambiguity (the
            // agent, not Skiller, decides which copy it actually loads).
            const conflictPaths = conflictingSkillPaths.get(skill.dir_name);
            const conflictBadge = conflictPaths
              ? {
                  label: t("globalWorkspace.localSkills.nameConflict"),
                  title: `${t("globalWorkspace.localSkills.nameConflictHint")}\n${conflictPaths
                    .map(compactHomePath)
                    .join("\n")}`,
                }
              : null;

            return (
              <WorkspaceSkillCard
                key={`${skill.agent}:${skill.path}`}
                viewMode={viewMode}
                title={skill.name}
                description={skill.description || skill.relative_path}
                tags={skill.tags.map((tag) => ({ label: tag, className: getTagColor(tag, allLocalTags) }))}
                status={statusMeta}
                fileCount={skill.files.length}
                usageCount={usageCountByName[skill.name] ?? 0}
                active={isManaged}
                isBroken={isBroken}
                sourceBadge={sourceBadge}
                readOnly={
                  skill.read_only
                    ? {
                        label: t("globalWorkspace.localSkills.readOnly"),
                        title: t("globalWorkspace.localSkills.readOnlyHint"),
                      }
                    : null
                }
                conflictBadge={conflictBadge}
                actions={renderLocalSkillActions(skill, viewMode)}
                actionsHover={viewMode === "list"}
                onOpenDir={isBroken ? undefined : () => void openSkillDir(skill)}
                openDirLabel={t("globalWorkspace.localSkills.openDir")}
                onClick={isBroken ? undefined : () => void openLocalDetail(skill)}
              />
            );
          })}
        </div>
      )}

      {currentTool && (
        <AddSkillsSheet
          open={addDialogOpen}
          onClose={() => setAddDialogOpen(false)}
          target={{
            kind: "global",
            agentKey: currentTool.key,
            agentDisplayName: currentTool.display_name,
            installedSkillIds: installedIds,
          }}
          managedSkills={managedSkills}
          onInstalled={handleSheetInstalled}
        />
      )}

      <DetailSheet
        open={!!localDetailSkill}
        title={localDetailSkill?.name ?? ""}
        description={localDetailSkill?.description}
        meta={
          localDetailSkill ? (
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill
                className={cn("px-2.5 py-1", getLocalStatusMeta(t, localDetailSkill.sync_status).className)}
              >
                {getLocalStatusMeta(t, localDetailSkill.sync_status).label}
              </StatusPill>
              {localDetailSkill.read_only && (
                <span
                  title={t("globalWorkspace.localSkills.readOnlyHint")}
                  className="inline-flex items-center gap-1 rounded-full border border-warning-border bg-warning-bg px-2.5 py-1 text-[12px] font-medium text-warning"
                >
                  <Lock className="h-3 w-3" />
                  {t("globalWorkspace.localSkills.readOnly")}
                </span>
              )}
              <span className="rounded-full bg-surface-hover px-2.5 py-1 text-[12px] text-muted">
                {localDetailSkill.relative_path}
              </span>
            </div>
          ) : null
        }
        onClose={() => setLocalDetailSkill(null)}
        onBack={() => setLocalDetailSkill(null)}
        backLabel={t("common.back")}
      >
        {localDetailSkill?.center_skill_id && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {(["local", "diff", "center"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setLocalContentTab(tab)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors",
                  localContentTab === tab
                    ? "bg-accent text-white"
                    : "bg-surface-hover text-muted hover:text-secondary"
                )}
                disabled={(tab === "diff" || tab === "center") && localCenterDocLoading}
              >
                {tab === "local"
                  ? t("mySkills.docTabs.local")
                  : tab === "diff"
                    ? t("mySkills.docTabs.diff")
                    : t("project.docTabs.center")}
              </button>
            ))}
          </div>
        )}

        {localDocLoading ? (
          <DocumentSkeleton />
        ) : localContentTab === "diff" ? (
          localDocContent && localCenterDocContent ? (
            <DocumentDiffViewer original={localDocContent} updated={localCenterDocContent} />
          ) : localCenterDocLoading ? (
            <DocumentSkeleton />
          ) : (
            <EmptyState className="mt-12" title={t("mySkills.sourceDiffUnavailable")} />
          )
        ) : localContentTab === "center" ? (
          localCenterDocLoading ? (
            <DocumentSkeleton />
          ) : localCenterDocContent ? (
            <SkillMarkdown content={localCenterDocContent} />
          ) : (
            <EmptyState className="mt-12" title={t("mySkills.sourceDiffUnavailable")} />
          )
        ) : localDocContent ? (
          <SkillMarkdown content={localDocContent} />
        ) : (
          <EmptyState className="mt-12" title={t("common.documentMissing")} />
        )}
      </DetailSheet>

      <ConfirmDialog
        open={!!uploadConfirmSkill}
        title={t("globalWorkspace.localSkills.uploadConfirmTitle")}
        message={t("globalWorkspace.localSkills.uploadConfirmMessage", {
          name: uploadConfirmSkill?.name ?? "",
        })}
        tone="warning"
        confirmLabel={t("globalWorkspace.localSkills.upload")}
        onClose={() => setUploadConfirmSkill(null)}
        onConfirm={() => uploadConfirmSkill ? handleUploadLocalSkill(uploadConfirmSkill) : Promise.resolve()}
      />
      <ConfirmDialog
        open={!!pullConfirmSkill}
        title={t("globalWorkspace.localSkills.pullConfirmTitle")}
        message={t("globalWorkspace.localSkills.pullConfirmMessage", {
          name: pullConfirmSkill?.name ?? "",
          agent: currentTool?.display_name ?? "",
        })}
        tone="danger"
        confirmLabel={t("globalWorkspace.localSkills.pull")}
        onClose={() => setPullConfirmSkill(null)}
        onConfirm={() => pullConfirmSkill ? handlePullLocalSkill(pullConfirmSkill) : Promise.resolve()}
      />
      <ConfirmDialog
        open={!!deleteLocalConfirmSkill}
        title={t("globalWorkspace.localSkills.deleteLocalConfirmTitle")}
        message={t("globalWorkspace.localSkills.deleteLocalConfirmMessage", {
          name: deleteLocalConfirmSkill?.name ?? "",
          agent: currentTool?.display_name ?? "",
        })}
        tone="danger"
        confirmLabel={t("common.delete")}
        onClose={() => setDeleteLocalConfirmSkill(null)}
        onConfirm={() => deleteLocalConfirmSkill ? handleDeleteLocalSkill(deleteLocalConfirmSkill) : Promise.resolve()}
      />
    </div>
  );
}
