---
title: UI 重构方案与执行计划
type: plan
tags: [skiller, ui, 重构, 前端, 设计系统, 性能, 计划]
created: 2026-07-08
updated: 2026-07-08
---

# UI 重构方案与执行计划

> 面向 skiller 桌面端前端（`app/src`，React 19 + TS + Tailwind 3 + Tauri 2）。
> 目标：在**不改变任何业务功能**的前提下，提升视觉一致性、交互体验、性能与可维护性。
> 本文基于对现有代码的实测诊断，给出方案、分阶段计划与可落地执行指引。

---

## 一、UI 现状诊断

诊断覆盖四个维度，每条标注优先级：**P0**（有实际缺陷/影响面广）、**P1**（明显体验或维护问题）、**P2**（改善项）。

### 1. 视觉一致性

| # | 问题 | 证据 | 优先级 |
|---|---|---|---|
| V1 | **`hover:bg-accent-hover` 是未定义 token**，主按钮悬停态颜色不变化（Tailwind 生成无效类，静默失效） | `tailwind.config.js` 与 `index.css` 均无 `accent-hover`；`ProjectDetail.tsx:908/1059`、`WorkspaceView.tsx:812/959`、`AddSkillsSheet.tsx:646`、`MultiSelectToolbar.tsx:73` 等 6+ 处在用 | **P0** |
| V2 | **已建好设计系统类（`app-button-primary/secondary`、`app-badge`、`app-input`）几乎无人使用**，主按钮到处手写 `inline-flex ... rounded-md bg-accent px-3 ...`，样式多份漂移 | `app-button-*` 仅 Dashboard/InstallSkills 用；主按钮手写散落 6+ 文件 | **P1** |
| V3 | **Dialog/Sheet 遮罩层手写重复 12 次**（`absolute inset-0 ... bg-black/xx backdrop-blur`），圆角、模糊、点击关闭逻辑各写各的 | 12 个组件各含一份遮罩 | **P1** |
| V4 | **状态色/药丸样式散落**：同步状态、标签、Agent 图标的配色逻辑分散在 `WorkspaceView.getLocalStatusMeta`、`SyncDots`、`skillTags` 等处，无单一色板来源 | 多处 `bg-*-500/10 text-*-700` 字面量 | **P2** |
| V5 | 圆角尺度不统一：`rounded-md / lg / xl / [4px] / [5px] / full` 混用，无统一 radius 令牌 | 全仓可见 | **P2** |

### 2. 交互体验

| # | 问题 | 证据 | 优先级 |
|---|---|---|---|
| I1 | **无加载骨架**：列表/文档加载只用居中 spinner 或纯文字，切换 Agent/项目时闪烁明显 | `WorkspaceView`、`ProjectDetail`、`SkillDetailPanel` 的 loading 分支 | **P1** |
| I2 | **长列表无虚拟化**：技能中心/项目工作区 Skill 列表全量渲染，条目多时首屏与滚动卡顿 | 无 `react-window`/虚拟化；`MySkills`/`ProjectDetail` 直接 `.map` | **P1** |
| I3 | **交互一致性缺口**（本次会话已修多处）：筛选多选/单选语义、选中态高亮、返回按钮等历史上各页不一致 | 近期提交记录 | **P2** |
| I4 | 空状态样式不统一：各页 empty state 图标/文案/按钮各写一份 | `WorkspaceView`、`ProjectDetail`、`MySkills` | **P2** |

### 3. 性能

| # | 问题 | 证据 | 优先级 |
|---|---|---|---|
| P-1 | **零代码分割**：`lazy`/`Suspense` 使用数为 0，全部 view 打进单一 chunk | 构建输出单 JS chunk ~1.07 MB（gzip 317 KB），Vite 警告 >500 KB | **P1** |
| P-2 | **两套拖拽库并存**：`@dnd-kit/*`（core+sortable+utilities）与 `@hello-pangea/dnd` 同时依赖，冗余 bundle | `package.json` dependencies | **P1** |
| P-3 | **超大组件重渲染面广**：`MySkills.tsx` 2080 行、`Settings.tsx` 1794 行、`ProjectDetail.tsx` 1613 行、`InstallSkills.tsx` 1629 行，单文件承载过多 state，局部交互触发大范围 re-render | `wc -l src/views` | **P1** |
| P-4 | 列表项未 memo 化，父级 state 变更导致整列表重算 | 各 view `.map` 内联渲染 | **P2** |

### 4. 代码规范性 / 可维护性

| # | 问题 | 证据 | 优先级 |
|---|---|---|---|
| C1 | **巨型 view 文件**：4 个 view 超 1600 行，混合数据获取、业务逻辑、子面板 UI，难测试难维护 | 同 P-3 | **P1** |
| C2 | **缺少原子 UI 组件层**：没有 `Button`/`Badge`/`Modal`/`Pill`/`EmptyState`/`Skeleton` 等复用组件，样式靠复制 | `src/components` 多为业务组件，无 UI primitives | **P1** |
| C3 | **i18n 三语文件不齐**：`en.json`/`zh.json` 各 914 行，`zh-TW.json` 仅 830 行，存在缺失 key（运行时静默回退） | `wc -l src/i18n/*.json` | **P2** |
| C4 | 内联样式字符串长且重复，`cn()` 拼接冗长，缺少 variant 抽象 | 全仓 | **P2** |

**诊断结论**：设计系统的**底座是好的**（CSS 变量双主题 + `app-*` 组件类 + tailwind 令牌），核心问题是**未被贯彻使用** + **缺原子组件层** + **巨型文件** + **无性能优化手段**。因此重构应是「收敛与贯彻」，而非推倒重来。

---

## 二、重构方案

### 核心原则

1. **零业务回归**：只改「怎么呈现/组织」，不改「做什么」。每步以现有 `tsc + vite build` 通过、页面手测无差异为准。
2. **渐进式、可回滚**：小步提交，每个 PR 聚焦单一维度，随时可停可回退。
3. **收敛而非新建**：优先复用已有 `index.css` 设计系统与 tailwind 令牌，把散落样式收敛进原子组件，不引入重型 UI 框架。
4. **单一事实源**：颜色、圆角、状态色板、间距只有一个定义处。

### 技术选型

- **保持不新增重型依赖**：继续纯 Tailwind + CSS 变量；用 `tailwind-merge`（已装）+ 轻量 variant 模式自建原子组件，不引入 MUI/AntD（与现有像素级定制风格冲突，且体积大）。
- **拖拽库二选一**：统一到 `@dnd-kit`（更现代、可组合、体积可控），移除 `@hello-pangea/dnd`；把 Sidebar 的 `@hello-pangea/dnd` 迁到 dnd-kit。
- **代码分割**：用 React 原生 `lazy` + `Suspense` 对路由级 view 拆包。
- **虚拟化**（仅当实测需要）：`@tanstack/react-virtual`（无渲染、hook 式、体积小），只用于确有长列表的技能中心/项目工作区。
- **变体抽象**：用 `tailwind-variants` 或手写 `cva` 风格的小工具封装 Button/Badge 变体（评估后择一，倾向零依赖手写以控体积）。

### 体验升级方向

- 统一的 **Button / Badge / Pill / Modal / Sheet / EmptyState / Skeleton** 原子组件，一处定义、全局一致。
- 加载态从 spinner 升级为**内容骨架屏**，减少切换闪烁。
- 统一状态色板（同步状态、标签、危险操作）为一份 `statusPalette`。
- 长列表虚拟化，保证条目规模增长后仍流畅。

---

## 三、分阶段计划

### 阶段 0 · 准备（低风险、打地基）

| 项 | 内容 |
|---|---|
| 任务 | ① 建立基线：`tsc --noEmit`、`vite build` 记录当前产物体积与告警；对关键页面（技能中心、Agent 详情、项目工作区、设置、安装）截图存档做视觉回归基准。② 修复 **V1（`accent-hover` 未定义）**：在 `tailwind.config.js` 补 `accent.hover` 令牌 + `index.css` 补 `--color-accent-hover` 变量（明/暗）。③ 补齐 ESLint 规则基线，确保 CI 可跑。 |
| 交付物 | 基线文档（体积/告警/截图）；`accent-hover` 令牌落地；一次绿色构建。 |
| 验收标准 | 主按钮 hover 变色生效；`tsc`/`build` 通过；截图基线归档。 |

### 阶段 1 · 核心改造（分维度小步走）

按「先原子组件、后收敛替换、再性能」的顺序。每个子项独立 PR。

| 子阶段 | 任务 | 交付物 | 验收标准 |
|---|---|---|---|
| 1A 原子组件层 | 新建 `src/components/ui/`：`Button`、`Badge`/`Pill`、`Modal`（含遮罩）、`Sheet`（复用现有 `DetailSheet` 提炼）、`EmptyState`、`Skeleton`。用 CSS 变量与现有 `app-*` 语义对齐。 | `ui/` 目录 + 每个组件的 variant 定义 | 组件覆盖现有全部按钮/药丸/遮罩用法的视觉；`tsc`/`build` 通过 |
| 1B 收敛替换 | 用 1A 组件**逐文件替换**手写样式：6+ 处主按钮 → `Button`；12 处遮罩 → `Modal`/`Sheet`；散落药丸 → `Pill`；空状态 → `EmptyState`。**每替换一个文件跑一次构建 + 手测**。 | 各 view/组件替换 PR | 页面视觉与替换前一致（对比基线截图）；无功能变化 |
| 1C 状态色板收敛 | 抽 `src/lib/statusPalette.ts`：同步状态、标签、危险色统一到一处；`getLocalStatusMeta`/`SyncDots`/`skillTags` 改为消费它。 | `statusPalette.ts` + 三处改造 | 状态色显示不变；单一来源 |
| 1D 巨型文件拆分 | 把 4 个 >1600 行 view 的**子面板/子区块**抽成独立组件（如 `MySkills` 的卡片、工具栏、Git 面板；`Settings` 的各 section）。**只搬迁不改逻辑**，props 透传。 | 拆分后的子组件 + 瘦身后的 view | 行为完全一致；单文件显著变小；`tsc`/`build` 通过 |
| 1E 性能 | ① 路由级 `lazy`+`Suspense` 代码分割；② 移除 `@hello-pangea/dnd`，Sidebar 迁 `@dnd-kit`；③ 列表项 `React.memo` + 稳定 `useCallback`；④ 实测长列表后按需接入 `@tanstack/react-virtual`。 | 分包构建、单一拖拽库、memo 化列表 | 主 chunk 显著变小（拆出各 view chunk）；拖拽功能不变；滚动流畅 |

### 阶段 2 · 验收（回归 + 收尾）

| 项 | 内容 |
|---|---|
| 任务 | ① 视觉回归：逐页对比基线截图（明/暗、中/繁/英）。② 功能回归：按核心流程手测（安装 Skill、同步/取消同步、Preset 应用、Git 备份、项目导入导出、筛选/搜索）。③ 补齐 **C3**：对齐三语 i18n key。④ 更新 `docs/Agent管理机制.md` 等相关文档中受影响的代码位置引用。 |
| 交付物 | 回归报告；i18n 对齐提交；文档更新；最终构建体积对比。 |
| 验收标准 | 所有核心流程功能无回归；三语无缺失 key；构建体积较基线下降；`tsc`/`lint`/`build` 全绿。 |

---

## 四、执行指引（可直接落地）

### 指引 0-1：修复 `accent-hover`（阶段 0）

`app/src/index.css` 两个主题各加变量：

```css
:root {
  /* ...existing... */
  --color-accent-hover: #047857; /* = accent-dark，明亮主题 hover 加深 */
}
.dark {
  --color-accent-hover: #059669;
}
```

`app/tailwind.config.js` 的 `accent` 下补：

```js
accent: {
  DEFAULT: 'var(--color-accent)',
  hover: 'var(--color-accent-hover)',
  light: 'var(--color-accent-light)',
  dark: 'var(--color-accent-dark)',
  bg: 'var(--color-accent-bg)',
  border: 'var(--color-accent-border)',
},
```

改完 `hover:bg-accent-hover` 即生效，无需改调用处。

### 指引 1A：Button 原子组件（示例规范）

`app/src/components/ui/Button.tsx`——用 CSS 变量语义，覆盖现有主/次/危险/幽灵变体：

```tsx
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium " +
  "transition-colors outline-none disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-accent-hover",
  secondary:
    "border border-border-subtle bg-surface text-secondary hover:bg-surface-hover",
  ghost: "text-muted hover:bg-surface-hover hover:text-secondary",
  danger: "bg-danger text-white hover:opacity-90",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-2.5 text-[13px]",
  md: "h-9 px-3 text-[13px]",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  icon,
  className,
  children,
  ...rest
}: Props) {
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...rest}>
      {icon}
      {children}
    </button>
  );
}
```

替换示例（`WorkspaceView.tsx:812`「添加 Skill」按钮）：

```tsx
// before
<button className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md bg-accent px-3 text-[13px] font-medium text-white transition-colors hover:bg-accent-hover" onClick={...}>
  <Plus className="h-3.5 w-3.5" /> {t("globalWorkspace.addSkill")}
</button>

// after
<Button size="md" icon={<Plus className="h-3.5 w-3.5" />} onClick={...} className="shrink-0">
  {t("globalWorkspace.addSkill")}
</Button>
```

### 指引 1B：Modal 遮罩收敛

把 12 处手写遮罩提炼为 `app/src/components/ui/Modal.tsx`，统一遮罩透明度、模糊、点击关闭、`z-index`、`Esc` 关闭与滚动锁定。各 dialog 只保留内容主体，外壳交给 `Modal`。`DetailSheet` 作为右侧抽屉的既有实现，提炼为 `ui/Sheet` 并保留其 `onBack`/`backLabel` 能力（本次会话已统一）。

**收敛验收要点**：替换后逐个 dialog 手测「点遮罩关闭」「Esc 关闭」「返回/关闭按钮」行为与之前一致。

### 指引 1C：状态色板

```ts
// app/src/lib/statusPalette.ts
export type SyncStatus =
  | "project_only" | "in_sync" | "project_newer" | "center_newer" | "diverged";

export const syncStatusClass: Record<SyncStatus, string> = {
  project_only: "bg-surface-hover text-muted",
  in_sync: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  project_newer: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  center_newer: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  diverged: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
};
```

`WorkspaceView.getLocalStatusMeta`、`SyncDots` 改为消费此表，颜色字面量不再散落。

### 指引 1D：巨型文件拆分（只搬迁）

以 `MySkills.tsx`（2080 行）为例，按区块抽出：
- `MySkills/SkillCard.tsx`、`MySkills/Toolbar.tsx`、`MySkills/GitBackupPanel.tsx`、`MySkills/TagFilterBar.tsx`。
- 父组件保留 state 与 handler，通过 props 下传；**不改任何逻辑与调用时序**。

**纪律**：一次只抽一个区块 → `tsc`+`build` → 手测该页 → 提交。禁止在搬迁 PR 里顺手改逻辑。

### 指引 1E：代码分割

`app/src/App.tsx`（路由处）：

```tsx
import { lazy, Suspense } from "react";
const MySkills = lazy(() => import("./views/MySkills"));
const Settings = lazy(() => import("./views/Settings"));
// ...其余 view 同理

<Suspense fallback={<PageSkeleton />}>
  <Routes>{/* ... */}</Routes>
</Suspense>
```

拖拽库统一：把 `Sidebar.tsx` 的 `@hello-pangea/dnd`（`DragDropContext/Droppable/Draggable`）迁到 `@dnd-kit`（项目已在 MySkills 用 dnd-kit，有现成范式可循），迁移后从 `package.json` 移除 `@hello-pangea/dnd` 并重建锁文件。

### 通用纪律

- 每个 PR 单一维度、单一意图；提交前必过 `tsc --noEmit` + `vite build`。
- 视觉改动对照阶段 0 基线截图；行为改动按核心流程手测。
- i18n 新增 key 必须三语同步（zh/zh-TW/en）。
- 不在样式/搬迁 PR 中夹带业务逻辑变更。

---

## 五、优先级速览（先做什么）

1. **P0**：`accent-hover` 令牌修复（阶段 0，成本极低、立即见效）。
2. **P1**：原子组件层 + 遮罩/按钮收敛（1A/1B）；代码分割 + 拖拽库合并（1E 前两项）；巨型文件拆分（1D）。
3. **P2**：状态色板收敛（1C）、虚拟化（按实测）、i18n 对齐、圆角/间距令牌统一。
