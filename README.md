# skiller

统一、可视化管理各 AI Agent（Claude Code、Codex、TRAE、OpenCode、OpenClaw 等）的 Skills。

## 目录结构

```
skiller/
├── AGENTS.md              # Agent 行为入口（指针 → CLAUDE.md）
├── CLAUDE.md              # 编码行为准则（单一真源 SSoT）
├── docs/                  # 文档
│   ├── Agent管理机制.md    # Agent 管理机制说明
│   ├── BUILD.md           # 本地构建说明
│   └── research/          # 调研资料
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
export CARGO_TARGET_DIR="/tmp/skiller-target"   # 本机需绕开构建限制，见 docs/BUILD.md
npm run tauri:dev    # 启动桌面 GUI（开发模式）
npm run cli -- --help # 运行 CLI
```

> 本机构建 `.rlib` 时会遇到 `Operation not permitted` 报错（安全软件拦截），
> 绕过方法与产物路径见 [`docs/BUILD.md`](docs/BUILD.md)。

## 许可证

MIT，见 [`app/LICENSE`](app/LICENSE)。
