<!-- ============================================================
  ContentCategory — 分类管理页
  ============================================================ -->
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { fetchGetCategoryList, fetchCreateCategory, fetchDeleteCategory } from '@/api/content'
import ProTable from '@/components/ProTable/index.vue'
import type { SearchField, ProTableColumn } from '@/components/ProTable/types'

const { t } = useI18n()

const searchFields: SearchField[] = [
  {
    field: 'categoryName',
    label: t('content.category.columns.categoryName'),
    type: 'input',
    placeholder: t('table.searchBar.searchInputPlaceholder'),
  },
]

const columns: ProTableColumn[] = [
  { title: t('content.category.columns.categoryName'), dataIndex: 'categoryName', width: 160 },
  { title: t('content.category.columns.description'), dataIndex: 'description' },
  { title: t('content.category.columns.articleCount'), dataIndex: 'articleCount', width: 100 },
  { title: t('content.category.columns.enabled'), dataIndex: 'enabled', width: 100 },
  { title: t('content.category.columns.createTime'), dataIndex: 'createTime', width: 180 },
]

const tableData = ref<Api.Content.CategoryListItem[]>([])
const loading = ref(false)
const pagination = reactive({ current: 1, pageSize: 10, total: 0 })
const searchParams = reactive({ categoryName: '' })

// 新增弹窗
const showAddModal = ref(false)
const newCategory = reactive({ categoryName: '', description: '' })
const adding = ref(false)

async function fetchData() {
  loading.value = true
  try {
    const params: Api.Content.CategorySearchParams = {
      current: pagination.current,
      size: pagination.pageSize,
    }
    if (searchParams.categoryName) params.categoryName = searchParams.categoryName
    const res = await fetchGetCategoryList(params)
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
  searchParams.categoryName = ''
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

function handleAdd() {
  showAddModal.value = true
}

async function handleAddConfirm() {
  if (!newCategory.categoryName.trim()) return
  adding.value = true
  try {
    await fetchCreateCategory({
      categoryName: newCategory.categoryName.trim(),
      description: newCategory.description.trim(),
    })
    showAddModal.value = false
    newCategory.categoryName = ''
    newCategory.description = ''
    fetchData()
  } finally {
    adding.value = false
  }
}

async function handleDelete(row: Record<string, any>) {
  try {
    await fetchDeleteCategory(row.categoryId)
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
  <div class="content-category-page">
    <ProTable
      :title="t('content.category.title')"
      :columns="columns"
      :data="tableData"
      :loading="loading"
      :pagination="pagination"
      :search-fields="searchFields"
      :search-model="searchParams"
      :add-text="t('content.category.addCategory')"
      :row-key="'categoryId'"
      @search="handleSearch"
      @reset="handleReset"
      @add="handleAdd"
      @delete="handleDelete"
      @page-change="handlePageChange"
      @page-size-change="handlePageSizeChange"
    >
      <!-- enabled 列：状态标签 -->
      <template #column-enabled="{ record }">
        <a-tag :color="record.enabled ? 'green' : 'red'">
          {{
            record.enabled
              ? t('content.category.status.enabled')
              : t('content.category.status.disabled')
          }}
        </a-tag>
      </template>
    </ProTable>

    <!-- 新增分类弹窗 -->
    <a-modal
      :visible="showAddModal"
      :title="t('content.category.addCategory')"
      @cancel="showAddModal = false"
      @before-ok="handleAddConfirm"
    >
      <a-form :model="newCategory" layout="vertical">
        <a-form-item
          field="categoryName"
          :label="t('content.category.columns.categoryName')"
          required
        >
          <a-input
            v-model="newCategory.categoryName"
            :placeholder="t('table.searchBar.searchInputPlaceholder')"
          />
        </a-form-item>
        <a-form-item field="description" :label="t('content.category.columns.description')">
          <a-textarea
            v-model="newCategory.description"
            :placeholder="t('table.searchBar.searchInputPlaceholder')"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>
