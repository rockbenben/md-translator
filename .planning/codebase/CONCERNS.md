# Codebase Concerns

**Analysis Date:** 2026-03-28

## Translation Quality Issues

### Context-Aware Mode Formatting Risks

**Severity:** Medium

**Evidence:** `README.md` (lines 69-70) explicitly warns:
> ⚠️ **Warning**: Due to Markdown complexity, enabling context mode may increase the risk of formatting errors (e.g., unclosed code blocks, list indentation issues). Monitor output carefully.

**Files:** `src/app/hooks/useTranslateData.tsx` (lines 424-561)

**Details:**
- Context-aware translation slices documents into segments with `[TRANSLATE_X]` and `[CONTEXT]` markers
- When AI model doesn't follow marker format exactly, fallback to line-by-line translation occurs
- `extractTranslatedLinesWithNumbers` function (lines 25-55 in `contextTranslation.ts`) handles malformed responses with typos like `[/TRANSLTranslate_X]`
- If AI produces incomplete translations, batch gaps trigger recursive context window reduction
- Deep recursion with `MAX_CONTEXT_RETRIES = 2` and `MAX_CONTEXT_PADDING = 25` could cause performance degradation

---

### Markdown Placeholder Collision Risk

**Severity:** Low

**Evidence:** `src/app/[locale]/markdownUtils.ts` (line 21)

**Details:**
- Placeholder pattern uses format `<<<FRONTMATTER_\d+|...>>>` to protect Markdown elements
- If source content already contains `<<<FRONTMATTER_100>>>` pattern, restoration could corrupt output
- 100 as starting counter provides some collision buffer, but not guaranteed

---

### LaTeX Inline Detection Edge Cases

**Severity:** Low

**Evidence:** `src/app/[locale]/markdownUtils.ts` (lines 124-136)

**Details:**
```typescript
if (/^[\s\d,.]+$/.test(content) && !content.includes("\\")) {
  return match; // 保持货币符号不变
}
```
- Heuristic-based LaTeX detection could misidentify:
  - `$100` price as currency (correct)
  - `$formula` with spaces as currency (incorrect)
  - Math expressions without LaTeX commands in single-digit contexts

---

### Bold Text Translation Disabled

**Severity:** Low (Design Decision)

**Evidence:** `src/app/[locale]/markdownUtils.ts` (lines 229-235)

**Details:**
- Bold text (`**text**`) processing is commented out
- Comment explains: "加粗文本（不作处理，避免语义被分割）"
- Translation happens at line level, so bold text within a line will be translated but formatting preserved

---

## API Limitations

### Free Tier Character Limits

**Severity:** High (Operational)

**Evidence:** `README.md` (lines 50-54)

| API | Free Tier |
|-----|-----------|
| DeepL (X) | 500K chars/month |
| Google Translate | 500K chars/month |
| Azure Translate | 2M chars/month (first 12 months) |
| GTX API (Free) | Rate-limited |
| GTX Web (Free) | Rate-limited |

**Files:** `src/app/lib/translation/config.ts`

**Details:**
- No rate limiting handling in code - requests fail when limits hit
- `gtxFreeAPI` service (`src/app/lib/translation/services/traditional.ts` line 35) makes direct browser requests to Google Translate

---

### Language Support Gaps

**Severity:** Medium

**Evidence:** `src/app/lib/translation/languages-data.ts` (lines 90-113)

**Details:**
```typescript
const DEEPL_UNSUPPORTED_LANGS = new Set(["kn", "am", "ug", "si", "lo"]);
const AZURE_UNSUPPORTED_LANGS = new Set(["jv"]);
const QWEN_MT_UNSUPPORTED_LANGS = new Set(["ky", "tk", "tg", "mn", "ml", "pa", "bho", "ha", "am", "ug"]);
```

**Affected Languages:**
- DeepL/DeepLX: Kannada, Amharic, Uyghur, Sinhala, Lao
- Azure: Javanese
- Qwen-MT: Kyrgyz, Turkmen, Tajik, Mongolian, Malayalam, Punjabi, Bhojpuri, Hausa, Amharic, Uyghur

---

### Third-Party Proxy Stability Risk

**Severity:** Medium

**Evidence:** `src/app/lib/translation/services/shared.ts` (lines 23-26)

**Details:**
```typescript
export const THIRD_PARTY_ENDPOINTS = {
  deeplx: "https://deeplx.aishort.top/translate",
  deepseekRelay: "https://llm-proxy.aishort.top/api/deepseek",
} as const;
```
- Community-maintained proxy endpoints are hardcoded
- No fallback mechanism if these services become unavailable
- `src/app/hooks/useTranslateData.tsx` (lines 307-309) shows graceful fallback for DeepLX unavailable

---

### DeepL API Deprecated Language Codes

**Severity:** Low (API Evolution)

**Evidence:** `src/app/api/deepl/route.ts` (lines 71-79)

**Details:**
```typescript
if (error instanceof deepl.DeepLError && (error.message.includes("is deprecated") || error.message.includes("not supported"))) {
  return NextResponse.json({
    error: `DeepL API error: ${errorMsg}`,
    suggestion: "请更新您的语言代码。例如，使用'en-US'或'en-GB'代替'en'，使用'pt-BR'或'pt-PT'代替'pt'。",
  }, { status: 400 });
}
```
- DeepL is phasing out simple language codes like `en` → must use `EN-US` or `en-GB`
- `TARGET_LANG_MAPPING` in same file handles some cases but API may reject others

---

## Data Handling Concerns

### IndexedDB Cache Growth

**Severity:** Medium

**Evidence:** `src/app/lib/storage/indexedDBStorage.ts`

**Details:**
- Cache has no eviction policy - `clearTranslationCache` function exists but must be called manually
- `translationCache.set` silently catches errors (line 53)
- No storage quota monitoring
- Cache key generation uses MD5 hash for texts > 32 characters (`src/app/lib/translation/cache.ts` line 34-35)

---

### API Key Storage in localStorage

**Severity:** High (Security)

**Evidence:** `src/app/utils/localStorageUtils.ts`

**Details:**
- API keys stored in localStorage without encryption
- `saveToLocalStorage` simply JSON.stringifies values
- localStorage is accessible via XSS attacks
- `loadFromLocalStorage` returns null if parsing fails, preventing errors but also masking issues

**Risk:** If attacker injects malicious script, API keys can be exfiltrated

---

### Cache Key Generation Uses MD5

**Severity:** Medium (Security)

**Evidence:** `src/app/lib/translation/cache.ts` (lines 33-39)

**Details:**
```typescript
export const generateCacheKey = (text: string, cacheSuffix: string): string => {
  if (text.length > 32) {
    return `${CACHE_PREFIX}${SparkMD5.hash(text)}_${cacheSuffix}`;
  }
  // Short texts use encodeURIComponent directly
```

- MD5 is cryptographically broken for collision resistance
- Used here for performance (hash vs storing full text)
- Cache poisoning not a direct risk since cached content is user-generated

---

## i18n Challenges

### RTL Language Support Partial

**Severity:** Low

**Evidence:** `src/app/hooks/useTranslateData.tsx` imports `rtl-detect`

**Details:**
- RTL languages (Arabic, Hebrew, Persian, Urdu) are supported in language list
- RTL detection relies on `rtl-detect` package
- UI layout may not fully adapt to RTL text direction

---

### DeepL Language Code Mapping Incomplete

**Severity:** Low

**Evidence:** `src/app/lib/translation/services/traditional.ts` (lines 7-25)

**Details:**
```typescript
const DEEPL_SOURCE_MAP: Record<string, string> = {
  "zh-hant": "ZH",
  "pt-br": "PT",
  "pt-pt": "PT",
  fil: "TL",
};
```
- Only 4 language variants mapped
- Other variants like `zh-cn` (already maps to ZH-HANS) are handled in target mapping
- Cantonese (`yue`) not specifically mapped

---

## Security Considerations

### Third-Party Proxy Endpoints Hardcoded

**Severity:** Medium

**Evidence:** `src/app/lib/translation/services/shared.ts` (lines 13-26)

**Details:**
- Community proxy endpoints are hardcoded
- `https://deeplx.aishort.top` and `https://llm-proxy.aishort.top` could:
  - Log request contents
  - Rate limit or block requests
  - Change availability
- No integrity verification of responses

---

### LLM Prompt Injection Risk

**Severity:** Medium

**Evidence:** `src/app/lib/translation/config.ts` (lines 5-6)

**Details:**
```typescript
export const DEFAULT_SYS_PROMPT = "You are a professional translator...";
export const DEFAULT_USER_PROMPT = "Please respect the original meaning...";
```
- User can modify system and user prompts
- Malicious prompts could be injected if settings are imported from untrusted sources
- No sanitization of prompt content before sending to LLM APIs

---

### Settings Import缺乏验证

**Severity:** Low

**Evidence:** `src/app/hooks/translation/settings.ts` (lines 59-64)

**Details:**
```typescript
const settings = JSON.parse(content) as TranslationSettings;
if (!settings || typeof settings !== "object") {
  throw new Error("Invalid settings format");
}
```
- Only basic type checking on imported settings
- No schema validation
- Malformed settings could cause runtime errors

---

## Performance Concerns

### Recursive Context Window Reduction

**Severity:** Low

**Evidence:** `src/app/hooks/useTranslateData.tsx` (lines 476-510)

**Details:**
- When batch translation fails, `translateBatch` recursively calls itself with halved context window
- `MAX_CONTEXT_RETRIES = 2` limits recursion depth
- Could cause multiple API calls for large documents with formatting issues

---

### No Request Streaming

**Severity:** Low (Feature Gap)

**Evidence:** All LLM services in `src/app/lib/translation/services/llm.ts` set `stream: false`

**Details:**
- All translation requests are non-streaming
- Large translations must complete before any output shown
- User waits for full API response

---

### Concurrent Translation Limit

**Severity:** Low

**Evidence:** `src/app/hooks/useTranslateData.tsx` (lines 573-576)

**Details:**
```typescript
const concurrency = Math.max(Number(config?.batchSize) || 10, 1);
const limit = pLimit(concurrency);
```
- `batchSize` varies by service (10 for DeepLX, 20 for most LLMs, 100 for Google)
- High concurrency could trigger API rate limits
- No dynamic concurrency adjustment based on API responses

---

## Edge Cases in Translation

### Translation Marker Extraction Tolerance

**Severity:** Low (Robustness)

**Evidence:** `src/app/hooks/translation/contextTranslation.ts` (lines 31-44)

**Details:**
- AI model typo in closing marker: `[/TRANSLTranslate_X]` instead of `[/TRANSLATE_X]`
- Code handles this specific error case
- Other marker format variations fall back to line-by-line extraction

---

### Empty Line Handling in Chunk Translation

**Severity:** Low

**Evidence:** `src/app/hooks/useTranslateData.tsx` (lines 645-660)

**Details:**
```typescript
const nonEmptyLines = contentLines.map((line) => (line.trim() ? line : delimiter));
```
- Empty lines replaced with delimiter for chunk-based translation
- After translation, lines mapped back but empty line positions could shift

---

### Source = Target Language Short-Circuit

**Severity:** Low (Design Decision)

**Evidence:** `src/app/lib/translation/index.ts` (lines 65-68)

**Details:**
```typescript
if (!/[a-zA-Z\p{L}]/u.test(text) || sourceLanguage === targetLanguage) {
  return text;
}
```
- Text without letters passes through unchanged
- If source equals target language, returns original immediately
- No translation attempt even if API keys configured

---

## Dependency Risks

### Outdated Default Models

**Severity:** Low (Maintenance)

**Evidence:** `src/app/lib/translation/config.ts`

**Details:**
- Default model for OpenAI: `gpt-5-mini` (line 144) - may not exist
- Default model for SiliconFlow: `deepseek-ai/DeepSeek-V3` (line 173)
- Models should be periodically verified against provider documentation

---

### Missing Dependency Type Definitions

**Severity:** Low

**Evidence:** `package.json` (line 46)

**Details:**
```json
"packageManager": "yarn@1.22.22"
```
- Using Yarn 1.x (classic) which has known limitations
- No pnpm or npm specific version constraints

---

## Test Coverage Gaps

**Noted during exploration:**
- No test files found in repository (`*.test.*`, `*.spec.*` patterns returned no results)
- No Jest, Vitest, or testing framework configuration detected
- All validation is manual or through actual usage

---

*Concerns audit: 2026-03-28*
