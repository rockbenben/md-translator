# External Integrations

**Analysis Date:** 2026-03-28

## Translation APIs

**Traditional Machine Translation:**

| Service | Implementation | API Endpoint | Auth |
|--------|---------------|--------------|------|
| **DeepL** | `src/app/lib/translation/services/traditional.ts` | Proxy-based (dev: `/api/deepl`, prod: `api-edgeone.newzone.top`) | API Key |
| **Google Translate** | `src/app/lib/translation/services/traditional.ts` | `https://translation.googleapis.com/language/translate/v2` | API Key |
| **Azure Translate** | `src/app/lib/translation/services/traditional.ts` | `https://api.cognitive.microsofttranslator.com/translate` | API Key + Region |
| **GTX API (Free)** | `src/app/lib/translation/services/traditional.ts` | `https://translate.googleapis.com/translate_a/single` | None |
| **GTX Web** | `src/app/lib/translation/services/traditional.ts` | Internal API route `/api/webgoogletranslate` | None |
| **DeepLX (Free)** | `src/app/lib/translation/services/traditional.ts` | Third-party: `https://deeplx.aishort.top/translate` | None |
| **Qwen-MT** | `src/app/lib/translation/services/traditional.ts` | User-configurable endpoint | API Key |

**Language Code Mappings:**
- DeepL source mapping: `zh-hant→ZH`, `pt-br→PT`, `fil→TL`
- DeepL target mapping: `en→EN-US`, `zh→ZH-HANS`, `zh-hant→ZH-HANT`

## LLM Providers

| Provider | Implementation | API Endpoint | Auth |
|----------|---------------|--------------|------|
| **DeepSeek** | `src/app/lib/translation/services/llm.ts` | Direct: `https://api.deepseek.com/chat/completions` or Relay: `https://llm-proxy.aishort.top/api/deepseek` | API Key |
| **OpenAI** | `src/app/lib/translation/services/llm.ts` | `https://api.openai.com/v1/chat/completions` | API Key |
| **Gemini** | `src/app/lib/translation/services/llm.ts` | `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent` | API Key |
| **Perplexity** | `src/app/lib/translation/services/llm.ts` | `https://api.perplexity.ai/chat/completions` | API Key |
| **Azure OpenAI** | `src/app/lib/translation/services/llm.ts` | `{endpoint}/openai/deployments/{deployment}/chat/completions` | API Key + API Version |
| **SiliconFlow** | `src/app/lib/translation/services/llm.ts` | `https://api.siliconflow.cn/v1/chat/completions` | API Key |
| **Groq** | `src/app/lib/translation/services/llm.ts` | `https://api.groq.com/openai/v1/chat/completions` | API Key |
| **OpenRouter** | `src/app/lib/translation/services/llm.ts` | `https://openrouter.ai/api/v1/chat/completions` | API Key |
| **Nvidia NIM** | `src/app/lib/translation/services/llm.ts` + `src/app/api/nvidia/route.ts` | Direct URL or Proxy: `/api/nvidia` | API Key |
| **Custom LLM** | `src/app/lib/translation/services/llm.ts` | User-configurable endpoint (default: `http://127.0.0.1:11434/v1/chat/completions`) | Optional API Key |

**Default Models:**
- DeepSeek: `deepseek-chat`
- OpenAI: `gpt-5-mini`
- Gemini: `gemini-2.5-flash`
- Perplexity: `sonar`
- Azure OpenAI: `gpt-5-mini`
- SiliconFlow: `deepseek-ai/DeepSeek-V3`
- Groq: `openai/gpt-oss-20b`
- OpenRouter: `mistralai/devstral-2512:free`
- Nvidia: `deepseek-ai/deepseek-v3.2`
- Custom LLM: `llama3.2`

## Data Storage

**Browser Storage:**
- IndexedDB via `idb` library
  - Database name: `tools-by-ai`
  - Store name: `translation-cache`
  - Implementation: `src/app/lib/storage/indexedDBStorage.ts`
  - Features: get, set, delete, clear, count operations

## NLP Processing

**Text Processing:**
- compromise 14.14.5 - NLP library for text analysis and processing

## File Utilities

**Encoding Detection:**
- jschardet 3.1.4 - Character encoding detection for input files

**RTL Support:**
- rtl-detect 1.1.2 - Right-to-left language detection for UI mirroring

**Hashing:**
- spark-md5 3.0.2 - MD5 hashing for cache key generation

**File Saving:**
- file-saver 2.0.5 - Client-side file download/save functionality

## API Routes

**Proxy Endpoints (CORS bypass):**
- `/api/deepl` - DeepL API proxy
  - Implementation: `src/app/api/deepl/route.ts`
- `/api/nvidia` - Nvidia NIM API proxy
  - Implementation: `src/app/api/nvidia/route.ts`

**Environment Routing:**
- Development: Uses local API routes (`/api/deepl`, `/api/nvidia`)
- Production (static): Uses remote edge functions (`api-edgeone.newzone.top`)
- Toggle: `NEXT_PUBLIC_USE_LOCAL_API` environment variable

## Service Configuration

**Default Configs:**
- Located in `src/app/lib/translation/config.ts`
- Batch sizes, chunk sizes, delay times, context windows per service
- Temperature settings per LLM provider
- System and user prompt templates

**Translation Service Registry:**
- `TRANSLATION_SERVICES` array in `src/app/lib/translation/config.ts`
- `categorizedOptions` for grouped UI selects

---

*Integration audit: 2026-03-28*
