# 组件提取重构设计

**日期：** 2026-06-22
**作者：** Claude Code
**状态：** 已批准

## 概述

将 `views/index.vue` 和 `components/layouts/zhao-header-bar/index.vue` 中的内联 UI 提取为独立组件，同时消除跨文件重复的工具函数和菜单导航逻辑。共涉及 5 个组件提取 + 1 个工具函数迁移 + 1 个组合式函数抽取 + 1 处死代码清理。

## 提取清单

### 1. ZhaoSidebar — 侧边栏

**路径：** `src/components/layouts/zhao-sidebar/index.vue`

**职责：** 接管 `views/index.vue` 中侧边栏的所有渲染和交互，包含标准模式和双列模式。

**Props：**

| Prop               | 类型               | 说明                           |
| ------------------ | ------------------ | ------------------------------ |
| `isDualMenu`       | `boolean`          | 是否双列模式                   |
| `menuOpen`         | `boolean`          | 侧边栏折叠状态                 |
| `sidebarWidth`     | `string`           | 动态宽度                       |
| `menuTheme`        | `MenuTheme`        | 当前菜单主题                   |
| `topLevelMenus`    | `AppRouteRecord[]` | 一级菜单（双列用）             |
| `currentChildren`  | `AppRouteRecord[]` | 子菜单（双列用）               |
| `dualMenuShowText` | `boolean`          | 双列是否显示文字               |
| `openKeys`         | `string[]`         | 展开子菜单 key（支持 v-model） |
| `activeFirstLevel` | `string`           | 激活的一级菜单（支持 v-model） |
| `menuList`         | `AppRouteRecord[]` | 标准模式菜单列表               |

**Emits：**

| Event             | 载荷          | 说明               |
| ----------------- | ------------- | ------------------ |
| `menu-select`     | `key: string` | 菜单项被点击       |
| `toggle-collapse` | —             | 折叠/展开按钮      |
| `home`            | —             | 点击 Logo 跳到首页 |

**从 index.vue 迁移的逻辑：**

- `openKeys` ref → 父组件维护，通过 v-model 传入
- `activeFirstLevel` ref → 父组件维护，通过 v-model 传入
- `findParentPaths` → 使用提取到 utils 的版本
- `findMenuItem` → 使用提取到 utils 的版本
- `setActiveFirstLevel` / `onMenuItemClick` → emit 给父组件

**模板结构：** 保持原样（双列模式的左侧图标栏 + 右侧子菜单，标准模式的 Logo + 菜单 + 折叠按钮），只把容器 `<aside>` 和内部 HTML 迁移到新文件。

---

### 2. findMenuItem → utils 提取

**现状：** `findMenuItem` / `findParentPaths` 在 `views/index.vue` 和 `zhao-horizontal-menu/index.vue` 中重复定义。

**改动：**

- **`src/utils/navigation/route.ts`** 新增两个导出函数：
  - `findMenuItem(list, path): AppRouteRecord | null` — 递归按 path 查找菜单项
  - `findParentPaths(list, target): string[]` — 查找目标路径的所有父级路径

- **`views/index.vue`**：删除本地 `findMenuItem` 和 `findParentPaths` 定义，改为 import

- **`zhao-horizontal-menu/index.vue`**：删除本地 `findItem`，改为 import `findMenuItem`

- **`ZhaoSidebar`**：import 使用

---

### 3. useMenuNavigation 组合式函数

**路径：** `src/hooks/core/useMenuNavigation.ts`

**现状：** `views/index.vue` 的 `onMenuItemClick` 和 `zhao-header-bar/index.vue` 的 `onMenuSelect` 具有几乎相同的 "查找菜单 → push 路由 → openTab" 逻辑。

**接口：**

```ts
export function useMenuNavigation() {
  const navigateByKey = (key: string, options?: { closeMobile?: () => void }) => void
  const navigateByItem = (item: AppRouteRecord) => void
  const openTabForItem = (item: AppRouteRecord) => void  // 内部共享，也可外部使用
}
```

- `navigateByKey`: 由 ZhaoSidebar 使用，传入菜单 key，自动查找并导航
- `navigateByItem`: 由 HeaderBar 的 horizontal/mixed menu 回调使用
- `closeMobile` 回调：ZhaoSidebar 的移动端专用参数

---

### 4. ZhaoIconButton

**路径：** `src/components/layouts/zhao-icon-button/index.vue`

**Props：**

| Prop   | 类型     | 说明             |
| ------ | -------- | ---------------- |
| `icon` | `string` | Iconify 图标名称 |

**Emits：**

| Event   | 载荷 | 说明     |
| ------- | ---- | -------- |
| `click` | —    | 按钮点击 |

**使用位置：** `zhao-header-bar/index.vue` 中 6 处图标按钮替换。

模板从每处 5 行 → 1 行 `<ZhaoIconButton icon="..." @click="..." />`。

---

### 5. ZhaoUserDropdown

**路径：** `src/components/layouts/zhao-user-dropdown/index.vue`

**职责：** HeaderBar 右侧的用户头像 + 下拉菜单，包含个人中心、文档、GitHub、锁屏、退出 5 个选项。

**行为：**

- 用户头像显示 userName 首字母
- 支持退出登录（弹确认框）
- 支持锁屏
- 语言切换开关不在其中（语言切换留在 HeaderBar）

**Props / Emits：** 无（内部直接使用 userStore / router）

---

### 6. WorkTab ContextMenu 子组件

**路径：** `src/components/layouts/zhao-work-tab/context-menu.vue`

**职责：** 工作标签页右键菜单的 Teleport 渲染和交互，包含 5 个操作：刷新、关闭左侧、关闭右侧、关闭其他、关闭全部。

**Props：**

| Prop       | 类型                       | 说明             |
| ---------- | -------------------------- | ---------------- |
| `visible`  | `boolean`                  | 显示状态         |
| `position` | `{ x: number, y: number }` | 菜单位置         |
| `tab`      | `WorkTab \| null`          | 当前右键的标签页 |

**Emits：**

| Event    | 载荷     | 说明     |
| -------- | -------- | -------- |
| `action` | `string` | 操作类型 |
| `close`  | —        | 关闭菜单 |

**依赖：** `useWorktabStore` + `useCommon().refresh`

---

### 7. 死代码清理

**`src/components/layouts/zhao-page-content/index.vue`：** 删除第 21-23 行的 `<div v-if="false">` 加载占位。

---

## 影响文件清单

| 操作     | 文件                                                                                                            |
| -------- | --------------------------------------------------------------------------------------------------------------- |
| **新增** | `src/components/layouts/zhao-sidebar/index.vue`                                                                 |
| **新增** | `src/components/layouts/zhao-icon-button/index.vue`                                                             |
| **新增** | `src/components/layouts/zhao-user-dropdown/index.vue`                                                           |
| **新增** | `src/components/layouts/zhao-work-tab/context-menu.vue`                                                         |
| **新增** | `src/hooks/core/useMenuNavigation.ts`                                                                           |
| **修改** | `src/utils/navigation/route.ts` (新增 findMenuItem + findParentPaths)                                           |
| **修改** | `src/views/index.vue` (替换为 ZhaoSidebar + useMenuNavigation)                                                  |
| **修改** | `src/components/layouts/zhao-header-bar/index.vue` (引用 ZhaoIconButton + ZhaoUserDropdown + useMenuNavigation) |
| **修改** | `src/components/layouts/zhao-horizontal-menu/index.vue` (使用 utils 版 findMenuItem)                            |
| **修改** | `src/components/layouts/zhao-work-tab/index.vue` (引用 context-menu 子组件)                                     |
| **修改** | `src/components/layouts/zhao-page-content/index.vue` (删死代码)                                                 |

## 不变的部分

- RecursiveMenuItem 组件保持不变
- ZhaoPageContent 的核心逻辑（keep-alive、过渡动画、容器宽度）不变
- ZhaoGlobalComponent 不变
- 所有 store、类型定义、mock 数据不变
- 路由系统不变
- 所有 CSS 样式迁移到新组件（scoped），视觉上完全一致

## 实施顺序

1. `utils/navigation/route.ts` — 提取 findMenuItem + findParentPaths
2. `hooks/core/useMenuNavigation.ts` — 新建组合式函数
3. `zhao-icon-button/index.vue` — 简单组件，先让 HeaderBar 能引用
4. `zhao-user-dropdown/index.vue`
5. `zhao-work-tab/context-menu.vue`
6. `zhao-sidebar/index.vue` — 最大件，依赖前面的 utils
7. 修改 `views/index.vue` — 引用 ZhaoSidebar + useMenuNavigation
8. 修改 `zhao-header-bar/index.vue` — 引用新组件和组合式函数
9. 清理死代码 + 更新 `zhao-horizontal-menu`
