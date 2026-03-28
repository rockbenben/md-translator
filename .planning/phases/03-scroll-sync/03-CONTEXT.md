# Phase 3: Scroll Sync - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 3 implements synchronized scrolling between left and right panels in the split pane view. This phase delivers:
- Bidirectional scroll sync between panels
- Scroll sync enabled by default
- Scroll sync works in both text mode and preview mode
- Prevention of infinite scroll loops (isScrolling flag)

This phase does NOT include:
- Mobile responsive fallback (Phase 4)
- Performance optimization at scale (>5000 lines)

</domain>

<decisions>
## Implementation Decisions

### Scroll Synchronization
- **D-01:** Bidirectional sync — Scrolling either panel scrolls the other panel to match
- **D-02:** Default enabled — Scroll sync is ON when user opens split view
- **D-03:** All modes synced — Text mode and preview mode both have scroll sync active
- **D-04:** Row-based index sync — Use `data-index` attributes on content elements for precise sync
- **D-05:** isScrolling flag — Prevent infinite loop by only allowing one direction to trigger at a time

### Technical Approach
- **D-06:** Refs for DOM — Use refs (not React state) for scroll position to avoid re-renders
- **D-07:** RAF batching — Use requestAnimationFrame for smooth 60fps performance
- **D-08:** Nested element handling — Apply `data-index` to `<tr>`, `<li>` not container elements

### Toggle Control
- **D-09:** Toggle button — Add a sync scroll toggle button in the toolbar
- **D-10:** Persist preference — Save sync enabled/disabled state to localStorage

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Research
- `.planning/research/STACK.md` — Stack recommendations
- `.planning/research/SUMMARY.md` — Row-based sync pattern, pitfall prevention

### Existing Code (Phase 1-2)
- `src/app/components/SplitPane/SplitPaneView.tsx` — Current implementation with preview mode
- `src/app/components/SplitPane/SplitPaneContainer.tsx` — Split pane infrastructure
- `src/app/components/SplitPane/MarkdownPreview.tsx` — Markdown rendering with data-index support

### Key Patterns from Research

**Row-based Index Sync (from SUMMARY.md):**
```
1. Assign data-index to markdown source lines
2. Apply data-index to rendered elements (tr, li, not containers)
3. On scroll: find visible elements, scroll target to matching data-index
```

**Infinite Loop Prevention:**
```
- isScrolling flag prevents bidirectional feedback
- Only sync from "source" to "target", never both directions at same time
```

</canonical_refs>

<code_context>
## Existing Code Insights

### Phase 1-2 Delivered
- SplitPaneView with text mode and preview mode
- Left panel: source TextArea / MarkdownPreview
- Right panel: translation TextArea / MarkdownPreview
- Preview toggle button in toolbar
- SplitPaneContainer handles layout

### What Phase 3 Adds
- Scroll sync between panels via useScrollSync hook
- Toggle button to enable/disable sync
- data-index attributes on content for line mapping

### Integration Points
- SplitPaneView needs scroll container refs
- MarkdownPreview needs data-index on rendered elements
- Toggle state needs localStorage persistence

</code_context>

<specifics>
## Specific Ideas

- Scroll sync uses row-based index matching (not percentage)
- Bidirectional: scroll either panel to sync the other
- Enabled by default, toggle to disable
- Works in text mode and preview mode
- isScrolling flag prevents feedback loops

</specifics>

<deferred>
## Deferred Ideas

### For Phase 4 (Polish)
- Mobile responsive layout
- Performance optimization for large documents (>5000 lines)
- Focus line highlighting

### Out of Scope
- Real-time collaborative scrolling
- Scroll position memory (restore on reload)

</deferred>

---

*Phase: 03-scroll-sync*
*Context gathered: 2026-03-28*
