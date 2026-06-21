<!-- ============================================================
  ContentImage — 图片管理页
  ============================================================ -->
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { fetchGetImageList, fetchUploadImage, fetchDeleteImage } from '@/api/content'

const { t } = useI18n()

const searchParams = reactive({ name: '' })
const tableData = ref<Api.Content.ImageListItem[]>([])
const loading = ref(false)
const pagination = reactive({ current: 1, size: 10, total: 0 })
const uploading = ref(false)

async function fetchData() {
  loading.value = true
  try {
    const params: Api.Content.ImageSearchParams = {
      current: pagination.current,
      size: pagination.size,
    }
    if (searchParams.name) params.name = searchParams.name
    const res = await fetchGetImageList(params)
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
  searchParams.name = ''
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

async function handleUpload(_file: File) {
  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', _file)
    await fetchUploadImage(formData)
    fetchData()
  } finally {
    uploading.value = false
  }
}

async function handleDelete(id: number) {
  try {
    await fetchDeleteImage(id)
    fetchData()
  } catch {
    // ignore
  }
}

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="content-image-page">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-100">
        {{ t('content.image.title') }}
      </h2>
      <a-upload :custom-request="handleUpload" :show-file-list="false" accept="image/*">
        <a-button type="primary" :loading="uploading">
          <template #icon><icon-upload /></template>
          {{ t('content.image.upload') }}
        </a-button>
      </a-upload>
    </div>

    <a-card class="mb-4" :bordered="false">
      <a-form :model="searchParams" layout="inline" @submit="handleSearch">
        <a-form-item field="name" :label="t('content.image.columns.name')">
          <a-input
            v-model="searchParams.name"
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
        :row-key="'id'"
        stripe
      >
        <template #columns>
          <a-table-column title="#" :width="60">
            <template #cell="{ rowIndex }">
              {{ (pagination.current - 1) * pagination.size + rowIndex + 1 }}
            </template>
          </a-table-column>
          <a-table-column :title="t('content.image.columns.preview')" :width="100">
            <template #cell="{ record }">
              <a-image
                :src="record.thumbUrl"
                :preview-src="record.url"
                width="60"
                height="60"
                fit="cover"
                style="border-radius: 4px"
              />
            </template>
          </a-table-column>
          <a-table-column :title="t('content.image.columns.name')" data-index="name" />
          <a-table-column :title="t('content.image.columns.size')" :width="100">
            <template #cell="{ record }">
              {{ formatSize(record.size) }}
            </template>
          </a-table-column>
          <a-table-column :title="t('content.image.columns.type')" data-index="type" :width="120" />
          <a-table-column
            :title="t('content.image.columns.createTime')"
            data-index="createTime"
            :width="180"
          />
          <a-table-column :title="t('content.image.columns.action')" :width="100" fixed="right">
            <template #cell="{ record }">
              <a-popconfirm :content="t('common.tips')" @ok="handleDelete(record.id)">
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
  </div>
</template>
