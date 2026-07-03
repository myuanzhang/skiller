---
title: Superpowers Skill 手册（TRAE CLI 版）
type: reference
tags: [skill, superpowers, TDD, 方法论, 工作流]
created: 2026-07-03
updated: 2026-07-03
sources:
  - "https://github.com/obra/superpowers"
confidence: high
---

# Superpowers Skill 手册（TRAE CLI 版）

> **来源**：[obra/superpowers](https://github.com/obra/superpowers)（245k stars, v6.1.1, MIT）
>
> **安装位置**：`~/.superpowers/`（实体）→ `~/.trae/skills/sp-*`（symlink，共 14 个）
>
> **注意**：TRAE CLI 没有 session-start hook，superpowers 不会自动激活。需要**手动调用**对应 skill。所有 skill 名称前缀为 `sp-`。

---

## 一、整体工作流

Superpowers 是一套 7 步标准开发流程，从需求到合并全链路覆盖：

```
1.  brainstorming                 需求澄清 → 设计对齐
2.  using-git-worktrees           建隔离工作区
3.  writing-plans                 拆任务 → 写计划
4.  subagent-driven-development   子代理并行开发（TRAE 中用 executing-plans 替代）
5.  test-driven-development       TDD 红-绿-重构
6.  requesting-code-review        代码审查
7.  finishing-a-development-branch 收尾 → 合并/PR
```

**核心哲学**：
- **过程先于实现**：动手前先想清楚，写代码是最后一步
- **测试驱动**：先写失败的测试，再写最小代码
- **系统化而非临时**：遇到 bug 先找根因，不瞎试
- **证据优于主张**：说"完成了"必须拿出验证证据

---

## 二、14 个 Skill 详解

### 1. sp-brainstorming — 需求澄清与设计对齐

**何时用**：任何创意工作之前——加功能、改行为、建组件、搭项目。哪怕"很简单"也要走。

**核心规则**（HARD-GATE）：
> 没呈现设计、没获得用户批准前，**绝对不能**写代码、建项目、做任何实现动作。

**9 步流程**：

| 步 | 动作 | 说明 |
|---|---|---|
| 1 | 探索项目上下文 | 读现有文件、文档、最近提交 |
| 2 | 澄清问题 | **一次问一个**，搞清楚目的/约束/成功标准 |
| 3 | 提出 2-3 个方案 | 每个带 trade-off + 你的推荐 |
| 4 | 分段呈现设计 | 每段确认后再继续 |
| 5 | 写设计文档 | 存 `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md` |
| 6 | 设计自审 | 检查占位符、矛盾、歧义、范围溢出 |
| 7 | 用户审设计文档 | 用户确认后才能进入下一步 |
| 8 | 过渡到实现 | 调用 `writing-plans` |

**触发方式**：`用 sp-brainstorming 讨论一下 XXX`

---

### 2. sp-writing-plans — 编写实现计划

**何时用**：有了设计/需求说明，准备动手写代码之前。

**核心假设**：执行计划的人"零上下文、品味可疑、不会设计测试"——所以计划必须写得极其详细。

**计划颗粒度**：每个任务 = 2-5 分钟的小动作，例如：
- "写失败的测试"
- "运行测试确认它失败"
- "写最少的代码让测试通过"

**输出**：`docs/superpowers/plans/YYYY-MM-DD-<feature>.md`

**6 个要求**：
1. 每个任务有精确的文件路径
2. 每个任务有完整代码（不是描述）
3. 每个任务有验证步骤
4. 每个任务可独立测试
5. DRY（不重复）
6. YAGNI（不过度设计）

**触发方式**：`用 sp-writing-plans 把这个设计拆成任务`

---

### 3. sp-test-driven-development — 测试驱动开发

**何时用**：实现任何功能、修复任何 bug 之前。**默认启用**。

**铁律**：
> **没有失败的测试，就不能写生产代码。**
>
> 先写了代码？删掉。重写。

**RED-GREEN-REFACTOR 循环**：

```
RED     写测试 → 运行 → 确认失败（知道测试确实有效）
GREEN   写最少的代码让测试通过
REFACTOR  重构代码，保持测试通过
```

**例外（需要用户同意）**：
- 一次性原型
- 生成的代码
- 配置文件

**反模式检测**：
> "这次跳过 TDD 吧" → 停止。这是合理化借口。

**触发方式**：TDD 通常被其他 skill（如 `subagent-driven-development`）内部调用，不需要手动触发。手动触发：`用 sp-test-driven-development 来做这个功能`

---

### 4. sp-systematic-debugging — 系统化调试

**何时用**：遇到任何 bug、测试失败、异常行为、性能问题、构建失败——**在想修复方案之前**。

**铁律**：
> **没找到根因，不准提修复方案。** 修症状 = 失败。

**四阶段流程**：

| 阶段 | 名称 | 做什么 |
|---|---|---|
| 1 | 根因调查 | 复现问题、收集证据、假设-验证循环 |
| 2 | 修复方案设计 | 基于根因设计最小修复 |
| 3 | 修复实现 | 写测试 → 实现修复 → 验证 |
| 4 | 回归验证 | 确认修复不引入新问题 |

**最有用的场景**：
- 赶时间的时候（越急越不能瞎试）
- "就一个快速修复"看起来很明显的时候
- 已经试了好几个修复都不行的时候

**触发方式**：`出 bug 了，用 sp-systematic-debugging 来查`

---

### 5. sp-verification-before-completion — 完成前验证

**何时用**：要说"搞定了"、"修好了"、"测试通过了"之前——任何声称完成的时刻。

**铁律**：
> **没有刚跑过的验证证据，不准说完成了。** 跳过任何一步 = 撒谎。

**5 步门禁**：

1. **识别**：什么命令能证明这个说法？
2. **运行**：执行完整命令（重新跑，不是用上一次的结果）
3. **阅读**：完整输出、退出码、失败数量
4. **验证**：输出是否支持说法？
5. **才能说**：附带证据地说结论

**常见对照**：

| 说法 | 需要的证据 | 不够的 |
|---|---|---|
| 测试通过 | 测试输出：0 失败 | 上次跑过、"应该过了" |
| Lint 通过 | Lint 输出：0 错误 | 部分检查、推测 |
| 构建成功 | 构建命令：exit 0 | Lint 过了、日志看起来正常 |
| Bug 修了 | 原始症状复现测试：通过 | 代码改了、假设修了 |

**触发方式**：通常被其他 skill 自动调用。手动：`验证一下再下结论`

---

### 6. sp-subagent-driven-development — 子代理驱动开发

**何时用**：有实现计划，任务相对独立，想让 agent 自主执行（不需要人中间插手）。

**核心模式**：每个任务派一个全新的子代理 → 任务完成后审查（规格合规 + 代码质量）→ 全部完成后整体审查。

**为什么用子代理**：
- 隔离上下文，不被之前的对话污染
- 你自己的上下文保留给协调工作
- 每个任务 fresh start，质量更高

**连续执行**：任务之间不暂停问人，一口气跑完。只在以下情况停止：
- 遇到无法解决的阻塞
- 真正的歧义导致无法推进
- 全部完成

> **注意**：TRAE CLI 的子代理能力可能有限。如果子代理不可用，改用 `executing-plans`（在当前会话执行）。

**触发方式**：`用 sp-subagent-driven-development 执行这个计划`

---

### 7. sp-executing-plans — 执行计划

**何时用**：有写好的实现计划，在当前会话内执行（不用子代理）。

> 这是 `subagent-driven-development` 的降级方案——子代理不可用时用这个。

**3 步流程**：

| 步 | 动作 | 说明 |
|---|---|---|
| 1 | 加载并审查计划 | 读计划文件，有疑问先问用户 |
| 2 | 逐个执行任务 | 标记进度，每步验证 |
| 3 | 完成开发 | 调用 `finishing-a-development-branch` 收尾 |

**停止条件**（立即停，不猜）：
- 遇到阻塞（缺依赖、测试失败、指令不清）
- 计划有重大缺口
- 验证反复失败

**触发方式**：`用 sp-executing-plans 执行计划`

---

### 8. sp-dispatching-parallel-agents — 并行代理调度

**何时用**：有 2 个以上独立任务，没有共享状态和顺序依赖，可以并行处理。

**典型场景**：
- 3 个测试文件同时失败，根因不同
- 多个子系统独立出问题
- 每个问题的理解不需要其他问题的上下文

**核心原则**：一个问题域派一个代理，让它们并发工作。

**不要用**：
- 失败是相关的（修一个可能修好几个）
- 需要了解完整系统状态
- 代理之间会互相干扰

**触发方式**：`这几个问题是独立的，用 sp-dispatching-parallel-agents 并行查`

---

### 9. sp-requesting-code-review — 请求代码审查

**何时用**：完成任务后、合并之前、实现了大功能后——找人（或子代理）审代码。

**强制场景**：
- `subagent-driven-development` 中每个任务之后
- 完成重大功能后
- 合并到 main 之前

**审查流程**：

1. 取 git SHA（base 和 head）
2. 派一个代码审查子代理（给精确上下文，不给你的对话历史）
3. 按严重度处理反馈：
   - **Critical**：立即修
   - **Important**：继续前修掉
   - **Minor**：记下以后修
   - 审查员错了：有理有据地驳回

**触发方式**：`用 sp-requesting-code-review 审一下这段代码`

---

### 10. sp-receiving-code-review — 接收代码审查

**何时用**：收到 CR 反馈后、动手改之前——特别是反馈看起来有问题或不清晰的时候。

**核心原则**：技术正确 > 社交得体。先验证再改，不要表演式同意。

**6 步响应模式**：

```
1. 完整阅读反馈（不反应）
2. 用自己的话重述要求（或提问）
3. 对照代码库现实验证
4. 评估：对这个代码库技术上合理吗？
5. 回应：技术确认 或 有理有据地驳回
6. 逐条实现，每条测试
```

**禁止的回应**：
- ❌ "你说得太对了！"（明示禁止）
- ❌ "好观点！"（表演式）
- ❌ "我这就改"（验证前）

**正确做法**：重述技术要求 → 问清楚不确定的点 → 技术上驳回错误的 → 直接动手改（行动 > 空话）

**触发方式**：`用 sp-receiving-code-review 处理这个 CR 反馈`

---

### 11. sp-using-git-worktrees — Git 工作树隔离

**何时用**：开始功能开发前，需要隔离工作区不影响当前分支。

**核心原则**：先检测有没有已隔离 → 用平台原生工具 → 不行再降级到手动 git worktree。

**检测方法**：
```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" && pwd -P)
# GIT_DIR != GIT_COMMON = 已在 worktree 中
```

**流程**：
1. 检测是否已经在隔离工作区 → 是则跳过
2. 否 → 询问用户是否创建
3. 创建 → 设置项目 → 确认基线测试通过

**触发方式**：`用 sp-using-git-worktrees 建个隔离工作区`

---

### 12. sp-finishing-a-development-branch — 开发分支收尾

**何时用**：实现完成、测试通过，需要决定怎么合入。

**5 步流程**：

| 步 | 动作 | 说明 |
|---|---|---|
| 1 | 验证测试 | 跑完整测试。失败就停下来修，不能继续 |
| 2 | 检测环境 | 是 worktree 还是普通分支？决定可选方案 |
| 3 | 呈现选项 | 合并 / PR / 保留 / 丢弃 |
| 4 | 执行选择 | 用户选哪个就做哪个 |
| 5 | 清理 | worktree 清理、分支删除等 |

**触发方式**：`用 sp-finishing-a-development-branch 收尾`

---

### 13. sp-writing-skills — 编写 Skill

**何时用**：创建新 skill、修改已有 skill、部署前验证 skill 有效性。

**核心思想**：写 skill = 把 TDD 应用到流程文档上。

| TDD 概念 | Skill 创作 |
|---|---|
| 测试用例 | 压力场景 + 子代理验证 |
| 生产代码 | Skill 文档（SKILL.md） |
| RED（测试失败） | 没有 skill 时 agent 会违反规则 |
| GREEN（测试通过） | 有 skill 时 agent 遵守规则 |
| 重构 | 堵住漏洞，保持合规 |

**什么时候该创建 skill**：
- 这个技巧不是直觉就能想到的
- 你反复在同一个问题上栽跟头
- 可以复用的模式

**触发方式**：`用 sp-writing-skills 创建一个新 skill`

---

### 14. sp-using-superpowers — Superpowers 总入口

**何时用**：会话开始时，建立"先检查 skill 再做事"的规则。

**核心规则**：
> 只要有 1% 的可能某个 skill 适用，就**必须**调用它。没得选。
>
> 在任何回应/动作之前——包括问问题、看代码、查文件——先检查有没有相关 skill。

**Skill 优先级**：
- 过程类 skill 先于实现类 skill
- "我们来做 X" → 先 `brainstorming`，再实现 skill
- "修这个 bug" → 先 `systematic-debugging`，再领域 skill

**红旗检测**（这些想法 = 你在合理化，停）：

| 想法 | 现实 |
|---|---|
| "这只是个简单问题" | 问题也是任务。先查 skill。 |
| "我先看看代码" | skill 告诉你怎么看。先查。 |
| "这个不需要正式 skill" | 有 skill 就用。 |
| "我知道那是什么意思" | 知道概念 ≠ 会用 skill。调用它。 |
| "skill 太大材小用了" | 简单的事会变复杂。用。 |

> **注意**：在 TRAE 中这个 skill 不会自动注入。可以在需要"自我约束"的时候手动调用，比如：`按 sp-using-superpowers 的规则来做这件事`。

---

## 三、TRAE CLI 中的使用建议

### 推荐使用场景

| 场景 | 调用的 skill |
|---|---|
| 想加一个新功能，还没想清楚 | `sp-brainstorming` |
| 设计想好了，不知道怎么拆任务 | `sp-writing-plans` |
| 有计划了，开始写代码 | `sp-executing-plans`（TRAE 子代理能力有限时） |
| 出 bug 了，不知道为什么 | `sp-systematic-debugging` |
| 写代码但不确定对不对 | `sp-test-driven-development` |
| 写完了，说"搞定了"之前 | `sp-verification-before-completion` |
| 代码要合并了 | `sp-requesting-code-review` + `sp-finishing-a-development-branch` |
| 收到 CR 反馈 | `sp-receiving-code-review` |
| 想做个新 skill | `sp-writing-skills` |

### TRAE 中的限制

1. **无 session-start hook**：`using-superpowers` 不会自动加载，需要手动触发
2. **子代理能力未知**：`subagent-driven-development` 和 `dispatching-parallel-agents` 依赖子代理 API，TRAE 可能不完整支持
3. **触发方式**：必须明确说"用 sp-xxx"，不像 Claude Code 那样自动匹配 description 就触发

### 典型对话流示例

```
你：我想给项目加一个用户登录功能

你（手动触发）：用 sp-brainstorming 来讨论一下这个需求

→ （brainstorming 走完，设计对齐了）

你：用 sp-writing-plans 把这个设计拆成计划

→ （计划写好了）

你：用 sp-executing-plans 执行

→ （代码写完了）

你：用 sp-requesting-code-review 审一下

→ （审查通过）

你：用 sp-finishing-a-development-branch 收尾
```
