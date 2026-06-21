<!-- ============================================================
  ContentArticle — 文章管理页
  ============================================================ -->
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { fetchGetArticleList, fetchDeleteArticle } from '@/api/content'

const { t } = useI18n()
const router = useRouter()

const searchParams = reactive({
  title: '',
  status: '',
})

const tableData = ref<Api.Content.ArticleListItem[]>([])
const loading = ref(false)
const pagination = reactive({ current: 1, size: 10, total: 0 })

async function fetchData() {
  loading.value = true
  try {
    const params: Api.Content.ArticleSearchParams = {
      current: pagination.current,
      size: pagination.size,
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
  pagination.size = size
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

async function handleDelete(id: number) {
  try {
    await fetchDeleteArticle(id)
    fetchData()
  } catch {
    // error handled by interceptor
  }
}

const statusMap: Record<string, { label: string; color: string }> = {
  '0': { label: t('content.article.status.draft'), color: 'orange' },
  '1': { label: t('content.article.status.published'), color: 'green' },
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="content-article-page">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-100">
        {{ t('content.article.title') }}
      </h2>
      <a-button type="primary" @click="goEdit()">
        <template #icon><icon-plus /></template>
        {{ t('content.articleEdit.title') }}
      </a-button>
    </div>

    <a-card class="mb-4" :bordered="false">
      <a-form :model="searchParams" layout="inline" @submit="handleSearch">
        <a-form-item field="title" :label="t('content.article.columns.title')">
          <a-input
            v-model="searchParams.title"
            :placeholder="t('table.searchBar.searchInputPlaceholder')"
            allow-clear
            style="width: 200px"
          />
        </a-form-item>
        <a-form-item field="status" :label="t('content.article.columns.status')">
          <a-select
            v-model="searchParams.status"
            :placeholder="t('table.searchBar.searchSelectPlaceholder')"
            allow-clear
            style="width: 120px"
          >
            <a-option value="0">{{ t('content.article.status.draft') }}</a-option>
            <a-option value="1">{{ t('content.article.status.published') }}</a-option>
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
        column-resizable
      >
        <template #columns>
          <a-table-column title="#" :width="60">
            <template #cell="{ rowIndex }">
              {{ (pagination.current - 1) * pagination.size + rowIndex + 1 }}
            </template>
          </a-table-column>
          <a-table-column
            :title="t('content.article.columns.title')"
            data-index="title"
            :width="240"
          >
            <template #cell="{ record }">
              <a-link @click="goEdit(record.id)">{{ record.title }}</a-link>
            </template>
          </a-table-column>
          <a-table-column
            :title="t('content.article.columns.summary')"
            data-index="summary"
            ellipsis
          />
          <a-table-column
            :title="t('content.article.columns.categoryName')"
            data-index="categoryName"
            :width="120"
          />
          <a-table-column :title="t('content.article.columns.status')" :width="100">
            <template #cell="{ record }">
              <a-tag :color="statusMap[record.status]?.color || 'gray'">
                {{ statusMap[record.status]?.label || record.status }}
              </a-tag>
            </template>
          </a-table-column>
          <a-table-column
            :title="t('content.article.columns.author')"
            data-index="author"
            :width="100"
          />
          <a-table-column
            :title="t('content.article.columns.createTime')"
            data-index="createTime"
            :width="180"
          />
          <a-table-column :title="t('content.article.columns.action')" :width="120" fixed="right">
            <template #cell="{ record }">
              <a-space>
                <a-button type="text" size="small" @click="goEdit(record.id)">
                  <template #icon><icon-edit /></template>
                  {{ t('table.edit') }}
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
