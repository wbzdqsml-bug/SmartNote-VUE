<template>
  <div class="note-sidebar">
    <div v-if="!note" class="empty-tip">
      <n-empty description="未选择笔记" />
    </div>
    <template v-else-if="sidebarReady">
      <div class="section">
        <div class="section-title">操作</div>
        <div class="action-row">
          <n-button size="small" secondary @click="triggerImport">
            <template #icon><n-icon :component="CloudUploadOutline" /></template>
            导入
          </n-button>
        </div>
        <input
          ref="fileInput"
          type="file"
          class="import-input"
          accept=".md,.json,.txt,.html"
          @change="handleImportFile"
        />
      </div>

      <n-divider />

      <div class="section">
        <div class="section-title">信息</div>
        <div class="info-item">
          <span class="label">创建于</span>
          <span class="value">{{ formatDate(note.createdAt) }}</span>
        </div>
        <div class="info-item">
          <span class="label">更新于</span>
          <span class="value">{{ formatDate(note.updateTime) }}</span>
        </div>
        <div class="info-item">
          <span class="label">分类</span>
          <span class="value">{{ note.categoryName || '未分类' }}</span>
        </div>
      </div>

      <n-divider />

      <div class="section">
        <div class="section-title">分类</div>
        <n-select
          v-model:value="localCategoryId"
          :options="categoryOptions"
          placeholder="选择分类"
          clearable
          filterable
          size="small"
          :disabled="!canEditMeta"
          @update:value="handleCategoryChange"
        />
      </div>

      <n-divider />

      <div class="section">
        <div class="section-title">标签</div>
        <n-select
          v-model:value="localTagIds"
          :options="tagOptions"
          placeholder="选择标签"
          multiple
          clearable
          filterable
          size="small"
          :disabled="!canEditMeta"
          @update:value="handleTagChange"
        />
        <n-space v-if="note.tags?.length" class="tag-preview" size="small">
          <n-tag
            v-for="tag in note.tags"
            :key="tag.id ?? tag.tagId ?? tag.TagId"
            :color="{ color: tag.color || tag.Color || '#94a3b8', textColor: '#fff' }"
            size="small"
          >
            {{ tag.name || tag.Name }}
          </n-tag>
        </n-space>
      </div>

      <n-divider />

      <div class="section">
        <div class="section-title">
          <span>附件</span>
          <n-upload
            :show-file-list="false"
            :custom-request="handleUpload"
            style="display: inline-block; margin-left: auto;"
          >
            <n-button size="tiny" secondary circle title="上传附件">
              <template #icon><n-icon :component="CloudUploadOutline" /></template>
            </n-button>
          </n-upload>
        </div>
        
        <n-spin :show="loadingAttachments">
          <n-list hoverable clickable size="small">
            <n-list-item v-for="att in attachments" :key="att.id">
              <div class="attachment-item">
                <div class="att-icon">
                  <n-icon :component="DocumentAttachOutline" />
                </div>
                <div class="att-info" @click="handleDownload(att)">
                  <div class="att-name" :title="att.fileName">{{ att.fileName }}</div>
                  <div class="att-size">{{ formatSize(att.size) }}</div>
                </div>
                <n-button size="tiny" quaternary circle type="error" @click.stop="handleDeleteAttachment(att.id)">
                  <template #icon><n-icon :component="TrashOutline" /></template>
                </n-button>
              </div>
            </n-list-item>
            <n-empty v-if="!attachments.length" description="无附件" size="small" />
          </n-list>
        </n-spin>
      </div>

      <div class="footer-actions">
        <n-button type="error" ghost block @click="$emit('soft-delete', note.id)">
          移入回收站
        </n-button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { NEmpty, NDivider, NSpace, NTag, NButton, NList, NListItem, NIcon, NSpin, NUpload, NSelect, useMessage } from 'naive-ui'
import { CloudUploadOutline, DocumentAttachOutline, TrashOutline } from '@vicons/ionicons5'
import { format } from 'date-fns'
import noteApi from '@/api/note'
import { downloadAuthFile } from '@/api/resource'

const props = defineProps({
  note: Object,
  saving: Boolean,
  categoryOptions: {
    type: Array,
    default: () => []
  },
  tagOptions: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update-note', 'soft-delete', 'refresh'])
const message = useMessage()
const route = useRoute()

const attachments = ref([])
const loadingAttachments = ref(false)
const localCategoryId = ref(null)
const localTagIds = ref([])
const sidebarReady = ref(true)
const fileInput = ref(null)

const formatDate = (ts) => ts ? format(new Date(ts), 'yyyy-MM-dd HH:mm') : '-'

const normaliseId = (value) => {
  if (value === null || value === undefined) return null
  const num = Number(value)
  return Number.isNaN(num) ? value : num
}

const resolveTagIds = (note) => {
  if (!note) return []
  if (Array.isArray(note.tagIds)) {
    return note.tagIds.map((id) => normaliseId(id)).filter((id) => id !== null && id !== undefined)
  }
  if (Array.isArray(note.tags)) {
    return note.tags
      .map((tag) => normaliseId(tag?.id ?? tag?.tagId ?? tag?.TagId))
      .filter((id) => id !== null && id !== undefined)
  }
  return []
}

const canEditMeta = computed(() => Boolean(props.note?.id) && !props.saving)

const formatSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const loadAttachments = async () => {
  if (!props.note?.id) return
  loadingAttachments.value = true
  try {
    const res = await noteApi.getAttachments(props.note.id)
    attachments.value = res.data.data || res.data || []
  } catch (e) {
    console.error(e)
  } finally {
    loadingAttachments.value = false
  }
}

const handleUpload = async ({ file }) => {
  try {
    await noteApi.uploadAttachment(props.note.id, file.file)
    message.success('上传成功')
    loadAttachments()
  } catch (e) {
    message.error('上传失败')
  }
}

const triggerImport = () => {
  fileInput.value?.click()
}

const resolveWorkspaceId = () => {
  return props.note?.workspaceId ?? props.note?.WorkspaceId ?? route.params?.workspaceId ?? null
}

const handleImportFile = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  const workspaceId = resolveWorkspaceId()
  if (!workspaceId) {
    message.warning('请先进入一个工作区')
    event.target.value = ''
    return
  }

  try {
    await noteApi.importNote(workspaceId, file)
    message.success('导入成功')
    emit('refresh')
  } catch (e) {
    console.error(e)
    message.error(e?.response?.data?.message || '导入失败')
  } finally {
    event.target.value = ''
  }
}

const handleDownload = async (att) => {
  try {
    await downloadAuthFile(att.downloadUrl, att.fileName)
  } catch (e) {
    message.error('下载失败')
  }
}

const handleDeleteAttachment = async (id) => {
  try {
    await noteApi.deleteAttachment(id)
    message.success('已删除')
    loadAttachments()
  } catch (e) {
    message.error('删除失败')
  }
}

const handleCategoryChange = (value) => {
  if (!props.note?.id) return
  emit('update-note', {
    id: props.note.id,
    payload: {
      categoryId: value ?? null
    }
  })
}

const handleTagChange = (value) => {
  if (!props.note?.id) return
  emit('update-note', {
    id: props.note.id,
    payload: {
      tagIds: Array.isArray(value) ? value : []
    },
    tagsChanged: true
  })
}

watch(
  () => props.note?.id,
  (newId, oldId) => {
    if (newId === oldId && sidebarReady.value) return

    sidebarReady.value = false
    setTimeout(() => {
      if (newId) {
        localCategoryId.value = normaliseId(props.note?.categoryId)
        localTagIds.value = resolveTagIds(props.note)
        loadAttachments()
      } else {
        attachments.value = []
      }
      sidebarReady.value = true
    }, 0)
  },
  { immediate: true }
)
</script>

<style scoped>
.note-sidebar { padding: 16px; height: 100%; display: flex; flex-direction: column; }
.empty-tip { display: flex; align-items: center; justify-content: center; height: 100%; color: #999; }
.section { margin-bottom: 16px; }
.section-title { font-weight: 600; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between; }
.action-row { display: flex; align-items: center; gap: 8px; }
.import-input { display: none; }
.section :deep(.n-select) { width: 100%; }
.info-item { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; }
.label { color: #666; }
.value { color: #333; }
.attachment-item { display: flex; align-items: center; gap: 8px; width: 100%; }
.att-icon { font-size: 20px; color: #666; }
.att-info { flex: 1; min-width: 0; cursor: pointer; }
.att-name { font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.att-size { font-size: 11px; color: #999; }
.tag-preview { margin-top: 8px; flex-wrap: wrap; }
.footer-actions { margin-top: auto; }
</style>
