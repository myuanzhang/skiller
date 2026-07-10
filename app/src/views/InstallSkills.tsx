import { useState, useEffect, useLayoutEffect, useCallback, useRef, useMemo, useDeferredValue } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useApp } from "../context/AppContext";
import * as api from "../lib/tauri";
import type { ScanResult, SkillsShSkill, BatchImportResult, GitPreviewResult } from "../lib/tauri";
import { open } from "@tauri-apps/plugin-dialog";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useSearchParams, useNavigate } from "react-router-dom";
import { listen } from "@tauri-apps/api/event";
import { getErrorMessage, getErrorKind } from "../lib/error";
import { GitInstallSection } from "./install-skills/GitInstallSection";
import { GitPreviewDialog } from "./install-skills/GitPreviewDialog";
import { InstallHeader } from "./install-skills/InstallHeader";
import { LocalInstallSection } from "./install-skills/LocalInstallSection";
import { MarketplaceSection } from "./install-skills/MarketplaceSection";
import type { GitSelection, InstallTab, MarketTab } from "./install-skills/types";

const MARKET_PAGE_SIZE = 24;
const MARKET_SEARCH_STEP = 60;
const MARKET_SEARCH_DEBOUNCE_MS = 450;
const MARKET_SEARCH_CACHE_TTL_MS = 120_000;
const MARKET_SEARCH_CACHE_MAX_ENTRIES = 150;

export function InstallSkills() {
  const { t } = useTranslation();
  const { refreshPresets, refreshManagedSkills, managedSkills, openSkillDetailById } = useApp();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<InstallTab>("market");
  const [marketTab, setMarketTab] = useState<MarketTab>("alltime");
  const [marketQuery, setMarketQuery] = useState("");
  const [marketSourceFilter, setMarketSourceFilter] = useState("all");
  const [marketSkills, setMarketSkills] = useState<SkillsShSkill[]>([]);
  const [marketPage, setMarketPage] = useState(1);
  const [marketSearchLimit, setMarketSearchLimit] = useState(MARKET_SEARCH_STEP);
  const [marketLoading, setMarketLoading] = useState(false);
  const [marketLoadingMore, setMarketLoadingMore] = useState(false);
  const [marketError, setMarketError] = useState<string | null>(null);
  const [marketReloadKey, setMarketReloadKey] = useState(0);
  const [installing, setInstalling] = useState<string | null>(null);
  const [gitUrl, setGitUrl] = useState("");
  const [gitLoading, setGitLoading] = useState(false);
  const [gitCancelKey, setGitCancelKey] = useState<string | null>(null);
  const [gitPreview, setGitPreview] = useState<GitPreviewResult | null>(null);
  const [gitPreviewRepoUrl, setGitPreviewRepoUrl] = useState<string | null>(null);
  const [gitSelections, setGitSelections] = useState<GitSelection[]>([]);
  const [gitConfirmLoading, setGitConfirmLoading] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [importingPaths, setImportingPaths] = useState<Set<string>>(new Set());
  const [importingAll, setImportingAll] = useState(false);
  const [renameEditing, setRenameEditing] = useState<Record<string, string>>({});
  const marketListRef = useRef<HTMLDivElement | null>(null);
  const [sourceOverflowOpen, setSourceOverflowOpen] = useState(false);
  const [sourceOverflowSide, setSourceOverflowSide] = useState<"left" | "right">("left");
  const [sourceSearch, setSourceSearch] = useState("");
  const [sourceFocusedIndex, setSourceFocusedIndex] = useState(-1);
  const sourceListRef = useRef<HTMLDivElement | null>(null);
  const [visibleSourceCount, setVisibleSourceCount] = useState<number>(Infinity);
  const sourceOverflowBtnRef = useRef<HTMLButtonElement | null>(null);
  const sourceOverflowPanelRef = useRef<HTMLDivElement | null>(null);
  const filterContainerRef = useRef<HTMLDivElement | null>(null);
  const allBtnMeasureRef = useRef<HTMLButtonElement | null>(null);
  const moreBtnMeasureRef = useRef<HTMLButtonElement | null>(null);
  const sourceMeasureRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const marketSearchCacheRef = useRef<Map<string, { timestamp: number; data: SkillsShSkill[] }>>(new Map());
  const marketSkillsLengthRef = useRef(0);
  const [debouncedMarketQuery, setDebouncedMarketQuery] = useState("");
  const deferredMarketQuery = useDeferredValue(marketQuery);
  const resetSourceOverflowState = useCallback(() => {
    setSourceOverflowOpen(false);
    setSourceSearch("");
    setSourceFocusedIndex(-1);
  }, []);

  const managedSkillsRef = useRef(managedSkills);
  managedSkillsRef.current = managedSkills;

  const goToSkill = useCallback((skillName: string) => {
    // Use ref to get the latest managedSkills after refresh
    const skills = managedSkillsRef.current;
    const skill = skills.find(
      (s) => s.name === skillName || s.source_ref === skillName
    );
    if (skill) {
      openSkillDetailById(skill.id);
    }
    navigate("/my-skills");
  }, [navigate, openSkillDetailById]);

  const pruneMarketSearchCache = useCallback(() => {
    const now = Date.now();
    const entries = Array.from(marketSearchCacheRef.current.entries());

    for (const [key, value] of entries) {
      if (now - value.timestamp >= MARKET_SEARCH_CACHE_TTL_MS) {
        marketSearchCacheRef.current.delete(key);
      }
    }

    if (marketSearchCacheRef.current.size <= MARKET_SEARCH_CACHE_MAX_ENTRIES) {
      return;
    }

    const sorted = Array.from(marketSearchCacheRef.current.entries()).sort(
      (a, b) => a[1].timestamp - b[1].timestamp
    );
    const removeCount = marketSearchCacheRef.current.size - MARKET_SEARCH_CACHE_MAX_ENTRIES;
    for (const [key] of sorted.slice(0, removeCount)) {
      marketSearchCacheRef.current.delete(key);
    }
  }, []);

  const installedSourceRefs = useMemo(() => {
    const set = new Set<string>();
    for (const skill of managedSkills) {
      if (skill.source_type === "skillssh" && skill.source_ref) {
        set.add(skill.source_ref);
      }
    }
    return set;
  }, [managedSkills]);

  const findInstalledByGitUrl = useCallback((url: string) => {
    const trimmed = url.trim().replace(/\.git$/, "").toLowerCase();
    return managedSkills.find((s) => {
      if (!s.source_ref) return false;
      const ref = s.source_ref.replace(/\.git$/, "").toLowerCase();
      return ref === trimmed || ref.endsWith("/" + trimmed.split("/").slice(-2).join("/"));
    });
  }, [managedSkills]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedMarketQuery(deferredMarketQuery);
    }, MARKET_SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [deferredMarketQuery]);

  useEffect(() => {
    marketSkillsLengthRef.current = marketSkills.length;
  }, [marketSkills.length]);

  useEffect(() => {
    if (!sourceOverflowOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        sourceOverflowBtnRef.current?.contains(e.target as Node) ||
        sourceOverflowPanelRef.current?.contains(e.target as Node)
      ) return;
      resetSourceOverflowState();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [resetSourceOverflowState, sourceOverflowOpen]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "market" || tab === "local" || tab === "git") {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const switchTab = (tab: InstallTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const runScan = useCallback(async () => {
    setScanLoading(true);
    setLocalError(null);
    try {
      const result = await api.scanLocalSkills();
      setScanResult(result);
    } catch (error: unknown) {
      console.error(error);
      const message = getErrorMessage(error, t("common.error"));
      setLocalError(message);
      toast.error(message);
    } finally {
      setScanLoading(false);
    }
  }, [t]);

  // Silent variant used after install/import. Never surfaces a toast or
  // new error state — failure here must not mask the install success.
  // Clears any stale localError on success so successful operations don't
  // leave previous error banners behind.
  const runScanSilent = useCallback(async () => {
    try {
      const result = await api.scanLocalSkills();
      setScanResult(result);
      setLocalError(null);
    } catch (error: unknown) {
      console.warn("silent scan failed:", error);
    }
  }, []);

  const warnRejected = (results: PromiseSettledResult<unknown>[], label: string) => {
    for (const r of results) {
      if (r.status === "rejected") console.warn(`${label} failed:`, r.reason);
    }
  };

  useEffect(() => {
    if (activeTab !== "market") return;

    const query = debouncedMarketQuery.trim();
    const loadingMore =
      query.length > 0 &&
      marketSkillsLengthRef.current > 0 &&
      marketSearchLimit > marketSkillsLengthRef.current;

    if (query.length > 0 && !loadingMore) {
      const cacheKey = `${query.toLowerCase()}|${marketSearchLimit}`;
      const cached = marketSearchCacheRef.current.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < MARKET_SEARCH_CACHE_TTL_MS) {
        setMarketSkills(cached.data);
        setMarketLoading(false);
        setMarketLoadingMore(false);
        setMarketPage(1);
        setMarketError(null);
        return;
      }
    }

    setMarketLoadingMore(loadingMore);
    setMarketLoading(true);
    if (!loadingMore) {
      setMarketPage(1);
    }
    setMarketError(null);

    let stale = false;
    const request = query
      ? api.searchSkillssh(query, marketSearchLimit)
      : api.fetchLeaderboard(marketTab);

    request
      .then((result) => {
        if (stale) return;
        setMarketSkills(result);
        if (query.length > 0 && !loadingMore) {
          const cacheKey = `${query.toLowerCase()}|${marketSearchLimit}`;
          marketSearchCacheRef.current.set(cacheKey, { timestamp: Date.now(), data: result });
          pruneMarketSearchCache();
        }
        if (!loadingMore) {
          setMarketSourceFilter("all");
        }
      })
      .catch((e) => {
        if (stale) return;
        console.error(e);
        const message = e?.toString?.() || t("common.error");
        setMarketError(message);
        toast.error(message);
      })
      .finally(() => {
        if (stale) return;
        setMarketLoading(false);
        setMarketLoadingMore(false);
      });

    return () => { stale = true; };
  }, [activeTab, debouncedMarketQuery, marketReloadKey, marketSearchLimit, marketTab, pruneMarketSearchCache, t]);

  useEffect(() => {
    if (activeTab === "local" && !scanResult && !scanLoading) {
      runScan();
    }
  }, [activeTab, scanLoading, scanResult, runScan]);

  const installLocalSource = async (sourcePath: string) => {
    const name = sourcePath.split("/").pop() || sourcePath;
    const toastId = toast.loading(t("install.toast.installing", { name }));
    try {
      await api.installLocal(sourcePath);
    } catch (e) {
      const message = getErrorMessage(e, t("common.error"));
      setLocalError(message);
      toast.error(message, { id: toastId });
      return;
    }
    // Install succeeded — post-install refresh is best-effort and must not
    // surface as an install failure.
    const results = await Promise.allSettled([
      refreshPresets(),
      refreshManagedSkills(),
      runScanSilent(),
    ]);
    warnRejected(results, "post-install refresh");
    toast.success(t("install.toast.success", { name }), {
      id: toastId,
      action: {
        label: t("install.toast.view"),
        onClick: () => goToSkill(name),
      },
    });
  };

  const handleLocalFolderInstall = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
      });
      if (!selected) return;
      installLocalSource(selected as string);
    } catch (error: unknown) {
      const message = getErrorMessage(error, t("common.error"));
      setLocalError(message);
      toast.error(message);
    }
  };

  const handleLocalFileInstall = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: "Skills", extensions: ["zip", "skill"] }],
      });
      if (!selected) return;
      installLocalSource(selected as string);
    } catch (error: unknown) {
      const message = getErrorMessage(error, t("common.error"));
      setLocalError(message);
      toast.error(message);
    }
  };

  const handleBatchImportFolder = async () => {
    let unlisten: (() => void) | null = null;
    try {
      const selected = await open({
        directory: true,
        multiple: false,
      });
      if (!selected) return;

      const toastId = toast.loading(t("install.local.batchImporting"));

      unlisten = await listen<{ current: number; total: number; name: string }>(
        "batch-import-progress",
        (event) => {
          const { current, total, name } = event.payload;
          toast.loading(
            t("install.local.batchProgress", { current, total, name }),
            { id: toastId }
          );
        }
      );

      const result: BatchImportResult = await api.batchImportFolder(
        selected as string
      );

      if (result.errors.length > 0) {
        const previewErrors = result.errors.slice(0, 3).join("; ");
        const remaining = result.errors.length - 3;
        const detail = remaining > 0 ? `${previewErrors}; +${remaining} more` : previewErrors;
        toast.error(
          `${t("install.local.batchErrors", { count: result.errors.length })}: ${detail}`,
          { id: toastId }
        );
      } else if (result.imported === 0) {
        toast.info(
          t("install.local.batchAllSkipped", { skipped: result.skipped }),
          { id: toastId }
        );
      } else {
        toast.success(
          t("install.local.batchSuccess", {
            imported: result.imported,
            skipped: result.skipped,
          }),
          { id: toastId }
        );
      }

      await Promise.all([refreshPresets(), refreshManagedSkills()]);
      runScan();
    } catch (error: unknown) {
      const message = getErrorMessage(error, t("common.error"));
      setLocalError(message);
      toast.error(message);
    } finally {
      unlisten?.();
    }
  };

  const handleInstallSkillssh = async (skill: SkillsShSkill) => {
    const displayName = skill.name || skill.skill_id;
    const cancelKey = `${skill.source}/${skill.skill_id}`;
    setInstalling(skill.id);

    const toastId = toast.loading(t("install.toast.cloning"));
    let unlisten: (() => void) | null = null;

    try {
      unlisten = await listen<{ skill_id: string; phase: string; detail?: string }>(
        "install-progress",
        (event) => {
          if (event.payload.skill_id !== cancelKey) return;
          if (event.payload.phase === "cloning") {
            const detail = event.payload.detail?.trim();
            const msg = detail
              ? `${t("install.toast.cloning")}\n${detail}`
              : t("install.toast.cloning");
            toast.loading(msg, { id: toastId });
          } else if (event.payload.phase === "installing") {
            toast.loading(t("install.toast.installing", { name: displayName }), { id: toastId });
          }
        }
      );
      await api.installFromSkillssh(skill.source, skill.skill_id);
      await Promise.all([refreshPresets(), refreshManagedSkills()]);
      toast.success(t("install.toast.success", { name: displayName }), {
        id: toastId,
        action: {
          label: t("install.toast.view"),
          onClick: () => goToSkill(displayName),
        },
      });
    } catch (error: unknown) {
      if (getErrorKind(error) === "cancelled") {
        toast.info(t("install.toast.cancelled"), { id: toastId });
      } else {
        toast.error(getErrorMessage(error, t("common.error")), { id: toastId });
      }
    } finally {
      setInstalling(null);
      unlisten?.();
    }
  };

  const handleCancelInstall = (cancelKey: string) => {
    api.cancelInstall(cancelKey).catch(() => {
      // Ignore race: install may have completed before cancel request arrives.
    });
  };

  const handleGitPreview = async () => {
    if (!gitUrl.trim()) return;
    setGitLoading(true);
    const url = gitUrl.trim();
    setGitCancelKey(url);

    const toastId = toast.loading(t("install.toast.cloning"));
    let unlisten: (() => void) | null = null;

    try {
      unlisten = await listen<{ skill_id: string; phase: string; detail?: string }>(
        "install-progress",
        (event) => {
          if (event.payload.skill_id !== url) return;
          if (event.payload.phase === "cloning") {
            const detail = event.payload.detail?.trim();
            const msg = detail
              ? `${t("install.toast.cloning")}\n${detail}`
              : t("install.toast.cloning");
            toast.loading(msg, { id: toastId });
          }
        }
      );
      const preview = await api.previewGitInstall(url);
      toast.dismiss(toastId);
      setGitPreview(preview);
      setGitPreviewRepoUrl(url);
      setGitSelections(preview.skills.map((s) => ({
        rel_path: s.rel_path,
        name: s.name,
        description: s.description,
        selected: true,
      })));
    } catch (error: unknown) {
      if (getErrorKind(error) === "cancelled") {
        toast.info(t("install.toast.cancelled"), { id: toastId });
      } else {
        toast.error(getErrorMessage(error, t("common.error")), { id: toastId });
      }
    } finally {
      setGitLoading(false);
      setGitCancelKey(null);
      unlisten?.();
    }
  };

  const handleGitPreviewClose = () => {
    if (gitConfirmLoading) return;
    if (gitPreview) {
      api.cancelGitPreview(gitPreview.temp_dir).catch(() => {});
    }
    setGitPreview(null);
    setGitPreviewRepoUrl(null);
    setGitSelections([]);
  };

  const handleGitConfirm = async () => {
    if (!gitPreview) return;
    const repoUrl = gitPreviewRepoUrl ?? gitUrl.trim();
    if (!repoUrl) return;
    const selected = gitSelections.filter((s) => s.selected);
    if (selected.length === 0) return;
    setGitConfirmLoading(true);
    try {
      await api.confirmGitInstall(
        repoUrl,
        gitPreview.temp_dir,
        selected.map((s) => ({ rel_path: s.rel_path, name: s.name }))
      );
      await Promise.all([refreshPresets(), refreshManagedSkills()]);
      toast.success(t("install.toast.success", { name: selected.map((s) => s.name).join(", ") }));
      setGitUrl("");
      setGitPreview(null);
      setGitPreviewRepoUrl(null);
      setGitSelections([]);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, t("common.error")));
    } finally {
      setGitConfirmLoading(false);
    }
  };

  const handleImportDiscovered = async (sourcePath: string, name: string) => {
    setImportingPaths((prev) => new Set(prev).add(sourcePath));
    try {
      try {
        await api.importExistingSkill(sourcePath, name);
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, t("common.error")));
        return;
      }
      toast.success(t("install.scan.importedOne", { name }));
      const results = await Promise.allSettled([
        refreshPresets(),
        refreshManagedSkills(),
        runScanSilent(),
      ]);
      warnRejected(results, "post-import refresh");
    } finally {
      setImportingPaths((prev) => {
        const next = new Set(prev);
        next.delete(sourcePath);
        return next;
      });
    }
  };

  const handleImportAllDiscovered = async () => {
    setImportingAll(true);
    try {
      try {
        await api.importAllDiscovered();
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, t("common.error")));
        return;
      }
      toast.success(t("install.scan.importedAll"));
      const results = await Promise.allSettled([
        refreshPresets(),
        refreshManagedSkills(),
        runScanSilent(),
      ]);
      warnRejected(results, "post-import refresh");
    } finally {
      setImportingAll(false);
    }
  };

  const scrollMarketListToTop = () => {
    marketListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const changeMarketPage = (page: number) => {
    setMarketPage(page);
    scrollMarketListToTop();
  };

  const scanGroups = scanResult?.groups ?? [];
  const pendingGroups = scanGroups.filter((group) => !group.imported);
  const sourceOptions = useMemo(
    () => Array.from(new Set(marketSkills.map((skill) => skill.source))),
    [marketSkills]
  );

  // Measure how many source pills can fit in one row; reserve room for All + More.
  const computeVisibleCount = useCallback(() => {
    const container = filterContainerRef.current;
    const allBtn = allBtnMeasureRef.current;
    const moreBtn = moreBtnMeasureRef.current;
    if (!container || !allBtn || !moreBtn) {
      setVisibleSourceCount(Infinity);
      return;
    }

    const containerWidth = container.clientWidth;
    if (containerWidth <= 0) {
      setVisibleSourceCount(Infinity);
      return;
    }

    const styles = window.getComputedStyle(container);
    const gap = parseFloat(styles.columnGap || styles.gap || "6") || 6;
    const available = containerWidth - allBtn.offsetWidth - gap - moreBtn.offsetWidth - gap;

    if (available <= 0) {
      setVisibleSourceCount(0);
      return;
    }

    let used = 0;
    let count = 0;
    for (let i = 0; i < sourceOptions.length; i += 1) {
      const el = sourceMeasureRefs.current[i];
      const w = el?.offsetWidth ?? 0;
      if (w <= 0) continue;
      const nextUsed = used + (count > 0 ? gap : 0) + w;
      if (nextUsed <= available) {
        used = nextUsed;
        count += 1;
      } else {
        break;
      }
    }
    setVisibleSourceCount(count);
  }, [sourceOptions]);

  useLayoutEffect(() => {
    computeVisibleCount();
  }, [computeVisibleCount]);

  useEffect(() => {
    const container = filterContainerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(computeVisibleCount);
    observer.observe(container);
    return () => observer.disconnect();
  }, [computeVisibleCount]);

  const filteredMarketSkills = useMemo(() => {
    const filtered = marketSourceFilter === "all"
      ? marketSkills
      : marketSkills.filter((skill) => skill.source === marketSourceFilter);
    if (debouncedMarketQuery.trim().length > 0) {
      return [...filtered].sort((a, b) => b.installs - a.installs);
    }
    return filtered;
  }, [marketSkills, marketSourceFilter, debouncedMarketQuery]);

  const totalMarketPages = Math.max(1, Math.ceil(filteredMarketSkills.length / MARKET_PAGE_SIZE));
  const currentMarketPage = Math.min(marketPage, totalMarketPages);
  const marketPageStart = (currentMarketPage - 1) * MARKET_PAGE_SIZE;
  const paginatedMarketSkills = filteredMarketSkills.slice(
    marketPageStart,
    marketPageStart + MARKET_PAGE_SIZE
  );
  const visibleMarketPages = Array.from(
    { length: totalMarketPages },
    (_, index) => index + 1
  ).filter((page) => {
    if (totalMarketPages <= 7) return true;
    if (page === 1 || page === totalMarketPages) return true;
    return Math.abs(page - currentMarketPage) <= 1;
  });
  const hasMarketQuery = debouncedMarketQuery.trim().length > 0;
  const canLoadMoreSearch = hasMarketQuery && marketSkills.length >= marketSearchLimit;
  const isLoadingMoreSearch = hasMarketQuery && marketLoadingMore;
  const overflowSources = sourceOptions.slice(visibleSourceCount);
  const filteredOverflowSources = sourceSearch
    ? overflowSources.filter((s) => s.toLowerCase().includes(sourceSearch.toLowerCase()))
    : overflowSources;

  useEffect(() => {
    if (sourceOverflowOpen && visibleSourceCount >= sourceOptions.length) {
      resetSourceOverflowState();
    }
  }, [resetSourceOverflowState, sourceOptions.length, sourceOverflowOpen, visibleSourceCount]);

  useEffect(() => {
    setSourceFocusedIndex((idx) => {
      if (filteredOverflowSources.length === 0) return -1;
      if (idx < 0) return idx;
      return Math.min(idx, filteredOverflowSources.length - 1);
    });
  }, [filteredOverflowSources.length]);

  // Scroll the focused overflow item into view whenever the index changes
  useEffect(() => {
    if (sourceFocusedIndex < 0) return;
    sourceListRef.current
      ?.children[sourceFocusedIndex]
      ?.scrollIntoView({ block: "nearest" });
  }, [sourceFocusedIndex]);

  const toggleSourceOverflow = () => {
    if (sourceOverflowBtnRef.current) {
      const rect = sourceOverflowBtnRef.current.getBoundingClientRect();
      setSourceOverflowSide(rect.left + 192 > window.innerWidth ? "right" : "left");
    }
    setSourceOverflowOpen((value) => {
      if (value) {
        setSourceSearch("");
        setSourceFocusedIndex(-1);
      }
      return !value;
    });
  };

  return (
    <div className="app-page gap-4">
      <InstallHeader activeTab={activeTab} onSwitchTab={switchTab} />

      {activeTab === "market" && (
        <MarketplaceSection
          marketTab={marketTab}
          onMarketTabChange={setMarketTab}
          hasMarketQuery={hasMarketQuery}
          marketQuery={marketQuery}
          onMarketQueryChange={(query) => {
            setMarketQuery(query);
            setMarketSearchLimit(MARKET_SEARCH_STEP);
          }}
          sourceOptions={sourceOptions}
          marketSourceFilter={marketSourceFilter}
          onMarketSourceFilterChange={setMarketSourceFilter}
          filterContainerRef={filterContainerRef}
          allBtnMeasureRef={allBtnMeasureRef}
          moreBtnMeasureRef={moreBtnMeasureRef}
          sourceMeasureRefs={sourceMeasureRefs}
          visibleSourceCount={visibleSourceCount}
          sourceOverflowBtnRef={sourceOverflowBtnRef}
          sourceOverflowPanelRef={sourceOverflowPanelRef}
          sourceOverflowOpen={sourceOverflowOpen}
          sourceOverflowSide={sourceOverflowSide}
          onToggleSourceOverflow={toggleSourceOverflow}
          sourceSearch={sourceSearch}
          onSourceSearchChange={setSourceSearch}
          filteredOverflowSources={filteredOverflowSources}
          sourceFocusedIndex={sourceFocusedIndex}
          setSourceFocusedIndex={setSourceFocusedIndex}
          resetSourceOverflowState={resetSourceOverflowState}
          sourceListRef={sourceListRef}
          marketError={marketError}
          onRetryMarket={() => setMarketReloadKey((value) => value + 1)}
          marketLoading={marketLoading}
          marketLoadingMore={marketLoadingMore}
          marketListRef={marketListRef}
          filteredMarketSkillsLength={filteredMarketSkills.length}
          paginatedMarketSkills={paginatedMarketSkills}
          installedSourceRefs={installedSourceRefs}
          installing={installing}
          onOpenSkillWeb={(skill) => openUrl(`https://skills.sh/${skill.source}/${skill.skill_id}`)}
          onCancelInstall={handleCancelInstall}
          onInstallSkillssh={handleInstallSkillssh}
          totalMarketPages={totalMarketPages}
          currentMarketPage={currentMarketPage}
          visibleMarketPages={visibleMarketPages}
          onChangeMarketPage={changeMarketPage}
          canLoadMoreSearch={canLoadMoreSearch}
          isLoadingMoreSearch={isLoadingMoreSearch}
          onLoadMoreSearch={() => setMarketSearchLimit((value) => value + MARKET_SEARCH_STEP)}
        />
      )}

      {activeTab === "local" && (
        <LocalInstallSection
          localError={localError}
          scanResult={scanResult}
          scanGroups={scanGroups}
          pendingGroups={pendingGroups}
          scanLoading={scanLoading}
          importingAll={importingAll}
          importingPaths={importingPaths}
          renameEditing={renameEditing}
          setRenameEditing={setRenameEditing}
          onLocalFolderInstall={handleLocalFolderInstall}
          onLocalFileInstall={handleLocalFileInstall}
          onBatchImportFolder={handleBatchImportFolder}
          onRunScan={runScan}
          onImportAllDiscovered={handleImportAllDiscovered}
          onImportDiscovered={handleImportDiscovered}
        />
      )}

      {activeTab === "git" && (
        <GitInstallSection
          gitUrl={gitUrl}
          onGitUrlChange={setGitUrl}
          gitLoading={gitLoading}
          gitCancelKey={gitCancelKey}
          findInstalledByGitUrl={findInstalledByGitUrl}
          onCancelInstall={handleCancelInstall}
          onGitPreview={handleGitPreview}
        />
      )}

      {gitPreview && (
        <GitPreviewDialog
          gitSelections={gitSelections}
          setGitSelections={setGitSelections}
          gitConfirmLoading={gitConfirmLoading}
          onClose={handleGitPreviewClose}
          onConfirm={handleGitConfirm}
        />
      )}
    </div>
  );
}
