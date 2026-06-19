/**
 * 全局 Loading 加载管理模块
 *
 * 提供统一的全屏加载动画管理（自定义 DOM 实现，无第三方依赖）
 *
 * ## 主要功能
 *
 * - 全屏 Loading 显示和隐藏
 * - 自动适配明暗主题背景色
 * - 自定义 SVG 加载动画
 * - 单例模式防止重复创建
 * - 锁定页面交互
 *
 * @module utils/ui/loading
 * @author Zhao
 */
import { fourDotsSpinnerSvg } from '@/assets/svg/loading'

let overlayEl: HTMLElement | null = null

/** 获取当前主题对应的 loading 背景色 */
const getLoadingBackground = (): string => {
  const isDark = document.documentElement.classList.contains('dark')
  return isDark ? 'rgba(7, 7, 7, 0.85)' : '#fff'
}

/** 获取系统主题色 */
const getThemeColor = (): string => {
  const style = getComputedStyle(document.documentElement)
  return style.getPropertyValue('--arcoblue-6').trim() || '#5D87FF'
}

/** 创建全屏 loading 遮罩层 */
function createOverlay(): HTMLElement {
  const overlay = document.createElement('div')
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 9999;
    display: flex; align-items: center; justify-content: center;
    background: ${getLoadingBackground()};
    cursor: wait;
  `
  // 渲染 SVG 动画，替换主题色变量
  const wrapper = document.createElement('div')
  wrapper.innerHTML = fourDotsSpinnerSvg.replace('var(--theme-color)', getThemeColor())
  overlay.appendChild(wrapper)
  document.body.style.overflow = 'hidden'
  return overlay
}

export const loadingService = {
  /** 显示 loading */
  showLoading(): () => void {
    if (!overlayEl) {
      overlayEl = createOverlay()
      document.body.appendChild(overlayEl)
    }
    return () => this.hideLoading()
  },

  /** 隐藏 loading */
  hideLoading(): void {
    if (overlayEl) {
      document.body.removeChild(overlayEl)
      document.body.style.overflow = ''
      overlayEl = null
    }
  },
}
