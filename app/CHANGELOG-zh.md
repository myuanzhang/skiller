# 更新日志

本文件记录 Skiller 的所有重要变更，格式遵循
[Keep a Changelog](https://keepachangelog.com/)，版本号遵循语义化版本。
英文版见 [CHANGELOG.md](./CHANGELOG.md)。

## [1.25.2] - 2026-11-11

### 发布概览

- Skiller 从上游 skills-manager 更名独立后的首个发布版本。

### 用户可见更新

- 统一技能库：从 Git 仓库、本地文件夹、`.zip` / `.skill` 归档或
  skills.sh 市场安装 skill，统一汇入中央库（默认 `~/.skiller`）。
- 开箱支持 50+ 编码与个人 AI Agent，提供各 Agent 工作区、只读厂商
  skill 徽章，以及保护厂商 bundle 的后端写守卫。
- Preset 预设一键批量启用 / 停用；支持多选批量操作、标签与筛选。
- 项目工作区与中央库双向同步，并展示每个 skill 的同步状态与触发次数。
- 用 Git 对技能库做备份、快照与恢复。
- App 内检查更新，跳转 GitHub Releases 下载新版本。

### 开发者与治理更新

- Tauri 2（Rust）桌面壳 + React 19 + TypeScript 前端；
  `skiller-cli` 与 GUI 共享同一 Rust core。
- GitHub Actions 四平台发布流水线（macOS arm64/x64、Windows x64、
  Linux x64），产物发布到 GitHub Releases。
