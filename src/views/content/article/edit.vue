<!-- ============================================================
  ContentArticleEdit — 文章编辑页（md-editor-v3）
  ============================================================ -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import {
  fetchGetArticleDetail,
  fetchCreateArticle,
  fetchUpdateArticle,
  fetchGetCategoryList,
  fetchGetTagList,
} from '@/api/content'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const isEdit = !!route.params.id
const title = ref('')
const content = ref('')
const categoryId = ref<number | undefined>()
const selectedTags = ref<string[]>([])
const saving = ref(false)

const categories = ref<Api.Content.CategoryListItem[]>([])
const allTags = ref<Api.Content.TagListItem[]>([])

async function loadMeta() {
  try {
    const catRes = await fetchGetCategoryList({ current: 1, size: 100 })
    categories.value = catRes.records
    const tagRes = await fetchGetTagList({ current: 1, size: 100 })
    allTags.value = tagRes.records
  } catch {
    // ignore
  }
}

async function loadArticle() {
  if (!isEdit) return
  try {
    const res = await fetchGetArticleDetail(Number(route.params.id))
    title.value = res.title
    content.value = res.content
    categoryId.value = res.categoryId
    selectedTags.value = res.tags
  } catch {
    // ignore
  }
}

async function handleSave(status: '0' | '1') {
  saving.value = true
  try {
    const data = {
      title: title.value,
      content: content.value,
      categoryId: categoryId.value,
      tags: selectedTags.value,
      status,
    }
    if (isEdit) {
      await fetchUpdateArticle(Number(route.params.id), data)
    } else {
      await fetchCreateArticle(data)
    }
    router.push('/content/article')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadMeta()
  loadArticle()
})
</script>

<template>
  <div class="content-article-edit-page">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-100">
        {{ t('content.articleEdit.title') }}
      </h2>
      <a-space>
        <a-button @click="router.push('/content/article')">{{ t('common.cancel') }}</a-button>
        <a-button type="primary" :loading="saving" @click="handleSave('0')">
          {{ t('content.articleEdit.save') }}
        </a-button>
        <a-button type="primary" status="success" :loading="saving" @click="handleSave('1')">
          {{ t('content.articleEdit.publish') }}
        </a-button>
      </a-space>
    </div>

    <a-card :bordered="false" class="mb-4">
      <a-space fill>
        <a-input
          v-model="title"
          :placeholder="t('content.articleEdit.placeholder')"
          size="large"
          style="flex: 1"
        />
        <a-select
          v-model="categoryId"
          :placeholder="t('content.article.columns.categoryName')"
          allow-clear
          style="width: 160px"
        >
          <a-option
            v-for="cat in categories"
            :key="cat.categoryId"
            :value="cat.categoryId"
            :label="cat.categoryName"
          />
        </a-select>
      </a-space>
      <div class="mt-3">
        <a-select
          v-model="selectedTags"
          :placeholder="t('content.article.columns.tags')"
          multiple
          allow-create
          style="width: 100%"
        >
          <a-option
            v-for="tag in allTags"
            :key="tag.tagId"
            :value="tag.tagName"
            :label="tag.tagName"
          />
        </a-select>
      </div>
    </a-card>

    <a-card :bordered="false" style="min-height: 500px">
      <MdEditor
        v-model="content"
        language="zh-CN"
        :toolbars-exclude="['github']"
        style="min-height: 500px"
      />
    </a-card>
  </div>
</template>
