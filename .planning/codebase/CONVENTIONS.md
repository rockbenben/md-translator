# Coding Conventions

**Analysis Date:** 2026-03-28

## TypeScript Configuration

**Strict Mode:** Enabled
- `"strict": true` in `tsconfig.json`
- All strict flags active including `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`

**JSX Transform:** React 19 with `react-jsx`
```json
"jsx": "react-jsx"
```

**Module Resolution:** Bundler-based
```json
"moduleResolution": "bundler"
```

## ESLint Configuration

**Config File:** `eslint.config.mjs`

**Configurations Applied:**
- `eslint-config-next/core-web-vitals` - Next.js core web vitals rules
- `eslint-config-next/typescript` - TypeScript-specific rules

**Ignored Patterns:**
```javascript
globalIgnores([
  ".next/**",
  "out/**",
  "build/**",
  "next-env.d.ts",
])
```

**Lint Command:** `yarn lint` (runs `eslint`)

## Path Aliases

**Alias:** `@/*` maps to `./src/*`

```json
"paths": {
  "@/*": ["./src/*"]
}
```

**Usage Examples:**
```typescript
import { useTranslationContext } from "@/app/components/TranslationContext";
import { splitTextIntoLines } from "@/app/utils";
import { LLM_MODELS } from "@/app/lib/translation";
```

## React Patterns

**React Version:** 19.2.3

**Client Components:** Use `"use client"` directive at top of file
```typescript
"use client";

import React, { useState, useEffect } from "react";
```

**Component Structure:**
- Default exports for page components
- Named exports for hooks and utilities
- Props interfaces defined inline or in separate `types` module

**Context Pattern:**
```typescript
// src/app/components/TranslationContext.tsx
const TranslationContext = createContext<ReturnType<typeof useTranslateData> | null>(null);

export const TranslationProvider = ({ children }: { children: React.ReactNode }) => {
  const translateData = useTranslateData();
  return <TranslationContext.Provider value={translateData}>{children}</TranslationContext.Provider>;
};

export const useTranslationContext = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error("useTranslationContext must be used within a TranslationProvider");
  }
  return context;
};
```

## Ant Design Integration

**Packages:**
- `antd` v6.1.3 - UI component library
- `@ant-design/nextjs-registry` v1.3.0 - Next.js integration
- `@ant-design/icons` - Icon library

**Theme Provider Pattern:**
```typescript
// src/app/ThemesProvider.tsx
"use client";

import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { ConfigProvider, App, theme, Layout } from "antd";

function AntdConfigProvider({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();
  const algorithms = resolvedTheme === "light" ? [theme.defaultAlgorithm] : [theme.darkAlgorithm];

  return (
    <ConfigProvider
      theme={{
        hashed: false,
        algorithm: algorithms,
      }}>
      <App>
        <Layout style={{ minHeight: "100vh" }}>{children}</Layout>
      </App>
    </ConfigProvider>
  );
}
```

## File Naming Conventions

**Files:** PascalCase for components, camelCase for hooks/utilities
```
MDTranslator.tsx       (component)
TranslationContext.tsx  (component)
useTranslateData.tsx    (hook)
useLocalStorage.ts      (hook)
textUtils.ts            (utility)
```

**Directories:** kebab-case
```
app/hooks/
app/components/
app/utils/
app/lib/translation/
```

## Import Organization

**Order:**
1. React core imports (`react`)
2. Third-party imports (`antd`, `@ant-design/icons`, `next-intl`, etc.)
3. Path alias imports (`@/app/...`, `@/lib/...`)

**Example:**
```typescript
import React, { useState, useEffect } from "react";
import { Flex, Card, Button, Typography, Input, Upload, Form, Space, App, Tooltip, Spin } from "antd";
import { CopyOutlined, InboxOutlined, SettingOutlined } from "@ant-design/icons";
import { useTranslations } from "next-intl";
import { getLangDir } from "rtl-detect";
import { useCopyToClipboard } from "@/app/hooks/useCopyToClipboard";
import { splitTextIntoLines, downloadFile } from "@/app/utils";
```

## State Management

**Local State:** React `useState`
**Persistent State:** Custom `useLocalStorage` hook
**Global State:** React Context (TranslationContext)

## Error Handling

**Pattern:** Try-catch with typed errors
```typescript
try {
  // operation
} catch (error: unknown) {
  const messageText = [getErrorMessage(error), sourceOptions.find((o) => o.value === currentTargetLang)?.label || currentTargetLang, t("translationError")].join(" ");
  message.error(messageText, 60);
}
```

## Next.js Patterns

**App Router Structure:**
- `src/app/layout.tsx` - Root layout
- `src/app/page.tsx` - Root page (redirects to locale)
- `src/app/[locale]/page.tsx` - Localized pages
- `src/app/[locale]/layout.tsx` - Locale-specific layout

**i18n:** Using `next-intl` with `useTranslations` hook

---

*Convention analysis: 2026-03-28*
