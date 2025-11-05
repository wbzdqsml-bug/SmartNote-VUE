<template>
  <div class="mind-map-editor">
    <div class="toolbar">
      <span>思维导图</span>
      <n-button size="small" tertiary @click="addNode(null)">添加中心节点</n-button>
    </div>
    <div class="content">
      <n-empty v-if="!nodes.length" description="输入“中心主题”开始构建导图" />
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
</template>

<script setup>
import { defineComponent, h, ref, watch } from 'vue'
import { NButton, NInput, NEmpty, NIcon } from 'naive-ui'
import { AddOutline, TrashOutline } from '@vicons/ionicons5'

const props = defineProps({
  modelValue: {
    type: [String, Array],
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

const normalise = (value) => {
  if (!value) return []
  if (Array.isArray(value)) return value
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    console.warn('MindMapEditor parse failed:', err)
    return []
  }
}

const nodes = ref(normalise(props.modelValue))

watch(
  () => props.modelValue,
  (value) => {
    nodes.value = normalise(value)
  }
)

watch(
  nodes,
  (value) => {
    emit('update:modelValue', JSON.stringify(value))
  },
  { deep: true }
)

const generateId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`

const addNode = (parentId) => {
  const newNode = {
    id: generateId(),
    title: parentId ? '新子节点' : '中心主题',
    children: []
  }
  if (!parentId) {
    nodes.value.push(newNode)
    return
  }
  const stack = [...nodes.value]
  while (stack.length) {
    const current = stack.shift()
    if (current.id === parentId) {
      current.children.push(newNode)
      return
    }
    stack.push(...current.children)
  }
}

const removeNode = (targetId) => {
  const removeFrom = (list) => {
    const index = list.findIndex((item) => item.id === targetId)
    if (index !== -1) {
      list.splice(index, 1)
      return true
    }
    return list.some((item) => removeFrom(item.children))
  }
  removeFrom(nodes.value)
}

const updateNode = ({ id, title }) => {
  const stack = [...nodes.value]
  while (stack.length) {
    const current = stack.shift()
    if (current.id === id) {
      current.title = title
      return
    }
    stack.push(...current.children)
  }
}

const MindMapNode = defineComponent({
  name: 'MindMapNode',
  props: {
    node: {
      type: Object,
      required: true
    }
  },
  emits: ['update', 'remove', 'append'],
  setup(nodeProps, { emit: emitNode }) {
    const localTitle = ref(nodeProps.node.title)

    watch(
      () => nodeProps.node.title,
      (value) => {
        localTitle.value = value
      }
    )

    const submit = () => {
      emitNode('update', { id: nodeProps.node.id, title: localTitle.value })
    }

    return () =>
      h('li', { class: 'mind-map-node' }, [
        h('div', { class: 'node-card' }, [
          h(NInput, {
            value: localTitle.value,
            size: 'small',
            'onUpdate:value': (val) => {
              localTitle.value = val
            },
            onBlur: submit
          }),
          h('div', { class: 'node-actions' }, [
            h(
              NButton,
              {
                quaternary: true,
                size: 'tiny',
                onClick: () => emitNode('append', nodeProps.node.id)
              },
              {
                icon: () => h(NIcon, { component: AddOutline }),
                default: () => '添加子节点'
              }
            ),
            h(
              NButton,
              {
                quaternary: true,
                size: 'tiny',
                type: 'error',
                onClick: () => emitNode('remove', nodeProps.node.id)
              },
              {
                icon: () => h(NIcon, { component: TrashOutline }),
                default: () => '删除'
              }
            )
          ])
        ]),
        nodeProps.node.children?.length
          ? h(
              'ul',
              { class: 'child-list' },
              nodeProps.node.children.map((child) =>
                h(MindMapNode, {
                  key: child.id,
                  node: child,
                  onUpdate: (payload) => emitNode('update', payload),
                  onRemove: (id) => emitNode('remove', id),
                  onAppend: (id) => emitNode('append', id)
                })
              )
            )
          : null
      ])
  }
})
</script>

<style scoped>
.mind-map-editor {
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

.content {
  flex: 1;
  overflow: auto;
  background: rgba(248, 250, 252, 0.8);
  border-radius: 16px;
  padding: 12px 16px;
}

.node-list,
.child-list {
  list-style: none;
  margin: 0;
  padding-left: 0;
}

.mind-map-node {
  margin-bottom: 12px;
}

.node-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.08);
}

.node-actions {
  display: flex;
  gap: 8px;
}

.child-list {
  margin-left: 28px;
  margin-top: 8px;
  border-left: 2px dashed rgba(15, 23, 42, 0.08);
  padding-left: 16px;
}
</style>
