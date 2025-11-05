<template>
  <n-card class="graph-panel" :bordered="false">
    <template #header>
      <h3>知识图谱</h3>
    </template>
    <div class="graph-placeholder">
      <n-spin :show="loading">
        <svg viewBox="0 0 200 200">
          <circle v-for="node in nodes" :key="node.id" :cx="node.x" :cy="node.y" r="10" class="node" />
          <line
            v-for="edge in edges"
            :key="edge.id"
            :x1="edge.from.x"
            :y1="edge.from.y"
            :x2="edge.to.x"
            :y2="edge.to.y"
            class="edge"
          />
        </svg>
      </n-spin>
      <p>根据标签和引用自动生成的概览</p>
    </div>
  </n-card>
</template>

<script setup>
import { computed } from 'vue'
import { NCard, NSpin } from 'naive-ui'

const props = defineProps({
  notes: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const nodes = computed(() => {
  const count = Math.min(props.notes.length || 6, 9)
  const angleStep = (Math.PI * 2) / count
  return Array.from({ length: count }).map((_, index) => ({
    id: index,
    x: 100 + 70 * Math.cos(angleStep * index),
    y: 100 + 70 * Math.sin(angleStep * index)
  }))
})

const edges = computed(() => {
  if (nodes.value.length < 2) return []
  const list = []
  for (let i = 0; i < nodes.value.length; i += 1) {
    const from = nodes.value[i]
    const to = nodes.value[(i + 2) % nodes.value.length]
    list.push({ id: `${from.id}-${to.id}`, from, to })
  }
  return list
})
</script>

<style scoped>
.graph-panel {
  border-radius: 22px;
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.08);
}

.graph-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

svg {
  width: 100%;
  max-width: 240px;
  height: 200px;
}

.node {
  fill: rgba(60, 186, 255, 0.8);
  stroke: rgba(60, 186, 255, 0.2);
  stroke-width: 6;
}

.edge {
  stroke: rgba(60, 186, 255, 0.25);
  stroke-width: 2;
}

p {
  margin: 0;
  font-size: 13px;
  color: #6b7280;
}
</style>
