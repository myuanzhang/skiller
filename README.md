# skiller

统一、可视化管理各 AI Agent（Claude Code、Codex、TRAE、OpenCode、OpenClaw 等）的 Skills。

## 目录结构

```
skiller/
├── AGENTS.md              # Agent 协作入口（指针 → CLAUDE.md + 文档更新规则）
├── CLAUDE.md              # 编码行为准则（单一真源 SSoT）
├── docs/                  # 文档（索引见 docs/README.md）
│   ├── 架构/              # 现行机制说明（Agent 管理、中央仓库、技能发现等）
│   ├── 协作/              # AI 协作：会话交接说明、交接 Prompt
│   ├── 开发环境.md        # 本地构建与运行
│   ├── research/          # 调研资料
│   └── archive/           # 已完成的历史计划（冻结存档）
└── app/                   # 应用代码（Tauri: Rust 后端 + React/TS 前端）
    ├── src/               # 前端
    └── src-tauri/         # 后端 + CLI
```

## 快速上手（app/）

需要 Rust 工具链 + Node。

```bash
cd app
npm install
export PATH="$HOME/.cargo/bin:$PATH"
export CARGO_TARGET_DIR="/tmp/skiller-target"   # 本机需绕开构建限制
npm run tauri:dev    # 启动桌面 GUI（开发模式）
npm run cli -- --help # 运行 CLI
```

> 本机构建 `.rlib` 会遇到 `Operation not permitted`（安全软件拦截）。
> 绕过方法、产物路径与启动信号见 [`docs/开发环境.md`](docs/开发环境.md)。

## 文档

- 开发文档索引：[`docs/README.md`](docs/README.md)
- 编码准则：[`CLAUDE.md`](CLAUDE.md)

## 许可证

MIT，见 [`app/LICENSE`](app/LICENSE)。
