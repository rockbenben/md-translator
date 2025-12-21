<h1 align="center">
⚡️ Markdown Translator
</h1>
<p align="center">
    English | <a href="./README-zh.md">中文</a>
</p>
<p align="center">
    <em>Translate Markdown & preserve every format — headings, code, formulas, all intact</em>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <a href="https://tools.newzone.top/en/md-translator"><img src="https://img.shields.io/badge/Live%20Demo-md--translator-blue" alt="Live Demo"></a>
</p>

**MD Translator** is an intelligent translation tool designed to solve the common problem of broken formatting when translating Markdown content. It delivers **high-quality translations** while **accurately preserving Markdown structure**, including code blocks, LaTeX formulas, and metadata.

👉 **Try it online**: <https://tools.newzone.top/en/md-translator>

## Key Features

- **Native Markdown Support**: Preserves headings, lists, code blocks, links, emphasis, and LaTeX formulas.
- **High-Performance Caching (IndexedDB)**: Stores translation results with **unlimited capacity**—no browser storage limits.
- **Context-Aware Translation** (AI models only): Translates with surrounding context for better paragraph coherence.
- **Plain Text Mode**: Skip format parsing for direct translation of any text document (TXT, HTML, logs, etc.).
- **Multi-language Output**: Translate into **50+ languages** simultaneously.
- **Text Extraction**: Convert Markdown to clean plain text for summarization, NLP, or search indexing.

## Supported Markdown Elements

- FrontMatter metadata (`---`)
- Headings (`#`)
- Blockquotes (`> quote`)
- Links (`[text](URL)`)
- Unordered/Ordered lists
- Emphasis (`**bold**`, `_italic_`)
- Code blocks (` ``` `) and inline code
- Inline/Block LaTeX formulas (`$formula$`, `$$formula$$`)

Translation for FrontMatter, code blocks, and LaTeX formulas is **optional** and configurable.

## Translation APIs

Supports **5 translation APIs** and **9 AI LLM models**:

### Traditional APIs

| API                  | Quality | Stability | Free Tier                        |
| -------------------- | ------- | --------- | -------------------------------- |
| **DeepL (X)**        | ★★★★★   | ★★★★☆     | 500K chars/month                 |
| **Google Translate** | ★★★★☆   | ★★★★★     | 500K chars/month                 |
| **Azure Translate**  | ★★★★☆   | ★★★★★     | 2M chars/month (first 12 months) |
| **GTX API (Free)**   | ★★★☆☆   | ★★★☆☆     | Free (rate-limited)              |
| **GTX Web (Free)**   | ★★★☆☆   | ★★☆☆☆     | Free                             |

### LLM Models

Supports **DeepSeek**, **OpenAI**, **Gemini**, **Azure OpenAI**, **Siliconflow**, **Groq**, **OpenRouter**, **Perplexity**, and **Custom LLM**.

## Context-Aware Translation

_Context-Aware Translation_ (AI models only) slices documents into segments and sends them to the LLM with surrounding context, improving paragraph coherence and terminology consistency.

Two key parameters:

- **Concurrent Lines**: Maximum lines translated simultaneously (default: 20).
- **Context Lines**: Lines included per batch for context (default: 50).

⚠️ **Warning**: Due to Markdown complexity, enabling context mode may increase the risk of formatting errors (e.g., unclosed code blocks, list indentation issues). Monitor output carefully.

## Use Cases

- Bulk translation of multilingual technical documents
- Internationalization of open-source project documentation
- Bilingual synchronization of Markdown blog content
- Format-preserving translation of mixed content (code, formulas)
- Semantic translation and extraction for any text

## Documentation & Deployment

For detailed configuration, API setup, and self-hosting instructions, see the **[Official Documentation](https://docs.newzone.top/en/guide/translation/md-translator/)**.

**Quick Deployment**: [Deploy Guide](https://docs.newzone.top/en/guide/translation/md-translator/deploy.html)

## Contributing

Contributions are welcome! Feel free to open issues and pull requests.

## License

MIT © 2025 [rockbenben](https://github.com/rockbenben). See [LICENSE](./LICENSE).
