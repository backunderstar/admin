<!-- ============================================================
  SystemUser — 用户管理页
  ============================================================ -->
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { fetchGetUserList, fetchDeleteUser } from '@/api/system-manage'
import { useAuth } from '@/hooks/core/useAuth'
import ProTable from '@/components/ProTable/index.vue'
import type { SearchField, ProTableColumn } from '@/components/ProTable/types'
import { Message } from '@arco-design/web-vue'

const { t } = useI18n()
const { hasAuth } = useAuth()
const router = useRouter()

const searchFields: SearchField[] = [
  {
    field: 'userName',
    label: t('system.user.columns.userName'),
    type: 'input',
    placeholder: t('table.searchBar.searchInputPlaceholder'),
  },
  {
    field: 'status',
    label: t('system.user.columns.status'),
    type: 'select',
    placeholder: t('table.searchBar.searchSelectPlaceholder'),
    style: 'width: 140px',
    options: [
      { label: t('system.user.status.enabled'), value: '1' },
      { label: t('system.user.status.disabled'), value: '2' },
    ],
  },
]

const columns: ProTableColumn[] = [
  { title: t('system.user.columns.userName'), dataIndex: 'userName', width: 120 },
  { title: t('system.user.columns.nickName'), dataIndex: 'nickName', width: 140 },
  { title: t('system.user.columns.userGender'), dataIndex: 'userGender', width: 80 },
  { title: t('system.user.columns.userPhone'), dataIndex: 'userPhone', width: 140 },
  { title: t('system.user.columns.userEmail'), dataIndex: 'userEmail', width: 200 },
  { title: t('system.user.columns.userRoles'), dataIndex: 'userRoles', width: 200 },
  { title: t('system.user.columns.status'), dataIndex: 'status', width: 90 },
  { title: t('system.user.columns.createTime'), dataIndex: 'createTime', width: 180 },
]

const tableData = ref<Api.SystemManage.UserListItem[]>([])
const loading = ref(false)
const pagination = reactive({ current: 1, pageSize: 10, total: 0 })
const searchParams = reactive({ userName: '', status: '' })

const genderMap: Record<string, string> = {
  '0': t('system.user.gender.unknown'),
  '1': t('system.user.gender.male'),
  '2': t('system.user.gender.female'),
}

const statusMap: Record<string, { label: string; color: string }> = {
  '1': { label: t('system.user.status.enabled'), color: 'green' },
  '2': { label: t('system.user.status.disabled'), color: 'red' },
}

async function fetchData() {
  loading.value = true
  try {
    const params: Api.SystemManage.UserSearchParams = {
      current: pagination.current,
      size: pagination.pageSize,
    }
    if (searchParams.userName) params.userName = searchParams.userName
    if (searchParams.status) params.status = searchParams.status
    const res = await fetchGetUserList(params)
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
  searchParams.userName = ''
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

function handleAdd() {
  router.push('/system/user/add')
}

async function handleDelete(row: Record<string, any>) {
  try {
    await fetchDeleteUser(row.id)
    Message.success(t('common.success'))
    fetchData()
  } catch {
    // error handled by interceptor
  }
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="system-user-page">
    <ProTable
      :title="t('system.user.title')"
      :columns="columns"
      :data="tableData"
      :loading="loading"
      :pagination="pagination"
      :search-fields="searchFields"
      :search-model="searchParams"
      :row-key="'id'"
      :show-add="true"
      :show-delete="true"
      :add-text="t('system.user.addUser')"
      column-resizable
      @search="handleSearch"
      @reset="handleReset"
      @add="handleAdd"
      @delete="handleDelete"
      @page-change="handlePageChange"
      @page-size-change="handlePageSizeChange"
    >
      <!-- 性别列 -->
      <template #column-userGender="{ record }">
        {{ genderMap[record.userGender] || t('system.user.gender.unknown') }}
      </template>

      <!-- 邮箱列 -->
      <template #column-userEmail="{ record }">
        <a-link :hoverable="false">{{ record.userEmail }}</a-link>
      </template>

      <!-- 角色列 -->
      <template #column-userRoles="{ record }">
        <a-space wrap>
          <a-tag v-for="role in record.userRoles" :key="role" color="arcoblue">
            {{ role }}
          </a-tag>
        </a-space>
      </template>

      <!-- 状态列 -->
      <template #column-status="{ record }">
        <a-tag :color="statusMap[record.status]?.color || 'gray'">
          {{ statusMap[record.status]?.label || record.status }}
        </a-tag>
      </template>

      <!-- 操作列：权限控制的编辑按钮 + ProTable 默认删除按钮 -->
      <template #action-prepend="{ record }">
        <a-button v-if="hasAuth('btn:edit')" type="text" size="small">
          <template #icon><icon-edit /></template>
          {{ t('table.edit') }}
        </a-button>
      </template>
    </ProTable>
  </div>
</template>
