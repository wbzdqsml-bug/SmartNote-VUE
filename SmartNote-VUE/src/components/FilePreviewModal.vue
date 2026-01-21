<!--
  文件说明：通用业务组件（FilePreviewModal）
  - 主要职责：承载可复用的业务 UI 与交互逻辑，供多个页面组合。
  - 关键交互：梳理组件输入（props/状态）与输出（事件/调用）以便维护。
  - 依赖关系：记录依赖的 API/状态仓库/子组件，便于追踪数据来源。
  - 维护提示：修改结构或样式时，注意与父子组件/路由联动影响。
-->
<template>
  <n-modal
    v-model:show="showInternal"
    preset="card"
    class="file-preview-modal"
    :title="fileName || '文件预览'"
    :style="{ width: '80vw', height: '85vh', maxWidth: '1200px' }"
  >
    <div class="preview-container">
      <div v-if="isImage" class="image-wrapper">
        <n-image
          :src="fileUrl"
          :img-props="{ style: { maxHeight: '75vh', maxWidth: '100%' } }"
          show-toolbar-tooltip
        />
      </div>

      <iframe
        v-else-if="canIframe"
        :src="fileUrl"
        class="file-iframe"
        frameborder="0"
      ></iframe>

      <div v-else class="unsupported">
        <n-empty description="该文件类型暂不支持直接预览">
          <template #extra>
            <n-button type="primary" tag="a" :href="fileUrl" target="_blank" download>
              下载文件查看
            </n-button>
          </template>
        </n-empty>
      </div>
    </div>
  </n-modal>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { NModal, NImage, NEmpty, NButton } from 'naive-ui'

const props = defineProps({
  show: Boolean,
  url: String,
  name: String,
  type: String // mime-type
})

const emit = defineEmits(['update:show'])

const showInternal = computed({
  get: () => props.show,
  set: (val) => emit('update:show', val)
})

const fileUrl = computed(() => props.url)
const fileName = computed(() => props.name)

const isImage = computed(() => {
  if (!props.url) return false
  // 简单的判断：通过后缀或传入的 type
  const ext = props.url.split('.').pop().toLowerCase().split('?')[0]
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext) || props.type?.startsWith('image/')
})

const canIframe = computed(() => {
  if (!props.url) return false
  const ext = props.url.split('.').pop().toLowerCase().split('?')[0]
  return ['pdf', 'txt', 'mp4', 'webm'].includes(ext) || props.type === 'application/pdf'
})
</script>

<style scoped>
.file-preview-modal { display: flex; flex-direction: column; }
.preview-container { height: 100%; display: flex; align-items: center; justify-content: center; background: #f9fafb; border-radius: 8px; overflow: hidden; }
.image-wrapper { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
.file-iframe { width: 100%; height: 100%; background: #fff; }
.unsupported { padding: 40px; }
</style>