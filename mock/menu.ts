/**
 * 菜单列表 Mock
 *
 * 处理 GET /api/v3/system/menus 请求。
 * 需要 Authorization 头携带有效 token。
 *
 * ## 使用场景
 *
 * 当前项目使用 VITE_ACCESS_MODE = frontend（前端权限模式），
 * 菜单由 MenuProcessor 从本地 asyncRoutes 加载，不调用此接口。
 * 仅在切换到 VITE_ACCESS_MODE = backend（后端权限模式）时生效。
 *
 * 返回的数据结构与 src/router/routes/asyncRoutes.ts 中的路由定义对齐，
 * 包含 Dashboard 和 Exception 两个顶级菜单及其子路由。
 *
 * @module mock/menu
 */
import { validTokens } from './_mockData'
import { getToken } from './util'

export default [
  {
    url: '/api/v3/system/menus',
    method: 'get',
    response: ({ headers }: { headers: Record<string, string> }) => {
      const token = getToken(headers)
      if (!token || !validTokens[token]) {
        return { code: 401, msg: '未登录或登录已过期', data: null }
      }

      return {
        code: 200,
        msg: 'success',
        data: [
          {
            name: 'Dashboard',
            path: '/dashboard',
            component: '/index',
            meta: {
              title: 'menus.dashboard.title',
              icon: 'ri:pie-chart-line',
              roles: ['R_SUPER', 'R_ADMIN'],
            },
            children: [
              {
                path: 'console',
                name: 'Console',
                component: '/dashboard/console',
                meta: {
                  title: 'menus.dashboard.console',
                  icon: 'ri:home-smile-2-line',
                  keepAlive: false,
                  fixedTab: true,
                },
              },
              {
                path: 'analysis',
                name: 'Analysis',
                component: '/dashboard/analysis',
                meta: {
                  title: 'menus.dashboard.analysis',
                  icon: 'ri:align-item-bottom-line',
                  keepAlive: false,
                },
              },
            ],
          },
          {
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
          },
          {
            name: 'Content',
            path: '/content',
            component: '/index',
            meta: {
              title: 'menus.content.title',
              icon: 'ri:file-list-3-line',
              roles: ['R_SUPER', 'R_ADMIN', 'R_EDITOR'],
            },
            children: [
              {
                path: 'article',
                name: 'ContentArticle',
                component: '/content/article/index',
                meta: {
                  title: 'menus.content.article',
                  icon: 'ri:article-line',
                  keepAlive: true,
                },
              },
              {
                path: 'tag',
                name: 'ContentTag',
                component: '/content/tag/index',
                meta: {
                  title: 'menus.content.tag',
                  icon: 'ri:price-tag-3-line',
                  keepAlive: true,
                },
              },
              {
                path: 'category',
                name: 'ContentCategory',
                component: '/content/category/index',
                meta: {
                  title: 'menus.content.category',
                  icon: 'ri:folder-2-line',
                  keepAlive: true,
                },
              },
              {
                path: 'image',
                name: 'ContentImage',
                component: '/content/image/index',
                meta: {
                  title: 'menus.content.image',
                  icon: 'ri:image-line',
                  keepAlive: true,
                },
              },
              {
                path: 'comment',
                name: 'ContentComment',
                component: '/content/comment/index',
                meta: {
                  title: 'menus.content.comment',
                  icon: 'ri:chat-1-line',
                  keepAlive: true,
                },
              },
            ],
          },
          {
            name: 'Exception',
            path: '/exception',
            component: '/index',
            meta: {
              title: 'menus.exception.title',
              icon: 'ri:error-warning-line',
            },
            children: [
              {
                path: '403',
                name: 'Exception403',
                component: '/exception/403',
                meta: {
                  title: 'menus.exception.forbidden',
                  keepAlive: true,
                  isHideTab: true,
                  isFullPage: true,
                },
              },
              {
                path: '404',
                name: 'Exception404',
                component: '/exception/404',
                meta: {
                  title: 'menus.exception.notFound',
                  keepAlive: true,
                  isHideTab: true,
                  isFullPage: true,
                },
              },
              {
                path: '500',
                name: 'Exception500',
                component: '/exception/500',
                meta: {
                  title: 'menus.exception.serverError',
                  keepAlive: true,
                  isHideTab: true,
                  isFullPage: true,
                },
              },
            ],
          },
        ],
      }
    },
  },
]
