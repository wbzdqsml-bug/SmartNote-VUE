<template>
  <n-card class="auth-card" size="huge" bordered>
    <div class="tabs-wrap">
      <n-tabs v-model:value="activeTab" type="segment" animated :bar-width="36">
        <n-tab name="login">登录</n-tab>
        <n-tab name="register">注册</n-tab>
      </n-tabs>
    </div>

    <transition name="slide-fade" mode="out-in">
      <div :key="activeTab">
        <h2 class="title">{{ activeTab === 'login' ? '欢迎回来' : '创建新账号' }}</h2>

        <n-form ref="formRef" :model="form" class="form">
          <n-form-item label="用户名">
            <n-input
              v-model:value="form.username"
              placeholder="请输入用户名"
              size="large"
              :bordered="false"
              clearable
              class="glass-input"
            />
          </n-form-item>

          <n-form-item label="密码">
            <n-input
              v-model:value="form.password"
              type="password"
              show-password-on="click"
              placeholder="请输入密码"
              size="large"
              :bordered="false"
              clearable
              class="glass-input"
            />
          </n-form-item>

          <n-form-item v-if="activeTab === 'register'" label="确认密码">
            <n-input
              v-model:value="form.confirm"
              type="password"
              show-password-on="click"
              placeholder="请再次输入密码"
              size="large"
              :bordered="false"
              clearable
              class="glass-input"
            />
          </n-form-item>

          <n-space vertical size="large" class="actions">
            <n-button
              type="primary"
              block
              strong
              size="large"
              class="grad-btn"
              :loading="submitting"
              @click="handleSubmit"
            >
              {{ activeTab === 'login' ? '登录' : '注册' }}
            </n-button>

            <n-button text class="tiny-switch" @click="toggleTab">
              {{ activeTab === 'login' ? '还没有账号？立即注册' : '已有账号？前往登录' }}
            </n-button>
          </n-space>
        </n-form>
      </div>
    </transition>
  </n-card>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { useMessage, NCard, NTabs, NTab, NForm, NFormItem, NInput, NButton, NSpace } from 'naive-ui'
import { useRouter, useRoute } from 'vue-router'
import userApi from '@/api/user'
import { useUserStore } from '@/store/userStore'

const props = defineProps({
  defaultTab: {
    type: String,
    default: 'login'
  }
})

const router = useRouter()
const route = useRoute()
const message = useMessage()
const userStore = useUserStore()

const formRef = ref(null)
const activeTab = ref(props.defaultTab)
const submitting = ref(false)

const form = ref({
  username: '',
  password: '',
  confirm: ''
})

const toggleTab = () => {
  activeTab.value = activeTab.value === 'login' ? 'register' : 'login'
}

const syncTabWithRoute = () => {
  if (route.name === 'register') {
    activeTab.value = 'register'
  } else if (route.name === 'login') {
    activeTab.value = 'login'
  }
}

watch(
  () => route.name,
  () => syncTabWithRoute(),
  { immediate: true }
)

onMounted(() => {
  activeTab.value = props.defaultTab
  syncTabWithRoute()
})

const mapLoginPayload = (rawPayload) => {
  if (!rawPayload || typeof rawPayload !== 'object') {
    return {}
  }
  const lowerCaseMap = {}
  Object.keys(rawPayload).forEach((key) => {
    lowerCaseMap[key.toLowerCase()] = rawPayload[key]
  })
  return lowerCaseMap
}

const resolveLoginPayload = (res) => {
  const raw = res?.data ?? {}
  const payload = typeof raw === 'object' && raw !== null && 'data' in raw ? raw.data ?? {} : raw
  const normalized = mapLoginPayload(payload)

  const token = normalized.token || normalized.accesstoken || ''
  const username = normalized.username || form.value.username
  const expiresInSeconds = Number(normalized.expiresinseconds ?? normalized.expiresin ?? 0)

  const user = payload.user || {
    id: normalized.userid ?? normalized.id ?? null,
    username,
    nickname: normalized.nickname || normalized.displayname || username,
    expiresInSeconds
  }

  return { token, user }
}

const handleSubmit = async () => {
  if (!form.value.username || !form.value.password) {
    message.warning('请输入用户名和密码')
    return
  }
  if (activeTab.value === 'register' && form.value.password !== form.value.confirm) {
    message.error('两次输入的密码不一致')
    return
  }

  submitting.value = true
  try {
    if (activeTab.value === 'login') {
      const res = await userApi.login({
        username: form.value.username,
        password: form.value.password
      })
      const { token, user } = resolveLoginPayload(res)
      if (token) {
        userStore.setToken(token)
      }
      if (user) {
        userStore.setProfile(user)
      }
      message.success('登录成功')
      await userStore.fetchProfile()
      router.push('/home')
    } else {
      await userApi.register({
        username: form.value.username,
        password: form.value.password
      })
      message.success('注册成功，请登录')
      activeTab.value = 'login'
      form.value.password = ''
      form.value.confirm = ''
    }
  } catch (error) {
    const apiMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      '操作失败，请稍后再试'
    message.error(apiMessage)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.auth-card {
  width: 460px;
  padding: 28px 28px 36px;
  border-radius: 22px;
  backdrop-filter: blur(18px);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.35),
    inset 0 1px 1px rgba(255, 255, 255, 0.08);
  color: #fff;
  text-align: center;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.auth-card:hover {
  transform: translateY(-2px);
  box-shadow:
    0 16px 48px rgba(0, 0, 0, 0.38),
    inset 0 1px 1px rgba(255, 255, 255, 0.1);
}

.tabs-wrap {
  margin-bottom: 12px;
}

:deep(.n-tabs .n-tabs-nav) {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  padding: 4px;
}

:deep(.n-tabs .n-tabs-bar) {
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #5f9eff, #9b6bff);
  box-shadow: 0 4px 16px rgba(95, 158, 255, 0.35);
}

:deep(.n-tabs .n-tabs-tab) {
  color: #e6ecff;
  font-weight: 600;
}

.title {
  color: #fff;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.5px;
  margin: 12px 0 18px;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
}

.form {
  text-align: left;
}

.glass-input {
  background: rgba(255, 255, 255, 0.18);
  border-radius: 12px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.28);
  transition: box-shadow 0.25s ease, background 0.25s ease, transform 0.1s ease;
  padding: 10px 14px;
}

.glass-input:hover {
  background: rgba(255, 255, 255, 0.22);
}

.glass-input:focus-within {
  box-shadow:
    inset 0 0 0 1px rgba(95, 158, 255, 0.55),
    0 0 0 6px rgba(95, 158, 255, 0.15);
}

:deep(.glass-input .n-input__input-el) {
  background: transparent !important;
  box-shadow: none !important;
}

:deep(.n-input .n-input__border),
:deep(.n-input .n-input__state-border) {
  display: none;
}

.grad-btn {
  background: linear-gradient(135deg, #5f9eff, #9b6bff);
  border: none;
  color: #fff;
  height: 44px;
  border-radius: 12px;
  letter-spacing: 0.4px;
  font-weight: 700;
  box-shadow: 0 8px 22px rgba(95, 158, 255, 0.35);
  transition: transform 0.15s ease, box-shadow 0.25s ease, filter 0.25s ease;
}

.grad-btn:hover {
  transform: translateY(-1px);
  filter: brightness(1.05);
  box-shadow: 0 10px 26px rgba(95, 158, 255, 0.5);
}

.tiny-switch {
  color: #c9d6ff;
  margin-top: 4px;
}

.tiny-switch:hover {
  color: #fff;
  text-decoration: underline;
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.38s ease;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(28px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-28px);
}
</style>
