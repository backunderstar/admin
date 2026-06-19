<!-- ============================================================
  LoginView — 系统登录页

  ## 设计思路
  - Editorial Split 布局：左侧品牌展示区 + 右侧登录表单
  - Ethereal Glass 美学：深色渐变背景、径向渐变光晕
  - Double-Bezel 嵌套架构：外框 + 内芯双层容器
  - Arco Design Form：统一表单验证、提交逻辑
  - TailwindCSS：全响应式布局、动画系统
  - 登录成功自动跳转 redirect 参数指向的页面

  ## 学习要点
  1. 组合式 API（setup script）
  2. Arco 表单 + 验证
  3. Tailwind 响应式设计（lg: / hidden）
  4. 国际化 $t 使用
  5. 登录状态管理（Pinia store）
  6. 记住密码本地存储
  ============================================================ -->
<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Message } from '@arco-design/web-vue'
import { useUserStore } from '@/store/modules/user'
import { fetchLogin } from '@/api/auth'
import { HttpError } from '@/utils/http/error'
import SlideVerify from '@/components/SlideVerify.vue'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const userStore = useUserStore()

// ── 表单数据 ──────────────────────────────────────────────
const loginForm = reactive({
  userName: '',
  password: '',
})

// ── 表单状态 ──────────────────────────────────────────────
const loading = ref(false)
const rememberPwd = ref(false)
const formRef = ref<InstanceType<(typeof import('@arco-design/web-vue'))['Form']>>()

// ── 快速选择账号 ──────────────────────────────────────────
type SelectValue =
  | string
  | number
  | boolean
  | Record<string, any>
  | (string | number | boolean | Record<string, any>)[]
const selectedAccount = ref<SelectValue | undefined>()

const accounts = computed(() => [
  { key: 'super', label: t('login.roles.super'), userName: 'Super', password: '123456' },
  { key: 'admin', label: t('login.roles.admin'), userName: 'Admin', password: '123456' },
  { key: 'user', label: t('login.roles.user'), userName: 'User', password: '123456' },
])

function handleAccountChange(value: SelectValue | undefined) {
  const account = accounts.value.find((a) => a.key === value)
  if (account) {
    loginForm.userName = account.userName
    loginForm.password = account.password
  }
}

// ── 滑块验证 ──────────────────────────────────────────────
const slideVerifyRef = ref<InstanceType<typeof SlideVerify>>()
const isPassing = ref(false)
const isClickPass = ref(false)

// ── 表单校验规则 ──────────────────────────────────────────
const rules = {
  userName: [
    {
      required: true,
      message: t('login.placeholder.username'),
    },
  ],
  password: [
    {
      required: true,
      message: t('login.placeholder.password'),
    },
    {
      minLength: 6,
      message: t('register.rule.passwordLength'),
    },
  ],
}

// ── 记住密码 ──────────────────────────────────────────────
const REMEMBER_KEY = 'remembered_login'

function loadRemembered() {
  try {
    const saved = localStorage.getItem(REMEMBER_KEY)
    if (saved) {
      const data = JSON.parse(saved)
      loginForm.userName = data.userName ?? ''
      loginForm.password = data.password ?? ''
      rememberPwd.value = true
    }
  } catch {
    // 数据损坏就当没保存过
  }
}

function saveRemembered() {
  if (rememberPwd.value) {
    localStorage.setItem(
      REMEMBER_KEY,
      JSON.stringify({ userName: loginForm.userName, password: loginForm.password }),
    )
  } else {
    localStorage.removeItem(REMEMBER_KEY)
  }
}

// ── 登录提交 ──────────────────────────────────────────────
async function handleLogin() {
  // 1. 表单校验
  const errors = await formRef.value?.validate()
  if (errors) return

  // 2. 滑块验证
  if (!isPassing.value) {
    isClickPass.value = true
    return
  }

  loading.value = true
  try {
    // 3. 调用登录 API
    const res = await fetchLogin({
      userName: loginForm.userName,
      password: loginForm.password,
    })

    // 4. 安全校验：必须拿到 token
    if (!res.token) {
      throw new Error(t('login.fail.noToken'))
    }

    // 5. 存储令牌和登录状态
    userStore.setToken(res.token, res.refreshToken)
    userStore.setLoginStatus(true)

    // 6. 保存记住密码
    saveRemembered()

    // 7. 登录成功提示
    Message.success(t('login.success.title'))

    // 8. 跳转：优先使用 redirect 参数，没有则去首页
    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
  } catch (error) {
    // HttpError 已在 axios 拦截器中统一显示错误提示，这里无需重复处理
    if (!(error instanceof HttpError)) {
      console.error('[LoginView] 登录异常:', error)
    }
  } finally {
    loading.value = false
    // 重置滑块验证，防止下次登录绕过
    isPassing.value = false
    isClickPass.value = false
    slideVerifyRef.value?.resetVerify()
  }
}

// ── 初始化 ────────────────────────────────────────────────
onMounted(() => {
  // 从 localStorage 恢复上次保存的账号密码
  loadRemembered()
})
</script>

<template>
  <!-- ══════════════════════════════════════════════════════════
    外层容器：min-h-[100dvh] 兼容 iOS Safari 底部安全区
  -->
  <div class="relative flex min-h-[100dvh] w-full overflow-hidden bg-[#0B0C10]">
    <!-- ═══════════════════════════════════════════════════════
      装饰层：径向渐变光晕 + 噪点纹理（固定在底层，不参与滚动）
    -->
    <div class="fixed inset-0 pointer-events-none">
      <!-- 左上角大光晕 -->
      <div
        class="absolute -left-48 -top-48 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-[#6366F1]/20 via-[#8B5CF6]/10 to-transparent blur-[120px] animate-[float_20s_ease-in-out_infinite]"
      />
      <!-- 右下角小光晕 -->
      <div
        class="absolute -bottom-36 -right-36 h-[400px] w-[400px] rounded-full bg-gradient-to-tl from-[#06B6D4]/15 via-[#3B82F6]/10 to-transparent blur-[100px] animate-[float_24s_ease-in-out_infinite_2s]"
      />
      <!-- 中央柔和光晕 -->
      <div
        class="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#6366F1]/5 blur-[140px]"
      />
      <!-- 噪点纹理覆层 -->
      <div
        class="absolute inset-0 opacity-[0.03]"
        style="
          background-image: url('data:image/svg+xml,%3Csvg viewBox=%270 0 256 256%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter id=%27noise%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%274%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url%28%23noise%29%27/%3E%3C/svg%3E');
          background-repeat: repeat;
          background-size: 180px;
        "
      />
    </div>

    <!-- ═══════════════════════════════════════════════════════
      主内容层（relative z-10 让内容在装饰层之上）
    -->
    <div class="relative z-10 flex w-full min-h-[100dvh]">
      <!-- ====================================================
        左侧品牌展示区 | lg: 显示，移动端隐藏
          55% 宽度，垂直居中
      ==================================================== -->
      <div class="hidden lg:flex w-[55%] flex-col justify-center px-16 py-24">
        <div class="max-w-[520px] ml-auto mr-16">
          <!-- 品牌标识 -->
          <div
            class="mb-12 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-2 backdrop-blur-md"
          >
            <!-- Logo 图标（简单几何体） -->
            <svg
              class="h-5 w-5 text-indigo-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            <span class="text-sm font-medium tracking-wide text-white/80"> 朝而往 · Zhao </span>
          </div>

          <!-- 主标题：大号、粗重、层次感 -->
          <h1
            class="mb-6 text-5xl font-bold leading-[1.1] tracking-tight text-white lg:text-6xl xl:text-7xl"
          >
            {{ t('login.leftView.title') }}
          </h1>

          <!-- 副标题 -->
          <p class="mb-16 text-lg leading-relaxed text-white/50 lg:text-xl">
            {{ t('login.leftView.subTitle') }}
          </p>

          <!-- 底部装饰装饰线 + 版本信息 -->
          <div class="flex items-center gap-4">
            <div class="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent" />
            <span class="text-xs font-medium tracking-widest text-white/30 uppercase">
              v1.0.0
            </span>
          </div>
        </div>
      </div>

      <!-- ====================================================
        右侧表单区 | 全宽（移动端）/ 45%（桌面端）
      ==================================================== -->
      <div class="flex w-full lg:w-[45%] items-center justify-center px-4 py-12 lg:px-10">
        <!-- ── Double-Bezel 嵌套架构 ─────────────────────
          外层 Shell：带半透明背景 + 圆角
        -->
        <div class="w-full max-w-[440px] rounded-[2rem] bg-white/5 p-2 ring-1 ring-white/10">
          <!-- 内层 Core：纯白背景，圆角 = 外层圆角 - padding -->
          <div
            class="rounded-[calc(2rem-0.375rem)] bg-white px-8 py-10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] sm:px-10 sm:py-12"
          >
            <!-- ── 欢迎文字 ───────────────────────── -->
            <div class="mb-8 text-center">
              <h2 class="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl">
                {{ t('login.title') }}
              </h2>
              <p class="text-sm text-gray-500 sm:text-base">
                {{ t('login.subTitle') }}
              </p>
            </div>

            <!-- ── 快速选择账号（开发用） ──────────── -->
            <div class="mb-6 flex items-center gap-3">
              <span class="shrink-0 text-xs font-medium text-gray-400">
                {{ t('login.quickSelect') }}
              </span>
              <a-select
                v-model="selectedAccount"
                :placeholder="t('login.quickSelect')"
                allow-clear
                size="small"
                class="flex-1"
                @change="handleAccountChange"
              >
                <a-option
                  v-for="item in accounts"
                  :key="item.key"
                  :value="item.key"
                  :label="item.label"
                />
              </a-select>
            </div>

            <!-- ── 登录表单 ───────────────────────── -->
            <a-form
              ref="formRef"
              :model="loginForm"
              :rules="rules"
              layout="vertical"
              auto-label-width
              class="w-full"
              @submit="handleLogin"
            >
              <!-- 用户名 -->
              <a-form-item field="userName" :validate-trigger="['change', 'blur']" hide-label>
                <a-input
                  v-model="loginForm.userName"
                  :placeholder="t('login.placeholder.username')"
                  size="large"
                  allow-clear
                >
                  <template #prefix>
                    <!-- Phone / User 图标（超细线条） -->
                    <svg
                      class="h-4 w-4 text-gray-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </template>
                </a-input>
              </a-form-item>

              <!-- 密码 -->
              <a-form-item field="password" :validate-trigger="['change', 'blur']" hide-label>
                <a-input-password
                  v-model="loginForm.password"
                  :placeholder="t('login.placeholder.password')"
                  size="large"
                  allow-clear
                >
                  <template #prefix>
                    <!-- Lock 图标 -->
                    <svg
                      class="h-4 w-4 text-gray-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </template>
                </a-input-password>
              </a-form-item>

              <!-- 记住密码 + 忘记密码 -->
              <div class="mb-6 flex items-center justify-between">
                <a-checkbox v-model="rememberPwd">
                  {{ t('login.rememberPwd') }}
                </a-checkbox>
                <a-link class="text-sm !no-underline hover:!underline" :hoverable="false">
                  {{ t('login.forgetPwd') }}
                </a-link>
              </div>

              <!-- 滑块验证 -->
              <div class="mb-6">
                <SlideVerify ref="slideVerifyRef" v-model="isPassing" :width="'100%'" />
                <!-- 提示文字：点击登录但未通过滑块验证时显示 -->
                <transition name="slide-fade">
                  <p
                    v-if="isClickPass && !isPassing"
                    class="mt-2 text-xs text-[rgb(var(--danger-6))]"
                  >
                    {{ t('login.placeholder.slider') }}
                  </p>
                </transition>
              </div>

              <!-- 登录按钮：全宽、大号、圆角 pill -->
              <a-button
                html-type="submit"
                type="primary"
                size="large"
                :loading="loading"
                class="w-full !rounded-full !h-12 !text-base font-medium tracking-wide"
              >
                {{ loading ? '' : t('login.btnText') }}
              </a-button>
            </a-form>

            <!-- ── 注册入口 ───────────────────────── -->
            <div class="mt-8 text-center text-sm text-gray-400">
              {{ t('login.noAccount') }}
              <a-link class="text-sm font-medium !no-underline hover:!underline" :hoverable="false">
                {{ t('login.register') }}
              </a-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<!-- ══════════════════════════════════════════════════════════
  全局关键帧动画
    float: 光晕缓慢飘移，模拟云层浮动感
══════════════════════════════════════════════════════════ -->
<style scoped>
@keyframes float {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }

  25% {
    transform: translate(30px, -20px) scale(1.05);
  }

  50% {
    transform: translate(-10px, 15px) scale(0.95);
  }

  75% {
    transform: translate(20px, 10px) scale(1.02);
  }
}

/* ── 提示文字过渡动画 ────────────────── */
.slide-fade-enter-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-fade-leave-active {
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
