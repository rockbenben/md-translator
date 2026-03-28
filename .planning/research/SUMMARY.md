# Project Research Summary

**Project:** MD Translator Side-by-Side Editor
**Domain:** Split-pane Markdown translation editor with synchronized scrolling
**Researched:** 2026-03-28
**Confidence:** MEDIUM-HIGH

## Executive Summary

This project transforms MD Translator's single-panel translation workflow into a side-by-side (SBS) split-pane editor where users view source and translation simultaneously. The core technical challenge is implementing **row-level synchronized scrolling** between a plain-text source editor and a rendered markdown preview — something that breaks with naive percentage-based approaches when content heights differ significantly (e.g., code blocks, LaTeX formulas).

Expert consensus recommends using **row-based index synchronization** with `data-index` attributes, direct DOM manipulation via refs (not React state), and an `isScrolling` flag to prevent bidirectional feedback loops. The architecture should use a `SplitPaneContext` to coordinate between panels and a dedicated `useScrollSync` hook for testability. Security (XSS sanitization) and performance (60fps during resize/scroll) are non-negotiable foundation concerns that must be addressed from day one.

Key risks include: scroll desync with complex markdown, resize jank from state-based React updates, and XSS vulnerability from unsanitized user markdown. All are preventable with the documented patterns.

## Key Findings

### Recommended Stack

The recommended stack uses battle-tested, zero-dependency libraries that support React 19 and Next.js App Router. For split panes, **react-split** (6.3k stars, actively maintained since 2014) handles resizable panels via pure CSS. For markdown rendering, **react-markdown** (15.6k stars) builds virtual DOM safely by default, preventing XSS without extra configuration.

**Core technologies:**
- **react-split** — Split pane layout with resizable panels, pure CSS resizing, 1-2kb gzipped
- **react-markdown** (^10.1.0) — Safe markdown rendering, 100% CommonMark compliant, tree-shakeable
- **remark-gfm** (^4.0.0) — GitHub Flavored Markdown support (tables, task lists, strikethrough)
- **react-syntax-highlighter** (^15.0.0) — Code block syntax highlighting via Prism engine
- **remark-math** + **rehype-katex** — LaTeX math formula support (optional, if needed)

For sync scrolling, **row-based index synchronization** is required for accuracy. Percentage-based sync (`scrollTop / scrollHeight`) drifts significantly with content that renders taller (code blocks, LaTeX, images).

### Expected Features

**Must have (table stakes):**
- **左右分屏布局** — Core UI: left panel for source text, right panel for translation display
- **同步滚动** — Basic scroll synchronization to keep source and translation aligned
- **译文只读** — Right panel is read-only display (no bidirectional editing)
- **预览模式切换** — Toggle between raw text and rendered markdown preview in right panel
- **面板宽度可调** — Draggable divider to adjust split ratio

**Should have (competitive differentiators):**
- **精确同步滚动** — Row-based index sync for line-level alignment (vs. basic percentage sync)
- **焦点行高亮** — Highlight current position in both panels for visual tracking
- **视图模式记忆** — Persist user's preview/preference via localStorage

**Defer (v2+):**
- **移动端降级模式** — Responsive fallback to single-panel with tab switching
- **平滑滚动动画** — requestAnimationFrame-based smooth scrolling optimization
- **双面板预览切换 (SBS-05)** — Preview mode can show rendered source or translation

### Architecture Approach

The architecture separates concerns into: UI Layer (React components), Scroll Sync Controller, State Layer (existing TranslationContext + new SplitPaneContext), and Markdown Processing Layer. Components are self-contained in `ui/split-pane/` for easy extraction.

**Major components:**
1. **SplitPaneContainer** — Layout wrapper with ratio management and drag-to-resize
2. **MarkdownSourcePanel** — Display source markdown (read-only textarea/editor)
3. **TranslationResultPanel** — Display translation, switch between text/preview modes
4. **PreviewRenderer** — Render markdown with `data-index` attributes for sync
5. **ScrollSyncController / useScrollSync** — Core sync logic via refs, RAF batching, `isScrolling` flag
6. **LineIndexMapper** — Map source lines to rendered elements for precise sync

### Critical Pitfalls

1. **Bidirectional Scroll Infinite Loop** — When both panels listen to each other's scroll events, scrolling one triggers the other in a feedback loop. **Prevention:** Use `isScrolling` flag and only sync from "source" to "target" panel, never both.

2. **Percentage-Based Scroll Desync** — Simple `scrollTop / scrollHeight` percentage sync drifts apart when rendered content heights differ (code blocks, LaTeX). **Prevention:** Use row-based index sync with `data-index` attributes on content elements.

3. **Resize Triggers Full Re-render** — Storing panel sizes in React state causes 60fps lag during drag. **Prevention:** Use refs/imperative DOM updates during drag; only update React state on resize end.

4. **Markdown XSS Vulnerability** — User-supplied markdown can embed malicious scripts. **Prevention:** react-markdown is safe by default; if allowing HTML, add DOMPurify sanitization layer.

5. **Nested Element Index Collision** — Tables/lists render nested DOM; `data-index` on containers misaligns sync. **Prevention:** Apply `data-index` to content rows (`<tr>`, `<li>`) not containers.

## Implications for Roadmap

Based on research, a 4-phase structure emerges naturally from dependency relationships:

### Phase 1: Foundation — Split Pane Container
**Rationale:** All other components depend on having a container to render into. Performance-critical patterns (imperative resize, no state cascade) must be established here.
**Delivers:** `SplitPaneContainer` with drag-to-resize, split ratio persisted in context
**Addresses:** Split layout (SBS-01), panel width adjustment
**Avoids:** Pitfall 3 (resize re-render), Pitfall 8 (React state cascade in scroll)

### Phase 2: Panel Components + Preview Mode
**Rationale:** Visual output is needed before scroll sync can be tested. Preview toggle is a key differentiator.
**Delivers:** `MarkdownSourcePanel`, `TranslationResultPanel`, `PreviewRenderer`, `PreviewToggle`
**Uses:** react-markdown, remark-gfm, react-syntax-highlighter
**Implements:** Pattern 4 (Preview Mode Toggle)

### Phase 3: Scroll Synchronization
**Rationale:** Complex algorithm that requires stable panel structure to build and test. This is the hardest part.
**Delivers:** `useScrollSync` hook, `data-index` attribute system, scroll sync between panels
**Uses:** Row-based index sync pattern
**Implements:** Pattern 1 (Scroll-Linked Sync), Pattern 2 (Context-Based State), Pattern 3 (Ref-Based DOM)
**Avoids:** Pitfall 1 (infinite loop), Pitfall 2 (percentage desync), Pitfall 6 (nested elements), Pitfall 7 (height mismatch)

### Phase 4: Refinement
**Rationale:** Polish and edge cases after core functionality works.
**Delivers:** Focus line highlighting, view mode memory, mobile responsive fallback, performance optimization
**Implements:** requestAnimationFrame optimization, localStorage persistence

### Phase Ordering Rationale

- **Phase 1 → 2 → 3 dependency chain:** Split container → panels → sync algorithm
- **Security (XSS) is Phase 1 foundation:** Must be established before preview rendering
- **Scroll sync complexity is deferred:** Algorithm is complex and depends on stable panel structure
- **Performance patterns in Phase 1:** Imperative resize, RAF batching, ref-based scroll — all foundation patterns

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (Scroll Sync):** Complex algorithm with Monaco editor integration; may need `/gsd-research-phase` for editor-specific handling
- **Phase 4 (Refinement):** Mobile responsive behavior, edge case handling for LaTeX/code height estimation

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation):** Resizable split panes are well-documented; react-split patterns are standard
- **Phase 2 (Panels):** react-markdown + preview toggle is a common pattern

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Official library docs, npm stats, Context7-verified sources. All packages confirmed React 19 compatible. |
| Features | MEDIUM | Community consensus via competitor analysis; Chinese-language sources add some uncertainty |
| Architecture | HIGH | Detailed implementation patterns from DEV Community with code examples; HIGH confidence source |
| Pitfalls | MEDIUM-HIGH | Multiple real-world bug reports (GitHub issues) confirm pitfalls; prevention patterns well-documented |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Monaco Editor Integration:** Current MDTranslator uses Monaco (based on 673-line monolith). Scroll sync with Monaco requires `editor.onDidScrollChange()` instead of native scroll events — needs specific testing at various browser zoom levels.
- **LaTeX/Code Block Height Estimation:** Row-based sync works for text blocks but heights for LaTeX and code blocks need estimation algorithms that may need refinement during implementation.
- **Performance at Scale:** Documents >5000 lines may require virtualization — not tested in current research.

## Sources

### Primary (HIGH confidence)
- [DEV Community: Implementing Synchronous Scrolling](https://dev.to/woai3c/implementing-synchronous-scrolling-in-a-dual-pane-markdown-editor-5d75) — Row-based sync implementation with code (Feb 2025)
- [nathancahill/split GitHub](https://github.com/nathancahill/split) — react-split library, 6.3k stars
- [remarkjs/react-markdown GitHub](https://github.com/remarkjs/react-markdown) — 15.6k stars, safe by default
- [GitHub: monaco-react#604](https://github.com/suren-atoyan/monaco-react/issues/604) — Monaco scroll sync issues
- [GitHub: react-resizable-panels#29](https://github.com/bvaughn/react-resizable-panels/issues/29) — Resize re-render performance

### Secondary (MEDIUM confidence)
- [markdown-editor-sync-scroll-demo](https://github.com/woai3c/markdown-editor-sync-scroll-demo) — Three sync implementations compared
- [segmentfault: markdown 双屏同步滚动](https://segmentfault.com/a/1190000042290360) — 中文详解
- [Best Markdown Libraries 2026](https://www.pkgpulse.com/blog/best-markdown-parsing-libraries-2026) — March 2026 comparison

### Tertiary (LOW confidence)
- [markdown-preview#984](https://github.com/pulsar-edit/pulsar/pull/984) — Rendering edge cases, needs validation

---
*Research completed: 2026-03-28*
*Ready for roadmap: yes*
