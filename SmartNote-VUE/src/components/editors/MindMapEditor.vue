<template>
  <div class="mind-map-editor">
    <div class="editor-pane">
      <div class="toolbar" v-if="!readOnly && !previewMindmapContent">
        <n-button size="tiny" tertiary @click="addNode(null)">添加中心主题</n-button>
      </div>
      <div class="node-list-wrapper">
        <n-empty v-if="!localNodes.length && !readOnly && !previewMindmapContent" description="点击上方按钮开始" />
        <ul v-else-if="!previewMindmapContent" class="node-list">
          <mind-map-node
            v-for="node in localNodes"
            :key="node.id"
            :node="node"
            :read-only="readOnly"
            @update="updateNode"
            @remove="removeNode"
            @append="addNode"
          />
        </ul>
        <n-empty v-else description="AI 预览模式（只读）" />
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
  },
  readOnly: {
    type: Boolean,
    default: false
  },
  previewMindmapContent: { // New prop
    type: Object, // Expecting { nodes: [], edges: [] }
    default: null
  }
})
const emit = defineEmits(['update:modelValue'])


// --- DATA & STATE ---
const chartRef = ref(null)
let chartInstance = null

const transformAIdataToEditorNodes = (aiData) => {
    if (!aiData || !aiData.nodes || !aiData.edges) return [];

    const { nodes: aiNodes, edges: aiEdges } = aiData;
    const editorNodesMap = new Map(); // id -> { id, title, children: [] }

    // Initialize editor nodes from AI nodes
    aiNodes.forEach(aiNode => {
        editorNodesMap.set(aiNode.id, {
            id: aiNode.id,
            title: aiNode.data?.label || 'Unnamed Node',
            children: []
        });
    });

    // Build children relationships based on AI edges
    aiEdges.forEach(aiEdge => {
        const sourceNode = editorNodesMap.get(aiEdge.source);
        const targetNode = editorNodesMap.get(aiEdge.target);
        if (sourceNode && targetNode) {
            sourceNode.children.push(targetNode);
        }
    });

    // Identify root nodes (nodes that are not targets of any edge)
    const targetIds = new Set(aiEdges.map(edge => edge.target));
    const rootNodes = aiNodes
        .filter(aiNode => !targetIds.has(aiNode.id))
        .map(aiNode => editorNodesMap.get(aiNode.id));

    // Fallback: if no explicit roots, or all nodes are part of a cycle, return all nodes
    // Or if the AI provides a non-tree-like graph, we try to make sense of it.
    // For simplicity, if rootNodes is empty, we'll just return all nodes that are not children of another node
    if (rootNodes.length === 0 && aiNodes.length > 0) {
        const allNodesInMap = Array.from(editorNodesMap.values());
        const childrenNodes = new Set();
        allNodesInMap.forEach(node => {
            node.children.forEach(child => childrenNodes.add(child.id));
        });
        return allNodesInMap.filter(node => !childrenNodes.has(node.id));
    }

    return rootNodes;
};

const normalise = (value) => {
  if (!value) return []
  if (Array.isArray(value)) return value

  // Support mindmap content saved as AI graph: { nodes: [], edges: [] }
  if (value && typeof value === 'object' && Array.isArray(value.nodes) && Array.isArray(value.edges)) {
    return transformAIdataToEditorNodes(value)
  }

  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) return parsed
    if (
      parsed &&
      typeof parsed === 'object' &&
      Array.isArray(parsed.nodes) &&
      Array.isArray(parsed.edges)
    ) {
      return transformAIdataToEditorNodes(parsed)
    }
    return []
  } catch (err) {
    return []
  }
}

const localNodes = ref(normalise(props.modelValue))
const displayContentNodes = ref([]) // The actual nodes to be displayed and rendered in ECharts

// --- DATA -> ECHARTS ---
const convertToEchartData = (node) => ({
  name: node.title,
  children: node.children.map(convertToEchartData)
})

const renderChart = () => {
  if (!chartInstance || (!displayContentNodes.value.length && props.readOnly)) {
    chartInstance?.clear()
    return
  }
  
  const data = displayContentNodes.value.map(convertToEchartData)
  
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
  // Only allow adding nodes if not in preview mode
  if (props.readOnly || props.previewMindmapContent) return;
  const newNode = { id: generateId(), title: '新节点', children: [] }
  if (!parentId) {
    localNodes.value.push(newNode)
  } else {
    findAndExecute(parentId, localNodes.value, (node) => {
      node.children.push(newNode)
    })
  }
}

const removeNode = (targetId) => {
  // Only allow removing nodes if not in preview mode
  if (props.readOnly || props.previewMindmapContent) return;
  findAndExecute(targetId, localNodes.value, (_, list, index) => {
    list.splice(index, 1)
  })
}

const updateNode = ({ id, title }) => {
  // Only allow updating nodes if not in preview mode
  if (props.readOnly || props.previewMindmapContent) return;
  findAndExecute(id, localNodes.value, (node) => {
    node.title = title
  })
}


// --- WATCHERS & LIFECYCLE ---
watch(() => props.modelValue, (value) => {
  // Update localNodes when modelValue changes from outside
  if (!props.previewMindmapContent) {
    localNodes.value = normalise(value)
  }
}, { immediate: true })

watch(localNodes, (value) => {
  // Emit update:modelValue when localNodes changes, but only if not in preview mode
  if (!props.readOnly && !props.previewMindmapContent) {
    emit('update:modelValue', JSON.stringify(value))
  }
}, { deep: true })

watch(() => props.previewMindmapContent, (newContent) => {
  if (newContent) {
    displayContentNodes.value = transformAIdataToEditorNodes(newContent)
  } else {
    // If preview ends, revert to localNodes
    displayContentNodes.value = localNodes.value
  }
  renderChart()
}, { deep: true, immediate: true })

// This watch ensures that ECharts always re-renders when displayContentNodes changes,
// whether from modelValue, localNodes, or previewMindmapContent
watch(displayContentNodes, () => {
  renderChart()
}, { deep: true, immediate: true })

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
  props: {
    node: { type: Object, required: true },
    readOnly: { type: Boolean, default: false }
  },
  emits: ['update', 'remove', 'append'],
  setup(nodeProps, { emit: emitNode }) {
    const localTitle = ref(nodeProps.node.title)
    watch(() => nodeProps.node.title, (value) => { localTitle.value = value })

    return () => h('li', { class: 'mind-map-node' }, [
      h('div', { class: 'node-card' }, [
        h(NInput, {
          value: localTitle.value,
          size: 'small',
          'onUpdate:value': (val) => {
            if (!nodeProps.readOnly) localTitle.value = val;
          },
          onBlur: () => {
            if (!nodeProps.readOnly) emitNode('update', { id: nodeProps.node.id, title: localTitle.value });
          },
          readonly: nodeProps.readOnly // Make input read-only
        }),
        nodeProps.readOnly ? null : // Hide actions if readOnly
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
              readOnly: nodeProps.readOnly, // Pass readOnly prop to children
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
  grid-template-rows: 100%;
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
  min-height: 0;
  border-radius: 8px;
  overflow: auto;
}
</style>
