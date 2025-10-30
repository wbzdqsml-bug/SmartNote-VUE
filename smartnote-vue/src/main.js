// src/main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia' // 1. 引入 Pinia

import App from './App.vue'
import router from './router'

// 2. 引入 Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css' // Element Plus 的 CSS
// 3. (可选) 引入 Element Plus 图标
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// 4. (为未来笔记功能准备) 引入 v-md-editor
import VMdEditor from '@kangc/v-md-editor/lib/base-editor';
import '@kangc/v-md-editor/lib/style/base-editor.css';
// (我们选择 github 主题)
import githubTheme from '@kangc/v-md-editor/lib/theme/github.js';
import '@kangc/v-md-editor/lib/theme/style/github.css';
VMdEditor.use(githubTheme);


const app = createApp(App)

// 5. 全局注册 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(createPinia()) // 6. 启用 Pinia
app.use(router)
app.use(ElementPlus) // 7. 启用 Element Plus
app.use(VMdEditor); // 8. (为未来笔记功能准备) 启用 v-md-editor

app.mount('#app')
