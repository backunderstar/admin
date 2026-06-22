<!-- ============================================================
  ProTable — 通用表格组件

  包装 Arco Design <a-table>，集成搜索栏、分页、新增/删除功能。
  设计风格：四周留缝 + 层次感卡片堆叠

  用法：
    <ProTable
      :columns="columns"
      :data="tableData"
      :loading="loading"
      :pagination="pagination"
      :search-fields="searchFields"
      :search-model="searchParams"
      @search="handleSearch"
      @reset="handleReset"
      @add="handleAdd"
      @delete="handleDelete"
    >
      <template #column-status="{ record }">
        <a-tag>{{ record.status }}</a-tag>
      </template>
      <template #action-append="{ record }">
        <a-button type="text" @click="customAction(record)">自定义</a-button>
      </template>
    </ProTable>
  ============================================================ -->
<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PaginationProps } from '@arco-design/web-vue'
import type { SearchField, ProTableColumn, PageData } from './types'

const { t } = useI18n()

// ── Props ──────────────────────────────────────────────────
interface ProTableProps {
  /** 表格标题 */
  title?: string
  /** 表格列配置 */
  columns: ProTableColumn[]
  /** 表格数据 */
  data: Record<string, any>[]
  /** 加载状态 */
  loading: boolean
  /** 分页数据 */
  pagination: PageData
  /** 搜索字段配置 */
  searchFields?: SearchField[]
  /** 搜索表单 v-model 对象 */
  searchModel?: Record<string, any>
  /** 行 key */
  rowKey?: string
  /** 是否显示新增按钮 */
  showAdd?: boolean
  /** 新增按钮文字 */
  addText?: string
  /** 是否显示删除按钮 */
  showDelete?: boolean
  /** 删除确认文案 */
  deleteConfirmText?: string
  /** 是否启用列拖拽调整宽度 */
  columnResizable?: boolean
  /** 是否显示序号列 */
  showIndex?: boolean
  /** 序号列宽度 */
  indexWidth?: number
  /** 操作列宽度 */
  actionWidth?: number
  /** 操作列标题 */
  actionTitle?: string
  /** 表格内容区最大高度（px），超出后表格体滚动，分页固定可见 */
  maxHeight?: number
  /** 透传给 a-table 的其他属性 */
  tableProps?: Record<string, any>
}

const props = withDefaults(defineProps<ProTableProps>(), {
  title: '',
  searchFields: () => [],
  searchModel: () => ({}),
  rowKey: 'id',
  showAdd: true,
  addText: '',
  showDelete: true,
  deleteConfirmText: '',
  columnResizable: false,
  showIndex: true,
  indexWidth: 60,
  actionWidth: 120,
  actionTitle: '',
  maxHeight: 600,
  tableProps: () => ({}),
})

// ── Emits ──────────────────────────────────────────────────
const emit = defineEmits<{
  search: []
  reset: []
  add: []
  delete: [row: Record<string, any>]
  'page-change': [current: number]
  'page-size-change': [size: number]
}>()

// ── 分页属性 ──────────────────────────────────────────────
const paginationProps = computed<PaginationProps>(() => ({
  current: props.pagination.current,
  pageSize: props.pagination.pageSize,
  total: props.pagination.total,
  showTotal: true,
  showPageSize: true,
  pageSizeOptions: [10, 20, 50],
  onChange: (current: number) => emit('page-change', current),
  onPageSizeChange: (size: number) => emit('page-size-change', size),
}))

const safeColumns = computed(() => props.columns as Record<string, any>[])

// ── 搜索相关 ──────────────────────────────────────────────
const hasSearch = computed(() => props.searchFields.length > 0)

function onSearch() {
  emit('search')
}

function onReset() {
  emit('reset')
}

// ── 序号计算 ──────────────────────────────────────────────
function calcIndex(rowIndex: number): number {
  return (props.pagination.current - 1) * props.pagination.pageSize + rowIndex + 1
}
</script>

<template>
  <div class="pro-table">
    <!-- ══════════════════════════════════════════════════════
      标题栏 — 独立卡片，底部稍多间距拉开层次
    ══════════════════════════════════════════════════════ -->
    <div class="pro-table-header mb-5">
      <div class="flex items-center justify-between">
        <h2 v-if="title" class="text-lg font-semibold text-(--color-text-1)">
          {{ title }}
        </h2>
        <div v-else />
        <div class="flex items-center gap-3">
          <slot name="header-extra" />
          <a-button v-if="showAdd" type="primary" @click="emit('add')">
            <template #icon><icon-plus /></template>
            {{ addText || t('table.add') }}
          </a-button>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════
      搜索栏 — 浅层卡片（float 1），与表格形成层次堆叠
    ══════════════════════════════════════════════════════ -->
    <div v-if="hasSearch" class="pro-table-search mb-4">
      <div class="rounded-lg bg-(--color-bg-2) px-6 py-5 shadow-sm ring-1 ring-(--color-border-2)">
        <a-form :model="searchModel" layout="inline" @submit="onSearch">
          <template v-for="field in searchFields" :key="field.field">
            <a-form-item :field="field.field" :label="field.label">
              <a-input
                v-if="field.type === 'input'"
                v-model="searchModel[field.field]"
                :placeholder="field.placeholder || t('table.searchBar.searchInputPlaceholder')"
                allow-clear
                :style="field.style || 'width: 200px'"
              />
              <a-select
                v-else-if="field.type === 'select'"
                v-model="searchModel[field.field]"
                :placeholder="field.placeholder || t('table.searchBar.searchSelectPlaceholder')"
                allow-clear
                :style="field.style || 'width: 120px'"
              >
                <a-option
                  v-for="opt in field.options"
                  :key="opt.value"
                  :value="opt.value"
                  :label="opt.label"
                />
              </a-select>
            </a-form-item>
          </template>
          <a-form-item>
            <a-space>
              <a-button type="primary" html-type="submit">
                <template #icon><icon-search /></template>
                {{ t('table.searchBar.search') }}
              </a-button>
              <a-button @click="onReset">
                {{ t('table.searchBar.reset') }}
              </a-button>
            </a-space>
          </a-form-item>
        </a-form>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════
      表格区域 — 主卡片（float 2），阴影更深，与搜索栏区分
    ══════════════════════════════════════════════════════ -->
    <div
      class="pro-table-body rounded-lg bg-(--color-bg-2) shadow-sm ring-1 ring-(--color-border-2)"
    >
      <slot name="table-top" />

      <a-table
        :data="data"
        :loading="loading"
        :pagination="paginationProps"
        :row-key="rowKey"
        stripe
        :column-resizable="columnResizable"
        :scroll="{ y: maxHeight }"
        v-bind="tableProps"
        class="pro-table-arco"
      >
        <template #columns>
          <!-- 序号列 -->
          <a-table-column v-if="showIndex" title="#" :width="indexWidth">
            <template #cell="{ rowIndex }">
              {{ calcIndex(rowIndex) }}
            </template>
          </a-table-column>

          <!-- 数据列 -->
          <template v-for="col in safeColumns" :key="col.dataIndex || col.slotName">
            <a-table-column v-bind="col">
              <template #cell="{ record, rowIndex }">
                <!-- 优先使用插槽：column-{dataIndex} -->
                <slot
                  v-if="$slots[`column-${col.dataIndex}`]"
                  :name="`column-${col.dataIndex}`"
                  :record="record"
                  :row-index="rowIndex"
                  :column="col"
                />
                <!-- 否则使用 dataIndex 默认展示 -->
                <template v-else>
                  {{ record[col.dataIndex!] }}
                </template>
              </template>
            </a-table-column>
          </template>

          <!-- 操作列 -->
          <a-table-column
            v-if="
              showDelete ||
              $slots['action-prepend'] ||
              $slots['action-append'] ||
              $slots['action-replace']
            "
            :title="actionTitle || t('table.action')"
            :width="actionWidth"
            fixed="right"
          >
            <template #cell="{ record }">
              <a-space>
                <!-- action-replace 完全覆盖 -->
                <slot v-if="$slots['action-replace']" name="action-replace" :record="record" />

                <!-- 默认操作按钮 -->
                <template v-else>
                  <slot name="action-prepend" :record="record" />

                  <a-popconfirm
                    v-if="showDelete"
                    :content="deleteConfirmText || t('common.tips')"
                    @ok="emit('delete', record)"
                  >
                    <a-button type="text" size="small" status="danger">
                      <template #icon><icon-delete /></template>
                      {{ t('table.delete') }}
                    </a-button>
                  </a-popconfirm>

                  <slot name="action-append" :record="record" />
                </template>
              </a-space>
            </template>
          </a-table-column>
        </template>
      </a-table>

      <slot name="table-bottom" />
    </div>
  </div>
</template>

<style scoped>
/* ── 整体容器：四周留缝 ─────────────── */
.pro-table {
  padding: 16px 20px 20px;
}

/* ── 标题栏 ─────────────────────── */
.pro-table-header {
  padding: 0 2px;
}

/* ── 覆盖 Arco 表格样式：去除内部 card 多余边框 ── */
.pro-table-arco {
  --table-color-border: transparent;
}

/* Arco 表格内部无边框模式 */
.pro-table-arco :deep(.arco-table-container) {
  border-radius: 0;
}

.pro-table-arco :deep(.arco-table-th) {
  background: var(--color-fill-1);
  font-weight: 600;
  color: var(--color-text-1);
}

.pro-table-arco :deep(.arco-table-td) {
  border-bottom: 1px solid var(--color-border-1);
}

/* 分页区域留白 */
.pro-table-arco :deep(.arco-pagination) {
  padding: 16px 0 4px;
}
</style>
