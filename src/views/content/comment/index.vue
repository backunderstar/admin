<!-- ============================================================
  ContentComment — 评论管理页
  ============================================================ -->
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { fetchGetCommentList, fetchApproveComment, fetchDeleteComment } from '@/api/content'

const { t } = useI18n()

const searchParams = reactive({
  articleTitle: '',
  status: '',
})

const tableData = ref<Api.Content.CommentListItem[]>([])
const loading = ref(false)
const pagination = reactive({ current: 1, size: 10, total: 0 })

async function fetchData() {
  loading.value = true
  try {
    const params: Api.Content.CommentSearchParams = {
      current: pagination.current,
      size: pagination.size,
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
  pagination.size = size
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

async function handleDelete(id: number) {
  try {
    await fetchDeleteComment(id)
    fetchData()
  } catch {
    // ignore
  }
}

const statusMap: Record<string, { label: string; color: string }> = {
  '0': { label: t('content.comment.status.pending'), color: 'orange' },
  '1': { label: t('content.comment.status.approved'), color: 'green' },
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="content-comment-page">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-100">
        {{ t('content.comment.title') }}
      </h2>
    </div>

    <a-card class="mb-4" :bordered="false">
      <a-form :model="searchParams" layout="inline" @submit="handleSearch">
        <a-form-item field="articleTitle" :label="t('content.comment.columns.articleTitle')">
          <a-input
            v-model="searchParams.articleTitle"
            :placeholder="t('table.searchBar.searchInputPlaceholder')"
            allow-clear
            style="width: 200px"
          />
        </a-form-item>
        <a-form-item field="status" :label="t('content.comment.columns.status')">
          <a-select
            v-model="searchParams.status"
            :placeholder="t('table.searchBar.searchSelectPlaceholder')"
            allow-clear
            style="width: 120px"
          >
            <a-option value="0">{{ t('content.comment.status.pending') }}</a-option>
            <a-option value="1">{{ t('content.comment.status.approved') }}</a-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-space>
            <a-button type="primary" html-type="submit">
              <template #icon><icon-search /></template>
              {{ t('table.searchBar.search') }}
            </a-button>
            <a-button @click="handleReset">{{ t('table.searchBar.reset') }}</a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>

    <a-card :bordered="false">
      <a-table
        :data="tableData"
        :loading="loading"
        :pagination="{
          current: pagination.current,
          pageSize: pagination.size,
          total: pagination.total,
          showTotal: true,
          showPageSize: true,
          pageSizeOptions: [10, 20, 50],
          onChange: handlePageChange,
          onPageSizeChange: handlePageSizeChange,
        }"
        :row-key="'id'"
        stripe
      >
        <template #columns>
          <a-table-column title="#" :width="60">
            <template #cell="{ rowIndex }">
              {{ (pagination.current - 1) * pagination.size + rowIndex + 1 }}
            </template>
          </a-table-column>
          <a-table-column
            :title="t('content.comment.columns.articleTitle')"
            data-index="articleTitle"
            :width="200"
            ellipsis
          />
          <a-table-column
            :title="t('content.comment.columns.content')"
            data-index="content"
            ellipsis
          />
          <a-table-column
            :title="t('content.comment.columns.userName')"
            data-index="userName"
            :width="120"
          />
          <a-table-column :title="t('content.comment.columns.status')" :width="100">
            <template #cell="{ record }">
              <a-tag :color="statusMap[record.status]?.color || 'gray'">
                {{ statusMap[record.status]?.label || record.status }}
              </a-tag>
            </template>
          </a-table-column>
          <a-table-column
            :title="t('content.comment.columns.createTime')"
            data-index="createTime"
            :width="180"
          />
          <a-table-column :title="t('content.comment.columns.action')" :width="160" fixed="right">
            <template #cell="{ record }">
              <a-space>
                <a-button
                  v-if="record.status === '0'"
                  type="text"
                  size="small"
                  @click="handleApprove(record.id)"
                >
                  <template #icon><icon-check /></template>
                  {{ t('content.comment.approve') }}
                </a-button>
                <a-popconfirm :content="t('common.tips')" @ok="handleDelete(record.id)">
                  <a-button type="text" size="small" status="danger">
                    <template #icon><icon-delete /></template>
                    {{ t('table.delete') }}
                  </a-button>
                </a-popconfirm>
              </a-space>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </a-card>
  </div>
</template>
