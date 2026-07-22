# 技能触发次数统计：解析 TRAE session 日志，而非让 agent 埋点上报

skiller 作为外部管理器在 agent 运行时并不「在场」，无法直接观测 skill 触发。要给技能卡片的触发次数角标提供数据，我们在 `collect_usage_trae`（`commands/skills.rs`）里**解析 TRAE CLI 的 session 日志**（`~/.trae/cli/sessions/**/*.jsonl`，取 `payload.name=="Skill"` 的 function_call），而不是要求每个 agent 在触发时主动上报 usage 事件。

## Considered Options

- **让 agent 埋点上报**：约定 agent 每次触发 skill 时往固定位置追加一条 usage 事件。数据最准、跨 agent 统一，但需要每个 agent 配合改 hook / 约定，落地面大，且无法强制第三方 agent 照做。
- **解析 TRAE session 日志（采纳）**：零侵入、能回溯历史数据，契合 skiller「观察者」定位。TRAE 的 `Skill` function_call 是结构化、无歧义的可靠信号。

## Consequences

- 目前只覆盖 TRAE。Claude Code 的 transcript（`~/.claude/projects/**/*.jsonl`）实测无 skill 触发信号，其 `~/.claude/skill-stats.json` 源在本机不存在——该源代码保留仅为兼容其他环境。
- `get_skill_usage_stats` 每次调用会现扫全部 session 文件（当前量级很快，暂不缓存）。
- 只统计 `Skill` function_call，不含 `<command-name>` slash 标记，避免同一次触发被双重计数。

机制细节（数据源合并、name 对齐、计数口径）见 [`docs/架构/技能触发次数统计机制.md`](../架构/技能触发次数统计机制.md)。
