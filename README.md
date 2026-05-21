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

**MD Translator** solves the broken-formatting problem that plagues Markdown translation. It delivers high-quality translations while accurately preserving every Markdown construct — code blocks, LaTeX formulas, FrontMatter metadata, links, and emphasis all stay intact. Connect to 7 traditional translation APIs (DeepL, Google, Azure, DeepLX, Qwen-MT, TranslateGemma, GTX) or 17+ LLM providers, and translate into 50+ languages simultaneously.

👉 **Try it online**: <https://tools.newzone.top/en/md-translator>

## Key Features

- **Format-Preserving**: Tokenize FrontMatter, code blocks, LaTeX, links, headings, lists, and blockquotes into placeholders; restore them losslessly after translation.
- **Native Markdown Support**: Translates only the prose layer; headings, lists, code blocks, links, emphasis, and LaTeX stay byte-perfect.
- **Plain Text Mode**: Skip format parsing for plain text inputs (TXT, HTML, logs) — useful when the Markdown tokenizer would over-protect.
- **Unlimited Caching** (IndexedDB): All translations cached locally with no browser-storage size limit.
- **Context-Aware Translation** (LLM only): Surrounding paragraphs included as context for better coherence and terminology consistency.
- **Multi-Language Output**: Translate to 50+ languages in one pass — each language exported as its own file.
- **Text Extraction**: Strip Markdown syntax to clean plain text for summarization, NLP, or search indexing.
- **Multi-Locale UI**: Powered by next-intl, with full UI translation across 18 languages.

## Supported Markdown Elements

| Element                        | Syntax                            | Protected |
| ------------------------------ | --------------------------------- | --------- |
| FrontMatter metadata           | `---` block                       | Optional  |
| Headings                       | `#` … `######`                    | ✅        |
| Lists                          | `-` / `*` / `1.`                  | ✅        |
| Blockquotes                    | `> quote`                         | ✅        |
| Links                          | `[text](url)`                     | ✅        |
| Emphasis                       | `**bold**`, `_italic_`            | Inline    |
| Code blocks                    | ` ``` ` and `` ` ``               | Optional  |
| Inline / block LaTeX           | `$formula$`, `$$formula$$`        | Optional  |
| Inline HTML                    | `<span>`, `<br/>`                 | ✅        |

FrontMatter, code blocks, and LaTeX formulas can be translated or kept as-is — each is an independent toggle.

## Translation APIs

Supports **7 traditional MT APIs** and **17+ LLM providers**:

### Traditional APIs

| API                  | Quality | Stability | Free Tier                             |
| -------------------- | ------- | --------- | ------------------------------------- |
| **DeepL**            | ★★★★★   | ★★★★☆     | 500K chars/month                      |
| **Google Translate** | ★★★★☆   | ★★★★★     | 500K chars/month                      |
| **Azure Translate**  | ★★★★☆   | ★★★★★     | 2M chars/month (first 12 months)      |
| **DeepLX (Free)**    | ★★★★☆   | ★★★☆☆     | Self-host or free public endpoints    |
| **Qwen-MT**          | ★★★★☆   | ★★★★☆     | Alibaba DashScope quota               |
| **TranslateGemma**   | ★★★★☆   | ★★★★☆     | Self-host (LM Studio / Ollama / etc.) |
| **GTX API (Free)**   | ★★★☆☆   | ★★★☆☆     | Free (rate-limited)                   |

### LLM Providers

Supports **DeepSeek**, **OpenAI**, **Claude**, **Gemini**, **Qwen**, **Moonshot**, **Doubao**, **Zhipu GLM**, **MiniMax**, **Mistral**, **Perplexity**, **Cohere**, **OpenRouter**, **Groq**, **SiliconFlow**, **Nvidia NIM**, **Azure OpenAI**, plus any **Custom (OpenAI-compatible)** endpoint (Ollama / LM Studio / vLLM / Together AI / Fireworks AI etc.). Each provider has a configurable model list, temperature, system / user prompts, and per-request thinking-mode toggle.

## Context-Aware Translation (LLM only)

LLM modes can send surrounding lines as context for each batch, improving paragraph-level coherence and terminology consistency.

- **Concurrent Lines**: max lines translated in parallel (default 20). Too high triggers rate limits.
- **Context Lines**: lines included per batch as context (default 50). Higher = better coherence but more tokens.

⚠️ **Caveat**: Markdown is complex — enabling context mode may slightly raise the risk of formatting errors (unclosed code blocks, list indentation drift). Spot-check output, especially for documents with deeply nested structure.

## Use Cases

- 📚 Translate multilingual technical documentation in bulk
- 🌐 Open-source project documentation i18n
- ✍️ Bilingual Markdown blog content sync
- 🧮 Format-preserving translation of mixed content (text + code + formulas)
- 🔍 Strip Markdown to plain text for summarization / NLP / search indexing

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router) + React 19 with the React Compiler
- **UI**: [Ant Design 6](https://ant.design/) + [Tailwind CSS 4](https://tailwindcss.com/)
- **i18n**: [next-intl](https://next-intl-docs.vercel.app/)
- **Caching**: [idb](https://github.com/jakearchibald/idb) (IndexedDB)
- **Testing**: [Vitest](https://vitest.dev/) — `restorePlaceholders` and other placeholder utilities ship with unit tests

## Getting Started

### Requirements

- Node.js >= 20.9.0
- Yarn (recommended), npm, or pnpm

### Install & Run

```bash
git clone https://github.com/rockbenben/md-translator.git
cd md-translator

yarn install
yarn dev
```

Visit [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
yarn build
```

## Documentation & Deployment

For detailed configuration, API setup, and self-hosting instructions, see the **[Official Documentation](https://docs.newzone.top/en/guide/translation/md-translator/)**.

**Quick Deployment**: [Deploy Guide](https://docs.newzone.top/en/guide/translation/md-translator/deploy.html)

## Contributing

Contributions are welcome! Feel free to open issues and pull requests.

1. Fork the repo and create a feature branch
2. Run `yarn` and `yarn dev` locally
3. Add tests / docs when applicable
4. Submit a PR with a clear description

## License

MIT © 2025 [rockbenben](https://github.com/rockbenben). See [LICENSE](./LICENSE).
