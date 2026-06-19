
---

# 路由系统架构解析

> 基于 Vue 3 + TypeScript + vue-router 5 的中后台管理系统路由实现，采用**双阶段路由注册 + 菜单驱动**的设计模式。

---

## 一、整体架构分层

```
src/router/
├── index.ts              # 路由入口：创建实例、初始化守卫
├── routesAlias.ts         # 公共路由别名枚举
├── routes/
│   ├── staticRoutes.ts    # 静态路由（无需登录）
│   └── asyncRoutes.ts     # 动态路由（需权限）
├── modules/               # 按业务模块拆分路由配置
│   ├── dashboard.ts
│   ├── system.ts
│   ├── widgets.ts
│   └── ...
├── core/                  # 路由核心引擎（7个类）
│   ├── RouteRegistry.ts
│   ├── RouteTransformer.ts
│   ├── RouteValidator.ts
│   ├── ComponentLoader.ts
│   ├── MenuProcessor.ts
│   ├── RoutePermissionValidator.ts
│   └── IframeRouteManager.ts
└── guards/
    ├── beforeEach.ts      # 前置守卫（核心逻辑）
    └── afterEach.ts       # 后置守卫
```

---

## 二、核心设计：双阶段路由注册

这是整个系统最关键的架构决策。

**阶段一：创建路由实例时只注册静态路由**

```typescript
// src/router/index.ts
export const router = createRouter({
  history: createWebHistory(),
  routes: staticRoutes,  // 只有登录页等公开路由
})
```

**阶段二：用户登录后，根据权限动态注册**

在 `beforeEach` 守卫中，首次访问时触发：

```typescript
async function handleDynamicRoutes(to, router) {
  // 1. 获取用户信息
  await fetchUserInfo()
  // 2. 获取菜单数据（前端模式按角色过滤 / 后端模式从API获取）
  const menuList = await menuProcessor.getMenuList()
  // 3. 注册动态路由到 router 实例
  routeRegistry?.register(menuList)
  // 4. 保存菜单到 store（用于渲染侧边栏）
  menuStore.setMenuList(menuList)
  // 5. 重新导航到目标地址
  return { path: to.path, replace: true }
}
```

**为什么这样做？** 未登录时路由表很小（只有登录页），登录后根据用户角色/后端返回的菜单动态生成完整路由表。这样既安全又灵活。

---

## 三、路由配置的"字符串路径"约定

这是项目中**最值得注意的设计**：路由配置中的 `component` 字段不是 Vue 组件引用，而是**字符串路径**。

```typescript
// src/router/modules/dashboard.ts
export const dashboardRoutes: AppRouteRecord = {
  path: '/dashboard',
  name: 'Dashboard',
  component: '/index',  // ← 字符串！指向 Layout 组件
  children: [
    {
      path: 'console',
      name: 'Console',
      component: '/dashboard/console',  // ← 字符串路径
    },
  ],
}
```

这个字符串路径通过 `ComponentLoader` 解析为真正的组件：

```typescript
// src/router/core/ComponentLoader.ts
export class ComponentLoader {
  private modules: Record<string, () => Promise<any>>

  constructor() {
    // 构建时扫描所有 .vue 文件
    this.modules = import.meta.glob('../../views/**/*.vue')
  }

  load(componentPath: string) {
    // 例如: '/dashboard/console' → '../../views/dashboard/console.vue'
    const fullPath = `../../views${componentPath}.vue`
    const fullPathWithIndex = `../../views${componentPath}/index.vue`
    return this.modules[fullPath] || this.modules[fullPathWithIndex]
  }
}
```

**核心约定：** `src/views/` 目录结构直接映射路由路径。`/dashboard/console` 自动对应 `src/views/dashboard/console.vue`。不需要手动 `import` 每个组件。

---

## 四、RouteTransformer：菜单数据 → 路由配置的转换管道

`RouteTransformer` 负责把菜单数据（`AppRouteRecord`）转换成 Vue Router 能识别的 `RouteRecordRaw`。它处理了三种情况：

### 1. 一级菜单 → 自动包裹 Layout

```typescript
private handleFirstLevelRoute(converted, route, component) {
  converted.component = this.componentLoader.loadLayout()  // 用 Layout 包裹
  converted.path = this.extractFirstSegment(route.path)    // 只取第一段
  converted.children = [{ ...route, component: this.componentLoader.load(component) }]
}
```

例如配置 `path: '/dashboard'` 且没有父级 → 实际注册的路径是 `/dashboard`，组件是 Layout，子路由才是真正的页面组件。

### 2. 嵌套菜单 → 递归处理

```typescript
if (children?.length) {
  converted.children = children.map((child) => this.transform(child, depth + 1))
}
```

支持无限层级嵌套，每层递归深度 `depth + 1`。

### 3. Iframe 路由 → 特殊处理

```typescript
private handleIframeRoute(targetRoute, sourceRoute, depth) {
  if (depth === 0) {
    targetRoute.component = this.componentLoader.loadLayout()
    targetRoute.children = [{ ...sourceRoute, component: this.componentLoader.loadIframe() }]
  } else {
    targetRoute.component = this.componentLoader.loadIframe()
  }
}
```

---

## 五、权限控制：前端模式 vs 后端模式

`MenuProcessor` 支持两种权限模式：

### 前端控制模式

路由在代码中定义，通过 `meta.roles` 按角色过滤。

```typescript
// 路由定义中标注角色
meta: { roles: ['R_SUPER', 'R_ADMIN'] }

// 过滤逻辑
private filterMenuByRoles(menu, roles) {
  return menu.filter(item => {
    const itemRoles = item.meta?.roles
    const hasPermission = !itemRoles || itemRoles.some(role => roles?.includes(role))
    if (hasPermission && item.children) {
      item.children = this.filterMenuByRoles(item.children, roles)
    }
    return hasPermission
  })
}
```

### 后端控制模式

菜单数据完全由后端 API 返回，前端不做过滤。

```typescript
private async processBackendMenu() {
  const list = await fetchGetMenuList()
  return this.filterEmptyMenus(list)
}
```

两种模式通过 `useAppMode().isFrontendMode` 切换。

---

## 六、前置守卫的完整工作流

`beforeEach.ts` 是整个路由系统的"大脑"，按顺序执行以下步骤：

```
用户访问 /some/path
    │
    ├─ 1. 启动 NProgress 进度条
    │
    ├─ 2. 检查登录状态
    │   ├─ 已登录 → 继续
    │   └─ 未登录 → 跳转 /login?redirect=/some/path
    │
    ├─ 3. 检查是否已初始化动态路由
    │   ├─ 已初始化 → 跳过
    │   └─ 未初始化 → 执行 handleDynamicRoutes()
    │       ├─ 显示全屏 loading
    │       ├─ 获取用户信息
    │       ├─ 获取菜单列表
    │       ├─ 注册动态路由
    │       ├─ 保存菜单到 store
    │       ├─ 验证目标路径权限
    │       └─ 重新导航（replace: true）
    │
    ├─ 4. 处理根路径 / → 重定向到首页
    │
    ├─ 5. 路由匹配成功 → 设置工作标签页 + 页面标题
    │
    └─ 6. 未匹配 → 跳转 404
```

### 关键细节：并发保护

```typescript
if (routeInitInProgress) {
  return false  // 等待初始化完成
}
```

防止快速连续导航时多次触发菜单加载。

### 关键细节：死循环防护

```typescript
if (routeInitFailed) {
  if (to.matched.length > 0) return
  else return { name: 'Exception500' }
}
```

如果初始化失败过一次，不再重试，直接跳到错误页。

---

## 七、退出登录的清理机制

```typescript
const logOut = () => {
  // 1. 保存当前用户 ID（用于下次登录判断是否同一用户）
  localStorage.setItem(StorageConfig.LAST_USER_ID_KEY, currentUserId)
  // 2. 清空用户状态
  info.value = {}
  isLogin.value = false
  // 3. 重置路由状态（延迟执行）
  resetRouterState(500)
  // 4. 跳转登录页
  router.push({ name: 'Login', query: { redirect } })
}

// resetRouterState 内部
export function resetRouterState(delay: number) {
  setTimeout(() => {
    routeRegistry?.unregister()              // 移除所有动态路由
    IframeRouteManager.getInstance().clear() // 清空 iframe 缓存
    menuStore.removeAllDynamicRoutes()       // 执行所有移除函数
    menuStore.setMenuList([])                // 清空菜单
    resetRouteInitState()                    // 允许下次重新初始化
  }, delay)
}
```

这样设计的好处：不同用户登录时，旧路由完全清除，新路由重新注册，不会产生权限残留。

---

## 八、类型系统的支撑

```typescript
// src/types/router/index.ts
export interface AppRouteRecord extends Omit<RouteRecordRaw, 'meta' | 'children' | 'component'> {
  id?: number
  meta: RouteMeta
  children?: AppRouteRecord[]
  component?: string | (() => Promise<any>)  // 支持字符串路径或函数
}

export interface RouteMeta {
  title: string          // 菜单标题（支持 i18n key）
  icon?: string          // 图标
  roles?: string[]       // 角色权限
  isHide?: boolean       // 菜单中隐藏
  isHideTab?: boolean    // 标签页中隐藏
  keepAlive?: boolean    // 是否缓存
  link?: string          // 外部链接
  isIframe?: boolean     // 是否 iframe 内嵌
  fixedTab?: boolean     // 是否固定标签页
  authList?: Array<{ title: string; authMark: string }>  // 按钮级权限
}
```

---

## 九、设计亮点总结

| 设计 | 说明 |
|------|------|
| **菜单即路由** | 菜单数据是唯一数据源，路由由菜单自动生成 |
| **字符串组件路径** | 用路径字符串代替 `import()`，通过 `import.meta.glob` 自动映射 |
| **双阶段注册** | 静态路由先行，动态路由登录后按权限注入 |
| **前端/后端双模式** | 同一套架构支持前端角色过滤和后端 API 返回 |
| **类封装核心逻辑** | 7 个职责单一的类，可测试、可替换 |
| **递归路径规范化** | 自动将相对路径拼接为完整路径，支持无限嵌套 |
| **守卫即编排器** | `beforeEach` 是完整的"路由初始化编排器" |
| **防并发/防死循环** | 用 `routeInitInProgress` 和 `routeInitFailed` 做安全防护 |
