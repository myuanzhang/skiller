---
title: 交接 Prompt
type: reference
tags: [skiller, 交接, prompt, onboarding]
created: 2026-07-15
updated: 2026-07-15
---

# 交接 Prompt

> 每次开新会话交接时，复制下面的 prompt，填入「本次任务」后发给新会话。
> 配套文档：`docs/会话交接说明.md`（领域知识）、`CLAUDE.md`（编码准则）。

---

## 通用版（默认用这个）

```
你在 skiller 仓库(/Users/bytedance/Documents/03_Projects/skiller,Tauri 2 + React 19)接手开发。

开工前:
1. 先读 CLAUDE.md(编码准则单一真源),严格遵循其四条准则。
2. 判断本次任务是否涉及 Agent/Skill 目录管理(扫描/显示/只读/多目录、
   ToolAdapter、agent_workspace.rs、WorkspaceView 的 skill 列表、打开本地目录):
   - 涉及 → 通读 docs/会话交接说明.md;
   - 不涉及 → 只读该文档第一节「开工前必读」即可,不要读全文。
3. 需要最新进度/改动历史时查 git log,不要假设文档里的状态是最新的。

环境约定(务必遵守):
- cargo 用 ~/.cargo/bin/cargo;git 写操作需 dangerouslyDisableSandbox。
- 提交时排除 app/src/i18n/zh.json.bak。
- 改动后跑验证四件套:cargo build(无 warning)→ cargo test(基线不回归)
  → npm run build → i18n JSON 校验。

本次任务:
<在这里写清楚要做什么>

流程要求:
- 动手前先简述你的理解和方案,和我对齐后再改代码;不确定的地方问我,别擅自假设。
- 遵循 Surgical Changes:只动必要的地方。
- 完成后给出验证结果(四件套是否全绿),不要没验证就说"完成"。
- 提交/推送前先问我。
```

---

## 精简版（小任务用）

```
skiller 仓库。先读 CLAUDE.md;本任务涉及 Agent/Skill 目录管理,请通读
docs/会话交接说明.md(否则只读第一节)。cargo 用 ~/.cargo/bin/cargo,
git 写操作加 dangerouslyDisableSandbox,提交排除 zh.json.bak。
动手前先跟我对齐方案。任务:<...>
```

---

## 设计要点（为什么这样写）

- **条件化读文档**：无关任务只读第一节全局约定，不被迫读领域细节，省 token。
- **git log 优先于文档状态**：交接说明只沉淀不易过期的知识、不记进度；进度以 git 历史为准。
- **动手前先对齐**：防跑偏、防返工的最有效一招，呼应 CLAUDE.md 的 Think Before Coding。
- **验证 + 提交把关**：两条硬约束——「验证全绿才算完成」「提交前先问」。
