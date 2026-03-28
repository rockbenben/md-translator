---
phase: "01"
plan: "02"
subsystem: SplitPane
tags:
  - split-pane
  - tab-integration
  - translation-ui
dependency_graph:
  requires:
    - "01-01-SplitPaneContainer"
  provides:
    - "SplitPaneView component"
    - "Tab integration"
  affects:
    - "client.tsx"
    - "messages translations"
tech_stack:
  added:
    - "SplitPaneView.tsx"
  patterns:
    - "React functional component with hooks"
    - "Ant Design Card + Flex layout"
    - "next-intl translations"
    - "TranslationContext integration"
key_files:
  created:
    - "src/app/components/SplitPane/SplitPaneView.tsx"
  modified:
    - "src/app/[locale]/client.tsx"
    - "messages/en.json"
    - "messages/zh.json"
    - "messages/zh-hant.json"
decisions:
  - id: "split-tab-integration"
    decision: "Add split preview as new tab between basic and advanced"
    rationale: "Maintains existing tab structure while adding split pane functionality"
    alternatives: "Modal overlay, separate page"
    chosen: true
  - id: "independent-source-text"
    decision: "SplitPaneView maintains its own sourceText state"
    rationale: "Per D-03: Independent source input - split view has its own text input area"
    alternatives: "Share state with main translation tab"
    chosen: true
  - id: "settings-from-translation-context"
    decision: "Uses useTranslationContext for settings and translation trigger"
    rationale: "Per D-02: Settings from translation tab - no duplicate settings panel"
    alternatives: "Independent settings panel"
    chosen: true
metrics:
  duration: "3 minutes"
  completed_date: "2026-03-28T14:31:17Z"
  tasks_completed: 3
  files_created: 1
  files_modified: 4
---

# Phase 01 Plan 02 Summary: SplitPaneView 创建与 Tab 集成

## 一句话描述

创建 SplitPaneView 组件并集成到 Tab 系统中，实现分屏预览功能。

## 执行概述

成功将 SplitPaneContainer 集成到 Tab 系统中，创建了"分屏预览"Tab，让用户可以在独立的面板中输入原文并查看翻译结果。

## 已完成任务

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 | 读取 client.tsx 了解 Tab 结构 | - | client.tsx |
| 2 | 创建 SplitPaneView 组件 | f0cf7b2 | SplitPaneView.tsx |
| 3 | 集成到 Tab 系统 | f0cf7b2 | client.tsx, messages/*.json |

## 关键实现

### SplitPaneView 组件

- **左侧面板**: 原文输入区 (TextArea) - 用户可以粘贴或输入文本
- **右侧面板**: 译文显示区 (只读 TextArea) - 显示翻译结果
- **翻译按钮**: 触发翻译流程，使用 useTranslationContext 中的设置
- **拖拽分隔**: 通过 SplitPaneContainer 实现 50:50 默认比例的拖拽分隔

### Tab 集成

- 在 client.tsx 中添加了 "split" key 的 Tab 项
- 使用 `t("splitPreviewTab")` 获取翻译的 Tab 标题
- Tab 顺序: 翻译区 → 分屏预览 → API 设置

### 翻译键值

在以下文件中添加了 `splitPreviewTab` 键:
- `messages/en.json`: "Split Preview"
- `messages/zh.json`: "分屏预览"
- `messages/zh-hant.json`: "分屏預覽"

## 偏差记录

### 自动修复的问题

**1. [Rule 2 - Missing Validation] 修复 freeApiEnabled 属性检查**
- **发现时间**: Task 2
- **问题**: `TranslationConfig` 类型没有 `freeApiEnabled` 属性
- **修复**: 改为检查 `translationMethod !== "gtxFreeAPI"` 来判断是否需要 API Key
- **文件**: `src/app/components/SplitPane/SplitPaneView.tsx`
- **Commit**: f0cf7b2

**2. [Rule 2 - Missing Props] 修复 SplitPaneContainer 多余属性**
- **发现时间**: Task 2
- **问题**: `SplitPaneContainerProps` 没有 `leftTitle` 和 `rightTitle` 属性
- **修复**: 从组件调用中移除这两个属性（标题已在 Card 组件中定义）
- **文件**: `src/app/components/SplitPane/SplitPaneView.tsx`
- **Commit**: f0cf7b2

## 验证清单

- [x] `src/app/components/SplitPane/SplitPaneView.tsx` 已创建
- [x] `client.tsx` 导入 SplitPaneView
- [x] "分屏预览" Tab 已添加到 Tab items
- [x] Tab 切换可以显示 SplitPaneView
- [x] SplitPaneView 包含左侧原文输入和右侧译文显示
- [x] 翻译按钮调用翻译逻辑
- [x] 拖拽分隔线可调整宽度 (由 SplitPaneContainer 提供)
- [x] 刷新页面后分屏比例保持不变 (由 useLocalStorage 提供)

## 下一步

Phase 01 的所有计划已完成:
- [x] 01-01: SplitPaneContainer 创建 ✓
- [x] 01-02: SplitPaneView 创建与 Tab 集成 ✓

准备进入 Phase 02 (Panels + Preview)

---

*Generated: 2026-03-28T14:31:17Z*
