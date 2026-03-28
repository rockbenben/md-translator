# MD Translator — Side-by-Side Editor Enhancement

## What This Is

MD Translator 现有编辑器增加左右分屏视图功能，左侧显示原始 Markdown，右侧显示翻译结果，支持同步滚动和预览模式切换。

## Core Value

在翻译过程中提供清晰的原文/译文对照视图，减少来回切换，提升翻译效率和准确性。

## Requirements

### Validated

- ✓ Markdown 格式保留（代码块、LaTeX、FrontMatter 等）— 现有功能
- ✓ 多 API 支持（DeepL、Google、Azure、LLM）— 现有功能
- ✓ IndexedDB 缓存翻译结果 — 现有功能

### Active

- [ ] **SBS-01**: 左右分屏编辑器，左侧原文，右侧译文
- [ ] **SBS-02**: 原文与译文面板同步滚动
- [ ] **SBS-03**: 右侧面板支持切换：译文文本 ↔ 预览模式
- [ ] **SBS-04**: 预览模式进入专门的分屏视图
- [ ] **SBS-05**: 预览可切换：预览原文 / 预览译文
- [ ] **SBS-06**: 译文面板为只读（显示翻译结果）

### Out of Scope

- 修改现有翻译逻辑 — 保持现有翻译服务不变
- 可编辑译文 — 纯显示用途
- 实时协同编辑 — 后续考虑

## Context

现有 md-translator 的翻译输出直接在单个面板显示，用户需要手动对比原文和译文。新功能将提供原生分屏体验。

技术约束：
- Next.js 16 App Router
- React 19
- Tailwind CSS 4 + Ant Design 6
- 现有 `MDTranslator.tsx` 组件约 673 行，需要重构

## Constraints

- **兼容性**: 保持现有所有翻译 API 正常工作
- **性能**: 同步滚动需 60fps流畅
- **移动端**: 响应式布局（移动端可能降级为切换模式）

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 译文只读 | 避免与翻译服务状态不一致 | — Pending |
| 同步滚动 | 翻译时保持位置对照是核心体验 | — Pending |
| 切换式预览 | 节省屏幕空间，避免固定三分屏 | — Pending |

---
*Last updated: 2026-03-28 after feature requirements gathering*
