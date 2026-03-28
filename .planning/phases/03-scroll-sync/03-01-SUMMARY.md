---
phase: 03-scroll-sync
plan: '01'
subsystem: ui
tags: [react, scroll-sync, split-pane, hooks, data-index, raf]

# Dependency graph
requires: []
provides:
  - useScrollSync hook for bidirectional scroll synchronization
  - data-index attribute infrastructure on markdown elements
affects:
  - 03-scroll-sync (phase 3 scroll sync features)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - useRef for DOM refs (not state) to avoid re-renders
    - RAF batching for 60fps scroll performance
    - isScrolling flag to prevent infinite bidirectional loops
    - data-index attribute for row-level scroll matching

key-files:
  created:
    - src/app/components/SplitPane/useScrollSync.ts
  modified:
    - src/app/components/SplitPane/MarkdownPreview.tsx

key-decisions:
  - "Bidirectional sync via isScrolling flag"
  - "RAF batching prevents jank during rapid scrolling"
  - "data-index uses counter-based indexing (h-N, p-N, li-N, tr-N, pre-N)"
  - "Refs for DOM manipulation avoid React re-renders"

patterns-established:
  - "Row-based index sync via data-index attribute matching"
  - "Infinite loop prevention via isScrolling flag"

requirements-completed: [SBS-11, SBS-12, SBS-14]

# Metrics
duration: 15min
completed: 2026-03-28
---

# Phase 03: Scroll Sync - Plan 01 Summary

**Bidirectional scroll sync hook with data-index infrastructure for row-level alignment**

## Performance

- **Duration:** 15 min
- **Started:** 2026-03-28T15:40:00Z
- **Completed:** 2026-03-28T15:55:52Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created useScrollSync hook with bidirectional sync, RAF batching, and infinite loop prevention
- Added data-index attributes to MarkdownPreview elements (h1-h6, p, li, tr, pre)
- Hook exposes leftScrollRef and rightScrollRef for attaching to scroll containers

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useScrollSync hook** - `a103bfc` (feat)
2. **Task 2: Add data-index to MarkdownPreview** - `bfcf7e0` (feat)

## Files Created/Modified
- `src/app/components/SplitPane/useScrollSync.ts` - Bidirectional scroll sync hook with isScrolling flag, RAF batching, data-index matching
- `src/app/components/SplitPane/MarkdownPreview.tsx` - Added data-index to h1-h6, p, li, tr, pre elements

## Decisions Made
- Used isScrolling flag to prevent infinite feedback loops between panels
- RAF batching ensures smooth 60fps during rapid scroll events
- Counter-based data-index (type-N format) for position alignment between source and translation
- useRef for DOM manipulation to avoid React re-renders during scroll

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- ESLint error: Cannot update ref during render (React.useMemo for counter reset)
  - Fix: Changed to useEffect for resetting counters on content change

## Next Phase Readiness
- useScrollSync hook ready for integration with SplitPaneView
- data-index infrastructure in place for scroll sync to work
- Need to wire scroll container refs and integrate with SplitPaneView

---
*Phase: 03-scroll-sync*
*Completed: 2026-03-28*
