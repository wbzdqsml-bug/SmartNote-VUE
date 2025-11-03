<template>
  <div class="settings-view">
    <el-card class="settings-view__card">
      <template #header>
        <div class="settings-view__header">
          <span>个性化设置</span>
        </div>
      </template>
      <el-form label-width="120px">
        <el-form-item label="主题模式">
          <el-switch
            v-model="isDark"
            inline-prompt
            active-text="暗色"
            inactive-text="亮色"
            @change="applyTheme"
          />
        </el-form-item>
        <el-form-item label="界面尺寸">
          <el-radio-group v-model="uiSize" @change="handleSizeChange">
            <el-radio-button label="default">默认</el-radio-button>
            <el-radio-button label="small">紧凑</el-radio-button>
            <el-radio-button label="large">宽松</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="后端地址">
          <el-input v-model="apiBase" readonly />
          <span class="settings-view__hint">可通过设置 VITE_API_BASE_URL 环境变量自定义</span>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { usePreferencesStore } from '../stores/preferences';

const preferences = usePreferencesStore();
const isDark = computed({
  get: () => preferences.isDark,
  set: (value) => preferences.setDark(value)
});
const uiSize = computed({
  get: () => preferences.uiSize,
  set: (value) => preferences.setSize(value)
});
const apiBase = ref(import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api');

const applyTheme = () => {
  preferences.applyTheme();
};

const handleSizeChange = () => {
  // Element Plus config provider reacts automatically through store binding
};
</script>

<style scoped lang="scss">
.settings-view {
  padding: 24px;
  display: flex;
  justify-content: center;

  &__card {
    width: 560px;
  }

  &__header {
    font-weight: 600;
  }

  &__hint {
    display: block;
    color: var(--el-text-color-secondary);
    margin-top: 4px;
  }
}
</style>
