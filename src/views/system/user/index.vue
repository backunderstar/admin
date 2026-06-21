<!-- ============================================================
  SystemUser — 用户管理页

  ## 功能
  - 搜索：用户名模糊搜索 + 状态筛选
  - 表格：展示用户列表（序号、用户名、昵称、性别、手机号、邮箱、角色、状态、创建时间、操作）
  - 分页：标准分页组件
  - 权限：根据用户角色控制操作按钮显示

  ## 使用的 API
  - fetchGetUserList: 获取用户列表（分页+搜索）
  ============================================================ -->
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { fetchGetUserList } from '@/api/system-manage'
import { useAuth } from '@/hooks/core/useAuth'

const { t } = useI18n()
const { hasAuth } = useAuth()

// ── 搜索表单 ──────────────────────────────────────────────
const searchParams = reactive({
  userName: '',
  status: '',
})

// ── 表格状态 ──────────────────────────────────────────────
const tableData = ref<Api.SystemManage.UserListItem[]>([])
const loading = ref(false)
const pagination = reactive({
  current: 1,
  size: 10,
  total: 0,
})

// ── 获取数据 ──────────────────────────────────────────────
async function fetchData() {
  loading.value = true
  try {
    const params: Api.SystemManage.UserSearchParams = {
      current: pagination.current,
      size: pagination.size,
    }
    if (searchParams.userName) params.userName = searchParams.userName
    if (searchParams.status) params.status = searchParams.status

    const res = await fetchGetUserList(params)
    tableData.value = res.records
    pagination.total = res.total
  } catch {
    // 错误已在 axios 拦截器中统一处理
  } finally {
    loading.value = false
  }
}

// ── 搜索/重置 ────────────────────────────────────────────
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
  pagination.size = size
  pagination.current = 1
  fetchData()
}

// ── 性别映射 ────────────────────────────────────────────
const genderMap: Record<string, string> = {
  '0': t('system.user.gender.unknown'),
  '1': t('system.user.gender.male'),
  '2': t('system.user.gender.female'),
}

// ── 状态映射 ────────────────────────────────────────────
const statusMap: Record<string, { label: string; color: string }> = {
  '1': { label: t('system.user.status.enabled'), color: 'green' },
  '2': { label: t('system.user.status.disabled'), color: 'red' },
}

// ── 初始化 ────────────────────────────────────────────────
onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="system-user-page">
    <!-- ── 页面标题 ────────────────────────────────── -->
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-100">
        {{ t('system.user.title') }}
      </h2>
    </div>

    <!-- ── 搜索表单 ────────────────────────────────── -->
    <a-card class="mb-4" :bordered="false">
      <a-form :model="searchParams" layout="inline" @submit="handleSearch">
        <a-form-item field="userName" :label="t('system.user.columns.userName')">
          <a-input
            v-model="searchParams.userName"
            :placeholder="t('table.searchBar.searchInputPlaceholder')"
            allow-clear
            style="width: 200px"
          />
        </a-form-item>
        <a-form-item field="status" :label="t('system.user.columns.status')">
          <a-select
            v-model="searchParams.status"
            :placeholder="t('table.searchBar.searchSelectPlaceholder')"
            allow-clear
            style="width: 140px"
          >
            <a-option value="1">{{ t('system.user.status.enabled') }}</a-option>
            <a-option value="2">{{ t('system.user.status.disabled') }}</a-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-space>
            <a-button type="primary" html-type="submit">
              <template #icon><icon-search /></template>
              {{ t('table.searchBar.search') }}
            </a-button>
            <a-button @click="handleReset">
              {{ t('table.searchBar.reset') }}
            </a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>

    <!-- ── 用户表格 ────────────────────────────────── -->
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
        <!-- 序号 -->
        <template #columns>
          <a-table-column title="#" :width="60">
            <template #cell="{ rowIndex }">
              {{ (pagination.current - 1) * pagination.size + rowIndex + 1 }}
            </template>
          </a-table-column>

          <!-- 用户名 -->
          <a-table-column
            :title="t('system.user.columns.userName')"
            data-index="userName"
            :width="120"
          />

          <!-- 昵称 -->
          <a-table-column
            :title="t('system.user.columns.nickName')"
            data-index="nickName"
            :width="140"
          />

          <!-- 性别 -->
          <a-table-column :title="t('system.user.columns.userGender')" :width="80">
            <template #cell="{ record }">
              {{ genderMap[record.userGender] || t('system.user.gender.unknown') }}
            </template>
          </a-table-column>

          <!-- 手机号 -->
          <a-table-column
            :title="t('system.user.columns.userPhone')"
            data-index="userPhone"
            :width="140"
          />

          <!-- 邮箱 -->
          <a-table-column
            :title="t('system.user.columns.userEmail')"
            data-index="userEmail"
            :width="200"
          >
            <template #cell="{ record }">
              <a-link :hoverable="false">{{ record.userEmail }}</a-link>
            </template>
          </a-table-column>

          <!-- 角色 -->
          <a-table-column :title="t('system.user.columns.userRoles')" :width="200">
            <template #cell="{ record }">
              <a-space wrap>
                <a-tag v-for="role in record.userRoles" :key="role" color="arcoblue">
                  {{ role }}
                </a-tag>
              </a-space>
            </template>
          </a-table-column>

          <!-- 状态 -->
          <a-table-column :title="t('system.user.columns.status')" :width="90">
            <template #cell="{ record }">
              <a-tag :color="statusMap[record.status]?.color || 'gray'">
                {{ statusMap[record.status]?.label || record.status }}
              </a-tag>
            </template>
          </a-table-column>

          <!-- 创建时间 -->
          <a-table-column
            :title="t('system.user.columns.createTime')"
            data-index="createTime"
            :width="180"
          />

          <!-- 操作 -->
          <a-table-column :title="t('system.user.columns.action')" :width="160" fixed="right">
            <template #cell>
              <a-space>
                <a-button v-if="hasAuth('btn:edit')" type="text" size="small">
                  <template #icon><icon-edit /></template>
                  {{ t('table.edit') || '编辑' }}
                </a-button>
                <a-button v-if="hasAuth('btn:delete')" type="text" size="small" status="danger">
                  <template #icon><icon-delete /></template>
                  {{ t('table.delete') || '删除' }}
                </a-button>
              </a-space>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </a-card>
  </div>
</template>
