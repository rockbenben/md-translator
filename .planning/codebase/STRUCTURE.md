# Codebase Structure

**Analysis Date:** 2026-03-28

## Directory Layout

```
md-translator/
├── .github/                    # GitHub workflows
│   └── workflows/
│       └── docker.yml         # Docker CI/CD pipeline
├── .planning/                  # GSD planning directory
│   └── codebase/               # Codebase documentation
├── messages/                   # i18n translation files
├── public/                     # Static assets
├── scripts/                    # Build scripts
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── [locale]/           # Dynamic locale route
│   │   ├── api/                # API route handlers
│   │   ├── components/         # Shared UI components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── lib/                # Core libraries
│   │   ├── types/              # TypeScript type definitions
│   │   ├── ui/                # UI subcomponents
│   │   └── utils/             # Utility functions
│   ├── i18n/                   # Internationalization setup
│   └── proxy.ts               # Proxy configuration
├── eslint.config.mjs           # ESLint configuration
├── next.config.ts              # Next.js configuration
├── package.json               # Dependencies
├── postcss.config.mjs         # PostCSS configuration
├── tailwind.config.ts         # Tailwind CSS configuration
└── tsconfig.json              # TypeScript configuration
```

## Directory Purposes

**`src/app/[locale]/`:**
- Purpose: Dynamic locale-specific pages
- Contains: `page.tsx`, `layout.tsx`, `client.tsx`, `MDTranslator.tsx`, `markdownUtils.ts`
- Key files: `MDTranslator.tsx` - Main translation UI component

**`src/app/api/`:**
- Purpose: Server-side API routes for proxy and CORS handling
- Contains: `deepl/route.ts` - DeepL proxy endpoint
- Key files: `deepl/route.ts` - Proxies DeepL API to bypass CORS

**`src/app/components/`:**
- Purpose: Shared UI components for translation UI
- Contains: `TranslationContext.tsx`, `TranslationSettings.tsx`, `ResultCard.tsx`, `LanguageSelector.tsx`, `TranslationAPISelector.tsx`, `TranslationProgressModal.tsx`, `MultiLanguageSettingsModal.tsx`, `AdvancedTranslationSettings.tsx`, `languages.tsx`, `projects.tsx`
- Key files: `TranslationContext.tsx` - React context provider

**`src/app/hooks/`:**
- Purpose: Custom React hooks
- Contains: `useTranslateData.tsx`, `useFileUpload.ts`, `useTextStats.ts`, `useLocalStorage.ts`, `useCopyToClipboard.tsx`, `useExportFilename.ts`
- Subdirectory: `translation/` - Translation-specific hooks
- Key files: `useTranslateData.tsx` - Central translation state management

**`src/app/lib/translation/`:**
- Purpose: Core translation logic and services
- Contains:
  - `services/` - Translation API implementations
  - `cache.ts` - Translation caching logic
  - `config.ts` - Default configurations
  - `types.ts` - TypeScript interfaces
  - `languages-data.ts` - Language definitions
  - `utils.ts` - Helper functions
- Key files: `services/` - All translation service implementations

**`src/app/lib/storage/`:**
- Purpose: IndexedDB storage abstraction
- Contains: `indexedDBStorage.ts`
- Key files: `indexedDBStorage.ts` - Uses `idb` library

**`src/app/utils/`:**
- Purpose: General utility functions
- Contains: `textUtils.ts`, `fileUtils.ts`, `localeUtils.ts`, `localStorageUtils.ts`, `regex.ts`, `fileTypes.ts`, `errorUtils.ts`, `index.ts`
- Key files: `fileUtils.ts` - File handling utilities

**`src/i18n/`:**
- Purpose: Internationalization configuration
- Contains: `routing.ts`, `request.ts`, `navigation.ts`
- Key files: `routing.ts` - Locale definitions and routing

**`src/app/ui/`:**
- Purpose: Reusable UI subcomponents
- Contains: `navigation/` - Navigation components

**`src/app/types/`:**
- Purpose: TypeScript type definitions
- Contains: `json.ts`, `index.ts`

**`messages/`:**
- Purpose: i18n translation message files
- Contains: 16 language JSON files (en, zh, zh-hant, es, pt, fr, de, ja, ko, ru, vi, th, tr, ar, hi, id, it, bn)
- Format: next-intl message format

## Key File Locations

**Entry Points:**
- `src/app/page.tsx` - Root redirect to default locale
- `src/app/[locale]/page.tsx` - Locale page (metadata generation)
- `src/app/[locale]/client.tsx` - Client-side page component with tabs

**Configuration:**
- `src/i18n/routing.ts` - i18n routing config
- `src/i18n/request.ts` - Request configuration
- `src/app/lib/translation/config.ts` - Translation defaults
- `src/app/ThemesProvider.tsx` - Theme configuration

**Core Logic:**
- `src/app/[locale]/MDTranslator.tsx` - Main translation UI (673 lines)
- `src/app/hooks/useTranslateData.tsx` - Translation state management (738 lines)
- `src/app/lib/translation/index.ts` - Translation module entry
- `src/app/lib/translation/services/` - All translation services

**Storage:**
- `src/app/lib/storage/indexedDBStorage.ts` - IndexedDB operations
- `src/app/lib/translation/cache.ts` - Cache key generation and lookup

**Hooks:**
- `src/app/hooks/useTranslateData.tsx` - Main translation hook
- `src/app/hooks/useFileUpload.ts` - File upload handling
- `src/app/hooks/useTextStats.ts` - Text statistics
- `src/app/hooks/translation/settings.ts` - Settings import/export

## Naming Conventions

**Files:**
- React components: PascalCase (e.g., `MDTranslator.tsx`, `ResultCard.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useTranslateData.tsx`)
- Services: camelCase or lowercase with API name (e.g., `llm.ts`, `traditional.ts`)
- Utilities: camelCase (e.g., `textUtils.ts`, `fileUtils.ts`)
- Configuration: camelCase (e.g., `routing.ts`)

**Directories:**
- Components: lowercase or kebab-case (e.g., `components/`, `ui/navigation/`)
- Services: `services/` subdirectory
- Hooks: `hooks/` with `translation/` subdirectory

## Where to Add New Code

**New Translation Service:**
- Primary code: `src/app/lib/translation/services/` (add to `llm.ts` or `traditional.ts` or new file)
- Export: `src/app/lib/translation/services/index.ts`
- Type: `src/app/lib/translation/types.ts` (if new interface needed)

**New UI Component:**
- Implementation: `src/app/components/` (shared) or `src/app/[locale]/` (locale-specific)
- For locale-specific: `src/app/[locale]/MDTranslator.tsx` or create new file

**New Hook:**
- Implementation: `src/app/hooks/`
- Translation-related: `src/app/hooks/translation/`

**New Utility:**
- Implementation: `src/app/utils/`
- Export: `src/app/utils/index.ts`

**New API Route:**
- Implementation: `src/app/api/[service]/route.ts`
- Structure follows Next.js App Router conventions

**New Language Support:**
- Messages: Add to `messages/[locale].json`
- Routing: Add locale to `src/i18n/routing.ts` `locales` array
- Language data: Update `src/app/lib/translation/languages-data.ts`

## Special Directories

**`messages/`:**
- Purpose: i18n translation JSON files
- Generated: No
- Committed: Yes
- Format: next-intl message format with nested keys

**`.planning/`:**
- Purpose: GSD workflow planning artifacts
- Generated: Yes (by GSD commands)
- Committed: Yes (to git)

**`public/`:**
- Purpose: Static assets (logo, icons)
- Generated: No
- Committed: Yes

---

*Structure analysis: 2026-03-28*
