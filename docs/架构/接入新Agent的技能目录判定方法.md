---
title: 接入新 Agent 的技能目录判定方法
type: reference
tags: [skiller, agent, tool-adapter, skills-dir, 只读目录, 方法论, onboarding]
created: 2026-07-14
updated: 2026-07-14
---

# 接入新 Agent 的技能目录判定方法

> 本文回答一个问题：**接入一个新的 Agent 时，如何正确判断它的 skill 放在哪些目录、每个目录该归为哪一类？**
> 结论先行：统一模型**已经存在于代码里**（`ToolAdapter` 的目录字段就是模型），本文补的是「怎么正确填这些字段」的**可复现判定流程**——把之前给 Codex / Claude Code / Grok 配目录时用到的隐性判断显性化。
>
> 关联文档：`docs/架构/Agent管理机制.md`（三层过滤：内置定义 ∩ installed ∩ enabled）、`docs/架构/技能目录自动发现与清理机制.md`、`docs/协作/会话交接说明.md`。

---

## 一、统一模型：一个 Agent 的目录分三类（三个桶）

每个 Agent 在代码里是一个 `ToolAdapter`（`app/src-tauri/src/core/tool_adapters.rs:19`）。
它的 skill 目录被归入**三个桶**，桶的语义决定了 skiller 能对里面的 skill 做什么：

| 桶 | 字段 | 语义 | 可写？（同步/导入/删除） | 谁生成这些 skill |
|---|---|---|---|---|
| **主目录（primary）** | `relative_skills_dir` | Agent 读取用户自有 skill 的**权威部署目录** | ✅ 可写、可部署 | 用户 / skiller 自己 |
| **额外共享目录（additional）** | `additional_scan_dirs` | Agent 也会读、但**不作为部署目标**的共享位置 | ✅ 可写（发现+导入） | 用户 / 其它 Agent 共享 |
| **只读厂商目录（readonly）** | `readonly_scan_dirs` | 厂商/插件系统托管、**升级会被覆盖重写** | ❌ 只读，仅展示 | Agent 厂商 / 插件市场 |

对应的运行时行为（都已实现，接新 Agent 无需改这些）：

- `all_scan_dirs()`（`tool_adapters.rs:113`）= 主目录 + 已存在的额外目录（去重）。
- `additional_existing_scan_dirs()`（`:124`）/ `readonly_existing_scan_dirs()`（`:139`）= 已存在的对应目录。
- 全局工作区读取：`agent_workspace.rs:39 read_agent_local_skills` 先扫可写目录、再扫只读目录，按 canonical path 去重，给只读目录的 skill 打 `read_only=true`。
- 只读写守卫：`agent_workspace.rs:104 ensure_not_read_only`，任何 import/update/delete 都过这道后端闸——**防御在后端，不靠前端隐藏按钮**。
- 只读深扫：只读目录用 `scanner::collect_skill_dirs`（`scanner.rs:47`）经 `project_scanner::read_readonly_skills`（`project_scanner.rs:116`）挖 `<pkg>/<ver>/skills/<skill>` 嵌套 bundle。

> 关键分类原则一句话：**「skiller 写进去会不会被 Agent 覆盖 / 会不会破坏别人」——会，就是只读；不会且是权威部署位，就是主目录；不会但只是共享读取位，就是额外目录。**

---

## 二、判定流程：接入新 Agent 时怎么填这三个桶

按顺序做，每一步都**基于证据**（官方文档 + 本机实际目录），不要凭猜路径。

### Step 0. 找权威事实源

优先级：**官方文档 > Agent 源码/内置 discovery 逻辑 > 本机实际落盘目录**。

- 官方文档常有「skills / plugins / marketplace」页（如 x.ai 的 Grok skills 文档）。
- 若开源，读它的 skill discovery 代码最准（例：oh-my-pi 的 `discovery/builtin.ts` 决定了 OMP Agent 主目录与项目目录不对称）。
- 没有文档时，用本机目录反推（见 Step 5 的探测命令）。

### Step 1. 定主目录 `relative_skills_dir`（第一个桶，必填）

问：**Agent 读取「用户自己的 skill」的用户级目录是哪个？** 这是 skiller 部署 skill 的落点。

- 一般是 `~/.<agent>/skills`（`.claude/skills`、`.codex/skills`、`.grok/skills`）。
- 有的在 `~/.config/<agent>/skills`（OpenCode、Goose、Crush）——注意 `candidate_paths` 会对 `.config/` 前缀额外尝试 XDG `config_dir`。
- 用户级与项目级不同 → 用 `project_relative_skills_dir` 单独指定（OpenCode 全局 `~/.config/opencode/skills`、项目 `.opencode/skills`）。

⚠️ **主目录必须是 Agent 真正扫描的原生 `@Skill` 来源**。反例：WorkBuddy 的
`~/.workbuddy/skills-marketplace/skills` **不是**原生扫描来源，主目录应为
`~/.workbuddy/skills`（详见 `Agent管理机制.md`）。填错主目录会导致部署的 skill Agent 根本看不到。

### Step 2. 定探测目录 `relative_detect_dir`（判「装没装」）

`is_installed()`（`tool_adapters.rs:151`）只看 **home 下这个目录存不存在**，存在即视为已安装。
通常取主目录的父级（`.claude`、`.codex`、`.grok`）。它只影响该 Agent 在工作区显不显示，不影响 skill 归类。

### Step 3. 判有没有「额外共享目录」`additional_scan_dirs`（第二个桶）

问：**Agent 除主目录外，是否还会读某个和别的 Agent 共享的可写位置？**

- 典型是统一的 `~/.agents/skills`（Codex、GitHub Copilot 都配了它作发现兜底）。
- 判据：这个目录里的 skill 是**用户可自由增删**的（不是厂商托管），且 Agent 确实会读它。
- 没有就留空 `vec![]`（大多数 Agent 属于此列）。

### Step 4. 判有没有「只读厂商目录」`readonly_scan_dirs`（第三个桶）—— 最需要判断的一步

问三个问题，**全为「是」才归只读**：

1. 这里的 skill 是**厂商 / 插件市场安装并托管**的吗？（不是用户手写的）
2. Agent **升级或重装插件时会覆盖/重写**这个目录吗？
3. 目录里是**嵌套 bundle 布局**（`<pkg>/<ver>/skills/<skill>/SKILL.md`）而非扁平 `skills/<skill>` 吗？（多数插件缓存是，但非硬性）

已确认的三个样例（形状同型，可直接类比）：

| Agent | 只读目录 | 布局 | 内容 |
|---|---|---|---|
| Codex | `.codex/plugins/cache` | `<marketplace>/<pkg>/<ver>/skills/<skill>` | openai-templates 等 |
| Claude Code | `.claude/plugins/cache` | `<marketplace>/<plugin>/<ver>/skills/<skill>` | superpowers / frontend-design / last30days |
| Grok | `.grok/bundled/skills`（内置）+ `.grok/marketplace-cache`（下载插件） | 内置为扁平；缓存为 `<hash>/.../skills/<skill>` | design/review/implement + neon/openclaw |

> 为什么必须归只读而不是当普通目录扫：这些目录里的 skill 会被厂商在升级时重写。
> 若允许 skiller 对它们同步/导入/删除，轻则改动被下次升级抹掉，重则破坏厂商 bundle。
> `read_only=true` + 后端 `ensure_not_read_only` 守卫就是为此。

### Step 5. 用本机实际目录验证（落地证据）

配置前**先在本机核实**，别凭路径想象。三条命令：

```bash
# 1) 看这个 Agent 的 home 目录里有哪些子目录（找 skills/plugins/bundled/cache/marketplace 之类）
ls -la ~/.<agent>

# 2) 找出所有真正带 SKILL.md 的位置，据此判断布局（扁平 vs 嵌套 bundle）
find ~/.<agent> -name SKILL.md 2>/dev/null | head -40

# 3) 对疑似只读目录，确认是不是 <pkg>/<ver>/skills/<skill> 这种嵌套
find ~/.<agent>/<suspect-dir> -maxdepth 5 -type d 2>/dev/null | head -40
```

判读：
- SKILL.md 出现在 `~/.<agent>/skills/<skill>/` → **主目录**。
- 出现在 `plugins/cache`、`bundled/skills`、`marketplace-cache` 等厂商目录 → **只读目录**。
- 出现在共享的 `~/.agents/skills/<skill>/` 且用户可写 → **额外目录**。

---

## 三、决策速查表（一页流程图）

```
接入新 Agent
  │
  ├─ Step0 找事实源：官方文档 > 源码 discovery > 本机目录
  │
  ├─ Step1 主目录 relative_skills_dir  ← Agent 读「用户自有 skill」的权威部署位（必填）
  │        └ 用户级≠项目级？→ 另填 project_relative_skills_dir
  │
  ├─ Step2 探测目录 relative_detect_dir ← 通常是主目录父级，仅判「装没装」
  │
  ├─ Step3 有共享可写读取位（如 ~/.agents/skills）？
  │        ├ 有 → additional_scan_dirs
  │        └ 无 → vec![]
  │
  ├─ Step4 有厂商/插件托管、升级会被覆盖的目录？
  │        ├ 是（三问全 yes）→ readonly_scan_dirs
  │        └ 否 → vec![]
  │
  └─ Step5 本机 find SKILL.md 验证每个目录归类 → 写单测 → build/test/npm build 四件套
```

## 四、落地清单（Definition of Done）

因为读取路径、去重、只读守卫、DTO 暴露、前端徽标展示**都已通用**，接入新 Agent 通常是**纯数据改动**：

1. 在 `default_tool_adapters()`（`tool_adapters.rs:168`）新增/修改该 adapter 的字段，加注释写清每个目录的**出处依据**（学 Codex/Claude/Grok 的注释）。
2. 加单测断言该 adapter 的目录配置（参考 `grok_scans_bundled_and_marketplace_dirs_read_only`、`claude_code_scans_plugin_cache_read_only_only`）。
3. 若目录布局特殊（嵌套/递归），核对 `recursive_scan` 与只读深扫是否覆盖；必要时加 `read_agent_local_skills` 层级的集成测试。
4. 一般**无需**改前端 / i18n（除非引入全新概念）。
5. 过验证四件套：`cargo build`（无 warning）→ `cargo test`（不降基线）→ `npm run build` → i18n 三语（若动了文案）。
6. 按 `AGENTS.md` 的收尾规则判断是否更新 `docs/协作/会话交接说明.md`（如「已配只读目录的 Agent」清单等描述性内容变化时就地更新）。

## 五、为什么不再往上抽一层「自动推断」

有人会想「能不能让程序自动扫描 home、自动判断每个目录属于哪个桶」。**不建议**，理由：

- 归类依赖**语义判断**（这个目录是不是厂商会覆盖的），不是路径规则能可靠推断的——同样叫 `skills` 的目录，可写性/权威性可能完全不同（WorkBuddy 反例）。
- 每个 Agent 就配一次，配置成本低；错误的自动推断（把只读目录当可写）代价高（破坏厂商 bundle）。
- 因此保持「**显式数据 + 本文判定流程**」，把判断权留给接入者，符合 `CLAUDE.md` 的 Simplicity First（不加投机抽象）。

真正的「统一模型」是**三个桶的语义 + 后端只读守卫**——这层已经抽象好了，新 Agent 只是往里填数据。
