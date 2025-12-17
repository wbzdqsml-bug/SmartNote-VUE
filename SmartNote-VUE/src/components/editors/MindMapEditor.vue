<template>
  <div class="mind-map-editor">
    <div class="editor-pane">
      <div class="toolbar">
        <n-button size="tiny" tertiary @click="addNode(null)">添加中心主题</n-button>
      </div>
      <div class="node-list-wrapper">
        <n-empty v-if="!nodes.length" description="点击上方按钮开始" />
        <ul v-else class="node-list">
          <mind-map-node
            v-for="node in nodes"
            :key="node.id"
            :node="node"
            @update="updateNode"
            @remove="removeNode"
            @append="addNode"
          />
        </ul>
      </div>
    </div>
    <div class="chart-pane" ref="chartRef"></div>
  </div>
</template>

<script setup>
import { defineComponent, h, ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { NButton, NInput, NEmpty, NIcon } from 'naive-ui'
import { AddOutline, TrashOutline } from '@vicons/ionicons5'
import * as echarts from 'echarts/core'
import { TreeChart } from 'echarts/charts'
import { TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([TreeChart, TooltipComponent, CanvasRenderer])

// --- PROPS & EMITS ---
const props = defineProps({
  modelValue: {
    type: String,
    default: '[]'
  }
})
const emit = defineEmits(['update:modelValue'])


// --- DATA & STATE ---
const chartRef = ref(null)
let chartInstance = null

const normalise = (value) => {
  if (!value) return []
  if (Array.isArray(value)) return value
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    return []
  }
}

const nodes = ref(normalise(props.modelValue))

// --- DATA -> ECHARTS ---
const convertToEchartData = (node) => ({
  name: node.title,
  children: node.children.map(convertToEchartData)
})

const renderChart = () => {
  if (!chartInstance || !nodes.value.length) {
    chartInstance?.clear()
    return
  }
  
  const data = nodes.value.map(convertToEchartData)
  
  const option = {
    tooltip: { trigger: 'item', triggerOn: 'mousemove' },
    series: [
      {
        type: 'tree',
        data: data,
        top: '5%', left: '15%', bottom: '5%', right: '25%',
        symbolSize: 10,
        edgeShape: 'polyline',
        expandAndCollapse: true,
        initialTreeDepth: -1,
        label: { position: 'left', verticalAlign: 'middle', align: 'right', fontSize: 14 },
        leaves: { label: { position: 'right', verticalAlign: 'middle', align: 'left' } },
        emphasis: { focus: 'descendant' }
      }
    ]
  }
  chartInstance.setOption(option, { notMerge: true }) // notMerge is important for data changes
}


// --- DOM-LIKE NODE MANIPULATION ---
const generateId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`

const findAndExecute = (targetId, list, action) => {
  for (let i = 0; i < list.length; i++) {
    const node = list[i]
    if (node.id === targetId) {
      action(node, list, i)
      return true
    }
    if (node.children && findAndExecute(targetId, node.children, action)) {
      return true
    }
  }
  return false
}

const addNode = (parentId) => {
  const newNode = { id: generateId(), title: '新节点', children: [] }
  if (!parentId) {
    nodes.value.push(newNode)
  } else {
    findAndExecute(parentId, nodes.value, (node) => {
      node.children.push(newNode)
    })
  }
}

const removeNode = (targetId) => {
  findAndExecute(targetId, nodes.value, (_, list, index) => {
    list.splice(index, 1)
  })
}

const updateNode = ({ id, title }) => {
  findAndExecute(id, nodes.value, (node) => {
    node.title = title
  })
}


// --- WATCHERS & LIFECYCLE ---
watch(() => props.modelValue, (value) => {
  nodes.value = normalise(value)
  renderChart()
})

watch(nodes, (value) => {
  emit('update:modelValue', JSON.stringify(value))
  renderChart()
}, { deep: true })

onMounted(() => {
  nextTick(() => {
    chartInstance = echarts.init(chartRef.value)
    renderChart()
    window.addEventListener('resize', chartInstance.resize)
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', chartInstance.resize)
  chartInstance?.dispose()
})


// --- RECURSIVE NODE COMPONENT ---
const MindMapNode = defineComponent({
  name: 'MindMapNode',
  props: { node: { type: Object, required: true } },
  emits: ['update', 'remove', 'append'],
  setup(nodeProps, { emit: emitNode }) {
    const localTitle = ref(nodeProps.node.title)
    watch(() => nodeProps.node.title, (value) => { localTitle.value = value })

    return () => h('li', { class: 'mind-map-node' }, [
      h('div', { class: 'node-card' }, [
        h(NInput, {
          value: localTitle.value,
          size: 'small',
          'onUpdate:value': (val) => localTitle.value = val,
          onBlur: () => emitNode('update', { id: nodeProps.node.id, title: localTitle.value })
        }),
        h('div', { class: 'node-actions' }, [
          h(NButton, { quaternary: true, size: 'tiny', onClick: () => emitNode('append', nodeProps.node.id) },
            { icon: () => h(NIcon, { component: AddOutline }) }),
          h(NButton, { quaternary: true, size: 'tiny', type: 'error', onClick: () => emitNode('remove', nodeProps.node.id) },
            { icon: () => h(NIcon, { component: TrashOutline }) })
        ])
      ]),
      nodeProps.node.children?.length
        ? h('ul', { class: 'child-list' }, nodeProps.node.children.map((child) =>
            h(MindMapNode, {
              key: child.id,
              node: child,
              onUpdate: (p) => emitNode('update', p),
              onRemove: (id) => emitNode('remove', id),
              onAppend: (id) => emitNode('append', id)
            })
          ))
        : null
    ])
  }
})
</script>

<style scoped>
.mind-map-editor {
  display: grid;
  grid-template-columns: 4fr 6fr;
  gap: 16px;
  height: 100%;
}

.editor-pane {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #f8fafc;
  border-radius: 8px;
  padding: 8px;
  height: 100%;
  overflow: hidden;
}

.toolbar {
  flex-shrink: 0;
}

.node-list-wrapper {
  flex: 1;
  overflow: auto;
  padding-right: 8px;
}

.node-list, .child-list {
  list-style: none;
  margin: 0;
  padding-left: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mind-map-node {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.node-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px;
  border-radius: 6px;
  background: #fff;
  border: 1px solid #e2e8f0;
}

.node-actions .n-button {
  width: 24px;
}

.child-list {
  margin-left: 24px;
  padding-left: 12px;
  border-left: 1px solid #e2e8f0;
}

.chart-pane {
  height: 100%;
  border-radius: 8px;
}
</style>
