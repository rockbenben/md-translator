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

**MD Translator** 专为解决 Markdown 翻译时格式错乱的痛点而生。在高质量翻译的同时完整保留所有 Markdown 结构 —— 代码块、LaTeX 公式、FrontMatter 元数据、链接、强调统统不变。接入 7 种传统翻译 API（DeepL、Google、Azure、DeepLX、Qwen-MT、TranslateGemma、GTX）和 17+ 种 LLM，支持同时翻译为 50+ 种语言。

👉 **在线体验**：<https://tools.newzone.top/zh/md-translator>

## 核心特性

- **格式保留**：把 FrontMatter、代码块、LaTeX、链接、标题、列表、引用先 tokenize 成占位符，翻译完无损还原。
- **原生 Markdown 支持**：只翻译散文层；标题、列表、代码块、链接、强调和 LaTeX 全部 byte-perfect。
- **纯文本模式**：跳过格式解析，直接翻译 TXT / HTML / 日志等任意文本，避免分词器过度保护。
- **无上限缓存**（IndexedDB）：所有翻译结果本地缓存，无浏览器存储容量限制。
- **上下文关联翻译**（仅 LLM）：每批携带前后段落作为上下文，提升段落连贯性和术语一致性。
- **多语言输出**：一次翻译为 50+ 种语言，每个语言独立导出。
- **文本提取**：剥离 Markdown 语法，得到纯净的文本，便于摘要、NLP 或搜索索引。
- **多语言界面**：基于 next-intl，支持 18 种界面语言。

## 支持的 Markdown 元素

| 元素                | 语法                       | 保护    |
| ------------------- | -------------------------- | ------- |
| FrontMatter 元数据  | `---` 块                   | 可选    |
| 标题                | `#` … `######`             | ✅      |
| 列表                | `-` / `*` / `1.`           | ✅      |
| 引用块              | `> 引用`                   | ✅      |
| 链接                | `[text](url)`              | ✅      |
| 强调                | `**加粗**`、`_斜体_`       | 内联    |
| 代码块              | ` ``` ` 和 `` ` ``         | 可选    |
| 行内 / 块级 LaTeX   | `$公式$`、`$$公式$$`       | 可选    |
| 行内 HTML           | `<span>`、`<br/>`          | ✅      |

FrontMatter、代码块、LaTeX 公式都可独立开关 —— 是否翻译完全由用户控制。

## 翻译接口

支持 **7 种传统翻译 API** 和 **17+ 种 LLM 服务**：

### 传统翻译 API

| API 类型             | 翻译质量 | 稳定性 | 免费额度                        |
| -------------------- | -------- | ------ | ------------------------------- |
| **DeepL**            | ★★★★★    | ★★★★☆  | 每月 50 万字符                  |
| **Google Translate** | ★★★★☆    | ★★★★★  | 每月 50 万字符                  |
| **Azure Translate**  | ★★★★☆    | ★★★★★  | **前 12 个月** 每月 200 万字符  |
| **DeepLX（免费）**   | ★★★★☆    | ★★★☆☆  | 自部署或公共免费节点            |
| **Qwen-MT**          | ★★★★☆    | ★★★★☆  | 阿里云百炼（DashScope）配额     |
| **TranslateGemma**   | ★★★★☆    | ★★★★☆  | 自部署（LM Studio / Ollama 等） |
| **GTX API（免费）**  | ★★★☆☆    | ★★★☆☆  | 免费（有频率限制）              |

### AI 大模型

支持 **DeepSeek**、**OpenAI**、**Claude**、**Gemini**、**Qwen**、**Moonshot**、**Doubao**、**Zhipu GLM**、**MiniMax**、**Mistral**、**Perplexity**、**Cohere**、**OpenRouter**、**Groq**、**SiliconFlow**、**Nvidia NIM**、**Azure OpenAI**，以及任意 **Custom (OpenAI-compatible)** 端点（Ollama / LM Studio / vLLM / Together AI / Fireworks AI 等）。每个 provider 都支持自定义模型列表、temperature、system / user prompt 以及思考模式开关。

## 上下文关联翻译（仅 LLM）

LLM 模式可在每一批请求里携带前后文，提升段落级连贯性和术语一致性。

- **并发行数**：同时翻译的最大行数（默认 20）。过高可能触发速率限制。
- **上下文行数**：每批携带的上下文行数（默认 50）。值越大连贯性越好，但 token 消耗也越多。

⚠️ **注意**：Markdown 结构复杂，开启上下文模式可能略微增加格式错误的概率（代码块未闭合、列表缩进偏移等）。请仔细检查输出，尤其是深层嵌套文档。

## 适用场景

- 📚 多语言技术文档批量翻译
- 🌐 开源项目文档的 i18n
- ✍️ Markdown 博客中英双语同步
- 🧮 混合文档（文本 + 代码 + 公式）格式保留翻译
- 🔍 剥离 Markdown 得到纯文本，用于摘要 / NLP / 搜索索引

## 技术栈

- **框架**：[Next.js 16](https://nextjs.org/)（App Router）+ React 19 with React Compiler
- **UI**：[Ant Design 6](https://ant.design/) + [Tailwind CSS 4](https://tailwindcss.com/)
- **i18n**：[next-intl](https://next-intl-docs.vercel.app/)
- **缓存**：[idb](https://github.com/jakearchibald/idb)（IndexedDB）
- **测试**：[Vitest](https://vitest.dev/) —— `restorePlaceholders` 等占位符工具均有单元测试

## 快速开始

### 环境要求

- Node.js >= 20.9.0
- Yarn（推荐）、npm 或 pnpm

### 安装与启动

```bash
git clone https://github.com/rockbenben/md-translator.git
cd md-translator

yarn install
yarn dev
```

打开 [http://localhost:3000](http://localhost:3000) 即可使用。

### 构建生产版本

```bash
yarn build
```

## 文档与部署

详细配置、API 设置和自托管说明，请参阅 **[官方文档](https://docs.newzone.top/zh/guide/translation/md-translator/)**。

**快速部署**：[部署指南](https://docs.newzone.top/zh/guide/translation/md-translator/deploy.html)

## 参与贡献

欢迎通过 Issue 或 Pull Request 参与贡献！

1. Fork 本仓库并创建功能分支
2. 本地执行 `yarn` 与 `yarn dev`
3. 适当补充测试 / 文档
4. 提交 PR 并清晰描述变更

## 许可协议

MIT © 2025 [rockbenben](https://github.com/rockbenben)。详见 [LICENSE](./LICENSE)。
