import type { AppRouteRecord } from '@/types/router'
import { dashboardRoutes } from './dashboard'
import { exceptionRoutes } from './exception'

/**
 * 导出所有模块化路由
 */
export const routeModules: AppRouteRecord[] = [dashboardRoutes, exceptionRoutes]
