---

# 主题系统架构解析

> 基于 Vue 3 + Pinia + CSS 变量的动态主题系统，支持亮色/暗色/自动模式、自定义主题色、菜单主题、布局切换等完整功能。

---

## 一、整体架构

```
src/
├── config/
│   ├── index.ts              # 系统全局配置（主题列表、菜单布局、主色等）
│   └── setting.ts            # 设置默认值配置
├── store/modules/
│   └── setting.ts            # 设置状态管理（Pinia + 持久化）
├── hooks/core/
│   └── useTheme.ts           # 主题切换核心逻辑
├── utils/ui/
│   ├── colors.ts             # 颜色处理工具（Hex/RGB互转、变浅变深、Element Plus主题色）
│   ├── loading.ts            # 全屏加载动画（自动适配明暗主题）
│   └── index.ts              # UI工具统一导出
├── enums/
│   └── appEnum.ts            # 枚举定义（主题、菜单类型等）
└── types/
    ├── config/index.ts       # 配置类型定义
    └── store/index.ts        # Store 状态类型定义
```

---

## 二、核心流程：主题初始化

系统启动时，在 `main.ts` 中并没有直接调用主题初始化——而是通过 `App.vue` 中的布局组件在 `onMounted` 时触发。但 `useTheme.ts` 中提供了 `initializeTheme()` 函数，用于在应用启动时恢复用户保存的主题设置。

### 初始化做了什么？

```typescript
export function initializeTheme() {
  const settingStore = useSettingStore()
  const prefersDark = usePreferredDark()

  const applyThemeByMode = () => {
    const el = document.getElementsByTagName('html')[0]
    let actualTheme = settingStore.systemThemeType

    // 如果是 AUTO 模式，检测系统偏好
    if (settingStore.systemThemeMode === SystemThemeEnum.AUTO) {
      actualTheme = prefersDark.value ? SystemThemeEnum.DARK : SystemThemeEnum.LIGHT
      settingStore.systemThemeType = actualTheme
    }

    // 设置主题 class（'dark' 或 ''）
    const currentTheme = AppConfig.systemThemeStyles[actualTheme]
    el.setAttribute('class', currentTheme.className)

    // 设置主题色 CSS 变量
    setArcoThemeColor(settingStore.systemThemeColor)

    // 设置圆角 CSS 变量
    document.documentElement.style.setProperty('--custom-radius', `${settingStore.customRadius}rem`)
  }

  applyThemeByMode()

  // AUTO 模式下监听系统主题变化
  if (settingStore.systemThemeMode === SystemThemeEnum.AUTO) {
    watch(prefersDark, () => {
      if (settingStore.systemThemeMode === SystemThemeEnum.AUTO) {
        applyThemeByMode()
      }
    })
  }
}
```

**关键点：** 所有主题状态都持久化在 `localStorage`（通过 Pinia persist 插件），刷新页面后自动恢复。

---

## 三、主题切换的完整链路

当用户在设置面板点击"暗色主题"时，整个链路如下：

### 1. 用户操作 → Store Action

```typescript
// settingStore.setGlopTheme(theme, themeMode)
settingStore.setGlopTheme(SystemThemeEnum.DARK, SystemThemeEnum.DARK)
```

### 2. useTheme 切换主题

```typescript
export function useTheme() {
  const setSystemTheme = (theme, themeMode) => {
    // ① 临时禁用 CSS 过渡（防止闪烁）
    disableTransitions()

    const el = document.getElementsByTagName('html')[0]
    const isDark = theme === SystemThemeEnum.DARK

    // ② 设置 html 标签的 class
    const currentTheme = AppConfig.systemThemeStyles[theme]
    el.setAttribute('class', currentTheme.className) // '' 或 'dark'

    // ③ 生成主题色的 9 级明暗变体
    const primary = settingStore.systemThemeColor
    for (let i = 1; i <= 9; i++) {
      document.documentElement.style.setProperty(
        `--color-primary-6-light-${i}`,
        isDark ? getDarkColor(primary, i / 10) : getLightColor(primary, i / 10),
      )
    }

    // ④ 更新 Store（触发持久化）
    settingStore.setGlopTheme(theme, themeMode)

    // ⑤ 恢复过渡效果（双 requestAnimationFrame 确保下一帧生效）
    requestAnimationFrame(() => {
      requestAnimationFrame(() => enableTransitions())
    })
  }
}
```

### 3. 颜色计算工具

```typescript
// 颜色变浅：向白色方向混合
export function getLightColor(color: string, level: number): string {
  const rgb = hexToRgb(color)
  const lightRgb = rgb.map((value) => Math.floor((255 - value) * level + value))
  return rgbToHex(lightRgb[0], lightRgb[1], lightRgb[2])
}

// 颜色变深：向黑色方向缩放
export function getDarkColor(color: string, level: number): string {
  const rgb = hexToRgb(color)
  const darkRgb = rgb.map((value) => Math.floor(value * (1 - level)))
  return rgbToHex(darkRgb[0], darkRgb[1], darkRgb[2])
}

// 颜色混合：两种颜色按比例混合
export function colourBlend(color1: string, color2: string, ratio: number): string {
  const rgb1 = hexToRgb(color1)
  const rgb2 = hexToRgb(color2)
  const blended = rgb1.map((v, i) => Math.round(v * (1 - ratio) + rgb2[i] * ratio))
  return rgbToHex(blended[0], blended[1], blended[2])
}
```

---

## 四、CSS 变量体系

主题系统通过 CSS 变量驱动，不依赖任何 CSS-in-JS 方案。

### 系统预设变量

| CSS 变量                           | 来源                        | 用途                      |
| ---------------------------------- | --------------------------- | ------------------------- |
| `--color-primary-6`                | `setArcoThemeColor()`       | Element Plus 主色         |
| `--color-primary-6-light-{1..9}`   | `setArcoThemeColor()`       | Element Plus 主色浅色变体 |
| `--color-primary-6-dark-{1..9}`    | `handleElementThemeColor()` | Element Plus 主色深色变体 |
| `--color-primary-6-custom-{1..15}` | `setArcoThemeColor()`       | 更细腻的浅色渐变          |
| `--custom-radius`                  | `setCustomRadius()`         | 全局圆角大小              |

### 暗色主题切换

通过 `<html class="dark">` 控制，项目中使用的 UI 库（Arco Design）原生支持 `.dark` 选择器下的样式覆盖。

```typescript
// config/index.ts
systemThemeStyles: {
  [SystemThemeEnum.LIGHT]: { className: '' },
  [SystemThemeEnum.DARK]: { className: 'dark' },
}
```

---

## 五、菜单主题管理

菜单主题独立于系统主题，支持三种风格：

```typescript
// config/index.ts
themeList: [
  {
    theme: MenuThemeEnum.DESIGN,
    background: '#FFFFFF',
    systemNameColor: 'var(--art-gray-800)',
    iconColor: '#6B6B6B',
    textColor: '#29343D',
    img: configImages.menuStyles.design,
  },
  {
    theme: MenuThemeEnum.DARK,
    background: '#191A23',
    systemNameColor: '#D9DADB',
    iconColor: '#BABBBD',
    textColor: '#BABBBD',
    img: configImages.menuStyles.dark,
  },
  {
    theme: MenuThemeEnum.LIGHT,
    background: '#ffffff',
    systemNameColor: 'var(--art-gray-800)',
    iconColor: '#6B6B6B',
    textColor: '#29343D',
    img: configImages.menuStyles.light,
  },
]
```

在 Layout 组件中通过计算属性获取当前菜单主题：

```typescript
const getMenuTheme = computed((): MenuThemeType => {
  const theme = AppConfig.themeList.find((item) => item.theme === menuThemeType.value)
  if (isDark.value) {
    return AppConfig.darkMenuStyles[0] // 暗色模式下强制使用暗色菜单
  }
  return theme
})
```

**关键设计：** 暗色系统主题下，菜单主题被强制覆盖为暗色，避免亮色菜单在暗色背景中突兀。

---

## 六、设置面板的数据流

### 6.1 默认值配置

所有设置的默认值集中在 `config/setting.ts`：

```typescript
export const SETTING_DEFAULT_CONFIG = {
  menuType: MenuTypeEnum.LEFT, // 左侧菜单
  menuOpenWidth: 230, // 菜单宽度
  systemThemeType: SystemThemeEnum.AUTO, // 自动主题
  menuThemeType: MenuThemeEnum.DESIGN, // 设计风格菜单
  systemThemeColor: '#5D87FF', // 默认主色
  showCrumbs: true, // 显示面包屑
  showWorkTab: true, // 显示标签页
  customRadius: '0.75', // 圆角大小（rem）
  containerWidth: ContainerWidthEnum.FULL, // 全屏宽度
  // ... 更多配置
}
```

### 6.2 Store 状态管理

`settingStore` 使用 Pinia + `pinia-plugin-persistedstate` 自动持久化到 `localStorage`：

```typescript
export const useSettingStore = defineStore(
  'settingStore',
  () => {
    // 所有状态 ref 定义
    const menuType = ref(SETTING_DEFAULT_CONFIG.menuType)
    const systemThemeColor = ref(SETTING_DEFAULT_CONFIG.systemThemeColor)
    // ...

    // 计算属性
    const getMenuTheme = computed(/* ... */)
    const isDark = computed(() => systemThemeType.value === SystemThemeEnum.DARK)
    const getCustomRadius = computed(() => customRadius.value + 'rem')

    // Actions
    const setElementTheme = (theme: string) => {
      systemThemeColor.value = theme
      setArcoThemeColor(theme) // 同步更新 CSS 变量
    }
    const setCustomRadius = (radius: string) => {
      customRadius.value = radius
      document.documentElement.style.setProperty('--custom-radius', `${radius}rem`)
    }
    // ...
  },
  { persist: { key: 'setting', storage: localStorage } },
)
```

### 6.3 组件中使用

```vue
<!-- 布局组件中直接绑定 store 状态 -->
<aside :style="{ width: sidebarWidth, background: getMenuTheme.background }">
  <a-menu
    :selected-keys="[route.path]"
    :collapsed="!menuOpen"
    :accordion="settingStore.uniqueOpened"
  >
    <!-- 菜单项 -->
  </a-menu>
</aside>
```

---

## 七、可配置项一览

### 布局相关

| 配置项             | 类型                 | 默认值  | 说明                 |
| ------------------ | -------------------- | ------- | -------------------- |
| `menuType`         | `MenuTypeEnum`       | `LEFT`  | 左侧/顶部/混合/双栏  |
| `menuOpenWidth`    | `number`             | `230`   | 菜单展开宽度(px)     |
| `menuOpen`         | `boolean`            | `true`  | 菜单是否展开         |
| `dualMenuShowText` | `boolean`            | `false` | 双栏菜单是否显示文字 |
| `containerWidth`   | `ContainerWidthEnum` | `FULL`  | 容器宽度(全屏/固定)  |

### 主题相关

| 配置项             | 类型              | 默认值    | 说明           |
| ------------------ | ----------------- | --------- | -------------- |
| `systemThemeType`  | `SystemThemeEnum` | `AUTO`    | 亮色/暗色/自动 |
| `systemThemeColor` | `string`          | `#5D87FF` | 系统主色       |
| `menuThemeType`    | `MenuThemeEnum`   | `DESIGN`  | 菜单主题风格   |

### 界面显示

| 配置项             | 类型      | 默认值  | 说明       |
| ------------------ | --------- | ------- | ---------- |
| `showCrumbs`       | `boolean` | `true`  | 面包屑     |
| `showWorkTab`      | `boolean` | `true`  | 标签页     |
| `showLanguage`     | `boolean` | `true`  | 语言切换   |
| `showNprogress`    | `boolean` | `false` | 顶部进度条 |
| `watermarkVisible` | `boolean` | `false` | 水印       |

### 功能开关

| 配置项          | 类型      | 默认值  | 说明       |
| --------------- | --------- | ------- | ---------- |
| `uniqueOpened`  | `boolean` | `true`  | 手风琴菜单 |
| `colorWeak`     | `boolean` | `false` | 色弱模式   |
| `boxBorderMode` | `boolean` | `true`  | 边框模式   |

### 样式细节

| 配置项           | 类型     | 默认值          | 说明          |
| ---------------- | -------- | --------------- | ------------- |
| `customRadius`   | `string` | `'0.75'`        | 全局圆角(rem) |
| `pageTransition` | `string` | `'slide-left'`  | 页面过渡动画  |
| `tabStyle`       | `string` | `'tab-default'` | 标签页样式    |

---

## 八、设计亮点总结

| 设计                  | 说明                                                         |
| --------------------- | ------------------------------------------------------------ |
| **CSS 变量驱动**      | 所有主题色、圆角等通过 CSS 变量控制，无运行时 CSS-in-JS 开销 |
| **明暗变体自动生成**  | 主色输入后自动计算 9 级浅色 + 9 级深色 + 15 级自定义渐变     |
| **过渡闪烁防护**      | 切换主题时临时禁用所有 CSS transition，避免颜色突变时的闪烁  |
| **AUTO 模式响应式**   | 通过 `usePreferredDark()` 监听系统主题变化，自动跟随         |
| **菜单主题独立**      | 菜单主题与系统主题解耦，但暗色模式下强制使用暗色菜单         |
| **持久化自动恢复**    | Pinia persist 插件自动保存/恢复所有设置，刷新不丢失          |
| **配置集中管理**      | 默认值、类型定义、枚举、Store 分层清晰，修改一处即可         |
| **Element Plus 适配** | 完整生成 Arco Design 的 `--color-primary-6-*` 变量体系       |
