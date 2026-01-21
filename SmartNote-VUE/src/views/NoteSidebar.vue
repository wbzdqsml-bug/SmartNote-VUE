<!--
  文件说明：页面视图（NoteSidebar）
  - 主要职责：负责页面级业务布局、数据加载与子组件编排。
  - 关键交互：梳理组件输入（props/状态）与输出（事件/调用）以便维护。
  - 依赖关系：记录依赖的 API/状态仓库/子组件，便于追踪数据来源。
  - 维护提示：修改结构或样式时，注意与父子组件/路由联动影响。
-->
<template>
  <div class="note-sidebar" v-bind="$attrs">
    <div v-if="note">
      <div class="sidebar-section">
        <h3 class="section-title">AI 操作</h3>
        <a-i-actions-panel :note-id="note.id" />
      </div>

      <div class="sidebar-section">
        <h3 class="section-title">分类</h3>
        <div class="control-content">
            <n-tag
              v-if="categoryDisplay"
              size="small"
              round
              closable
              :bordered="false"
              @close="updateCategory(null)"
            >
              <span
                class="category-dot"
                :style="{ backgroundColor: categoryDisplay.color || '#64748b' }"
              ></span>
              {{ categoryDisplay.label }}
            </n-tag>
            <span v-else class="placeholder">未选择</span>
            <n-button
              v-if="!categoryDisplay"
              quaternary
              size="tiny"
              type="primary"
              @click="toggleCategoryPicker"
            >
              + 添加
            </n-button>
            <n-select
              v-if="showCategoryPicker && !categoryDisplay"
              size="small"
              v-model:value="localNote.categoryId"
              :options="categoryOptions"
              placeholder="选择分类"
              style="width: 200px"
              clearable
              @update:value="handleSelectCategory"
              @blur="showCategoryPicker = false"
            />
            <div v-if="showCategoryPicker && !categoryDisplay" class="inline-create">
              <n-color-picker v-model:value="newCategoryColor" size="small" :modes="['hex']" />
              <n-input
                size="small"
                v-model:value="newCategoryName"
                placeholder="新建分类名称"
                style="width: 200px"
              />
              <n-button size="tiny" type="primary" :loading="creatingCategory" @click="handleCreateCategory">
                新建分类
              </n-button>
            </div>
          </div>
      </div>

      <div class="sidebar-section">
        <h3 class="section-title">标签</h3>
        <div class="control-content tags-content">
            <div class="tag-chip-row" v-if="tagDetails.length">
              <n-tag
                v-for="tag in tagDetails"
                :key="tag.id"
                size="small"
                round
                closable
                :bordered="false"
                @close="removeTag(tag.id)"
              >
                {{ tag.name }}
              </n-tag>
            </div>
            <n-select
              v-if="showTagPicker"
              size="small"
              v-model:value="tagPickerValue"
              multiple
              filterable
              :options="tagOptions"
              placeholder="添加标签"
              style="width: 260px"
              clearable
              @update:value="handleSelectTags"
              @blur="showTagPicker = false"
            />
            <div v-if="showTagPicker" class="inline-create">
              <n-color-picker v-model:value="newTagColor" size="small" :modes="['hex']" />
              <n-input
                size="small"
                v-model:value="newTagName"
                placeholder="新建标签名称"
                style="width: 200px"
              />
              <n-button size="tiny" type="primary" :loading="creatingTag" @click="handleCreateTag">
                新建标签
              </n-button>
            </div>
            <n-button
              quaternary
              size="tiny"
              type="primary"
              @click="toggleTagPicker"
            >
              + 添加
            </n-button>
            <span v-if="!tagDetails.length" class="placeholder">未选择</span>
          </div>
      </div>

      <div class="sidebar-section">
        <h3 class="section-title">信息</h3>
        <div class="meta-grid">
          <div class="meta-label">创建时间</div>
          <div class="meta-value">{{ formatTime(note.createdAt || note.createTime) }}</div>

          <div class="meta-label">最近更新</div>
          <div class="meta-value">{{ formatTime(note.updateTime || note.lastUpdateTime) }}</div>
        </div>
      </div>
      
      <div class="sidebar-section footer">
        <n-button tertiary type="error" @click="emit('soft-delete', note.id)">移入回收站</n-button>
      </div>
    </div>
    <div v-else class="empty-state">
      <n-empty size="large" description="未选择笔记" />
    </div>
  </div>
</template>

<script setup>
// Logic will be moved here in the next step
</script>

<style scoped>
.note-sidebar {
  height: 100%;
  background: #fff;
  border: 1px solid #eef2f8;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 12px;
}

.control-content {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.control-content.tags-content {
  align-items: flex-start;
}

.tag-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.category-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 6px;
}

.placeholder {
  color: #9ca3af;
  font-size: 12px;
}

.inline-create {
  display: flex;
  align-items: center;
  gap: 8px;
}

.meta-grid {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px 12px;
  font-size: 13px;
}

.meta-label {
  color: #64748b;
  text-align: right;
}

.meta-value {
  color: #334155;
  font-weight: 500;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #9ca3af;
}

.footer {
  margin-top: auto;
  display: flex;
}

.footer .n-button {
  width: 100%;
}
</style>
