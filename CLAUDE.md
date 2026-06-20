# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

This project uses **Vite+** (`vp` CLI) — a unified toolchain built on Vite, Rolldown, Oxlint, and Oxfmt. Run `vp help` for available commands. Docs: `node_modules/vite-plus/docs` or https://viteplus.dev/guide/.

# Project Overview

A Vue 3 admin dashboard built with TypeScript, Arco Design, and a Vite+ toolchain. Features dynamic routing, multi-tab navigation, customizable layouts (4 menu layouts, 3 theme modes), i18n (zh/en), and dual permission modes (frontend/backend).

**Stack:** Vue 3 (beta/Vapor mode) + TypeScript + Arco Design Vue + Pinia + Vue Router v5 + vue-i18n + TailwindCSS v4 + Axios + Iconify

# Commands

```sh
# Development
pnpm dev              # Start dev server (vp dev) — default: port 5173, opens browser, proxies /api

# Build & preview
pnpm build            # Type-check + build (runs vue-tsc --build then vp build)
pnpm build-only       # Build only (skip type-check)
pnpm preview          # Preview production build

# Code quality
pnpm format           # Format src/ via Oxfmt (vp fmt src/)
vp check              # Full check: lint, type-check, format check
vp check --fix        # Fix auto-fixable issues (also runs as pre-commit hook on staged files)

# Other
vp install            # Install dependencies (or: pnpm install)
vp env doctor         # Diagnose setup/runtime issues
```

**Node requirement:** `^20.19.0 || >=22.12.0` (pnpm 11.7.0)

**Pre-commit hook:** `.vite-hooks/pre-commit` runs `vp staged` — auto-fixes lint/format on staged files before each commit.

**Testing:** No test framework (vitest) is currently configured. `vp test` is a no-op.

# Code Architecture

## Structure

```
src/
├── api/                 # API call functions (one file per domain)
│   ├── auth.ts          # Login, getUserInfo
│   └── system-manage.ts
├── config/              # Global app configuration (themes, layouts, defaults)
│   ├── index.ts         # SystemConfig: themes, menu layouts, colors, fast-enter
│   └── setting.ts       # Default setting values (SETTING_DEFAULT_CONFIG)
├── enums/               # TypeScript enums (appEnum, formEnum)
├── hooks/               # Composable functions (Vue Composition API)
│   └── core/            # useAuth, useTheme, useAppMode, useTable, useChart, etc.
├── locales/             # vue-i18n (zh, en JSON files)
├── router/              # All routing logic — the most architecturally complex part
│   ├── core/            # RouteRegistry, ComponentLoader, RouteValidator, RouteTransformer,
│   │                    # MenuProcessor, RoutePermissionValidator, IframeRouteManager
│   ├── guards/          # beforeEach (main auth/permission logic), afterEach
│   ├── modules/         # Feature route definitions per domain (dashboard, system, article, etc.)
│   ├── routes/          # staticRoutes (public), asyncRoutes (permission-based)
│   └── index.ts         # createRouter + initRouter(app)
├── store/               # Pinia stores with persisted state
│   └── modules/         # user, setting, menu, worktab, table
├── types/               # Global TypeScript types (router, store, config, api, component, common)
├── utils/               # Utilities organized by concern
│   ├── http/            # Axios wrapper with interceptors, retry, 401 debounce
│   ├── storage/         # Versioned localStorage keys with auto-migration (StorageKeyManager)
│   ├── navigation/      # Route helpers, worktab management, jump utilities
│   ├── socket/          # WebSocket client (singleton, heartbeat, exponential backoff reconnect)
│   ├── ui/              # Loading, tabs, iconify loader, colors, animation
│   └── table/           # Table configuration utilities
└── views/               # Page components
```

## Entry Flow

`src/main.ts` → creates Vue app → `initStore(app)` (Pinia + persisted state) → `initializeTheme()` (applies saved or system theme) → `initRouter(app)` (creates router, sets up beforeEach/afterEach guards) → `setupErrorHandle(app)` → `app.use(language)` (vue-i18n) → `app.mount('#app')`

## Routing Architecture

The most complex subsystem. Routes are split into **static** (always accessible, e.g., `/login`) and **dynamic** (permission-based).

**Dynamic Route Flow:**

1. `beforeEach` guard checks login → fetches user info (`fetchGetUserInfo`)
2. `MenuProcessor.getMenuList()` gets menu tree (from backend API or local config depending on mode)
3. `RouteRegistry.register(menuList)` validates, transforms (via `RouteTransformer` + `ComponentLoader`) and adds routes to the Vue Router instance
4. `RoutePermissionValidator.validatePath()` checks if user can access the target route
5. Uses `import.meta.env.VITE_ACCESS_MODE` — `'frontend'` (permissions from route config) or `'backend'` (permissions from API response)

**Route Modules** (`src/router/modules/`): Each feature area defines its routes as `AppRouteRecord` objects (e.g., `dashboardRoutes`, `systemRoutes`, `articleRoutes`). Routes use string component paths (e.g., `/dashboard/console`) resolved by `ComponentLoader` — NOT direct imports.

## Key Patterns

- **Permission Mode**: Dual-mode auth. Frontend mode checks `userStore.info.value.buttons` array. Backend mode checks `route.meta.authList` auth marks. Both unified behind `useAuth().hasAuth(authMark)`.
- **Persisted State**: Uses `pinia-plugin-persistedstate` with versioned keys (format: `sys-v{version}-{storeId}`). `StorageKeyManager` auto-migrates old-format data to the current version.
- **Multi-Tab (Worktab)**: `useWorktabStore` tracks open tabs, routes auto-register via `setWorktab()` in the guard. Supports fixed tabs, iframe tabs, keep-alive, and tab validation on route init.
- **WebSocket**: Custom singleton class with heartbeat, message queue for pre-connect buffering, exponential backoff reconnection (up to 10 attempts), and ping/pong keepalive.
- **Menu Layouts**: 4 types (left, top, mixed, dual-column) controlled by `MenuTypeEnum`. Configured via `settingStore.menuType`.
- **Theme System**: 3 modes (light, dark, system-auto). Menu has 3 themes (design, light, dark). Customizable accent color from `systemMainColor` palette.

## Code Style

- **Formatting:** No semicolons, single quotes (enforced by Oxfmt via `vp fmt`)
- **Linting:** Oxlint with `vite-plus/prefer-vite-plus-imports` rule — use `vite-plus` imports instead of raw `vite` when available

## Path Aliases

`@` → `src/`, `@asset` → `src/assets/`, `@imgs` → `src/assets/images/`, `@views` → `src/views/`, `@components` → `src/components/`, `@hooks` → `src/hooks/`, `@utils` → `src/utils/`, `@stores` → `src/store/`, `@router` → `src/router/`

**Note:** `vite.config.ts` maps `@stores` to `./src/stores` (with 's'), but `tsconfig.app.json` and the actual directory both use `src/store` (no 's'). This works at dev time because Vite resolves both, but be aware of the mismatch.

## Environment Variables

| Variable                | Purpose                                                   |
| ----------------------- | --------------------------------------------------------- |
| `VITE_API_URL`          | API base URL for axios                                    |
| `VITE_API_PROXY_URL`    | Dev proxy target for `/api`                               |
| `VITE_BASE_URL`         | App deployment base path                                  |
| `VITE_PORT`             | Dev server port                                           |
| `VITE_VERSION`          | App version (accessible as `__APP_VERSION__`)             |
| `VITE_DROP_CONSOLE`     | Drop console.log in production                            |
| `VITE_ACCESS_MODE`      | `'frontend'` or `'backend'` — determines permission model |
| `VITE_WITH_CREDENTIALS` | axios `withCredentials` flag                              |

## Route Meta Properties

Routes use `AppRouteRecord.meta` with these key properties: `title` (i18n key), `icon` (Iconify icon name), `keepAlive`, `isHide` (hide from menu), `isHideTab` (hide from worktab), `fixedTab` (non-closable tab), `roles` (role permissions), `authList` (backend permission marks), `link` (external URL), `isIframe`, `isFullPage`, `activePath`.

## Documentation

Chinese-language design docs are in `doc/`: routing implementation (`路由实现.md`), permission system (`权限系统.md`), theme system (`主题系统.md`).
