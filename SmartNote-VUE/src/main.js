import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
import router from './router'
import naive, { createDiscreteApi } from 'naive-ui'
import './style.css'

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
