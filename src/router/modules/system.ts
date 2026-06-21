import type { AppRouteRecord } from '@/types/router'

/**
 * 系统管理路由模块
 *
 * 包含用户管理和角色管理两个子页面
 *
 * @module router/modules/system
 * @author Zhao
 */
export const systemRoutes: AppRouteRecord = {
  name: 'System',
  path: '/system',
  component: '/index',
  meta: {
    title: 'menus.system.title',
    icon: 'ri:settings-3-line',
    roles: ['R_SUPER', 'R_ADMIN'],
  },
  children: [
    {
      path: 'user',
      name: 'SystemUser',
      component: '/system/user/index',
      meta: {
        title: 'menus.system.user',
        icon: 'ri:user-settings-line',
        keepAlive: true,
      },
    },
    {
      path: 'role',
      name: 'SystemRole',
      component: '/system/role/index',
      meta: {
        title: 'menus.system.role',
        icon: 'ri:shield-user-line',
        keepAlive: true,
      },
    },
  ],
}
