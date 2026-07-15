# AGENTS.md

本项目的编码行为准则以 `CLAUDE.md` 为单一真源（SSoT）。

任何 Agent 在本目录下开发时，请先阅读并遵循 [`CLAUDE.md`](./CLAUDE.md) 中的四条准则：

1. Think Before Coding — 先想再写，不擅自假设，暴露权衡。
2. Simplicity First — 简单优先，只写解决问题所需的最少代码。
3. Surgical Changes — 外科手术式修改，只动必须动的地方。
4. Goal-Driven Execution — 目标驱动，定义可验证的成功标准并循环至通过。

> 规则正文只维护在 `CLAUDE.md`，本文件仅作指针，避免两份内容漂移。

## 开发工作流：Superpowers（软约束）

本目录开发遵循 Superpowers 7 步流程。动手前先自检该调用哪个 skill；
无法确定时，先走 brainstorming。（TRAE 无法自动触发，必要时用户可显式点名。）

| 意图 | 调用 skill |
|---|---|
| 新功能/改行为，尚未想清 | superpowers:brainstorming |
| 设计已定，拆任务 | superpowers:writing-plans |
| 有计划，开始写 | superpowers:executing-plans |
| 出 bug / 测试失败 | superpowers:systematic-debugging |
| 声称"完成"之前 | superpowers:verification-before-completion |
| 合并前 | superpowers:requesting-code-review → finishing-a-development-branch |

铁律：没有失败的测试不写生产代码；没有验证证据不说"完成"。

## 收尾：文档动态更新（完成开发 + 验证通过后、提交代码前）

每次结束开发、提交前，走一遍文档自检——**默认不更新，仅在满足条件时就地更新**：

- **开发文档**（`docs/*`，面向开发者 / AI）：当本次改变了其中描述的
  架构 / 数据模型 / 关键流程 / 开发约定，或踩到值得沉淀的新坑，或让某条描述过时
  → 就地改写对应条目（不追加流水账、不写进度 / commit / 测试数字）。
- **用户文档**（README 等，面向使用者）：当本次改变了用户可见的
  功能 / 模块 / 交互 / 使用方式 → 同步更新。

判断结果必须**显式报告**：
- 需更新 → 连同代码改动一起提交；
- 无需更新 → 一句话说明"无需更新文档"，进度交给 `git log`。

排除：纯 bug 修复、内部重构、纯样式调整等不改变机制或用户可见行为的改动，不更新文档。
