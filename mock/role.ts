/**
 * 角色列表 Mock
 *
 * 处理 GET /api/role/list 请求。
 * 需要 Authorization 头携带有效 token。
 *
 * ## 支持过滤字段
 *
 * - roleName    — 角色名称（模糊匹配，不区分大小写）
 * - roleCode    — 角色编码（模糊匹配，不区分大小写）
 * - description — 角色描述（模糊匹配，不区分大小写）
 * - enabled     — 启用状态（精确匹配 'true' / 'false'）
 *
 * ## 响应结构
 *
 * ```json
 * {
 *   "code": 200,
 *   "msg": "success",
 *   "data": {
 *     "records": [...],
 *     "current": 1,
 *     "size": 10,
 *     "total": 5
 *   }
 * }
 * ```
 *
 * @module mock/role
 */
import { validTokens, allRoles } from './_mockData'
import { getToken, paginate } from './util'

export default [
  {
    url: '/api/role/list',
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

      let filtered = [...allRoles]

      const roleName = query.roleName
      const roleCode = query.roleCode
      const description = query.description
      const enabled = query.enabled

      if (roleName)
        filtered = filtered.filter((r) => r.roleName.toLowerCase().includes(roleName.toLowerCase()))
      if (roleCode)
        filtered = filtered.filter((r) => r.roleCode.toLowerCase().includes(roleCode.toLowerCase()))
      if (description)
        filtered = filtered.filter((r) =>
          r.description.toLowerCase().includes(description.toLowerCase()),
        )
      if (enabled !== undefined) filtered = filtered.filter((r) => String(r.enabled) === enabled)

      return { code: 200, msg: 'success', data: paginate(filtered, query) }
    },
  },
]
