<!-- ============================================================
  ContentComment — 评论管理页
  ============================================================ -->
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { fetchGetCommentList, fetchApproveComment, fetchDeleteComment } from '@/api/content'
import ProTable from '@/components/ProTable/index.vue'
import type { SearchField, ProTableColumn } from '@/components/ProTable/types'

const { t } = useI18n()

const searchFields: SearchField[] = [
  {
    field: 'articleTitle',
    label: t('content.comment.columns.articleTitle'),
    type: 'input',
    placeholder: t('table.searchBar.searchInputPlaceholder'),
  },
  {
    field: 'status',
    label: t('content.comment.columns.status'),
    type: 'select',
    placeholder: t('table.searchBar.searchSelectPlaceholder'),
    options: [
      { label: t('content.comment.status.pending'), value: '0' },
      { label: t('content.comment.status.approved'), value: '1' },
    ],
  },
]

const columns: ProTableColumn[] = [
  {
    title: t('content.comment.columns.articleTitle'),
    dataIndex: 'articleTitle',
    width: 200,
    ellipsis: true,
  },
  { title: t('content.comment.columns.content'), dataIndex: 'content', ellipsis: true },
  { title: t('content.comment.columns.userName'), dataIndex: 'userName', width: 120 },
  { title: t('content.comment.columns.status'), dataIndex: 'status', width: 100 },
  { title: t('content.comment.columns.createTime'), dataIndex: 'createTime', width: 180 },
]

const tableData = ref<Api.Content.CommentListItem[]>([])
const loading = ref(false)
const pagination = reactive({ current: 1, pageSize: 10, total: 0 })
const searchParams = reactive({ articleTitle: '', status: '' })

const statusMap: Record<string, { label: string; color: string }> = {
  '0': { label: t('content.comment.status.pending'), color: 'orange' },
  '1': { label: t('content.comment.status.approved'), color: 'green' },
}

async function fetchData() {
  loading.value = true
  try {
    const params: Api.Content.CommentSearchParams = {
      current: pagination.current,
      size: pagination.pageSize,
    }
    if (searchParams.articleTitle) params.articleTitle = searchParams.articleTitle
    if (searchParams.status) params.status = searchParams.status
    const res = await fetchGetCommentList(params)
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
  searchParams.articleTitle = ''
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

async function handleApprove(id: number) {
  try {
    await fetchApproveComment(id)
    fetchData()
  } catch {
    // ignore
  }
}

async function handleDelete(row: Record<string, any>) {
  try {
    await fetchDeleteComment(row.id)
    fetchData()
  } catch {
    // ignore
  }
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="content-comment-page">
    <ProTable
      :title="t('content.comment.title')"
      :columns="columns"
      :data="tableData"
      :loading="loading"
      :pagination="pagination"
      :search-fields="searchFields"
      :search-model="searchParams"
      :row-key="'id'"
      :show-add="false"
      @search="handleSearch"
      @reset="handleReset"
      @delete="handleDelete"
      @page-change="handlePageChange"
      @page-size-change="handlePageSizeChange"
    >
      <!-- status 列 -->
      <template #column-status="{ record }">
        <a-tag :color="statusMap[record.status]?.color || 'gray'">
          {{ statusMap[record.status]?.label || record.status }}
        </a-tag>
      </template>

      <!-- 操作列：在删除前追加审核按钮 -->
      <template #action-prepend="{ record }">
        <a-button
          v-if="record.status === '0'"
          type="text"
          size="small"
          @click="handleApprove(record.id)"
        >
          <template #icon><icon-check /></template>
          {{ t('content.comment.approve') }}
        </a-button>
      </template>
    </ProTable>
  </div>
</template>
