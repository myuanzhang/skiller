# 本地构建与运行

## TL;DR（一条命令起 dev）

```bash
export PATH="$HOME/.cargo/bin:$PATH"          # 让 cargo 上 PATH
export CARGO_TARGET_DIR="/tmp/skiller-target" # 关键：绕开 EPERM（见下）
cd app && npm install && npm run tauri:dev
```

## 前置依赖

- Node（已有，v24）
- Rust 工具链：`cargo` 在 `~/.cargo/bin/cargo`。当前 shell 未自动加载，需要
  `export PATH="$HOME/.cargo/bin:$PATH"`（可写进 `~/.zshrc` 持久化）。

## 已知问题：归档 `.rlib` 报 `Operation not permitted (os error 1)`

在本机（`~/Documents`、`~/.cache` 等 `$HOME` 下的目录）编译时，rustc 把
`.o` 打包成 `.rlib` 的归档步骤会随机报 `EPERM`，每次命中的 crate 还不一样。

- 根因：本机安全软件（EDR/端点扫描）在 rustc 写完目标文件、正要归档时抢占该
  文件。并行 job 越多命中率越高。
- 已排除：不是代码问题（失败都发生在第三方依赖上，且 `skiller` 自身能编过），
  也不是纯 `~/Documents` 的 TCC 保护（`~/.cache` 同样中招）。
- 实测规律：`/tmp`（= `/private/tmp`）下的 target 目录基本不受影响。

### 绕过办法（按推荐顺序）

1. **把 target 目录指到 `/tmp`（首选）**
   ```bash
   export CARGO_TARGET_DIR="/tmp/skiller-target"
   ```
   `tauri:dev` / `cargo build` 都会用它。注意 `/tmp` 会被系统定期清理，
   清掉后首次编译会重新来一遍（约几分钟）。

2. **降并发 + 重试循环**（`/tmp` 偶发失败时兜底）
   ```bash
   export CARGO_TARGET_DIR="/tmp/skiller-target"
   cd app/src-tauri
   until CARGO_BUILD_JOBS=1 cargo build --bin skiller; do echo retry; done
   until CARGO_BUILD_JOBS=1 cargo build --bin skiller-cli; do echo retry; done
   ```
   成功的 crate 会缓存，几轮内即可全部编过。编好后再 `npm run tauri:dev`
   就能秒起（依赖已缓存）。实测：GUI 与 CLI 二进制均可编出并运行。

3. **彻底修（可选）**：给终端 App 授予「完全磁盘访问权限」（系统设置 → 隐私
   与安全性 → 完全磁盘访问），或让 IT 把 `~/.cargo`、`~/.rustup`、
   `CARGO_TARGET_DIR` 加入安全软件白名单。

## 产物

- GUI：`$CARGO_TARGET_DIR/debug/skiller`
- CLI：`$CARGO_TARGET_DIR/debug/skiller-cli`
- 前端生产构建：`npm run build` → `app/dist/`

## 验证过的启动信号

`npm run tauri:dev` 正常时日志应出现：
`setup() body total …ms` → `i18n_ready` → `root_rendered` →
`get_tool_status: 51 tools`，且**无 panic**。
