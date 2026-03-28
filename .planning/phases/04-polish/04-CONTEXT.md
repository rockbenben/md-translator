# Phase 4: Polish - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 4 implements mobile responsive fallback for the split pane view. This phase delivers:
- Mobile devices show single-panel with tab switching (not split view)
- Translation workflow works on mobile devices

This is the final polish phase after all core features are complete.

</domain>

<decisions>
## Implementation Decisions

### Mobile Responsive
- **D-01:** Mobile breakpoint — Use Tailwind CSS responsive prefixes (xs:, sm:, md:)
- **D-02:** Mobile shows single panel with bottom tabs — Switch between source/translation
- **D-03:** Desktop shows full split pane view — Unchanged from Phase 1-3
- **D-04:** Breakpoint threshold — `md` (768px) as cutoff

### Mobile UI Pattern
- **D-05:** Bottom tab bar — Two tabs: "原文" and "译文"
- **D-06:** Active tab determines which content to show
- **D-07:** Both text mode and preview mode work on mobile

### Translation Workflow
- **D-08:** Translation button works on mobile — Uses same translation logic
- **D-09:** Settings from "翻译区" tab — Unchanged from Phase 1

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Code (Phase 1-3)
- `src/app/components/SplitPane/SplitPaneView.tsx` — Current implementation
- `src/app/components/SplitPane/SplitPaneContainer.tsx` — Split pane
- Tailwind CSS responsive patterns in existing codebase

### UI Conventions
- Ant Design mobile patterns
- Tailwind CSS responsive prefixes (sm:, md:, lg:, xl:)

</canonical_refs>

<code_context>
## Existing Code Insights

### Phase 1-3 Delivered
- SplitPaneView with split pane on desktop
- Text mode and preview mode
- Scroll sync toggle
- Preview content switching

### What Phase 4 Adds
- Responsive breakpoint hiding split pane
- Mobile-only tab bar for source/translation switching
- Conditional rendering based on screen size

</code_context>

<deferred>
## v2 Requirements (Deferred)

- SBS-17: 焦点高亮
- SBS-18: 视图记忆
- SBS-19: 键盘快捷键
- SBS-20: 虚拟滚动

</deferred>

---

*Phase: 04-polish*
*Context gathered: 2026-03-29*
