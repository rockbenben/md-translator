# Phase 1: Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-28
**Phase:** 1-foundation
**Areas discussed:** Layout Integration, Settings Placement, Upload Location, Split Ratio, Drag Handle

---

## Layout Integration

| Option | Description | Selected |
|--------|-------------|----------|
| 抽屉/模态 | Settings move to drawer from toolbar button | ✓ |
| 工具栏 | Settings in toolbar above split pane | |
| 侧边栏可折叠 | Settings in collapsible sidebar, three-section layout | |

**User's choice:** 抽屉/模态 (recommended)

**Notes:** Settings move to drawer accessible from toolbar button, slides from right.

---

## Layout Redesign (re-discussed)

| Option | Description | Selected |
|--------|-------------|----------|
| 上:上传+设置 \| 下:分屏 | Upload and settings at top, split below | |
| 左:分屏 \| 右:设置+上传 | Split on left, settings/upload on right | |
| 工具栏放设置 \| 底部上传+分屏 | Settings in toolbar, upload at bottom-left, split below | |
| 新增「分屏预览」标签页 | Add new tab coexisting with "翻译区" | ✓ |

**User's choice:** 新增「分屏预览」标签页

**Notes:** Tab-based approach. Keep existing "翻译区" unchanged. New "分屏预览" tab with left-right split. No settings panel in split view — uses settings from "翻译区" tab.

---

## Tab Name

| Option | Description | Selected |
|--------|-------------|----------|
| 分屏预览 | Clean and descriptive | ✓ |
| 左右对照 | Emphasizes comparison function | |
| 双语对照 | Emphasizes bilingual reading | |

**User's choice:** 分屏预览

---

## Source Text Location

| Option | Description | Selected |
|--------|-------------|----------|
| 读取翻译区 | Split view auto-reads source from translation tab | |
| 独立输入 | Split view has independent input area | ✓ |

**User's choice:** 独立输入粘贴文本，不需要支持上传文件

**Notes:** Independent text paste/input in split view. No file upload support. Uses settings from "翻译区" tab for translation.

---

## Default Split Ratio

| Option | Description | Selected |
|--------|-------------|----------|
| 50:50 | Equal split | ✓ |
| 60:40 (源码:译文) | Source slightly wider for reading | |
| 40:60 (源码:译文) | Translation slightly wider for reading | |

**User's choice:** 50:50

---

## Drag Handle Style

| Option | Description | Selected |
|--------|-------------|----------|
| 细线 | Thin divider with hover highlight, non-intrusive | ✓ |
| 宽分隔带 | Wider divider for easier drag/touch | |

**User's choice:** 细线

---

## Deferred Ideas

- Preview rendering (Phase 2) — react-markdown integration
- Scroll synchronization (Phase 3) — row-based sync algorithm
- File upload in split view — explicitly excluded by user choice

---
