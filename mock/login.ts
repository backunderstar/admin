/**
 * 登录 Mock
 *
 * 处理 POST /api/login 请求。
 * 与登录页 UI 下拉框的账号（Super/Admin/User）对齐，
 * 验证密码后返回对应的 token。
 *
 * ## 请求
 *
 * ```json
 * { "userName": "Admin", "password": "123456" }
 * ```
 *
 * ## 成功响应
 *
 * ```json
 * { "code": 200, "msg": "登录成功", "data": { "token": "...", "refreshToken": "..." } }
 * ```
 *
 * ## 失败响应
 *
 * - 400: 用户名或密码不能为空 / 用户名或密码错误
 *
 * @module mock/login
 */
import { VALID_CREDENTIALS, TOKEN_ADMIN } from './_mockData'

export default [
  {
    url: '/api/login',
    method: 'post',
    response: ({ body }: { body: { userName?: string; password?: string } }) => {
      const { userName, password } = body

      if (!userName || !password) {
        return { code: 400, msg: '用户名或密码不能为空', data: null }
      }

      const credential = VALID_CREDENTIALS[userName]
      if (!credential || credential.password !== password) {
        return { code: 400, msg: '用户名或密码错误', data: null }
      }

      return {
        code: 200,
        msg: '登录成功',
        data: {
          token: credential.token,
          refreshToken:
            credential.token === TOKEN_ADMIN
              ? 'mock-refresh-token-admin-xxx'
              : 'mock-refresh-token-user-xxx',
        },
      }
    },
  },
]
