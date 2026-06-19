/// <reference types="vite-plus/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, unknown>
  export default component
}

// 全局变量声明
declare const __APP_VERSION__: string // 版本号
