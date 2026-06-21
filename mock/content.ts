/**
 * 文章管理 Mock
 */
import {
  allArticles,
  allTags,
  allCategories,
  allImages,
  allComments,
  validTokens,
} from './_mockData'
import { getToken, paginate } from './util'

type Query = Record<string, string | undefined>

export default [
  // ── 文章管理 ──────────────────────────────────────────
  {
    url: '/api/content/article/list',
    method: 'get',
    response: ({ headers, query }: { headers: Record<string, string>; query: Query }) => {
      const token = getToken(headers)
      if (!token || !validTokens[token]) return { code: 401, msg: '未登录', data: null }

      let filtered = [...allArticles]
      const { title, status, categoryId } = query
      if (title) filtered = filtered.filter((a) => a.title.includes(title))
      if (status) filtered = filtered.filter((a) => a.status === status)
      if (categoryId) filtered = filtered.filter((a) => a.categoryId === Number(categoryId))

      return { code: 200, msg: 'success', data: paginate(filtered, query) }
    },
  },
  {
    url: '/api/content/article/:id',
    method: 'get',
    response: ({ headers, query }: { headers: Record<string, string>; query: Query }) => {
      const token = getToken(headers)
      if (!token || !validTokens[token]) return { code: 401, msg: '未登录', data: null }

      const article = allArticles.find((a) => a.id === Number(query.id))
      if (!article) return { code: 404, msg: '文章不存在', data: null }
      return { code: 200, msg: 'success', data: article }
    },
  },
  {
    url: '/api/content/article',
    method: 'post',
    response: ({ headers, body: _body }: { headers: Record<string, string>; body: any }) => {
      const token = getToken(headers)
      if (!token || !validTokens[token]) return { code: 401, msg: '未登录', data: null }
      return { code: 200, msg: 'success', data: { id: Date.now() } }
    },
  },
  {
    url: '/api/content/article/:id',
    method: 'put',
    response: ({ headers }: { headers: Record<string, string> }) => {
      const token = getToken(headers)
      if (!token || !validTokens[token]) return { code: 401, msg: '未登录', data: null }
      return { code: 200, msg: 'success', data: null }
    },
  },
  {
    url: '/api/content/article/:id',
    method: 'delete',
    response: ({ headers }: { headers: Record<string, string> }) => {
      const token = getToken(headers)
      if (!token || !validTokens[token]) return { code: 401, msg: '未登录', data: null }
      return { code: 200, msg: 'success', data: null }
    },
  },

  // ── 标签管理 ──────────────────────────────────────────
  {
    url: '/api/content/tag/list',
    method: 'get',
    response: ({ headers, query }: { headers: Record<string, string>; query: Query }) => {
      const token = getToken(headers)
      if (!token || !validTokens[token]) return { code: 401, msg: '未登录', data: null }

      let filtered = [...allTags]
      const { tagName } = query
      if (tagName) filtered = filtered.filter((t) => t.tagName.includes(tagName))

      return { code: 200, msg: 'success', data: paginate(filtered, query) }
    },
  },
  {
    url: '/api/content/tag',
    method: 'post',
    response: ({ headers, body: _body }: { headers: Record<string, string>; body: any }) => {
      const token = getToken(headers)
      if (!token || !validTokens[token]) return { code: 401, msg: '未登录', data: null }
      return { code: 200, msg: 'success', data: { tagId: Date.now() } }
    },
  },
  {
    url: '/api/content/tag/:id',
    method: 'delete',
    response: ({ headers }: { headers: Record<string, string> }) => {
      const token = getToken(headers)
      if (!token || !validTokens[token]) return { code: 401, msg: '未登录', data: null }
      return { code: 200, msg: 'success', data: null }
    },
  },

  // ── 分类管理 ──────────────────────────────────────────
  {
    url: '/api/content/category/list',
    method: 'get',
    response: ({ headers, query }: { headers: Record<string, string>; query: Query }) => {
      const token = getToken(headers)
      if (!token || !validTokens[token]) return { code: 401, msg: '未登录', data: null }

      let filtered = [...allCategories]
      const { categoryName } = query
      if (categoryName) filtered = filtered.filter((c) => c.categoryName.includes(categoryName))

      return { code: 200, msg: 'success', data: paginate(filtered, query) }
    },
  },
  {
    url: '/api/content/category',
    method: 'post',
    response: ({ headers }: { headers: Record<string, string> }) => {
      const token = getToken(headers)
      if (!token || !validTokens[token]) return { code: 401, msg: '未登录', data: null }
      return { code: 200, msg: 'success', data: { categoryId: Date.now() } }
    },
  },
  {
    url: '/api/content/category/:id',
    method: 'delete',
    response: ({ headers }: { headers: Record<string, string> }) => {
      const token = getToken(headers)
      if (!token || !validTokens[token]) return { code: 401, msg: '未登录', data: null }
      return { code: 200, msg: 'success', data: null }
    },
  },

  // ── 图片管理 ──────────────────────────────────────────
  {
    url: '/api/content/image/list',
    method: 'get',
    response: ({ headers, query }: { headers: Record<string, string>; query: Query }) => {
      const token = getToken(headers)
      if (!token || !validTokens[token]) return { code: 401, msg: '未登录', data: null }

      let filtered = [...allImages]
      const { name } = query
      if (name) filtered = filtered.filter((i) => i.name.includes(name))

      return { code: 200, msg: 'success', data: paginate(filtered, query) }
    },
  },
  {
    url: '/api/content/image/upload',
    method: 'post',
    response: ({ headers }: { headers: Record<string, string> }) => {
      const token = getToken(headers)
      if (!token || !validTokens[token]) return { code: 401, msg: '未登录', data: null }
      return {
        code: 200,
        msg: 'success',
        data: {
          id: Date.now(),
          name: 'uploaded.png',
          url: 'https://picsum.photos/seed/upload/800/400',
          thumbUrl: 'https://picsum.photos/seed/upload/200/100',
          size: 102400,
          type: 'image/png',
          createTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
        },
      }
    },
  },
  {
    url: '/api/content/image/:id',
    method: 'delete',
    response: ({ headers }: { headers: Record<string, string> }) => {
      const token = getToken(headers)
      if (!token || !validTokens[token]) return { code: 401, msg: '未登录', data: null }
      return { code: 200, msg: 'success', data: null }
    },
  },

  // ── 评论管理 ──────────────────────────────────────────
  {
    url: '/api/content/comment/list',
    method: 'get',
    response: ({ headers, query }: { headers: Record<string, string>; query: Query }) => {
      const token = getToken(headers)
      if (!token || !validTokens[token]) return { code: 401, msg: '未登录', data: null }

      let filtered = [...allComments]
      const { articleTitle, status } = query
      if (articleTitle) filtered = filtered.filter((c) => c.articleTitle.includes(articleTitle))
      if (status) filtered = filtered.filter((c) => c.status === status)

      return { code: 200, msg: 'success', data: paginate(filtered, query) }
    },
  },
  {
    url: '/api/content/comment/:id/approve',
    method: 'put',
    response: ({ headers }: { headers: Record<string, string> }) => {
      const token = getToken(headers)
      if (!token || !validTokens[token]) return { code: 401, msg: '未登录', data: null }
      return { code: 200, msg: 'success', data: null }
    },
  },
  {
    url: '/api/content/comment/:id',
    method: 'delete',
    response: ({ headers }: { headers: Record<string, string> }) => {
      const token = getToken(headers)
      if (!token || !validTokens[token]) return { code: 401, msg: '未登录', data: null }
      return { code: 200, msg: 'success', data: null }
    },
  },
]
