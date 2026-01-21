/**
 * 文件说明：应用入口（main）
 * - 主要职责：负责创建应用实例、注册插件/路由/状态管理并挂载到页面。
 * - 关键接口：标注导出的函数/对象及其入参、返回值与使用场景。
 * - 依赖关系：说明依赖的外部库/配置项，便于排查问题。
 * - 维护提示：新增或调整逻辑时，保持命名一致并补充相应注释。
 */
import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
import router from './router'
import naive, { createDiscreteApi } from 'naive-ui'
import './style.css'
import 'katex/dist/katex.min.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(naive)

const { message, dialog, notification, loadingBar } = createDiscreteApi([
  'message',
  'dialog',
  'notification',
  'loadingBar'
])

window.$message = message
window.$dialog = dialog
window.$notification = notification
window.$loadingBar = loadingBar

app.mount('#app')
