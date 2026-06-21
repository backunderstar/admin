/**
 * 用户相关 Mock
 *
 * ## 接口列表
 *
 * ### GET /api/user/info — 获取当前用户信息
 * 需要 Authorization 头携带有效 token。
 * 返回当前登录用户的详细信息（角色、权限按钮等）。
 * 路由守卫（beforeEach）在初始化时调用此接口。
 *
 * ### GET /api/user/list — 获取用户列表（分页）
 * 需要 Authorization 头携带有效 token。
 * 支持按 userName、status、userGender、userPhone、userEmail、id 过滤。
 * 返回标准分页结构。
 *
 * @module mock/user
 */
import { validTokens, allUsers } from './_mockData'
import { getToken, paginate, filterUsers } from './util'

export default [
  // ── 获取当前用户信息 ──────────────────────────────────
  {
    url: '/api/user/info',
    method: 'get',
    response: ({ headers }: { headers: Record<string, string> }) => {
      const token = getToken(headers)
      if (!token || !validTokens[token]) {
        return { code: 401, msg: '未登录或登录已过期', data: null }
      }
      return { code: 200, msg: 'success', data: validTokens[token] }
    },
  },

  // ── 获取用户列表（分页） ──────────────────────────────
  {
    url: '/api/user/list',
    method: 'get',
    response: ({
      headers,
      query,
    }: {
      headers: Record<string, string>
      query: Record<string, string | undefined>
    }) => {
      const token = getToken(headers)
      if (!token || !validTokens[token]) {
        return { code: 401, msg: '未登录或登录已过期', data: null }
      }

      const filtered = filterUsers(allUsers, query)
      return { code: 200, msg: 'success', data: paginate(filtered, query) }
    },
  },
]
