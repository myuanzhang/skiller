import { useEffect, useRef, useState } from "react";
import {
  Folder,
  ChevronDown,
  ChevronUp,
  Github,
  HardDrive,
  Globe,
  CheckCircle2,
  Loader2,
  Plus,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "../utils";
import {
  getSkillDocument,
  getSourceSkillDocument,
  getSkillSourceDiff,
  type ManagedSkill,
  type Project,
  type SkillDocument,
  type SourceSkillDocument,
  type SkillSourceDiff,
  type ToolInfo,
} from "../lib/tauri";
import { SkillSourceDiffViewer } from "./SkillSourceDiffViewer";
import { DetailSheet } from "./DetailSheet";
import { SkillMarkdown } from "./SkillMarkdown";
import { SkillProjectsSection } from "./SkillProjectsSection";
import { EmptyState } from "./ui/EmptyState";
import { DocumentSkeleton } from "./ui/Skeleton";
import { AgentIcon } from "./AgentIcon";
import { getTagColor } from "../lib/skillTags";

interface Props {
  skill: ManagedSkill | null;
  onClose: () => void;
  tools?: ToolInfo[];
  pendingToolKey?: string | null;
  onToggleTarget?: (toolKey: string, enabled: boolean) => void;
  projects?: Project[];
  onProjectsChanged?: () => void;
  allTags?: string[];
}

export function SkillDetailPanel({
  skill,
  onClose,
  tools,
  pendingToolKey,
  onToggleTarget,
  projects,
  onProjectsChanged,
  allTags = [],
}: Props) {
  if (!skill) return null;

  const panelKey = [
    skill.id,
    skill.updated_at,
    skill.source_type,
    skill.source_ref ?? "",
    skill.source_revision ?? "",
    skill.remote_revision ?? "",
  ].join(":");

  return (
    <SkillDetailPanelContent
      key={panelKey}
      skill={skill}
      onClose={onClose}
      tools={tools}
      pendingToolKey={pendingToolKey}
      onToggleTarget={onToggleTarget}
      projects={projects}
      onProjectsChanged={onProjectsChanged}
      allTags={allTags}
    />
  );
}

function SkillDetailPanelContent({
  skill,
  onClose,
  tools,
  pendingToolKey,
  onToggleTarget,
  projects,
  onProjectsChanged,
  allTags = [],
}: {
  skill: ManagedSkill;
  onClose: () => void;
  tools?: ToolInfo[];
  pendingToolKey?: string | null;
  onToggleTarget?: (toolKey: string, enabled: boolean) => void;
  projects?: Project[];
  onProjectsChanged?: () => void;
  allTags?: string[];
}) {
  const { t } = useTranslation();
  const [doc, setDoc] = useState<SkillDocument | null>(null);
  const [sourceDoc, setSourceDoc] = useState<SourceSkillDocument | null>(null);
  const [sourceDiff, setSourceDiff] = useState<SkillSourceDiff | null>(null);
  const [sourceDiffFailed, setSourceDiffFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMetadataExpanded, setIsMetadataExpanded] = useState(false);
  const [showUnavailableAgents, setShowUnavailableAgents] = useState(false);
  const [contentTab, setContentTab] = useState<"local" | "diff" | "source">("local");
  const localRequestIdRef = useRef(0);
  const sourceRequestIdRef = useRef(0);
  const diffRequestedRef = useRef(false);
  const skillId = skill.id;
  const supportsSourceDiff =
    skill.source_type === "git"
    || skill.source_type === "skillssh"
    || (skill.source_type === "local" && !!skill.source_ref);
  const [sourceLoading, setSourceLoading] = useState(supportsSourceDiff);
  const localDocVersion = `${skill.id}:${skill.updated_at}`;
  const sourceDocVersion = [
    skill.id,
    skill.source_type,
    skill.source_ref ?? "",
    skill.source_ref_resolved ?? "",
    skill.source_revision ?? "",
    skill.remote_revision ?? "",
  ].join(":");

  useEffect(() => {
    localRequestIdRef.current += 1;
    const requestId = localRequestIdRef.current;

    getSkillDocument(skillId)
      .then((nextDoc) => {
        if (requestId === localRequestIdRef.current) {
          setDoc(nextDoc);
        }
      })
      .catch(() => {
        if (requestId === localRequestIdRef.current) {
          setDoc(null);
        }
      })
      .finally(() => {
        if (requestId === localRequestIdRef.current) {
          setLoading(false);
        }
      });
  }, [skillId, localDocVersion]);

  useEffect(() => {
    if (!supportsSourceDiff) {
      return;
    }

    sourceRequestIdRef.current += 1;
    const requestId = sourceRequestIdRef.current;

    getSourceSkillDocument(skillId)
      .then((nextDoc) => {
        if (requestId === sourceRequestIdRef.current) {
          setSourceDoc(nextDoc);
        }
      })
      .catch(() => {
        if (requestId === sourceRequestIdRef.current) {
          setSourceDoc(null);
        }
      })
      .finally(() => {
        if (requestId === sourceRequestIdRef.current) {
          setSourceLoading(false);
        }
      });
  }, [skillId, supportsSourceDiff, sourceDocVersion]);

  useEffect(() => {
    if (contentTab !== "diff" || !supportsSourceDiff) return;
    if (diffRequestedRef.current) return;
    diffRequestedRef.current = true;

    getSkillSourceDiff(skillId)
      .then((diff) => setSourceDiff(diff))
      .catch(() => setSourceDiffFailed(true));
  }, [contentTab, supportsSourceDiff, skillId]);

  const sourceIcon = (type: string) => {
    switch (type) {
      case "git":
      case "skillssh":
        return <Github className="h-3.5 w-3.5" />;
      case "local":
        return <HardDrive className="h-3.5 w-3.5" />;
      default:
        return <Globe className="h-3.5 w-3.5" />;
    }
  };

  const sourceTypeLabel = (type: string) =>
    t(`mySkills.sourceFilter.${type}`, { defaultValue: type });

  const metadataItems = [
    { label: t("mySkills.sourceType"), value: sourceTypeLabel(skill.source_type) },
    { label: t("mySkills.sourceRef"), value: skill.source_ref },
    { label: t("mySkills.sourceResolved"), value: skill.source_ref_resolved },
    { label: t("mySkills.sourceBranch"), value: skill.source_branch },
    { label: t("mySkills.sourceSubpath"), value: skill.source_subpath },
    { label: t("mySkills.sourceRevision"), value: skill.source_revision },
  ].filter((item) => Boolean(item.value));

  const activeDoc = doc?.skill_id === skill.id ? doc : null;
  const activeSourceDoc = sourceDoc?.skill_id === skill.id ? sourceDoc : null;
  const activeSourceDiff = sourceDiff?.skill_id === skill.id ? sourceDiff : null;
  const sourceDiffLoading =
    contentTab === "diff" && supportsSourceDiff && !activeSourceDiff && !sourceDiffFailed;

  const syncedKeys = new Set(skill.targets.map((t) => t.tool));
  const allTools = tools ?? [];
  const availableTools = allTools.filter((t) => t.installed && t.enabled);
  const unavailableTools = allTools.filter((t) => !t.installed || !t.enabled);
  const syncedCount = availableTools.filter((t) => syncedKeys.has(t.key)).length;

  const orphanTargets = skill.targets.filter((t) => !availableTools.some((at) => at.key === t.tool));

  const meta = (
    <>
      {skill.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          {skill.tags.map((tag) => (
            <span
              key={tag}
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
                getTagColor(tag, allTags)
              )}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      <div className={cn("flex min-w-0 items-center gap-2 text-[13px] text-muted", skill.tags.length > 0 && "mt-3")}>
        <Folder className="h-3.5 w-3.5 shrink-0" />
        <span className="font-mono truncate" title={skill.central_path}>
          {skill.central_path}
        </span>
      </div>
      {metadataItems.length > 0 && (
        <div className="mt-4 rounded-panel border border-border-subtle bg-surface/70">
          <button
            type="button"
            onClick={() => setIsMetadataExpanded((prev) => !prev)}
            aria-expanded={isMetadataExpanded}
            aria-controls="skill-source-metadata"
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border-subtle bg-bg-secondary px-2 py-1 text-[12px] text-muted">
                {sourceIcon(skill.source_type)}
                {sourceTypeLabel(skill.source_type)}
              </span>
              <span className="truncate text-[13px] font-medium text-secondary">
                {t("mySkills.sourceType")}
              </span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 text-[12px] text-muted">
              <span>
                {isMetadataExpanded
                  ? t("mySkills.collapseAgentToggles")
                  : t("mySkills.expandAgentToggles")}
              </span>
              {isMetadataExpanded ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </span>
          </button>
          {isMetadataExpanded && (
            <div id="skill-source-metadata" className="border-t border-border-subtle px-4 py-3">
              <div className="grid gap-2 md:grid-cols-2">
                {metadataItems.map((item) => (
                  <div key={item.label} className="min-w-0">
                    <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-faint">
                      {item.label}
                    </div>
                    <div
                      className="mt-0.5 truncate font-mono text-[12.5px] text-secondary"
                      title={item.value ?? undefined}
                    >
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );

  return (
    <DetailSheet
      open={true}
      title={skill.name}
      description={skill.description ? <p className="line-clamp-3">{skill.description}</p> : undefined}
      meta={meta}
      onClose={onClose}
      onBack={onClose}
      backLabel={t("common.back")}
    >
      {tools && onToggleTarget && availableTools.length > 0 && (
        <div className="mb-4 rounded-panel border border-border-subtle">
          <div className="border-b border-border-subtle px-5 py-3">
            <div className="flex items-center justify-between gap-2 text-[13px]">
              <div className="flex min-w-0 items-center gap-2">
                <span className="font-medium text-secondary">{t("mySkills.agentTogglesTitle")}</span>
                <span className="rounded-full border border-border-subtle bg-surface px-2 py-0.5 text-[12px] text-muted">
                  {t("mySkills.syncSummary", {
                    synced: syncedCount,
                    total: availableTools.length,
                  })}
                </span>
              </div>
              {(unavailableTools.length > 0 || orphanTargets.length > 0) && (
                <button
                  type="button"
                  onClick={() => setShowUnavailableAgents((prev) => !prev)}
                  className="inline-flex items-center gap-1 text-[12px] text-muted transition-colors hover:text-secondary"
                >
                  {showUnavailableAgents ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  <span>{t("mySkills.agentUnavailableCount", { count: unavailableTools.length + orphanTargets.length })}</span>
                </button>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {availableTools.map((tool) => {
                const isSynced = syncedKeys.has(tool.key);
                const isPending = pendingToolKey === tool.key;
                const title = `${tool.display_name} · ${isSynced
                  ? t("mySkills.targetClickUninstall")
                  : t("mySkills.targetClickInstall")}`;
                return (
                  <button
                    key={tool.key}
                    type="button"
                    title={title}
                    disabled={isPending}
                    onClick={() => onToggleTarget(tool.key, !isSynced)}
                    className={cn(
                      "group inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-[12px] font-medium transition-all",
                      isSynced
                        ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/15 dark:text-emerald-400"
                        : "border border-border-subtle bg-bg-secondary text-accent-light hover:bg-surface-hover",
                      isPending && "opacity-70",
                    )}
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted" />
                    ) : (
                      <>
                        <AgentIcon
                          agentKey={tool.key}
                          displayName={tool.display_name}
                          className="h-4 w-4 rounded-control"
                        />
                        <span>{tool.display_name}</span>
                        {isSynced && (
                          <CheckCircle2 className="h-3 w-3" />
                        )}
                        {!isSynced && (
                          <Plus className="h-3 w-3" />
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
            {showUnavailableAgents && (
              <div className="mt-2 flex flex-wrap gap-2">
                {unavailableTools.map((tool) => {
                  const reason = !tool.installed
                    ? t("mySkills.agentToggleNotInstalled")
                    : t("mySkills.agentToggleDisabledGlobally");
                  return (
                    <div
                      key={tool.key}
                      title={`${tool.display_name} · ${reason}`}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border-subtle bg-bg-secondary px-2 text-[12px] text-muted opacity-50"
                    >
                      <AgentIcon
                        agentKey={tool.key}
                        displayName={tool.display_name}
                        className="h-4 w-4 rounded-control grayscale"
                      />
                      <span>{tool.display_name}</span>
                    </div>
                  );
                })}
                {orphanTargets.map((target) => {
                  const tool = allTools.find((t) => t.key === target.tool);
                  const displayName = tool?.display_name ?? target.tool;
                  return (
                    <button
                      key={target.tool}
                      type="button"
                      title={`${displayName} · ${t("mySkills.targetOrphan")} · ${t("mySkills.targetClickUninstall")}`}
                      onClick={() => onToggleTarget?.(target.tool, false)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 text-[12px] text-amber-600 transition-all hover:bg-amber-500/15 dark:text-amber-400"
                    >
                      <AgentIcon
                        agentKey={target.tool}
                        displayName={displayName}
                        className="h-4 w-4 rounded-control opacity-70"
                      />
                      <span>{displayName}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {projects && projects.length > 0 && (
        <SkillProjectsSection
          skill={skill}
          projects={projects}
          onChanged={onProjectsChanged}
        />
      )}

      {supportsSourceDiff && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {(["local", "diff", "source"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setContentTab(tab)}
              className={cn(
                "rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors",
                contentTab === tab
                  ? "bg-accent text-white"
                  : "bg-surface-hover text-muted hover:text-secondary"
              )}
              disabled={tab === "source" && sourceLoading}
            >
              {tab === "local"
                ? t("mySkills.docTabs.local")
                : tab === "diff"
                  ? t("mySkills.docTabs.diff")
                  : t("mySkills.docTabs.source")}
            </button>
          ))}
          {activeSourceDoc && (
            <span className="rounded-full border border-border-subtle bg-surface px-2 py-1 text-[12px] text-muted">
              {activeSourceDoc.source_label} · {activeSourceDoc.revision.slice(0, 7)}
            </span>
          )}
        </div>
      )}

      {loading ? (
        <DocumentSkeleton />
      ) : contentTab === "diff" ? (
        sourceDiffLoading ? (
          <DocumentSkeleton />
        ) : activeSourceDiff ? (
          <SkillSourceDiffViewer entries={activeSourceDiff.entries} />
        ) : sourceDiffFailed ? (
          <EmptyState className="mt-12" title={t("mySkills.sourceDiffUnavailable")} />
        ) : (
          <DocumentSkeleton />
        )
      ) : contentTab === "source" ? (
        sourceLoading ? (
          <DocumentSkeleton />
        ) : activeSourceDoc ? (
          <SkillMarkdown content={activeSourceDoc.content} />
        ) : (
          <EmptyState className="mt-12" title={t("mySkills.sourceDiffUnavailable")} />
        )
      ) : activeDoc ? (
        <SkillMarkdown content={activeDoc.content} />
      ) : (
        <EmptyState className="mt-12" title={t("common.documentMissing")} />
      )}
    </DetailSheet>
  );
}
