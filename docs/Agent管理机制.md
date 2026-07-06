---
title: Agent 管理机制
type: reference
tags: [skiller, agent, tool-adapter, 全局工作区, 机制]
created: 2026-07-05
updated: 2026-07-05
---

# Agent 管理机制

> 本文说明 skiller 如何定义、发现、显示和管理各 AI Agent（代码中称
> **tool** / `ToolAdapter`），以及「全局工作区」列表是怎么算出来的。
> 面向开发者与日常使用两类读者。

## 术语对齐

- **Agent = tool = `ToolAdapter`**：三个词指同一个东西（Claude Code、Codex、
  TRAE 等）。代码里叫 tool / ToolAdapter，UI 与本文叫 Agent。
- **skills 目录**：每个 Agent 读取 skill 的用户级目录，如
  `~/.claude/skills`、`~/.codex/skills`。
- **探测目录（detect dir）**：判断该 Agent「是否安装」时检查的目录，
  通常是 skills 目录的父级，如 `~/.claude`。

## 一句话模型

「全局工作区」显示的 Agent 是三层的交集：

```
显示的 Agent = 内置定义 ∩ installed（装没装）∩ enabled（开没开）
              且 category 与当前工作区（Coding / Lobster）匹配
```

前端过滤逻辑：`app/src/views/WorkspaceView.tsx:255`
```ts
tools.filter(t => t.installed && t.enabled && t.category === config.category)
```

## 三层过滤详解

### 第 0 层：内置定义 —— `default_tool_adapters()`

硬编码约 51 个 Agent，位于
`app/src-tauri/src/core/tool_adapters.rs:147`。每个是一个 `ToolAdapter`
（结构定义见同文件 line 17）。关键字段：

| 字段 | 含义 | 例 |
|---|---|---|
| `key` | 唯一标识 | `claude_code` |
| `display_name` | UI 显示名 | `Claude Code` |
| `relative_skills_dir` | 用户级 skills 目录（相对 `$HOME`） | `.claude/skills` |
| `relative_detect_dir` | 探测目录，存在即视为已安装 | `.claude` |
| `project_relative_skills_dir` | 项目级 skills 路径覆盖（可空） | OpenCode 用 `.opencode/skills` |
| `category` | UI 分组：`Coding` / `Lobster`，**纯排版，不影响部署** | `Coding` |
| `additional_scan_dirs` | 仅用于发现的额外扫描目录 | Codex 兜底扫 `.agents/skills` |
| `recursive_scan` | 是否递归扫描嵌套 skill 目录 | Hermes 用 |

### 第 1 层：installed（装没装）—— `ToolAdapter::is_installed()`

位于 `tool_adapters.rs:130`。判断办法很朴素：**看 `$HOME` 下有没有它的
探测目录**。

- `~/.claude` 存在 → Claude Code 判定「已安装」
- `~/.cursor` 不存在 → Cursor 判定「未安装」→ 全局工作区不显示

例外：**自定义工具（custom）与设置了路径覆盖（override）的 Agent 永远返回
`true`**（`is_installed` line 133），因为用户已显式给了 skills 路径，无需再探测。

> 关键：skiller 不去问系统「你到底装没装 Cursor」，只看「home 下有没有
> `.cursor` 文件夹」。有就当装了。

### 第 2 层：enabled（开没开）—— `disabled_tools` 设置

运行时状态，存在 SQLite 的 `settings` 表（key = `disabled_tools`，一个 key
数组），**不进 git、只影响本机**。

- UI 里点开关 → `set_tool_enabled` 命令把 key 加入/移出 `disabled_tools`
  （`app/src-tauri/src/commands/tools.rs`）。
- 后端 `enabled_installed_adapters()`（`tool_adapters.rs:897`）返回
  「已安装且不在 disabled 名单」的 Agent。
- 禁用某 Agent 时还会 `unsync_all_for_tool`（解除该 Agent 的 skill 同步）。

## 如何新增 / 恢复一个 Agent

对照三层过滤，新增有三种情况，动的地方不同：

| 目标 | 本质 | 做法 | 是否改代码 |
|---|---|---|---|
| **A. 让「未安装被隐藏」的内置 Agent 显示**（如 Cursor） | 过第 1 层 | ① 真装该 Agent（建出探测目录）；或 ② 设置里给它「覆盖路径」指向真实存在的目录（`custom_tool_paths`），`is_installed` 即返回 true | 否（运行时） |
| **B. 接入内置清单里根本没有的新 Agent** | 内置之外新增一条 | 设置里「添加自定义工具」，填 `key` / `display_name` / `skills_dir`（绝对路径）/ category。存进 `custom_tools` 设置，`all_tool_adapters()` 自动合并（`tool_adapters.rs:848/832`）。自定义工具天生跳过第 1 层 | 否（运行时） |
| **C. 从内置清单彻底移除某 Agent** | 删源码定义 | 改 `default_tool_adapters()`，重新编译 | 是 |

**软删除 vs 硬删除**：想「只保留某几个 Agent」时——
- **软删除（推荐）**：UI 里关掉不想要的 → 进 `disabled_tools`。不改代码、
  可逆、只影响本机。
- **硬删除**：改 `default_tool_adapters()` 源码。进 git、影响所有人、需重新编译。

## 设置页的「热门 Agent」/「更多 Agent」分组（另一维度）

这两栏是**设置页里的视觉排版**，与上面的三层过滤**无关**。划分依据是一份
写死的「主流名单」`MAINSTREAM_AGENT_KEYS`（`app/src/views/Settings.tsx:66`）。

| 分组 | i18n key | 含义 |
|---|---|---|
| **热门 Agent** | `settings.builtInAgents` | 在主流名单里的 13 个，摆前面 |
| **更多 Agent（N）** | `settings.moreAgentsSection` | 不在名单里的其余，折叠在后 |

代码（`Settings.tsx:733/737`）：
```ts
mainstreamTools = builtInTools.filter(t =>  MAINSTREAM_AGENT_KEYS.has(t.key))
secondaryTools = builtInTools.filter(t => !MAINSTREAM_AGENT_KEYS.has(t.key))
```

主流名单（13 个）：`claude_code, cursor, codex, grok, gemini_cli,
github_copilot, opencode, hermes, openclaw, windsurf, kiro, antigravity, amp`。

**注意**：每一栏里都可能同时有「已安装」和「未安装」的 Agent——分组只决定
排在哪栏，不决定装没装。例如 Cursor 在「热门 Agent」栏但标「未安装」。

## 三个维度对照表（避免混淆）

| 维度 | 由谁决定 | 影响什么 | 存储 |
|---|---|---|---|
| 热门 / 更多（分组栏） | `MAINSTREAM_AGENT_KEYS` | 仅设置页排版位置 | 前端写死 |
| 已安装 / 未安装 | home 下有无探测目录 | 全局工作区显不显示 + 设置页标注 | 文件系统 |
| 启用 / 禁用 | `disabled_tools` 名单（UI 开关） | 全局工作区显不显示 | SQLite（本机） |
| Coding / Lobster | `ToolAdapter.category` | 分到哪个工作区页面 | 内置定义 |

## 数据流（点开界面到显示列表）

```
前端 WorkspaceView
   │  invoke("get_tool_status")            # commands/tools.rs
   ▼
tool_service::list_tool_info(store)        # 组装每个 Agent 的 installed/enabled
   │  installed = adapter.is_installed()   # 第 1 层：探测目录
   │  enabled   = !disabled.contains(key)  # 第 2 层：disabled_tools
   ▼
返回 ToolInfoDto[] 给前端
   │
   ▼
WorkspaceView 再按 installed && enabled && category 过滤 → 渲染列表
```

## 关键代码位置速查

| 内容 | 文件:行 |
|---|---|
| `ToolAdapter` 结构 | `app/src-tauri/src/core/tool_adapters.rs:17` |
| 内置 Agent 清单 | `tool_adapters.rs:147` (`default_tool_adapters`) |
| 是否已安装 | `tool_adapters.rs:130` (`is_installed`) |
| 合并内置 + 自定义 | `tool_adapters.rs:848` (`all_tool_adapters`) |
| 自定义工具 → adapter | `tool_adapters.rs:832` (`custom_tool_adapter`) |
| 已安装且启用的列表 | `tool_adapters.rs:897` (`enabled_installed_adapters`) |
| 工具状态命令 | `app/src-tauri/src/commands/tools.rs` (`get_tool_status` / `set_tool_enabled` / `add_custom_tool`) |
| 全局工作区过滤 | `app/src/views/WorkspaceView.tsx:255` |
| 主流名单与分组 | `app/src/views/Settings.tsx:66,733,737` |
