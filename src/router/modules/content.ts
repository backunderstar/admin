import type { AppRouteRecord } from '@/types/router'

/**
 * 内容管理路由模块
 *
 * 包含文章管理（含编辑器）、标签管理、分类管理、图片管理、评论管理
 */
export const contentRoutes: AppRouteRecord = {
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
      path: 'article/edit/:id?',
      name: 'ContentArticleEdit',
      component: '/content/article/edit',
      meta: {
        title: 'menus.content.articleEdit',
        icon: 'ri:edit-line',
        isHide: true,
        isHideTab: true,
        keepAlive: false,
        activePath: '/content/article',
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
}
