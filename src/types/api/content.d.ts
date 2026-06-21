/** Content Management types */
declare namespace Api {
  namespace Content {
    /** Article */
    interface ArticleListItem {
      id: number
      title: string
      summary: string
      content: string
      categoryId: number
      categoryName: string
      tags: string[]
      cover: string
      status: '0' | '1'
      author: string
      createTime: string
      updateTime: string
    }

    type ArticleSearchParams = Partial<
      Pick<ArticleListItem, 'title' | 'status' | 'categoryId'> & Api.Common.CommonSearchParams
    >

    type ArticleList = Api.Common.PaginatedResponse<ArticleListItem>

    /** Tag */
    interface TagListItem {
      tagId: number
      tagName: string
      articleCount: number
      createTime: string
    }

    type TagSearchParams = Partial<Pick<TagListItem, 'tagName'> & Api.Common.CommonSearchParams>

    type TagList = Api.Common.PaginatedResponse<TagListItem>

    /** Category */
    interface CategoryListItem {
      categoryId: number
      categoryName: string
      description: string
      articleCount: number
      enabled: boolean
      createTime: string
    }

    type CategorySearchParams = Partial<
      Pick<CategoryListItem, 'categoryName'> & Api.Common.CommonSearchParams
    >

    type CategoryList = Api.Common.PaginatedResponse<CategoryListItem>

    /** Image */
    interface ImageListItem {
      id: number
      name: string
      url: string
      thumbUrl: string
      size: number
      type: string
      createTime: string
    }

    type ImageSearchParams = Partial<Pick<ImageListItem, 'name'> & Api.Common.CommonSearchParams>

    type ImageList = Api.Common.PaginatedResponse<ImageListItem>

    /** Comment */
    interface CommentListItem {
      id: number
      articleTitle: string
      content: string
      userName: string
      email: string
      status: '0' | '1'
      createTime: string
    }

    type CommentSearchParams = Partial<
      Pick<CommentListItem, 'articleTitle' | 'status'> & Api.Common.CommonSearchParams
    >

    type CommentList = Api.Common.PaginatedResponse<CommentListItem>
  }
}
