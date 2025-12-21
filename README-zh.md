<h1 align="center">
⚡️ Markdown Translator
</h1>
<p align="center">
    <a href="./README.md">English</a> | 中文
</p>
<p align="center">
    <em>翻译 Markdown 不破坏格式 — 标题、代码、公式全保留</em>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <a href="https://tools.newzone.top/zh/md-translator"><img src="https://img.shields.io/badge/%E5%9C%A8%E7%BA%BF%E4%BD%93%E9%AA%8C-md--translator-blue" alt="在线体验"></a>
</p>

**MD Translator** 是一款智能翻译工具，专为解决 Markdown 翻译时格式错乱的痛点而设计。它不仅能在保留 Markdown 结构的同时实现**高质量翻译**，还支持**上下文关联翻译**和**纯文本翻译模式**，满足多样化需求。

👉 **在线体验**：<https://tools.newzone.top/zh/md-translator>

## 核心特性

- **原生 Markdown 支持**：保留标题、列表、代码块、链接、强调和 LaTeX 公式。
- **高性能缓存 (IndexedDB)**：翻译结果存储在 **IndexedDB** 中，**无容量限制**，突破浏览器存储瓶颈。
- **上下文关联翻译**（仅限 AI 模型）：带入前后文语境翻译，段落连贯性更佳。
- **纯文本模式**：跳过格式解析，直接翻译任意文本（TXT、HTML、日志等）。
- **多语言输出**：同一文件可同时翻译成 **50+ 种语言**。
- **文本提取**：将 Markdown 转换为纯文本，便于摘要、NLP 或搜索索引。

## 支持的 Markdown 元素

- FrontMatter 元数据（`---`）
- 标题（`#`）
- 引用块（`> 引用`）
- 链接（`[text](URL)`）
- 无序/有序列表
- 强调（`**加粗**`、`_斜体_`）
- 代码块（` ``` `）和内联代码
- 行内/块级 LaTeX 公式（`$公式$`、`$$公式$$`）

FrontMatter、代码块和 LaTeX 公式的翻译是**可选**且可配置的。

## 翻译接口

支持 **5 种翻译 API** 和 **9 种 AI 大模型**：

### 传统翻译 API

| API 类型             | 翻译质量 | 稳定性 | 免费额度                       |
| -------------------- | -------- | ------ | ------------------------------ |
| **DeepL(X)**         | ★★★★★    | ★★★★☆  | 每月 50 万字符                 |
| **Google Translate** | ★★★★☆    | ★★★★★  | 每月 50 万字符                 |
| **Azure Translate**  | ★★★★☆    | ★★★★★  | **前 12 个月** 每月 200 万字符 |
| **GTX API（免费）**  | ★★★☆☆    | ★★★☆☆  | 免费（有频率限制）             |
| **GTX Web（免费）**  | ★★★☆☆    | ★★☆☆☆  | 免费                           |

### AI 大模型

支持 **DeepSeek**、**OpenAI**、**Gemini**、**Azure OpenAI**、**Siliconflow**、**Groq**、**OpenRouter**、**Perplexity** 以及 **自定义 LLM**。

## 上下文关联翻译

_上下文关联翻译_（仅限 AI 模型）会将文档切分为片段，并附带前后文发送给大模型，显著提升段落连贯性和术语一致性。

两个关键参数：

- **并发行数**：同时翻译的最大行数（默认：20）。
- **上下文行数**：每批包含的上下文行数（默认：50）。

⚠️ **注意**：由于 Markdown 结构的复杂性，开启上下文模式可能增加格式错误的风险（如代码块未闭合、列表缩进错乱）。请仔细检查输出结果。

## 适用场景

- 多语言技术文档的批量翻译
- 开源项目文档的国际化
- Markdown 博客内容的中英双语同步
- 混合文档（代码、公式）的格式保留翻译
- 任意文本的语义翻译与提取

## 文档与部署

详细配置、API 设置和自托管说明，请参阅 **[官方文档](https://docs.newzone.top/guide/translation/md-translator/)**。

**快速部署**：[部署指南](https://docs.newzone.top/guide/translation/md-translator/deploy.html)

## 参与贡献

欢迎通过 Issue 或 Pull Request 参与贡献！

## 许可协议

MIT © 2025 [rockbenben](https://github.com/rockbenben)。详见 [LICENSE](./LICENSE)。
