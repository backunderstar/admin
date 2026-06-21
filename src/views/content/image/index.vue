<!-- ============================================================
  ContentImage — 图片管理页
  ============================================================ -->
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { fetchGetImageList, fetchUploadImage, fetchDeleteImage } from '@/api/content'
import ProTable from '@/components/ProTable/index.vue'
import type { SearchField, ProTableColumn } from '@/components/ProTable/types'

const { t } = useI18n()

const searchFields: SearchField[] = [
  {
    field: 'name',
    label: t('content.image.columns.name'),
    type: 'input',
    placeholder: t('table.searchBar.searchInputPlaceholder'),
  },
]

const columns: ProTableColumn[] = [
  { title: t('content.image.columns.preview'), dataIndex: 'thumbUrl', width: 100 },
  { title: t('content.image.columns.name'), dataIndex: 'name' },
  { title: t('content.image.columns.size'), dataIndex: 'size', width: 100 },
  { title: t('content.image.columns.type'), dataIndex: 'type', width: 120 },
  { title: t('content.image.columns.createTime'), dataIndex: 'createTime', width: 180 },
]

const tableData = ref<Api.Content.ImageListItem[]>([])
const loading = ref(false)
const pagination = reactive({ current: 1, pageSize: 10, total: 0 })
const searchParams = reactive({ name: '' })
const uploading = ref(false)

async function fetchData() {
  loading.value = true
  try {
    const params: Api.Content.ImageSearchParams = {
      current: pagination.current,
      size: pagination.pageSize,
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
  pagination.pageSize = size
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

async function handleDelete(row: Record<string, any>) {
  try {
    await fetchDeleteImage(row.id)
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
    <ProTable
      :title="t('content.image.title')"
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
      <!-- 预览列 -->
      <template #column-thumbUrl="{ record }">
        <a-image
          :src="record.thumbUrl"
          :preview-src="record.url"
          width="60"
          height="60"
          fit="cover"
          style="border-radius: 4px"
        />
      </template>

      <!-- 大小列 -->
      <template #column-size="{ record }">
        {{ formatSize(record.size) }}
      </template>

      <!-- 标题栏额外区域：上传按钮 -->
      <template #header-extra>
        <a-upload :custom-request="handleUpload" :show-file-list="false" accept="image/*">
          <a-button type="primary" :loading="uploading">
            <template #icon><icon-upload /></template>
            {{ t('content.image.upload') }}
          </a-button>
        </a-upload>
      </template>
    </ProTable>
  </div>
</template>
