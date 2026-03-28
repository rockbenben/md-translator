# Pitfalls Research

**Domain:** Split-pane Markdown editors with synchronized scrolling
**Researched:** 2026-03-28
**Confidence:** MEDIUM-HIGH

## Critical Pitfalls

### Pitfall 1: Bidirectional Scroll Infinite Loop

**What goes wrong:**
When both the source editor and preview panel listen to each other's scroll events, scrolling one panel triggers the other, which triggers the first again, creating an infinite loop that freezes the browser or causes erratic jerky scrolling.

**Why it happens:**
Scroll events fire rapidly (dozens of times per second). When panel A scrolls and updates panel B's scroll position, panel B's scroll event fires, and if that then updates panel A, you have a feedback loop.

**How to avoid:**
Use a `isScrolling` flag or `lastScrolledBy` identifier to prevent event propagation:

```typescript
// Option 1: Flag-based prevention
let isScrolling = false;
editorPane.addEventListener('scroll', () => {
  if (isScrolling) return;
  isScrolling = true;
  previewPane.scrollTop = calculateScrollPosition(editorPane);
  requestAnimationFrame(() => { isScrolling = false; });
});

// Option 2: Source tracking
let scrollSource: 'editor' | 'preview' | null = null;
function handleEditorScroll() {
  if (scrollSource === 'preview') return; // Ignore self-triggered
  scrollSource = 'editor';
  previewPane.scrollTop = calculateScrollPosition(editorPane);
  scrollSource = null;
}
```

**Warning signs:**
- Scroll feels "jerky" or "stuttery"
- Browser tab becomes unresponsive during scroll
- Console shows "Maximum call stack size exceeded"
- Scrolling one panel causes the other to "bounce" or oscillate

**Phase to address:**
**Phase 1 (Foundation)** — SBS-02 (sync scroll) implementation must include this prevention from day one

---

### Pitfall 2: Percentage-Based Scroll Desync

**What goes wrong:**
Using simple ratio calculations (`scrollTop / scrollHeight`) to sync scroll positions causes panels to drift apart over time, especially with content that renders differently (images, code blocks, LaTeX).

**Why it happens:**
Markdown source and rendered preview have vastly different heights for the same content. A 10-line code block might be 2 lines in source but 200px+ in preview. Percentage-based sync assumes 1:1 height mapping.

**How to avoid:**
Use **row-based index synchronization** instead:
1. Assign `data-index` attributes to each content block during markdown render
2. When scrolling, find the first visible element in source panel
3. Calculate its visible percentage and scroll preview to the matching indexed element

```typescript
function syncScroll(source: HTMLElement, target: HTMLElement) {
  const sourceNodes = Array.from(source.children);
  for (const node of sourceNodes) {
    if (isInViewport(node) && getVisiblePercent(node) > 0) {
      const index = node.dataset.index;
      const targetNode = target.querySelector(`[data-index="${index}"]`);
      if (targetNode) {
        const targetY = getDistanceToTop(targetNode);
        const hideHeight = targetNode.offsetHeight * (1 - getVisiblePercent(node));
        target.scrollTo({ top: targetY + hideHeight });
      }
      break;
    }
  }
}
```

**Warning signs:**
- Panels start synced but drift apart as user scrolls
- Scroll sync works for first heading but fails for later sections
- Large images or code blocks cause major misalignment
- Long documents show cumulative drift

**Phase to address:**
**Phase 2 (Scroll Sync Implementation)** — This is the core algorithm; requires dedicated research and testing

---

### Pitfall 3: Resize Triggers Full Re-render

**What goes wrong:**
Dragging the split pane divider causes visible lag, stutter, or white flash because panel resizing triggers React re-renders of all child components.

**Why it happens:**
Naive implementation stores panel sizes in React state. Every pixel of resize movement updates state → triggers re-render of entire panel tree → DOM updates block the resize feedback.

**How to avoid:**
Separate **layout state** from **React state**:
1. Use `useRef` or external store for panel sizes during drag
2. Apply size changes imperatively via direct DOM manipulation (`element.style.width`)
3. Only update React state on resize **end** (debounced)
4. Use CSS `resize` property or `will-change: transform` for GPU acceleration

```typescript
// During drag - imperative only
divider.addEventListener('mousemove', (e) => {
  const newWidth = calculateWidth(e.clientX);
  leftPanel.style.width = `${newWidth}px`; // Direct DOM, no state
});

// On resize end - update React state
divider.addEventListener('mouseup', () => {
  setPanelWidths(currentWidths); // Single state update
});
```

**Warning signs:**
- Visible lag when dragging divider
- White flash or blank panels during resize
- "Stutter" or "jank" on panel resize
- High CPU usage during drag operations

**Phase to address:**
**Phase 1 (Split Pane Foundation)** — Performance-critical; must be implemented correctly from start

---

### Pitfall 4: Monaco Editor Viewport Scroll Inaccuracy

**What goes wrong:**
Monaco editor's internal viewport management doesn't perfectly sync with external scroll containers, especially at small heights (under 100px) or when browser zoom is enabled.

**Why it happens:**
Monaco has its own scroll viewport calculation that assumes minimum viewport height for cursor visibility. When constrained to small heights, it can't properly center the cursor.

**How to avoid:**
1. Set minimum height for Monaco container (at least 6-8 line heights)
2. Use Monaco's built-in `editor.onDidScrollChange()` instead of native scroll events
3. Avoid syncing when source of scroll is Monaco's own cursor movement (not user drag)
4. Consider using `revealLineInCenter()` for programmatic scrolling

```typescript
// In handleEditorDidMount
editor.onDidScrollChange((scrollData: monaco.IScrollData) => {
  // Only sync if user scrolled, not cursor moved
  if (scrollData.scrollTopChanged) {
    syncPreviewToEditor(editor);
  }
});
```

**Warning signs:**
- Cursor visible but viewport doesn't update
- Viewport "jumps" when navigating with keyboard
- At high browser zoom (400%), sync breaks
- Editor scrolls past last visible line unexpectedly

**Phase to address:**
**Phase 2 (Editor Integration)** — Requires Monaco-specific handling; test with real editor at various zoom levels

---

### Pitfall 5: Markdown XSS Vulnerability

**What goes wrong:**
User-supplied Markdown content renders malicious scripts, allowing XSS attacks. This is especially severe for translation tools where content is stored and re-displayed.

**Why it happens:**
Markdown parsers often allow raw HTML. Attackers embed `<script>` tags or event handlers (`onerror`, `onclick`) in markdown that execute when preview renders.

**How to avoid:**
**Defense in depth — multiple layers required:**

1. **Configure parser to disable raw HTML:**
   ```typescript
   // markdown-it example
   md.validateLink = (url) => {
     return /^https?:\/\//.test(url); // Only allow http/https
   };
   ```

2. **Always sanitize output with DOMPurify:**
   ```typescript
   import DOMPurify from 'dompurify';
   const cleanHTML = DOMPurify.sanitize(renderedMarkdown, {
     ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'code', 'pre', 'a', 'img'],
     ALLOWED_ATTR: ['href', 'src', 'alt', 'class'],
     FORBID_TAGS: ['script', 'iframe', 'object', 'embed'],
   });
   ```

3. **Set Content Security Policy header:**
   ```
   Content-Security-Policy: default-src 'self'; script-src 'none'; object-src 'none';
   ```

**Warning signs:**
- Any `<script>` tags in rendered output
- `javascript:` URLs in links
- `onerror` or other event handlers in HTML attributes
- `data:` URIs in images or links

**Phase to address:**
**Phase 1 (Security Foundation)** — Non-negotiable; must be implemented before any preview functionality

---

### Pitfall 6: Nested Element Index Collision

**What goes wrong:**
Tables, lists, and other nested Markdown elements render with nested DOM structure, causing scroll sync to misalign. The `data-index` applied to outer container doesn't correspond to inner content position.

**Why it happens:**
Markdown renders tables as `<table><tbody><tr>...` and lists as `<ul><li>...`. If you apply `data-index` to the outer `<table>` element, scrolling to "50% visible" scrolls the entire table, not the current row.

**How to avoid:**
Apply `data-index` to **content elements** not containers:
```typescript
// For tables, apply to <tr>, not <table>
const tableRows = table.querySelectorAll('tr');
tableRows.forEach((row, idx) => {
  row.dataset.index = `row-${idx}`;
});

// For lists, apply to <li>, not <ul>/<ol>
const listItems = list.querySelectorAll('li');
listItems.forEach((item, idx) => {
  item.dataset.index = `li-${idx}`;
});
```

**Warning signs:**
- Scrolling through a table "jumps" the preview to end of table instead of tracking row-by-row
- Lists show same synchronization issue
- First item of table/list in preview doesn't match source scroll position

**Phase to address:**
**Phase 2 (Scroll Sync Algorithm)** — Requires handling special cases for tables, lists, and other nested structures

---

### Pitfall 7: LaTeX/Code Block Height Mismatch

**What goes wrong:**
LaTeX formulas and code blocks have dramatically different heights in source vs preview, breaking index-based scroll sync for these elements.

**Why it happens:**
- LaTeX: Single `$equation$` becomes full-height rendered math
- Code blocks: ` ```lang ` line becomes syntax-highlighted block 20+ lines tall
- Images: Inline `![](url)` becomes full-size image

**How to avoid:**
1. **Segment content into scroll-sync blocks that exclude problematic elements:**
   ```typescript
   // Only assign indices to "anchor" elements that have reliable 1:1 mapping
   const ANCHOR_ELEMENTS = ['p', 'h1', 'h2', 'h3', 'h4', 'blockquote'];
   ```

2. **For blocks containing LaTeX/code, estimate height ratio:**
   ```typescript
   function estimateRenderHeight(sourceBlock: HTMLElement): number {
     const sourceHeight = sourceBlock.offsetHeight;
     if (sourceBlock.querySelector('.math-block')) {
       return sourceHeight * 3; // LaTeX typically renders 2-4x taller
     }
     if (sourceBlock.querySelector('pre')) {
       return sourceHeight * 5; // Code blocks expand significantly
     }
     return sourceHeight;
   }
   ```

**Warning signs:**
- Scroll sync works for paragraphs but breaks near code blocks
- LaTeX sections seem to "scroll too fast" or "too slow" in preview
- Large gaps appear where code/math blocks are in source

**Phase to address:**
**Phase 2 (Scroll Sync Algorithm)** — Height estimation can be Phase 2 refinement; basic block segmentation in Phase 1

---

### Pitfall 8: React State Cascade in Scroll Handlers

**What goes wrong:**
Scroll event handlers trigger React state updates, causing expensive re-renders on every scroll tick and making the UI unresponsive.

**Why it happens:**
Scroll events fire 60+ times per second. Even simple state updates (`setScrollPos(scrollTop)`) trigger React's reconciliation, which becomes a bottleneck.

**How to avoid:**
1. **Never update React state during scroll** — use refs for tracking
2. **Use `requestAnimationFrame` batching:**
   ```typescript
   let rafId: number | null = null;
   function handleScroll() {
     if (rafId) cancelAnimationFrame(rafId);
     rafId = requestAnimationFrame(() => {
       // Only update DOM, not state
       updatePreviewScroll(currentScrollPos);
     });
   }
   ```
3. **Debounce/throttle scroll position updates to preview:**
   ```typescript
   import { throttle } from 'lodash';
   const syncPreview = throttle((scrollPos: number) => {
     previewPane.scrollTop = scrollPos;
   }, 16); // ~60fps
   ```

**Warning signs:**
- UI becomes "janky" during scrolling
- High CPU usage when scrolling
- Typing becomes slow during simultaneous scroll
- Browser fan runs high during scroll sessions

**Phase to address:**
**Phase 1 (Performance Foundation)** — Critical for 60fps requirement; use refs not state during scroll

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Percentage-based scroll sync | Simple implementation | Breaks with complex markdown (images, code) | Never for production |
| State-based panel sizes during drag | Simple code | 60fps lag on resize | Never |
| Skip DOMPurify sanitization | Faster initial render | XSS vulnerability | Never |
| Single `scroll` event listener (no flag) | Simpler code | Infinite loop risk | Never |
| CSS-only split pane (no JS resize) | No reflow issues | Limited control, no min-size | Only for static layouts |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| **Monaco Editor** | Using native scroll events | Use `editor.onDidScrollChange()` |
| **Monaco React** | Calling `editor.getDomNode().scrollTop` | Use `editor.getScrollTop()` |
| **react-resizable-panels** | Storing sizes in React state | Imperative DOM updates during drag |
| **DOMPurify** | Sanitizing before Markdown parse | Parse → Sanitize → Render |
| **Tailwind CSS 4** | Using arbitrary values for panel sizes | Use CSS custom properties |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Scroll handler without RAF | Janky scroll, high CPU | Wrap in `requestAnimationFrame` | Always during scroll |
| Large DOM in both panels | Memory bloat | Virtualize content if >1000 lines | Documents >5000 words |
| Re-render on scroll position | UI freeze | Use refs, not state, for scroll pos | Every scroll event |
| Unoptimized Markdown render | Preview "stutters" | Memoize parsed markdown | Any content >100 lines |
| Resize listener without debounce | Excess re-renders | Debounce resize handler 150ms | Every resize operation |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Allowing raw HTML in Markdown | Stored XSS | Disable HTML in parser or use DOMPurify |
| Not validating `href` attributes | Phishing via `javascript:` links | Whitelist URL schemes |
| Allowing `data:` URIs in images | Data exfiltration, XSS | Reject `data:` scheme |
| Not sanitizing before render | Parser exploits | Parse → Sanitize → Render order |
| Missing CSP header | Residual XSS risk | Add strict CSP as defense-in-depth |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Scroll sync only one direction | Confusing when preview scrolls source | Bidirectional sync with flag prevention |
| No visual indicator of current position | User loses place | Highlight current section in both panels |
| Abrupt scroll jumps | Disorienting | Smooth scroll with easing |
| Mobile fallback to single panel without notice | User confusion | Clear toggle/indicator for split mode |
| Preview mode has different scroll sync behavior | Inconsistent feel | Maintain same sync algorithm in preview mode |

---

## "Looks Done But Isn't" Checklist

- [ ] **Scroll Sync:** Verify sync works with 20+ page document, not just 10 lines
- [ ] **Scroll Sync:** Test with images, LaTeX, code blocks interspersed throughout
- [ ] **Scroll Sync:** Verify at browser zoom 100%, 200%, 400%
- [ ] **Scroll Sync:** Test touchpad/mouse scroll on both panels
- [ ] **Resize:** Verify 60fps during rapid divider drag (not just slow drag)
- [ ] **Security:** Verify XSS payloads (`<script>`, `onerror`, `javascript:`) are sanitized
- [ ] **Performance:** Profile scroll performance with 5000+ line document
- [ ] **Mobile:** Verify responsive layout works, fallback is clear

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Infinite scroll loop | LOW | Add `isScrolling` flag; refresh page to recover |
| Scroll desync | MEDIUM | Reset scroll position; recalculate indices |
| Resize jank | LOW | Refactor to imperative DOM updates |
| XSS exploit | CRITICAL | Sanitize all stored content; audit access logs |
| Monaco viewport issue | MEDIUM | Set minimum height; update Monaco version |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Infinite scroll loop | Phase 1: Foundation | Manual scroll test on both panels |
| Percentage-based desync | Phase 2: Algorithm | Test with code blocks and images |
| Resize re-render | Phase 1: Foundation | Drag divider rapidly, verify 60fps |
| Monaco viewport | Phase 2: Editor Integration | Test at various browser zoom levels |
| XSS vulnerability | Phase 1: Security | Run DOMPurify with test payloads |
| Nested element collision | Phase 2: Algorithm | Test with tables and nested lists |
| LaTeX height mismatch | Phase 2: Refinement | Scroll through document with math |
| React state cascade | Phase 1: Foundation | Profiler during scroll, verify no re-renders |
| Bidirectional sync flag | Phase 1: Foundation | Scroll preview, verify editor doesn't jump |

---

## Sources

- [DEV Community: Implementing Synchronous Scrolling in Dual-Pane Markdown Editor](https://dev.to/woai3c/implementing-synchronous-scrolling-in-a-dual-pane-markdown-editor-5d75) — **HIGH confidence** (detailed technical implementation with code examples)
- [GitHub: panwriter#95 - Scroll sync issues](https://github.com/mb21/panwriter/issues/95) — **HIGH confidence** (real-world bug report)
- [GitHub: monaco-react#604 - Sync scroll implementation](https://github.com/suren-atoyan/monaco-react/issues/604) — **HIGH confidence** (Monaco-specific scroll handling)
- [GitHub: Monaco Editor#4629 - Viewport scroll inaccuracy](https://github.com/microsoft/monaco-editor/issues/4629) — **HIGH confidence** (Monaco team issue)
- [GitHub: react-resizable-panels#29 - Re-render during resize](https://github.com/bvaughn/react-resizable-panels/issues/29) — **HIGH confidence** (performance issue)
- [Toflio: Markdown Security Considerations](https://www.toflio.com/blog/markdown-security-considerations-sanitization-xss) — **MEDIUM confidence** (security best practices)
- [GitHub: markdown-preview#984 - Rendering optimization](https://github.com/pulsar-edit/pulsar/pull/984) — **MEDIUM confidence** (rendering edge cases)

---
*Pitfalls research for: Side-by-side Markdown editor with sync scroll*
*Researched: 2026-03-28*
