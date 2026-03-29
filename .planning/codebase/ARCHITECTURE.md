# Architecture

**Analysis Date:** 2026-03-28

## Pattern Overview

**Overall:** Next.js App Router with Client-Server Component Architecture

**Key Characteristics:**
- Dynamic `[locale]` route for internationalization
- Client-side translation UI with server-rendered layouts
- Service-oriented translation architecture with multiple API providers
- IndexedDB caching for translation results

## Layers

**UI Layer (`src/app/[locale]/` and `src/app/components/`):**
- Purpose: User interface and interaction handling
- Location: `src/app/[locale]/MDTranslator.tsx`, `src/app/components/`
- Contains: React components, Ant Design UI elements
- Depends on: Hooks, translation services
- Used by: Next.js page rendering

**State/Hooks Layer (`src/app/hooks/` and `src/app/components/TranslationContext.tsx`):**
- Purpose: Centralized state management for translation workflow
- Location: `src/app/hooks/useTranslateData.tsx`, `src/app/hooks/translation/`
- Contains: `useTranslateData` hook providing all translation state and logic
- Depends on: Translation services, IndexedDB storage
- Used by: UI components via TranslationContext

**Translation Services Layer (`src/app/lib/translation/services/`):**
- Purpose: API communication with translation providers
- Location: `src/app/lib/translation/services/shared.ts`, `llm.ts`, `traditional.ts`
- Contains: Service implementations for DeepL, Google, OpenAI, DeepSeek, Gemini, etc.
- Depends on: External translation APIs
- Used by: Hooks layer

**Storage Layer (`src/app/lib/storage/`):**
- Purpose: Persistent caching of translation results
- Location: `src/app/lib/storage/indexedDBStorage.ts`
- Contains: IndexedDB wrapper using `idb` library
- Used by: Translation service via cache module

**i18n Layer (`src/i18n/`):**
- Purpose: Application internationalization
- Location: `src/i18n/routing.ts`, `request.ts`, `navigation.ts`
- Contains: next-intl routing configuration, locale handling
- Used by: All pages and components via NextIntlClientProvider

**API Routes Layer (`src/app/api/`):**
- Purpose: Server-side proxy for translation APIs
- Location: `src/app/api/deepl/route.ts`
- Contains: Next.js API routes for CORS bypass and API key handling
- Used by: Client-side translation services

## Data Flow

**Translation Request Flow:**

```
User Input (MDTranslator.tsx)
    ↓
handleTranslate() / handleMultipleTranslate()
    ↓
validateTranslate() - API key and language support validation
    ↓
performTranslation()
    ↓
filterMarkdownLines() - Extract translatable content, replace non-translatable with placeholders
    ↓
translateContent() - Process each line/batch
    ↓
retryTranslate() - Apply retry logic with p-retry
    ↓
translateText() from useTranslation()
    ↓
Cache check (IndexedDB via idb)
    ↓
Service invocation (translationServices[method])
    ↓
API call to external service (via proxy if needed)
    ↓
cleanTranslatedText() - Clean response
    ↓
Cache result in IndexedDB
    ↓
Return to UI
```

**Context-Aware Translation Flow (LLM only):**

```
translateWithContext()
    ↓
Batch lines with surrounding context padding
    ↓
Mark target lines with [TRANSLATE_N] tags
    ↓
Mark context lines with [CONTEXT] tags
    ↓
retryTranslate() with buildContextPrompt()
    ↓
extractTranslatedLinesWithNumbers()
    ↓
Fallback to individual line translation if batch incomplete
```

## Key Abstractions

**TranslationService Type:**
- Location: `src/app/lib/translation/types.ts`
- Pattern: Function signature `(params: TranslateTextParams) => Promise<string>`
- All translation services implement this interface

**TranslationContext:**
- Location: `src/app/components/TranslationContext.tsx`
- Pattern: React Context providing centralized state
- Wraps `useTranslateData()` hook

**useTranslation Hook:**
- Location: `src/app/lib/translation/index.ts`
- Pattern: Custom hook wrapping `translateText()` function
- Returns `{ translate }` for direct text translation

**IndexedDB Storage:**
- Location: `src/app/lib/storage/indexedDBStorage.ts`
- Pattern: Singleton database connection with `idb` wrapper
- Database: `tools-by-ai`, Store: `translation-cache`

## Entry Points

**Root Layout:**
- Location: `src/app/layout.tsx`
- Triggers: All page requests
- Responsibilities: Global providers setup (ThemesProvider, NextIntlClientProvider)

**Locale Layout:**
- Location: `src/app/[locale]/layout.tsx`
- Triggers: Requests to `/{locale}` paths
- Responsibilities: Locale-specific HTML rendering, direction (RTL/LTR), Navigation

**Root Page:**
- Location: `src/app/page.tsx`
- Triggers: Requests to `/`
- Responsibilities: Redirect to default locale

**Locale Page:**
- Location: `src/app/[locale]/page.tsx`
- Triggers: Requests to `/{locale}`
- Responsibilities: Render MDTranslator via ClientPage

**Client Page:**
- Location: `src/app/[locale]/client.tsx`
- Triggers: Locale page render
- Responsibilities: Dynamic loading of TranslationSettings, tabs management

## Error Handling

**Strategy:** Fail-stop with retry logic

**Patterns:**
- `p-retry` for automatic retry on failure
- `AbortController` for request cancellation
- Auth error detection triggers abort of all concurrent requests
- User-friendly error messages with localized hints

**Retry Configuration:**
- Default retry count: 3
- Default timeout: 30 seconds
- Method-specific overrides via `getRetryConfig()`

## Cross-Cutting Concerns

**Internationalization:**
- Framework: `next-intl`
- Configuration: `src/i18n/routing.ts` defines 18 supported locales
- Messages: JSON files in `messages/` directory
- Navigation: Wrappers in `src/i18n/navigation.ts`

**Theming:**
- Framework: `next-themes` with Ant Design `ConfigProvider`
- Location: `src/app/ThemesProvider.tsx`
- Strategy: CSS class-based (`attribute="class"`)
- Default theme: dark
- RTL support: `rtl-detect` for direction

**Translation Cache:**
- Strategy: IndexedDB with content-based key
- Key generation: MD5 hash via `spark-md5`
- No expiration (unlimited capacity)

---

*Architecture analysis: 2026-03-28*
