<h1 align="center">Skiller</h1>

<p align="center">
  一个统一管理各 AI Agent Skills 的桌面应用。
</p>

<p align="center">
  <a href="./README.md">English</a>
</p>

## 功能

- **统一技能库** —— 从 Git 仓库、本地文件夹、`.zip` / `.skill` 归档，或 [skills.sh](https://skills.sh) 市场安装 skill。所有 skill 汇入一个中央库，默认位于 `~/.skiller`，可在**设置**里自定义。
- **预设（Preset）** —— 把若干 skill 打包成命名预设。在任意工作区点击预设即可为当前 Agent 范围一键启用/停用其全部 skill。
- **全局工作区** —— 每个 Agent 有独立页面，列出其全局目录里的所有 skill（包括不是通过 Skiller 安装的），与 Agent 实际看到的内容一致。可按 Agent 增删，或用「全部 Agents」总览统一管理。
- **项目工作区** —— 查看和管理各 Agent 的项目级 skill 目录，与中央库对比并双向同步。
- **多工具同步** —— 一键将 skill 以软链或复制方式同步到任意受支持的工具。
- **批量操作** —— 多选 skill 批量启用/停用、导出或删除。
- **标签与筛选** —— 给 skill 打标签，按来源或标签筛选。
- **更新追踪** —— 检查 Git 来源 skill 的上游更新；重新导入本地 skill。
- **自定义工具** —— 添加自己的 Agent/工具及其 skill 目录，或覆盖任意内置工具的默认路径。
- **Git 备份与恢复** —— 用 Git 对技能库做版本管理，实现备份与多机同步。

## 技术栈

| 层 | 技术 |
|---|---|
| 桌面框架 | Tauri 2（Rust） |
| 前端 | React 19 + TypeScript + Vite + TailwindCSS |
| 存储 | SQLite |
| CLI | `skiller-cli`（与 GUI 共享同一 Rust core） |

## 开发

需要 Rust 工具链 + Node。

```bash
cd app
npm install
export CARGO_TARGET_DIR="/tmp/skiller-target"   # 若构建报错，参考仓库 BUILD 说明
npm run tauri:dev    # 启动桌面 GUI（开发模式）
npm run cli -- --help # 运行 CLI
```

- 应用图标在 `src-tauri/icons/`，托盘图标在 `src-tauri/icons/tray/`。
- 中央库默认位于 `~/.skiller`（skills、SQLite DB、缓存、日志）。

## 许可证

MIT，见 [LICENSE](./LICENSE)。
