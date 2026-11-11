# Changelog

All notable changes to Skiller are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/), and versions follow SemVer.
The Chinese counterpart lives in [CHANGELOG-zh.md](./CHANGELOG-zh.md).

## [1.25.2] - 2026-11-11

### Release Overview

- First standalone release of Skiller after the rebrand from the upstream
  skills-manager project.

### User-facing

- Unified skill library: install skills from Git repos, local folders,
  `.zip` / `.skill` archives, or the skills.sh marketplace into one central
  repo (default `~/.skiller`).
- Out-of-the-box support for 50+ coding and personal AI agents, with
  per-agent workspaces, read-only vendor skill badges, and backend write
  guards protecting vendor bundles.
- Presets for one-click bulk enable/disable; multi-select batch operations,
  tagging and filters.
- Project workspaces with two-way sync against the central library, plus
  per-skill sync status and trigger counts.
- Git backup, snapshots and restore for the skill library.
- In-app update check pointing at GitHub Releases.

### Developer & Governance

- Tauri 2 (Rust) desktop shell with a React 19 + TypeScript frontend;
  `skiller-cli` shares the same Rust core.
- Four-platform release pipeline (macOS arm64/x64, Windows x64, Linux x64)
  via GitHub Actions, producing installers on GitHub Releases.
