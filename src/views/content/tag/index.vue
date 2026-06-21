<!-- ============================================================
  ContentTag — 标签管理页
  ============================================================ -->
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { fetchGetTagList, fetchCreateTag, fetchDeleteTag } from '@/api/content'

const { t } = useI18n()

const searchParams = reactive({ tagName: '' })
const tableData = ref<Api.Content.TagListItem[]>([])
const loading = ref(false)
const pagination = reactive({ current: 1, size: 10, total: 0 })
const newTagName = ref('')
const adding = ref(false)

async function fetchData() {
  loading.value = true
  try {
    const params: Api.Content.TagSearchParams = {
      current: pagination.current,
      size: pagination.size,
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
  pagination.size = size
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

async function handleDelete(id: number) {
  try {
    await fetchDeleteTag(id)
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
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-100">
        {{ t('content.tag.title') }}
      </h2>
    </div>

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

    <a-card :bordered="false">
      <a-form :model="searchParams" layout="inline" @submit="handleSearch" class="mb-4">
        <a-form-item field="tagName" :label="t('content.tag.columns.tagName')">
          <a-input
            v-model="searchParams.tagName"
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
        :row-key="'tagId'"
        stripe
      >
        <template #columns>
          <a-table-column title="#" :width="60">
            <template #cell="{ rowIndex }">
              {{ (pagination.current - 1) * pagination.size + rowIndex + 1 }}
            </template>
          </a-table-column>
          <a-table-column :title="t('content.tag.columns.tagName')" data-index="tagName">
            <template #cell="{ record }">
              <a-tag color="arcoblue">{{ record.tagName }}</a-tag>
            </template>
          </a-table-column>
          <a-table-column
            :title="t('content.tag.columns.articleCount')"
            data-index="articleCount"
            :width="100"
          />
          <a-table-column
            :title="t('content.tag.columns.createTime')"
            data-index="createTime"
            :width="180"
          />
          <a-table-column :title="t('content.tag.columns.action')" :width="100" fixed="right">
            <template #cell="{ record }">
              <a-popconfirm :content="t('common.tips')" @ok="handleDelete(record.tagId)">
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
