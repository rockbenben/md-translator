<h1 align="center">
⚡️Markdown Translator
</h1>
<p align="center">
    <a href="./README.md">English</a> | 中文
</p>
<p align="center">
    <em>Translate Markdown effortlessly—fast, accurate, and multilingual!</em>
</p>

技术文档、开源项目、博客创作等领域，Markdown 已成为最常用的文本标记语言。然而，现有大多数翻译工具在处理 Markdown 内容时，容易破坏其原始格式，尤其在涉及代码块、LaTeX 公式或结构化元数据时，常常出现格式错乱、语义丢失的问题。

MD Translator 正是为了解决这一痛点而设计的一款智能翻译工具。它不仅在保留 Markdown 结构的同时实现高质量翻译，还通过“纯文本翻译模式”，支持翻译任意类型的文本文档，让格式保留与自由翻译兼得。

👉 **在线体验**：<https://tools.newzone.top/zh/md-translator>

## 核心特性一：原生支持 Markdown 元素

md-translator 针对 Markdown 文档进行了深度优化，支持识别并还原以下常见语法元素：

- FrontMatter 元数据（---）
- 标题（#）
- 引用块（> 引用）
- 链接（\[text](url)）
- 无序列表（- / \* / +）
- 有序列表（1. 2. 3.）
- 加重字体（**加粗**，_斜体_）
- 代码块（```）
- 内联代码（\`code`）
- 行内 LaTeX 公式（$公式$）
- 块级 LaTeX 公式（$$公式$$）

其中，FrontMatter、代码块和 LaTeX 公式均支持可选翻译，你可以根据实际需求决定是否进行处理。

## 核心特性二：支持任意文档的纯文本翻译

除了对 Markdown 的结构化支持，md-translator 还提供 **“纯文本翻译模式”**，该模式可跳过格式识别，直接对任意文本内容进行翻译。无论是 Markdown、TXT、HTML、日志文件，甚至是未经格式化的技术笔记，都可以通过该模式获得准确、高效的语言转换结果。

此外，用户还可通过自定义 AI 提示词，进一步提升术语一致性、上下文连贯性以及翻译风格的统一。

## 扩展功能：提取纯净文本

md-translator 还具备将 Markdown 内容转换为纯文本的能力，方便你进行二次处理或语义分析：

- 自动去除所有 Markdown 标记符号
- 隐藏代码块、链接等技术内容
- 输出适合摘要提取、搜索索引或 NLP 处理的纯文本数据

该功能非常适用于技术内容的摘要提取、语义分析、知识图谱构建等自动化应用场景。

## 适用场景

- 多语言技术文档的批量翻译
- 开源项目说明文档的国际化
- Markdown 博客内容的中英双语同步
- 代码注释、公式说明等混合文档的格式保留翻译
- 任何结构化/非结构化文本的语义翻译与提取

更多使用文档查看[官方说明](https://docs.newzone.top/guide/translation/md-translator/index.html)。

## 项目部署

MD Translator 可部署到 CloudFlare、Vercel 或任意服务器。

System Requirements:

- [Node.js 18.18](https://nodejs.org/) or later.
- macOS, Windows (including WSL), and Linux are supported.

```shell
# Installation（安装依赖）
yarn

# Local Development (本地开发)
yarn dev

# build and start (构建并启动)
yarn build && npx serve@latest out

# Deploy for a single language（单一语言部署）
yarn build:lang en
yarn build:lang zh
yarn build:lang zh-hant
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `src/app/[locale]/page.tsx`. The page auto-updates as you edit the file.
