# Feature Research: Side-by-Side Markdown Translation Editor

**Domain:** Markdown Translation Editor with Split View
**Researched:** 2026-03-28
**Confidence:** MEDIUM

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **左右分屏布局** | 核心需求：同时查看原文和译文 | LOW | 左：原文编辑，右：译文展示 |
| **同步滚动** | 翻译时保持位置对照是核心体验 | MEDIUM | 实现方式有三种：百分比法、元素匹配法、索引法 |
| **预览模式切换** | 右侧译文面板可切换：纯文本 ↔ 渲染预览 | MEDIUM | 需在两种视图间平滑切换 |
| **原文只读/可编辑** | 明确区分编辑与展示区域 | LOW | 右侧固定为只读显示 |
| **面板宽度可调** | 适应不同屏幕和内容需求 | LOW | 拖拽分隔线调整宽度 |
| **滚动条同步** | 视觉上确认两侧位置对应 | LOW | 滚动条位置反映同步状态 |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **精确同步滚动** | 准确保留原文/译文的行级对应关系 | HIGH | 需用索引法实现：data-index 标记 + getBoundingClientRect 计算 |
| **预览模式切换面板内容** | 同一面板可预览原文或译文渲染结果 | MEDIUM | SBS-05 要求：预览可切换原文/译文 |
| **焦点行高亮** | 当前编辑/查看位置高亮，方便定位 | LOW | 增强视觉对照体验 |
| **Markdown 格式保留** | 代码块、LaTeX、FrontMatter 等特殊格式正确渲染 | MEDIUM | 现有功能复用 |
| **记忆上次视图模式** | 用户偏好持久化（预览开/关、宽度比例） | LOW | localStorage 存储 |
| **平滑滚动动画** | 60fps 流畅同步，非生硬跳帧 | MEDIUM | requestAnimationFrame 节流 |
| **移动端降级模式** | 移动设备切换为切换式单屏而非分屏 | MEDIUM | 响应式断点处理 |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **实时双向同步编辑** | 觉得"双向"更灵活 | 与翻译服务状态不一致，复杂度爆炸 | 保持译文只读，单向流程清晰 |
| **固定 1:1 宽度比例** | 强迫症喜欢完美对半 | 不同内容宽度差异大，体验差 | 允许拖拽自由调整 |
| **三分屏（编辑+原文预览+译文预览）** | 想要同时看所有内容 | 屏幕空间碎片化，信息密度低 | 切换式预览模式（按需查看渲染） |
| **自动句子对齐** | 理想化的"智能对齐" | Markdown 结构不规则，对齐算法复杂且不准 | 依赖同步滚动手动对照 |
| **实时翻译边写边翻** | 追求效率 | 破坏翻译准确性，API 消耗大 | 手动触发翻译 |

## Feature Dependencies

```
[SBS-01 左右分屏布局]
    └──requires──> [基础面板组件]
    └──requires──> [Tailwind CSS 布局]

[SBS-02 同步滚动]
    └──requires──> [SBS-01 分屏布局]
    └──requires──> [滚动位置计算算法]
    └──enhanced by──> [SBS-03 预览模式切换]

[SBS-03 预览模式切换]
    └──requires──> [Markdown 渲染器]
    └──requires──> [面板内容状态管理]

[SBS-05 预览可切换原文/译文]
    └──requires──> [SBS-03 预览模式]
    └──requires──> [双面板渲染状态]

[精确同步滚动（differentiator）]
    └──requires──> [data-index 标记系统]
    └──requires──> [getBoundingClientRect 计算]
    └──requires──> [isInScreen 判断]
    └──conflicts──> [嵌套元素（table、list）特殊处理需求]
```

### Dependency Notes

- **同步滚动需要分屏布局：** 组件结构先行
- **预览模式依赖 Markdown 渲染器：** 现有 markdown-it 或同类库
- **精确同步滚动增强基础同步：** 索引法比百分比法更准确但实现成本高
- **嵌套元素需要特殊处理：** table/tr、ul/li 等嵌套结构标记需打在真实内容层

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [ ] **左右分屏布局** — 核心 UI 结构，左原文右译文
- [ ] **基础同步滚动** — 百分比法实现，够用即可
- [ ] **译文面板只读** — 明确显示属性
- [ ] **预览模式切换** — 按钮切换纯文本/渲染预览

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] **精确同步滚动** — 索引法替换百分比法，提升对照精度
- [ ] **面板宽度拖拽调整** — 用户可自定义比例
- [ ] **焦点行高亮** — 增强视觉反馈
- [ ] **视图模式记忆** — localStorage 持久化用户偏好

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **移动端降级模式** — 响应式适配
- [ ] **平滑滚动动画** — requestAnimationFrame 优化
- [ ] **双面板预览切换（SBS-05）** — 预览原文或译文

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| 左右分屏布局 | HIGH | LOW | P1 |
| 同步滚动（基础） | HIGH | MEDIUM | P1 |
| 译文只读 | HIGH | LOW | P1 |
| 预览模式切换 | HIGH | MEDIUM | P1 |
| 精确同步滚动 | MEDIUM | HIGH | P2 |
| 面板宽度可调 | MEDIUM | LOW | P2 |
| 焦点行高亮 | MEDIUM | LOW | P2 |
| 视图记忆 | LOW | LOW | P3 |
| 移动端降级 | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | VS Code Markdown Editor | Typora | 马克飞象 | Our Approach |
|---------|------------------------|--------|----------|--------------|
| 分屏布局 | 侧边预览，非左右分屏 | 所见即所得，无分屏 | 侧边预览 | 左右分屏 ✅ |
| 同步滚动 | ✅ 基础百分比法 | N/A | N/A | 基础版 P1，精确版 P2 |
| 预览模式切换 | 单一预览 | N/A | 固定预览 | 按钮切换 ✅ |
| 宽度可调 | 固定宽度 | N/A | 固定宽度 | 拖拽调整 P2 |
| 翻译对照 | 无 | 无 | 无 | 核心差异点 ✅ |

### Key Competitor Insights

1. **VS Code Markdown Editor**：有同步滚动，使用百分比法实现，有基础版本
2. **Typora**：所见即所得，无分屏需求，不适合翻译场景
3. **马克飞象**：专为印象笔记，固定预览模式
4. **行业实现方案**：GitHub 上有 markdown-editor-sync-scroll-demo，提供了三种实现方案参考

## Synchronized Scrolling Implementation Options

### 方案一：百分比法（基础）
```
scrollPercent = scrollTop / (scrollHeight - clientHeight)
targetScrollTop = scrollPercent * targetScrollHeight
```
- **复杂度：** LOW
- **精度：** 差（内容高度差异大时偏差数百像素）
- **适用场景：** MVP 快速实现

### 方案二：同时渲染占用大面积元素
- **复杂度：** MEDIUM
- **精度：** 中等（图片问题解决，小元素累积误差）
- **问题：** 仍无法解决 h1/h2 等小高度差异累积

### 方案三：索引法（精确）
1. 监听编辑框变化，为每个元素标记 `data-index`
2. 渲染侧同样标记对应 `data-index`
3. 滚动时遍历找到屏幕内第一个元素
4. 用 `getBoundingClientRect` 计算精确位置
5. 处理嵌套元素（table→tr，ul→li）
- **复杂度：** HIGH
- **精度：** 高（行级同步）
- **适用场景：** v1.x 提升

## Sources

- [markdown-editor-sync-scroll-demo](https://github.com/woai3c/markdown-editor-sync-scroll-demo) - 同步滚动实现方案
- [segmentfault: markdown 双屏同步滚动](https://segmentfault.com/a/1190000042290360) - 三种方案详解
- [vscode-markdown-editor](https://gitee.com/zhaaack_young/vscode-markdown-editor) - 分屏模式参考
- [Typora 评测](https://zhuanlan.zhihu.com/p/103348449) - Markdown 编辑器对比
- [CAT工具：MemoQ](https://zhuanlan.zhihu.com/p/338943776) - 翻译记忆、对齐等概念参考

---

*Feature research for: MD Translator Side-by-Side Editor*
*Researched: 2026-03-28*
