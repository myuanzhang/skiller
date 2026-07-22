---
title: 文档索引
type: reference
tags: [skiller, docs, 索引, onboarding]
created: 2026-07-15
updated: 2026-07-15
---

# skiller 开发文档索引

> 本目录是**开发文档**（面向开发者 / AI）。用户向说明见仓库根 `README.md`。
> 文档维护规则见 `AGENTS.md`「收尾：文档动态更新」——默认不更新，机制/约定变化时就地改写，进度查 `git log`。

## 协作（先看这里）

- [协作/会话交接说明.md](协作/会话交接说明.md) —— 新会话接手 Agent/Skill 开发前必读：项目规矩、多目录架构、踩坑、代码速查。
- [协作/交接Prompt.md](协作/交接Prompt.md) —— 每次会话交接时复制即用的 Prompt。
- [协作/Git-Worktree并行开发指南.md](协作/Git-Worktree并行开发指南.md) —— 同一仓库并行开发多个功能或 Bug 的隔离工作区操作手册。

## 架构（现行机制说明）

- [架构/Agent管理机制.md](架构/Agent管理机制.md) —— Agent（tool/ToolAdapter）如何定义、发现、显示；三层过滤模型。
- [架构/接入新Agent的技能目录判定方法.md](架构/接入新Agent的技能目录判定方法.md) —— 三桶目录模型 + 接入新 Agent 的可复现判定流程。
- [架构/中央仓库与同步状态.md](架构/中央仓库与同步状态.md) —— 技能中心（中央仓库）作用与各同步状态标签的判定。
- [架构/技能目录自动发现与清理机制.md](架构/技能目录自动发现与清理机制.md) —— 孤儿发现 / 缺失清理 / 文件监视对账。
- [架构/个人助手区域分析.md](架构/个人助手区域分析.md) —— coding vs personal 两大分类；Personal Agents 区域设计。
- [架构/技能触发次数统计机制.md](架构/技能触发次数统计机制.md) —— 触发次数角标的数据源（TRAE session 解析）、口径与「解析 vs 埋点上报」决策。

## 决策记录（ADR）

- [adr/0001-skill-usage-from-trae-sessions.md](adr/0001-skill-usage-from-trae-sessions.md) —— 触发次数统计选择解析 TRAE session 日志、而非 agent 埋点上报。

## 环境

- [开发环境.md](开发环境.md) —— 本地构建、EPERM 绕过、产物路径、启动信号。

## 其它

- `research/` —— 背景调研资料。
- `archive/` —— 已完成的历史计划（UI 重构方案、superpowers plans/specs），冻结存档、不再维护。
