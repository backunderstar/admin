# 组件提取重构 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `views/index.vue` 和 `zhao-header-bar` 中的内联 UI 提取为独立组件，消除跨文件重复的工具函数和菜单导航逻辑。

**Architecture:** 5 个新组件 + 1 个组合式函数 + 1 个工具函数迁移 + 1 处死代码清理。按依赖顺序实施：工具函数 → 组合式函数 → 小组件 → 侧边栏大组件 → 修改引用方。

**Tech Stack:** Vue 3 + TypeScript + Arco Design + Pinia

---

### Task 1: 提取 findMenuItem 到 utils/navigation

**Files:**

- Modify: `src/utils/navigation/route.ts` — 新增 `findMenuItem` + `findParentPaths`
- Modify: `src/components/layouts/zhao-menus/zhao-horizontal-menu/index.vue` — 使用 utils 版本替换本地 `findItem`
- Modify: `src/views/index.vue` — 删除本地 `findMenuItem` + `findParentPaths`，改为 import

- [ ] **Step 1: 在 route.ts 末尾添加两个导出函数**

```ts
// src/utils/navigation/route.ts — 在文件末尾，getFirstMenuPath 之后添加

/**
 * 递归按 path 查找菜单项
 * @param list 菜单列表
 * @param path 要查找的路径
 * @returns 匹配的菜单项，未找到返回 null
 */
export function findMenuItem(list: AppRouteRecord[], path: string): AppRouteRecord | null {
  for (const item of list) {
    if (item.path === path) return item
    if (item.children) {
      const found = findMenuItem(item.children, path)
      if (found) return found
    }
  }
  return null
}

/**
 * 递归查找目标路径的所有父级路径
 * @param list 菜单列表
 * @param target 目标路径
 * @returns 父级路径数组，从顶层到直接父级
 */
export function findParentPaths(list: AppRouteRecord[], target: string): string[] {
  for (const item of list) {
    if (item.children?.length) {
      if (item.children.some((c) => target.startsWith(c.path || '') || target === c.path)) {
        return [item.path || '']
      }
      const found = findParentPaths(item.children, target)
      if (found.length) return [item.path || '', ...found]
    }
  }
  return []
}
```

验证：`findMenuItem` 签名与原来 `views/index.vue` 中的 `findMenuItem` 完全一致，`findParentPaths` 签名也一致。

- [ ] **Step 2: 更新 zhao-horizontal-menu/index.vue — 替换本地 findItem 为 import 版**

修改内容：

1. 在 `import { useI18n } from 'vue-i18n'` 后面添加 `import { findMenuItem } from '@/utils/navigation/route'`
2. 删除本地 `findItem` 函数（第 57-66 行）
3. `onClick` 中的 `findItem(props.menuList, key)` 改为 `findMenuItem(props.menuList, key)`

- [ ] **Step 3: 更新 views/index.vue — 删除本地函数，改为 import**

修改内容：

1. 在 `import type { AppRouteRecord } from '@/types/router'` 后面添加：
   ```ts
   import { findMenuItem, findParentPaths } from '@/utils/navigation/route'
   ```
2. 删除本地 `findParentPaths` 函数（第 159-170 行）
3. 删除本地 `findMenuItem` 函数（第 229-237 行）

- [ ] **Step 4: 验证构建**

Run: `pnpm build-only`
预期：构建成功，无类型错误

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "refactor: extract findMenuItem + findParentPaths to utils/navigation/route"
```

---

### Task 2: 创建 useMenuNavigation 组合式函数

**Files:**

- Create: `src/hooks/core/useMenuNavigation.ts`

- [ ] **Step 1: 创建组合式函数文件**

```ts
// src/hooks/core/useMenuNavigation.ts
import { useRouter } from 'vue-router'
import { useMenuStore } from '@/store/modules/menu'
import { useWorktabStore } from '@/store/modules/worktab'
import { findMenuItem } from '@/utils/navigation/route'
import type { AppRouteRecord } from '@/types/router'

export function useMenuNavigation() {
  const router = useRouter()
  const menuStore = useMenuStore()
  const worktabStore = useWorktabStore()

  /**
   * 根据菜单 key 导航（由 ZhaoSidebar 使用）
   */
  const navigateByKey = (key: string, options?: { closeMobile?: () => void }) => {
    const item = findMenuItem(menuStore.menuList, key)
    if (!item) {
      router.push(key)
      return
    }
    const path = item.meta?.link || item.path || key
    router.push(path)
    openTabForItem(item)
    options?.closeMobile?.()
  }

  /**
   * 根据菜单 item 导航（由 HeaderBar 的 horizontal/mixed menu 使用）
   */
  const navigateByItem = (item: AppRouteRecord) => {
    const path = item.meta?.link || item.path
    if (!path) return
    router.push(path)
    openTabForItem(item)
  }

  /**
   * 统一为菜单项打开工作标签页
   */
  const openTabForItem = (item: AppRouteRecord) => {
    const path = item.meta?.link || item.path
    if (!path) return
    worktabStore.openTab({
      path,
      name: item.name as string,
      title: item.meta?.title || '',
      icon: item.meta?.icon,
      keepAlive: item.meta?.keepAlive ?? true,
      fixedTab: item.meta?.fixedTab ?? false,
    })
  }

  return { navigateByKey, navigateByItem, openTabForItem }
}
```

注意：这个文件不对应任何测试，因为它是与 store 深度耦合的组合式函数。

- [ ] **Step 2: 提交**

```bash
git add -A
git commit -m "feat: add useMenuNavigation composable for shared menu nav logic"
```

---

### Task 3: 创建 ZhaoIconButton 组件

**Files:**

- Create: `src/components/layouts/zhao-icon-button/index.vue`

- [ ] **Step 1: 创建组件文件**

```vue
<!-- src/components/layouts/zhao-icon-button/index.vue -->
<template>
  <div
    class="flex items-center justify-center w-8 h-8 rounded-md cursor-pointer text-(--color-text-3) hover:text-(--color-text-1) hover:bg-(--color-fill-2) transition-colors"
    @click="$emit('click')"
  >
    <ZhaoIcon :icon="icon" class="text-lg" />
  </div>
</template>

<script setup lang="ts">
import ZhaoIcon from '@/components/icons/ZhaoIcon.vue'

defineOptions({ name: 'ZhaoIconButton' })

defineProps<{
  icon: string
}>()

defineEmits<{
  click: []
}>()
</script>
```

- [ ] **Step 2: 提交**

```bash
git add -A
git commit -m "feat: add ZhaoIconButton reusable icon button component"
```

---

### Task 4: 创建 ZhaoUserDropdown 组件

**Files:**

- Create: `src/components/layouts/zhao-user-dropdown/index.vue`

- [ ] **Step 1: 创建组件文件**

```vue
<!-- src/components/layouts/zhao-user-dropdown/index.vue -->
<template>
  <a-dropdown trigger="click" @select="onUserMenuSelect">
    <div
      class="flex items-center gap-2 ml-2 px-2 py-1 rounded-md cursor-pointer hover:bg-(--color-fill-2) transition-colors"
    >
      <div
        class="w-7 h-7 rounded-full bg-(--theme-color,#5d87ff) flex items-center justify-center text-white text-xs font-medium"
      >
        {{ userAvatarText }}
      </div>
      <span class="text-sm text-(--color-text-1) hidden sm:inline">{{ userName }}</span>
      <ZhaoIcon icon="ri:arrow-down-s-line" class="text-sm text-(--color-text-3)" />
    </div>
    <template #content>
      <a-doption value="center">
        <ZhaoIcon icon="ri:user-line" class="mr-2" />
        {{ t('topBar.user.userCenter') }}
      </a-doption>
      <a-doption value="docs">
        <ZhaoIcon icon="ri:file-text-line" class="mr-2" />
        {{ t('topBar.user.docs') }}
      </a-doption>
      <a-doption value="github">
        <ZhaoIcon icon="ri:github-line" class="mr-2" />
        GitHub
      </a-doption>
      <a-doption divided value="lock">
        <ZhaoIcon icon="ri:lock-line" class="mr-2" />
        {{ t('topBar.user.lockScreen') }}
      </a-doption>
      <a-doption value="logout">
        <ZhaoIcon icon="ri:logout-box-r-line" class="mr-2" />
        {{ t('topBar.user.logout') }}
      </a-doption>
    </template>
  </a-dropdown>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/store/modules/user'
import { Modal } from '@arco-design/web-vue'
import ZhaoIcon from '@/components/icons/ZhaoIcon.vue'

defineOptions({ name: 'ZhaoUserDropdown' })

const router = useRouter()
const { t } = useI18n()
const userStore = useUserStore()

const userAvatarText = computed(() => {
  return (userStore.info.userName || 'U').charAt(0).toUpperCase()
})
const userName = computed(() => userStore.info.userName || 'User')

const onUserMenuSelect = (value: string | number | Record<string, any> | undefined) => {
  if (value === 'logout') {
    Modal.confirm({
      title: t('common.tips'),
      content: t('common.logOutTips'),
      onOk: () => userStore.logOut(),
    })
  } else if (value === 'lock') {
    userStore.setLockStatus(true)
  }
}
</script>
```

- [ ] **Step 2: 提交**

```bash
git add -A
git commit -m "feat: add ZhaoUserDropdown component"
```

---

### Task 5: 创建 WorkTab ContextMenu 子组件

**Files:**

- Create: `src/components/layouts/zhao-work-tab/context-menu.vue`
- Modify: `src/components/layouts/zhao-work-tab/index.vue` — 使用 context-menu 子组件

- [ ] **Step 1: 创建 context-menu.vue**

```vue
<!-- src/components/layouts/zhao-work-tab/context-menu.vue -->
<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="context-menu"
      :style="{ left: `${position.x}px`, top: `${position.y}px` }"
    >
      <div class="context-menu-item" @click="$emit('action', 'refresh')">
        <ZhaoIcon icon="ri:refresh-line" class="mr-2" />
        {{ t('worktab.btn.refresh') }}
      </div>
      <div class="context-menu-item" @click="$emit('action', 'closeLeft')">
        <ZhaoIcon icon="ri:arrow-left-s-line" class="mr-2" />
        {{ t('worktab.btn.closeLeft') }}
      </div>
      <div class="context-menu-item" @click="$emit('action', 'closeRight')">
        <ZhaoIcon icon="ri:arrow-right-s-line" class="mr-2" />
        {{ t('worktab.btn.closeRight') }}
      </div>
      <div class="context-menu-item" @click="$emit('action', 'closeOther')">
        <ZhaoIcon icon="ri:subtract-line" class="mr-2" />
        {{ t('worktab.btn.closeOther') }}
      </div>
      <div class="context-menu-item" @click="$emit('action', 'closeAll')">
        <ZhaoIcon icon="ri:close-circle-line" class="mr-2" />
        {{ t('worktab.btn.closeAll') }}
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import ZhaoIcon from '@/components/icons/ZhaoIcon.vue'

defineOptions({ name: 'WorkTabContextMenu' })

defineProps<{
  visible: boolean
  position: { x: number; y: number }
}>()

defineEmits<{
  action: [value: string]
}>()

const { t } = useI18n()
</script>

<style scoped>
.context-menu {
  position: fixed;
  z-index: 1000;
  min-width: 140px;
  padding: 4px 0;
  background: var(--color-bg-popup);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.context-menu-item {
  display: flex;
  align-items: center;
  padding: 7px 12px;
  font-size: 13px;
  color: var(--color-text-2);
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
}

.context-menu-item:hover {
  background: var(--color-fill-2);
  color: var(--color-text-1);
}
</style>
```

- [ ] **Step 2: 修改 zhao-work-tab/index.vue — 替换内联右键菜单为子组件**

修改内容：

1. 在 imports 区域添加 `import WorkTabContextMenu from './context-menu.vue'`
2. 删除模板中的 Teleport 块（原第 42-66 行），替换为 `<WorkTabContextMenu :visible="contextMenuVisible" :position="contextMenuPos" @action="onContextMenuAction" />`
3. 删除全局 `<style>` 块中的 `.context-menu` 和 `.context-menu-item` 样式（已在子组件中），但保留 `<style>` 标签占位（可以保留空标签，或只保留 scoped 样式）

具体来说，模板的变化：

```vue
<!-- 替换这段（原约 25 行） -->
<Teleport to="body">
  <div v-if="contextMenuVisible" class="context-menu"
    :style="{ left: `${contextMenuPos.x}px`, top: `${contextMenuPos.y}px` }">
    ...
  </div>
</Teleport>

<!-- 变为这一行 -->
<WorkTabContextMenu
  :visible="contextMenuVisible"
  :position="contextMenuPos"
  @action="onContextMenuAction"
/>
```

同时删除 `<style>` 中的全局样式：

```css
/* 删除这些全局样式 */
.context-menu { ... }
.context-menu-item { ... }
```

注意：`onContextMenuAction` 和 `contextMenuVisible` / `contextMenuPos` 等变量仍保留在 work-tab/index.vue 中，因为它们管理右键菜单的状态生命周期。

- [ ] **Step 3: 提交**

```bash
git add -A
git commit -m "refactor: extract work-tab context menu to sub-component"
```

---

### Task 6: 创建 ZhaoSidebar 组件

**Files:**

- Create: `src/components/layouts/zhao-sidebar/index.vue`

- [ ] **Step 1: 创建组件文件**

```vue
<!-- src/components/layouts/zhao-sidebar/index.vue -->
<template>
  <aside
    id="app-sidebar"
    class="relative shrink-0 h-full overflow-hidden z-20 select-none rounded-lg"
    :style="{ width: sidebarWidth }"
  >
    <!-- 双列模式 -->
    <template v-if="isDualMenu">
      <div class="flex h-full">
        <!-- 左栏：一级图标 -->
        <div
          class="w-16 flex flex-col items-center py-3 border-r border-(--color-border)"
          :style="{ background: menuTheme.background }"
        >
          <div
            class="w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer shrink-0"
            :style="{ background: 'var(--theme-color, #5d87ff)' }"
          >
            <ZhaoIcon icon="ri:admin-line" class="text-white text-lg" />
          </div>
          <div class="flex-1 w-full mt-3 space-y-1 overflow-y-auto scrollbar-none">
            <a-tooltip
              v-for="item in topLevelMenus"
              :key="item.path"
              :content="item.meta?.title ? $t(item.meta.title) : ''"
              placement="right"
            >
              <div
                class="flex flex-col items-center py-2.5 mx-1.5 rounded-lg cursor-pointer transition-colors"
                :class="
                  (activeFirstLevel ?? '') === (item.path ?? '')
                    ? 'text-(--color-primary-light-4) bg-(--color-fill-2)'
                    : 'text-(--color-text-3) hover:text-(--color-text-2) hover:bg-(--color-fill-1)'
                "
                @click="setActiveFirstLevel(item)"
              >
                <ZhaoIcon :icon="item.meta?.icon || 'ri:folder-line'" class="text-xl" />
              </div>
            </a-tooltip>
          </div>
        </div>
        <!-- 右栏：子菜单 -->
        <div
          v-show="dualMenuShowText"
          class="flex-1 overflow-y-auto scrollbar-none py-3"
          :style="{ background: menuTheme.background }"
        >
          <a-menu
            :selected-keys="[route.path]"
            mode="vertical"
            :collapsed="false"
            :accordion="uniqueOpened"
            @menu-item-click="onMenuItemClick"
          >
            <template v-for="item in currentChildren" :key="item.path">
              <RecursiveMenuItem :item="item" />
            </template>
          </a-menu>
        </div>
      </div>
    </template>

    <!-- 标准侧边栏 -->
    <template v-else>
      <div
        class="flex flex-col h-full border-r border-(--color-border)"
        :style="{ background: menuTheme.background }"
      >
        <!-- Logo -->
        <div
          class="flex items-center justify-center h-16 shrink-0 cursor-pointer"
          @click="$emit('home')"
        >
          <div
            class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            :style="{ background: 'var(--theme-color, #5d87ff)' }"
          >
            <ZhaoIcon icon="ri:admin-line" class="text-white text-base" />
          </div>
          <span
            class="text-base font-bold whitespace-nowrap overflow-hidden transition-all duration-250"
            :class="menuOpen ? 'max-w-50 opacity-100 ml-3' : 'max-w-0 opacity-0 ml-0'"
            :style="{ color: menuTheme.systemNameColor }"
          >
            {{ systemName }}
          </span>
        </div>
        <!-- 菜单 -->
        <div
          class="flex-1 overflow-y-auto scrollbar-none py-2"
          :class="{ 'flex justify-center': !menuOpen }"
        >
          <a-menu
            :selected-keys="[route.path]"
            v-model:open-keys="openKeys"
            mode="vertical"
            :collapsed="!menuOpen"
            :accordion="uniqueOpened"
            @menu-item-click="onMenuItemClick"
          >
            <template v-for="item in menuList" :key="item.path">
              <RecursiveMenuItem :item="item" />
            </template>
          </a-menu>
        </div>
        <!-- 折叠按钮 -->
        <div
          class="shrink-0 h-10 flex items-center justify-center cursor-pointer border-t border-(--color-border) text-(--color-text-3) hover:text-(--color-text-1) transition-colors"
          :style="{ background: menuTheme.background }"
          @click="$emit('toggle-collapse')"
        >
          <ZhaoIcon
            :icon="menuOpen ? 'ri:menu-fold-line' : 'ri:menu-unfold-line'"
            class="text-lg"
          />
        </div>
      </div>
    </template>
  </aside>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { computed, watch } from 'vue'
import RecursiveMenuItem from '@/views/components/RecursiveMenuItem.vue'
import { findMenuItem, findParentPaths } from '@/utils/navigation/route'
import type { AppRouteRecord } from '@/types/router'
import ZhaoIcon from '@/components/icons/ZhaoIcon.vue'

defineOptions({ name: 'ZhaoSidebar' })

const props = defineProps<{
  isDualMenu: boolean
  menuOpen: boolean
  sidebarWidth: string
  menuTheme: { background: string; systemNameColor?: string }
  topLevelMenus: AppRouteRecord[]
  currentChildren: AppRouteRecord[]
  dualMenuShowText: boolean
  openKeys: string[]
  activeFirstLevel?: string
  menuList: AppRouteRecord[]
  uniqueOpened: boolean
  systemName: string
}>()

const emit = defineEmits<{
  'update:openKeys': [keys: string[]]
  'update:activeFirstLevel': [key: string]
  'menu-select': [key: string]
  'toggle-collapse': []
  home: []
}>()

const route = useRoute()

// ── 双列模式一级菜单激活 ──
const setActiveFirstLevel = (item: AppRouteRecord) => {
  emit('update:activeFirstLevel', item.path || '')
  if (item.children?.length) {
    const first = item.children[0]
    if (first) onMenuItemClick(first.path || '')
    else if (item.path) onMenuItemClick(item.path)
  } else if (item.path) {
    onMenuItemClick(item.path)
  }
}

// ── 菜单点击 ──
const onMenuItemClick = (key: string) => {
  emit('menu-select', key)
}

// ── 路由变化时自动展开父级（标准模式） ──
watch(
  () => route.path,
  (path) => {
    if (!props.isDualMenu) {
      const parentKeys = findParentPaths(props.menuList, path)
      const currentOpenKeys = [...props.openKeys]
      let changed = false
      for (const key of parentKeys) {
        if (!currentOpenKeys.includes(key)) {
          currentOpenKeys.push(key)
          changed = true
        }
      }
      if (changed) {
        emit('update:openKeys', currentOpenKeys)
      }
    }
  },
  { immediate: true },
)

// ── 双列模式：路由变化时激活对应一级菜单 ──
watch(
  () => route.path,
  (path) => {
    if (path && props.isDualMenu) {
      for (const item of props.topLevelMenus) {
        if (item.path && path.startsWith(item.path)) {
          emit('update:activeFirstLevel', item.path)
          return
        }
      }
    }
  },
  { immediate: true },
)
</script>

<style scoped>
#app-sidebar {
  transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.scrollbar-none {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.scrollbar-none::-webkit-scrollbar {
  display: none;
}
</style>
```

注意：

- `openKeys` 通过 `v-model:open-keys="openKeys"` 双向绑定，但 `<a-menu>` 的 `v-model:open-keys` 会自动更新 openKeys。为了简化，emit `update:openKeys` 只在路由变化时自动展开时发出。
- 实际上 `a-menu` 的 `open-keys` prop 配合 `v-model:open-keys` 应该由 a-menu 内部更新。我们需要用 `:open-keys` + `@update:open-keys` 方式。

让我修正一下思路：`<a-menu>` 的 `v-model:open-keys="openKeys"` 在父组件中接收 `openKeys` 并通过 `@update:open-keys` 发射更新。所以我们只需要：

1. 用 `:open-keys="openKeys"` 和 `@update:open-keys="(v) => emit('update:openKeys', v)"`
2. 路由变化时通过 emit 更新父组件的 openKeys

实际上，直接保持 `v-model:open-keys` 不修改，但在模板中改为 `:open-keys="openKeys" @update:open-keys="(v) => emit('update:openKeys', v)"`，然后路由变化的 watch 中直接 emit。

让我修正模板中的 a-menu 部分：

```
<a-menu :selected-keys="[route.path]" :open-keys="openKeys"
  @update:open-keys="(v: string[]) => emit('update:openKeys', v)"
  ...
```

- [ ] **Step 2: 提交**

```bash
git add -A
git commit -m "feat: add ZhaoSidebar component extracted from views/index.vue"
```

---

### Task 7: 更新 views/index.vue — 使用 ZhaoSidebar + useMenuNavigation

**Files:**

- Modify: `src/views/index.vue` — 大幅简化，引用 ZhaoSidebar 和使用 useMenuNavigation

- [ ] **Step 1: 重写 views/index.vue**

```vue
<template>
  <div class="flex h-screen w-full overflow-hidden bg-(--color-fill-2)">
    <!-- 侧边栏 -->
    <ZhaoSidebar
      v-if="showSidebar"
      :is-dual-menu="isDualMenu"
      :menu-open="menuOpen"
      :sidebar-width="sidebarWidth"
      :menu-theme="getMenuTheme"
      :top-level-menus="menuStore.menuList"
      :current-children="currentChildren"
      :dual-menu-show-text="dualMenuShowText"
      v-model:open-keys="openKeys"
      v-model:active-first-level="activeFirstLevel"
      :menu-list="menuStore.menuList"
      :unique-opened="settingStore.uniqueOpened"
      :system-name="systemInfo.name"
      @menu-select="nav.navigateByKey($event, { closeMobile: closeMobileSidebar })"
      @toggle-collapse="settingStore.setMenuOpen(!menuOpen)"
      @home="goHome"
    />

    <!-- 主内容区 -->
    <main
      id="app-main"
      class="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-(--color-fill-2)"
    >
      <!-- 顶部栏 -->
      <div
        id="app-header"
        class="shrink-0 sticky top-0 z-10 bg-(--color-bg-1) border-b border-(--color-border)"
      >
        <ZhaoHeaderBar @toggle-menu="toggleMenu" />
      </div>
      <!-- 页面内容 -->
      <div id="app-content" class="flex-1 overflow-auto min-h-0">
        <ZhaoPageContent />
      </div>
    </main>

    <!-- 全局组件层 -->
    <div id="app-global">
      <ZhaoGlobalComponent />
    </div>

    <!-- 移动端遮罩 -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="isMobileOpen"
          class="fixed inset-0 bg-black/50 z-10"
          @click="closeMobileSidebar"
        />
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useSettingStore } from '@/store/modules/setting'
import { useMenuStore } from '@/store/modules/menu'
import { useWorktabStore } from '@/store/modules/worktab'
import { MenuTypeEnum } from '@/enums/appEnum'
import AppConfig from '@/config'
import { useAutoLayoutHeight } from '@/hooks/core/useLayoutHeight'
import { useMenuNavigation } from '@/hooks/core/useMenuNavigation'
import ZhaoSidebar from '@/components/layouts/zhao-sidebar/index.vue'
import ZhaoHeaderBar from '@/components/layouts/zhao-header-bar/index.vue'
import ZhaoPageContent from '@/components/layouts/zhao-page-content/index.vue'
import ZhaoGlobalComponent from '@/components/layouts/zhao-global-component/index.vue'
import type { AppRouteRecord } from '@/types/router'

defineOptions({ name: 'AppLayout' })

const router = useRouter()
const route = useRoute()
const settingStore = useSettingStore()
const menuStore = useMenuStore()
const worktabStore = useWorktabStore()

const systemInfo = AppConfig.systemInfo

// ── 布局类型 ──
const isLeftMenu = computed(() => settingStore.menuType === MenuTypeEnum.LEFT)
const isTopMenu = computed(() => settingStore.menuType === MenuTypeEnum.TOP)
const isTopLeftMenu = computed(() => settingStore.menuType === MenuTypeEnum.TOP_LEFT)
const isDualMenu = computed(() => settingStore.menuType === MenuTypeEnum.DUAL_MENU)

const showSidebar = computed(() => isLeftMenu.value || isTopLeftMenu.value || isDualMenu.value)
const menuOpen = computed(() => settingStore.menuOpen)

const getMenuTheme = computed(() => settingStore.getMenuTheme)

const dualMenuShowText = computed(() => settingStore.dualMenuShowText)

const sidebarWidth = computed(() => {
  if (isDualMenu.value && !dualMenuShowText.value) return '64px'
  if (!menuOpen.value) return '64px'
  return `${settingStore.menuOpenWidth}px`
})

// ── 展开的菜单 ──
const openKeys = ref<string[]>([])

// ── 一级菜单图标（双列模式） ──
const topLevelMenus = computed(() => menuStore.menuList)
const activeFirstLevel = ref('')

const currentChildren = computed(() => {
  if (!activeFirstLevel.value) return []
  const found = findMenuItem(topLevelMenus.value, activeFirstLevel.value)
  return found?.children || []
})

// ── 首页跳转 ──
const goHome = () => {
  const home = (menuStore as any).homePath ?? '/'
  if (home) router.push(home)
}

// ── 移动端 ──
const isMobileOpen = ref(false)
const isMobile = ref(false)

const toggleMenu = () => {
  if (isMobile.value) {
    isMobileOpen.value = !isMobileOpen.value
  } else {
    settingStore.setMenuOpen(!menuOpen.value)
  }
}

const closeMobileSidebar = () => {
  isMobileOpen.value = false
}

let resizeHandler: (() => void) | null = null

onMounted(() => {
  const check = () => {
    isMobile.value = window.innerWidth < 800
    if (isMobile.value) isMobileOpen.value = false
  }
  check()
  window.addEventListener('resize', check)
  resizeHandler = check
})

onBeforeUnmount(() => {
  if (resizeHandler) window.removeEventListener('resize', resizeHandler)
})

// ── 导航 ──
const nav = useMenuNavigation()

// ── 自动布局高度 ──
useAutoLayoutHeight()

// 需要 import findMenuItem 用于 currentChildren 的计算
import { findMenuItem } from '@/utils/navigation/route'
</script>

<style scoped>
#app-sidebar {
  transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
```

注意：`currentChildren` 仍然使用了 `findMenuItem`，而这个函数已经从本地删除并改为了 import。由于 `<script setup>` 中 `import` 必须在所有其他代码之前，需要将 `import` 语句移到顶部。

让我修正：将 `import { findMenuItem } from '@/utils/navigation/route'` 移到脚本顶部的 import 区域。

```ts
// 脚本顶部 imports
import { findMenuItem } from '@/utils/navigation/route'
```

- [ ] **Step 2: 验证构建**

Run: `pnpm build-only`
预期：构建成功

- [ ] **Step 3: 提交**

```bash
git add -A
git commit -m "refactor: simplify views/index.vue with ZhaoSidebar + useMenuNavigation"
```

---

### Task 8: 更新 zhao-header-bar/index.vue — 使用新组件和组合式函数

**Files:**

- Modify: `src/components/layouts/zhao-header-bar/index.vue`

- [ ] **Step 1: 修改 HeaderBar — 替换图标按钮和用户菜单，使用 useMenuNavigation**

具体修改：

1. 添加 imports：
   ```ts
   import ZhaoIconButton from '@/components/layouts/zhao-icon-button/index.vue'
   import ZhaoUserDropdown from '@/components/layouts/zhao-user-dropdown/index.vue'
   import { useMenuNavigation } from '@/hooks/core/useMenuNavigation'
   ```
2. 添加 `const nav = useMenuNavigation()`
3. 将 `onMenuSelect` 替换为使用 `nav.navigateByItem`
4. 模板中 6 处图标按钮替换为 `<ZhaoIconButton>`
5. 用户菜单替换为 `<ZhaoUserDropdown>`

模板替换明细（6 处图标按钮）：

```vue
<!-- 原来的折叠按钮 → -->
<ZhaoIconButton icon="ri:menu-fold-line" @click="$emit('toggle-menu')" />
<!-- 注意：折叠按钮是条件渲染且引用 emit，需要保留 v-if -->
```

实际上折叠按钮的图标是根据 menuOpen 状态动态切换的，所以不能简单替换为静态 icon prop。有两种选择：

- 为 ZhaoIconButton 加一个 props：`:icon="settingStore.menuOpen ? 'ri:menu-fold-line' : 'ri:menu-unfold-line'"`
- 或者保留折叠按钮内联

我选择让 ZhaoIconButton 接收动态 icon——它本来就是 props，动态传即可。但折叠按钮还有 v-if 条件：

```vue
<div
  v-if="shouldShowMenuButton && !isTopMenu"
  class="flex items-center justify-center w-8 h-8 rounded-md cursor-pointer ..."
  @click="$emit('toggle-menu')"
>
  <ZhaoIcon :icon="settingStore.menuOpen ? 'ri:menu-fold-line' : 'ri:menu-unfold-line'" class="text-lg" />
</div>
```

→ 改为：

```vue
<ZhaoIconButton
  v-if="shouldShowMenuButton && !isTopMenu"
  :icon="settingStore.menuOpen ? 'ri:menu-fold-line' : 'ri:menu-unfold-line'"
  @click="$emit('toggle-menu')"
/>
```

刷新按钮：

```vue
<!-- 原 -->
<div v-if="shouldShowRefreshButton" class="flex ..." @click="common.refresh">
  <ZhaoIcon icon="ri:refresh-line" class="text-lg" />
</div>

<!-- 新 -->
<ZhaoIconButton v-if="shouldShowRefreshButton" icon="ri:refresh-line" @click="common.refresh" />
```

搜索按钮：

```vue
<ZhaoIconButton
  v-if="shouldShowGlobalSearch"
  icon="ri:search-line"
  @click="mittBus.emit('open-search')"
/>
```

全屏按钮：

```vue
<ZhaoIconButton
  v-if="shouldShowFullscreen"
  :icon="isFullscreen ? 'ri:fullscreen-exit-line' : 'ri:fullscreen-line'"
  @click="toggleFullscreen"
/>
```

设置按钮：

```vue
<ZhaoIconButton
  v-if="shouldShowSettings"
  icon="ri:settings-3-line"
  @click="mittBus.emit('open-settings')"
/>
```

主题切换按钮：

```vue
<ZhaoIconButton
  v-if="shouldShowThemeToggle"
  :icon="settingStore.isDark ? 'ri:sun-line' : 'ri:moon-line'"
  @click="toggleTheme"
/>
```

用户菜单：

```vue
<!-- 原 40+ 行用户菜单 -->
<div class="flex items-center gap-2 ml-2 px-2 py-1 ...">
  <div class="w-7 h-7 rounded-full ...">{{ userAvatarText }}</div>
  <span ...>{{ userName }}</span>
  <ZhaoIcon icon="ri:arrow-down-s-line" ... />
</div>
<a-dropdown>...</a-dropdown>

<!-- 新 1 行 -->
<ZhaoUserDropdown />
```

`onMenuSelect` 替换为 `nav.navigateByItem`：

```ts
// 删除原来 onMenuSelect 函数中的 router.push + worktabStore.openTab
// 改为：
const nav = useMenuNavigation()

const onMenuSelect = (item: AppRouteRecord) => {
  nav.navigateByItem(item)
}
```

删除不再需要的 imports：`useWorktabStore`（如果其他地方没用到的话需要保留）。

清理后的 script setup 不再需要：

- `userAvatarText`（移到 ZhaoUserDropdown）
- `userName`（移到 ZhaoUserDropdown）
- `useRouter`（如果只在 onUserMenuSelect 中使用则可以删除）
- `useUserStore`（移到 ZhaoUserDropdown）
- `Modal` from arco（移到 ZhaoUserDropdown）
- `onUserMenuSelect`（移到 ZhaoUserDropdown）
- `onMenuSelect` 简化为委托给 nav

保留：

- `isTopMenu` / `isTopLeftMenu`
- `shouldShow*` 功能开关
- `isFullscreen` / `toggleFullscreen`
- `toggleTheme`
- `onLanguageChange`
- `mittBus`
- `common`
- `useWorktabStore` — 需要检查是否还在用。原来 onMenuSelect 用了 worktabStore，但 nav.navigateByItem 内部已经处理了。

所以 `useWorktabStore` 不再需要，可以删除。

- [ ] **Step 2: 验证构建**

Run: `pnpm build-only`
预期：构建成功

- [ ] **Step 3: 提交**

```bash
git add -A
git commit -m "refactor: use ZhaoIconButton + ZhaoUserDropdown + useMenuNavigation in HeaderBar"
```

---

### Task 9: 死代码清理 + zhao-horizontal-menu 更新收尾

**Files:**

- Modify: `src/components/layouts/zhao-page-content/index.vue` — 删除死代码
- Modify: `src/components/layouts/zhao-menus/zhao-horizontal-menu/index.vue` — 确认 findMenuItem 替换完成（已在 Task 1 完成）
- Verify: 所有改动已就绪，项目整体构建通过

- [ ] **Step 1: 删除 page-content 中的死代码**

在 `src/components/layouts/zhao-page-content/index.vue` 中删除第 21-23 行：

```vue
<!-- 加载中占位 -->
<div v-if="false" class="absolute inset-0 flex items-center justify-center">
  <a-spin />
</div>
```

完整删除这三行。

- [ ] **Step 2: 确认 zhao-horizontal-menu 已更新**

检查 `src/components/layouts/zhao-menus/zhao-horizontal-menu/index.vue` 中已没有本地 `findItem` 函数，且 import 了 `findMenuItem` from `@/utils/navigation/route`。

- [ ] **Step 3: 全量构建验证**

Run: `pnpm build` （包含类型检查）
预期：类型检查 + 构建全部通过

- [ ] **Step 4: 最终提交**

```bash
git add -A
git commit -m "chore: cleanup dead code and finalize component extraction"
```

---

## Self-Review 检查

1. **Spec coverage:** 设计文档中的 7 个提取项全部有对应 task：
   - findMenuItem 迁移 → Task 1
   - useMenuNavigation → Task 2
   - ZhaoIconButton → Task 3
   - ZhaoUserDropdown → Task 4
   - WorkTab ContextMenu → Task 5
   - ZhaoSidebar → Task 6
   - 修改 index.vue → Task 7
   - 修改 HeaderBar → Task 8
   - 死代码清理 → Task 9

2. **Placeholder scan:** 无 TBD/TODO 占位符，每个 task 都有完整代码

3. **Type consistency:** 所有 props/emits 签名在组件定义和消费方之间一致

4. **Implementation order:** 按依赖顺序排列（utils → composable → simple components → sidebar → consumer updates）
