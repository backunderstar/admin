<!-- ============================================================
  ContentTag — 标签管理页
  ============================================================ -->
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { fetchGetTagList, fetchCreateTag, fetchDeleteTag } from '@/api/content'
import ProTable from '@/components/ProTable/index.vue'
import type { SearchField, ProTableColumn } from '@/components/ProTable/types'

const { t } = useI18n()

const searchFields: SearchField[] = [
  {
    field: 'tagName',
    label: t('content.tag.columns.tagName'),
    type: 'input',
    placeholder: t('table.searchBar.searchInputPlaceholder'),
  },
]

const columns: ProTableColumn[] = [
  { title: t('content.tag.columns.tagName'), dataIndex: 'tagName' },
  { title: t('content.tag.columns.articleCount'), dataIndex: 'articleCount', width: 100 },
  { title: t('content.tag.columns.createTime'), dataIndex: 'createTime', width: 180 },
]

const tableData = ref<Api.Content.TagListItem[]>([])
const loading = ref(false)
const pagination = reactive({ current: 1, pageSize: 10, total: 0 })
const searchParams = reactive({ tagName: '' })

// 新增标签
const newTagName = ref('')
const adding = ref(false)

async function fetchData() {
  loading.value = true
  try {
    const params: Api.Content.TagSearchParams = {
      current: pagination.current,
      size: pagination.pageSize,
    }
    if (searchParams.tagName) params.tagName = searchParams.tagName
    const res = await fetchGetTagList(params)
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
  searchParams.tagName = ''
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

async function handleAdd() {
  if (!newTagName.value.trim()) return
  adding.value = true
  try {
    await fetchCreateTag({ tagName: newTagName.value.trim() })
    newTagName.value = ''
    fetchData()
  } finally {
    adding.value = false
  }
}

async function handleDelete(row: Record<string, any>) {
  try {
    await fetchDeleteTag(row.tagId)
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
  <div class="content-tag-page">
    <!-- 新增标签栏（在 ProTable 外部，因为样式独立） -->
    <a-card class="mb-4" :bordered="false">
      <a-space>
        <a-input
          v-model="newTagName"
          :placeholder="t('content.tag.addTagPlaceholder')"
          style="width: 200px"
        />
        <a-button type="primary" :loading="adding" @click="handleAdd">
          <template #icon><icon-plus /></template>
          {{ t('content.tag.addTag') }}
        </a-button>
      </a-space>
    </a-card>

    <ProTable
      :columns="columns"
      :data="tableData"
      :loading="loading"
      :pagination="pagination"
      :search-fields="searchFields"
      :search-model="searchParams"
      :row-key="'tagId'"
      :show-add="false"
      :show-index="true"
      @search="handleSearch"
      @reset="handleReset"
      @delete="handleDelete"
      @page-change="handlePageChange"
      @page-size-change="handlePageSizeChange"
    >
      <!-- tagName 列：彩色标签 -->
      <template #column-tagName="{ record }">
        <a-tag color="arcoblue">{{ record.tagName }}</a-tag>
      </template>
    </ProTable>
  </div>
</template>
