# Roadmap: MD Translator — Side-by-Side Editor

**Created:** 2026-03-28
**Granularity:** coarse (3-5 phases)
**Coverage:** 16/16 v1 requirements

## Phases

- [ ] **Phase 1: Foundation** — 分屏容器 + 可调宽度
- [ ] **Phase 2: Panels + Preview** — 面板内容 + 预览切换
- [ ] **Phase 3: Scroll Sync** — 同步滚动算法
- [ ] **Phase 4: Polish** — 移动端适配 + 收尾

---

## Phase Details

### Phase 1: Foundation

**Goal:** 用户可以通过拖拽分隔线调整左右面板宽度，比例可持久化

**Depends on:** None (first phase)

**Requirements:** SBS-01, SBS-02, SBS-03

**Success Criteria** (what must be TRUE):
1. 用户可以看到左右分屏布局，左侧显示原文，右侧显示译文
2. 用户可以通过拖拽分隔线调整左右面板宽度
3. 面板比例在页面刷新后保持不变

**Plans:**
1/2 plans executed
- [ ] 01-02-PLAN.md — SplitPaneView + Tab 集成

---

### Phase 2: Panels + Preview

**Goal:** 左右面板显示正确的只读内容，右侧支持文本/预览模式切换

**Depends on:** Phase 1

**Requirements:** SBS-04, SBS-05, SBS-06, SBS-07, SBS-08, SBS-09, SBS-10

**Success Criteria** (what must be TRUE):
1. 左侧面板显示原始 Markdown 文本（只读，不可编辑）
2. 右侧面板显示翻译结果文本（只读，不可编辑）
3. 右侧面板可以切换：译文文本 ↔ 预览模式
4. 预览模式可以切换：预览原文 / 预览译文
5. 预览模式正确渲染 Markdown 格式（标题、列表、代码块、链接等）

**Plans:** TBD

---

### Phase 3: Scroll Sync

**Goal:** 左右面板同步滚动，算法处理复杂 Markdown 元素（代码块、LaTeX、表格等）

**Depends on:** Phase 2

**Requirements:** SBS-11, SBS-12, SBS-13, SBS-14, SBS-15

**Success Criteria** (what must be TRUE):
1. 滚动一个面板时，另一个面板同步滚动到对应位置
2. 滚动一个面板不会触发反向滚动死循环
3. 用户可以关闭/开启同步滚动功能
4. 代码块、LaTeX 等高度不同的元素正确同步
5. 表格、列表等嵌套元素正确同步

**Plans:** TBD

---

### Phase 4: Polish

**Goal:** 移动端响应式降级，核心功能完整可用

**Depends on:** Phase 3

**Requirements:** SBS-16

**Success Criteria** (what must be TRUE):
1. 移动端设备显示降级后的单面板切换模式
2. 翻译流程在移动端正常工作

**Plans:** TBD

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 1/2 | In Progress|  |
| 2. Panels + Preview | 0/5 | Not started | - |
| 3. Scroll Sync | 0/5 | Not started | - |
| 4. Polish | 0/2 | Not started | - |

---

*Last updated: 2026-03-28*
