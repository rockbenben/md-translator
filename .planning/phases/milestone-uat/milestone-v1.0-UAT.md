---
status: testing
phase: milestone-v1.0
source: [01-01-SUMMARY.md, 01-02-SUMMARY.md, 02-01-SUMMARY.md, 02-02-SUMMARY.md, 03-01-SUMMARY.md, 03-02-SUMMARY.md, 04-01-SUMMARY.md]
started: 2026-03-29T00:30:00Z
updated: 2026-03-29T00:46:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Split Pane Tab Navigation
expected: Navigate to "分屏预览" tab. The tab should be visible and clickable among other tabs. The split pane view should display with left panel (source) and right panel (translation).
result: pass

### 2. Left Panel Source Input
expected: Left panel shows a TextArea where user can type or paste source text. Placeholder should say "pasteUploadContent" or similar.
result: pass

### 3. Right Panel Translation Display
expected: Right panel shows a read-only TextArea displaying translation results. User cannot edit directly.
result: pass

### 4. Drag to Adjust Split Ratio
expected: Dragging the divider between panels adjusts the split ratio. Default is 50:50.
result: issue
reported: "无法拖动调节分屏比例"
severity: major

### 5. Split Ratio Persistence
expected: After dragging to a new ratio and refreshing the page, the split ratio should remain at the adjusted position.
result: issue
reported: "无法拖动调节分屏比例"
severity: major

### 6. Translate Button
expected: Clicking the translate button (with text entered in left panel) triggers translation and shows result in right panel.
result: pass

### 7. Preview Mode Toggle
expected: Clicking the preview toggle button switches both panels from TextArea to rendered Markdown preview.
result: pass

### 8. Markdown Rendering in Preview
expected: In preview mode, Markdown is rendered correctly including headings, bold, italic, lists, code blocks, and links.
result: pass

### 9. Code Syntax Highlighting
expected: Code blocks in preview mode show syntax highlighting with oneDark theme.
result: pass

### 10. LaTeX Math Rendering
expected: LaTeX formulas ($x$ inline and $$x$$ block) are rendered correctly in preview mode.
result: pass

### 11. Scroll Sync Toggle
expected: Clicking the "同步滚动" button enables/disables scroll synchronization between panels. Button appears highlighted when enabled.
result: pass

### 12. Scroll Sync Bidirectional
expected: When scroll sync is enabled, scrolling either panel causes the other panel to scroll in sync.
result: pass

### 13. Mobile Responsive - Bottom Tabs
expected: On mobile (<768px), the split pane is replaced with a single panel and bottom tab buttons ("原文" / "译文") for switching.
result: issue
reported: "在手机移动端，翻译后预览渲染，点击下方切换到翻译结果，但渲染的还是原文，而不是译文"
severity: major

### 14. Mobile Preview Mode
expected: Preview mode and text mode work correctly on mobile, with the same toggle button.
result: issue
reported: "在手机移动端，翻译后预览渲染，点击下方切换到翻译结果，但渲染的还是原文，而不是译文"
severity: major

### 15. Mobile Translation
expected: Translation button is accessible and functional on mobile devices.
result: pass

## Summary

total: 15
passed: 11
issues: 4
pending: 0
skipped: 0

## Gaps

- truth: "Dragging the divider between panels adjusts the split ratio. Default is 50:50."
  status: failed
  reason: "User reported: 无法拖动调节分屏比例"
  severity: major
  test: 4
  artifacts: []
  missing: []
- truth: "After dragging to a new ratio and refreshing the page, the split ratio should remain at the adjusted position."
  status: failed
  reason: "User reported: 无法拖动调节分屏比例"
  severity: major
  test: 5
  artifacts: []
  missing: []
- truth: "On mobile (<768px), the split pane is replaced with a single panel and bottom tab buttons (\"原文\" / \"译文\") for switching."
  status: failed
  reason: "User reported: 在手机移动端，翻译后预览渲染，点击下方切换到翻译结果，但渲染的还是原文，而不是译文"
  severity: major
  test: 13
  artifacts: []
  missing: []
- truth: "Preview mode and text mode work correctly on mobile, with the same toggle button."
  status: failed
  reason: "User reported: 在手机移动端，翻译后预览渲染，点击下方切换到翻译结果，但渲染的还是原文，而不是译文"
  severity: major
  test: 14
  artifacts: []
  missing: []
