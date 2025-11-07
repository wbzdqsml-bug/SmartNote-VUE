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
  padding: 22px 28px;
  background: #ffffff;
  border-radius: 24px;
  box-shadow: 0 10px 34px rgba(15, 23, 42, 0.08);
  margin-bottom: 18px;
}

.left h2 {
  margin: 0 0 6px;
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
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
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
}

.notification:last-child {
  border-bottom: none;
}

.notification h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
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
