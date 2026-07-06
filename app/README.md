<h1 align="center">Skiller</h1>

<p align="center">
  One app to manage AI agent skills across all your coding tools.
</p>

<p align="center">
  <a href="./README.zh-CN.md">中文说明</a>
</p>

## Features

- **Unified skill library** — Install skills from Git repos, local folders, `.zip` / `.skill` archives, or the [skills.sh](https://skills.sh) marketplace. Everything goes into one central repo, which defaults to `~/.skiller` and can be customized in **Settings**.
- **Presets** — Group skills into named presets. In any workspace, click a preset pill to instantly activate or deactivate all its skills for the current agent scope.
- **Global Workspace** — Each agent gets its own page listing every skill in its global folder — including ones installed outside Skiller — so the view always reflects what the agent actually sees. Add or remove skills per agent, or use the All Agents overview to manage every installed agent at once.
- **Project Workspaces** — View and manage project-local skill folders for supported agents, compare them with your central library, and sync changes in either direction.
- **Multi-tool sync** — Sync skills to any supported tool via symlink or copy with a single click.
- **Batch operations** — Multi-select skills for bulk enable/disable, export, or delete.
- **Skill tagging and filters** — Tag skills and filter by source or tag.
- **Update tracking** — Check for upstream updates on Git-based skills; re-import local ones.
- **Custom tools** — Add your own agents/tools with custom skills directories, or override the default path for any built-in tool.
- **Git backup and restore** — Version-control your skill library with Git for backup and multi-machine sync.

## Tech Stack

| Layer | Tech |
|---|---|
| Desktop shell | Tauri 2 (Rust) |
| Frontend | React 19 + TypeScript + Vite + TailwindCSS |
| Storage | SQLite |
| CLI | `skiller-cli` (shares the same Rust core) |

## Development

Requires a Rust toolchain and Node.

```bash
cd app
npm install
export CARGO_TARGET_DIR="/tmp/skiller-target"   # see the repo BUILD notes if you hit build errors
npm run tauri:dev    # launch the desktop GUI (dev mode)
npm run cli -- --help # run the CLI
```

- App icons live in `src-tauri/icons/`; tray icons in `src-tauri/icons/tray/`.
- The central library defaults to `~/.skiller` (skills, SQLite DB, cache, logs).

## License

MIT. See [LICENSE](./LICENSE).
