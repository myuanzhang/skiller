---
title: Agent Skill 作用域隔离调研报告
type: synthesis
tags: [skill, 作用域, 隔离, .agents, SSoT, progressive-disclosure]
created: 2026-07-03
updated: 2026-07-03
sources:
  - "https://agentskills.io/docs/guides/add-skills-support"
confidence: high
---

# Agent Skill 作用域隔离调研报告

> 背景：希望 `critical-ai-writer` 等项目专属 skill 只在特定项目（如 01_CriticalAI）中生效，其他项目不可见/不可用。同时保持 SSoT（单一事实源）统一管理。
>
> 参考：[Agent Skills 官方文档 - How to add skills support](https://agentskills.io/docs/guides/add-skills-support)

## 一、标准 Skill 扫描路径（官方规范）

Agent Skills 规范定义了**两层作用域 × 两种目录**的扫描矩阵：

| Scope   | Path                               | Purpose                       |
| :------ | :--------------------------------- | :---------------------------- |
| Project | `<project>/.<your-client>/skills/` | Client-specific, project-level |
| Project | `<project>/.agents/skills/`        | Cross-client interoperability  |
| User    | `~/.<your-client>/skills/`         | Client-specific, user-level   |
| User    | `~/.agents/skills/`                | Cross-client interoperability |

**核心原则**：`.agents/skills/` 是跨客户端共享约定。任何兼容客户端都应该扫描它，这样一个客户端安装的 skill 自动对其他客户端可见。

**兼容性补充**：部分实现还会扫描 `.claude/skills/`（项目级和用户级），因为很多已有 skill 安装在那里。

### 优先级规则（官方定义）

**Project > User**，这是全行业通用约定：

- 项目级 skill 覆盖用户级同名 skill
- 同一作用域内（如 `<project>/.agents/skills/` vs `<project>/.trae/skills/`），先找到或后找到均可，但必须一致
- 冲突时应记录警告

### 信任问题

项目级 skill 来自仓库本身，可能不受信任（比如刚 clone 的开源项目）。规范建议：**只有用户标记为可信的项目目录才加载项目级 skill**，防止恶意仓库注入指令。

> TRAE CLI 已有 `trust_level = "trusted"` 机制（见 `~/.trae/traecli.toml`），与此对应。

## 二、TRAE CLI 实测的扫描路径

| 层级 | 路径 | 作用域 | 数量（当前） | 规范对应 |
|------|------|--------|-------------|---------|
| 4（最高） | `<project>/.agents/skills/` | 项目级 · 跨客户端 | 按需 | Project × .agents |
| 3 | `<project>/.trae/skills/` | 项目级 · TRAE 专属 | 按需 | Project × .trae（推测） |
| 2 | `~/.agents/skills/` | 用户级 · 跨客户端 | 47 symlink | User × .agents |
| 1（最低） | `~/.trae/skills/` | 用户级 · TRAE 专属 | 60 symlink + 3 system | User × .trae |

**已验证**：
- ✅ TRAE 原生扫描项目级 `.agents/skills/`（test-project-skill 实测通过）
- ✅ 同名覆盖遵循 project > user
- ✅ `~/.agents/skills/` 作为用户级共享目录被扫描

**未验证但合理推测**：TRAE 应该也扫 `<project>/.trae/skills/`（客户端专属项目目录），因为官方规范里有这个位置。

## 三、渐进式加载（Progressive Disclosure）

官方定义的三级加载策略，这是理解"可见性"和"可用性"差异的关键：

| Tier | What's loaded | When | Token cost |
|------|--------------|------|-----------|
| 1. Catalog | Name + description | Session start | ~50-100 tokens/skill |
| 2. Instructions | Full `SKILL.md` body | Skill activated | <5000 tokens |
| 3. Resources | Scripts, references, assets | Referenced by instructions | Varies |

**关键含义**：

- **Tier 1 才是"可见性"**：agent 启动时只加载 name + description 构成目录。不在目录里的 skill，agent"不知道它存在"。
- **Tier 2/3 是"可用性"**：决定用了才加载全文和资源。
- 这就是为什么"物理隔离"= "不在 Tier 1 目录里"。

## 四、激活方式

官方定义了两种 skill 激活路径：

### 4.1 模型驱动激活（Model-driven activation）

模型自己判断要不要用 skill。两种实现：

- **File-read activation**：模型用标准文件读取工具读 `SKILL.md`。零基础设施，只要模型能读文件就行。
- **Dedicated tool activation**：注册专用工具（如 `activate_skill`），按名称激活。更可控，能做权限校验、内容包装、去重。

> TRAE CLI 目前用的是 **Skill tool + 部分 file-read fallback** 的混合模式——Skill 工具失败后，agent 可能自己搜文件然后 Read。

### 4.2 用户显式激活（User-explicit activation）

用户通过 slash command 或 mention 语法直接触发（如 `/skill-name`、`$skill-name`）。由 harness 拦截处理，直接注入 skill 内容。

## 五、物理隔离的真实边界

### 5.1 能防住的：自动发现 / 自动触发

skill 不在当前项目的 `.agents/skills/` 里 → 不在 Tier 1 catalog 里 → **模型不知道它存在 → 不会自动触发**。

这解决了 99% 的误触场景。

### 5.2 防不住的：主动搜索 + 直接读取

实测（在不含该 skill 的项目中测试）：

```
1. 用户说：调用 critical-ai-writer skill
2. Skill 工具调用失败 → 不在 skill 列表中
3. Agent 主动搜索文件系统 → ls ~/.agents/skills/ 和 ~/.skills-ssot/skills/
4. 找到路径 → 直接 Read SKILL.md → 成功加载
```

**为什么会发生**：

- File-read activation 模式下，模型只要知道路径就能读
- 模型有完整文件系统读取权限
- 模型的训练知识/记忆中可能已知晓常见 skill 路径

### 5.3 官方怎么看这个问题

官方文档没有把这视为"漏洞"——file-read activation 本就是合法的激活方式。catalog（Tier 1）只是"方便发现"，不是"权限边界"。

真正的权限边界是：**文件系统权限 + 项目信任机制**。

### 5.4 结论

"物理隔离"在 Tier 1 层面（自动发现）是完全成立的。在 Tier 2 层面（主动读取），隔离是软的——但这不叫"绕过"，而是 file-read activation 设计的一部分。

## 六、SSoT 架构适配

### 当前架构

```
实体层（唯一源）
  ~/.skills-ssot/skills/      ← 53 个 skill 实体文件

索引层（各作用域 symlink）
  ~/.agents/skills/           ← 47 个（用户级 · 跨客户端共享）
  ~/.trae/skills/             ← 60 个（用户级 · TRAE 专属）
  <project>/.agents/skills/   ← 项目级 · 跨客户端
  <project>/.trae/skills/     ← 项目级 · TRAE 专属
```

### SSoT + 项目级隔离的完美模式

```
实体：~/.skills-ssot/skills/critical-ai-writer/
           ↑
           | symlink（只在需要它的项目里建）
           |
项目索引：01_CriticalAI/.agents/skills/critical-ai-writer
```

**全局用户级索引里不放 → 所有项目的 Tier 1 catalog 里都没有 → 只有建了项目级 symlink 的项目才能在 Tier 1 看到。**

### critical-ai-writer 当前状态

| 位置 | 有没有 |
|---|---|
| `~/.skills-ssot/skills/critical-ai-writer/` | ✅ 实体在这里 |
| `~/.agents/skills/critical-ai-writer` | ❌ 不在（47 个里没有） |
| `~/.trae/skills/critical-ai-writer` | ❌ 不在（60 个里没有） |
| `01_CriticalAI/.agents/skills/critical-ai-writer` | ❌ 还没建 |

**目前它对所有项目的 Tier 1 catalog 都是不可见的。** 之前能用是靠 AGENTS.md 明确引用（模型按路径读）。

## 七、隔离方案对比

| 方案 | 原理 | Tier 1 隔离 | Tier 2 隔离 | 维护成本 | SSoT 保持 |
|------|------|------------|------------|---------|-----------|
| **A. 项目级 symlink** | `<project>/.agents/skills/` 放 symlink 指向 SSoT，全局不放 | ✅ | ❌ | 极低 | ✅ |
| **B. Description 作用域守卫** | skill description 写死"仅在 X 项目使用" | ⚠️ （还在 catalog 里） | ⚠️ | 低 | ✅ |
| **C. AGENTS.md 指令** | 目标项目 AGENTS.md 引用，其他项目禁用声明 | ❌ | ⚠️ | 低 | ✅ |
| **D. 文件系统权限隔离** | 拆 SSoT，不同项目不同权限组 | ✅ | ✅ | 高 | ❌ 破坏 |
| **E. 实体放入项目目录** | skill 实体存在项目里，不放在全局 SSoT | ✅ | ✅ | 中 | ❌ 破坏 |

## 八、推荐方案：A + B + C 三层组合

### 实现

1. **层 A - 项目级 symlink**：项目专属 skill 在 `<project>/.agents/skills/` 中创建 symlink 指向 SSoT，全局 `~/.agents/skills/` 中不放
2. **层 B - Description 守卫**：skill 的 description frontmatter 中明确写作用域限定（如"仅在 CriticalAI 公众号仓库中使用"）
3. **层 C - AGENTS.md 指令**：目标项目 AGENTS.md 明确引用该 skill；其他仓库 AGENTS.md 可加禁用声明

### 为什么这个组合够用

| 场景 | 哪层起作用 | 效果 |
|------|-----------|------|
| 其他项目中 agent 自动匹配 skill | A | 不在 Tier 1 catalog → 不知道存在 → 不触发 |
| 用户在其他项目主动说"用 X skill" | B + C | description 提示作用域 + AGENTS 指令约束 → agent 会拒绝或提醒 |
| 目标项目正常使用 | A + C | 正常发现 + 明确指令 → 丝滑使用 |
| SSoT 统一管理 | symlink 指向 SSoT | 修改一次，所有挂载项目同步 |

### 创建命令

```bash
# 给某个项目添加项目级 skill
PROJECT="/path/to/project"
SKILL="critical-ai-writer"
mkdir -p "$PROJECT/.agents/skills"
ln -s ~/.skills-ssot/skills/$SKILL "$PROJECT/.agents/skills/$SKILL"

# 移除项目级 skill
rm "$PROJECT/.agents/skills/$SKILL"

# 验证是否为 symlink
ls -la "$PROJECT/.agents/skills/$SKILL"
```

## 九、高级议题

### 9.1 为什么 TRAE 会截断 skill description

你可能见过这条提示：
```
⚠ Skill descriptions were shortened to fit the 2% skills context budget.
```

这是 Tier 1 catalog 的 token 预算问题。官方建议每个 skill 的 description 控制在合理长度，太多 skill 会导致 catalog 过大，占用 context 预算。

**实践意义**：项目级隔离不只是为了"防止误触"，也是为了**减少 catalog 体积**，让当前项目真正用到的 skill 有完整的 description 展示。

### 9.2 Skill 目录的信任问题

从安全角度，项目级 skill 应该有信任门控——clone 一个陌生仓库，它自带的 `.agents/skills/` 不应该自动加载。TRAE 的 `trust_level` 机制应该与此相关。

### 9.3 上下文压缩中的保护

官方建议：skill 内容在上下文压缩时应被保护，不能被摘要掉。因为 skill 是持久性行为指导，丢了会导致 agent 能力无声下降。

## 十、相关文件

- **SSoT 实体**：`~/.skills-ssot/skills/`
- **用户级共享索引**：`~/.agents/skills/`
- **TRAE 专属索引**：`~/.trae/skills/`
- **TRAE 项目信任配置**：`~/.trae/traecli.toml`
- **项目级测试目录**：`01_CriticalAI/.agents/skills/`
- **官方文档**：[agentskills.io - How to add skills support](https://agentskills.io/docs/guides/add-skills-support)
