<!-- ============================================================
  ContentCategory — 分类管理页
  ============================================================ -->
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { fetchGetCategoryList, fetchCreateCategory, fetchDeleteCategory } from '@/api/content'

const { t } = useI18n()

const searchParams = reactive({ categoryName: '' })
const tableData = ref<Api.Content.CategoryListItem[]>([])
const loading = ref(false)
const pagination = reactive({ current: 1, size: 10, total: 0 })

const showAddModal = ref(false)
const newCategory = reactive({ categoryName: '', description: '' })
const adding = ref(false)

async function fetchData() {
  loading.value = true
  try {
    const params: Api.Content.CategorySearchParams = {
      current: pagination.current,
      size: pagination.size,
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
  pagination.size = size
  pagination.current = 1
  fetchData()
}

async function handleAdd() {
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

async function handleDelete(id: number) {
  try {
    await fetchDeleteCategory(id)
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
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-100">
        {{ t('content.category.title') }}
      </h2>
      <a-button type="primary" @click="showAddModal = true">
        <template #icon><icon-plus /></template>
        {{ t('content.category.addCategory') }}
      </a-button>
    </div>

    <a-card class="mb-4" :bordered="false">
      <a-form :model="searchParams" layout="inline" @submit="handleSearch">
        <a-form-item field="categoryName" :label="t('content.category.columns.categoryName')">
          <a-input
            v-model="searchParams.categoryName"
            :placeholder="t('table.searchBar.searchInputPlaceholder')"
            allow-clear
            style="width: 200px"
          />
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
        :row-key="'categoryId'"
        stripe
      >
        <template #columns>
          <a-table-column title="#" :width="60">
            <template #cell="{ rowIndex }">
              {{ (pagination.current - 1) * pagination.size + rowIndex + 1 }}
            </template>
          </a-table-column>
          <a-table-column
            :title="t('content.category.columns.categoryName')"
            data-index="categoryName"
            :width="160"
          />
          <a-table-column
            :title="t('content.category.columns.description')"
            data-index="description"
          />
          <a-table-column
            :title="t('content.category.columns.articleCount')"
            data-index="articleCount"
            :width="100"
          />
          <a-table-column :title="t('content.category.columns.enabled')" :width="100">
            <template #cell="{ record }">
              <a-tag :color="record.enabled ? 'green' : 'red'">
                {{
                  record.enabled
                    ? t('content.category.status.enabled')
                    : t('content.category.status.disabled')
                }}
              </a-tag>
            </template>
          </a-table-column>
          <a-table-column
            :title="t('content.category.columns.createTime')"
            data-index="createTime"
            :width="180"
          />
          <a-table-column :title="t('content.category.columns.action')" :width="100" fixed="right">
            <template #cell="{ record }">
              <a-popconfirm :content="t('common.tips')" @ok="handleDelete(record.categoryId)">
                <a-button type="text" size="small" status="danger">
                  <template #icon><icon-delete /></template>
                  {{ t('table.delete') }}
                </a-button>
              </a-popconfirm>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </a-card>

    <a-modal
      :visible="showAddModal"
      :title="t('content.category.addCategory')"
      @cancel="showAddModal = false"
      @before-ok="handleAdd"
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
