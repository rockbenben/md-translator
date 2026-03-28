# Phase 2: Panels + Preview - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-28
**Phase:** 2-panels-preview
**Areas discussed:** Preview Toggle UI, Preview Content, Markdown Rendering Scope

---

## Preview Toggle UI

| Option | Description | Selected |
|--------|-------------|----------|
| 图标按钮切换 | Top-right icon button switches text/preview | ✓ |
| Tab 子页签 | Panel has internal "text"/"preview" sub-tabs | |
| 双层面板 | Panel has text on top, preview on bottom | |

**User's choice:** 图标按钮切换

**Notes:** Simple, non-intrusive. One button at top area.

---

## Preview Content

| Option | Description | Selected |
|--------|-------------|----------|
| 译文渲染 | Preview mode shows rendered translation only | |
| 可切换预览 | Can toggle to preview source OR translation | |
| 同时预览原文和译文 | Preview mode shows both source and translation rendered | ✓ |

**User's choice:** 同时预览原文和译文

**Notes:** In preview mode, both panels render. Left = source, Right = translation.

---

## Preview Layout

| Option | Description | Selected |
|--------|-------------|----------|
| 全局预览切换 | One button at top switches both panels simultaneously | ✓ |
| 各自预览 | Each panel has its own preview toggle | |

**User's choice:** 全局预览切换

**Notes:** One toggle button affects the entire split view.

---

## Markdown Rendering Scope

| Option | Description | Selected |
|--------|-------------|----------|
| 基础 + GFM | Headings, lists, code, links, bold, tables, task lists | |
| 仅基础 | Headings, lists, code, links, bold, italic | |
| 基础 + GFM + LaTeX | Basic + tables/task lists + math formulas | ✓ |

**User's choice:** 基础 + GFM + LaTeX

**Notes:** Full markdown support including math formulas (remark-math + rehype-katex).

---

## Deferred Ideas

- Scroll synchronization — Phase 3
- Mobile responsive layout — Phase 4
- Separate preview toggle per panel — Global toggle only selected

---
