# 权限管理系统实现解析

## 概述

本项目的权限管理系统采用 **双阶段路由注册** 架构，将路由分为静态路由和动态路由两部分。核心思路是：**先确保登录页等公共页面可访问，登录后再根据用户权限动态注册业务路由**。

权限控制支持两种模式（通过 `VITE_ACCESS_MODE` 环境变量切换）：

- **前端模式**（`frontend`）— 权限由前端路由配置中的 `roles` 字段控制，适合小型项目或演示环境
- **后端模式**（`backend`）— 权限由后端接口返回的菜单数据控制，适合企业级应用

---

## 一、整体架构

```
src/router/
├── core/                      # 路由核心模块
│   ├── ComponentLoader.ts     # 组件加载器（动态导入 views 下的 .vue）
│   ├── MenuProcessor.ts       # 菜单处理器（获取/过滤/规范化菜单）
│   ├── RouteRegistry.ts       # 路由注册器（注册/移除动态路由）
│   ├── RouteTransformer.ts    # 路由转换器（AppRouteRecord → RouteRecordRaw）
│   ├── RouteValidator.ts      # 路由验证器（校验配置合法性）
│   ├── RoutePermissionValidator.ts  # 权限验证器（检查路径是否有权限）
│   ├── IframeRouteManager.ts  # Iframe 路由管理器
│   └── index.ts               # 统一导出
├── guards/
│   ├── beforeEach.ts          # 全局前置守卫（核心逻辑）
│   └── afterEach.ts           # 全局后置守卫
├── modules/                   # 前端模式下的路由模块（按功能拆分）
│   ├── dashboard.ts
│   ├── system.ts
│   └── ...
├── routes/
│   ├── staticRoutes.ts        # 静态路由（登录页、404、500 等）
│   └── asyncRoutes.ts         # 动态路由入口（聚合所有 modules）
├── index.ts                   # 路由初始化
└── routesAlias.ts             # 路由别名常量
```

---

## 二、路由分类

### 2.1 静态路由

定义在 `src/router/routes/staticRoutes.ts`，包含登录页、异常页（404/500）、帮助页等**无需登录即可访问**的页面。这些路由在应用启动时立即注册，不受权限控制。

### 2.2 动态路由

定义在 `src/router/routes/asyncRoutes.ts`，包含所有需要权限的业务页面。这些路由**在用户登录后**，由路由守卫根据用户权限动态注册。

动态路由的来源取决于当前模式：

- **前端模式**：从 `src/router/modules/` 下的预定义路由配置中，根据用户角色过滤后使用
- **后端模式**：调用 `/api/v3/system/menus` 接口获取菜单数据

---

## 三、核心数据流

```
用户登录
    |
    ▼
路由守卫 (beforeEach)
    |
    ├─ 检查登录状态 → 未登录 → 跳转登录页
    |
    └─ 已登录且路由未初始化
         |
         ▼
    获取用户信息 (fetchGetUserInfo)
         |
         ▼
    获取菜单列表 (MenuProcessor.getMenuList)
         |
         ├─ 前端模式：从 asyncRoutes 中按角色过滤
         └─ 后端模式：调用 /api/v3/system/menus
         |
         ▼
    验证菜单数据 (RouteValidator.validate)
         |
         ▼
    转换路由配置 (RouteTransformer.transform)
         |
         ▼
    注册动态路由 (RouteRegistry.register)
         |
         ▼
    保存菜单到 Store (useMenuStore.setMenuList)
         |
         ▼
    验证目标路径权限 (RoutePermissionValidator.validatePath)
         |
         ▼
    重定向到目标页面
```

---

## 四、关键模块详解

### 4.1 路由守卫 — `beforeEach.ts`

这是整个权限系统的**入口和调度中心**。核心流程：

1. **检查登录状态** — 未登录且目标不是登录页/静态路由，跳转到 `/login?redirect=xxx`
2. **检查路由是否已初始化** — 通过 `RouteRegistry.isRegistered()` 判断
3. **首次访问时初始化**：
   - 调用 `fetchGetUserInfo()` 获取用户信息（角色、权限标识等）
   - 调用 `MenuProcessor.getMenuList()` 获取菜单
   - 调用 `RouteRegistry.register()` 注册动态路由
   - 保存菜单到 `useMenuStore`
4. **验证目标路径** — 调用 `RoutePermissionValidator.validatePath()` 检查用户是否有权限访问
5. **处理根路径** — 重定向到首页
6. **未匹配路由** — 跳转到 404 页面

关键保护机制：

- `routeInitFailed` 标记：初始化失败后不再重试，直接跳转 500 页，防止死循环
- `routeInitInProgress` 标记：防止快速连续导航时的并发请求
- `resetRouteInitState()`：登出时重置状态，允许重新登录后再次初始化

### 4.2 菜单处理器 — `MenuProcessor`

负责获取和处理菜单数据：

- **前端模式**：从 `asyncRoutes` 复制路由配置，按用户角色过滤
- **后端模式**：调用 API 获取菜单列表

无论哪种模式，都会执行以下处理：

1. **路径验证** — 检测非一级菜单是否错误使用了 `/` 开头的路径
2. **路径规范化** — 将相对路径拼接为完整路径（如 `dashboard/console` → `/dashboard/console`）
3. **空菜单过滤** — 剔除没有有效组件、没有子菜单、不是外链/iframe 的项
4. **默认重定向推导** — 为目录型菜单自动推导第一个可导航的子路由作为 `redirect`

### 4.3 路由转换器 — `RouteTransformer`

将 `AppRouteRecord`（菜单数据结构）转换为 Vue Router 的 `RouteRecordRaw`：

- **一级菜单**：用 Layout 组件包裹，子路由指向具体页面
- **普通路由**：直接加载对应组件
- **Iframe 路由**：加载 Iframe.vue 组件
- **目录菜单**（无 `component`）：仅作为容器，不加载页面组件

### 4.4 组件加载器 — `ComponentLoader`

使用 Vite 的 `import.meta.glob` 动态导入 `src/views/` 下的所有 `.vue` 文件：

```ts
this.modules = import.meta.glob('../../views/**/*.vue')
```

菜单配置中的 `component` 字段是**组件路径字符串**（如 `/dashboard/console`），`ComponentLoader` 将其映射到 `../../views/dashboard/console.vue` 或 `../../views/dashboard/console/index.vue`。

### 4.5 路由验证器 — `RouteValidator`

在注册路由前进行合法性检查：

- **重复路由名称检测**
- **组件配置检测** — 一级菜单必须指定 Layout，非一级菜单必须有 component 或子路由
- **嵌套 Layout 检测** — 只有一级菜单才能使用 Layout 组件

### 4.6 权限验证器 — `RoutePermissionValidator`

验证用户是否有权限访问某个路径：

- **精确匹配** — 路径完全匹配
- **前缀匹配** — 目标路径是某菜单路径的子路径
- **动态参数匹配** — 如 `/user/123` 匹配 `/user/:id`
- **无权限时** — 重定向到首页

---

## 五、数据结构

### 5.1 菜单项 — `AppRouteRecord`

```ts
interface AppRouteRecord {
  id?: number                         // 菜单 ID（后端返回时）
  path: string                        // 路由路径（相对路径，自动拼接）
  name: string                        // 路由名称（唯一，大写驼峰）
  component?: string                  // 组件路径（如 '/dashboard/console'）
  redirect?: string                   // 重定向路径
  meta: RouteMeta                     // 元数据
  children?: AppRouteRecord[]         // 子菜单
}
```

### 5.2 元数据 — `RouteMeta`

```ts
interface RouteMeta {
  title: string           // 菜单标题（支持 i18n key）
  icon?: string           // 图标（Remix Icon 格式）
  roles?: string[]        // 角色权限（前端模式过滤用）
  isHide?: boolean        // 是否在菜单中隐藏
  isHideTab?: boolean     // 是否在标签页中隐藏
  keepAlive?: boolean     // 是否缓存页面
  fixedTab?: boolean      // 是否固定标签页
  link?: string           // 外部链接
  isIframe?: boolean      // 是否 iframe 嵌入
  authList?: Array<{      // 按钮级权限
    title: string
    authMark: string
  }>
  authMark?: string       // 权限标识
  parentPath?: string     // 父级路径
}
```

---

## 六、权限控制模式对比

| 特性 | 前端模式 | 后端模式 |
|------|----------|----------|
| 菜单来源 | `src/router/modules/` 预定义 | API `/api/v3/system/menus` |
| 角色过滤 | 前端按 `meta.roles` 过滤 | 后端返回已过滤的数据 |
| 适用场景 | 演示、小型项目 | 企业级应用 |
| 灵活性 | 低（需改代码） | 高（可动态配置） |
| 环境变量 | `VITE_ACCESS_MODE=frontend` | `VITE_ACCESS_MODE=backend` |

---

## 七、登出清理流程

```
用户登出 (userStore.logOut)
    |
    ├─ 清空用户信息、令牌、锁屏状态
    |
    ├─ 调用 resetRouterState(500)
    |   ├─ RouteRegistry.unregister() → 移除所有动态路由
    |   ├─ IframeRouteManager.clear() → 清理 iframe 路由缓存
    |   ├─ MenuStore.removeAllDynamicRoutes() → 执行所有移除函数
    |   └─ MenuStore.setMenuList([]) → 清空菜单列表
    |
    └─ 跳转到登录页（携带 redirect 参数）
```

---

## 八、路由配置规范

### 8.1 路径规则

- 一级菜单的 `path` 以 `/` 开头（如 `/dashboard`）
- 子菜单的 `path` 使用相对路径（如 `console`），`MenuProcessor` 会自动拼接为 `/dashboard/console`
- 外部链接以 `http://` 或 `https://` 开头

### 8.2 组件规则

- 一级菜单的 `component` 必须为 `/index`（指向 Layout）
- 有页面的子菜单 `component` 指向 `src/views/` 下的组件路径
- 目录菜单（仅作为容器）`component` 设为空字符串 ``
- Iframe 路由设置 `meta.isIframe: true`

### 8.3 命名规则

- `name` 使用大写驼峰，全局唯一（如 `Dashboard`、`System`）
- `title` 使用 i18n key（如 `menus.dashboard.title`）

---

## 九、相关文件索引

| 文件 | 作用 |
|------|------|
| `src/router/guards/beforeEach.ts` | 路由守卫主逻辑 |
| `src/router/core/MenuProcessor.ts` | 菜单获取与处理 |
| `src/router/core/RouteRegistry.ts` | 动态路由注册 |
| `src/router/core/RouteTransformer.ts` | 路由配置转换 |
| `src/router/core/ComponentLoader.ts` | 组件动态加载 |
| `src/router/core/RouteValidator.ts` | 路由配置校验 |
| `src/router/core/RoutePermissionValidator.ts` | 路径权限验证 |
| `src/store/modules/menu.ts` | 菜单状态管理 |
| `src/store/modules/user.ts` | 用户状态管理 |
| `src/hooks/core/useAppMode.ts` | 应用模式判断 |
| `src/types/router/index.ts` | 路由类型定义 |
