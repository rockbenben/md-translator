# Phase 1: Foundation - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 1 establishes the split-pane container infrastructure for the "分屏预览" tab. This phase delivers:
- New "分屏预览" tab (coexists with existing "翻译区" tab)
- Left panel: source Markdown text (read-only)
- Right panel: translation result (read-only)
- Draggable divider to adjust panel widths
- Panel ratio persistence via localStorage

This phase does NOT include:
- Preview rendering (Phase 2)
- Scroll synchronization (Phase 3)
- Settings panel in split view (uses settings from "翻译区" tab)

</domain>

<decisions>
## Implementation Decisions

### Layout Architecture
- **D-01:** Tab-based approach — New "分屏预览" tab coexists with existing "翻译区" tab
- **D-02:** Settings from "翻译区" — Split view uses settings from the translation tab (no duplicate settings panel)
- **D-03:** Independent source input — Split view has its own text input area (paste/type), no file upload

### Split Pane Behavior
- **D-04:** Default ratio 50:50 — Left and right panels start equal width
- **D-05:**细线 divider — Thin draggable divider line with hover highlight, non-intrusive

### Persistence
- **D-06:** Ratio persistence via localStorage — Panel ratio saved and restored on page reload

### Claude's Discretion
- Specific drag handle colors/thickness — Can use standard Ant Design defaults
- Exact localStorage key naming — Can follow existing pattern (`mdTranslatorSplitRatio`)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Research
- `.planning/research/STACK.md` — react-split library recommendation, row-based sync pattern
- `.planning/research/SUMMARY.md` — Architecture approach, pitfall prevention

### Existing Code
- `src/app/[locale]/MDTranslator.tsx` — Main component structure, existing tab/panel patterns
- `src/app/components/ResultCard.tsx` — Translation result display component (reference for panel design)
- `src/app/hooks/useLocalStorage.ts` — Existing persistence hook
- `src/app/hooks/useTranslationContext.tsx` — Translation state management (for settings access)

### UI Conventions
- `src/app/globals.css` — Tailwind CSS 4 styling patterns
- Ant Design 6 component usage patterns in existing codebase

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ResultCard.tsx` — Read-only text display component, can be reference for panel styling
- `useLocalStorage` hook — Already used for persistence, reuse for ratio storage
- `useTranslationContext` — Access translation settings from existing tab

### Established Patterns
- Ant Design Card + Flex layout for panels
- Tab-based navigation (existing "翻译区" tab)
- Read-only TextArea for display

### Integration Points
- New "分屏预览" tab component needs to be added to existing tab navigation
- Source text in split view should be independent state (not shared with translation tab)
- Translation trigger uses `handleTranslate` from existing `useTranslationContext`

</code_context>

<specifics>
## Specific Ideas

- Split view text areas are read-only displays (user pastes source, sees translation result)
- No file upload in split view — user manually pastes text
- Settings (API, language selection) come from the "翻译区" tab
- Translation is triggered via a button in the split view UI

</specifics>

<deferred>
## Deferred Ideas

### For Phase 2 (Panels + Preview)
- Preview rendering with react-markdown
- Preview mode toggle (text ↔ rendered)
- Which markdown elements to render (tables, code blocks, LaTeX)

### For Phase 3 (Scroll Sync)
- Sync scroll algorithm implementation
- Bidirectional scroll prevention
- Nested element handling (tables, lists)

### Out of Scope
- File upload in split view — user explicitly chose independent text input only
- Settings panel in split view — uses settings from "翻译区" tab

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-28*
