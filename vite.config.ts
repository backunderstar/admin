import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite-plus'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { vitePluginForArco } from '@arco-plugins/vite-vue'
import iconify from '@tomjs/vite-plugin-iconify'
import tailwindcss from '@tailwindcss/vite'
import { viteMockServe } from 'vite-plugin-mock'

// https://vite.dev/config/
export default ({ mode }: { mode: string }) => {
  const root = process.cwd()
  const env = loadEnv(mode, root)
  const {
    VITE_VERSION,
    VITE_PORT: _VITE_PORT,
    VITE_BASE_URL,
    VITE_API_URL,
    VITE_API_PROXY_URL,
  } = env

  console.log(`🚀 API_URL = ${VITE_API_URL}`)
  console.log(`🚀 VERSION = ${VITE_VERSION}`)

  return defineConfig({
    staged: {
      '*': 'vp check --fix',
    },
    lint: {
      jsPlugins: [{ name: 'vite-plus', specifier: 'vite-plus/oxlint-plugin' }],
      rules: { 'vite-plus/prefer-vite-plus-imports': 'error' },
      options: { typeAware: true, typeCheck: true },
    },
    fmt: {
      semi: false,
      singleQuote: true,
    },
    plugins: [
      vue(),
      vueDevTools(),
      tailwindcss(),
      vitePluginForArco({
        style: 'css',
      }),
      iconify({
        local: true, // 将所有图标集打包进dist目录
        // local: ['ep'] // 可选：只打包指定图标集(如element-plus)
      }),
      // 开发环境启用本地 Mock（vite-plugin-mock）
      ...(mode === 'development'
        ? [
            viteMockServe({
              mockPath: 'mock',
              enable: true,
              // 记录 mock 请求日志，方便调试
              logger: true,
            }),
          ]
        : []),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@asset': fileURLToPath(new URL('./src/assets', import.meta.url)),
        '@imgs': fileURLToPath(new URL('./src/assets/images', import.meta.url)),
        '@views': fileURLToPath(new URL('./src/views', import.meta.url)),
        '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
        '@hooks': fileURLToPath(new URL('./src/hooks', import.meta.url)),
        '@utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
        '@stores': fileURLToPath(new URL('./src/stores', import.meta.url)),
        '@router': fileURLToPath(new URL('./src/router', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      open: true,
      proxy: {
        '/api': {
          target: VITE_API_PROXY_URL,
          changeOrigin: true,
        },
      },
    },
    define: {
      __APP_VERSION__: JSON.stringify(VITE_VERSION),
    },
    base: VITE_BASE_URL,
  })
}
