<!-- ============================================================
  ContentArticle — 文章管理页
  ============================================================ -->
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { fetchGetArticleList, fetchDeleteArticle } from '@/api/content'
import ProTable from '@/components/ProTable/index.vue'
import type { SearchField, ProTableColumn } from '@/components/ProTable/types'

const { t } = useI18n()
const router = useRouter()

const searchFields: SearchField[] = [
  {
    field: 'title',
    label: t('content.article.columns.title'),
    type: 'input',
    placeholder: t('table.searchBar.searchInputPlaceholder'),
  },
  {
    field: 'status',
    label: t('content.article.columns.status'),
    type: 'select',
    placeholder: t('table.searchBar.searchSelectPlaceholder'),
    options: [
      { label: t('content.article.status.draft'), value: '0' },
      { label: t('content.article.status.published'), value: '1' },
    ],
  },
]

const columns: ProTableColumn[] = [
  { title: t('content.article.columns.title'), dataIndex: 'title', width: 240 },
  { title: t('content.article.columns.summary'), dataIndex: 'summary', ellipsis: true },
  { title: t('content.article.columns.categoryName'), dataIndex: 'categoryName', width: 120 },
  { title: t('content.article.columns.status'), dataIndex: 'status', width: 100 },
  { title: t('content.article.columns.author'), dataIndex: 'author', width: 100 },
  { title: t('content.article.columns.createTime'), dataIndex: 'createTime', width: 180 },
]

const tableData = ref<Api.Content.ArticleListItem[]>([])
const loading = ref(false)
const pagination = reactive({ current: 1, pageSize: 10, total: 0 })
const searchParams = reactive({ title: '', status: '' })

const statusMap: Record<string, { label: string; color: string }> = {
  '0': { label: t('content.article.status.draft'), color: 'orange' },
  '1': { label: t('content.article.status.published'), color: 'green' },
}

async function fetchData() {
  loading.value = true
  try {
    const params: Api.Content.ArticleSearchParams = {
      current: pagination.current,
      size: pagination.pageSize,
    }
    if (searchParams.title) params.title = searchParams.title
    if (searchParams.status) params.status = searchParams.status
    const res = await fetchGetArticleList(params)
    tableData.value = res.records
    pagination.total = res.total
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.current = 1
  fetchData()
}

function handleReset() {
  searchParams.title = ''
  searchParams.status = ''
  handleSearch()
}

function handlePageChange(current: number) {
  pagination.current = current
  fetchData()
}

function handlePageSizeChange(size: number) {
  pagination.pageSize = size
  pagination.current = 1
  fetchData()
}

function goEdit(id?: number) {
  if (id) {
    router.push(`/content/article/edit/${id}`)
  } else {
    router.push('/content/article/edit')
  }
}

async function handleDelete(row: Record<string, any>) {
  try {
    await fetchDeleteArticle(row.id)
    fetchData()
  } catch {
    // error handled by interceptor
  }
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="content-article-page">
    <ProTable
      :title="t('content.article.title')"
      :columns="columns"
      :data="tableData"
      :loading="loading"
      :pagination="pagination"
      :search-fields="searchFields"
      :search-model="searchParams"
      :add-text="t('content.articleEdit.title')"
      :row-key="'id'"
      column-resizable
      @search="handleSearch"
      @reset="handleReset"
      @add="goEdit()"
      @delete="handleDelete"
      @page-change="handlePageChange"
      @page-size-change="handlePageSizeChange"
    >
      <!-- 标题列：链接跳转 -->
      <template #column-title="{ record }">
        <a-link @click="goEdit(record.id)">{{ record.title }}</a-link>
      </template>

      <!-- 状态列：彩色标签 -->
      <template #column-status="{ record }">
        <a-tag :color="statusMap[record.status]?.color || 'gray'">
          {{ statusMap[record.status]?.label || record.status }}
        </a-tag>
      </template>

      <!-- 操作列：在删除前追加编辑按钮 -->
      <template #action-prepend="{ record }">
        <a-button type="text" size="small" @click="goEdit(record.id)">
          <template #icon><icon-edit /></template>
          {{ t('table.edit') }}
        </a-button>
      </template>
    </ProTable>
  </div>
</template>
