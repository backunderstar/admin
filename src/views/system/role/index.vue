<!-- ============================================================
  SystemRole — 角色管理页
  ============================================================ -->
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { fetchGetRoleList } from '@/api/system-manage'
import ProTable from '@/components/ProTable/index.vue'
import type { SearchField, ProTableColumn } from '@/components/ProTable/types'

const { t } = useI18n()

const searchFields: SearchField[] = [
  {
    field: 'roleName',
    label: t('system.role.columns.roleName'),
    type: 'input',
    placeholder: t('table.searchBar.searchInputPlaceholder'),
  },
]

const columns: ProTableColumn[] = [
  { title: t('system.role.columns.roleName'), dataIndex: 'roleName', width: 160 },
  { title: t('system.role.columns.roleCode'), dataIndex: 'roleCode', width: 140 },
  { title: t('system.role.columns.description'), dataIndex: 'description' },
  { title: t('system.role.columns.enabled'), dataIndex: 'enabled', width: 100 },
  { title: t('system.role.columns.createTime'), dataIndex: 'createTime', width: 180 },
]

const tableData = ref<Api.SystemManage.RoleListItem[]>([])
const loading = ref(false)
const pagination = reactive({ current: 1, pageSize: 10, total: 0 })
const searchParams = reactive({ roleName: '' })

async function fetchData() {
  loading.value = true
  try {
    const params: Api.SystemManage.RoleSearchParams = {
      current: pagination.current,
      size: pagination.pageSize,
    }
    if (searchParams.roleName) params.roleName = searchParams.roleName
    const res = await fetchGetRoleList(params)
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
  searchParams.roleName = ''
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

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="system-role-page">
    <ProTable
      :title="t('system.role.title')"
      :columns="columns"
      :data="tableData"
      :loading="loading"
      :pagination="pagination"
      :search-fields="searchFields"
      :search-model="searchParams"
      :row-key="'roleId'"
      :show-add="false"
      :show-delete="false"
      column-resizable
      @search="handleSearch"
      @reset="handleReset"
      @page-change="handlePageChange"
      @page-size-change="handlePageSizeChange"
    >
      <!-- 角色编码列 -->
      <template #column-roleCode="{ record }">
        <a-tag color="arcoblue">{{ record.roleCode }}</a-tag>
      </template>

      <!-- 启用状态列 -->
      <template #column-enabled="{ record }">
        <a-tag :color="record.enabled ? 'green' : 'red'">
          {{ record.enabled ? t('system.role.status.enabled') : t('system.role.status.disabled') }}
        </a-tag>
      </template>
    </ProTable>
  </div>
</template>
