# Stack Research

**Domain:** Side-by-side Markdown editor with split view and preview
**Researched:** 2026-03-28
**Confidence:** MEDIUM-HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **react-split** | ^1.2.0 | Split pane layout with resizable panels | 6.3k stars, zero deps, 1-2kb gzipped, pure CSS resizing, works with flex/float layouts. Active maintenance since 2014. Used by JSFiddle, Viz.js |
| **react-markdown** | ^10.1.0 | Markdown rendering | 15.6k stars, safe by default (no XSS), uses remark/unified pipeline, supports plugins, 100% CommonMark compliant, tree-shakeable |
| **remark-gfm** | ^4.0.0 | GitHub Flavored Markdown support | Adds tables, task lists, strikethrough, autolinks; essential for code-heavy docs |
| **react-syntax-highlighter** | ^15.0.0 | Code block syntax highlighting | Works with react-markdown via `components` prop, Prism engine, many themes |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **remark-math** | ^6.0.0 | LaTeX math rendering | For `$formula$` and `$$formula$$` support |
| **rehype-katex** | ^8.0.0 | KaTeX rendering for math | Pairs with remark-math for LaTeX |
| **rehype-sanitize** | ^7.0.0 | XSS sanitization | If allowing HTML in markdown, add sanitize layer |

### Sync Scrolling Implementation

| Approach | Quality | Implementation |
|----------|---------|----------------|
| **Percentage-based** | Basic | `scrollTop / scrollHeight * targetScrollHeight` — simple but drifts with content height differences |
| **Row-based index sync** | Precise | Assign `data-index` to rendered elements, calculate visible percentage, scroll target to matching element — achieves line-by-line sync |

**Recommendation:** Implement row-based index synchronization. See [DEV Community article](https://dev.to/woai3c/implementing-synchronous-scrolling-in-a-dual-pane-markdown-editor-5d75) for detailed implementation (Feb 2025).

## Installation

```bash
# Core split pane
npm install react-split

# Markdown rendering
npm install react-markdown remark-gfm remark-math rehype-katex

# Syntax highlighting
npm install react-syntax-highlighter

# Math support (if needed)
npm install katex
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| react-split | react-split-pane | react-split-pane has dependency issues with React 19; react-split is actively maintained |
| react-split | @glebcha/react-resplit | React-resplit specifically targets React 19 but is less battle-tested (38 stars) |
| react-markdown | markdown-it | markdown-it is parser-only (no React component); react-markdown provides React integration |
| react-markdown | marked | marked is faster but outputs HTML string (XSS risk); react-markdown builds virtual DOM safely |
| react-markdown | markdown-to-jsx | Lighter (3kb) but fewer plugin options; use for simple cases without GFM/math |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| react-split-pane | Dependency resolution issues with React 19, abandoned maintenance | react-split |
| dangerouslySetInnerHTML | XSS vulnerability with user markdown | react-markdown (safe by default) |
| react-markdown < v10 | Older versions have different API | react-markdown@10+ |

## Stack Patterns by Variant

**If you need LaTeX/math formulas:**
- Add remark-math + rehype-katex + katex
- Configure react-markdown with `remarkPlugins={[remarkMath]}` and `rehypePlugins={[rehypeKatex]}`

**If you need only basic markdown (no GFM):**
- react-markdown alone is sufficient
- Skip remark-gfm to reduce bundle size

**If you need maximum performance:**
- Consider remark (unified) directly instead of react-markdown
- Or use markdown-to-jsx for lighter bundle

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| react-split@1.x | React 18/19 | Works with React 19, check npm for latest |
| react-markdown@10 | React 18/19, Node 16+ | ESM only |
| remark-gfm@4 | remark 15+ | Check remark peer deps |
| react-syntax-highlighter@15 | React 18/19 | Uses Prism under hood |

**Project Stack Verification:**
- Next.js 16.1.1 ✓
- React 19.2.3 ✓
- Tailwind CSS 4 ✓
- Ant Design 6.1.3 ✓

All recommended packages support React 19 and are compatible with Next.js App Router.

## Sync Scrolling Pattern

### Row-based Index Synchronization (Recommended)

1. **Assign indices to markdown source lines:**
   - Split markdown into non-empty lines
   - Assign sequential index to each line

2. **Apply data-index to rendered elements:**
   - Walk the mdast/hast tree
   - Apply `data-index` to each block element

3. **Sync scroll on scroll event:**
```typescript
function syncScroll(source: HTMLElement, target: HTMLElement) {
  const sourceChildren = Array.from(source.children);
  const targetContainer = target;
  
  for (const node of sourceChildren) {
    if (isInScreen(node) && percentOfdomInScreen(node) > 0) {
      const index = node.getAttribute('data-index');
      const targetEl = targetContainer.querySelector(`[data-index="${index}"]`);
      if (targetEl) {
        const percent = percentOfdomInScreen(node);
        const heightToTop = getHeightToTop(targetEl);
        const hideHeight = targetEl.offsetHeight * (1 - percent);
        targetContainer.scrollTo({ top: heightToTop + hideHeight });
        break;
      }
    }
  }
}
```

### Key Edge Cases
- **Tables/lists:** Apply index to `tr`/`li` elements, not container
- **Nested elements:** Walk leaf nodes, not containers
- **Images:** Pre-render to get accurate heights

## Sources

- [nathancahill/split GitHub](https://github.com/nathancahill/split) — Context7 library ID: /nathancahill/split — HIGH confidence
- [remarkjs/react-markdown GitHub](https://github.com/remarkjs/react-markdown) — Context7 library ID: /remarkjs/react-markdown — HIGH confidence
- [Implementing Synchronous Scrolling](https://dev.to/woai3c/implementing-synchronous-scrolling-in-a-dual-pane-markdown-editor-5d75) — Feb 2025, DEV Community — MEDIUM confidence
- [marked vs remark vs markdown-it (2026)](https://www.pkgpulse.com/blog/marked-vs-remark-vs-markdown-it-parsers-2026) — March 2026 — MEDIUM confidence
- [Best Markdown Libraries 2026](https://www.pkgpulse.com/blog/best-markdown-parsing-libraries-2026) — March 2026 — MEDIUM confidence

---
*Stack research for: Side-by-side Markdown editor*
*Researched: 2026-03-28*
