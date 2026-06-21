import type { PaginationProps } from '@arco-design/web-vue'

/**
 * 搜索字段定义
 */
export interface SearchField {
  /** v-model 绑定的字段名 */
  field: string
  /** 标签文字 */
  label: string
  /** 控件类型 */
  type: 'input' | 'select'
  /** 占位文字 */
  placeholder?: string
  /** select 选项 */
  options?: { label: string; value: string }[]
  /** 输入框宽度样式 */
  style?: string
}

/**
 * 表格列定义
 *
 * 支持 Arco Design TableColumnData 的大部分属性，
 * 并通过 slotName 映射到父组件的 #column-{dataIndex} 插槽。
 */
export interface ProTableColumn {
  /** 列标题 */
  title: string
  /** 数据字段名 */
  dataIndex?: string
  /** 列宽度 */
  width?: number | string
  /** 固定列位置 */
  fixed?: 'left' | 'right'
  /** 文字超出省略 */
  ellipsis?: boolean
  /** 排序 */
  sortable?: boolean
  /** 自定义插槽名，默认取 dataIndex */
  slotName?: string
  /** 透传 Arco TableColumnData 的其他属性 */
  [key: string]: any
}

/**
 * 分页数据模型
 */
export interface PageData {
  current: number
  pageSize: number
  total: number
}

/**
 * 组件 emits
 */
export interface ProTableEmits {
  /** 搜索提交 */
  (e: 'search'): void
  /** 搜索重置 */
  (e: 'reset'): void
  /** 新增按钮点击 */
  (e: 'add'): void
  /** 删除确认 */
  (e: 'delete', row: Record<string, any>): void
  /** 页码变化 */
  (e: 'page-change', current: number): void
  /** 每页条数变化 */
  (e: 'page-size-change', size: number): void
}
