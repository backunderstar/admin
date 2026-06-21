<!-- ============================================================
  SystemRole — 角色管理页

  ## 功能
  - 搜索：角色名称模糊搜索
  - 表格：展示角色列表（序号、角色名称、角色编码、描述、状态、创建时间）
  - 分页：标准分页组件

  ## 使用的 API
  - fetchGetRoleList: 获取角色列表（分页+搜索）
  ============================================================ -->
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { fetchGetRoleList } from '@/api/system-manage'

const { t } = useI18n()

// ── 搜索表单 ──────────────────────────────────────────────
const searchParams = reactive({
  roleName: '',
})

// ── 表格状态 ──────────────────────────────────────────────
const tableData = ref<Api.SystemManage.RoleListItem[]>([])
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
    const params: Api.SystemManage.RoleSearchParams = {
      current: pagination.current,
      size: pagination.size,
    }
    if (searchParams.roleName) params.roleName = searchParams.roleName

    const res = await fetchGetRoleList(params)
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
  searchParams.roleName = ''
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

// ── 初始化 ────────────────────────────────────────────────
onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="system-role-page">
    <!-- ── 页面标题 ────────────────────────────────── -->
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-100">
        {{ t('system.role.title') }}
      </h2>
    </div>

    <!-- ── 搜索表单 ────────────────────────────────── -->
    <a-card class="mb-4" :bordered="false">
      <a-form :model="searchParams" layout="inline" @submit="handleSearch">
        <a-form-item field="roleName" :label="t('system.role.columns.roleName')">
          <a-input
            v-model="searchParams.roleName"
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
            <a-button @click="handleReset">
              {{ t('table.searchBar.reset') }}
            </a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>

    <!-- ── 角色表格 ────────────────────────────────── -->
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
        :row-key="'roleId'"
        stripe
        column-resizable
      >
        <template #columns>
          <!-- 序号 -->
          <a-table-column title="#" :width="60">
            <template #cell="{ rowIndex }">
              {{ (pagination.current - 1) * pagination.size + rowIndex + 1 }}
            </template>
          </a-table-column>

          <!-- 角色名称 -->
          <a-table-column
            :title="t('system.role.columns.roleName')"
            data-index="roleName"
            :width="160"
          />

          <!-- 角色编码 -->
          <a-table-column :title="t('system.role.columns.roleCode')" :width="140">
            <template #cell="{ record }">
              <a-tag color="arcoblue">{{ record.roleCode }}</a-tag>
            </template>
          </a-table-column>

          <!-- 描述 -->
          <a-table-column :title="t('system.role.columns.description')" data-index="description" />

          <!-- 状态 -->
          <a-table-column :title="t('system.role.columns.enabled')" :width="100">
            <template #cell="{ record }">
              <a-tag :color="record.enabled ? 'green' : 'red'">
                {{
                  record.enabled
                    ? t('system.role.status.enabled')
                    : t('system.role.status.disabled')
                }}
              </a-tag>
            </template>
          </a-table-column>

          <!-- 创建时间 -->
          <a-table-column
            :title="t('system.role.columns.createTime')"
            data-index="createTime"
            :width="180"
          />
        </template>
      </a-table>
    </a-card>
  </div>
</template>
