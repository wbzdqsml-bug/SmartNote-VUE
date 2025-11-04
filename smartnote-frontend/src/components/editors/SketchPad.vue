<template>
  <div class="sketch-pad" ref="container">
    <div class="toolbar">
      <div class="tool-group">
        <span>颜色</span>
        <el-color-picker v-model="strokeStyle" size="small" />
      </div>
      <div class="tool-group width">
        <span>粗细</span>
        <el-slider v-model="lineWidth" :min="1" :max="20" :step="1" style="width: 140px" />
      </div>
      <el-button size="small" @click="clear">清空画板</el-button>
    </div>
    <canvas
      ref="canvas"
      class="sketch-canvas"
      @pointerdown="startDrawing"
      @pointermove="draw"
      @pointerup="stopDrawing"
      @pointerleave="stopDrawing"
      @pointercancel="stopDrawing"
    />
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  height: { type: Number, default: 420 },
  background: { type: String, default: '#ffffff' }
})

const emit = defineEmits(['update:modelValue'])

const container = ref(null)
const canvas = ref(null)
const ctx = ref(null)
const drawing = ref(false)
const strokeStyle = ref('#1f2937')
const lineWidth = ref(4)

const setContextStyle = () => {
  if (!ctx.value) return
  ctx.value.strokeStyle = strokeStyle.value
  ctx.value.lineWidth = lineWidth.value
  ctx.value.lineCap = 'round'
  ctx.value.lineJoin = 'round'
}

const fillBackground = () => {
  if (!ctx.value || !canvas.value) return
  ctx.value.save()
  ctx.value.globalCompositeOperation = 'source-over'
  ctx.value.fillStyle = props.background
  ctx.value.fillRect(0, 0, canvas.value.width, canvas.value.height)
  ctx.value.restore()
  setContextStyle()
}

const resizeCanvas = () => {
  if (!container.value || !canvas.value) return
  const { width } = container.value.getBoundingClientRect()
  const current = canvas.value.toDataURL('image/png')
  canvas.value.width = Math.max(width, 300)
  canvas.value.height = props.height
  ctx.value = canvas.value.getContext('2d')
  fillBackground()
  if (current) {
    loadSketch(current)
  }
}

const loadSketch = value => {
  if (!value || !ctx.value) return
  const image = new Image()
  image.onload = () => {
    fillBackground()
    ctx.value.drawImage(image, 0, 0, canvas.value.width, canvas.value.height)
  }
  image.src = value
}

const emitValue = () => {
  if (!canvas.value) return
  emit('update:modelValue', canvas.value.toDataURL('image/png'))
}

const getPoint = event => {
  const rect = canvas.value.getBoundingClientRect()
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  }
}

const startDrawing = event => {
  if (!ctx.value) return
  event.preventDefault()
  drawing.value = true
  setContextStyle()
  ctx.value.beginPath()
  const { x, y } = getPoint(event)
  ctx.value.moveTo(x, y)
}

const draw = event => {
  if (!drawing.value || !ctx.value) return
  event.preventDefault()
  const { x, y } = getPoint(event)
  ctx.value.lineTo(x, y)
  ctx.value.stroke()
}

const stopDrawing = () => {
  if (!drawing.value || !ctx.value) return
  drawing.value = false
  ctx.value.closePath()
  emitValue()
}

const handlePointerUp = () => {
  if (drawing.value) stopDrawing()
}

const clear = () => {
  fillBackground()
  emit('update:modelValue', '')
}

onMounted(() => {
  resizeCanvas()
  if (props.modelValue) {
    loadSketch(props.modelValue)
  }
  window.addEventListener('resize', resizeCanvas)
  window.addEventListener('pointerup', handlePointerUp)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCanvas)
  window.removeEventListener('pointerup', handlePointerUp)
})

watch(strokeStyle, setContextStyle)
watch(lineWidth, setContextStyle)

watch(
  () => props.modelValue,
  value => {
    if (!value) {
      fillBackground()
    } else if (!drawing.value) {
      loadSketch(value)
    }
  }
)
</script>

<style scoped>
.sketch-pad {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}

.toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.tool-group {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.tool-group.width {
  min-width: 220px;
}

.sketch-canvas {
  flex: 1;
  width: 100%;
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  background: #fff;
  touch-action: none;
}
</style>
