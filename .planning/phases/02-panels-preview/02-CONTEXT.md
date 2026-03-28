# Phase 2: Panels + Preview - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 2 implements preview mode toggle and Markdown rendering for the split pane view. This phase delivers:
- Preview mode toggle (text ↔ rendered) for both panels simultaneously
- Markdown rendering with Basic + GFM + LaTeX support
- Proper read-only display of source and translation text

This phase does NOT include:
- Scroll synchronization (Phase 3)
- Mobile responsive fallback (Phase 4)

</domain>

<decisions>
## Implementation Decisions

### Preview Mode
- **D-01:** Global preview toggle — One icon button at top switches BOTH panels to preview mode
- **D-02:** Preview shows both sides — In preview mode, left panel renders source, right panel renders translation
- **D-03:** Icon button location — Top-right area, non-intrusive

### Markdown Rendering
- **D-04:** Markdown elements: Basic (headings, lists, code blocks, links, bold, italic) + GFM (tables, task lists, strikethrough) + LaTeX (math formulas)
- **D-05:** Library: react-markdown + remark-gfm + remark-math + rehype-katex
- **D-06:** Syntax highlighting: react-syntax-highlighter for code blocks

### Panel Content (SBS-04, SBS-05, SBS-06)
- **D-07:** Left panel: Source Markdown text (read-only TextArea in text mode, rendered in preview mode)
- **D-08:** Right panel: Translation result (read-only TextArea in text mode, rendered in preview mode)
- **D-09:** Both panels read-only — user cannot edit content directly

### Claude's Discretion
- Specific icon for preview toggle — Can use EyeOutlined/EyeInvisibleOutlined from Ant Design
- Preview mode styling — Can follow Ant Design Card styling patterns
- LaTeX CSS loading — Use KaTeX CSS from CDN or package

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Research
- `.planning/research/STACK.md` — react-markdown, remark-gfm, remark-math, rehype-katex recommendations
- `.planning/research/SUMMARY.md` — Architecture approach, pitfall prevention

### Existing Code (Phase 1)
- `src/app/components/SplitPane/SplitPaneView.tsx` — Current implementation (text only)
- `src/app/components/SplitPane/SplitPaneContainer.tsx` — Split pane infrastructure
- `src/app/[locale]/client.tsx` — Tab integration

### UI Conventions
- Ant Design 6 component patterns in existing codebase
- `src/app/globals.css` — Tailwind CSS 4 styling

</canonical_refs>

<code_context>
## Existing Code Insights

### Phase 1 Delivered
- SplitPaneView with leftPanel (TextArea for source) and rightPanel (TextArea for translation)
- Independent sourceText state in SplitPaneView
- Translation via useTranslationContext
- Tab integration via client.tsx

### Reusable Assets
- SplitPaneContainer — Already handles split layout
- useTranslationContext — Already provides translation state
- Ant Design Card/Flex — Already used for panel styling

### What Phase 2 Adds
- Preview mode state and toggle button
- Markdown rendering components (react-markdown)
- Switch between TextArea and rendered view per panel

</code_context>

<specifics>
## Specific Ideas

- Preview mode is global — one toggle switches the entire view
- In preview: left = rendered source, right = rendered translation
- In text mode: left = source text, right = translation text
- Both panels remain read-only in both modes

</specifics>

<deferred>
## Deferred Ideas

### For Phase 3 (Scroll Sync)
- Sync scroll algorithm implementation
- Bidirectional scroll prevention
- Nested element handling

### Out of Scope
- Editable preview — panels remain read-only
- Mobile preview layout — Phase 4
- Separate preview toggle per panel — global toggle only

</deferred>

---

*Phase: 02-panels-preview*
*Context gathered: 2026-03-28*
