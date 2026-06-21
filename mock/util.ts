/**
 * Mock 工具函数
 *
 * 提供 token 提取、分页、过滤等共享工具
 *
 * ## 函数列表
 *
 * - getToken(headers) — 从请求头中提取 token
 * - paginate(items, query) — 对数组进行分页切片
 * - filterUsers(users, query) — 按查询参数过滤用户列表
 *
 * @module mock/util
 */

/**
 * 从请求头中提取 token
 *
 * 兼容两种格式：
 * - Authorization: Bearer <token>  （标准 Bearer 格式）
 * - Authorization: <token>         （直接传 token）
 *
 * @param headers - 请求头对象（由 vite-plugin-mock 自动传入）
 * @returns 提取到的 token 字符串，无 token 时返回 null
 *
 * @example
 * ```ts
 * const token = getToken({ authorization: 'Bearer mock-token-xxx' })
 * // => 'mock-token-xxx'
 * ```
 */
export function getToken(headers: Record<string, string>): string | null {
  const auth = headers['authorization']
  if (!auth) return null
  return auth.startsWith('Bearer ') ? auth.slice(7) : auth
}

/**
 * 分页辅助函数
 *
 * 从 query 中解析 current（当前页码）和 size（每页条数），
 * 对数据数组进行切片并返回标准分页结构。
 *
 * @param items - 待分页的完整数据数组
 * @param query - 请求查询参数字典（由 vite-plugin-mock 自动传入）
 * @returns 标准分页响应结构 { records, current, size, total }
 *
 * @example
 * ```ts
 * paginate([1,2,3,4,5], { current: '2', size: '2' })
 * // => { records: [3,4], current: 2, size: 2, total: 5 }
 * ```
 */
export function paginate<T>(
  items: T[],
  query: Record<string, string | undefined>,
): { records: T[]; current: number; size: number; total: number } {
  const current = Math.max(1, parseInt(query.current || '1', 10) || 1)
  const size = Math.max(1, Math.min(100, parseInt(query.size || '10', 10) || 10))
  const total = items.length
  const start = (current - 1) * size
  const records = items.slice(start, start + size)
  return { records, current, size, total }
}

/**
 * 用户列表过滤函数
 *
 * 根据查询参数对用户数据进行多字段模糊/精确过滤。
 * 所有过滤条件同时生效（AND 关系）。
 *
 * 支持的过滤字段：
 * - id        — 精确匹配用户 ID
 * - userName  — 模糊匹配用户名（不区分大小写）
 * - userGender — 精确匹配性别（'0'=未知, '1'=男, '2'=女）
 * - userPhone — 模糊匹配手机号
 * - userEmail — 模糊匹配邮箱（不区分大小写）
 * - status    — 精确匹配状态（'1'=启用, '2'=禁用）
 *
 * @param users - 待过滤的用户列表
 * @param query - 请求查询参数字典
 * @returns 过滤后的用户列表
 */
export function filterUsers(
  users: Api.SystemManage.UserListItem[],
  query: Record<string, string | undefined>,
): Api.SystemManage.UserListItem[] {
  let filtered = [...users]

  const { id, userName, userGender, userPhone, userEmail, status } = query

  if (id) filtered = filtered.filter((u) => u.id === Number(id))
  if (userName)
    filtered = filtered.filter((u) => u.userName.toLowerCase().includes(userName.toLowerCase()))
  if (userGender) filtered = filtered.filter((u) => u.userGender === userGender)
  if (userPhone) filtered = filtered.filter((u) => u.userPhone.includes(userPhone))
  if (userEmail)
    filtered = filtered.filter((u) => u.userEmail.toLowerCase().includes(userEmail.toLowerCase()))
  if (status) filtered = filtered.filter((u) => u.status === status)

  return filtered
}
