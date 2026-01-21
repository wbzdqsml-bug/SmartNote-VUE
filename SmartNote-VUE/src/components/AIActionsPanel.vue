<!--
  文件说明：通用业务组件（AIActionsPanel）
  - 主要职责：承载可复用的业务 UI 与交互逻辑，供多个页面组合。
  - 关键交互：梳理组件输入（props/状态）与输出（事件/调用）以便维护。
  - 依赖关系：记录依赖的 API/状态仓库/子组件，便于追踪数据来源。
  - 维护提示：修改结构或样式时，注意与父子组件/路由联动影响。
-->
<template>
  <n-card class="ai-actions-panel" size="small" :bordered="false">
    <template #header>
      <div class="panel-header">
        <div class="panel-title">AI 工具</div>
        <n-tag v-if="noteTitle" size="small" round type="info" class="note-tag">
          {{ noteTitle }}
        </n-tag>
      </div>
    </template>

    <template v-if="showClose" #header-extra>
      <n-button text @click="emit('close')">
        <n-icon :component="CloseOutline" :size="18" />
      </n-button>
    </template>

    <n-tabs type="line" animated default-value="summary" class="tabs">
      <n-tab-pane name="summary" tab="摘要">
        <n-space vertical size="small">
          <div class="config-row">
            <span class="config-label">长度</span>
            <n-input-number
              v-model:value="summaryMaxLength"
              size="small"
              :min="50"
              :max="1000"
              :step="50"
            />
          </div>

          <n-button type="primary" :loading="loadingSummary" :disabled="!canRunAi" @click="generateSummary">
            生成 AI 摘要
          </n-button>

          <n-card v-if="summaryResult" size="small" class="result-card">
            <template #header>摘要结果</template>
            <pre class="result-text">{{ summaryResult }}</pre>
            <template #footer>
              <n-space justify="end">
                <n-button size="tiny" @click="copyToClipboard(summaryResult)">复制</n-button>
              </n-space>
            </template>
          </n-card>
        </n-space>
      </n-tab-pane>

      <n-tab-pane name="knowledge-extension" tab="知识扩展">
        <n-space vertical size="small">
          <div class="config-row">
            <span class="config-label">条目数</span>
            <n-input-number
              v-model:value="extensionMaxItems"
              size="small"
              :min="3"
              :max="10"
              :step="1"
            />
          </div>

          <n-button
            type="primary"
            :loading="loadingExtension"
            :disabled="!canRunAi"
            @click="generateKnowledgeExtension"
          >
            生成知识扩展
          </n-button>

          <n-empty v-if="!extensionResult.length && !loadingExtension" description="点击生成知识扩展" />

          <n-space v-else vertical size="small">
            <n-card v-for="(item, index) in extensionResult" :key="index" size="small" class="item-card">
              <template #header>
                <div class="item-title">{{ item.title }}</div>
              </template>
              <div class="item-desc">{{ item.description }}</div>
            </n-card>
          </n-space>
        </n-space>
      </n-tab-pane>

      <n-tab-pane name="quiz" tab="智能出题">
        <n-space vertical size="small">
          <div class="config-row">
            <span class="config-label">题目数</span>
            <n-input-number v-model:value="quizCount" size="small" :min="1" :max="10" :step="1" />
          </div>

          <n-button type="primary" :loading="loadingQuiz" :disabled="!canRunAi" @click="generateQuiz">
            生成题目
          </n-button>

          <n-empty v-if="!quizResult.length && !loadingQuiz" description="点击生成题目" />

          <n-button v-if="quizResult.length" type="info" @click="showQuizModal = true">
            开始答题（{{ quizResult.length }} 题）
          </n-button>
        </n-space>

        <quiz-modal
          v-model:show="showQuizModal"
          :questions="quizResult"
        />
      </n-tab-pane>

      <n-tab-pane name="mindmap" tab="转导图">
        <n-space vertical size="small">
          <div class="config-row">
            <span class="config-label">节点数</span>
            <n-input-number
              v-model:value="mindmapMaxNodes"
              size="small"
              :min="5"
              :max="50"
              :step="5"
            />
          </div>

          <n-button type="primary" :loading="loadingMindmap" :disabled="!canRunAi" @click="generateMindmap">
            生成思维导图
          </n-button>

          <n-empty v-if="!mindmapResult && !loadingMindmap" description="点击生成思维导图" />

          <n-alert v-if="mindmapResult" type="info" :bordered="false" class="mindmap-hint">
            已生成 {{ mindmapResult?.nodes?.length || 0 }} 个节点、{{ mindmapResult?.edges?.length || 0 }} 条连线。
          </n-alert>

          <n-space v-if="mindmapResult" justify="space-between">
            <n-button type="info" @click="showMindmapModal = true">仅预览</n-button>
            <n-button type="success" :loading="savingMindmap" :disabled="!canSaveMindmap" @click="saveMindmapNote">
              保存为新思维导图笔记
            </n-button>
          </n-space>

          <n-alert v-if="mindmapResult && !canSaveMindmap" type="warning" :bordered="false" class="mindmap-hint">
            当前笔记缺少工作区信息，无法直接保存。请刷新笔记列表后重试。
          </n-alert>
        </n-space>
      </n-tab-pane>
    </n-tabs>
  </n-card>

  <n-modal v-model:show="showMindmapModal" preset="card" class="mindmap-modal" :segmented="modalSegmented">
    <template #header>
      <div class="mindmap-modal-header">
        <span class="mindmap-modal-title">AI 思维导图预览</span>
        <span class="mindmap-modal-subtitle">仅预览，不会保存到笔记</span>
      </div>
    </template>

    <div class="mindmap-modal-body">
      <mind-map-editor
        v-if="mindmapResult"
        :model-value="'[]'"
        :read-only="true"
        :preview-mindmap-content="mindmapResult"
      />
    </div>

    <template #footer>
      <n-space justify="end">
        <n-button @click="showMindmapModal = false">关闭</n-button>
        <n-button
          type="success"
          :loading="savingMindmap"
          :disabled="!mindmapResult || !canSaveMindmap"
          @click="saveMindmapNote"
        >
          保存为新思维导图笔记
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  NAlert,
  NButton,
  NCard,
  NEmpty,
  NIcon,
  NInputNumber,
  NModal,
  NSpace,
  NTabPane,
  NTabs,
  NTag,
  useMessage
} from 'naive-ui'
import { CloseOutline } from '@vicons/ionicons5'
import aiApi from '@/api/ai'
import noteApi from '@/api/note'
import MindMapEditor from '@/components/editors/MindMapEditor.vue'
import QuizModal from '@/components/QuizModal.vue'
import { defaultContentByType } from '@/constants/noteTypes'

const props = defineProps({
  noteId: {
    type: [Number, String],
    required: true
  },
  workspaceId: {
    type: [Number, String],
    default: null
  },
  noteTitle: {
    type: String,
    default: ''
  },
  categoryId: {
    type: [Number, String, null],
    default: null
  },
  tagIds: {
    type: Array,
    default: () => []
  },
  showClose: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const message = useMessage()
const router = useRouter()

const normaliseId = (value) => {
  if (value === null || value === undefined || value === '') return null
  const num = Number(value)
  return Number.isNaN(num) ? null : num
}

const resolvedNoteId = computed(() => normaliseId(props.noteId))
const resolvedWorkspaceId = computed(() => normaliseId(props.workspaceId))
const resolvedCategoryId = computed(() => {
  const value = props.categoryId
  if (value === null || value === undefined || value === '') return null
  const num = Number(value)
  return Number.isNaN(num) ? null : num
})
const resolvedTagIds = computed(() =>
  (Array.isArray(props.tagIds) ? props.tagIds : [])
    .map((val) => normaliseId(val))
    .filter((val) => val !== null)
)

const canRunAi = computed(() => resolvedNoteId.value !== null)
const canSaveMindmap = computed(() => resolvedWorkspaceId.value !== null)

const getErrorMessage = (error, fallback) => {
  return (
    error?.message ||
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    fallback
  )
}

const resolveResponse = (response, fallback = {}) => {
  const data = response?.data ?? fallback
  if (data && typeof data === 'object' && 'data' in data) {
    return data.data ?? fallback
  }
  return data ?? fallback
}

// --- Summary ---
const summaryMaxLength = ref(200)
const loadingSummary = ref(false)
const summaryResult = ref('')

const generateSummary = async () => {
  if (!resolvedNoteId.value) return
  loadingSummary.value = true
  summaryResult.value = ''
  try {
    summaryResult.value = await aiApi.summary(resolvedNoteId.value, summaryMaxLength.value)
    message.success('摘要生成成功')
  } catch (error) {
    message.error(getErrorMessage(error, '生成摘要失败'))
  } finally {
    loadingSummary.value = false
  }
}

// --- Knowledge Extension ---
const extensionMaxItems = ref(5)
const loadingExtension = ref(false)
const extensionResult = ref([])

const generateKnowledgeExtension = async () => {
  if (!resolvedNoteId.value) return
  loadingExtension.value = true
  extensionResult.value = []
  try {
    extensionResult.value = await aiApi.knowledgeExtension(resolvedNoteId.value, extensionMaxItems.value)
    message.success('知识扩展生成成功')
  } catch (error) {
    message.error(getErrorMessage(error, '生成知识扩展失败'))
  } finally {
    loadingExtension.value = false
  }
}

// --- Quiz ---
const quizCount = ref(5)
const loadingQuiz = ref(false)
const quizResult = ref([])
const showQuizModal = ref(false)

const generateQuiz = async () => {
  if (!resolvedNoteId.value) return
  loadingQuiz.value = true
  quizResult.value = []
  try {
    quizResult.value = await aiApi.quiz(resolvedNoteId.value, quizCount.value)
    if (!quizResult.value.length) {
      message.warning('未生成题目，请尝试调整题目数量后重试')
    } else {
      message.success('题目生成成功')
      showQuizModal.value = true
    }
  } catch (error) {
    message.error(getErrorMessage(error, '生成题目失败'))
  } finally {
    loadingQuiz.value = false
  }
}

// --- Mindmap ---
const mindmapMaxNodes = ref(20)
const loadingMindmap = ref(false)
const savingMindmap = ref(false)
const mindmapResult = ref(null) // { nodes, edges }
const showMindmapModal = ref(false)

const modalSegmented = {
  content: 'soft',
  footer: 'soft'
}

const generateMindmap = async () => {
  if (!resolvedNoteId.value) return
  loadingMindmap.value = true
  mindmapResult.value = null
  showMindmapModal.value = false
  try {
    mindmapResult.value = await aiApi.textToMindmap(resolvedNoteId.value, mindmapMaxNodes.value)
    message.success('思维导图生成成功')
  } catch (error) {
    message.error(getErrorMessage(error, '生成思维导图失败'))
  } finally {
    loadingMindmap.value = false
  }
}

const saveMindmapNote = async () => {
  if (!mindmapResult.value) return
  if (!resolvedWorkspaceId.value) {
    message.error('缺少 workspaceId，无法保存为新笔记')
    return
  }

  savingMindmap.value = true
  try {
    const titleBase = props.noteTitle?.trim() || '未命名笔记'
    const payload = {
      workspaceId: resolvedWorkspaceId.value,
      title: `AI 思维导图：${titleBase}`,
      type: 2,
      contentJson: defaultContentByType[2] || '[]',
      categoryId: resolvedCategoryId.value,
      tagIds: resolvedTagIds.value
    }

    const createRes = await noteApi.create(payload)
    const created = resolveResponse(createRes, {})
    const newId = created?.noteId ?? created?.id

    if (!newId) {
      throw new Error('创建新笔记失败：未返回笔记 ID')
    }

    await noteApi.update(newId, {
      contentJson: JSON.stringify(mindmapResult.value)
    })

    message.success('已保存为新思维导图笔记')
    showMindmapModal.value = false
    await router.push({ path: '/notes', query: { focus: newId } })
  } catch (error) {
    message.error(getErrorMessage(error, '保存思维导图笔记失败'))
  } finally {
    savingMindmap.value = false
  }
}

const copyToClipboard = async (text) => {
  const value = String(text || '').trim()
  if (!value) return

  try {
    await navigator.clipboard.writeText(value)
    message.success('已复制到剪贴板')
  } catch (error) {
    message.error('复制失败，请手动复制')
  }
}
</script>

<style scoped>
.ai-actions-panel {
  width: 100%;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.panel-title {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
}

.note-tag {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tabs :deep(.n-tabs-nav) {
  margin-bottom: 10px;
}

.config-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.config-label {
  font-size: 12px;
  color: #64748b;
  min-width: 44px;
}

.result-card :deep(.n-card__content) {
  padding-top: 8px;
}

.result-text {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
    monospace;
  font-size: 12px;
  color: #0f172a;
}

.item-title {
  font-weight: 700;
}

.item-desc {
  font-size: 13px;
  line-height: 1.5;
  color: #475569;
}

.mindmap-hint {
  font-size: 12px;
}

.mindmap-modal {
  width: min(92vw, 1200px);
  height: 80vh;
  display: flex;
  flex-direction: column;
}

.mindmap-modal :deep(.n-card__content) {
  flex: 1;
  min-height: 0;
  display: flex;
}

.mindmap-modal-header {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mindmap-modal-title {
  font-size: 16px;
  font-weight: 700;
}

.mindmap-modal-subtitle {
  font-size: 12px;
  color: #64748b;
}

.mindmap-modal-body {
  flex: 1;
  min-height: 0;
}

.mindmap-modal-body :deep(.mind-map-editor) {
  height: 100%;
}
</style>

