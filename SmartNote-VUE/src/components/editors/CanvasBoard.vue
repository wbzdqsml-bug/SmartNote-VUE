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
const ctx = ref(null)
const drawing = ref(false)
const activePointerId = ref(null)
const lineWidth = ref(3)
const strokeStyle = ref('#2dd4bf')

let resizeObserver = null

const ensureContext = () => {
  const canvas = canvasRef.value
  if (!canvas) return null
  const context = canvas.getContext('2d')
  if (!context) return null
  context.lineCap = 'round'
  context.lineJoin = 'round'
  return context
}

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

const drawFromSource = (source) => {
  const canvas = canvasRef.value
  const context = ctx.value
  if (!canvas || !context) return
  if (!source) {
    const width = canvas.clientWidth || canvas.width
    const height = canvas.clientHeight || canvas.height
    context.clearRect(0, 0, width, height)
    return
  }
  const image = new Image()
  image.onload = () => {
    const width = canvas.clientWidth || canvas.width
    const height = canvas.clientHeight || canvas.height
    context.clearRect(0, 0, width, height)
    context.drawImage(image, 0, 0, width, height)
  }
  image.src = source
}

const resizeCanvas = (preserve = true) => {
  const canvas = canvasRef.value
  if (!canvas) return
  const { width, height } = getCanvasSize()
  const ratio = window.devicePixelRatio || 1
  const context = ensureContext()
  if (!context) return

  const shouldSnapshot = preserve && (drawing.value || !props.modelValue)
  let snapshot = null
  if (shouldSnapshot) {
    try {
      snapshot = canvas.toDataURL('image/png')
    } catch (error) {
      snapshot = null
    }
  }

  canvas.width = Math.floor(width * ratio)
  canvas.height = Math.floor(height * ratio)
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`

  context.setTransform(1, 0, 0, 1, 0, 0)
  context.scale(ratio, ratio)

  ctx.value = context

  if (props.modelValue && !drawing.value) {
    drawFromSource(props.modelValue)
  } else if (snapshot) {
    drawFromSource(snapshot)
  } else {
    context.clearRect(0, 0, width, height)
  }
}

const getPosition = (event) => {
  const canvas = canvasRef.value
  if (!canvas) return { x: 0, y: 0 }
  const rect = canvas.getBoundingClientRect()
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  }
}

const beginStroke = (event) => {
  if (!ctx.value) return
  drawing.value = true
  activePointerId.value = event.pointerId ?? null
  try {
    canvasRef.value?.setPointerCapture?.(event.pointerId)
  } catch (error) {
    // ignore capture errors
  }
  ctx.value.beginPath()
  const { x, y } = getPosition(event)
  ctx.value.moveTo(x, y)
  event.preventDefault()
}

const drawStroke = (event) => {
  if (!drawing.value || !ctx.value) return
  if (
    activePointerId.value !== null &&
    event.pointerId !== undefined &&
    event.pointerId !== activePointerId.value
  ) {
    return
  }
  const { x, y } = getPosition(event)
  ctx.value.strokeStyle = strokeStyle.value
  ctx.value.lineWidth = lineWidth.value
  ctx.value.lineCap = 'round'
  ctx.value.lineJoin = 'round'
  ctx.value.lineTo(x, y)
  ctx.value.stroke()
  event.preventDefault()
}

const releasePointer = () => {
  if (canvasRef.value && activePointerId.value !== null) {
    try {
      canvasRef.value.releasePointerCapture(activePointerId.value)
    } catch (error) {
      // ignore release errors
    }
  }
  activePointerId.value = null
}

const finishStroke = (shouldEmit, event) => {
  if (!drawing.value || !ctx.value) return
  if (
    activePointerId.value !== null &&
    event?.pointerId !== undefined &&
    event.pointerId !== activePointerId.value
  ) {
    return
  }
  drawing.value = false
  ctx.value.closePath()
  releasePointer()
  if (shouldEmit && canvasRef.value) {
    const dataUrl = canvasRef.value.toDataURL('image/png')
    emit('update:modelValue', dataUrl)
  }
}

const endStroke = (event) => {
  finishStroke(true, event)
}

const cancelStroke = (event) => {
  finishStroke(true, event)
}

const handleClear = () => {
  const canvas = canvasRef.value
  if (!ctx.value || !canvas) return
  const width = canvas.clientWidth || canvas.width
  const height = canvas.clientHeight || canvas.height
  ctx.value.clearRect(0, 0, width, height)
  emit('update:modelValue', '')
}

const handleWindowResize = () => {
  resizeCanvas()
}

onMounted(() => {
  resizeCanvas(false)
  window.addEventListener('resize', handleWindowResize)

  const canvas = canvasRef.value
  if (canvas) {
    canvas.addEventListener('pointerdown', beginStroke)
    canvas.addEventListener('pointermove', drawStroke)
    canvas.addEventListener('pointerup', endStroke)
    canvas.addEventListener('pointerleave', endStroke)
    canvas.addEventListener('pointercancel', cancelStroke)
    canvas.addEventListener('contextmenu', (event) => event.preventDefault())
  }

  resizeObserver = new ResizeObserver(() => resizeCanvas())
  if (wrapperRef.value) {
    resizeObserver.observe(wrapperRef.value)
  }

  if (props.modelValue) {
    drawFromSource(props.modelValue)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleWindowResize)
  const canvas = canvasRef.value
  if (canvas) {
    canvas.removeEventListener('pointerdown', beginStroke)
    canvas.removeEventListener('pointermove', drawStroke)
    canvas.removeEventListener('pointerup', endStroke)
    canvas.removeEventListener('pointerleave', endStroke)
    canvas.removeEventListener('pointercancel', cancelStroke)
  }
  resizeObserver?.disconnect()
  resizeObserver = null
})

watch(
  () => props.modelValue,
  (value) => {
    if (drawing.value) return
    drawFromSource(value)
  }
)
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
