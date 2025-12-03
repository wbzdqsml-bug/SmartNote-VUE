<template>
  <div class="canvas-board">
    <div class="toolbar">
      <span>手写画板</span>
      <n-space size="small">
        <n-color-picker v-model:value="strokeStyle" size="small" />
        <n-slider v-model:value="lineWidth" :min="1" :max="12" style="width: 120px" />
        <n-button size="small" tertiary @click="handleClear">清除</n-button>
      </n-space>
    </div>
    <div class="board-wrapper" ref="wrapperRef">
      <canvas ref="canvasRef" class="board"></canvas>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { NButton, NSlider, NColorPicker, NSpace } from 'naive-ui'
import { fabric } from 'fabric'

const DEFAULT_WIDTH = 720
const DEFAULT_HEIGHT = 420

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const wrapperRef = ref(null)
const canvasRef = ref(null)
const fabricCanvas = ref(null)
const lineWidth = ref(3)
const strokeStyle = ref('#2dd4bf')
const isApplyingRemote = ref(false)

let resizeObserver = null

const getCanvasSize = () => {
  const wrapper = wrapperRef.value
  if (!wrapper) {
    return { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT }
  }
  const rect = wrapper.getBoundingClientRect()
  const width = Math.max(rect.width || wrapper.clientWidth || DEFAULT_WIDTH, 320)
  const height = Math.max(rect.height || wrapper.clientHeight || DEFAULT_HEIGHT, 320)
  return { width, height }
}

const emitJson = () => {
  if (!fabricCanvas.value || isApplyingRemote.value) return
  const payload = JSON.stringify(fabricCanvas.value.toJSON())
  emit('update:modelValue', payload)
}

const applyBrushStyle = () => {
  if (!fabricCanvas.value || !fabricCanvas.value.freeDrawingBrush) return
  fabricCanvas.value.freeDrawingBrush.color = strokeStyle.value
  fabricCanvas.value.freeDrawingBrush.width = lineWidth.value
}

const resizeCanvas = () => {
  if (!fabricCanvas.value) return
  const { width, height } = getCanvasSize()
  fabricCanvas.value.setWidth(width)
  fabricCanvas.value.setHeight(height)
  fabricCanvas.value.renderAll()
}

const loadFromModel = (value) => {
  if (!fabricCanvas.value) return
  isApplyingRemote.value = true
  if (!value) {
    fabricCanvas.value.clear()
    fabricCanvas.value.isDrawingMode = true
    applyBrushStyle()
    fabricCanvas.value.renderAll()
    isApplyingRemote.value = false
    return
  }
  try {
    fabricCanvas.value.loadFromJSON(value, () => {
      fabricCanvas.value.renderAll()
      fabricCanvas.value.isDrawingMode = true
      applyBrushStyle()
      isApplyingRemote.value = false
    })
  } catch (error) {
    fabricCanvas.value.clear()
    isApplyingRemote.value = false
  }
}

const initCanvas = () => {
  if (!canvasRef.value) return
  const canvas = new fabric.Canvas(canvasRef.value, {
    isDrawingMode: true,
    selection: false
  })
  const { width, height } = getCanvasSize()
  canvas.setWidth(width)
  canvas.setHeight(height)
  fabricCanvas.value = canvas
  applyBrushStyle()

  canvas.on('path:created', emitJson)
}

const handleClear = () => {
  if (!fabricCanvas.value) return
  fabricCanvas.value.clear()
  fabricCanvas.value.isDrawingMode = true
  applyBrushStyle()
  fabricCanvas.value.renderAll()
  emit('update:modelValue', '')
}

const handleWindowResize = () => {
  resizeCanvas()
}

onMounted(() => {
  initCanvas()
  window.addEventListener('resize', handleWindowResize)

  resizeObserver = new ResizeObserver(() => resizeCanvas())
  if (wrapperRef.value) {
    resizeObserver.observe(wrapperRef.value)
  }

  if (props.modelValue) {
    loadFromModel(props.modelValue)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleWindowResize)
  resizeObserver?.disconnect()
  resizeObserver = null
  fabricCanvas.value?.dispose()
})

watch(
  () => props.modelValue,
  (value) => {
    if (!fabricCanvas.value) return
    loadFromModel(value)
  }
)

watch(lineWidth, () => applyBrushStyle())
watch(strokeStyle, () => applyBrushStyle())
</script>

<style scoped>
.canvas-board {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.toolbar-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.color-control {
  display: inline-flex;
}

:deep(.n-color-picker-trigger) {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  background: #f8fafc;
  cursor: pointer;
}

:deep(.n-color-picker-trigger__fill),
:deep(.n-color-picker-checkboard) {
  border-radius: 6px;
}

:deep(.n-color-picker-trigger__value) {
  display: none !important;
}

.board-wrapper {
  flex: 0 0 420px;
  min-height: 420px;
  max-height: 420px;
  width: 100%;
  border-radius: 16px;
  overflow: hidden;
  background: #f8fafc;
  box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.08);
}

.board {
  width: 100%;
  height: 100%;
  display: block;
  touch-action: none;
  cursor: crosshair;
}
</style>
