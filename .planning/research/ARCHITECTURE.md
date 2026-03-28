# Architecture Research: Split-Pane Markdown Translation Editor

**Domain:** Side-by-side Markdown translation editor with synchronized scrolling
**Researched:** 2026-03-28
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           UI Layer (React Components)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────┐ │
│  │ MarkdownSource   │  │ TranslationResult│  │ PreviewToggle            │ │
│  │ Panel (Left)     │  │ Panel (Right)    │  │ Component                │ │
│  │ - Read-only      │  │ - Read-only      │  │ - Mode switch            │ │
│  │ - TextArea/Editor│  │ - TextArea/View  │  │                          │ │
│  └────────┬─────────┘  └────────┬─────────┘  └──────────────────────────┘ │
│           │                     │                                        │
├───────────┴─────────────────────┴──────────────────────────────────────────┤
│                        Scroll Sync Controller                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ - Scroll position state (source/target percentage or line index)       ││
│  │ - Sync direction flag (prevent feedback loops)                          ││
│  │ - Line-to-element mapping registry                                      ││
│  └─────────────────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────────────────┤
│                           State Layer                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ TranslationContext (existing)                                          │  │
│  │ - sourceText, translatedText                                           │  │
│  │ - translationInProgress                                                │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ SplitPaneContext (new)                                                 │  │
│  │ - scrollSyncEnabled                                                    │  │
│  │ - previewMode: 'translation' | 'source'                               │  │
│  │ - splitRatio: number                                                   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────────────┤
│                         Markdown Processing Layer                            │
│  ┌──────────────────────┐  ┌───────────────────────────────────────────┐  │
│  │ markdownUtils.ts     │  │ PreviewRenderer                           │  │
│  │ (existing)           │  │ - Renders markdown with data-index attrs  │  │
│  │ - filterMarkdownLines│  │ - Supports nested element handling        │  │
│  └──────────────────────┘  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|---------------|----------------------|
| `SplitPaneContainer` | Layout wrapper, ratio management, drag-to-resize | Flexbox + drag handler |
| `MarkdownSourcePanel` | Display source markdown (read-only input) | TextArea or CodeMirror |
| `TranslationResultPanel` | Display translation (read-only), switch to preview | Conditional rendering |
| `PreviewRenderer` | Render markdown as HTML with data-index attributes | react-markdown + rehype |
| `ScrollSyncController` | Manage scroll synchronization state | Custom hook (useScrollSync) |
| `PreviewToggle` | Toggle between translation text and preview mode | Switch component |
| `LineIndexMapper` | Map source lines to rendered elements for sync | Data attribute tracking |

## Recommended Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── ResultCard.tsx       # Existing, refactor for split use
│   │   └── ...
│   ├── [locale]/
│   │   ├── MDTranslator.tsx    # Main orchestrator (refactor target)
│   │   ├── markdownUtils.ts    # Existing markdown processing
│   │   └── ...
│   ├── hooks/
│   │   ├── translation/         # Existing hooks
│   │   └── useScrollSync.ts    # NEW: scroll synchronization hook
│   └── ui/
│       └── split-pane/          # NEW: split pane components
│           ├── SplitPaneContainer.tsx
│           ├── MarkdownSourcePanel.tsx
│           ├── TranslationResultPanel.tsx
│           ├── PreviewRenderer.tsx
│           ├── PreviewToggle.tsx
│           ├── ScrollSyncController.tsx
│           ├── LineIndexMapper.ts
│           └── index.ts
```

### Structure Rationale

- **`ui/split-pane/`:** Self-contained split pane feature module, easy to extract/reuse
- **`hooks/useScrollSync.ts`:** Core scroll sync logic extracted from UI, enabling testability
- **Refactor `MDTranslator.tsx`:** Current 673-line monolith → delegate to split-pane components

## Architectural Patterns

### Pattern 1: Scroll-Linked Synchronization

**What:** Two panels scroll in lockstep based on scroll position percentage or line index.

**When to use:** Default approach for translation editors where users need to compare source and target at the same position.

**Trade-offs:** 
- ✅ Simple percentage-based: Easy to implement, works when content heights are similar
- ⚠️ Percentage-based breaks down when rendered heights differ significantly (code blocks vs rendered output)
- ✅ Row-based index sync (recommended): Uses `data-index` attributes for precise alignment

**Example (percentage-based):**
```typescript
// Basic scroll sync pattern
const handleSourceScroll = (e: React.UIEvent<HTMLElement>) => {
  const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
  const percentage = scrollTop / (scrollHeight - clientHeight);
  
  if (!isScrolling) {
    setIsScrolling(true);
    targetRef.current?.scrollTo({
      top: percentage * (targetScrollHeight - targetClientHeight),
      behavior: 'auto'
    });
    setTimeout(() => setIsScrolling(false), 50);
  }
};
```

**Example (row-based index sync - recommended):**
```typescript
// From source panel scroll
const handleSourceScroll = (e: React.UIEvent<HTMLElement>) => {
  const sourceContainer = e.currentTarget;
  const nodes = Array.from(sourceContainer.querySelectorAll('[data-index]'));
  
  for (const node of nodes) {
    const rect = node.getBoundingClientRect();
    if (rect.top >= 0 && rect.top < window.innerHeight) {
      const index = node.dataset.index;
      const targetEl = targetContainer.querySelector(`[data-index="${index}"]`);
      if (targetEl) {
        const targetRect = targetEl.getBoundingClientRect();
        const offset = targetRect.top - rect.top;
        targetContainer.scrollTop += offset;
      }
      break;
    }
  }
};
```

### Pattern 2: Context-Based State Coordination

**What:** Use React Context to share scroll sync state between panels without prop drilling.

**When to use:** When split pane panels are siblings and need to share scroll state.

**Trade-offs:**
- ✅ Clean prop interface
- ✅ Easy to enable/disable sync globally
- ⚠️ Creates dependency between panels via context

**Example:**
```typescript
interface SplitPaneContextValue {
  scrollSyncEnabled: boolean;
  setScrollSyncEnabled: (enabled: boolean) => void;
  previewMode: 'translation' | 'source';
  setPreviewMode: (mode: 'translation' | 'source') => void;
  sourceRef: React.RefObject<HTMLElement>;
  targetRef: React.RefObject<HTMLElement>;
}

const SplitPaneContext = React.createContext<SplitPaneContextValue | null>(null);

const useSplitPane = () => {
  const context = useContext(SplitPaneContext);
  if (!context) throw new Error('useSplitPane must be used within SplitPaneProvider');
  return context;
};
```

### Pattern 3: Ref-Based DOM Access for Scroll Control

**What:** Use React refs to directly manipulate DOM scroll position on scroll containers.

**When to use:** When you need to programmatically scroll a panel based on another panel's scroll position.

**Trade-offs:**
- ✅ Direct DOM access, no re-renders
- ⚠️ Must prevent feedback loops (scrolling A causes B to scroll which causes A to scroll...)
- ⚠️ Not declarative

**Example:**
```typescript
const sourceRef = useRef<HTMLDivElement>(null);
const targetRef = useRef<HTMLDivElement>(null);
const [isScrolling, setIsScrolling] = useState(false);

// Use requestAnimationFrame for smooth scroll sync
const handleScroll = useCallback((source: 'source' | 'target') => {
  if (isScrolling) return;
  
  requestAnimationFrame(() => {
    setIsScrolling(true);
    // Calculate and apply scroll offset to other panel
    setIsScrolling(false);
  });
}, [isScrolling]);
```

### Pattern 4: Preview Mode Toggle (Display Swap)

**What:** Right panel conditionally renders either raw translation text or rendered markdown preview.

**When to use:** When you need to show both "raw output" and "formatted preview" in the same panel space.

**Trade-offs:**
- ✅ Saves screen space, no third panel needed
- ✅ User can inspect raw translation
- ⚠️ Requires state management for mode toggle

**Example:**
```typescript
const [previewMode, setPreviewMode] = useState<'text' | 'preview'>('text');

return (
  <TranslationResultPanel>
    {previewMode === 'text' ? (
      <TextArea value={translatedText} readOnly />
    ) : (
      <PreviewRenderer content={translatedText} data-index-sync />
    )}
    <PreviewToggle 
      mode={previewMode} 
      onChange={setPreviewMode}
    />
  </TranslationResultPanel>
);
```

## Data Flow

### Scroll Synchronization Flow

```
[User Scrolls Source Panel]
        ↓
[ScrollSyncController.handleSourceScroll]
        ↓
[Calculate visible element's data-index]
        ↓
[Query target panel for matching data-index]
        ↓
[Calculate scroll offset based on element positions]
        ↓
[Apply scroll to target panel]
        ↓
[Prevent feedback via isScrolling flag]
```

### State Management

```
┌─────────────────────────────────────────────────────────────────────┐
│                     TranslationContext (existing)                    │
│  sourceText ←─────────────── setSourceText                          │
│  translatedText ←────────── setTranslatedText                       │
│  translateInProgress ←────── setTranslateInProgress                  │
└─────────────────────────────────────────────────────────────────────┘
                              ↓ ↑
┌─────────────────────────────────────────────────────────────────────┐
│                     SplitPaneContext (new)                          │
│  scrollSyncEnabled ←────── setScrollSyncEnabled                     │
│  previewMode ←───────────── setPreviewMode                           │
│  splitRatio ←────────────── setSplitRatio (drag resize)             │
└─────────────────────────────────────────────────────────────────────┘
                              ↓ ↑
┌─────────────────────────────────────────────────────────────────────┐
│                        UI Components                                │
│  MarkdownSourcePanel ──── TranslationResultPanel                     │
│  (Left Panel)              (Right Panel)                             │
│  sourceRef ─────────────── targetRef                                 │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Data Flows

1. **Translation Flow (existing):** Source Text → Translation API → Translated Text → Display in ResultPanel
2. **Scroll Sync Flow (new):** Source Scroll Event → Calculate Index → Find Target Element → Sync Target Scroll Position

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Simple percentage-based scroll sync is sufficient |
| 1k-100k users | Implement row-based index sync for accuracy with complex markdown |
| 100k+ users | Virtualize long documents; only render visible content |

### Scaling Priorities

1. **First bottleneck: Large document performance**
   - Use virtualization (react-window) if documents exceed ~5000 lines
   - Row-based sync requires querying all elements; virtualization changes this
   
2. **Second bottleneck: Nested markdown elements (tables, lists)**
   - Apply `data-index` to content rows (tr, li) not containers (table, ul)
   - Already solved in reference implementation (dev.to article)

## Anti-Patterns

### Anti-Pattern 1: Bidirectional Scroll Feedback Loop

**What people do:** Scroll handlers on both panels that trigger each other without debouncing/throttling.

**Why it's wrong:** A scrolls B, B's scroll handler fires, B scrolls A, infinite loop or jittery behavior.

**Do this instead:** 
- Use `isScrolling` flag to prevent re-entrant scroll handling
- Use `requestAnimationFrame` to batch scroll operations
- Only scroll the "passive" panel, never the triggering panel

### Anti-Pattern 2: Percentage-Based Sync for Complex Markdown

**What people do:** Using `scrollTop / scrollHeight` percentage to sync scroll positions.

**Why it's wrong:** Markdown source and rendered preview have vastly different element heights (code block: 1 line → 20+ lines). Sync becomes progressively inaccurate.

**Do this instead:** 
- Implement row-based index synchronization with `data-index` attributes
- For simple markdown (mostly text), percentage sync is acceptable

### Anti-Pattern 3: Global Scroll Event Listeners

**What people do:** Attaching `window.addEventListener('scroll', ...)` for sync.

**Why it's wrong:** Triggers on ALL page scrolls, not just the editor panels. Causes performance issues and incorrect behavior.

**Do this instead:** 
- Attach scroll listeners directly to the scroll containers via `onScroll` prop
- Use refs for direct DOM access to scroll containers

### Anti-Pattern 4: Syncing Both Directions Simultaneously

**What people do:** Scroll A → Scroll B AND Scroll B → Scroll A at the same time.

**Why it's wrong:** Creates race conditions and unpredictable scroll positions.

**Do this instead:** 
- Always sync from "source of truth" panel to "target" panel
- User preference determines which is source (typically the left/primary panel)
- Target panel never initiates sync back

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|-------------------|-------|
| Translation APIs | Unchanged (existing) | All translation happens before split pane display |
| Markdown renderer | react-markdown + rehype | Used for preview mode rendering |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| MDTranslator ↔ SplitPane | Props drilling + Context | MDTranslator passes translation state; SplitPaneContext manages view state |
| SplitPane ↔ Panels | Context + Refs | SplitPaneContext for state, refs for DOM scroll control |
| Panels ↔ ScrollSync | Custom Hook | useScrollSync hook encapsulates sync logic |

## Build Order Recommendations

### Phase 1: Foundation - Split Pane Container
1. Create `SplitPaneContainer` with basic left/right layout
2. Add drag-to-resize functionality
3. Store split ratio in state/context

**Why:** Other components depend on having a container to render into.

### Phase 2: Panel Components
1. Extract/create `MarkdownSourcePanel` (left)
2. Create `TranslationResultPanel` (right)
3. Both initially static (no scroll sync)

**Why:** Panels are the visual output; get basic layout working first.

### Phase 3: Preview Mode Toggle
1. Add `PreviewToggle` component
2. Implement mode state in `TranslationResultPanel`
3. Create `PreviewRenderer` with basic markdown rendering

**Why:** Preview mode is a key requirement; add after basic panels work.

### Phase 4: Scroll Synchronization
1. Implement `useScrollSync` hook
2. Add `data-index` attributes to preview elements
3. Wire up scroll handlers

**Why:** Scroll sync is complex; add after basic layout is stable.

### Phase 5: Refinement
1. Performance optimization (requestAnimationFrame, throttling)
2. Edge case handling (tables, nested lists)
3. Mobile responsive behavior

**Why:** Polish phase after core functionality works.

---

## Sources

- [Implementing Synchronous Scrolling in a Dual-Pane Markdown Editor](https://dev.to/woai3c/implementing-synchronous-scrolling-in-a-dual-pane-markdown-editor-5d75) - **HIGH confidence** (2025-02-05, detailed implementation with code)
- [React Split Pane v3](https://reactlibs.dev/articles/split-panes-made-easy-with-react-split-pane) - **MEDIUM confidence** (2024-09-30, library overview)
- [Creating Resizable Split Panes from Scratch](https://blog.openreplay.com/resizable-split-panes-from-scratch) - **MEDIUM confidence** (2024-01-12)
- [Synchronise vertical/horizontal scrolling in split view - Stack Overflow](https://stackoverflow.com/questions/45325984/synchronise-vertical-horizontal-scrolling-in-split-view) - **MEDIUM confidence** (community patterns)
- Project codebase: MDTranslator.tsx (673 lines), ResultCard.tsx, markdownUtils.ts

---
*Architecture research for: Split-pane Markdown translation editor*
*Researched: 2026-03-28*
