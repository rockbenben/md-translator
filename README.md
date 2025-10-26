<h1 align="center">
⚡️Markdown Translator
</h1>
<p align="center">
    English | <a href="./README-zh.md">中文</a>
</p>
<p align="center">
    <em>Translate Markdown effortlessly—fast, accurate, and multilingual!</em>
</p>

In fields like technical documentation, open-source projects, and blog writing, **Markdown** has become the most widely used markup language. However, most existing translation tools tend to disrupt the original format when handling Markdown content—especially when it comes to code blocks, LaTeX formulas, or structured metadata—leading to formatting errors and semantic loss.

**MD Translator** is an intelligent translation tool specifically designed to solve this pain point. It not only delivers high-quality translations while preserving the Markdown structure, but also offers a **"plain text translation mode"** that supports translating any type of text document—achieving both format preservation and flexible translation.

👉 **Try it online**: [https://tools.newzone.top/zh/md-translator](https://tools.newzone.top/zh/md-translator)

## Core Feature 1: Native Markdown Element Support

**md-translator** is deeply optimized for Markdown documents and can recognize and preserve the following common syntax elements:

- FrontMatter metadata (`---`)
- Headings (`#`)
- Blockquotes (`> quote`)
- Links (`[text](url)`)
- Unordered lists (`-` / `*` / `+`)
- Ordered lists (`1. 2. 3.`)
- Emphasis (`**bold**`, `_italic_`)
- Code blocks (` ``` `)
- Inline code (`` `code` ``)
- Inline LaTeX formulas (`$formula$`)
- Block-level LaTeX formulas (`$$formula$$`)

Translation for FrontMatter, code blocks, and LaTeX formulas is optional—you can choose whether to process them based on your specific needs.

## Core Feature 2: Plain Text Translation for Any Document

Beyond structured Markdown support, **md-translator** also offers a **"plain text translation mode"**, which skips format recognition and directly translates any text content. Whether it’s Markdown, TXT, HTML, log files, or unformatted technical notes, this mode provides accurate and efficient language conversion.

Additionally, users can customize AI prompts to further improve terminology consistency, contextual coherence, and translation style.

## Extended Feature: Extract Clean Plain Text

**md-translator** can also convert Markdown content into plain text for secondary processing or semantic analysis:

- Automatically removes all Markdown syntax
- Hides technical content like code blocks and links
- Outputs plain text suitable for summarization, search indexing, or NLP processing

This feature is ideal for automation scenarios such as technical content summarization, semantic analysis, and knowledge graph construction.

## Use Cases

- Batch translation of multilingual technical documents
- Localization of open-source project documentation
- Bilingual (English-Chinese) synchronization of Markdown blog content
- Format-preserving translation of mixed documents (e.g., code comments, formula annotations)
- Semantic translation and extraction for any structured/unstructured text

For more documentation, see the [official guide](https://docs.newzone.top/guide/translation/md-translator/index.html).

## Project Deployment

**MD Translator** can be deployed to CloudFlare, Vercel, or any server environment.

**System Requirements:**

- [Node.js 18.18](https://nodejs.org/) or later
- Supports macOS, Windows (including WSL), and Linux

```shell
# Installation
yarn

# Local Development
yarn dev

# Build and Start
yarn build && npx serve@latest out

# Deploy for a Single Language
yarn build:lang en
yarn build:lang zh
yarn build:lang zh-hant
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the result.

You can start editing the page by modifying `src/app/[locale]/page.tsx`. The page updates automatically as you edit the file.
