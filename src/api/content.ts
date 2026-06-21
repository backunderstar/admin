import request from '@/utils/http'

// ── 文章管理 ──────────────────────────────────────────────
export function fetchGetArticleList(params: Api.Content.ArticleSearchParams) {
  return request.get<Api.Content.ArticleList>({
    url: '/api/content/article/list',
    params,
  })
}

export function fetchGetArticleDetail(id: number) {
  return request.get<Api.Content.ArticleListItem>({
    url: `/api/content/article/${id}`,
  })
}

export function fetchCreateArticle(data: Partial<Api.Content.ArticleListItem>) {
  return request.post({ url: '/api/content/article', data })
}

export function fetchUpdateArticle(id: number, data: Partial<Api.Content.ArticleListItem>) {
  return request.put({ url: `/api/content/article/${id}`, data })
}

export function fetchDeleteArticle(id: number) {
  return request.del({ url: `/api/content/article/${id}` })
}

// ── 标签管理 ──────────────────────────────────────────────
export function fetchGetTagList(params: Api.Content.TagSearchParams) {
  return request.get<Api.Content.TagList>({
    url: '/api/content/tag/list',
    params,
  })
}

export function fetchCreateTag(data: { tagName: string }) {
  return request.post({ url: '/api/content/tag', data })
}

export function fetchDeleteTag(id: number) {
  return request.del({ url: `/api/content/tag/${id}` })
}

// ── 分类管理 ──────────────────────────────────────────────
export function fetchGetCategoryList(params: Api.Content.CategorySearchParams) {
  return request.get<Api.Content.CategoryList>({
    url: '/api/content/category/list',
    params,
  })
}

export function fetchCreateCategory(data: { categoryName: string; description: string }) {
  return request.post({ url: '/api/content/category', data })
}

export function fetchDeleteCategory(id: number) {
  return request.del({ url: `/api/content/category/${id}` })
}

// ── 图片管理 ──────────────────────────────────────────────
export function fetchGetImageList(params: Api.Content.ImageSearchParams) {
  return request.get<Api.Content.ImageList>({
    url: '/api/content/image/list',
    params,
  })
}

export function fetchUploadImage(data: FormData) {
  return request.post<Api.Content.ImageListItem>({
    url: '/api/content/image/upload',
    data,
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export function fetchDeleteImage(id: number) {
  return request.del({ url: `/api/content/image/${id}` })
}

// ── 评论管理 ──────────────────────────────────────────────
export function fetchGetCommentList(params: Api.Content.CommentSearchParams) {
  return request.get<Api.Content.CommentList>({
    url: '/api/content/comment/list',
    params,
  })
}

export function fetchApproveComment(id: number) {
  return request.put({ url: `/api/content/comment/${id}/approve` })
}

export function fetchDeleteComment(id: number) {
  return request.del({ url: `/api/content/comment/${id}` })
}
