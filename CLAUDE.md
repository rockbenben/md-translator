<!-- GSD:project-start source:PROJECT.md -->
## Project

**MD Translator — Side-by-Side Editor Enhancement**

MD Translator 现有编辑器增加左右分屏视图功能，左侧显示原始 Markdown，右侧显示翻译结果，支持同步滚动和预览模式切换。

**Core Value:** 在翻译过程中提供清晰的原文/译文对照视图，减少来回切换，提升翻译效率和准确性。

### Constraints

- **兼容性**: 保持现有所有翻译 API 正常工作
- **性能**: 同步滚动需 60fps流畅
- **移动端**: 响应式布局（移动端可能降级为切换模式）
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript 5 - Primary development language for all application code
- JavaScript - Configuration files and build scripts
## Runtime
- Node.js >=20.9.0
- Next.js 16.1.1 (App Router)
- Yarn 1.22.22
- Lockfile: `yarn.lock`
## Frameworks
- Next.js 16.1.1 - Full-stack React framework with App Router
- Ant Design 6.1.3 - UI component library
- Tailwind CSS 4 - Utility-first CSS framework
- next-intl 4.7.0 - Internationalization framework for Next.js
- React hooks pattern (useState, useCallback, useMemo, useRef)
- next-themes 0.4.6 - Theme management
- React Compiler (babel-plugin-react-compiler 1.0.0)
## Key Dependencies
- compromise 14.14.5 - NLP library for text processing
- jschardet 3.1.4 - Character encoding detection
- rtl-detect 1.1.2 - RTL (right-to-left) language detection
- file-saver 2.0.5 - Client-side file saving/downloading
- spark-md5 3.0.2 - MD5 hashing for caching keys
- idb 8.0.3 - IndexedDB wrapper for translation caching
- deepl-node 1.24.0 - DeepL API client
- p-limit 7.2.0 - Promise concurrency limiting
- p-retry 7.1.0 - Retry logic for failed requests
## Configuration Files
- `next.config.ts` - Next.js configuration with next-intl plugin
- `tsconfig.json` - TypeScript configuration
- `postcss.config.mjs` - PostCSS for Tailwind CSS
- `eslint.config.mjs` - ESLint configuration
- `@/*` maps to `./src/*`
## Platform Requirements
- Node.js >=20.9.0
- Yarn 1.22.22
- Static export mode (default) for CDN deployment
- Standalone mode for Docker containerization
- Environment variable: `NEXT_PUBLIC_USE_LOCAL_API` for API routing
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## TypeScript Configuration
- `"strict": true` in `tsconfig.json`
- All strict flags active including `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`
## ESLint Configuration
- `eslint-config-next/core-web-vitals` - Next.js core web vitals rules
- `eslint-config-next/typescript` - TypeScript-specific rules
## Path Aliases
## React Patterns
- Default exports for page components
- Named exports for hooks and utilities
- Props interfaces defined inline or in separate `types` module
## Ant Design Integration
- `antd` v6.1.3 - UI component library
- `@ant-design/nextjs-registry` v1.3.0 - Next.js integration
- `@ant-design/icons` - Icon library
## File Naming Conventions
## Import Organization
## State Management
## Error Handling
## Next.js Patterns
- `src/app/layout.tsx` - Root layout
- `src/app/page.tsx` - Root page (redirects to locale)
- `src/app/[locale]/page.tsx` - Localized pages
- `src/app/[locale]/layout.tsx` - Locale-specific layout
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- Dynamic `[locale]` route for internationalization
- Client-side translation UI with server-rendered layouts
- Service-oriented translation architecture with multiple API providers
- IndexedDB caching for translation results
## Layers
- Purpose: User interface and interaction handling
- Location: `src/app/[locale]/MDTranslator.tsx`, `src/app/components/`
- Contains: React components, Ant Design UI elements
- Depends on: Hooks, translation services
- Used by: Next.js page rendering
- Purpose: Centralized state management for translation workflow
- Location: `src/app/hooks/useTranslateData.tsx`, `src/app/hooks/translation/`
- Contains: `useTranslateData` hook providing all translation state and logic
- Depends on: Translation services, IndexedDB storage
- Used by: UI components via TranslationContext
- Purpose: API communication with translation providers
- Location: `src/app/lib/translation/services/shared.ts`, `llm.ts`, `traditional.ts`
- Contains: Service implementations for DeepL, Google, OpenAI, DeepSeek, Gemini, etc.
- Depends on: External translation APIs
- Used by: Hooks layer
- Purpose: Persistent caching of translation results
- Location: `src/app/lib/storage/indexedDBStorage.ts`
- Contains: IndexedDB wrapper using `idb` library
- Used by: Translation service via cache module
- Purpose: Application internationalization
- Location: `src/i18n/routing.ts`, `request.ts`, `navigation.ts`
- Contains: next-intl routing configuration, locale handling
- Used by: All pages and components via NextIntlClientProvider
- Purpose: Server-side proxy for translation APIs
- Location: `src/app/api/deepl/route.ts`
- Contains: Next.js API routes for CORS bypass and API key handling
- Used by: Client-side translation services
## Data Flow
```
```
```
```
## Key Abstractions
- Location: `src/app/lib/translation/types.ts`
- Pattern: Function signature `(params: TranslateTextParams) => Promise<string>`
- All translation services implement this interface
- Location: `src/app/components/TranslationContext.tsx`
- Pattern: React Context providing centralized state
- Wraps `useTranslateData()` hook
- Location: `src/app/lib/translation/index.ts`
- Pattern: Custom hook wrapping `translateText()` function
- Returns `{ translate }` for direct text translation
- Location: `src/app/lib/storage/indexedDBStorage.ts`
- Pattern: Singleton database connection with `idb` wrapper
- Database: `tools-by-ai`, Store: `translation-cache`
## Entry Points
- Location: `src/app/layout.tsx`
- Triggers: All page requests
- Responsibilities: Global providers setup (ThemesProvider, NextIntlClientProvider)
- Location: `src/app/[locale]/layout.tsx`
- Triggers: Requests to `/{locale}` paths
- Responsibilities: Locale-specific HTML rendering, direction (RTL/LTR), Navigation
- Location: `src/app/page.tsx`
- Triggers: Requests to `/`
- Responsibilities: Redirect to default locale
- Location: `src/app/[locale]/page.tsx`
- Triggers: Requests to `/{locale}`
- Responsibilities: Render MDTranslator via ClientPage
- Location: `src/app/[locale]/client.tsx`
- Triggers: Locale page render
- Responsibilities: Dynamic loading of TranslationSettings, tabs management
## Error Handling
- `p-retry` for automatic retry on failure
- `AbortController` for request cancellation
- Auth error detection triggers abort of all concurrent requests
- User-friendly error messages with localized hints
- Default retry count: 3
- Default timeout: 30 seconds
- Method-specific overrides via `getRetryConfig()`
## Cross-Cutting Concerns
- Framework: `next-intl`
- Configuration: `src/i18n/routing.ts` defines 18 supported locales
- Messages: JSON files in `messages/` directory
- Navigation: Wrappers in `src/i18n/navigation.ts`
- Framework: `next-themes` with Ant Design `ConfigProvider`
- Location: `src/app/ThemesProvider.tsx`
- Strategy: CSS class-based (`attribute="class"`)
- Default theme: dark
- RTL support: `rtl-detect` for direction
- Strategy: IndexedDB with content-based key
- Key generation: MD5 hash via `spark-md5`
- No expiration (unlimited capacity)
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
