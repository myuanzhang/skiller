export type InstallTab = "market" | "local" | "git";

export type MarketTab = "hot" | "trending" | "alltime";

export interface GitSelection {
  rel_path: string;
  name: string;
  description: string | null;
  selected: boolean;
}
