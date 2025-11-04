<template>
  <div class="note-detail">
    <el-page-header class="detail-header" content="笔记详情" @back="goBack">
      <template #extra>
        <el-space>
          <el-button size="small" text @click="refresh" :loading="loading">刷新</el-button>
          <el-button type="primary" size="small" :loading="saving" :disabled="!dirty" @click="save">
            保存
          </el-button>
        </el-space>
      </template>
    </el-page-header>

    <el-card shadow="never" class="note-card" v-loading="loading">
      <div class="note-meta">
        <el-input v-model="note.title" placeholder="请输入标题" @input="markDirty" />
        <el-select
          v-model="note.type"
          class="type-select"
          size="small"
          placeholder="选择笔记类型"
          @change="markDirty"
        >
          <el-option
            v-for="item in typeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </div>

      <div class="note-info">
        <el-space wrap>
          <el-tag v-if="note.workspaceName" size="small" type="success">{{ note.workspaceName }}</el-tag>
          <el-tag v-if="formattedUpdatedAt" size="small" type="info" effect="plain">
            最后更新：{{ formattedUpdatedAt }}
          </el-tag>
        </el-space>
      </div>

      <div class="editor-container">
        <MarkdownEditor
          v-if="note.type === NOTE_TYPE.MARKDOWN"
          v-model="markdownContent"
        />
        <RichTextEditor
          v-else-if="note.type === NOTE_TYPE.RICH_TEXT"
          v-model="richTextContent"
        />
        <SketchPad
          v-else-if="note.type === NOTE_TYPE.SKETCH"
          v-model="sketchContent"
        />
        <el-input
          v-else
          v-model="markdownContent"
          type="textarea"
          :rows="16"
          placeholder="请输入笔记内容"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import dayjs from 'dayjs'
import { ElMessage, ElMessageBox } from 'element-plus'

import { getNote, updateNote } from '../api/note'
import MarkdownEditor from '../components/editors/MarkdownEditor.vue'
import RichTextEditor from '../components/editors/RichTextEditor.vue'
import SketchPad from '../components/editors/SketchPad.vue'

const NOTE_TYPE = {
  MARKDOWN: 0,
  RICH_TEXT: 1,
  SKETCH: 2
}

const typeOptions = [
  { label: 'Markdown 笔记', value: NOTE_TYPE.MARKDOWN },
  { label: '富文本笔记', value: NOTE_TYPE.RICH_TEXT },
  { label: '手写画板', value: NOTE_TYPE.SKETCH }
]

const createEmptyNote = () => ({
  id: '',
  title: '',
  type: NOTE_TYPE.MARKDOWN,
  contentMd: '',
  contentDoc: '',
  contentSketch: '',
  workspaceId: null,
  workspaceName: '',
  lastUpdateTime: null
})

const route = useRoute()
const router = useRouter()

const note = reactive(createEmptyNote())
const loading = ref(false)
const saving = ref(false)
const dirty = ref(false)
const initializing = ref(false)

const formattedUpdatedAt = computed(() =>
  note.lastUpdateTime ? dayjs(note.lastUpdateTime).format('YYYY-MM-DD HH:mm:ss') : ''
)

const markDirty = () => {
  if (!initializing.value) dirty.value = true
}

const markdownContent = computed({
  get: () => note.contentMd || '',
  set: value => {
    if (note.contentMd !== value) {
      note.contentMd = value
      markDirty()
    }
  }
})

const richTextContent = computed({
  get: () => note.contentDoc || '',
  set: value => {
    if (note.contentDoc !== value) {
      note.contentDoc = value
      markDirty()
    }
  }
})

const sketchContent = computed({
  get: () => note.contentSketch || '',
  set: value => {
    if (note.contentSketch !== value) {
      note.contentSketch = value
      markDirty()
    }
  }
})

watch(
  () => note.title,
  () => markDirty()
)

watch(
  () => note.type,
  value => {
    if (typeof value === 'string') note.type = Number(value)
    markDirty()
  }
)

const loadNote = async id => {
  if (!id) return
  loading.value = true
  initializing.value = true
  try {
    const data = await getNote(id)
    const normalized = {
      ...createEmptyNote(),
      ...(data || {})
    }
    normalized.type = Number(normalized.type ?? NOTE_TYPE.MARKDOWN)
    Object.assign(note, normalized)
  } catch (error) {
    console.error('加载笔记失败', error)
    ElMessage.error(error?.message || '笔记加载失败')
  } finally {
    loading.value = false
    nextTick(() => {
      initializing.value = false
      dirty.value = false
    })
  }
}

watch(
  () => route.params.id,
  id => {
    loadNote(id)
  },
  { immediate: true }
)

const refresh = () => loadNote(route.params.id)

const save = async () => {
  if (!note.id) return
  saving.value = true
  try {
    await updateNote(note.id, {
      title: note.title,
      type: note.type,
      contentMd: note.contentMd,
      contentDoc: note.contentDoc,
      contentSketch: note.contentSketch,
      workspaceId: note.workspaceId
    })
    await loadNote(note.id)
    ElMessage.success('保存成功')
  } catch (error) {
    console.error('保存笔记失败', error)
    ElMessage.error(error?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

const goBack = () => {
  router.back()
}

onBeforeRouteLeave((to, from, next) => {
  if (!dirty.value) {
    next()
    return
  }
  ElMessageBox.confirm('当前笔记尚未保存，确定要离开吗？', '提示', {
    type: 'warning',
    confirmButtonText: '离开',
    cancelButtonText: '取消'
  })
    .then(() => next())
    .catch(() => next(false))
})
</script>

<style scoped>
.note-detail {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: calc(100vh - 48px);
  box-sizing: border-box;
}

.detail-header {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid var(--el-border-color-light);
}

.note-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
}

.note-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.note-info {
  min-height: 24px;
}

.type-select {
  width: 160px;
}

.editor-container {
  flex: 1;
  min-height: 360px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

:deep(.markdown-editor),
:deep(.rich-editor),
:deep(.sketch-pad) {
  flex: 1;
}
</style>
