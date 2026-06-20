/**
 * 快速入口配置
 * 包含：应用列表、快速链接等配置
 */
import type { FastEnterConfig } from '@/types/config'

const fastEnterConfig: FastEnterConfig = {
  // 显示条件（屏幕宽度）
  minWidth: 1200,
  // 应用列表
  applications: [
    {
      name: '工作台',
      description: '系统概览与数据统计',
      icon: 'ri:pie-chart-line',
      iconColor: '#377dff',
      enabled: true,
      order: 1,
      routeName: 'Console',
    },
    {
      name: '分析页',
      description: '数据分析与可视化',
      icon: 'ri:game-line',
      iconColor: '#ff3b30',
      enabled: true,
      order: 2,
      routeName: 'Analysis',
    },
  ],
  // 快速链接
  quickLinks: [
    {
      name: '登录',
      enabled: true,
      order: 1,
      routeName: 'Login',
    },
    {
      name: '工作台',
      enabled: true,
      order: 2,
      routeName: 'Console',
    },
    {
      name: '分析页',
      enabled: true,
      order: 3,
      routeName: 'Analysis',
    },
  ],
}

export default Object.freeze(fastEnterConfig)
