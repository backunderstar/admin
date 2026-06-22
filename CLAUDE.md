# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

This project uses **Vite+** (`vp` CLI) — a unified toolchain built on Vite, Rolldown, Oxlint, and Oxfmt. Run `vp help` for available commands. Docs: `node_modules/vite-plus/docs` or https://viteplus.dev/guide/.

# Project Overview

A Vue 3 admin dashboard built with TypeScript, Arco Design, and a Vite+ toolchain. Features dynamic routing, multi-tab navigation, customizable layouts (4 menu layouts, 3 theme modes), i18n (zh/en), and dual permission modes (frontend/backend).

**Stack:** Vue 3 (beta/Vapor mode) + TypeScript + Arco Design Vue + Pinia + Vue Router v5 + vue-i18n + TailwindCSS v4 + Axios + Iconify + @vueuse/core + mitt + nprogress + md-editor-v3

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
│   └── system-manage.ts # User/Role CRUD, getMenuList
├── config/              # Global app configuration
│   ├── index.ts         # SystemConfig: themes, menu layouts, colors, fast-enter
│   ├── setting.ts       # Default setting values (SETTING_DEFAULT_CONFIG)
│   └── modules/         # Modular config: fastEnter, headerBar, festival, component
├── enums/               # TypeScript enums (appEnum, formEnum)
├── hooks/               # Composable functions (Vue Composition API)
│   └── core/            # useAuth, useTheme, useAppMode, useTable, useChart, etc.
├── locales/             # vue-i18n (zh, en JSON files)
├── router/              # All routing logic
│   ├── core/            # RouteRegistry, ComponentLoader, RouteValidator, RouteTransformer,
│   │                    # MenuProcessor, RoutePermissionValidator, IframeRouteManager
│   ├── guards/          # beforeEach (main auth/permission logic), afterEach
│   ├── modules/         # Feature routes: dashboard, system, content, exception
│   ├── routes/          # staticRoutes (public), asyncRoutes (permission-based)
│   └── index.ts         # createRouter + initRouter(app)
├── store/               # Pinia stores with persisted state
│   └── modules/         # user (auth/perms), setting (layout/theme), menu, worktab, table
├── types/               # Global TypeScript types by subdirectory (api, router, store, config, etc.)
├── utils/               # Utilities organized by concern
│   ├── http/            # Axios wrapper with interceptors, retry, 401 debounce
│   ├── storage/         # Versioned localStorage keys with auto-migration
│   ├── navigation/      # Route helpers, worktab management, jump utilities
│   ├── socket/          # WebSocket client (singleton, heartbeat, exp backoff reconnect)
│   ├── ui/              # Loading, tabs, iconify loader, colors, animation
│   ├── form/            # Form validators + responsive layout utilities
│   └── table/           # Table configuration utilities
└── views/               # Page components (dashboard, content, system, exception, LoginView, Iframe)

mock/                    # Local mock data (vite-plugin-mock in development only)
doc/                     # Chinese-language design docs (routing, permissions, theme)
```

## Entry Flow

`src/main.ts` → creates Vue app → `initStore(app)` (Pinia + persisted state) → `initializeTheme()` (applies saved or system theme) → `initRouter(app)` (creates router, sets up beforeEach/afterEach guards) → `setupErrorHandle(app)` → `app.use(language)` (vue-i18n) → `app.mount('#app')`

## Layout Architecture

The layout shell is `src/views/index.vue` (routes resolve to it via `ComponentLoader.loadLayout()`). It renders the **sidebar** (left/dual-column menu variants), **header bar** (breadcrumb, search, notifications, user dropdown), **work-tab bar** (multi-tab navigation), **page content** (router-view with keep-alive), and **global overlays** (settings panel, search, screen lock, chat window, fireworks).

Menu layout is controlled by `settingStore.menuType` (MenuTypeEnum):

- `LEFT` — sidebar on the left, content on the right
- `TOP` — horizontal menu bar at the top
- `TOP_LEFT` (mixed) — horizontal top bar + sidebar for sub-menus
- `DUAL_MENU` — dual-column sidebar (left: first-level icons, right: sub-menu tree)

Menu components live in `src/components/layouts/zhao-menus/`: `zhao-horizontal-menu`, `zhao-mixed-menu`. The sidebar with standard/dual-column modes is inlined in `views/index.vue`.

Global overlay components are registered in `src/config/modules/component.ts` via `defineAsyncComponent`: settings panel, global search, screen lock, chat window, fireworks effect.

## Routing Architecture

The most complex subsystem. Routes are split into **static** (always accessible, e.g., `/login`) and **dynamic** (permission-based).

**Dynamic Route Flow:**

1. `beforeEach` guard checks login → fetches user info (`fetchGetUserInfo`)
2. `MenuProcessor.getMenuList()` gets menu tree (from backend API or local config depending on mode)
3. `RouteRegistry.register(menuList)` validates, transforms (via `RouteTransformer` + `ComponentLoader`) and adds routes to the Vue Router instance
4. `RoutePermissionValidator.validatePath()` checks if user can access the target route
5. Uses `import.meta.env.VITE_ACCESS_MODE` — `'frontend'` (permissions from route config) or `'backend'` (permissions from API response)

**Route Modules** (`src/router/modules/`): Each feature area defines its routes as `AppRouteRecord` objects (e.g., `dashboardRoutes`, `systemRoutes`, `articleRoutes`). Routes use string component paths (e.g., `/dashboard/console`) resolved by `ComponentLoader` — NOT direct imports. `ComponentLoader` uses `import.meta.glob` over `src/views/` and resolves paths by trying both `{path}.vue` and `{path}/index.vue`.

## Key Patterns

- **Permission Mode**: Dual-mode auth. Frontend mode checks `userStore.info.value.buttons` array. Backend mode checks `route.meta.authList` auth marks. Both unified behind `useAuth().hasAuth(authMark)`.
- **Persisted State**: Uses `pinia-plugin-persistedstate` with versioned keys (format: `sys-v{version}-{storeId}`). `StorageKeyManager` auto-migrates old-format data to the current version.
- **Multi-Tab (Worktab)**: `useWorktabStore` tracks open tabs, routes auto-register via `setWorktab()` in the guard. Supports fixed tabs, iframe tabs, keep-alive, and tab validation on route init.
- **WebSocket**: Custom singleton class with heartbeat, message queue for pre-connect buffering, exponential backoff reconnection (up to 10 attempts), and ping/pong keepalive.
- **Menu Layouts**: 4 types (left, top, mixed, dual-column) controlled by `MenuTypeEnum`. Configured via `settingStore.menuType`.
- **Theme System**: 3 modes (light, dark, system-auto). Menu has 3 themes (design, light, dark). Customizable accent color from `systemMainColor` palette. Migrated from Element Plus to Arco Design.
- **useTable Hook**: Enterprise-grade table composable (`src/hooks/core/useTable.ts`) with auto-pagination, smart debounce, 5 refresh strategies (create/update/delete/manual/soft), request cancellation, and optional configurable cache with 4 invalidation strategies.
- **useChart Hook**: ECharts lifecycle composable (`src/hooks/core/useChart.ts`) with auto theme-adapt, resize-on-menu-toggle, lazy init via IntersectionObserver, empty state, and unified style helpers (axis, tooltip, legend).
- **useCeremony Hook**: Festival/celebration composable — detects holiday dates and controls firework animations and festive text display. Holiday data in `src/config/modules/festival.ts`.
- **useAppMode Hook**: Reads `VITE_ACCESS_MODE` env var to determine `'frontend'` vs `'backend'` permission mode — used by `MenuProcessor.getMenuList()` and `useAuth.hasAuth()`.
- **useCommon Hook**: Provides `homePath`, `refresh()` (page reload via setting store), scroll-to-top utilities.
- **useHeaderBar Hook**: Manages header bar feature visibility (menu button, refresh, fast-enter, breadcrumbs, language switcher). Reads from `headerBarConfig` and `settingStore`.
- **useFastEnter Hook**: Quick-application launcher from the config-based fast-enter module.
- **useTableStore**: Pinia store (`src/store/modules/table.ts`) persisting table display preferences (size, zebra stripes, borders, header background, fullscreen) to localStorage.
- **ProTable Component** (`src/components/ProTable/`): Reusable wrapper around `<a-table>` integrating search bar, pagination, add/delete actions, and Arco Design slot conventions. Accepts `searchFields` and `searchModel` for declarative search forms.
- **SlideVerify**: Slide puzzle CAPTCHA component at `src/components/SlideVerify.vue`.

## Mock System

Local development uses `vite-plugin-mock` (enabled only in development mode in `vite.config.ts`). All mock handlers live in `mock/`:

- `_mockData.ts` — centralized static data (25 users, 5 roles, 3 credentials). All data is hand-written, not random-generated.
- `login.ts`, `user.ts`, `role.ts`, `menu.ts`, `content.ts` — mock API handlers
- `util.ts` — shared mock utilities (response wrappers, pagination helpers)

Credentials for the mock login: Super/Admin/User (all with password `123456`). Super and Admin share an admin-level token; User gets a restricted token.

## Config System Architecture

The config layer (`src/config/`) is modular:

- `index.ts` — `appConfig` object (frozen): systemInfo, theme styles, layout lists, color palettes, delegates to module configs
- `setting.ts` — `SETTING_DEFAULT_CONFIG`: default values for all setting store fields
- `modules/fastEnter.ts` — quick-application definitions (apps, links)
- `modules/headerBar.ts` — header bar feature switches and layout
- `modules/festival.ts` — holiday detection dates for celebration effects
- `modules/component.ts` — async global component registration (settings panel, global search, screen lock, chat, fireworks)

## Types Structure

`src/types/` is organized by domain subdirectory:

- `api/` — API request/response types (namespaced under `Api.*`)
- `router/` — `AppRouteRecord`, route meta interfaces
- `store/` — store state interfaces
- `config/` — `SystemConfig`, header bar, fast-enter types
- `common/` — shared utility types
- `component/` — component prop/emits types
- `directive/` — custom directive type augmentation

## API Layer

API functions in `src/api/` return typed Axios responses. The `request` instance (`src/utils/http/index.ts`) supports optional per-call flags:

- `showSuccessMessage` / `showErrorMessage` — toggle toast messages
- Uses `VITE_WITH_CREDENTIALS` for cookie-based auth
- Error interceptor in `src/utils/http/error.ts` handles 401 refresh logic

## Icons

All icons use Iconify via `@tomjs/vite-plugin-iconify`. Icon names are Iconify identifiers (e.g., `ri:admin-line`, `ri:menu-fold-line`). The `ZhaoIcon` component (`src/components/icons/ZhaoIcon.vue`) wraps `<icon-icon>` with consistent sizing.

## CSS & Styling

- **TailwindCSS v4** — configured via `@import 'tailwindcss'` in `src/assets/main.css` (no tailwind.config.js needed)
- **Arco Design** — CSS variables (`--color-bg-*`, `--color-text-*`, `--color-fill-*`, `--color-border`) used throughout for theme-aware styling
- **Custom border-radius** — overrides Arco's radius variables via `--custom-radius` CSS custom property
- **Dark mode** — toggled by `.dark` class on `<html>`, sets `--default-box-color` for custom card backgrounds
- **Scrollbar** — utility class `scrollbar-none` for custom scroll areas

## Code Style

- **Formatting:** No semicolons, single quotes (enforced by Oxfmt via `vp fmt`)
- **Linting:** Oxlint with `vite-plus/prefer-vite-plus-imports` rule — use `vite-plus` imports instead of raw `vite` when available
- **Comments:** JSDoc-style block comments with `@module` and `@author` tags preferred

## Path Aliases

`@` → `src/`, `@asset` → `src/assets/`, `@imgs` → `src/assets/images/`, `@views` → `src/views/`, `@components` → `src/components/`, `@hooks` → `src/hooks/`, `@utils` → `src/utils/`, `@stores` → `src/store/`, `@router` → `src/router/`

**Note:** `vite.config.ts` maps `@stores` to `./src/stores` (with 's'), but `tsconfig.app.json` and the actual directory both use `src/store` (no 's'). This works at dev time because Vite resolves both, but be aware of the mismatch.

## Environment Variables

| Variable                | Purpose                                                   |
| ----------------------- | --------------------------------------------------------- |
| `VITE_API_URL`          | API base URL for axios                                    |
| `VITE_API_PROXY_URL`    | Dev proxy target for `/api`                               |
| `VITE_BASE_URL`         | App deployment base path                                  |
| `VITE_PORT`             | Dev server port (default 3006, override 5173)             |
| `VITE_VERSION`          | App version (accessible as `__APP_VERSION__`)             |
| `VITE_DROP_CONSOLE`     | Drop console.log in production                            |
| `VITE_ACCESS_MODE`      | `'frontend'` or `'backend'` — determines permission model |
| `VITE_WITH_CREDENTIALS` | axios `withCredentials` flag                              |
| `VITE_OPEN_ROUTE_INFO`  | Enable route info logging in console                      |
| `VITE_LOCK_ENCRYPT_KEY` | Encryption key for screen lock PIN storage                |

## Route Meta Properties

Routes use `AppRouteRecord.meta` with these key properties: `title` (i18n key), `icon` (Iconify icon name), `keepAlive`, `isHide` (hide from menu), `isHideTab` (hide from worktab), `fixedTab` (non-closable tab), `roles` (role permissions), `authList` (backend permission marks), `link` (external URL), `isIframe`, `isFullPage`, `activePath`.

## Plugins & Dev Tools

- **Vue DevTools** — `vite-plugin-vue-devtools` enabled in dev
- **Arco Plugin** — `@arco-plugins/vite-vue` auto-imports Arco styles
- **Iconify** — `@tomjs/vite-plugin-iconify` with `local: true` bundles all icon sets
- **Mock** — `vite-plugin-mock` only in development mode

## Documentation

Chinese-language design docs are in `doc/`: routing implementation (`路由实现.md`), permission system (`权限系统.md`), theme system (`主题系统.md`), also docs in English for the same topics.
