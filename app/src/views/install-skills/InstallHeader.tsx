import { Box, Github, UploadCloud } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "../../utils";
import type { InstallTab } from "./types";

interface InstallHeaderProps {
  activeTab: InstallTab;
  onSwitchTab: (tab: InstallTab) => void;
}

export function InstallHeader({ activeTab, onSwitchTab }: InstallHeaderProps) {
  const { t } = useTranslation();

  const installLanes = [
    {
      id: "market" as const,
      label: t("install.browseMarket"),
      description: t("install.browseMarket"),
      icon: Box,
    },
    {
      id: "local" as const,
      label: t("install.localInstall"),
      description: t("install.local.description"),
      icon: UploadCloud,
    },
    {
      id: "git" as const,
      label: t("install.gitInstall"),
      description: t("install.gitDesc"),
      icon: Github,
    },
  ];

  const activeLane = installLanes.find((lane) => lane.id === activeTab) ?? installLanes[0];
  const ActiveLaneIcon = activeLane.icon;

  return (
    <div className="app-page-header border-b-0 pb-0">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="app-page-title">{t("install.title")}</h1>
          <p className="app-page-subtitle max-w-2xl text-tertiary">
            {activeLane.description}
          </p>
        </div>
        <div className="app-badge shrink-0">
          <ActiveLaneIcon className="h-3.5 w-3.5" />
          {activeLane.label}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {installLanes.map((lane) => {
          const Icon = lane.icon;
          const isActive = activeTab === lane.id;
          return (
            <button
              key={lane.id}
              onClick={() => onSwitchTab(lane.id)}
              className={cn(
                "app-panel flex items-center gap-3 px-3.5 py-3 text-left transition-all outline-none",
                isActive
                  ? "border-accent/50 bg-accent-bg"
                  : "hover:border-border hover:bg-surface-hover"
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
                  isActive
                    ? "border-accent-border bg-accent-bg text-accent-light"
                    : "border-border-subtle bg-background text-muted"
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className={cn("block truncate text-[13px] font-semibold", isActive ? "text-primary" : "text-secondary")}>
                  {lane.label}
                </span>
                <span className="mt-0.5 block truncate text-[12px] text-muted">
                  {lane.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
