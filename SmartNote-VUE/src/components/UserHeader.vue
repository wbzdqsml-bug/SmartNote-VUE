<!--
  文件说明：通用业务组件（UserHeader）
  - 主要职责：承载可复用的业务 UI 与交互逻辑，供多个页面组合。
  - 关键交互：梳理组件输入（props/状态）与输出（事件/调用）以便维护。
  - 依赖关系：记录依赖的 API/状态仓库/子组件，便于追踪数据来源。
  - 维护提示：修改结构或样式时，注意与父子组件/路由联动影响。
-->
<template>
  <div class="header">
    <div class="left">
      <h2>{{ title }}</h2>
      <n-breadcrumb>
        <n-breadcrumb-item>SmartNote</n-breadcrumb-item>
        <n-breadcrumb-item>{{ subtitle }}</n-breadcrumb-item>
      </n-breadcrumb>
    </div>
    <div class="actions">
      <n-tooltip placement="bottom">
        <template #trigger>
          <n-button text circle @click="$emit('refresh')">
            <template #icon>
              <n-icon :component="RefreshOutline" />
            </template>
          </n-button>
        </template>
        刷新数据
      </n-tooltip>
      <n-popover trigger="click" placement="bottom-end">
        <template #trigger>
          <n-button quaternary round>
            <template #icon>
              <n-icon :component="NotificationsOutline" />
            </template>
            系统通知
          </n-button>
        </template>
        <div class="popover-list">
          <p v-if="!notifications.length" class="empty">暂无通知</p>
          <div v-for="item in notifications" :key="item.id" class="notification">
            <h4>{{ item.title }}</h4>
            <p>{{ item.desc }}</p>
          </div>
        </div>
      </n-popover>
    </div>
  </div>
</template>

<script setup>
import {
  NBreadcrumb,
  NBreadcrumbItem,
  NButton,
  NTooltip,
  NIcon,
  NPopover
} from 'naive-ui'
import { RefreshOutline, NotificationsOutline } from '@vicons/ionicons5'

const props = defineProps({
  title: {
    type: String,
    default: '知识空间'
  },
  subtitle: {
    type: String,
    default: '笔记管理'
  },
  notifications: {
    type: Array,
    default: () => []
  }
})
</script>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
}

.left h2 {
  margin: 0 0 6px;
  font-size: 20px;
  font-weight: 700;
  color: #111827;
}

.actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.popover-list {
  width: 220px;
}

.notification {
  padding: 8px 0;
  border-bottom: 1px solid #e5e7eb;
}

.notification:last-child {
  border-bottom: none;
}

.notification h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.notification p {
  margin: 4px 0 0;
  font-size: 12px;
  color: #6b7280;
}

.empty {
  margin: 0;
  font-size: 12px;
  color: #6b7280;
  text-align: center;
}
</style>
