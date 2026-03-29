# Technology Stack

**Analysis Date:** 2026-03-28

## Languages

**Primary:**
- TypeScript 5 - Primary development language for all application code
- JavaScript - Configuration files and build scripts

## Runtime

**Environment:**
- Node.js >=20.9.0
- Next.js 16.1.1 (App Router)

**Package Manager:**
- Yarn 1.22.22
- Lockfile: `yarn.lock`

## Frameworks

**Core:**
- Next.js 16.1.1 - Full-stack React framework with App Router
  - Config: `next.config.ts`
  - Output mode: standalone (Docker) or static export (production)

**UI Components:**
- Ant Design 6.1.3 - UI component library
  - Package: `antd`
  - Integration: `@ant-design/nextjs-registry` for SSR support
- Tailwind CSS 4 - Utility-first CSS framework
  - Config: `@tailwindcss/postcss`
  - PostCSS config: `postcss.config.mjs`

**Internationalization:**
- next-intl 4.7.0 - Internationalization framework for Next.js
  - Plugin: `createNextIntlPlugin()` in `next.config.ts`
  - i18n routing enabled

**State Management:**
- React hooks pattern (useState, useCallback, useMemo, useRef)
- next-themes 0.4.6 - Theme management

**Build:**
- React Compiler (babel-plugin-react-compiler 1.0.0)
  - Enabled in `next.config.ts`: `reactCompiler: true`

## Key Dependencies

**Translation Processing:**
- compromise 14.14.5 - NLP library for text processing
- jschardet 3.1.4 - Character encoding detection
- rtl-detect 1.1.2 - RTL (right-to-left) language detection

**File Handling:**
- file-saver 2.0.5 - Client-side file saving/downloading
- spark-md5 3.0.2 - MD5 hashing for caching keys

**Storage:**
- idb 8.0.3 - IndexedDB wrapper for translation caching
  - Implementation: `src/app/lib/storage/indexedDBStorage.ts`

**Translation APIs:**
- deepl-node 1.24.0 - DeepL API client

**Concurrency:**
- p-limit 7.2.0 - Promise concurrency limiting
- p-retry 7.1.0 - Retry logic for failed requests

## Configuration Files

**Build Configuration:**
- `next.config.ts` - Next.js configuration with next-intl plugin
- `tsconfig.json` - TypeScript configuration
- `postcss.config.mjs` - PostCSS for Tailwind CSS
- `eslint.config.mjs` - ESLint configuration

**Path Aliases:**
- `@/*` maps to `./src/*`

## Platform Requirements

**Development:**
- Node.js >=20.9.0
- Yarn 1.22.22

**Production:**
- Static export mode (default) for CDN deployment
- Standalone mode for Docker containerization
- Environment variable: `NEXT_PUBLIC_USE_LOCAL_API` for API routing

---

*Stack analysis: 2026-03-28*
