# skiller

统一、可视化管理各 AI Agent（Claude Code、Codex、TRAE、OpenCode、OpenClaw 等）的 Skills。

基于开源项目 [xingkongliang/skills-manager](https://github.com/xingkongliang/skills-manager) 二次开发。

## 目录结构

```
skiller/
├── AGENTS.md              # Agent 行为入口（指针 → CLAUDE.md）
├── CLAUDE.md              # 编码行为准则（单一真源 SSoT）
├── docs/                  # 产品与调研文档
│   ├── PRD.md             # 产品需求
│   ├── 目录结构设计方案.md
│   ├── research/          # 调研资料
│   └── decisions/         # 架构决策记录 (ADR)
└── app/                   # 应用代码（Tauri: Rust 后端 + React/TS 前端）
    ├── src/               # 前端
    └── src-tauri/         # 后端 + CLI
```

## 快速上手（app/）

需要 Rust 工具链 + Node。

```bash
cd app
npm install
npm run tauri:dev    # 启动桌面 GUI（开发模式）
npm run cli -- --help # 运行 CLI
```

## 与上游同步

`app/` 由 skills-manager 收敛而来（已去除嵌套 git，统一由 skiller 单仓库管理）。
上游仍在活跃迭代，如需拉取上游更新，参考 `docs/decisions/0001-fork-策略.md`。
